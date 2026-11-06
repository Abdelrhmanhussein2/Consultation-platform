#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/evaluate_ragas.py
-------------------------
نظام تقييم محرك البحث والاسترجاع القانوني (RAG Evaluation) باستخدام مكتبة Ragas.

يقوم هذا السكريبت بـ:
1. استقبال الاستفسار القانوني (سؤال فردي أو حزمة Benchmark).
2. استرجاع الـ Chunks الحقيقية من Neo4j Graph RAG / Qdrant عبر HybridSearchService.
3. تفكيك السياق إلى وحدات Chunks مستقلة (نصوص المواد، التعديلات، السوابق القضائية).
4. توليد الإجابة الحقيقية عبر LLMService بالاعتماد على البرومبت القانوني المعتمد للمنصة.
5. تمرير (الـ Question، والـ Retrieved Chunks، والـ Generated Answer) إلى Ragas لحساب:
   - Faithfulness (الأمانة العلمية وعدم الهلوسة).
   - Answer Relevancy (ملاءمة الإجابة للسؤال).
6. حفظ التقرير النهائي بصيغتي JSON و Markdown.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import List, Dict, Any, Tuple

# إضافة مسار المشروع للمسارات العامة
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from helpers.config import settings
from services.ai.hybrid_search_service import HybridSearchService
from services.ai.llm_service import LLMService
from services.ai.prompts import build_system_instruction_for_mode

# استيراد Ragas و LangChain
from ragas import evaluate, EvaluationDataset, SingleTurnSample
from ragas.metrics import Faithfulness, AnswerRelevancy
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


# مجموعة أسئلة قياسية معتمدة للاختبار الشامل (Benchmark Dataset)
GOLDEN_BENCHMARK = [
    {
        "id": "tax_rates_art11",
        "question": "ما هي نسب وشرائح ضريبة الدخل المفروضة على الأفراد وفق المادة 11 من القانون، وما هي نسبة ضريبة الدخل المفروضة على البنوك؟",
        "category": "شرائح ونسب ضريبية"
    },
    {
        "id": "withholding_rent_art12",
        "question": "هل يلتزم المستأجر باقتطاع ضريبة دخل من بدل إيجار العقار المدفوع لمالك غير مقيم وفق أحكام المادة 12، وما هي النسبة المقررة؟",
        "category": "اقتطاع من المصدر"
    },
    {
        "id": "evasion_penalties_art66",
        "question": "ما هي عقوبات التهرب الضريبي المقررة وفق أحكام قانون ضريبة الدخل الأردني؟",
        "category": "عقوبات وجزاءات"
    },
    {
        "id": "professional_fees_withholding",
        "question": "هل تلتزم الشركات باقتطاع ضريبة دخل بنسبة 5% عند دفع أتعاب للمحامين والمهندسين والأطباء المقيمين في الأردن؟",
        "category": "أتعاب مهنية واقتطاعات"
    },
    {
        "id": "end_of_service_exemption",
        "question": "ما هو الإعفاء الضريبي المقرر لمكافأة نهاية الخدمة وبدل الإجازات وفق قانون ضريبة الدخل؟",
        "category": "إعفاءات الدخل"
    }
]


def split_context_into_chunks(context_text: str, citations: List[Dict[str, Any]]) -> List[str]:
    """
    تفكيك النص الكامل المسترجع إلى Chunks منفصلة ودقيقة تمثل:
    - كل مادة قانونية مع فقراتها.
    - كل تعديل لاحق كـ Chunk مستقل.
    - كل سابقة أو حكم قضائي كـ Chunk مستقل.
    """
    if not context_text or not context_text.strip():
        return []

    chunks = []
    
    # 1. التقسيم حسب الأقسام الرئيسية في النص المسترجع
    sections = context_text.split("\n- **")
    for sec in sections:
        cleaned = sec.strip()
        if not cleaned:
            continue
        # إعادة إضافة البادئة إن كانت قد حذفت بالتقسيم
        if not cleaned.startswith("- **") and not cleaned.startswith("###"):
            cleaned = "- **" + cleaned
            
        # إذا كان القسم طويلاً جداً ويحتوي على أحكام وسوابق مدمجة، نفصلها
        if "⚖️ **أحكام قضائية" in cleaned:
            parts = cleaned.split("⚖️ **أحكام قضائية")
            if parts[0].strip():
                chunks.append(parts[0].strip())
            if len(parts) > 1 and parts[1].strip():
                chunks.append("⚖️ أحكام قضائية: " + parts[1].strip())
        elif "⚠️ **التعديلات اللاحقة" in cleaned:
            parts = cleaned.split("⚠️ **التعديلات اللاحقة")
            if parts[0].strip():
                chunks.append(parts[0].strip())
            if len(parts) > 1 and parts[1].strip():
                chunks.append("⚠️ التعديلات: " + parts[1].strip())
        else:
            chunks.append(cleaned)

    # إذا كان النص المسترجع كتلة واحدة بدون علامات تقسيم، نقسمه حسب الفقرات المزدوجة
    if len(chunks) <= 1:
        raw_paras = [p.strip() for p in context_text.split("\n\n") if len(p.strip()) > 30]
        if raw_paras:
            chunks = raw_paras

    return chunks


def run_rag_pipeline(question: str) -> Tuple[List[str], str, List[Dict[str, Any]]]:
    """
    تشغيل خط الإنتاج الحقيقي للمنصة:
    1. استرجاع السياق القانوني والـ Chunks عبر HybridSearchService (Neo4j Graph + Qdrant).
    2. توليد الإجابة عبر LLMService باستخدام البرومبت القانوني المعتمد.
    """
    print(f"\n[1/3] جاري استرجاع السياق القانوني (Retrieval) للسؤال: '{question}'...")
    raw_context, citations = HybridSearchService.search(question)
    
    chunks = split_context_into_chunks(raw_context, citations)
    print(f"      تم استرجاع {len(chunks)} Chunks قانونية من Neo4j/Qdrant و {len(citations)} استشهاد.")

    print("[2/3] جاري توليد الإجابة الاستشارية عبر الـ LLM...")
    system_prompt = build_system_instruction_for_mode(mode="consultation", db=None)
    
    if raw_context:
        user_prompt = f"{question}\n\n{raw_context}"
    else:
        user_prompt = question

    llm_res = LLMService.generate_response(user_prompt, system_instruction=system_prompt)
    answer = llm_res.get("content", "").strip()

    # تنظيف أي ألفاظ تقنية غير مقصودة
    import re
    for pat in [r"نظراً لعدم وجود نصوص في البيانات المسترجعة.*?(?:،|\.|\n|$)", r"في البيانات المسترجعة من Neo4j", r"Neo4j", r"Qdrant"]:
        answer = re.sub(pat, "", answer, flags=re.IGNORECASE)
    answer = re.sub(r"\n{3,}", "\n\n", answer).strip()
    
    return chunks, answer, citations


def evaluate_with_ragas(samples_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    تقييم قائمة العينات باستخدام Ragas لحساب:
    - Faithfulness (الأمانة العلمية بالنسبة للـ Chunks).
    - Answer Relevancy (ملاءمة الإجابة للسؤال).
    """
    print("\n[3/3] جاري تشغيل تقييم Ragas على الـ Chunks والإجابات المولدة...")

    samples = []
    for item in samples_data:
        # إذا لم يتم استرجاع أي chunk نضع تنبيهاً لكي يستطيع Ragas التقييم
        retrieved_contexts = item["chunks"] if item["chunks"] else ["لا تتوفر نصوص قانونية مسترجعة في السياق."]
        
        sample = SingleTurnSample(
            user_input=item["question"],
            retrieved_contexts=retrieved_contexts,
            response=item["answer"]
        )
        samples.append(sample)

    eval_dataset = EvaluationDataset(samples=samples)

    evaluator_llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0.0
    )
    evaluator_embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=settings.OPENAI_API_KEY
    )

    metrics_to_run = [Faithfulness(), AnswerRelevancy()]

    results = evaluate(
        dataset=eval_dataset,
        metrics=metrics_to_run,
        llm=evaluator_llm,
        embeddings=evaluator_embeddings
    )

    return results


def print_colored_summary(evaluated_items: List[Dict[str, Any]], overall_scores: Dict[str, float]):
    """طباعة ملخص منظم وجذاب في الطرفية."""
    print("\n" + "=" * 80)
    print(" 📊 نتائج تقييم RAGAS لمنظومة الذكاء الاصطناعي (Chunks & Answer Evaluation)")
    print("=" * 80)

    for idx, item in enumerate(evaluated_items, 1):
        print(f"\n🔹 الحالة رقم {idx}: {item['question']}")
        print(f"   عدد الـ Chunks المسترجعة: {len(item['chunks'])}")
        print(f"   معاينة الـ Chunks:")
        for c_idx, ch in enumerate(item['chunks'][:2], 1):
            snippet = ch.replace("\n", " ")[:140]
            print(f"      - Chunk #{c_idx}: {snippet}...")
        
        print(f"   معاينة الإجابة المولدة: {item['answer'][:160].replace('\n', ' ')}...")
        
        if "scores" in item:
            f_score = item['scores'].get('faithfulness', 0.0)
            r_score = item['scores'].get('answer_relevancy', 0.0)
            print(f"   🎯 النتائج الفردية:")
            print(f"      - Faithfulness (الأمانة العلمية وعدم الهلوسة): {f_score:.2%}")
            print(f"      - Answer Relevancy (ملاءمة الإجابة للسؤال):     {r_score:.2%}")

    print("\n" + "-" * 80)
    print(" 🏆 الدرجات الإجمالية لمنظومة الـ RAG (Overall Scores):")
    print("-" * 80)
    for k, v in overall_scores.items():
        bar_len = int(v * 30)
        bar = "█" * bar_len + "░" * (30 - bar_len)
        print(f"  • {k:<18}: {v:.4f}  [{bar}] ({v:.1%})")
    print("=" * 80 + "\n")


def save_reports(evaluated_items: List[Dict[str, Any]], overall_scores: Dict[str, Any]):
    """حفظ النتائج في ملف JSON وملف Markdown."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_json_path = os.path.join(PROJECT_ROOT, f"ragas_report_{timestamp}.json")
    report_md_path = os.path.join(PROJECT_ROOT, "ragas_evaluation_report.md")

    report_payload = {
        "timestamp": datetime.now().isoformat(),
        "overall_scores": overall_scores,
        "evaluations": evaluated_items
    }

    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_payload, f, ensure_ascii=False, indent=2)

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("# تقرير تقييم منظومة RAG بواسطة Ragas\n\n")
        f.write(f"- **تاريخ التقييم:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 1. الدرجات الإجمالية (Overall Metrics)\n\n")
        f.write("| المعيار (Metric) | النتيجة | الوصف |\n")
        f.write("| :--- | :---: | :--- |\n")
        for k, v in overall_scores.items():
            f.write(f"| **{k}** | `{v:.4f}` ({v:.1%}) | {'الأمانة العلمية والاستناد على النصوص دون هلوسة' if k == 'faithfulness' else 'ملاءمة الإجابة المولدة للسؤال المطلوب'} |\n")
        f.write("\n## 2. تفاصيل الحالات والـ Chunks المسترجعة\n\n")
        for idx, item in enumerate(evaluated_items, 1):
            f.write(f"### الحالة {idx}: {item['question']}\n\n")
            f.write(f"**عدد الـ Chunks المسترجعة:** {len(item['chunks'])}\n\n")
            f.write("<details><summary><b>عرض الـ Chunks المسترجعة من Neo4j/Qdrant</b></summary>\n\n")
            for c_idx, ch in enumerate(item['chunks'], 1):
                f.write(f"**Chunk #{c_idx}:**\n```text\n{ch}\n```\n\n")
            f.write("</details>\n\n")
            f.write(f"**الإجابة المولدة:**\n\n{item['answer']}\n\n")
            if "scores" in item:
                f.write("**نتائج التقييم:**\n")
                for sk, sv in item["scores"].items():
                    f.write(f"- `{sk}`: **{sv:.2%}**\n")
            f.write("\n---\n\n")

    print(f"✅ تم حفظ التقرير المفصل بصيغة JSON: {os.path.basename(report_json_path)}")
    print(f"✅ تم حفظ التقرير المقروء بصيغة Markdown: {os.path.basename(report_md_path)}")


def main():
    parser = argparse.ArgumentParser(description="تقييم منظومة RAG باستخدام مكتبة Ragas على الـ Chunks والإجابات المولدة")
    parser.add_argument("--query", "-q", type=str, help="سؤال مخصص لاختباره بمفرده")
    parser.add_argument("--benchmark", "-b", action="store_true", help="تشغيل الاختبار على حزمة الأسئلة القياسية الخمسة")
    args = parser.parse_args()

    questions = []
    if args.query:
        questions.append({"id": "custom", "question": args.query, "category": "سؤال مخصص"})
    elif args.benchmark:
        questions = GOLDEN_BENCHMARK
    else:
        # افتراضياً: اختبار سؤالين ممثلين
        questions = GOLDEN_BENCHMARK[:2]

    print("🚀 بدء تشغيل تقييم Ragas على منظومة RAG...")
    print(f"عدد الأسئلة المراد تقييمها: {len(questions)}")

    evaluated_items = []
    for q_item in questions:
        q_text = q_item["question"]
        chunks, answer, citations = run_rag_pipeline(q_text)
        evaluated_items.append({
            "id": q_item.get("id"),
            "category": q_item.get("category"),
            "question": q_text,
            "chunks": chunks,
            "answer": answer,
            "citations": citations
        })

    # تشغيل تقييم Ragas
    ragas_result = evaluate_with_ragas(evaluated_items)
    
    # دمج درجات كل عينة
    scores_dict = {}
    if hasattr(ragas_result, "scores"):
        # في حال كانت scores مصفوفة عينات
        scores_data = ragas_result.scores
        if isinstance(scores_data, list):
            for i, s in enumerate(scores_data):
                if i < len(evaluated_items):
                    evaluated_items[i]["scores"] = dict(s)
    
    # استخراج الدرجات العامة
    overall_scores = {}
    for metric_name in ["faithfulness", "answer_relevancy"]:
        val = ragas_result.get(metric_name) if isinstance(ragas_result, dict) else getattr(ragas_result, metric_name, None)
        if val is None and hasattr(ragas_result, "to_pandas"):
            df = ragas_result.to_pandas()
            if metric_name in df.columns:
                val = float(df[metric_name].mean())
        if val is not None:
            overall_scores[metric_name] = float(val)

    # عرض النتائج وحفظ التقارير
    print_colored_summary(evaluated_items, overall_scores)
    save_reports(evaluated_items, overall_scores)


if __name__ == "__main__":
    main()

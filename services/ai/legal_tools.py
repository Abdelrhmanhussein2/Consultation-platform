# services/ai/legal_tools.py
# -*- coding: utf-8 -*-
"""
أدوات الاسترجاع القانوني المتخصصة (Legal Retrieval Tools):
1. get_laws_only: استرجاع القوانين والمواد فقط (First Retrieval - استشارة ضريبية).
2. get_laws_and_rulings: استرجاع القوانين والأحكام القضائية (Second Retrieval - تحليل تشريعي عميق).
3. compare_law_versions: استرجاع الإصدارات والتعديلات التاريخية (Versioning Retrieval - مقارنة تشريعية).
"""

from typing import Tuple, List, Dict, Any
from helpers.neo4j_db import neo4j_db
from services.ai.neo4j_rag_service import Neo4jRAGService


class LegalTools:
    """مجموعة أدوات الاسترجاع القانوني المصممة لمطابقة أزرار المنصة"""

    @classmethod
    def get_laws_only(cls, query: str, limit: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """
        [الأداة 1 - استشارة ضريبية]
        تسترجع نصوص المواد والفقرات والبنود القانونية فقط، وتستبعد الأحكام القضائية تماماً.
        """
        article_numbers = Neo4jRAGService.extract_article_numbers(query)
        keywords = Neo4jRAGService.extract_keywords(query)

        articles_found = []
        citations: List[Dict[str, Any]] = []

        try:
            with neo4j_db.get_session() as session:
                # 1. البحث برقم المادة
                for art_num in article_numbers:
                    art_query = """
                    MATCH (a:`مادة` {`رقم_المادة`: $art_num})
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           a.`تاريخ_السريان` AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments
                    LIMIT 2
                    """
                    for rec in session.run(art_query, art_num=art_num):
                        articles_found.append(rec)
                        citations.append({
                            "type": "قانون",
                            "law": rec.get("law_name"),
                            "article": rec.get("name"),
                            "effective_date": rec.get("effective_date"),
                            "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                        })

                # 2. البحث النصي الموسع في نصوص المواد والفقرات فقط
                if keywords:
                    search_query = """
                    MATCH (target)
                    WHERE (target:مادة OR target:فقرة OR target:بند)
                      AND any(t IN $terms WHERE
                          (target.`نص_المادة` IS NOT NULL AND target.`نص_المادة` CONTAINS t) OR
                          (target.`نص_الفقرة` IS NOT NULL AND target.`نص_الفقرة` CONTAINS t) OR
                          (target.`نص_البند` IS NOT NULL AND target.`نص_البند` CONTAINS t)
                      )
                    WITH target
                    MATCH (a:`مادة`)
                    WHERE a = target OR (a)-[:`يتضمن_فقرة`]->(target) OR (a)-[:`يتضمن_فقرة`]->()-[:`يتضمن_بند`]->(target) OR (a)-[:`يتضمن_بند`]->(target)
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           a.`تاريخ_السريان` AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments
                    LIMIT $limit
                    """
                    for rec in session.run(search_query, terms=keywords, limit=limit):
                        if not any(x.get("id") == rec.get("id") for x in articles_found):
                            articles_found.append(rec)
                            citations.append({
                                "type": "قانون",
                                "law": rec.get("law_name"),
                                "article": rec.get("name"),
                                "effective_date": rec.get("effective_date"),
                                "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                            })

        except Exception as e:
            print(f"[LegalTools.get_laws_only Warning] Failed to query Neo4j: {e}")
            return "", []

        # صياغة السياق (نصوص القوانين فقط بدون أي فقرة للأحكام القضائية)
        context_parts = []
        if articles_found:
            context_parts.append("النصوص والأنظمة القانونية المعتمدة:")
            for art in articles_found:
                law_title = art.get('law_name') or "قانون ضريبة الدخل"
                art_name = art.get('name') or "المادة"
                eff_date = art.get('effective_date') or "غير محدد"
                context_parts.append(f"\n- **{art_name}** من ({law_title}) (سارية اعتباراً من: {eff_date}):")
                if art.get("text"):
                    context_parts.append(f"  نص المادة: {art['text']}")

                for cl in art.get("clauses", []):
                    if cl.get("text"):
                        context_parts.append(f"  * {cl.get('clause')}: {cl.get('text')}")

                for it in art.get("items", []):
                    if it.get("text") and it.get("item"):
                        context_parts.append(f"    - {it.get('item')}: {it.get('text')}")

        return "\n".join(context_parts) if context_parts else "", citations

    @classmethod
    def get_laws_and_rulings(cls, query: str, limit: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """
        [الأداة 2 - تحليل تشريعي عميق]
        تسترجع نصوص المواد القانونية بالإضافة إلى السوابق والأحكام القضائية المرتبطة بها.
        """
        # يعتمد على البحث الهجين الكامل الذي يشمل الأحكام والمواد
        return Neo4jRAGService.retrieve_context(query)

    @classmethod
    def compare_law_versions(cls, query: str, limit: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """
        [الأداة 3 - مقارنة تشريعية وتتبع الإصدارات Versioning]
        تسترجع جميع إصدارات المادة عبر الزمن (النص الأصلي والتعديلات اللاحقة وتواريخ النفاذ).
        """
        article_numbers = Neo4jRAGService.extract_article_numbers(query)
        keywords = Neo4jRAGService.extract_keywords(query)

        version_records = []
        citations: List[Dict[str, Any]] = []

        try:
            with neo4j_db.get_session() as session:
                # 1. إذا كان السؤال يحدد رقم مادة معينة (مثل المادة 11 أو المادة 12)
                for art_num in article_numbers:
                    ver_query = """
                    MATCH (a:`مادة` {`رقم_المادة`: $art_num})
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           coalesce(a.`تاريخ_السريان`, 'غير محدد') AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments
                    ORDER BY effective_date ASC
                    """
                    for rec in session.run(ver_query, art_num=art_num):
                        version_records.append(rec)
                        citations.append({
                            "type": "إصدار تشريعي",
                            "law": rec.get("law_name"),
                            "article": rec.get("name"),
                            "effective_date": rec.get("effective_date"),
                            "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                        })

                # 2. إذا لم يكن هناك رقم مادة محدد، نبحث بالكلمات المفتاحية عن المواد التي لها تعديلات
                if not version_records and keywords:
                    search_ver_query = """
                    MATCH (target)
                    WHERE (target:مادة OR target:فقرة OR target:بند)
                      AND any(t IN $terms WHERE
                          (target.`نص_المادة` IS NOT NULL AND target.`نص_المادة` CONTAINS t) OR
                          (target.`نص_الفقرة` IS NOT NULL AND target.`نص_الفقرة` CONTAINS t)
                      )
                    WITH target
                    MATCH (a:`مادة`)
                    WHERE a = target OR (a)-[:`يتضمن_فقرة`]->(target)
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           coalesce(a.`تاريخ_السريان`, 'غير محدد') AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments
                    ORDER BY effective_date ASC
                    LIMIT $limit
                    """
                    for rec in session.run(search_ver_query, terms=keywords, limit=limit):
                        if not any(x.get("id") == rec.get("id") for x in version_records):
                            version_records.append(rec)
                            citations.append({
                                "type": "إصدار تشريعي",
                                "law": rec.get("law_name"),
                                "article": rec.get("name"),
                                "effective_date": rec.get("effective_date"),
                                "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                            })

        except Exception as e:
            print(f"[LegalTools.compare_law_versions Warning] Failed to query Neo4j: {e}")
            return "", []

        # صياغة سياق المقارنة الزمنية المخصص لتمكين الـ LLM من عمل جدول المقارنة
        context_parts = []
        if version_records:
            context_parts.append("سجل الإصدارات والتسلسل الزمني للتعديلات التشريعية:")
            for idx, ver in enumerate(version_records, 1):
                law_title = ver.get('law_name') or "قانون ضريبة الدخل"
                art_name = ver.get('name') or "المادة"
                eff_date = ver.get('effective_date') or "غير محدد"
                context_parts.append(f"\nالإصدار التشريعي #{idx}: **{art_name}** من ({law_title}) (ساري اعتباراً من: {eff_date}):")
                if ver.get("text"):
                    context_parts.append(f"  نص المادة في هذا الإصدار: {ver['text']}")

                for cl in ver.get("clauses", []):
                    if cl.get("text"):
                        context_parts.append(f"  * {cl.get('clause')}: {cl.get('text')}")

                for it in ver.get("items", []):
                    if it.get("text") and it.get("item"):
                        context_parts.append(f"    - {it.get('item')}: {it.get('text')}")

                amends = [a for a in ver.get("amendments", []) if a.get("mod")]
                if amends:
                    context_parts.append("  ⚠️ وثائق التعديل المرتبطة بهذا الإصدار:")
                    for a in amends:
                        context_parts.append(f"    - {a.get('mod')} (سريان: {a.get('eff')})")

        return "\n".join(context_parts) if context_parts else "", citations

    @classmethod
    def execute_by_mode(cls, mode: str, query: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        توجيه السؤال تلقائياً للأداة المناسبة بحسب الوضع المحدد:
        - consultation: get_laws_only (قوانين فقط)
        - deep_analysis: get_laws_and_rulings (قوانين وأحكام)
        - comparison: compare_law_versions (مقارنة الإصدارات والفيرجنينج)
        - default: get_laws_only
        """
        clean_mode = (mode or "").strip().lower()
        if clean_mode in ["consultation", "استشارة ضريبية", "default"]:
            return cls.get_laws_only(query)
        elif clean_mode in ["deep_analysis", "تحليل تشريعي عميق"]:
            return cls.get_laws_and_rulings(query)
        elif clean_mode in ["comparison", "مقارنة تشريعية"]:
            return cls.compare_law_versions(query)
        else:
            # افتراضياً للأمان والسرعة: قوانين فقط
            return cls.get_laws_only(query)


# تعريف الـ Tools بصيغة OpenAI Function Calling الرسمية
OPENAI_LEGAL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_laws_only",
            "description": "تسترجع نصوص المواد والفقرات والبنود من القوانين والأنظمة الضريبية فقط (بدون أي أحكام قضائية). تستخدم للإجابات الاستشارية المباشرة.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "نص السؤال أو الاستفسار أو رقم المادة المراد البحث عنها"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_laws_and_rulings",
            "description": "تسترجع نصوص المواد القانونية بالإضافة إلى السوابق والقرارات والأحكام القضائية الصادرة عن محكمة التمييز والبداية الضريبية. تستخدم للتحليل المعمق.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "نص السؤال أو القضية المراد البحث عن أحكام وقوانين لها"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_law_versions",
            "description": "تسترجع تاريخ وتطور وتعديلات المادة القانونية (النص الأصلي والتعديلات اللاحقة وتواريخ السريان) لعمل مقارنة تشريعية زمنية دقيقة.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "المادة أو الموضوع المراد تتبع تعديلاته وتطوره التشريعي"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

from typing import Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
from helpers.enums import UserRole
from models import User
from routes.deps import get_current_user
from controllers import LegalController
from controllers.legal_terms_controller import LegalTermsController
from helpers.neo4j_db import neo4j_db
from services.ai.llm_service import LLMService

router = APIRouter(prefix="/legal", tags=["Legal Graph Database"])


# ── "اسأل ديوان عن القانون" ──────────────────────────────────────

class AskLawRequest(BaseModel):
    question: str
    law_id: str
    law_title: Optional[str] = None


class AskLawResponse(BaseModel):
    answer: str
    sources: list = []


@router.post("/ask", response_model=AskLawResponse, summary="Ask Diwan about a specific law")
def ask_about_law(req: AskLawRequest):
    """
    يجيب على سؤال المستخدم بناءً على نصوص قانون محدد (law_id) من Neo4j.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="السؤال لا يمكن أن يكون فارغاً")

    from services.ai.legal_graph_service import LegalGraphService
    import re

    context_parts = []
    sources = []
    law_display_name = req.law_title or req.law_id

    # 1. محاولة جلب شجرة القانون عبر LegalGraphService (تدعم كلا التسميتين العربية والإنجليزية والأسماء البديلة)
    tree = None
    try:
        tree = LegalGraphService.get_law_version_tree(req.law_id)
    except Exception as e:
        print(f"[AskLaw] Tree fetch failed: {e}")

    if tree and tree.get("articles"):
        law_display_name = tree.get("title") or law_display_name
        articles = tree["articles"]

        # استخراج الكلمات المفتاحية وأرقام المواد من سؤال المستخدم للتركيز
        art_nums = re.findall(r'(?:المادة|مادة)\s*\(?(\d+)\)?', req.question)
        if not art_nums:
            art_nums = re.findall(r'\b(\d{1,3})\b', req.question)

        keywords = [w for w in re.sub(r'[^\w\s\u0600-\u06FF]', ' ', req.question).split() if len(w) >= 3]

        # ترتيب أو تصفية المواد الأكثر صلة بالسؤال
        scored_articles = []
        for art in articles:
            score = 0
            art_num_str = str(art.get("number", ""))
            art_text = art.get("text", "")
            art_title = art.get("title", "")

            if art_num_str in art_nums:
                score += 100

            for kw in keywords:
                if kw in art_text:
                    score += 5
                if kw in art_title:
                    score += 8

            scored_articles.append((score, art))

        # إذا وُجدت مواد متطابقة نأخذ الأكثر صلة، وإذا لم يتطابق شيء نأخذ أول 15 مادة
        scored_articles.sort(key=lambda x: x[0], reverse=True)
        top_articles = [art for score, art in scored_articles if score > 0][:10]
        if not top_articles:
            top_articles = [art for _, art in scored_articles[:15]]

        for art in top_articles:
            art_name = art.get("title") or f"المادة ({art.get('number')})"
            context_parts.append(f"\n- **{art_name}**:")
            if art.get("text"):
                context_parts.append(f"  نص المادة: {art['text']}")

            for p in art.get("paragraphs", []):
                p_letter = p.get("letter", "")
                p_text = p.get("text", "")
                if p_text:
                    context_parts.append(f"  * فقرة ({p_letter}): {p_text}")
                for it in p.get("items", []):
                    if it.get("text"):
                        context_parts.append(f"    - بند: {it['text']}")

            for r in art.get("related_files", []):
                if r.get("title"):
                    sources.append({"article": art_name, "ruling": r.get("title")})
                    context_parts.append(f"  سابق قضائي: {r.get('title')}")

    else:
        # Fallback استعلام مباشر في Neo4j
        try:
            with neo4j_db.get_session() as session:
                law_query = """
                MATCH (l)-[:HAS_VERSION|`يتضمن_مادة`*1..2]->(a)
                WHERE (l:Law OR l:`قانون`) AND (l.law_id = $law_id OR l.`معرف` = $law_id OR l.title CONTAINS $law_id OR l.`اسم` CONTAINS $law_id)
                  AND (a:ArticleVersion OR a:`مادة`)
                OPTIONAL MATCH (a)-[:HAS_PARAGRAPH|`يتضمن_فقرة`]->(c)
                OPTIONAL MATCH (a)-[:HAS_RULING|`استند_إلى_مادة`]->(r)
                RETURN coalesce(a.title, a.`اسم`, 'مادة') AS name,
                       coalesce(a.number, toInteger(a.`رقم_المادة`), 0) AS num,
                       coalesce(a.text, a.`نص_المادة`, '') AS text,
                       collect(DISTINCT coalesce(c.text, c.`نص_الفقرة`, '')) AS clauses,
                       collect(DISTINCT coalesce(r.title, r.`العنوان`, r.`اسم`, '')) AS rulings
                ORDER BY num ASC
                LIMIT 20
                """
                records = session.run(law_query, law_id=req.law_id).data()
                for rec in records:
                    context_parts.append(f"\n- **{rec['name']}**:\n  نص: {rec['text']}")
                    for cl in rec.get("clauses", []):
                        if cl:
                            context_parts.append(f"  * {cl}")
                    for rl in rec.get("rulings", []):
                        if rl:
                            sources.append({"article": rec['name'], "ruling": rl})
                            context_parts.append(f"  حكم قضائي: {rl}")
        except Exception as e:
            print(f"[AskLaw] Direct query fallback error: {e}")

    law_context = "\n".join(context_parts)
    if not law_context.strip():
        return AskLawResponse(
            answer=f"لم يتم العثور على نصوص قانونية مفهرسة لهذا القانون («{law_display_name}»). يرجى التأكد من اختيار القانون الصحيح أو التواصل مع الدعم الفني.",
            sources=[]
        )

    system_instruction = (
        f"أنت مستشار قانوني ذكي ومساعد متخصص على منصة 'ديوان' للاستشارات القانونية والضريبية. "
        f"مهمتك الإجابة بدقة ووضوح واحترافية على أسئلة المستخدم حول قانون «{law_display_name}» "
        f"مستنداً فقط وبشكل حصري إلى نصوص المواد والأحكام القضائية المرفقة أدناه دون أي تخمين أو تلفيق.\n"
        f"قواعد إلزامية حاسمة:\n"
        f"1. انقل النسب المئوية والأرقام حرفياً كما هي بالنص (مثال: إذا نصت المادة 12/ب على 10% فانقلها 10% ولا تذكر 5% إطلاقاً).\n"
        f"2. استشهد حصراً برقم المادة والفقرة الحقيقية من النص المرفق، وإياك واختلاق أو نسبة نصوص لمواد لا تخصها.\n"
        f"3. إذا كان السؤال غير مغطى في هذه النصوص، أخبر المستخدم بلباقة أن السؤال غير مغطى في المواد المعروضة واقترح حجز استشارة متخصصة."
    )

    prompt = f"""
سؤال المستخدم:
{req.question.strip()}

--- نصوص قانون «{law_display_name}» المسترجعة ---
{law_context}
--- نهاية النصوص ---

أجب بشكل منظم ومباشر وموثق بأرقام المواد:
"""

    try:
        answer = LLMService.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            strict_mode=True
        )
        return AskLawResponse(answer=answer.strip(), sources=sources)
    except Exception as e:
        print(f"[AskLaw] LLM error: {e}")
        return AskLawResponse(
            answer="عذراً، حدث خطأ أثناء صياغة الإجابة بواسطة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.",
            sources=[]
        )

@router.get("/terms/suggest")
def suggest_legal_terms(
    q: str = Query(..., min_length=2, description="User search query"),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Return legislative term suggestions for a given popular/colloquial query.
    Triggered by the «تحسين البحث ✨» button in RegulationsSearch.
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return LegalTermsController.suggest(q.strip(), limit)


@router.post("/upload-law", status_code=status.HTTP_201_CREATED)
async def upload_law(
    file: UploadFile = File(...),
    law_id: str = Form(..., description="Unique code for the law (e.g. law_34_2014)"),
    title: str = Form(..., description="Title of the law (e.g. Income Tax Law No. 34 of 2014)"),
    number: int = Form(..., description="Law number"),
    year: int = Form(..., description="Law year"),
    version_name: str = Form(..., description="Name of this version (e.g. 2015 or amended)"),
    effective_from: str = Form(..., description="Effective date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can upload law documents."
        )
    file_bytes = await file.read()
    return LegalController.upload_law(
        file_bytes=file_bytes,
        law_id=law_id,
        title=title,
        number=number,
        year=year,
        version_name=version_name,
        effective_from=effective_from
    )

@router.post("/upload-judgment", status_code=status.HTTP_201_CREATED)
async def upload_judgment(
    file: UploadFile = File(...),
    default_law_id: str = Form(None, description="Default law ID to associate citations with if not found in text"),
    default_version_name: str = Form(None, description="Default law version name to associate citations with"),
    ruling_id: str = Form(None, description="Override ruling ID (optional)"),
    case_number: str = Form(None, description="Override case number (optional)"),
    ruling_number: int = Form(None, description="Override ruling number (optional)"),
    ruling_year: int = Form(None, description="Override ruling year (optional)"),
    court: str = Form(None, description="Override court name (optional)"),
    court_type: str = Form(None, description="Override court type (optional, e.g. cassation)"),
    date: str = Form(None, description="Override ruling date YYYY-MM-DD (optional)"),
    outcome: str = Form(None, description="Override outcome (optional)"),
    subject: str = Form(None, description="Override subject (optional)"),
    title: str = Form(None, description="Override title (optional)"),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can upload judgment documents."
        )
    file_bytes = await file.read()
    return LegalController.upload_judgment(
        file_bytes=file_bytes,
        default_law_id=default_law_id,
        default_version_name=default_version_name,
        ruling_id=ruling_id,
        case_number=case_number,
        ruling_number=ruling_number,
        ruling_year=ruling_year,
        court=court,
        court_type=court_type,
        date=date,
        outcome=outcome,
        subject=subject,
        title=title
    )

@router.get("/laws")
def get_laws(
    q: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None
):
    return LegalController.get_laws(q=q, year_from=year_from, year_to=year_to)

@router.get("/laws/{law_id}")
def get_law_tree(
    law_id: str,
    version_name: str = None
):
    return LegalController.get_law_tree(law_id, version_name)

@router.get("/laws/{law_id}/related")
def get_related_files(
    law_id: str
):
    return LegalController.get_related_files(law_id)

@router.get("/laws/{law_id}/stages")
def get_law_stages(
    law_id: str
):
    return LegalController.get_law_stages(law_id)


@router.get("/articles/{law_id}/{article_number}/history")
def get_article_history(
    law_id: str,
    article_number: int
):
    return LegalController.get_article_history(law_id, article_number)

@router.get("/articles/{target_id}/citations")
def get_citations(
    target_id: str
):
    return LegalController.get_citations(target_id)

@router.get("/search")
def search(
    query: str,
    limit: int = 5,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None
):
    if not query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query parameter cannot be empty"
        )
    return LegalController.search(query, limit, year_from=year_from, year_to=year_to)

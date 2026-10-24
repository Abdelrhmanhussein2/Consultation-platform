from typing import Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException, Query
from helpers.enums import UserRole
from models import User
from routes.deps import get_current_user
from controllers import LegalController
from controllers.legal_terms_controller import LegalTermsController

router = APIRouter(prefix="/legal", tags=["Legal Graph Database"])

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
    limit: int = 5
):
    if not query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query parameter cannot be empty"
        )
    return LegalController.search(query, limit)

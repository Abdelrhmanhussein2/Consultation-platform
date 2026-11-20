import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from helpers.database import get_db
from models.users.user import User
from models.ai.legal_import_job import LegalImportJob
from routes.deps import get_current_user
from services.ai.legal_sources_service import LegalSourcesService

router = APIRouter(prefix="/legal", tags=["Legal Sources & Jobs"])

def _require_admin(user: User) -> User:
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    if not user or role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="صلاحية المشرف مطلوبة")
    return user

@router.get("/stats")
def get_knowledge_stats():
    """Live statistics from Neo4j: total sources, active sources, indexed chunks, relations."""
    return LegalSourcesService.get_stats()

@router.post("/sync-core")
def sync_knowledge_core(current_user: User = Depends(get_current_user)):
    """Re-initializes constraints and synchronizes knowledge indices (Admin only)."""
    _require_admin(current_user)
    return LegalSourcesService.sync_core()

@router.post("/sources/manual-law")
def create_manual_law(payload: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Adds a manual law directly into Neo4j graph and vector index."""
    _require_admin(current_user)
    return LegalSourcesService.create_manual_law(payload)

@router.post("/sources/manual-judgment")
def create_manual_judgment(payload: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Adds a manual judicial ruling directly into Neo4j graph and vector index."""
    _require_admin(current_user)
    return LegalSourcesService.create_manual_judgment(payload)

@router.get("/sources")
def get_unified_sources(
    source_type: str = Query("all", pattern="^(all|law|judgment)$"),
    q: Optional[str] = Query(None),
    court: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Unified endpoint returning laws and judicial rulings with server-side filters & pagination."""
    return LegalSourcesService.get_unified_sources(
        source_type=source_type, q=q, court=court, year=year, is_active=is_active,
        page=page, page_size=page_size
    )

@router.get("/document-relations/{source_id:path}")
@router.get("/sources/{source_id}/relations")
def get_source_document_relations(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only: Returns active legal relations for a document."""
    _require_admin(current_user)
    from services.ai.legal_relation_service import LegalRelationService
    return LegalRelationService.get_document_active_relations(db=db, target_doc_id=source_id)

@router.get("/sources/{source_id:path}")
def get_source_detail(
    source_id: str,
    source_type: str = Query("law", pattern="^(law|judgment)$")
):
    """Returns full details and body for a single law or judicial ruling."""
    item = LegalSourcesService.get_source_detail(source_id=source_id, source_type=source_type)
    if not item:
        raise HTTPException(status_code=404, detail="المصدر غير موجود")
    return item

@router.put("/sources/{source_id:path}")
def update_source(
    source_id: str,
    payload: Dict[str, Any],
    source_type: str = Query("law", pattern="^(law|judgment)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only update for a law or judgment properties and relationships."""
    _require_admin(current_user)

    status_candidate = payload.get("status") or payload.get("document_status")
    from models.ai.legal_document_metadata import LegalDocumentMetadata
    meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == source_id).first()
    if status_candidate:
        curr_status = meta.status if meta else "ساري"
        is_curr_repealed = curr_status in ["ملغي", "repealed"]
        is_cand_repealed = status_candidate in ["ملغي", "repealed"]
        if is_curr_repealed != is_cand_repealed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لا يمكن تغيير حالة النفاذ (ساري/ملغي) من شاشة التعديل. يرجى استخدام زر الإلغاء/الاسترجاع المخصص لذلك."
            )

    res = LegalSourcesService.update_source(source_id, source_type, payload)

    if "relations" in payload or "related_laws" in payload:
        from services.ai.legal_relation_service import LegalRelationService
        user_id = current_user.id if hasattr(current_user, "id") else None
        rel_diff = LegalRelationService.update_document_relations(
            db=db, target_doc_id=source_id, payload=payload, current_user_id=user_id
        )
        res["relations_diff"] = rel_diff
        if rel_diff.get("warning"):
            res["warning"] = rel_diff["warning"]

    return res

@router.patch("/sources/{source_id:path}/toggle-active")
def toggle_source_active(
    source_id: str,
    source_type: str = Query("law", pattern="^(law|judgment)$"),
    current_user: User = Depends(get_current_user)
):
    """Admin-only instant toggle for active/inactive status."""
    _require_admin(current_user)
    return LegalSourcesService.toggle_source_active(source_id, source_type)

@router.post("/extract-preview")
async def extract_preview(
    file: UploadFile = File(...),
    source_type: str = Form("law"),
    current_user: User = Depends(get_current_user)
):
    """Fast auto-extraction of metadata and full text from DOCX/TXT legal files."""
    _require_admin(current_user)
    content = await file.read()
    return LegalSourcesService.extract_file_preview(content, file.filename or "file.docx", source_type)

@router.delete("/sources/{source_id:path}")
def delete_source(
    source_id: str,
    source_type: Optional[str] = Query(None),
    force: bool = Query(True),
    permanent: bool = Query(True),
    current_user: User = Depends(get_current_user)
):
    """Hard deletion is permanently disabled. Laws and rulings can only be repealed."""
    _require_admin(current_user)
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="لا يمكن حذف القوانين، استخدم الإلغاء"
    )

@router.get("/{source_id:path}/repeal-preview")
def get_repeal_preview(
    source_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only preview of document dependents and taxonomy status before repeal."""
    _require_admin(current_user)
    from services.ai.legal_repeal_service import LegalRepealService
    try:
        return LegalRepealService.get_repeal_preview(doc_id=source_id, db=db, page=page, page_size=page_size)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.post("/{source_id:path}/repeal")
def repeal_document(
    source_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only execution of document repeal with dependent decisions and audit trail."""
    _require_admin(current_user)
    from services.ai.legal_repeal_service import LegalRepealService
    try:
        user_id = str(current_user.id) if hasattr(current_user, "id") and current_user.id else None
        return LegalRepealService.execute_repeal(doc_id=source_id, payload=payload, current_user_id=user_id, db=db)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.post("/{source_id:path}/restore")
def restore_document(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only restoration of a repealed document back to active status."""
    _require_admin(current_user)
    from services.ai.legal_repeal_service import LegalRepealService
    try:
        user_id = str(current_user.id) if hasattr(current_user, "id") and current_user.id else None
        return LegalRepealService.restore_document(doc_id=source_id, current_user_id=user_id, db=db)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.get("/parent-laws")
def get_parent_laws(
    q: Optional[str] = Query(None, description="Search term for law title or ID"),
    limit: int = Query(20, ge=1, le=200, description="Max laws to return"),
    skip: int = Query(0, ge=0, description="Number of items to skip")
):
    """Returns available laws with optional search, pagination, and limit."""
    from services.ai.legal_relation_service import LegalRelationService
    return LegalRelationService.get_available_parent_laws(q=q, limit=limit, skip=skip)

@router.get("/relations/{law_id:path}")
def get_law_relations(law_id: str):
    """Returns structured legal taxonomy tree (legislative & judicial) for a law."""
    from services.ai.legal_relation_service import LegalRelationService
    return LegalRelationService.get_law_taxonomy_tree(law_id)

@router.post("/relations")
def create_law_relation(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually links an existing document to a parent law with taxonomy classification and validation."""
    _require_admin(current_user)
    from services.ai.legal_relation_service import LegalRelationService
    try:
        success = LegalRelationService.sync_relation(
            db=db,
            parent_law_id=payload.get("parent_law_id"),
            target_document_id=payload.get("target_document_id"),
            target_title=payload.get("target_title", payload.get("target_document_id")),
            relation_domain=payload.get("relation_domain", "legislative"),
            relation_type=payload.get("relation_type", "issued_under"),
            sub_category=payload.get("sub_category", "الأنظمة"),
            document_type=payload.get("document_type"),
            article_ref=payload.get("article_ref"),
            effective_date=payload.get("effective_date"),
            created_by=current_user.id if hasattr(current_user, "id") else None,
            document_status=payload.get("document_status", "ساري"),
            notes=payload.get("notes")
        )
        return {"status": "success" if success else "failed", "synced": success}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.post("/relations/retry-sync")
def retry_failed_relations(
    max_retries: int = Query(3, ge=1, le=10),
    batch_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin job to retry all failed/pending relations in batches."""
    _require_admin(current_user)
    from services.ai.legal_relation_service import LegalRelationService
    return LegalRelationService.retry_pending_or_failed_syncs(db=db, max_retries=max_retries, batch_size=batch_size)

@router.get("/jobs/{job_id}")
def get_job_status(job_id: uuid.UUID, db: Session = Depends(get_db)):
    """Poll status of an asynchronous legal file import job."""
    job = db.query(LegalImportJob).filter(LegalImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    return {
        "job_id": str(job.id), "source_type": job.source_type, "file_name": job.file_name,
        "status": job.status, "total_items": job.total_items, "processed_items": job.processed_items,
        "error_message": job.error_message, "created_at": job.created_at, "updated_at": job.updated_at
    }

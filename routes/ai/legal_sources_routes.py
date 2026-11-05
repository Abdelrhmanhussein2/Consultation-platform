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

@router.put("/sources/{source_id}")
def update_source(
    source_id: str,
    payload: Dict[str, Any],
    source_type: str = Query("law", pattern="^(law|judgment)$"),
    current_user: User = Depends(get_current_user)
):
    """Admin-only update for a law or judgment properties."""
    _require_admin(current_user)
    return LegalSourcesService.update_source(source_id, source_type, payload)

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

@router.delete("/sources/{source_id}")
def delete_source(
    source_id: str,
    source_type: str = Query(..., pattern="^(law|judgment)$"),
    force: bool = Query(True),
    permanent: bool = Query(True),
    current_user: User = Depends(get_current_user)
):
    """Admin-only permanent deletion for a law or judgment, handling citations and vector sync."""
    _require_admin(current_user)
    if source_type == "law":
        return LegalSourcesService.delete_law(law_id=source_id, force=force)
    return LegalSourcesService.delete_judgment(ruling_id=source_id, permanent=permanent)

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

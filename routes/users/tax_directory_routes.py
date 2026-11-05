import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from helpers.database import get_db
from models.users.user import User
from models.users.tax_entity import TaxEntity
from models.admin.admin_action_log import AdminActionLog
from routes.deps import get_current_user
from schemes.tax_directory_schemes import (
    TaxEntityCreate, TaxEntityUpdate, TaxEntityOut, TaxDirectoryStats,
    ImportDryRunResult, ImportCommitResult
)
from services.tax_directory_service import (
    normalize_arabic, clean_tax_number, canonicalize_type,
    parse_tax_file, run_dry_run, commit_import
)

router = APIRouter(prefix="/tax-directory", tags=["Tax Directory"])

def _require_admin(user: User) -> User:
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    if not user or role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="صلاحية المشرف مطلوبة")
    return user

def _log_admin(db: Session, admin_id: uuid.UUID, action: str, target_id: Optional[uuid.UUID], details: str):
    try:
        log = AdminActionLog(
            admin_id=admin_id, action_type=action, target_entity_type="tax_entity",
            target_entity_id=target_id, details=details, status="success"
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

@router.get("/")
def list_tax_entities(
    q: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(TaxEntity)
    if not include_inactive:
        query = query.filter(TaxEntity.is_active == True)
    if entity_type and entity_type != "الكل":
        query = query.filter(TaxEntity.entity_type == entity_type)
    if q:
        norm_q = normalize_arabic(q)
        query = query.filter(or_(
            TaxEntity.name_normalized.ilike(f"%{norm_q}%"),
            TaxEntity.tax_number.ilike(f"%{clean_tax_number(q) or q.strip()}%")
        ))
    total = query.count()
    items = query.order_by(TaxEntity.name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [TaxEntityOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/stats", response_model=TaxDirectoryStats)
def get_tax_directory_stats(db: Session = Depends(get_db)):
    active_records = db.query(TaxEntity).filter(TaxEntity.is_active == True).count()
    total_records = db.query(TaxEntity).count()
    cats = db.query(TaxEntity.entity_type).filter(TaxEntity.is_active == True).distinct().all()
    cat_list = sorted([c[0] for c in cats if c[0]])
    return TaxDirectoryStats(
        total_records=total_records,
        active_records=active_records,
        categories_count=len(cat_list),
        categories=cat_list
    )

@router.post("/", response_model=TaxEntityOut, status_code=status.HTTP_201_CREATED)
def create_tax_entity(
    payload: TaxEntityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_admin(current_user)
    cleaned_tax = clean_tax_number(payload.tax_number)
    if not cleaned_tax:
        raise HTTPException(status_code=400, detail="الرقم الضريبي غير صالح")
    exist = db.query(TaxEntity).filter(TaxEntity.tax_number == cleaned_tax, TaxEntity.is_active == True).first()
    if exist:
        raise HTTPException(status_code=409, detail="الرقم الضريبي مسجل ومفعل بالفعل لجهة أخرى")
    canon_type = canonicalize_type(payload.entity_type)
    entity = TaxEntity(
        name=payload.name.strip(),
        name_normalized=normalize_arabic(payload.name),
        tax_number=cleaned_tax,
        entity_type=canon_type,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    _log_admin(db, current_user.id, "create_tax_entity", entity.id, f"Added entity {entity.name} ({entity.tax_number})")
    return TaxEntityOut.model_validate(entity)

@router.put("/{entity_id}", response_model=TaxEntityOut)
def update_tax_entity(
    entity_id: uuid.UUID,
    payload: TaxEntityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_admin(current_user)
    entity = db.query(TaxEntity).filter(TaxEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    if payload.tax_number is not None:
        cleaned_tax = clean_tax_number(payload.tax_number)
        dup = db.query(TaxEntity).filter(
            TaxEntity.tax_number == cleaned_tax, TaxEntity.id != entity_id, TaxEntity.is_active == True
        ).first()
        if dup:
            raise HTTPException(status_code=409, detail="الرقم الضريبي مستخدم لجهة أخرى")
        entity.tax_number = cleaned_tax
    if payload.name is not None:
        entity.name = payload.name.strip()
        entity.name_normalized = normalize_arabic(payload.name)
    if payload.entity_type is not None:
        entity.entity_type = canonicalize_type(payload.entity_type)
    if payload.is_active is not None:
        entity.is_active = payload.is_active
    entity.updated_by = current_user.id
    db.commit()
    db.refresh(entity)
    _log_admin(db, current_user.id, "update_tax_entity", entity.id, f"Updated entity {entity.name}")
    return TaxEntityOut.model_validate(entity)

@router.delete("/{entity_id}")
def delete_tax_entity(
    entity_id: uuid.UUID,
    permanent: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_admin(current_user)
    entity = db.query(TaxEntity).filter(TaxEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    if permanent:
        db.delete(entity)
    else:
        entity.is_active = False
        entity.updated_by = current_user.id
    db.commit()
    _log_admin(db, current_user.id, "delete_tax_entity", entity_id, f"Deleted (permanent={permanent})")
    return {"message": "تم حذف السجل بنجاح", "id": str(entity_id)}

@router.post("/import")
async def import_tax_entities(
    file: UploadFile = File(...),
    dry_run: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_admin(current_user)
    content = await file.read()
    records, errors = parse_tax_file(content, file.filename)
    if not records:
        raise HTTPException(status_code=400, detail="لم يتم العثور على أي سجلات صالحة في الملف")
    if dry_run:
        result = run_dry_run(db, records)
        return ImportDryRunResult(**result)
    result = commit_import(db, records, current_user.id)
    _log_admin(
        db, current_user.id, "import_tax_entities", None,
        f"Imported from {file.filename}: {result['inserted']} inserted, {result['updated']} updated"
    )
    return ImportCommitResult(
        success=True, inserted=result["inserted"], updated=result["updated"],
        total_processed=result["total_processed"],
        message=f"تم استيراد {result['inserted']} جهة جديدة وتحديث {result['updated']} بنجاح"
    )

@router.get("/export")
def export_tax_entities(db: Session = Depends(get_db)):
    items = db.query(TaxEntity).filter(TaxEntity.is_active == True).order_by(TaxEntity.name.asc()).all()
    rows = ["نوع المكلف,اسم المكلف,الرقم الضريبي"]
    for i in items:
        rows.append(f'"{i.entity_type}","{i.name}","{i.tax_number}"')
    csv_data = "\ufeff" + "\n".join(rows)
    return Response(
        content=csv_data.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="tax_directory_export.csv"'}
    )

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
    ImportDryRunResult, ImportCommitResult, CheckDuplicateRequest, CheckDuplicateResponse
)
from services.tax_directory_service import (
    normalize_arabic, clean_tax_number, canonicalize_type, merge_names,
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

@router.post("/check-duplicate", response_model=CheckDuplicateResponse)
def check_duplicate_tax_entity(
    payload: CheckDuplicateRequest,
    db: Session = Depends(get_db)
):
    cleaned_tax = clean_tax_number(payload.tax_number)
    norm_name = normalize_arabic(payload.name)

    query = db.query(TaxEntity).filter(TaxEntity.is_active == True)
    if payload.exclude_id:
        query = query.filter(TaxEntity.id != payload.exclude_id)

    all_actives = query.all()

    matched_by_tax = None
    matched_by_name = None

    for e in all_actives:
        if cleaned_tax and e.tax_number == cleaned_tax:
            matched_by_tax = {
                "id": str(e.id),
                "name": e.name,
                "tax_number": e.tax_number,
                "entity_type": e.entity_type
            }
        if norm_name and e.name_normalized == norm_name:
            matched_by_name = {
                "id": str(e.id),
                "name": e.name,
                "tax_number": e.tax_number,
                "entity_type": e.entity_type
            }

    is_exact = bool(matched_by_tax and matched_by_name and matched_by_tax["id"] == matched_by_name["id"])

    suggested_merged = None
    if matched_by_tax and not is_exact:
        suggested_merged = merge_names(matched_by_tax["name"], payload.name.strip())

    return CheckDuplicateResponse(
        is_duplicate_exact=is_exact,
        is_duplicate_name=bool(matched_by_name and not is_exact),
        is_duplicate_tax=bool(matched_by_tax and not is_exact),
        matched_by_name=matched_by_name,
        matched_by_tax=matched_by_tax,
        suggested_merged_name=suggested_merged
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

    canon_type = canonicalize_type(payload.entity_type)
    norm_name = normalize_arabic(payload.name)

    exist_tax = db.query(TaxEntity).filter(TaxEntity.tax_number == cleaned_tax, TaxEntity.is_active == True).first()
    exist_name = db.query(TaxEntity).filter(TaxEntity.name_normalized == norm_name, TaxEntity.is_active == True).first()

    # 1. Handle user resolution when conflict was flagged
    if payload.resolution == "merge" and exist_tax:
        merged_name = merge_names(exist_tax.name, payload.name.strip())
        exist_tax.name = merged_name
        exist_tax.name_normalized = normalize_arabic(merged_name)
        exist_tax.entity_type = canon_type
        exist_tax.updated_by = current_user.id
        db.commit()
        db.refresh(exist_tax)
        _log_admin(db, current_user.id, "merge_tax_entity", exist_tax.id, f"Merged with {payload.name}")
        return TaxEntityOut.model_validate(exist_tax)

    if payload.resolution == "update_existing" and exist_tax:
        exist_tax.name = payload.name.strip()
        exist_tax.name_normalized = norm_name
        exist_tax.entity_type = canon_type
        exist_tax.updated_by = current_user.id
        db.commit()
        db.refresh(exist_tax)
        _log_admin(db, current_user.id, "update_tax_entity", exist_tax.id, f"Updated existing to {payload.name}")
        return TaxEntityOut.model_validate(exist_tax)

    # 2. Duplicate exact (same tax AND same name)
    if exist_tax and exist_tax.name_normalized == norm_name:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "هذا المكلف مسجل بالفعل في الكشف بنفس الاسم والرقم الضريبي",
                "conflict_type": "exact_duplicate",
                "existing_id": str(exist_tax.id),
                "existing_name": exist_tax.name,
                "existing_tax": exist_tax.tax_number
            }
        )

    # 3. Duplicate tax number (same tax number, different name)
    if exist_tax:
        suggested = merge_names(exist_tax.name, payload.name.strip())
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"الرقم الضريبي ({cleaned_tax}) مسجل ومفعل بالفعل لجهة أخرى: {exist_tax.name}",
                "conflict_type": "same_tax",
                "existing_id": str(exist_tax.id),
                "existing_name": exist_tax.name,
                "existing_tax": exist_tax.tax_number,
                "suggested_merged_name": suggested
            }
        )

    # 4. Duplicate name (same name, different tax number)
    if exist_name and exist_name.tax_number != cleaned_tax and payload.resolution != "force_name":
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"يوجد مكلف مسجل مسبقاً بنفس الاسم ({exist_name.name}) برقم ضريبي مختلف ({exist_name.tax_number})",
                "conflict_type": "same_name",
                "existing_id": str(exist_name.id),
                "existing_name": exist_name.name,
                "existing_tax": exist_name.tax_number
            }
        )

    entity = TaxEntity(
        name=payload.name.strip(),
        name_normalized=norm_name,
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
    merge_same_tax: bool = Form(True),
    skip_duplicates: bool = Form(True),
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
    result = commit_import(
        db, records, current_user.id,
        merge_same_tax=merge_same_tax,
        skip_duplicates=skip_duplicates
    )
    _log_admin(
        db, current_user.id, "import_tax_entities", None,
        f"Imported from {file.filename}: {result['inserted']} inserted, {result.get('merged', 0)} merged, {result.get('skipped', 0)} skipped"
    )
    return ImportCommitResult(
        success=True,
        inserted=result["inserted"],
        merged=result.get("merged", 0),
        skipped=result.get("skipped", 0),
        updated=result.get("updated", 0),
        total_processed=result["total_processed"],
        message=f"تم استيراد {result['inserted']} جهة جديدة، ودمج {result.get('merged', 0)} جهة متطابقة الرقم الضريبي، وتخطي {result.get('skipped', 0)} سجل مكرر بنجاح"
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

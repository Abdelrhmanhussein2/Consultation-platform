import os, uuid, mimetypes
from urllib.parse import quote
from typing import List, Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from helpers.database import get_db
from helpers.enums import UserRole
from models.users.user import User
from models.users.official_template import OfficialTemplate
from models.admin.admin_action_log import AdminActionLog
from schemes import OfficialTemplateOut, OfficialTemplateUpdate
from routes.deps import get_current_active_user, get_current_user_optional

router = APIRouter(prefix="/templates", tags=["Official Templates"])
UPLOAD_DIR = os.path.join("static", "templates")
ALLOWED_EXTS = {'.pdf': 'PDF', '.doc': 'DOCX', '.docx': 'DOCX', '.xls': 'XLSX', '.xlsx': 'XLSX', '.csv': 'CSV'}

mimetypes.add_type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx')
mimetypes.add_type('application/vnd.ms-excel', '.xls')
mimetypes.add_type('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
mimetypes.add_type('application/msword', '.doc')

def _validate_magic(content: bytes, ext: str) -> bool:
    if ext == '.pdf': return content.startswith(b'%PDF-')
    if ext in ('.docx', '.xlsx'): return content.startswith(b'PK\x03\x04')
    if ext in ('.doc', '.xls'): return content.startswith(b'\xd0\xcf\x11\xe0') or content.startswith(b'PK\x03\x04')
    if ext == '.csv': return True
    return False

def _log_admin(db: Session, admin_id: uuid.UUID, action: str, target_id: uuid.UUID, details: str):
    try:
        db.add(AdminActionLog(admin_id=admin_id, action_type=action, target_entity_type="official_template", target_entity_id=target_id, details=details))
        db.commit()
    except Exception: pass

@router.get("/", response_model=List[OfficialTemplateOut])
def get_templates(category: Optional[str] = None, search: Optional[str] = None, include_inactive: bool = False, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    try:
        q = db.query(OfficialTemplate)
        role_str = getattr(current_user.role, "value", str(current_user.role)) if current_user else ""
        is_admin = role_str in ("admin", "super_admin")
        if not (include_inactive and is_admin):
            q = q.filter(OfficialTemplate.is_active == True)
        if category and category not in ('all', 'الكل'):
            q = q.filter(OfficialTemplate.category == category)
        if search:
            s = f"%{search}%"
            q = q.filter(or_(OfficialTemplate.title.ilike(s), OfficialTemplate.code.ilike(s), OfficialTemplate.description.ilike(s)))
        return q.order_by(OfficialTemplate.created_at.desc()).all()
    except Exception as e:
        print(f"Warning in get_templates: {e}")
        try:
            return db.query(OfficialTemplate).order_by(OfficialTemplate.created_at.desc()).all()
        except Exception:
            return []

@router.get("/{template_id}/download")
def download_template(template_id: str, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    try: uid = uuid.UUID(template_id)
    except ValueError: raise HTTPException(status.HTTP_400_BAD_REQUEST, "معرف النموذج غير صالح")
    tmpl = db.query(OfficialTemplate).filter(OfficialTemplate.id == uid).first()
    if not tmpl: raise HTTPException(status.HTTP_404_NOT_FOUND, "النموذج غير موجود")
    full_path = tmpl.file_path.lstrip('/')
    if not os.path.exists(full_path):
        os.makedirs(os.path.dirname(full_path) or ".", exist_ok=True)
        ext_low = os.path.splitext(full_path)[1].lower()
        with open(full_path, "wb") as f:
            if ext_low == '.pdf':
                f.write(b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")
            else:
                f.write(b"")
    try:
        db.query(OfficialTemplate).filter(OfficialTemplate.id == uid).update({OfficialTemplate.downloads_count: OfficialTemplate.downloads_count + 1})
        db.commit()
    except Exception: pass
    ext = os.path.splitext(full_path)[1]
    safe_name = f"template_{tmpl.code or template_id[:8]}{ext}"
    utf8_name = quote(f"{tmpl.title}{ext}")
    media_type = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
    headers = {"Content-Disposition": f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{utf8_name}"}
    return FileResponse(path=full_path, headers=headers, media_type=media_type)

@router.post("/upload", response_model=OfficialTemplateOut, status_code=status.HTTP_201_CREATED)
async def upload_template(file: UploadFile = File(...), title: str = Form(...), code: Optional[str] = Form(None), description: Optional[str] = Form(None), category: str = Form(...), language: Optional[str] = Form(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in (UserRole.admin, UserRole.super_admin): raise HTTPException(status.HTTP_403_FORBIDDEN, "غير مصرح")
    if code and db.query(OfficialTemplate).filter(OfficialTemplate.code == code).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "رمز النموذج مستخدم بالفعل")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTS: raise HTTPException(status.HTTP_400_BAD_REQUEST, "صيغة الملف غير مسموح بها")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024: raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "حجم الملف يتجاوز 20MB")
    if not _validate_magic(content, ext): raise HTTPException(status.HTTP_400_BAD_REQUEST, "محتوى الملف غير صالح أو لا يطابق امتداده")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    new_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, new_name), "wb") as f: f.write(content)
    tmpl = OfficialTemplate(code=code, title=title, description=description, category=category, file_path=f"/static/templates/{new_name}", file_size=len(content), file_type=ALLOWED_EXTS[ext], language=language or "AR", downloads_count=0, is_active=True, updated_by=current_user.id)
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    _log_admin(db, current_user.id, "create_template", tmpl.id, f"Uploaded: {title}")
    return tmpl

@router.put("/{template_id}", response_model=OfficialTemplateOut)
def update_template(template_id: str, data: OfficialTemplateUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in (UserRole.admin, UserRole.super_admin): raise HTTPException(status.HTTP_403_FORBIDDEN, "غير مصرح")
    try: uid = uuid.UUID(template_id)
    except ValueError: raise HTTPException(status.HTTP_400_BAD_REQUEST, "معرف النموذج غير صالح")
    tmpl = db.query(OfficialTemplate).filter(OfficialTemplate.id == uid).first()
    if not tmpl: raise HTTPException(status.HTTP_404_NOT_FOUND, "النموذج غير موجود")
    if data.code and db.query(OfficialTemplate).filter(OfficialTemplate.code == data.code, OfficialTemplate.id != uid).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "رمز النموذج مسجل لنموذج آخر")
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None: setattr(tmpl, k, v)
    tmpl.updated_by = current_user.id
    db.commit()
    db.refresh(tmpl)
    _log_admin(db, current_user.id, "update_template", tmpl.id, f"Updated: {tmpl.title}")
    return tmpl

@router.put("/{template_id}/file", response_model=OfficialTemplateOut)
async def update_template_file(template_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in (UserRole.admin, UserRole.super_admin): raise HTTPException(status.HTTP_403_FORBIDDEN, "غير مصرح")
    try: uid = uuid.UUID(template_id)
    except ValueError: raise HTTPException(status.HTTP_400_BAD_REQUEST, "معرف النموذج غير صالح")
    tmpl = db.query(OfficialTemplate).filter(OfficialTemplate.id == uid).first()
    if not tmpl: raise HTTPException(status.HTTP_404_NOT_FOUND, "النموذج غير موجود")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTS: raise HTTPException(status.HTTP_400_BAD_REQUEST, "صيغة الملف غير مسموح بها")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024: raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "حجم الملف يتجاوز 20MB")
    if not _validate_magic(content, ext): raise HTTPException(status.HTTP_400_BAD_REQUEST, "محتوى الملف لا يطابق امتداده")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    new_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, new_name), "wb") as f: f.write(content)
    old_path = tmpl.file_path.lstrip('/')
    tmpl.file_path = f"/static/templates/{new_name}"
    tmpl.file_size = len(content)
    tmpl.file_type = ALLOWED_EXTS[ext]
    tmpl.updated_by = current_user.id
    db.commit()
    db.refresh(tmpl)
    if os.path.exists(old_path):
        try: os.remove(old_path)
        except Exception: pass
    _log_admin(db, current_user.id, "replace_template_file", tmpl.id, f"Replaced file for: {tmpl.title}")
    return tmpl

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str, permanent: bool = Query(False), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in (UserRole.admin, UserRole.super_admin): raise HTTPException(status.HTTP_403_FORBIDDEN, "غير مصرح")
    try: uid = uuid.UUID(template_id)
    except ValueError: raise HTTPException(status.HTTP_400_BAD_REQUEST, "معرف غير صالح")
    tmpl = db.query(OfficialTemplate).filter(OfficialTemplate.id == uid).first()
    if not tmpl: raise HTTPException(status.HTTP_404_NOT_FOUND, "النموذج غير موجود")
    if permanent:
        p = tmpl.file_path.lstrip('/')
        if os.path.exists(p):
            try: os.remove(p)
            except Exception: pass
        db.delete(tmpl)
    else:
        tmpl.is_active = False
        tmpl.updated_by = current_user.id
    db.commit()
    _log_admin(db, current_user.id, "delete_template", uid, f"Deleted (permanent={permanent})")
    return

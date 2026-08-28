import os
import uuid
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import UserRole
from models.user import User
from models.official_template import OfficialTemplate
from schemes import OfficialTemplateOut
from routes.deps import get_current_active_user

router = APIRouter(prefix="/templates", tags=["Official Templates"])

@router.get(
    "/",
    response_model=List[OfficialTemplateOut],
    summary="Get all official templates"
)
def get_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(OfficialTemplate)
    if category and category != 'all' and category != 'الكل':
        query = query.filter(OfficialTemplate.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                OfficialTemplate.title.ilike(search_filter),
                OfficialTemplate.code.ilike(search_filter),
                OfficialTemplate.description.ilike(search_filter)
            )
        )
    return query.order_by(OfficialTemplate.created_at.desc()).all()

@router.post(
    "/upload",
    response_model=OfficialTemplateOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an official template (Admin only)"
)
async def upload_template(
    file: UploadFile = File(...),
    title: str = Form(...),
    code: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: str = Form(...),
    language: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح. هذا الإجراء متاح للمشرفين فقط."
        )

    # Clean and sanitize filename
    raw_filename = os.path.basename(file.filename)
    filename, ext = os.path.splitext(raw_filename)
    ext = ext.lower()

    # Allowed extensions validation
    allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"صيغة الملف غير مسموح بها. الصيغ المسموح بها هي: {', '.join(allowed_extensions)}"
        )

    # Create templates directory if it doesn't exist
    upload_dir = os.path.join("static", "templates")
    os.makedirs(upload_dir, exist_ok=True)

    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = f"/static/templates/{new_filename}"
    full_path = os.path.join(upload_dir, new_filename)

    try:
        content = await file.read()
        file_size = len(content)

        # Size limit: 20 MB
        if file_size > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="حجم الملف يجب أن لا يتجاوز 20 ميجابايت"
            )

        with open(full_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في حفظ الملف على الخادم: {e}"
        )

    # Map extension to file_type text (PDF, DOCX, XLSX)
    file_type_map = {
        '.pdf': 'PDF',
        '.doc': 'DOCX',
        '.docx': 'DOCX',
        '.xls': 'XLSX',
        '.xlsx': 'XLSX'
    }
    file_type = file_type_map.get(ext, ext.strip('.').upper())

    template = OfficialTemplate(
        code=code,
        title=title,
        description=description,
        category=category,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        language=language or "AR",
        downloads_count=0
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an official template (Admin only)"
)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح. هذا الإجراء متاح للمشرفين فقط."
        )

    try:
        template_uuid = uuid.UUID(template_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف النموذج غير صالح"
        )

    template = db.query(OfficialTemplate).filter(OfficialTemplate.id == template_uuid).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="النموذج غير موجود"
        )

    # Remove physical file if it exists
    relative_path = template.file_path.lstrip('/')
    if os.path.exists(relative_path):
        try:
            os.remove(relative_path)
        except Exception:
            pass

    db.delete(template)
    db.commit()
    return

import os
import uuid
from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from models.user import User
from models.user_document import UserDocument
from schemes import UserDocumentOut
from routes.deps import get_current_active_user

router = APIRouter(prefix="/user-documents", tags=["User Documents"])

@router.post(
    "/upload",
    response_model=UserDocumentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a personal document"
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Clean and sanitize filename to prevent path traversal
    raw_filename = os.path.basename(file.filename)
    filename, ext = os.path.splitext(raw_filename)
    ext = ext.lower()

    # Allowed extensions validation
    allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.jpeg']
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"صيغة الملف غير مسموح بها. الصيغ المسموح بها هي: {', '.join(allowed_extensions)}"
        )

    # Create upload directory if it doesn't exist
    upload_dir = os.path.join("static", "documents")
    os.makedirs(upload_dir, exist_ok=True)

    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = f"/static/documents/{new_filename}"
    full_path = os.path.join(upload_dir, new_filename)

    # Read and validate size before saving
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

    # Insert into database (saves filename, user_id/consultant_id, and creation date via func.now())
    doc = UserDocument(
        user_id=current_user.id,
        filename=raw_filename,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get(
    "/",
    response_model=List[UserDocumentOut],
    summary="Get user's personal documents"
)
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    docs = db.query(UserDocument).filter(UserDocument.user_id == current_user.id).order_by(UserDocument.created_at.desc()).all()
    return docs

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a personal document"
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف المستند غير صالح"
        )

    doc = db.query(UserDocument).filter(UserDocument.id == doc_uuid, UserDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستند غير موجود"
        )

    # Remove physical file if it exists
    relative_path = doc.file_path.lstrip('/')
    if os.path.exists(relative_path):
        try:
            os.remove(relative_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return

"""
Folder Routes - User Folders, Folder Items & Files Management
Allows users to create named folders, upload files from device into them,
and add platform items (favorites, regulations, etc.).
"""

import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from helpers.database import get_db
from models.user import User
from models.user_folder import UserFolder, UserFolderItem, UserFolderFile
from routes.deps import get_current_active_user

router = APIRouter(prefix="/folders", tags=["Folders"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = "#F5A52A"
    icon: Optional[str] = "folder"


class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class FolderItemCreate(BaseModel):
    item_type: str = Field(..., description="regulation, consultant, template, document")
    item_id: str
    title: str
    subtitle: Optional[str] = None


# ─── Helper ──────────────────────────────────────────────────────────────────

def _parse_uuid(raw: str, label: str = "المعرف") -> uuid.UUID:
    try:
        return uuid.UUID(raw)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{label} غير صالح")


def _folder_out(folder: UserFolder) -> dict:
    items_count = len(folder.items) if folder.items else 0
    files_count = len(folder.files) if folder.files else 0
    return {
        "id": str(folder.id),
        "name": folder.name,
        "description": folder.description,
        "color": folder.color,
        "icon": folder.icon,
        "created_at": folder.created_at,
        "updated_at": folder.updated_at,
        "items_count": items_count + files_count,
        "files_count": files_count,
        "platform_items_count": items_count,
    }


def _item_out(item: UserFolderItem) -> dict:
    return {
        "id": str(item.id),
        "folder_id": str(item.folder_id),
        "item_type": item.item_type,
        "item_id": item.item_id,
        "title": item.title,
        "subtitle": item.subtitle,
        "added_at": item.added_at,
    }


def _file_out(f: UserFolderFile) -> dict:
    return {
        "id": str(f.id),
        "folder_id": str(f.folder_id),
        "original_filename": f.original_filename,
        "file_path": f.file_path,
        "file_size": f.file_size,
        "content_type": f.content_type,
        "uploaded_at": f.uploaded_at,
    }


# ─── Folder CRUD ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[dict], summary="List my folders")
def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    folders = (
        db.query(UserFolder)
        .filter(UserFolder.user_id == current_user.id)
        .order_by(UserFolder.created_at.desc())
        .all()
    )
    return [_folder_out(f) for f in folders]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create a new folder")
def create_folder(
    payload: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    folder = UserFolder(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        color=payload.color or "#F5A52A",
        icon=payload.icon or "folder",
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return _folder_out(folder)


@router.get("/check-status", response_model=dict, summary="Check if an item is in user folders and favorites")
def check_item_status(
    item_type: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from models.favorite import Favorite
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_type == item_type,
        Favorite.item_id == item_id
    ).first()

    folders = (
        db.query(UserFolder)
        .filter(UserFolder.user_id == current_user.id)
        .order_by(UserFolder.created_at.desc())
        .all()
    )
    folder_list = []
    is_in_any_folder = False

    for f in folders:
        item = next((i for i in f.items if i.item_type == item_type and i.item_id == item_id), None)
        if item:
            is_in_any_folder = True
        folder_list.append({
            "id": str(f.id),
            "name": f.name,
            "color": f.color,
            "has_item": item is not None,
            "folder_item_id": str(item.id) if item else None,
        })

    return {
        "is_favorite": fav is not None,
        "favorite_id": str(fav.id) if fav else None,
        "is_in_any_folder": is_in_any_folder,
        "is_saved": (fav is not None) or is_in_any_folder,
        "folders": folder_list
    }


@router.get("/{folder_id}", response_model=dict, summary="Get folder with items and files")
def get_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    folder = db.query(UserFolder).filter(
        UserFolder.id == fid, UserFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="المجلد غير موجود")
    result = _folder_out(folder)
    result["items"] = [_item_out(i) for i in folder.items]
    result["files"] = [_file_out(f) for f in folder.files]
    return result


@router.put("/{folder_id}", response_model=dict, summary="Update folder name/color/icon")
def update_folder(
    folder_id: str,
    payload: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    folder = db.query(UserFolder).filter(
        UserFolder.id == fid, UserFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="المجلد غير موجود")

    if payload.name is not None:
        folder.name = payload.name
    if payload.description is not None:
        folder.description = payload.description
    if payload.color is not None:
        folder.color = payload.color
    if payload.icon is not None:
        folder.icon = payload.icon

    db.commit()
    db.refresh(folder)
    return _folder_out(folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a folder")
def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    folder = db.query(UserFolder).filter(
        UserFolder.id == fid, UserFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="المجلد غير موجود")

    # Clean up physical files folder if exists
    folder_dir = os.path.join("static", "uploads", "folders", str(fid))
    if os.path.exists(folder_dir):
        try:
            shutil.rmtree(folder_dir)
        except Exception:
            pass

    db.delete(folder)
    db.commit()


# ─── Upload Files to Folder ──────────────────────────────────────────────────

@router.post(
    "/{folder_id}/upload",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file from device into folder"
)
async def upload_file_to_folder(
    folder_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    folder = db.query(UserFolder).filter(
        UserFolder.id == fid, UserFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="المجلد غير موجود")

    raw_filename = os.path.basename(file.filename or "file")
    _, ext = os.path.splitext(raw_filename)
    ext = ext.lower()

    allowed_extensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.txt', '.csv', '.rtf', '.png', '.jpg', '.jpeg', '.webp',
        '.svg', '.zip', '.rar', '.7z'
    ]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"صيغة الملف غير مسموح بها. الصيغ المسموح بها: {', '.join(allowed_extensions)}"
        )

    upload_dir = os.path.join("static", "uploads", "folders", str(fid))
    os.makedirs(upload_dir, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(upload_dir, stored_name)
    web_path = f"/static/uploads/folders/{str(fid)}/{stored_name}"

    try:
        content = await file.read()
        file_size = len(content)

        # 50 MB max
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="حجم الملف يتجاوز الحد المسموح (50 ميجابايت)"
            )

        with open(full_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في حفظ الملف: {str(e)}"
        )

    folder_file = UserFolderFile(
        folder_id=fid,
        user_id=current_user.id,
        original_filename=raw_filename,
        file_path=web_path,
        file_size=file_size,
        content_type=file.content_type or "application/octet-stream"
    )
    db.add(folder_file)
    db.commit()
    db.refresh(folder_file)

    return _file_out(folder_file)


@router.delete(
    "/{folder_id}/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file from folder"
)
def delete_file_from_folder(
    folder_id: str,
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    file_uuid = _parse_uuid(file_id, "معرف الملف")

    folder_file = db.query(UserFolderFile).filter(
        UserFolderFile.id == file_uuid,
        UserFolderFile.folder_id == fid,
        UserFolderFile.user_id == current_user.id
    ).first()

    if not folder_file:
        raise HTTPException(status_code=404, detail="الملف غير موجود")

    # Remove file on disk
    rel_path = folder_file.file_path.lstrip('/')
    if os.path.exists(rel_path):
        try:
            os.remove(rel_path)
        except Exception:
            pass

    db.delete(folder_file)
    db.commit()


# ─── Folder Platform Items ───────────────────────────────────────────────────

@router.post("/{folder_id}/items", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Add item to folder")
def add_item_to_folder(
    folder_id: str,
    payload: FolderItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    folder = db.query(UserFolder).filter(
        UserFolder.id == fid, UserFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="المجلد غير موجود")

    existing = db.query(UserFolderItem).filter(
        UserFolderItem.folder_id == fid,
        UserFolderItem.item_type == payload.item_type,
        UserFolderItem.item_id == payload.item_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="العنصر موجود بالفعل في هذا المجلد")

    item = UserFolderItem(
        folder_id=fid,
        user_id=current_user.id,
        item_type=payload.item_type,
        item_id=payload.item_id,
        title=payload.title,
        subtitle=payload.subtitle,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _item_out(item)


@router.delete("/{folder_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove item from folder")
def remove_item_from_folder(
    folder_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fid = _parse_uuid(folder_id, "معرف المجلد")
    iid = _parse_uuid(item_id, "معرف العنصر")

    item = db.query(UserFolderItem).filter(
        UserFolderItem.id == iid,
        UserFolderItem.folder_id == fid,
        UserFolderItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="العنصر غير موجود في المجلد")

    db.delete(item)
    db.commit()


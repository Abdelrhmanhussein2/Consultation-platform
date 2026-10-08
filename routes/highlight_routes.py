"""
Highlight Routes - User highlights and notes on laws / regulations.
Allows users to save, retrieve, star, and delete text highlights and notes.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from helpers.database import get_db
from models.user import User
from models.user_highlight import UserHighlight
from routes.deps import get_current_active_user

router = APIRouter(prefix="/highlights", tags=["User Highlights"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class HighlightCreate(BaseModel):
    law_id: str = Field(..., description="Law/regulation ID")
    art_num: Optional[int] = 1
    art_title: Optional[str] = None
    text: str = Field(..., min_length=1)
    color: Optional[str] = "#3B82F6"
    bg_tint: Optional[str] = "#DBEAFE"
    note: Optional[str] = None
    starred: Optional[bool] = False


class HighlightUpdate(BaseModel):
    note: Optional[str] = None
    color: Optional[str] = None
    bg_tint: Optional[str] = None
    starred: Optional[bool] = None


class HighlightOut(BaseModel):
    id: str
    user_id: str
    law_id: str
    art_num: Optional[int]
    art_title: Optional[str]
    text: str
    color: Optional[str]
    bg_tint: Optional[str]
    note: Optional[str]
    starred: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def _highlight_dict(hl: UserHighlight) -> dict:
    return {
        "id": str(hl.id),
        "user_id": str(hl.user_id),
        "law_id": hl.law_id,
        "art_num": hl.art_num,
        "art_title": hl.art_title,
        "text": hl.text,
        "color": hl.color or "#3B82F6",
        "bg_tint": hl.bg_tint or "#DBEAFE",
        "note": hl.note,
        "starred": bool(hl.starred),
        "created_at": hl.created_at,
        "updated_at": hl.updated_at,
    }


def _parse_uuid(raw: str) -> uuid.UUID:
    try:
        return uuid.UUID(raw)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف التحديد غير صالح"
        )


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[HighlightOut])
@router.get("/", response_model=List[HighlightOut])
def get_user_highlights(
    law_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve highlights for the current user, optionally filtered by law_id."""
    query = db.query(UserHighlight).filter(UserHighlight.user_id == current_user.id)
    if law_id:
        query = query.filter(UserHighlight.law_id == law_id)
    highlights = query.order_by(UserHighlight.created_at.desc()).all()
    return [_highlight_dict(h) for h in highlights]


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_highlight(
    payload: HighlightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new highlight / note for the current user."""
    from models.favorite import Favorite
    new_hl = UserHighlight(
        user_id=current_user.id,
        law_id=payload.law_id,
        art_num=payload.art_num,
        art_title=payload.art_title,
        text=payload.text.strip(),
        color=payload.color or "#3B82F6",
        bg_tint=payload.bg_tint or "#DBEAFE",
        note=payload.note.strip() if payload.note else None,
        starred=bool(payload.starred)
    )
    db.add(new_hl)
    db.commit()
    db.refresh(new_hl)

    # If starred on creation, also sync to Favorite
    if new_hl.starred:
        fav_title = new_hl.text if len(new_hl.text) <= 80 else (new_hl.text[:77] + "...")
        fav_sub = f"{new_hl.art_title or f'المادة {new_hl.art_num}'}"
        if new_hl.note:
            fav_sub += f" · {new_hl.note[:30]}"
        fav = Favorite(
            user_id=current_user.id,
            item_type="highlight",
            item_id=str(new_hl.id),
            title=fav_title,
            subtitle=fav_sub
        )
        db.add(fav)
        db.commit()

    return _highlight_dict(new_hl)


@router.delete("/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_highlight(
    highlight_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a highlight owned by the current user."""
    from models.favorite import Favorite
    hl_uuid = _parse_uuid(highlight_id)
    hl = db.query(UserHighlight).filter(
        UserHighlight.id == hl_uuid,
        UserHighlight.user_id == current_user.id
    ).first()
    if not hl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التحديد غير موجود")

    # Also clean up from favorites if it was starred
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_type == "highlight",
        Favorite.item_id == str(hl.id)
    ).first()
    if fav:
        db.delete(fav)

    db.delete(hl)
    db.commit()
    return


@router.post("/{highlight_id}/toggle-star")
@router.patch("/{highlight_id}/toggle-star")
def toggle_star_highlight(
    highlight_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Toggle starred status of a highlight and sync with user favorites."""
    from models.favorite import Favorite
    hl_uuid = _parse_uuid(highlight_id)
    hl = db.query(UserHighlight).filter(
        UserHighlight.id == hl_uuid,
        UserHighlight.user_id == current_user.id
    ).first()
    if not hl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التحديد غير موجود")

    hl.starred = not hl.starred

    # Sync with Favorites table so it appears under 'المفضلة' in My Folders
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_type == "highlight",
        Favorite.item_id == str(hl.id)
    ).first()

    if hl.starred:
        if not fav:
            fav_title = hl.text if len(hl.text) <= 80 else (hl.text[:77] + "...")
            fav_sub = f"{hl.art_title or f'المادة {hl.art_num}'}"
            if hl.note:
                fav_sub += f" · {hl.note[:30]}"
            new_fav = Favorite(
                user_id=current_user.id,
                item_type="highlight",
                item_id=str(hl.id),
                title=fav_title,
                subtitle=fav_sub
            )
            db.add(new_fav)
    else:
        if fav:
            db.delete(fav)

    db.commit()
    db.refresh(hl)
    return {"id": str(hl.id), "starred": hl.starred}


@router.patch("/{highlight_id}")
def update_highlight(
    highlight_id: str,
    payload: HighlightUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update fields of an existing highlight."""
    hl_uuid = _parse_uuid(highlight_id)
    hl = db.query(UserHighlight).filter(
        UserHighlight.id == hl_uuid,
        UserHighlight.user_id == current_user.id
    ).first()
    if not hl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التحديد غير موجود")
    if payload.note is not None:
        hl.note = payload.note.strip() if payload.note else None
    if payload.color is not None:
        hl.color = payload.color
    if payload.bg_tint is not None:
        hl.bg_tint = payload.bg_tint
    if payload.starred is not None:
        hl.starred = payload.starred
    db.commit()
    db.refresh(hl)
    return _highlight_dict(hl)

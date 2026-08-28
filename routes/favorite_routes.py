import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from models.user import User
from models.favorite import Favorite
from schemes import FavoriteOut, FavoriteToggle
from routes.deps import get_current_active_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.get(
    "/",
    response_model=List[FavoriteOut],
    summary="Get all favorites for the current user"
)
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Favorite).filter(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc()).all()

@router.post(
    "/toggle",
    status_code=status.HTTP_200_OK,
    summary="Toggle favorite status of an item (Add if not exists, remove if exists)"
)
def toggle_favorite(
    payload: FavoriteToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if this item is already favorited by the user
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.item_type == payload.item_type,
        Favorite.item_id == payload.item_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed", "item_id": payload.item_id}
    else:
        new_fav = Favorite(
            user_id=current_user.id,
            item_type=payload.item_type,
            item_id=payload.item_id,
            title=payload.title,
            subtitle=payload.subtitle
        )
        db.add(new_fav)
        db.commit()
        db.refresh(new_fav)
        return {"status": "added", "item_id": payload.item_id, "id": str(new_fav.id)}

@router.delete(
    "/{favorite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove an item from favorites"
)
def delete_favorite(
    favorite_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        fav_uuid = uuid.UUID(favorite_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف المفضلة غير صالح"
        )

    fav = db.query(Favorite).filter(Favorite.id == fav_uuid, Favorite.user_id == current_user.id).first()
    if not fav:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="العنصر غير موجود في المفضلة"
        )

    db.delete(fav)
    db.commit()
    return

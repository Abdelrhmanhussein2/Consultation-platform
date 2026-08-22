from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.orm import Session
from helpers.database import get_db
from models import User
from schemes import UserOut, UserProfileUpdate, ChangePasswordRequest
from controllers import UserController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut, summary="Get current user profile and settings")
def read_current_user(current_user: User = Depends(get_current_active_user)):
    """
    Returns details of the currently authenticated active user including role, entity type, company details, and preferences.
    """
    return UserController.get_profile(current_user)

@router.put("/me", response_model=UserOut, summary="Update user profile and settings")
def update_current_user(
    update_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates the authenticated user's profile details:
    - Name and phone number
    - Entity classification (individual, company, researcher)
    - Company name, tax number, and business sector
    - Preferences (language 'ar'/'en', email notifications, appointment reminders)
    """
    return UserController.update_profile(db, current_user, update_in)

@router.post("/me/change-password", status_code=status.HTTP_200_OK, summary="Change user password")
def change_password(
    pass_in: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Securely changes the user's password.
    Requires the correct current password and validates the new password strength.
    """
    return UserController.change_password(db, current_user, pass_in)

@router.post("/me/avatar", response_model=UserOut, status_code=status.HTTP_200_OK, summary="Upload user profile picture")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Uploads an avatar image file and updates the authenticated user's profile picture.
    Accepts standard image formats (JPEG, PNG, WEBP, GIF) up to 5MB.
    """
    file_bytes = await file.read()
    return UserController.upload_avatar(
        db=db,
        current_user=current_user,
        file_bytes=file_bytes,
        filename=file.filename,
        content_type=file.content_type
    )

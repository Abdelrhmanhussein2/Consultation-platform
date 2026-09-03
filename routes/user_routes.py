from fastapi import APIRouter, Depends, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import redis
from helpers.database import get_db
from helpers.redis_client import get_redis
from models import User
from schemes import (
    UserOut, UserProfileUpdate, ChangePasswordRequest,
    EmailChangeRequest, EmailChangeVerify, PhoneChangeRequest, PhoneChangeVerify,
    VerifyMyPasswordOtpAndResetRequest
)
from controllers import UserController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut, summary="Get current user profile and settings")
def read_current_user(current_user: User = Depends(get_current_active_user)):
    """
    Returns details of the currently authenticated active user including role, entity type, company details, and preferences.
    """
    return UserController.get_profile(current_user)

@router.put("/me", response_model=UserOut, summary="Update user profile and settings (PUT)")
@router.patch("/me", response_model=UserOut, summary="Update user profile and settings (PATCH)")
def update_current_user(
    update_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates the authenticated user's profile details (supports both PUT and PATCH):
    - Name and phone number
    - Entity classification (individual, company, researcher)
    - Company name, tax number, and business sector
    - Preferences (language 'ar'/'en', email notifications, appointment reminders)
    """
    return UserController.update_profile(db, current_user, update_in)


@router.post("/me/change-password", status_code=status.HTTP_200_OK, summary="Change user password with current password")
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

@router.post("/me/email/request-change", status_code=status.HTTP_200_OK, summary="Request email change with OTP verification")
def request_email_change(
    req_in: EmailChangeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiates changing the authenticated user's email.
    Requires the current password for security and sends a 6-digit OTP code to the new email address.
    """
    return UserController.request_email_change(
        db=db,
        current_user=current_user,
        req_in=req_in,
        redis_client=redis_client,
        background_tasks=background_tasks
    )

@router.post("/me/email/verify-change", status_code=status.HTTP_200_OK, summary="Verify OTP and complete email change")
def verify_email_change(
    verify_in: EmailChangeVerify,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verifies the OTP code sent to the new email address, updates the email in the profile,
    and dispatches a security notification to the old email.
    """
    return UserController.verify_email_change(
        db=db,
        current_user=current_user,
        verify_in=verify_in,
        redis_client=redis_client,
        background_tasks=background_tasks
    )

@router.post("/me/phone/request-change", status_code=status.HTTP_200_OK, summary="Request phone change with OTP verification")
def request_phone_change(
    req_in: PhoneChangeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiates changing the authenticated user's phone number by sending a 6-digit OTP code to the new phone.
    """
    return UserController.request_phone_change(
        db=db,
        current_user=current_user,
        req_in=req_in,
        redis_client=redis_client,
        background_tasks=background_tasks
    )

@router.post("/me/phone/verify-change", status_code=status.HTTP_200_OK, summary="Verify OTP and complete phone change")
def verify_phone_change(
    verify_in: PhoneChangeVerify,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verifies the OTP code sent to the new phone number and updates the user record.
    """
    return UserController.verify_phone_change(
        db=db,
        current_user=current_user,
        verify_in=verify_in,
        redis_client=redis_client
    )

@router.post("/me/password/request-otp", status_code=status.HTTP_200_OK, summary="Request password reset OTP for logged in user")
def request_my_password_otp(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Sends a 6-digit OTP code to the logged in user's email if they forgot their current password.
    """
    return UserController.request_my_password_otp(
        db=db,
        current_user=current_user,
        redis_client=redis_client,
        background_tasks=background_tasks
    )

@router.post("/me/password/verify-otp-and-reset", status_code=status.HTTP_200_OK, summary="Verify OTP and reset password for logged in user")
def verify_my_password_otp_and_reset(
    verify_in: VerifyMyPasswordOtpAndResetRequest,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verifies the 6-digit OTP code and updates the password for the currently logged in user.
    """
    return UserController.verify_my_password_otp_and_reset(
        db=db,
        current_user=current_user,
        verify_in=verify_in,
        redis_client=redis_client
    )

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

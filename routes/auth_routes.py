import uuid
import redis
from fastapi import APIRouter, Depends, Request, status, BackgroundTasks, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from helpers.redis_client import get_redis
from helpers.limiter import limiter
from helpers.config import settings
from schemes import (
    UserCreate, ConsultantRegister, UserLogin, Token, RefreshRequest, LogoutRequest,
    ForgotPasswordRequest, ResetPasswordRequest, SystemPolicyOut
)
from controllers.auth_controller import AuthController
from controllers.super_admin_controller import SuperAdminController
from routes.deps import get_current_token_payload

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
def register_user(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a standard client user. Returns access and refresh tokens.
    """
    return AuthController.register_user(db, user_in)

@router.post("/register/consultant", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
def register_consultant(
    request: Request, consultant_in: ConsultantRegister, db: Session = Depends(get_db)
):
    """
    Submits a consultant registration application for review.
    """
    return AuthController.register_consultant(db, consultant_in)

@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login(
    request: Request,
    login_in: UserLogin,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Authenticates a user and returns access and refresh tokens.
    """
    device_info = request.headers.get("user-agent")
    return AuthController.login(db, login_in, redis_client, device_info)

@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
def refresh(
    request: Request, refresh_in: RefreshRequest, db: Session = Depends(get_db)
):
    """
    Issues a new access and refresh token pair using Refresh Token Rotation.
    """
    device_info = request.headers.get("user-agent")
    return AuthController.refresh_tokens(db, refresh_in.refresh_token, device_info)

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    logout_in: LogoutRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_token_payload),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Logs out the current session by blacklisting the access token and revoking the refresh token.
    """
    return AuthController.logout(db, payload, logout_in.refresh_token, redis_client)

@router.post("/logout-all", status_code=status.HTTP_200_OK)
def logout_all(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_token_payload),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Logs out the user from all devices by revoking all associated refresh tokens.
    """
    user_id_str = payload.get("sub")
    user_uuid = uuid.UUID(user_id_str)
    return AuthController.logout_all(db, user_uuid, payload, redis_client)

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    forgot_in: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Initiates the forgot password workflow by sending a secure reset link via SMTP.
    """
    return AuthController.forgot_password(
        db=db,
        redis_client=redis_client,
        email=forgot_in.email,
        redirect_url=forgot_in.redirect_url,
        background_tasks=background_tasks
    )

@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    reset_in: ResetPasswordRequest,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Resets the password of the user using the token provided in the link.
    """
    return AuthController.reset_password(
        db=db,
        redis_client=redis_client,
        token=reset_in.token,
        new_password=reset_in.new_password
    )

@router.post("/upload-commercial-register", status_code=status.HTTP_201_CREATED, summary="Upload commercial register document (Anonymous)")
async def upload_commercial_register(
    file: UploadFile = File(...)
):
    """
    Publicly uploads a commercial register file (images or PDF) during registration.
    Accepts JPG, JPEG, PNG, WEBP, and PDF up to 10MB.
    """
    import os
    import uuid

    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الملف المرفوع يجب أن يكون صورة أو مستند PDF فقط"
        )

    # Limit file size (10 MB)
    max_size = 10 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حجم الملف يجب أن لا يتجاوز 10 ميجابايت"
        )

    # Validate and get extension
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".png"
        if "jpeg" in file.content_type:
            ext = ".jpg"
        elif "pdf" in file.content_type:
            ext = ".pdf"
        elif "webp" in file.content_type:
            ext = ".webp"

    ext = ext.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="صيغة الملف غير مدعومة. الصيغ المسموحة هي: JPG, JPEG, PNG, WEBP, PDF"
        )

    # Ensure output folder exists
    os.makedirs("static/documents", exist_ok=True)

    # Save file
    new_filename = f"cr_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join("static", "documents", new_filename)

    try:
        with open(filepath, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل حفظ الملف على الخادم: {e}"
        )

    # Return URL path
    return {"url": f"/static/documents/{new_filename}"}

@router.get(
    "/policies/active",
    response_model=List[SystemPolicyOut],
    summary="Get all current active system policies",
)
def get_active_policies(
    db: Session = Depends(get_db)
):
    """
    Retrieves all current active system policies and their contents for display to users.
    """
    return SuperAdminController.get_active_policies(db)

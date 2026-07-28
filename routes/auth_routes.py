import uuid
import redis
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from helpers.database import get_db
from helpers.redis_client import get_redis
from helpers.limiter import limiter
from helpers.config import settings
from schemes import (
    UserCreate, ConsultantRegister, UserLogin, Token, RefreshRequest, LogoutRequest
)
from controllers.auth_controller import AuthController
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

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from helpers.config import settings
from helpers.enums import UserRole, VerificationStatus
from schemes import UserCreate, ConsultantRegister, UserLogin
from services import UserService
from services.auth_utils import (
    verify_password, create_access_token, create_refresh_token,
    verify_refresh_token
)
from services.token_service import TokenService

class AuthController:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate):
        """
        Registers a standard client user and returns access and refresh tokens.
        """
        existing_user = UserService.get_user_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # User is created with UserRole.user explicitly
        db_user = UserService.create_user(db, user_in, role=UserRole.user)
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role.value})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
        
        # Store refresh token
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        TokenService.store_refresh_token(db, db_user.id, refresh_token, expires_at)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def register_consultant(db: Session, consultant_in: ConsultantRegister):
        """
        Registers a consultant. Consultant profile is created as pending.
        """
        existing_user = UserService.get_user_by_email(db, consultant_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user with role=consultant
        db_user = UserService.create_user(db, consultant_in, role=UserRole.consultant)
        
        # Update additional fields of consultant profile
        profile = db_user.profile
        if profile:
            if consultant_in.bio:
                profile.bio = consultant_in.bio
            if consultant_in.main_specialization_id is not None:
                profile.main_specialization_id = consultant_in.main_specialization_id
            db.commit()
            db.refresh(profile)
            
        return {
            "message": "تم تسجيل طلب الانضمام كمستشار بنجاح وهو قيد المراجعة حالياً من قبل الإدارة."
        }

    @staticmethod
    def login(db: Session, login_in: UserLogin, redis_client, device_info: str = None):
        """
        Verifies login credentials and generates access/refresh tokens.
        Checks if consultant is approved.
        """
        db_user = UserService.get_user_by_email(db, login_in.email)
        if not db_user or not verify_password(login_in.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive"
            )
            
        # Consultants must be approved to login
        if db_user.role == UserRole.consultant:
            if not db_user.profile or db_user.profile.verification_status != VerificationStatus.approved:
                status_val = db_user.profile.verification_status if db_user.profile else VerificationStatus.pending
                if status_val == VerificationStatus.pending:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="حساب المستشار الخاص بك قيد المراجعة حالياً من قبل الإدارة."
                    )
                elif status_val == VerificationStatus.rejected:
                    reason = db_user.profile.rejection_reason or "أوراق التقديم غير كافية."
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"تم رفض طلب انضمامك كمستشار. السبب: {reason}"
                    )
        
        access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role.value})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
        
        # Store refresh token in DB
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        TokenService.store_refresh_token(db, db_user.id, refresh_token, expires_at, device_info)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def refresh_tokens(db: Session, refresh_token_str: str, device_info: str = None):
        """
        Enforces Refresh Token Rotation. Verifies, revokes, and issues a new pair.
        """
        payload = verify_refresh_token(refresh_token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
            
        db_token = TokenService.get_valid_refresh_token(db, refresh_token_str)
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked, is invalid, or expired"
            )
            
        user_uuid = db_token.user_id
        user = UserService.get_user_by_id(db, user_uuid)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or not found"
            )
            
        # Rotate: Revoke the current refresh token
        TokenService.revoke_refresh_token(db, refresh_token_str)
        
        # Generate new tokens
        new_access_token = create_access_token(data={"sub": str(user_uuid), "role": user.role.value})
        new_refresh_token = create_refresh_token(data={"sub": str(user_uuid)})
        
        # Store the new refresh token in DB
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        TokenService.store_refresh_token(db, user_uuid, new_refresh_token, expires_at, device_info)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def logout(db: Session, payload: dict, refresh_token_str: str, redis_client):
        """
        Invalidates the current session. Blacklists access token and revokes refresh token.
        """
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now_ts)
            if ttl > 0:
                TokenService.blacklist_jti(redis_client, jti, ttl)
                
        TokenService.revoke_refresh_token(db, refresh_token_str)
        return {"detail": "Successfully logged out"}

    @staticmethod
    def logout_all(db: Session, user_uuid: uuid.UUID, payload: dict, redis_client):
        """
        Invalidates all sessions for a user by revoking all their DB refresh tokens.
        """
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now_ts)
            if ttl > 0:
                TokenService.blacklist_jti(redis_client, jti, ttl)
                
        TokenService.revoke_all_user_tokens(db, user_uuid)
        return {"detail": "Successfully logged out from all devices"}

import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from helpers.database import get_db
from helpers.redis_client import get_redis
from helpers.enums import UserRole, VerificationStatus
from services import UserService
from services.auth_utils import verify_access_token
from services.token_service import TokenService
from models import User
import redis

# Point oauth2 schema to the central login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Roles that are considered "consultant" for access control purposes
CONSULTANT_ROLES = {UserRole.consultant, UserRole.platform_consultant}
ADMIN_ROLES = {UserRole.admin, UserRole.super_admin}


def get_current_token_payload(
    token: str = Depends(oauth2_scheme),
    redis_client: redis.Redis = Depends(get_redis),
) -> dict:
    """
    Validates the bearer access token format and checks if it is blacklisted in Redis.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception

    jti = payload.get("jti")
    if not jti or TokenService.is_jti_blacklisted(redis_client, jti):
        raise credentials_exception

    return payload


def get_current_user(
    payload: dict = Depends(get_current_token_payload),
    db: Session = Depends(get_db),
) -> User:
    """
    Retrieves the User model corresponding to the validated token sub.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = UserService.get_user_by_id(db, user_uuid)
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Guards routes to ensure the current authenticated user is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return current_user


class RoleChecker:
    """
    FastAPI dependency factory for role-based access control.
    Consultants must have an approved profile to access consultant-only operations.
    """

    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this role",
            )
        # Consultants (including platform_consultants) must have an approved profile
        if current_user.role in CONSULTANT_ROLES:
            if (
                not current_user.profile
                or current_user.profile.verification_status != VerificationStatus.approved
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Consultant profile is pending approval or has been rejected",
                )
        return current_user


# ─────────────────────────────────────────────────────────────────────
# Predefined role dependency instances
# ─────────────────────────────────────────────────────────────────────

# Allows consultant + platform_consultant (both require an approved profile)
require_consultant = RoleChecker([UserRole.consultant, UserRole.platform_consultant])

# Allows platform_consultant only
require_platform_consultant = RoleChecker([UserRole.platform_consultant])

# Allows only regular clients
require_user = RoleChecker([UserRole.user])

# Allows admin and super_admin
require_admin = RoleChecker([UserRole.admin, UserRole.super_admin])

# Allows super_admin only
require_super_admin = RoleChecker([UserRole.super_admin])

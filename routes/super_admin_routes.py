from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import UserRole
from schemes import UserOut, ConsultantProfileOut, ConsultantApplicationAction
from controllers.super_admin_controller import SuperAdminController
from routes.deps import require_super_admin
from models import User

router = APIRouter(prefix="/super-admin", tags=["Super Administration"])

@router.get("/consultants/pending", response_model=List[ConsultantProfileOut])
def get_pending_consultants(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    """
    Lists all consultants awaiting review (Super Admin only).
    """
    return SuperAdminController.get_pending_consultants(db)

@router.post("/consultants/{user_id}/action", response_model=ConsultantProfileOut)
def handle_consultant_action(
    user_id: str,
    action_in: ConsultantApplicationAction,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    """
    Approves or rejects a consultant's application (Super Admin only).
    """
    return SuperAdminController.handle_consultant_action(
        db, user_id, action_in, current_super_admin.id
    )

@router.get("/users", response_model=List[UserOut])
def list_users(
    role: Optional[UserRole] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    """
    Retrieves a paginated list of all users, with optional role filter (Super Admin only).
    """
    return SuperAdminController.list_users(db, role, page, limit)

@router.post("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    """
    Toggles user active state to lock/unlock accounts (Super Admin only).
    """
    return SuperAdminController.toggle_user_active(db, user_id, current_super_admin.id)

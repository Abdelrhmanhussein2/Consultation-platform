from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import UserRole
from models import User
from schemes import (
    UserOut, ConsultantProfileOut, ConsultantApplicationAction,
    ServiceExpansionRequestOut, ServiceExpansionReviewAction,
)
from controllers.super_admin_controller import SuperAdminController
from controllers import ServiceExpansionController
from routes.deps import require_super_admin

router = APIRouter(prefix="/super-admin", tags=["Super Administration"])


# ─────────────────────────────────────────────────────────────────────
# CONSULTANT APPLICATION MANAGEMENT
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/consultants/pending",
    response_model=List[ConsultantProfileOut],
    summary="List pending consultant applications",
)
def get_pending_consultants(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """Lists all consultant profiles awaiting admin review."""
    return SuperAdminController.get_pending_consultants(db)


@router.post(
    "/consultants/{user_id}/action",
    response_model=ConsultantProfileOut,
    summary="Approve or reject a consultant application",
)
def handle_consultant_action(
    user_id: str,
    action_in: ConsultantApplicationAction,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """Approves or rejects a consultant's application."""
    return SuperAdminController.handle_consultant_action(
        db, user_id, action_in, current_super_admin.id
    )


# ─────────────────────────────────────────────────────────────────────
# SERVICE EXPANSION REQUEST MANAGEMENT
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/expansions/pending",
    response_model=List[ServiceExpansionRequestOut],
    summary="List pending service expansion requests",
)
def get_pending_expansions(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """
    Lists all consultant service expansion requests awaiting admin review.
    Expansion requests are submitted when a consultant wants to offer a service
    outside their registered specialization.
    """
    return ServiceExpansionController.list_pending(db, current_super_admin)


@router.post(
    "/expansions/{request_id}/action",
    response_model=ServiceExpansionRequestOut,
    summary="Approve or reject a service expansion request",
)
def review_expansion_request(
    request_id: str,
    action_in: ServiceExpansionReviewAction,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """
    Approves or rejects a service expansion request.
    On approval:
    - The consultant's role is upgraded to 'platform_consultant'.
    - The consultant is notified via the notifications system.
    - The consultant can then add an out-of-specialization service using this request ID.
    """
    return ServiceExpansionController.review_request(
        db, current_super_admin, request_id, action_in
    )


# ─────────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=List[UserOut],
    summary="List all users (with optional role filter)",
)
def list_users(
    role: Optional[UserRole] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """Returns a paginated list of all users, optionally filtered by role."""
    return SuperAdminController.list_users(db, role, page, limit)


@router.post(
    "/users/{user_id}/toggle-active",
    response_model=UserOut,
    summary="Enable or disable a user account",
)
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """Toggles a user's active state. Super admin cannot deactivate their own account."""
    return SuperAdminController.toggle_user_active(db, user_id, current_super_admin.id)

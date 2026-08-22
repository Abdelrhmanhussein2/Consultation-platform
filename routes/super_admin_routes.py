from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import UserRole, EntityType, NotificationAudience, NotificationType, TicketCategory, TicketPriority, TicketStatus
from models import User
from schemes import (
    UserOut, ConsultantProfileOut, ConsultantApplicationAction,
    ServiceExpansionRequestOut, ServiceExpansionReviewAction,
    UserStatsOut, AdminUserListOut, AdminAddUserRequest,
    AdminBroadcastNotification, BroadcastResultOut,
    AdminSessionOut, AdminSessionJoinOut,
    TicketOut, TicketReplyOut, AdminTicketCreate,
    AdminTicketReplyCreate, AdminTicketUpdate,
    AdminCreate, AdminUpdatePermissions,
    SystemPolicyOut, SystemPolicyCreate,
    ChangePasswordRequest
)
from controllers.super_admin_controller import SuperAdminController
from controllers import ServiceExpansionController, TicketController, AdminPermissionController, UserController
from routes.deps import (
    require_super_admin, require_admin,
    require_perm_manage_users, require_perm_manage_consultants,
    require_perm_manage_admins, require_perm_view_analytics,
    require_perm_reply_tickets, require_perm_manage_sessions,
    require_perm_send_notifications
)

router = APIRouter(prefix="/super-admin", tags=["Super Administration"])


# ─────────────────────────────────────────────────────────────────────
# CONSULTANT APPLICATION MANAGEMENT (require_super_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/consultants/pending",
    response_model=List[ConsultantProfileOut],
    summary="List pending consultant applications",
)
def get_pending_consultants(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_consultants),
):
    """Lists all consultant profiles awaiting admin review. Accessible by super_admin or admin with manage_consultants permission."""
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
    current_admin: User = Depends(require_perm_manage_consultants),
):
    """Approves or rejects a consultant's application. Accessible by super_admin or admin with manage_consultants permission."""
    return SuperAdminController.handle_consultant_action(
        db, user_id, action_in, current_admin.id
    )


# ─────────────────────────────────────────────────────────────────────
# SERVICE EXPANSION REQUEST MANAGEMENT (require_super_admin)
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
    """
    return ServiceExpansionController.review_request(
        db, current_super_admin, request_id, action_in
    )


# ─────────────────────────────────────────────────────────────────────
# USER MANAGEMENT (require_super_admin / require_admin)
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


# ─────────────────────────────────────────────────────────────────────
# USER STATS & ADVANCED SEARCH (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/stats/users",
    response_model=UserStatsOut,
    summary="Get users count stats by role and entity type",
)
def get_user_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_view_analytics)
):
    """
    Returns breakdown count of users grouped by role and entity type.
    """
    return SuperAdminController.get_user_stats(db)


@router.get(
    "/users/all",
    response_model=List[AdminUserListOut],
    summary="List all users with advanced multi-filters and search",
)
def list_all_users_admin(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[UserRole] = Query(None, description="Filter by User Role"),
    entity_type: Optional[EntityType] = Query(None, description="Filter by Entity Type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users)
):
    """
    Returns paginated list of all users on the platform with search keyword and role/entity/active status filtering.
    """
    return SuperAdminController.list_all_users_admin(
        db=db,
        search=search,
        role=role,
        entity_type=entity_type,
        is_active=is_active,
        page=page,
        limit=limit
    )


@router.post(
    "/users/add",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Directly register user or consultant as approved",
)
def admin_add_user(
    user_in: AdminAddUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users)
):
    """
    Directly adds a user (standard client or consultant) with approved status to the system.
    """
    return SuperAdminController.admin_add_user(db, user_in)


# ─────────────────────────────────────────────────────────────────────
# SESSION MANAGEMENT (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/sessions",
    response_model=List[AdminSessionOut],
    summary="View all consultation sessions (live/completed)",
)
def admin_get_all_sessions(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_sessions)
):
    """
    Lists all consultation sessions that are confirmed or completed, showing user metadata and links.
    """
    return SuperAdminController.admin_get_all_sessions(db)


@router.post(
    "/sessions/{appointment_id}/join",
    response_model=AdminSessionJoinOut,
    summary="Get join room token as observer",
)
def admin_join_session(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_sessions)
):
    """
    Creates a Daily.co meeting token with observer status (is_owner=False) for the admin to enter the session room.
    """
    return SuperAdminController.admin_join_session(db, appointment_id, current_admin)


# ─────────────────────────────────────────────────────────────────────
# MASS NOTIFICATIONS (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/notifications/broadcast",
    response_model=BroadcastResultOut,
    summary="Send broadcast notification to target audience",
)
def broadcast_notification(
    broadcast_in: AdminBroadcastNotification,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_send_notifications)
):
    """
    Broadcasts a notification message to the chosen target audience (e.g. all, consultants, companies, etc.)
    """
    return SuperAdminController.broadcast_notification(db, broadcast_in)


# ─────────────────────────────────────────────────────────────────────
# SUPPORT TICKETS MANAGEMENT (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/tickets",
    response_model=List[TicketOut],
    summary="List all support tickets with filtering",
)
def admin_list_tickets(
    status_val: Optional[TicketStatus] = Query(None, alias="status", description="Filter by status"),
    category: Optional[TicketCategory] = Query(None, description="Filter by category"),
    priority: Optional[TicketPriority] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search subject, description, or submitter name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_reply_tickets)
):
    """
    Admin list and filter support tickets.
    """
    return TicketController.admin_list_tickets(
        db=db,
        status_val=status_val,
        category=category,
        priority=priority,
        search=search,
        page=page,
        limit=limit
    )


@router.post(
    "/tickets",
    response_model=TicketOut,
    status_code=status.HTTP_201_CREATED,
    summary="Admin create ticket on behalf of user",
)
def admin_create_ticket(
    ticket_in: AdminTicketCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_reply_tickets)
):
    """
    Admin logs a ticket directly, optionally setting priority and assignee.
    """
    return TicketController.admin_create_ticket(db, current_admin.id, ticket_in)


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketOut,
    summary="View full ticket details with internal replies",
)
def admin_get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_reply_tickets)
):
    """
    Gets full support ticket details, including internal replies/notes.
    """
    return TicketController.admin_get_ticket(db, ticket_id)


@router.post(
    "/tickets/{ticket_id}/reply",
    response_model=TicketReplyOut,
    status_code=status.HTTP_201_CREATED,
    summary="Admin reply to support ticket",
)
def admin_reply_ticket(
    ticket_id: str,
    reply_in: AdminTicketReplyCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_reply_tickets)
):
    """
    Adds a reply to the ticket, optionally marking it as is_internal.
    """
    return TicketController.admin_reply(db, ticket_id, current_admin.id, reply_in)


@router.patch(
    "/tickets/{ticket_id}",
    response_model=TicketOut,
    summary="Update support ticket status, priority, note or assignee",
)
def admin_update_ticket(
    ticket_id: str,
    update_in: AdminTicketUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_reply_tickets)
):
    """
    Updates admin-only fields on a support ticket.
    """
    return TicketController.admin_update_ticket(db, ticket_id, current_admin.id, update_in)


# ─────────────────────────────────────────────────────────────────────
# ADMIN ROLE-BASED ACCESS CONTROL (require_perm_manage_admins)
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/admins",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new administrator with permissions",
)
def create_admin(
    admin_in: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Creates a new administrator account with a specific set of granular permissions.
    """
    return AdminPermissionController.create_admin(db, admin_in)


@router.get(
    "/admins",
    response_model=List[UserOut],
    summary="List all administrators",
)
def list_admins(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Lists all administrator accounts in the system.
    """
    return AdminPermissionController.list_admins(db)


@router.patch(
    "/admins/{admin_id}/permissions",
    response_model=UserOut,
    summary="Update permissions for an administrator",
)
def update_admin_permissions(
    admin_id: str,
    permissions_in: AdminUpdatePermissions,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Updates the list of granular permissions assigned to a specific administrator.
    """
    return AdminPermissionController.update_admin_permissions(db, admin_id, permissions_in)


# ─────────────────────────────────────────────────────────────────────
# USER REVIEW & PRIVACY POLICY MANAGEMENT (require_super_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/users/pending",
    response_model=List[UserOut],
    summary="List all pending standard user registration applications",
)
def get_pending_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """
    Lists all standard client registration requests awaiting admin approval.
    Accessible by super_admin or admin with manage_users permission.
    """
    return SuperAdminController.get_pending_users(db)


@router.post(
    "/users/{user_id}/action",
    response_model=UserOut,
    summary="Approve or reject a standard user or consultant application",
)
def handle_user_action(
    user_id: str,
    action_in: ConsultantApplicationAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """
    Approves or rejects a user account (standard client or consultant) by ID.
    Accessible by super_admin or admin with manage_users permission.
    """
    return SuperAdminController.handle_user_action(
        db, user_id, action_in, current_admin.id
    )


@router.post(
    "/policies",
    response_model=SystemPolicyOut,
    summary="Create and activate a new system policy version",
)
def create_system_policy(
    policy_in: SystemPolicyCreate,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """
    Creates a new system policy version and marks it as active (deactivating all others of same type).
    """
    return SuperAdminController.create_system_policy(
        db, policy_in.title, policy_in.policy_type, policy_in.version, policy_in.content
    )


@router.get(
    "/policies",
    response_model=List[SystemPolicyOut],
    summary="List all versions of system policies",
)
def list_system_policies(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin),
):
    """
    Returns a history of all system policies created on the platform.
    """
    return SuperAdminController.list_system_policies(db)


# ─────────────────────────────────────────────────────────────────────
# ADMIN ACCOUNT SELF-MANAGEMENT
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change admin account password (requires current password)",
)
def admin_change_password(
    pass_in: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Allows an authenticated admin or super_admin to change their own password.
    Requires the correct current password before accepting the new one.
    """
    return UserController.change_password(db, current_admin, pass_in)

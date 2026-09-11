from fastapi import APIRouter, Depends, status, Query, Body, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

from helpers.database import get_db
from helpers.enums import UserRole, EntityType, NotificationAudience, NotificationType, TicketCategory, TicketPriority, TicketStatus
from models import User
from schemes import (
    UserOut, ConsultantProfileOut, ConsultantApplicationAction,
    ServiceExpansionRequestOut, ServiceExpansionReviewAction,
    CredentialOut, CredentialReview,
    UserStatsOut, AdminUserListOut, AdminAddUserRequest,
    AdminUpdateUserRequest, AdminResetPasswordRequest,
    AdminBroadcastNotification, BroadcastResultOut,
    AdminSessionOut, AdminSessionJoinOut, AdminUpdateSessionStatus,
    TicketOut, TicketReplyOut, AdminTicketCreate,
    AdminTicketReplyCreate, AdminTicketUpdate,
    AdminCreate, AdminUpdatePermissions,
    SystemPolicyOut, SystemPolicyCreate,
    ChangePasswordRequest, PayoutRequestOut, AdminPayoutAction,
    BrandSettingsSchema, SystemSettingsSchema, CompanySettingsSchema,
    CurrencySettingsSchema, ContractSettingsSchema, SMTPSettingsSchema,
    BankTransferGatewaySchema, CliQGatewaySchema, PaymentGatewaysSchema,
    SMSSettingsSchema, AISettingsSchema, PoliciesSettingsSchema,
    AllPlatformSettingsOut, TestEmailRequest, TestEmailResponse
)
from schemes.automation_rule_schemas import AutomationRuleCreate, AutomationRuleUpdate, AutomationRuleOut
from schemes.ai_control_schemas import AIServiceConfigUpdate
from services.super_admin.admin_automation_service import AdminAutomationService
from services.super_admin.admin_r360_service import AdminR360Service
from services.super_admin.admin_ai_control_service import AdminAIControlService
from controllers.super_admin_controller import SuperAdminController
from controllers.platform_settings_controller import PlatformSettingsController
from controllers import ServiceExpansionController, TicketController, AdminPermissionController, UserController
from routes.deps import (
    require_super_admin, require_admin,
    require_perm_manage_users, require_perm_manage_consultants,
    require_perm_manage_admins, require_perm_view_analytics,
    require_perm_reply_tickets, require_perm_manage_sessions,
    require_perm_send_notifications, require_perm_manage_payouts,
    require_perm_manage_settings
)

router = APIRouter(prefix="/super-admin", tags=["Super Administration"])


# ─────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/dashboard/stats",
    summary="Get live command center dashboard statistics",
)
def get_dashboard_stats(
    period: str = Query("week", description="Dashboard aggregation period (day, week, month, quarter, half, year)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Retrieves real-time dashboard KPIs, city distribution, AI consumption, and income trends from DB."""
    return SuperAdminController.get_dashboard_stats(db, period)


# ─────────────────────────────────────────────────────────────────────
# CONSULTANT CREDENTIAL MANAGEMENT (require_perm_manage_consultants)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/credentials/pending",
    response_model=List[CredentialOut],
    summary="List all pending consultant credentials and specialization proofs",
)
def get_pending_credentials(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_consultants),
):
    """Lists all consultant specialization and certificate documents awaiting admin review."""
    return SuperAdminController.list_pending_credentials(db)


@router.post(
    "/credentials/{credential_id}/action",
    response_model=CredentialOut,
    summary="Approve or reject a consultant credential submission",
)
def review_credential(
    credential_id: str,
    review_in: CredentialReview,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_consultants),
):
    """Approves or rejects a consultant's qualification document/specialization change with notification."""
    return SuperAdminController.review_credential(db, current_admin, credential_id, review_in)



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
    response_model=List[AdminUserListOut],
    summary="List all users with full metadata",
)
def list_users(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[UserRole] = Query(None, description="Filter by User Role"),
    entity_type: Optional[EntityType] = Query(None, description="Filter by Entity Type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Results per page"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Returns a paginated list of all users with full profile metadata."""
    return SuperAdminController.list_all_users_admin(
        db=db,
        search=search,
        role=role,
        entity_type=entity_type,
        is_active=is_active,
        page=page,
        limit=limit
    )


@router.get(
    "/users/{user_id}/full-profile",
    summary="Get complete real user profile with real documents, appointments, subscriptions, and logs",
)
def get_user_full_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Returns complete real database profile for a user."""
    return SuperAdminController.get_user_full_profile(db, user_id)


@router.post(
    "/users/add",
    response_model=UserOut,
    summary="Directly create and approve a new client or consultant",
)
def admin_add_user(
    user_in: AdminAddUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """
    Directly registers a client or consultant into PostgreSQL with approved status.
    """
    return SuperAdminController.admin_add_user(db, user_in)


@router.post(
    "/users/{user_id}/toggle-active",
    response_model=UserOut,
    summary="Enable or disable a user account",
)
@router.patch(
    "/users/{user_id}/toggle-active",
    response_model=UserOut,
    summary="Enable or disable a user account (PATCH)",
)
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Toggles a user's active state. Super admin cannot deactivate their own account."""
    return SuperAdminController.toggle_user_active(db, user_id, current_admin.id)


@router.patch(
    "/users/{user_id}/profile",
    summary="Update a user's profile metadata and settings in real time",
)
@router.post(
    "/users/{user_id}/profile",
    summary="Update a user's profile metadata and settings (POST alias)",
)
@router.put(
    "/users/{user_id}/profile",
    summary="Update a user's profile metadata and settings (PUT alias)",
)
def update_user_profile(
    user_id: str,
    update_in: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Updates user profile attributes (name, phone, title, taxNo, regNo, entity, sector, active status) in PostgreSQL."""
    return SuperAdminController.admin_update_user_profile(db, user_id, update_in, current_admin)


@router.post(
    "/users/{user_id}/reset-password",
    summary="Admin reset user password directly or dispatch reset link",
)
def reset_user_password(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Directly sets a new bcrypt hashed password or dispatches a reset notification link."""
    return SuperAdminController.admin_reset_user_password(db, user_id, payload, current_admin)


@router.delete(
    "/users/{user_id}",
    summary="Delete or deactivate user permanently from platform",
)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Removes a user account and profile from the database."""
    return SuperAdminController.admin_delete_user(db, user_id, current_admin)


@router.get(
    "/login-history",
    summary="Get user login history and session activity records",
)
def get_login_history(
    year: Optional[str] = Query(None, description="Filter by Year"),
    month: Optional[str] = Query(None, description="Filter by Month"),
    user_id: Optional[str] = Query(None, description="Filter by User ID"),
    search: Optional[str] = Query(None, description="Search keyword"),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Returns login audit history with IP, browser, device, OS, location, and status."""
    return SuperAdminController.admin_get_login_history(db, year, month, user_id, search, page, limit)


@router.delete(
    "/login-history/{log_id}",
    summary="Delete a login history log record",
)
def delete_login_history(
    log_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Deletes an audit entry from database."""
    return SuperAdminController.admin_delete_login_history(db, log_id, current_admin)


@router.get(
    "/account-roles",
    summary="Get corporate account roles and permissions",
)
def get_account_roles(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Returns corporate account roles and their associated permissions."""
    return SuperAdminController.admin_get_account_roles(db)


@router.post(
    "/account-roles",
    summary="Save / update corporate account roles list",
)
@router.put(
    "/account-roles",
    summary="Save / update corporate account roles list (PUT)",
)
def save_account_roles(
    roles_in: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Saves customized corporate account roles into platform settings."""
    return SuperAdminController.admin_save_account_roles(db, roles_in, current_admin)


@router.get(
    "/sessions",
    summary="Get all platform consultation sessions / appointments",
)
def get_admin_sessions(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Returns all appointments / sessions across all consultants and clients."""
    return SuperAdminController.admin_get_sessions(db)


@router.patch(
    "/sessions/{appointment_id}/status",
    summary="Update session status (e.g. Kanban drag & drop)",
)
def update_admin_session_status(
    appointment_id: str,
    status_in: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Updates status of a session."""
    return SuperAdminController.admin_update_session_status(db, appointment_id, status_in, current_admin)


@router.post(
    "/sessions/{appointment_id}/join",
    summary="Join session as admin observer/moderator",
)
def admin_join_session_room(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Generates observer token for admin to join video call."""
    return SuperAdminController.admin_join_session(db, appointment_id, current_admin)




# ─────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────
# ANALYTICS & REPORTS (require_perm_view_analytics)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/analytics/reports",
    summary="Get comprehensive platform reports and analytics dataset",
)
def get_reports_analytics(
    category: str = Query("executive", description="Report Category"),
    from_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    user_type: Optional[str] = Query(None, description="User type filter"),
    sector: Optional[str] = Query(None, description="Sector filter"),
    city: Optional[str] = Query(None, description="City filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_view_analytics)
):
    """
    Returns live aggregated reports, KPI metrics, chart series, and drilldown records.
    """
    return SuperAdminController.get_reports_analytics(
        db=db,
        category=category,
        from_date=from_date,
        to_date=to_date,
        user_type=user_type,
        sector=sector,
        city=city,
        status=status
    )


@router.get(
    "/dashboard/stats",
    summary="Get live aggregated KPI stats, queue, and charts for Admin Command Center",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_view_analytics)
):
    """
    Returns live aggregated stats from the database for the Admin Command Center dashboard.
    """
    return SuperAdminController.get_dashboard_stats(db)


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


@router.patch(
    "/sessions/{appointment_id}/status",
    summary="Update session/appointment status (e.g. from Kanban drag & drop)",
)
def admin_update_session_status(
    appointment_id: str,
    status_in: AdminUpdateSessionStatus,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_sessions)
):
    """
    Updates appointment status dynamically with real-time sync.
    """
    return SuperAdminController.admin_update_session_status(db, appointment_id, status_in.status)



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
# DYNAMIC RBAC ROLES & USER ROLE ASSIGNMENT
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/roles",
    summary="Get all dynamic RBAC roles",
)
def get_rbac_roles(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Returns all defined RBAC roles from database.
    """
    return AdminPermissionController.get_rbac_roles(db)


@router.post(
    "/roles",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new RBAC role",
)
def create_rbac_role(
    role_in: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Creates a new custom RBAC role and persists to database.
    """
    return AdminPermissionController.create_rbac_role(db, role_in, current_admin.id)


@router.patch(
    "/roles/{role_id}",
    summary="Update an existing RBAC role",
)
def update_rbac_role(
    role_id: str,
    role_in: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Updates role name, description, status, or permissions.
    """
    return AdminPermissionController.update_rbac_role(db, role_id, role_in, current_admin.id)


@router.delete(
    "/roles/{role_id}",
    summary="Delete an RBAC role",
)
def delete_rbac_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Deletes an RBAC role from the database.
    """
    return {"success": AdminPermissionController.delete_rbac_role(db, role_id, current_admin.id)}


@router.post(
    "/users/{user_id}/assign-role",
    summary="Assign or change role for a user/consultant with instant notification",
)
def assign_user_role(
    user_id: str,
    assignment_in: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """
    Assigns role to user/consultant, logs security audit, and dispatches real-time notification to the user.
    """
    return AdminPermissionController.assign_user_role(
        db=db,
        user_id=user_id,
        role_name=assignment_in.get("role_name", "مستخدم"),
        role_type=assignment_in.get("role_type", "user"),
        permissions=assignment_in.get("permissions"),
        current_admin_id=current_admin.id
    )


@router.get(
    "/audit-logs",
    summary="Get recent security audit logs",
)
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_admins),
):
    """
    Returns recent system audit trail logs from database.
    """
    from models import AdminActionLog
    logs = db.query(AdminActionLog).order_by(AdminActionLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(log.id),
            "admin_id": str(log.admin_id),
            "admin_name": log.admin.full_name if log.admin else "مدير النظام",
            "action": log.action_type,
            "resource": log.target_entity_type,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]



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
# PAYOUT REQUESTS MANAGEMENT (require_perm_manage_payouts)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/payouts",
    response_model=List[PayoutRequestOut],
    summary="List and filter all consultant payout requests",
)
def admin_list_payouts(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, transferred, rejected, cancelled"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """
    Lists all consultant payout requests with bank snapshots, amounts, and statuses.
    Allows filtering by status.
    """
    return SuperAdminController.list_payouts(db, status=status, limit=limit, offset=offset)


@router.post(
    "/payouts/{payout_id}/action",
    response_model=PayoutRequestOut,
    summary="Process a payout request (approve, transfer, or reject)",
)
def admin_process_payout(
    payout_id: str,
    action_in: AdminPayoutAction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """
    Processes a consultant's payout request:
    - 'approve': Accepts the request and marks it ready for wire transfer.
    - 'transfer': Marks the payout as transferred (requires transfer_reference or receipt_url).
    - 'reject': Rejects the request with a mandatory explanation note.
    Automatically sends an in-app notification to the consultant.
    """
    return SuperAdminController.process_payout(db, payout_id, current_admin, action_in)


@router.get(
    "/payments",
    summary="List all payments, invoices, and payout transfers combined",
)
def admin_list_payments(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """
    Returns unified list of customer payments, invoices, and consultant payouts.
    """
    return SuperAdminController.list_all_payments_transfers(db)


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


# ─────────────────────────────────────────────────────────────────────
# PLATFORM & SYSTEM SETTINGS ECOSYSTEM (PHASE 4)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/settings",
    response_model=AllPlatformSettingsOut,
    summary="Get all platform settings with masked credentials",
)
def get_all_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """
    Returns full platform settings across all 7 sections (brand, system, company,
    currencies, contract prefixes, SMTP mailer, and payment gateways) with secret masking.
    """
    return PlatformSettingsController.get_admin_settings(db)


@router.put(
    "/settings/brand",
    response_model=BrandSettingsSchema,
    summary="Update brand settings (logos, titles, theme color)",
)
@router.patch(
    "/settings/brand",
    response_model=BrandSettingsSchema,
    summary="Update brand settings (PATCH)",
)
def update_brand_settings(
    brand_in: BrandSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates branding, logo URLs, favicon, default language/direction, and primary color."""
    return PlatformSettingsController.update_section(db, "brand", brand_in.model_dump(), current_admin)


@router.put(
    "/settings/system",
    response_model=SystemSettingsSchema,
    summary="Update system display & date/time formatting settings",
)
@router.patch(
    "/settings/system",
    response_model=SystemSettingsSchema,
    summary="Update system display & date/time formatting settings (PATCH)",
)
def update_system_settings(
    system_in: SystemSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates time format, timezone, currency codes, symbol position, and number separators."""
    return PlatformSettingsController.update_section(db, "system", system_in.model_dump(), current_admin)


@router.put(
    "/settings/company",
    response_model=CompanySettingsSchema,
    summary="Update company / platform legal & contact details",
)
@router.patch(
    "/settings/company",
    response_model=CompanySettingsSchema,
    summary="Update company / platform legal & contact details (PATCH)",
)
def update_company_settings(
    company_in: CompanySettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates company commercial name, tax registration number, office address, and support contact."""
    return PlatformSettingsController.update_section(db, "company", company_in.model_dump(), current_admin)


@router.put(
    "/settings/currency",
    response_model=CurrencySettingsSchema,
    summary="Update active currencies and exchange conversion rates",
)
@router.patch(
    "/settings/currency",
    response_model=CurrencySettingsSchema,
    summary="Update active currencies and exchange conversion rates (PATCH)",
)
def update_currency_settings(
    currency_in: CurrencySettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates supported currencies (JOD, USD, etc.), default currency flag, and exchange rate multipliers."""
    return PlatformSettingsController.update_section(db, "currency", currency_in.model_dump(), current_admin)


@router.put(
    "/settings/contract",
    response_model=ContractSettingsSchema,
    summary="Update contract & invoice formatting and number prefixes",
)
@router.patch(
    "/settings/contract",
    response_model=ContractSettingsSchema,
    summary="Update contract & invoice formatting and number prefixes (PATCH)",
)
def update_contract_settings(
    contract_in: ContractSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates contract prefix (#CON-), invoice prefix (#INV-), digit padding, and legal terms template."""
    return PlatformSettingsController.update_section(db, "contract", contract_in.model_dump(), current_admin)


@router.put(
    "/settings/smtp",
    response_model=SMTPSettingsSchema,
    summary="Update SMTP email server configuration",
)
@router.patch(
    "/settings/smtp",
    response_model=SMTPSettingsSchema,
    summary="Update SMTP email server configuration (PATCH)",
)
def update_smtp_settings(
    smtp_in: SMTPSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates SMTP host, port, username, password, encryption protocol (TLS/SSL), and sender identity."""
    return PlatformSettingsController.update_section(db, "smtp", smtp_in.model_dump(), current_admin)


@router.put(
    "/settings/gateways",
    response_model=PaymentGatewaysSchema,
    summary="Update payment gateway configurations (Bank Transfer, PayPal, Stripe)",
)
@router.patch(
    "/settings/gateways",
    response_model=PaymentGatewaysSchema,
    summary="Update payment gateway configurations (PATCH)",
)
def update_payment_gateways(
    gateways_in: PaymentGatewaysSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates payment methods: Bank Wire details, PayPal Sandbox/Live keys, and Stripe test/live credentials."""
    return PlatformSettingsController.update_section(db, "gateways", gateways_in.model_dump(), current_admin)



@router.put(
    "/settings/sms",
    response_model=SMSSettingsSchema,
    summary="Update local SMS gateway and OTP configurations",
)
@router.patch(
    "/settings/sms",
    response_model=SMSSettingsSchema,
    summary="Update SMS settings (PATCH)",
)
def update_sms_settings(
    sms_in: SMSSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates SMS gateway provider, API key, sender ID, and OTP toggles."""
    return PlatformSettingsController.update_section(db, "sms", sms_in.model_dump(), current_admin)


@router.put(
    "/settings/ai",
    response_model=AISettingsSchema,
    summary="Update AI provider, model, and plan token quotas",
)
@router.patch(
    "/settings/ai",
    response_model=AISettingsSchema,
    summary="Update AI settings (PATCH)",
)
def update_ai_settings(
    ai_in: AISettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates AI API key, selected model, and monthly token limits per subscription tier."""
    return PlatformSettingsController.update_section(db, "ai", ai_in.model_dump(), current_admin)


@router.put(
    "/settings/policies",
    response_model=PoliciesSettingsSchema,
    summary="Update platform terms, privacy policy, and refund rules",
)
@router.patch(
    "/settings/policies",
    response_model=PoliciesSettingsSchema,
    summary="Update policies settings (PATCH)",
)
def update_policies_settings(
    policies_in: PoliciesSettingsSchema,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Updates platform legal terms, privacy guidelines, and refund policy."""
    return PlatformSettingsController.update_section(db, "policies", policies_in.model_dump(), current_admin)


@router.post(
    "/settings/email/test",
    summary="Interactive test email dispatcher",
)
def test_smtp_settings(
    test_req: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Sends an interactive test email using configured SMTP credentials."""
    target_email = test_req.get("recipient_email") or test_req.get("target_email") or current_admin.email
    return PlatformSettingsController.test_smtp_email(db, target_email, current_admin)


@router.get(
    "/analytics/reports",
    summary="Get live platform analytics, real metrics, and drilldown records",
)
def get_reports_analytics(
    category: str = "executive",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user_type: Optional[str] = None,
    sector: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_view_analytics),
):
    """
    Returns real aggregated analytics metrics, charts, and drilldown lists for users, consultants, and finances.
    """
    return SuperAdminService.get_reports_analytics(
        db=db,
        category=category,
        from_date=from_date,
        to_date=to_date,
        user_type=user_type,
        sector=sector,
        city=city,
        status=status,
    )


# ─────────────────────────────────────────────────────────────────────
# PAYMENTS & PAYOUT TRANSFERS (require_perm_manage_payouts)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/payments",
    summary="List all unified payments, subscription receipts, and consultant payout requests",
)
def list_payments(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """Lists all user and consultant payments, invoices, and payout requests dynamically from the database."""
    return SuperAdminController.list_all_payments_transfers(db)


@router.post(
    "/payments/{payment_id}/action",
    summary="Approve, reject, or hold a payment / payout record and dispatch live notification",
)
def process_payment_action(
    payment_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """Processes payment action (approve, reject, hold) with notification to owner."""
    return SuperAdminController.process_payment_action(db, current_admin, payment_id, payload)


@router.delete(
    "/payments/{payment_id}",
    summary="Delete a payment or payout record",
)
def delete_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_payouts),
):
    """Deletes a payment record from the system."""
    return SuperAdminController.delete_payment_record(db, payment_id)


# ─────────────────────────────────────────────────────────────────────
# DASHBOARD REAL-TIME STATS (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/dashboard/stats",
    summary="Get real-time live aggregates and metrics for the Admin Central Dashboard",
)
def get_dashboard_stats(
    period: str = Query("week", description="day, week, month, quarter, half, year"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Returns real live counts, chart series, recent applications, tickets, ratings, and policies
    directly queried from PostgreSQL for the Admin Central Command dashboard.
    """
    return SuperAdminController.get_dashboard_stats(db, period)


# ─────────────────────────────────────────────────────────────────────
# AUTOMATION RULES & CONTROL ENGINE (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/automation-rules",
    response_model=List[AutomationRuleOut],
    summary="List all automation rules with optional status/search filters",
)
def list_automation_rules(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (active, paused, needs_review)"),
    search: Optional[str] = Query(None, description="Search by rule name"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Lists all system automation rules for the admin control center."""
    return AdminAutomationService.list_rules(db=db, status_filter=status_filter, search=search)


@router.post(
    "/automation-rules",
    response_model=AutomationRuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new automation rule",
)
def create_automation_rule(
    rule_in: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Creates a new automated engine rule."""
    return AdminAutomationService.create_rule(db=db, rule_in=rule_in, admin_id=current_admin.id)


@router.patch(
    "/automation-rules/{rule_id}",
    response_model=AutomationRuleOut,
    summary="Update an existing automation rule",
)
def update_automation_rule(
    rule_id: str,
    rule_in: AutomationRuleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates status, actions, triggers or parameters of an automation rule."""
    return AdminAutomationService.update_rule(db=db, rule_id=rule_id, rule_in=rule_in)


@router.delete(
    "/automation-rules/{rule_id}",
    summary="Delete an automation rule",
)
def delete_automation_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Removes an automation rule."""
    return {"success": AdminAutomationService.delete_rule(db=db, rule_id=rule_id)}


@router.get(
    "/automation-rules/effects",
    summary="Get recent automated system actions and rule effect logs",
)
def get_automation_rule_effects(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Returns recent log records of automated rule actions."""
    return AdminAutomationService.get_rule_effects(db=db, limit=limit)


# ─────────────────────────────────────────────────────────────────────
# 360 RELATIONS ENGINE (r360) (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/r360/search",
    summary="Unified search for 360 degree entities (users, consultants, sessions)",
)
def search_360_entities(
    query: Optional[str] = Query(None, description="Search term (name, email, phone, id)"),
    entity_type: Optional[str] = Query("all", description="Entity type: user, consultant, session, all"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Searches across users, consultants, and sessions returning 360 degree cards."""
    return AdminR360Service.search_entities(db=db, query=query, entity_type=entity_type, limit=limit)


@router.get(
    "/r360/{entity_type}/{entity_id}",
    summary="Get 360 degree entity profile with all related records and activity history",
)
def get_entity_360_details(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieves complete 360 view for a user, consultant, or session including appointments, invoices, tickets, and ratings."""
    return AdminR360Service.get_entity_360_details(db=db, entity_type=entity_type, entity_id=entity_id)


# ─────────────────────────────────────────────────────────────────────
# AI CONTROL CENTER (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/ai-control/config",
    summary="Get AI Control Center configuration and consumption statistics",
)
def get_ai_control_config(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Returns AI model settings, active toggles, token usage, and cost estimates."""
    return AdminAIControlService.get_ai_config_and_stats(db)


@router.patch(
    "/ai-control/config",
    summary="Update AI Control Center configuration",
)
def update_ai_control_config(
    update_in: AIServiceConfigUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates AI model defaults, max tokens, temperature, and feature toggles."""
    return AdminAIControlService.update_ai_config(db=db, update_in=update_in)


# ─────────────────────────────────────────────────────────────────────
# OPERATIONAL ALERTS & NOTIFICATIONS (require_admin)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/operational-alerts",
    summary="Get real-time operational alerts and notifications directly from DB",
)
def get_operational_alerts(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Aggregates real-time operational alerts from DB:
    - Pending consultant verification requests
    - Pending payout requests
    - Open/in-progress support tickets
    - Real database notifications
    """
    from models import ConsultantProfile, PayoutRequest, SupportTicket, Notification, Specialization
    from helpers.enums import VerificationStatus, PayoutStatus, TicketStatus

    alerts = []

    # 1. Pending Consultant Approvals
    pending_consultants = (
        db.query(ConsultantProfile, User, Specialization.name.label("spec_name"))
        .join(User, ConsultantProfile.user_id == User.id)
        .outerjoin(Specialization, ConsultantProfile.main_specialization_id == Specialization.id)
        .filter(ConsultantProfile.verification_status == VerificationStatus.pending)
        .all()
    )
    for prof, user, spec_name in pending_consultants:
        alerts.append({
            "id": f"ALERT-CONS-{str(prof.id)[:8]}",
            "type": "consultant_approval",
            "category": "اعتماد مستشار",
            "title": f"طلب اعتماد مستشار جديد: {user.full_name}",
            "message": f"المستشار {user.full_name} بانتظار التحقق من بياناته المهنية واعتماده في تخصص ({spec_name or 'استشارات عامة'}).",
            "entity_id": str(user.id),
            "entity_type": "مستشار",
            "priority": "high",
            "status": "pending",
            "created_at": prof.created_at.isoformat() if prof.created_at else (user.created_at.isoformat() if user.created_at else None),
            "action_url": "/admin/control-center?tab=credential",
            "details": {
                "consultant_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "specialization": spec_name or "استشارات عامة",
                "years": prof.years_of_experience or 1
            }
        })

    # 2. Pending Payout Requests
    pending_payouts = (
        db.query(PayoutRequest, ConsultantProfile, User)
        .join(ConsultantProfile, PayoutRequest.consultant_id == ConsultantProfile.id)
        .join(User, ConsultantProfile.user_id == User.id)
        .filter(PayoutRequest.status == PayoutStatus.pending)
        .all()
    )
    for pay, prof, user in pending_payouts:
        alerts.append({
            "id": f"ALERT-PAY-{str(pay.id)[:8]}",
            "type": "payout_request",
            "category": "تسوية مالية",
            "title": f"طلب سحب أرباح معلق بقيمة {pay.amount} د.أ",
            "message": f"طلب سحب أرباح للمستشار {user.full_name} بقيمة {pay.amount} د.أ بانتظار التحويل المالي والاعتماد.",
            "entity_id": str(pay.id),
            "entity_type": "تسوية",
            "priority": "high",
            "status": "pending",
            "created_at": pay.requested_at.isoformat() if pay.requested_at else None,
            "action_url": "/admin/finance",
            "details": {
                "consultant_name": user.full_name,
                "amount": float(pay.amount or 0),
                "bank_name": getattr(pay, "bank_name", "البنك المعتمد"),
                "iban": getattr(pay, "iban", "—")
            }
        })

    # 3. Open Urgent Support Tickets
    open_tickets = (
        db.query(SupportTicket, User)
        .join(User, SupportTicket.submitted_by == User.id)
        .filter(SupportTicket.status.in_([TicketStatus.open, TicketStatus.in_progress]))
        .order_by(SupportTicket.created_at.desc())
        .limit(10)
        .all()
    )
    for ticket, user in open_tickets:
        status_raw = str(ticket.status.value if hasattr(ticket.status, 'value') else ticket.status).lower()
        status_ar = "قيد المتابعة والمعالجة" if status_raw in ["in_progress", "قيد المعالجة", "in progress"] else "مفتوحة وبانتظار المراجعة والرد"
        
        priority_raw = str(ticket.priority.value if hasattr(ticket.priority, 'value') else ticket.priority).lower()
        priority_ar = "عاجل ومرتفع" if priority_raw in ["high", "urgent", "عاجل"] else "متوسط" if priority_raw in ["medium", "متوسط"] else "عادي"

        desc_snippet = f"\n\nتفاصيل المشكلة:\n{ticket.description}" if getattr(ticket, "description", None) else ""
        formatted_message = f"تذكرة دعم فني مقدمة من {user.full_name} بخصوص ({ticket.subject or 'استفسار عام'})، وحالتها الحالية {status_ar}.{desc_snippet}"

        alerts.append({
            "id": f"ALERT-TCK-{str(ticket.id)[:8]}",
            "type": "support_ticket",
            "category": "تذكرة دعم فني",
            "title": f"تذكرة دعم: {ticket.subject or ticket.id}",
            "message": formatted_message,
            "entity_id": str(ticket.id),
            "entity_type": "تذكرة",
            "priority": "high" if str(ticket.priority).lower() in ["high", "urgent", "عاجل"] else "medium",
            "status": "in_progress" if status_raw in ["in_progress", "قيد المعالجة"] else "open",
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "action_url": None,
            "details": {
                "ticket_id": str(ticket.id),
                "subject": ticket.subject or "—",
                "user_name": user.full_name,
                "status": "قيد المعالجة" if status_raw in ["in_progress", "قيد المعالجة"] else "مفتوحة",
                "priority": priority_ar
            }
        })

    # 4. Platform Notifications for Super Admin / System
    notifs = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    for n in notifs:
        alerts.append({
            "id": f"ALERT-NOTIF-{str(n.id)[:8]}",
            "db_id": str(n.id),
            "type": "system_notification",
            "category": "إشعار نظام",
            "title": n.title or "إشعار من المنصة",
            "message": n.message,
            "entity_id": str(n.related_entity_id) if n.related_entity_id else str(n.id),
            "entity_type": n.related_entity_type or "إشعار",
            "priority": "normal",
            "is_read": bool(n.is_read),
            "status": "read" if n.is_read else "unread",
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "action_url": None,
            "details": {
                "notification_type": str(n.type.value if hasattr(n.type, 'value') else n.type),
                "is_read": "مقروء" if n.is_read else "غير مقروء",
                "recipient_user_id": str(n.user_id) if n.user_id else "النظام"
            }
        })

    # Sort all alerts newest first
    alerts.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    unread_alerts_count = sum(1 for a in alerts if not a.get("is_read", False) and a.get("type") == "system_notification")

    return {
        "status": "success",
        "total_count": len(alerts),
        "unread_notifications_count": unread_alerts_count,
        "pending_payouts_count": len(pending_payouts),
        "pending_consultants_count": len(pending_consultants),
        "open_tickets_count": len(open_tickets),
        "alerts": alerts
    }


@router.patch(
    "/operational-alerts/notifications/{notification_id}/read",
    summary="Mark a specific operational notification as read in the DB",
)
def mark_operational_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    from models import Notification
    import uuid
    try:
        n_uuid = uuid.UUID(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification UUID format")

    notif = db.query(Notification).filter(Notification.id == n_uuid).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return {
        "status": "success",
        "message": "تم تحديث حالة الإشعار إلى مقروء في قاعدة البيانات بنجاح",
        "notification_id": str(notif.id),
        "is_read": True
    }


@router.post(
    "/operational-alerts/notifications/read-all",
    summary="Mark all platform notifications as read in the DB",
)
def mark_all_operational_notifications_read(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    from models import Notification
    updated_rows = db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {
        "status": "success",
        "message": f"تم تمييز {updated_rows} إشعار كمقروء في قاعدة البيانات بنجاح",
        "updated_count": updated_rows
    }


@router.delete(
    "/operational-alerts/notifications/{notification_id}",
    summary="Delete a platform notification from DB",
)
def delete_operational_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    from models import Notification
    import uuid
    try:
        n_uuid = uuid.UUID(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification UUID format")

    notif = db.query(Notification).filter(Notification.id == n_uuid).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return {
        "status": "success",
        "message": "تم حذف الإشعار من قاعدة البيانات بنجاح"
    }








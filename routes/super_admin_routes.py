from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import UserRole, EntityType, NotificationAudience, NotificationType, TicketCategory, TicketPriority, TicketStatus
from models import User
from schemes import (
    UserOut, ConsultantProfileOut, ConsultantApplicationAction,
    ServiceExpansionRequestOut, ServiceExpansionReviewAction,
    CredentialOut, CredentialReview,
    UserStatsOut, AdminUserListOut, AdminAddUserRequest,
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


@router.post(
    "/users/{user_id}/toggle-active",
    response_model=UserOut,
    summary="Enable or disable a user account",
)
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_users),
):
    """Toggles a user's active state. Super admin cannot deactivate their own account."""
    return SuperAdminController.toggle_user_active(db, user_id, current_admin.id)


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
    response_model=TestEmailResponse,
    summary="Send a live test email using current SMTP configuration",
)
def send_test_email(
    test_in: TestEmailRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perm_manage_settings),
):
    """Dispatches a diagnostic test email to verify SMTP host, port, credentials, and TLS handshake."""
    return PlatformSettingsController.test_smtp_email(db, test_in.email, current_admin)


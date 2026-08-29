import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models import User
from schemes import ConsultantApplicationAction, AdminBroadcastNotification
from helpers.enums import UserRole, EntityType, NotificationAudience, NotificationType
from services import ConsultantService, SuperAdminService

class SuperAdminController:
    @staticmethod
    def get_pending_consultants(db: Session):
        """
        Retrieves a list of all pending consultant applications.
        """
        return SuperAdminService.get_pending_consultants(db)

    @staticmethod
    def handle_consultant_action(
        db: Session, user_id: str, action_in: ConsultantApplicationAction, super_admin_id: uuid.UUID
    ):
        """
        Performs approval or rejection of a consultant profile.
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
            
        try:
            if action_in.action == "approve":
                return SuperAdminService.approve_consultant(db, user_uuid, super_admin_id)
            elif action_in.action == "reject":
                return SuperAdminService.reject_consultant(
                    db, user_uuid, super_admin_id, action_in.rejection_reason
                )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def list_users(db: Session, role: UserRole = None, page: int = 1, limit: int = 20):
        """
        Lists all users, optionally filtered by role, with validation and pagination.
        """
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        return SuperAdminService.list_all_users(db, role, page, limit)

    @staticmethod
    def toggle_user_active(db: Session, user_id: str, super_admin_id: uuid.UUID):
        """
        Enables or disables a user account, preventing the super admin from deactivating themselves.
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
            
        try:
            return SuperAdminService.toggle_user_active(db, user_uuid, super_admin_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def get_user_stats(db: Session):
        """
        Fetches user statistics breakdown.
        """
        return SuperAdminService.get_user_stats(db)

    @staticmethod
    def list_all_users_admin(
        db: Session,
        search: str = None,
        role: UserRole = None,
        entity_type: EntityType = None,
        is_active: bool = None,
        page: int = 1,
        limit: int = 20
    ):
        """
        Lists all users with advanced administrative search and filter parameters.
        """
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        return SuperAdminService.list_all_users_admin(
            db, search, role, entity_type, is_active, page, limit
        )

    @staticmethod
    def admin_add_user(db: Session, user_in):
        """
        Adds a new user or consultant directly as approved.
        """
        try:
            return SuperAdminService.admin_add_user(db, user_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def broadcast_notification(db: Session, broadcast_in: AdminBroadcastNotification):
        """
        Broadcasts notification to a target user audience.
        """
        sent_count = SuperAdminService.broadcast_notification(
            db=db,
            audience=broadcast_in.audience,
            title=broadcast_in.title,
            message=broadcast_in.message,
            notification_type=broadcast_in.notification_type
        )
        return {"sent_to": sent_count}

    @staticmethod
    def admin_get_all_sessions(db: Session):
        """
        Fetches metadata for all live / finished video sessions.
        """
        return SuperAdminService.admin_get_all_sessions(db)

    @staticmethod
    def admin_update_session_status(db: Session, appointment_id: str, new_status):
        """
        Updates session status (e.g. from Kanban board drag & drop).
        """
        try:
            appt_uuid = uuid.UUID(appointment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID format"
            )
            
        try:
            return SuperAdminService.admin_update_session_status(db, appt_uuid, new_status)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def admin_join_session(db: Session, appointment_id: str, admin_user):
        """
        Generates an observer join token for administrators.
        """
        try:
            appt_uuid = uuid.UUID(appointment_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID format"
            )
            
        try:
            return SuperAdminService.admin_join_session(db, appt_uuid, admin_user)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def get_pending_users(db: Session):
        """
        Retrieves a list of all pending standard user applications.
        """
        return SuperAdminService.get_pending_users(db)

    @staticmethod
    def handle_user_action(
        db: Session, user_id: str, action_in: ConsultantApplicationAction, super_admin_id: uuid.UUID
    ):
        """
        Performs approval or rejection of a standard user or consultant account.
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
            
        try:
            if action_in.action == "approve":
                return SuperAdminService.approve_user(db, user_uuid, super_admin_id)
            elif action_in.action == "reject":
                return SuperAdminService.reject_user(
                    db, user_uuid, super_admin_id, action_in.rejection_reason
                )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def create_system_policy(db: Session, title: str, policy_type: str, version: str, content: str):
        """
        Creates and activates a new system policy version.
        """
        try:
            return SuperAdminService.create_system_policy(db, title, policy_type, version, content)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def list_system_policies(db: Session):
        """
        Lists all system policies.
        """
        return SuperAdminService.list_system_policies(db)

    @staticmethod
    def get_active_policies(db: Session):
        """
        Gets all current active system policies.
        """
        return SuperAdminService.get_active_policies(db)

    # ── Payout Requests Management (Phase 2) ──────────────────────────

    @staticmethod
    def list_payouts(db: Session, status: str = None, limit: int = 50, offset: int = 0):
        """Lists all consultant payout requests with optional status filter."""
        from services.wallet_service import WalletService
        from helpers.enums import PayoutStatus
        status_enum = None
        if status:
            try:
                status_enum = PayoutStatus(status)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="حالة طلب السحب غير صحيحة")
        return WalletService.admin_list_payouts(db, status=status_enum, limit=limit, offset=offset)

    @staticmethod
    def process_payout(db: Session, payout_id: str, current_user, action_in):
        """Approves, transfers with receipt, or rejects a payout request."""
        from services.wallet_service import WalletService
        try:
            payout_uuid = uuid.UUID(payout_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="معرف طلب السحب غير صالح")

        try:
            return WalletService.admin_process_payout(
                db=db,
                payout_id=payout_uuid,
                admin_user=current_user,
                action=action_in.action,
                transfer_reference=action_in.transfer_reference,
                receipt_url=action_in.receipt_url,
                admin_notes=action_in.admin_notes
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # ── Credential Review (Specializations & Certificates) ──────────────

    @staticmethod
    def list_pending_credentials(db: Session):
        """Lists all pending consultant certificate and specialization credentials."""
        return ConsultantService.list_pending_credentials(db)

    @staticmethod
    def review_credential(db: Session, current_user: User, credential_id: str, review_in):
        """Reviews and approves/rejects a consultant's credential."""
        try:
            cred_uuid = uuid.UUID(credential_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credential ID format")
        try:
            return ConsultantService.review_credential(
                db, cred_uuid, current_user.id, review_in.status, review_in.rejection_reason
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_reports_analytics(
        db: Session,
        category: str = "executive",
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        user_type: Optional[str] = None,
        sector: Optional[str] = None,
        city: Optional[str] = None,
        status: Optional[str] = None
    ):
        """
        Retrieves aggregated reports and analytics dataset for the admin command center.
        """
        try:
            return SuperAdminService.get_reports_analytics(
                db=db,
                category=category,
                from_date=from_date,
                to_date=to_date,
                user_type=user_type,
                sector=sector,
                city=city,
                status=status
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate reports analytics: {str(e)}"
            )




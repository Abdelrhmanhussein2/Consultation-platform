import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemes import ConsultantApplicationAction
from helpers.enums import UserRole
from services.super_admin_service import SuperAdminService

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

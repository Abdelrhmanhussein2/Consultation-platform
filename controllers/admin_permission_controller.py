import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services import AdminPermissionService

class AdminPermissionController:
    @staticmethod
    def create_admin(db: Session, admin_in):
        try:
            return AdminPermissionService.create_admin(db, admin_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def list_admins(db: Session):
        return AdminPermissionService.list_admins(db)

    @staticmethod
    def update_admin_permissions(db: Session, admin_id: str, permissions_in):
        try:
            admin_uuid = uuid.UUID(admin_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid admin ID format"
            )

        try:
            return AdminPermissionService.update_admin_permissions(db, admin_uuid, permissions_in.permissions)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e) else status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

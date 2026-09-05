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

    @staticmethod
    def get_rbac_roles(db: Session):
        return AdminPermissionService.get_rbac_roles(db)

    @staticmethod
    def create_rbac_role(db: Session, role_data: dict, current_admin_id: uuid.UUID = None):
        try:
            return AdminPermissionService.create_rbac_role(db, role_data, current_admin_id)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def update_rbac_role(db: Session, role_id: str, role_data: dict, current_admin_id: uuid.UUID = None):
        try:
            return AdminPermissionService.update_rbac_role(db, role_id, role_data, current_admin_id)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def delete_rbac_role(db: Session, role_id: str, current_admin_id: uuid.UUID = None):
        try:
            return AdminPermissionService.delete_rbac_role(db, role_id, current_admin_id)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def assign_user_role(db: Session, user_id: str, role_name: str, role_type: str = "user", permissions: list = None, current_admin_id: uuid.UUID = None):
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")
        
        try:
            return AdminPermissionService.assign_user_role(
                db=db,
                user_id=user_uuid,
                role_name=role_name,
                role_type=role_type,
                permissions=permissions,
                admin_id=current_admin_id
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


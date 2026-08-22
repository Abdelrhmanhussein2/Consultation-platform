import uuid
from sqlalchemy.orm import Session
from typing import List

from models import User
from helpers.enums import UserRole, AdminPermission
from services.auth_utils import hash_password

class AdminPermissionService:
    @staticmethod
    def create_admin(db: Session, admin_in) -> User:
        """
        Registers a new administrator with a specific list of permissions.
        """
        existing = db.query(User).filter(User.email == admin_in.email).first()
        if existing:
            raise ValueError("Email already registered")

        db_admin = User(
            full_name=admin_in.full_name,
            email=admin_in.email,
            phone=admin_in.phone,
            password_hash=hash_password(admin_in.password),
            role=UserRole.admin,
            permissions=[p.value for p in admin_in.permissions]
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
        return db_admin

    @staticmethod
    def list_admins(db: Session) -> List[User]:
        """
        Lists all users with the admin role.
        """
        return db.query(User).filter(User.role == UserRole.admin).order_by(User.created_at.desc()).all()

    @staticmethod
    def update_admin_permissions(db: Session, admin_id: uuid.UUID, permissions: List[AdminPermission]) -> User:
        """
        Updates the permissions list for a specific administrator.
        """
        admin_user = db.query(User).filter(User.id == admin_id).first()
        if not admin_user:
            raise ValueError("Administrator not found")
        
        if admin_user.role != UserRole.admin:
            raise ValueError("Permissions can only be updated for users with the 'admin' role")

        admin_user.permissions = [p.value for p in permissions]
        db.commit()
        db.refresh(admin_user)
        return admin_user

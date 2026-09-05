import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from models import User, PlatformSetting, AdminActionLog
from helpers.enums import UserRole, AdminPermission, NotificationType
from services.auth_utils import hash_password
from services.notification_service import NotificationService

DEFAULT_ROLES = [
    {
        "id": "r1",
        "name": "مدير المنصة",
        "description": "تحكم كامل في كافة ميزات النظام والإعدادات والمستخدمين.",
        "type": "دور إضافي",
        "usersCount": 3,
        "activeUsersCount": 1,
        "permsCount": 48,
        "status": "مفعل",
        "createdAt": "2026-08-18",
        "createdBy": "سعد هارون",
        "assignedUsers": [
            {"id": "u1", "name": "سعد هارون", "phone": "00962791679444", "status": "مفعل", "assignedAt": "2026-08-18", "assignType": "مباشر"},
            {"id": "u2", "name": "رأفت حداد", "phone": "00962788541223", "status": "مفعل", "assignedAt": "2026-08-19", "assignType": "مباشر"},
            {"id": "u3", "name": "فراس عودة", "phone": "00962771239874", "status": "معطل", "assignedAt": "2026-08-20", "assignType": "مباشر"}
        ]
    },
    {
        "id": "r2",
        "name": "مدير المحتوى",
        "description": "إدارة ونشر وتعديل المقالات وقواعد المعرفة بالكامل.",
        "type": "دور إضافي",
        "usersCount": 3,
        "activeUsersCount": 3,
        "permsCount": 19,
        "status": "مفعل",
        "createdAt": "2026-08-10",
        "createdBy": "مدير النظام",
        "assignedUsers": [
            {"id": "u2", "name": "رأفت حداد", "phone": "00962788541223", "status": "مفعل", "assignedAt": "2026-08-15", "assignType": "مباشر"},
            {"id": "u4", "name": "محمد الخطيب", "phone": "00962799887766", "status": "مفعل", "assignedAt": "2026-08-16", "assignType": "مباشر"}
        ]
    },
    {
        "id": "r3",
        "name": "مراجع المحتوى",
        "description": "مراجعة وتدقيق المستندات والمحتوى قبل النشر النهائي.",
        "type": "دور إضافي",
        "usersCount": 4,
        "activeUsersCount": 4,
        "permsCount": 15,
        "status": "مفعل",
        "createdAt": "2026-07-28",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    },
    {
        "id": "r4",
        "name": "مستشار",
        "description": "تقديم الاستشارات الضريبية والمالية وعقد الجلسات المباشرة.",
        "type": "دور أساسي",
        "usersCount": 12,
        "activeUsersCount": 12,
        "permsCount": 12,
        "status": "مفعل",
        "createdAt": "2026-06-01",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    },
    {
        "id": "r5",
        "name": "موظف دعم فني",
        "description": "الرد على تذاكر الدعم ومساعدة المستخدمين وحل المشكلات.",
        "type": "دور إضافي",
        "usersCount": 1,
        "activeUsersCount": 1,
        "permsCount": 7,
        "status": "مفعل",
        "createdAt": "2026-06-15",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    },
    {
        "id": "r6",
        "name": "مسؤول مالي",
        "description": "إدارة الفواتير والمدفوعات وتنفيذ طلبات سحب الأرباح البنكية.",
        "type": "دور أساسي",
        "usersCount": 2,
        "activeUsersCount": 2,
        "permsCount": 11,
        "status": "مفعل",
        "createdAt": "2026-07-01",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    },
    {
        "id": "r7",
        "name": "مسؤول خدمة العملاء",
        "description": "إدارة علاقات العملاء والتواصل المباشر ومتابعة الحجوزات.",
        "type": "دور أساسي",
        "usersCount": 3,
        "activeUsersCount": 3,
        "permsCount": 6,
        "status": "مفعل",
        "createdAt": "2026-07-10",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    },
    {
        "id": "r8",
        "name": "صادق للقراءة فقط",
        "description": "اطلاع على التقارير والسجلات والتدقيق بدون إمكانية التعديل.",
        "type": "دور أساسي",
        "usersCount": 4,
        "activeUsersCount": 4,
        "permsCount": 4,
        "status": "مفعل",
        "createdAt": "2026-07-20",
        "createdBy": "مدير النظام",
        "assignedUsers": []
    }
]

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

    # ══════════════════════════════════════════════════════════════════
    # DYNAMIC RBAC ROLES PERSISTENCE IN DATABASE
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_rbac_roles(db: Session) -> List[Dict[str, Any]]:
        """
        Fetches all dynamic RBAC roles from database platform_settings.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "rbac_roles").first()
        if not setting or not setting.value_json:
            # Initialize with canonical default roles
            setting = PlatformSetting(
                key="rbac_roles",
                value_json=json.dumps(DEFAULT_ROLES, ensure_ascii=False),
                description="Custom and system RBAC roles and permissions"
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)
            return DEFAULT_ROLES
        try:
            return json.loads(setting.value_json)
        except Exception:
            return DEFAULT_ROLES

    @staticmethod
    def save_rbac_roles(db: Session, roles_list: List[Dict[str, Any]], admin_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        """
        Saves the updated list of RBAC roles to the database.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "rbac_roles").first()
        if not setting:
            setting = PlatformSetting(
                key="rbac_roles",
                value_json=json.dumps(roles_list, ensure_ascii=False),
                description="Custom and system RBAC roles and permissions",
                updated_by=admin_id
            )
            db.add(setting)
        else:
            setting.value_json = json.dumps(roles_list, ensure_ascii=False)
            setting.updated_by = admin_id
        db.commit()
        db.refresh(setting)
        return roles_list

    @staticmethod
    def create_rbac_role(db: Session, role_data: Dict[str, Any], admin_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        """
        Creates a new role, persists it in the database, and logs the action.
        """
        current_roles = AdminPermissionService.get_rbac_roles(db)
        new_role = {
            "id": role_data.get("id") or f"r_{int(datetime.now().timestamp())}",
            "name": role_data.get("name", "دور جديد"),
            "description": role_data.get("description", "دور مخصص في النظام"),
            "type": role_data.get("type", "دور إضافي"),
            "usersCount": 0,
            "activeUsersCount": 0,
            "permsCount": len(role_data.get("permissions", [])) or 48,
            "status": role_data.get("status", "مفعل"),
            "createdAt": datetime.now().strftime("%Y-%m-%d"),
            "createdBy": "مدير المنصة",
            "assignedUsers": [],
            "permissions": role_data.get("permissions", [])
        }
        current_roles.append(new_role)
        AdminPermissionService.save_rbac_roles(db, current_roles, admin_id)

        # Audit Log
        if admin_id:
            try:
                log = AdminActionLog(
                    admin_id=admin_id,
                    action_type="CREATE_RBAC_ROLE",
                    target_entity_type="role",
                    target_entity_id=admin_id,
                    details=f"Created new role: {new_role['name']}"
                )
                db.add(log)
                db.commit()
            except Exception:
                pass

        return new_role

    @staticmethod
    def update_rbac_role(db: Session, role_id: str, role_data: Dict[str, Any], admin_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        """
        Updates an existing role and persists changes to DB.
        """
        current_roles = AdminPermissionService.get_rbac_roles(db)
        updated_role = None
        for i, r in enumerate(current_roles):
            if str(r.get("id")) == str(role_id):
                current_roles[i].update(role_data)
                updated_role = current_roles[i]
                break
        
        if not updated_role:
            raise ValueError("Role not found")

        AdminPermissionService.save_rbac_roles(db, current_roles, admin_id)
        return updated_role

    @staticmethod
    def delete_rbac_role(db: Session, role_id: str, admin_id: Optional[uuid.UUID] = None) -> bool:
        """
        Deletes a role from the database.
        """
        current_roles = AdminPermissionService.get_rbac_roles(db)
        filtered = [r for r in current_roles if str(r.get("id")) != str(role_id)]
        AdminPermissionService.save_rbac_roles(db, filtered, admin_id)
        return True

    # ══════════════════════════════════════════════════════════════════
    # USER ROLE ASSIGNMENT & REAL-TIME NOTIFICATION DISPATCH
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def assign_user_role(
        db: Session,
        user_id: uuid.UUID,
        role_name: str,
        role_type: Optional[str] = "user",
        permissions: Optional[List[str]] = None,
        admin_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Assigns or updates a user/consultant's role and permissions in PostgreSQL,
        logs the security action, and dispatches an instant real-time notification to the target user.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        old_role = str(user.role.value if hasattr(user.role, 'value') else user.role)

        # Map role_type to UserRole
        if role_type in [UserRole.consultant.value, "consultant", "مستشار"]:
            user.role = UserRole.consultant
        elif role_type in [UserRole.admin.value, "admin", "مدير", "مدير المنصة", "موظف دعم"]:
            user.role = UserRole.admin
        elif role_type in [UserRole.super_admin.value, "super_admin"]:
            user.role = UserRole.super_admin
        else:
            user.role = UserRole.user

        if permissions is not None:
            user.permissions = permissions

        db.commit()
        db.refresh(user)

        # 1. Send Instant Bidirectional Notification to User / Consultant
        notif_msg = (
            f"مرحباً {user.full_name}، تم تحديث وتعديل دورك وصلاحياتك في منصة ديوان إلى: [{role_name}]. "
            f"تسري هذه الصلاحيات فورياً على حسابك."
        )
        try:
            NotificationService.send(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.general,
                title="تحديث الصلاحيات والدور",
                message=notif_msg,
                related_entity_type="user_role",
                related_entity_id=user.id
            )
        except Exception as e:
            print(f"Warning: Failed to send role update notification: {e}")

        # 2. Log Action in AdminActionLog
        if admin_id:
            try:
                log = AdminActionLog(
                    admin_id=admin_id,
                    action_type="UPDATE_USER_ROLE",
                    target_entity_type="user",
                    target_entity_id=user.id,
                    details=f"Changed user {user.full_name} role from [{old_role}] to [{role_name}] ({user.role.value})"
                )
                db.add(log)
                db.commit()
            except Exception:
                pass

        return {
            "success": True,
            "user_id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "new_role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "role_name": role_name,
            "permissions": user.permissions or []
        }


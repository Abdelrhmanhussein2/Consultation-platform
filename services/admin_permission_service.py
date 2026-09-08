import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from models import User, PlatformSetting, AdminActionLog
from helpers.enums import UserRole, AdminPermission, NotificationType
from services.auth_utils import hash_password
from services.notification_service import NotificationService

CANONICAL_ROLES = [
    {
        "id": "r_super_admin",
        "name": "مدير المنصة",
        "description": "تحكم كامل في كافة ميزات النظام والإعدادات والمستخدمين وإدارة الصلاحيات.",
        "type": "دور أساسي",
        "permsCount": 48,
        "status": "مفعل",
        "createdAt": "2026-01-01",
        "createdBy": "النظام",
        "role_key": "super_admin",
        "permissions": []
    },
    {
        "id": "r_admin",
        "name": "مدير إداري",
        "description": "إدارة العمليات التشغيلية، تذاكر الدعم، المستخدمين والمحتوى.",
        "type": "دور أساسي",
        "permsCount": 35,
        "status": "مفعل",
        "createdAt": "2026-01-01",
        "createdBy": "النظام",
        "role_key": "admin",
        "permissions": []
    },
    {
        "id": "r_consultant",
        "name": "مستشار",
        "description": "تقديم الاستشارات الضريبية والمالية وعقد الجلسات المباشرة وإدارة العملاء.",
        "type": "دور أساسي",
        "permsCount": 18,
        "status": "مفعل",
        "createdAt": "2026-01-01",
        "createdBy": "النظام",
        "role_key": "consultant",
        "permissions": []
    },
    {
        "id": "r_user",
        "name": "مستخدم وعميل",
        "description": "حجز المواعيد، طلب الاستشارات، وإدارة الفواتير والاشتراكات.",
        "type": "دور أساسي",
        "permsCount": 12,
        "status": "مفعل",
        "createdAt": "2026-01-01",
        "createdBy": "النظام",
        "role_key": "user",
        "permissions": []
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
        return db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).order_by(User.created_at.desc()).all()

    @staticmethod
    def update_admin_permissions(db: Session, admin_id: uuid.UUID, permissions: List[AdminPermission]) -> User:
        """
        Updates the permissions list for a specific administrator.
        """
        admin_user = db.query(User).filter(User.id == admin_id).first()
        if not admin_user:
            raise ValueError("Administrator not found")
        
        if admin_user.role not in [UserRole.admin, UserRole.super_admin]:
            raise ValueError("Permissions can only be updated for users with the 'admin' or 'super_admin' role")

        admin_user.permissions = [p.value for p in permissions]
        db.commit()
        db.refresh(admin_user)
        return admin_user

    # ══════════════════════════════════════════════════════════════════
    # DYNAMIC RBAC ROLES PERSISTENCE IN DATABASE (100% REAL LIVE DATA)
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_rbac_roles(db: Session) -> List[Dict[str, Any]]:
        """
        Fetches all dynamic RBAC roles populated strictly with live PostgreSQL database users.
        """
        all_users = db.query(User).order_by(User.created_at.desc()).all()

        def format_user(u: User):
            return {
                "id": str(u.id),
                "name": u.full_name or u.email.split('@')[0],
                "email": u.email,
                "phone": u.phone or "—",
                "status": "مفعل" if u.is_active else "معطل",
                "assignedAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "2026-01-01",
                "assignType": "مباشر"
            }

        super_admins = [format_user(u) for u in all_users if u.role == UserRole.super_admin]
        admins = [format_user(u) for u in all_users if u.role == UserRole.admin]
        consultants = [format_user(u) for u in all_users if u.role == UserRole.consultant]
        regular_users = [format_user(u) for u in all_users if u.role == UserRole.user]

        # Read custom roles from platform settings
        custom_roles_list = []
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "rbac_roles").first()
        if setting and setting.value_json:
            try:
                stored = json.loads(setting.value_json)
                if isinstance(stored, list):
                    # Filter out old fake mock defaults
                    for r in stored:
                        rid = str(r.get("id", ""))
                        rname = r.get("name", "")
                        if rid in ["r_super_admin", "r_admin", "r_consultant", "r_user", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"]:
                            continue
                        if rname in ["مدير المنصة", "مدير إداري", "مستشار", "مستخدم وعميل", "مدير المحتوى", "مراجع المحتوى", "موظف دعم فني", "مسؤول مالي", "مسؤول خدمة العملاء", "صادق للقراءة فقط"]:
                            continue
                        custom_roles_list.append(r)
            except Exception:
                pass

        # Build list of canonical roles with real DB users
        roles = [
            {
                "id": "r_super_admin",
                "name": "مدير المنصة",
                "description": "تحكم كامل في كافة ميزات النظام والإعدادات والمستخدمين وإدارة الصلاحيات.",
                "type": "دور أساسي",
                "usersCount": len(super_admins),
                "activeUsersCount": sum(1 for u in super_admins if u["status"] == "مفعل"),
                "permsCount": 48,
                "status": "مفعل",
                "createdAt": "2026-01-01",
                "createdBy": "النظام",
                "assignedUsers": super_admins,
                "permissions": []
            },
            {
                "id": "r_admin",
                "name": "مدير إداري",
                "description": "إدارة العمليات التشغيلية، تذاكر الدعم، المستخدمين والمحتوى.",
                "type": "دور أساسي",
                "usersCount": len(admins),
                "activeUsersCount": sum(1 for u in admins if u["status"] == "مفعل"),
                "permsCount": 35,
                "status": "مفعل",
                "createdAt": "2026-01-01",
                "createdBy": "النظام",
                "assignedUsers": admins,
                "permissions": []
            },
            {
                "id": "r_consultant",
                "name": "مستشار",
                "description": "تقديم الاستشارات الضريبية والمالية وعقد الجلسات المباشرة وإدارة العملاء.",
                "type": "دور أساسي",
                "usersCount": len(consultants),
                "activeUsersCount": sum(1 for u in consultants if u["status"] == "مفعل"),
                "permsCount": 18,
                "status": "مفعل",
                "createdAt": "2026-01-01",
                "createdBy": "النظام",
                "assignedUsers": consultants,
                "permissions": []
            },
            {
                "id": "r_user",
                "name": "مستخدم وعميل",
                "description": "حجز المواعيد، طلب الاستشارات، وإدارة الفواتير والاشتراكات.",
                "type": "دور أساسي",
                "usersCount": len(regular_users),
                "activeUsersCount": sum(1 for u in regular_users if u["status"] == "مفعل"),
                "permsCount": 12,
                "status": "مفعل",
                "createdAt": "2026-01-01",
                "createdBy": "النظام",
                "assignedUsers": regular_users,
                "permissions": []
            }
        ]

        # Append any valid custom roles created by the admin
        for cr in custom_roles_list:
            cr_perms = cr.get("permissions", [])
            perms_count = len(cr_perms) if isinstance(cr_perms, list) else int(cr.get("permsCount", 0))
            roles.append({
                "id": cr.get("id"),
                "name": cr.get("name"),
                "description": cr.get("description", "دور مخصص"),
                "type": cr.get("type", "دور إضافي"),
                "usersCount": cr.get("usersCount", 0),
                "activeUsersCount": cr.get("activeUsersCount", 0),
                "permsCount": perms_count,
                "status": cr.get("status", "مفعل"),
                "createdAt": cr.get("createdAt", datetime.now().strftime("%Y-%m-%d")),
                "createdBy": cr.get("createdBy", "مدير المنصة"),
                "assignedUsers": cr.get("assignedUsers", []),
                "permissions": cr_perms
            })

        return roles

    @staticmethod
    def save_rbac_roles(db: Session, roles_list: List[Dict[str, Any]], admin_id: Optional[uuid.UUID] = None) -> List[Dict[str, Any]]:
        """
        Saves custom RBAC roles to the database platform_settings.
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
            "id": role_data.get("id") or f"custom_{int(datetime.now().timestamp())}",
            "name": role_data.get("name", "دور مخصص"),
            "description": role_data.get("description", "دور مخصص في النظام"),
            "type": role_data.get("type", "دور مخصص"),
            "usersCount": 0,
            "activeUsersCount": 0,
            "permsCount": len(role_data.get("permissions", [])) if isinstance(role_data.get("permissions"), list) else 0,
            "status": role_data.get("status", "مفعل"),
            "createdAt": datetime.now().strftime("%Y-%m-%d"),
            "createdBy": "مدير المنصة",
            "assignedUsers": [],
            "permissions": role_data.get("permissions", [])
        }
        
        # Save custom roles only to DB
        existing_custom = [r for r in current_roles if str(r.get("id", "")).startswith("custom_")]
        existing_custom.append(new_role)
        AdminPermissionService.save_rbac_roles(db, existing_custom, admin_id)

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
        Updates an existing custom or canonical role and persists changes to DB.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "rbac_roles").first()
        stored_custom = []
        if setting and setting.value_json:
            try:
                stored_custom = json.loads(setting.value_json)
            except Exception:
                stored_custom = []

        found = False
        for i, r in enumerate(stored_custom):
            if str(r.get("id")) == str(role_id):
                stored_custom[i].update(role_data)
                found = True
                break
        
        if not found:
            # If it's a role being customized for the first time, save it
            updated_role = {
                "id": role_id,
                **role_data
            }
            stored_custom.append(updated_role)

        AdminPermissionService.save_rbac_roles(db, stored_custom, admin_id)
        return role_data

    @staticmethod
    def delete_rbac_role(db: Session, role_id: str, admin_id: Optional[uuid.UUID] = None) -> bool:
        """
        Deletes a custom role from the database.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "rbac_roles").first()
        if setting and setting.value_json:
            try:
                stored_custom = json.loads(setting.value_json)
                filtered = [r for r in stored_custom if str(r.get("id")) != str(role_id)]
                AdminPermissionService.save_rbac_roles(db, filtered, admin_id)
            except Exception:
                pass
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


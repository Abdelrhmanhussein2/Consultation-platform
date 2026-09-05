import sys
import os
import json
import uuid

# Add root to python path
sys.path.insert(0, r"d:\work\Consultation-platform")

from helpers.database import SessionLocal
from services.admin_permission_service import AdminPermissionService
from models import User, Notification, PlatformSetting
from helpers.enums import UserRole, NotificationType

def test_rbac_database_and_notifications():
    db = SessionLocal()
    try:
        print("1. Testing RBAC Roles Persistence in Database...")
        roles = AdminPermissionService.get_rbac_roles(db)
        print(f"   -> Successfully loaded {len(roles)} roles from PostgreSQL.")

        # Test creating a new role
        new_role_payload = {
            "name": "مستشار ضريبي معتمد فئة أ",
            "description": "صلاحيات استشارات ضريبية متقدمة",
            "type": "دور أساسي",
            "status": "مفعل",
            "permissions": ["view_consultations", "conduct_sessions"]
        }
        created = AdminPermissionService.create_rbac_role(db, new_role_payload)
        print(f"   -> Created new role: ID={created['id']}, Name={created['name']}")

        # Verify it persisted in DB
        roles_after = AdminPermissionService.get_rbac_roles(db)
        match = next((r for r in roles_after if r['id'] == created['id']), None)
        assert match is not None, "Created role was not found in DB!"
        print("   -> Verified role is saved in PostgreSQL database.")

        # 2. Testing User / Consultant Role Assignment & Notification
        print("\n2. Testing User Role Assignment & Instant Notifications...")
        target_user = db.query(User).first()
        if not target_user:
            print("   -> No users found in DB to test assignment, creating a test user...")
            target_user = User(
                full_name="مستخدم تجريبي للاختبار",
                email=f"test_rbac_{uuid.uuid4().hex[:6]}@example.com",
                password_hash="fakehash",
                role=UserRole.user
            )
            db.add(target_user)
            db.commit()
            db.refresh(target_user)

        print(f"   -> Target user: {target_user.full_name} ({target_user.email}), Old Role: {target_user.role}")
        
        # Assign role
        res = AdminPermissionService.assign_user_role(
            db=db,
            user_id=target_user.id,
            role_name=created['name'],
            role_type="consultant",
            permissions=["view_consultations", "conduct_sessions"]
        )
        print(f"   -> assign_user_role result: {res}")

        # Verify user in DB updated
        db.refresh(target_user)
        print(f"   -> User Role in PostgreSQL updated to: {target_user.role.value}")
        assert target_user.role == UserRole.consultant, "User role did not update in DB!"

        # Verify Notification was created in PostgreSQL for this user
        notif = db.query(Notification).filter(
            Notification.user_id == target_user.id
        ).order_by(Notification.created_at.desc()).first()

        assert notif is not None, "Notification was not created in DB!"
        print(f"   -> Instant Notification verified in DB for user: Title='{notif.title}', Message='{notif.message}'")

        # Clean up the test created role to keep DB clean
        AdminPermissionService.delete_rbac_role(db, created['id'])
        print("\n3. Cleaned up test role from DB.")

        print("\n ALL RBAC DATABASE & NOTIFICATION TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    test_rbac_database_and_notifications()

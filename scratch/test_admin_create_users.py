import sys
import os

sys.path.insert(0, os.path.abspath("."))

try:
    from helpers.database import SessionLocal
    from models.user import User, UserRole
    from models.consultant_profile import ConsultantProfile
    from schemes.schemes import AdminAddUserRequest
    from services.super_admin_service import SuperAdminService

    db = SessionLocal()
    
    # Test adding user if not exists
    user_test_email = "test_client_new@platform.com"
    existing_u = db.query(User).filter(User.email == user_test_email).first()
    if not existing_u:
        req = AdminAddUserRequest(
            full_name="معاذ الشامي (عميل تجريبي)",
            email=user_test_email,
            password="Password@123456",
            phone="+962791112233",
            role=UserRole.user,
            company_name="شركة الشامي للاستشارات"
        )
        created_user = SuperAdminService.admin_add_user(db, req)
        print("[SUCCESS] Created client in DB:", created_user.email, created_user.id)
    else:
        print("[EXISTS] Client already exists in DB:", existing_u.email)

    # Test adding consultant if not exists
    cons_test_email = "test_consultant_new@platform.com"
    existing_c = db.query(User).filter(User.email == cons_test_email).first()
    if not existing_c:
        req_c = AdminAddUserRequest(
            full_name="د. عماد القضاة (مستشار معتمد)",
            email=cons_test_email,
            password="Password@123456",
            phone="+962794445566",
            role=UserRole.consultant,
            bio="خبير ومستشار ضريبي معتمد",
            price_per_hour=50.0,
            title="مستشار ضريبي معتمد JCPA"
        )
        created_cons = SuperAdminService.admin_add_user(db, req_c)
        prof = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == created_cons.id).first()
        print("[SUCCESS] Created consultant in DB with profile:", created_cons.email, "status:", prof.verification_status if prof else "None")
    else:
        print("[EXISTS] Consultant already exists in DB:", existing_c.email)

    db.close()
    print("ALL TESTS PASSED SUCCESSFULLY!")
except Exception as e:
    print("[ERROR]", e)
    import traceback
    traceback.print_exc()

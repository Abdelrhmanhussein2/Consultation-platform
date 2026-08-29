import os
import sys
from datetime import time
from decimal import Decimal
from sqlalchemy import text

# Append the project root directory to sys.path to resolve relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from helpers.enums import UserRole, VerificationStatus
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.specialization import Specialization
from models.consultant_service import ConsultantService
from models.consultant_availability import ConsultantAvailability

import importlib.util
spec = importlib.util.spec_from_file_location(
    "auth_utils",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "auth_utils.py")
)
_auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_auth)
hash_password = _auth.hash_password

def fix_sequences(db):
    try:
        db.execute(text("SELECT setval('specializations_id_seq', (SELECT MAX(id) FROM specializations));"))
        db.commit()
        print("INFO: Reset specializations sequence successfully.")
    except Exception as e:
        db.rollback()
        print(f"WARNING: Could not reset sequence: {repr(e)}")

def seed_platform_consultants():
    db = SessionLocal()
    # Reset sequence before inserting
    fix_sequences(db)
    
    try:
        # 1. Fetch Standard Specializations
        vat_spec = db.query(Specialization).filter(Specialization.name == "ضريبة القيمة المضافة (VAT)").first()
        disputes_spec = db.query(Specialization).filter(Specialization.name == "الاستشارات النزاعية والاعتراضات").first()
        
        if not vat_spec or not disputes_spec:
            print("ERROR: Please run seed_super_admin.py first to seed the standard specializations.")
            return

        # 2. Platform Consultants details
        advisors = [
            {
                "email": "dina@platform.com",
                "password": "Password123!",
                "full_name": "أ. دينا الحوراني",
                "phone": "+962791111111",
                "spec_id": vat_spec.id,
                "bio": "مستشارة ضريبية معتمدة ومتخصصة في استشارات ضريبة القيمة المضافة وإعداد الإقرارات للشركات الكبرى والشركات متعددة الجنسيات.",
                "years_exp": 12,
                "activity_type": "مستشار رسمي للموقع",
                "certs": "JCPA - ماجستير في المحاسبة والضرائب",
                "price_per_hour": Decimal("60.00"),
                "availabilities": [
                    (6, time(9, 0), time(17, 0)), # Sunday
                    (0, time(9, 0), time(17, 0)), # Monday
                    (2, time(9, 0), time(17, 0)), # Wednesday
                    (3, time(9, 0), time(17, 0))  # Thursday
                ]
            },
            {
                "email": "samer@platform.com",
                "password": "Password123!",
                "full_name": "أ. سامر العزام",
                "phone": "+962792222222",
                "spec_id": disputes_spec.id,
                "bio": "خبير قانوني وضريبي متخصص في النزاعات الضريبية والاعتراضات أمام لجان الاعتراض ومحاكم استئناف ضريبة الدخل والمبيعات.",
                "years_exp": 16,
                "activity_type": "مستشار رسمي للموقع",
                "certs": "دكتوراه في القانون الضريبي - محامي مزاول ومستشار معتمد",
                "price_per_hour": Decimal("75.00"),
                "availabilities": [
                    (0, time(10, 0), time(16, 0)), # Monday
                    (1, time(10, 0), time(16, 0)), # Tuesday
                    (2, time(10, 0), time(16, 0))  # Wednesday
                ]
            }
        ]

        for advisor in advisors:
            # Check if user already exists
            user = db.query(User).filter(User.email == advisor["email"]).first()
            if user:
                print(f"INFO: Platform advisor user already exists: {advisor['email']}")
                user.full_name = advisor["full_name"]
                user.role = UserRole.platform_consultant
                user.verification_status = VerificationStatus.approved
                db.commit()
            else:
                user = User(
                    full_name=advisor["full_name"],
                    email=advisor["email"],
                    phone=advisor["phone"],
                    password_hash=hash_password(advisor["password"]),
                    role=UserRole.platform_consultant,
                    verification_status=VerificationStatus.approved,
                    is_active=True,
                    language="ar"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"INFO: Created platform consultant user: {advisor['email']}")

            # Check profile
            profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
            if profile:
                profile.bio = advisor["bio"]
                profile.main_specialization_id = advisor["spec_id"]
                profile.years_of_experience = advisor["years_exp"]
                profile.activity_type = advisor["activity_type"]
                profile.certificates_licenses = advisor["certs"]
                profile.price_per_hour = advisor["price_per_hour"]
                profile.verification_status = VerificationStatus.approved
                db.commit()
                print(f"INFO: Updated platform profile for: {advisor['full_name']}")
            else:
                profile = ConsultantProfile(
                    user_id=user.id,
                    bio=advisor["bio"],
                    main_specialization_id=advisor["spec_id"],
                    verification_status=VerificationStatus.approved,
                    years_of_experience=advisor["years_exp"],
                    activity_type=advisor["activity_type"],
                    certificates_licenses=advisor["certs"],
                    price_per_hour=advisor["price_per_hour"]
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
                print(f"INFO: Created platform profile for: {advisor['full_name']}")

            # Clear and seed Availabilities with start_time & end_time
            db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == profile.id).delete()
            for day, start_val, end_val in advisor["availabilities"]:
                avail = ConsultantAvailability(
                    consultant_id=profile.id,
                    day_of_week=day,
                    start_time=start_val,
                    end_time=end_val,
                    is_active=True
                )
                db.add(avail)
            db.commit()
            print(f"INFO: Seeded available time ranges for: {advisor['full_name']}")

        print("--------------------------------------------------")
        print("SUCCESS: Platform advisors seeded successfully!")
        print("--------------------------------------------------")

    except Exception as e:
        print(f"CRITICAL ERROR seeding platform consultants: {repr(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_platform_consultants()

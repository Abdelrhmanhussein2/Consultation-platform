import os
import sys
from datetime import time
from sqlalchemy import text

# Ensure utf-8 output encoding for windows console
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

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
        db.execute(text("SELECT setval('specializations_id_seq', COALESCE((SELECT MAX(id) FROM specializations), 1));"))
        db.commit()
        print("INFO: Reset specializations sequence successfully.")
    except Exception as e:
        db.rollback()
        print(f"WARNING: Could not reset sequence: {repr(e)}")

def get_or_create_specialization(db, name, desc):
    spec = db.query(Specialization).filter(Specialization.name == name).first()
    if not spec:
        spec = Specialization(name=name, description=desc)
        db.add(spec)
        db.commit()
        db.refresh(spec)
        print(f"INFO: Created specialization: {name}")
    return spec

def seed_consultants():
    db = SessionLocal()
    # Reset sequence before inserting
    fix_sequences(db)
    
    try:
        # 1. Get or Create Specializations
        income_tax_spec = db.query(Specialization).filter(Specialization.name == "ضريبة الدخل والمبيعات").first()
        if not income_tax_spec:
            income_tax_spec = get_or_create_specialization(db, "ضريبة الدخل والمبيعات", "استشارات ضريبة الدخل والامتثال القانوني للأفراد والشركات")
            
        accounting_tax_spec = db.query(Specialization).filter(Specialization.name == "التخطيط والامتثال الضريبي").first()
        if not accounting_tax_spec:
            accounting_tax_spec = get_or_create_specialization(db, "التخطيط والامتثال الضريبي", "التخطيط الضريبي الاستراتيجي وتخفيف المخاطر")

        # 2. Consultants details
        advisors = [
            {
                "email": "consultant@platform.com",
                "password": "Password123!",
                "full_name": "أ. رأفت حداد",
                "phone": "+962790000001",
                "spec_id": income_tax_spec.id,
                "bio": "خبير ومستشار ضريبي بخبرة تزيد عن 20 سنة في الاستشارات الضريبية، تدقيق الحسابات، والاعتراضات لدى دائرة ضريبة الدخل والمبيعات الأردنية.",
                "years_exp": 20,
                "activity_type": "مستشار مستقل",
                "certs": "بكالوريوس محاسبة - JCPA (مستشار ضريبي معتمد)",
                "services": [
                    {"name": "استشارة ضريبة الدخل", "price": 50.00, "duration": 45},
                    {"name": "تدقيق ضريبي شامل", "price": 100.00, "duration": 60}
                ],
                "availabilities": [
                    (6, time(10, 0)), (6, time(12, 0)), (6, time(14, 0)), # Sunday
                    (0, time(10, 0)), (0, time(12, 0)), (0, time(14, 0)), # Monday
                    (1, time(10, 0)), (1, time(12, 0)), (1, time(14, 0))  # Tuesday
                ]
            }
        ]

        for advisor in advisors:
            # Check if user already exists
            user = db.query(User).filter(User.email == advisor["email"]).first()
            if user:
                print(f"INFO: Advisor user already exists: {advisor['email']}")
                user.full_name = advisor["full_name"]
                user.role = UserRole.consultant
                user.verification_status = VerificationStatus.approved
                db.commit()
            else:
                user = User(
                    full_name=advisor["full_name"],
                    email=advisor["email"],
                    phone=advisor["phone"],
                    password_hash=hash_password(advisor["password"]),
                    role=UserRole.consultant,
                    verification_status=VerificationStatus.approved,
                    is_active=True,
                    language="ar"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"INFO: Created user: {advisor['email']}")

            # Check profile
            profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
            if profile:
                profile.bio = advisor["bio"]
                profile.main_specialization_id = advisor["spec_id"]
                profile.years_of_experience = advisor["years_exp"]
                profile.activity_type = advisor["activity_type"]
                profile.certificates_licenses = advisor["certs"]
                profile.verification_status = VerificationStatus.approved
                db.commit()
                print(f"INFO: Updated profile for: {advisor['full_name']}")
            else:
                profile = ConsultantProfile(
                    user_id=user.id,
                    bio=advisor["bio"],
                    main_specialization_id=advisor["spec_id"],
                    verification_status=VerificationStatus.approved,
                    years_of_experience=advisor["years_exp"],
                    activity_type=advisor["activity_type"],
                    certificates_licenses=advisor["certs"]
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
                print(f"INFO: Created profile for: {advisor['full_name']}")

            # Clear and seed Services
            db.query(ConsultantService).filter(ConsultantService.consultant_id == profile.id).delete()
            for s in advisor["services"]:
                srv = ConsultantService(
                    consultant_id=profile.id,
                    specialization_id=advisor["spec_id"],
                    name=s["name"],
                    price=s["price"],
                    duration_minutes=s["duration"],
                    is_active=True
                )
                db.add(srv)
            db.commit()
            print(f"INFO: Seeded services for: {advisor['full_name']}")

            # Clear and seed Availabilities
            db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == profile.id).delete()
            for day, t_val in advisor["availabilities"]:
                avail = ConsultantAvailability(
                    consultant_id=profile.id,
                    day_of_week=day,
                    start_time=t_val,
                    is_active=True
                )
                db.add(avail)
            db.commit()
            print(f"INFO: Seeded time slots for: {advisor['full_name']}")

        print("--------------------------------------------------")
        print("SUCCESS: Mock advisors seeded successfully!")
        print("--------------------------------------------------")

    except Exception as e:
        print(f"CRITICAL ERROR seeding: {repr(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_consultants()

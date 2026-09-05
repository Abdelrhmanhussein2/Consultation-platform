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

def get_or_create_specialization(db, name, desc):
    spec_obj = db.query(Specialization).filter(Specialization.name == name).first()
    if not spec_obj:
        spec_obj = Specialization(name=name, description=desc)
        db.add(spec_obj)
        db.commit()
        db.refresh(spec_obj)
        print(f"INFO: Created specialization: {name}")
    return spec_obj

def seed_mohamed_mosaad():
    db = SessionLocal()
    try:
        # 1. Ensure Specializations exist
        spec1 = get_or_create_specialization(db, "ضريبة الدخل والمبيعات", "استشارات ضريبة الدخل والامتثال القانوني للأفراد والشركات")
        spec2 = get_or_create_specialization(db, "التخطيط والامتثال الضريبي", "التخطيط الضريبي الاستراتيجي وتخفيف المخاطر")
        spec3 = get_or_create_specialization(db, "النزاعات والقضايا الضريبية", "تمثيل المكلفين أمام اللجان الضريبية والمحاكم المختصة")

        email = "mohamed.mosaad@platform.com"
        password = "Password123!"
        full_name = "أ. محمد مسعد"
        phone = "+962791112233"

        # 2. Get or Create User
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"INFO: User {email} already exists. Updating details...")
            user.full_name = full_name
            user.role = UserRole.consultant
            user.verification_status = VerificationStatus.approved
            user.is_active = True
            db.commit()
        else:
            user = User(
                full_name=full_name,
                email=email,
                phone=phone,
                password_hash=hash_password(password),
                role=UserRole.consultant,
                verification_status=VerificationStatus.approved,
                is_active=True,
                language="ar"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"INFO: Created user: {email}")

        # 3. Get or Create Consultant Profile
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
        if profile:
            profile.bio = "مستشار ضريبي وقانوني خبير في التخطيط المالي والقضايا الضريبية والامتثال للشركات والمؤسسات الأردنية والدولية بخبرة تزيد عن 15 عاماً."
            profile.main_specialization_id = spec1.id
            profile.years_of_experience = 15
            profile.price_per_hour = 75.00
            profile.activity_type = "مستشار مستقل"
            profile.certificates_licenses = "بكالوريوس قانون ومحاسبة - خبير ضريبي معتمد - شهادة زمالة المستشارين الضريبيين"
            profile.verification_status = VerificationStatus.approved
            db.commit()
            print(f"INFO: Updated profile for {full_name}")
        else:
            profile = ConsultantProfile(
                user_id=user.id,
                bio="مستشار ضريبي وقانوني خبير في التخطيط المالي والقضايا الضريبية والامتثال للشركات والمؤسسات الأردنية والدولية بخبرة تزيد عن 15 عاماً.",
                main_specialization_id=spec1.id,
                verification_status=VerificationStatus.approved,
                years_of_experience=15,
                price_per_hour=75.00,
                activity_type="مستشار مستقل",
                certificates_licenses="بكالوريوس قانون ومحاسبة - خبير ضريبي معتمد - شهادة زمالة المستشارين الضريبيين"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            print(f"INFO: Created profile for {full_name}")

        # 4. Seed Services
        db.query(ConsultantService).filter(ConsultantService.consultant_id == profile.id).delete()
        services_data = [
            {
                "name": "استشارة ضريبة الدخل والمبيعات",
                "spec_id": spec1.id,
                "price": 75.00,
                "duration": 60,
                "desc": "جلسة استشارية متخصصة لمراجعة الإقرارات والالتزامات الضريبية للأفراد والشركات."
            },
            {
                "name": "التخطيط والامتثال الضريبي للشركات",
                "spec_id": spec2.id,
                "price": 120.00,
                "duration": 60,
                "desc": "إعداد خطة ضريبية استراتيجية لتقليل المخاطر وتحقيق الامتثال التام."
            },
            {
                "name": "تمثيل واعتراضات النزاعات الضريبية",
                "spec_id": spec3.id,
                "price": 150.00,
                "duration": 90,
                "desc": "دراسة ملف النزاع وإعداد لائحة الاعتراض والتمثيل أمام الجهات المعنية."
            }
        ]

        for s in services_data:
            srv = ConsultantService(
                consultant_id=profile.id,
                specialization_id=s["spec_id"],
                name=s["name"],
                description=s["desc"],
                price=s["price"],
                duration_minutes=s["duration"],
                is_active=True
            )
            db.add(srv)
        db.commit()
        print(f"INFO: Added 3 active services for {full_name}")

        # 5. Seed Availabilities (Working Days & Times)
        # Days: 6=Sunday, 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday
        # Time windows: 09:00 - 17:00 (or slots at 09:00, 11:00, 13:00, 15:00)
        db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == profile.id).delete()
        working_days = [6, 0, 1, 2, 3] # الأحد حتى الخميس
        time_slots = [
            (time(9, 0), time(11, 0)),
            (time(11, 0), time(13, 0)),
            (time(14, 0), time(16, 0)),
            (time(16, 0), time(18, 0)),
        ]

        for day in working_days:
            for start_t, end_t in time_slots:
                avail = ConsultantAvailability(
                    consultant_id=profile.id,
                    day_of_week=day,
                    start_time=start_t,
                    end_time=end_t,
                    is_active=True
                )
                db.add(avail)
        db.commit()
        print(f"INFO: Added working availability slots for {full_name} (Sunday-Thursday)")

        print("==================================================")
        print(f"SUCCESS: Consultant '{full_name}' created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("==================================================")

    except Exception as e:
        print(f"ERROR creating consultant: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_mohamed_mosaad()

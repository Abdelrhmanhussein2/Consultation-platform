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

def seed_varied_schedule_consultants():
    db = SessionLocal()
    try:
        spec1 = get_or_create_specialization(db, "ضريبة الدخل والمبيعات", "استشارات ضريبة الدخل والامتثال القانوني للأفراد والشركات")
        spec2 = get_or_create_specialization(db, "التخطيط والامتثال الضريبي", "التخطيط الضريبي الاستراتيجي وتخفيف المخاطر")

        # ----------------------------------------------------
        # Consultant: أ. أحمد المحمود (مواعيد مختلفة ومتنوعة لكل يوم)
        # ----------------------------------------------------
        email = "ahmad.mahmoud@platform.com"
        password = "Password123!"
        full_name = "أ. أحمد المحمود"
        phone = "+962795554433"

        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"INFO: User {email} already exists. Updating...")
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

        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
        if profile:
            profile.bio = "مستشار ضريبي متخصص في التخطيط والامتثال الضريبي بمواعيد عمل مرنة ومتنوعة تناسب الأفراد والشركات."
            profile.main_specialization_id = spec2.id
            profile.years_of_experience = 12
            profile.price_per_hour = 60.00
            profile.activity_type = "مستشار مستقل"
            profile.certificates_licenses = "بكالوريوس محاسبة - خبير تخطيط ضريبي معتمد"
            profile.verification_status = VerificationStatus.approved
            db.commit()
            print(f"INFO: Updated profile for {full_name}")
        else:
            profile = ConsultantProfile(
                user_id=user.id,
                bio="مستشار ضريبي متخصص في التخطيط والامتثال الضريبي بمواعيد عمل مرنة ومتنوعة تناسب الأفراد والشركات.",
                main_specialization_id=spec2.id,
                verification_status=VerificationStatus.approved,
                years_of_experience=12,
                price_per_hour=60.00,
                activity_type="مستشار مستقل",
                certificates_licenses="بكالوريوس محاسبة - خبير تخطيط ضريبي معتمد"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            print(f"INFO: Created profile for {full_name}")

        # Services
        db.query(ConsultantService).filter(ConsultantService.consultant_id == profile.id).delete()
        services_data = [
            {
                "name": "جلسة تخطيط ضريبي مرنة",
                "spec_id": spec2.id,
                "price": 60.00,
                "duration": 60,
                "desc": "جلسة استشارية لتنسيق واستعراض الإقرارات المالية والضريبية."
            },
            {
                "name": "استشارة سريعة في الامتثال",
                "spec_id": spec2.id,
                "price": 35.00,
                "duration": 30,
                "desc": "مراجعة سريعة لنقاط الامتثال الضريبي والمواعيد النهائية."
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

        # Custom Varied Availabilities (Day of week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)
        # Differing start/end times and slots per day!
        db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == profile.id).delete()
        
        schedule = [
            # الأحد (6): صباحاً فقط (09:00 إلى 12:00)
            (6, time(9, 0), time(10, 0)),
            (6, time(10, 0), time(11, 0)),
            (6, time(11, 0), time(12, 0)),
            
            # الاثنين (0): مساءً فقط (14:00 إلى 18:00)
            (0, time(14, 0), time(15, 0)),
            (0, time(15, 0), time(16, 0)),
            (0, time(16, 0), time(17, 0)),
            (0, time(17, 0), time(18, 0)),
            
            # الثلاثاء (1): ساعتان فقط منتصف النهار (11:00 إلى 13:00)
            (1, time(11, 0), time(12, 0)),
            (1, time(12, 0), time(13, 0)),
            
            # الأربعاء (2): فترتان (صباحية 09:00-11:00، ومسائية 16:00-19:00)
            (2, time(9, 0), time(10, 0)),
            (2, time(10, 0), time(11, 0)),
            (2, time(16, 0), time(17, 0)),
            (2, time(17, 0), time(18, 0)),
            (2, time(18, 0), time(19, 0)),
            
            # الخميس (3): فترات مسائية متأخرة (17:00 إلى 20:00)
            (3, time(17, 0), time(18, 0)),
            (3, time(18, 0), time(19, 0)),
            (3, time(19, 0), time(20, 0)),
            
            # السبت (5): صباحاً فقط (10:00 إلى 13:00)
            (5, time(10, 0), time(11, 0)),
            (5, time(11, 0), time(12, 0)),
            (5, time(12, 0), time(13, 0)),
            # ملاحظة: الجمعة (4) عطلة تماماً
        ]

        for day_code, start_t, end_t in schedule:
            avail = ConsultantAvailability(
                consultant_id=profile.id,
                day_of_week=day_code,
                start_time=start_t,
                end_time=end_t,
                is_active=True
            )
            db.add(avail)
        db.commit()
        print(f"INFO: Added varied custom time slots for {full_name}")

        print("==================================================")
        print(f"SUCCESS: Consultant '{full_name}' with VARIED schedule created!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("==================================================")

    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_varied_schedule_consultants()

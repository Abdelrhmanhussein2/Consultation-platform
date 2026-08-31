import os
import sys
from datetime import datetime, timedelta, timezone, time
from decimal import Decimal

# Ensure utf-8 output encoding for windows console
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Append project root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from helpers.enums import UserRole, VerificationStatus, AppointmentStatus, ActorRole, SessionType
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.consultant_service import ConsultantService
from models.consultant_availability import ConsultantAvailability
from models.specialization import Specialization
from models.appointment import Appointment

from sqlalchemy import text

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
    except Exception as e:
        db.rollback()
        print(f"WARNING: Sequence reset skipped: {repr(e)}")

def get_or_create_spec(db, name, desc):
    s = db.query(Specialization).filter(Specialization.name == name).first()
    if not s:
        fix_sequences(db)
        s = Specialization(name=name, description=desc)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s

def seed_diwan_data():
    db = SessionLocal()
    fix_sequences(db)
    try:
        print("INFO: Starting comprehensive Diwan data seeding...")

        # 1. Specializations
        spec_sales = get_or_create_spec(db, "ضريبة المبيعات", "استشارات ضريبة المبيعات والتجارة الإلكترونية والخدمات الرقمية")
        spec_income = get_or_create_spec(db, "ضريبة الدخل", "تخطيط ضريبة الدخل والامتثال الضريبي للشركات والأفراد")
        spec_audit = get_or_create_spec(db, "تدقيق واعتراضات ضريبية", "الرد على التدقيق والاعتراضات الضريبية أمام اللجان المختصة")
        spec_intl = get_or_create_spec(db, "معاملات دولية وأسعار التحويل", "اتفاقيات منع الازدواج الضريبي وملفات أسعار التحويل")

        # 2. Consultants
        consultants_seed_data = [
            {
                "email": "ahmad.nassar@platform.com",
                "alt_email": "consultant@platform.com",
                "full_name": "أحمد نصار",
                "phone": "+962790001001",
                "spec_id": spec_income.id,
                "bio": "مستشار ضريبي معتمد JCPA وخبير في تخطيط ضريبة الدخل والاعتراضات الضريبية.",
                "years_exp": 18,
                "services": [
                    {"name": "استشارة ضريبة الدخل", "price": 200.0, "duration": 60, "type": SessionType.video_call},
                    {"name": "ضريبة الاقتطاع", "price": 180.0, "duration": 60, "type": SessionType.video_call},
                    {"name": "استراتيجية الاعتراض", "price": 200.0, "duration": 60, "type": SessionType.chat},
                    {"name": "تقرير تسوية ضريبية", "price": 350.0, "duration": 60, "type": SessionType.video_call}
                ]
            },
            {
                "email": "dima.saleh@platform.com",
                "full_name": "ديمة صالح",
                "phone": "+962790001002",
                "spec_id": spec_sales.id,
                "bio": "خبيرة في معالجة ضريبة المبيعات والشركات الناشئة وإعادة هيكلة الملكية.",
                "years_exp": 14,
                "services": [
                    {"name": "مراجعة ضريبة المبيعات", "price": 220.0, "duration": 90, "type": SessionType.video_call},
                    {"name": "إعادة هيكلة الشركات", "price": 320.0, "duration": 90, "type": SessionType.video_call},
                    {"name": "أسعار التحويل", "price": 400.0, "duration": 120, "type": SessionType.video_call}
                ]
            },
            {
                "email": "nour.khoury@platform.com",
                "full_name": "نور خوري",
                "phone": "+962790001003",
                "spec_id": spec_intl.id,
                "bio": "مستشارة ضرائب دولية متخصصة في الخدمات العابرة للحدود وتطبيقات SaaS.",
                "years_exp": 16,
                "services": [
                    {"name": "تخطيط ضريبة SaaS", "price": 340.0, "duration": 120, "type": SessionType.video_call},
                    {"name": "خدمات عابرة للحدود", "price": 360.0, "duration": 120, "type": SessionType.video_call},
                    {"name": "مراجعة مذكرة ضريبية", "price": 190.0, "duration": 60, "type": SessionType.video_call}
                ]
            },
            {
                "email": "laith.hamdan@platform.com",
                "full_name": "ليث حمدان",
                "phone": "+962790001004",
                "spec_id": spec_audit.id,
                "bio": "خبير التدقيق الضريبي، الجمارك، وامتثال الفواتير الإلكترونية.",
                "years_exp": 12,
                "services": [
                    {"name": "الرد على تدقيق ضريبي", "price": 280.0, "duration": 90, "type": SessionType.video_call},
                    {"name": "امتثال الفواتير", "price": 160.0, "duration": 60, "type": SessionType.video_call},
                    {"name": "الجمارك والأثر الضريبي", "price": 250.0, "duration": 90, "type": SessionType.video_call}
                ]
            }
        ]

        consultant_map = {}
        for cdata in consultants_seed_data:
            # Check by primary or alt email
            u = db.query(User).filter((User.email == cdata["email"]) | (User.email == cdata.get("alt_email", ""))).first()
            if not u:
                u = User(
                    full_name=cdata["full_name"],
                    email=cdata.get("alt_email") or cdata["email"],
                    phone=cdata["phone"],
                    password_hash=hash_password("Password123!"),
                    role=UserRole.consultant,
                    is_active=True,
                    language="ar"
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                print(f"INFO: Created consultant user: {u.full_name}")
            else:
                u.full_name = cdata["full_name"]
                u.role = UserRole.consultant
                db.commit()

            prof = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == u.id).first()
            if not prof:
                prof = ConsultantProfile(
                    user_id=u.id,
                    main_specialization_id=cdata["spec_id"],
                    bio=cdata["bio"],
                    years_of_experience=cdata["years_exp"],
                    activity_type="مستشار مستقل",
                    verification_status=VerificationStatus.approved,
                    ratings_count=15,
                    average_rating=Decimal("4.85")
                )
                db.add(prof)
                db.commit()
                db.refresh(prof)
            else:
                prof.main_specialization_id = cdata["spec_id"]
                prof.verification_status = VerificationStatus.approved
                db.commit()

            # Seed services for this consultant
            for sdata in cdata["services"]:
                s = db.query(ConsultantService).filter(
                    ConsultantService.consultant_id == prof.id,
                    ConsultantService.name == sdata["name"]
                ).first()
                if not s:
                    s = ConsultantService(
                        consultant_id=prof.id,
                        name=sdata["name"],
                        price=sdata["price"],
                        duration_minutes=sdata["duration"],
                        is_active=True
                    )
                    db.add(s)
                    db.commit()

            # Seed weekly availability
            for day in range(7): # 0 = Monday, 6 = Sunday
                for hour in [9, 10, 11, 12, 14, 15, 16]:
                    avail = db.query(ConsultantAvailability).filter(
                        ConsultantAvailability.consultant_id == prof.id,
                        ConsultantAvailability.day_of_week == day,
                        ConsultantAvailability.start_time == time(hour, 0)
                    ).first()
                    if not avail:
                        avail = ConsultantAvailability(
                            consultant_id=prof.id,
                            day_of_week=day,
                            start_time=time(hour, 0),
                            end_time=time(hour + 1, 0),
                            is_active=True
                        )
                        db.add(avail)
            db.commit()

            consultant_map[cdata["full_name"]] = prof

        # 3. Clients
        clients_seed_data = [
            {"name": "رانيا الخطيب", "email": "rania@alkhatib.co", "phone": "+962790001144"},
            {"name": "عمر حداد", "email": "omar@haddad.io", "phone": "+962791102211"},
            {"name": "لينا ناصر", "email": "lina@nasser-med.com", "phone": "+962792213322"},
            {"name": "يوسف درويش", "email": "yousef@darwish-foods.com", "phone": "+962793324433"},
            {"name": "سارة عودة", "email": "sara@odeh.co", "phone": "+962794435544"},
            {"name": "خالد المصري", "email": "k.masri@mlog.co", "phone": "+962795546655"}
        ]

        client_map = {}
        for cdata in clients_seed_data:
            cl_user = db.query(User).filter(User.email == cdata["email"]).first()
            if not cl_user:
                cl_user = User(
                    full_name=cdata["name"],
                    email=cdata["email"],
                    phone=cdata["phone"],
                    password_hash=hash_password("Password123!"),
                    role=UserRole.user,
                    is_active=True,
                    verification_status=VerificationStatus.approved,
                    language="ar"
                )
                db.add(cl_user)
                db.commit()
                db.refresh(cl_user)
                print(f"INFO: Created client user: {cl_user.full_name}")
            else:
                cl_user.full_name = cdata["name"]
                cl_user.phone = cdata["phone"]
                cl_user.verification_status = VerificationStatus.approved
                db.commit()
            client_map[cdata["name"]] = cl_user

        # 4. Clear old appointments to avoid duplicate overlaps
        all_prof_ids = [p.id for p in consultant_map.values()]
        db.query(Appointment).filter(Appointment.consultant_id.in_(all_prof_ids)).delete(synchronize_session=False)
        db.commit()
        print("INFO: Cleared old appointments for fresh schedule generation.")

        # 5. Seed 13 Consultations matching realistic timeline
        # Base anchor reference is today / current week
        now = datetime.now(timezone.utc)
        
        appointments_data = [
            {"client": "رانيا الخطيب", "advisor": "ديمة صالح", "title": "مراجعة معالجة ضريبة المبيعات", "price": 220.0, "dur": 90, "days_offset": -2, "hour": 9, "status": AppointmentStatus.confirmed},
            {"client": "يوسف درويش", "advisor": "أحمد نصار", "title": "ضريبة الاقتطاع", "price": 180.0, "dur": 60, "days_offset": -2, "hour": 12, "status": AppointmentStatus.pending_approval},
            {"client": "عمر حداد", "advisor": "نور خوري", "title": "تخطيط ضريبة الدخل", "price": 340.0, "dur": 120, "days_offset": -1, "hour": 8, "status": AppointmentStatus.confirmed},
            {"client": "لينا ناصر", "advisor": "ليث حمدان", "title": "الرد على تدقيق ضريبي", "price": 280.0, "dur": 90, "days_offset": -1, "hour": 11, "status": AppointmentStatus.confirmed},
            {"client": "خالد المصري", "advisor": "أحمد نصار", "title": "استراتيجية الاعتراض", "price": 200.0, "dur": 60, "days_offset": -1, "hour": 14, "status": AppointmentStatus.pending_payment},
            {"client": "سارة عودة", "advisor": "ديمة صالح", "title": "إعادة هيكلة الشركات", "price": 320.0, "dur": 90, "days_offset": 0, "hour": 9, "status": AppointmentStatus.confirmed},
            {"client": "رانيا الخطيب", "advisor": "نور خوري", "title": "خدمات عابرة للحدود", "price": 360.0, "dur": 120, "days_offset": 0, "hour": 13, "status": AppointmentStatus.pending_approval},
            {"client": "يوسف درويش", "advisor": "ليث حمدان", "title": "امتثال الفواتير", "price": 160.0, "dur": 60, "days_offset": 1, "hour": 10, "status": AppointmentStatus.confirmed},
            {"client": "عمر حداد", "advisor": "ديمة صالح", "title": "أسعار التحويل", "price": 400.0, "dur": 120, "days_offset": 1, "hour": 12, "status": AppointmentStatus.confirmed},
            {"client": "لينا ناصر", "advisor": "أحمد نصار", "title": "تصنيف ضريبة المبيعات", "price": 230.0, "dur": 90, "days_offset": 2, "hour": 9, "status": AppointmentStatus.pending_approval},
            {"client": "سارة عودة", "advisor": "نور خوري", "title": "مراجعة مذكرة ضريبية", "price": 190.0, "dur": 60, "days_offset": 2, "hour": 15, "status": AppointmentStatus.completed},
            {"client": "خالد المصري", "advisor": "ليث حمدان", "title": "الجمارك والأثر الضريبي", "price": 250.0, "dur": 90, "days_offset": 3, "hour": 11, "status": AppointmentStatus.confirmed},
            {"client": "عمر حداد", "advisor": "أحمد نصار", "title": "تسوية ضريبية", "price": 210.0, "dur": 60, "days_offset": 5, "hour": 10, "status": AppointmentStatus.confirmed}
        ]

        for appt_item in appointments_data:
            prof = consultant_map[appt_item["advisor"]]
            cl = client_map[appt_item["client"]]
            srv = db.query(ConsultantService).filter(ConsultantService.consultant_id == prof.id).first()

            target_dt = (now + timedelta(days=appt_item["days_offset"])).replace(
                hour=appt_item["hour"],
                minute=0,
                second=0,
                microsecond=0
            )

            new_appt = Appointment(
                consultant_id=prof.id,
                user_id=cl.id,
                service_id=srv.id if srv else None,
                scheduled_at=target_dt,
                duration_minutes=appt_item["dur"],
                status=appt_item["status"],
                created_by_role=ActorRole.user,
                price=appt_item["price"],
                session_type=SessionType.video_call,
                notes=f"موضوع الاستشارة: {appt_item['title']}"
            )
            db.add(new_appt)

        db.commit()
        print("SUCCESS: Comprehensive Diwan consultants, clients, and appointments seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding failed: {repr(e)}")
        raise e
    finally:
        db.close()

if __name__ == '__main__':
    seed_diwan_data()

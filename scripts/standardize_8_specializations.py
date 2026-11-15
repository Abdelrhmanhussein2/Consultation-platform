"""
Script to enforce the exact 8 official specializations across the platform database.
Maps any old/invalid specializations on consultants, services, and credentials to the official 8.
Deletes any extraneous specializations.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from helpers.database import SessionLocal
from models.consultations.specialization import Specialization
from models.consultations.consultant_profile import ConsultantProfile
from models.consultations.consultant_service import ConsultantService
from models.consultations.consultant_credential import ConsultantCredential
from sqlalchemy import text

OFFICIAL_8 = [
    {"id": 1, "name": "ضريبي", "desc": "استشارات وتخطيط ضريبي عام"},
    {"id": 2, "name": "ضريبة المبيعات", "desc": "استشارات ضريبة المبيعات العامة والخاصة والامتثال"},
    {"id": 3, "name": "ضريبة الدخل", "desc": "إقرارات واستشارات وتدقيق ضريبة الدخل للأفراد والشركات"},
    {"id": 4, "name": "جمارك", "desc": "التعريفات الجمركية، التخليص، وقوانين الجمارك"},
    {"id": 5, "name": "مناطق حرة", "desc": "الحوافز الضريبية والأنظمة الخاصة بالمناطق الحرة والتنموية"},
    {"id": 6, "name": "تسعير تحويلي", "desc": "سياسات التسعير التحويلي والملفات المحلية والمركزية"},
    {"id": 7, "name": "قانوني", "desc": "الاستشارات القانونية والاعتراضات والنزاعات الضريبية"},
    {"id": 8, "name": "تدقيق ومراجعة", "desc": "تدقيق الحسابات والتدقيق الداخلي والمراجعة المالية"},
]

def run():
    db = SessionLocal()
    try:
        print("Starting 8 Specializations Standardization...")
        
        # 1. Upsert the 8 official specializations
        for item in OFFICIAL_8:
            s_id = item["id"]
            existing = db.query(Specialization).filter(Specialization.id == s_id).first()
            if existing:
                existing.name = item["name"]
                existing.description = item["desc"]
                print(f"Updated spec #{s_id}: {item['name']}")
            else:
                new_spec = Specialization(id=s_id, name=item["name"], description=item["desc"])
                db.add(new_spec)
                print(f"Created spec #{s_id}: {item['name']}")
        
        db.commit()

        # 2. Remap foreign keys pointing to id > 8
        db.query(ConsultantProfile).filter(
            ConsultantProfile.main_specialization_id.isnot(None),
            ConsultantProfile.main_specialization_id > 8
        ).update({ConsultantProfile.main_specialization_id: 1}, synchronize_session=False)

        db.query(ConsultantService).filter(
            ConsultantService.specialization_id.isnot(None),
            ConsultantService.specialization_id > 8
        ).update({ConsultantService.specialization_id: 1}, synchronize_session=False)

        db.query(ConsultantCredential).filter(
            ConsultantCredential.specialization_id.isnot(None),
            ConsultantCredential.specialization_id > 8
        ).update({ConsultantCredential.specialization_id: 1}, synchronize_session=False)

        db.commit()

        # 3. Delete any specializations where id > 8
        deleted_count = db.query(Specialization).filter(Specialization.id > 8).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {deleted_count} extraneous specializations.")

        # 4. Sync sequence
        try:
            db.execute(text("SELECT setval('specializations_id_seq', 8, true)"))
            db.commit()
        except Exception:
            pass

        print("Successfully standardized to the 8 official specializations!")
    except Exception as e:
        db.rollback()
        print(f"Error during standardization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()


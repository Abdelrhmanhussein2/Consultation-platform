"""
Script to enforce the exact 15 official specializations across the platform database.
Maps any old/invalid specializations on consultants, services, and credentials to the official 15.
Deletes any extraneous specializations.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from helpers.database import SessionLocal
from models.specialization import Specialization
from models.consultant_profile import ConsultantProfile
from models.consultant_service import ConsultantService
from models.consultant_credential import ConsultantCredential

OFFICIAL_15 = [
    {"id": 1, "name": "ضريبة الدخل والمبيعات", "desc": "استشارات وتدقيق ضريبة الدخل وضريبة المبيعات العامة"},
    {"id": 2, "name": "المناطق الحرة والتنموية", "desc": "الحوافز الضريبية والأنظمة الخاصة بالمناطق التنموية والحرة"},
    {"id": 3, "name": "منطقة العقبة الاقتصادية الخاصة", "desc": "التشريعات والامتيازات الضريبية والجمركية في منطقة العقبة"},
    {"id": 4, "name": "قوانين الإستثمار", "desc": "قوانين البيئة الاستثمارية والاعفاءات والحوافز للمستثمرين"},
    {"id": 5, "name": "قوانين الجمارك", "desc": "التعريفات الجمركية، التخليص، وقوانين الجمارك الأردنية والدولية"},
    {"id": 6, "name": "الضرائب الدولية", "desc": "المعايير الدولية للضرائب وتخطيط الضرائب عبر الحدود"},
    {"id": 7, "name": "الإزدواج الضريبي", "desc": "اتفاقيات تجنب الازدواج الضريبي وحماية الحقوق المالية الدولية"},
    {"id": 8, "name": "الأسعار التحويلية", "desc": "سياسات التسعير التحويلي والملفات المحلية والمركزية للشركات"},
    {"id": 9, "name": "الضريبة الخاصة", "desc": "السلع والخدمات الخاضعة للضريبة الخاصة وآليات احتسابها"},
    {"id": 10, "name": "المنازعات الضريبية", "desc": "الاعتراضات، لجان التسوية، وقضايا المحاكم الضريبية"},
    {"id": 11, "name": "إدارة المخاطر", "desc": "إدارة المخاطر المالية والضريبية والامتثال الرقابي"},
    {"id": 12, "name": "تدقيق الحسابات", "desc": "التدقيق المالي الخارجي والقوائم المالية المعتمدة"},
    {"id": 13, "name": "التدقيق الداخلي", "desc": "مراجعة الأنظمة الرقابية الداخلية وضبط العمليات المالية"},
    {"id": 14, "name": "الإعسار", "desc": "قوانين وإجراءات الإعسار وحماية الدائنين والمدينين"},
    {"id": 15, "name": "التصفية", "desc": "تصفية الشركات والكيانات التجارية وإنهاء الالتزامات الضريبية"},
]

def run():
    db = SessionLocal()
    try:
        print("Starting Specializations Standardization...")
        
        # 1. Ensure all 15 official specializations exist with accurate names and descriptions
        existing_specs = {s.id: s for s in db.query(Specialization).all()}
        
        for item in OFFICIAL_15:
            s_id = item["id"]
            if s_id in existing_specs:
                spec = existing_specs[s_id]
                spec.name = item["name"]
                spec.description = item["desc"]
                print(f"Updated spec #{s_id}: {item['name']}")
            else:
                new_spec = Specialization(id=s_id, name=item["name"], description=item["desc"])
                db.add(new_spec)
                print(f"Created spec #{s_id}: {item['name']}")
        
        db.commit()

        # Re-fetch official IDs
        valid_ids = {item["id"] for item in OFFICIAL_15}
        
        # 2. Check for any non-standard specializations (ID > 15 or invalid)
        all_specs = db.query(Specialization).all()
        for s in all_specs:
            if s.id not in valid_ids:
                print(f"Found non-official specialization: ID={s.id}, Name={s.name}. Re-mapping...")
                # Re-map related consultants to #1
                db.query(ConsultantProfile).filter(ConsultantProfile.main_specialization_id == s.id).update(
                    {ConsultantProfile.main_specialization_id: 1}
                )
                db.query(ConsultantService).filter(ConsultantService.specialization_id == s.id).update(
                    {ConsultantService.specialization_id: 1}
                )
                db.query(ConsultantCredential).filter(ConsultantCredential.specialization_id == s.id).update(
                    {ConsultantCredential.specialization_id: 1}
                )
                db.delete(s)
                print(f"Deleted non-official spec ID={s.id}")
        
        db.commit()

        # 3. Ensure all ConsultantProfiles have a valid main_specialization_id (1-15)
        consultants = db.query(ConsultantProfile).all()
        for i, cp in enumerate(consultants):
            if not cp.main_specialization_id or cp.main_specialization_id not in valid_ids:
                # Cycle through valid IDs to give realistic variety
                assigned_id = (i % 15) + 1
                cp.main_specialization_id = assigned_id
                print(f"Assigned consultant profile {cp.id} to specialization #{assigned_id}")

        # 4. Ensure all ConsultantServices have valid specialization_id
        services = db.query(ConsultantService).all()
        for srv in services:
            if srv.specialization_id and srv.specialization_id not in valid_ids:
                srv.specialization_id = 1

        db.commit()
        print("Specializations Standardization complete successfully!")
        
        # Print final state
        final_specs = db.query(Specialization).order_by(Specialization.id).all()
        for s in final_specs:
            print(f"ID={s.id}: {s.name} - {s.description}")

    except Exception as e:
        db.rollback()
        print(f"Error during standardization: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run()

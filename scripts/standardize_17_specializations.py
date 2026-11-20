"""
Clean migration script to standardize 17 official specializations with IDs 1 to 17.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from helpers.database import SessionLocal
from models.consultations.specialization import Specialization
from sqlalchemy import text

OFFICIAL_17 = [
    (1, "ضريبة الدخل والمبيعات", "استشارات وقوانين ضريبة الدخل والمبيعات والامتثال"),
    (2, "المناطق الحرة والتنموية", "الأنظمة والحوافز الخاصة بالمناطق الحرة والتنموية"),
    (3, "منطقة العقبة الاقتصادية الخاصة", "تشريعات وإجراءات منطقة العقبة الاقتصادية الخاصة"),
    (4, "قوانين الإستثمار", "حوافز وتشريعات البيئة الاستثمارية والشركات"),
    (5, "قوانين الجمارك", "التعريفات الجمركية والتخليص وقوانين الجمارك"),
    (6, "الضرائب الدولية", "الاتفاقيات الدولية والمعايير الضريبية العابرة للحدود"),
    (7, "الإزدواج الضريبي", "تجنب الازدواج الضريبي وتطبيق الاتفاقيات الثنائية"),
    (8, "الأسعار التحويلية", "سياسات الأسعار التحويلية والدراسات والملفات الموثقة"),
    (9, "الضريبة الخاصة", "استشارات وتطبيقات الضريبة الخاصة والسلع الخاضعة"),
    (10, "المنازعات الضريبية", "الاعتراضات والتسويات والدعاوى أمام المحاكم واللجان"),
    (11, "إدارة المخاطر", "تقييم وإدارة المخاطر الضريبية والمالية"),
    (12, "تدقيق الحسابات", "أعمال تدقيق البيانات المالية والمحاسبية القانونية"),
    (13, "التدقيق الداخلي", "حوكمة الأنظمة والرقابة الداخلية والامتثال"),
    (14, "الإعسار", "إجراءات وقوانين الإعسار وإعادة الهيكلة والتسوية"),
    (15, "التصفية", "التصفية الاختيارية والإجبارية للشركات والكيانات"),
    (16, "التخطيط الضريبي", "التخطيط الاستراتيجي والهيكلة الضريبية القانونية"),
    (17, "الإمتثال الضريبي", "إعداد الإقرارات والامتثال للمتطلبات الدورية"),
]

def run():
    db = SessionLocal()
    try:
        print("Starting clean migration to IDs 1-17...")

        # 1. Remap foreign keys for IDs 9-25 to 1-17 (id - 8)
        for table, col in [
            ("consultant_profiles", "main_specialization_id"),
            ("consultant_services", "specialization_id"),
            ("consultant_credentials", "specialization_id")
        ]:
            try:
                db.execute(text(f"""
                    UPDATE {table}
                    SET {col} = {col} - 8
                    WHERE {col} >= 9 AND {col} <= 25
                """))
                db.execute(text(f"""
                    UPDATE {table}
                    SET {col} = 1
                    WHERE {col} > 25
                """))
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"FK update notice on {table}.{col}: {e}")

        # 2. Delete rows with id >= 9 to free up names
        db.execute(text("DELETE FROM specializations WHERE id >= 9"))
        db.commit()

        # 3. Now insert/update rows 1 to 17
        for s_id, s_name, s_desc in OFFICIAL_17:
            existing = db.query(Specialization).filter(Specialization.id == s_id).first()
            if existing:
                existing.name = s_name
                existing.description = s_desc
            else:
                new_spec = Specialization(id=s_id, name=s_name, description=s_desc)
                db.add(new_spec)
        db.commit()

        print("Migration successful! Current specializations in PostgreSQL:")
        for s in db.query(Specialization).order_by(Specialization.id).all():
            print(f"ID={s.id}: {s.name}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()

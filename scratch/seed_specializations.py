import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))

from helpers.database import SessionLocal
from models.specialization import Specialization

OFFICIAL_SPECIALIZATIONS = [
    {"id": 1, "name": "ضريبة الدخل والمبيعات", "description": "استشارات وتدقيق ضريبة الدخل وضريبة المبيعات العامة"},
    {"id": 2, "name": "المناطق الحرة والتنموية", "description": "الحوافز الضريبية والأنظمة الخاصة بالمناطق التنموية والحرة"},
    {"id": 3, "name": "منطقة العقبة الاقتصادية الخاصة", "description": "التشريعات والامتيازات الضريبية والجمركية في منطقة العقبة"},
    {"id": 4, "name": "قوانين الإستثمار", "description": "قوانين البيئة الاستثمارية والاعفاءات والحوافز للمستثمرين"},
    {"id": 5, "name": "قوانين الجمارك", "description": "التعريفات الجمركية، التخليص، وقوانين الجمارك الأردنية والدولية"},
    {"id": 6, "name": "الضرائب الدولية", "description": "المعايير الدولية للضرائب وتخطيط الضرائب عبر الحدود"},
    {"id": 7, "name": "الإزدواج الضريبي", "description": "اتفاقيات تجنب الازدواج الضريبي وحماية الحقوق المالية الدولية"},
    {"id": 8, "name": "الأسعار التحويلية", "description": "سياسات التسعير التحويلي والملفات المحلية والمركزية للشركات"},
    {"id": 9, "name": "الضريبة الخاصة", "description": "السلع والخدمات الخاضعة للضريبة الخاصة وآليات احتسابها"},
    {"id": 10, "name": "المنازعات الضريبية", "description": "الاعتراضات، لجان التسوية، وقضايا المحاكم الضريبية"},
    {"id": 11, "name": "إدارة المخاطر", "description": "إدارة المخاطر المالية والضريبية والامتثال الرقابي"},
    {"id": 12, "name": "تدقيق الحسابات", "description": "التدقيق المالي الخارجي والقوائم المالية المعتمدة"},
    {"id": 13, "name": "التدقيق الداخلي", "description": "مراجعة الأنظمة الرقابية الداخلية وضبط العمليات المالية"},
    {"id": 14, "name": "الإعسار", "description": "قوانين وإجراءات الإعسار وحماية الدائنين والمدينين"},
    {"id": 15, "name": "التصفية", "description": "تصفية الشركات والكيانات التجارية وإنهاء الالتزامات الضريبية"}
]

from sqlalchemy import text

db = SessionLocal()
try:
    for item in OFFICIAL_SPECIALIZATIONS:
        # Check if id exists
        res = db.execute(text("SELECT id FROM specializations WHERE id = :id"), {"id": item["id"]}).fetchone()
        if res:
            db.execute(text("UPDATE specializations SET name = :name, description = :desc WHERE id = :id"), {"name": item["name"], "desc": item["description"], "id": item["id"]})
        else:
            db.execute(text("INSERT INTO specializations (id, name, description) VALUES (:id, :name, :desc)"), {"id": item["id"], "name": item["name"], "desc": item["description"]})
    db.commit()
    print("SUCCESS: 15 Specializations synced successfully:")
    all_specs = db.execute(text("SELECT id, name FROM specializations ORDER BY id")).fetchall()
    for s in all_specs:
        print(f"ID {s[0]}: {s[1]}")
except Exception as e:
    db.rollback()
    print("ERROR:", e)
finally:
    db.close()

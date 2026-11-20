from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Specialization

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


class SpecializationService:

    @staticmethod
    def get_all(db: Session) -> list[Specialization]:
        """
        Returns all available specializations ordered by ID.
        Ensures only the 17 official specializations exist, cleaning up any extras.
        """
        specs = db.query(Specialization).order_by(Specialization.id.asc()).all()
        needs_sync = False

        if len(specs) != 17 or any(s.id > 17 for s in specs):
            needs_sync = True
        else:
            current_names = {s.id: s.name for s in specs}
            for s_id, s_name, _ in OFFICIAL_17:
                if current_names.get(s_id) != s_name:
                    needs_sync = True
                    break

        if needs_sync:
            try:
                for s_id, s_name, s_desc in OFFICIAL_17:
                    existing = db.query(Specialization).filter(Specialization.id == s_id).first()
                    if existing:
                        existing.name = s_name
                        existing.description = s_desc
                    else:
                        new_spec = Specialization(id=s_id, name=s_name, description=s_desc)
                        db.add(new_spec)
                db.flush()

                for table, col in [
                    ("consultant_profiles", "main_specialization_id"),
                    ("consultant_services", "specialization_id"),
                    ("consultant_credentials", "specialization_id"),
                    ("service_expansion_requests", "specialization_id")
                ]:
                    try:
                        db.execute(text(f"UPDATE {table} SET {col} = 1 WHERE {col} IS NOT NULL AND {col} > 17"))
                    except Exception:
                        pass

                db.execute(text("DELETE FROM specializations WHERE id > 17"))
                db.commit()
            except Exception:
                db.rollback()

            specs = db.query(Specialization).filter(Specialization.id <= 17).order_by(Specialization.id.asc()).all()

        return specs

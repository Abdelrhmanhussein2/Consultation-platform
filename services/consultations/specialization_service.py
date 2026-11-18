from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Specialization

OFFICIAL_8 = [
    (1, "ضريبي", "استشارات وتخطيط ضريبي عام"),
    (2, "ضريبة المبيعات", "استشارات ضريبة المبيعات العامة والخاصة والامتثال"),
    (3, "ضريبة الدخل", "إقرارات واستشارات وتدقيق ضريبة الدخل للأفراد والشركات"),
    (4, "جمارك", "التعريفات الجمركية، التخليص، وقوانين الجمارك"),
    (5, "مناطق حرة", "الحوافز الضريبية والأنظمة الخاصة بالمناطق الحرة والتنموية"),
    (6, "تسعير تحويلي", "سياسات التسعير التحويلي والملفات المحلية والمركزية"),
    (7, "قانوني", "الاستشارات القانونية والاعتراضات والنزاعات الضريبية"),
    (8, "تدقيق ومراجعة", "تدقيق الحسابات والتدقيق الداخلي والمراجعة المالية"),
]


class SpecializationService:

    @staticmethod
    def get_all(db: Session) -> list[Specialization]:
        """
        Returns all available specializations ordered by ID.
        Ensures only the 8 official specializations exist, cleaning up any extras.
        """
        specs = db.query(Specialization).order_by(Specialization.id.asc()).all()
        needs_sync = False

        if len(specs) != 8 or any(s.id > 8 for s in specs):
            needs_sync = True
        else:
            current_names = {s.id: s.name for s in specs}
            for s_id, s_name, _ in OFFICIAL_8:
                if current_names.get(s_id) != s_name:
                    needs_sync = True
                    break

        if needs_sync:
            try:
                for s_id, s_name, s_desc in OFFICIAL_8:
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
                        db.execute(text(f"UPDATE {table} SET {col} = 1 WHERE {col} IS NOT NULL AND {col} > 8"))
                    except Exception:
                        pass

                db.execute(text("DELETE FROM specializations WHERE id > 8"))
                db.commit()
            except Exception:
                db.rollback()

            specs = db.query(Specialization).filter(Specialization.id <= 8).order_by(Specialization.id.asc()).all()

        return specs

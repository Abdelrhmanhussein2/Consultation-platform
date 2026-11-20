import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session

from helpers.enums import BusinessSector, EntityType, LegalForm, NotificationType, UserRole
from models.communication.notification import Notification
from models.consultations.consultant_profile import ConsultantProfile
from models.consultations.consultant_credential import ConsultantCredential
from models.consultations.specialization import Specialization
from models.users.user import User
from services.communication.live_notification_service import LiveNotificationService


CONSULTANT_ACTIVITY_MAP = {
    "مستشار ضريبي": ["مستشار ضريبي", "tax_consultant", "مستشار ضريبي معتمد JCPA"],
    "مدقق حسابات": ["مدقق حسابات", "auditor"],
    "خبير ضريبي": ["خبير ضريبي", "tax_expert"],
    "مستشار قانوني": ["مستشار قانوني", "legal_consultant"],
    "محاسب قانوني": ["محاسب قانوني", "chartered_accountant"],
    "مدقق ضريبي": ["مدقق ضريبي"],
    "مستشار جمركي": ["مستشار جمركي"],
    "tax_consultant": ["مستشار ضريبي", "tax_consultant", "مستشار ضريبي معتمد JCPA"],
    "auditor": ["مدقق حسابات", "auditor"],
    "tax_expert": ["خبير ضريبي", "tax_expert"],
    "legal_consultant": ["مستشار قانوني", "legal_consultant"],
    "chartered_accountant": ["محاسب قانوني", "chartered_accountant"],
}

CONSULTANT_SPECIALIZATION_MAP = {
    "tax": 1, "sales_tax": 2, "income_tax": 3, "customs": 4,
    "free_zones": 5, "transfer_pricing": 6, "legal": 7, "audit": 8,
    "ضريبي": 1, "ضريبة المبيعات": 2, "ضريبة الدخل": 3, "جمارك": 4,
    "مناطق حرة": 5, "تسعير تحويلي": 6, "قانوني": 7, "تدقيق ومراجعة": 8,
    "ضريبة الدخل والمبيعات": 9,
    "المناطق الحرة والتنموية": 10,
    "منطقة العقبة الاقتصادية الخاصة": 11,
    "قوانين الإستثمار": 12,
    "قوانين الجمارك": 13,
    "الضرائب الدولية": 14,
    "الإزدواج الضريبي": 15,
    "الأسعار التحويلية": 16,
    "الضريبة الخاصة": 17,
    "المنازعات الضريبية": 18,
    "إدارة المخاطر": 19,
    "تدقيق الحسابات": 20,
    "التدقيق الداخلي": 21,
    "الإعسار": 22,
    "التصفية": 23,
    "التخطيط الضريبي": 24,
    "الإمتثال الضريبي": 25,
}


def _validate_consultant_filters(consultant_filters: dict, db: Session = None):
    activity, specialization = consultant_filters.get("activity"), consultant_filters.get("specialization")
    candidates, spec_ids = None, []

    if activity and activity != "all":
        act_list = activity if isinstance(activity, list) else [activity]
        all_candidates = set()
        for act in act_list:
            if not act or act == "all":
                continue
            cands = CONSULTANT_ACTIVITY_MAP.get(act)
            if not cands:
                for k, vals in CONSULTANT_ACTIVITY_MAP.items():
                    if act in vals or act == k:
                        cands = vals
                        break
            if cands:
                all_candidates.update(cands)
            else:
                all_candidates.add(act)
        if all_candidates:
            candidates = list(all_candidates)

    if specialization and specialization != "all":
        spec_list = specialization if isinstance(specialization, list) else [specialization]
        for sp in spec_list:
            if not sp or sp == "all":
                continue
            if isinstance(sp, int) or (isinstance(sp, str) and str(sp).isdigit()):
                spec_ids.append(int(sp))
            elif sp in CONSULTANT_SPECIALIZATION_MAP:
                spec_ids.append(CONSULTANT_SPECIALIZATION_MAP[sp])
            elif db:
                spec_row = db.query(Specialization).filter(Specialization.name == sp).first()
                if spec_row:
                    spec_ids.append(spec_row.id)

    return candidates, spec_ids


def get_broadcast_target_query(
    db: Session, target_group: str = "all", user_filters: dict = None,
    consultant_filters: dict = None, audience: list[str] = None,
):
    """Builds and validates the SQLAlchemy query for broadcast recipients."""
    user_filters = user_filters or {}
    consultant_filters = consultant_filters or {}
    candidates, spec_ids = _validate_consultant_filters(consultant_filters, db=db)

    if audience and target_group == "all":
        aud_set = set(audience)
        if aud_set == {"consultant"}:
            target_group = "consultants"
        else:
            or_conditions = []
            if "all" in aud_set or "user" in aud_set:
                or_conditions.append((User.role == UserRole.user) & (User.entity_type == EntityType.individual))
            if "all" in aud_set or "company" in aud_set:
                or_conditions.append((User.role == UserRole.user) & (User.entity_type == EntityType.company))
            if "all" in aud_set or "consultant" in aud_set:
                c_q = db.query(User.id).filter(
                    User.is_active == True, User.role.in_([UserRole.consultant, UserRole.platform_consultant])
                )
                if candidates or spec_ids:
                    c_q = c_q.join(ConsultantProfile, User.id == ConsultantProfile.user_id)
                    if candidates:
                        c_q = c_q.filter(ConsultantProfile.activity_type.in_(candidates))
                    if spec_ids:
                        cred_subq = db.query(ConsultantCredential.consultant_id).filter(
                            ConsultantCredential.specialization_id.in_(spec_ids)
                        )
                        c_q = c_q.filter(
                            or_(
                                ConsultantProfile.main_specialization_id.in_(spec_ids),
                                ConsultantProfile.id.in_(cred_subq)
                            )
                        )
                or_conditions.append(User.id.in_(c_q))

            if not or_conditions:
                return db.query(User).filter(False)
            return db.query(User).filter(User.is_active == True, or_(*or_conditions))

    if target_group not in ("all", "users", "consultants"):
        raise ValueError(f"نمط الجمهور '{target_group}' غير صالح")

    query = db.query(User).filter(User.is_active == True)

    if target_group == "users":
        query = query.filter(User.role == UserRole.user)
        legal_form = user_filters.get("legal_form")
        if legal_form and legal_form != "all":
            lf_list = legal_form if isinstance(legal_form, list) else [legal_form]
            lf_vals = [f for f in lf_list if f and f != "all"]
            if lf_vals:
                query = query.filter(User.legal_form.in_(lf_vals))

        sector = user_filters.get("sector")
        if sector and sector != "all":
            sec_list = sector if isinstance(sector, list) else [sector]
            sec_vals = [s for s in sec_list if s and s != "all"]
            if sec_vals:
                query = query.filter(User.sector.in_(sec_vals))

    elif target_group == "consultants":
        query = query.filter(User.role.in_([UserRole.consultant, UserRole.platform_consultant]))
        if candidates or spec_ids:
            query = query.join(ConsultantProfile, User.id == ConsultantProfile.user_id)
            if candidates:
                query = query.filter(ConsultantProfile.activity_type.in_(candidates))
            if spec_ids:
                cred_subq = db.query(ConsultantCredential.consultant_id).filter(
                    ConsultantCredential.specialization_id.in_(spec_ids)
                )
                query = query.filter(
                    or_(
                        ConsultantProfile.main_specialization_id.in_(spec_ids),
                        ConsultantProfile.id.in_(cred_subq)
                    )
                )
    else:
        query = query.filter(User.role.in_([UserRole.user, UserRole.consultant, UserRole.platform_consultant]))

    return query


def count_broadcast_recipients(
    db: Session, target_group: str = "all", user_filters: dict = None,
    consultant_filters: dict = None, audience: list[str] = None,
) -> int:
    """Read-only count of recipients matching target filters."""
    return get_broadcast_target_query(
        db, target_group=target_group, user_filters=user_filters,
        consultant_filters=consultant_filters, audience=audience,
    ).count()


def send_admin_broadcast(
    db: Session, title: str, message: str, target_group: str = "all",
    user_filters: dict = None, consultant_filters: dict = None,
    priority: str = "normal", audience: list[str] = None, source_id: str = None,
) -> int:
    """Sends an admin broadcast notification with targeted filters."""
    users = get_broadcast_target_query(
        db, target_group=target_group, user_filters=user_filters,
        consultant_filters=consultant_filters, audience=audience,
    ).all()
    if not users:
        return 0

    valid_uuid = None
    meta = {}
    if source_id:
        try:
            valid_uuid = uuid.UUID(str(source_id))
        except (ValueError, TypeError, AttributeError):
            valid_uuid = None
        meta = {
            "target_type": "law",
            "target_id": str(source_id),
            "target_url": f"/regulations?lawId={source_id}&strict=true",
            "is_law_announcement": True,
            "show_on_login": True
        }

    rows = [
        Notification(
            user_id=u.id, type=NotificationType.general, title=title, message=message,
            related_entity_type="legal_source" if source_id else "broadcast",
            related_entity_id=valid_uuid,
            extra_metadata=meta
        )
        for u in users
    ]
    db.bulk_save_objects(rows)
    db.commit()

    try:
        extra = {"related_entity_type": "legal_source" if source_id else "broadcast", "priority": priority}
        if source_id:
            extra["related_entity_id"] = str(source_id)
            extra["extra_metadata"] = meta
        for u in users:
            LiveNotificationService.push_notification(
                user_id=u.id, title=title, message=message, notif_type="general", extra=extra,
            )
    except Exception:
        pass

    return len(users)

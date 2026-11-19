import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session

from helpers.enums import BusinessSector, EntityType, LegalForm, NotificationType, UserRole
from models.communication.notification import Notification
from models.consultations.consultant_profile import ConsultantProfile
from models.users.user import User
from services.communication.live_notification_service import LiveNotificationService


CONSULTANT_ACTIVITY_MAP = {
    "مستشار ضريبي": ["مستشار ضريبي", "tax_consultant", "مستشار ضريبي معتمد JCPA"],
    "مدقق حسابات": ["مدقق حسابات", "auditor"],
    "خبير ضريبي": ["خبير ضريبي", "tax_expert"],
    "مستشار قانوني": ["مستشار قانوني", "legal_consultant"],
    "محاسب قانوني": ["محاسب قانوني", "chartered_accountant"],
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
}


def _validate_consultant_filters(consultant_filters: dict):
    activity, specialization = consultant_filters.get("activity"), consultant_filters.get("specialization")
    candidates, spec_id = None, None

    if activity and activity != "all":
        candidates = CONSULTANT_ACTIVITY_MAP.get(activity)
        if not candidates:
            for k, vals in CONSULTANT_ACTIVITY_MAP.items():
                if activity in vals or activity == k:
                    candidates = vals
                    break
        if not candidates:
            raise ValueError(f"قيمة النشاط المهني '{activity}' غير صالحة")

    if specialization and specialization != "all":
        if isinstance(specialization, int) or (isinstance(specialization, str) and str(specialization).isdigit()):
            val_int = int(specialization)
            if 1 <= val_int <= 8:
                spec_id = val_int
            else:
                raise ValueError(f"معرف التخصص '{specialization}' غير صالح")
        elif specialization in CONSULTANT_SPECIALIZATION_MAP:
            spec_id = CONSULTANT_SPECIALIZATION_MAP[specialization]
        else:
            raise ValueError(f"قيمة التخصص '{specialization}' غير صالحة")

    return candidates, spec_id


def get_broadcast_target_query(
    db: Session, target_group: str = "all", user_filters: dict = None,
    consultant_filters: dict = None, audience: list[str] = None,
):
    """Builds and validates the SQLAlchemy query for broadcast recipients."""
    user_filters = user_filters or {}
    consultant_filters = consultant_filters or {}
    candidates, spec_id = _validate_consultant_filters(consultant_filters)

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
                if candidates or spec_id:
                    c_q = c_q.join(ConsultantProfile, User.id == ConsultantProfile.user_id)
                    if candidates:
                        c_q = c_q.filter(ConsultantProfile.activity_type.in_(candidates))
                    if spec_id:
                        c_q = c_q.filter(ConsultantProfile.main_specialization_id == spec_id)
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
            if legal_form not in [f.value for f in LegalForm]:
                raise ValueError(f"قيمة الشكل القانوني '{legal_form}' غير صالحة")
            query = query.filter(User.legal_form == legal_form)

        sector = user_filters.get("sector")
        if sector and sector != "all":
            if sector not in [s.value for s in BusinessSector]:
                raise ValueError(f"قيمة القطاع '{sector}' غير صالحة")
            query = query.filter(User.sector == sector)

    elif target_group == "consultants":
        query = query.filter(User.role.in_([UserRole.consultant, UserRole.platform_consultant]))
        if candidates or spec_id:
            query = query.join(ConsultantProfile, User.id == ConsultantProfile.user_id)
            if candidates:
                query = query.filter(ConsultantProfile.activity_type.in_(candidates))
            if spec_id:
                query = query.filter(ConsultantProfile.main_specialization_id == spec_id)
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

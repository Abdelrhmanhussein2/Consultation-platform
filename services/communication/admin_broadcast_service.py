from sqlalchemy import or_
from sqlalchemy.orm import Session

from helpers.enums import BusinessSector, EntityType, LegalForm, NotificationType, UserRole
from models.communication.notification import Notification
from models.users.user import User
from services.communication.live_notification_service import LiveNotificationService


def send_admin_broadcast(
    db: Session,
    title: str,
    message: str,
    target_group: str = "all",
    user_filters: dict = None,
    consultant_filters: dict = None,
    priority: str = "normal",
    audience: list[str] = None,
) -> int:
    """Sends an admin broadcast notification with targeted filters."""
    user_filters = user_filters or {}
    consultant_filters = consultant_filters or {}

    # Backward compatibility with legacy audience list
    if audience and target_group == "all":
        aud_set = set(audience)
        filters = []
        if "all" in aud_set:
            filters.append(User.role.in_([UserRole.user, UserRole.consultant, UserRole.platform_consultant]))
        else:
            if "user" in aud_set:
                filters.append((User.role == UserRole.user) & (User.entity_type == EntityType.individual))
            if "company" in aud_set:
                filters.append((User.role == UserRole.user) & (User.entity_type == EntityType.company))
            if "consultant" in aud_set:
                filters.append(User.role.in_([UserRole.consultant, UserRole.platform_consultant]))

        if not filters:
            return 0
        users = db.query(User).filter(User.is_active == True, or_(*filters)).all()
    else:
        query = db.query(User).filter(User.is_active == True)

        if target_group == "users":
            query = query.filter(User.role == UserRole.user)

            # Filter by Legal Form
            legal_form = user_filters.get("legal_form")
            if legal_form and legal_form != "all":
                valid_forms = [f.value for f in LegalForm]
                if legal_form in valid_forms:
                    query = query.filter(User.legal_form == legal_form)

            # Filter by Business Sector
            sector = user_filters.get("sector")
            if sector and sector != "all":
                valid_sectors = [s.value for s in BusinessSector]
                if sector in valid_sectors:
                    query = query.filter(User.sector == sector)

        elif target_group == "consultants":
            # Target active consultants without touching un-migrated profile fields
            query = query.filter(User.role.in_([UserRole.consultant, UserRole.platform_consultant]))
        else:
            # All active users and consultants
            query = query.filter(User.role.in_([UserRole.user, UserRole.consultant, UserRole.platform_consultant]))

        users = query.all()

    if not users:
        return 0

    rows = [
        Notification(
            user_id=u.id,
            type=NotificationType.general,
            title=title,
            message=message,
            related_entity_type="broadcast",
        )
        for u in users
    ]
    db.bulk_save_objects(rows)
    db.commit()

    try:
        for u in users:
            LiveNotificationService.push_notification(
                user_id=u.id,
                title=title,
                message=message,
                notif_type="general",
                extra={"related_entity_type": "broadcast", "priority": priority},
            )
    except Exception:
        pass

    return len(users)



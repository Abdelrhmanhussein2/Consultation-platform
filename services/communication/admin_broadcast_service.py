from sqlalchemy import or_
from sqlalchemy.orm import Session

from helpers.enums import EntityType, NotificationType, UserRole
from models.communication.notification import Notification
from models.users.user import User
from services.communication.live_notification_service import LiveNotificationService


def send_admin_broadcast(
    db: Session,
    title: str,
    message: str,
    audience: list[str],
) -> int:
    """Sends an admin broadcast notification to selected audience groups."""
    aud_set = set(audience or [])
    filters = []
    if not aud_set or "all" in aud_set:
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
                extra={"related_entity_type": "broadcast"},
            )
    except Exception:
        pass

    return len(users)


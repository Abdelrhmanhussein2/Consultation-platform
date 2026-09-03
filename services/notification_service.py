import uuid
from sqlalchemy.orm import Session
from models.notification import Notification
from helpers.enums import NotificationType

class NotificationService:
    @staticmethod
    def send(
        db: Session,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_entity_type: str = None,
        related_entity_id: uuid.UUID = None
    ) -> Notification:
        """
        Creates and persists a notification in the database.
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Dispatch real-time live WebSocket notification (Phase 3)
        try:
            from services.live_notification_service import LiveNotificationService
            LiveNotificationService.push_notification(
                user_id=user_id,
                title=title,
                message=message,
                notif_type=notification_type.value if hasattr(notification_type, "value") else str(notification_type),
                notif_id=notification.id,
                extra={
                    "related_entity_type": related_entity_type,
                    "related_entity_id": str(related_entity_id) if related_entity_id else None
                }
            )
        except Exception:
            pass

        return notification


    @staticmethod
    def send_application_approved(db: Session, user_id: uuid.UUID) -> Notification:
        """
        Sends an approval notification to a consultant.
        """
        return NotificationService.send(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.consultant_application_reviewed,
            title="قبول طلب الانضمام",
            message="تهانينا! تم قبول طلب انضمامك كمستشار في المنصة بنجاح. يمكنك الآن تسجيل الدخول وتقديم خدماتك."
        )

    @staticmethod
    def send_application_rejected(db: Session, user_id: uuid.UUID, rejection_reason: str) -> Notification:
        """
        Sends a rejection notification to a consultant, including the rejection reason.
        """
        reason_msg = f"السبب: {rejection_reason}" if rejection_reason else "يرجى مراجعة إدارة المنصة لمزيد من التفاصيل."
        return NotificationService.send(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.consultant_application_reviewed,
            title="رفض طلب الانضمام",
            message=f"نأسف لإبلاغك بأنه تم رفض طلب انضمامك كمستشار. {reason_msg}"
        )

    @staticmethod
    def send_credential_reviewed(
        db: Session, user_id: uuid.UUID, is_approved: bool, rejection_reason: str = None
    ) -> Notification:
        """
        Sends a notification regarding credential verification status.
        """
        status_str = "قبول" if is_approved else "رفض"
        reason_msg = f" السبب: {rejection_reason}" if (not is_approved and rejection_reason) else ""
        return NotificationService.send(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.credential_status_update,
            title="تحديث حالة الأوراق والمستندات",
            message=f"تم {status_str} أوراق التخصص الخاصة بك.{reason_msg}"
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: uuid.UUID,
        is_read: bool = None,
        page: int = 1,
        limit: int = 20,
    ) -> list[Notification]:
        """
        Retrieves paginated notifications for a user, newest first, with optional is_read filtering.
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        offset = (page - 1) * limit
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
        """
        Returns the count of unread notifications for a user.
        """
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        ).count()

    @staticmethod
    def mark_as_read(db: Session, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notification:
        """
        Marks a specific notification as read.
        """
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).first()
        if not notif:
            raise ValueError("Notification not found or does not belong to you")
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: Session, user_id: uuid.UUID) -> int:
        """
        Marks all unread notifications as read for a user and returns the updated count.
        """
        updated = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        ).update({"is_read": True})
        db.commit()
        return updated

    @staticmethod
    def delete_notification(db: Session, user_id: uuid.UUID, notification_id: uuid.UUID) -> bool:
        """
        Deletes a specific notification for the user.
        """
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).first()
        if not notif:
            return False
        db.delete(notif)
        db.commit()
        return True

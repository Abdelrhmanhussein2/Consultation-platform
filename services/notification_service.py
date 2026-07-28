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

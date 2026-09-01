import uuid
from typing import List, Tuple
from sqlalchemy.orm import Session, joinedload

from models import ChatMessage, Appointment, ConsultantProfile, User, Notification
from helpers.enums import NotificationType
from helpers.encryption import encrypt_text, decrypt_text


class ChatService:

    @staticmethod
    def _verify_appointment_access(
        db: Session, appointment_id: uuid.UUID, user_id: uuid.UUID
    ) -> Tuple[Appointment, uuid.UUID]:
        """
        Verifies that the appointment exists and that user_id is either the client or the consultant.
        Returns a tuple: (appointment, receiver_user_id).
        """
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise ValueError("الموعد غير موجود")

        consultant = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == appointment.consultant_id
        ).first()
        if not consultant:
            raise ValueError("ملف المستشار المرتبط بهذا الموعد غير موجود")

        consultant_user_id = consultant.user_id
        client_user_id = appointment.user_id

        if user_id == client_user_id:
            receiver_id = consultant_user_id
        elif user_id == consultant_user_id:
            receiver_id = client_user_id
        else:
            raise PermissionError("ليس لديك صلاحية للوصول إلى محادثة هذا الموعد")

        return appointment, receiver_id

    @staticmethod
    def send_message(
        db: Session,
        appointment_id: uuid.UUID,
        sender: User,
        message_text: str | None = None,
        attachment_url: str | None = None,
    ) -> dict:
        """
        Saves a new chat message encrypted at rest and triggers a notification for the receiver.
        """
        raw_text = message_text.strip() if message_text else None
        if not raw_text and not (attachment_url and attachment_url.strip()):
            raise ValueError("يجب إدخال نص الرسالة أو إرفاق ملف")

        appointment, receiver_id = ChatService._verify_appointment_access(
            db, appointment_id, sender.id
        )

        # Encrypt message text before storing in database
        encrypted_text = encrypt_text(raw_text) if raw_text else None

        chat_msg = ChatMessage(
            appointment_id=appointment_id,
            sender_id=sender.id,
            receiver_id=receiver_id,
            message_text=encrypted_text,
            attachment_url=attachment_url.strip() if attachment_url else None,
            is_read=False,
        )
        db.add(chat_msg)
        db.commit()
        db.refresh(chat_msg)

        # Notify the receiver in-app
        snippet = (
            (raw_text[:60] + "...")
            if raw_text and len(raw_text) > 60
            else (raw_text or "مرفق جديد")
        )
        db.add(Notification(
            user_id=receiver_id,
            type=NotificationType.general,
            title=f"رسالة جديدة من {sender.full_name}",
            message=snippet,
            related_entity_type="appointment_chat",
            related_entity_id=appointment_id,
        ))
        db.commit()

        # Push real-time live notification alert to recipient (Phase 3)
        try:
            from services.live_notification_service import LiveNotificationService
            LiveNotificationService.push_chat_message(
                receiver_id=receiver_id,
                appointment_id=appointment_id,
                sender_id=sender.id,
                sender_name=sender.full_name,
                message_id=chat_msg.id,
                message_text=raw_text or "مرفق جديد",
                created_at=chat_msg.created_at
            )
        except Exception:
            pass

        # Return dict with plaintext for caller
        return {
            "id": chat_msg.id,
            "appointment_id": chat_msg.appointment_id,
            "sender_id": chat_msg.sender_id,
            "sender_name": sender.full_name,
            "receiver_id": chat_msg.receiver_id,
            "message_text": raw_text,
            "attachment_url": chat_msg.attachment_url,
            "is_read": chat_msg.is_read,
            "created_at": chat_msg.created_at,
        }


    @staticmethod
    def get_messages(
        db: Session,
        appointment_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int = 1,
        limit: int = 50,
    ) -> list[dict]:
        """
        Retrieves paginated chat history for an appointment, ordered chronologically,
        with message text decrypted transparently for authorized users.
        """
        ChatService._verify_appointment_access(db, appointment_id, user_id)

        offset = (page - 1) * limit
        messages = (
            db.query(ChatMessage)
            .options(joinedload(ChatMessage.sender))
            .filter(ChatMessage.appointment_id == appointment_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        result = []
        for m in messages:
            decrypted_text = decrypt_text(m.message_text) if m.message_text else None
            result.append({
                "id": m.id,
                "appointment_id": m.appointment_id,
                "sender_id": m.sender_id,
                "sender_name": m.sender.full_name if m.sender else None,
                "receiver_id": m.receiver_id,
                "message_text": decrypted_text,
                "attachment_url": m.attachment_url,
                "is_read": m.is_read,
                "created_at": m.created_at,
            })
        return result

    @staticmethod
    def mark_chat_as_read(
        db: Session,
        appointment_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> int:
        """
        Marks all unread messages received by user_id in this appointment as read.
        """
        ChatService._verify_appointment_access(db, appointment_id, user_id)

        updated = db.query(ChatMessage).filter(
            ChatMessage.appointment_id == appointment_id,
            ChatMessage.receiver_id == user_id,
            ChatMessage.is_read == False,
        ).update({"is_read": True})
        db.commit()
        return updated

    @staticmethod
    def delete_messages(
        db: Session,
        appointment_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> int:
        """
        Deletes all messages associated with this appointment consultation chat.
        """
        ChatService._verify_appointment_access(db, appointment_id, user_id)

        deleted_count = db.query(ChatMessage).filter(
            ChatMessage.appointment_id == appointment_id
        ).delete(synchronize_session=False)
        db.commit()
        return deleted_count

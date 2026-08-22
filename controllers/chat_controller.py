import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import User
from schemes import ChatMessageCreate
from services import ChatService


class ChatController:

    @staticmethod
    def send_message(
        db: Session, current_user: User, appointment_id: str, msg_in: ChatMessageCreate
    ):
        """
        Sends a new message within an appointment consultation chat.
        """
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return ChatService.send_message(
                db=db,
                appointment_id=appt_uuid,
                sender=current_user,
                message_text=msg_in.message_text,
                attachment_url=msg_in.attachment_url,
            )
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_messages(
        db: Session, current_user: User, appointment_id: str, page: int, limit: int
    ):
        """
        Retrieves message history for an authorized user.
        """
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return ChatService.get_messages(
                db, appt_uuid, current_user.id, page=page, limit=limit
            )
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def mark_as_read(db: Session, current_user: User, appointment_id: str):
        """
        Marks unread messages in the chat session as read.
        """
        try:
            appt_uuid = uuid.UUID(appointment_id)
            count = ChatService.mark_chat_as_read(db, appt_uuid, current_user.id)
            return {
                "message": "تم تمييز الرسائل كمقروءة بنجاح",
                "marked_read_count": count,
            }
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from helpers.database import get_db, SessionLocal
from helpers.redis_client import get_redis
from helpers.websocket_manager import chat_ws_manager
from models import User
from schemes import ChatMessageCreate, ChatMessageOut, ChatReadResponse
from controllers import ChatController
from services import UserService, ChatService, TokenService
from services.auth_utils import verify_access_token
from routes.deps import get_current_active_user

router = APIRouter(prefix="/chat", tags=["Appointment Chat"])


@router.get(
    "/{appointment_id}/messages",
    response_model=List[ChatMessageOut],
    summary="Get appointment chat messages",
)
def get_chat_messages(
    appointment_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Messages per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the paginated message history for a specific appointment consultation chat.
    Accessible only by the client and the consultant associated with this appointment.
    """
    return ChatController.get_messages(
        db, current_user, appointment_id, page=page, limit=limit
    )


@router.post(
    "/{appointment_id}/messages",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Send a chat message via REST",
)
def send_chat_message(
    appointment_id: str,
    msg_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Sends a new message with optional file/document attachment in the appointment chat.
    Automatically identifies the recipient and creates an in-app notification.
    """
    return ChatController.send_message(db, current_user, appointment_id, msg_in)


@router.post(
    "/{appointment_id}/read",
    response_model=ChatReadResponse,
    summary="Mark chat messages as read",
)
def mark_chat_as_read(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks all unread messages received by the current user in this appointment chat as read.
    """
    return ChatController.mark_as_read(db, current_user, appointment_id)


# =====================================================================
# WEBSOCKET REAL-TIME CHAT ENDPOINT
# =====================================================================
@router.websocket("/ws/{appointment_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    appointment_id: str,
    token: Optional[str] = Query(None),
):
    """
    Real-time bidirectional WebSocket connection for consultation chat.
    Connect with: ws://host/api/chat/ws/{appointment_id}?token=<ACCESS_TOKEN>
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Validate JWT Token
    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check Redis blacklist if available
    try:
        redis_client = get_redis()
        jti = payload.get("jti")
        if jti and TokenService.is_jti_blacklisted(redis_client, jti):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        pass

    user_id_str = payload.get("sub")
    if not user_id_str:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user_uuid = uuid.UUID(user_id_str)
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    try:
        user = UserService.get_user_by_id(db, user_uuid)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Verify access to this appointment chat
        try:
            ChatService._verify_appointment_access(db, appt_uuid, user.id)
        except (ValueError, PermissionError):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Connect and register in room
        await chat_ws_manager.connect(str(appt_uuid), str(user.id), websocket)

        # Broadcast online presence
        await chat_ws_manager.broadcast_to_room(
            str(appt_uuid),
            {
                "type": "user_presence",
                "user_id": str(user.id),
                "user_name": user.full_name,
                "status": "online",
            },
            exclude_websocket=websocket,
        )

        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                continue

            event_type = data.get("type", "message")

            if event_type == "message":
                msg_text = data.get("message_text")
                att_url = data.get("attachment_url")
                if (msg_text and msg_text.strip()) or (att_url and att_url.strip()):
                    new_msg = ChatService.send_message(
                        db=db,
                        appointment_id=appt_uuid,
                        sender=user,
                        message_text=msg_text,
                        attachment_url=att_url,
                    )
                    # Broadcast new message to all active participants in the room
                    await chat_ws_manager.broadcast_to_room(
                        str(appt_uuid),
                        {
                            "type": "new_message",
                            "data": {
                                "id": str(new_msg.id),
                                "appointment_id": str(new_msg.appointment_id),
                                "sender_id": str(new_msg.sender_id),
                                "sender_name": user.full_name,
                                "receiver_id": str(new_msg.receiver_id),
                                "message_text": new_msg.message_text,
                                "attachment_url": new_msg.attachment_url,
                                "is_read": new_msg.is_read,
                                "created_at": new_msg.created_at.isoformat(),
                            },
                        },
                    )

            elif event_type == "typing":
                is_typing = bool(data.get("is_typing", True))
                await chat_ws_manager.broadcast_to_room(
                    str(appt_uuid),
                    {
                        "type": "typing",
                        "sender_id": str(user.id),
                        "sender_name": user.full_name,
                        "is_typing": is_typing,
                    },
                    exclude_websocket=websocket,
                )

            elif event_type == "read":
                count = ChatService.mark_chat_as_read(db, appt_uuid, user.id)
                await chat_ws_manager.broadcast_to_room(
                    str(appt_uuid),
                    {
                        "type": "messages_read",
                        "reader_id": str(user.id),
                        "marked_count": count,
                    },
                )

    except WebSocketDisconnect:
        chat_ws_manager.disconnect(str(appt_uuid), str(user_uuid), websocket)
        await chat_ws_manager.broadcast_to_room(
            str(appt_uuid),
            {
                "type": "user_presence",
                "user_id": str(user_uuid),
                "status": "offline",
            },
        )
    except Exception:
        chat_ws_manager.disconnect(str(appt_uuid), str(user_uuid), websocket)
    finally:
        db.close()

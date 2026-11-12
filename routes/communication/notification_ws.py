import json
import logging
import uuid
from typing import Optional
from fastapi import Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from helpers.database import SessionLocal
from helpers.redis_client import get_redis
from helpers.websocket_manager import notification_ws_manager
from services.auth.auth_utils import verify_access_token
from services.auth.token_service import TokenService
from services.communication.notification_service import NotificationService
from services.services import UserService

logger = logging.getLogger(__name__)


async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """Real-time JWT-authenticated WebSocket connection for notifications."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = verify_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        redis_client = get_redis()
        jti = payload.get("jti")
        if jti and TokenService.is_jti_blacklisted(redis_client, jti):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        pass

    user_id_str = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id_str) if user_id_str else None
    except ValueError:
        user_uuid = None

    if not user_uuid:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    user = None
    try:
        user = UserService.get_user_by_id(db, user_uuid)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await notification_ws_manager.connect(str(user.id), user.role.value, websocket)
        unread_count = NotificationService.get_unread_count(db, user.id)
        await websocket.send_text(json.dumps({
            "event": "connected",
            "data": {
                "user_id": str(user.id),
                "full_name": user.full_name,
                "role": user.role.value,
                "unread_notifications": unread_count,
            },
        }, default=str))

        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                msg_type = data.get("type")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "mark_read" and data.get("notification_id"):
                    try:
                        notif_uuid = uuid.UUID(data["notification_id"])
                        NotificationService.mark_as_read(db, user.id, notif_uuid)
                        new_count = NotificationService.get_unread_count(db, user.id)
                        await websocket.send_text(json.dumps({
                            "event": "unread_count_sync",
                            "data": {"unread_count": new_count},
                        }))
                    except Exception as e:
                        logger.warning(f"Error marking notification as read over WS: {e}")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        if user:
            notification_ws_manager.disconnect(str(user.id), websocket)
    except Exception as e:
        logger.error(f"Unexpected error in notification WebSocket: {e}")
        if user:
            notification_ws_manager.disconnect(str(user.id), websocket)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
    finally:
        db.close()


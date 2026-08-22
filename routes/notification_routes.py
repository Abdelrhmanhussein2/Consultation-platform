from fastapi import APIRouter, Depends, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import uuid
import logging

from helpers.database import get_db, SessionLocal
from helpers.redis_client import get_redis
from helpers.websocket_manager import notification_ws_manager
from models import User
from schemes import NotificationOut, UnreadCountOut, NotificationBulkReadOut
from controllers import NotificationController
from services.auth_utils import verify_access_token
from services.token_service import TokenService
from services.services import UserService
from services.notification_service import NotificationService
from routes.deps import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=List[NotificationOut],
    summary="Get user notifications",
)
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status (true/false)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user's notifications, newest first.
    Can filter by `is_read` status (e.g. `?is_read=false` to see only unread notifications).
    """
    return NotificationController.get_my_notifications(
        db, current_user, is_read=is_read, page=page, limit=limit
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountOut,
    summary="Get unread notifications count",
)
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the count of unread notifications for badge display in the frontend.
    """
    return NotificationController.get_unread_count(db, current_user)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
    summary="Mark a notification as read",
)
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks a single notification as read.
    Only the owner of the notification can mark it as read.
    """
    return NotificationController.mark_as_read(db, current_user, notification_id)


@router.post(
    "/read-all",
    response_model=NotificationBulkReadOut,
    summary="Mark all notifications as read",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks all unread notifications for the logged-in user as read.
    """
    return NotificationController.mark_all_as_read(db, current_user)


# =====================================================================
# REAL-TIME NOTIFICATION WEBSOCKET HUB (PHASE 3)
# =====================================================================
@router.websocket("/ws")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    Real-time JWT-authenticated WebSocket connection for user notifications,
    chat alerts, payout updates, and administrative broadcasts.
    Connect with: ws://host/api/notifications/ws?token=<ACCESS_TOKEN>
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
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    user = None
    try:
        user = UserService.get_user_by_id(db, user_uuid)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Register active socket with user role
        await notification_ws_manager.connect(str(user.id), user.role.value, websocket)

        # Send initial connection handshake confirmation
        unread_count = NotificationService.get_unread_count(db, user.id)
        handshake_payload = {
            "event": "connected",
            "data": {
                "user_id": str(user.id),
                "full_name": user.full_name,
                "role": user.role.value,
                "unread_notifications": unread_count
            }
        }
        await websocket.send_text(json.dumps(handshake_payload, default=str))

        # Main message loop (handles ping/pong and client actions)
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                msg_type = data.get("type")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "mark_read":
                    notif_id = data.get("notification_id")
                    if notif_id:
                        try:
                            notif_uuid = uuid.UUID(notif_id)
                            NotificationService.mark_as_read(db, user.id, notif_uuid)
                            new_count = NotificationService.get_unread_count(db, user.id)
                            await websocket.send_text(json.dumps({
                                "event": "unread_count_sync",
                                "data": {"unread_count": new_count}
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

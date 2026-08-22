import asyncio
import logging
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from helpers.websocket_manager import notification_ws_manager

logger = logging.getLogger(__name__)


class LiveNotificationService:
    """
    Unified dispatcher for real-time WebSocket notifications.
    Safely dispatches events in both async and sync contexts using running event loops.
    """

    @staticmethod
    def _safe_dispatch(coro):
        """Dispatches an async coroutine safely from any context."""
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.create_task(coro)
            else:
                loop.run_until_complete(coro)
        except RuntimeError:
            # No running event loop in this thread
            try:
                asyncio.run(coro)
            except Exception as e:
                logger.warning(f"Failed to dispatch background WebSocket coroutine: {e}")

    @classmethod
    def push_to_user(cls, user_id: uuid.UUID | str, event_type: str, data: dict):
        """Sends a real-time event payload to all active sockets of a user."""
        cls._safe_dispatch(notification_ws_manager.send_to_user(str(user_id), event_type, data))

    @classmethod
    def push_notification(
        cls,
        user_id: uuid.UUID | str,
        title: str,
        message: str,
        notif_type: str = "general",
        notif_id: Optional[uuid.UUID | str] = None,
        extra: Optional[dict] = None
    ):
        """Pushes a standard in-app notification to the recipient's live connection."""
        data = {
            "id": str(notif_id) if notif_id else str(uuid.uuid4()),
            "title": title,
            "message": message,
            "type": notif_type,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "extra": extra or {}
        }
        cls.push_to_user(user_id, "new_notification", data)

    @classmethod
    def push_chat_message(
        cls,
        receiver_id: uuid.UUID | str,
        appointment_id: uuid.UUID | str,
        sender_id: uuid.UUID | str,
        sender_name: str,
        message_id: uuid.UUID | str,
        message_text: str,
        created_at: Optional[datetime] = None
    ):
        """
        Pushes a real-time message alert to the receiver's global notification socket,
        ensuring they receive real-time notifications even when on another tab/page.
        """
        data = {
            "message_id": str(message_id),
            "appointment_id": str(appointment_id),
            "sender_id": str(sender_id),
            "sender_name": sender_name,
            "message_text": message_text,
            "created_at": (created_at or datetime.now(timezone.utc)).isoformat()
        }
        cls.push_to_user(receiver_id, "chat_message_received", data)

    @classmethod
    def push_payout_update(
        cls,
        consultant_user_id: uuid.UUID | str,
        payout_id: uuid.UUID | str,
        status: str,
        amount: Decimal | float,
        currency: str,
        message: str
    ):
        """Pushes payout approval/transfer/rejection updates directly to the consultant."""
        data = {
            "payout_id": str(payout_id),
            "status": status,
            "amount": float(amount),
            "currency": currency,
            "message": message,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        cls.push_to_user(consultant_user_id, "payout_status_updated", data)

    @classmethod
    def broadcast_announcement(
        cls,
        audience: str,
        title: str,
        message: str,
        extra: Optional[dict] = None
    ):
        """
        Broadcasts an announcement live to connected users based on audience target.
        """
        data = {
            "title": title,
            "message": message,
            "audience": audience,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "extra": extra or {}
        }
        if audience == "all":
            cls._safe_dispatch(notification_ws_manager.broadcast_to_all("system_broadcast", data))
        elif audience in ["users_only", "user"]:
            cls._safe_dispatch(notification_ws_manager.broadcast_to_role("user", "system_broadcast", data))
        elif audience in ["consultants_only", "consultant"]:
            cls._safe_dispatch(notification_ws_manager.broadcast_to_role("consultant", "system_broadcast", data))
        elif audience in ["admins_only", "admin", "super_admin"]:
            cls._safe_dispatch(notification_ws_manager.broadcast_to_role("admin", "system_broadcast", data))
        else:
            cls._safe_dispatch(notification_ws_manager.broadcast_to_all("system_broadcast", data))

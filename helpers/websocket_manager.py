import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ChatConnectionManager:
    """
    Manages active WebSocket connections organized by appointment_id.
    Enables live message broadcasting, typing indicators, and presence awareness.
    """

    def __init__(self):
        # Maps appointment_id (str) -> list of {"user_id": str, "websocket": WebSocket}
        self.active_connections: Dict[str, List[Dict[str, any]]] = {}

    async def connect(self, appointment_id: str, user_id: str, websocket: WebSocket):
        """Accepts the websocket connection and registers it in the room."""
        await websocket.accept()
        if appointment_id not in self.active_connections:
            self.active_connections[appointment_id] = []
        self.active_connections[appointment_id].append({
            "user_id": user_id,
            "websocket": websocket,
        })
        logger.info(f"WebSocket connected: user {user_id} in appointment {appointment_id}")

    def disconnect(self, appointment_id: str, user_id: str, websocket: WebSocket):
        """Removes the disconnected socket from the room."""
        if appointment_id in self.active_connections:
            self.active_connections[appointment_id] = [
                conn
                for conn in self.active_connections[appointment_id]
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[appointment_id]:
                del self.active_connections[appointment_id]
        logger.info(f"WebSocket disconnected: user {user_id} from appointment {appointment_id}")

    def is_user_online(self, appointment_id: str, user_id: str) -> bool:
        """Checks if a specific user is currently active in the appointment chat room."""
        if appointment_id not in self.active_connections:
            return False
        return any(conn["user_id"] == user_id for conn in self.active_connections[appointment_id])

    async def broadcast_to_room(
        self,
        appointment_id: str,
        message: dict,
        exclude_websocket: Optional[WebSocket] = None,
    ):
        """Broadcasts a JSON-serializable message to all active sockets in the room."""
        if appointment_id in self.active_connections:
            payload = json.dumps(message, default=str)
            for conn in list(self.active_connections[appointment_id]):
                ws = conn["websocket"]
                if exclude_websocket and ws == exclude_websocket:
                    continue
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending WebSocket message to user {conn['user_id']}: {e}")


chat_ws_manager = ChatConnectionManager()


# =====================================================================
# NOTIFICATION CONNECTION MANAGER (REAL-TIME LIVE WS HUB - PHASE 3)
# =====================================================================
class NotificationConnectionManager:
    """
    Central real-time WebSocket hub for user notifications and system alerts.
    Organized by user_id to deliver instant notifications across all active tabs/devices.
    Supports JWT-authenticated direct user dispatch, role-based broadcasting, and global broadcasting.
    """

    def __init__(self):
        # Maps user_id (str) -> List of WebSocket connections
        self.user_sockets: Dict[str, List[WebSocket]] = {}
        # Maps user_id (str) -> role (str)
        self.user_roles: Dict[str, str] = {}

    async def connect(self, user_id: str, role: str, websocket: WebSocket):
        """Accepts WebSocket connection and associates it with the authenticated user."""
        await websocket.accept()
        str_uid = str(user_id)
        if str_uid not in self.user_sockets:
            self.user_sockets[str_uid] = []
        self.user_sockets[str_uid].append(websocket)
        self.user_roles[str_uid] = str(role)
        logger.info(f"Notification WS connected: user={str_uid} (role={role}, active_sockets={len(self.user_sockets[str_uid])})")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Removes a disconnected socket from user's active sockets."""
        str_uid = str(user_id)
        if str_uid in self.user_sockets:
            self.user_sockets[str_uid] = [
                ws for ws in self.user_sockets[str_uid] if ws != websocket
            ]
            if not self.user_sockets[str_uid]:
                del self.user_sockets[str_uid]
                self.user_roles.pop(str_uid, None)
        logger.info(f"Notification WS disconnected: user={str_uid}")

    def is_user_online(self, user_id: str) -> bool:
        """Checks if a user has at least one active notification socket."""
        str_uid = str(user_id)
        return str_uid in self.user_sockets and len(self.user_sockets[str_uid]) > 0

    def get_online_user_ids(self) -> List[str]:
        """Returns a list of all currently connected user IDs."""
        return list(self.user_sockets.keys())

    async def send_to_user(self, user_id: str, event_type: str, data: dict):
        """
        Pushes a real-time event to all active sockets of a specific user.
        """
        from datetime import datetime, timezone
        str_user_id = str(user_id)
        if str_user_id not in self.user_sockets:
            return

        payload = json.dumps({
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }, default=str)

        dead_sockets = []
        for ws in list(self.user_sockets[str_user_id]):
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send notification WS to user {str_user_id}: {e}")
                dead_sockets.append(ws)

        # Cleanup dead sockets
        for dead_ws in dead_sockets:
            self.disconnect(str_user_id, dead_ws)

    async def broadcast_to_role(self, role: str, event_type: str, data: dict):
        """
        Broadcasts an event to all connected users belonging to a specific role.
        """
        role_str = str(role)
        target_user_ids = [
            uid for uid, r in self.user_roles.items()
            if r == role_str or (role_str == "admin" and r in ["admin", "super_admin"])
        ]
        for uid in target_user_ids:
            await self.send_to_user(uid, event_type, data)

    async def broadcast_to_all(self, event_type: str, data: dict):
        """
        Broadcasts an event to all connected users across the platform.
        """
        all_user_ids = list(self.user_sockets.keys())
        for uid in all_user_ids:
            await self.send_to_user(uid, event_type, data)


notification_ws_manager = NotificationConnectionManager()


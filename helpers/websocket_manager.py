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

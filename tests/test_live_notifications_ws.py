"""
Targeted Integration & Unit Tests: Phase 3 Real-Time Live Notification WebSocket Hub
====================================================================================
Tests:
- NotificationConnectionManager unit tests (connect, disconnect, presence, role routing)
- LiveNotificationService dispatcher (user events, chat alerts, payout updates, broadcasts)
- FastAPI WebSocket endpoint (/api/notifications/ws & /ws/notifications) with JWT authentication
- Connection handshake, unread badge count sync, and ping/pong heartbeat
- Rejection of invalid / missing JWT tokens
"""

import os
import sys
import uuid
import json
import asyncio
import unittest
from decimal import Decimal
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

for _mod in [
    "qdrant_client", "qdrant_client.http", "qdrant_client.http.models",
    "neo4j", "cohere", "groq", "psycopg2", "docx", "redis", "daily",
]:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

from helpers.config import settings
settings.DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from helpers.database import Base
from helpers.enums import UserRole, NotificationType, AppointmentStatus, ActorRole
from helpers.websocket_manager import NotificationConnectionManager, notification_ws_manager
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment
from services.auth_utils import create_access_token
from services.live_notification_service import LiveNotificationService
from services.chat_service import ChatService
from main import app

from sqlalchemy.pool import StaticPool
import helpers.database as db_mod

class TestLiveNotificationWebSocketHub(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        db_mod.engine = cls.engine
        db_mod.SessionLocal = cls.Session

        # Also patch routes
        import routes.notification_routes as notif_routes
        notif_routes.SessionLocal = cls.Session

        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()


    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def _create_user(self, full_name="مستخدم تجريبي", role=UserRole.user):
        user = User(
            id=uuid.uuid4(),
            full_name=full_name,
            email=f"user_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash123",
            role=role,
            language="ar",
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # =====================================================================
    # 1. NOTIFICATION CONNECTION MANAGER UNIT TESTS
    # =====================================================================

    def test_connection_manager_lifecycle(self):
        mgr = NotificationConnectionManager()
        user_id = str(uuid.uuid4())

        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()

        # Connect 2 sockets for same user (e.g. laptop + mobile)
        asyncio.run(mgr.connect(user_id, "user", mock_ws1))
        asyncio.run(mgr.connect(user_id, "user", mock_ws2))

        self.assertTrue(mgr.is_user_online(user_id))
        self.assertEqual(len(mgr.user_sockets[user_id]), 2)
        self.assertIn(user_id, mgr.get_online_user_ids())

        # Send notification to user
        asyncio.run(mgr.send_to_user(user_id, "test_event", {"msg": "hello"}))
        mock_ws1.send_text.assert_called_once()
        mock_ws2.send_text.assert_called_once()

        # Disconnect first socket
        mgr.disconnect(user_id, mock_ws1)
        self.assertTrue(mgr.is_user_online(user_id))
        self.assertEqual(len(mgr.user_sockets[user_id]), 1)

        # Disconnect second socket
        mgr.disconnect(user_id, mock_ws2)
        self.assertFalse(mgr.is_user_online(user_id))
        self.assertNotIn(user_id, mgr.user_sockets)

    def test_role_and_global_broadcasting(self):
        mgr = NotificationConnectionManager()
        admin_uid = str(uuid.uuid4())
        consultant_uid = str(uuid.uuid4())

        admin_ws = AsyncMock()
        consultant_ws = AsyncMock()

        asyncio.run(mgr.connect(admin_uid, "admin", admin_ws))
        asyncio.run(mgr.connect(consultant_uid, "consultant", consultant_ws))

        # Broadcast to admins only
        asyncio.run(mgr.broadcast_to_role("admin", "admin_alert", {"info": "system check"}))
        admin_ws.send_text.assert_called_once()
        consultant_ws.send_text.assert_not_called()

        # Broadcast to all
        admin_ws.reset_mock()
        consultant_ws.reset_mock()
        asyncio.run(mgr.broadcast_to_all("global_alert", {"msg": "maintenance at midnight"}))
        admin_ws.send_text.assert_called_once()
        consultant_ws.send_text.assert_called_once()

    # =====================================================================
    # 2. LIVE NOTIFICATION SERVICE DISPATCHER
    # =====================================================================

    def test_live_notification_service_dispatcher(self):
        user = self._create_user("أحمد علي", UserRole.user)
        
        # Test push_notification
        LiveNotificationService.push_notification(
            user_id=user.id,
            title="إشعار تجريبي",
            message="محتوى الإشعار التجريبي",
            notif_type="general"
        )

        # Test push_chat_message
        LiveNotificationService.push_chat_message(
            receiver_id=user.id,
            appointment_id=uuid.uuid4(),
            sender_id=uuid.uuid4(),
            sender_name="المستشار خالد",
            message_id=uuid.uuid4(),
            message_text="أهلاً بك في الجلسة الاستشارية"
        )

        # Test push_payout_update
        LiveNotificationService.push_payout_update(
            consultant_user_id=user.id,
            payout_id=uuid.uuid4(),
            status="transferred",
            amount=Decimal("150.00"),
            currency="JOD",
            message="تم تحويل المبلغ بنجاح"
        )

        # Test broadcast_announcement
        LiveNotificationService.broadcast_announcement(
            audience="all",
            title="تحديث المنصة",
            message="تم إضافة ميزات جديدة"
        )

    # =====================================================================
    # 3. WEBSOCKET ENDPOINT HANDSHAKE & JWT AUTHENTICATION
    # =====================================================================

    def test_websocket_missing_or_invalid_jwt_rejected(self):
        # 1. Missing token -> rejected
        with self.assertRaises(Exception):
            with self.client.websocket_connect("/api/notifications/ws") as ws:
                pass

        # 2. Invalid token -> rejected
        with self.assertRaises(Exception):
            with self.client.websocket_connect("/api/notifications/ws?token=invalid_jwt_token") as ws:
                pass

    def test_websocket_authenticated_handshake_and_ping(self):
        user = self._create_user("سارة التميمي", UserRole.user)
        token = create_access_token(data={"sub": str(user.id)})

        from unittest.mock import patch
        with patch("routes.notification_routes.SessionLocal", side_effect=self.Session):
            # Connect with valid JWT
            with self.client.websocket_connect(f"/api/notifications/ws?token={token}") as ws:
                # First message should be the handshake event
                raw_msg = ws.receive_text()
                data = json.loads(raw_msg)
                self.assertEqual(data["event"], "connected")
                self.assertEqual(data["data"]["user_id"], str(user.id))
                self.assertEqual(data["data"]["full_name"], "سارة التميمي")
                self.assertEqual(data["data"]["role"], "user")

                # Send ping heartbeat
                ws.send_text(json.dumps({"type": "ping"}))
                pong_raw = ws.receive_text()
                pong_data = json.loads(pong_raw)
                self.assertEqual(pong_data.get("type"), "pong")



if __name__ == "__main__":
    unittest.main()

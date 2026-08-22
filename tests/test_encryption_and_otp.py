"""
Unit & Integration Tests: Encryption and OTP Workflows (Phase 1)
===============================================================
Tests:
- AES-256 Fernet Encryption and Decryption
- Bank and string masking helpers
- Chat message storage encryption at rest and transparent decryption
- Email change with OTP verification
- Password reset with OTP verification
- Change password confirm_password schema validation
"""

import os
import sys
import uuid
import unittest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Mock out heavy external services if not present
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

from datetime import datetime, timezone, timedelta
from helpers.database import Base
from helpers.enums import UserRole, AppointmentStatus, ActorRole
from helpers.encryption import (
    encrypt_text, decrypt_text,
    mask_bank_account, mask_iban, mask_string
)
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment
from models.chat_message import ChatMessage
from models.refresh_token import RefreshToken
from services.services import UserService
from services.chat_service import ChatService
from services.auth_utils import hash_password, verify_password
from schemes import (
    ChangePasswordRequest, VerifyPasswordOtpAndResetRequest,
    EmailChangeVerify, RequestPasswordOtpRequest
)

SQLITE_URL = "sqlite:///:memory:"

class FakeRedis:
    """In-memory dictionary mock for Redis get, setex, set, delete."""
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ex=None):
        self.store[key] = str(value)

    def setex(self, key, time, value):
        self.store[key] = str(value)

    def delete(self, key):
        if key in self.store:
            del self.store[key]


class TestEncryptionAndOTP(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            SQLITE_URL,
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    # =====================================================================
    # 1. ENCRYPTION & MASKING UNIT TESTS
    # =====================================================================

    def test_encryption_decryption_roundtrip(self):
        secret_text = "استشارة ضريبية سرية للغاية - الضرائب العقارية 2026"
        ciphertext = encrypt_text(secret_text)
        
        self.assertIsNotNone(ciphertext)
        self.assertNotEqual(ciphertext, secret_text)
        self.assertGreater(len(ciphertext), len(secret_text))
        
        decrypted = decrypt_text(ciphertext)
        self.assertEqual(decrypted, secret_text)

    def test_encryption_handles_empty_and_none(self):
        self.assertIsNone(encrypt_text(None))
        self.assertEqual(encrypt_text(""), "")
        self.assertIsNone(decrypt_text(None))
        self.assertEqual(decrypt_text(""), "")

    def test_decryption_graceful_fallback(self):
        plain = "Old legacy unencrypted message"
        result = decrypt_text(plain)
        self.assertEqual(result, plain)

    def test_mask_bank_account(self):
        self.assertEqual(mask_bank_account("1234567890123456"), "**** **** **** 3456")
        self.assertEqual(mask_bank_account("1234"), "****")
        self.assertIsNone(mask_bank_account(None))

    def test_mask_iban(self):
        self.assertEqual(mask_iban("EG1234567890123456789012345678"), "EG** **** **** **** **** 5678")
        self.assertIsNone(mask_iban(None))

    def test_mask_string(self):
        self.assertEqual(mask_string("sk_live_123456789abcdef", visible_suffix=4), "••••••••••••cdef")
        self.assertIsNone(mask_string(None))

    # =====================================================================
    # 2. CHAT MESSAGES ENCRYPTION AT REST
    # =====================================================================

    def test_chat_messages_encrypted_in_database(self):
        # 1. Create client & consultant user
        client = User(
            id=uuid.uuid4(),
            full_name="العميل أحمد",
            email=f"client_{uuid.uuid4().hex[:6]}@test.com",
            password_hash=hash_password("Password123!"),
            role=UserRole.user,
            language="ar"
        )
        consultant_user = User(
            id=uuid.uuid4(),
            full_name="المستشار محمود",
            email=f"consultant_{uuid.uuid4().hex[:6]}@test.com",
            password_hash=hash_password("Password123!"),
            role=UserRole.consultant,
            language="ar"
        )
        self.db.add_all([client, consultant_user])
        self.db.commit()

        consultant_profile = ConsultantProfile(
            id=uuid.uuid4(),
            user_id=consultant_user.id,
            bio="مستشار ضرائب معتمد"
        )
        self.db.add(consultant_profile)
        self.db.commit()

        # 2. Create appointment
        appt = Appointment(
            id=uuid.uuid4(),
            user_id=client.id,
            consultant_id=consultant_profile.id,
            status=AppointmentStatus.confirmed,
            scheduled_at=datetime.now(timezone.utc),
            created_by_role=ActorRole.user,
        )
        self.db.add(appt)
        self.db.commit()

        # 3. Send a secret chat message
        plain_secret = "هذا نص استشارة سرية يتضمن أرقام الحسابات والأرباح"
        sent_res = ChatService.send_message(
            db=self.db,
            appointment_id=appt.id,
            sender=client,
            message_text=plain_secret
        )

        self.assertEqual(sent_res["message_text"], plain_secret)

        # 4. Check raw database row - it MUST be encrypted ciphertext
        raw_db_row = self.db.query(ChatMessage).filter(ChatMessage.id == sent_res["id"]).first()
        self.assertIsNotNone(raw_db_row)
        self.assertNotEqual(raw_db_row.message_text, plain_secret)
        self.assertGreater(len(raw_db_row.message_text), 40)

        # 5. Query via ChatService.get_messages - it MUST decrypt transparently
        history = ChatService.get_messages(db=self.db, appointment_id=appt.id, user_id=consultant_user.id)
        self.assertGreaterEqual(len(history), 1)
        target_msg = next(m for m in history if m["id"] == sent_res["id"])
        self.assertEqual(target_msg["message_text"], plain_secret)

    # =====================================================================
    # 3. EMAIL CHANGE OTP WORKFLOW
    # =====================================================================

    def test_email_change_otp_workflow(self):
        fake_redis = FakeRedis()
        
        user = User(
            id=uuid.uuid4(),
            full_name="ياسر إبراهيم",
            email=f"yasser_{uuid.uuid4().hex[:6]}@test.com",
            password_hash=hash_password("SecurePass123!"),
            role=UserRole.user,
            language="ar"
        )
        self.db.add(user)
        self.db.commit()

        # 1. Request with wrong current password -> fails
        with self.assertRaises(ValueError):
            UserService.request_email_change(
                db=self.db,
                user=user,
                new_email="yasser_new@test.com",
                current_password="WrongPassword123!",
                redis_client=fake_redis
            )

        # 2. Request with correct password -> saves OTP in redis
        res = UserService.request_email_change(
            db=self.db,
            user=user,
            new_email="yasser_new@test.com",
            current_password="SecurePass123!",
            redis_client=fake_redis
        )
        self.assertEqual(res["new_email"], "yasser_new@test.com")
        
        redis_key = f"email_change_otp:{user.id}:yasser_new@test.com"
        saved_otp = fake_redis.get(redis_key)
        self.assertIsNotNone(saved_otp)
        self.assertEqual(len(saved_otp), 6)

        # 3. Verify with wrong OTP -> fails
        with self.assertRaises(ValueError):
            UserService.verify_email_change(
                db=self.db,
                user=user,
                new_email="yasser_new@test.com",
                otp_code="000000",
                redis_client=fake_redis
            )

        # 4. Verify with correct OTP -> updates email in DB
        verify_res = UserService.verify_email_change(
            db=self.db,
            user=user,
            new_email="yasser_new@test.com",
            otp_code=saved_otp,
            redis_client=fake_redis
        )
        self.assertEqual(verify_res["email"], "yasser_new@test.com")

        # Check DB user email
        refreshed_user = self.db.query(User).filter(User.id == user.id).first()
        self.assertEqual(refreshed_user.email, "yasser_new@test.com")
        self.assertIsNone(fake_redis.get(redis_key))

    # =====================================================================
    # 4. PASSWORD RESET OTP WORKFLOW
    # =====================================================================

    def test_password_reset_otp_workflow(self):
        fake_redis = FakeRedis()

        email = f"karim_{uuid.uuid4().hex[:6]}@test.com"
        user = User(
            id=uuid.uuid4(),
            full_name="كريم حسن",
            email=email,
            password_hash=hash_password("OldPassword123!"),
            role=UserRole.user,
            language="ar"
        )
        self.db.add(user)
        self.db.commit()

        # Add active refresh token to verify it gets revoked
        token = RefreshToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash="fake_hash_123",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        self.db.add(token)
        self.db.commit()

        # 1. Request OTP
        req_res = UserService.request_password_otp(
            db=self.db,
            email=email,
            redis_client=fake_redis
        )
        self.assertEqual(req_res["email"], email)

        otp_code = fake_redis.get(f"pwd_reset_otp:{email}")
        self.assertIsNotNone(otp_code)
        self.assertEqual(len(otp_code), 6)

        # 2. Verify with wrong OTP -> fails
        with self.assertRaises(ValueError):
            UserService.verify_password_otp_and_reset(
                db=self.db,
                email=email,
                otp_code="999999",
                new_password="NewSecurePassword123!",
                redis_client=fake_redis
            )

        # 3. Verify with correct OTP -> updates password and revokes tokens
        reset_res = UserService.verify_password_otp_and_reset(
            db=self.db,
            email=email,
            otp_code=otp_code,
            new_password="NewSecurePassword123!",
            redis_client=fake_redis
        )
        self.assertIn("نجاح", reset_res["message"])

        # Verify password hash updated
        self.db.refresh(user)
        self.assertTrue(verify_password("NewSecurePassword123!", user.password_hash))

        # Verify refresh tokens revoked
        tokens_count = self.db.query(RefreshToken).filter(RefreshToken.user_id == user.id).count()
        self.assertEqual(tokens_count, 0)

    # =====================================================================
    # 5. SCHEMA VALIDATION TESTS
    # =====================================================================

    def test_change_password_confirm_validation(self):
        # Matching confirm password -> valid
        req = ChangePasswordRequest(
            current_password="OldPass123!",
            new_password="NewPassword123!",
            confirm_password="NewPassword123!"
        )
        self.assertEqual(req.new_password, "NewPassword123!")

        # Mismatched confirm password -> raises ValueError
        with self.assertRaises(ValueError):
            ChangePasswordRequest(
                current_password="OldPass123!",
                new_password="NewPassword123!",
                confirm_password="DifferentPassword123!"
            )

    def test_verify_password_otp_schema_validation(self):
        req = VerifyPasswordOtpAndResetRequest(
            email="user@test.com",
            otp_code="123456",
            new_password="NewPassword123!",
            confirm_password="NewPassword123!"
        )
        self.assertEqual(req.otp_code, "123456")

        with self.assertRaises(ValueError):
            VerifyPasswordOtpAndResetRequest(
                email="user@test.com",
                otp_code="123456",
                new_password="NewPassword123!",
                confirm_password="MismatchPass123!"
            )


if __name__ == "__main__":
    unittest.main()

"""
Targeted Integration & Unit Tests: Consultant Bank Account, Wallet & Payouts (Jordan / JOD & USD)
==================================================================================================
Tests:
- Supported Jordanian banks registry (Arab Bank, Housing Bank, Islamic Bank, etc.)
- Field-level AES-256 encryption on bank accounts & masked output
- Real-time wallet balance calculation in JOD with dual-currency USD equivalence
- Payout request creation and validation (insufficient balance, min limit in JOD/USD)
- Admin payout processing lifecycle (approve, transfer, reject) and notification dispatch
"""

import os
import sys
import uuid
import unittest
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

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

from helpers.database import Base
from helpers.enums import (
    UserRole, AppointmentStatus, ActorRole, PayoutStatus, NotificationType
)
from helpers.encryption import decrypt_text
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.consultant_bank_account import ConsultantBankAccount
from models.payout_request import PayoutRequest
from models.appointment import Appointment
from models.notification import Notification
from services.wallet_service import WalletService
from schemes import ConsultantBankAccountCreate, AdminPayoutAction

SQLITE_URL = "sqlite:///:memory:"

class TestBankAndWallet(unittest.TestCase):

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

    def _create_consultant(self, full_name="المستشار علي"):
        u = User(
            id=uuid.uuid4(),
            full_name=full_name,
            email=f"cons_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash123",
            role=UserRole.consultant,
            language="ar"
        )
        self.db.add(u)
        self.db.commit()

        p = ConsultantProfile(
            id=uuid.uuid4(),
            user_id=u.id,
            bio="مستشار مالي وقانوني معتمد في الأردن"
        )
        self.db.add(p)
        self.db.commit()
        return u, p

    def _create_admin(self):
        admin = User(
            id=uuid.uuid4(),
            full_name="الأدمن العام",
            email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash123",
            role=UserRole.super_admin,
            language="ar"
        )
        self.db.add(admin)
        self.db.commit()
        return admin

    # =====================================================================
    # 1. SUPPORTED JORDANIAN BANKS REGISTRY
    # =====================================================================

    def test_supported_banks_list(self):
        all_banks = WalletService.get_supported_banks()
        self.assertGreaterEqual(len(all_banks), 10)

        jo_banks = WalletService.get_supported_banks(country="JO")
        self.assertTrue(all(b["country"] in ["JO", "INT"] for b in jo_banks))
        self.assertTrue(any(b["code"] == "ARAB" for b in jo_banks))
        self.assertTrue(any(b["code"] == "HBTF" for b in jo_banks))

    # =====================================================================
    # 2. ENCRYPTED BANK ACCOUNT MANAGEMENT (JORDAN BANK)
    # =====================================================================

    def test_consultant_bank_account_crud_and_encryption(self):
        _, profile = self._create_consultant("المستشار سامح")

        bank_in = ConsultantBankAccountCreate(
            bank_name="البنك العربي",
            account_holder_name="سامح عبد الله المجالي",
            account_number="1234567890123456",
            iban="JO94ARAB0000000012345678901234",
            swift_code="ARABJOAX",
            branch_name="فرع الشميساني - عمان",
            currency="JOD"
        )

        # 1. Save Bank Account
        saved = WalletService.upsert_bank_account(self.db, profile.id, bank_in)
        self.assertEqual(saved["bank_name"], "البنك العربي")
        self.assertEqual(saved["currency"], "JOD")
        self.assertEqual(saved["masked_account_number"], "**** **** **** 3456")
        self.assertEqual(saved["masked_iban"], "JO** **** **** **** **** 1234")

        # 2. Direct DB query to verify AES-256 ciphertext stored
        raw_db_row = self.db.query(ConsultantBankAccount).filter(
            ConsultantBankAccount.consultant_id == profile.id
        ).first()
        self.assertIsNotNone(raw_db_row)
        self.assertNotEqual(raw_db_row.account_number_encrypted, "1234567890123456")
        self.assertEqual(decrypt_text(raw_db_row.account_number_encrypted), "1234567890123456")

        # 3. Retrieve via get_bank_account
        fetched = WalletService.get_bank_account(self.db, profile.id)
        self.assertEqual(fetched["masked_account_number"], "**** **** **** 3456")

    # =====================================================================
    # 3. REAL-TIME WALLET BALANCE CALCULATION (JOD & USD EQUIVALENCE)
    # =====================================================================

    def test_wallet_balance_realtime_calculation(self):
        u_client = User(
            id=uuid.uuid4(), full_name="العميل", email=f"client_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash123", role=UserRole.user
        )
        self.db.add(u_client)
        self.db.commit()

        _, profile = self._create_consultant("المستشار عمر")

        # Create completed appointment (Earned: 50 JOD)
        appt1 = Appointment(
            id=uuid.uuid4(), user_id=u_client.id, consultant_id=profile.id,
            price=Decimal("50.00"), status=AppointmentStatus.completed,
            scheduled_at=datetime.now(timezone.utc), created_by_role=ActorRole.user
        )
        # Create second completed appointment (Earned: 30 JOD)
        appt2 = Appointment(
            id=uuid.uuid4(), user_id=u_client.id, consultant_id=profile.id,
            price=Decimal("30.00"), status=AppointmentStatus.completed,
            scheduled_at=datetime.now(timezone.utc), created_by_role=ActorRole.user
        )
        # Create upcoming confirmed appointment (Escrow: 40 JOD)
        appt3 = Appointment(
            id=uuid.uuid4(), user_id=u_client.id, consultant_id=profile.id,
            price=Decimal("40.00"), status=AppointmentStatus.confirmed,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=2), created_by_role=ActorRole.user
        )
        self.db.add_all([appt1, appt2, appt3])
        self.db.commit()

        wallet = WalletService.get_wallet_balance(self.db, profile.id)
        self.assertEqual(wallet["total_earned"], Decimal("80.00"))
        self.assertEqual(wallet["pending_balance"], Decimal("40.00"))
        self.assertEqual(wallet["available_balance"], Decimal("80.00"))
        self.assertEqual(wallet["total_withdrawn"], Decimal("0.00"))
        self.assertEqual(wallet["currency"], "JOD")
        self.assertEqual(wallet["secondary_currency"], "USD")
        self.assertGreater(wallet["secondary_available_balance"], Decimal("100.00"))  # ~112.83 USD

    # =====================================================================
    # 4. PAYOUT REQUEST VALIDATION & CREATION
    # =====================================================================

    def test_payout_request_validation_and_creation(self):
        _, profile = self._create_consultant("المستشار هاني")

        # 1. Payout without bank account -> raises error
        with self.assertRaises(ValueError):
            WalletService.create_payout_request(self.db, profile.id, Decimal("20.00"))

        # Add bank account
        bank_in = ConsultantBankAccountCreate(
            bank_name="بنك الإسكان للتجارة والتمويل",
            account_holder_name="هاني الشناوي",
            account_number="9876543210123456",
            currency="JOD"
        )
        WalletService.upsert_bank_account(self.db, profile.id, bank_in)

        # 2. Payout below min limit (e.g. 5 JOD < 10 JOD) -> raises error
        with self.assertRaises(ValueError):
            WalletService.create_payout_request(self.db, profile.id, Decimal("5.00"))

        # 3. Payout with 0 available balance -> raises error
        with self.assertRaises(ValueError):
            WalletService.create_payout_request(self.db, profile.id, Decimal("100.00"))

        # Add completed appointment (Earned: 100 JOD)
        u_client = User(
            id=uuid.uuid4(), full_name="عميل 2", email=f"cl2_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash", role=UserRole.user
        )
        self.db.add(u_client)
        self.db.commit()

        appt = Appointment(
            id=uuid.uuid4(), user_id=u_client.id, consultant_id=profile.id,
            price=Decimal("100.00"), status=AppointmentStatus.completed,
            scheduled_at=datetime.now(timezone.utc), created_by_role=ActorRole.user
        )
        self.db.add(appt)
        self.db.commit()

        # 4. Create valid payout request of 40 JOD
        payout = WalletService.create_payout_request(self.db, profile.id, Decimal("40.00"))
        self.assertEqual(payout["amount"], Decimal("40.00"))
        self.assertEqual(payout["currency"], "JOD")
        self.assertEqual(payout["status"], PayoutStatus.pending)
        self.assertEqual(payout["bank_details_snapshot"]["bank_name"], "بنك الإسكان للتجارة والتمويل")

        # 5. Check wallet after payout creation: available balance must decrease to 60 JOD
        wallet = WalletService.get_wallet_balance(self.db, profile.id)
        self.assertEqual(wallet["pending_payouts"], Decimal("40.00"))
        self.assertEqual(wallet["available_balance"], Decimal("60.00"))

    # =====================================================================
    # 5. ADMIN PAYOUT PROCESSING & NOTIFICATIONS
    # =====================================================================

    def test_admin_payout_lifecycle_and_notifications(self):
        admin = self._create_admin()
        cons_user, profile = self._create_consultant("المستشار طارق")

        bank_in = ConsultantBankAccountCreate(
            bank_name="بنك الاتحاد",
            account_holder_name="طارق نور",
            account_number="5555666677778888",
            currency="JOD"
        )
        WalletService.upsert_bank_account(self.db, profile.id, bank_in)

        # Add earnings
        u_client = User(
            id=uuid.uuid4(), full_name="عميل 3", email=f"cl3_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="fakehash", role=UserRole.user
        )
        self.db.add(u_client)
        self.db.commit()

        appt = Appointment(
            id=uuid.uuid4(), user_id=u_client.id, consultant_id=profile.id,
            price=Decimal("200.00"), status=AppointmentStatus.completed,
            scheduled_at=datetime.now(timezone.utc), created_by_role=ActorRole.user
        )
        self.db.add(appt)
        self.db.commit()

        # Submit payout of 150 JOD
        payout = WalletService.create_payout_request(self.db, profile.id, Decimal("150.00"))
        payout_id = payout["id"]

        # Admin approves
        approved = WalletService.admin_process_payout(
            self.db, payout_id=payout_id, admin_user=admin, action="approve"
        )
        self.assertEqual(approved["status"], PayoutStatus.approved)

        # Admin executes bank transfer
        transferred = WalletService.admin_process_payout(
            self.db, payout_id=payout_id, admin_user=admin, action="transfer",
            transfer_reference="TRX-JO-2026-9918", receipt_url="https://storage.platform.com/receipts/rec1.pdf"
        )
        self.assertEqual(transferred["status"], PayoutStatus.transferred)
        self.assertEqual(transferred["transfer_reference"], "TRX-JO-2026-9918")

        # Verify consultant wallet reflects transferred funds
        wallet = WalletService.get_wallet_balance(self.db, profile.id)
        self.assertEqual(wallet["total_withdrawn"], Decimal("150.00"))
        self.assertEqual(wallet["available_balance"], Decimal("50.00"))

        # Verify in-app notification created for consultant
        notifs = self.db.query(Notification).filter(Notification.user_id == cons_user.id).all()
        self.assertGreaterEqual(len(notifs), 1)
        self.assertIn("تحويل", notifs[-1].message)


if __name__ == "__main__":
    unittest.main()

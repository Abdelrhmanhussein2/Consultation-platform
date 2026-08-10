"""
Unit Tests: Appointment Workflow
=================================
Tests the full appointment lifecycle:
  booking → consultant approval → client payment → reschedule / cancel

Run with:
    pytest tests/test_appointment_workflow.py -v

These tests use an in-memory SQLite database and mock out Qdrant / Neo4j / Redis.
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

# ---------------------------------------------------------------------------
# Bootstrap: patch external services BEFORE importing project modules
# ---------------------------------------------------------------------------
import sys

# Stub out heavy optional dependencies so tests can run without them
for _mod in [
    "qdrant_client", "qdrant_client.http", "qdrant_client.http.models",
    "neo4j", "redis", "cohere", "groq",
]:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

# ---------------------------------------------------------------------------
# Project imports
# ---------------------------------------------------------------------------
from helpers.database import Base
from helpers.enums import (
    UserRole, AppointmentStatus, VerificationStatus, NotificationType,
)
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.consultant_service import ConsultantService
from models.specialization import Specialization
from models.appointment import Appointment
from models.notification import Notification
from services.services import AppointmentService


# ---------------------------------------------------------------------------
# SQLite in-memory database fixture
# ---------------------------------------------------------------------------

SQLITE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    _engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    # SQLite doesn't enforce FK by default — enable it
    @event.listens_for(_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, _rec):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=_engine)
    yield _engine
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db(engine):
    """Provides a fresh DB session, rolled back after each test."""
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


# ---------------------------------------------------------------------------
# Fixtures: reusable test objects
# ---------------------------------------------------------------------------

def _make_user(role=UserRole.user, email=None):
    uid = uuid.uuid4()
    return User(
        id=uid,
        full_name="Test User",
        email=email or f"user_{uid}@test.com",
        password_hash="hashed",
        role=role,
        is_active=True,
    )


def _make_consultant_user(db, email=None):
    """Creates a User + ConsultantProfile + Specialization row."""
    spec = db.query(Specialization).first()
    if not spec:
        spec = Specialization(id=1, name="Legal")
        db.add(spec)
        db.flush()

    user = _make_user(role=UserRole.consultant, email=email)
    db.add(user)
    db.flush()

    profile = ConsultantProfile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio="Expert consultant",
        main_specialization_id=spec.id,
        verification_status=VerificationStatus.approved,
    )
    db.add(profile)
    db.flush()
    return user, profile


def _make_service(db, profile_id):
    svc = ConsultantService(
        id=uuid.uuid4(),
        consultant_id=profile_id,
        name="Legal Advice",
        description="1h legal session",
        price=Decimal("200.00"),
        duration_minutes=60,
        is_active=True,
    )
    db.add(svc)
    db.flush()
    return svc


def _future(hours=48):
    return datetime.now(timezone.utc) + timedelta(hours=hours)


# ---------------------------------------------------------------------------
# Helper: build an AppointmentCreate-like object
# ---------------------------------------------------------------------------
class _ApptIn:
    def __init__(self, consultant_id, service_id=None, scheduled_at=None, notes=None):
        self.consultant_id = str(consultant_id)
        self.service_id = str(service_id) if service_id else None
        self.scheduled_at = scheduled_at or _future()
        self.duration_minutes = 60
        self.notes = notes


# ===========================================================================
# TESTS
# ===========================================================================

class TestBookAppointment:
    """After booking, status should be pending_approval."""

    def test_booking_creates_pending_approval(self, db):
        client = _make_user()
        db.add(client)
        db.flush()

        _, profile = _make_consultant_user(db)
        svc = _make_service(db, profile.id)

        appt_in = _ApptIn(profile.id, svc.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)

        assert appt.status == AppointmentStatus.pending_approval
        assert appt.user_id == client.id
        assert appt.consultant_id == profile.id

    def test_booking_notifies_consultant(self, db):
        client = _make_user()
        db.add(client)
        db.flush()

        consultant_user, profile = _make_consultant_user(db)
        appt_in = _ApptIn(profile.id)
        AppointmentService.book_appointment(db, client.id, appt_in)

        notif = (
            db.query(Notification)
            .filter(Notification.user_id == consultant_user.id)
            .first()
        )
        assert notif is not None
        assert notif.type == NotificationType.appointment_booked

    def test_booking_unknown_consultant_raises(self, db):
        client = _make_user()
        db.add(client)
        db.flush()

        appt_in = _ApptIn(uuid.uuid4())  # random, non-existent consultant
        with pytest.raises(ValueError, match="Consultant is not approved"):
            AppointmentService.book_appointment(db, client.id, appt_in)


class TestApproveAppointment:
    """Consultant approval moves status to pending_payment."""

    def _create_pending_appt(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        appt_in = _ApptIn(profile.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        return appt, profile, client

    def test_approve_moves_to_pending_payment(self, db):
        appt, profile, _ = self._create_pending_appt(db)
        result = AppointmentService.approve_appointment(db, profile.id, appt.id)
        assert result.status == AppointmentStatus.pending_payment

    def test_approve_notifies_client(self, db):
        appt, profile, client = self._create_pending_appt(db)
        AppointmentService.approve_appointment(db, profile.id, appt.id)

        notif = (
            db.query(Notification)
            .filter(
                Notification.user_id == client.id,
                Notification.type == NotificationType.payment_required,
            )
            .first()
        )
        assert notif is not None

    def test_approve_wrong_consultant_raises(self, db):
        appt, _, _ = self._create_pending_appt(db)
        fake_profile_id = uuid.uuid4()
        with pytest.raises(ValueError, match="does not belong to you"):
            AppointmentService.approve_appointment(db, fake_profile_id, appt.id)

    def test_double_approve_raises(self, db):
        appt, profile, _ = self._create_pending_appt(db)
        AppointmentService.approve_appointment(db, profile.id, appt.id)
        with pytest.raises(ValueError, match="Cannot approve"):
            AppointmentService.approve_appointment(db, profile.id, appt.id)


class TestConfirmPayment:
    """Payment only works after consultant approval."""

    def _create_approved_appt(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        svc = _make_service(db, profile.id)
        appt_in = _ApptIn(profile.id, svc.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        AppointmentService.approve_appointment(db, profile.id, appt.id)
        return appt, client

    def test_pay_after_approval_confirms(self, db):
        appt, client = self._create_approved_appt(db)
        invoice = AppointmentService.confirm_payment(db, appt.id, client.id, "card")
        db.refresh(appt)
        assert appt.status == AppointmentStatus.confirmed
        assert invoice.total_amount > 0

    def test_pay_before_approval_raises(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        appt_in = _ApptIn(profile.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        # Status is still pending_approval — payment should fail
        with pytest.raises(ValueError, match="consultant must approve"):
            AppointmentService.confirm_payment(db, appt.id, client.id, "card")

    def test_pay_twice_raises(self, db):
        appt, client = self._create_approved_appt(db)
        AppointmentService.confirm_payment(db, appt.id, client.id, "cash")
        with pytest.raises(ValueError):
            AppointmentService.confirm_payment(db, appt.id, client.id, "cash")


class TestCancelAppointment:
    """Consultants cannot cancel paid appointments."""

    def _create_confirmed_appt(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        svc = _make_service(db, profile.id)
        appt_in = _ApptIn(profile.id, svc.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        AppointmentService.approve_appointment(db, profile.id, appt.id)
        AppointmentService.confirm_payment(db, appt.id, client.id, "wallet")
        db.refresh(appt)
        return appt, profile, client

    def test_consultant_cannot_cancel_confirmed(self, db):
        appt, profile, _ = self._create_confirmed_appt(db)
        with pytest.raises(ValueError, match="لا يمكن إلغاء موعد مدفوع"):
            AppointmentService.cancel_appointment(
                db, profile.user_id, appt.id, "reason", UserRole.consultant
            )

    def test_consultant_can_cancel_pending_approval(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        consultant_user, profile = _make_consultant_user(db)
        appt_in = _ApptIn(profile.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)

        cancellation = AppointmentService.cancel_appointment(
            db, consultant_user.id, appt.id, "تعارض في الجدول", UserRole.consultant
        )
        assert cancellation is not None
        db.refresh(appt)
        assert appt.status == AppointmentStatus.cancelled_by_consultant

    def test_client_cancel_within_24h_raises(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        # Schedule appointment in 10 hours (within cutoff)
        appt_in = _ApptIn(profile.id, scheduled_at=datetime.now(timezone.utc) + timedelta(hours=10))
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        with pytest.raises(ValueError, match="24 hours"):
            AppointmentService.cancel_appointment(
                db, client.id, appt.id, "changed mind", UserRole.user
            )


class TestRescheduleAppointment:
    """Only confirmed appointments can be rescheduled."""

    def _create_confirmed(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        consultant_user, profile = _make_consultant_user(db)
        svc = _make_service(db, profile.id)
        appt_in = _ApptIn(profile.id, svc.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        AppointmentService.approve_appointment(db, profile.id, appt.id)
        AppointmentService.confirm_payment(db, appt.id, client.id, "card")
        db.refresh(appt)
        return appt, profile, client, consultant_user

    def test_consultant_can_reschedule(self, db):
        appt, profile, client, consultant_user = self._create_confirmed(db)
        new_time = _future(hours=72)
        updated = AppointmentService.reschedule_appointment(
            db,
            requester_user_id=consultant_user.id,
            consultant_profile_id=profile.id,
            appt_id=appt.id,
            new_scheduled_at=new_time,
            reason="client request",
            role=UserRole.consultant,
        )
        assert updated.scheduled_at.replace(tzinfo=None) == new_time.replace(tzinfo=None)
        assert updated.status == AppointmentStatus.confirmed  # status unchanged

    def test_reschedule_notifies_client(self, db):
        appt, profile, client, consultant_user = self._create_confirmed(db)
        new_time = _future(hours=72)
        AppointmentService.reschedule_appointment(
            db,
            requester_user_id=consultant_user.id,
            consultant_profile_id=profile.id,
            appt_id=appt.id,
            new_scheduled_at=new_time,
            reason=None,
            role=UserRole.consultant,
        )
        notif = (
            db.query(Notification)
            .filter(
                Notification.user_id == client.id,
                Notification.type == NotificationType.appointment_rescheduled,
            )
            .first()
        )
        assert notif is not None

    def test_cannot_reschedule_pending_approval(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        consultant_user, profile = _make_consultant_user(db)
        appt_in = _ApptIn(profile.id)
        appt = AppointmentService.book_appointment(db, client.id, appt_in)

        with pytest.raises(ValueError, match="confirmed"):
            AppointmentService.reschedule_appointment(
                db,
                requester_user_id=consultant_user.id,
                consultant_profile_id=profile.id,
                appt_id=appt.id,
                new_scheduled_at=_future(hours=96),
                reason=None,
                role=UserRole.consultant,
            )

    def test_client_reschedule_within_24h_raises(self, db):
        client = _make_user()
        db.add(client)
        db.flush()
        _, profile = _make_consultant_user(db)
        svc = _make_service(db, profile.id)
        # Appointment is in 10 hours
        appt_in = _ApptIn(profile.id, svc.id, scheduled_at=datetime.now(timezone.utc) + timedelta(hours=10))
        appt = AppointmentService.book_appointment(db, client.id, appt_in)
        AppointmentService.approve_appointment(db, profile.id, appt.id)
        AppointmentService.confirm_payment(db, appt.id, client.id, "card")

        with pytest.raises(ValueError, match="24 hours"):
            AppointmentService.reschedule_appointment(
                db,
                requester_user_id=client.id,
                consultant_profile_id=None,
                appt_id=appt.id,
                new_scheduled_at=_future(hours=96),
                reason=None,
                role=UserRole.user,
            )

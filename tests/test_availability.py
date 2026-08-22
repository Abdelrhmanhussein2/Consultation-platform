"""
Unit Tests: Consultant Availability & Scheduling
=================================================
Tests setting weekly schedules, slot generation, breaks, and double-booking checks.
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta, date, time
from unittest.mock import MagicMock, patch
import sys

# Stub out heavy optional dependencies so tests can run without them
for _mod in [
    "qdrant_client", "qdrant_client.http", "qdrant_client.http.models",
    "neo4j", "redis", "cohere", "groq",
]:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from helpers.database import Base
from helpers.enums import UserRole, VerificationStatus, AppointmentStatus
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment
from models.consultant_availability import ConsultantAvailability
from services import UserService, ConsultantService, AppointmentService

SQLITE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    _engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=_engine)
    yield _engine
    Base.metadata.drop_all(bind=_engine)

@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

# Stub schemes for set_availability
class StubAvCreate:
    def __init__(self, day_of_week, start_time):
        self.day_of_week = day_of_week
        self.start_time = start_time

def test_consultant_availability_lifecycle(db):
    # 1. Create consultant and user
    user = User(
        id=uuid.uuid4(),
        full_name="Consultant User",
        email="consultant@test.com",
        password_hash="hashed",
        role=UserRole.consultant,
        is_active=True
    )
    db.add(user)
    db.commit()

    profile = ConsultantProfile(
        id=uuid.uuid4(),
        user_id=user.id,
        verification_status=VerificationStatus.approved
    )
    db.add(profile)
    db.commit()

    # 2. Set weekly availability (Tuesdays: 10:00, 11:00, 14:00, 15:00)
    # Day of week Tuesday is dow = 1 (Monday is 0)
    av1 = StubAvCreate(day_of_week=1, start_time="10:00")
    av2 = StubAvCreate(day_of_week=1, start_time="11:00")
    av3 = StubAvCreate(day_of_week=1, start_time="14:00")
    av4 = StubAvCreate(day_of_week=1, start_time="15:00")

    ConsultantService.set_availability(db, profile.id, [av1, av2, av3, av4])

    saved = ConsultantService.get_availabilities(db, profile.id)
    assert len(saved) == 4
    assert saved[0].day_of_week == 1
    assert saved[0].start_time == time(10, 0)
    assert saved[1].start_time == time(11, 0)
    assert saved[2].start_time == time(14, 0)
    assert saved[3].start_time == time(15, 0)

    # 3. Query slots (e.g. Tuesday 2026-08-25)
    tuesday_date = date(2026, 8, 25)
    assert tuesday_date.weekday() == 1  # Verify it is Tuesday

    slots = ConsultantService.get_available_slots(
        db, profile.id, start_date=tuesday_date, end_date=tuesday_date, duration_minutes=60
    )
    
    # Tuesday 10:00-12:00 gives 2 slots (10:00-11:00, 11:00-12:00)
    # Tuesday 14:00-16:00 gives 2 slots (14:00-15:00, 15:00-16:00)
    # Total = 4 slots
    assert len(slots) == 4
    assert slots[0]["start_time"] == datetime.combine(tuesday_date, time(10, 0)).replace(tzinfo=timezone.utc)
    assert slots[0]["end_time"] == datetime.combine(tuesday_date, time(11, 0)).replace(tzinfo=timezone.utc)
    assert slots[2]["start_time"] == datetime.combine(tuesday_date, time(14, 0)).replace(tzinfo=timezone.utc)

    # 4. Create client and book one slot (Tuesday 10:00 - 11:00)
    client = User(
        id=uuid.uuid4(),
        full_name="Client User",
        email="client@test.com",
        password_hash="hashed",
        role=UserRole.user,
        is_active=True
    )
    db.add(client)
    db.commit()

    class StubApptIn:
        def __init__(self, consultant_id, service_id, scheduled_at, duration_minutes, notes=None):
            self.consultant_id = consultant_id
            self.service_id = service_id
            self.scheduled_at = scheduled_at
            self.duration_minutes = duration_minutes
            self.notes = notes

    # Book valid slot
    valid_scheduled_at = datetime.combine(tuesday_date, time(10, 0)).replace(tzinfo=timezone.utc)
    appt_in = StubApptIn(
        consultant_id=profile.id,
        service_id=None,
        scheduled_at=valid_scheduled_at,
        duration_minutes=60
    )
    
    appt = AppointmentService.book_appointment(db, client.id, appt_in)
    assert appt.id is not None
    assert appt.status == AppointmentStatus.pending_approval

    # 5. Query slots again — the booked slot (10:00-11:00) should be filtered out
    slots_after_booking = ConsultantService.get_available_slots(
        db, profile.id, start_date=tuesday_date, end_date=tuesday_date, duration_minutes=60
    )
    assert len(slots_after_booking) == 3
    assert all(s["start_time"] != valid_scheduled_at for s in slots_after_booking)

    # 6. Try to double-book the same slot — should fail
    with pytest.raises(ValueError) as exc_info:
        AppointmentService.book_appointment(db, client.id, appt_in)
    assert "يتعارض مع حجز" in str(exc_info.value)

    # 7. Try to book outside availability hours (e.g. 12:00 - 13:00) — should fail
    invalid_appt_in = StubApptIn(
        consultant_id=profile.id,
        service_id=None,
        scheduled_at=datetime.combine(tuesday_date, time(12, 0)).replace(tzinfo=timezone.utc),
        duration_minutes=60
    )
    with pytest.raises(ValueError) as exc_info:
        AppointmentService.book_appointment(db, client.id, invalid_appt_in)
    assert "خارج ساعات عمل" in str(exc_info.value)

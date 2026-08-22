"""
Unit Tests: Google Calendar API Integration
===========================================
Tests OAuth URL generation, token exchanging, token refreshing, and event sync with Google Meet links.
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta, date, time
from unittest.mock import MagicMock, patch
import sys
from decimal import Decimal

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
from helpers.enums import UserRole, VerificationStatus, AppointmentStatus, ActorRole
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment
from services import UserService, ConsultantService, AppointmentService, GoogleCalendarService
from helpers.config import settings

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

def test_google_auth_url_generation():
    settings.GOOGLE_CLIENT_ID = "test-client-id"
    settings.GOOGLE_CLIENT_SECRET = "test-secret"
    settings.GOOGLE_REDIRECT_URI = "http://localhost:8000/callback"
    
    url = GoogleCalendarService.get_auth_url("my-state")
    assert "test-client-id" in url
    assert "http%3A%2F%2Flocalhost%3A8000%2Fcallback" in url
    assert "my-state" in url
    assert "calendar.events" in url

@patch("httpx.Client.post")
def test_exchange_code_for_tokens(mock_post, db):
    # Setup consultant
    user = User(
        id=uuid.uuid4(),
        full_name="Consultant",
        email="consultant@gmail.com",
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

    # Mock Google Token Response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "access_token": "ya29.access-token",
        "refresh_token": "1//refresh-token",
        "expires_in": 3600
    }
    mock_post.return_value = mock_resp

    tokens = GoogleCalendarService.exchange_code_for_tokens(db, profile.id, "auth-code-123")
    assert tokens["access_token"] == "ya29.access-token"
    assert tokens["refresh_token"] == "1//refresh-token"

    # Verify db was updated
    db.refresh(profile)
    assert profile.google_access_token == "ya29.access-token"
    assert profile.google_refresh_token == "1//refresh-token"
    assert profile.google_token_expiry is not None

@patch("httpx.Client.post")
def test_refresh_access_token(mock_post, db):
    # Setup profile with expired token
    user = User(
        id=uuid.uuid4(),
        full_name="Consultant 2",
        email="c2@gmail.com",
        password_hash="hashed",
        role=UserRole.consultant,
        is_active=True
    )
    db.add(user)
    db.commit()

    profile = ConsultantProfile(
        id=uuid.uuid4(),
        user_id=user.id,
        verification_status=VerificationStatus.approved,
        google_access_token="old-token",
        google_refresh_token="valid-refresh-token",
        google_token_expiry=datetime.now(timezone.utc) - timedelta(hours=1)
    )
    db.add(profile)
    db.commit()

    # Mock Refresh Response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "access_token": "ya29.new-access-token",
        "expires_in": 3600
    }
    mock_post.return_value = mock_resp

    access_token = GoogleCalendarService.refresh_access_token(db, profile)
    assert access_token == "ya29.new-access-token"
    assert profile.google_access_token == "ya29.new-access-token"
    
    expiry = profile.google_token_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    assert expiry > datetime.now(timezone.utc)

@patch("httpx.Client.post")
def test_create_calendar_event(mock_post, db):
    # Setup User & Consultant
    client = User(
        id=uuid.uuid4(),
        full_name="Client",
        email="client@test.com",
        password_hash="hashed",
        role=UserRole.user,
        is_active=True
    )
    db.add(client)
    
    c_user = User(
        id=uuid.uuid4(),
        full_name="Consultant 3",
        email="c3@gmail.com",
        password_hash="hashed",
        role=UserRole.consultant,
        is_active=True
    )
    db.add(c_user)
    db.commit()

    profile = ConsultantProfile(
        id=uuid.uuid4(),
        user_id=c_user.id,
        verification_status=VerificationStatus.approved,
        google_access_token="valid-access-token",
        google_refresh_token="valid-refresh-token",
        google_token_expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    db.add(profile)
    db.commit()

    appt = Appointment(
        id=uuid.uuid4(),
        consultant_id=profile.id,
        user_id=client.id,
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
        duration_minutes=60,
        status=AppointmentStatus.pending_approval,
        created_by_role=ActorRole.user,
        price=Decimal("100.00")
    )
    db.add(appt)
    db.commit()

    # Mock Google Event Response
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": "google-event-id-999",
        "conferenceData": {
            "entryPoints": [
                {
                    "entryPointType": "video",
                    "uri": "https://meet.google.com/abc-defg-hij"
                }
            ]
        }
    }
    mock_post.return_value = mock_resp

    result = GoogleCalendarService.create_calendar_event(db, appt.id)
    assert result is not None
    assert result["id"] == "google-event-id-999"

    # Verify db updates
    db.refresh(appt)
    assert appt.google_event_id == "google-event-id-999"

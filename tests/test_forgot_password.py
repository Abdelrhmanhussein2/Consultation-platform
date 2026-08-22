"""
Unit Tests: Forgot Password Flow
=================================
Tests forgot password request, Redis token generation, SMTP simulation, and password resetting.
"""

import uuid
import pytest
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
from helpers.enums import UserRole
from models.user import User
from services import UserService, EmailService
from controllers.auth_controller import AuthController

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

class FakeRedis:
    def __init__(self):
        self.store = {}

    def set(self, key, value, ex=None):
        self.store[key] = str(value)
        return True

    def get(self, key):
        return self.store.get(key)

    def delete(self, key):
        if key in self.store:
            del self.store[key]
            return 1
        return 0

@pytest.fixture()
def redis_client():
    return FakeRedis()

def test_forgot_password_flow(db, redis_client):
    # 1. Create a user
    user_email = "test@platform.com"
    user_pw = "OldSecurePassword123!"
    
    from services.auth_utils import hash_password, verify_password
    db_user = User(
        id=uuid.uuid4(),
        full_name="Test Client",
        email=user_email,
        password_hash=hash_password(user_pw),
        role=UserRole.user,
        is_active=True,
        language="ar"
    )
    db.add(db_user)
    db.commit()

    # Mock background task runner
    mock_background_tasks = MagicMock()

    # 2. Trigger forgot password
    with patch("services.email_service.EmailService.send_password_reset_email") as mock_send_email:
        response = AuthController.forgot_password(
            db=db,
            redis_client=redis_client,
            email=user_email,
            redirect_url=None,
            background_tasks=mock_background_tasks
        )
        
        # Verify response
        assert "message" in response
        
        # Check that background tasks has been queued
        assert mock_background_tasks.add_task.called
        
        # Retrieve the arguments passed to redis
        token = None
        for key in redis_client.store.keys():
            if key.startswith("password_reset:"):
                token = key.split(":")[1]
                assert redis_client.store[key] == str(db_user.id)
        
        assert token is not None

        # Verify email contents were queued to be sent
        mock_background_tasks.add_task.assert_called_once()
        args = mock_background_tasks.add_task.call_args[0]
        kwargs = mock_background_tasks.add_task.call_args[1]
        assert args[0] == EmailService.send_password_reset_email
        assert kwargs["to_email"] == user_email
        assert kwargs["name"] == "Test Client"
        assert token in kwargs["reset_link"]  # The reset link must contain the token
        assert kwargs["lang"] == "ar"  # Language preferred

        # 3. Reset password using token
        new_pw = "NewSecurePassword456!"
        reset_response = AuthController.reset_password(
            db=db,
            redis_client=redis_client,
            token=token,
            new_password=new_pw
        )
        
        assert reset_response["message"] == "تم إعادة تعيين كلمة المرور بنجاح"
        
        # Verify token is deleted
        assert redis_client.get(f"password_reset:{token}") is None

        # Refresh user and verify password hash
        db.refresh(db_user)
        assert verify_password(new_pw, db_user.password_hash)
        assert not verify_password(user_pw, db_user.password_hash)

def test_forgot_password_non_existent_user(db, redis_client):
    mock_background_tasks = MagicMock()
    
    response = AuthController.forgot_password(
        db=db,
        redis_client=redis_client,
        email="nonexistent@platform.com",
        redirect_url="http://test.com/reset",
        background_tasks=mock_background_tasks
    )
    
    # Check that we still return a generic success message
    assert "message" in response
    # Verify no email was queued
    assert not mock_background_tasks.add_task.called
    # Verify no keys added to Redis
    assert len(redis_client.store) == 0

def test_reset_password_invalid_token(db, redis_client):
    from fastapi import HTTPException
    
    with pytest.raises(HTTPException) as exc_info:
        AuthController.reset_password(
            db=db,
            redis_client=redis_client,
            token="invalid_or_expired_token",
            new_password="NewSecurePassword456!"
        )
    assert exc_info.value.status_code == 400
    assert "غير صالح" in exc_info.value.detail

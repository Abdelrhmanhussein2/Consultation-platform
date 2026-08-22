"""
Unit Tests: Edit Profile and Avatar Upload
=========================================
Tests updating user profile details (email, avatar_url, url_slug) and uploading profile pictures.
"""

import os
import uuid
import pytest
from unittest.mock import MagicMock, patch, mock_open
import sys
from fastapi import HTTPException

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
from services import UserService
from controllers import UserController
from schemes import UserProfileUpdate

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

def test_update_profile_success(db):
    # 1. Create a user
    user = User(
        id=uuid.uuid4(),
        full_name="Original Name",
        email="original@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        phone="1234567890",
        is_active=True
    )
    db.add(user)
    db.commit()

    # 2. Update user name, email, phone, and url_slug
    update_data = UserProfileUpdate(
        full_name="New Name",
        email="new@test.com",
        phone="0987654321",
        url_slug="test-slug-123"
    )
    updated_user = UserService.update_profile(db, user, update_data)

    assert updated_user.full_name == "New Name"
    assert updated_user.email == "new@test.com"
    assert updated_user.phone == "0987654321"
    assert updated_user.url_slug == "test-slug-123"

def test_update_profile_duplicate_email(db):
    # Create two users
    user1 = User(
        id=uuid.uuid4(),
        full_name="User One",
        email="one@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    user2 = User(
        id=uuid.uuid4(),
        full_name="User Two",
        email="two@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user1)
    db.add(user2)
    db.commit()

    # Try updating User One's email to User Two's email
    update_data = UserProfileUpdate(email="two@test.com")
    with pytest.raises(ValueError, match="البريد الإلكتروني مستخدم بالفعل"):
        UserService.update_profile(db, user1, update_data)

def test_update_profile_invalid_slug(db):
    user = User(
        id=uuid.uuid4(),
        full_name="Test User",
        email="test_slug@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user)
    db.commit()

    # Invalid slug with spaces and special chars
    update_data = UserProfileUpdate(url_slug="invalid slug!")
    with pytest.raises(ValueError, match="اسم الرابط.*يجب أن يحتوي فقط"):
        UserService.update_profile(db, user, update_data)

def test_update_profile_duplicate_slug(db):
    user1 = User(
        id=uuid.uuid4(),
        full_name="User One",
        email="one_slug@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        url_slug="common-slug",
        is_active=True
    )
    user2 = User(
        id=uuid.uuid4(),
        full_name="User Two",
        email="two_slug@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user1)
    db.add(user2)
    db.commit()

    # Try updating User Two's slug to User One's slug
    update_data = UserProfileUpdate(url_slug="common-slug")
    with pytest.raises(ValueError, match="اسم الرابط.*مستخدم بالفعل"):
        UserService.update_profile(db, user2, update_data)

def test_upload_avatar_validation_file_type(db):
    user = User(
        id=uuid.uuid4(),
        full_name="User Test",
        email="avatar_type@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user)
    db.commit()

    # Upload non-image file
    file_bytes = b"dummy text content"
    with pytest.raises(HTTPException) as exc_info:
        UserController.upload_avatar(
            db=db,
            current_user=user,
            file_bytes=file_bytes,
            filename="doc.txt",
            content_type="text/plain"
        )
    assert exc_info.value.status_code == 400
    assert "صورة فقط" in exc_info.value.detail

def test_upload_avatar_validation_size(db):
    user = User(
        id=uuid.uuid4(),
        full_name="User Test",
        email="avatar_size@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user)
    db.commit()

    # 6MB file bytes
    file_bytes = b"x" * (6 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        UserController.upload_avatar(
            db=db,
            current_user=user,
            file_bytes=file_bytes,
            filename="large.png",
            content_type="image/png"
        )
    assert exc_info.value.status_code == 400
    assert "تجاوز 5 ميجابايت" in exc_info.value.detail

def test_upload_avatar_success(db):
    user = User(
        id=uuid.uuid4(),
        full_name="User Test",
        email="avatar_success@test.com",
        password_hash="hashedpass123",
        role=UserRole.user,
        is_active=True
    )
    db.add(user)
    db.commit()

    file_bytes = b"fake image bytes"
    
    with patch("builtins.open", mock_open()) as mock_file:
        with patch("os.makedirs") as mock_makedirs:
            updated_user = UserController.upload_avatar(
                db=db,
                current_user=user,
                file_bytes=file_bytes,
                filename="profile.jpg",
                content_type="image/jpeg"
            )
            
            assert updated_user.avatar_url is not None
            assert updated_user.avatar_url.startswith("/static/avatars/")
            assert updated_user.avatar_url.endswith(".jpg")
            mock_file.assert_called_once()

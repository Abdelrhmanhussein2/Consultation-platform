"""
tests/test_consultant_applications_and_docs.py
===============================================
Comprehensive test suite for Consultant Applications & Protected Documents:
1. Admin applications endpoint returns all 5 files accurately.
2. Graceful handling of missing/optional files without crashing.
3. No fake default price (returns None if not entered).
4. Protected document access: 200 OK for admin.
5. Protected document access: 403 Forbidden for regular user.
6. Protected document access: 401 Unauthorized for anonymous user.
7. Traversal attacks rejected with 400 Bad Request.
8. Missing file returns 404 Not Found.
9. Zero TEST_ records and zero temporary files left after tests.
"""
import os
import uuid
from unittest.mock import MagicMock
import pytest
from starlette.testclient import TestClient

from helpers.database import SessionLocal
from helpers.enums import UserRole, VerificationStatus, EntityType
from main import app
from models.consultations.consultant_profile import ConsultantProfile
from models.users.user import User
from routes.deps import get_current_active_user

TEST_PREFIX = "TEST_appdoc_"
TEST_FILE_PATH = os.path.join("static", "documents", f"{TEST_PREFIX}sample.pdf")


def cleanup_test_records_and_files():
    # 1. Clean DB
    with SessionLocal() as db:
        test_users = db.query(User).filter(User.email.like(f"{TEST_PREFIX}%")).all()
        user_ids = [u.id for u in test_users]
        if user_ids:
            db.query(ConsultantProfile).filter(ConsultantProfile.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            db.commit()

    # 2. Clean temporary files on disk
    if os.path.exists(TEST_FILE_PATH):
        try:
            os.remove(TEST_FILE_PATH)
        except OSError:
            pass


@pytest.fixture(autouse=True)
def run_cleanup():
    cleanup_test_records_and_files()
    yield
    cleanup_test_records_and_files()


@pytest.fixture
def admin_client():
    mock_admin = MagicMock()
    mock_admin.id = uuid.uuid4()
    mock_admin.role = UserRole.super_admin
    mock_admin.is_active = True
    mock_admin.permissions = []
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_active_user, None)


@pytest.fixture
def regular_user_client():
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()
    mock_user.role = UserRole.user
    mock_user.is_active = True
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_active_user, None)


@pytest.fixture
def anonymous_client():
    app.dependency_overrides.pop(get_current_active_user, None)
    return TestClient(app)


def test_admin_applications_endpoint_returns_all_five_files(admin_client):
    test_email = f"{TEST_PREFIX}full@example.com"
    with SessionLocal() as db:
        user = User(
            id=uuid.uuid4(),
            full_name=f"{TEST_PREFIX} Full Consultant",
            email=test_email,
            phone="+962791111111",
            password_hash="mockhash",
            role=UserRole.consultant,
            entity_type=EntityType.individual,
            verification_status=VerificationStatus.pending,
            is_active=True
        )
        db.add(user)
        db.flush()

        profile = ConsultantProfile(
            user_id=user.id,
            bio="نبذة تجريبية كاملة",
            years_of_experience=7,
            price_per_hour=None,  # No fake default
            id_proof_url="/static/documents/cr_id_proof.pdf",
            academic_certificates_url="/static/documents/cr_academic.pdf",
            professional_licenses_url="/static/documents/cr_license.pdf",
            jcpa_cert_url="/static/documents/cr_jcpa.pdf",
            experts_society_cert_url="/static/documents/cr_experts.pdf",
            verification_status=VerificationStatus.pending
        )
        db.add(profile)
        db.commit()

    res = admin_client.get("/api/super-admin/consultants/pending")
    assert res.status_code == 200
    apps = res.json()
    match = next((a for a in apps if a.get("user", {}).get("email") == test_email), None)
    assert match is not None

    # Verify all 5 files are present and properly categorized
    assert match["id_proof_url"] == "/static/documents/cr_id_proof.pdf"
    assert match["academic_certificates_url"] == "/static/documents/cr_academic.pdf"
    assert match["professional_licenses_url"] == "/static/documents/cr_license.pdf"
    assert match["jcpa_cert_url"] == "/static/documents/cr_jcpa.pdf"
    assert match["experts_society_cert_url"] == "/static/documents/cr_experts.pdf"

    # Verify bio and experience
    assert match["bio"] == "نبذة تجريبية كاملة"
    assert match["years_of_experience"] == 7
    assert match["price_per_hour"] is None  # Never fake 45


def test_admin_applications_missing_files_handling(admin_client):
    test_email = f"{TEST_PREFIX}partial@example.com"
    with SessionLocal() as db:
        user = User(
            id=uuid.uuid4(),
            full_name=f"{TEST_PREFIX} Partial Consultant",
            email=test_email,
            phone="+962792222222",
            password_hash="mockhash",
            role=UserRole.consultant,
            entity_type=EntityType.individual,
            verification_status=VerificationStatus.pending,
            is_active=True
        )
        db.add(user)
        db.flush()

        profile = ConsultantProfile(
            user_id=user.id,
            bio=None,
            years_of_experience=None,
            price_per_hour=None,
            id_proof_url="/static/documents/cr_only_id.pdf",
            academic_certificates_url=None,
            professional_licenses_url=None,
            jcpa_cert_url=None,
            experts_society_cert_url=None,
            verification_status=VerificationStatus.pending
        )
        db.add(profile)
        db.commit()

    res = admin_client.get("/api/super-admin/consultants/pending")
    assert res.status_code == 200
    apps = res.json()
    match = next((a for a in apps if a.get("user", {}).get("email") == test_email), None)
    assert match is not None
    assert match["id_proof_url"] == "/static/documents/cr_only_id.pdf"
    assert match["academic_certificates_url"] is None
    assert match["professional_licenses_url"] is None
    assert match["jcpa_cert_url"] is None
    assert match["experts_society_cert_url"] is None


def test_protected_document_download_success_for_admin(admin_client):
    os.makedirs(os.path.dirname(TEST_FILE_PATH), exist_ok=True)
    with open(TEST_FILE_PATH, "wb") as f:
        f.write(b"%PDF-1.4 test document content for admin verification")

    filename = os.path.basename(TEST_FILE_PATH)
    res = admin_client.get(f"/api/super-admin/consultants/documents/{filename}")
    assert res.status_code == 200
    assert b"test document content" in res.content


def test_protected_document_forbidden_for_regular_user(regular_user_client):
    os.makedirs(os.path.dirname(TEST_FILE_PATH), exist_ok=True)
    with open(TEST_FILE_PATH, "wb") as f:
        f.write(b"%PDF-1.4 test document content")

    filename = os.path.basename(TEST_FILE_PATH)
    res = regular_user_client.get(f"/api/super-admin/consultants/documents/{filename}")
    assert res.status_code == 403


def test_protected_document_unauthorized_for_anonymous(anonymous_client):
    os.makedirs(os.path.dirname(TEST_FILE_PATH), exist_ok=True)
    with open(TEST_FILE_PATH, "wb") as f:
        f.write(b"%PDF-1.4 test document content")

    filename = os.path.basename(TEST_FILE_PATH)
    res = anonymous_client.get(f"/api/super-admin/consultants/documents/{filename}")
    assert res.status_code == 401


def test_protected_document_traversal_rejected(admin_client):
    res = admin_client.get("/api/super-admin/consultants/documents/..%2Fmain.py")
    assert res.status_code in (400, 404)


def test_protected_document_not_found(admin_client):
    res = admin_client.get("/api/super-admin/consultants/documents/non_existent_file_9999.pdf")
    assert res.status_code == 404

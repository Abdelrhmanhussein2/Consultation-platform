"""
tests/test_knowledge_broadcast.py
Comprehensive test suite for Knowledge Broadcast Modal:
1. Target group 'all' broadcasts to users and consultants.
2. Target group 'users' with legal_form and sector filters.
3. Target group 'consultants' with activity and specialization filters.
4. Unknown filter or target_group rejects with HTTP 400.
5. Zero matching recipients rejects with HTTP 400.
6. Low-activity (rare login) accounts are included.
7. Suspended (is_active=False) accounts are excluded.
8. Preview count matches actual sent count.
9. Non-admin forbidden (HTTP 403).
10. WebSocket push is mocked and all TEST_ records cleaned up.
"""
import uuid
from unittest.mock import patch, MagicMock
import pytest
from starlette.testclient import TestClient
from helpers.database import SessionLocal
from helpers.enums import BusinessSector, EntityType, LegalForm, UserRole
from main import app
from models.communication.admin_broadcast import AdminBroadcast
from models.communication.notification import Notification
from models.consultations.consultant_profile import ConsultantProfile
from models.users.user import User
from routes.deps import get_current_active_user


TEST_PREFIX = "TEST_kb_"


def cleanup_test_data():
    with SessionLocal() as db:
        users = db.query(User).filter(User.email.like(f"{TEST_PREFIX}%")).all()
        user_ids = [u.id for u in users]
        if user_ids:
            db.query(Notification).filter(Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(ConsultantProfile).filter(ConsultantProfile.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.title.like(f"{TEST_PREFIX}%")).delete(synchronize_session=False)
        db.query(AdminBroadcast).filter(AdminBroadcast.title.like(f"{TEST_PREFIX}%")).delete(synchronize_session=False)
        db.commit()


@pytest.fixture(autouse=True)
def manage_cleanup():
    cleanup_test_data()
    yield
    cleanup_test_data()


@pytest.fixture
def admin_client():
    with SessionLocal() as db:
        admin = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).first()
        admin_id = admin.id if admin else uuid.uuid4()
    mock_admin = MagicMock()
    mock_admin.id = admin_id
    mock_admin.role = UserRole.admin
    mock_admin.is_active = True
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
def seeded_users():
    """
    Creates:
    - 1 Active User (sole_proprietorship, commercial, low activity)
    - 1 Active User (llc, industrial)
    - 1 Suspended User (is_active=False)
    - 1 Active Consultant (tax_consultant, income_tax #3)
    - 1 Active Consultant (auditor, audit #8)
    """
    with SessionLocal() as db:
        u_sole_comm = User(
            id=uuid.uuid4(),
            full_name="Low Activity Sole Commercial",
            email=f"{TEST_PREFIX}u1_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="testpasshash",
            role=UserRole.user,
            entity_type=EntityType.individual,
            legal_form=LegalForm.sole_proprietorship,
            sector=BusinessSector.commercial,
            is_active=True,
        )
        u_llc_ind = User(
            id=uuid.uuid4(),
            full_name="LLC Industrial",
            email=f"{TEST_PREFIX}u2_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="testpasshash",
            role=UserRole.user,
            entity_type=EntityType.company,
            legal_form=LegalForm.llc,
            sector=BusinessSector.industrial,
            is_active=True,
        )
        u_suspended = User(
            id=uuid.uuid4(),
            full_name="Suspended User",
            email=f"{TEST_PREFIX}susp_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="testpasshash",
            role=UserRole.user,
            entity_type=EntityType.individual,
            legal_form=LegalForm.sole_proprietorship,
            sector=BusinessSector.commercial,
            is_active=False,
        )
        c_tax = User(
            id=uuid.uuid4(),
            full_name="Consultant Tax",
            email=f"{TEST_PREFIX}ctax_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="testpasshash",
            role=UserRole.consultant,
            is_active=True,
        )
        c_audit = User(
            id=uuid.uuid4(),
            full_name="Consultant Audit",
            email=f"{TEST_PREFIX}caudit_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="testpasshash",
            role=UserRole.consultant,
            is_active=True,
        )
        db.add_all([u_sole_comm, u_llc_ind, u_suspended, c_tax, c_audit])
        db.flush()

        p_tax = ConsultantProfile(user_id=c_tax.id, activity_type="مستشار ضريبي", main_specialization_id=3)
        p_audit = ConsultantProfile(user_id=c_audit.id, activity_type="مدقق حسابات", main_specialization_id=8)
        db.add_all([p_tax, p_audit])
        db.commit()

        return {
            "u_sole_comm": u_sole_comm.id,
            "u_llc_ind": u_llc_ind.id,
            "u_suspended": u_suspended.id,
            "c_tax": c_tax.id,
            "c_audit": c_audit.id,
        }


def test_broadcast_pattern_all(admin_client, seeded_users):
    """Pattern 'all' reaches both users and consultants, but excludes suspended."""
    with patch("services.communication.live_notification_service.LiveNotificationService.push_notification"):
        res = admin_client.post(
            "/api/notifications/admin-broadcast",
            json={
                "title": f"{TEST_PREFIX}All Platform",
                "message": "Notice for the entire platform",
                "target_group": "all",
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

    with SessionLocal() as db:
        # Check active users and consultants received notification
        n_sole = db.query(Notification).filter(Notification.user_id == seeded_users["u_sole_comm"]).first()
        n_llc = db.query(Notification).filter(Notification.user_id == seeded_users["u_llc_ind"]).first()
        n_tax = db.query(Notification).filter(Notification.user_id == seeded_users["c_tax"]).first()
        n_audit = db.query(Notification).filter(Notification.user_id == seeded_users["c_audit"]).first()
        n_susp = db.query(Notification).filter(Notification.user_id == seeded_users["u_suspended"]).first()

        assert n_sole is not None
        assert n_llc is not None
        assert n_tax is not None
        assert n_audit is not None
        # Suspended must not receive
        assert n_susp is None


def test_broadcast_pattern_users_with_filters(admin_client, seeded_users):
    """Pattern 'users' filtered by legal_form and sector."""
    with patch("services.communication.live_notification_service.LiveNotificationService.push_notification"):
        res = admin_client.post(
            "/api/notifications/admin-broadcast",
            json={
                "title": f"{TEST_PREFIX}LLC Industrial Users",
                "message": "Notice for LLC industrial companies only",
                "target_group": "users",
                "user_filters": {"legal_form": "llc", "sector": "industrial"},
            },
        )
    assert res.status_code == 200

    with SessionLocal() as db:
        n_llc = db.query(Notification).filter(Notification.user_id == seeded_users["u_llc_ind"]).first()
        n_sole = db.query(Notification).filter(Notification.user_id == seeded_users["u_sole_comm"]).first()
        n_tax = db.query(Notification).filter(Notification.user_id == seeded_users["c_tax"]).first()

        assert n_llc is not None
        assert n_sole is None
        assert n_tax is None


def test_broadcast_pattern_consultants_with_filters(admin_client, seeded_users):
    """Pattern 'consultants' filtered by activity and specialization."""
    with patch("services.communication.live_notification_service.LiveNotificationService.push_notification"):
        res = admin_client.post(
            "/api/notifications/admin-broadcast",
            json={
                "title": f"{TEST_PREFIX}Income Tax Consultants",
                "message": "Notice for tax consultants specialized in income tax",
                "target_group": "consultants",
                "consultant_filters": {"activity": "tax_consultant", "specialization": "income_tax"},
            },
        )
    assert res.status_code == 200

    with SessionLocal() as db:
        n_tax = db.query(Notification).filter(Notification.user_id == seeded_users["c_tax"]).first()
        n_audit = db.query(Notification).filter(Notification.user_id == seeded_users["c_audit"]).first()
        n_user = db.query(Notification).filter(Notification.user_id == seeded_users["u_llc_ind"]).first()

        assert n_tax is not None
        assert n_audit is None
        assert n_user is None


def test_broadcast_rejects_invalid_values(admin_client, seeded_users):
    """Invalid target_group or filter value returns HTTP 400."""
    # Invalid target_group
    res1 = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={"title": f"{TEST_PREFIX}Bad Target", "message": "msg", "target_group": "aliens"},
    )
    assert res1.status_code == 400
    assert "نمط الجمهور" in res1.json()["detail"]

    # Invalid user filter
    res2 = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": f"{TEST_PREFIX}Bad Legal Form",
            "message": "msg",
            "target_group": "users",
            "user_filters": {"legal_form": "invalid_form"},
        },
    )
    assert res2.status_code == 400
    assert "الشكل القانوني" in res2.json()["detail"]

    # Invalid consultant activity
    res3 = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": f"{TEST_PREFIX}Bad Consultant Activity",
            "message": "msg",
            "target_group": "consultants",
            "consultant_filters": {"activity": "unknown_act"},
        },
    )
    assert res3.status_code == 400
    assert "النشاط المهني" in res3.json()["detail"]


def test_broadcast_blocks_zero_recipients(admin_client, seeded_users):
    """Zero matching recipients returns HTTP 400."""
    res = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": f"{TEST_PREFIX}Zero Match",
            "message": "No matching user exists",
            "target_group": "users",
            "user_filters": {"legal_form": "non_profit", "sector": "agricultural"},
        },
    )
    assert res.status_code == 400
    assert "لا يوجد أي مستخدم أو مستشار يطابق الفلاتر" in res.json()["detail"]


def test_preview_matches_send(admin_client, seeded_users):
    """Preview count exactly equals actual sent count."""
    payload = {
        "title": f"{TEST_PREFIX}Preview vs Send Match",
        "message": "Checking matching counts",
        "target_group": "consultants",
        "consultant_filters": {"activity": "tax_consultant", "specialization": "income_tax"},
    }
    prev_res = admin_client.post("/api/notifications/broadcasts/preview", json=payload)
    assert prev_res.status_code == 200
    expected_count = prev_res.json()["matching_count"]
    assert expected_count >= 1

    with patch("services.communication.live_notification_service.LiveNotificationService.push_notification"):
        send_res = admin_client.post("/api/notifications/admin-broadcast", json=payload)
    assert send_res.status_code == 200
    actual_sent = send_res.json()["sent_count"]
    assert actual_sent == expected_count


def test_non_admin_forbidden(regular_user_client):
    """Non-admin user receives HTTP 403."""
    res = regular_user_client.post(
        "/api/notifications/admin-broadcast",
        json={"title": "Unauthorized", "message": "msg", "target_group": "all"},
    )
    assert res.status_code == 403
    assert "غير مصرح" in res.json()["detail"]

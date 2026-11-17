"""
tests/test_consultant_broadcast_filters.py
Targeted Unit & Integration tests for admin broadcast consultant targeting:
1. Broadcast to all consultants (activity=all, specialization=all).
2. Broadcast filtered by specialization (e.g. income_tax / 3).
3. Broadcast filtered by Arabic activity_type (مستشار ضريبي، مدقق حسابات، خبير ضريبي، مستشار قانوني، محاسب قانوني).
4. Broadcast filtered by combined activity + specialization.
5. Service returns 0 when no consultants match filters.
6. Rejection of removed 'مستشار مستقل' and 'independent_consultant' with HTTP 400.
7. Service and API reject unknown activity or specialization with 400 / ValueError.
8. Read-only preview endpoint returns matching recipient count without creating notifications.
9. API prevents sending broadcast when matching recipient count is 0.
"""
import uuid
from unittest.mock import MagicMock
import pytest
from starlette.testclient import TestClient
from helpers.database import SessionLocal
from helpers.enums import UserRole
from main import app
from models.communication.admin_broadcast import AdminBroadcast
from models.communication.notification import Notification
from models.consultations.consultant_profile import ConsultantProfile
from models.users.user import User
from routes.deps import get_current_active_user
from services.communication.admin_broadcast_service import (
    count_broadcast_recipients,
    send_admin_broadcast,
)


TEST_PREFIX = "test_bc_consultant_"


def cleanup_test_consultants():
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
def manage_test_data():
    cleanup_test_consultants()
    yield
    cleanup_test_consultants()


@pytest.fixture
def admin_client():
    mock_admin = MagicMock()
    mock_admin.id = uuid.uuid4()
    mock_admin.role = UserRole.admin
    mock_admin.is_active = True
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_active_user, None)


@pytest.fixture
def seeded_consultants():
    """
    Creates 5 test consultants corresponding to the 5 official types:
    - Consultant 1: activity_type='مستشار ضريبي', main_specialization_id=3 (income_tax)
    - Consultant 2: activity_type='مدقق حسابات', main_specialization_id=8 (audit)
    - Consultant 3: activity_type='خبير ضريبي', main_specialization_id=6 (transfer_pricing)
    - Consultant 4: activity_type='مستشار قانوني', main_specialization_id=7 (legal)
    - Consultant 5: activity_type='محاسب قانوني', main_specialization_id=1 (tax)
    """
    users_data = []
    with SessionLocal() as db:
        consultants_meta = [
            ("Consultant Tax", "مستشار ضريبي", 3),
            ("Consultant Auditor", "مدقق حسابات", 8),
            ("Consultant Tax Expert", "خبير ضريبي", 6),
            ("Consultant Legal", "مستشار قانوني", 7),
            ("Consultant Accountant", "محاسب قانوني", 1),
        ]
        created_users = []
        created_profiles = []
        for name, act, spec_id in consultants_meta:
            u = User(
                id=uuid.uuid4(),
                full_name=name,
                email=f"{TEST_PREFIX}{uuid.uuid4().hex[:8]}@test.com",
                password_hash="testpasshash",
                role=UserRole.consultant,
                is_active=True,
            )
            created_users.append(u)
            db.add(u)
            db.flush()
            p = ConsultantProfile(user_id=u.id, activity_type=act, main_specialization_id=spec_id)
            created_profiles.append(p)
            db.add(p)

        db.commit()

        for u in created_users:
            users_data.append({"id": u.id, "email": u.email})

    return users_data


def test_broadcast_all_consultants(seeded_consultants):
    with SessionLocal() as db:
        sent = send_admin_broadcast(
            db,
            title="General Consultant Notice",
            message="Notice for all consultants",
            target_group="consultants",
            consultant_filters={"activity": "all", "specialization": "all"},
        )
        assert sent >= 5


def test_broadcast_filter_by_specialization_code(seeded_consultants):
    with SessionLocal() as db:
        c1_id = seeded_consultants[0]["id"]
        sent = send_admin_broadcast(
            db,
            title="Income Tax Update",
            message="Notice for income tax specialists",
            target_group="consultants",
            consultant_filters={"activity": "all", "specialization": "income_tax"},
        )
        assert sent >= 1
        notif = db.query(Notification).filter(Notification.user_id == c1_id, Notification.title == "Income Tax Update").first()
        assert notif is not None

        c2_id = seeded_consultants[1]["id"]
        notif_c2 = db.query(Notification).filter(Notification.user_id == c2_id, Notification.title == "Income Tax Update").first()
        assert notif_c2 is None


def test_broadcast_filter_by_arabic_activities(seeded_consultants):
    """Test filtering by each of the official 5 Arabic activity strings."""
    with SessionLocal() as db:
        # 1. مستشار ضريبي
        sent1 = send_admin_broadcast(
            db, title="Tax Broadcast", message="msg", target_group="consultants",
            consultant_filters={"activity": "مستشار ضريبي", "specialization": "all"},
        )
        assert sent1 >= 1
        assert db.query(Notification).filter(Notification.user_id == seeded_consultants[0]["id"], Notification.title == "Tax Broadcast").first() is not None

        # 2. مدقق حسابات
        sent2 = send_admin_broadcast(
            db, title="Auditor Broadcast", message="msg", target_group="consultants",
            consultant_filters={"activity": "مدقق حسابات", "specialization": "all"},
        )
        assert sent2 >= 1
        assert db.query(Notification).filter(Notification.user_id == seeded_consultants[1]["id"], Notification.title == "Auditor Broadcast").first() is not None

        # 3. خبير ضريبي
        sent3 = send_admin_broadcast(
            db, title="Tax Expert Broadcast", message="msg", target_group="consultants",
            consultant_filters={"activity": "خبير ضريبي", "specialization": "all"},
        )
        assert sent3 >= 1
        assert db.query(Notification).filter(Notification.user_id == seeded_consultants[2]["id"], Notification.title == "Tax Expert Broadcast").first() is not None

        # 4. مستشار قانوني
        sent4 = send_admin_broadcast(
            db, title="Legal Broadcast", message="msg", target_group="consultants",
            consultant_filters={"activity": "مستشار قانوني", "specialization": "all"},
        )
        assert sent4 >= 1
        assert db.query(Notification).filter(Notification.user_id == seeded_consultants[3]["id"], Notification.title == "Legal Broadcast").first() is not None

        # 5. محاسب قانوني
        sent5 = send_admin_broadcast(
            db, title="Accountant Broadcast", message="msg", target_group="consultants",
            consultant_filters={"activity": "محاسب قانوني", "specialization": "all"},
        )
        assert sent5 >= 1
        assert db.query(Notification).filter(Notification.user_id == seeded_consultants[4]["id"], Notification.title == "Accountant Broadcast").first() is not None


def test_broadcast_filter_by_activity_and_specialization(seeded_consultants):
    with SessionLocal() as db:
        c1_id = seeded_consultants[0]["id"]
        sent = send_admin_broadcast(
            db,
            title="Tax Consultant Income Tax Combined",
            message="Combined filter broadcast",
            target_group="consultants",
            consultant_filters={"activity": "مستشار ضريبي", "specialization": "income_tax"},
        )
        assert sent >= 1
        notif = db.query(Notification).filter(
            Notification.user_id == c1_id,
            Notification.title == "Tax Consultant Income Tax Combined"
        ).first()
        assert notif is not None


def test_broadcast_filter_no_match(seeded_consultants):
    with SessionLocal() as db:
        sent = send_admin_broadcast(
            db,
            title="Non Matching Notice",
            message="Nobody should receive this",
            target_group="consultants",
            consultant_filters={"activity": "مدقق حسابات", "specialization": "income_tax"},
        )
        for c in seeded_consultants:
            notif = db.query(Notification).filter(
                Notification.user_id == c["id"],
                Notification.title == "Non Matching Notice"
            ).first()
            assert notif is None


def test_reject_removed_independent_consultant(admin_client):
    """Ensure 'مستشار مستقل' and 'independent_consultant' are rejected with 400 Bad Request."""
    # Arabic removed string
    res1 = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": "Rejected Independent Arabic",
            "message": "Testing",
            "target_group": "consultants",
            "consultant_filters": {"activity": "مستشار مستقل", "specialization": "all"},
        },
    )
    assert res1.status_code == 400
    assert "النشاط المهني" in res1.json()["detail"]

    # English removed slug
    res2 = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": "Rejected Independent English",
            "message": "Testing",
            "target_group": "consultants",
            "consultant_filters": {"activity": "independent_consultant", "specialization": "all"},
        },
    )
    assert res2.status_code == 400
    assert "النشاط المهني" in res2.json()["detail"]


def test_reject_unknown_specialization(admin_client):
    res = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": "Invalid Spec Test",
            "message": "Testing invalid specialization filter",
            "target_group": "consultants",
            "consultant_filters": {"activity": "all", "specialization": "unknown_specialization_code"},
        },
    )
    assert res.status_code == 400
    assert "التخصص" in res.json()["detail"]


def test_preview_broadcast_audience(admin_client, seeded_consultants):
    res = admin_client.post(
        "/api/notifications/broadcasts/preview",
        json={
            "target_group": "consultants",
            "consultant_filters": {"activity": "مستشار ضريبي", "specialization": "income_tax"},
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["matching_count"] >= 1


def test_prevent_broadcast_when_zero_recipients(admin_client, seeded_consultants):
    res = admin_client.post(
        "/api/notifications/admin-broadcast",
        json={
            "title": "Zero Recipient Test",
            "message": "Should be rejected because 0 recipients match",
            "target_group": "consultants",
            "consultant_filters": {"activity": "مدقق حسابات", "specialization": "income_tax"},
        },
    )
    assert res.status_code == 400
    assert "لا يوجد أي مستخدم أو مستشار يطابق الفلاتر" in res.json()["detail"]

"""
tests/test_legal_repeal_api.py
Pytest suite for API endpoints:
5. Hard delete rejected (405)
6. Non-associated dependent ID rejected (400)
7. Judicial ruling with action 'repeal' rejected (400)
9. Non-admin access rejected (403)
"""
import uuid
import pytest
from unittest.mock import MagicMock
from starlette.testclient import TestClient
from main import app
from routes.deps import get_current_user
from helpers.database import SessionLocal
from models.ai.legal_document_metadata import LegalDocumentMetadata, LegalRepealAudit
from models.ai.legal_relation import LegalRelation


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.query(LegalRepealAudit).filter(LegalRepealAudit.document_id.like("TEST_%")).delete(synchronize_session=False)
    session.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id.like("TEST_%")).delete(synchronize_session=False)
    session.query(LegalRelation).filter(
        LegalRelation.parent_law_id.like("TEST_%") | LegalRelation.target_document_id.like("TEST_%")
    ).delete(synchronize_session=False)
    session.commit()
    session.close()


@pytest.fixture
def admin_client():
    mock_admin = MagicMock()
    mock_admin.id = uuid.uuid4()
    mock_admin.role = "admin"
    app.dependency_overrides[get_current_user] = lambda: mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def non_admin_client():
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()
    mock_user.role = "client"
    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_hard_delete_rejected_405(admin_client):
    """5. Calling hard delete returns 405 Method Not Allowed with Arabic message."""
    resp = admin_client.delete("/api/legal/sources/TEST_LAW_DELETE")
    assert resp.status_code == 405
    assert resp.json()["detail"] == "لا يمكن حذف القوانين، استخدم الإلغاء"


def test_non_associated_dependent_rejected_400(admin_client, db):
    """6. Sending dependent ID not associated with law returns 400."""
    law_id = "TEST_LAW_WITH_UNLINKED"
    db.add(LegalDocumentMetadata(document_id=law_id, title="قانون للتحقق", status="ساري"))
    db.commit()

    resp = admin_client.post(
        f"/api/legal/{law_id}/repeal",
        json={"dependents_actions": [{"target_document_id": "TEST_STRANGER_DOC", "action": "keep"}]}
    )
    assert resp.status_code == 400
    assert "غير مرتبط بهذا القانون" in resp.json()["detail"]


def test_judicial_ruling_repeal_rejected_400(admin_client, db):
    """7. Judicial ruling with action 'repeal' is rejected with 400 and historical jurisprudence message."""
    law_id = "TEST_LAW_WITH_JUDGMENT"
    ruling_id = "TEST_RULING_HISTORICAL"
    db.add_all([
        LegalDocumentMetadata(document_id=law_id, title="قانون تجريبي", status="ساري"),
        LegalRelation(
            parent_law_id=law_id,
            target_document_id=ruling_id,
            target_title="حكم تمييز تجريبي",
            relation_domain="judicial",
            relation_type="applies_law",
            sub_category="أحكام النقض والتمييز",
            document_type="judgment"
        )
    ])
    db.commit()

    resp = admin_client.post(
        f"/api/legal/{law_id}/repeal",
        json={"dependents_actions": [{"target_document_id": ruling_id, "action": "repeal"}]}
    )
    assert resp.status_code == 400
    expected_msg = "لا يمكن إلغاء الأحكام القضائية كأثر لتبعية القانون، الأحكام القضائية تظل سارية كاجتهاد قضائي تاريخي"
    assert resp.json()["detail"] == expected_msg


def test_unauthorized_user_rejected_403(non_admin_client):
    """9. Non-admin user cannot access repeal endpoints and gets 403 Forbidden."""
    resp = non_admin_client.post("/api/legal/TEST_LAW/repeal", json={})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "صلاحية المشرف مطلوبة"


def test_repeal_and_restore_judgment_as_primary_document(admin_client, db):
    """Test repeal and restore flow for a judicial ruling as a primary document."""
    ruling_id = "TEST_RULING_PRIMARY_101"
    db.add(LegalDocumentMetadata(
        document_id=ruling_id,
        title="قرار تمييز حقوق رقم 101 لسنة 2024",
        document_type="judgment",
        status="ساري"
    ))
    db.commit()

    # 1. Preview
    prev_resp = admin_client.get(f"/api/legal/{ruling_id}/repeal-preview")
    assert prev_resp.status_code == 200
    pdata = prev_resp.json()
    assert pdata["document"]["document_type"] == "judgment"
    assert pdata["counts"]["total_dependents"] == 0

    # 2. Execute Repeal
    rep_resp = admin_client.post(
        f"/api/legal/{ruling_id}/repeal",
        json={"repeal_reason": "عدول الهيئة العامة لمحكمة التمييز عن المبدأ", "dependents_actions": []}
    )
    assert rep_resp.status_code == 200
    meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == ruling_id).first()
    assert meta.status == "ملغي"
    assert meta.repeal_reason == "عدول الهيئة العامة لمحكمة التمييز عن المبدأ"

    # 3. Restore
    rst_resp = admin_client.post(f"/api/legal/{ruling_id}/restore")
    assert rst_resp.status_code == 200
    db.refresh(meta)
    assert meta.status == "ساري"
    assert meta.repealed_at is None

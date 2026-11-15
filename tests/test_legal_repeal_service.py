"""
tests/test_legal_repeal_service.py
Pytest suite covering legal repeal service logic:
1. Repeal law without dependents
2. Mixed dependents (repeal one, keep another)
3. Preview dependent linked to two laws (other_parents)
4. Neo4j failure handling (sync_status=failed)
8. Idempotency on already repealed law
10. Restore document returns to 'ساري'
11. Preview omits empty sections
"""
import pytest
from unittest.mock import patch
from helpers.database import SessionLocal
from models.ai.legal_relation import LegalRelation
from models.ai.legal_document_metadata import LegalDocumentMetadata, LegalRepealAudit
from services.ai.legal_repeal_service import LegalRepealService
from services.ai.legal_repeal_helper import LegalRepealHelper


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    # Cleanup test records
    session.query(LegalRepealAudit).filter(LegalRepealAudit.document_id.like("TEST_%")).delete(synchronize_session=False)
    session.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id.like("TEST_%")).delete(synchronize_session=False)
    session.query(LegalRelation).filter(
        LegalRelation.parent_law_id.like("TEST_%") | LegalRelation.target_document_id.like("TEST_%")
    ).delete(synchronize_session=False)
    session.commit()
    session.close()


def test_repeal_law_without_dependents(db):
    """1. Repealing a law without dependents updates metadata to 'ملغي' and records audit."""
    doc_id = "TEST_LAW_SOLO_1"
    meta = LegalDocumentMetadata(document_id=doc_id, title="قانون تجريبي منفرد", status="ساري", document_type="law")
    db.add(meta)
    db.commit()

    with patch.object(LegalRepealHelper, "sync_repeal_to_neo4j", return_value=True):
        res = LegalRepealService.execute_repeal(
            doc_id=doc_id,
            payload={"repeal_reason": "قانون قديم ملغى", "dependents_actions": []},
            current_user_id=None,
            db=db
        )

    assert res["status"] == "success"
    assert res["sync_status"] == "synced"
    db.refresh(meta)
    assert meta.status == "ملغي"
    assert meta.repeal_reason == "قانون قديم ملغى"
    audit = db.query(LegalRepealAudit).filter(LegalRepealAudit.document_id == doc_id).first()
    assert audit is not None
    assert audit.action == "repeal"


def test_mixed_dependents_repeal_and_keep(db):
    """2. Repealing a law with mixed dependents: one 'repeal' becomes 'ملغي', one 'keep' remains 'ساري'."""
    parent_id = "TEST_PARENT_MIXED"
    dep_rep = "TEST_DEP_TO_REPEAL"
    dep_keep = "TEST_DEP_TO_KEEP"

    db.add_all([
        LegalDocumentMetadata(document_id=parent_id, title="قانون رئيسي", status="ساري"),
        LegalRelation(parent_law_id=parent_id, target_document_id=dep_rep, relation_domain="legislative", relation_type="issued_under", sub_category="الأنظمة", document_status="ساري"),
        LegalRelation(parent_law_id=parent_id, target_document_id=dep_keep, relation_domain="legislative", relation_type="issued_under", sub_category="الأنظمة", document_status="ساري")
    ])
    db.commit()

    with patch.object(LegalRepealHelper, "sync_repeal_to_neo4j", return_value=True):
        res = LegalRepealService.execute_repeal(
            doc_id=parent_id,
            payload={"dependents_actions": [{"target_document_id": dep_rep, "action": "repeal"}, {"target_document_id": dep_keep, "action": "keep"}]},
            current_user_id=None,
            db=db
        )

    assert res["repealed_dependents_count"] == 1
    rep_meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == dep_rep).first()
    assert rep_meta.status == "ملغي"
    keep_meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == dep_keep).first()
    assert keep_meta is None or keep_meta.status == "ساري"


def test_preview_law_with_other_parents(db):
    """3. Preview returns other_parents when a dependent is linked to multiple parent laws."""
    law_a = "TEST_LAW_A"
    law_b = "TEST_LAW_B"
    shared_dep = "TEST_SHARED_REG"

    db.add_all([
        LegalDocumentMetadata(document_id=law_a, title="قانون أ", status="ساري"),
        LegalRelation(parent_law_id=law_a, target_document_id=shared_dep, target_title="نظام مشترك", relation_domain="legislative", relation_type="issued_under", sub_category="الأنظمة"),
        LegalRelation(parent_law_id=law_b, target_document_id=shared_dep, target_title="نظام مشترك", relation_domain="legislative", relation_type="issued_under", sub_category="الأنظمة")
    ])
    db.commit()

    preview = LegalRepealService.get_repeal_preview(doc_id=law_a, db=db)
    assert "legislative" in preview
    assert len(preview["legislative"]) == 1
    dep_item = preview["legislative"][0]
    assert dep_item["has_multiple_parents"] is True
    assert any(op["id"] == law_b for op in dep_item["other_parents"])


def test_neo4j_failure_handling_on_repeal(db):
    """4. Neo4j failure sets sync_status='failed' in Postgres while preserving transaction."""
    doc_id = "TEST_LAW_NEO_FAIL"
    db.add(LegalDocumentMetadata(document_id=doc_id, title="قانون تجربة الفشل", status="ساري"))
    db.commit()

    with patch.object(LegalRepealHelper, "sync_repeal_to_neo4j", return_value=False):
        res = LegalRepealService.execute_repeal(
            doc_id=doc_id,
            payload={"repeal_reason": "فحص فشل المزامنة", "dependents_actions": []},
            current_user_id=None,
            db=db
        )

    assert res["status"] == "success"
    assert res["sync_status"] == "failed"
    meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
    assert meta.status == "ملغي"
    assert meta.sync_status == "failed"
    assert meta.last_sync_error is not None


def test_idempotency_repeal_already_repealed(db):
    """8. Idempotency: Repealing an already repealed law updates details cleanly without error."""
    doc_id = "TEST_LAW_ALREADY_REPEALED"
    db.add(LegalDocumentMetadata(document_id=doc_id, title="قانون ملغي مسبقاً", status="ملغي"))
    db.commit()

    with patch.object(LegalRepealHelper, "sync_repeal_to_neo4j", return_value=True):
        res = LegalRepealService.execute_repeal(
            doc_id=doc_id,
            payload={"repeal_reason": "تأكيد الإلغاء", "dependents_actions": []},
            current_user_id=None,
            db=db
        )
    assert res["status"] == "success"
    meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
    assert meta.status == "ملغي"
    assert meta.repeal_reason == "تأكيد الإلغاء"


def test_restore_law_to_active(db):
    """10. Restoring a repealed document sets status back to 'ساري'."""
    doc_id = "TEST_LAW_TO_RESTORE"
    db.add(LegalDocumentMetadata(document_id=doc_id, title="قانون للاسترجاع", status="ملغي"))
    db.commit()

    with patch.object(LegalRepealHelper, "sync_restore_to_neo4j", return_value=True):
        res = LegalRepealService.restore_document(doc_id=doc_id, current_user_id=None, db=db)

    assert res["status"] == "success"
    meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
    assert meta.status == "ساري"
    assert meta.repealed_at is None
    audit = db.query(LegalRepealAudit).filter(LegalRepealAudit.document_id == doc_id, LegalRepealAudit.action == "restore").first()
    assert audit is not None


def test_preview_empty_sections_omitted(db):
    """11. Preview omits sections with zero records (e.g. no judicial rulings linked)."""
    doc_id = "TEST_LAW_NO_JUDICIAL"
    db.add_all([
        LegalDocumentMetadata(document_id=doc_id, title="قانون بدون أحكام", status="ساري"),
        LegalRelation(parent_law_id=doc_id, target_document_id="TEST_REG_1", relation_domain="legislative", relation_type="issued_under", sub_category="الأنظمة")
    ])
    db.commit()

    preview = LegalRepealService.get_repeal_preview(doc_id=doc_id, db=db)
    assert "legislative" in preview
    assert "judicial" not in preview

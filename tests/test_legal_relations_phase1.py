"""
tests/test_legal_relations_phase1.py
Pytest suite covering:
1. Multi-law linking (M:N)
2. Neo4j failure handling (Postgres remains with failed status & error message)
3. Idempotency (repeated sync does not duplicate rows)
4. Validation rejection of non-existent IDs
5. Empty taxonomy tree structure
"""
import pytest
from unittest.mock import patch, MagicMock
from helpers.database import SessionLocal
from models.ai.legal_relation import LegalRelation
from services.ai.legal_relation_service import LegalRelationService


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    # Cleanup test records
    session.query(LegalRelation).filter(
        LegalRelation.parent_law_id.like("TEST_%") | LegalRelation.target_document_id.like("TEST_%")
    ).delete(synchronize_session=False)
    session.commit()
    session.close()


def test_empty_taxonomy_tree(db):
    """5. get_law_taxonomy_tree for non-existent or empty law returns empty dict structure."""
    res = LegalRelationService.get_law_taxonomy_tree("TEST_EMPTY_LAW_9999")
    assert "legislative" in res
    assert "judicial" in res
    assert res["legislative"]["issued_under"] == {}
    assert res["legislative"]["repealed_by"] == {}
    assert res["judicial"] == {}


def test_rejection_of_nonexistent_ids(db):
    """4. Linking with non-existent parent or target in Neo4j raises ValueError with Arabic message."""
    with pytest.raises(ValueError) as excinfo:
        LegalRelationService.sync_relation(
            db=db,
            parent_law_id="NON_EXISTENT_PARENT_9999",
            target_document_id="NON_EXISTENT_TARGET_8888",
            target_title="وثيقة وهمية",
            relation_domain="legislative",
            relation_type="issued_under",
            sub_category="الأنظمة"
        )
    assert "قانون الأصل غير موجود" in str(excinfo.value)


def test_multi_law_linking_m_to_n(db):
    """1. Multi-parent linking: one document linked to two different parent laws."""
    # We mock validate_nodes_exist and neo4j_db session to test pure synchronization flow
    with patch.object(LegalRelationService, "validate_nodes_exist", return_value=None):
        with patch("services.ai.legal_relation_service.neo4j_db.get_session") as mock_session_ctx:
            mock_session = MagicMock()
            mock_session_ctx.return_value.__enter__.return_value = mock_session

            target_doc = "TEST_SHARED_REGULATION_01"
            law_a = "TEST_LAW_PARENT_A"
            law_b = "TEST_LAW_PARENT_B"

            # Link to Law A
            ok_a = LegalRelationService.sync_relation(
                db=db, parent_law_id=law_a, target_document_id=target_doc,
                target_title="نظام تنفيذي مشترك", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة", document_type="نظام",
                article_ref="مادة 5", effective_date="2026-01-01"
            )

            # Link to Law B
            ok_b = LegalRelationService.sync_relation(
                db=db, parent_law_id=law_b, target_document_id=target_doc,
                target_title="نظام تنفيذي مشترك", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة", document_type="نظام",
                article_ref="مادة 8", effective_date="2026-01-01"
            )

            assert ok_a is True
            assert ok_b is True

            # Verify PostgreSQL holds 2 distinct records
            records = db.query(LegalRelation).filter(LegalRelation.target_document_id == target_doc).all()
            assert len(records) == 2
            parents = {r.parent_law_id for r in records}
            assert law_a in parents
            assert law_b in parents
            for r in records:
                assert r.sync_status == "synced"
                assert r.synced_at is not None
                assert r.document_type == "نظام"
                assert r.last_sync_error is None


def test_neo4j_failure_leaves_postgres_failed(db):
    """2. When Neo4j fails, PostgreSQL persists the record with failed status and error message."""
    with patch.object(LegalRelationService, "validate_nodes_exist", return_value=None):
        with patch("services.ai.legal_relation_service.neo4j_db.get_session") as mock_session_ctx:
            # Simulate Cypher execution failure / network timeout
            mock_session = MagicMock()
            mock_session.run.side_effect = RuntimeError("Connection refused: Neo4j timeout on port 7687")
            mock_session_ctx.return_value.__enter__.return_value = mock_session

            parent_id = "TEST_LAW_FAIL_01"
            target_id = "TEST_REG_FAIL_01"

            ok = LegalRelationService.sync_relation(
                db=db, parent_law_id=parent_id, target_document_id=target_id,
                target_title="نظام فشل مزامنته", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة"
            )

            assert ok is False

            # Verify PostgreSQL still has the record saved with failed state
            saved = db.query(LegalRelation).filter(
                LegalRelation.parent_law_id == parent_id,
                LegalRelation.target_document_id == target_id
            ).first()

            assert saved is not None
            assert saved.sync_status == "failed"
            assert "Connection refused" in str(saved.last_sync_error)
            assert saved.retry_count == 1
            assert saved.synced_at is None


def test_idempotency_no_duplicate_records(db):
    """3. Syncing the exact same relationship repeatedly does not create duplicate rows."""
    with patch.object(LegalRelationService, "validate_nodes_exist", return_value=None):
        with patch("services.ai.legal_relation_service.neo4j_db.get_session") as mock_session_ctx:
            mock_session = MagicMock()
            mock_session_ctx.return_value.__enter__.return_value = mock_session

            parent_id = "TEST_LAW_IDEMPOTENT_01"
            target_id = "TEST_DOC_IDEMPOTENT_01"

            # First sync
            LegalRelationService.sync_relation(
                db=db, parent_law_id=parent_id, target_document_id=target_id,
                target_title="وثيقة أصلية", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة",
                document_status="ساري", notes="الملاحظة الأولى"
            )

            # Second sync (same IDs, updated status and notes)
            LegalRelationService.sync_relation(
                db=db, parent_law_id=parent_id, target_document_id=target_id,
                target_title="وثيقة معدلة", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة",
                document_status="معدل وتعديلاته", notes="تم التعديل"
            )

            # Assert exactly one row exists in database
            rows = db.query(LegalRelation).filter(
                LegalRelation.parent_law_id == parent_id,
                LegalRelation.target_document_id == target_id
            ).all()

            assert len(rows) == 1
            assert rows[0].target_title == "وثيقة معدلة"
            assert rows[0].document_status == "معدل وتعديلاته"
            assert rows[0].notes == "تم التعديل"
            assert rows[0].sync_status == "synced"


def test_retry_pending_or_failed_syncs(db):
    """6. retry_pending_or_failed_syncs picks up failed records and re-syncs them."""
    with patch.object(LegalRelationService, "validate_nodes_exist", return_value=None):
        with patch("services.ai.legal_relation_service.neo4j_db.get_session") as mock_session_ctx:
            # 1. Cause initial failure
            mock_session = MagicMock()
            mock_session.run.side_effect = RuntimeError("Temporary network glitch")
            mock_session_ctx.return_value.__enter__.return_value = mock_session

            parent_id = "TEST_LAW_RETRY_01"
            target_id = "TEST_DOC_RETRY_01"

            LegalRelationService.sync_relation(
                db=db, parent_law_id=parent_id, target_document_id=target_id,
                target_title="وثيقة سيعاد محاولتها", relation_domain="legislative",
                relation_type="issued_under", sub_category="الأنظمة"
            )

            rec = db.query(LegalRelation).filter(LegalRelation.parent_law_id == parent_id).first()
            assert rec.sync_status == "failed"
            assert rec.retry_count == 1

            # 2. Fix Neo4j and trigger retry job
            mock_session.run.side_effect = None
            res = LegalRelationService.retry_pending_or_failed_syncs(db=db, max_retries=3, batch_size=10)

            assert res["processed"] >= 1
            assert res["succeeded"] >= 1

            db.refresh(rec)
            assert rec.sync_status == "synced"
            assert rec.last_sync_error is None


"""
tests/test_document_relations_edit.py
Pytest suite for editing legal document relations & categories:
1. Add relation on edit.
2. Remove relation (soft-delete is_active=false, edge deleted, nodes preserved).
3. Change category / classification.
4. Edit without relation changes (no-op).
5. Neo4j failure preserves PostgreSQL with sync_status=failed.
6. Disallowed status change returns 400 with Arabic hint.
7. Reconcile ignores unlinked relations.
Cleans up TEST_ data completely.
"""
import uuid
import pytest
from unittest.mock import patch, MagicMock
from starlette.testclient import TestClient
from main import app
from routes.deps import get_current_user
from helpers.database import SessionLocal
from helpers.neo4j_db import neo4j_db
from models.ai.legal_relation import LegalRelation, LegalRelationAudit
from models.ai.legal_document_metadata import LegalDocumentMetadata
from scripts.reconcile_legal_relations import run_reconciliation


def clean_test_data():
    with SessionLocal() as session:
        session.query(LegalRelationAudit).filter(
            LegalRelationAudit.parent_law_id.like("TEST_%") | LegalRelationAudit.target_document_id.like("TEST_%")
        ).delete(synchronize_session=False)
        session.query(LegalRelation).filter(
            LegalRelation.parent_law_id.like("TEST_%") | LegalRelation.target_document_id.like("TEST_%")
        ).delete(synchronize_session=False)
        session.query(LegalDocumentMetadata).filter(
            LegalDocumentMetadata.document_id.like("TEST_%")
        ).delete(synchronize_session=False)
        session.commit()

    with neo4j_db.get_session() as session:
        session.run("MATCH (n) WHERE n.law_id STARTS WITH 'TEST_' OR n.ruling_id STARTS WITH 'TEST_' DETACH DELETE n")


@pytest.fixture(autouse=True)
def cleanup_fixture():
    clean_test_data()
    yield
    clean_test_data()


@pytest.fixture
def admin_user():
    admin = MagicMock()
    admin.id = uuid.uuid4()
    admin.role = "admin"
    return admin


@pytest.fixture
def admin_client(admin_user):
    app.dependency_overrides[get_current_user] = lambda: admin_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_user, None)


def setup_neo4j_test_nodes(parent_id: str, child_id: str, child_type: str = "regulation"):
    with neo4j_db.get_session() as session:
        session.run("""
            MERGE (p:Law {law_id: $pid})
            SET p.title = 'قانون تجريبي أصل', p.year = '2020', p.number = '1', p.is_active = true
            MERGE (c:Law {law_id: $cid})
            SET c.title = 'تشريع تجريبي تابع', c.year = '2021', c.number = '2', c.is_active = true, c.document_type = $ctype
        """, pid=parent_id, cid=child_id, ctype=child_type)


def test_add_relation_on_edit(admin_client):
    pid = "TEST_LAW_PARENT_ADD"
    cid = "TEST_LAW_CHILD_ADD"
    setup_neo4j_test_nodes(pid, cid)

    payload = {
        "title": "تشريع تجريبي تابع محدث",
        "year": "2021",
        "number": "2",
        "relation_domain": "legislative",
        "relation_type": "issued_under",
        "sub_category": "الأنظمة",
        "related_laws": [pid]
    }

    res = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["relations_diff"]["added"] == 1

    # Verify PostgreSQL row
    with SessionLocal() as db:
        rel = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == pid,
            LegalRelation.target_document_id == cid
        ).first()
        assert rel is not None
        assert rel.is_active is True
        assert rel.sync_status == "synced"
        assert rel.sub_category == "الأنظمة"

        # Verify audit
        audit = db.query(LegalRelationAudit).filter(
            LegalRelationAudit.parent_law_id == pid,
            LegalRelationAudit.target_document_id == cid,
            LegalRelationAudit.action == "link"
        ).first()
        assert audit is not None

    # Verify Neo4j relationship edge exists
    with neo4j_db.get_session() as session:
        edge_cnt = session.run("""
            MATCH (c:Law {law_id: $cid})-[r:ISSUED_UNDER]->(p:Law {law_id: $pid})
            RETURN count(r) as cnt
        """, cid=cid, pid=pid).single()["cnt"]
        assert edge_cnt == 1


def test_remove_relation_soft_delete_and_node_preservation(admin_client):
    pid = "TEST_LAW_PARENT_DEL"
    cid = "TEST_LAW_CHILD_DEL"
    setup_neo4j_test_nodes(pid, cid)

    # Initial link
    payload_add = {
        "title": "تشريع تجريبي تابع",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "الأنظمة"
    }
    res1 = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json=payload_add)
    assert res1.status_code == 200

    # Unlink: remove pid from related_laws
    payload_remove = {
        "title": "تشريع تجريبي تابع بدون ارتباط",
        "related_laws": [],
        "relation_type": "none"
    }
    res2 = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json=payload_remove)
    assert res2.status_code == 200
    assert res2.json()["relations_diff"]["removed"] == 1

    # Verify PostgreSQL: row NOT deleted, is_active=False, unlinked_at & unlinked_by populated
    with SessionLocal() as db:
        rel = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == pid,
            LegalRelation.target_document_id == cid
        ).first()
        assert rel is not None
        assert rel.is_active is False
        assert rel.unlinked_at is not None
        assert rel.unlinked_by is not None
        assert rel.sync_status == "synced"

        # Verify audit
        audit = db.query(LegalRelationAudit).filter(
            LegalRelationAudit.parent_law_id == pid,
            LegalRelationAudit.target_document_id == cid,
            LegalRelationAudit.action == "unlink"
        ).first()
        assert audit is not None

    # Verify Neo4j: edge DELETED, but BOTH nodes STILL EXIST
    with neo4j_db.get_session() as session:
        edge_cnt = session.run("""
            MATCH (c:Law {law_id: $cid})-[r:ISSUED_UNDER]->(p:Law {law_id: $pid})
            RETURN count(r) as cnt
        """, cid=cid, pid=pid).single()["cnt"]
        assert edge_cnt == 0

        p_node = session.run("MATCH (p:Law {law_id: $pid}) RETURN count(p) as cnt", pid=pid).single()["cnt"]
        assert p_node == 1

        c_node = session.run("MATCH (c:Law {law_id: $cid}) RETURN count(c) as cnt", cid=cid).single()["cnt"]
        assert c_node == 1


def test_change_category_on_edit(admin_client):
    pid = "TEST_LAW_PARENT_MOD"
    cid = "TEST_LAW_CHILD_MOD"
    setup_neo4j_test_nodes(pid, cid)

    # Add as الأنظمة
    admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "تشريع تجريبي",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "الأنظمة"
    })

    # Modify to تعليمات
    res = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "تشريع تجريبي",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "تعليمات"
    })
    assert res.status_code == 200
    assert res.json()["relations_diff"]["updated"] == 1

    with SessionLocal() as db:
        rel = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == pid,
            LegalRelation.target_document_id == cid,
            LegalRelation.is_active == True
        ).first()
        assert rel.sub_category == "تعليمات"

        audit = db.query(LegalRelationAudit).filter(
            LegalRelationAudit.parent_law_id == pid,
            LegalRelationAudit.target_document_id == cid,
            LegalRelationAudit.action == "update"
        ).first()
        assert audit is not None

    with neo4j_db.get_session() as session:
        sub_type = session.run("""
            MATCH (c:Law {law_id: $cid})-[r:ISSUED_UNDER]->(p:Law {law_id: $pid})
            RETURN r.sub_type as st
        """, cid=cid, pid=pid).single()["st"]
        assert sub_type == "تعليمات"


def test_edit_without_relation_changes(admin_client):
    pid = "TEST_LAW_PARENT_NOOP"
    cid = "TEST_LAW_CHILD_NOOP"
    setup_neo4j_test_nodes(pid, cid)

    admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "تشريع أصلي",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "الأنظمة"
    })

    # Edit title only with same relations
    res = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "تشريع بعنوان جديد فقط",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "الأنظمة"
    })
    assert res.status_code == 200
    diff = res.json()["relations_diff"]
    assert diff["added"] == 0
    assert diff["updated"] == 0
    assert diff["removed"] == 0


def test_neo4j_failure_preserves_postgres_with_failed_sync(admin_client):
    pid = "TEST_LAW_PARENT_FAIL"
    cid = "TEST_LAW_CHILD_FAIL"
    setup_neo4j_test_nodes(pid, cid)

    # Link initially
    admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "تشريع",
        "related_laws": [pid],
        "relation_type": "issued_under",
        "sub_category": "الأنظمة"
    })

    # Mock Neo4j session run failure during unlink
    with patch.object(neo4j_db, "get_session") as mock_neo:
        mock_session = MagicMock()
        mock_session.run.side_effect = Exception("Simulated Neo4j network timeout")
        mock_neo.return_value.__enter__.return_value = mock_session

        res = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
            "title": "تشريع",
            "related_laws": [],
            "relation_type": "none"
        })
        assert res.status_code == 200

    # PostgreSQL must still preserve soft delete, with sync_status="failed"
    with SessionLocal() as db:
        rel = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == pid,
            LegalRelation.target_document_id == cid
        ).first()
        assert rel.is_active is False
        assert rel.sync_status == "failed"
        assert "Simulated Neo4j network timeout" in rel.last_sync_error


def test_disallowed_status_change_returns_400(admin_client):
    cid = "TEST_DOC_STATUS_DISALLOWED"
    setup_neo4j_test_nodes("TEST_DUMMY_PARENT", cid)

    res = admin_client.put(f"/api/legal/sources/{cid}?source_type=law", json={
        "title": "قانون لا يمكن إلغاؤه من التعديل",
        "status": "ملغي"
    })
    assert res.status_code == 400
    assert "لا يمكن تغيير حالة النفاذ (ساري/ملغي) من شاشة التعديل" in res.json()["detail"]


def test_reconcile_ignores_unlinked_relations(admin_client):
    pid = "TEST_LAW_PARENT_REC"
    cid = "TEST_LAW_CHILD_REC"
    setup_neo4j_test_nodes(pid, cid)

    # Create unlinked (is_active=False) record in PostgreSQL directly with no edge in Neo4j
    with SessionLocal() as db:
        unlinked_rel = LegalRelation(
            parent_law_id=pid,
            target_document_id=cid,
            relation_domain="legislative",
            relation_type="issued_under",
            sub_category="الأنظمة",
            is_active=False,
            sync_status="synced"
        )
        db.add(unlinked_rel)
        db.commit()

    # Run reconciliation
    report = run_reconciliation(batch_size=100, fix=False)

    # The unlinked record must NOT be reported as missing in Neo4j
    missing_for_test = [m for m in report["missing_in_neo4j"] if m["parent_law_id"] == pid and m["target_doc_id"] == cid]
    assert len(missing_for_test) == 0

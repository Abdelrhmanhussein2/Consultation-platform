import os
import glob
import pytest
import psycopg2
from neo4j import GraphDatabase
from scripts.correct_law_titles_and_amended_dates import (
    normalize_title,
    normalize_amended_date,
    scan_neo4j,
    scan_postgres,
    apply_neo4j,
    apply_postgres,
    create_snapshot
)
from services.ai.legal_preview_helper import extract_file_preview


def test_normalize_title():
    # Case: Original title with — كما صدر
    raw1 = "قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية — كما صدر)"
    assert normalize_title(raw1) == "قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية)"

    # Case: Title with suffix — كما صدر
    raw2 = "قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر"
    assert normalize_title(raw2) == "قانون ضريبة الدخل رقم 34 لسنة 2014"

    # Case: Title with hyphen - كما صدر
    raw3 = "قانون ضريبة الدخل رقم 34 لسنة 2014 - كما صدر"
    assert normalize_title(raw3) == "قانون ضريبة الدخل رقم 34 لسنة 2014"

    # Case: Already clean amended law title
    raw4 = "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته"
    assert normalize_title(raw4) == "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته"

    # Case: Regular law title
    raw5 = "قانون رقم 45 لسنة 2008 (قانون التأجير التمويلي لسنة 2008)"
    assert normalize_title(raw5) == raw5


def test_normalize_amended_date():
    # Case 1: قانون بلا تعديلات (None, empty, em-dash)
    assert normalize_amended_date(None) == "—"
    assert normalize_amended_date("") == "—"
    assert normalize_amended_date("—") == "—"

    # Case 2: نسخة أصلية (لا ينطبق (نص أصلي))
    assert normalize_amended_date("لا ينطبق (نص أصلي)") == "—"
    assert normalize_amended_date("لا ينطبق") == "—"
    assert normalize_amended_date("نص أصلي") == "—"

    # Case 3: قانون معدل بتاريخ
    assert normalize_amended_date("01-01-2019") == "01-01-2019"
    assert normalize_amended_date("2019-01-01") == "2019-01-01"


def test_preview_helper_title_generation():
    # Test file preview auto-cleaning of titles containing 'كما صدر'
    filename = "TEST_قانون_رقم_34_لسنة_2014_النسخة_الأصلية_—_كما_صدر.txt"
    preview = extract_file_preview(b"Sample legal text", filename, "law")
    data = preview.get("data", preview)
    assert "كما صدر" not in data["title"]
    assert "TEST قانون رقم 34 لسنة 2014 النسخة الأصلية" in data["title"]


def test_correction_script_dry_run_and_apply_on_test_data():
    neo_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo_user = os.getenv("NEO4J_USER", "neo4j")
    neo_pw = os.getenv("NEO4J_PASSWORD", "consultation123")
    driver = GraphDatabase.driver(neo_uri, auth=(neo_user, neo_pw))

    pg_url = os.getenv("DATABASE_URL") or "postgresql://postgres:consultation123@localhost:5432/consultation_db"
    conn = psycopg2.connect(pg_url)
    cur = conn.cursor()

    test_law_id = "TEST_LAW_ORIGINAL_9999"
    test_title_old = "TEST قانون ضريبة رقم 99 لسنة 2026 (النسخة الأصلية — كما صدر)"
    test_expected_title = "TEST قانون ضريبة رقم 99 لسنة 2026 (النسخة الأصلية)"

    try:
        # 1. Insert TEST_ record into Neo4j
        with driver.session() as session:
            session.run("""
                MERGE (l:`قانون` {`معرف`: $lid})
                SET l.law_id = $lid,
                    l.title = $title,
                    l.`العنوان` = $title,
                    l.name = $title,
                    l.amended_date = 'لا ينطبق (نص أصلي)',
                    l.`تاريخ_آخر_تعديل` = 'لا ينطبق (نص أصلي)'
            """, lid=test_law_id, title=test_title_old)

        # 2. Insert TEST_ record into PostgreSQL legal_document_metadata
        cur.execute("""
            INSERT INTO legal_document_metadata (document_id, document_type, title, status)
            VALUES (%s, 'law', %s, 'ساري')
            ON CONFLICT (document_id) DO UPDATE SET title = EXCLUDED.title
        """, (test_law_id, test_title_old))
        conn.commit()

        # 3. Dry-run scan with test_only=True
        neo_actions = scan_neo4j(driver, test_only=True)
        pg_actions = scan_postgres(conn, test_only=True)

        assert len(neo_actions) == 1
        assert neo_actions[0]["law_id"] == test_law_id
        assert neo_actions[0]["changes"]["title"]["new"] == test_expected_title
        assert neo_actions[0]["changes"]["amended_date"]["new"] == "—"

        assert len(pg_actions) >= 1
        test_pg = [a for a in pg_actions if a["pk"] == test_law_id]
        assert len(test_pg) == 1
        assert test_pg[0]["changes"]["title"]["new"] == test_expected_title

        # Verify dry-run did NOT change database
        with driver.session() as session:
            node = session.run("MATCH (l) WHERE coalesce(l.law_id, l.`معرف`) = $lid RETURN l.title AS t", lid=test_law_id).single()
            assert node["t"] == test_title_old

        cur.execute("SELECT title FROM legal_document_metadata WHERE document_id = %s", (test_law_id,))
        assert cur.fetchone()[0] == test_title_old

        # 4. Create snapshot and apply changes
        snapshot_file = create_snapshot({"neo4j": neo_actions, "postgres": pg_actions, "qdrant": []})
        assert os.path.exists(snapshot_file)

        apply_neo4j(driver, neo_actions)
        apply_postgres(conn, pg_actions)

        # 5. Verify database has been updated
        with driver.session() as session:
            node = session.run("""
                MATCH (l) WHERE coalesce(l.law_id, l.`معرف`) = $lid
                RETURN l.title AS t, l.`العنوان` AS t_ar, l.amended_date AS amd
            """, lid=test_law_id).single()
            assert node["t"] == test_expected_title
            assert node["t_ar"] == test_expected_title
            assert node["amd"] == "—"

        cur.execute("SELECT title FROM legal_document_metadata WHERE document_id = %s", (test_law_id,))
        assert cur.fetchone()[0] == test_expected_title

    finally:
        # 6. Cleanup TEST_ records and snapshot file
        with driver.session() as session:
            session.run("MATCH (l) WHERE coalesce(l.law_id, l.`معرف`) = $lid DETACH DELETE l", lid=test_law_id)
        cur.execute("DELETE FROM legal_document_metadata WHERE document_id = %s", (test_law_id,))
        conn.commit()
        conn.close()
        driver.close()

        # Cleanup test snapshot files created during this run
        for f in glob.glob("scratch/snapshots/laws_snapshot_*.json"):
            try:
                os.remove(f)
            except Exception:
                pass

import os
import sys
import re
import json
import argparse
from datetime import datetime
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()


def normalize_title(title: str) -> str:
    if not title:
        return ""
    # Remove " — كما صدر" or "— كما صدر" or "- كما صدر"
    res = re.sub(r'\s*—\s*كما صدر', '', title)
    res = re.sub(r'\s*-\s*كما صدر', '', res)
    res = re.sub(r'\s+كما صدر', '', res)
    return res.strip()


def normalize_amended_date(val: str) -> str:
    if not val:
        return "—"
    if "لا ينطبق" in val or "نص أصلي" in val:
        return "—"
    return val


def create_snapshot(data: Dict[str, Any]) -> str:
    snapshot_dir = os.path.join(os.path.dirname(__file__), "..", "scratch", "snapshots")
    os.makedirs(snapshot_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(snapshot_dir, f"laws_snapshot_{ts}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return filepath


def scan_neo4j(driver, test_only: bool = False) -> List[Dict[str, Any]]:
    actions = []
    with driver.session() as session:
        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون` OR l:LawVersion)
        RETURN id(l) AS internal_id,
               coalesce(l.law_id, l.`معرف`, '') AS law_id,
               labels(l) AS labels,
               l.title AS title,
               l.`العنوان` AS title_ar,
               l.name AS name,
               l.amended_date AS amended_date,
               l.`تاريخ_آخر_تعديل` AS amended_date_ar,
               l.summary AS summary
        """
        records = session.run(query).data()
        for r in records:
            lid = r["law_id"]
            if test_only and not (lid.startswith("TEST_") or str(r["title"]).startswith("TEST_")):
                continue

            changes = {}
            for prop_key in ["title", "title_ar", "name"]:
                val = r[prop_key]
                if val and "كما صدر" in str(val):
                    new_val = normalize_title(str(val))
                    if new_val != val:
                        changes[prop_key] = {"old": val, "new": new_val}

            for prop_key in ["amended_date", "amended_date_ar"]:
                val = r[prop_key]
                if val and ("لا ينطبق" in str(val) or "نص أصلي" in str(val)):
                    new_val = normalize_amended_date(str(val))
                    if new_val != val:
                        changes[prop_key] = {"old": val, "new": new_val}

            if changes:
                actions.append({
                    "target": "Neo4j",
                    "internal_id": r["internal_id"],
                    "law_id": lid,
                    "labels": r["labels"],
                    "changes": changes
                })
    return actions


def scan_postgres(conn, test_only: bool = False) -> List[Dict[str, Any]]:
    actions = []
    cur = conn.cursor()

    # 1. legal_document_metadata
    try:
        cur.execute("SELECT document_id, title FROM legal_document_metadata")
        for row in cur.fetchall():
            doc_id, title = row[0], row[1]
            if test_only and not (str(doc_id).startswith("TEST_") or str(title).startswith("TEST_")):
                continue
            if title and "كما صدر" in str(title):
                new_title = normalize_title(str(title))
                if new_title != title:
                    actions.append({
                        "target": "PostgreSQL",
                        "table": "legal_document_metadata",
                        "pk": doc_id,
                        "changes": {"title": {"old": title, "new": new_title}}
                    })
    except Exception:
        conn.rollback()

    # 2. legal_relations (target_title)
    try:
        cur.execute("SELECT id, target_document_id, target_title FROM legal_relations")
        for row in cur.fetchall():
            rel_id, target_doc_id, target_title = row[0], row[1], row[2]
            if test_only and not (str(target_doc_id).startswith("TEST_") or str(target_title).startswith("TEST_")):
                continue
            if target_title and "كما صدر" in str(target_title):
                new_title = normalize_title(str(target_title))
                if new_title != target_title:
                    actions.append({
                        "target": "PostgreSQL",
                        "table": "legal_relations",
                        "pk": rel_id,
                        "changes": {"target_title": {"old": target_title, "new": new_title}}
                    })
    except Exception:
        conn.rollback()

    return actions


def scan_qdrant(q_client, test_only: bool = False) -> List[Dict[str, Any]]:
    actions = []
    if not q_client:
        return actions

    try:
        collections = q_client.get_collections().collections
        for col in collections:
            offset = None
            while True:
                pts, next_page = q_client.scroll(
                    collection_name=col.name,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )
                for pt in pts:
                    p = pt.payload or {}
                    lid = p.get("law_id") or ""
                    title = p.get("law_title") or p.get("title") or ""
                    if test_only and not (str(lid).startswith("TEST_") or str(title).startswith("TEST_")):
                        continue

                    changes = {}
                    for k in ["law_title", "title"]:
                        if p.get(k) and "كما صدر" in str(p[k]):
                            new_val = normalize_title(str(p[k]))
                            if new_val != p[k]:
                                changes[k] = {"old": p[k], "new": new_val}

                    if changes:
                        actions.append({
                            "target": "Qdrant",
                            "collection": col.name,
                            "point_id": pt.id,
                            "changes": changes
                        })
                if not next_page:
                    break
                offset = next_page
    except Exception as e:
        print(f"Warning: Qdrant scan error: {e}")

    return actions


def apply_neo4j(driver, actions: List[Dict[str, Any]]):
    with driver.session() as session:
        for act in actions:
            internal_id = act["internal_id"]
            for prop_key, change in act["changes"].items():
                real_prop = "العنوان" if prop_key == "title_ar" else ("تاريخ_آخر_تعديل" if prop_key == "amended_date_ar" else prop_key)
                cql = f"MATCH (l) WHERE id(l) = $iid SET l.`{real_prop}` = $new_val"
                session.run(cql, iid=internal_id, new_val=change["new"])


def apply_postgres(conn, actions: List[Dict[str, Any]]):
    cur = conn.cursor()
    for act in actions:
        table = act["table"]
        pk = act["pk"]
        if table == "legal_document_metadata":
            cur.execute("UPDATE legal_document_metadata SET title = %s WHERE document_id = %s", (act["changes"]["title"]["new"], pk))
        elif table == "legal_relations":
            cur.execute("UPDATE legal_relations SET target_title = %s WHERE id = %s", (act["changes"]["target_title"]["new"], pk))
    conn.commit()


def apply_qdrant(q_client, actions: List[Dict[str, Any]]):
    for act in actions:
        payload_update = {k: v["new"] for k, v in act["changes"].items()}
        q_client.set_payload(
            collection_name=act["collection"],
            payload=payload_update,
            points=[act["point_id"]]
        )


def rollback_from_snapshot(snapshot_path: str, neo_driver, pg_conn, q_client):
    if not os.path.exists(snapshot_path):
        print(f"[ERROR] Snapshot file not found: {snapshot_path}")
        return
    with open(snapshot_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"[*] Initiating Rollback from snapshot: {snapshot_path}")

    # Rollback Neo4j
    neo_actions = data.get("neo4j", [])
    if neo_actions:
        print(f"[*] Reverting {len(neo_actions)} Neo4j records to previous values...")
        with neo_driver.session() as session:
            for act in neo_actions:
                internal_id = act["internal_id"]
                for prop_key, change in act["changes"].items():
                    real_prop = "العنوان" if prop_key == "title_ar" else ("تاريخ_آخر_تعديل" if prop_key == "amended_date_ar" else prop_key)
                    cql = f"MATCH (l) WHERE id(l) = $iid SET l.`{real_prop}` = $old_val"
                    session.run(cql, iid=internal_id, old_val=change["old"])

    # Rollback Postgres
    pg_actions = data.get("postgres", [])
    if pg_actions:
        print(f"[*] Reverting {len(pg_actions)} PostgreSQL records to previous values...")
        cur = pg_conn.cursor()
        for act in pg_actions:
            table = act["table"]
            pk = act["pk"]
            if table == "legal_document_metadata":
                cur.execute("UPDATE legal_document_metadata SET title = %s WHERE document_id = %s", (act["changes"]["title"]["old"], pk))
            elif table == "legal_relations":
                cur.execute("UPDATE legal_relations SET target_title = %s WHERE id = %s", (act["changes"]["target_title"]["old"], pk))
        pg_conn.commit()

    # Rollback Qdrant
    qd_actions = data.get("qdrant", [])
    if qd_actions and q_client:
        print(f"[*] Reverting {len(qd_actions)} Qdrant points to previous values...")
        for act in qd_actions:
            payload_revert = {k: v["old"] for k, v in act["changes"].items()}
            q_client.set_payload(
                collection_name=act["collection"],
                payload=payload_revert,
                points=[act["point_id"]]
            )
    print("[SUCCESS] All database records have been rolled back to their original state!")


def main():
    parser = argparse.ArgumentParser(description="Correct law titles and amended dates in Neo4j, PostgreSQL, and Qdrant.")
    parser.add_argument("--apply", action="store_true", help="Execute changes (default is dry-run)")
    parser.add_argument("--test-only", action="store_true", help="Only scan and update TEST_ prefixed data")
    parser.add_argument("--rollback", type=str, default=None, help="Rollback changes using specified snapshot JSON file")
    args = parser.parse_args()

    mode = "APPLY" if args.apply else "DRY-RUN (read-only)"
    print(f"=== LAW DATA CORRECTION SCRIPT [{mode}] ===")
    if args.test_only:
        print("[*] Mode: TEST_ records only")

    # Connect Neo4j
    from neo4j import GraphDatabase
    neo_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo_user = os.getenv("NEO4J_USER", "neo4j")
    neo_pw = os.getenv("NEO4J_PASSWORD", "consultation123")
    neo_driver = GraphDatabase.driver(neo_uri, auth=(neo_user, neo_pw))

    # Connect Postgres
    import psycopg2
    pg_url = os.getenv("DATABASE_URL") or "postgresql://postgres:consultation123@localhost:5432/consultation_db"
    pg_conn = psycopg2.connect(pg_url)

    # Connect Qdrant
    q_client = None
    try:
        from qdrant_client import QdrantClient
        q_host = os.getenv("QDRANT_HOST", "localhost")
        q_port = int(os.getenv("QDRANT_PORT", 6333))
        q_client = QdrantClient(host=q_host, port=q_port, timeout=5)
    except Exception:
        pass

    if args.rollback:
        rollback_from_snapshot(args.rollback, neo_driver, pg_conn, q_client)
        neo_driver.close()
        pg_conn.close()
        return

    # Run scans
    neo_actions = scan_neo4j(neo_driver, test_only=args.test_only)
    pg_actions = scan_postgres(pg_conn, test_only=args.test_only)
    qd_actions = scan_qdrant(q_client, test_only=args.test_only)

    all_actions = {
        "neo4j": neo_actions,
        "postgres": pg_actions,
        "qdrant": qd_actions
    }

    total_changes = len(neo_actions) + len(pg_actions) + len(qd_actions)
    print(f"\n[+] Total items detected for correction: {total_changes}")

    print("\n--- 1. Neo4j Changes ---")
    if not neo_actions:
        print("  No changes needed in Neo4j.")
    for a in neo_actions:
        print(f"  • Node law_id: '{a['law_id']}' (internal id {a['internal_id']})")
        for prop, diff in a["changes"].items():
            print(f"    - [{prop}]: '{diff['old']}'  ===>  '{diff['new']}'")

    print("\n--- 2. PostgreSQL Changes ---")
    if not pg_actions:
        print("  No changes needed in PostgreSQL.")
    for a in pg_actions:
        print(f"  • Table '{a['table']}' PK: '{a['pk']}'")
        for col, diff in a["changes"].items():
            print(f"    - [{col}]: '{diff['old']}'  ===>  '{diff['new']}'")

    print("\n--- 3. Qdrant Changes ---")
    if not qd_actions:
        print("  No changes needed in Qdrant.")
    for a in qd_actions:
        print(f"  • Collection '{a['collection']}' Point: '{a['point_id']}'")
        for k, diff in a["changes"].items():
            print(f"    - [{k}]: '{diff['old']}'  ===>  '{diff['new']}'")

    if not args.apply:
        print("\n[DRY-RUN COMPLETE] No database records were modified.")
        print("To apply these changes, rerun with --apply (requires explicit confirmation).")
        neo_driver.close()
        pg_conn.close()
        return

    # Apply mode
    if total_changes == 0:
        print("\nNothing to apply.")
        neo_driver.close()
        pg_conn.close()
        return

    snapshot_file = create_snapshot(all_actions)
    print(f"\n[SNAPSHOT CREATED] Pre-migration snapshot saved to: {snapshot_file}")

    try:
        print("[*] Applying changes to Neo4j...")
        apply_neo4j(neo_driver, neo_actions)
        print("[*] Applying changes to PostgreSQL...")
        apply_postgres(pg_conn, pg_actions)
        if q_client and qd_actions:
            print("[*] Applying changes to Qdrant...")
            apply_qdrant(q_client, qd_actions)
        print("\n[SUCCESS] All records have been successfully corrected!")
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Update failed halfway: {e}")
        print("[*] Triggering automatic cross-database rollback to guarantee consistency...")
        try:
            rollback_from_snapshot(snapshot_file, neo_driver, pg_conn, q_client)
            print("[ROLLBACK COMPLETE] All databases restored to their exact pre-migration state.")
        except Exception as rb_err:
            print(f"[FATAL] Automatic rollback failed: {rb_err}. Use manual rollback from {snapshot_file}")
        raise
    neo_driver.close()
    pg_conn.close()


if __name__ == "__main__":
    main()

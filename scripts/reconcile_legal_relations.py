"""
scripts/reconcile_legal_relations.py
Batch reconciliation tool between PostgreSQL legal_relations table and Neo4j graph relationships.
Supports --batch-size and --fix flags.
"""
import sys
import os
import argparse
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from helpers.database import SessionLocal
from helpers.neo4j_db import neo4j_db
from models.ai.legal_relation import LegalRelation
from services.ai.legal_relation_service import LegalRelationService


def run_reconciliation(batch_size: int = 200, fix: bool = False):
    db = SessionLocal()
    report = {
        "total_pg_records": 0,
        "missing_in_neo4j": [],
        "orphaned_relations": [],
        "extra_in_neo4j": [],
        "fixed_count": 0
    }

    try:
        total_pg = db.query(LegalRelation).filter(LegalRelation.is_active == True).count()
        report["total_pg_records"] = total_pg
        print(f"[1/3] Scanning {total_pg} active PostgreSQL records in batches of {batch_size}...")

        offset = 0
        while offset < total_pg:
            batch = db.query(LegalRelation).filter(
                LegalRelation.is_active == True
            ).order_by(LegalRelation.created_at.asc()).offset(offset).limit(batch_size).all()
            if not batch:
                break

            with neo4j_db.get_session() as session:
                for rel in batch:
                    # 1. Verify existence of parent node
                    p_res = session.run(
                        "MATCH (p) WHERE (p:Law OR p:`قانون`) AND (p.law_id = $pid OR p.`معرف` = $pid OR p.title = $pid) RETURN count(p) as cnt",
                        pid=rel.parent_law_id
                    ).single()
                    parent_exists = p_res and p_res["cnt"] > 0

                    # 2. Verify existence of target node
                    if rel.relation_domain == "judicial":
                        t_res = session.run(
                            "MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $tid OR j.`معرف` = $tid OR j.title = $tid) RETURN count(j) as cnt",
                            tid=rel.target_document_id
                        ).single()
                    else:
                        t_res = session.run(
                            "MATCH (c) WHERE (c.law_id = $tid OR c.`معرف` = $tid OR c.title = $tid) RETURN count(c) as cnt",
                            tid=rel.target_document_id
                        ).single()
                    target_exists = t_res and t_res["cnt"] > 0

                    if not parent_exists or not target_exists:
                        item = {
                            "id": str(rel.id), "parent_law_id": rel.parent_law_id, "target_doc_id": rel.target_document_id,
                            "parent_missing": not parent_exists, "target_missing": not target_exists
                        }
                        report["orphaned_relations"].append(item)
                        if fix:
                            rel.sync_status = "failed"
                            rel.last_sync_error = "علاقة يتيمة: وثيقة الأصل أو الهدف غير موجودة في Neo4j"
                            db.commit()
                        continue

                    # 3. Verify existence of edge in Neo4j
                    edge_type = "CITES_LAW" if rel.relation_domain == "judicial" else ("ISSUED_UNDER" if rel.relation_type == "issued_under" else "REPEALED_BY")
                    e_res = session.run(f"""
                        MATCH (child)-[r:{edge_type}]->(parent)
                        WHERE (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                          AND (child.law_id = $cid OR child.`معرف` = $cid OR child.title = $cid OR child.ruling_id = $cid)
                        RETURN count(r) as cnt
                    """, pid=rel.parent_law_id, cid=rel.target_document_id).single()

                    if not e_res or e_res["cnt"] == 0:
                        report["missing_in_neo4j"].append({
                            "id": str(rel.id), "parent_law_id": rel.parent_law_id, "target_doc_id": rel.target_document_id, "edge_type": edge_type
                        })
                        if fix:
                            ok = LegalRelationService.sync_relation(
                                db=db, parent_law_id=rel.parent_law_id, target_document_id=rel.target_document_id,
                                target_title=rel.target_title or rel.target_document_id, relation_domain=rel.relation_domain,
                                relation_type=rel.relation_type, sub_category=rel.sub_category, document_type=rel.document_type,
                                article_ref=rel.article_ref, effective_date=rel.effective_date, document_status=rel.document_status or "ساري",
                                notes=rel.notes, skip_validation=True
                            )
                            if ok:
                                report["fixed_count"] += 1

            offset += batch_size

        # 4. Check for extra relationships in Neo4j not tracked in PostgreSQL
        print("[2/3] Scanning Neo4j edges for untracked relationships...")
        with neo4j_db.get_session() as session:
            for et in ["ISSUED_UNDER", "REPEALED_BY", "CITES_LAW"]:
                edges = session.run(f"""
                    MATCH (child)-[r:{et}]->(parent)
                    RETURN coalesce(parent.law_id, parent.`معرف`, parent.title) as pid,
                           coalesce(child.law_id, child.ruling_id, child.`معرف`, child.title) as cid,
                           type(r) as rel_type
                """).data()
                for e in edges:
                    pid, cid = str(e["pid"]), str(e["cid"])
                    exists = db.query(LegalRelation).filter(
                        LegalRelation.parent_law_id == pid,
                        LegalRelation.target_document_id == cid,
                        LegalRelation.is_active == True
                    ).first()
                    if not exists:
                        report["extra_in_neo4j"].append({"parent": pid, "child": cid, "type": e["rel_type"]})
                        if fix:
                            session.run(f"""
                                MATCH (child)-[r:{e["rel_type"]}]->(parent)
                                WHERE (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                                  AND (child.law_id = $cid OR child.ruling_id = $cid OR child.`معرف` = $cid OR child.title = $cid)
                                DELETE r
                            """, pid=pid, cid=cid)
                            report["fixed_count"] += 1

        print("\n=== RECONCILIATION REPORT ===")
        print(f"Total PostgreSQL Records: {report['total_pg_records']}")
        print(f"Missing in Neo4j: {len(report['missing_in_neo4j'])}")
        print(f"Orphaned in PostgreSQL: {len(report['orphaned_relations'])}")
        print(f"Extra Edges in Neo4j: {len(report['extra_in_neo4j'])}")
        if fix:
            print(f"Fixed Records: {report['fixed_count']}")
        print("=============================\n")
        return report

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reconcile legal relations between PostgreSQL and Neo4j")
    parser.add_argument("--batch-size", type=int, default=200, help="Batch scan size")
    parser.add_argument("--fix", action="store_true", help="Auto-fix missing edges and flag orphaned relations")
    args = parser.parse_args()

    run_reconciliation(batch_size=args.batch_size, fix=args.fix)

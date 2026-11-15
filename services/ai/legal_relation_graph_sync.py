"""
services/ai/legal_relation_graph_sync.py
Neo4j relationship synchronization helper for legal document relations.
"""
from datetime import datetime, timezone
from helpers.neo4j_db import neo4j_db


class LegalRelationGraphSync:

    @staticmethod
    def delete_relation_edge(pid: str, cid: str) -> None:
        """Deletes relationship edge between child and parent without modifying nodes."""
        with neo4j_db.get_session() as session:
            session.run("""
                MATCH (child)-[r]->(parent)
                WHERE (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                  AND (child.law_id = $cid OR child.`معرف` = $cid OR child.title = $cid OR child.ruling_id = $cid)
                  AND type(r) IN ['ISSUED_UNDER', 'REPEALED_BY', 'CITES_LAW', 'AMENDS']
                DELETE r
            """, pid=pid, cid=cid)

    @staticmethod
    def sync_relation_edge(row) -> None:
        """Merges relationship edge and attributes into Neo4j graph."""
        with neo4j_db.get_session() as session:
            if row.relation_domain == "legislative":
                edge_type = "ISSUED_UNDER" if row.relation_type == "issued_under" else "REPEALED_BY"
                session.run(f"""
                    MATCH (parent) WHERE (parent:Law OR parent:`قانون`) AND (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                    MATCH (child) WHERE (child.law_id = $cid OR child.`معرف` = $cid OR child.title = $cid)
                    SET child.document_type = $doc_type
                    MERGE (child)-[r:{edge_type}]->(parent)
                    SET r.sub_type = $sub_cat, r.status = $status, r.domain = 'legislative',
                        r.article_ref = $art_ref, r.effective_date = $eff_date, r.updated_at = datetime()
                """, pid=row.parent_law_id, cid=row.target_document_id, doc_type=row.document_type or row.sub_category,
                    sub_cat=row.sub_category, status=row.document_status or "ساري",
                    art_ref=row.article_ref or "", eff_date=row.effective_date or "")
            else:
                session.run("""
                    MATCH (parent) WHERE (parent:Law OR parent:`قانون`) AND (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                    MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $jid OR j.`معرف` = $jid OR j.title = $jid)
                    SET j.document_type = 'حكم قضائي'
                    MERGE (j)-[r:CITES_LAW]->(parent)
                    SET r.court = $court, r.sub_type = $court, r.domain = 'judicial',
                        r.article_ref = $art_ref, r.effective_date = $eff_date, r.updated_at = datetime()
                """, pid=row.parent_law_id, jid=row.target_document_id, court=row.sub_category,
                    art_ref=row.article_ref or "", eff_date=row.effective_date or "")

"""
services/ai/legal_repeal_helper.py
Helper functions for Neo4j synchronization and document resolution for repeal operations.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from helpers.neo4j_db import neo4j_db
from models.ai.legal_document_metadata import LegalDocumentMetadata


class LegalRepealHelper:

    @classmethod
    def get_document_info(cls, doc_id: str, db: Session) -> Dict[str, Any]:
        meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
        neo_info = None
        try:
            with neo4j_db.get_session() as session:
                res = session.run(
                    """
                    MATCH (d) WHERE (d:Law OR d:`قانون` OR d:Judgment OR d:JudicialRuling OR d:`حكم_قضائي`)
                      AND (d.law_id = $did OR d.ruling_id = $did OR d.`معرف` = $did OR d.id = $did)
                    RETURN coalesce(d.law_id, d.ruling_id, d.`معرف`, d.id) as id,
                           coalesce(d.title, d.law_title, d.`العنوان`, d.`name`, '') as title,
                           coalesce(d.number, d.law_number, d.ruling_number, d.`رقم_القانون`, d.`رقم_الحكم`, '') as number,
                           CASE WHEN (d:Judgment OR d:JudicialRuling OR d:`حكم_قضائي`) THEN 'judgment' ELSE 'law' END as doc_type,
                           coalesce(d.status, 'ساري') as status
                    LIMIT 1
                    """, did=doc_id
                ).single()
                if res:
                    neo_info = dict(res)
        except Exception as e:
            print(f"[RepealHelper] Neo4j read error: {e}")

        if not meta and not neo_info:
            raise ValueError(f"الوثيقة '{doc_id}' غير موجودة")

        doc_type = meta.document_type if meta else (neo_info.get("doc_type") or "law")
        title = (meta.title if meta and meta.title else None) or (neo_info.get("title") if neo_info else doc_id)
        status = meta.status if meta else (neo_info.get("status") if neo_info else "ساري")

        return {
            "document_id": doc_id,
            "title": title,
            "number": str(neo_info.get("number") or "") if neo_info else "",
            "document_type": doc_type,
            "status": status or "ساري",
            "repealed_at": meta.repealed_at.isoformat() if meta and meta.repealed_at else None,
            "repeal_reason": meta.repeal_reason if meta else None,
            "repealed_by_document_id": meta.repealed_by_document_id if meta else None
        }

    @classmethod
    def sync_repeal_to_neo4j(
        cls, doc_id: str, repealed_deps: List[str], reason: Optional[str], rep_by: Optional[str]
    ) -> bool:
        try:
            with neo4j_db.get_session() as session:
                session.run(
                    """
                    MATCH (d) WHERE (d.law_id = $did OR d.ruling_id = $did OR d.`معرف` = $did OR d.id = $did)
                    SET d.status = 'ملغي', d.repealed_at = toString(datetime()),
                        d.repeal_reason = $reason, d.repealed_by_document_id = $rep_by
                    """, did=doc_id, reason=reason, rep_by=rep_by
                )
                if repealed_deps:
                    session.run(
                        """
                        UNWIND $deps as dep_id
                        MATCH (d) WHERE (d.law_id = dep_id OR d.ruling_id = dep_id OR d.`معرف` = dep_id OR d.id = dep_id)
                        SET d.status = 'ملغي', d.repealed_at = toString(datetime()), d.repeal_reason = $reason
                        """, deps=repealed_deps, reason=f"أُلغي بالتبعية للقانون ({doc_id})"
                    )
            return True
        except Exception as e:
            print(f"[RepealHelper] Neo4j repeal sync error: {e}")
            return False

    @classmethod
    def sync_restore_to_neo4j(cls, doc_id: str) -> bool:
        try:
            with neo4j_db.get_session() as session:
                session.run(
                    """
                    MATCH (d) WHERE (d.law_id = $did OR d.ruling_id = $did OR d.`معرف` = $did OR d.id = $did)
                    SET d.status = 'ساري', d.repealed_at = null, d.repeal_reason = null, d.repealed_by_document_id = null
                    """, did=doc_id
                )
            return True
        except Exception as e:
            print(f"[RepealHelper] Neo4j restore sync error: {e}")
            return False

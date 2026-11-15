"""
services/ai/legal_relation_service.py
Service to manage and query legal relationships across PostgreSQL and Neo4j with full reliability.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from helpers.database import SessionLocal
from helpers.neo4j_db import neo4j_db
from models.ai.legal_relation import LegalRelation


class LegalRelationService:
    @staticmethod
    def validate_nodes_exist(parent_law_id: str, target_doc_id: str, domain: str = "legislative") -> None:
        """Ensures both parent law and target document exist in Neo4j before linking."""
        with neo4j_db.get_session() as session:
            p_chk = session.run(
                "MATCH (p) WHERE (p:Law OR p:`قانون`) AND (p.law_id = $pid OR p.`معرف` = $pid OR p.title = $pid) RETURN count(p) as cnt",
                pid=str(parent_law_id)
            ).single()
            if not p_chk or p_chk["cnt"] == 0:
                raise ValueError(f"قانون الأصل غير موجود في النظام: ({parent_law_id})")

            if domain == "judicial":
                t_chk = session.run(
                    "MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $tid OR j.`معرف` = $tid OR j.title = $tid) RETURN count(j) as cnt",
                    tid=str(target_doc_id)
                ).single()
                if not t_chk or t_chk["cnt"] == 0:
                    raise ValueError(f"الحكم القضائي المستهدف غير موجود في النظام: ({target_doc_id})")
            else:
                t_chk = session.run(
                    "MATCH (c) WHERE (c.law_id = $tid OR c.`معرف` = $tid OR c.title = $tid) RETURN count(c) as cnt",
                    tid=str(target_doc_id)
                ).single()
                if not t_chk or t_chk["cnt"] == 0:
                    raise ValueError(f"الوثيقة المستهدفة غير موجودة في النظام: ({target_doc_id})")

    @staticmethod
    def get_available_parent_laws(q: Optional[str] = None, limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
        """Returns list of active laws with optional text search, pagination and limit."""
        laws = []
        try:
            with neo4j_db.get_session() as session:
                where_clauses = ["(l:Law OR l:`قانون`)", "coalesce(l.is_active, true) = true"]
                params: Dict[str, Any] = {"lim": max(1, min(limit, 200)), "skp": max(0, skip)}
                if q and q.strip():
                    where_clauses.append("(coalesce(l.title, l.`العنوان`, '') =~ $filter_q OR coalesce(l.law_id, l.`معرف`, '') =~ $filter_q)")
                    params["filter_q"] = f"(?i).*{q.strip()}.*"

                cql = f"""
                MATCH (l)
                WHERE {' AND '.join(where_clauses)}
                RETURN DISTINCT
                    coalesce(l.law_id, l.`معرف`, 'law_unknown') as id,
                    coalesce(l.title, l.law_title, l.`العنوان`, l.`name`, 'تشريع بدون عنوان') as title,
                    coalesce(l.year, l.law_year, l.`السنة`, '-') as year,
                    coalesce(l.number, l.law_number, l.`رقم_القانون`, '-') as number
                ORDER BY title ASC
                SKIP $skp
                LIMIT $lim
                """
                res = session.run(cql, **params)
                for r in res:
                    laws.append({"id": str(r["id"]), "title": str(r["title"]), "year": str(r["year"]), "number": str(r["number"])})
        except Exception as e:
            print(f"Warning: Failed to fetch parent laws: {e}")
        return laws

    @classmethod
    def sync_relation(
        cls, db: Session, parent_law_id: str, target_document_id: str, target_title: str,
        relation_domain: str, relation_type: str, sub_category: Optional[str] = None,
        document_type: Optional[str] = None, article_ref: Optional[str] = None,
        effective_date: Optional[str] = None, created_by: Optional[Any] = None,
        document_status: str = "ساري", notes: Optional[str] = None, skip_validation: bool = False
    ) -> bool:
        """Persists relationship in PostgreSQL with pending status, executes Neo4j merge, and updates sync state."""
        if not parent_law_id or not target_document_id:
            return False

        if not skip_validation:
            cls.validate_nodes_exist(parent_law_id, target_document_id, relation_domain)

        doc_type = document_type or sub_category or "نظام"
        sub_cat = sub_category or doc_type

        # 1. PostgreSQL Persistence as 'pending'
        existing = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == str(parent_law_id),
            LegalRelation.target_document_id == str(target_document_id),
            LegalRelation.relation_type == str(relation_type),
            LegalRelation.sub_category == str(sub_cat)
        ).first()

        if not existing:
            existing = LegalRelation(
                parent_law_id=str(parent_law_id), target_document_id=str(target_document_id),
                target_title=target_title, relation_domain=relation_domain, relation_type=relation_type,
                sub_category=sub_cat, document_type=doc_type, article_ref=article_ref,
                effective_date=effective_date, created_by=created_by, document_status=document_status,
                notes=notes, sync_status="pending"
            )
            db.add(existing)
        else:
            existing.document_type = doc_type
            existing.article_ref = article_ref
            existing.effective_date = effective_date
            existing.document_status = document_status
            existing.target_title = target_title
            existing.notes = notes
            existing.sync_status = "pending"
        db.commit()

        # 2. Neo4j Edge Synchronization
        try:
            with neo4j_db.get_session() as session:
                if relation_domain == "legislative":
                    edge_type = "ISSUED_UNDER" if relation_type == "issued_under" else "REPEALED_BY"
                    cql = f"""
                    MATCH (parent) WHERE (parent:Law OR parent:`قانون`) AND (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                    MATCH (child) WHERE (child.law_id = $cid OR child.`معرف` = $cid OR child.title = $cid)
                    SET child.document_type = $doc_type
                    MERGE (child)-[r:{edge_type}]->(parent)
                    SET r.sub_type = $sub_cat, r.status = $status, r.domain = 'legislative',
                        r.article_ref = $art_ref, r.effective_date = $eff_date, r.updated_at = datetime()
                    """
                    session.run(cql, pid=parent_law_id, cid=target_document_id, doc_type=doc_type,
                                sub_cat=sub_cat, status=document_status, art_ref=article_ref or "", eff_date=effective_date or "")
                elif relation_domain == "judicial":
                    cql = """
                    MATCH (parent) WHERE (parent:Law OR parent:`قانون`) AND (parent.law_id = $pid OR parent.`معرف` = $pid OR parent.title = $pid)
                    MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $jid OR j.`معرف` = $jid OR j.title = $jid)
                    SET j.document_type = 'حكم قضائي'
                    MERGE (j)-[r:CITES_LAW]->(parent)
                    SET r.court = $court, r.sub_type = $court, r.domain = 'judicial',
                        r.article_ref = $art_ref, r.effective_date = $eff_date, r.updated_at = datetime()
                    """
                    session.run(cql, pid=parent_law_id, jid=target_document_id, court=sub_cat,
                                art_ref=article_ref or "", eff_date=effective_date or "")

            existing.sync_status = "synced"
            existing.synced_at = datetime.utcnow()
            existing.last_sync_error = None
            db.commit()
            return True
        except Exception as neo_err:
            existing.sync_status = "failed"
            existing.last_sync_error = str(neo_err)
            existing.retry_count = (existing.retry_count or 0) + 1
            db.commit()
            return False

    @classmethod
    def retry_pending_or_failed_syncs(cls, db: Session, max_retries: int = 3, batch_size: int = 50) -> Dict[str, int]:
        """Cron / background job to retry unsynced records up to max_retries."""
        targets = db.query(LegalRelation).filter(
            LegalRelation.is_active == True,
            LegalRelation.sync_status.in_(["pending", "failed"]),
            LegalRelation.retry_count < max_retries
        ).limit(batch_size).all()

        succeeded, failed = 0, 0
        for rel in targets:
            ok = cls.sync_relation(
                db=db, parent_law_id=rel.parent_law_id, target_document_id=rel.target_document_id,
                target_title=rel.target_title or rel.target_document_id, relation_domain=rel.relation_domain,
                relation_type=rel.relation_type, sub_category=rel.sub_category, document_type=rel.document_type,
                article_ref=rel.article_ref, effective_date=rel.effective_date, created_by=rel.created_by,
                document_status=rel.document_status or "ساري", notes=rel.notes, skip_validation=True
            )
            if ok:
                succeeded += 1
            else:
                failed += 1
        return {"processed": len(targets), "succeeded": succeeded, "failed": failed}

    @staticmethod
    def get_law_taxonomy_tree(law_id: str) -> Dict[str, Any]:
        """Returns grouped taxonomy tree for a specific law with non-empty categories."""
        db = SessionLocal()
        try:
            relations = db.query(LegalRelation).filter(
                LegalRelation.parent_law_id == str(law_id),
                LegalRelation.is_active == True
            ).all()
            issued_under: Dict[str, list] = {}
            repealed_by: Dict[str, list] = {}
            judicial: Dict[str, list] = {}

            for r in relations:
                item = {
                    "id": r.target_document_id, "title": r.target_title or r.target_document_id,
                    "status": r.document_status or "ساري", "notes": r.notes, "sync_status": r.sync_status,
                    "document_type": r.document_type, "article_ref": r.article_ref, "effective_date": r.effective_date
                }
                if r.relation_domain == "legislative":
                    if r.relation_type == "issued_under":
                        issued_under.setdefault(r.sub_category, []).append(item)
                    elif r.relation_type == "repealed_by":
                        repealed_by.setdefault(r.sub_category, []).append(item)
                elif r.relation_domain == "judicial":
                    judicial.setdefault(r.sub_category, []).append(item)

            return {"legislative": {"issued_under": issued_under, "repealed_by": repealed_by}, "judicial": judicial}
        finally:
            db.close()

    @classmethod
    def get_document_active_relations(cls, db: Session, target_doc_id: str) -> List[Dict[str, Any]]:
        """Fetches active incoming legal relations for a target document."""
        from services.ai.legal_relation_edit_helper import LegalRelationEditHelper
        return LegalRelationEditHelper.get_document_active_relations(db=db, target_doc_id=target_doc_id)

    @classmethod
    def update_document_relations(
        cls, db: Session, target_doc_id: str, payload: Dict[str, Any], current_user_id: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Updates legal relations for a target document with diffing, soft-deletes, audits and graph sync."""
        from services.ai.legal_relation_edit_helper import LegalRelationEditHelper
        return LegalRelationEditHelper.update_document_relations(
            db=db, target_doc_id=target_doc_id, payload=payload, current_user_id=current_user_id
        )

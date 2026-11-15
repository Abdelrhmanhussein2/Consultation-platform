"""
services/ai/legal_relation_edit_helper.py
Helper for diffing, soft-deleting, auditing, and synchronizing document relations on edit.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from helpers.neo4j_db import neo4j_db
from models.ai.legal_relation import LegalRelation, LegalRelationAudit
from services.ai.legal_relation_graph_sync import LegalRelationGraphSync


class LegalRelationEditHelper:

    @staticmethod
    def get_document_active_relations(db: Session, target_doc_id: str) -> List[Dict[str, Any]]:
        """Fetches active legal relations for a document in a single query with parent titles."""
        rows = db.query(LegalRelation).filter(
            LegalRelation.target_document_id == str(target_doc_id),
            LegalRelation.is_active == True
        ).all()
        if not rows:
            return []

        title_map = {}
        pids = list({r.parent_law_id for r in rows})
        try:
            with neo4j_db.get_session() as session:
                res = session.run("""
                    MATCH (p) WHERE (p:Law OR p:`قانون`) AND (p.law_id IN $pids OR p.`معرف` IN $pids OR p.title IN $pids)
                    RETURN coalesce(p.law_id, p.`معرف`, p.title) as id,
                           coalesce(p.title, p.law_title, p.`العنوان`, p.`name`, 'تشريع') as title
                """, pids=pids)
                for rec in res:
                    title_map[str(rec["id"])] = str(rec["title"])
        except Exception:
            pass

        return [{
            "id": str(r.id),
            "parent_law_id": r.parent_law_id,
            "parent_title": title_map.get(r.parent_law_id, r.parent_law_id),
            "relation_domain": r.relation_domain,
            "relation_type": r.relation_type,
            "sub_category": r.sub_category,
            "document_type": r.document_type,
            "court": r.sub_category if r.relation_domain == "judicial" else None,
            "article_ref": r.article_ref,
            "effective_date": r.effective_date,
            "document_status": r.document_status or "ساري",
            "notes": r.notes
        } for r in rows]

    @classmethod
    def update_document_relations(
        cls,
        db: Session,
        target_doc_id: str,
        payload: Dict[str, Any],
        current_user_id: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Calculates relation diff, applies soft-delete & audits in 1 PG transaction, then syncs Neo4j."""
        from services.ai.legal_relation_service import LegalRelationService

        if "relations" in payload and isinstance(payload["relations"], list):
            desired_items = payload["relations"]
        elif "related_laws" in payload:
            pids = payload.get("related_laws") or []
            domain = payload.get("relation_domain", "legislative")
            rel_type = payload.get("relation_type", "issued_under" if domain == "legislative" else "cites_law")
            sub_cat = payload.get("court_category" if domain == "judicial" else "sub_category", "الأنظمة" if domain == "legislative" else "تمييز حقوق")
            target_title = payload.get("title", target_doc_id)
            desired_items = [{
                "parent_law_id": str(pid),
                "target_title": target_title,
                "relation_domain": domain,
                "relation_type": rel_type,
                "sub_category": sub_cat,
                "document_type": payload.get("document_type"),
                "article_ref": payload.get("article_ref"),
                "effective_date": payload.get("effective_date"),
                "notes": payload.get("notes")
            } for pid in pids if pid]
        else:
            return {"added": 0, "updated": 0, "removed": 0, "warning": None}

        curr_rows = db.query(LegalRelation).filter(
            LegalRelation.target_document_id == str(target_doc_id),
            LegalRelation.is_active == True
        ).all()
        curr_map = {r.parent_law_id: r for r in curr_rows}
        incoming_map = {item["parent_law_id"]: item for item in desired_items if item.get("parent_law_id")}

        removed_pids = set(curr_map.keys()) - set(incoming_map.keys())
        added_pids = set(incoming_map.keys()) - set(curr_map.keys())
        common_pids = set(curr_map.keys()) & set(incoming_map.keys())

        neo_to_delete, neo_to_sync = [], []
        now_dt = datetime.now(timezone.utc)
        doc_type_changed = False

        # 1. Soft-delete removed
        for pid in removed_pids:
            row = curr_map[pid]
            row.is_active, row.unlinked_at, row.unlinked_by, row.sync_status = False, now_dt, current_user_id, "pending"
            db.add(LegalRelationAudit(
                relation_id=row.id, parent_law_id=row.parent_law_id, target_document_id=str(target_doc_id),
                action="unlink", performed_by=current_user_id, details={"relation_type": row.relation_type, "sub_category": row.sub_category}
            ))
            neo_to_delete.append((row.parent_law_id, str(target_doc_id), row))

        # 2. Update common
        updated_count = 0
        for pid in common_pids:
            row, inc = curr_map[pid], incoming_map[pid]
            sub_cat = inc.get("sub_category") or row.sub_category
            rel_type = inc.get("relation_type") or row.relation_type
            doc_type = inc.get("document_type") or row.document_type
            art_ref = inc.get("article_ref", row.article_ref)
            eff_date = inc.get("effective_date", row.effective_date)
            notes = inc.get("notes", row.notes)

            if (row.sub_category != sub_cat or row.relation_type != rel_type or row.document_type != doc_type or
                    row.article_ref != art_ref or row.effective_date != eff_date or row.notes != notes):
                if row.document_type != doc_type and doc_type is not None:
                    doc_type_changed = True
                row.sub_category, row.relation_type, row.document_type = sub_cat, rel_type, doc_type
                row.article_ref, row.effective_date, row.notes, row.sync_status = art_ref, eff_date, notes, "pending"
                db.add(LegalRelationAudit(
                    relation_id=row.id, parent_law_id=row.parent_law_id, target_document_id=str(target_doc_id),
                    action="update", performed_by=current_user_id, details=inc
                ))
                updated_count += 1
                neo_to_sync.append(row)

        # 3. Add new
        for pid in added_pids:
            inc = incoming_map[pid]
            LegalRelationService.validate_nodes_exist(pid, str(target_doc_id), inc.get("relation_domain", "legislative"))
            existing = db.query(LegalRelation).filter(
                LegalRelation.parent_law_id == pid, LegalRelation.target_document_id == str(target_doc_id),
                LegalRelation.relation_type == inc.get("relation_type", "issued_under"),
                LegalRelation.sub_category == inc.get("sub_category", "الأنظمة")
            ).first()

            if existing:
                existing.is_active, existing.unlinked_at, existing.unlinked_by = True, None, None
                existing.article_ref = inc.get("article_ref")
                existing.effective_date = inc.get("effective_date")
                existing.notes, existing.sync_status = inc.get("notes"), "pending"
                row_obj = existing
            else:
                row_obj = LegalRelation(
                    parent_law_id=pid, target_document_id=str(target_doc_id),
                    target_title=inc.get("target_title", str(target_doc_id)),
                    relation_domain=inc.get("relation_domain", "legislative"),
                    relation_type=inc.get("relation_type", "issued_under"),
                    sub_category=inc.get("sub_category", "الأنظمة"), document_type=inc.get("document_type"),
                    article_ref=inc.get("article_ref"), effective_date=inc.get("effective_date"),
                    created_by=current_user_id, is_active=True, sync_status="pending"
                )
                db.add(row_obj)

            db.add(LegalRelationAudit(
                relation_id=row_obj.id, parent_law_id=pid, target_document_id=str(target_doc_id),
                action="link", performed_by=current_user_id, details=inc
            ))
            neo_to_sync.append(row_obj)

        db.commit()

        # 4. Neo4j Synchronizations
        for pid, cid, row in neo_to_delete:
            try:
                LegalRelationGraphSync.delete_relation_edge(pid, cid)
                row.sync_status, row.synced_at, row.last_sync_error = "synced", datetime.now(timezone.utc), None
            except Exception as e:
                row.sync_status, row.last_sync_error = "failed", str(e)
                row.retry_count = (row.retry_count or 0) + 1
            db.commit()

        for row in neo_to_sync:
            try:
                LegalRelationGraphSync.sync_relation_edge(row)
                row.sync_status, row.synced_at, row.last_sync_error = "synced", datetime.now(timezone.utc), None
            except Exception as e:
                row.sync_status, row.last_sync_error = "failed", str(e)
                row.retry_count = (row.retry_count or 0) + 1
            db.commit()

        active_count = db.query(LegalRelation).filter(
            LegalRelation.target_document_id == str(target_doc_id), LegalRelation.is_active == True
        ).count()
        warning = "تنبيه: تم تعديل نوع الوثيقة وهي مرتبطة بأكثر من قانون أصل." if doc_type_changed and active_count > 1 else None

        return {"added": len(added_pids), "updated": updated_count, "removed": len(removed_pids), "warning": warning}

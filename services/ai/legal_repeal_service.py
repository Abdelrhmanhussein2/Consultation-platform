"""
services/ai/legal_repeal_service.py
Service for safely managing legal document repeal lifecycle, preview, and audits.
Single source of truth: PostgreSQL legal_document_metadata, synchronized to Neo4j.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models.ai.legal_relation import LegalRelation
from models.ai.legal_document_metadata import LegalDocumentMetadata, LegalRepealAudit
from services.ai.legal_repeal_helper import LegalRepealHelper


class LegalRepealService:

    @classmethod
    def get_repeal_preview(cls, doc_id: str, db: Session, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        if doc_id.startswith("sources/"):
            doc_id = doc_id[len("sources/"):]
        doc_info = LegalRepealHelper.get_document_info(doc_id, db)
        rels = db.query(LegalRelation).filter(
            LegalRelation.parent_law_id == doc_id,
            LegalRelation.is_active == True
        ).all()
        dep_ids = [r.target_document_id for r in rels]

        other_parents_map: Dict[str, List[Dict[str, str]]] = {did: [] for did in dep_ids}
        if dep_ids:
            other_pg = db.query(LegalRelation).filter(
                LegalRelation.target_document_id.in_(dep_ids),
                LegalRelation.parent_law_id != doc_id,
                LegalRelation.is_active == True
            ).all()
            for op in other_pg:
                other_parents_map.setdefault(op.target_document_id, []).append({
                    "id": op.parent_law_id, "title": op.parent_law_id
                })

        meta_deps = {m.document_id: m for m in db.query(LegalDocumentMetadata).filter(
            LegalDocumentMetadata.document_id.in_(dep_ids)
        ).all()} if dep_ids else {}

        legislative: List[Dict[str, Any]] = []
        judicial: List[Dict[str, Any]] = []

        for r in rels:
            meta = meta_deps.get(r.target_document_id)
            current_status = meta.status if meta else (r.document_status or "ساري")
            others = other_parents_map.get(r.target_document_id, [])
            item = {
                "target_document_id": r.target_document_id,
                "title": r.target_title or r.target_document_id,
                "relation_type": r.relation_type,
                "sub_category": r.sub_category,
                "document_type": r.document_type or ("judgment" if r.relation_domain == "judicial" else "regulation"),
                "status": current_status,
                "other_parents": others,
                "has_multiple_parents": len(others) > 0
            }
            if r.relation_domain == "judicial":
                item["action_allowed"] = ["keep"]
                item["is_historical"] = True
                judicial.append(item)
            else:
                item["action_allowed"] = ["repeal", "keep"]
                legislative.append(item)

        total_deps = len(legislative) + len(judicial)
        multi_parent_count = sum(1 for item in (legislative + judicial) if item["has_multiple_parents"])

        counts = {
            "legislative_count": len(legislative),
            "judicial_count": len(judicial),
            "multi_parent_count": multi_parent_count,
            "total_dependents": total_deps
        }

        response: Dict[str, Any] = {
            "document": doc_info,
            "counts": counts,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total_deps + page_size - 1) // page_size)
        }
        if legislative:
            response["legislative"] = legislative
        if judicial:
            response["judicial"] = judicial
        return response

    @classmethod
    def execute_repeal(
        cls, doc_id: str, payload: Dict[str, Any], current_user_id: Optional[str], db: Session
    ) -> Dict[str, Any]:
        if doc_id.startswith("sources/"):
            doc_id = doc_id[len("sources/"):]
        preview = cls.get_repeal_preview(doc_id, db)
        allowed_dep_ids = {i["target_document_id"] for i in preview.get("legislative", [])}
        judicial_dep_ids = {i["target_document_id"] for i in preview.get("judicial", [])}
        allowed_dep_ids.update(judicial_dep_ids)

        dependents_actions = payload.get("dependents_actions") or []
        repeal_reason = payload.get("repeal_reason")
        repealed_by_doc_id = payload.get("repealed_by_document_id")

        for act in dependents_actions:
            tid = act.get("target_document_id")
            action = act.get("action")
            if tid not in allowed_dep_ids:
                raise ValueError(f"المعرّف '{tid}' غير مرتبط بهذا القانون")
            if tid in judicial_dep_ids and action == "repeal":
                raise ValueError("لا يمكن إلغاء الأحكام القضائية كأثر لتبعية القانون، الأحكام القضائية تظل سارية كاجتهاد قضائي تاريخي")

        meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
        now = datetime.now(timezone.utc)
        if not meta:
            meta = LegalDocumentMetadata(document_id=doc_id, document_type=preview["document"]["document_type"])
            db.add(meta)
        meta.title = preview["document"]["title"]
        meta.status = "ملغي"
        meta.repealed_at = now
        meta.repealed_by_user = current_user_id
        meta.repeal_reason = repeal_reason
        meta.repealed_by_document_id = repealed_by_doc_id
        meta.sync_status = "pending"

        repealed_deps = []
        for act in dependents_actions:
            if act.get("action") == "repeal":
                tid = act["target_document_id"]
                repealed_deps.append(tid)
                dep_meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == tid).first()
                if not dep_meta:
                    dep_meta = LegalDocumentMetadata(document_id=tid, document_type="regulation")
                    db.add(dep_meta)
                dep_meta.status = "ملغي"
                dep_meta.repealed_at = now
                dep_meta.repealed_by_user = current_user_id
                dep_meta.repeal_reason = f"أُلغي بالتبعية لإلغاء القانون الأصل ({doc_id})"
                dep_meta.repealed_by_document_id = repealed_by_doc_id
                dep_meta.sync_status = "pending"
                db.query(LegalRelation).filter(LegalRelation.target_document_id == tid).update(
                    {"document_status": "ملغي"}, synchronize_session=False
                )

        audit = LegalRepealAudit(
            document_id=doc_id, action="repeal", performed_by=current_user_id,
            reason=repeal_reason, repealed_by_document_id=repealed_by_doc_id,
            dependents_actions=dependents_actions,
            summary={"repealed_dependents": len(repealed_deps), "kept_dependents": len(dependents_actions) - len(repealed_deps)}
        )
        db.add(audit)
        db.commit()

        neo_synced = LegalRepealHelper.sync_repeal_to_neo4j(doc_id, repealed_deps, repeal_reason, repealed_by_doc_id)
        meta.sync_status = "synced" if neo_synced else "failed"
        meta.synced_at = now if neo_synced else None
        meta.last_sync_error = None if neo_synced else "Failed to synchronize status with Neo4j"
        db.commit()

        return {
            "status": "success",
            "message": "تم إلغاء القانون بنجاح",
            "document_id": doc_id,
            "sync_status": meta.sync_status,
            "repealed_dependents_count": len(repealed_deps)
        }

    @classmethod
    def restore_document(cls, doc_id: str, current_user_id: Optional[str], db: Session) -> Dict[str, Any]:
        if doc_id.startswith("sources/"):
            doc_id = doc_id[len("sources/"):]
        info = LegalRepealHelper.get_document_info(doc_id, db)
        meta = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id == doc_id).first()
        now = datetime.now(timezone.utc)
        if not meta:
            meta = LegalDocumentMetadata(document_id=doc_id, document_type=info["document_type"])
            db.add(meta)
        meta.status = "ساري"
        meta.repealed_at = None
        meta.repeal_reason = None
        meta.repealed_by_document_id = None
        meta.sync_status = "pending"

        audit = LegalRepealAudit(document_id=doc_id, action="restore", performed_by=current_user_id)
        db.add(audit)
        db.commit()

        neo_synced = LegalRepealHelper.sync_restore_to_neo4j(doc_id)
        meta.sync_status = "synced" if neo_synced else "failed"
        meta.synced_at = now if neo_synced else None
        db.commit()

        return {"status": "success", "message": "تمت إعادة تفعيل القانون بنجاح", "document_id": doc_id}

import uuid
from typing import Any, Dict
from fastapi import HTTPException
from helpers.neo4j_db import neo4j_db
from services.ai.vector_index_service import VectorIndexService
from services.ai.legal_preview_helper import extract_law_metadata


def create_manual_law(payload: Dict[str, Any]) -> Dict[str, Any]:
    law_id = payload.get("code") or f"law_{uuid.uuid4().hex[:8]}"
    title = payload.get("title", "تشريع جديد")
    year = int(payload.get("year") or 2026)
    body = payload.get("body", "")
    doc_type = payload.get("sub_category") or payload.get("category") or payload.get("document_type") or "قانون"
    meta = extract_law_metadata(body)
    version_id, art_id = f"{law_id}_v1", f"{law_id}_v1_art1"
    with neo4j_db.get_session() as session:
        chk = session.run(
            "MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $lid OR l.`معرف` = $lid OR l.title = $title OR l.`العنوان` = $title) RETURN l.title as t LIMIT 1",
            lid=law_id, title=title
        ).single()
        if chk:
            raise HTTPException(status_code=409, detail=f"هذا القانون موجود مسبقاً في قاعدة المعرفة: ({chk['t']})")
        session.run("""
            MERGE (l:Law {law_id: $lid})
            SET l.title = $title, l.year = $year, l.body = $body, l.full_text = $body, l.is_active = true, l.created_at = datetime(),
                l.gazette = $gazette, l.replaced_law = $replaced_law, l.issue_date = $issue_date, l.effective_date = $effective_date, l.subject = $subject,
                l.type = $doc_type, l.`النوع` = $doc_type, l.sub_category = $doc_type, l.document_type = $doc_type
            MERGE (lv:LawVersion {version_id: $vid}) SET lv.version_name = 'الأصلية', lv.effective_from = '2026-01-01', lv.law_id = $lid
            MERGE (l)-[:HAS_VERSION]->(lv)
            MERGE (av:ArticleVersion {version_id: $aid}) SET av.title = $title, av.text = $body, av.number = 1, av.is_active = true
            MERGE (lv)-[:HAS_ARTICLE]->(av)
        """, lid=law_id, title=title, year=year, vid=version_id, aid=art_id, body=body,
            gazette=meta.get("gazette", ""), replaced_law=meta.get("replaced_law", ""),
            issue_date=meta.get("issue_date", str(year)), effective_date=meta.get("effective_date", ""), subject=meta.get("subject", ""),
            doc_type=doc_type)
    try:
        VectorIndexService.index_law(
            law_id=law_id, title=title, version_id=version_id,
            articles=[{"version_id": art_id, "number": 1, "text": body}], paragraphs=[], items=[]
        )
    except Exception:
        pass

    # Synchronize optional multi-selected parent law relations in PostgreSQL and Neo4j
    related_laws = payload.get("related_laws") or payload.get("related_law_ids") or []
    if isinstance(related_laws, str):
        related_laws = [x.strip() for x in related_laws.split(",") if x.strip()]

    relation_type = payload.get("relation_type") or "issued_under"
    sub_category = payload.get("sub_category") or payload.get("category") or "الأنظمة"
    doc_status = payload.get("document_status") or payload.get("status") or "ساري"

    if related_laws:
        from helpers.database import SessionLocal
        from services.ai.legal_relation_service import LegalRelationService
        db = SessionLocal()
        try:
            for pid in related_laws:
                LegalRelationService.sync_relation(
                    db=db,
                    parent_law_id=pid,
                    target_document_id=law_id,
                    target_title=title,
                    relation_domain="legislative",
                    relation_type=relation_type,
                    sub_category=sub_category,
                    document_type=payload.get("document_type") or sub_category,
                    article_ref=payload.get("article_ref"),
                    effective_date=payload.get("effective_date"),
                    document_status=doc_status,
                    notes=payload.get("notes")
                )
        finally:
            db.close()

    return {"status": "success", "id": law_id, "title": title}


def create_manual_judgment(payload: Dict[str, Any]) -> Dict[str, Any]:
    ruling_id = payload.get("case_number") or f"jdg_{uuid.uuid4().hex[:8]}"
    title = payload.get("title", "حكم جديد")
    court = payload.get("court", "تمييز حقوق")
    year = int(payload.get("year") or 2026)
    principle = payload.get("principle", "")
    with neo4j_db.get_session() as session:
        chk = session.run(
            "MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $rid OR j.`معرف` = $rid OR j.title = $title OR j.`العنوان` = $title) RETURN j.title as t LIMIT 1",
            rid=ruling_id, title=title
        ).single()
        if chk:
            raise HTTPException(status_code=409, detail=f"هذا الحكم القضائي موجود مسبقاً في قاعدة المعرفة: ({chk['t']})")
        session.run(
            "MERGE (j:Judgment {ruling_id: $rid}) SET j.title = $title, j.court = $court, j.ruling_year = $year, j.full_text = $principle, j.is_active = true, j.date = '2026-01-01'",
            rid=ruling_id, title=title, court=court, year=year, principle=principle
        )
    try:
        VectorIndexService.index_judgment({
            "ruling_id": ruling_id, "case_number": ruling_id, "ruling_number": 1, "ruling_year": year,
            "court": court, "court_type": "cassation", "date": "2026-01-01", "outcome": "تأييد",
            "subject": title, "title": title, "full_text": principle
        })
    except Exception:
        pass

    # Synchronize optional multi-selected parent law citations in PostgreSQL and Neo4j
    related_laws = payload.get("related_laws") or payload.get("related_law_ids") or []
    if isinstance(related_laws, str):
        related_laws = [x.strip() for x in related_laws.split(",") if x.strip()]

    court_cat = payload.get("court_category") or court or "تمييز حقوق"
    doc_status = payload.get("document_status") or payload.get("status") or "ساري"

    if related_laws:
        from helpers.database import SessionLocal
        from services.ai.legal_relation_service import LegalRelationService
        db = SessionLocal()
        try:
            for pid in related_laws:
                LegalRelationService.sync_relation(
                    db=db,
                    parent_law_id=pid,
                    target_document_id=ruling_id,
                    target_title=title,
                    relation_domain="judicial",
                    relation_type="cites_law",
                    sub_category=court_cat,
                    document_type="حكم قضائي",
                    article_ref=payload.get("article_ref") or payload.get("dispute_item"),
                    effective_date=payload.get("effective_date") or payload.get("date"),
                    document_status=doc_status,
                    notes=payload.get("notes")
                )
        finally:
            db.close()

    return {"status": "success", "id": ruling_id, "title": title}


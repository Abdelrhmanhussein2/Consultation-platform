from typing import Dict, Any, Optional
from helpers.neo4j_db import neo4j_db
from services.ai.vector_index_service import VectorIndexService
from services.ai.legal_detail_helper import get_source_detail as _get_source_detail
from services.ai.legal_preview_helper import extract_file_preview as _extract_preview
from services.ai.legal_manual_helper import create_manual_law as _create_manual_law, create_manual_judgment as _create_manual_judgment


class LegalSourcesService:
    @classmethod
    def get_unified_sources(
        cls, source_type: str = "all", q: Optional[str] = None, court: Optional[str] = None,
        year: Optional[int] = None, is_active: Optional[bool] = None, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        query_parts, params = [], {"skip": (page - 1) * page_size, "limit": page_size}
        filter_q = f"(?i).*{q.strip()}.*" if q and q.strip() else None
        if filter_q: params["filter_q"] = filter_q
        if is_active is not None: params["is_active"] = is_active
        if year: params["year"] = int(year)

        if source_type in ("all", "law"):
            lw = []
            if is_active is not None: lw.append("coalesce(l.is_active, true) = $is_active")
            if filter_q: lw.append("(coalesce(l.title, l.`العنوان`, l.`name`, '') =~ $filter_q OR coalesce(l.law_id, l.`معرف`, '') =~ $filter_q OR coalesce(l.number, l.`رقم_القانون`, '') =~ $filter_q)")
            if court: lw.append("false")
            if year: lw.append("(l.year = $year OR l.`السنة` = $year OR toString(l.year) = toString($year))")
            query_parts.append(f"""
                MATCH (l) WHERE (l:Law OR l:`قانون`) AND {' AND '.join(lw) if lw else 'true'}
                OPTIONAL MATCH (l)-[:`يتضمن_مادة`|HAS_VERSION*1..2]->(av) WHERE av:ArticleVersion OR av:`مادة`
                WITH l, count(DISTINCT av) as arts
                RETURN 'law' as source_type, coalesce(l.law_id, l.`معرف`, 'law_unknown') as id,
                       coalesce(l.title, l.law_title, l.`العنوان`, l.`name`, l.`اسم_العرض`, 'قانون ضريبة الدخل') as title,
                       coalesce(l.number, l.law_number, l.`رقم_القانون`, '-') as number, coalesce(l.year, l.law_year, l.`السنة`, '-') as year,
                       null as court, arts as articles_count, 0 as citations_count, coalesce(l.is_active, true) as is_active,
                       coalesce(l.body, l.full_text, '') as body, coalesce(l.created_at, l.date, '2026-01-01') as date_sort,
                       coalesce(l.status, 'ساري') as status,
                       coalesce(l.type, l.`النوع`, l.doc_type, l.document_type, l.sub_category, 'قانون') as doc_type
            """)

        if source_type in ("all", "judgment"):
            jw = []
            if is_active is not None: jw.append("coalesce(j.is_active, true) = $is_active")
            if filter_q: jw.append("(coalesce(j.title, j.`العنوان`, '') =~ $filter_q OR coalesce(j.ruling_id, j.`معرف`, '') =~ $filter_q OR coalesce(j.ruling_number, j.`رقم_الحكم`, '') =~ $filter_q)")
            if court and court != "الكل": params["court"] = court; jw.append("(j.court = $court OR j.`المحكمة` = $court)")
            if year: jw.append("(j.ruling_year = $year OR j.`السنة` = $year OR toString(j.ruling_year) = toString($year))")
            query_parts.append(f"""
                MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND {' AND '.join(jw) if jw else 'true'}
                OPTIONAL MATCH (j)-[:`استند_إلى_مادة`|CITES]->(av)
                WITH j, count(DISTINCT av) as cites
                RETURN 'judgment' as source_type, coalesce(j.ruling_id, j.`معرف`, 'jdg_unknown') as id,
                       coalesce(j.title, j.`العنوان`, 'حكم قضائي') as title,
                       coalesce(j.ruling_number, j.`رقم_الحكم`, j.case_number, j.`رقم_الدعوى`, '-') as number,
                       coalesce(j.ruling_year, j.`السنة`, '-') as year, coalesce(j.court, j.`المحكمة`, 'محكمة التمييز') as court,
                       0 as articles_count, cites as citations_count, coalesce(j.is_active, true) as is_active,
                       coalesce(j.full_text, j.`نص_الحكم`, j.`مقتطف_الحكم`, '') as body, coalesce(j.date, j.`تاريخ_الفصل`, '2026-01-01') as date_sort,
                       coalesce(j.status, 'ساري') as status,
                       coalesce(j.type, j.`النوع`, j.court, j.`المحكمة`, 'تمييز حقوق') as doc_type
            """)

        if not query_parts: return {"items": [], "total": 0, "page": page, "page_size": page_size}

        union_cypher = " UNION ALL ".join(query_parts)
        full_cypher = f"CALL {{ {union_cypher} }} RETURN source_type, id, title, number, year, court, articles_count, citations_count, is_active, body, date_sort, status, doc_type ORDER BY date_sort DESC SKIP $skip LIMIT $limit"
        count_cypher = f"CALL {{ {union_cypher} }} RETURN count(*) as total"

        try:
            with neo4j_db.get_session() as session:
                count_res = session.run(count_cypher, **params)
                total = count_res.single()["total"] if count_res else 0
                records_res = session.run(full_cypher, **params)
                items = [{
                    "id": r["id"],
                    "source_type": r["source_type"],
                    "title": r["title"] or "بدون عنوان",
                    "number": str(r["number"]).split(" لسنة")[0].split("/")[0].strip() if r["number"] and r["number"] != '-' else (r["number"] or "-"),
                    "year": r["year"] or "-",
                    "court": r["court"],
                    "articles_count": r["articles_count"],
                    "citations_count": r["citations_count"],
                    "is_active": r["is_active"],
                    "body": r.get("body") or "",
                    "status": r.get("status") or "ساري",
                    "doc_type": r.get("doc_type") or ("حكم قضائي" if r["source_type"] == "judgment" else "قانون")
                } for r in records_res]
                
                # Enrich with PostgreSQL legal_document_metadata & legal_relations as single source of truth
                if items:
                    try:
                        from helpers.database import SessionLocal
                        from models.ai.legal_document_metadata import LegalDocumentMetadata
                        from models.ai.legal_relation import LegalRelation
                        with SessionLocal() as db:
                            ids = [it["id"] for it in items]
                            metas = db.query(LegalDocumentMetadata).filter(LegalDocumentMetadata.document_id.in_(ids)).all()
                            meta_map = {m.document_id: m.status for m in metas}

                            rels = db.query(LegalRelation).filter(
                                LegalRelation.target_document_id.in_(ids),
                                LegalRelation.is_active == True
                            ).all()
                            rel_type_map = {r.target_document_id: (r.sub_category or r.document_type) for r in rels if (r.sub_category or r.document_type)}

                            for it in items:
                                if it["id"] in meta_map:
                                    it["status"] = meta_map[it["id"]]
                                if it["id"] in rel_type_map and rel_type_map[it["id"]]:
                                    it["doc_type"] = rel_type_map[it["id"]]
                    except Exception as me:
                        pass
                return {"items": items, "total": total, "page": page, "page_size": page_size}
        except Exception as e:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "error": str(e)}

    @classmethod
    def get_stats(cls) -> Dict[str, int]:
        try:
            with neo4j_db.get_session() as session:
                r1 = session.run("OPTIONAL MATCH (l) WHERE l:Law OR l:`قانون` RETURN count(l) as c").single()
                r2 = session.run("OPTIONAL MATCH (j) WHERE j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي` RETURN count(j) as c").single()
                r3 = session.run("OPTIONAL MATCH (l) WHERE (l:Law OR l:`قانون`) AND coalesce(l.is_active, true) = true RETURN count(l) as c").single()
                r4 = session.run("OPTIONAL MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND coalesce(j.is_active, true) = true RETURN count(j) as c").single()
                r5 = session.run("OPTIONAL MATCH (av) WHERE av:ArticleVersion OR av:`مادة` RETURN count(av) as c").single()
                r6 = session.run("OPTIONAL MATCH (p) WHERE p:Paragraph OR p:`فقرة` RETURN count(p) as c").single()
                r7 = session.run("OPTIONAL MATCH ()-[r]->() RETURN count(r) as c").single()
                return {
                    "sources_count": (r1["c"] if r1 else 0) + (r2["c"] if r2 else 0),
                    "active_count": (r3["c"] if r3 else 0) + (r4["c"] if r4 else 0),
                    "chunks_count": (r5["c"] if r5 else 0) + (r6["c"] if r6 else 0),
                    "relations_count": r7["c"] if r7 else 0
                }
        except Exception:
            return {"sources_count": 0, "active_count": 0, "chunks_count": 0, "relations_count": 0}

    @classmethod
    def sync_core(cls) -> Dict[str, Any]:
        from helpers.neo4j_db import init_neo4j_db
        init_neo4j_db()
        stats = cls.get_stats()
        if stats.get("sources_count", 0) == 0:
            try:
                import os
                if os.path.exists("data"):
                    from scripts.run_pipeline import main as run_pipeline_main
                    run_pipeline_main()
                    stats = cls.get_stats()
            except Exception as e: print(f"Notice: Auto ingestion skipped: {e}")
        return {"status": "success", "message": "تمت مزامنة النواة المرجعية وفهارس المعرفة بنجاح", "stats": stats}

    @classmethod
    def get_source_detail(cls, source_id: str, source_type: str = "law") -> Optional[Dict[str, Any]]:
        return _get_source_detail(source_id, source_type)

    @classmethod
    def update_source(cls, source_id: str, source_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Updates title, year, number, status, court, type, and body for a law or judgment."""
        title, year = payload.get("title", ""), payload.get("year")
        raw_active = payload.get("is_active")
        is_active = True if raw_active is None else bool(raw_active)
        court, number, body = payload.get("court"), payload.get("number"), payload.get("body", "")
        raw_doc_type = payload.get("sub_category") or payload.get("doc_type") or payload.get("type") or payload.get("court_category")
        doc_type = str(raw_doc_type).strip() if raw_doc_type else None
        if doc_type:
            type_norm = {
                "الأنظمة": "نظام", "أنظمة": "نظام", "القرارات": "قرار", "قرارات": "قرار",
                "التعليمات": "تعليمات", "القوانين": "قانون", "قوانين": "قانون",
                "أحكام ملزمة": "حكم ملزم", "جداول": "جدول", "ملاحق": "ملحق"
            }
            doc_type = type_norm.get(doc_type, doc_type)

        try:
            with neo4j_db.get_session() as session:
                if source_type == "law":
                    session.run("""
                        MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $sid OR l.`معرف` = $sid)
                        SET l.title = $title, l.`العنوان` = $title, l.`name` = $title,
                            l.year = $year, l.`السنة` = $year, l.number = $number, l.`رقم_القانون` = $number,
                            l.body = $body, l.full_text = $body, l.is_active = $is_active
                        FOREACH (_ IN CASE WHEN $doc_type IS NOT NULL AND $doc_type <> '' THEN [1] ELSE [] END |
                            SET l.type = $doc_type, l.`النوع` = $doc_type, l.document_type = $doc_type, l.sub_category = $doc_type
                        )
                        WITH l
                        OPTIONAL MATCH (l)-[:HAS_VERSION|`يتضمن_مادة`|HAS_ARTICLE*0..2]->(sub)
                        SET sub.is_active = $is_active
                    """, sid=source_id, title=title, year=year, number=number, body=body, is_active=is_active, doc_type=doc_type)
                else:
                    court_type = doc_type or court
                    session.run("""
                        MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $sid OR j.`معرف` = $sid)
                        SET j.title = $title, j.`العنوان` = $title, j.court = $court, j.`المحكمة` = $court,
                            j.ruling_year = $year, j.`السنة` = $year, j.ruling_number = $number, j.`رقم_الحكم` = $number,
                            j.full_text = $body, j.`نص_الحكم` = $body, j.is_active = $is_active
                        FOREACH (_ IN CASE WHEN $court_type IS NOT NULL AND $court_type <> '' THEN [1] ELSE [] END |
                            SET j.type = $court_type, j.`النوع` = $court_type, j.document_type = 'حكم قضائي', j.court = $court_type
                        )
                    """, sid=source_id, title=title, court=court, year=year, number=number, body=body, is_active=is_active, court_type=court_type)
        except Exception:
            pass
        try: VectorIndexService.set_source_active(source_type, source_id, is_active)
        except Exception: pass
        return {"status": "success", "message": "تم تحديث بيانات المصدر القانوني بنجاح", "id": source_id, "is_active": is_active}

    @classmethod
    def toggle_source_active(cls, source_id: str, source_type: str) -> Dict[str, Any]:
        from fastapi import HTTPException
        with neo4j_db.get_session() as session:
            if source_type == "law":
                rec = session.run("""
                    MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $sid OR l.`معرف` = $sid)
                    SET l.is_active = NOT coalesce(l.is_active, true)
                    WITH l
                    OPTIONAL MATCH (l)-[:HAS_VERSION|`يتضمن_مادة`|HAS_ARTICLE*0..2]->(sub)
                    SET sub.is_active = l.is_active
                    RETURN head(collect(DISTINCT l.is_active)) as is_active
                """, sid=source_id).single()
            else:
                rec = session.run("""
                    MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $sid OR j.`معرف` = $sid)
                    SET j.is_active = NOT coalesce(j.is_active, true)
                    RETURN j.is_active as is_active
                """, sid=source_id).single()
            if not rec: raise HTTPException(status_code=404, detail="المصدر غير موجود")
            new_active = bool(rec["is_active"])
        try: VectorIndexService.set_source_active(source_type, source_id, new_active)
        except Exception: pass
        return {"status": "success", "id": source_id, "is_active": new_active}

    @classmethod
    def create_manual_law(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        return _create_manual_law(payload)

    @classmethod
    def create_manual_judgment(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        return _create_manual_judgment(payload)

    @classmethod
    def delete_law(cls, law_id: str, force: bool = False) -> Dict[str, Any]:
        with neo4j_db.get_session() as session:
            chk = session.run("MATCH (j)-[r]->(av)<-[*]-(l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $lid OR l.`معرف` = $lid) RETURN count(r) as cite_count", lid=law_id).single()
            cite_count = chk["cite_count"] if chk else 0
            if not force and cite_count > 0:
                session.run("MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $lid OR l.`معرف` = $lid) SET l.is_active = false", lid=law_id)
                VectorIndexService.set_source_active("law", law_id, False)
                return {"action": "archived", "citations_count": cite_count, "message": "تمت أرشفة القانون لوجود استشهادات بمواده"}
            session.run("MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $lid OR l.`معرف` = $lid) OPTIONAL MATCH (l)-[*1..3]->(child) DETACH DELETE child, l", lid=law_id)
            VectorIndexService.delete_law_points(law_id)
            return {"action": "deleted", "citations_count": cite_count, "message": "تم حذف القانون وشجرته بنجاح"}

    @classmethod
    def delete_judgment(cls, ruling_id: str, permanent: bool = True) -> Dict[str, Any]:
        with neo4j_db.get_session() as session:
            if permanent:
                session.run("MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $rid OR j.`معرف` = $rid) DETACH DELETE j", rid=ruling_id)
                VectorIndexService.delete_judgment_points(ruling_id)
                return {"action": "deleted", "message": "تم حذف الحكم القضائي ومتجهاته نهائياً"}
            session.run("MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $rid OR j.`معرف` = $rid) SET j.is_active = false", rid=ruling_id)
            VectorIndexService.set_source_active("judgment", ruling_id, False)
            return {"action": "deactivated", "message": "تم تعطيل الحكم واستبعاده من البحث"}

    @classmethod
    def extract_file_preview(cls, file_bytes: bytes, filename: str, source_type: str = "law") -> Dict[str, Any]:
        return _extract_preview(file_bytes, filename, source_type)

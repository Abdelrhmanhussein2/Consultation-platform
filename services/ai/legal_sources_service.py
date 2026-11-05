import json
from typing import Dict, Any, List, Optional
from helpers.neo4j_db import neo4j_db
from services.ai.vector_index_service import VectorIndexService


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
                       coalesce(l.body, l.full_text, '') as body, coalesce(l.created_at, l.date, '2026-01-01') as date_sort
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
                       coalesce(j.full_text, j.`نص_الحكم`, j.`مقتطف_الحكم`, '') as body, coalesce(j.date, j.`تاريخ_الفصل`, '2026-01-01') as date_sort
            """)

        if not query_parts: return {"items": [], "total": 0, "page": page, "page_size": page_size}

        union_cypher = " UNION ALL ".join(query_parts)
        full_cypher = f"CALL {{ {union_cypher} }} RETURN source_type, id, title, number, year, court, articles_count, citations_count, is_active, body, date_sort ORDER BY date_sort DESC SKIP $skip LIMIT $limit"
        count_cypher = f"CALL {{ {union_cypher} }} RETURN count(*) as total"

        try:
            with neo4j_db.get_session() as session:
                count_res = session.run(count_cypher, **params)
                total = count_res.single()["total"] if count_res else 0
                records_res = session.run(full_cypher, **params)
                items = [{ "id": r["id"], "source_type": r["source_type"], "title": r["title"] or "بدون عنوان", "number": str(r["number"]).split(" لسنة")[0].split("/")[0].strip() if r["number"] and r["number"] != '-' else (r["number"] or "-"), "year": r["year"] or "-", "court": r["court"], "articles_count": r["articles_count"], "citations_count": r["citations_count"], "is_active": r["is_active"], "body": r.get("body") or "" } for r in records_res]
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
    def update_source(cls, source_id: str, source_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Updates title, year, number, status, court, and body for a law or judgment."""
        title, year, is_active = payload.get("title", ""), payload.get("year"), payload.get("is_active", True)
        court, number, body = payload.get("court"), payload.get("number"), payload.get("body", "")
        with neo4j_db.get_session() as session:
            if source_type == "law":
                session.run("""
                    MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $sid OR l.`معرف` = $sid)
                    SET l.title = $title, l.`العنوان` = $title, l.`name` = $title,
                        l.year = $year, l.`السنة` = $year, l.number = $number, l.`رقم_القانون` = $number,
                        l.body = $body, l.full_text = $body, l.is_active = $is_active
                """, sid=source_id, title=title, year=year, number=number, body=body, is_active=is_active)
            else:
                session.run("""
                    MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $sid OR j.`معرف` = $sid)
                    SET j.title = $title, j.`العنوان` = $title, j.court = $court, j.`المحكمة` = $court,
                        j.ruling_year = $year, j.`السنة` = $year, j.ruling_number = $number, j.`رقم_الحكم` = $number,
                        j.full_text = $body, j.`نص_الحكم` = $body, j.is_active = $is_active
                """, sid=source_id, title=title, court=court, year=year, number=number, body=body, is_active=is_active)
        return {"status": "success", "message": "تم تحديث بيانات المصدر القانوني بنجاح", "id": source_id}

    @classmethod
    def create_manual_law(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        import uuid; from fastapi import HTTPException
        law_id = payload.get("code") or f"law_{uuid.uuid4().hex[:8]}"
        title, year, body = payload.get("title", "تشريع جديد"), int(payload.get("year") or 2026), payload.get("body", "")
        version_id, art_id = f"{law_id}_v1", f"{law_id}_v1_art1"
        with neo4j_db.get_session() as session:
            chk = session.run("MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $lid OR l.`معرف` = $lid OR l.title = $title OR l.`العنوان` = $title) RETURN l.title as t LIMIT 1", lid=law_id, title=title).single()
            if chk: raise HTTPException(status_code=409, detail=f"هذا القانون موجود مسبقاً في قاعدة المعرفة: ({chk['t']})")
            session.run("MERGE (l:Law {law_id: $lid}) SET l.title = $title, l.year = $year, l.body = $body, l.full_text = $body, l.is_active = true, l.created_at = datetime() MERGE (lv:LawVersion {version_id: $vid}) SET lv.version_name = 'الأصلية', lv.effective_from = '2026-01-01', lv.law_id = $lid MERGE (l)-[:HAS_VERSION]->(lv) MERGE (av:ArticleVersion {version_id: $aid}) SET av.title = $title, av.text = $body, av.number = 1, av.is_active = true MERGE (lv)-[:HAS_ARTICLE]->(av)", lid=law_id, title=title, year=year, vid=version_id, aid=art_id, body=body)
        try: VectorIndexService.index_law(law_id=law_id, title=title, version_id=version_id, articles=[{"version_id": art_id, "number": 1, "text": body}], paragraphs=[], items=[])
        except Exception: pass
        return {"status": "success", "id": law_id, "title": title}

    @classmethod
    def create_manual_judgment(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        import uuid; from fastapi import HTTPException
        ruling_id = payload.get("case_number") or f"jdg_{uuid.uuid4().hex[:8]}"
        title, court, year, principle = payload.get("title", "حكم جديد"), payload.get("court", "تمييز حقوق"), int(payload.get("year") or 2026), payload.get("principle", "")
        with neo4j_db.get_session() as session:
            chk = session.run("MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $rid OR j.`معرف` = $rid OR j.title = $title OR j.`العنوان` = $title) RETURN j.title as t LIMIT 1", rid=ruling_id, title=title).single()
            if chk: raise HTTPException(status_code=409, detail=f"هذا الحكم القضائي موجود مسبقاً في قاعدة المعرفة: ({chk['t']})")
            session.run("MERGE (j:Judgment {ruling_id: $rid}) SET j.title = $title, j.court = $court, j.ruling_year = $year, j.full_text = $principle, j.is_active = true, j.date = '2026-01-01'", rid=ruling_id, title=title, court=court, year=year, principle=principle)
        try: VectorIndexService.index_judgment({"ruling_id": ruling_id, "case_number": ruling_id, "ruling_number": 1, "ruling_year": year, "court": court, "court_type": "cassation", "date": "2026-01-01", "outcome": "تأييد", "subject": title, "title": title, "full_text": principle})
        except Exception: pass
        return {"status": "success", "id": ruling_id, "title": title}

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
        import re, io, zipfile, xml.etree.ElementTree as ET
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        full_text = ""
        if ext in ('docx', 'doc'):
            try:
                import docx
                d = docx.Document(io.BytesIO(file_bytes))
                parts = [p.text for p in d.paragraphs if p.text.strip()]
                for t in d.tables:
                    for row in t.rows: parts.extend([c.text.strip() for c in row.cells if c.text.strip()])
                full_text = "\n".join(parts)
            except Exception:
                try:
                    with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                        tree = ET.fromstring(z.read('word/document.xml'))
                        p_list = [''.join([n.text or '' for n in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')]).strip() for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')]
                        full_text = "\n".join([x for x in p_list if x])
                except Exception as e: full_text = f"تعذر قراءة DOCX: {e}"
        else:
            try: full_text = file_bytes.decode('utf-8', errors='ignore')
            except Exception: full_text = ""

        clean_name = re.sub(r'\.[^.]+$', '', filename).replace('_', ' ').strip()
        data = {"title": clean_name, "year": 2024, "tags": "", "full_text": full_text}
        yr_m = re.search(r'(?:لسنة|عام|سنة)[_\s]*(\d{4})', filename) or re.search(r'\b(19\d{2}|20\d{2})\b', filename) or re.search(r'(?:لسنة|عام|سنة)[_\s]*(\d{4})', full_text[:1500])
        if yr_m: data["year"] = int(yr_m.group(1))

        if source_type == "judgment":
            data["principle"] = full_text
            court = "cassation_rights"
            if "إدارية" in filename or "الإدارية العليا" in full_text[:1500]: court = "admin_supreme"
            elif "جزاء" in filename or "الجزائية" in full_text[:1500]: court = "cassation_penal"
            elif "بداية" in filename or "البداية الضريبية" in full_text[:1500]: court = "tax_first_instance"
            elif "استئناف" in filename or "الاستئناف الضريبية" in full_text[:1500]: court = "tax_appeal"
            data["court"] = court
            c_num = re.search(r'(?:رقم|الحكم رقم|قرار رقم)[_\s]*(\d+)', filename)
            data["case_number"] = f"{c_num.group(1) if c_num else '1'}/{data['year']}"
            dispute = re.findall(r'(?:المادة|مادة)[_\s]*\(?(\d+)\)?', full_text[:3000])
            data["dispute_item"] = f"المادة {sorted(list(set(dispute)), key=lambda x: int(x) if x.isdigit() else 999)[0]} - قانون ضريبة الدخل" if dispute else "مادة 3 - قانون ضريبة الدخل"
            data["tags"] = f"أحكام قضائية، {'جزاء' if 'penal' in court else 'حقوق'}، ضرائب"
        else:
            data["body"] = full_text
            c_code = re.search(r'رقم[_\s]*(\d+)', filename)
            data["code"] = f"{c_code.group(1) if c_code else '1'}/{data['year']}"
            data["tags"] = "تشريع، ضرائب، ضريبة الدخل"

        return {"status": "success", "data": data}

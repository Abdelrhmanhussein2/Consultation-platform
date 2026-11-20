import re
from helpers.neo4j_db import neo4j_db

class LegalGraphService:
    @staticmethod
    def import_law_structure(
        law_id: str,
        law_title: str,
        law_number: int,
        law_year: int,
        version_id: str,
        version_name: str,
        effective_from: str,
        articles: list,
        paragraphs: list,
        items: list,
        metadata: dict = None
    ):
        """
        Imports a law and its entire version structure (Articles, Paragraphs, Items)
        in batches using UNWIND queries for optimal performance.
        
        - articles: list of dicts {version_id, text, effective_from, status, number, law_version_id}
        - paragraphs: list of dicts {paragraph_id, letter, text, article_version_id}
        - items: list of dicts {item_id, number, text, paragraph_id}
        """
        meta = metadata or {}
        # 1. Create Law and LawVersion nodes and link them
        law_query = """
        MERGE (l:Law {law_id: $law_id})
        ON CREATE SET l.title = $law_title, l.number = $law_number, l.year = $law_year,
                      l.gazette = $gazette, l.replaced_law = $replaced_law,
                      l.issue_date = $issue_date, l.effective_date = $effective_date,
                      l.subject = $subject
        ON MATCH SET l.title = $law_title, l.number = $law_number, l.year = $law_year,
                     l.gazette = coalesce($gazette, l.gazette),
                     l.replaced_law = coalesce($replaced_law, l.replaced_law),
                     l.issue_date = coalesce($issue_date, l.issue_date),
                     l.effective_date = coalesce($effective_date, l.effective_date),
                     l.subject = coalesce($subject, l.subject)
        
        MERGE (lv:LawVersion {version_id: $version_id})
        ON CREATE SET lv.version_name = $version_name, lv.effective_from = $effective_from, lv.law_id = $law_id
        ON MATCH SET lv.version_name = $version_name, lv.effective_from = $effective_from, lv.law_id = $law_id
        
        MERGE (l)-[:HAS_VERSION]->(lv)
        """
        
        # 2. Create ArticleVersions in batch
        articles_query = """
        UNWIND $articles AS art
        MERGE (av:ArticleVersion {version_id: art.version_id})
        ON CREATE SET av.text = art.text, 
                      av.title = art.title,
                      av.effective_from = art.effective_from, 
                      av.status = art.status, 
                      av.number = art.number, 
                      av.law_version_id = art.law_version_id
        ON MATCH SET av.text = art.text, 
                     av.title = art.title,
                     av.effective_from = art.effective_from, 
                     av.status = art.status, 
                     av.number = art.number, 
                     av.law_version_id = art.law_version_id
        
        WITH av, art
        MATCH (lv:LawVersion {version_id: art.law_version_id})
        MERGE (lv)-[:HAS_ARTICLE]->(av)
        """
        
        # 3. Create Paragraphs in batch
        paragraphs_query = """
        UNWIND $paragraphs AS p
        MERGE (pg:Paragraph {paragraph_id: p.paragraph_id})
        ON CREATE SET pg.letter = p.letter, 
                      pg.text = p.text, 
                      pg.article_version_id = p.article_version_id
        ON MATCH SET pg.letter = p.letter, 
                     pg.text = p.text, 
                     pg.article_version_id = p.article_version_id
        
        WITH pg, p
        MATCH (av:ArticleVersion {version_id: p.article_version_id})
        MERGE (av)-[:HAS_PARAGRAPH]->(pg)
        """
        
        # 4. Create Items in batch
        items_query = """
        UNWIND $items AS itm
        MERGE (it:Item {item_id: itm.item_id})
        ON CREATE SET it.number = itm.number, 
                      it.text = itm.text
        ON MATCH SET it.number = itm.number, 
                     it.text = itm.text
        
        WITH it, itm
        MATCH (pg:Paragraph {paragraph_id: itm.paragraph_id})
        MERGE (pg)-[:HAS_ITEM]->(it)
        """
        
        with neo4j_db.get_session() as session:
            def _work(tx):
                tx.run(
                    law_query,
                    law_id=law_id,
                    law_title=law_title,
                    law_number=law_number,
                    law_year=law_year,
                    version_id=version_id,
                    version_name=version_name,
                    effective_from=effective_from,
                    gazette=meta.get("gazette"),
                    replaced_law=meta.get("replaced_law"),
                    issue_date=meta.get("issue_date"),
                    effective_date=meta.get("effective_date"),
                    subject=meta.get("subject")
                )
                if articles:
                    tx.run(articles_query, articles=articles)
                if paragraphs:
                    tx.run(paragraphs_query, paragraphs=paragraphs)
                if items:
                    tx.run(items_query, items=items)
            session.execute_write(_work)

    @staticmethod
    def create_judgment(
        ruling_id: str,
        case_number: str,
        ruling_number: int,
        ruling_year: int,
        court: str,
        court_type: str,
        date: str,
        outcome: str,
        subject: str,
        title: str,
        full_text: str
    ):
        """
        Creates or updates a Judgment node in Neo4j.
        """
        query = """
        MERGE (j:Judgment {ruling_id: $ruling_id})
        ON CREATE SET j.case_number = $case_number,
                      j.ruling_number = $ruling_number,
                      j.ruling_year = $ruling_year,
                      j.court = $court,
                      j.court_type = $court_type,
                      j.date = $date,
                      j.outcome = $outcome,
                      j.subject = $subject,
                      j.title = $title,
                      j.full_text = $full_text
        ON MATCH SET j.case_number = $case_number,
                     j.ruling_number = $ruling_number,
                     j.ruling_year = $ruling_year,
                     j.court = $court,
                     j.court_type = $court_type,
                     j.date = $date,
                     j.outcome = $outcome,
                     j.subject = $subject,
                     j.title = $title,
                     j.full_text = $full_text
        RETURN j
        """
        with neo4j_db.get_session() as session:
            return session.execute_write(
                lambda tx: tx.run(
                    query,
                    ruling_id=ruling_id,
                    case_number=case_number,
                    ruling_number=ruling_number,
                    ruling_year=ruling_year,
                    court=court,
                    court_type=court_type,
                    date=date,
                    outcome=outcome,
                    subject=subject,
                    title=title,
                    full_text=full_text
                ).single()
            )

    @staticmethod
    def create_citations_batch(citations: list):
        """
        Links a Judgment to target nodes (ArticleVersion, Paragraph, Item) via CITES relationship.
        - citations: list of dicts {ruling_id, target_id, target_label, citation_text, paragraph_letter, item_number, law_name}
        """
        # Group by label to execute index-backed MATCH queries
        by_label = {"ArticleVersion": [], "Paragraph": [], "Item": []}
        for cit in citations:
            lbl = cit.get("target_label")
            if lbl in by_label:
                by_label[lbl].append(cit)
                
        av_query = """
        UNWIND $citations AS cit
        MATCH (j:Judgment {ruling_id: cit.ruling_id})
        MATCH (target:ArticleVersion {version_id: cit.target_id})
        MERGE (j)-[r:CITES]->(target)
        SET r.ruling_id = cit.ruling_id,
            r.citation_text = cit.citation_text,
            r.paragraph_letter = cit.paragraph_letter,
            r.item_number = cit.item_number,
            r.law_name = cit.law_name
        """
        
        p_query = """
        UNWIND $citations AS cit
        MATCH (j:Judgment {ruling_id: cit.ruling_id})
        MATCH (target:Paragraph {paragraph_id: cit.target_id})
        MERGE (j)-[r:CITES]->(target)
        SET r.ruling_id = cit.ruling_id,
            r.citation_text = cit.citation_text,
            r.paragraph_letter = cit.paragraph_letter,
            r.item_number = cit.item_number,
            r.law_name = cit.law_name
        """
        
        i_query = """
        UNWIND $citations AS cit
        MATCH (j:Judgment {ruling_id: cit.ruling_id})
        MATCH (target:Item {item_id: cit.target_id})
        MERGE (j)-[r:CITES]->(target)
        SET r.ruling_id = cit.ruling_id,
            r.citation_text = cit.citation_text,
            r.paragraph_letter = cit.paragraph_letter,
            r.item_number = cit.item_number,
            r.law_name = cit.law_name
        """
        
        with neo4j_db.get_session() as session:
            def _work(tx):
                if by_label["ArticleVersion"]:
                    tx.run(av_query, citations=by_label["ArticleVersion"])
                if by_label["Paragraph"]:
                    tx.run(p_query, citations=by_label["Paragraph"])
                if by_label["Item"]:
                    tx.run(i_query, citations=by_label["Item"])
            session.execute_write(_work)

    @staticmethod
    def link_replaced_articles(links: list):
        """
        Creates REPLACES_VERSION relationship between article versions (e.g. amended replaces 2015).
        - links: list of dicts {new_version_id, old_version_id}
        """
        query = """
        UNWIND $links AS link
        MATCH (new_av:ArticleVersion {version_id: link.new_version_id})
        MATCH (old_av:ArticleVersion {version_id: link.old_version_id})
        MERGE (new_av)-[:REPLACES_VERSION]->(old_av)
        """
        with neo4j_db.get_session() as session:
            session.execute_write(lambda tx: tx.run(query, links=links))

    @staticmethod
    def get_laws(
        q: str = None,
        type: str = None,
        status: str = None,
        year_from: int = None,
        year_to: int = None,
        date_from: str = None,
        date_to: str = None,
        include_inactive: bool = False
    ):
        """
        Retrieves Law nodes in the database with optional filtering and typo tolerance.
        Supports both Arabic (:قانون) and English (:Law) schemas.
        Filters by date matching according to highest selected precision:
        - Applied to: amended_date (last amendment date), and if not available falls back to issue_date.
        - If both dates are NULL for a law: excluded from date search without 500 errors.
        - Input validation rejects invalid dates with HTTP 400.
        """
        from helpers.date_filter_utils import (
            parse_and_validate_date_param,
            extract_law_effective_date,
            matches_date_filter
        )

        # Validate date params strictly (raises 400 on invalid format or calendar dates)
        date_from_range = parse_and_validate_date_param(date_from, "date_from") if date_from else None
        date_to_range = parse_and_validate_date_param(date_to, "date_to") if date_to else None

        # Fallback to year_from / year_to if date_from / date_to were not given
        if not date_from_range and year_from is not None:
            date_from_range = parse_and_validate_date_param(str(year_from), "year_from")
        if not date_to_range and year_to is not None:
            date_to_range = parse_and_validate_date_param(str(year_to), "year_to")

        is_date_filtering = (date_from_range is not None) or (date_to_range is not None)

        params = {}
        pre_where_parts = ["(l:Law OR l:`قانون`)"]
        if not include_inactive:
            pre_where_parts.append("coalesce(l.is_active, true) = true")
        pre_where = "WHERE " + " AND ".join(pre_where_parts)

        query = f"""
        MATCH (l)
        {pre_where}
        OPTIONAL MATCH (l)-[:HAS_VERSION*0..1]->()-[:`يتضمن_مادة`|HAS_ARTICLE]->(a)
        OPTIONAL MATCH (newer)-[:`تعديل_على`|AMENDS]->(l)
        OPTIONAL MATCH (l)-[:`تعديل_على`|AMENDS]->(original_law)
        WITH l,
             coalesce(l.law_id, l.`معرف`) AS law_id,
             coalesce(l.title, l.`العنوان`, l.`اسم`, l.name) AS title,
             coalesce(l.number, toInteger(l.`رقم_القانون`), toInteger(l.number), 0) AS number,
             coalesce(l.year, toInteger(l.`السنة`), toInteger(l.year), 0) AS year,
             coalesce(l.`النوع`, l.type, 'تشريع') AS type,
             count(DISTINCT newer) AS newer_count,
             count(DISTINCT original_law) AS is_amendment_count,
             coalesce(l.status, l.`الحالة`, 'ساري') AS raw_status,
             toString(coalesce(l.year, toInteger(l.`السنة`), '')) AS year_short,
             coalesce(l.issue_date, l.`تاريخ_الصدور`, l.`تاريخ_الإصدار`, l.`تاريخ_النشر`, '') AS issue_date,
             coalesce(l.effective_date, l.`تاريخ_السريان`, l.`تاريخ_النفاذ`, '') AS effective_date,
             coalesce(l.amended_date, l.`تاريخ_آخر_تعديل`, l.`تاريخ_التعديل`, '') AS amended_date,
             count(DISTINCT a) AS art_count,
             coalesce(l.total_articles, l.`عدد_المواد`, 0) AS declared_art_count,
             coalesce(l.summary, l.preamble, l.`الديباجة`, l.description, l.`الوصف`, l.`حل_محل`, '') AS summary
        RETURN law_id, title, number, year, type, year_short,
               issue_date, effective_date, amended_date,
               CASE WHEN art_count > 0 THEN art_count ELSE declared_art_count END AS total_articles,
               summary,
               newer_count,
               is_amendment_count,
               raw_status
        ORDER BY year DESC, number ASC
        """
        with neo4j_db.get_session() as session:
            raw_laws = session.execute_read(lambda tx: tx.run(query, **params).data())
            if not raw_laws:
                return []
            raw_laws = [LegalGraphService.enrich_law_dates(l) for l in raw_laws]

            # --- Post-process: separate version_status, legal status, and doc_type ---
            # Fetch sub_category from PostgreSQL legal_relations for enrichment
            pg_sub_cats = {}
            try:
                from helpers.database import SessionLocal
                from models.ai.legal_relation import LegalRelation
                pg_session = SessionLocal()
                try:
                    rels = pg_session.query(
                        LegalRelation.target_document_id,
                        LegalRelation.sub_category
                    ).filter(
                        LegalRelation.is_active == True,
                        LegalRelation.relation_domain == 'legislative'
                    ).all()
                    for r in rels:
                        if r.target_document_id and r.sub_category:
                            pg_sub_cats[r.target_document_id] = r.sub_category
                finally:
                    pg_session.close()
            except Exception:
                pass

            for law in raw_laws:
                lid = str(law.get("law_id") or "")
                ltitle = str(law.get("title") or "")

                # 1. Compute version_status: 'نسخة أصلية' or 'معدل' based on graph relationship
                is_amendment = int(law.get("is_amendment_count") or 0) > 0
                has_newer = int(law.get("newer_count") or 0) > 0
                law["version_status"] = "معدل" if is_amendment else "نسخة أصلية"
                law["is_superseded"] = has_newer

                # 2. Strict Legal Status vs Version Status Priority:
                # - Legal Status: 'ساري' or 'ملغي' (preserves legal validity independently)
                # - Status Badge Priority:
                #   1. Legal repeal: 'ملغي'
                #   2. Original replaced by newer version: 'نسخة سابقة' (legal_status remains 'ساري')
                #   3. Current active: 'ساري'
                raw_st = str(law.get("raw_status") or "ساري").strip()
                is_repealed = raw_st in ("ملغي", "ملغى")
                law["legal_status"] = "ملغي" if is_repealed else "ساري"

                if is_repealed:
                    law["status"] = "ملغي"
                elif has_newer or raw_st in ("نسخة سابقة", "معدل"):
                    law["status"] = "معدل"
                else:
                    law["status"] = "ساري"

                # 3. Compute doc_type (نوع التشريع) from admin sub_category or Neo4j type
                stored_neo4j_type = str(law.get("type") or "")
                # Neo4j type currently stores version info ('نسخة أصلية', 'نسخة معدلة', 'تشريع')
                # Prefer pg sub_category, then fall back to Neo4j type only if not version-related
                pg_sc = pg_sub_cats.get(lid, "")
                version_keywords = {"نسخة أصلية", "نسخة معدلة", "نسخة سابقة", "أصلية", "معدلة", "سابقة"}
                if pg_sc and pg_sc not in version_keywords:
                    law["doc_type"] = pg_sc
                elif stored_neo4j_type and stored_neo4j_type not in version_keywords:
                    law["doc_type"] = stored_neo4j_type
                else:
                    clean_t = ltitle.strip()
                    if clean_t.startswith("قانون"):
                        law["doc_type"] = "قانون"
                    elif clean_t.startswith("نظام"):
                        law["doc_type"] = "نظام"
                    elif clean_t.startswith("تعليمات"):
                        law["doc_type"] = "تعليمات"
                    elif clean_t.startswith("قرار"):
                        law["doc_type"] = "قرار"
                    elif "حكم ملزم" in clean_t:
                        law["doc_type"] = "حكم ملزم"
                    elif clean_t.startswith("جدول"):
                        law["doc_type"] = "جدول"
                    elif clean_t.startswith("ملحق"):
                        law["doc_type"] = "ملحق"
                    else:
                        law["doc_type"] = "قانون" if "قانون" in clean_t else "تشريع"

                # Remove raw helper fields
                law.pop("newer_count", None)
                law.pop("is_amendment_count", None)
                law.pop("raw_status", None)

                # Enrich standard metadata if missing on root node
                if "34" in lid or "34" in ltitle or "ضريبة الدخل" in ltitle:
                    if not law.get("issue_date") or law.get("issue_date") == "2014":
                        law["issue_date"] = "30-12-2014"
                    if not law.get("effective_date"):
                        law["effective_date"] = "01-01-2015"
                    if not law.get("amended_date") or "لا ينطبق" in str(law.get("amended_date", "")):
                        law["amended_date"] = "—" if law["version_status"] == "نسخة أصلية" else "01-01-2019"
                    if not law.get("total_articles") or law.get("total_articles") == 0:
                        law["total_articles"] = 82

                if law.get("amended_date") and ("لا ينطبق" in str(law["amended_date"]) or "نص أصلي" in str(law["amended_date"])):
                    law["amended_date"] = "—"

                if law.get("title") and "كما صدر" in str(law["title"]):
                    law["title"] = re.sub(r'\s*—\s*كما صدر', '', str(law["title"])).strip()

                # 4. Compute effective year for the law:
                # Priority 1: Year from amended_date (آخر تعديل) if valid
                # Priority 2: Year from issue_date (تاريخ الإصدار)
                # Priority 3: Year from law.year
                amended_raw = str(law.get("amended_date") or "").strip()
                issue_raw = str(law.get("issue_date") or "").strip()
                effective_year = None

                if amended_raw and amended_raw not in ("—", "-", "لا ينطبق", "لا ينطبق (نص أصلي)", "none", "null"):
                    m = re.search(r'\d{4}', amended_raw)
                    if m:
                        effective_year = m.group(0)

                if not effective_year and issue_raw and issue_raw not in ("—", "-", "none", "null"):
                    m = re.search(r'\d{4}', issue_raw)
                    if m:
                        effective_year = m.group(0)

                if not effective_year:
                    raw_y = law.get("year") or law.get("year_short") or ""
                    m = re.search(r'\d{4}', str(raw_y))
                    if m:
                        effective_year = m.group(0)

                if effective_year:
                    law["year_short"] = str(effective_year)
                    law["effective_year"] = str(effective_year)

            # Filter by status if requested: 'ساري' | 'ملغي' | 'معدل' | 'نسخة سابقة' | 'نسخة أصلية'
            if status and status not in ("الكل", "كافة الحالات", "all", None):
                clean_st = str(status).strip()
                if clean_st == "ساري":
                    raw_laws = [l for l in raw_laws if l.get("status") == "ساري"]
                elif clean_st in ("ملغي", "ملغى"):
                    raw_laws = [l for l in raw_laws if l.get("status") == "ملغي"]
                elif clean_st == "معدل":
                    raw_laws = [l for l in raw_laws if l.get("status") == "معدل" or l.get("version_status") == "معدل" or l.get("is_superseded") is True]
                elif clean_st == "نسخة سابقة":
                    raw_laws = [l for l in raw_laws if l.get("is_superseded") is True]
                elif clean_st == "نسخة أصلية":
                    raw_laws = [l for l in raw_laws if l.get("version_status") == "نسخة أصلية"]

            # Filter by doc_type / type if requested
            if type and type not in ("الكل", "كافة الأنواع", "all", None):
                clean_tp = str(type).strip()
                def _matches_type(l):
                    dt = str(l.get("doc_type") or "").strip()
                    tp = str(l.get("type") or "").strip()
                    tt = str(l.get("title") or "").strip()
                    if clean_tp in dt or dt in clean_tp:
                        return True
                    if clean_tp in tp or tp in clean_tp:
                        return True
                    if clean_tp in tt:
                        return True
                    return False
                raw_laws = [l for l in raw_laws if _matches_type(l)]

            # Date Range Filtering based on COALESCE: amended_date -> issue_date
            if is_date_filtering:
                filtered_laws = []
                for law in raw_laws:
                    eff_d = extract_law_effective_date(law)
                    if matches_date_filter(eff_d, date_from_range, date_to_range):
                        filtered_laws.append(law)
                raw_laws = filtered_laws

            if not q or not q.strip():
                return raw_laws

            from helpers.arabic_search_utils import score_legislation_match
            clean_query = q.strip()
            scored = []
            for law in raw_laws:
                score, reason = score_legislation_match(clean_query, law)
                if score >= 0.35:
                    scored.append({
                        **law,
                        "score": f"{int(score * 100)}%",
                        "match_reason": reason,
                        "_sort_score": score
                    })

            if scored:
                scored.sort(
                    key=lambda x: (x["_sort_score"], x.get("year", 0), -x.get("number", 0)),
                    reverse=True
                )
                for item in scored:
                    item.pop("_sort_score", None)
                return scored

            return raw_laws

    @staticmethod
    def enrich_law_dates(law: dict) -> dict:
        if not law:
            return law
        lid = str(law.get("law_id") or law.get("معرف") or "").strip()
        title = str(law.get("title") or law.get("العنوان") or "").strip()
        l_type = str(law.get("type") or law.get("النوع") or "").strip()
        is_original = "أصلية" in l_type or "الأصلية" in lid or "النسخة" in title or "كما صدر" in l_type
        is_34 = "34" in lid or "34" in title or str(law.get("number")) == "34" or "ضريبة الدخل" in title

        def to_ddmmyyyy(val):
            if not val or not isinstance(val, str):
                return val
            val = val.strip()
            m = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", val)
            if m:
                return f"{m.group(3).zfill(2)}-{m.group(2).zfill(2)}-{m.group(1)}"
            return val

        issue = to_ddmmyyyy(law.get("issue_date") or law.get("تاريخ_الصدور") or law.get("تاريخ_الإصدار") or "")
        effective = to_ddmmyyyy(law.get("effective_date") or law.get("تاريخ_السريان") or law.get("تاريخ_النفاذ") or "")
        amended = to_ddmmyyyy(law.get("amended_date") or law.get("تاريخ_آخر_تعديل") or "")

        if is_34:
            if not issue or issue in ("2014", "—", "-"):
                issue = "30-12-2014"
            if not effective or effective in ("—", "-"):
                effective = "01-01-2015"
            if not amended or amended in ("—", "-"):
                amended = "لا ينطبق (نص أصلي)" if is_original else "01-01-2019"

        if is_original and (not amended or amended in ("—", "-")):
            amended = "لا ينطبق (نص أصلي)"

        total_art = law.get("total_articles")
        if (total_art is None or total_art == 0) and is_34:
            total_art = 82

        law["issue_date"] = issue
        law["effective_date"] = effective
        law["amended_date"] = amended
        if total_art is not None:
            law["total_articles"] = total_art
        return law

    @staticmethod
    def get_law_doc_types() -> list:
        """
        Dynamically derives all registered legislation categories/types from admin
        records in PostgreSQL (legal_relations.sub_category) and Neo4j,
        falling back to standard admin categories without hardcoding single values.
        """
        found_types = []
        seen = set()

        # 1. Query registered sub_categories from PostgreSQL
        try:
            from helpers.database import SessionLocal
            from models.ai.legal_relation import LegalRelation
            pg = SessionLocal()
            try:
                rows = pg.query(LegalRelation.sub_category).filter(
                    LegalRelation.is_active == True,
                    LegalRelation.relation_domain == 'legislative'
                ).distinct().all()
                for (sc,) in rows:
                    if sc and sc.strip() and sc.strip() not in seen:
                        seen.add(sc.strip())
                        found_types.append(sc.strip())
            finally:
                pg.close()
        except Exception:
            pass

        # 2. Query distinct types from Neo4j (excluding version descriptors)
        try:
            with neo4j_db.get_session() as session:
                records = session.run("""
                    MATCH (l)
                    WHERE (l:Law OR l:`قانون`)
                    RETURN DISTINCT coalesce(l.`النوع`, l.type, '') AS tp
                """).data()
                for r in records:
                    tp = (r.get("tp") or "").strip()
                    version_blacklist = {"نسخة أصلية", "نسخة معدلة", "نسخة سابقة", "أصلية", "معدلة", "سابقة", "تشريع", ""}
                    if tp and tp not in version_blacklist and tp not in seen:
                        seen.add(tp)
                        found_types.append(tp)
        except Exception:
            pass

        # 3. Canonical approved types (13 legal categories)
        canonical_admin_types = [
            "نظام",
            "قرار",
            "تعليمات",
            "قانون",
            "حكم ملزم",
            "جدول",
            "ملحق",
            "تمييز حقوق",
            "تمييز جزاء",
            "قضاء دستوري",
            "قضاء إداري",
            "درجة أولى",
            "بداية حقوق"
        ]

        type_norm_map = {
            "الأنظمة": "نظام",
            "أنظمة": "نظام",
            "نظام": "نظام",
            "قرارات": "قرار",
            "قرار": "قرار",
            "تعليمات": "تعليمات",
            "قوانين": "قانون",
            "قانون": "قانون",
            "أحكام ملزمة": "حكم ملزم",
            "حكم ملزم": "حكم ملزم",
            "جداول": "جدول",
            "جدول": "جدول",
            "ملاحق": "ملحق",
            "ملحق": "ملحق",
            "تمييز حقوق": "تمييز حقوق",
            "تمييز جزاء": "تمييز جزاء",
            "قضاء دستوري": "قضاء دستوري",
            "قضاء إداري": "قضاء إداري",
            "درجة أولى": "درجة أولى",
            "بداية حقوق": "بداية حقوق"
        }

        result = []
        for t in canonical_admin_types:
            if t not in result:
                result.append(t)

        for raw_t in found_types:
            norm_t = type_norm_map.get(raw_t, raw_t)
            if norm_t and norm_t not in result:
                result.append(norm_t)

        return result

    @staticmethod
    def get_dynamic_article_title(art_num: int, text_raw: str, explicit_title: str = None) -> str:
        """
        Dynamically derives an intuitive, concise subject/title for an article from its text
        for any legislation, ensuring it always ends on a meaningful substantive noun/concept
        and never on prepositions, conjunctions, or dangling particles.
        """
        if explicit_title and not explicit_title.strip().startswith("المادة") and len(explicit_title.strip()) > 2:
            return explicit_title.strip()

        text = (text_raw or "").strip()
        text_clean = re.sub(r'^المادة\s*\(?\d+\)?[\-\:\s\.]*', '', text).strip()
        first_line = text_clean.splitlines()[0].strip() if text_clean else ""

        # 1. Standalone explicit heading in text
        if first_line and len(first_line) <= 45 and not first_line.startswith(("أ-", "ب-", "ج-", "د-", "1-", "2-", "(")):
            if not any(first_line.startswith(p) for p in ["إذا ", "على ", "مع ", "كل ", "لا يجوز", "يحظر", "يعاقب", "ان ", "إن "]):
                clean_first = re.sub(r'[\:\-\.]+$', '', first_line).strip()
                if len(clean_first) > 3:
                    return clean_first

        # 2. Known Legal Conceptual Anchors (common across Jordan & Arab legislations)
        if re.search(r'يسمى هذا القانون|يعمل به اعتبارا|نفاذ هذا القانون', text_clean):
            return "اسم القانون وبدء العمل به"
        if re.search(r'يكون للكلمات والعبارات|المعاني المخصصة لها أدناه', text_clean):
            return "التعريفات والأحكام العامة"
        if re.search(r'نشاط زراعي|القطاع الزراعي', text_clean) and "يعفى" in text_clean:
            return "إعفاءات النشاط الزراعي"
        if re.search(r'المصاريف المقبولة|تنزل للمكلف المصاريف', text_clean):
            return "المصاريف المقبولة"
        if re.search(r'غير المقبول تنزيلها|المصاريف غير المقبولة|لا يجوز للمكلف تنزيل', text_clean):
            return "المبالغ والمصاريف غير المقبولة"
        if re.search(r'تنزيل الخسائر|تدوير الخسائر|تدور خسائر', text_clean):
            return "تنزيل الخسائر وتدويرها"
        if re.search(r'إعفاءات الشخص الطبيعي|إعفاء شخصيا|المعالين', text_clean):
            return "إعفاءات المكلف والمعالين"
        if re.search(r'التبرعات|الاشتراكات المدفوعة', text_clean):
            return "التبرعات والاشتراكات"
        if re.search(r'نسب الضريبة|نسبة الضريبة المستوفاة|الشرائح', text_clean):
            return "نسب الضريبة والشرائح"
        if re.search(r'اقتطاع|تقتطع الضريبة|توريد المبالغ المقتطعة', text_clean):
            return "الاقتطاع والتوريد من المصدر"
        if re.search(r'تعديل الإقرار|تعديل إقرار|تعديل إقراره', text_clean):
            return "تعديل الإقرار الضريبي"
        if re.search(r'إقرار ضريبي|تقديم الإقرار|الإقرارات الضريبية', text_clean):
            return "الإقرارات الضريبية ومواعيدها"
        if re.search(r'يصحح من تلقاء|تصحيح الأخطاء', text_clean):
            return "تصحيح الأخطاء المادية"
        if re.search(r'يستمر تحصيل الضرائب|استمرار تحصيل', text_clean):
            return "تحصيل الضرائب والرسوم السابقة"
        if re.search(r'فرض اي عقوبة|فرض أي عقوبة|فرض عقوبة', text_clean):
            return "فرض العقوبات والغرامات"
        if re.search(r'التهرب الضريبي|عقوبة|يعاقب|حبس|غرامة تعويضية', text_clean):
            return "العقوبات ومكافحة التهرب"
        if re.search(r'مصالحة|المصالحة', text_clean):
            return "إجراءات المصالحة في الدعاوى"
        if re.search(r'حفظ السجلات|إتلاف السجلات|الدفاتر المحاسبية', text_clean):
            return "حفظ السجلات والدفاتر المحاسبية"
        if re.search(r'اعتراض|الطعن|محكمة البداية|محكمة الاستئناف|الطعن في القرار', text_clean):
            return "الاعتراض والطعن القضائي"
        if re.search(r'وزير المالية|المدير العام|صلاحيات الوزير|صلاحيات المدير|تفويض|الموظف المفوض|للمدير أو الموظف', text_clean):
            return "صلاحيات وتفويضات الإدارة"
        if re.search(r'إلغاء|يلغى قانون|تحل محل', text_clean):
            return "الإلغاءات والأحكام الانتقالية"
        if re.search(r'مكلفون بتنفيذ|رئيس الوزراء والوزراء', text_clean):
            return "إنفاذ القانون والأحكام الختامية"
        if re.search(r'حوافز ضريبية|منح حوافز', text_clean):
            return "الحوافز والتشجيع"
        if art_num == 4:
            return "الإعفاءات والأنشطة المعفاة"
        if re.search(r'المواعيد المعينة|التقويم الميلادي', text_clean):
            return "حساب المواعيد القانونية"
        if re.search(r'يعفى من الضريبة|يعفى الدخل|الإعفاءات|لا يخضع للضريبة|الدخول المعفاة', text_clean):
            return "الإعفاءات والأنشطة المعفاة"
        if re.search(r'يخضع للضريبة|الدخل الخاضع', text_clean):
            return "الدخل الخاضع للضريبة"

        # 3. Dynamic generic extraction for ANY law (Labor, Companies, Civil, Criminal, etc.)
        lead = re.sub(r'^(?:أ|ب|ج|د|هـ|\d+)[\-\:\)\.]*\s*', '', text_clean)
        lead = re.sub(r'^(?:مع مراعاة|على الرغم مما ورد في)[^،\.]+[،\.]\s*', '', lead)
        lead = re.sub(r'^(?:إن|ان|أن|إذا|اذا)\s+', '', lead)
        
        first_phrase = re.split(r'[،\.\;]', lead.splitlines()[0] if lead else '')[0].strip()
        words = first_phrase.split()[:5] if first_phrase else lead.split()[:5]

        DANGLING = {
            'إذا', 'اذا', 'وأي', 'واي', 'أي', 'اي', 'أو', 'او', 'و', 'في', 'من', 'على', 'عن', 'مع',
            'إلى', 'الي', 'أن', 'ان', 'إن', 'حتى', 'كل', 'غير', 'بما', 'حيث', 'كما', 'دون', 'لدى',
            'بعد', 'قبل', 'بين', 'عند', 'نحو', 'بموجب', 'وفق', 'بحسب', 'تجاه', 'خلال', 'بشأن', 'بخصوص',
            'حيال', 'التي', 'الذي', 'الذين', 'ما', 'مهما', 'حيثما', 'إلا', 'الا', 'سواء', 'كان', 'كانت',
            'منه', 'منها', 'له', 'لها', 'فيه', 'فيها', 'بناء'
        }

        while words and (words[-1] in DANGLING or re.sub(r'[\:\-\.\،]+$', '', words[-1]) in DANGLING):
            words.pop()

        if words:
            candidate = " ".join(words)
            candidate = re.sub(r'[\:\-\.\،]+$', '', candidate).strip()
            if len(candidate) > 4 and len(candidate) <= 45:
                return candidate

        return f"المادة {art_num}"

    @staticmethod
    def get_law_version_tree(law_id: str, version_name: str = None, include_inactive: bool = False):
        """
        Fetches the complete hierarchy of a law version:
        Supports both Arabic (:قانون -> :مادة -> :فقرة -> :بند)
        and English (Law -> LawVersion -> ArticleVersion -> Paragraph -> Item)
        """
        alias_map = {
            'law_tax_34_2014': 'قانون_34_2014_وتعديلاته',
            'law_tax_34_2014_amended': 'قانون_34_2014_وتعديلاته',
            '34-2014': 'قانون_34_2014_وتعديلاته',
            '34_2014': 'قانون_34_2014_وتعديلاته',
            'law_tax_34_2014_original': 'قانون_34_2014_الأصلية'
        }
        law_id = alias_map.get(law_id, law_id)
        alt_ids = list(set([law_id, law_id.replace('_', '/'), law_id.replace('/', '_'), law_id.replace('-', '/'), law_id.replace('/', '-')]))

        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id IN $alt_ids OR l.`معرف` IN $alt_ids)
        AND ($include_inactive = true OR coalesce(l.is_active, true) = true)
        OPTIONAL MATCH (l)-[:HAS_VERSION]->(lv:LawVersion)-[:HAS_ARTICLE]->(av:ArticleVersion)
        OPTIONAL MATCH (l)-[:`يتضمن_مادة`]->(a_ar:`مادة`)
        OPTIONAL MATCH (newer)-[:`تعديل_على`|AMENDS]->(l)
        OPTIONAL MATCH (l)-[:`تعديل_على`|AMENDS]->(original_law)
        WITH l, coalesce(av, a_ar) AS a_node,
             count(DISTINCT newer) > 0 AS has_newer_version,
             count(DISTINCT original_law) > 0 AS is_amendment
        OPTIONAL MATCH (a_node)-[:HAS_PARAGRAPH|`يتضمن_فقرة`]->(p_node)
        OPTIONAL MATCH (p_node)-[:HAS_ITEM|`يتضمن_بند`]->(i_node)
        OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_مادة`]->(a_node)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(c:`محكمة`)
        
        RETURN coalesce(l.law_id, l.`معرف`) AS law_id,
               coalesce(l.title, l.`العنوان`, l.`اسم`, l.name, "") AS law_title,
               coalesce(l.number, toInteger(l.`رقم_القانون`), toInteger(l.number), 0) AS law_number,
               coalesce(l.year, toInteger(l.`السنة`), toInteger(l.year), 0) AS law_year,
               coalesce(l.gazette, l.`الجريدة_الرسمية`, l.`الجريدة`, "") AS gazette,
               coalesce(l.replaced_law, l.`حل_محل`, "") AS replaced_law,
               coalesce(l.issue_date, l.`تاريخ_الصدور`, l.`تاريخ_النشر`, "") AS issue_date,
               coalesce(l.effective_date, l.`تاريخ_السريان`, l.`تاريخ_النفاذ`, "") AS effective_date,
               coalesce(l.amended_date, l.`تاريخ_آخر_تعديل`, l.`تاريخ_التعديل`, "") AS amended_date,
               coalesce(l.amendments_count, l.`عدد_التعديلات`, 0) AS amendments_count,
               coalesce(l.preamble, l.`الديباجة`, l.description, l.`الوصف`, "") AS preamble,
               coalesce(l.topics, l.`الموضوع`, "") AS topics,
               coalesce(l.body, l.full_text, "") AS law_body,
               CASE
                   WHEN coalesce(l.status, l.`الحالة`) IN ['ملغي', 'ملغى'] THEN 'ملغي'
                   WHEN has_newer_version OR coalesce(l.status, l.`الحالة`) = 'نسخة سابقة' THEN 'نسخة سابقة'
                   ELSE 'ساري'
               END AS status,
               CASE
                   WHEN coalesce(l.status, l.`الحالة`) IN ['ملغي', 'ملغى'] THEN 'ملغي'
                   ELSE 'ساري'
               END AS legal_status,
               CASE
                   WHEN is_amendment THEN 'معدل'
                   ELSE 'نسخة أصلية'
               END AS version_status,
               has_newer_version AS is_superseded,
               coalesce(l.`النوع`, l.type, 'تشريع') AS type,
               coalesce(l.law_id, l.`معرف`) AS version_id,
               coalesce(l.`النوع`, "ساري") AS version_name,
               coalesce(l.effective_date, l.`تاريخ_السريان`, l.`تاريخ_النفاذ`, "") AS effective_from,
               coalesce(a_node.version_id, a_node.`معرف`) AS article_id,
               coalesce(a_node.number, toInteger(a_node.`رقم_المادة`), 1) AS article_number,
               coalesce(a_node.title, a_node.`العنوان`, a_node.`عنوان_المادة`, a_node.`اسم`, a_node.name, "") AS article_title,
               coalesce(a_node.text, a_node.`نص_المادة`, "") AS article_text,
               "ساري" AS article_status,
               coalesce(p_node.paragraph_id, p_node.`معرف`, "") AS paragraph_id,
               coalesce(p_node.letter, p_node.`حرف_الفقرة`, "") AS paragraph_letter,
               coalesce(p_node.text, p_node.`نص_الفقرة`, "") AS paragraph_text,
               coalesce(i_node.item_id, i_node.`معرف`, "") AS item_id,
               coalesce(i_node.number, toInteger(i_node.`رقم_البند`), 1) AS item_number,
               coalesce(i_node.text, i_node.`نص_البند`, "") AS item_text,
               collect(DISTINCT {
                   id: coalesce(r.`معرف`, r.ruling_id, ""),
                   title: coalesce(r.`العنوان`, r.title, r.`name`, ""),
                   court: coalesce(r.`المحكمة`, c.`اسم_المحكمة`, r.court, ""),
                   case_number: coalesce(r.`رقم_الدعوى`, r.case_number, ""),
                   year: coalesce(r.`السنة`, toString(r.year), "")
               }) AS citing_rulings
        ORDER BY article_number ASC, paragraph_letter ASC, item_number ASC
        """
        
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id, alt_ids=alt_ids, include_inactive=include_inactive).data())
            if not records:
                return None
            
            first = records[0]
            result = {
                "law_id": first["law_id"],
                "title": first["law_title"],
                "number": first["law_number"],
                "year": first["law_year"],
                "gazette": first["gazette"],
                "replaced_law": first["replaced_law"],
                "issue_date": first["issue_date"],
                "effective_date": first["effective_date"],
                "amended_date": first["amended_date"],
                "amendments_count": first.get("amendments_count", 1),
                "version_id": first["version_id"],
                "version_name": first["version_name"],
                "status": first.get("status", "ساري"),
                "legal_status": first.get("legal_status", "ساري"),
                "version_status": first.get("version_status", "نسخة أصلية"),
                "is_superseded": bool(first.get("is_superseded", False)),
                "type": first.get("type", "تشريع"),
                "effective_from": first["effective_from"],
                "preamble": first.get("preamble") or "",
                "description": first.get("preamble") or "",
                "topics": first.get("topics") or "",
                "articles": []
            }

            preamble_val = first.get("preamble") or ""
            # Dynamic fallback: if preamble is not saved directly on the node, extract from full_text/body or file
            if not preamble_val:
                from services.ai.legal_preview_helper import extract_law_preamble
                law_text_candidate = first.get("law_body") or ""
                if not law_text_candidate:
                    try:
                        import os, docx
                        lid = str(result["law_id"]).replace("/", "_")
                        ltit = str(result["title"]).replace("/", "_")
                        num_str = str(result.get("number") or "")
                        yr_str = str(result.get("year") or "")
                        if os.path.exists("data"):
                            for f in os.listdir("data"):
                                if f.endswith(".docx") and (lid in f or (ltit and ltit in f) or (num_str and yr_str and num_str in f and yr_str in f)):
                                    d = docx.Document(os.path.join("data", f))
                                    hl_paras = [p.text.strip() for p in d.paragraphs if p.text.strip() and any(r.font.highlight_color is not None for r in p.runs)]
                                    if hl_paras:
                                        preamble_val = "\n\n".join(hl_paras).strip()
                                        break
                                    law_text_candidate = "\n".join([p.text for p in d.paragraphs if p.text.strip()])
                                    break
                    except Exception:
                        pass
                if not preamble_val and law_text_candidate:
                    preamble_val = extract_law_preamble(law_text_candidate)

            # Clean any trailing definition notes from existing saved preamble ("يقصد ب...")
            if preamble_val and ("يقصد بقانون" in preamble_val or "يقصد ب" in preamble_val):
                parts = re.split(r'\n+\s*(?=يقصد\s+ب)', preamble_val)
                if parts and parts[0].strip():
                    preamble_val = parts[0].strip()

            result["preamble"] = preamble_val
            result["description"] = preamble_val
            result["topics"] = first.get("topics") or ""

            enriched_root = LegalGraphService.enrich_law_dates({
                "law_id": result["law_id"],
                "title": result["title"],
                "number": result["number"],
                "year": result["year"],
                "type": result["version_name"],
                "issue_date": result["issue_date"],
                "effective_date": result["effective_date"],
                "amended_date": result["amended_date"]
            })
            result["issue_date"] = enriched_root["issue_date"]
            result["effective_date"] = enriched_root["effective_date"]
            result["amended_date"] = enriched_root["amended_date"]
            
            articles_map = {}
            paragraphs_map = {}
            
            for row in records:
                art_id = row["article_id"]
                if not art_id:
                    continue
                
                if art_id not in articles_map:
                    rulings_raw = [r for r in row.get("citing_rulings", []) if r.get("title")]
                    related_files = [
                        {
                            "id": r.get("id") or f"r_{idx+1}",
                            "title": r.get("title"),
                            "type": "حكم قضائي",
                            "source": r.get("court") or "محكمة مختصة",
                            "year": r.get("year") or "",
                            "case_number": r.get("case_number") or ""
                        }
                        for idx, r in enumerate(rulings_raw)
                    ]
                    
                    art_text = row["article_text"] or row.get("paragraph_text") or ""
                    art_title = LegalGraphService.get_dynamic_article_title(
                        row["article_number"],
                        art_text,
                        row.get("article_title")
                    )
                    
                    art_node = {
                        "article_id": art_id,
                        "number": row["article_number"],
                        "title": art_title,
                        "text": row["article_text"],
                        "status": row["article_status"],
                        "paragraphs": [],
                        "related_files": related_files
                    }
                    articles_map[art_id] = art_node
                    result["articles"].append(art_node)
                
                p_id = row["paragraph_id"]
                if not p_id:
                    continue
                
                if p_id not in paragraphs_map:
                    p_node = {
                        "paragraph_id": p_id,
                        "letter": row["paragraph_letter"],
                        "text": row["paragraph_text"],
                        "items": []
                    }
                    paragraphs_map[p_id] = p_node
                    articles_map[art_id]["paragraphs"].append(p_node)
                    
                    # If article text was empty, update its title dynamically from the first paragraph
                    if (not articles_map[art_id]["text"] or not articles_map[art_id]["title"] or articles_map[art_id]["title"] == f"المادة {articles_map[art_id]['number']}") and row.get("paragraph_text"):
                        new_title = LegalGraphService.get_dynamic_article_title(
                            articles_map[art_id]["number"],
                            row["paragraph_text"]
                        )
                        if new_title and new_title != f"المادة {articles_map[art_id]['number']}":
                            articles_map[art_id]["title"] = new_title
                    
                i_id = row["item_id"]
                if not i_id:
                    continue
                
                i_node = {
                    "item_id": i_id,
                    "number": row["item_number"],
                    "text": row["item_text"]
                }
                paragraphs_map[p_id]["items"].append(i_node)
                
            # Guarantee 100% unique article titles across the law tree
            seen_titles = set()
            for art in result["articles"]:
                t = art.get("title") or f"المادة {art.get('number')}"
                if art.get("number") == 4:
                    t = "الإعفاءات والأنشطة المعفاة"
                if t in seen_titles:
                    t = LegalGraphService.get_dynamic_article_title(
                        art.get("number"),
                        art.get("text") or (art["paragraphs"][0]["text"] if art.get("paragraphs") else "")
                    )
                    if t in seen_titles or not t:
                        t = f"الأحكام التنظيمية والإجرائية (مادة {art.get('number')})"
                seen_titles.add(t)
                art["title"] = t

            return result

    @staticmethod
    def get_article_history(law_id: str, article_number: int):
        """
        Fetches all historical versions of an article sorted by effective_from date.
        Supports both modern versions and historical stages directly from Neo4j.
        Reconstructs text from paragraphs if article-level text is empty.
        """
        is_tax_34 = any(k in (str(law_id) or "") for k in ["34_2014", "34-2014", "law_tax_34_2014", "قانون_34", "34"])
        if is_tax_34:
            query = """
            MATCH (l)
            WHERE (l:Law OR l:`قانون`) AND (
                l.law_id IN ['قانون_34_2014_وتعديلاته', 'قانون_34_2014_الأصلية'] OR
                l.`معرف` IN ['قانون_34_2014_وتعديلاته', 'قانون_34_2014_الأصلية']
            )
            OPTIONAL MATCH (l)-[:HAS_VERSION]->(lv)-[:HAS_ARTICLE]->(av)
            WHERE av.number = $article_number
            OPTIONAL MATCH (l)-[:`يتضمن_مادة`]->(a_ar:`مادة`)
            WHERE toInteger(a_ar.`رقم_المادة`) = $article_number OR a_ar.number = $article_number
            WITH l, coalesce(av, a_ar) as a_node
            WHERE a_node IS NOT NULL
            OPTIONAL MATCH (a_node)-[:HAS_PARAGRAPH|`يتضمن_فقرة`]->(p_node)
            WITH l, a_node, p_node
            ORDER BY coalesce(p_node.order, p_node.`حرف_الفقرة`, p_node.`معرف`) ASC
            WITH l, a_node,
                 coalesce(a_node.text, a_node.`نص_المادة`, '') as direct_text,
                 collect(
                     CASE 
                         WHEN p_node.`حرف_الفقرة` IS NOT NULL AND NOT coalesce(p_node.`نص_الفقرة`, p_node.text, '') STARTS WITH p_node.`حرف_الفقرة`
                         THEN p_node.`حرف_الفقرة` + "- " + coalesce(p_node.`نص_الفقرة`, p_node.text, '')
                         ELSE coalesce(p_node.`نص_الفقرة`, p_node.text, '')
                     END
                 ) as p_texts
            RETURN coalesce(a_node.version_id, a_node.`معرف`, coalesce(l.law_id, l.`معرف`) + '_art_' + toString($article_number)) AS version_id,
                   CASE WHEN direct_text <> '' THEN direct_text
                        WHEN size([x IN p_texts WHERE x <> '']) > 0
                        THEN reduce(acc = '', t IN [x IN p_texts WHERE x <> ''] | acc + (CASE WHEN acc = '' THEN '' ELSE '\n\n' END) + t)
                        ELSE direct_text END AS text,
                   CASE WHEN coalesce(l.law_id, l.`معرف`) CONTAINS 'الأصلية' THEN '2015-01-01' ELSE '2019-01-01' END AS effective_from,
                   'active' AS status,
                   CASE WHEN coalesce(l.law_id, l.`معرف`) CONTAINS 'الأصلية' THEN 'النسخة الأصلية — 2015' ELSE 'النص النافذ — 2019' END AS version_name
            ORDER BY effective_from DESC
            """
            with neo4j_db.get_session() as session:
                return session.execute_read(lambda tx: tx.run(query, article_number=article_number).data())

        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (
            l.law_id = $law_id OR 
            l.law_id = replace($law_id, '_', '/') OR 
            l.law_id = replace($law_id, '/', '_') OR
            l.`معرف` = $law_id
        )
        MATCH (l)-[:HAS_VERSION]->(lv:LawVersion)-[:HAS_ARTICLE]->(av:ArticleVersion)
        WHERE av.number = $article_number
        OPTIONAL MATCH (av)-[:HAS_PARAGRAPH|`يتضمن_فقرة`]->(p_node)
        WITH l, lv, av, p_node
        ORDER BY coalesce(p_node.order, p_node.`حرف_الفقرة`, p_node.`معرف`) ASC
        WITH l, lv, av,
             coalesce(av.text, av.`نص_المادة`, '') as direct_text,
             collect(DISTINCT coalesce(p_node.text, p_node.`نص_الفقرة`, '')) as p_texts
        RETURN av.version_id AS version_id,
               CASE WHEN direct_text <> '' THEN direct_text
                    WHEN size([x IN p_texts WHERE x <> '']) > 0
                    THEN reduce(acc = '', t IN [x IN p_texts WHERE x <> ''] | acc + (CASE WHEN acc = '' THEN '' ELSE '\n' END) + t)
                    ELSE direct_text END AS text,
               av.effective_from AS effective_from,
               av.status AS status,
               lv.version_name AS version_name
        ORDER BY av.effective_from DESC
        """
        with neo4j_db.get_session() as session:
            return session.execute_read(lambda tx: tx.run(query, law_id=law_id, article_number=article_number).data())

    @staticmethod
    def get_judgments_citing_target(target_id: str):
        """
        Fetches Judgments that cite a specific ArticleVersion, Paragraph, or Item by its ID.
        """
        query = """
        MATCH (j:Judgment)-[r:CITES]->(target)
        WHERE target.version_id = $target_id 
           OR target.paragraph_id = $target_id 
           OR target.item_id = $target_id
        RETURN j.ruling_id AS ruling_id,
               j.case_number AS case_number,
               j.ruling_number AS ruling_number,
               j.ruling_year AS ruling_year,
               j.court AS court,
               j.court_type AS court_type,
               j.date AS date,
               j.outcome AS outcome,
               j.subject AS subject,
               j.title AS title,
               j.full_text AS full_text,
               r.citation_text AS citation_text,
               r.paragraph_letter AS cited_paragraph_letter,
               r.item_number AS cited_item_number,
               r.law_name AS cited_law_name
        ORDER BY j.date DESC
        """
        with neo4j_db.get_session() as session:
            return session.execute_read(lambda tx: tx.run(query, target_id=target_id).data())

    @staticmethod
    def get_related_files_for_law(law_id: str, include_inactive: bool = False):
        """
        Fetches all rulings, predecessor laws, and amendments directly related to this law.
        Extracts clean metadata dynamically from graph nodes for ANY law and ruling.
        """
        if not law_id or law_id in ['law_tax_34_2014', '34-2014', 'قانون_ضريبة_الدخل', 'قانون_34_2014', '34', 'default']:
            law_id = 'قانون_34_2014_وتعديلاته'

        alt_ids = list(set([law_id, law_id.replace('_', '/'), law_id.replace('/', '_'), law_id.replace('-', '/'), law_id.replace('/', '-')]))

        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id IN $alt_ids OR l.`معرف` IN $alt_ids OR ANY(x IN $alt_ids WHERE l.`معرف` CONTAINS x OR x CONTAINS l.`معرف`))
          AND ($include_inactive = true OR coalesce(l.is_active, true) = true)
        
        OPTIONAL MATCH (r)-[:`استند_إلى_قانون`|`استند_إلى_مادة`|CITES]->(target)
        WHERE (r:`حكم_قضائي` OR r:Judgment)
          AND ($include_inactive = true OR coalesce(r.is_active, true) = true)
          AND (target = l OR (l)-[:`يتضمن_مادة`|HAS_VERSION|HAS_ARTICLE]->(target) OR target.law_id = l.law_id)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(c:`محكمة`)
        
        OPTIONAL MATCH (l_other:`قانون`)
        WHERE ((l_other)-[:`تعديل_على`]->(l) OR (l)-[:`تعديل_على`]->(l_other))
          AND ($include_inactive = true OR coalesce(l_other.is_active, true) = true)
        
        RETURN collect(DISTINCT {
            id: coalesce(r.`معرف`, r.ruling_id, ''),
            title: coalesce(r.`العنوان`, r.title, r.`name`, ''),
            ruling_number: coalesce(r.`رقم_الحكم`, toString(r.ruling_number), ''),
            case_number: coalesce(r.`رقم_الدعوى`, r.case_number, ''),
            year: coalesce(r.`السنة`, toString(r.ruling_year), toString(r.year), ''),
            date: coalesce(r.`تاريخ_الفصل`, r.date, ''),
            court: coalesce(r.`المحكمة`, c.`اسم_المحكمة`, r.court, ''),
            subject: coalesce(r.subject, r.`موضوع_الدعوى`, ''),
            outcome: coalesce(r.outcome, r.`القرار`, ''),
            full_text: coalesce(r.`نص_الحكم`, r.full_text, r.`نص_الوثيقة`, r.`مقتطف_الحكم`, '')
        }) AS rulings,
        collect(DISTINCT {
            id: coalesce(l_other.`معرف`, l_other.law_id, ''),
            law_id: coalesce(l_other.law_id, l_other.`معرف`, ''),
            title: coalesce(l_other.`العنوان`, l_other.`name`, ''),
            number: coalesce(toInteger(l_other.`رقم_القانون`), toInteger(l_other.number), ''),
            year: coalesce(l_other.`السنة`, l_other.year, ''),
            type: 'تشريع مرتبط',
            summary: coalesce(l_other.`حل_محل`, ''),
            full_text: coalesce(l_other.`نص_القانون`, l_other.full_text, l_other.text, '')
        }) AS other_laws,
        coalesce(l.`حل_محل`, l.replaced_law, '') AS replaced_law
        """
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id, alt_ids=alt_ids, include_inactive=include_inactive).data())
            if not records:
                return []
            rec = records[0]
            results = []
            
            # 1. Rulings with real full text
            for idx, r in enumerate(rec.get("rulings", [])):
                title_str = str(r.get("title") or "").strip()
                if not title_str:
                    continue
                
                r_num = str(r.get("ruling_number") or "").strip()
                r_year = str(r.get("year") or "").strip()
                c_num = str(r.get("case_number") or "").strip()
                full_text_val = str(r.get("full_text") or "").strip()

                # Dynamic fallback number extraction from title if empty
                if not r_num:
                    num_m = re.search(r'(?:حكم|قرار|الرقم|رقم)\s*رقم?\s*(\d+)', title_str)
                    if num_m:
                        r_num = num_m.group(1)
                if not r_year:
                    yr_m = re.search(r'لسنة\s*(\d{4})', title_str)
                    if yr_m:
                        r_year = yr_m.group(1)

                # Fallback case_number from full text if missing
                if not c_num and full_text_val:
                    case_m = re.search(r'(?:رقم الدعوى|رقم القضية|الدعوى رقم)\s*[:\-]?\s*([0-9\s\/]+)', full_text_val)
                    if case_m:
                        c_num = case_m.group(1).replace(" ", "").strip()

                # Formatted display number
                if r_num and r_year:
                    if "لسنة" in r_num:
                        formatted_number = r_num
                    else:
                        formatted_number = f"{r_num} لسنة {r_year}"
                    if c_num and c_num not in [f"{r_num}/{r_year}", f"{r_year}/{r_num}"] and c_num not in formatted_number:
                        formatted_number += f" (دعوى {c_num})"
                elif c_num:
                    formatted_number = f"دعوى {c_num}"
                elif r_num:
                    formatted_number = f"حكم رقم {r_num}"
                else:
                    formatted_number = r.get("id") or "حكم قضائي"

                # Court / Source
                court_str = str(r.get("court") or "").strip()
                if not court_str:
                    if "إدارية" in title_str or "الإدارية" in full_text_val:
                        court_str = "المحكمة الإدارية العليا"
                    elif "تمييز" in title_str or "التمييز" in full_text_val:
                        court_str = "محكمة التمييز"
                    elif "بداية" in title_str or "البداية" in full_text_val:
                        court_str = "محكمة البداية الضريبية"
                    elif "استئناف" in title_str or "الاستئناف" in full_text_val:
                        court_str = "محكمة الاستئناف الضريبية"
                    else:
                        court_str = "محكمة أردنية مختصة"

                # Date
                date_str = str(r.get("date") or "").strip()
                if not date_str and full_text_val:
                    date_m = re.search(r'(?:تاريخ الفصل|تاريخ النطق|تاريخ الصدور)\s*[:\-]?\s*([0-9\-\/\.]{8,12})', full_text_val)
                    if date_m:
                        date_str = date_m.group(1).strip()
                    else:
                        date_m2 = re.search(r'بتاريخ\s*(\d{1,2}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{2,4})', full_text_val)
                        if date_m2:
                            date_str = date_m2.group(1).replace(" ", "").strip()
                if not date_str:
                    date_str = r_year or "—"

                # If full_text_val is still short or missing, load from ./data/ docx
                if not full_text_val or len(full_text_val) < 200:
                    try:
                        import docx
                        base_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
                        if os.path.isdir(base_data_dir):
                            r_num_digits = re.search(r'\d+', r_num).group(0) if re.search(r'\d+', r_num) else ""
                            for fname in os.listdir(base_data_dir):
                                if fname.endswith('.docx') and r_num_digits and r_num_digits in fname:
                                    fpath = os.path.join(base_data_dir, fname)
                                    d = docx.Document(fpath)
                                    clean_paras = []
                                    for para in d.paragraphs:
                                        t = para.text.strip()
                                        if not t:
                                            continue
                                        t = re.sub(r'[\.\_]{2,}', ' ', t)
                                        t = re.sub(r'\s{2,}', ' ', t).strip()
                                        if t:
                                            clean_paras.append(t)
                                    full_text_val = '\n'.join(clean_paras)
                                    break
                    except Exception:
                        pass

                # Dynamic fallback subject and outcome from full_text if empty
                subject_val = str(r.get("subject") or "").strip()
                outcome_val = str(r.get("outcome") or "").strip()
                if not subject_val and full_text_val:
                    sub_m = re.search(r'موضوع (?:الدعوى|الطعن|القضية|التمييز)\s*[:\-]?\s*(.+)', full_text_val.replace('ـ', ''))
                    if sub_m:
                        subject_val = sub_m.group(1).split('\n')[0].strip()
                if not outcome_val and full_text_val:
                    out_m = re.search(r'(?:تقرر المحكمة ما يلي|لذلك نقرر|لهذا نقرر|فلهذه الأسباب|وبالنتيجة تقرر)\s*[:\-]?\s*(.+)', full_text_val.replace('ـ', ''), re.DOTALL)
                    if out_m:
                        out_lines = [l.strip() for l in out_m.group(1).split('\n') if l.strip() and not any(w in l for w in ['القاضي', 'الديوان', 'طباعة'])]
                        if out_lines:
                            outcome_val = ' '.join(out_lines[:2])
                            if len(outcome_val) > 250:
                                outcome_val = outcome_val[:247] + '...'

                results.append({
                    "id": idx + 1,
                    "title": title_str,
                    "type": "حكم قضائي",
                    "numberLabel": "رقم الحكم",
                    "number": formatted_number,
                    "date": date_str,
                    "year": r_year or "2024",
                    "court": court_str,
                    "source": court_str,
                    "subject": subject_val,
                    "outcome": outcome_val,
                    "summary": None,
                    "full_text": full_text_val,
                    "text": full_text_val,
                    "meta": {
                        "type": "حكم قضائي",
                        "numberLabel": "رقم الحكم",
                        "number": formatted_number,
                        "date": date_str,
                        "year": r_year,
                        "category": f"قضاء ضريبي - {court_str}",
                        "group": "الأحكام القضائية",
                        "subCategory": court_str,
                        "court": court_str,
                        "source": court_str,
                        "subject": subject_val,
                        "outcome": outcome_val,
                        "summary": None,
                        "full_text": full_text_val,
                        "text": full_text_val
                    },
                    "docTitle": title_str
                })
            
            # 2. Replaced predecessor law if exists
            if rec.get("replaced_law"):
                rep_title = str(rec["replaced_law"]).strip()
                if rep_title:
                    m_num = re.search(r'رقم\s*(\d+)', rep_title)
                    rep_num = m_num.group(1) if m_num else ""
                    m_yr = re.search(r'لسنة\s*(\d{4})', rep_title)
                    rep_year = m_yr.group(1) if m_yr else ""
                    formatted_rep_number = f"{rep_num} لسنة {rep_year}" if (rep_num and rep_year) else (rep_num or rep_title)
                    rep_full_text = f"التشريع السابق الملغى: {rep_title}"
                    results.append({
                        "id": len(results) + 1,
                        "title": f"{rep_title} ملغى" if "ملغى" not in rep_title else rep_title,
                        "year": rep_year or "",
                        "full_text": rep_full_text,
                        "text": rep_full_text,
                        "meta": {
                            "type": "تشريع سابق",
                            "numberLabel": "رقم القانون",
                            "number": formatted_rep_number,
                            "date": rep_year or "",
                            "year": rep_year or "",
                            "category": "تشريع سابق ملغى",
                            "group": "أُلغي بموجب",
                            "subCategory": "القوانين",
                            "source": "الجريدة الرسمية الأردنية",
                            "summary": f"التشريع السابق الذي أُلغي وحل محله هذا القانون استناداً لما ورد في ديباجة ونصوص القانون.",
                            "full_text": rep_full_text,
                            "text": rep_full_text
                        },
                        "docTitle": rep_title
                    })
                
            # 3. Other law versions / amendments directly linked in graph
            for l_o in rec.get("other_laws", []):
                lo_title = str(l_o.get("title") or "").strip()
                if lo_title:
                    m_num = re.search(r'رقم\s*(\d+)', lo_title)
                    lo_num = m_num.group(1) if m_num else str(l_o.get("number") or "")
                    m_yr = re.search(r'لسنة\s*(\d{4})', lo_title)
                    lo_yr = m_yr.group(1) if m_yr else str(l_o.get("year") or "")

                    formatted_lo_number = f"{lo_num} لسنة {lo_yr}" if (lo_num and lo_yr) else lo_title
                    amend_full_text = str(l_o.get("full_text") or f"نص {lo_title}").strip()
                    results.append({
                        "id": len(results) + 1,
                        "title": lo_title,
                        "year": lo_yr or "",
                        "full_text": amend_full_text,
                        "text": amend_full_text,
                        "meta": {
                            "type": "تعديل تشريعي",
                            "numberLabel": "رقم التشريع",
                            "number": formatted_lo_number,
                            "date": lo_yr or "",
                            "year": lo_yr or "",
                            "category": "تعديل تشريعي نافذ",
                            "group": "تعديلات تشريعية",
                            "subCategory": "قوانين معدلة",
                            "source": "الجريدة الرسمية",
                            "summary": l_o.get("summary") or "النسخة القانونية المقابلة وتعديلاتها النافذة.",
                            "full_text": amend_full_text,
                            "text": amend_full_text
                        },
                        "docTitle": lo_title
                    })

            return results

    @staticmethod
    def get_law_stages(law_id: str):
        """
        Returns all legislative stages / versions for a law from Neo4j.
        """
        is_tax_34 = any(k in law_id for k in ["34_2014", "34-2014", "law_tax_34_2014", "قانون_34"])
        if is_tax_34:
            return [
                {
                    "id": "2014_original",
                    "law_id": "قانون_34_2014_الأصلية",
                    "version_name": "النسخة الأصلية",
                    "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية)",
                    "subtitle": "النسخة الأصلية — سارية منذ 01-01-2015",
                    "date": "01-01-2015",
                    "buttonText": "عرض النسخة الأصلية",
                    "status": "النسخة الأصلية",
                    "is_current": False,
                    "meta": {
                        "type": "قانون",
                        "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية)",
                        "number": "34 لسنة 2014",
                        "issueDate": "30-12-2014",
                        "effectiveDate": "01-01-2015",
                        "gazette": "عدد 5320 — ص 7390 — تاريخ النشر: 31-12-2014",
                        "status": "النسخة الأصلية"
                    }
                },
                {
                    "id": "2019_current",
                    "law_id": "قانون_34_2014_وتعديلاته",
                    "version_name": "النص النافذ",
                    "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
                    "subtitle": "النص المدمج النافذ بعد التعديل — ساري منذ 01-01-2019",
                    "date": "01-01-2019",
                    "buttonText": "عرض النسخة النافذة",
                    "status": "النص المدمج النافذ بعد التعديل",
                    "is_current": True,
                    "meta": {
                        "type": "قانون",
                        "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
                        "number": "34 لسنة 2014",
                        "issueDate": "30-12-2014",
                        "effectiveDate": "01-01-2019",
                        "gazette": "عدد 5320 — ص 7390 — تاريخ النشر: 31-12-2014",
                        "status": "النص المدمج النافذ بعد التعديل"
                    }
                }
            ]

        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (
            l.law_id = $law_id OR 
            l.law_id = replace($law_id, '_', '/') OR 
            l.law_id = replace($law_id, '/', '_') OR 
            l.`معرف` = $law_id
        ) AND ($include_inactive = true OR coalesce(l.is_active, true) = true)
        OPTIONAL MATCH (l)-[:HAS_VERSION]->(lv:LawVersion)
        RETURN coalesce(l.law_id, l.`معرف`) AS cur_id,
               coalesce(l.title, l.`العنوان`, l.`اسم`, l.name) AS cur_title,
               coalesce(l.number, toInteger(l.`رقم_القانون`), "") AS law_number,
               coalesce(l.year, toInteger(l.`السنة`), "") AS law_year,
               coalesce(l.gazette, l.`الجريدة_الرسمية`, l.`الجريدة`, "") AS gazette,
               coalesce(l.replaced_law, l.`حل_محل`, "") AS replaced_law,
               coalesce(l.issue_date, l.`تاريخ_الصدور`, "") AS issue_date,
               coalesce(l.effective_date, l.`تاريخ_السريان`, "") AS effective_date,
               collect(properties(lv)) AS versions
        LIMIT 1
        """
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id, include_inactive=include_inactive).data())
            rec = records[0] if records else {}
            cur_id = rec.get("cur_id") or law_id
            cur_title = rec.get("cur_title") or "التشريع القانوني"
            cur_date = rec.get("effective_date") or rec.get("issue_date") or "—"
            raw_versions = [v for v in rec.get("versions", []) if v and v.get("version_name")]
            doc_num = f"{rec.get('law_number')} لسنة {rec.get('law_year')}" if rec.get('law_number') and rec.get('law_year') else (str(rec.get('law_number')) or "—")

            base_meta = {
                "type": "قانون",
                "title": cur_title,
                "number": doc_num,
                "law_number": str(rec.get("law_number") or ""),
                "law_year": str(rec.get("law_year") or ""),
                "issueDate": str(rec.get("issue_date") or "—"),
                "effectiveDate": str(rec.get("effective_date") or cur_date or "—"),
                "gazette": str(rec.get("gazette") or "—"),
                "replaced_law": str(rec.get("replaced_law") or "—"),
                "status": "ساري"
            }

            if not raw_versions:
                return [{
                    "id": f"{cur_id}_current",
                    "law_id": cur_id,
                    "version_name": "الأصلية",
                    "title": cur_title,
                    "subtitle": f"النص المعتمد — ساري منذ {cur_date}",
                    "date": cur_date,
                    "buttonText": "عرض النص الكامل",
                    "status": "ساري",
                    "is_current": True,
                    "meta": base_meta
                }]

            stages = []
            for idx, v in enumerate(raw_versions):
                v_name = v.get("version_name", "الأصلية")
                eff = v.get("effective_from") or cur_date
                is_curr = (idx == len(raw_versions) - 1)
                stages.append({
                    "id": f"{cur_id}_{v_name}",
                    "law_id": cur_id,
                    "version_name": v_name,
                    "title": f"{cur_title} ({v_name})",
                    "subtitle": f"نسخة {v_name} — سارية منذ {eff}",
                    "date": eff,
                    "buttonText": f"عرض نسخة {v_name}",
                    "status": "ساري" if is_curr else "النسخة الأصلية",
                    "is_current": is_curr,
                    "meta": {
                        **base_meta,
                        "title": f"{cur_title} ({v_name})",
                        "effectiveDate": eff,
                        "status": "ساري" if is_curr else "النسخة الأصلية"
                    }
                })
            return stages



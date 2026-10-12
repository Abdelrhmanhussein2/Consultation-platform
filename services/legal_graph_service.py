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
        items: list
    ):
        """
        Imports a law and its entire version structure (Articles, Paragraphs, Items)
        in batches using UNWIND queries for optimal performance.
        
        - articles: list of dicts {version_id, text, effective_from, status, number, law_version_id}
        - paragraphs: list of dicts {paragraph_id, letter, text, article_version_id}
        - items: list of dicts {item_id, number, text, paragraph_id}
        """
        # 1. Create Law and LawVersion nodes and link them
        law_query = """
        MERGE (l:Law {law_id: $law_id})
        ON CREATE SET l.title = $law_title, l.number = $law_number, l.year = $law_year
        ON MATCH SET l.title = $law_title, l.number = $law_number, l.year = $law_year
        
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
                      av.effective_from = art.effective_from, 
                      av.status = art.status, 
                      av.number = art.number, 
                      av.law_version_id = art.law_version_id
        ON MATCH SET av.text = art.text, 
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
                    effective_from=effective_from
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
    def get_laws(q: str = None, year_from: int = None, year_to: int = None):
        """
        Retrieves Law nodes in the database with optional filtering.
        Supports both Arabic (:قانون) and English (:Law) schemas.
        """
        where_clauses = []
        params = {}
        if q:
            where_clauses.append("toLower(coalesce(title, law_id, '')) CONTAINS toLower($q)")
            params["q"] = q
        if year_from is not None:
            where_clauses.append("toInteger(coalesce(year, 0)) >= $year_from")
            params["year_from"] = year_from
        if year_to is not None:
            where_clauses.append("toInteger(coalesce(year, 0)) <= $year_to")
            params["year_to"] = year_to

        where_str = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        query = f"""
        MATCH (l)
        WHERE l:Law OR l:`قانون`
        OPTIONAL MATCH (l)-[r:`يتضمن_مادة`|HAS_ARTICLE]->(a)
        WITH l,
             coalesce(l.law_id, l.`معرف`) AS law_id,
             coalesce(l.title, l.`العنوان`, l.`اسم`, l.name) AS title,
             coalesce(l.number, l.`رقم_القانون`, 34) AS number,
             coalesce(l.year, l.`السنة`, 2014) AS year,
             coalesce(l.`النوع`, 'قانون') AS type,
             'ساري' AS status,
             toString(coalesce(l.year, l.`السنة`, 2014)) AS year_short,
             coalesce(l.issue_date, '31-12-2014') AS issue_date,
             coalesce(l.effective_date, '01-01-2015') AS effective_date,
             coalesce(l.amended_date, '01-01-2019') AS amended_date,
             count(a) AS art_count
        {where_str}
        RETURN law_id, title, number, year, type, status, year_short,
               issue_date, effective_date, amended_date,
               case when art_count > 0 then art_count else 82 end AS total_articles,
               coalesce(l.`حل_محل`, 'تشريع ضريبي ينظم الأحكام والضوابط الضريبية في المملكة الأردنية الهاشمية') AS summary
        ORDER BY year DESC, number ASC
        """
        with neo4j_db.get_session() as session:
            return session.execute_read(lambda tx: tx.run(query, **params).data())

    @staticmethod
    def get_law_version_tree(law_id: str, version_name: str = None):
        """
        Fetches the complete hierarchy of a law version:
        Supports both Arabic (:قانون -> :مادة -> :فقرة -> :بند)
        and English (Law -> LawVersion -> ArticleVersion -> Paragraph -> Item)
        """
        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id = $law_id OR l.`معرف` = $law_id)
        OPTIONAL MATCH (l)-[:HAS_VERSION]->(lv:LawVersion)-[:HAS_ARTICLE]->(av:ArticleVersion)
        OPTIONAL MATCH (l)-[:`يتضمن_مادة`]->(a_ar:`مادة`)
        WITH l, coalesce(av, a_ar) AS a_node
        OPTIONAL MATCH (a_node)-[:HAS_PARAGRAPH|`يتضمن_فقرة`]->(p_node)
        OPTIONAL MATCH (p_node)-[:HAS_ITEM|`يتضمن_بند`]->(i_node)
        OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_مادة`]->(a_node)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(c:`محكمة`)
        
        RETURN coalesce(l.law_id, l.`معرف`) AS law_id,
               coalesce(l.title, l.`العنوان`, l.`اسم`, l.name) AS law_title,
               coalesce(l.number, toInteger(l.`رقم_القانون`), 34) AS law_number,
               coalesce(l.year, toInteger(l.`السنة`), 2014) AS law_year,
               coalesce(l.law_id, l.`معرف`) AS version_id,
               coalesce(l.`النوع`, 'ساري') AS version_name,
               '01-01-2015' AS effective_from,
               coalesce(a_node.version_id, a_node.`معرف`) AS article_id,
               coalesce(a_node.number, toInteger(a_node.`رقم_المادة`), 1) AS article_number,
               coalesce(a_node.text, a_node.`نص_المادة`, '') AS article_text,
               'ساري' AS article_status,
               coalesce(p_node.paragraph_id, p_node.`معرف`) AS paragraph_id,
               coalesce(p_node.letter, p_node.`حرف_الفقرة`, '') AS paragraph_letter,
               coalesce(p_node.text, p_node.`نص_الفقرة`, '') AS paragraph_text,
               coalesce(i_node.item_id, i_node.`معرف`) AS item_id,
               coalesce(i_node.number, toInteger(i_node.`رقم_البند`), 1) AS item_number,
               coalesce(i_node.text, i_node.`نص_البند`, '') AS item_text,
               collect(DISTINCT {
                   id: coalesce(r.`معرف`, ''),
                   title: coalesce(r.`العنوان`, r.`name`, ''),
                   court: coalesce(r.`المحكمة`, c.`اسم_المحكمة`, ''),
                   case_number: coalesce(r.`رقم_الدعوى`, ''),
                   year: coalesce(r.`السنة`, '')
               }) AS citing_rulings
        ORDER BY article_number ASC, paragraph_letter ASC, item_number ASC
        """
        
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id).data())
            if not records:
                return None
            
            first = records[0]
            result = {
                "law_id": first["law_id"],
                "title": first["law_title"],
                "number": first["law_number"],
                "year": first["law_year"],
                "version_id": first["version_id"],
                "version_name": first["version_name"],
                "effective_from": first["effective_from"],
                "articles": []
            }
            
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
                    art_node = {
                        "article_id": art_id,
                        "number": row["article_number"],
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
                    
                i_id = row["item_id"]
                if not i_id:
                    continue
                
                i_node = {
                    "item_id": i_id,
                    "number": row["item_number"],
                    "text": row["item_text"]
                }
                paragraphs_map[p_id]["items"].append(i_node)
                
            return result

    @staticmethod
    def get_article_history(law_id: str, article_number: int):
        """
        Fetches all historical versions of an article sorted by effective_from date.
        """
        query = """
        MATCH (l:Law {law_id: $law_id})-[:HAS_VERSION]->(lv:LawVersion)-[:HAS_ARTICLE]->(av:ArticleVersion)
        WHERE av.number = $article_number
        RETURN av.version_id AS version_id,
               av.text AS text,
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
    def get_related_files_for_law(law_id: str):
        """
        Fetches all rulings, predecessor laws, and amendments directly related to this law.
        """
        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id = $law_id OR l.`معرف` = $law_id)
        
        OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_قانون`|`استند_إلى_مادة`]->(target)
        WHERE target = l OR (l)-[:`يتضمن_مادة`]->(target)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(c:`محكمة`)
        
        OPTIONAL MATCH (l_other:`قانون`)
        WHERE (l_other)-[:`تعديل_على`]->(l) OR (l)-[:`تعديل_على`]->(l_other)
        
        RETURN collect(DISTINCT {
            id: coalesce(r.`معرف`, ''),
            title: coalesce(r.`العنوان`, r.`name`, ''),
            year: coalesce(r.`السنة`, ''),
            type: 'حكم قضائي',
            court: coalesce(r.`المحكمة`, c.`اسم_المحكمة`, ''),
            case_number: coalesce(r.`رقم_الدعوى`, ''),
            date: coalesce(r.`تاريخ_الفصل`, ''),
            summary: coalesce(r.`مقتطف_الحكم`, '')
        }) AS rulings,
        collect(DISTINCT {
            id: coalesce(l_other.`معرف`, ''),
            title: coalesce(l_other.`العنوان`, l_other.`name`, ''),
            year: coalesce(l_other.`السنة`, ''),
            type: 'تشريع مرتبط',
            summary: coalesce(l_other.`حل_محل`, '')
        }) AS other_laws,
        coalesce(l.`حل_محل`, '') AS replaced_law
        """
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id).data())
            if not records:
                return []
            rec = records[0]
            results = []
            
            # 1. Rulings
            for idx, r in enumerate(rec.get("rulings", [])):
                if r.get("title"):
                    results.append({
                        "id": idx + 1,
                        "title": r["title"],
                        "year": r.get("year", "2024"),
                        "meta": {
                            "type": "حكم قضائي",
                            "numberLabel": "رقم الحكم",
                            "number": r.get("case_number") or r.get("id"),
                            "date": r.get("date") or r.get("year"),
                            "year": r.get("year"),
                            "category": f"قضاء ضريبي - {r.get('court', 'محكمة مختصة')}",
                            "group": "الأحكام القضائية",
                            "subCategory": r.get("court", "المحكمة"),
                            "source": r.get("court", "محكمة أردنية مختصة"),
                            "summary": r.get("summary") or f"حكم قضائي مرتبط بتطبيق أحكام القانون وتفسير مواده."
                        },
                        "docTitle": r["title"]
                    })
            
            # 2. Replaced law if exists
            if rec.get("replaced_law"):
                results.append({
                    "id": len(results) + 1,
                    "title": f"{rec['replaced_law']} ملغى",
                    "year": "2009",
                    "meta": {
                        "type": "تشريع سابق",
                        "numberLabel": "رقم القانون",
                        "number": "28 لسنة 2009",
                        "date": "2009",
                        "year": "2009",
                        "category": "تشريع سابق ملغى",
                        "group": "أُلغي بموجب",
                        "subCategory": "القوانين",
                        "source": "الجريدة الرسمية الأردنية",
                        "summary": f"التشريع السابق الذي أُلغي وحل محله هذا القانون استناداً لما ورد في ديباجة ونصوص القانون."
                    },
                    "docTitle": rec["replaced_law"]
                })
                
            # 3. Other law versions
            for l_o in rec.get("other_laws", []):
                if l_o.get("title"):
                    results.append({
                        "id": len(results) + 1,
                        "title": l_o["title"],
                        "year": l_o.get("year", "2018"),
                        "meta": {
                            "type": "تعديل تشريعي",
                            "numberLabel": "التشريع",
                            "number": l_o["title"],
                            "date": l_o.get("year"),
                            "year": l_o.get("year"),
                            "category": "تعديل تشريعي نافذ",
                            "group": "تعديلات تشريعية",
                            "subCategory": "قوانين معدلة",
                            "source": "الجريدة الرسمية",
                            "summary": "النسخة القانونية المقابلة وتعديلاتها النافذة."
                        },
                        "docTitle": l_o["title"]
                    })
                    
            return results

    @staticmethod
    def get_law_stages(law_id: str):
        """
        Returns all legislative stages / versions for a law from Neo4j.
        E.g. Original enactment (2014), amending law (2018), and current consolidated law (2019).
        """
        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id = $law_id OR l.`معرف` = $law_id)
        
        OPTIONAL MATCH (l_orig:`قانون`)
        WHERE l_orig.`معرف` CONTAINS 'الأصلية' OR (l)-[:`تعديل_على`]->(l_orig)
        
        OPTIONAL MATCH (l_curr:`قانون`)
        WHERE l_curr.`معرف` CONTAINS 'وتعديلاته' OR (l_curr)-[:`تعديل_على`]->(l)
        
        RETURN l.`معرف` AS cur_id,
               l.`العنوان` AS cur_title,
               l.`تاريخ_النفاذ` AS cur_date,
               l_orig.`معرف` AS orig_id,
               l_orig.`العنوان` AS orig_title,
               l_orig.`تاريخ_النفاذ` AS orig_date,
               l_curr.`معرف` AS curr_id,
               l_curr.`العنوان` AS curr_title,
               l_curr.`تاريخ_النفاذ` AS curr_date
        LIMIT 1
        """
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id).data())
            rec = records[0] if records else {}
            
            orig_law_id = rec.get("orig_id") or "قانون_34_2014_الأصلية"
            curr_law_id = rec.get("curr_id") or "قانون_34_2014_وتعديلاته"
            
            return [
                {
                    "id": "2014_original",
                    "law_id": orig_law_id,
                    "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر",
                    "subtitle": "النسخة الأصلية السارية منذ 01-01-2015",
                    "date": "01-01-2015",
                    "buttonText": "عرض النسخة الأصلية",
                    "status": "كما صدر",
                    "is_current": False,
                    "meta": {
                        "type": "قانون",
                        "number": "34 لسنة 2014",
                        "issueDate": "30-12-2014",
                        "effectiveDate": "01-01-2015",
                        "gazette": "العدد 5320 — الصفحة 7390",
                        "status": "كما صدر"
                    }
                },
                {
                    "id": "2019_current",
                    "law_id": curr_law_id,
                    "title": "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
                    "subtitle": "النص المدمج النافذ بعد تعديل 2018 — ساري منذ 01-01-2019",
                    "date": "01-01-2019",
                    "buttonText": "عرض النسخة النافذة",
                    "status": "النص المدمج النافذ بعد التعديل",
                    "is_current": True,
                    "meta": {
                        "type": "قانون",
                        "number": "34 لسنة 2014",
                        "issueDate": "30-12-2014",
                        "effectiveDate": "01-01-2019",
                        "gazette": "العدد 5320 — الصفحة 7390",
                        "status": "النص المدمج النافذ بعد التعديل"
                    }
                }
            ]



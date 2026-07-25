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
    def get_laws():
        """
        Retrieves all Law nodes in the database.
        """
        query = """
        MATCH (l:Law)
        RETURN l.law_id AS law_id, l.title AS title, l.number AS number, l.year AS year
        ORDER BY l.year DESC, l.number ASC
        """
        with neo4j_db.get_session() as session:
            return session.execute_read(lambda tx: tx.run(query).data())

    @staticmethod
    def get_law_version_tree(law_id: str, version_name: str = None):
        """
        Fetches the complete hierarchy of a law version:
        Law -> LawVersion -> ArticleVersion -> Paragraph -> Item
        """
        if version_name:
            version_match = "AND lv.version_name = $version_name"
        else:
            version_match = ""
            
        query = f"""
        MATCH (l:Law {{law_id: $law_id}})-[:HAS_VERSION]->(lv:LawVersion)
        WHERE 1=1 {version_match}
        WITH l, lv
        ORDER BY lv.effective_from DESC
        LIMIT 1
        
        OPTIONAL MATCH (lv)-[:HAS_ARTICLE]->(av:ArticleVersion)
        OPTIONAL MATCH (av)-[:HAS_PARAGRAPH]->(p:Paragraph)
        OPTIONAL MATCH (p)-[:HAS_ITEM]->(i:Item)
        
        RETURN l.law_id AS law_id, l.title AS law_title, l.number AS law_number, l.year AS law_year,
               lv.version_id AS version_id, lv.version_name AS version_name, lv.effective_from AS effective_from,
               av.version_id AS article_id, av.number AS article_number, av.text AS article_text, av.status AS article_status,
               p.paragraph_id AS paragraph_id, p.letter AS paragraph_letter, p.text AS paragraph_text,
               i.item_id AS item_id, i.number AS item_number, i.text AS item_text
        ORDER BY av.number ASC, p.letter ASC, i.number ASC
        """
        
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id, version_name=version_name).data())
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
                    art_node = {
                        "article_id": art_id,
                        "number": row["article_number"],
                        "text": row["article_text"],
                        "status": row["article_status"],
                        "paragraphs": []
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

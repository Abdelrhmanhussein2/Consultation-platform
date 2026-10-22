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
        params = {}

        # Pre-WITH filter that works directly on node properties (incl. Arabic fields)
        pre_where_parts = ["(l:Law OR l:`قانون`)"]  
        if q:
            pre_where_parts.append(
                "(toLower(coalesce(l.title, l.`العنوان`, l.`اسم`, l.name, l.law_id, l.`معرف`, '')) CONTAINS toLower($q))"
            )
            params["q"] = q

        pre_where = "WHERE " + " AND ".join(pre_where_parts)

        # Post-WITH year filters
        post_where_parts = []
        if year_from is not None:
            post_where_parts.append("toInteger(coalesce(year, 0)) >= $year_from")
            params["year_from"] = year_from
        if year_to is not None:
            post_where_parts.append("toInteger(coalesce(year, 0)) <= $year_to")
            params["year_to"] = year_to

        post_where = ("WHERE " + " AND ".join(post_where_parts)) if post_where_parts else ""

        query = f"""
        MATCH (l)
        {pre_where}
        OPTIONAL MATCH (l)-[r:`يتضمن_مادة`|HAS_ARTICLE]->(a)
        WITH l,
             coalesce(l.law_id, l.`معرف`) AS law_id,
             coalesce(l.title, l.`العنوان`, l.`اسم`, l.name) AS title,
             coalesce(l.number, toInteger(l.`رقم_القانون`), toInteger(l.number), 0) AS number,
             coalesce(l.year, toInteger(l.`السنة`), toInteger(l.year), 0) AS year,
             coalesce(l.`النوع`, l.type, 'تشريع') AS type,
             coalesce(l.status, l.`الحالة`, 'ساري') AS status,
             toString(coalesce(l.year, toInteger(l.`السنة`), '')) AS year_short,
             coalesce(l.issue_date, l.`تاريخ_الصدور`, '') AS issue_date,
             coalesce(l.effective_date, l.`تاريخ_السريان`, '') AS effective_date,
             coalesce(l.amended_date, l.`تاريخ_آخر_تعديل`, '') AS amended_date,
             count(a) AS art_count,
             coalesce(l.summary, l.description, l.`الوصف`, l.`حل_محل`, '') AS summary
        {post_where}
        RETURN law_id, title, number, year, type, status, year_short,
               issue_date, effective_date, amended_date,
               art_count AS total_articles,
               summary
        ORDER BY year DESC, number ASC
        """
        with neo4j_db.get_session() as session:
            return session.execute_read(lambda tx: tx.run(query, **params).data())

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
        if re.search(r'المواعيد المعينة|التقويم الميلادي', text_clean):
            return "حساب المواعيد القانونية"
        if re.search(r'يخضع للضريبة|الدخل الخاضع', text_clean):
            return "الدخل الخاضع للضريبة"
        if re.search(r'يعفى من الضريبة|يعفى الدخل|الإعفاءات', text_clean):
            return "الإعفاءات والأنشطة المعفاة"

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
    def get_law_version_tree(law_id: str, version_name: str = None):
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
               coalesce(l.title, l.`العنوان`, l.`اسم`, l.name, "") AS law_title,
               coalesce(l.number, toInteger(l.`رقم_القانون`), toInteger(l.number), 0) AS law_number,
               coalesce(l.year, toInteger(l.`السنة`), toInteger(l.year), 0) AS law_year,
               coalesce(l.gazette, l.`الجريدة_الرسمية`, l.`الجريدة`, "") AS gazette,
               coalesce(l.replaced_law, l.`حل_محل`, "") AS replaced_law,
               coalesce(l.issue_date, l.`تاريخ_الصدور`, l.`تاريخ_النشر`, "") AS issue_date,
               coalesce(l.effective_date, l.`تاريخ_السريان`, l.`تاريخ_النفاذ`, "") AS effective_date,
               coalesce(l.amended_date, l.`تاريخ_آخر_تعديل`, l.`تاريخ_التعديل`, "") AS amended_date,
               coalesce(l.amendments_count, l.`عدد_التعديلات`, 0) AS amendments_count,
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
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id).data())
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
        Extracts clean metadata dynamically from graph nodes for ANY law and ruling.
        """
        if not law_id or law_id in ['law_tax_34_2014', '34-2014', 'قانون_ضريبة_الدخل', 'قانون_34_2014', '34', 'default']:
            law_id = 'قانون_34_2014_وتعديلاته'

        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`) AND (l.law_id = $law_id OR l.`معرف` = $law_id OR l.`معرف` CONTAINS $law_id OR $law_id CONTAINS l.`معرف`)
        
        OPTIONAL MATCH (r)-[:`استند_إلى_قانون`|`استند_إلى_مادة`|CITES]->(target)
        WHERE (r:`حكم_قضائي` OR r:Judgment)
          AND (target = l OR (l)-[:`يتضمن_مادة`|HAS_VERSION|HAS_ARTICLE]->(target) OR target.law_id = l.law_id)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(c:`محكمة`)
        
        OPTIONAL MATCH (l_other:`قانون`)
        WHERE (l_other)-[:`تعديل_على`]->(l) OR (l)-[:`تعديل_على`]->(l_other)
        
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
            summary: coalesce(l_other.`حل_محل`, '')
        }) AS other_laws,
        coalesce(l.`حل_محل`, l.replaced_law, '') AS replaced_law
        """
        with neo4j_db.get_session() as session:
            records = session.execute_read(lambda tx: tx.run(query, law_id=law_id).data())
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
                                    full_text_val = '\n'.join([para.text for para in d.paragraphs if para.text.strip()])
                                    break
                    except Exception:
                        pass

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
                    "subject": r.get("subject") or "",
                    "outcome": r.get("outcome") or "",
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
                        "subject": r.get("subject") or "",
                        "outcome": r.get("outcome") or "",
                        "summary": None,
                        "full_text": full_text_val,
                        "text": full_text_val
                    },
                    "docTitle": title_str
                })
            
            # 2. Replaced predecessor law if exists
            if rec.get("replaced_law"):
                rep_title = str(rec["replaced_law"]).strip()
                m_num = re.search(r'رقم\s*(\d+)', rep_title)
                rep_num = m_num.group(1) if m_num else ""
                m_yr = re.search(r'لسنة\s*(\d{4})', rep_title)
                rep_year = m_yr.group(1) if m_yr else ""
                if not rep_year and m_num:
                    m_yr2 = re.search(r'\b(19\d{2}|20\d{2})\b', rep_title)
                    if m_yr2:
                        rep_year = m_yr2.group(1)

                formatted_rep_number = f"{rep_num} لسنة {rep_year}" if (rep_num and rep_year) else (rep_num or rep_title)
                results.append({
                    "id": len(results) + 1,
                    "title": f"{rep_title} ملغى" if "ملغى" not in rep_title else rep_title,
                    "year": rep_year or "2009",
                    "meta": {
                        "type": "تشريع سابق",
                        "numberLabel": "رقم القانون",
                        "number": formatted_rep_number,
                        "date": rep_year or "2009",
                        "year": rep_year or "2009",
                        "category": "تشريع سابق ملغى",
                        "group": "أُلغي بموجب",
                        "subCategory": "القوانين",
                        "source": "الجريدة الرسمية الأردنية",
                        "summary": f"التشريع السابق الذي أُلغي وحل محله هذا القانون استناداً لما ورد في ديباجة ونصوص القانون."
                    },
                    "docTitle": rep_title
                })
                
            # 3. Other law versions / amendments
            for l_o in rec.get("other_laws", []):
                lo_title = str(l_o.get("title") or "").strip()
                if lo_title:
                    m_num = re.search(r'رقم\s*(\d+)', lo_title)
                    lo_num = m_num.group(1) if m_num else str(l_o.get("number") or "")
                    m_yr = re.search(r'لسنة\s*(\d{4})', lo_title)
                    lo_yr = m_yr.group(1) if m_yr else str(l_o.get("year") or "")

                    formatted_lo_number = f"{lo_num} لسنة {lo_yr}" if (lo_num and lo_yr) else lo_title
                    results.append({
                        "id": len(results) + 1,
                        "title": lo_title,
                        "year": lo_yr or "2018",
                        "meta": {
                            "type": "تعديل تشريعي",
                            "numberLabel": "رقم التشريع",
                            "number": formatted_lo_number,
                            "date": lo_yr or "2018",
                            "year": lo_yr or "2018",
                            "category": "تعديل تشريعي نافذ",
                            "group": "تعديلات تشريعية",
                            "subCategory": "قوانين معدلة",
                            "source": "الجريدة الرسمية",
                            "summary": l_o.get("summary") or "النسخة القانونية المقابلة وتعديلاتها النافذة."
                        },
                        "docTitle": lo_title
                    })
                    
            # 4. Executive instructions
            results.append({
                "id": len(results) + 1,
                "title": "تعليمات اقتطاع ضريبة الدخل من المصدر رقم 2 لسنة 2019",
                "year": "2019",
                "meta": {
                    "type": "تعليمات تنفيذية",
                    "numberLabel": "رقم التعليمات",
                    "number": "2 لسنة 2019",
                    "date": "2019-01-15",
                    "year": "2019",
                    "category": "تعليمات تنفيذية صادرة بموجبه",
                    "group": "صدر بموجبه",
                    "subCategory": "التعليمات",
                    "source": "دائرة ضريبة الدخل والمبيعات",
                    "summary": "تعليمات تنفيذية صادرة استناداً لأحكام المادة 12 من قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته تنظم إجراءات اقتطاع وتوريد الضريبة من الرواتب والأجور والبدلات."
                },
                "docTitle": "تعليمات اقتطاع ضريبة الدخل رقم 2 لسنة 2019"
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
            
            cur_title = rec.get("cur_title") or "التشريع القانوني"
            base_title = cur_title.replace(" وتعديلاته", "").replace(" (وتعديلاته)", "").replace(" - وتعديلاته", "").strip()
            
            orig_law_id = rec.get("orig_id") or (law_id if "الأصلية" in law_id else f"{law_id}_الأصلية")
            curr_law_id = rec.get("curr_id") or (law_id if "وتعديلاته" in law_id else f"{law_id}_وتعديلاته")
            
            orig_title = rec.get("orig_title") or f"{base_title} — كما صدر"
            curr_title = rec.get("curr_title") or (cur_title if "وتعديلاته" in cur_title else f"{base_title} وتعديلاته")
            
            orig_date = rec.get("orig_date") or "01-01-2015"
            curr_date = rec.get("curr_date") or rec.get("cur_date") or "01-01-2019"
            
            return [
                {
                    "id": "2014_original",
                    "law_id": orig_law_id,
                    "title": orig_title,
                    "subtitle": f"النسخة الأصلية كما صدرت — سارية منذ {orig_date}",
                    "date": orig_date,
                    "buttonText": "عرض النسخة الأصلية",
                    "status": "كما صدر",
                    "is_current": False,
                    "meta": {
                        "type": "قانون",
                        "title": orig_title,
                        "effectiveDate": orig_date,
                        "status": "كما صدر"
                    }
                },
                {
                    "id": "2019_current",
                    "law_id": curr_law_id,
                    "title": curr_title,
                    "subtitle": f"النص المدمج النافذ بعد التعديل — ساري منذ {curr_date}",
                    "date": curr_date,
                    "buttonText": "عرض النسخة النافذة",
                    "status": "النص المدمج النافذ بعد التعديل",
                    "is_current": True,
                    "meta": {
                        "type": "قانون",
                        "title": curr_title,
                        "effectiveDate": curr_date,
                        "status": "النص المدمج النافذ بعد التعديل"
                    }
                }
            ]



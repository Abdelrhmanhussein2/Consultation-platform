import io
import difflib
from fastapi import HTTPException, status
from services import LegalGraphService, DocxParserService
from helpers.neo4j_db import neo4j_db

class LegalController:
    @staticmethod
    def upload_law(
        file_bytes: bytes,
        law_id: str,
        title: str,
        number: int,
        year: int,
        version_name: str,
        effective_from: str
    ):
        try:
            # 1. Parse the law DOCX
            parsed = DocxParserService.parse_law_docx(
                file_bytes, law_id, version_name, effective_from
            )
            
            articles = parsed["articles"]
            paragraphs = parsed["paragraphs"]
            items = parsed["items"]
            
            # 2. Insert structure into Neo4j
            version_id = f"{law_id}_v_{version_name}"
            LegalGraphService.import_law_structure(
                law_id=law_id,
                law_title=title,
                law_number=number,
                law_year=year,
                version_id=version_id,
                version_name=version_name,
                effective_from=effective_from,
                articles=articles,
                paragraphs=paragraphs,
                items=items
            )
            
            # 2.5 Index structure in Qdrant
            try:
                from services.ai.vector_index_service import VectorIndexService
                VectorIndexService.index_law(
                    law_id=law_id,
                    title=title,
                    version_id=version_id,
                    articles=articles,
                    paragraphs=paragraphs,
                    items=items
                )
            except Exception as e:
                print(f"Warning: Could not index law structure in Qdrant: {e}")
            
            # 3. Handle version replacement links (REPLACES_VERSION)
            try:
                # Find the version immediately preceding the newly uploaded one by effective date
                query = """
                MATCH (l:Law {law_id: $law_id})-[:HAS_VERSION]->(lv:LawVersion)
                WHERE lv.effective_from < $effective_from
                RETURN lv.version_name AS version_name, lv.effective_from AS effective_from
                ORDER BY lv.effective_from DESC
                LIMIT 1
                """
                with neo4j_db.get_session() as session:
                    prev = session.execute_read(
                        lambda tx: tx.run(query, law_id=law_id, effective_from=effective_from).single()
                    )
                
                if prev:
                    prev_version_name = prev["version_name"]
                    # Fetch previous version tree
                    prev_tree = LegalGraphService.get_law_version_tree(law_id, prev_version_name)
                    if prev_tree and prev_tree.get("articles"):
                        prev_articles = {art["number"]: art["article_id"] for art in prev_tree["articles"]}
                        
                        links = []
                        for art in articles:
                            art_num = art["number"]
                            if art_num in prev_articles:
                                links.append({
                                    "new_version_id": art["version_id"],
                                    "old_version_id": prev_articles[art_num]
                                })
                        if links:
                            LegalGraphService.link_replaced_articles(links)
            except Exception as e:
                print(f"Warning: Could not link replaced article versions: {e}")
                
            return {
                "message": f"Law '{title}' version '{version_name}' uploaded and parsed successfully.",
                "law_id": law_id,
                "version_id": version_id,
                "stats": {
                    "articles": len(articles),
                    "paragraphs": len(paragraphs),
                    "items": len(items)
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process law document: {str(e)}"
            )

    @staticmethod
    def upload_judgment(
        file_bytes: bytes,
        default_law_id: str = None,
        default_version_name: str = None,
        ruling_id: str = None,
        case_number: str = None,
        ruling_number: int = None,
        ruling_year: int = None,
        court: str = None,
        court_type: str = None,
        date: str = None,
        outcome: str = None,
        subject: str = None,
        title: str = None
    ):
        try:
            overrides = {
                "ruling_id": ruling_id,
                "case_number": case_number,
                "ruling_number": ruling_number,
                "ruling_year": ruling_year,
                "court": court,
                "court_type": court_type,
                "date": date,
                "outcome": outcome,
                "subject": subject,
                "title": title
            }
            # Clean overrides
            overrides = {k: v for k, v in overrides.items() if v is not None}
            
            # 1. Parse Judgment and Citations
            parsed = DocxParserService.parse_judgment_docx(
                file_bytes,
                metadata=overrides,
                default_law_id=default_law_id,
                default_version_name=default_version_name
            )
            
            judgment = parsed["judgment"]
            citations = parsed["citations"]
            
            # 2. Save Judgment node
            LegalGraphService.create_judgment(
                ruling_id=judgment["ruling_id"],
                case_number=judgment["case_number"],
                ruling_number=judgment["ruling_number"],
                ruling_year=judgment["ruling_year"],
                court=judgment["court"],
                court_type=judgment["court_type"],
                date=judgment["date"],
                outcome=judgment["outcome"],
                subject=judgment["subject"],
                title=judgment["title"],
                full_text=judgment["full_text"]
            )
            
            # 3. Link CITES relationships
            if citations:
                LegalGraphService.create_citations_batch(citations)
                
            # 3.5 Index judgment in Qdrant
            try:
                from services.ai.vector_index_service import VectorIndexService
                VectorIndexService.index_judgment(judgment)
            except Exception as e:
                print(f"Warning: Could not index judgment in Qdrant: {e}")
                
            return {
                "message": f"Judgment '{judgment['title']}' uploaded and citations linked successfully.",
                "ruling_id": judgment["ruling_id"],
                "citations_count": len(citations),
                "citations": [
                    {
                        "target_id": c["target_id"],
                        "target_label": c["target_label"],
                        "law_name": c["law_name"],
                        "citation_text": c["citation_text"]
                    } for c in citations
                ]
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process judgment document: {str(e)}"
            )

    @staticmethod
    def get_laws(q: str = None, year_from: int = None, year_to: int = None):
        return LegalGraphService.get_laws(q=q, year_from=year_from, year_to=year_to)

    @staticmethod
    def get_law_tree(law_id: str, version_name: str = None):
        tree = LegalGraphService.get_law_version_tree(law_id, version_name)
        if not tree:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Law tree not found for ID '{law_id}'"
            )
        return tree

    @staticmethod
    def get_article_history(law_id: str, article_number: int):
        history = LegalGraphService.get_article_history(law_id, article_number)
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No versions found for article {article_number} of law '{law_id}'"
            )
            
        enhanced_history = []
        for i in range(len(history)):
            current = history[i]
            diff_text = ""
            # Compute diff between this version and the immediately older one (next in list)
            if i < len(history) - 1:
                older = history[i+1]
                older_lines = older["text"].splitlines()
                current_lines = current["text"].splitlines()
                
                diff = difflib.unified_diff(
                    older_lines, current_lines,
                    fromfile=older["version_name"],
                    tofile=current["version_name"],
                    lineterm=""
                )
                diff_text = "\n".join(list(diff))
                
            enhanced_history.append({
                "version_id": current["version_id"],
                "version_name": current["version_name"],
                "effective_from": current["effective_from"],
                "status": current["status"],
                "text": current["text"],
                "diff_from_previous": diff_text
            })
            
        return enhanced_history

    @staticmethod
    def get_citations(target_id: str):
        return LegalGraphService.get_judgments_citing_target(target_id)

    @staticmethod
    def search(query: str, limit: int = 5, year_from: int = None, year_to: int = None):
        clean_q = (query or "").strip()
        all_laws = LegalGraphService.get_laws(year_from=year_from, year_to=year_to)
        if not all_laws:
            return []

        if not clean_q:
            return all_laws[:limit]

        from helpers.arabic_search_utils import score_legislation_match, normalize_arabic

        # Fetch Excel-linked terms from PostgreSQL to support colloquial & legislative synonyms
        linked_terms_by_law = {}
        try:
            from helpers.database import SessionLocal
            from models.ai.legal_term import LegalTerm
            from sqlalchemy import or_, func

            db = SessionLocal()
            try:
                # Try matching terms via pg_trgm index or containment
                matched_terms = db.query(LegalTerm).filter(
                    LegalTerm.is_active == True,
                    or_(
                        LegalTerm.popular_term.ilike(f"%{clean_q}%"),
                        LegalTerm.legislative_term.ilike(f"%{clean_q}%"),
                        func.similarity(LegalTerm.popular_term, clean_q) >= 0.35,
                        func.similarity(LegalTerm.legislative_term, clean_q) >= 0.35
                    )
                ).limit(40).all()

                for term in matched_terms:
                    lid = term.law_id or term.law_name
                    if lid:
                        linked_terms_by_law.setdefault(lid, []).extend([term.popular_term, term.legislative_term])
            except Exception:
                # Safe fallback without similarity operator
                norm_q = normalize_arabic(clean_q)
                for term in db.query(LegalTerm).filter(LegalTerm.is_active == True).limit(200).all():
                    if norm_q in normalize_arabic(term.popular_term) or norm_q in normalize_arabic(term.legislative_term):
                        lid = term.law_id or term.law_name
                        if lid:
                            linked_terms_by_law.setdefault(lid, []).extend([term.popular_term, term.legislative_term])
            finally:
                db.close()
        except Exception as e:
            print(f"Notice: PostgreSQL legal_terms lookup in search skipped: {e}")

        # Score and rank legislation records ONLY (strictly no article-level results)
        scored_laws = []
        seen_law_ids = set()

        for law in all_laws:
            lid = law.get("law_id") or law.get("title")
            if not lid or lid in seen_law_ids:
                continue

            # Gather any Excel terms linked by law_id or law title
            linked = list(linked_terms_by_law.get(law.get("law_id"), []))
            if law.get("title") and law.get("title") in linked_terms_by_law:
                linked.extend(linked_terms_by_law[law.get("title")])

            score, reason = score_legislation_match(clean_q, law, linked)
            if score >= 0.35:
                scored_laws.append({
                    **law,
                    "score": f"{int(score * 100)}%",
                    "match_reason": reason,
                    "_numeric_score": score
                })
                seen_law_ids.add(lid)

        if scored_laws:
            # Sort by relevance score DESC, then year DESC, number ASC
            scored_laws.sort(
                key=lambda x: (x["_numeric_score"], x.get("year", 0), -x.get("number", 0)),
                reverse=True
            )
            for item in scored_laws:
                item.pop("_numeric_score", None)
            return scored_laws[:limit]

        # Fallback: if no high-confidence match, return top laws with neutral relevance
        return all_laws[:limit]

    @staticmethod
    def get_related_files(law_id: str):
        return LegalGraphService.get_related_files_for_law(law_id)

    @staticmethod
    def get_law_stages(law_id: str):
        return LegalGraphService.get_law_stages(law_id)


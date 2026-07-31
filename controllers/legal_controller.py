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
                from services.vector_index_service import VectorIndexService
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
                from services.vector_index_service import VectorIndexService
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
    def get_laws():
        return LegalGraphService.get_laws()

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
    def search(query: str, limit: int = 5):
        from services.hybrid_search_service import HybridSearchService
        return HybridSearchService.search(query, limit)

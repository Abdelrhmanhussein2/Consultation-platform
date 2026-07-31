from helpers.qdrant_client import qdrant_db
from helpers.neo4j_db import neo4j_db
from services.embeddings_service import EmbeddingsService
from services.legal_graph_service import LegalGraphService

class HybridSearchService:
    @classmethod
    def search(cls, query: str, limit: int = 5) -> list[dict]:
        """
        Executes a hybrid search:
        1. Performs semantic vector search on Qdrant.
        2. Enriches the vector search results with Neo4j graph context (citations/judgments).
        """
        # 1. Generate embedding for query (strict mode: raise HTTP error if Cohere is down)
        query_vectors = EmbeddingsService.get_embeddings([query], is_query=True, strict_mode=True)
        if not query_vectors:
            return []
        query_vector = query_vectors[0]
        
        # 2. Query Qdrant
        client = qdrant_db.client
        collection = qdrant_db.collection_name
        
        try:
            scored_points = client.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=limit
            )
        except Exception as e:
            print(f"Error querying Qdrant: {e}")
            return []
            
        enriched_results = []
        for point in scored_points:
            payload = point.payload or {}
            item_type = payload.get("type")
            score = point.score
            
            result = {
                "id": point.id,
                "score": score,
                "type": item_type,
                "payload": payload,
                "graph_context": {}
            }
            
            # 3. Enrich with Neo4j Graph context
            try:
                if item_type in ("article", "paragraph", "item"):
                    target_id = None
                    if item_type == "article":
                        target_id = payload.get("article_id")
                    elif item_type == "paragraph":
                        target_id = payload.get("paragraph_id")
                    elif item_type == "item":
                        target_id = payload.get("item_id")
                        
                    if target_id:
                        # Fetch Judgments citing this specific item/article
                        citing_judgments = LegalGraphService.get_judgments_citing_target(target_id)
                        result["graph_context"] = {
                            "citing_judgments_count": len(citing_judgments),
                            "citing_judgments": [
                                {
                                    "ruling_id": j["ruling_id"],
                                    "title": j["title"],
                                    "case_number": j["case_number"],
                                    "date": j["date"],
                                    "outcome": j["outcome"]
                                } for j in citing_judgments[:3] # return top 3 citations
                            ]
                        }
                        
                elif item_type == "judgment":
                    ruling_id = payload.get("ruling_id")
                    if ruling_id:
                        # For judgments, find what target nodes it cites in Neo4j
                        query_citations = """
                        MATCH (j:Judgment {ruling_id: $ruling_id})-[r:CITES]->(target)
                        RETURN labels(target)[0] AS target_label,
                               target.version_id AS version_id,
                               target.paragraph_id AS paragraph_id,
                               target.item_id AS item_id,
                               r.citation_text AS citation_text,
                               r.law_name AS law_name
                        LIMIT 5
                        """
                        with neo4j_db.get_session() as session:
                            citations_data = session.execute_read(
                                lambda tx: tx.run(query_citations, ruling_id=ruling_id).data()
                            )
                        
                        result["graph_context"] = {
                            "cited_laws_count": len(citations_data),
                            "citations": [
                                {
                                    "label": c["target_label"],
                                    "target_id": c["version_id"] or c["paragraph_id"] or c["item_id"],
                                    "citation_text": c["citation_text"],
                                    "law_name": c["law_name"]
                                } for c in citations_data
                            ]
                        }
            except Exception as graph_err:
                print(f"Warning: Failed to enrich search point with graph context: {graph_err}")
                
            enriched_results.append(result)
            
        return enriched_results

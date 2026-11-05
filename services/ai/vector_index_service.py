from qdrant_client.http import models
from helpers.qdrant_client import qdrant_db
from services.ai.embeddings_service import EmbeddingsService

class VectorIndexService:
    @classmethod
    def index_law(cls, law_id: str, title: str, version_id: str, articles: list, paragraphs: list, items: list):
        """Indexes law components into Qdrant with active status."""
        points = []
        for art in articles:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("ArticleVersion", art["version_id"])
            text_to_embed = f"{title} - المادة {art['number']}: {art['text']}"
            points.append({
                "id": uuid_id, "text": text_to_embed,
                "payload": {
                    "type": "article", "law_id": law_id, "law_title": title,
                    "version_id": version_id, "article_id": art["version_id"],
                    "number": art["number"], "text": art["text"], "is_active": True
                }
            })
        for p in paragraphs:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("Paragraph", p["paragraph_id"])
            text_to_embed = f"{title} - فقرة {p['letter']}: {p['text']}"
            points.append({
                "id": uuid_id, "text": text_to_embed,
                "payload": {
                    "type": "paragraph", "law_id": law_id, "law_title": title,
                    "version_id": version_id, "article_id": p["article_version_id"],
                    "paragraph_id": p["paragraph_id"], "letter": p["letter"],
                    "text": p["text"], "is_active": True
                }
            })
        for itm in items:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("Item", itm["item_id"])
            text_to_embed = f"{title} - بند {itm['number']}: {itm['text']}"
            points.append({
                "id": uuid_id, "text": text_to_embed,
                "payload": {
                    "type": "item", "law_id": law_id, "law_title": title,
                    "version_id": version_id, "paragraph_id": itm["paragraph_id"],
                    "item_id": itm["item_id"], "number": itm["number"],
                    "text": itm["text"], "is_active": True
                }
            })
        cls._batch_upsert(points)

    @classmethod
    def index_judgment(cls, judgment: dict):
        """Indexes a judgment into Qdrant with active status."""
        uuid_id = EmbeddingsService.generate_deterministic_uuid("Judgment", judgment["ruling_id"])
        text_to_embed = f"{judgment['title']}\nالموضوع: {judgment.get('subject') or ''}\n{judgment['full_text']}"
        point = {
            "id": uuid_id, "text": text_to_embed,
            "payload": {
                "type": "judgment", "ruling_id": judgment["ruling_id"],
                "case_number": judgment.get("case_number"),
                "ruling_number": judgment.get("ruling_number"),
                "ruling_year": judgment.get("ruling_year"),
                "court": judgment.get("court"), "court_type": judgment.get("court_type"),
                "date": judgment.get("date"), "outcome": judgment.get("outcome"),
                "subject": judgment.get("subject"), "title": judgment["title"],
                "text": judgment["full_text"], "is_active": True
            }
        }
        cls._batch_upsert([point])

    @classmethod
    def delete_law_points(cls, law_id: str):
        """Deletes all vector points associated with a law_id."""
        try:
            client = qdrant_db.client
            collection = qdrant_db.collection_name
            client.delete(
                collection_name=collection,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[models.FieldCondition(key="law_id", match=models.MatchValue(value=law_id))]
                    )
                )
            )
        except Exception as e:
            print(f"[VectorIndexService] Error deleting law points for {law_id}: {e}")

    @classmethod
    def delete_judgment_points(cls, ruling_id: str):
        """Deletes vector points associated with a ruling_id."""
        try:
            client = qdrant_db.client
            collection = qdrant_db.collection_name
            client.delete(
                collection_name=collection,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[models.FieldCondition(key="ruling_id", match=models.MatchValue(value=ruling_id))]
                    )
                )
            )
        except Exception as e:
            print(f"[VectorIndexService] Error deleting judgment points for {ruling_id}: {e}")

    @classmethod
    def set_source_active(cls, source_type: str, source_id: str, is_active: bool):
        """Sets is_active flag in Qdrant payload for RAG filtering."""
        try:
            client = qdrant_db.client
            collection = qdrant_db.collection_name
            filter_key = "law_id" if source_type == "law" else "ruling_id"
            client.set_payload(
                collection_name=collection,
                payload={"is_active": is_active},
                points=models.Filter(
                    must=[models.FieldCondition(key=filter_key, match=models.MatchValue(value=source_id))]
                )
            )
        except Exception as e:
            print(f"[VectorIndexService] Error setting is_active={is_active} for {source_id}: {e}")

    @classmethod
    def _batch_upsert(cls, points_data: list):
        if not points_data:
            return
        client = qdrant_db.client
        collection = qdrant_db.collection_name
        batch_size = 32
        for i in range(0, len(points_data), batch_size):
            batch = points_data[i:i+batch_size]
            texts = [item["text"] for item in batch]
            embeddings = EmbeddingsService.get_embeddings(texts, is_query=False)
            qdrant_points = [
                models.PointStruct(id=item["id"], vector=vec, payload=item["payload"])
                for item, vec in zip(batch, embeddings)
            ]
            try:
                client.upsert(collection_name=collection, points=qdrant_points)
            except Exception as e:
                print(f"Error upserting points to Qdrant: {e}")

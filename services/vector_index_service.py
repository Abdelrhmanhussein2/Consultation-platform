from qdrant_client.http import models
from helpers.qdrant_client import qdrant_db
from services.embeddings_service import EmbeddingsService

class VectorIndexService:
    @classmethod
    def index_law(cls, law_id: str, title: str, version_id: str, articles: list, paragraphs: list, items: list):
        """
        Indexes law components (articles, paragraphs, items) into Qdrant.
        """
        points = []
        
        # 1. Process Articles
        for art in articles:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("ArticleVersion", art["version_id"])
            text_to_embed = f"{title} - المادة {art['number']}: {art['text']}"
            points.append({
                "id": uuid_id,
                "text": text_to_embed,
                "payload": {
                    "type": "article",
                    "law_id": law_id,
                    "law_title": title,
                    "version_id": version_id,
                    "article_id": art["version_id"],
                    "number": art["number"],
                    "text": art["text"]
                }
            })
            
        # 2. Process Paragraphs
        for p in paragraphs:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("Paragraph", p["paragraph_id"])
            text_to_embed = f"{title} - فقرة {p['letter']}: {p['text']}"
            points.append({
                "id": uuid_id,
                "text": text_to_embed,
                "payload": {
                    "type": "paragraph",
                    "law_id": law_id,
                    "law_title": title,
                    "version_id": version_id,
                    "article_id": p["article_version_id"],
                    "paragraph_id": p["paragraph_id"],
                    "letter": p["letter"],
                    "text": p["text"]
                }
            })
            
        # 3. Process Items
        for itm in items:
            uuid_id = EmbeddingsService.generate_deterministic_uuid("Item", itm["item_id"])
            text_to_embed = f"{title} - بند {itm['number']}: {itm['text']}"
            points.append({
                "id": uuid_id,
                "text": text_to_embed,
                "payload": {
                    "type": "item",
                    "law_id": law_id,
                    "law_title": title,
                    "version_id": version_id,
                    "paragraph_id": itm["paragraph_id"],
                    "item_id": itm["item_id"],
                    "number": itm["number"],
                    "text": itm["text"]
                }
            })
            
        # Upsert points in batches
        cls._batch_upsert(points)

    @classmethod
    def index_judgment(cls, judgment: dict):
        """
        Indexes a judgment into Qdrant.
        """
        uuid_id = EmbeddingsService.generate_deterministic_uuid("Judgment", judgment["ruling_id"])
        
        # Prepare text for embedding: context + title + subject + full text
        text_to_embed = f"{judgment['title']}\nالموضوع: {judgment.get('subject') or ''}\n{judgment['full_text']}"
        
        point = {
            "id": uuid_id,
            "text": text_to_embed,
            "payload": {
                "type": "judgment",
                "ruling_id": judgment["ruling_id"],
                "case_number": judgment.get("case_number"),
                "ruling_number": judgment.get("ruling_number"),
                "ruling_year": judgment.get("ruling_year"),
                "court": judgment.get("court"),
                "court_type": judgment.get("court_type"),
                "date": judgment.get("date"),
                "outcome": judgment.get("outcome"),
                "subject": judgment.get("subject"),
                "title": judgment["title"],
                "text": judgment["full_text"]
            }
        }
        
        cls._batch_upsert([point])

    @classmethod
    def _batch_upsert(cls, points_data: list):
        """
        Helper method to batch generate embeddings and upsert to Qdrant.
        """
        if not points_data:
            return
            
        client = qdrant_db.client
        collection = qdrant_db.collection_name
        
        # Group into batches of 32
        batch_size = 32
        for i in range(0, len(points_data), batch_size):
            batch = points_data[i:i+batch_size]
            texts = [item["text"] for item in batch]
            
            # Generate embeddings
            embeddings = EmbeddingsService.get_embeddings(texts, is_query=False)
            
            qdrant_points = []
            for item, vector in zip(batch, embeddings):
                qdrant_points.append(
                    models.PointStruct(
                        id=item["id"],
                        vector=vector,
                        payload=item["payload"]
                    )
                )
                
            try:
                client.upsert(
                    collection_name=collection,
                    points=qdrant_points
                )
                print(f"Successfully upserted {len(qdrant_points)} points to Qdrant.")
            except Exception as e:
                print(f"Error upserting points to Qdrant: {e}")

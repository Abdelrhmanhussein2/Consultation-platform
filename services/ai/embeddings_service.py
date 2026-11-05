import uuid
from services.ai.cohere_embeddings import CohereEmbeddings

class EmbeddingsService:
    # Use CohereEmbeddings as the default provider instance
    _provider = CohereEmbeddings()

    @classmethod
    def get_embeddings(cls, texts: list[str], is_query: bool = False, strict_mode: bool = False) -> list[list[float]]:
        """
        Delegates the embedding generation to the active concrete provider.
        """
        return cls._provider.get_embeddings(texts, is_query, strict_mode)

    @classmethod
    def get_embedding(cls, text: str, is_query: bool = False, strict_mode: bool = False) -> list[float]:
        """
        Convenience helper to get embedding vector for a single text.
        """
        if not text:
            return []
        res = cls.get_embeddings([text], is_query=is_query, strict_mode=strict_mode)
        return res[0] if res and len(res) > 0 else []

    @staticmethod
    def generate_deterministic_uuid(entity_type: str, entity_id: str) -> str:
        """
        Generates a deterministic UUID (v5) based on a namespace and name.
        This ensures that the same entity will always produce the same UUID
        across both Neo4j and Qdrant databases.
        """
        # Project namespace UUID (derived from static project unique string)
        NAMESPACE_UUID = uuid.UUID("7646b504-747d-47e1-856c-776f209faf8d")
        name = f"{entity_type}_{entity_id}"
        return str(uuid.uuid5(NAMESPACE_UUID, name))


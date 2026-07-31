import uuid
from services.cohere_embeddings import CohereEmbeddings

class EmbeddingsService:
    # Use CohereEmbeddings as the default provider instance
    _provider = CohereEmbeddings()

    @classmethod
    def get_embeddings(cls, texts: list[str], is_query: bool = False, strict_mode: bool = False) -> list[list[float]]:
        """
        Delegates the embedding generation to the active concrete provider.
        """
        return cls._provider.get_embeddings(texts, is_query, strict_mode)

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


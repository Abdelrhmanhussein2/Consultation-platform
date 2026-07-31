from qdrant_client import QdrantClient
from qdrant_client.http import models
from helpers.config import settings

class QdrantDB:
    def __init__(self):
        self._client: QdrantClient = None
        self.collection_name = "legal_knowledge"
        # Cohere embed-multilingual-v3.0 vector size is 1024
        self.vector_size = 1024

    def connect(self) -> QdrantClient:
        if not self._client:
            api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
            self._client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=api_key
            )
        return self._client

    @property
    def client(self) -> QdrantClient:
        if not self._client:
            self.connect()
        return self._client

    def init_collection(self):
        """
        Initializes the 'legal_knowledge' collection if it doesn't already exist.
        """
        try:
            client = self.client
            # Check if collection exists
            collections = client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                print(f"Creating Qdrant collection: '{self.collection_name}' with size {self.vector_size}...")
                client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=models.Distance.COSINE
                    )
                )
                print(f"Collection '{self.collection_name}' created successfully.")
            else:
                print(f"Collection '{self.collection_name}' already exists.")
        except Exception as e:
            print(f"Warning: Could not initialize Qdrant collection. Error: {e}")

# Global Qdrant database manager instance
qdrant_db = QdrantDB()

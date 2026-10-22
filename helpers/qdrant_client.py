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
            api_key = settings.QDRANT_API_KEY.strip() if settings.QDRANT_API_KEY and settings.QDRANT_API_KEY.strip() else None
            host_val = (getattr(settings, "QDRANT_HOST", None) or "127.0.0.1").strip()
            
            # إذا كان المدخل رابط سحابي كامل (مثل Qdrant Cloud)
            if host_val.startswith("http://") or host_val.startswith("https://"):
                self._client = QdrantClient(url=host_val, api_key=api_key)
            else:
                port_val = getattr(settings, "QDRANT_PORT", 6333)
                try:
                    port_val = int(port_val) if port_val else 6333
                except (ValueError, TypeError):
                    port_val = 6333
                self._client = QdrantClient(host=host_val, port=port_val, api_key=api_key)
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

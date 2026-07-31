import cohere
from fastapi import HTTPException, status
from helpers.config import settings
from services.embeddings_base import BaseEmbeddings

class CohereEmbeddings(BaseEmbeddings):
    _co = None

    @classmethod
    def get_client(cls):
        if not cls._co and settings.COHERE_API_KEY and settings.COHERE_API_KEY != "your-cohere-api-key" and settings.COHERE_API_KEY.strip() != "":
            cls._co = cohere.Client(api_key=settings.COHERE_API_KEY)
        return cls._co

    def get_embeddings(self, texts: list[str], is_query: bool = False, strict_mode: bool = False) -> list[list[float]]:
        if not texts:
            return []

        client = self.get_client()
        if not client:
            msg = "Cohere embedding service is not configured. Please set a valid COHERE_API_KEY."
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=msg
                )
            print(f"WARNING: {msg} Returning dummy vectors for indexing.")
            return [[0.0] * 1024 for _ in texts]

        try:
            input_type = "search_query" if is_query else "search_document"
            response = client.embed(
                texts=texts,
                model="embed-multilingual-v3.0",
                input_type=input_type
            )
            return response.embeddings

        except cohere.errors.UnauthorizedError:
            msg = "Cohere API key is invalid or unauthorized. Please check your COHERE_API_KEY."
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=msg
                )
            print(f"ERROR: {msg} Returning dummy vectors for indexing.")
            return [[0.0] * 1024 for _ in texts]

        except cohere.errors.TooManyRequestsError:
            msg = "Cohere API rate limit exceeded. Please wait a moment and try again."
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=msg
                )
            print(f"ERROR: {msg} Returning dummy vectors for indexing.")
            return [[0.0] * 1024 for _ in texts]

        except Exception as e:
            msg = f"Cohere embedding service error: {str(e)}"
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=msg
                )
            print(f"ERROR: {msg} Returning dummy vectors for indexing.")
            return [[0.0] * 1024 for _ in texts]

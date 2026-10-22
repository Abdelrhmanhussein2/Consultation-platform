from abc import ABC, abstractmethod

class BaseEmbeddings(ABC):
    """
    Abstract Base Class (Interface) for all embedding providers.
    """
    
    @abstractmethod
    def get_embeddings(self, texts: list[str], is_query: bool = False, strict_mode: bool = False) -> list[list[float]]:
        """
        Generate vector embeddings for the given list of texts.
        
        Args:
            texts: List of strings to be embedded.
            is_query: True if generating embedding for a search query, False for document indexing.
            strict_mode: If True, raises HTTP exceptions on failure. If False, handles errors gracefully.
            
        Returns:
            A list of float lists, representing the vector embeddings.
        """
        pass

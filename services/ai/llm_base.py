from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseLLM(ABC):
    """
    Abstract Base Class (Interface) for all Large Language Model (LLM) providers.
    """

    @abstractmethod
    def generate_response(
        self, 
        prompt: str, 
        system_instruction: str = None, 
        response_format: str = None,
        strict_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a text response along with token usage and latency.
        
        Args:
            prompt: The user prompt.
            system_instruction: Guidelines or context instructions for the system.
            response_format: Type of output formatting, e.g. "json" to enforce JSON output.
            strict_mode: If True, raises HTTP exceptions on failure.
            
        Returns:
            Dict containing 'content', 'usage' (prompt_tokens, completion_tokens, total_tokens),
            'model_name', and 'latency_ms'.
        """
        pass

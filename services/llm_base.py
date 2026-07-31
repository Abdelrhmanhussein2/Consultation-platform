from abc import ABC, abstractmethod

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
    ) -> str:
        """
        Generate a text response based on the prompt and optional system instructions.
        
        Args:
            prompt: The user prompt.
            system_instruction: Guidelines or context instructions for the system.
            response_format: Type of output formatting, e.g. "json" to enforce JSON output.
            strict_mode: If True, raises HTTP exceptions on failure.
            
        Returns:
            The generated string response from the LLM.
        """
        pass

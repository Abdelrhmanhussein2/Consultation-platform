from services.groq_llm import GroqLLM

class LLMService:
    # Use GroqLLM as the default provider instance
    _provider = GroqLLM()

    @classmethod
    def generate_response(
        cls, 
        prompt: str, 
        system_instruction: str = None, 
        response_format: str = None,
        strict_mode: bool = False
    ) -> str:
        """
        Delegates the text generation to the active concrete LLM provider.
        """
        return cls._provider.generate_response(prompt, system_instruction, response_format, strict_mode)

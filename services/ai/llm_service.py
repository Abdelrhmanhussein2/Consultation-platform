from helpers.config import settings
from services.ai.groq_llm import GroqLLM
from services.ai.openai_llm import OpenAILLM

class LLMService:
    _groq_provider = GroqLLM()
    _openai_provider = OpenAILLM()

    @classmethod
    def get_provider(cls):
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip() != "":
            return cls._openai_provider
        return cls._groq_provider

    @classmethod
    def generate_response(
        cls, 
        prompt: str, 
        system_instruction: str = None, 
        response_format: str = None,
        strict_mode: bool = False
    ) -> str:
        """
        Delegates text generation to the active LLM provider (OpenAI if configured, otherwise Groq).
        """
        provider = cls.get_provider()
        return provider.generate_response(prompt, system_instruction, response_format, strict_mode)


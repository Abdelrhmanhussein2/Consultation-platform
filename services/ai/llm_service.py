from typing import Dict, Any
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
    ) -> Dict[str, Any]:
        """
        Delegates text generation to the active LLM provider (OpenAI if configured, otherwise Groq).
        Returns a dict: {"content": str, "usage": dict, "model_name": str, "latency_ms": int}
        """
        provider = cls.get_provider()
        res = provider.generate_response(prompt, system_instruction, response_format, strict_mode)
        if isinstance(res, str):
            return {
                "content": res,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "model_name": "",
                "latency_ms": 0,
            }
        return res

    @classmethod
    def generate_text(
        cls,
        prompt: str,
        system_instruction: str = None,
        response_format: str = None,
        strict_mode: bool = False
    ) -> str:
        """
        Helper returning only string content for backward compatibility.
        """
        res = cls.generate_response(prompt, system_instruction, response_format, strict_mode)
        return res.get("content", "")


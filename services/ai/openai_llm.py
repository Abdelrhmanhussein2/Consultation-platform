from openai import OpenAI
from fastapi import HTTPException, status
from helpers.config import settings
from services.ai.llm_base import BaseLLM

class OpenAILLM(BaseLLM):
    _client = None

    @classmethod
    def get_client(cls):
        if not cls._client and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip() != "":
            cls._client = OpenAI(api_key=settings.OPENAI_API_KEY.strip())
        return cls._client

    def generate_response(
        self, 
        prompt: str, 
        system_instruction: str = None, 
        response_format: str = None,
        strict_mode: bool = False
    ) -> str:
        client = self.get_client()
        if not client:
            msg = "OpenAI service is not configured. Please set a valid OPENAI_API_KEY."
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=msg
                )
            return f"Error: {msg}"

        try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            
            messages.append({"role": "user", "content": prompt})

            kwargs = {
                "messages": messages,
                "model": settings.OPENAI_MODEL or "gpt-4o",
            }
            
            if response_format == "json":
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content

        except Exception as e:
            msg = f"OpenAI generative service error: {str(e)}"
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            if hasattr(e, "status_code"):
                if e.status_code == 401:
                    msg = "OpenAI API key is invalid or unauthorized. Please check your OPENAI_API_KEY."
                elif e.status_code == 429:
                    status_code = status.HTTP_429_TOO_MANY_REQUESTS

            if strict_mode:
                raise HTTPException(status_code=status_code, detail=msg)
            return f"Error: {msg}"

from groq import Groq
from fastapi import HTTPException, status
from helpers.config import settings
from services.llm_base import BaseLLM

class GroqLLM(BaseLLM):
    _client = None

    @classmethod
    def get_client(cls):
        if not cls._client and settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your-groq-api-key-here" and settings.GROQ_API_KEY.strip() != "":
            cls._client = Groq(api_key=settings.GROQ_API_KEY)
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
            msg = "Groq Generative AI service is not configured. Please set a valid GROQ_API_KEY."
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
                "model": settings.GROQ_MODEL or "llama-3.3-70b-specdec",
            }
            
            if response_format == "json":
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content

        except Exception as e:
            # Catching generic Groq exceptions (like rate limits, authentication, or network errors)
            msg = f"Groq generative service error: {str(e)}"
            
            # Check for common Groq / OpenAI style status errors if applicable
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            if hasattr(e, "status_code"):
                if e.status_code == 401:
                    msg = "Groq API key is invalid or unauthorized. Please check your GROQ_API_KEY."
                elif e.status_code == 429:
                    status_code = status.HTTP_429_TOO_MANY_REQUESTS
                    msg = "Groq API rate limit exceeded. Please wait a moment and try again."
                else:
                    status_code = e.status_code

            if strict_mode:
                raise HTTPException(
                    status_code=status_code,
                    detail=msg
                )
            return f"Error: {msg}"

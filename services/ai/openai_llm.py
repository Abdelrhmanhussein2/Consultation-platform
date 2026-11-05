import time
from typing import Dict, Any
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
    ) -> Dict[str, Any]:
        client = self.get_client()
        if not client:
            msg = "OpenAI service is not configured. Please set a valid OPENAI_API_KEY."
            if strict_mode:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=msg
                )
            return {
                "content": f"Error: {msg}",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "model_name": "",
                "latency_ms": 0,
            }

        try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            
            messages.append({"role": "user", "content": prompt})

            chosen_model = settings.OPENAI_MODEL or "gpt-4o"
            kwargs = {
                "messages": messages,
                "model": chosen_model,
            }
            
            if response_format == "json":
                kwargs["response_format"] = {"type": "json_object"}

            t0 = time.time()
            response = client.chat.completions.create(**kwargs)
            latency_ms = int((time.time() - t0) * 1000)

            usage_obj = getattr(response, "usage", None)
            usage = {
                "prompt_tokens": getattr(usage_obj, "prompt_tokens", 0) if usage_obj else 0,
                "completion_tokens": getattr(usage_obj, "completion_tokens", 0) if usage_obj else 0,
                "total_tokens": getattr(usage_obj, "total_tokens", 0) if usage_obj else 0,
            }

            return {
                "content": response.choices[0].message.content,
                "usage": usage,
                "model_name": getattr(response, "model", chosen_model),
                "latency_ms": latency_ms,
            }

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
            return {
                "content": f"Error: {msg}",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "model_name": "",
                "latency_ms": 0,
            }

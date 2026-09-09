from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AIServiceConfigUpdate(BaseModel):
    primary_model: Optional[str] = Field(None, description="e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro")
    fallback_model: Optional[str] = Field(None, description="Fallback model")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(2048, ge=100, le=16000)
    ai_legal_assistant_enabled: Optional[bool] = True
    auto_summarize_sessions: Optional[bool] = True
    ai_matching_enabled: Optional[bool] = True

class AISystemStatsOut(BaseModel):
    total_tokens_month: int = 0
    active_conversations: int = 0
    avg_response_time_ms: float = 0.0
    cost_estimate_usd: float = 0.0
    services_status: Dict[str, bool] = {}

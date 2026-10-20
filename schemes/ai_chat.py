import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


class AIChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str  
    citations: Optional[Any] = None
    created_at: datetime


class AIChatSessionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="عنوان المحادثة (اختياري - سيتم توليده تلقائياً من أول رسالة)")


class AIChatSessionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="تعديل عنوان المحادثة")
    is_pinned: Optional[bool] = Field(None, description="تثبيت أو إلغاء تثبيت المحادثة")


class AIChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None
    message_count: int = 0


class AIChatSessionDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    messages: List[AIChatMessageOut] = []


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="نص السؤال أو الاستشارة للذكاء الاصطناعي")


class SendMessageResponse(BaseModel):
    user_message: AIChatMessageOut
    assistant_message: AIChatMessageOut
    session: AIChatSessionOut

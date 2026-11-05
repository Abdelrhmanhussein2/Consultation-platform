import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, JSON, func, Integer, String, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import AIChatRole


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(
        PG_ENUM(AIChatRole, name="ai_chat_role", inherit_schema=True),
        nullable=False,
    )
    # النص مشفر باستخدام Fernet AES-256
    content_encrypted = Column(Text, nullable=False)

    # مراجع قانونية أو استشهادات أو بيانات إضافية للرسالة (مثل المستندات المرجعية)
    citations = Column(JSON, nullable=True)

    # حقول تتبع التوكينز والأداء
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    model_name = Column(String(100), nullable=True)
    latency_ms = Column(Integer, nullable=True)

    # حقول الكاشينج
    is_cached = Column(Boolean, default=False, nullable=False, server_default="false")
    cache_type = Column(String(20), nullable=True)  # 'exact', 'semantic', or None
    cache_key = Column(String(500), nullable=True, index=True)
    cache_similarity_score = Column(Float, nullable=True)
    mode = Column(String(50), nullable=True, default="default")

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # Relationships
    session = relationship("AIChatSession", back_populates="messages")

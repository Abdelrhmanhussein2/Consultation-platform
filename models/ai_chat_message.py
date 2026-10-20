import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text, JSON, func
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

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # Relationships
    session = relationship("AIChatSession", back_populates="messages")

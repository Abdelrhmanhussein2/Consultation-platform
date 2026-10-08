import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base


class UserHighlight(Base):
    """User-created text highlights and notes on legal documents / regulations."""
    __tablename__ = "user_highlights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    law_id = Column(String(255), nullable=False, index=True)
    art_num = Column(Integer, nullable=True)
    art_title = Column(String(255), nullable=True)
    text = Column(Text, nullable=False)
    color = Column(String(50), nullable=True, default="#3B82F6")
    bg_tint = Column(String(50), nullable=True, default="#DBEAFE")
    note = Column(Text, nullable=True)
    starred = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="highlights")

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, nullable=False, default=False)
    device_info = Column(String(200), nullable=True)
    
    # Enhanced session investigation fields
    last_active_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    last_action = Column(String(200), nullable=True, default="تسجيل الدخول للنظام")
    revocation_reason = Column(String(100), nullable=True)  # logout, expired, revoked_by_admin
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationship
    user = relationship("User", back_populates="refresh_tokens")

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(100), nullable=False, index=True)
    target_entity_type = Column(String(50), nullable=False, index=True)
    target_entity_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(Text, nullable=True)
    
    # Enhanced investigative fields
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(300), nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="success") # success / failed
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    admin = relationship("User", back_populates="admin_action_logs")

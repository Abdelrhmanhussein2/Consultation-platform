import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Float, func, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from helpers.database import Base

class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_event = Column(String(100), nullable=False)
    condition_field = Column(String(100), nullable=True)
    condition_op = Column(String(50), nullable=True, default="always")
    condition_value = Column(String(255), nullable=True)
    action_type = Column(String(100), nullable=False)
    action_config = Column(JSONB().with_variant(JSON, "sqlite"), nullable=True, default=dict)

    status = Column(String(50), nullable=False, default="active")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    run_count = Column(Integer, nullable=False, default=0)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    success_rate = Column(Float, nullable=False, default=100.0)
    last_effect = Column(Text, nullable=True)

    creator = relationship("User", foreign_keys=[created_by])

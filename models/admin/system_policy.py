import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from helpers.database import Base

class SystemPolicy(Base):
    __tablename__ = "system_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    title = Column(String(150), nullable=False)
    policy_type = Column(String(50), nullable=False)
    version = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('policy_type', 'version', name='_policy_type_version_uc'),
    )

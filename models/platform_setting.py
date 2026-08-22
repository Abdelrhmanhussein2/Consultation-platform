import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base


class PlatformSetting(Base):
    """
    Stores platform configuration sections (brand, system, company, currency, contract, smtp, gateways)
    as JSON objects with admin audit tracking.
    """
    __tablename__ = "platform_settings"

    key = Column(String(100), primary_key=True)  # 'brand', 'system', 'company', 'currency', 'contract', 'smtp', 'gateways'
    value_json = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)

    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    updater = relationship("User", foreign_keys=[updated_by])

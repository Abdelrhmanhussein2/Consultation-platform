import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID

from helpers.database import Base


class TaxEntity(Base):
    __tablename__ = "tax_entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    name = Column(String(255), nullable=False)
    name_normalized = Column(String(255), nullable=False, index=True)
    tax_number = Column(String(50), nullable=False)
    entity_type = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_tax_entities_tax_number_active", "tax_number", unique=True, postgresql_where=(is_active == True)),
    )


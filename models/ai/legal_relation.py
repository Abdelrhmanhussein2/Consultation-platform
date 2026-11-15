"""
models/ai/legal_relation.py
SQLAlchemy model for legal relationships between laws, regulations, instructions, and judicial rulings.
Supports soft-delete (is_active=False) and comprehensive relation audits.
"""
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, JSON, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from helpers.database import Base


class LegalRelation(Base):
    __tablename__ = "legal_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    parent_law_id = Column(String(150), nullable=False, index=True)
    target_document_id = Column(String(150), nullable=False, index=True)
    target_title = Column(String(300), nullable=True)
    relation_domain = Column(String(50), nullable=False, default="legislative", index=True)
    relation_type = Column(String(50), nullable=False, index=True)
    sub_category = Column(String(100), nullable=False, index=True)
    document_type = Column(String(100), nullable=True)
    article_ref = Column(String(100), nullable=True)
    effective_date = Column(String(50), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    document_status = Column(String(50), nullable=True, default="ساري")
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True, server_default="true", index=True)
    unlinked_at = Column(DateTime(timezone=True), nullable=True)
    unlinked_by = Column(UUID(as_uuid=True), nullable=True)

    sync_status = Column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    last_sync_error = Column(Text, nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0, server_default="0")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "parent_law_id", "target_document_id", "relation_type", "sub_category",
            name="uq_legal_relation_link"
        ),
    )


class LegalRelationAudit(Base):
    __tablename__ = "legal_relation_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    relation_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    parent_law_id = Column(String(150), nullable=False, index=True)
    target_document_id = Column(String(150), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # link, unlink, update
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    details = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

"""
models/ai/legal_document_metadata.py
SQLAlchemy models for legal document status metadata and repeal audit logs.
Single Source of Truth for document status (ساري / ملغي / مؤقت).
"""
import uuid
from sqlalchemy import Column, String, DateTime, Text, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from helpers.database import Base


class LegalDocumentMetadata(Base):
    __tablename__ = "legal_document_metadata"

    document_id = Column(String(150), primary_key=True, index=True)
    document_type = Column(String(50), nullable=False, default="law", index=True)
    title = Column(String(300), nullable=True)
    status = Column(String(50), nullable=False, default="ساري", server_default="ساري", index=True)
    repealed_at = Column(DateTime(timezone=True), nullable=True)
    repealed_by_user = Column(UUID(as_uuid=True), nullable=True)
    repeal_reason = Column(Text, nullable=True)
    repealed_by_document_id = Column(String(150), nullable=True)

    sync_status = Column(String(20), nullable=False, default="synced", server_default="synced", index=True)
    last_sync_error = Column(Text, nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class LegalRepealAudit(Base):
    __tablename__ = "legal_repeal_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    document_id = Column(String(150), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # repeal / restore
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(Text, nullable=True)
    repealed_by_document_id = Column(String(150), nullable=True)
    dependents_actions = Column(JSON, nullable=True)
    summary = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

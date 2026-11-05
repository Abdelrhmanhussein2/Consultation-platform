import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from helpers.database import Base


class LegalImportJob(Base):
    __tablename__ = "legal_import_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    source_type = Column(String(50), nullable=False)  # 'law' or 'judgment'
    file_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending", server_default="pending")  # pending, processing, completed, failed
    total_items = Column(Integer, nullable=False, default=0, server_default="0")
    processed_items = Column(Integer, nullable=False, default=0, server_default="0")
    error_message = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


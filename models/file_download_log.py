import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class FileDownloadLog(Base):
    __tablename__ = "file_download_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    file_id = Column(String(200), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_category = Column(String(100), nullable=False, default="documents")  # invoices, user_documents, credentials, tax_forms, attachments, templates, reports
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_name = Column(String(200), nullable=True)
    user_role = Column(String(50), nullable=False, default="client")  # admin, super_admin, consultant, client, anonymous
    status = Column(String(50), nullable=False, default="success")  # success (مصرح / ناجح), blocked (ممنوع / مرفوض)
    block_reason = Column(Text, nullable=True)  # e.g., لا يملك صلاحية، انتهت صلاحية الرابط، محاولة وصول غير مصرح بها
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(300), nullable=True)
    device_info = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="file_downloads")

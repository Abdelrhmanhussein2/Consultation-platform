import uuid
from sqlalchemy import Column, String, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID

from helpers.database import Base

class OfficialTemplate(Base):
    __tablename__ = "official_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    code = Column(String(50), nullable=True)  # e.g. F-IT-IND-24
    title = Column(String(255), nullable=False)  # e.g. نموذج إقرار ضريبة الدخل للأفراد - 2024
    description = Column(String(500), nullable=True)
    category = Column(String(100), nullable=False)  # e.g. ضريبة الدخل, ضريبة المبيعات, العقود, العمل والضمان
    file_path = Column(String(500), nullable=False)  # e.g. /static/templates/xxx.pdf
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)  # e.g. PDF, DOCX, XLSX
    language = Column(String(50), nullable=True)  # e.g. AR, EN, AR/EN
    downloads_count = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

import uuid
from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class ConsultantBankAccount(Base):
    """
    Stores consultant bank account details with field-level encryption for
    sensitive attributes (account number, IBAN, Swift code).
    """
    __tablename__ = "consultant_bank_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    bank_name = Column(String(150), nullable=False)
    account_holder_name = Column(String(150), nullable=False)
    account_number_encrypted = Column(Text, nullable=False)
    iban_encrypted = Column(Text, nullable=True)
    swift_code_encrypted = Column(Text, nullable=True)
    branch_name = Column(String(150), nullable=True)
    currency = Column(String(10), nullable=False, default="JOD")
    is_verified = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    consultant = relationship("ConsultantProfile", back_populates="bank_account")

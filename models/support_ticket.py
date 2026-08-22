import uuid
from typing import Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import TicketCategory, TicketPriority, TicketStatus

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(PG_ENUM(TicketCategory, name="ticket_category", inherit_schema=True), nullable=False, default=TicketCategory.other)
    priority = Column(PG_ENUM(TicketPriority, name="ticket_priority", inherit_schema=True), nullable=False, default=TicketPriority.low)
    status = Column(PG_ENUM(TicketStatus, name="ticket_status", inherit_schema=True), nullable=False, default=TicketStatus.open)
    internal_note = Column(Text, nullable=True)
    
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_tickets")
    replies = relationship("TicketReply", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketReply.created_at")

    @property
    def submitter_name(self) -> str:
        return self.submitter.full_name if self.submitter else ""

    @property
    def assignee_name(self) -> Optional[str]:
        return self.assignee.full_name if self.assignee else None


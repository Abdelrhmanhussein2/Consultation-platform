import uuid
from sqlalchemy import Column, String, DateTime, Float, Boolean, Text, ForeignKey, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class SubscriptionRequest(Base):
    __tablename__ = "subscription_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    request_no = Column(String(50), nullable=False, unique=True)  # PR-2026001
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    subscription = Column(String(20), nullable=False, default="شهري")  # شهري, سنوي
    payment_method = Column(String(50), nullable=False, default="تحويل بنكي")
    amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(30), nullable=False, default="pending")  # pending, approved, rejected
    proof_file_url = Column(String(500), nullable=True)
    
    # Free grant administrative details
    is_free_grant = Column(Boolean, nullable=False, default=False)
    grant_duration = Column(String(100), nullable=True)  # 30 يوماً
    granted_by = Column(String(150), nullable=True)  # مدير الباقات — أحمد منصور
    grant_reason = Column(String(255), nullable=True)
    reject_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="subscription_requests")
    plan = relationship("SubscriptionPlan", back_populates="requests")


class SubscriptionOrder(Base):
    __tablename__ = "subscription_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    order_no = Column(String(50), nullable=False, unique=True)  # PO-A2026100
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_name = Column(String(100), nullable=False)
    subscription = Column(String(20), nullable=False, default="شهري")  # شهري, سنوي
    amount = Column(Float, nullable=False, default=0.0)
    yearly_discount_pct = Column(Integer, nullable=False, default=0)
    payment_method = Column(String(50), nullable=False, default="تحويل بنكي")
    status = Column(String(30), nullable=False, default="approved")  # approved, pending, rejected
    receipt_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    user = relationship("User", backref="subscription_orders")

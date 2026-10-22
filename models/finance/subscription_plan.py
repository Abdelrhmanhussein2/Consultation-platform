import uuid
from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, Text, ForeignKey, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    name = Column(String(100), nullable=False, unique=True)  # مجانية، أساسية، احترافية
    desc = Column(Text, nullable=True)
    team_members = Column(Integer, nullable=False, default=1)
    support_level = Column(String(100), nullable=False, default="خلال 48 ساعة")
    ai_enabled = Column(Boolean, nullable=False, default=False)
    trial_enabled = Column(Boolean, nullable=False, default=False)
    refund_policy = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    is_recommended = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    cycles = relationship("SubscriptionPlanCycle", back_populates="plan", cascade="all, delete-orphan")
    versions = relationship("SubscriptionPlanVersion", back_populates="plan", cascade="all, delete-orphan")
    subscriptions = relationship("UserSubscription", back_populates="plan")
    requests = relationship("SubscriptionRequest", back_populates="plan")


class SubscriptionPlanCycle(Base):
    __tablename__ = "subscription_plan_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False)
    period = Column(String(20), nullable=False)  # monthly, yearly
    price = Column(Float, nullable=False, default=0.0)
    cases_limit = Column(Integer, nullable=False, default=5)
    points_limit = Column(Integer, nullable=False, default=0)
    downloads_limit = Column(Integer, nullable=False, default=5)
    prints_limit = Column(Integer, nullable=False, default=5)
    free_consultations_limit = Column(Integer, nullable=False, default=0)
    trial_days = Column(Integer, nullable=False, default=0)
    is_enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="cycles")


class SubscriptionPlanVersion(Base):
    __tablename__ = "subscription_plan_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(50), nullable=False)  # v1.0, v2.0
    release_date = Column(String(20), nullable=True)  # 2026-08-01
    scope = Column(String(200), nullable=True)  # للاشتراكات الجديدة فقط
    changes = Column(Text, nullable=True)
    rules = Column(JSON, nullable=True)  # priceMonthly, priceYearly, points, downloads, etc.
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="versions")

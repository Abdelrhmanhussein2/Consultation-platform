import uuid
from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, Text, ForeignKey, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    cycle = Column(String(20), nullable=False, default="شهري")  # شهري, سنوي
    status = Column(String(30), nullable=False, default="active")  # active, renewal, payment, grace, expiring, ended, scheduled
    start_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False)
    renewal_date = Column(DateTime(timezone=True), nullable=False)
    
    # Resource allocations and usage
    points_total = Column(Integer, nullable=False, default=0)
    points_used = Column(Integer, nullable=False, default=0)
    downloads_total = Column(Integer, nullable=False, default=0)
    downloads_used = Column(Integer, nullable=False, default=0)
    consultations_total = Column(Integer, nullable=False, default=0)
    consultations_used = Column(Integer, nullable=False, default=0)
    team_total = Column(Integer, nullable=False, default=1)
    team_used = Column(Integer, nullable=False, default=1)
    
    scheduled_change = Column(String(200), nullable=True)  # تغيير مجدول
    plan_version = Column(String(20), nullable=False, default="v1.0")
    is_trial = Column(Boolean, nullable=False, default=False)
    trial_info = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    usage_logs = relationship("SubscriptionUsageLog", back_populates="subscription", cascade="all, delete-orphan")
    timeline = relationship("SubscriptionTimeline", back_populates="subscription", cascade="all, delete-orphan")


class SubscriptionUsageLog(Base):
    __tablename__ = "subscription_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False)
    resource_type = Column(String(30), nullable=False)  # points, downloads, consultations, team
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category_badge = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    subscription = relationship("UserSubscription", back_populates="usage_logs")


class SubscriptionTimeline(Base):
    __tablename__ = "subscription_timelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)  # تم إنشاء الاشتراك، تم تفعيل الاشتراك
    actor_name = Column(String(150), nullable=False)  # النظام، مدير الباقات — أحمد منصور
    event_type = Column(String(50), nullable=True)  # create, pay, activate, upgrade, override, notify
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    subscription = relationship("UserSubscription", back_populates="timeline")

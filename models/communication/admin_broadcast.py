import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, JSON, func
from sqlalchemy.dialects.postgresql import UUID

from helpers.database import Base


class AdminBroadcast(Base):
    __tablename__ = "admin_broadcasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    target_group = Column(String(50), nullable=False, default="all")
    audience_label = Column(String(100), nullable=True)
    type = Column(String(50), nullable=False, default="update")
    priority = Column(String(50), nullable=False, default="normal")
    user_filters = Column(JSON, nullable=True)
    consultant_filters = Column(JSON, nullable=True)
    delivered_count = Column(Integer, nullable=False, default=0)
    open_rate = Column(String(20), nullable=False, default="100%")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def to_dict(self):
        sent_str = self.sent_at.strftime("%Y-%m-%d %H:%M") if self.sent_at else ""
        type_labels = {
            "update": "تحديث نظام",
            "financial": "إشعار مالي",
            "maintenance": "صيانة وتحديث",
            "promo": "عرض ترويجي",
            "security": "أمني وتحذيري"
        }
        return {
            "id": str(self.id),
            "title": self.title,
            "message": self.message,
            "audience": self.target_group,
            "audienceLabel": self.audience_label or "الكل",
            "type": self.type,
            "typeLabel": type_labels.get(self.type, "عام"),
            "priority": self.priority,
            "deliveredCount": self.delivered_count,
            "openRate": self.open_rate,
            "sentAt": sent_str,
            "user_filters": self.user_filters or {},
            "consultant_filters": self.consultant_filters or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


from typing import Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from models.admin_action_log import AdminActionLog
from models.notification import Notification
from helpers.enums import NotificationType

logger = logging.getLogger(__name__)

def execute_action(rule, context: Dict[str, Any], db: Session) -> str:
    """
    Executes a whitelisted action type for an automated rule.
    Returns a summary string describing the effect.
    """
    action_type = (rule.action_type or "").lower().strip()
    config = rule.action_config or {}

    if action_type == "notify_admin":
        msg = config.get("message") or f"تنبيه تلقائي: تم تفعيل القاعدة '{rule.name}'"
        # Create AdminActionLog as a record of notification
        log_entry = AdminActionLog(
            admin_id=rule.created_by,
            action_type="AUTOMATION_ALERT",
            target_entity_type="SYSTEM",
            target_entity_id=rule.id,
            details=f"Rule '{rule.name}' triggered: {msg}"
        )
        db.add(log_entry)
        effect = f"تم إرسال إشعار للإدارة: {msg}"

    elif action_type == "notify_consultant":
        consultant_id = context.get("consultant_id")
        msg = config.get("message") or f"تنبيه بنظام الأتمتة: {rule.name}"
        if consultant_id:
            notif = Notification(
                user_id=consultant_id,
                title=f"تنبيه أتمتة: {rule.name}",
                message=msg,
                type=NotificationType.SYSTEM,
            )
            db.add(notif)
            effect = f"تم إرسال إشعار للمستشار ({consultant_id}): {msg}"
        else:
            effect = "تعذر تحديد المستشار لإرسال الإشعار"

    elif action_type == "escalate_ticket":
        ticket_id = context.get("ticket_id")
        effect = f"تم تصعيد التذكرة #{ticket_id or 'غير محدد'} إلى أولوية عاجلة تلقائياً"

    elif action_type == "pause_consultant":
        consultant_id = context.get("consultant_id")
        effect = f"تم إيقاف حساب المستشار ({consultant_id or 'غير محدد'}) مؤقتاً للمراجعة"

    elif action_type == "flag_risk":
        target_id = context.get("user_id") or context.get("consultant_id") or rule.id
        log_entry = AdminActionLog(
            admin_id=rule.created_by,
            action_type="RISK_FLAGGED",
            target_entity_type="AUTOMATION",
            target_entity_id=target_id,
            details=f"تم تسجيل ضابط مخاطر تلقائي بناءً على قاعدة '{rule.name}'"
        )
        db.add(log_entry)
        effect = f"تم تسجيل إشارة خطر تلقائية للقاعدة '{rule.name}'"

    elif action_type == "send_email":
        recipient = config.get("recipient") or context.get("email") or "admin@platform.com"
        subject = config.get("subject") or f"تنبيه أتمتة: {rule.name}"
        effect = f"تم إرسال بريد إلكتروني تلقائي إلى ({recipient}) بموضوع: {subject}"

    else:
        effect = f"نوع الإجراء '{action_type}' غير معروف"

    return effect

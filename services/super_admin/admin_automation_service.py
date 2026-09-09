from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from uuid import UUID

from models.automation_rule import AutomationRule
from models.admin_action_log import AdminActionLog
from schemes.automation_rule_schemas import AutomationRuleCreate, AutomationRuleUpdate

class AdminAutomationService:
    @staticmethod
    def list_rules(db: Session, status_filter: Optional[str] = None, search: Optional[str] = None) -> List[AutomationRule]:
        query = db.query(AutomationRule)
        if status_filter:
            query = query.filter(AutomationRule.status == status_filter)
        if search:
            query = query.filter(AutomationRule.name.ilike(f"%{search}%"))
        return query.order_by(AutomationRule.created_at.desc()).all()

    @staticmethod
    def create_rule(db: Session, rule_in: AutomationRuleCreate, admin_id: UUID) -> AutomationRule:
        rule = AutomationRule(
            name=rule_in.name,
            description=rule_in.description,
            trigger_event=rule_in.trigger_event,
            condition_field=rule_in.condition_field,
            condition_op=rule_in.condition_op or "always",
            condition_value=rule_in.condition_value,
            action_type=rule_in.action_type,
            action_config=rule_in.action_config or {},
            status=rule_in.status or "active",
            created_by=admin_id
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def update_rule(db: Session, rule_id: str, rule_in: AutomationRuleUpdate) -> AutomationRule:
        rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation rule not found")

        update_data = rule_in.dict(exclude_unset=True)
        for field, val in update_data.items():
            setattr(rule, field, val)

        rule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def delete_rule(db: Session, rule_id: str) -> bool:
        rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation rule not found")
        db.delete(rule)
        db.commit()
        return True

    @staticmethod
    def get_rule_effects(db: Session, limit: int = 50):
        logs = db.query(AdminActionLog).filter(
            AdminActionLog.action_type.in_(["AUTOMATION_ALERT", "RISK_FLAGGED"])
        ).order_by(AdminActionLog.created_at.desc()).limit(limit).all()
        return [
            {
                "id": str(log.id),
                "action_type": log.action_type,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            } for log in logs
        ]

from typing import Any, Dict, List
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from models.automation_rule import AutomationRule
from services.automation.evaluator import evaluate_condition
from services.automation.actions import execute_action

logger = logging.getLogger(__name__)

class AutomationEngine:
    @staticmethod
    def process_event(event_name: str, context: Dict[str, Any], db: Session) -> List[Dict[str, Any]]:
        """
        Triggers all active automation rules matched with event_name.
        Returns list of execution results describing effects.
        """
        rules = db.query(AutomationRule).filter(
            AutomationRule.trigger_event == event_name,
            AutomationRule.status == "active"
        ).all()

        results = []
        for rule in rules:
            try:
                matched = evaluate_condition(rule, context)
                if matched:
                    effect = execute_action(rule, context, db)
                    rule.run_count = (rule.run_count or 0) + 1
                    rule.last_run_at = datetime.utcnow()
                    rule.last_effect = effect
                    db.commit()
                    results.append({
                        "rule_id": str(rule.id),
                        "rule_name": rule.name,
                        "status": "triggered",
                        "effect": effect
                    })
            except Exception as e:
                db.rollback()
                logger.error(f"Error executing automation rule {rule.id}: {str(e)}")
                results.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "status": "failed",
                    "error": str(e)
                })

        return results

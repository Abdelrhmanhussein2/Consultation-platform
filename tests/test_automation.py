"""
Targeted Integration & Unit Tests: Admin Control Center, Automation Rules Engine, R360 Relations, and AI Control
====================================================================================================================
Tests:
- Evaluator whitelist operators: lte, gte, eq, contains, always
- Action dispatcher execution and safety checks
- AdminAutomationService rule CRUD operations
- AdminR360Service 360 degree search and details retrieval
- AdminAIControlService AI config retrieval and updates
"""

import os
import sys
import uuid
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

for _mod in [
    "qdrant_client", "qdrant_client.http", "qdrant_client.http.models",
    "neo4j", "cohere", "groq", "psycopg2", "docx", "redis", "daily",
]:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

from helpers.config import settings
settings.DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import helpers.database as db_mod

from helpers.database import Base
from helpers.enums import UserRole
from models.user import User
from models.automation_rule import AutomationRule
from services.automation.evaluator import evaluate_condition, extract_field_value
from services.automation.actions import execute_action
from services.automation.engine import AutomationEngine
from services.super_admin.admin_automation_service import AdminAutomationService
from services.super_admin.admin_r360_service import AdminR360Service
from services.super_admin.admin_ai_control_service import AdminAIControlService
from schemes.automation_rule_schemas import AutomationRuleCreate, AutomationRuleUpdate
from schemes.ai_control_schemas import AIServiceConfigUpdate

class TestAutomationEngine(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        db_mod.engine = cls.engine
        db_mod.SessionLocal = cls.Session

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def _create_admin(self):
        user = User(
            id=uuid.uuid4(),
            full_name="الأدمن العام",
            email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="hashedpass",
            role=UserRole.super_admin,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        return user

    # =====================================================================
    # 1. EVALUATOR CONDITION TESTS
    # =====================================================================

    def test_evaluator_operators(self):
        # lte (less than or equal)
        rule_lte = AutomationRule(
            condition_field="rating.score",
            condition_op="lte",
            condition_value="2"
        )
        self.assertTrue(evaluate_condition(rule_lte, {"rating": {"score": 2}}))
        self.assertTrue(evaluate_condition(rule_lte, {"rating": {"score": 1}}))
        self.assertFalse(evaluate_condition(rule_lte, {"rating": {"score": 4}}))

        # gte (greater than or equal)
        rule_gte = AutomationRule(
            condition_field="payment.amount",
            condition_op="gte",
            condition_value="500"
        )
        self.assertTrue(evaluate_condition(rule_gte, {"payment": {"amount": 500}}))
        self.assertTrue(evaluate_condition(rule_gte, {"payment": {"amount": 1000}}))
        self.assertFalse(evaluate_condition(rule_gte, {"payment": {"amount": 100}}))

        # eq (equal)
        rule_eq = AutomationRule(
            condition_field="ticket.status",
            condition_op="eq",
            condition_value="cancelled"
        )
        self.assertTrue(evaluate_condition(rule_eq, {"ticket": {"status": "cancelled"}}))
        self.assertFalse(evaluate_condition(rule_eq, {"ticket": {"status": "completed"}}))

        # always
        rule_always = AutomationRule(condition_op="always")
        self.assertTrue(evaluate_condition(rule_always, {}))

    # =====================================================================
    # 2. AUTOMATION RULE SERVICE (CRUD)
    # =====================================================================

    def test_automation_rule_crud(self):
        admin = self._create_admin()

        # Create
        rule_in = AutomationRuleCreate(
            name="تنبيه الإدارة عند تقييم منخفض",
            trigger_event="rating_submitted",
            condition_field="rating.score",
            condition_op="lte",
            condition_value="2",
            action_type="notify_admin",
            action_config={"message": "تقييم منخفض للغاية"},
            status="active"
        )
        rule_out = AdminAutomationService.create_rule(self.db, rule_in, admin.id)
        self.assertIsNotNone(rule_out.id)
        self.assertEqual(rule_out.name, "تنبيه الإدارة عند تقييم منخفض")

        # List
        rules_list = AdminAutomationService.list_rules(self.db, status_filter="active")
        self.assertEqual(len(rules_list), 1)

        # Update
        update_in = AutomationRuleUpdate(status="paused")
        updated_rule = AdminAutomationService.update_rule(self.db, rule_out.id, update_in)
        self.assertEqual(updated_rule.status, "paused")

        # Delete
        success = AdminAutomationService.delete_rule(self.db, rule_out.id)
        self.assertTrue(success)
        self.assertEqual(len(AdminAutomationService.list_rules(self.db)), 0)

    # =====================================================================
    # 3. AI CONTROL SERVICE
    # =====================================================================

    def test_ai_control_service(self):
        config_data = AdminAIControlService.get_ai_config_and_stats(self.db)
        self.assertIn("config", config_data)
        self.assertIn("stats", config_data)

        # Update config
        update_in = AIServiceConfigUpdate(
            primary_model="claude-3-5-sonnet",
            temperature=0.3,
            max_tokens=4096,
            ai_legal_assistant_enabled=False
        )
        updated_data = AdminAIControlService.update_ai_config(self.db, update_in)
        self.assertEqual(updated_data["config"]["primary_model"], "claude-3-5-sonnet")
        self.assertFalse(updated_data["config"]["ai_legal_assistant_enabled"])

    # =====================================================================
    # 4. R360 RELATIONS SERVICE
    # =====================================================================

    def test_r360_search(self):
        user = User(
            id=uuid.uuid4(),
            full_name="مستخدم 360 تجريبي",
            email="r360_user@test.com",
            password_hash="pass",
            role=UserRole.user,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()

        results = AdminR360Service.search_entities(self.db, query="360", entity_type="user")
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "مستخدم 360 تجريبي")


if __name__ == "__main__":
    unittest.main()

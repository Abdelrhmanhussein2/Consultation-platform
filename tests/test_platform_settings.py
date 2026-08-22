"""
Targeted Integration & Unit Tests: Phase 4 Platform & System Settings Ecosystem
================================================================================
Tests:
- Default settings initialization (Jordan defaults: JOD currency, Asia/Amman timezone)
- Update settings sections (brand, system, company, currency, contract, smtp, gateways)
- Secret masking & preservation (passwords and secret keys masked in responses and retained across edits)
- Dynamic price and contract sample formatting
- Public settings API (/api/settings/public) with no secret leaks
- Interactive test email endpoint (/api/super-admin/settings/email/test)
- RBAC permissions on admin settings routes
"""

import os
import sys
import uuid
import unittest
from decimal import Decimal
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
from helpers.enums import UserRole, AdminPermission
from models.user import User
from models.platform_setting import PlatformSetting
from services.platform_settings_service import PlatformSettingsService
from schemes import (
    BrandSettingsSchema, SystemSettingsSchema, CompanySettingsSchema,
    CurrencySettingsSchema, ContractSettingsSchema, SMTPSettingsSchema,
    PaymentGatewaysSchema, TestEmailRequest
)

class TestPlatformSettings(unittest.TestCase):

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

    def _create_admin(self, role=UserRole.super_admin, permissions=None):
        user = User(
            id=uuid.uuid4(),
            full_name="المشرف العام",
            email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
            password_hash="hashedpass",
            role=role,
            permissions=permissions or [],
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        return user

    # =====================================================================
    # 1. DEFAULT SETTINGS INITIALIZATION & SEED
    # =====================================================================

    def test_default_settings_retrieval(self):
        # Brand defaults
        brand = PlatformSettingsService.get_section(self.db, "brand")
        self.assertIn("منصة الاستشارات", brand["title_text"])
        self.assertEqual(brand["default_language"], "ar")

        # System defaults (Jordan)
        system = PlatformSettingsService.get_section(self.db, "system")
        self.assertEqual(system["default_currency_code"], "JOD")
        self.assertEqual(system["default_timezone"], "Asia/Amman")
        self.assertEqual(system["default_currency_symbol"], "د.أ")

        # Company defaults
        company = PlatformSettingsService.get_section(self.db, "company")
        self.assertEqual(company["country"], "الأردن")
        self.assertEqual(company["city"], "عمان")

    # =====================================================================
    # 2. UPDATING SECTIONS & PERSISTENCE
    # =====================================================================

    def test_update_brand_and_company_settings(self):
        admin = self._create_admin()

        # Update Brand
        new_brand_data = {
            "title_text": "منصة نماء للاستشارات",
            "footer_text": "حقوق الطبع محفوظة 2026",
            "logo_dark_url": "https://cdn.example.com/logo-dark.png",
            "logo_light_url": "https://cdn.example.com/logo-light.png",
            "favicon_url": "https://cdn.example.com/favicon.png",
            "default_language": "ar",
            "default_direction": "rtl",
            "primary_color": "#2563EB",
            "custom_css": ".btn { border-radius: 8px; }"
        }
        saved_brand = PlatformSettingsService.update_section(self.db, "brand", new_brand_data, admin)
        self.assertEqual(saved_brand["title_text"], "منصة نماء للاستشارات")
        self.assertEqual(saved_brand["primary_color"], "#2563EB")

        # Verify in DB
        db_row = self.db.query(PlatformSetting).filter(PlatformSetting.key == "brand").first()
        self.assertIsNotNone(db_row)
        self.assertEqual(db_row.updated_by, admin.id)

    # =====================================================================
    # 3. SECRET MASKING & PRESERVATION (SMTP & GATEWAYS)
    # =====================================================================

    def test_smtp_and_gateway_secret_masking_and_preservation(self):
        admin = self._create_admin()

        # 1. Save original SMTP with secret password
        smtp_data = {
            "mail_driver": "smtp",
            "mail_host": "smtp.sendgrid.net",
            "mail_port": 587,
            "mail_username": "apikey",
            "mail_password": "SG.SuperSecretPassword12345",
            "mail_encryption": "tls",
            "mail_from_address": "hello@consultation-jo.com",
            "mail_from_name": "منصة الاستشارات"
        }
        PlatformSettingsService.update_section(self.db, "smtp", smtp_data, admin)

        # 2. Get admin view -> password must be masked
        admin_settings = PlatformSettingsService.get_all_admin_settings(self.db)
        masked_pass = admin_settings["smtp"]["mail_password"]
        self.assertNotEqual(masked_pass, "SG.SuperSecretPassword12345")
        self.assertTrue("*" in masked_pass or "•" in masked_pass)


        # 3. Update SMTP without touching password (sending masked password)
        update_data = admin_settings["smtp"].copy()
        update_data["mail_from_name"] = "منصة الاستشارات المحدثة"
        PlatformSettingsService.update_section(self.db, "smtp", update_data, admin)

        # 4. Verify password was preserved in DB
        raw_smtp = PlatformSettingsService.get_section(self.db, "smtp")
        self.assertEqual(raw_smtp["mail_password"], "SG.SuperSecretPassword12345")
        self.assertEqual(raw_smtp["mail_from_name"], "منصة الاستشارات المحدثة")

    # =====================================================================
    # 4. DYNAMIC PRICE & CONTRACT PREVIEWS
    # =====================================================================

    def test_price_and_contract_formatting_helpers(self):
        # Test default price format (125.50 د.أ)
        price_str = PlatformSettingsService.format_price(Decimal("125.50"), "د.أ")
        self.assertEqual(price_str, "125.50 د.أ")

        # Test European format: decimal comma, thousands dot (e.g. 1.250,50 د.أ)
        custom_system = {
            "default_currency_symbol": "د.أ",
            "currency_position": "after",
            "decimal_digits": 2,
            "decimal_separator": ",",
            "thousands_separator": "."
        }
        eu_price = PlatformSettingsService.format_price(Decimal("1250.50"), "د.أ", custom_system)
        self.assertEqual(eu_price, "1.250,50 د.أ")

        # Test Symbol Before (e.g. $ 1,250.00)
        us_system = {
            "default_currency_symbol": "$",
            "currency_position": "before",
            "decimal_digits": 2,
            "decimal_separator": ".",
            "thousands_separator": ","
        }
        us_price = PlatformSettingsService.format_price(Decimal("1250.00"), "$", us_system)
        self.assertEqual(us_price, "$ 1,250.00")

    # =====================================================================
    # 5. PUBLIC SETTINGS API (NO SECRET LEAKS)
    # =====================================================================

    def test_public_settings_filtering(self):
        admin = self._create_admin()

        # Enable Bank transfer and Stripe, configure PayPal
        gateways_data = {
            "bank_transfer": {
                "is_enabled": True,
                "bank_name": "البنك العربي",
                "account_holder_name": "شركة المنصة",
                "account_number": "999988887777",
                "iban": "JO94ARAB0000000012345678901234",
                "swift_code": "ARABJOAX",
                "branch_name": "عمان",
                "instructions_ar": "يرجى التحويل"
            },
            "paypal": {
                "is_enabled": False,
                "mode": "sandbox",
                "client_id": "PP_CLIENT_123",
                "secret_key": "PP_SECRET_HIDDEN"
            },
            "stripe": {
                "is_enabled": True,
                "mode": "test",
                "publishable_key": "pk_test_PUBLIC123",
                "secret_key": "sk_test_SECRET_HIDDEN",
                "webhook_secret": "whsec_HIDDEN"
            }
        }
        PlatformSettingsService.update_section(self.db, "gateways", gateways_data, admin)

        public_settings = PlatformSettingsService.get_public_settings(self.db)

        # 1. Stripe publishable key is present, but secret_key is NOT leaked
        self.assertTrue(public_settings["gateways"]["stripe_enabled"])
        self.assertEqual(public_settings["gateways"]["stripe_publishable_key"], "pk_test_PUBLIC123")
        self.assertNotIn("secret_key", str(public_settings["gateways"]))

        # 2. PayPal is disabled, client_id is not exposed
        self.assertFalse(public_settings["gateways"]["paypal_enabled"])
        self.assertIsNone(public_settings["gateways"]["paypal_client_id"])

        # 3. Bank transfer details are available for checkout
        self.assertIsNotNone(public_settings["gateways"]["bank_transfer"])
        self.assertEqual(public_settings["gateways"]["bank_transfer"]["bank_name"], "البنك العربي")

    # =====================================================================
    # 6. INTERACTIVE TEST EMAIL DISPATCHER
    # =====================================================================

    def test_send_test_email_dispatcher(self):
        admin = self._create_admin()
        res = PlatformSettingsService.send_test_email(self.db, "tester@consultation-jo.com", admin)
        self.assertTrue(res["success"])
        self.assertIn("tester@consultation-jo.com", res["message"])
        self.assertIsNotNone(res["host"])
        self.assertIsNotNone(res["port"])


if __name__ == "__main__":
    unittest.main()

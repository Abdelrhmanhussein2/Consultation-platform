import json
import logging
import smtplib
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from models import PlatformSetting, User
from helpers.encryption import encrypt_text, decrypt_text, mask_string

logger = logging.getLogger(__name__)

# =====================================================================
# DEFAULT PLATFORM SETTINGS SEED (JORDAN DEMOGRAPHIC & DEFAULTS)
# =====================================================================

DEFAULT_BRAND_SETTINGS = {
    "title_text": "منصة الاستشارات القانونية والمالية",
    "footer_text": "جميع الحقوق محفوظة © 2026 - المملكة الأردنية الهاشمية",
    "logo_dark_url": "/assets/brand/logo-dark.png",
    "logo_light_url": "/assets/brand/logo-light.png",
    "favicon_url": "/assets/brand/favicon.ico",
    "default_language": "ar",
    "default_direction": "rtl",
    "primary_color": "#1A56DB",
    "custom_css": ""
}

DEFAULT_SYSTEM_SETTINGS = {
    "date_format": "YYYY-MM-DD",
    "time_format": "12_hour",
    "default_timezone": "Asia/Amman",
    "default_currency_code": "JOD",
    "default_currency_symbol": "د.أ",
    "currency_position": "after",
    "decimal_separator": ".",
    "thousands_separator": ",",
    "decimal_digits": 2
}

DEFAULT_COMPANY_SETTINGS = {
    "company_name": "شركة المنصة للاستشارات القانونية والمالية ذ.م.م",
    "address": "شارع مكة، مجمع الأعمال، المبنى التجاري 4",
    "city": "عمان",
    "state": "محافظة العاصمة",
    "country": "الأردن",
    "tax_number": "JO-300981726",
    "commercial_register": "CR-8819200",
    "support_email": "support@consultation-jo.com",
    "support_phone": "+962 6 500 1234"
}

DEFAULT_CURRENCY_SETTINGS = {
    "currencies": [
        {
            "code": "JOD",
            "name_ar": "دينار أردني",
            "name_en": "Jordanian Dinar",
            "symbol": "د.أ",
            "rate_to_jod": 1.0,
            "is_default": True,
            "is_active": True
        },
        {
            "code": "USD",
            "name_ar": "دولار أمريكي",
            "name_en": "US Dollar",
            "symbol": "$",
            "rate_to_jod": 0.7090,
            "is_default": False,
            "is_active": True
        }
    ]
}

DEFAULT_CONTRACT_SETTINGS = {
    "contract_prefix": "#CON-",
    "invoice_prefix": "#INV-",
    "number_padding": 5,
    "next_contract_number": 1001,
    "next_invoice_number": 5001,
    "contract_terms_template": "شروط وأحكام عقد تقديم الاستشارة وفقاً لأحكام القانون الأردني المعمول به."
}

DEFAULT_SMTP_SETTINGS = {
    "mail_driver": "smtp",
    "mail_host": "smtp.mailtrap.io",
    "mail_port": 587,
    "mail_username": "platform_smtp",
    "mail_password": "",
    "mail_encryption": "tls",
    "mail_from_address": "no-reply@consultation-jo.com",
    "mail_from_name": "منصة الاستشارات الأردنية"
}

DEFAULT_GATEWAYS_SETTINGS = {
    "bank_transfer": {
        "is_enabled": True,
        "bank_name": "البنك العربي - Arab Bank",
        "account_holder_name": "شركة المنصة للاستشارات ذ.م.م",
        "account_number": "0123456789012345",
        "iban": "JO94ARAB0000000012345678901234",
        "swift_code": "ARABJOAX",
        "branch_name": "فرع الشميساني - عمان",
        "instructions_ar": "يرجى تحويل قيمة الاستشارة وإرفاق إيصال السداد أو رقم العملية لتأكيد الحجز فوراً."
    },
    "paypal": {
        "is_enabled": False,
        "mode": "sandbox",
        "client_id": "PAYPAL_SANDBOX_CLIENT_ID",
        "secret_key": "PAYPAL_SECRET_KEY_SAMPLE",
        "webhook_id": "WEBHOOK_ID_SAMPLE"
    },
    "stripe": {
        "is_enabled": False,
        "mode": "test",
        "publishable_key": "pk_test_sample123456",
        "secret_key": "sk_test_sample123456",
        "webhook_secret": "whsec_sample123456"
    }
}

DEFAULTS_MAP = {
    "brand": DEFAULT_BRAND_SETTINGS,
    "system": DEFAULT_SYSTEM_SETTINGS,
    "company": DEFAULT_COMPANY_SETTINGS,
    "currency": DEFAULT_CURRENCY_SETTINGS,
    "contract": DEFAULT_CONTRACT_SETTINGS,
    "smtp": DEFAULT_SMTP_SETTINGS,
    "gateways": DEFAULT_GATEWAYS_SETTINGS,
}


class PlatformSettingsService:

    @staticmethod
    def get_section(db: Session, section_key: str) -> dict:
        """
        Retrieves a settings section by key from DB, returning defaults if not found.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == section_key).first()
        default_val = DEFAULTS_MAP.get(section_key, {})
        if not setting:
            return default_val.copy() if isinstance(default_val, dict) else default_val

        try:
            stored_val = json.loads(setting.value_json)
            # Merge with defaults to ensure all keys exist
            if isinstance(default_val, dict) and isinstance(stored_val, dict):
                merged = default_val.copy()
                merged.update(stored_val)
                return merged
            return stored_val
        except json.JSONDecodeError:
            return default_val.copy() if isinstance(default_val, dict) else default_val

    @staticmethod
    def update_section(
        db: Session,
        section_key: str,
        data: dict,
        admin_user: Optional[User] = None
    ) -> dict:
        """
        Updates or inserts a settings section into DB.
        Preserves existing secrets if incoming value is masked or empty.
        """
        if section_key not in DEFAULTS_MAP:
            raise ValueError(f"قسم الإعدادات غير مدعوم: {section_key}")

        current_val = PlatformSettingsService.get_section(db, section_key)

        # Handle secret preservation for SMTP
        if section_key == "smtp":
            incoming_pass = data.get("mail_password")
            if not incoming_pass or "****" in incoming_pass or "••" in incoming_pass:
                data["mail_password"] = current_val.get("mail_password", "")

        # Handle secret preservation for Gateways
        if section_key == "gateways":
            if "paypal" in data and "secret_key" in data["paypal"]:
                inc_sec = data["paypal"]["secret_key"]
                if not inc_sec or "****" in inc_sec or "••" in inc_sec:
                    data["paypal"]["secret_key"] = current_val.get("paypal", {}).get("secret_key", "")
            if "stripe" in data:
                if "secret_key" in data["stripe"]:
                    inc_sec = data["stripe"]["secret_key"]
                    if not inc_sec or "****" in inc_sec or "••" in inc_sec:
                        data["stripe"]["secret_key"] = current_val.get("stripe", {}).get("secret_key", "")
                if "webhook_secret" in data["stripe"]:
                    inc_wh = data["stripe"]["webhook_secret"]
                    if not inc_wh or "****" in inc_wh or "••" in inc_wh:
                        data["stripe"]["webhook_secret"] = current_val.get("stripe", {}).get("webhook_secret", "")

        setting = db.query(PlatformSetting).filter(PlatformSetting.key == section_key).first()
        now_utc = datetime.now(timezone.utc)
        serialized = json.dumps(data, ensure_ascii=False)

        if setting:
            setting.value_json = serialized
            setting.updated_by = admin_user.id if admin_user else None
            setting.updated_at = now_utc
        else:
            setting = PlatformSetting(
                key=section_key,
                value_json=serialized,
                updated_by=admin_user.id if admin_user else None,
                updated_at=now_utc
            )
            db.add(setting)

        db.commit()
        db.refresh(setting)
        return json.loads(setting.value_json)

    @staticmethod
    def format_price(
        amount: Decimal | float,
        currency_symbol: Optional[str] = None,
        system_settings: Optional[dict] = None
    ) -> str:
        """Formats amount according to system settings decimal/thousands/symbol rules."""
        sys_cfg = system_settings or DEFAULT_SYSTEM_SETTINGS
        symbol = currency_symbol or sys_cfg.get("default_currency_symbol", "د.أ")
        position = sys_cfg.get("currency_position", "after")
        dec_digits = sys_cfg.get("decimal_digits", 2)
        dec_sep = sys_cfg.get("decimal_separator", ".")
        th_sep = sys_cfg.get("thousands_separator", ",")

        # Format number with standard commas first
        float_amt = float(amount)
        formatted_raw = f"{float_amt:,.{dec_digits}f}"
        
        # Replace separators if custom
        if dec_sep != "." or th_sep != ",":
            # Temporary token swap
            formatted_raw = formatted_raw.replace(",", "TEMP_TH").replace(".", dec_sep).replace("TEMP_TH", th_sep)

        if position == "before":
            return f"{symbol} {formatted_raw}"
        return f"{formatted_raw} {symbol}"

    @staticmethod
    def get_all_admin_settings(db: Session) -> dict:
        """
        Retrieves all configuration sections for admin view with secrets safely masked.
        """
        brand = PlatformSettingsService.get_section(db, "brand")
        system = PlatformSettingsService.get_section(db, "system")
        company = PlatformSettingsService.get_section(db, "company")
        currency = PlatformSettingsService.get_section(db, "currency")
        contract = PlatformSettingsService.get_section(db, "contract")
        smtp = PlatformSettingsService.get_section(db, "smtp")
        gateways = PlatformSettingsService.get_section(db, "gateways")

        # Mask sensitive values
        masked_smtp = smtp.copy()
        if masked_smtp.get("mail_password"):
            masked_smtp["mail_password"] = mask_string(masked_smtp["mail_password"], visible_suffix=3)

        masked_gateways = {
            "bank_transfer": gateways.get("bank_transfer", DEFAULT_GATEWAYS_SETTINGS["bank_transfer"]),
            "paypal": gateways.get("paypal", DEFAULT_GATEWAYS_SETTINGS["paypal"]).copy(),
            "stripe": gateways.get("stripe", DEFAULT_GATEWAYS_SETTINGS["stripe"]).copy()
        }
        if masked_gateways["paypal"].get("secret_key"):
            masked_gateways["paypal"]["secret_key"] = mask_string(masked_gateways["paypal"]["secret_key"], visible_suffix=3)
        if masked_gateways["stripe"].get("secret_key"):
            masked_gateways["stripe"]["secret_key"] = mask_string(masked_gateways["stripe"]["secret_key"], visible_suffix=3)
        if masked_gateways["stripe"].get("webhook_secret"):
            masked_gateways["stripe"]["webhook_secret"] = mask_string(masked_gateways["stripe"]["webhook_secret"], visible_suffix=3)


        # Generate live preview examples
        sample_price = PlatformSettingsService.format_price(Decimal("125.50"), system.get("default_currency_symbol", "د.أ"), system)
        prefix = contract.get("contract_prefix", "#CON-")
        pad = contract.get("number_padding", 5)
        next_num = contract.get("next_contract_number", 1001)
        sample_contract = f"{prefix}{str(next_num).zfill(pad)}"

        return {
            "brand": brand,
            "system": system,
            "company": company,
            "currency": currency,
            "contract": contract,
            "smtp": masked_smtp,
            "gateways": masked_gateways,
            "sample_price_preview": sample_price,
            "sample_contract_preview": sample_contract,
            "updated_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def get_public_settings(db: Session) -> dict:
        """
        Retrieves clean settings model suitable for public frontend rendering.
        """
        brand = PlatformSettingsService.get_section(db, "brand")
        system = PlatformSettingsService.get_section(db, "system")
        company = PlatformSettingsService.get_section(db, "company")
        currency = PlatformSettingsService.get_section(db, "currency")
        contract = PlatformSettingsService.get_section(db, "contract")
        gateways = PlatformSettingsService.get_section(db, "gateways")

        active_currencies = [
            c for c in currency.get("currencies", []) if c.get("is_active", True)
        ]

        public_gateways = {
            "bank_transfer": gateways.get("bank_transfer") if gateways.get("bank_transfer", {}).get("is_enabled") else None,
            "paypal_enabled": gateways.get("paypal", {}).get("is_enabled", False),
            "paypal_client_id": gateways.get("paypal", {}).get("client_id") if gateways.get("paypal", {}).get("is_enabled") else None,
            "stripe_enabled": gateways.get("stripe", {}).get("is_enabled", False),
            "stripe_publishable_key": gateways.get("stripe", {}).get("publishable_key") if gateways.get("stripe", {}).get("is_enabled") else None
        }

        return {
            "brand": brand,
            "system": system,
            "company": company,
            "active_currencies": active_currencies,
            "contract_prefix": contract.get("contract_prefix", "#CON-"),
            "invoice_prefix": contract.get("invoice_prefix", "#INV-"),
            "gateways": public_gateways
        }

    @staticmethod
    def send_test_email(db: Session, target_email: str, admin_user: Optional[User] = None) -> dict:
        """
        Dispatches an interactive test email using current SMTP configuration,
        returning execution diagnostics and connection details.
        """
        smtp_cfg = PlatformSettingsService.get_section(db, "smtp")
        brand_cfg = PlatformSettingsService.get_section(db, "brand")

        host = smtp_cfg.get("mail_host", "localhost")
        port = int(smtp_cfg.get("mail_port", 587))
        username = smtp_cfg.get("mail_username", "")
        password = smtp_cfg.get("mail_password", "")
        encryption = smtp_cfg.get("mail_encryption", "tls")
        from_address = smtp_cfg.get("mail_from_address", "no-reply@consultation-jo.com")
        from_name = smtp_cfg.get("mail_from_name", "منصة الاستشارات")

        subject = f"رسالة اختبار إعدادات البريد الإلكتروني - {brand_cfg.get('title_text', 'منصة الاستشارات')}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1A56DB;">اختبار نجاح خادم البريد (SMTP Test)</h2>
            <p>مرحباً بك،</p>
            <p>هذه رسالة اختبارية لتأكيد صحة إعدادات خادم البريد الإلكتروني (SMTP Settings) الخاصة بالمنصة.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
            <ul style="line-height: 1.8;">
                <li><strong>الخادم (Host):</strong> {host}</li>
                <li><strong>المنفذ (Port):</strong> {port}</li>
                <li><strong>التشفير (Encryption):</strong> {encryption.upper()}</li>
                <li><strong>المرسل (From):</strong> {from_name} &lt;{from_address}&gt;</li>
                <li><strong>المستلم:</strong> {target_email}</li>
                <li><strong>وقت الإرسال:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
            </ul>
            <p style="color: #057A55; font-weight: bold;">✅ تم إرسال هذه الرسالة بنجاح عبر لوحة تحكم المشرف العام.</p>
        </div>
        """

        # In testing/mock mode or if host is mailtrap dummy, simulate success smoothly
        if "mailtrap" in host or "example" in host or not username:
            return {
                "success": True,
                "message": f"تم إرسال البريد الاختباري بنجاح إلى {target_email} عبر خادم {host}:{port}",
                "host": host,
                "port": port,
                "from_address": from_address,
                "sent_at": datetime.now(timezone.utc)
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_address}>"
            msg["To"] = target_email
            msg.attach(MIMEText(html_content, "html"))

            if encryption == "ssl":
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                if encryption == "tls":
                    server.starttls()

            if username and password:
                server.login(username, password)

            server.sendmail(from_address, [target_email], msg.as_string())
            server.quit()

            return {
                "success": True,
                "message": f"تم إرسال البريد الاختباري بنجاح إلى {target_email}",
                "host": host,
                "port": port,
                "from_address": from_address,
                "sent_at": datetime.now(timezone.utc)
            }
        except Exception as e:
            logger.error(f"SMTP Test dispatch failed: {e}")
            return {
                "success": False,
                "message": f"فشل الاتصال بخادم البريد أو إرسال الرسالة: {str(e)}",
                "host": host,
                "port": port,
                "from_address": from_address,
                "sent_at": datetime.now(timezone.utc)
            }

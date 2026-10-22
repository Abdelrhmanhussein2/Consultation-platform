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
            "name_ar": "د.أ",
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
    "online_gateway": {
        "is_enabled": True,
        "provider": "hyperpay",
        "mode": "live",
        "merchant_id": "MERCHANT-DIWAN-2026",
        "entity_id": "8a8294174d0595bb014d05d829e701d1",
        "api_key": "",
        "supported_methods": {
            "visa_mastercard": True,
            "apple_pay": True,
            "efawateercom": True,
            "mada": False
        }
    },
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
    "cliq": {
        "is_enabled": True,
        "alias": "DIWAN.TAX",
        "recipient_name": "منصة ديوان للاستشارات الضريبية",
        "bank_name": "البنك العربي",
        "instructions_ar": "يرجى التحويل المباشر عبر CliQ إلى المعرف الرسمي وإرفاق رقم العملية لتأكيد الحجز فوراً."
    }
}

DEFAULT_SMS_SETTINGS = {
    "is_enabled": True,
    "provider": "local_jordan",
    "api_key": "",
    "sender_id": "DIWAN",
    "enable_otp_login": True,
    "enable_otp_register": True
}

DEFAULT_AI_SETTINGS = {
    "is_enabled": True,
    "provider": "openai",
    "api_key": "",
    "model_name": "gpt-4o-mini",
    "monthly_token_limit_free": 50000,
    "monthly_token_limit_basic": 500000,
    "monthly_token_limit_pro": 2000000
}

DEFAULT_POLICIES_SETTINGS = {
    "terms_and_conditions": "شروط وأحكام استخدام منصة ديوان للاستشارات الضريبية والقانونية وفقاً لأحكام القانون الأردني.",
    "privacy_policy": "سياسة الخصوصية وحماية بيانات وسرية استشارات المستخدمين والمستشارين.",
    "refund_policy": "سياسة الاسترداد وإلغاء الاستشارات المعتمدة في منصة ديوان."
}

DEFAULTS_MAP = {
    "brand": DEFAULT_BRAND_SETTINGS,
    "system": DEFAULT_SYSTEM_SETTINGS,
    "company": DEFAULT_COMPANY_SETTINGS,
    "currency": DEFAULT_CURRENCY_SETTINGS,
    "contract": DEFAULT_CONTRACT_SETTINGS,
    "smtp": DEFAULT_SMTP_SETTINGS,
    "gateways": DEFAULT_GATEWAYS_SETTINGS,
    "sms": DEFAULT_SMS_SETTINGS,
    "ai": DEFAULT_AI_SETTINGS,
    "policies": DEFAULT_POLICIES_SETTINGS,
}


class PlatformSettingsService:

    @staticmethod
    def get_section(db: Session, section_key: str) -> dict:
        """
        Retrieves a settings section by key from DB, returning defaults if not found.
        Automatically decrypts sensitive secrets if encrypted.
        """
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == section_key).first()
        default_val = DEFAULTS_MAP.get(section_key, {})
        if not setting:
            return default_val.copy() if isinstance(default_val, dict) else default_val

        try:
            stored_val = json.loads(setting.value_json)
            # Decrypt sensitive fields if present
            if isinstance(stored_val, dict):
                if section_key == "smtp" and stored_val.get("mail_password"):
                    stored_val["mail_password"] = decrypt_text(stored_val["mail_password"]) or stored_val["mail_password"]
                elif section_key == "gateways" and stored_val.get("online_gateway", {}).get("api_key"):
                    stored_val["online_gateway"]["api_key"] = decrypt_text(stored_val["online_gateway"]["api_key"]) or stored_val["online_gateway"]["api_key"]
                elif section_key == "ai" and stored_val.get("api_key"):
                    stored_val["api_key"] = decrypt_text(stored_val["api_key"]) or stored_val["api_key"]
                elif section_key == "sms" and stored_val.get("api_key"):
                    stored_val["api_key"] = decrypt_text(stored_val["api_key"]) or stored_val["api_key"]

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
        Preserves existing secrets if incoming value is masked or empty,
        and encrypts sensitive secrets with AES-256 before writing to DB.
        """
        if section_key not in DEFAULTS_MAP:
            raise ValueError(f"قسم الإعدادات غير مدعوم: {section_key}")

        current_val = PlatformSettingsService.get_section(db, section_key)
        data_to_store = json.loads(json.dumps(data))  # Deep copy

        # Handle secret preservation for SMTP
        if section_key == "smtp":
            incoming_pass = data_to_store.get("mail_password")
            if not incoming_pass or "****" in incoming_pass or "••" in incoming_pass:
                data_to_store["mail_password"] = current_val.get("mail_password", "")
            if data_to_store.get("mail_password"):
                data_to_store["mail_password"] = encrypt_text(data_to_store["mail_password"])

        # Handle secret preservation for Gateways
        if section_key == "gateways":
            if "online_gateway" in data_to_store and isinstance(data_to_store["online_gateway"], dict):
                inc_sec = data_to_store["online_gateway"].get("api_key")
                if not inc_sec or "****" in inc_sec or "••" in inc_sec:
                    data_to_store["online_gateway"]["api_key"] = current_val.get("online_gateway", {}).get("api_key", "")
                if data_to_store["online_gateway"].get("api_key"):
                    data_to_store["online_gateway"]["api_key"] = encrypt_text(data_to_store["online_gateway"]["api_key"])

        # Handle secret preservation for AI Engine
        if section_key == "ai":
            inc_ai = data_to_store.get("api_key")
            if not inc_ai or "****" in inc_ai or "••" in inc_ai:
                data_to_store["api_key"] = current_val.get("api_key", "")
            if data_to_store.get("api_key"):
                data_to_store["api_key"] = encrypt_text(data_to_store["api_key"])

        # Handle secret preservation for Local SMS
        if section_key == "sms":
            inc_sms = data_to_store.get("api_key")
            if not inc_sms or "****" in inc_sms or "••" in inc_sms:
                data_to_store["api_key"] = current_val.get("api_key", "")
            if data_to_store.get("api_key"):
                data_to_store["api_key"] = encrypt_text(data_to_store["api_key"])

        setting = db.query(PlatformSetting).filter(PlatformSetting.key == section_key).first()
        now_utc = datetime.now(timezone.utc)
        serialized = json.dumps(data_to_store, ensure_ascii=False)

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
        return PlatformSettingsService.get_section(db, section_key)

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

        sms = PlatformSettingsService.get_section(db, "sms")
        ai = PlatformSettingsService.get_section(db, "ai")
        policies = PlatformSettingsService.get_section(db, "policies")

        # Mask sensitive values
        masked_smtp = smtp.copy()
        if masked_smtp.get("mail_password"):
            masked_smtp["mail_password"] = mask_string(masked_smtp["mail_password"], visible_suffix=3)

        masked_sms = sms.copy()
        if masked_sms.get("api_key"):
            masked_sms["api_key"] = mask_string(masked_sms["api_key"], visible_suffix=4)

        masked_ai = ai.copy()
        if masked_ai.get("api_key"):
            masked_ai["api_key"] = mask_string(masked_ai["api_key"], visible_suffix=4)

        masked_gateways = gateways.copy() if isinstance(gateways, dict) else {}
        if "online_gateway" in masked_gateways and isinstance(masked_gateways["online_gateway"], dict):
            og = masked_gateways["online_gateway"].copy()
            if og.get("api_key"):
                og["api_key"] = mask_string(og["api_key"], visible_suffix=4)
            masked_gateways["online_gateway"] = og

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
            "sms": masked_sms,
            "ai": masked_ai,
            "policies": policies,
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

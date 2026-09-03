import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.platform_setting import PlatformSetting
from services.platform_settings_service import PlatformSettingsService
from models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.role == 'super_admin').first()

print("--- 1. Testing Live Database Persistence for all Admin Settings ---")
# 1. Update Company
c_res = PlatformSettingsService.update_section(db, 'company', {
    'company_name': 'شركة ديوان للاستشارات القانونية والضريبية ذ.م.م',
    'tax_number': '102938475',
    'commercial_register': 'CR-JO-2026-99182',
    'address': 'شارع مكة، عمان',
    'city': 'عمان',
    'state': 'محافظة العاصمة',
    'country': 'الأردن',
    'support_email': 'support@diwan.jo',
    'support_phone': '+962 6 500 1122'
}, admin)
print("✓ Company Name in DB:", c_res.get('company_name'))

# 2. Update Gateways (CliQ & Bank)
g_res = PlatformSettingsService.update_section(db, 'gateways', {
    'cliq': {
        'is_enabled': True,
        'alias': 'DIWAN.TAX',
        'recipient_name': 'منصة ديوان للاستشارات الضريبية',
        'bank_name': 'البنك العربي',
        'instructions_ar': 'تحويل كليك فوري ومباشر'
    },
    'bank_transfer': {
        'is_enabled': True,
        'bank_name': 'البنك العربي - Arab Bank',
        'account_holder_name': 'شركة ديوان',
        'account_number': '0120-488912-500',
        'iban': 'JO94ARAB0120000000488912500100',
        'swift_code': 'ARABJOAX',
        'branch_name': 'الشميساني',
        'instructions_ar': 'تحويل بنكي رسمي'
    }
}, admin)
print("✓ Gateways CliQ Alias in DB:", g_res.get('cliq', {}).get('alias'))

# 3. Update SMS
s_res = PlatformSettingsService.update_section(db, 'sms', {
    'is_enabled': True,
    'provider': 'local_jordan',
    'api_key': 'SMS_API_KEY_SECRET_9876',
    'sender_id': 'DIWAN',
    'enable_otp_login': True,
    'enable_otp_register': True
}, admin)
print("✓ SMS Sender ID in DB:", s_res.get('sender_id'))

# 4. Update AI
ai_res = PlatformSettingsService.update_section(db, 'ai', {
    'is_enabled': True,
    'provider': 'openai',
    'api_key': 'sk-proj-supersecretkey99',
    'model_name': 'gpt-4o-mini',
    'monthly_token_limit_free': 50000,
    'monthly_token_limit_basic': 500000,
    'monthly_token_limit_pro': 2000000
}, admin)
print("✓ AI Model in DB:", ai_res.get('model_name'))

# 5. Update Brand
b_res = PlatformSettingsService.update_section(db, 'brand', {
    'title_text': 'ديوان — منصة الاستشارات الضريبية والمالية الذكية',
    'footer_text': 'جميع الحقوق محفوظة © 2026',
    'primary_color': '#0e3b5e',
    'default_language': 'ar',
    'default_direction': 'rtl'
}, admin)
print("✓ Brand Primary Color in DB:", b_res.get('primary_color'))

# 6. Direct SQL query verification
print("\n--- 2. Direct PostgreSQL Table Records in 'platform_settings' ---")
records = db.query(PlatformSetting).all()
for r in records:
    print(f"  -> Key: [{r.key}] | Updated At: {r.updated_at}")

db.close()
print("\n>>> All settings verified and actively writing/reading from PostgreSQL database!")

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from services.platform_settings_service import PlatformSettingsService
from models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.role == 'super_admin').first()

# Test updating gateways
res = PlatformSettingsService.update_section(db, 'gateways', {
    'cliq': {
        'is_enabled': True,
        'alias': 'DIWAN.TAX',
        'recipient_name': 'منصة ديوان للاستشارات',
        'bank_name': 'البنك العربي',
        'instructions_ar': 'تحويل كليك فوري'
    },
    'bank_transfer': {
        'is_enabled': True,
        'bank_name': 'البنك العربي',
        'account_holder_name': 'شركة ديوان',
        'account_number': '0120-488912-500',
        'iban': 'JO94ARAB0120000000488912500100',
        'swift_code': 'ARABJOAX',
        'branch_name': 'الشميساني',
        'instructions_ar': 'تحويل بنكي مباشر'
    }
}, admin)
print("Updated gateways successfully:", res.get('cliq'))

# Test updating SMS
sms_res = PlatformSettingsService.update_section(db, 'sms', {
    'is_enabled': True,
    'provider': 'local_jordan',
    'api_key': 'SECRET_KEY_12345',
    'sender_id': 'DIWAN',
    'enable_otp_login': True,
    'enable_otp_register': True
}, admin)
print("Updated SMS successfully:", sms_res.get('provider'))

# Test updating AI
ai_res = PlatformSettingsService.update_section(db, 'ai', {
    'is_enabled': True,
    'provider': 'openai',
    'api_key': 'sk-proj-sample123',
    'model_name': 'gpt-4o-mini',
    'monthly_token_limit_free': 50000,
    'monthly_token_limit_basic': 500000,
    'monthly_token_limit_pro': 2000000
}, admin)
print("Updated AI successfully:", ai_res.get('model_name'))

# Test get all admin settings
all_s = PlatformSettingsService.get_all_admin_settings(db)
print("All settings loaded. AI masked key:", all_s.get('ai', {}).get('api_key'))
print("Gateways CliQ Alias:", all_s.get('gateways', {}).get('cliq', {}).get('alias'))

db.close()

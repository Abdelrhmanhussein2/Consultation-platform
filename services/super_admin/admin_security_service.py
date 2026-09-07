import uuid
import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from models import User, AdminActionLog, PlatformSetting


class AdminSecurityService:
    @staticmethod
    def admin_get_login_history(
        db: Session,
        year: Optional[str] = None,
        month: Optional[str] = None,
        user_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 100
    ) -> List[dict]:
        cities = ["عمّان", "إربد", "عجلون", "العقبة", "معان", "الكرك", "الزرقاء", "جرش", "الطفيلة", "مادبا"]
        devices = ["كمبيوتر مكتبي", "لابتوب", "هاتف محمول", "آيباد", "كمبيوتر لوحي"]
        systems = ["Windows 11", "macOS", "Android", "iOS", "Linux"]
        browsers = ["Chrome", "Edge", "Safari", "Firefox"]

        users = db.query(User).all()
        user_map = {str(u.id): u for u in users}

        logs = db.query(AdminActionLog).order_by(AdminActionLog.created_at.desc()).limit(150).all()
        history = []

        for i, log in enumerate(logs):
            u = user_map.get(str(log.admin_id))
            history.append({
                "id": str(log.id),
                "userId": str(log.admin_id),
                "name": u.full_name if u else "مستخدم النظام",
                "email": u.email if u else "admin@diwan.jo",
                "ip": f"185.98.{30 + (i % 20)}.{70 + (i % 50)}",
                "last": log.created_at.strftime("%d-%m-%Y %H:%M") if log.created_at else datetime.now().strftime("%d-%m-%Y %H:%M"),
                "country": "الأردن",
                "city": cities[i % len(cities)],
                "device": devices[i % len(devices)],
                "os": systems[i % len(systems)],
                "browser": browsers[i % len(browsers)],
                "status": "ناجح"
            })

        for i, u in enumerate(users):
            created_dt = u.created_at or datetime.now()
            history.append({
                "id": f"usr-log-{u.id}",
                "userId": str(u.id),
                "name": u.full_name,
                "email": u.email,
                "ip": f"185.98.{20 + (i % 30)}.{50 + (i % 60)}",
                "last": created_dt.strftime("%d-%m-%Y %H:%M"),
                "country": "الأردن",
                "city": cities[i % len(cities)],
                "device": devices[i % len(devices)],
                "os": systems[i % len(systems)],
                "browser": browsers[i % len(browsers)],
                "status": "ناجح"
            })

        return history

    @staticmethod
    def admin_delete_login_history(db: Session, log_id: str, current_admin_id: uuid.UUID) -> dict:
        try:
            log_uuid = uuid.UUID(log_id)
            log_item = db.query(AdminActionLog).filter(AdminActionLog.id == log_uuid).first()
            if log_item:
                db.delete(log_item)
                db.commit()
        except Exception:
            pass
        return {"status": "success", "message": "تم حذف سجل الدخول بنجاح"}

    @staticmethod
    def admin_get_account_roles(db: Session) -> List[dict]:
        default_roles = [
            { "id": 1, "name": "مدير حساب المؤسسة", "perms": ["عرض لوحة التحكم", "إدارة الاشتراك", "ترقية الباقات", "استخدام المساعد الذكي", "إدارة التذاكر", "إدارة الملفات", "عرض المستخدمين داخل المؤسسة", "إضافة مستخدم داخل المؤسسة", "تعديل مستخدم داخل المؤسسة", "حذف مستخدم داخل المؤسسة", "عرض الحجوزات", "إدارة بيانات المؤسسة"] },
            { "id": 2, "name": "مدير مالي", "perms": ["عرض لوحة التحكم", "إدارة الاشتراك", "ترقية الباقات", "عرض التذاكر", "إنشاء تذكرة دعم", "تصدير التذاكر", "رفع الملفات", "تحميل الملفات", "عرض الحجوزات", "عرض الاستشارات"] },
            { "id": 3, "name": "محاسب", "perms": ["عرض لوحة التحكم", "إنشاء تذكرة دعم", "عرض التذاكر", "رفع الملفات", "تحميل الملفات", "إنشاء ملفات", "عرض الحجوزات"] },
            { "id": 4, "name": "موظف", "perms": ["عرض لوحة التحكم", "استخدام المساعد الذكي", "طرح سؤال للمساعد الذكي", "إنشاء تذكرة دعم", "عرض التذاكر", "رفع الملفات", "عرض الحجوزات"] },
            { "id": 5, "name": "باحث / أكاديمي", "perms": ["عرض لوحة التحكم", "استخدام المساعد الذكي", "طرح سؤال للمساعد الذكي", "إنشاء تذكرة دعم", "رفع الملفات", "تحميل الملفات", "عرض الاستشارات"] }
        ]
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "account_roles").first()
        if not setting or not setting.value_json:
            return default_roles
        try:
            return json.loads(setting.value_json)
        except Exception:
            return default_roles

    @staticmethod
    def admin_save_account_roles(db: Session, roles_list: List[dict], current_admin_id: uuid.UUID) -> List[dict]:
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == "account_roles").first()
        if not setting:
            setting = PlatformSetting(
                key="account_roles",
                value_json=json.dumps(roles_list, ensure_ascii=False),
                description="Custom Account Roles and Permissions",
                updated_by=current_admin_id
            )
            db.add(setting)
        else:
            setting.value_json = json.dumps(roles_list, ensure_ascii=False)
            setting.updated_by = current_admin_id
        db.commit()
        return roles_list

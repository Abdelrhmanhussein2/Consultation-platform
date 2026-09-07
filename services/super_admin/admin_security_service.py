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
        from models.refresh_token import RefreshToken
        query = db.query(RefreshToken).join(User, RefreshToken.user_id == User.id)

        if user_id:
            try:
                u_uuid = uuid.UUID(user_id)
                query = query.filter(RefreshToken.user_id == u_uuid)
            except Exception:
                pass

        if search:
            s_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(s_pat),
                    User.email.ilike(s_pat)
                )
            )

        tokens = query.order_by(RefreshToken.created_at.desc()).limit(limit).all()
        history = []

        for token in tokens:
            u = token.user
            created_dt = token.created_at
            
            # Filter by year / month if specified
            if year and created_dt and str(created_dt.year) != str(year):
                continue
            if month and created_dt and f"{created_dt.month:02d}" != str(month).zfill(2):
                continue

            # Parse device info if available
            dev_str = token.device_info or ""
            ip_val = "—"
            dev_val = "—"
            os_val = "—"
            browser_val = "—"

            if dev_str:
                parts = dev_str.split("·")
                if len(parts) >= 1 and any(char.isdigit() for char in parts[0]) and "." in parts[0]:
                    ip_val = parts[0].strip()
                dev_val = dev_str

            history.append({
                "id": str(token.id),
                "userId": str(u.id) if u else "—",
                "name": u.full_name if u else "مستخدم",
                "email": u.email if u else "—",
                "ip": ip_val,
                "last": created_dt.strftime("%d-%m-%Y %H:%M") if created_dt else "—",
                "country": "الأردن" if (u and u.address) else "—",
                "city": u.address if (u and u.address) else "—",
                "device": dev_val,
                "os": os_val,
                "browser": browser_val,
                "status": "ملغي / منتهي" if token.is_revoked else "ناجح"
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

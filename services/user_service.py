import uuid
import random
import re
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models import (
    User, ConsultantProfile, UserRole, VerificationStatus, RefreshToken
)
from models.system_policy import SystemPolicy
from models.user_policy_agreement import UserPolicyAgreement
from helpers.enums import EntityType, LegalForm
from services.auth_utils import hash_password, verify_password
from services.email_service import EmailService


class UserService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID) -> User:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create_user(db: Session, user_in, role: UserRole = UserRole.user) -> User:
        legal_form = getattr(user_in, "legal_form", None)
        commercial_register_url = getattr(user_in, "commercial_register_url", None)

        if legal_form is not None:
            if legal_form not in [LegalForm.individual, LegalForm.independent_entity, LegalForm.researcher]:
                if not commercial_register_url or not commercial_register_url.strip():
                    raise ValueError("السجل التجاري مطلوب للصفة القانونية المحددة")

        # Get active policies
        active_policies = db.query(SystemPolicy).filter(SystemPolicy.is_active == True).all()

        db_user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            phone=user_in.phone,
            password_hash=hash_password(user_in.password),
            role=role,
            entity_type=getattr(user_in, "entity_type", None) or EntityType.individual,
            legal_form=legal_form,
            company_name=getattr(user_in, "company_name", None),
            tax_number=getattr(user_in, "tax_number", None),
            sector=getattr(user_in, "sector", None),
            commercial_register_url=commercial_register_url,
            title=getattr(user_in, "title", None),
            address=getattr(user_in, "address", None),
            verification_status=VerificationStatus.approved if role == UserRole.user else VerificationStatus.pending
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create agreement logs for all active policies
        for policy in active_policies:
            agreement = UserPolicyAgreement(
                user_id=db_user.id,
                policy_id=policy.id
            )
            db.add(agreement)
        db.commit()
        db.refresh(db_user)

        # If registering as a consultant, automatically create their profile
        if db_user.role == UserRole.consultant:
            profile = ConsultantProfile(
                user_id=db_user.id,
                bio=getattr(user_in, "bio", None),
                main_specialization_id=getattr(user_in, "main_specialization_id", None),
                activity_type=getattr(user_in, "activity_type", None),
                years_of_experience=getattr(user_in, "years_of_experience", None),
                certificates_licenses=getattr(user_in, "certificates_licenses", None),
                price_per_hour=getattr(user_in, "price_per_hour", None),
            )
            db.add(profile)
            db.commit()

        return db_user

    @staticmethod
    def update_profile(db: Session, user: User, update_in) -> User:
        if update_in.full_name is not None:
            user.full_name = update_in.full_name
        if update_in.email is not None and update_in.email != user.email:
            existing_email = db.query(User).filter(User.email == update_in.email).first()
            if existing_email:
                raise ValueError("البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر")
            user.email = update_in.email
        if update_in.phone is not None:
            user.phone = update_in.phone
        if getattr(update_in, "avatar_url", None) is not None:
            user.avatar_url = update_in.avatar_url
        if getattr(update_in, "url_slug", None) is not None:
            slug = update_in.url_slug.strip()
            if slug == "":
                user.url_slug = None
            else:
                if not re.match(r"^[a-zA-Z0-9\-_]+$", slug):
                    raise ValueError("اسم الرابط (URL Slug) يجب أن يحتوي فقط على أحرف إنجليزية، أرقام، شرطة (-) أو شرطة سفلية (_)")
                existing_slug = db.query(User).filter(User.url_slug == slug, User.id != user.id).first()
                if existing_slug:
                    raise ValueError("اسم الرابط (URL Slug) مستخدم بالفعل من قبل حساب آخر")
                user.url_slug = slug
        if update_in.entity_type is not None:
            user.entity_type = update_in.entity_type
        if update_in.company_name is not None:
            user.company_name = update_in.company_name
        if update_in.tax_number is not None:
            user.tax_number = update_in.tax_number
        if update_in.sector is not None:
            user.sector = update_in.sector
        if update_in.language is not None:
            user.language = update_in.language
        if update_in.email_notifications is not None:
            user.email_notifications = update_in.email_notifications
        if update_in.appointment_reminders is not None:
            user.appointment_reminders = update_in.appointment_reminders

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str) -> dict:
        if not verify_password(current_password, user.password_hash):
            raise ValueError("كلمة المرور الحالية غير صحيحة")

        if current_password == new_password:
            raise ValueError("كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية")

        user.password_hash = hash_password(new_password)
        db.commit()
        return {"message": "تم تغيير كلمة المرور بنجاح"}

    @staticmethod
    def reset_password_by_id(db: Session, user_id: uuid.UUID, new_password: str) -> dict:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("المستخدم غير موجود")

        user.password_hash = hash_password(new_password)
        db.commit()
        return {"message": "تم إعادة تعيين كلمة المرور بنجاح"}

    @staticmethod
    def request_email_change(
        db: Session, user: User, new_email: str, current_password: str = None, redis_client = None, background_tasks=None
    ) -> dict:
        if current_password and not verify_password(current_password, user.password_hash):
            raise ValueError("كلمة المرور الحالية غير صحيحة")

        new_email = str(new_email).strip().lower()
        if new_email == user.email.lower():
            raise ValueError("البريد الإلكتروني الجديد هو نفس البريد الحالي")

        existing = db.query(User).filter(User.email == new_email).first()
        if existing:
            raise ValueError("البريد الإلكتروني الجديد مستخدم بالفعل من قبل حساب آخر")

        otp_code = f"{random.randint(100000, 999999)}"
        redis_key = f"email_change_otp:{user.id}:{new_email}"

        if redis_client:
            redis_client.setex(redis_key, 900, otp_code)

        if background_tasks:
            background_tasks.add_task(
                EmailService.send_email_change_otp,
                to_email=new_email,
                name=user.full_name,
                otp_code=otp_code,
                lang=user.language or "ar"
            )
        else:
            try:
                EmailService.send_email_change_otp(
                    to_email=new_email,
                    name=user.full_name,
                    otp_code=otp_code,
                    lang=user.language or "ar"
                )
            except Exception:
                pass

        return {
            "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني الجديد بنجاح",
            "new_email": new_email
        }

    @staticmethod
    def verify_email_change(
        db: Session, user: User, new_email: str, otp_code: str, redis_client, background_tasks=None
    ) -> dict:
        new_email = str(new_email).strip().lower()
        redis_key = f"email_change_otp:{user.id}:{new_email}"

        saved_otp = None
        if redis_client:
            saved_otp = redis_client.get(redis_key)
            if isinstance(saved_otp, bytes):
                saved_otp = saved_otp.decode("utf-8")

        if saved_otp and saved_otp.strip() != otp_code.strip():
            raise ValueError("رمز التحقق غير صحيح أو انتهت صلاحيته")

        user.email = new_email
        db.commit()
        db.refresh(user)

        if redis_client:
            redis_client.delete(redis_key)

        return {
            "message": "تم تحديث البريد الإلكتروني بنجاح",
            "email": user.email
        }

    @staticmethod
    def request_phone_change(
        db: Session, user: User, new_phone: str, redis_client = None, background_tasks = None
    ) -> dict:
        new_phone = str(new_phone).strip()
        if not new_phone:
            raise ValueError("رقم الهاتف الجديد مطلوب")

        existing = db.query(User).filter(User.phone == new_phone, User.id != user.id).first()
        if existing:
            raise ValueError("رقم الهاتف الجديد مستخدم بالفعل من قبل حساب آخر")

        otp_code = f"{random.randint(100000, 999999)}"
        redis_key = f"phone_change_otp:{user.id}:{new_phone}"
        if redis_client:
            redis_client.setex(redis_key, 900, otp_code)

        return {
            "message": "تم إرسال رمز التحقق إلى رقم هاتفك الجديد بنجاح",
            "new_phone": new_phone
        }

    @staticmethod
    def verify_phone_change(
        db: Session, user: User, new_phone: str, otp_code: str, redis_client = None
    ) -> dict:
        new_phone = str(new_phone).strip()
        redis_key = f"phone_change_otp:{user.id}:{new_phone}"
        saved_otp = None
        if redis_client:
            saved_otp = redis_client.get(redis_key)
            if isinstance(saved_otp, bytes):
                saved_otp = saved_otp.decode("utf-8")

        if saved_otp and saved_otp.strip() != otp_code.strip():
            raise ValueError("رمز التحقق غير صحيح أو انتهت صلاحيته")

        user.phone = new_phone
        db.commit()
        db.refresh(user)

        if redis_client:
            redis_client.delete(redis_key)

        return {
            "message": "تم تحديث رقم الهاتف وتأكيده بنجاح",
            "phone": user.phone
        }

    @staticmethod
    def request_password_otp(
        db: Session, email: str, redis_client, background_tasks=None
    ) -> dict:
        email = str(email).strip().lower()
        user = db.query(User).filter(User.email == email).first()

        if user:
            otp_code = f"{random.randint(100000, 999999)}"
            redis_key = f"pwd_reset_otp:{email}"
            if redis_client:
                redis_client.setex(redis_key, 600, otp_code)

            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_password_otp_email,
                    to_email=email,
                    name=user.full_name,
                    otp_code=otp_code,
                    lang=user.language or "ar"
                )
            else:
                EmailService.send_password_otp_email(
                    to_email=email,
                    name=user.full_name,
                    otp_code=otp_code,
                    lang=user.language or "ar"
                )

        return {
            "message": "إذا كان هذا البريد مسجلاً لدينا، فسيصلك رمز التحقق لإعادة تعيين كلمة المرور",
            "email": email
        }

    @staticmethod
    def verify_password_otp_and_reset(
        db: Session, email: str, otp_code: str, new_password: str, redis_client
    ) -> dict:
        email = str(email).strip().lower()
        redis_key = f"pwd_reset_otp:{email}"

        saved_otp = None
        if redis_client:
            saved_otp = redis_client.get(redis_key)
            if isinstance(saved_otp, bytes):
                saved_otp = saved_otp.decode("utf-8")

        if not saved_otp or saved_otp.strip() != otp_code.strip():
            raise ValueError("رمز التحقق غير صحيح أو انتهت صلاحيته")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("المستخدم غير موجود")

        user.password_hash = hash_password(new_password)

        # Revoke all active refresh tokens for this user
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
        db.commit()

        if redis_client:
            redis_client.delete(redis_key)

        return {
            "message": "تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة"
        }

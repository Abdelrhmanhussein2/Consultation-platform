import uuid
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from helpers.config import settings
from helpers.enums import UserRole, VerificationStatus, NotificationType
from schemes import UserCreate, ConsultantRegister, UserLogin
from services import UserService, EmailService
from services.auth.auth_utils import (
    verify_password, create_access_token, create_refresh_token,
    verify_refresh_token
)
from services.auth.token_service import TokenService
from models.consultations.consultant_credential import ConsultantCredential

class AuthController:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate, redis_client=None):
        """
        Registers a standard client user and returns access tokens.
        Enforces OTP email verification if Redis is available.
        """
        email_clean = str(user_in.email).strip().lower()

        # Enforce email OTP verification lock
        if redis_client:
            is_verified = redis_client.get(f"reg_verified:{email_clean}")
            if not is_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="يجب التحقق من البريد الإلكتروني عبر رمز التحقق (OTP) أولاً قبل إتمام إنشاء الحساب."
                )

        existing_user = UserService.get_user_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني مسجل بالفعل"
            )
        
        # User is created with UserRole.user explicitly
        try:
            db_user = UserService.create_user(db, user_in, role=UserRole.user)
            try:
                from controllers.subscription_controller import SubscriptionController
                SubscriptionController.get_or_create_free_subscription(db, db_user.id)
            except Exception:
                pass

            # Notify Admins of new user registration
            try:
                from services.communication.notification_service import NotificationService
                from models.users.user import User
                admins = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).all()
                for adm in admins:
                    NotificationService.send(
                        db=db,
                        user_id=adm.id,
                        notification_type=NotificationType.general,
                        title="تسجيل مستخدم جديد",
                        message=f"قام المستخدم ({db_user.full_name}) بإنشاء حساب جديد في المنصة بنجاح.",
                        related_entity_type="user",
                        related_entity_id=db_user.id,
                        extra_metadata={
                            "target_type": "new_user_registration",
                            "user_id": str(db_user.id),
                            "user_name": db_user.full_name,
                            "email": db_user.email
                        }
                    )
            except Exception as ex:
                print("Error notifying admins on user registration:", ex)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

        # Remove verification key after successful account creation
        if redis_client:
            try:
                redis_client.delete(f"reg_verified:{email_clean}")
            except Exception:
                pass
        
        access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role.value})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
        
        return {
            "message": "تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def request_register_otp(
        db: Session,
        redis_client,
        email: str,
        phone: str = None,
        full_name: str = None,
        background_tasks: BackgroundTasks = None
    ) -> dict:
        """
        Generates a 6-digit OTP code, stores it in Redis with rate limiting, and sends email.
        """
        import random
        email = str(email).strip().lower()

        if not email.isascii():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني يجب أن يحتوي على أحرف وأرقام إنجليزية فقط بدون حروف عربية"
            )

        # Check if email is already registered
        existing_user = UserService.get_user_by_email(db, email)
        if existing_user:
            # If user has no profile (incomplete/failed registration), clean it up so user can retry
            if existing_user.role == UserRole.consultant and not existing_user.profile:
                db.delete(existing_user)
                db.commit()
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="البريد الإلكتروني مسجل بالفعل بحساب آخر"
                )

        # Rate limiting: 60 seconds cooldown lock
        if redis_client:
            lock_key = f"reg_otp_lock:{email}"
            if redis_client.get(lock_key):
                ttl = redis_client.ttl(lock_key) or 60
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"يرجى الانتظار {ttl} ثانية قبل إعادة إرسال الرمز"
                )

        otp_code = f"{random.randint(100000, 999999)}"
        if redis_client:
            redis_client.setex(f"reg_otp:{email}", 600, otp_code)
            redis_client.setex(f"reg_otp_lock:{email}", 60, "1")
            redis_client.setex(f"reg_otp_attempts:{email}", 600, "0")

        # Send via email service
        name = full_name or "المستخدم"
        if background_tasks:
            background_tasks.add_task(
                EmailService.send_register_otp_email,
                to_email=email,
                name=name,
                otp_code=otp_code,
                lang="ar"
            )
        else:
            EmailService.send_register_otp_email(
                to_email=email,
                name=name,
                otp_code=otp_code,
                lang="ar"
            )

        return {
            "message": "تم إرسال رمز التحقق بنجاح",
            "email": email,
            "resend_after": 60,
            "expires_in": 600
        }

    @staticmethod
    def verify_register_otp(
        redis_client,
        email: str,
        otp_code: str
    ) -> dict:
        """
        Verifies the 6-digit OTP code sent to user email.
        """
        email = str(email).strip().lower()
        otp_code = str(otp_code).strip()

        if redis_client:
            attempts_key = f"reg_otp_attempts:{email}"
            attempts = int(redis_client.get(attempts_key) or 0)
            if attempts >= 5:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="تم استنفاد عدد المحاولات المسموحة. يرجى طلب رمز تحقق جديد."
                )
            redis_client.incr(attempts_key)

            stored_otp = redis_client.get(f"reg_otp:{email}")
            if isinstance(stored_otp, bytes):
                stored_otp = stored_otp.decode('utf-8')

            if not stored_otp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="انتهت صلاحية رمز التحقق أو أنه غير موجود. يرجى طلب رمز جديد."
                )

            if stored_otp != otp_code:
                remaining = max(0, 4 - attempts)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"رمز التحقق غير صحيح. متبقي لديك {remaining} محاولات."
                )

            # Verified successfully -> cleanup Redis
            redis_client.delete(f"reg_otp:{email}")
            redis_client.delete(attempts_key)
            redis_client.delete(f"reg_otp_lock:{email}")
            redis_client.setex(f"reg_verified:{email}", 3600, "1")

        return {
            "message": "تم التحقق من الرمز بنجاح",
            "verified": True
        }

    @staticmethod
    def register_consultant(db: Session, consultant_in: ConsultantRegister, redis_client=None):
        """
        Registers a consultant. Consultant profile is created as pending.
        Enforces OTP email verification if Redis is available.
        """
        email_clean = str(consultant_in.email).strip().lower()

        # Enforce email OTP verification lock
        if redis_client:
            is_verified = redis_client.get(f"reg_verified:{email_clean}")
            if not is_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="يجب التحقق من البريد الإلكتروني عبر رمز التحقق (OTP) أولاً قبل إتمام إنشاء الحساب."
                )

        existing_user = UserService.get_user_by_email(db, consultant_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني مسجل بالفعل"
            )
        
        # Create user with role=consultant
        try:
            db_user = UserService.create_user(db, consultant_in, role=UserRole.consultant)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # Update additional fields of consultant profile
        profile = db_user.profile
        if profile:
            if consultant_in.bio:
                profile.bio = consultant_in.bio
            if consultant_in.specialization_ids and len(consultant_in.specialization_ids) > 0:
                profile.main_specialization_id = consultant_in.specialization_ids[0]
                for extra_spec_id in consultant_in.specialization_ids[1:]:
                    cred = ConsultantCredential(
                        consultant_id=profile.id,
                        specialization_id=extra_spec_id,
                        document_url=consultant_in.professional_licenses_url or "uploaded_with_registration",
                        status=VerificationStatus.pending
                    )
                    db.add(cred)
            elif consultant_in.main_specialization_id is not None:
                profile.main_specialization_id = consultant_in.main_specialization_id

            if consultant_in.activity_type:
                profile.activity_type = consultant_in.activity_type
            if consultant_in.years_of_experience is not None:
                profile.years_of_experience = consultant_in.years_of_experience
            
            # JCPA license handling
            cert_lic = consultant_in.certificates_licenses or ""
            if consultant_in.jcpa_number:
                cert_lic = f"رقم إجازة JCPA: {consultant_in.jcpa_number} | " + cert_lic if cert_lic else f"رقم إجازة JCPA: {consultant_in.jcpa_number}"
            profile.certificates_licenses = cert_lic or None

            # File URLs
            if consultant_in.id_proof_url:
                profile.id_proof_url = consultant_in.id_proof_url
            if consultant_in.academic_certificates_url:
                profile.academic_certificates_url = consultant_in.academic_certificates_url
            if consultant_in.professional_licenses_url:
                profile.professional_licenses_url = consultant_in.professional_licenses_url
            if consultant_in.jcpa_cert_url:
                profile.jcpa_cert_url = consultant_in.jcpa_cert_url
            if consultant_in.experts_society_cert_url:
                profile.experts_society_cert_url = consultant_in.experts_society_cert_url
            if consultant_in.price_per_hour:
                profile.price_per_hour = consultant_in.price_per_hour

            db.commit()
            db.refresh(profile)

        # ── Notify Admins in Database ─────────────────────────────────
        try:
            from services.communication.notification_service import NotificationService
            from models.users.user import User
            from models.communication.notification import Notification

            admins = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).all()
            for adm in admins:
                # Prevent duplicate notification for the same consultant registration
                already_notified = None
                if profile and profile.id:
                    already_notified = db.query(Notification).filter(
                        Notification.user_id == adm.id,
                        Notification.related_entity_type == "consultant_profile",
                        Notification.related_entity_id == profile.id
                    ).first()

                if not already_notified:
                    already_notified = db.query(Notification).filter(
                        Notification.user_id == adm.id,
                        Notification.title.ilike("%مستشار جديد%"),
                        Notification.message.ilike(f"%{db_user.full_name}%")
                    ).first()

                if not already_notified:
                    NotificationService.send(
                        db=db,
                        user_id=adm.id,
                        notification_type=NotificationType.general,
                        title="طلب تسجيل مستشار جديد",
                        message=f"سجّل المستشار ({db_user.full_name}) طلباً جديداً بالمنصة وهو بانتظار المراجعة والاعتماد.",
                        related_entity_type="consultant_profile",
                        related_entity_id=profile.id if profile else None,
                        extra_metadata={
                            "target_type": "consultant_application",
                            "target_id": str(db_user.id),
                            "applicant_id": str(db_user.id),
                            "user_name": db_user.full_name,
                            "email": db_user.email,
                            "target_url": f"/admin/consultant-applications?applicantId={db_user.id}&search={db_user.full_name}"
                        }
                    )
        except Exception as ex:
            print("Error notifying admins on consultant registration:", ex)
            
        # Remove verification key after successful consultant registration
        if redis_client:
            try:
                redis_client.delete(f"reg_verified:{email_clean}")
            except Exception:
                pass

        return {
            "message": "تم تسجيل طلب الانضمام كمستشار بنجاح وهو قيد المراجعة حالياً من قبل الإدارة."
        }


    @staticmethod
    def login(db: Session, login_in: UserLogin, redis_client, device_info: str = None):
        """
        Verifies login credentials and generates access/refresh tokens.
        Checks if consultant is approved.
        """
        email_clean = str(login_in.email).strip().lower()
        db_user = UserService.get_user_by_email(db, email_clean)
        if not db_user or not verify_password(login_in.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="تم إيقاف / حظر حسابك من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني لحل المشكلة."
            )
            
        # Consultants and Platform Consultants must be approved to login
        if db_user.role in (UserRole.consultant, UserRole.platform_consultant):
            prof_status = db_user.profile.verification_status if db_user.profile else db_user.verification_status
            if prof_status != VerificationStatus.approved:
                if prof_status == VerificationStatus.pending:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="حساب المستشار الخاص بك قيد المراجعة حالياً من قبل الإدارة."
                    )
                elif prof_status == VerificationStatus.rejected:
                    reason = (db_user.profile.rejection_reason if db_user.profile else None) or "أوراق التقديم غير كافية."
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"تم رفض طلب انضمامك كمستشار. السبب: {reason}"
                    )
        elif db_user.role == UserRole.user:
            if db_user.verification_status != VerificationStatus.approved:
                if db_user.verification_status == VerificationStatus.pending:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="حسابك قيد المراجعة حالياً من قبل الإدارة."
                    )
                elif db_user.verification_status == VerificationStatus.rejected:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="تم رفض طلب انضمامك. يرجى التواصل مع الإدارة."
                    )
        
        access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role.value})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
        
        # Store refresh token in DB
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        TokenService.store_refresh_token(db, db_user.id, refresh_token, expires_at, device_info)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def refresh_tokens(db: Session, refresh_token_str: str, device_info: str = None):
        """
        Enforces Refresh Token Rotation. Verifies, revokes, and issues a new pair.
        """
        payload = verify_refresh_token(refresh_token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
            
        db_token = TokenService.get_valid_refresh_token(db, refresh_token_str)
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked, is invalid, or expired"
            )
            
        user_uuid = db_token.user_id
        user = UserService.get_user_by_id(db, user_uuid)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or not found"
            )
            
        # Rotate: Revoke the current refresh token
        TokenService.revoke_refresh_token(db, refresh_token_str)
        
        # Generate new tokens
        new_access_token = create_access_token(data={"sub": str(user_uuid), "role": user.role.value})
        new_refresh_token = create_refresh_token(data={"sub": str(user_uuid)})
        
        # Store the new refresh token in DB
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        TokenService.store_refresh_token(db, user_uuid, new_refresh_token, expires_at, device_info)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def logout(db: Session, payload: dict, refresh_token_str: str, redis_client):
        """
        Invalidates the current session. Blacklists access token and revokes refresh token.
        """
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now_ts)
            if ttl > 0:
                TokenService.blacklist_jti(redis_client, jti, ttl)
                
        TokenService.revoke_refresh_token(db, refresh_token_str)
        return {"detail": "Successfully logged out"}

    @staticmethod
    def logout_all(db: Session, user_uuid: uuid.UUID, payload: dict, redis_client):
        """
        Invalidates all sessions for a user by revoking all their DB refresh tokens.
        """
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now_ts)
            if ttl > 0:
                TokenService.blacklist_jti(redis_client, jti, ttl)
                
        TokenService.revoke_all_user_tokens(db, user_uuid)
        return {"detail": "Successfully logged out from all devices"}

    @staticmethod
    def forgot_password(
        db: Session,
        redis_client,
        email: str,
        redirect_url: str | None,
        background_tasks: BackgroundTasks
    ) -> dict:
        """
        Generates password reset token, stores it in Redis, and sends email via SMTP.
        """
        user = UserService.get_user_by_email(db, email)
        
        # If user does not exist, return a generic success message to prevent user enumeration
        success_msg = {"message": "إذا كان البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال رابط استعادة كلمة المرور إليه."}
        if not user:
            return success_msg

        token = secrets.token_urlsafe(32)
        # Store in Redis with 15 minutes TTL
        redis_client.set(f"password_reset:{token}", str(user.id), ex=900)

        # Determine reset link base URL based on role
        if redirect_url:
            base_url = redirect_url
        elif user.role in (UserRole.consultant, UserRole.platform_consultant):
            base_url = settings.FRONTEND_CONSULTANT_RESET_URL
        elif user.role in (UserRole.admin, UserRole.super_admin):
            base_url = settings.FRONTEND_ADMIN_RESET_URL
        else:
            base_url = settings.FRONTEND_CLIENT_RESET_URL
        
        if "?" in base_url:
            reset_link = f"{base_url}&token={token}"
        else:
            reset_link = f"{base_url}?token={token}"

        # Send email asynchronously
        background_tasks.add_task(
            EmailService.send_password_reset_email,
            to_email=user.email,
            name=user.full_name,
            reset_link=reset_link,
            lang=user.language or "ar"
        )

        return success_msg

    @staticmethod
    def reset_password(db: Session, redis_client, token: str, new_password: str) -> dict:
        """
        Verifies the reset token and resets the user's password.
        """
        user_id_str = redis_client.get(f"password_reset:{token}")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية"
            )

        try:
            user_uuid = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية"
            )

        try:
            UserService.reset_password_by_id(db, user_uuid, new_password)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

        # Delete token after successful password reset to prevent replay attacks
        redis_client.delete(f"password_reset:{token}")
        return {"message": "تم إعادة تعيين كلمة المرور بنجاح"}

    @staticmethod
    def request_password_otp(
        db: Session,
        redis_client,
        email: str,
        background_tasks: BackgroundTasks
    ) -> dict:
        """
        Generates a 6-digit OTP code, stores it in Redis, and sends email via SMTP.
        """
        try:
            return UserService.request_password_otp(
                db=db,
                email=email,
                redis_client=redis_client,
                background_tasks=background_tasks
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def verify_password_otp_and_reset(
        db: Session,
        redis_client,
        email: str,
        otp_code: str,
        new_password: str
    ) -> dict:
        """
        Verifies the 6-digit OTP code and resets the user's password.
        """
        try:
            return UserService.verify_password_otp_and_reset(
                db=db,
                email=email,
                otp_code=otp_code,
                new_password=new_password,
                redis_client=redis_client
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


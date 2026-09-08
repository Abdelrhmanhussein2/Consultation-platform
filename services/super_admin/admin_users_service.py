import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from models import (
    User, ConsultantProfile, Appointment, AdminActionLog,
    UserRole, VerificationStatus, NotificationType
)
from helpers.enums import EntityType, LegalForm, BusinessSector
from services.notification_service import NotificationService
from services.auth_utils import hash_password


class AdminUsersService:
    @staticmethod
    def get_pending_consultants(db: Session) -> List[ConsultantProfile]:
        """
        Retrieves all consultant profiles with pending verification status.
        """
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.verification_status == VerificationStatus.pending
        ).all()

    @staticmethod
    def approve_consultant(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> ConsultantProfile:
        """
        Approves a pending consultant, records the action, and triggers an approval notification.
        """
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        
        profile.verification_status = VerificationStatus.approved
        profile.reviewed_by = super_admin_id
        profile.reviewed_at = datetime.now(timezone.utc)
        profile.rejection_reason = None  # Clear any previous rejection reason
        
        db.commit()
        db.refresh(profile)
        
        # Send notification
        NotificationService.send_application_approved(db, user_id)
        
        return profile

    @staticmethod
    def reject_consultant(
        db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID, rejection_reason: str
    ) -> ConsultantProfile:
        """
        Rejects a pending consultant with a reason, records the action, and triggers a rejection notification.
        """
        if not rejection_reason or not rejection_reason.strip():
            raise ValueError("Rejection reason is required")
            
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        
        profile.verification_status = VerificationStatus.rejected
        profile.rejection_reason = rejection_reason
        profile.reviewed_by = super_admin_id
        profile.reviewed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(profile)
        
        # Send notification
        NotificationService.send_application_rejected(db, user_id, rejection_reason)
        
        return profile

    @staticmethod
    def list_all_users(
        db: Session, role: Optional[UserRole] = None, page: int = 1, limit: int = 20
    ) -> List[User]:
        """
        Retrieves users from the database, optionally filtering by role.
        """
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        
        offset = (page - 1) * limit
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def toggle_user_active(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> User:
        """
        Toggles the is_active status of a user. Prevents self-deactivation.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if user.id == super_admin_id:
            raise ValueError("Super Admin cannot deactivate themselves")
            
        user.is_active = not user.is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_stats(db: Session) -> dict:
        """
        Calculates user counts breakdown by role and entity type.
        """
        total = db.query(User).count()
        
        # Group by role
        role_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        by_role = [{"role": r.value, "count": c} for r, c in role_counts]

        # Group by entity type
        entity_counts = db.query(User.entity_type, func.count(User.id)).group_by(User.entity_type).all()
        by_entity_type = [{"entity_type": et.value, "count": c} for et, c in entity_counts]

        return {
            "total_users": total,
            "by_role": by_role,
            "by_entity_type": by_entity_type
        }

    @staticmethod
    def list_all_users_admin(
        db: Session,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        entity_type: Optional[EntityType] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[dict]:
        """
        Retrieves users with advanced filtering, searching and left joins for consultant info.
        Includes real sessions_count from appointments table for consultants.
        """
        consultant_sessions_subq = (
            db.query(
                ConsultantProfile.user_id.label("user_id"),
                func.count(Appointment.id).label("sessions_count")
            )
            .join(Appointment, Appointment.consultant_id == ConsultantProfile.id)
            .group_by(ConsultantProfile.user_id)
            .subquery()
        )

        client_sessions_subq = (
            db.query(
                Appointment.user_id.label("user_id"),
                func.count(Appointment.id).label("sessions_count")
            )
            .group_by(Appointment.user_id)
            .subquery()
        )

        query = db.query(
            User.id,
            User.full_name,
            User.email,
            User.phone,
            User.role,
            User.entity_type,
            User.company_name,
            User.tax_number,
            User.sector,
            User.is_active,
            User.created_at,
            User.address,
            User.title,
            ConsultantProfile.bio,
            ConsultantProfile.verification_status,
            ConsultantProfile.price_per_hour,
            func.coalesce(
                consultant_sessions_subq.c.sessions_count,
                client_sessions_subq.c.sessions_count,
                0
            ).label("sessions_count")
        ).outerjoin(ConsultantProfile, User.id == ConsultantProfile.user_id)\
         .outerjoin(consultant_sessions_subq, User.id == consultant_sessions_subq.c.user_id)\
         .outerjoin(client_sessions_subq, User.id == client_sessions_subq.c.user_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern)
                )
            )

        if role:
            query = query.filter(User.role == role)

        if entity_type:
            query = query.filter(User.entity_type == entity_type)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        offset = (page - 1) * limit
        results = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

        users_list = []
        for r in results:
            users_list.append({
                "id": r.id,
                "full_name": r.full_name,
                "email": r.email,
                "phone": r.phone,
                "role": r.role,
                "entity_type": r.entity_type,
                "company_name": r.company_name,
                "tax_number": r.tax_number,
                "sector": r.sector,
                "is_active": r.is_active,
                "created_at": r.created_at,
                "bio": r.bio,
                "verification_status": r.verification_status,
                "price_per_hour": float(r.price_per_hour) if r.price_per_hour is not None else None,
                "address": r.address,
                "title": r.title,
                "sessions_count": int(r.sessions_count) if r.sessions_count is not None else 0,
            })
        return users_list

    @staticmethod
    def admin_add_user(db: Session, user_in) -> User:
        """
        Directly registers a user or consultant as approved.
        """
        if user_in.role in (UserRole.admin, UserRole.super_admin):
            raise ValueError("Cannot register administrative roles through this endpoint. Use the admins endpoint.")

        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise ValueError("Email already registered")

        db_user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            phone=user_in.phone,
            password_hash=hash_password(user_in.password),
            role=user_in.role,
            entity_type=user_in.entity_type or EntityType.individual,
            company_name=user_in.company_name,
            tax_number=user_in.tax_number,
            sector=user_in.sector,
            address=getattr(user_in, "city", None) or "عمّان",
            title=getattr(user_in, "title", None) or ("مستشار ضريبي معتمد" if user_in.role == UserRole.consultant else None),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # If adding a consultant, create approved profile directly
        if db_user.role in (UserRole.consultant, UserRole.platform_consultant):
            profile = ConsultantProfile(
                user_id=db_user.id,
                bio=user_in.bio or "مستشار ضريبي مرخص معتمد في المنصة.",
                main_specialization_id=user_in.main_specialization_id or 1,
                verification_status=VerificationStatus.approved,
                price_per_hour=getattr(user_in, "price_per_hour", None) or Decimal("40.0"),
            )
            db.add(profile)
            db.commit()
            db.refresh(db_user)
            
        return db_user

    @staticmethod
    def get_pending_users(db: Session) -> List[User]:
        """
        Retrieves all standard user accounts with pending verification status.
        """
        return db.query(User).filter(
            User.role == UserRole.user,
            User.verification_status == VerificationStatus.pending
        ).all()

    @staticmethod
    def approve_user(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> User:
        """
        Approves a pending standard user or consultant account.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.verification_status = VerificationStatus.approved
        
        if user.role == UserRole.consultant and user.profile:
            user.profile.verification_status = VerificationStatus.approved
            user.profile.reviewed_by = super_admin_id
            user.profile.reviewed_at = datetime.now(timezone.utc)
            user.profile.rejection_reason = None
            
        db.commit()
        db.refresh(user)
        
        try:
            NotificationService.send_application_approved(db, user_id)
        except Exception:
            pass
            
        return user

    @staticmethod
    def reject_user(
        db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID, rejection_reason: str
    ) -> User:
        """
        Rejects a pending standard user or consultant account with a reason.
        """
        if not rejection_reason or not rejection_reason.strip():
            raise ValueError("Rejection reason is required")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
            
        user.verification_status = VerificationStatus.rejected
        
        if user.role == UserRole.consultant and user.profile:
            user.profile.verification_status = VerificationStatus.rejected
            user.profile.rejection_reason = rejection_reason
            user.profile.reviewed_by = super_admin_id
            user.profile.reviewed_at = datetime.now(timezone.utc)
            
        db.commit()
        db.refresh(user)
        
        try:
            NotificationService.send_application_rejected(db, user_id, rejection_reason)
        except Exception:
            pass
            
        return user

    @staticmethod
    def admin_update_user_profile(
        db: Session,
        user_id: uuid.UUID,
        update_data: dict,
        current_admin_id: uuid.UUID
    ) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("المستخدم غير موجود")

        if update_data.get("full_name") or update_data.get("name"):
            user.full_name = (update_data.get("full_name") or update_data.get("name")).strip()
        if update_data.get("email"):
            new_email = update_data["email"].strip().lower()
            if new_email != user.email:
                exists = db.query(User).filter(User.email == new_email).first()
                if exists:
                    raise ValueError("البريد الإلكتروني مستخدم بالفعل")
                user.email = new_email
        if "phone" in update_data:
            user.phone = update_data["phone"]
        if "title" in update_data:
            user.title = update_data["title"]
        if "company_name" in update_data:
            user.company_name = update_data["company_name"]
        if "tax_number" in update_data or "taxNo" in update_data:
            user.tax_number = update_data.get("tax_number") or update_data.get("taxNo")
        if "commercial_register" in update_data or "commercial_register_url" in update_data or "regNo" in update_data:
            user.commercial_register_url = update_data.get("commercial_register") or update_data.get("commercial_register_url") or update_data.get("regNo")
        if "address" in update_data:
            user.address = update_data["address"]
        if "is_active" in update_data and update_data["is_active"] is not None:
            user.is_active = bool(update_data["is_active"])
        if "login" in update_data and update_data["login"] is not None:
            user.is_active = bool(update_data["login"])

        legal_val = update_data.get("legal_form") or update_data.get("legal")
        if legal_val:
            legal_map = {
                "فرد": LegalForm.individual,
                "مؤسسة فردية": LegalForm.sole_proprietorship,
                "شركة ذات مسؤولية محدودة": LegalForm.llc,
                "شركة تضامن": LegalForm.general_partnership,
                "شركة توصية بسيطة": LegalForm.limited_partnership,
                "شركة مساهمة خاصة": LegalForm.private_joint_stock,
                "شركة مساهمة عامة": LegalForm.public_joint_stock,
                "أكاديمي / باحث": LegalForm.researcher,
                "منظمة / هيئة": LegalForm.independent_entity,
                "جامعة": LegalForm.independent_entity,
                "جهة حكومية": LegalForm.independent_entity,
            }
            if legal_val in legal_map:
                user.legal_form = legal_map[legal_val]
            elif legal_val in [e.value for e in LegalForm]:
                user.legal_form = LegalForm(legal_val)

        entity_val = update_data.get("entity_type")
        if entity_val:
            entity_map = {
                "فرد": EntityType.individual,
                "شركة": EntityType.company,
                "باحث": EntityType.researcher,
                "individual": EntityType.individual,
                "company": EntityType.company,
                "researcher": EntityType.researcher,
            }
            if entity_val in entity_map:
                user.entity_type = entity_map[entity_val]
            elif entity_val in [e.value for e in EntityType]:
                user.entity_type = EntityType(entity_val)

        sec_val = update_data.get("sector")
        if sec_val:
            sec_map = {
                "خدمات": BusinessSector.services,
                "صناعي": BusinessSector.industrial,
                "صناعة": BusinessSector.industrial,
                "تجاري": BusinessSector.commercial,
                "تجارة": BusinessSector.commercial,
                "عقاري": BusinessSector.contracting,
                "زراعي": BusinessSector.agricultural,
                "زراعة": BusinessSector.agricultural,
                "services": BusinessSector.services,
                "industrial": BusinessSector.industrial,
                "commercial": BusinessSector.commercial,
                "agricultural": BusinessSector.agricultural,
                "contracting": BusinessSector.contracting,
                "banking": BusinessSector.banking,
            }
            if sec_val in sec_map:
                user.sector = sec_map[sec_val]
            elif sec_val in [e.value for e in BusinessSector]:
                user.sector = BusinessSector(sec_val)

        try:
            log_entry = AdminActionLog(
                admin_id=current_admin_id,
                action_type="update_user_profile",
                target_entity_type="user",
                target_entity_id=user.id,
                details=f"Admin updated profile of user {user.email}"
            )
            db.add(log_entry)
        except Exception:
            pass

        db.commit()
        db.refresh(user)

        return {
            "status": "success",
            "message": "تم تحديث بيانات المستخدم بنجاح في قاعدة البيانات",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "entity_type": user.entity_type.value if hasattr(user.entity_type, 'value') else str(user.entity_type),
                "company_name": user.company_name,
                "tax_number": user.tax_number,
                "sector": user.sector.value if hasattr(user.sector, 'value') else (str(user.sector) if user.sector else None),
                "is_active": user.is_active,
                "login": user.is_active,
                "title": user.title,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }

    @staticmethod
    def admin_reset_user_password(
        db: Session,
        user_id: uuid.UUID,
        new_password: Optional[str],
        mode: str,
        current_admin_id: uuid.UUID
    ) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("المستخدم غير موجود")

        if mode == "admin" and new_password:
            if len(new_password) < 8:
                raise ValueError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
            user.password_hash = hash_password(new_password)
            db.commit()

            try:
                log_entry = AdminActionLog(
                    admin_id=current_admin_id,
                    action_type="admin_password_reset",
                    target_entity_type="user",
                    target_entity_id=user.id,
                    details=f"Admin reset password for user {user.email}"
                )
                db.add(log_entry)
                db.commit()
            except Exception:
                pass

            return {"status": "success", "message": "تم تحديث وتعيين كلمة المرور بنجاح في قاعدة البيانات"}
        else:
            NotificationService.send(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.general,
                title="طلب إعادة تعيين كلمة المرور",
                message=f"تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني ({user.email})."
            )
            return {"status": "success", "message": f"تم إرسال رابط إعادة تعيين كلمة المرور إلى {user.email}"}

    @staticmethod
    def admin_delete_user(
        db: Session,
        user_id: uuid.UUID,
        current_admin_id: uuid.UUID
    ) -> dict:
        if user_id == current_admin_id:
            raise ValueError("لا يمكنك حذف حسابك الإداري الحالي")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("المستخدم غير موجود")

        user_email = user.email
        try:
            # Full cascade cleanup of all child records
            from models import (
                RefreshToken, Notification, ConsultantProfile, UserDocument,
                Favorite, UserPolicyAgreement, UserSubscription, SubscriptionOrder,
                SubscriptionRequest, Rating, ChatMessage, SupportTicket, TicketReply,
                Appointment, Invoice, RecurringInvoice, RefundedInvoice, AdminActionLog,
                ConsultantService, ConsultantAvailability, ConsultantCredential,
                ConsultantBankAccount, PayoutRequest, ServiceExpansionRequest,
                AppointmentCancellation
            )
            from sqlalchemy import or_

            # 1. If user is a consultant, clean up all consultant-specific data
            prof = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
            if prof:
                prof_id = prof.id
                # Clean appointments where user is consultant
                appt_ids = [a.id for a in db.query(Appointment.id).filter(Appointment.consultant_id == prof_id).all()]
                if appt_ids:
                    db.query(ChatMessage).filter(ChatMessage.appointment_id.in_(appt_ids)).delete(synchronize_session=False)
                    db.query(Rating).filter(Rating.appointment_id.in_(appt_ids)).delete(synchronize_session=False)
                    db.query(AppointmentCancellation).filter(AppointmentCancellation.appointment_id.in_(appt_ids)).delete(synchronize_session=False)
                    db.query(Invoice).filter(Invoice.appointment_id.in_(appt_ids)).delete(synchronize_session=False)
                    db.query(Appointment).filter(Appointment.id.in_(appt_ids)).delete(synchronize_session=False)

                db.query(ConsultantService).filter(ConsultantService.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(ConsultantCredential).filter(ConsultantCredential.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(ConsultantBankAccount).filter(ConsultantBankAccount.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(PayoutRequest).filter(PayoutRequest.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(ServiceExpansionRequest).filter(ServiceExpansionRequest.consultant_id == prof_id).delete(synchronize_session=False)
                db.query(Rating).filter(Rating.consultant_id == prof_id).delete(synchronize_session=False)
                db.delete(prof)
                db.flush()

            # 2. Clean appointments where user is client
            user_appt_ids = [a.id for a in db.query(Appointment.id).filter(Appointment.user_id == user_id).all()]
            if user_appt_ids:
                db.query(ChatMessage).filter(ChatMessage.appointment_id.in_(user_appt_ids)).delete(synchronize_session=False)
                db.query(Rating).filter(Rating.appointment_id.in_(user_appt_ids)).delete(synchronize_session=False)
                db.query(AppointmentCancellation).filter(AppointmentCancellation.appointment_id.in_(user_appt_ids)).delete(synchronize_session=False)
                db.query(Invoice).filter(Invoice.appointment_id.in_(user_appt_ids)).delete(synchronize_session=False)
                db.query(Appointment).filter(Appointment.id.in_(user_appt_ids)).delete(synchronize_session=False)

            # 3. Clean user direct dependencies
            db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
            db.query(Favorite).filter(Favorite.user_id == user_id).delete(synchronize_session=False)
            db.query(UserDocument).filter(UserDocument.user_id == user_id).delete(synchronize_session=False)
            db.query(UserPolicyAgreement).filter(UserPolicyAgreement.user_id == user_id).delete(synchronize_session=False)
            db.query(UserSubscription).filter(UserSubscription.user_id == user_id).delete(synchronize_session=False)
            db.query(SubscriptionOrder).filter(SubscriptionOrder.user_id == user_id).delete(synchronize_session=False)
            db.query(SubscriptionRequest).filter(SubscriptionRequest.user_id == user_id).delete(synchronize_session=False)
            db.query(Rating).filter(or_(Rating.user_id == user_id, Rating.reviewed_by == user_id)).delete(synchronize_session=False)
            db.query(ChatMessage).filter(or_(ChatMessage.sender_id == user_id, ChatMessage.receiver_id == user_id)).delete(synchronize_session=False)
            db.query(TicketReply).filter(TicketReply.author_id == user_id).delete(synchronize_session=False)
            db.query(SupportTicket).filter(or_(SupportTicket.submitted_by == user_id, SupportTicket.assigned_to == user_id)).delete(synchronize_session=False)
            db.query(Invoice).filter(Invoice.issued_to_user_id == user_id).delete(synchronize_session=False)
            db.query(RecurringInvoice).filter(RecurringInvoice.user_id == user_id).delete(synchronize_session=False)
            db.query(RefundedInvoice).filter(RefundedInvoice.user_id == user_id).delete(synchronize_session=False)
            db.query(AdminActionLog).filter(AdminActionLog.admin_id == user_id).delete(synchronize_session=False)

            # 4. Delete user record
            db.delete(user)
            db.commit()
        except Exception as e:
            db.rollback()
            raise ValueError(f"فشل حذف المستخدم من قاعدة البيانات: {str(e)}")

        try:
            log_entry = AdminActionLog(
                admin_id=current_admin_id,
                action_type="delete_user",
                target_entity_type="user",
                target_entity_id=user_id,
                details=f"Admin deleted user {user_email}"
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            pass

        return {"status": "success", "message": "تم حذف المستخدم نهائياً بنجاح"}

    @staticmethod
    def get_user_full_profile(db: Session, user_id: uuid.UUID) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("المستخدم غير موجود")

        # 1. User documents
        from models.user_document import UserDocument
        documents = db.query(UserDocument).filter(UserDocument.user_id == user_id).order_by(UserDocument.created_at.desc()).all()
        doc_list = [{
            "id": str(d.id),
            "filename": d.filename,
            "file_size": d.file_size,
            "content_type": d.content_type,
            "created_at": d.created_at.isoformat() if d.created_at else None
        } for d in documents]

        # 2. Appointments / Consultations
        from models.appointment import Appointment
        appts = db.query(Appointment).filter(
            Appointment.user_id == user_id
        ).order_by(Appointment.scheduled_at.desc()).limit(30).all()

        appt_list = []
        for a in appts:
            c_name = "المستشار الضريبي"
            if a.consultant and a.consultant.user:
                c_name = a.consultant.user.full_name
            
            s_type = a.session_type.value if hasattr(a.session_type, 'value') else str(a.session_type or '')
            s_status = a.status.value if hasattr(a.status, 'value') else str(a.status or '')
            
            appt_list.append({
                "id": str(a.id),
                "appointment_number": str(a.id)[:8].upper(),
                "consultant_name": c_name,
                "type": s_type,
                "status": s_status,
                "scheduled_start": a.scheduled_at.isoformat() if a.scheduled_at else None,
                "price": float(a.price) if a.price is not None else 0.0,
                "title": a.notes or "استشارة ضريبية متخصصة"
            })

        # 3. Active Subscription
        from models.user_subscription import UserSubscription
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).order_by(UserSubscription.created_at.desc()).first()
        sub_data = None
        if sub:
            sub_data = {
                "id": str(sub.id),
                "plan_name": sub.plan.name_ar if (sub.plan and hasattr(sub.plan, 'name_ar')) else (sub.plan.name if sub.plan else "الباقة الأساسية"),
                "status": sub.status if isinstance(sub.status, str) else (sub.status.value if hasattr(sub.status, 'value') else str(sub.status)),
                "points_balance": getattr(sub, 'points_total', 0) - getattr(sub, 'points_used', 0),
                "start_date": sub.start_date.isoformat() if sub.start_date else None,
                "end_date": sub.end_date.isoformat() if sub.end_date else None
            }

        # 4. Support Tickets
        from models.support_ticket import SupportTicket
        tickets = db.query(SupportTicket).filter(SupportTicket.submitted_by == user_id).order_by(SupportTicket.created_at.desc()).limit(15).all()
        ticket_list = [{
            "id": str(t.id),
            "ticket_number": t.ticket_number or str(t.id)[:8].upper(),
            "subject": t.subject,
            "category": t.category.value if hasattr(t.category, 'value') else str(t.category or ''),
            "priority": t.priority.value if hasattr(t.priority, 'value') else str(t.priority or ''),
            "status": t.status.value if hasattr(t.status, 'value') else str(t.status or ''),
            "created_at": t.created_at.isoformat() if t.created_at else None
        } for t in tickets]

        # 5. Admin Action Logs
        from models.admin_action_log import AdminActionLog
        logs = db.query(AdminActionLog).filter(
            or_(AdminActionLog.target_entity_id == user_id, AdminActionLog.admin_id == user_id)
        ).order_by(AdminActionLog.created_at.desc()).limit(15).all()
        log_list = [{
            "id": str(l.id),
            "action_type": l.action_type,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in logs]

        # 6. Real Ratings from Database
        from models.rating import Rating
        user_ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
        avg_rating = 0.0
        if user_ratings:
            avg_rating = round(sum(r.stars for r in user_ratings) / len(user_ratings), 1)

        # 7. Real Topic Interests based on user's actual consultations and tickets
        topic_counts = {
            "ضريبة الدخل": 0,
            "ضريبة المبيعات": 0,
            "الفوترة الإلكترونية": 0,
            "الاعتراضات والتسويات": 0
        }
        total_signals = 0

        for a in appts:
            notes_text = ((a.notes or "") + " " + (a.service.name if a.service else "")).lower()
            matched = False
            if "دخل" in notes_text or "income" in notes_text:
                topic_counts["ضريبة الدخل"] += 1
                matched = True
            if "مبيعات" in notes_text or "sales" in notes_text:
                topic_counts["ضريبة المبيعات"] += 1
                matched = True
            if "فوتر" in notes_text or "فاتور" in notes_text or "invoic" in notes_text:
                topic_counts["الفوترة الإلكترونية"] += 1
                matched = True
            if "اعتراض" in notes_text or "تسو" in notes_text or "appeal" in notes_text:
                topic_counts["الاعتراضات والتسويات"] += 1
                matched = True
            if matched:
                total_signals += 1

        for t in tickets:
            t_text = ((t.subject or "") + " " + (t.description or "")).lower()
            matched = False
            if "دخل" in t_text or "income" in t_text:
                topic_counts["ضريبة الدخل"] += 1
                matched = True
            if "مبيعات" in t_text or "sales" in t_text:
                topic_counts["ضريبة المبيعات"] += 1
                matched = True
            if "فوتر" in t_text or "فاتور" in t_text or "invoic" in t_text:
                topic_counts["الفوترة الإلكترونية"] += 1
                matched = True
            if "اعتراض" in t_text or "تسو" in t_text or "appeal" in t_text:
                topic_counts["الاعتراضات والتسويات"] += 1
                matched = True
            if matched:
                total_signals += 1

        topic_list = []
        for topic_name, count in topic_counts.items():
            pct = round((count / total_signals) * 100) if total_signals > 0 else 0
            topic_list.append({
                "topic": topic_name,
                "count": count,
                "pct": pct
            })

        # 8. Real Online Status & Last Seen from refresh_tokens table
        from models.refresh_token import RefreshToken
        from datetime import datetime, timezone, timedelta

        last_token = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).order_by(RefreshToken.created_at.desc()).first()

        now_utc = datetime.now(timezone.utc)
        is_online = False
        last_seen_str = "لم يدخل بعد"

        if last_token and last_token.created_at:
            token_time = last_token.created_at if last_token.created_at.tzinfo else last_token.created_at.replace(tzinfo=timezone.utc)
            time_diff = now_utc - token_time
            if time_diff < timedelta(minutes=15) and not last_token.is_revoked:
                is_online = True
                last_seen_str = "متصل الآن"
            else:
                mins = int(time_diff.total_seconds() / 60)
                hours = int(mins / 60)
                days = int(hours / 24)
                if mins < 60:
                    last_seen_str = f"منذ {mins} دقيقة"
                elif hours < 24:
                    last_seen_str = f"منذ {hours} ساعة"
                elif days < 7:
                    last_seen_str = f"منذ {days} أيام"
                else:
                    last_seen_str = token_time.strftime("%Y-%m-%d")
        elif user.created_at:
            last_seen_str = f"انضم في {user.created_at.strftime('%Y-%m-%d')}"

        completed_sessions = sum(1 for a in appts if str(a.status).lower() in ("completed", "confirmed"))
        video_sessions = sum(1 for a in appts if "video" in str(getattr(a, 'session_type', '')).lower())
        chat_sessions = sum(1 for a in appts if "chat" in str(getattr(a, 'session_type', '')).lower() or "messaging" in str(getattr(a, 'session_type', '')).lower())

        return {
            "id": str(user.id),
            "account_id": f"CUS-{str(user.id).replace('-', '')[:6].upper()}",
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone or "—",
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "entity_type": user.entity_type.value if hasattr(user.entity_type, 'value') else str(user.entity_type),
            "company_name": user.company_name or "—",
            "tax_number": user.tax_number or "—",
            "national_id": getattr(user, 'national_id', None) or "—",
            "commercial_register": getattr(user, 'commercial_register', None) or "—",
            "legal_form": getattr(user, 'legal_form', None),
            "sector": user.sector.value if (user.sector and hasattr(user.sector, 'value')) else (str(user.sector) if user.sector else "خدمات"),
            "address": user.address or "عمّان",
            "is_active": user.is_active,
            "is_online": is_online,
            "verification_status": user.verification_status.value if (user.verification_status and hasattr(user.verification_status, 'value')) else "approved",
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": last_seen_str,
            "documents": doc_list,
            "appointments": appt_list,
            "subscription": sub_data,
            "tickets": ticket_list,
            "logs": log_list,
            "topics": topic_list,
            "total_topic_signals": total_signals,
            "stats": {
                "total_consultations": len(appt_list),
                "completed_consultations": completed_sessions,
                "video_sessions": video_sessions,
                "chat_sessions": chat_sessions,
                "tickets_count": len(ticket_list),
                "avg_rating": avg_rating,
                "ratings_count": len(user_ratings)
            }
        }

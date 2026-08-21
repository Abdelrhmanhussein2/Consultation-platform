import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from models import (
    User, Specialization, ConsultantProfile, ConsultantCredential,
    ServiceExpansionRequest, ConsultantService as ConsultantServiceModel, Appointment,
    AppointmentCancellation, Rating, Notification, Invoice, AdminActionLog,
    UserRole, VerificationStatus, AppointmentStatus, ActorRole, RatingStatus,
    NotificationType, InvoiceType, InvoiceStatus
)
from helpers.enums import EntityType, BusinessSector
from services.auth_utils import hash_password, verify_password


# =====================================================================
# USER SERVICE
# =====================================================================
class UserService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID) -> User:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create_user(db: Session, user_in, role: UserRole = UserRole.user) -> User:
        db_user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            phone=user_in.phone,
            password_hash=hash_password(user_in.password),
            role=role,
            entity_type=getattr(user_in, "entity_type", None) or EntityType.individual,
            company_name=getattr(user_in, "company_name", None),
            tax_number=getattr(user_in, "tax_number", None),
            sector=getattr(user_in, "sector", None),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # If registering as a consultant, automatically create their profile
        if db_user.role == UserRole.consultant:
            profile = ConsultantProfile(user_id=db_user.id)
            db.add(profile)
            db.commit()

        return db_user

    @staticmethod
    def update_profile(db: Session, user: User, update_in) -> User:
        if update_in.full_name is not None:
            user.full_name = update_in.full_name
        if update_in.phone is not None:
            user.phone = update_in.phone
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


# =====================================================================
# CONSULTANT SERVICE
# =====================================================================
class ConsultantService:

    # ── Profile read operations ──────────────────────────────────────

    @staticmethod
    def get_profile_by_user_id(db: Session, user_id: uuid.UUID) -> ConsultantProfile:
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.user_id == user_id
        ).first()

    @staticmethod
    def get_profile_by_id(db: Session, profile_id: uuid.UUID) -> ConsultantProfile:
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.id == profile_id
        ).first()

    @staticmethod
    def get_public_profile(db: Session, profile_id: uuid.UUID) -> dict | None:
        """
        Returns a rich public profile including consultant user info,
        specialization name, and active services list.
        """
        profile = (
            db.query(ConsultantProfile)
            .options(
                joinedload(ConsultantProfile.user),
                joinedload(ConsultantProfile.specialization),
                joinedload(ConsultantProfile.services),
            )
            .filter(
                and_(
                    ConsultantProfile.id == profile_id,
                    ConsultantProfile.verification_status == VerificationStatus.approved,
                )
            )
            .first()
        )
        if not profile:
            return None

        active_services = [s for s in profile.services if s.is_active]

        return {
            "id": profile.id,
            "full_name": profile.user.full_name,
            "bio": profile.bio,
            "main_specialization_id": profile.main_specialization_id,
            "specialization_name": profile.specialization.name if profile.specialization else None,
            "average_rating": profile.average_rating,
            "ratings_count": profile.ratings_count,
            "role": profile.user.role,
            "services": active_services,
        }

    @staticmethod
    def list_consultants(
        db: Session,
        specialization_id: int | None = None,
        service_name: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        min_rating: float | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> list[dict]:
        """
        Returns a paginated list of approved consultant cards with optional filters.
        Filters: specialization, service name keyword, price range, min rating.
        """
        query = (
            db.query(ConsultantProfile)
            .options(
                joinedload(ConsultantProfile.user),
                joinedload(ConsultantProfile.specialization),
                joinedload(ConsultantProfile.services),
            )
            .filter(ConsultantProfile.verification_status == VerificationStatus.approved)
        )

        if specialization_id is not None:
            query = query.filter(
                ConsultantProfile.main_specialization_id == specialization_id
            )

        if min_rating is not None:
            query = query.filter(ConsultantProfile.average_rating >= min_rating)

        profiles = query.offset((page - 1) * limit).limit(limit).all()

        results = []
        for profile in profiles:
            active_services = [s for s in profile.services if s.is_active]

            # Apply service-level filters (name keyword, price range)
            if service_name:
                keyword = service_name.lower()
                active_services = [
                    s for s in active_services if keyword in s.name.lower()
                ]
                if not active_services:
                    continue  # Skip this consultant if no matching service

            if min_price is not None:
                active_services = [s for s in active_services if s.price >= min_price]
            if max_price is not None:
                active_services = [s for s in active_services if s.price <= max_price]

            if (min_price is not None or max_price is not None) and not active_services:
                continue

            results.append({
                "profile_id": profile.id,
                "full_name": profile.user.full_name,
                "bio": profile.bio,
                "main_specialization_id": profile.main_specialization_id,
                "specialization_name": profile.specialization.name if profile.specialization else None,
                "average_rating": profile.average_rating,
                "ratings_count": profile.ratings_count,
                "role": profile.user.role,
                "services_count": len(active_services),
            })

        return results

    # ── Profile write operations ─────────────────────────────────────

    @staticmethod
    def update_profile(db: Session, user_id: uuid.UUID, profile_in) -> ConsultantProfile:
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.user_id == user_id
        ).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        if profile_in.bio is not None:
            profile.bio = profile_in.bio
        if profile_in.main_specialization_id is not None:
            profile.main_specialization_id = profile_in.main_specialization_id
        db.commit()
        db.refresh(profile)
        return profile

    # ── Credential operations ────────────────────────────────────────

    @staticmethod
    def submit_credential(
        db: Session, consultant_id: uuid.UUID, spec_id: int, document_url: str
    ) -> ConsultantCredential:
        credential = ConsultantCredential(
            consultant_id=consultant_id,
            specialization_id=spec_id,
            document_url=document_url,
            status=VerificationStatus.pending,
        )
        db.add(credential)
        db.commit()
        db.refresh(credential)
        return credential

    @staticmethod
    def review_credential(
        db: Session,
        credential_id: uuid.UUID,
        admin_id: uuid.UUID,
        status: VerificationStatus,
        rejection_reason: str = None,
    ) -> ConsultantCredential:
        credential = db.query(ConsultantCredential).filter(
            ConsultantCredential.id == credential_id
        ).first()
        if not credential:
            raise ValueError("Credential not found")

        credential.status = status
        credential.reviewed_by = admin_id
        credential.reviewed_at = datetime.now(timezone.utc)
        credential.rejection_reason = rejection_reason
        db.commit()
        db.refresh(credential)

        # Notify the consultant about credential review result
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == credential.consultant_id
        ).first()
        if profile:
            notification = Notification(
                user_id=profile.user_id,
                type=NotificationType.credential_status_update,
                title="تحديث حالة الأوراق والمستندات",
                message=(
                    f"تم {'قبول' if status == VerificationStatus.approved else 'رفض'} "
                    f"أوراق التخصص الخاصة بك."
                    f"{f' السبب: {rejection_reason}' if rejection_reason else ''}"
                ),
                related_entity_type="credential",
                related_entity_id=credential.id,
            )
            db.add(notification)

            if status == VerificationStatus.approved:
                profile.verification_status = VerificationStatus.approved
                profile.main_specialization_id = credential.specialization_id

            db.commit()

        return credential

    # ── Service management ───────────────────────────────────────────

    @staticmethod
    def get_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantServiceModel]:
        """Returns all services (active and inactive) for a consultant profile."""
        return (
            db.query(ConsultantServiceModel)
            .filter(ConsultantServiceModel.consultant_id == consultant_id)
            .order_by(ConsultantServiceModel.created_at.desc())
            .all()
        )

    @staticmethod
    def get_active_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantServiceModel]:
        """Returns only active services for a given consultant profile."""
        return (
            db.query(ConsultantServiceModel)
            .filter(
                and_(
                    ConsultantServiceModel.consultant_id == consultant_id,
                    ConsultantServiceModel.is_active == True,
                )
            )
            .order_by(ConsultantServiceModel.created_at.desc())
            .all()
        )

    @staticmethod
    def add_service(db: Session, consultant_id: uuid.UUID, service_in) -> ConsultantServiceModel:
        """
        Adds a new service for a consultant.
        Out-of-specialization services require a valid approved expansion request ID.
        """
        if service_in.is_out_of_specialization:
            if not service_in.expansion_request_id:
                raise ValueError(
                    "Out-of-specialization services require an approved expansion request ID"
                )
            req_uuid = (
                uuid.UUID(service_in.expansion_request_id)
                if isinstance(service_in.expansion_request_id, str)
                else service_in.expansion_request_id
            )
            exp_req = db.query(ServiceExpansionRequest).filter(
                and_(
                    ServiceExpansionRequest.id == req_uuid,
                    ServiceExpansionRequest.status == VerificationStatus.approved,
                )
            ).first()
            if not exp_req:
                raise ValueError("Approved service expansion request not found for this ID")

        db_service = ConsultantServiceModel(
            consultant_id=consultant_id,
            specialization_id=service_in.specialization_id,
            name=service_in.name,
            description=service_in.description,
            price=service_in.price,
            duration_minutes=service_in.duration_minutes,
            is_out_of_specialization=service_in.is_out_of_specialization,
            expansion_request_id=(
                uuid.UUID(service_in.expansion_request_id)
                if service_in.expansion_request_id
                else None
            ),
        )
        db.add(db_service)
        db.commit()
        db.refresh(db_service)
        return db_service

    @staticmethod
    def update_service(
        db: Session, consultant_id: uuid.UUID, service_id: uuid.UUID, update_in
    ) -> ConsultantServiceModel:
        """Updates editable fields on an existing service."""
        service = db.query(ConsultantServiceModel).filter(
            and_(
                ConsultantServiceModel.id == service_id,
                ConsultantServiceModel.consultant_id == consultant_id,
            )
        ).first()
        if not service:
            raise ValueError("Service not found or does not belong to this consultant")

        if update_in.name is not None:
            service.name = update_in.name
        if update_in.description is not None:
            service.description = update_in.description
        if update_in.price is not None:
            service.price = update_in.price
        if update_in.duration_minutes is not None:
            service.duration_minutes = update_in.duration_minutes

        db.commit()
        db.refresh(service)
        return service

    @staticmethod
    def toggle_service(
        db: Session, consultant_id: uuid.UUID, service_id: uuid.UUID
    ) -> ConsultantServiceModel:
        """Toggles a service between active and inactive."""
        service = db.query(ConsultantServiceModel).filter(
            and_(
                ConsultantServiceModel.id == service_id,
                ConsultantServiceModel.consultant_id == consultant_id,
            )
        ).first()
        if not service:
            raise ValueError("Service not found or does not belong to this consultant")
        service.is_active = not service.is_active
        db.commit()
        db.refresh(service)
        return service

    # ── Service Expansion operations ─────────────────────────────────

    @staticmethod
    def submit_service_expansion(
        db: Session, consultant_id: uuid.UUID, request_in
    ) -> ServiceExpansionRequest:
        request = ServiceExpansionRequest(
            consultant_id=consultant_id,
            requested_specialization_id=request_in.requested_specialization_id,
            service_name=request_in.service_name,
            service_description=request_in.service_description,
            proof_document_url=request_in.proof_document_url,
            status=VerificationStatus.pending,
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def get_clients(db: Session, consultant_id: uuid.UUID, page: int = 1, limit: int = 20) -> list[dict]:
        """
        Retrieves a paginated list of clients who booked appointments with the consultant,
        including aggregated statistics per client.
        """
        from sqlalchemy import case
        now = datetime.now(timezone.utc)
        
        query = (
            db.query(
                User.id.label("user_id"),
                User.full_name.label("full_name"),
                User.email.label("email"),
                User.phone.label("phone"),
                func.count(Appointment.id).label("total_sessions"),
                func.sum(case((Appointment.status == AppointmentStatus.completed, 1), else_=0)).label("completed_sessions"),
                func.sum(case((Appointment.status.in_([AppointmentStatus.cancelled_by_user, AppointmentStatus.cancelled_by_consultant]), 1), else_=0)).label("cancelled_sessions"),
                func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")).label("total_paid"),
                func.avg(Rating.stars).label("average_rating_given"),
                func.max(case((Appointment.scheduled_at < now, Appointment.scheduled_at), else_=None)).label("last_appointment_at"),
                func.min(case((Appointment.scheduled_at >= now, Appointment.scheduled_at), else_=None)).label("next_appointment_at"),
                func.min(Appointment.scheduled_at).label("first_session_at")
            )
            .join(Appointment, Appointment.user_id == User.id)
            .outerjoin(Rating, Rating.appointment_id == Appointment.id)
            .outerjoin(Invoice, and_(Invoice.appointment_id == Appointment.id, Invoice.status == InvoiceStatus.paid))
            .filter(Appointment.consultant_id == consultant_id)
            .group_by(User.id, User.full_name, User.email, User.phone)
            .order_by(func.max(Appointment.scheduled_at).desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        
        results = query.all()
        
        clients_list = []
        for r in results:
            clients_list.append({
                "user_id": r.user_id,
                "full_name": r.full_name,
                "email": r.email,
                "phone": r.phone,
                "total_sessions": r.total_sessions,
                "completed_sessions": r.completed_sessions,
                "cancelled_sessions": r.cancelled_sessions,
                "total_paid": r.total_paid,
                "average_rating_given": r.average_rating_given,
                "last_appointment_at": r.last_appointment_at,
                "next_appointment_at": r.next_appointment_at,
                "first_session_at": r.first_session_at,
            })
        return clients_list


# =====================================================================
# SERVICE EXPANSION SERVICE  (admin review + role upgrade)
# =====================================================================
class ServiceExpansionService:

    @staticmethod
    def list_pending(db: Session) -> list[ServiceExpansionRequest]:
        """Returns all pending service expansion requests for admin review."""
        return (
            db.query(ServiceExpansionRequest)
            .filter(ServiceExpansionRequest.status == VerificationStatus.pending)
            .order_by(ServiceExpansionRequest.created_at.asc())
            .all()
        )

    @staticmethod
    def review(
        db: Session,
        request_id: uuid.UUID,
        admin_id: uuid.UUID,
        action: str,
        rejection_reason: str | None = None,
    ) -> ServiceExpansionRequest:
        """
        Admin approves or rejects a service expansion request.
        On approval → consultant's role is upgraded to `platform_consultant`.
        """
        exp_req = db.query(ServiceExpansionRequest).filter(
            ServiceExpansionRequest.id == request_id
        ).first()
        if not exp_req:
            raise ValueError("Service expansion request not found")
        if exp_req.status != VerificationStatus.pending:
            raise ValueError("This request has already been reviewed")

        new_status = (
            VerificationStatus.approved if action == "approve" else VerificationStatus.rejected
        )
        exp_req.status = new_status
        exp_req.reviewed_by = admin_id
        exp_req.reviewed_at = datetime.now(timezone.utc)
        exp_req.rejection_reason = rejection_reason
        db.commit()
        db.refresh(exp_req)

        # Fetch the consultant's profile and their user account
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == exp_req.consultant_id
        ).first()

        if profile:
            # ── Role upgrade ─────────────────────────────────────────
            if new_status == VerificationStatus.approved:
                user = db.query(User).filter(User.id == profile.user_id).first()
                if user and user.role == UserRole.consultant:
                    user.role = UserRole.platform_consultant

            # ── Notification ─────────────────────────────────────────
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.service_request_status_update,
                title="تحديث حالة طلب توسيع الخدمات",
                message=(
                    f"تم {'قبول' if new_status == VerificationStatus.approved else 'رفض'} "
                    f"طلب إضافة الخدمة '{exp_req.service_name}'."
                    f"{f' السبب: {rejection_reason}' if rejection_reason else ''}"
                ),
                related_entity_type="service_expansion_request",
                related_entity_id=exp_req.id,
            ))
            db.commit()

        return exp_req


# =====================================================================
# APPOINTMENT SERVICE
# =====================================================================
class AppointmentService:

    CANCELLATION_CUTOFF_HOURS = 24  # Hours before appointment where cancellation is blocked

    @staticmethod
    def book_appointment(db: Session, client_id: uuid.UUID, appt_in) -> Appointment:
        """
        Books an appointment for a client.
        Appointment starts as `pending_approval` — consultant must approve before payment.
        Service price is captured at booking time.
        """
        consultant_uuid = (
            uuid.UUID(appt_in.consultant_id)
            if isinstance(appt_in.consultant_id, str)
            else appt_in.consultant_id
        )

        # Verify the consultant is approved
        consultant = db.query(ConsultantProfile).filter(
            and_(
                ConsultantProfile.id == consultant_uuid,
                ConsultantProfile.verification_status == VerificationStatus.approved,
            )
        ).first()
        if not consultant:
            raise ValueError("Consultant is not approved or profile does not exist")

        if consultant.user_id == client_id:
            raise ValueError("لا يمكن للمستشار حجز موعد مع نفسه")

        # Resolve service and price
        price = Decimal("0.00")
        duration = appt_in.duration_minutes

        if appt_in.service_id:
            service_uuid = (
                uuid.UUID(appt_in.service_id)
                if isinstance(appt_in.service_id, str)
                else appt_in.service_id
            )
            service = db.query(ConsultantServiceModel).filter(
                and_(
                    ConsultantServiceModel.id == service_uuid,
                    ConsultantServiceModel.consultant_id == consultant_uuid,
                    ConsultantServiceModel.is_active == True,
                )
            ).first()
            if not service:
                raise ValueError("Active service not found for this consultant")
            price = service.price
            duration = service.duration_minutes

        appointment = Appointment(
            consultant_id=consultant_uuid,
            user_id=client_id,
            service_id=uuid.UUID(appt_in.service_id) if appt_in.service_id else None,
            scheduled_at=appt_in.scheduled_at,
            duration_minutes=duration,
            status=AppointmentStatus.pending_approval,
            created_by_role=ActorRole.user,
            price=price,
            notes=appt_in.notes,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        # Notify consultant — awaiting their approval
        db.add(Notification(
            user_id=consultant.user_id,
            type=NotificationType.appointment_booked,
            title="طلب حجز موعد جديد",
            message=(
                f"قام أحد العملاء بطلب حجز موعد معك بتاريخ "
                f"{appt_in.scheduled_at.strftime('%Y-%m-%d %H:%M')}. "
                f"يرجى مراجعة الطلب والموافقة عليه."
            ),
            related_entity_type="appointment",
            related_entity_id=appointment.id,
        ))
        db.commit()

        return appointment

    @staticmethod
    def approve_appointment(
        db: Session, consultant_profile_id: uuid.UUID, appointment_id: uuid.UUID
    ) -> Appointment:
        """
        Consultant approves a pending_approval appointment.
        Status moves to `pending_payment` and the client is notified to pay.
        """
        appt = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.consultant_id == consultant_profile_id,
            )
        ).first()
        if not appt:
            raise ValueError("Appointment not found or does not belong to you")
        if appt.status != AppointmentStatus.pending_approval:
            raise ValueError(
                f"Cannot approve an appointment with status '{appt.status.value}'. "
                "Only appointments awaiting approval can be approved."
            )

        appt.status = AppointmentStatus.pending_payment
        db.commit()
        db.refresh(appt)

        # Notify client — payment is now required
        db.add(Notification(
            user_id=appt.user_id,
            type=NotificationType.payment_required,
            title="تمت الموافقة على موعدك — يرجى الدفع",
            message=(
                f"وافق المستشار على طلب الحجز بتاريخ "
                f"{appt.scheduled_at.strftime('%Y-%m-%d %H:%M')}. "
                f"يرجى إتمام الدفع لتأكيد الموعد."
            ),
            related_entity_type="appointment",
            related_entity_id=appt.id,
        ))
        db.commit()

        return appt

    @staticmethod
    def confirm_payment(
        db: Session, appointment_id: uuid.UUID, user_id: uuid.UUID, payment_method: str
    ) -> Invoice:
        """
        Simulates payment: marks appointment as `confirmed` and creates a paid invoice.
        Only the appointment owner can pay, and only if status is `pending_payment`
        (i.e., consultant has already approved the booking).
        """
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id,
            )
        ).first()
        if not appointment:
            raise ValueError("Appointment not found or does not belong to you")
        if appointment.status != AppointmentStatus.pending_payment:
            raise ValueError(
                f"Cannot pay for appointment with status '{appointment.status.value}'. "
                "The consultant must approve your booking before payment."
            )

        # Mark appointment as confirmed
        appointment.status = AppointmentStatus.confirmed
        db.commit()

        # Create Daily.co session room
        try:
            from services.daily_service import DailyService
            duration = appointment.duration_minutes or 60
            room_info = DailyService.create_room(str(appointment.id), duration)
            appointment.session_room_name = room_info.get("room_name")
            appointment.session_room_url = room_info.get("room_url")
            db.commit()

            # Send notification to client
            db.add(Notification(
                user_id=appointment.user_id,
                type=NotificationType.session_link_ready,
                title="رابط جلسة الاستشارة جاهز",
                message=f"تم تأكيد الحجز وإنشاء غرفة المحادثة للفيديو. يمكنك الانضمام عبر الرابط: {appointment.session_room_url}",
                related_entity_type="appointment",
                related_entity_id=appointment.id,
            ))
            
            # Send notification to consultant
            consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == appointment.consultant_id).first()
            if consultant:
                db.add(Notification(
                    user_id=consultant.user_id,
                    type=NotificationType.session_link_ready,
                    title="رابط جلسة الاستشارة جاهز",
                    message=f"تم سداد قيمة الاستشارة وإنشاء غرفة المحادثة للفيديو. يمكنك الانضمام عبر الرابط: {appointment.session_room_url}",
                    related_entity_type="appointment",
                    related_entity_id=appointment.id,
                ))
            db.commit()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to initialize Daily.co room: {str(e)}")

        now = datetime.now(timezone.utc)
        invoice_number = f"INV-{now.strftime('%Y%m%d')}-{str(appointment_id)[:8].upper()}"

        amount = appointment.price or Decimal("0.00")
        tax = (amount * Decimal("0.14")).quantize(Decimal("0.01"))  # 14% VAT
        total = amount + tax

        invoice = Invoice(
            invoice_number=invoice_number,
            type=InvoiceType.client_invoice,
            appointment_id=appointment_id,
            issued_to_user_id=user_id,
            amount=amount,
            tax_amount=tax,
            total_amount=total,
            currency="EGP",
            status=InvoiceStatus.paid,
            payment_method=payment_method,
            issued_at=now,
            paid_at=now,
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_user_appointments(
        db: Session, user_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> list[Appointment]:
        """Returns a paginated list of appointments for a user/client."""
        return (
            db.query(Appointment)
            .filter(Appointment.user_id == user_id)
            .order_by(Appointment.scheduled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_consultant_appointments(
        db: Session, consultant_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> list[Appointment]:
        """Returns a paginated list of appointments for a consultant profile."""
        return (
            db.query(Appointment)
            .filter(Appointment.consultant_id == consultant_id)
            .order_by(Appointment.scheduled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

    @staticmethod
    def cancel_appointment(
        db: Session,
        user_id: uuid.UUID,
        appt_id: uuid.UUID,
        reason: str,
        role: UserRole,
    ) -> AppointmentCancellation:
        """
        Cancels an appointment.
        - Users cannot cancel within 24 hours of the scheduled time.
        - Consultants CANNOT cancel an appointment after it has been paid (confirmed).
          They must use reschedule instead.
        - Admins can always cancel.
        """
        appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
        if not appt:
            raise ValueError("Appointment not found")

        is_consultant = role in (UserRole.consultant, UserRole.platform_consultant)
        is_admin = role in (UserRole.admin, UserRole.super_admin)

        # Block consultant from cancelling a paid (confirmed) appointment
        if is_consultant and appt.status == AppointmentStatus.confirmed:
            raise ValueError(
                "لا يمكن إلغاء موعد مدفوع. يمكنك تأجيل الموعد لوقت آخر بدلاً من ذلك."
            )

        # Enforce 24h cancellation cutoff for regular users
        if role == UserRole.user:
            cutoff = appt.scheduled_at - timedelta(
                hours=AppointmentService.CANCELLATION_CUTOFF_HOURS
            )
            now = datetime.now(timezone.utc)
            # Handle timezone-naive datetimes returned by SQLite / tests
            if appt.scheduled_at.tzinfo is None:
                now = datetime.utcnow()
            if now >= cutoff:
                raise ValueError(
                    "Cannot cancel an appointment within 24 hours of its scheduled time"
                )

        actor_role = ActorRole.user
        if is_consultant:
            actor_role = ActorRole.consultant
        elif is_admin:
            actor_role = ActorRole.admin

        # Update appointment status to reflect who cancelled
        if actor_role == ActorRole.user:
            appt.status = AppointmentStatus.cancelled_by_user
        elif actor_role == ActorRole.consultant:
            appt.status = AppointmentStatus.cancelled_by_consultant
        # admin cancellations keep the appointment status as-is or can be set to either
        db.commit()

        cancellation = AppointmentCancellation(
            appointment_id=appt_id,
            cancelled_by=user_id,
            cancelled_by_role=actor_role,
            reason=reason,
            within_policy=True,
        )
        db.add(cancellation)
        db.commit()
        db.refresh(cancellation)
        return cancellation

    @staticmethod
    def reschedule_appointment(
        db: Session,
        requester_user_id: uuid.UUID,
        consultant_profile_id: uuid.UUID,
        appt_id: uuid.UUID,
        new_scheduled_at,
        reason: str | None,
        role: UserRole,
    ) -> Appointment:
        """
        Reschedules a confirmed appointment to a new time.
        - Consultants can reschedule any confirmed appointment assigned to them.
        - Clients can reschedule if more than 24h remain before the scheduled time.
        - Notifies the other party about the change.
        """
        appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
        if not appt:
            raise ValueError("Appointment not found")

        if appt.status != AppointmentStatus.confirmed:
            raise ValueError(
                f"Only confirmed (paid) appointments can be rescheduled. "
                f"Current status: '{appt.status.value}'."
            )

        is_consultant = role in (UserRole.consultant, UserRole.platform_consultant)

        # Validate ownership
        if is_consultant and appt.consultant_id != consultant_profile_id:
            raise ValueError("This appointment does not belong to you")
        if role == UserRole.user and appt.user_id != requester_user_id:
            raise ValueError("This appointment does not belong to you")

        # Enforce 24h reschedule cutoff for regular users
        if role == UserRole.user:
            cutoff = appt.scheduled_at - timedelta(
                hours=AppointmentService.CANCELLATION_CUTOFF_HOURS
            )
            now = datetime.now(timezone.utc)
            # Handle timezone-naive datetimes returned by SQLite / tests
            if appt.scheduled_at.tzinfo is None:
                now = datetime.utcnow()
            if now >= cutoff:
                raise ValueError(
                    "Cannot reschedule an appointment within 24 hours of its scheduled time"
                )

        old_time = appt.scheduled_at
        appt.scheduled_at = new_scheduled_at
        db.commit()
        db.refresh(appt)

        # Notify the OTHER party
        notify_user_id = appt.user_id if is_consultant else None
        if not is_consultant:
            # Notify the consultant
            consultant = db.query(ConsultantProfile).filter(
                ConsultantProfile.id == appt.consultant_id
            ).first()
            notify_user_id = consultant.user_id if consultant else None

        if notify_user_id:
            requester_label = "المستشار" if is_consultant else "العميل"
            db.add(Notification(
                user_id=notify_user_id,
                type=NotificationType.appointment_rescheduled,
                title="تم تأجيل موعدك",
                message=(
                    f"قام {requester_label} بتأجيل الموعد من "
                    f"{old_time.strftime('%Y-%m-%d %H:%M')} إلى "
                    f"{new_scheduled_at.strftime('%Y-%m-%d %H:%M')}."
                    + (f" السبب: {reason}" if reason else "")
                ),
                related_entity_type="appointment",
                related_entity_id=appt.id,
            ))
            db.commit()

        return appt


# =====================================================================
# RATING SERVICE
# =====================================================================
class RatingService:
    @staticmethod
    def rate_appointment(
        db: Session,
        client_id: uuid.UUID,
        appt_id: uuid.UUID,
        stars: int,
        comment: str = None,
        low_rating_reason: str = None,
    ) -> Rating:
        appt = db.query(Appointment).filter(
            and_(Appointment.id == appt_id, Appointment.user_id == client_id)
        ).first()
        if not appt:
            raise ValueError("Appointment not found or does not belong to you")

        rating = Rating(
            appointment_id=appt_id,
            consultant_id=appt.consultant_id,
            user_id=client_id,
            stars=stars,
            comment=comment,
            low_rating_reason=low_rating_reason,
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


# =====================================================================
# INVOICE SERVICE
# =====================================================================
class InvoiceService:

    @staticmethod
    def get_user_invoices(
        db: Session,
        user_id: uuid.UUID,
        status: InvoiceStatus | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> list[Invoice]:
        """
        Retrieves paginated invoices issued to a specific user, newest first.
        """
        query = db.query(Invoice).filter(Invoice.issued_to_user_id == user_id)
        if status is not None:
            query = query.filter(Invoice.status == status)

        offset = (page - 1) * limit
        return query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_invoice_by_id(
        db: Session,
        user_id: uuid.UUID,
        invoice_id: uuid.UUID,
        is_admin: bool = False,
    ) -> Invoice:
        """
        Retrieves a single invoice by ID. Regular users can only access their own invoices.
        """
        query = db.query(Invoice).filter(Invoice.id == invoice_id)
        if not is_admin:
            query = query.filter(Invoice.issued_to_user_id == user_id)

        invoice = query.first()
        if not invoice:
            raise ValueError("الفاتورة غير موجودة أو ليس لديك صلاحية للوصول إليها")
        return invoice


# =====================================================================
# SPECIALIZATION SERVICE
# =====================================================================
class SpecializationService:

    @staticmethod
    def get_all(db: Session) -> list[Specialization]:
        """
        Returns all available specializations ordered by name.
        """
        return db.query(Specialization).order_by(Specialization.name.asc()).all()

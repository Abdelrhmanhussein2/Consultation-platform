import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from models import (
    User, Specialization, ConsultantProfile, ConsultantCredential,
    ServiceExpansionRequest, ConsultantService, Appointment,
    AppointmentCancellation, Rating, Notification, Invoice, AdminActionLog,
    UserRole, VerificationStatus, AppointmentStatus, ActorRole, RatingStatus,
    NotificationType, InvoiceType, InvoiceStatus
)
from services.auth_utils import hash_password


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
            role=role
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
    def get_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantService]:
        """Returns all services (active and inactive) for a consultant profile."""
        return (
            db.query(ConsultantService)
            .filter(ConsultantService.consultant_id == consultant_id)
            .order_by(ConsultantService.created_at.desc())
            .all()
        )

    @staticmethod
    def get_active_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantService]:
        """Returns only active services for a given consultant profile."""
        return (
            db.query(ConsultantService)
            .filter(
                and_(
                    ConsultantService.consultant_id == consultant_id,
                    ConsultantService.is_active == True,
                )
            )
            .order_by(ConsultantService.created_at.desc())
            .all()
        )

    @staticmethod
    def add_service(db: Session, consultant_id: uuid.UUID, service_in) -> ConsultantService:
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

        db_service = ConsultantService(
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
    ) -> ConsultantService:
        """Updates editable fields on an existing service."""
        service = db.query(ConsultantService).filter(
            and_(
                ConsultantService.id == service_id,
                ConsultantService.consultant_id == consultant_id,
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
    ) -> ConsultantService:
        """Toggles a service between active and inactive."""
        service = db.query(ConsultantService).filter(
            and_(
                ConsultantService.id == service_id,
                ConsultantService.consultant_id == consultant_id,
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
        Books an appointment for a client. Appointment starts as `pending` (unpaid).
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

        # Resolve service and price
        price = Decimal("0.00")
        duration = appt_in.duration_minutes

        if appt_in.service_id:
            service_uuid = (
                uuid.UUID(appt_in.service_id)
                if isinstance(appt_in.service_id, str)
                else appt_in.service_id
            )
            service = db.query(ConsultantService).filter(
                and_(
                    ConsultantService.id == service_uuid,
                    ConsultantService.consultant_id == consultant_uuid,
                    ConsultantService.is_active == True,
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
            status=AppointmentStatus.pending,
            created_by_role=ActorRole.user,
            price=price,
            notes=appt_in.notes,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        # Notify consultant
        db.add(Notification(
            user_id=consultant.user_id,
            type=NotificationType.appointment_booked,
            title="حجز موعد جديد",
            message=(
                f"قام أحد العملاء بحجز موعد جديد معك بتاريخ "
                f"{appt_in.scheduled_at.strftime('%Y-%m-%d %H:%M')}"
            ),
            related_entity_type="appointment",
            related_entity_id=appointment.id,
        ))
        db.commit()

        return appointment

    @staticmethod
    def confirm_payment(
        db: Session, appointment_id: uuid.UUID, user_id: uuid.UUID, payment_method: str
    ) -> Invoice:
        """
        Simulates payment: marks appointment as `confirmed` and creates a paid invoice.
        Only the appointment owner can pay, and only if status is `pending`.
        """
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.user_id == user_id,
            )
        ).first()
        if not appointment:
            raise ValueError("Appointment not found or does not belong to you")
        if appointment.status != AppointmentStatus.pending:
            raise ValueError(
                f"Cannot pay for appointment with status '{appointment.status.value}'"
            )

        # Mark appointment as confirmed
        appointment.status = AppointmentStatus.confirmed
        db.commit()

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
        Users cannot cancel within 24 hours of the scheduled time.
        Admins and consultants can always cancel.
        """
        appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
        if not appt:
            raise ValueError("Appointment not found")

        # Enforce 24h cancellation cutoff for regular users
        if role == UserRole.user:
            cutoff = appt.scheduled_at - timedelta(
                hours=AppointmentService.CANCELLATION_CUTOFF_HOURS
            )
            if datetime.now(timezone.utc) >= cutoff:
                raise ValueError(
                    "Cannot cancel an appointment within 24 hours of its scheduled time"
                )

        actor_role = ActorRole.user
        if role in (UserRole.consultant, UserRole.platform_consultant):
            actor_role = ActorRole.consultant
        elif role in (UserRole.admin, UserRole.super_admin):
            actor_role = ActorRole.admin

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

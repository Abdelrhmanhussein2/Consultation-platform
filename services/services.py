import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from models import (
    User, Specialization, ConsultantProfile, ConsultantCredential,
    ServiceExpansionRequest, ConsultantService, Appointment,
    AppointmentCancellation, Rating, Notification, Invoice, AdminActionLog,
    UserRole, VerificationStatus, AppointmentStatus, ActorRole, RatingStatus,
    NotificationType, InvoiceType, InvoiceStatus
)
from services.auth_utils import hash_password

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
        
        # If user is a consultant, automatically create their consultant profile
        if db_user.role == UserRole.consultant:
            profile = ConsultantProfile(user_id=db_user.id)
            db.add(profile)
            db.commit()
            
        return db_user


class ConsultantService:
    @staticmethod
    def get_profile_by_user_id(db: Session, user_id: uuid.UUID) -> ConsultantProfile:
        return db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()

    @staticmethod
    def update_profile(db: Session, user_id: uuid.UUID, profile_in) -> ConsultantProfile:
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        if profile_in.bio is not None:
            profile.bio = profile_in.bio
        if profile_in.main_specialization_id is not None:
            profile.main_specialization_id = profile_in.main_specialization_id
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def submit_credential(db: Session, consultant_id: uuid.UUID, spec_id: int, document_url: str) -> ConsultantCredential:
        credential = ConsultantCredential(
            consultant_id=consultant_id,
            specialization_id=spec_id,
            document_url=document_url,
            status=VerificationStatus.pending
        )
        db.add(credential)
        db.commit()
        db.refresh(credential)
        return credential

    @staticmethod
    def review_credential(db: Session, credential_id: uuid.UUID, admin_id: uuid.UUID, status: VerificationStatus, rejection_reason: str = None) -> ConsultantCredential:
        credential = db.query(ConsultantCredential).filter(ConsultantCredential.id == credential_id).first()
        if not credential:
            raise ValueError("Credential not found")
        
        credential.status = status
        credential.reviewed_by = admin_id
        credential.reviewed_at = datetime.now(timezone.utc)
        credential.rejection_reason = rejection_reason
        
        db.commit()
        db.refresh(credential)
        
        # Notify the consultant
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.id == credential.consultant_id).first()
        if profile:
            notification = Notification(
                user_id=profile.user_id,
                type=NotificationType.credential_status_update,
                title="تحديث حالة الأوراق والمستندات",
                message=f"تم { 'قبول' if status == VerificationStatus.approved else 'رفض' } أوراق التخصص الخاصة بك. { f'السبب: {rejection_reason}' if rejection_reason else '' }",
                related_entity_type="credential",
                related_entity_id=credential.id
            )
            db.add(notification)
            
            # If credential approved, and profile is pending, maybe check if we should approve the profile itself
            if status == VerificationStatus.approved:
                profile.verification_status = VerificationStatus.approved
                profile.main_specialization_id = credential.specialization_id
                
            db.commit()
            
        return credential

    @staticmethod
    def submit_service_expansion(db: Session, consultant_id: uuid.UUID, request_in) -> ServiceExpansionRequest:
        request = ServiceExpansionRequest(
            consultant_id=consultant_id,
            requested_specialization_id=request_in.requested_specialization_id,
            service_name=request_in.service_name,
            service_description=request_in.service_description,
            proof_document_url=request_in.proof_document_url,
            status=VerificationStatus.pending
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def add_service(db: Session, consultant_id: uuid.UUID, service_in) -> ConsultantService:
        # Check out-of-specialization constraint
        if service_in.is_out_of_specialization:
            if not service_in.expansion_request_id:
                raise ValueError("Out of specialization service requires an approved expansion request ID")
            
            req_uuid = uuid.UUID(service_in.expansion_request_id) if isinstance(service_in.expansion_request_id, str) else service_in.expansion_request_id
            # Verify expansion request exists and is approved
            exp_req = db.query(ServiceExpansionRequest).filter(
                and_(
                    ServiceExpansionRequest.id == req_uuid,
                    ServiceExpansionRequest.status == VerificationStatus.approved
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
            expansion_request_id=uuid.UUID(service_in.expansion_request_id) if service_in.expansion_request_id else None
        )
        db.add(db_service)
        db.commit()
        db.refresh(db_service)
        return db_service


class AppointmentService:
    @staticmethod
    def book_appointment(db: Session, client_id: uuid.UUID, appt_in) -> Appointment:
        # Resolve consultant and service
        consultant_uuid = uuid.UUID(appt_in.consultant_id) if isinstance(appt_in.consultant_id, str) else appt_in.consultant_id
        
        # Verify consultant is approved
        consultant = db.query(ConsultantProfile).filter(
            and_(
                ConsultantProfile.id == consultant_uuid,
                ConsultantProfile.verification_status == VerificationStatus.approved
            )
        ).first()
        if not consultant:
            raise ValueError("Consultant is not approved or profile does not exist")
        
        # Verify service if provided
        price = Decimal("0.00")
        if appt_in.service_id:
            service_uuid = uuid.UUID(appt_in.service_id) if isinstance(appt_in.service_id, str) else appt_in.service_id
            service = db.query(ConsultantService).filter(
                and_(
                    ConsultantService.id == service_uuid,
                    ConsultantService.consultant_id == consultant_uuid,
                    ConsultantService.is_active == True
                )
            ).first()
            if not service:
                raise ValueError("Active service not found for this consultant")
            price = service.price
            duration = service.duration_minutes
        else:
            duration = appt_in.duration_minutes

        # Create appointment
        appointment = Appointment(
            consultant_id=consultant_uuid,
            user_id=client_id,
            service_id=uuid.UUID(appt_in.service_id) if appt_in.service_id else None,
            scheduled_at=appt_in.scheduled_at,
            duration_minutes=duration,
            status=AppointmentStatus.pending,
            created_by_role=ActorRole.user,
            price=price,
            notes=appt_in.notes
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        
        # Notify consultant
        notification = Notification(
            user_id=consultant.user_id,
            type=NotificationType.appointment_booked,
            title="حجز موعد جديد",
            message=f"قام أحد العملاء بحجز موعد جديد معك بتاريخ {appt_in.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
            related_entity_type="appointment",
            related_entity_id=appointment.id
        )
        db.add(notification)
        db.commit()
        
        return appointment

    @staticmethod
    def cancel_appointment(db: Session, user_id: uuid.UUID, appt_id: uuid.UUID, reason: str, role: UserRole) -> AppointmentCancellation:
        # Fetch appointment
        appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
        if not appt:
            raise ValueError("Appointment not found")
        
        actor_role = ActorRole.user
        if role == UserRole.consultant:
            actor_role = ActorRole.consultant
        elif role in (UserRole.admin, UserRole.super_admin):
            actor_role = ActorRole.admin

        # Insert cancellation -> Postgres trigger will automatically enforce the 24h validation, 
        # update appointment status, and generate the consultant notification if client cancelled!
        cancellation = AppointmentCancellation(
            appointment_id=appt_id,
            cancelled_by=user_id,
            cancelled_by_role=actor_role,
            reason=reason,
            within_policy=True # Will be recalculated by Postgres trigger BEFORE INSERT if user role
        )
        db.add(cancellation)
        db.commit()
        db.refresh(cancellation)
        return cancellation


class RatingService:
    @staticmethod
    def rate_appointment(db: Session, client_id: uuid.UUID, appt_id: uuid.UUID, stars: int, comment: str = None, low_rating_reason: str = None) -> Rating:
        appt = db.query(Appointment).filter(
            and_(
                Appointment.id == appt_id,
                Appointment.user_id == client_id
            )
        ).first()
        if not appt:
            raise ValueError("Appointment not found or does not belong to you")
            
        # Create rating -> Postgres trigger will set status, notify admins if stars < 2, 
        # and recalculate consultant profile rating metrics
        rating = Rating(
            appointment_id=appt_id,
            consultant_id=appt.consultant_id,
            user_id=client_id,
            stars=stars,
            comment=comment,
            low_rating_reason=low_rating_reason
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating

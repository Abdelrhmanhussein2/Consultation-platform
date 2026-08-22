import uuid
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from schemes import (
    UserCreate, UserProfileUpdate, ChangePasswordRequest, UserLogin, ConsultantProfileCreate, CredentialCreate,
    CredentialReview, ServiceExpansionRequestCreate, ServiceExpansionReviewAction,
    ConsultantServiceCreate, ConsultantServiceUpdate,
    AppointmentCreate, AppointmentCancel, AppointmentReschedule, PaymentSimulate, RatingCreate,
    ConsultantAvailabilityCreate
)
from services import (
    UserService, ConsultantService, ServiceExpansionService,
    AppointmentService, RatingService, NotificationService, InvoiceService,
    SpecializationService, GoogleCalendarService,
)
from models import UserRole, User


# =====================================================================
# USER CONTROLLER
# =====================================================================
class UserController:

    @staticmethod
    def get_profile(current_user: User):
        """Returns the logged-in user profile."""
        return current_user

    @staticmethod
    def update_profile(db: Session, current_user: User, update_in: UserProfileUpdate):
        """Updates user profile information and settings."""
        try:
            return UserService.update_profile(db, current_user, update_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def upload_avatar(db: Session, current_user: User, file_bytes: bytes, filename: str, content_type: str):
        """Uploads, validates and saves user avatar, then updates the user's profile."""
        import os
        import uuid
        
        # Validate content type is an image
        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="الملف المرفوع يجب أن يكون صورة فقط"
            )
            
        # Limit file size (5 MB)
        max_size = 5 * 1024 * 1024
        if len(file_bytes) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="حجم الصورة يجب أن لا يتجاوز 5 ميجابايت"
            )
            
        # Get extension
        _, ext = os.path.splitext(filename)
        if not ext:
            ext = ".png"
            if "jpeg" in content_type:
                ext = ".jpg"
            elif "webp" in content_type:
                ext = ".webp"
                
        ext = ext.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="صيغة الصورة غير مدعومة. الصيغ المسموحة هي: JPG, JPEG, PNG, WEBP, GIF"
            )
            
        # Save to static/avatars/
        new_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join("static", "avatars", new_filename)
        
        try:
            with open(filepath, "wb") as f:
                f.write(file_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"فشل حفظ الصورة على الخادم: {e}"
            )
            
        # Update user record
        avatar_url = f"/static/avatars/{new_filename}"
        current_user.avatar_url = avatar_url
        db.commit()
        db.refresh(current_user)
        return current_user

    @staticmethod
    def change_password(db: Session, current_user: User, pass_in: ChangePasswordRequest):
        """Changes the current user password securely."""
        try:
            return UserService.change_password(
                db, current_user, pass_in.current_password, pass_in.new_password
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================================================================
# CONSULTANT CONTROLLER
# =====================================================================
class ConsultantController:

    # ── Public operations (no role restriction) ──────────────────────

    @staticmethod
    def get_public_profile(db: Session, profile_id: str) -> dict:
        """Returns the full public profile of an approved consultant."""
        try:
            profile_uuid = uuid.UUID(profile_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid profile ID format",
            )
        profile = ConsultantService.get_public_profile(db, profile_uuid)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found or not yet approved",
            )
        return profile

    @staticmethod
    def list_consultants(
        db: Session,
        specialization_id: int | None,
        service_name: str | None,
        min_price: Decimal | None,
        max_price: Decimal | None,
        min_rating: float | None,
        page: int,
        limit: int,
    ) -> list[dict]:
        """Lists all approved consultants with optional filters."""
        return ConsultantService.list_consultants(
            db,
            specialization_id=specialization_id,
            service_name=service_name,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            page=page,
            limit=limit,
        )

    @staticmethod
    def get_consultant_services_public(db: Session, profile_id: str):
        """Returns all active services for a consultant — visible to all."""
        try:
            profile_uuid = uuid.UUID(profile_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid profile ID format",
            )
        return ConsultantService.get_active_services(db, profile_uuid)

    # ── Authenticated consultant operations ──────────────────────────

    @staticmethod
    def get_profile(db: Session, current_user: User):
        """Returns the logged-in consultant's own profile."""
        _require_consultant(current_user)
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found",
            )
        return profile

    @staticmethod
    def update_profile(db: Session, current_user: User, profile_in: ConsultantProfileCreate):
        """Updates the logged-in consultant's profile bio and specialization."""
        _require_consultant(current_user)
        return ConsultantService.update_profile(db, current_user.id, profile_in)

    @staticmethod
    def submit_credential(db: Session, current_user: User, cred_in: CredentialCreate):
        """Submits a specialization credential for admin review."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        return ConsultantService.submit_credential(
            db, profile.id, cred_in.specialization_id, cred_in.document_url
        )

    @staticmethod
    def review_credential(
        db: Session, current_user: User, credential_id: str, review_in: CredentialReview
    ):
        """Admin reviews a credential submission."""
        _require_admin(current_user)
        try:
            cred_uuid = uuid.UUID(credential_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid credential ID format",
            )
        try:
            return ConsultantService.review_credential(
                db, cred_uuid, current_user.id, review_in.status, review_in.rejection_reason
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def submit_service_expansion(
        db: Session, current_user: User, request_in: ServiceExpansionRequestCreate
    ):
        """Submits a service expansion request (out-of-specialization service)."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        return ConsultantService.submit_service_expansion(db, profile.id, request_in)

    @staticmethod
    def get_my_services(db: Session, current_user: User):
        """Returns all (active + inactive) services for the logged-in consultant."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        return ConsultantService.get_services(db, profile.id)

    @staticmethod
    def add_service(db: Session, current_user: User, service_in: ConsultantServiceCreate):
        """Adds a new service to the consultant's profile."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        try:
            return ConsultantService.add_service(db, profile.id, service_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def update_service(
        db: Session, current_user: User, service_id: str, update_in: ConsultantServiceUpdate
    ):
        """Updates name, description, price or duration of an existing service."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        try:
            service_uuid = uuid.UUID(service_id)
            return ConsultantService.update_service(db, profile.id, service_uuid, update_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def toggle_service(db: Session, current_user: User, service_id: str):
        """Toggles a service between active and inactive."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        try:
            service_uuid = uuid.UUID(service_id)
            return ConsultantService.toggle_service(db, profile.id, service_uuid)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_clients(db: Session, current_user: User, page: int, limit: int):
        """Retrieves aggregated client lists for the logged-in consultant."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        return ConsultantService.get_clients(db, profile.id, page=page, limit=limit)

    @staticmethod
    def set_availability(db: Session, current_user: User, availabilities_in: list[ConsultantAvailabilityCreate]):
        """Sets the weekly availability schedule for the logged-in consultant."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        try:
            return ConsultantService.set_availability(db, profile.id, availabilities_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_availabilities(db: Session, current_user: User):
        """Retrieves the weekly availability schedule of the logged-in consultant."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        return ConsultantService.get_availabilities(db, profile.id)

    @staticmethod
    def get_available_slots(db: Session, profile_id: str, start_date: date, end_date: date, duration_minutes: int):
        """Calculates free availability slots for a consultant within a date range."""
        try:
            profile_uuid = uuid.UUID(profile_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid profile ID format",
            )
        return ConsultantService.get_available_slots(
            db,
            consultant_id=profile_uuid,
            start_date=start_date,
            end_date=end_date,
            duration_minutes=duration_minutes
        )

    @staticmethod
    def get_google_auth_url(db: Session, current_user: User) -> dict:
        """Generates Google OAuth URL for the consultant to link their account."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        url = GoogleCalendarService.get_auth_url(state=str(profile.id))
        return {"url": url}

    @staticmethod
    def google_auth_callback(db: Session, code: str, state: str) -> dict:
        """Callback endpoint for Google OAuth authorization code exchange."""
        try:
            profile_uuid = uuid.UUID(state)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter"
            )
        try:
            GoogleCalendarService.exchange_code_for_tokens(db, profile_uuid, code)
            return {"message": "تم ربط حساب Google وتقويم المواعيد بنجاح!"}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================================================================
# SERVICE EXPANSION CONTROLLER  (admin review)
# =====================================================================
class ServiceExpansionController:

    @staticmethod
    def list_pending(db: Session, current_user: User):
        """Lists all pending service expansion requests for admin review."""
        _require_admin(current_user)
        return ServiceExpansionService.list_pending(db)

    @staticmethod
    def review_request(
        db: Session,
        current_user: User,
        request_id: str,
        action_in: ServiceExpansionReviewAction,
    ):
        """Approves or rejects a service expansion request."""
        _require_admin(current_user)
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request ID format",
            )
        try:
            return ServiceExpansionService.review(
                db,
                req_uuid,
                current_user.id,
                action_in.action,
                action_in.rejection_reason,
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================================================================
# APPOINTMENT CONTROLLER
# =====================================================================
class AppointmentController:

    @staticmethod
    def book_appointment(db: Session, current_user: User, appt_in: AppointmentCreate):
        """Books an appointment. Clients and consultants can book."""
        BOOKABLE_ROLES = {UserRole.user, UserRole.consultant, UserRole.platform_consultant}
        if current_user.role not in BOOKABLE_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients and consultants can book appointments",
            )
        try:
            return AppointmentService.book_appointment(db, current_user.id, appt_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def pay_appointment(
        db: Session, current_user: User, appointment_id: str, payment_in: PaymentSimulate
    ):
        """Simulates payment for a pending appointment, confirming it."""
        if current_user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can pay for appointments",
            )
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return AppointmentService.confirm_payment(
                db, appt_uuid, current_user.id, payment_in.payment_method
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def cancel_appointment(
        db: Session, current_user: User, appointment_id: str, cancel_in: AppointmentCancel
    ):
        """Cancels an appointment. Users are blocked within 24h of scheduled time."""
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return AppointmentService.cancel_appointment(
                db, current_user.id, appt_uuid, cancel_in.reason, current_user.role
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_my_appointments(db: Session, current_user: User, page: int, limit: int):
        """Returns the logged-in user's appointments (client view)."""
        if current_user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can view their appointments here",
            )
        return AppointmentService.get_user_appointments(
            db, current_user.id, page=page, limit=limit
        )

    @staticmethod
    def approve_appointment(db: Session, current_user: User, appointment_id: str):
        """Consultant approves a pending_approval appointment, moving it to pending_payment."""
        _require_consultant(current_user)
        profile = _get_profile_or_404(db, current_user)
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return AppointmentService.approve_appointment(db, profile.id, appt_uuid)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def reschedule_appointment(
        db: Session, current_user: User, appointment_id: str, reschedule_in: AppointmentReschedule
    ):
        """Reschedules a confirmed appointment. Consultants can always reschedule; clients are subject to 24h policy."""
        profile = None
        if current_user.role in {UserRole.consultant, UserRole.platform_consultant}:
            profile = _get_profile_or_404(db, current_user)

        try:
            appt_uuid = uuid.UUID(appointment_id)
            return AppointmentService.reschedule_appointment(
                db,
                requester_user_id=current_user.id,
                consultant_profile_id=profile.id if profile else None,
                appt_id=appt_uuid,
                new_scheduled_at=reschedule_in.new_scheduled_at,
                reason=reschedule_in.reason,
                role=current_user.role,
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get_consultant_appointments(
        db: Session, current_user: User, page: int, limit: int
    ):
        """Returns the logged-in consultant's incoming appointments."""
        _require_consultant(current_user)
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found",
            )
        return AppointmentService.get_consultant_appointments(
            db, profile.id, page=page, limit=limit
        )


# =====================================================================
# RATING CONTROLLER
# =====================================================================
class RatingController:

    @staticmethod
    def rate_appointment(
        db: Session, current_user: User, appointment_id: str, rating_in: RatingCreate
    ):
        """Submits a rating for a completed appointment. Only clients can rate."""
        if current_user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can rate appointments",
            )
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return RatingService.rate_appointment(
                db,
                current_user.id,
                appt_uuid,
                rating_in.stars,
                rating_in.comment,
                rating_in.low_rating_reason,
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================================================================
# NOTIFICATION CONTROLLER
# =====================================================================
class NotificationController:

    @staticmethod
    def get_my_notifications(
        db: Session, current_user: User, is_read: bool | None, page: int, limit: int
    ):
        """Retrieves paginated notifications for the logged-in user."""
        return NotificationService.get_user_notifications(
            db, current_user.id, is_read=is_read, page=page, limit=limit
        )

    @staticmethod
    def get_unread_count(db: Session, current_user: User):
        """Returns the total number of unread notifications."""
        count = NotificationService.get_unread_count(db, current_user.id)
        return {"unread_count": count}

    @staticmethod
    def mark_as_read(db: Session, current_user: User, notification_id: str):
        """Marks a single notification as read."""
        try:
            notif_uuid = uuid.UUID(notification_id)
            return NotificationService.mark_as_read(db, current_user.id, notif_uuid)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def mark_all_as_read(db: Session, current_user: User):
        """Marks all unread notifications for the user as read."""
        updated_count = NotificationService.mark_all_as_read(db, current_user.id)
        return {
            "message": f"تم تمييز {updated_count} إشعار كمقروء بنجاح",
            "updated_count": updated_count,
        }


# =====================================================================
# INVOICE CONTROLLER
# =====================================================================
class InvoiceController:

    @staticmethod
    def get_my_invoices(
        db: Session, current_user: User, status_filter, page: int, limit: int
    ):
        """Retrieves paginated invoices for the logged-in user."""
        return InvoiceService.get_user_invoices(
            db, current_user.id, status=status_filter, page=page, limit=limit
        )

    @staticmethod
    def get_invoice_detail(db: Session, current_user: User, invoice_id: str):
        """Retrieves detailed information for a specific invoice."""
        try:
            inv_uuid = uuid.UUID(invoice_id)
            is_admin = current_user.role in ADMIN_ROLES
            return InvoiceService.get_invoice_by_id(
                db, current_user.id, inv_uuid, is_admin=is_admin
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# =====================================================================
# SPECIALIZATION CONTROLLER
# =====================================================================
class SpecializationController:

    @staticmethod
    def list_specializations(db: Session):
        """Returns all platform specializations."""
        return SpecializationService.get_all(db)


# =====================================================================
# PRIVATE HELPERS
# =====================================================================
CONSULTANT_ROLES = {UserRole.consultant, UserRole.platform_consultant}
ADMIN_ROLES = {UserRole.admin, UserRole.super_admin}


def _require_consultant(user: User):
    """Raises 403 if the user is not a consultant or platform_consultant."""
    if user.role not in CONSULTANT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only consultants can perform this action",
        )


def _require_admin(user: User):
    """Raises 403 if the user is not an admin or super_admin."""
    if user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action",
        )


def _get_profile_or_404(db, user: User):
    """Fetches the consultant's profile or raises 404."""
    profile = ConsultantService.get_profile_by_user_id(db, user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultant profile not found",
        )
    return profile

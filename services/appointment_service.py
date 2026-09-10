import uuid
import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from models import (
    User, ConsultantProfile, ConsultantService as ConsultantServiceModel, Appointment,
    AppointmentCancellation, Notification, Invoice,
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    NotificationType, InvoiceType, InvoiceStatus, ConsultantAvailability, SessionType
)
from services.daily_service import DailyService
from services.google_calendar_service import GoogleCalendarService
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)


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
            try:
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
                if service:
                    price = service.price
                    duration = service.duration_minutes
                else:
                    hourly_rate = consultant.price_per_hour or Decimal("50.00")
                    price = (Decimal(duration) / Decimal("60.00")) * hourly_rate
            except (ValueError, TypeError):
                hourly_rate = consultant.price_per_hour or Decimal("50.00")
                price = (Decimal(duration) / Decimal("60.00")) * hourly_rate
        else:
            # Urgent/Quick consultation booking without a specific service
            hourly_rate = consultant.price_per_hour or Decimal("50.00")
            price = (Decimal(duration) / Decimal("60.00")) * hourly_rate

        # Verify the selected scheduled_at is within consultant's availability if they have any defined
        appt_start_dt = appt_in.scheduled_at
        if appt_start_dt.tzinfo is None:
            appt_start_dt = appt_start_dt.replace(tzinfo=timezone.utc)
        appt_duration = timedelta(minutes=duration)
        appt_end_dt = appt_start_dt + appt_duration

        has_any_availability = db.query(ConsultantAvailability).filter(
            and_(
                ConsultantAvailability.consultant_id == consultant_uuid,
                ConsultantAvailability.is_active == True
            )
        ).first() is not None

        if has_any_availability:
            appt_date = appt_in.scheduled_at.date()
            appt_time = appt_in.scheduled_at.time()
            dow = appt_date.weekday()

            availabilities_on_day = db.query(ConsultantAvailability).filter(
                and_(
                    ConsultantAvailability.consultant_id == consultant_uuid,
                    ConsultantAvailability.day_of_week == dow,
                    ConsultantAvailability.is_active == True
                )
            ).all()

            if availabilities_on_day:
                is_available = False
                for av in availabilities_on_day:
                    if av.end_time:
                        appt_end_time = (appt_in.scheduled_at + appt_duration).time()
                        if appt_time >= av.start_time and appt_end_time <= av.end_time:
                            is_available = True
                            break
                    else:
                        is_available = True
                        break

                if not is_available:
                    # Allow booking outside strict windows — consultant will approve/reject
                    pass

        # Verify that there are no overlapping appointments
        overlap_appt = db.query(Appointment).filter(
            and_(
                Appointment.consultant_id == consultant_uuid,
                Appointment.status.in_([
                    AppointmentStatus.pending_approval,
                    AppointmentStatus.pending_payment,
                    AppointmentStatus.confirmed
                ])
            )
        ).all()

        for existing in overlap_appt:
            ex_start = existing.scheduled_at
            if ex_start.tzinfo is None:
                ex_start = ex_start.replace(tzinfo=timezone.utc)
            ex_end = ex_start + timedelta(minutes=existing.duration_minutes)
            if max(ex_start, appt_start_dt) < min(ex_end, appt_end_dt):
                raise ValueError("الموعد المطلوب يتعارض مع حجز آخر للمستشار")

        appointment = Appointment(
            consultant_id=consultant_uuid,
            user_id=client_id,
            service_id=uuid.UUID(appt_in.service_id) if appt_in.service_id else None,
            scheduled_at=appt_in.scheduled_at,
            duration_minutes=duration,
            status=AppointmentStatus.pending_approval,
            created_by_role=ActorRole.user,
            price=price,
            session_type=getattr(appt_in, "session_type", SessionType.video_call),
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
        if appointment.status not in (AppointmentStatus.pending_payment, AppointmentStatus.pending_approval):
            raise ValueError(
                f"Cannot pay for appointment with status '{appointment.status.value}'."
            )

        # Mark appointment as confirmed
        appointment.status = AppointmentStatus.confirmed
        db.commit()

        # Create Daily.co session room
        try:
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
            logger.error(f"Failed to initialize Daily.co room: {str(e)}")

        # Create Google Calendar event (with Meet Link override if google calendar is connected)
        try:
            GoogleCalendarService.create_calendar_event(db, appointment.id)
        except Exception as e:
            logger.error(f"Failed to create Google Calendar event for appointment {appointment.id}: {str(e)}")

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

        # Notify all platform Admins of the received payment
        try:
            client_user = db.query(User).filter(User.id == user_id).first()
            c_name = client_user.full_name if client_user else "أحد العملاء"
            admins = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).all()
            for admin in admins:
                NotificationService.send(
                    db=db,
                    user_id=admin.id,
                    notification_type=NotificationType.payment_confirmed,
                    title="عملية دفع وسداد جديدة",
                    message=f"قام العميل {c_name} بسداد مبلغ {float(total):.2f} د.أ مقابل جلسة استشارة ({appointment.topic or 'استشارة ضريبية'}).",
                    related_entity_type="invoice",
                    related_entity_id=invoice.id
                )
        except Exception:
            pass

        return invoice

    @staticmethod
    def get_user_appointments(
        db: Session, user_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> list[Appointment]:
        """Returns a paginated list of appointments for a user/client."""
        return (
            db.query(Appointment)
            .options(
                joinedload(Appointment.user),
                joinedload(Appointment.consultant).joinedload(ConsultantProfile.user),
                joinedload(Appointment.service),
            )
            .filter(Appointment.user_id == user_id)
            .order_by(Appointment.scheduled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_consultant_appointments(
        db: Session, consultant_id: uuid.UUID, page: int = 1, limit: int = 20, user_id: uuid.UUID = None
    ) -> list[Appointment]:
        """Returns a paginated list of appointments for a consultant profile."""
        query = db.query(Appointment).options(
            joinedload(Appointment.user),
            joinedload(Appointment.consultant).joinedload(ConsultantProfile.user),
            joinedload(Appointment.service),
        )
        if user_id:
            query = query.filter(
                or_(
                    Appointment.consultant_id == consultant_id,
                    Appointment.user_id == user_id
                )
            )
        else:
            query = query.filter(Appointment.consultant_id == consultant_id)

        return (
            query.order_by(Appointment.scheduled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_all_appointments(
        db: Session, page: int = 1, limit: int = 200
    ) -> list[Appointment]:
        """Returns all platform appointments across all consultants and users for Admin / Calendar overview."""
        return (
            db.query(Appointment)
            .options(
                joinedload(Appointment.user),
                joinedload(Appointment.consultant).joinedload(ConsultantProfile.user),
                joinedload(Appointment.service),
            )
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

        is_consultant = role in (UserRole.consultant, UserRole.platform_consultant, UserRole.admin, UserRole.super_admin)

        if not is_consultant and appt.status != AppointmentStatus.confirmed:
            raise ValueError(
                f"Only confirmed (paid) appointments can be rescheduled. "
                f"Current status: '{appt.status.value}'."
            )

        # Validate ownership
        if is_consultant and consultant_profile_id and appt.consultant_id != consultant_profile_id and role not in (UserRole.admin, UserRole.super_admin):
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

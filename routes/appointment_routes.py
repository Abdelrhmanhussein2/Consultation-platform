from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from models import User
from schemes import (
    AppointmentCreate, AppointmentCancel, AppointmentReschedule, AppointmentOut,
    PaymentSimulate, InvoiceOut,
    RatingCreate, RatingOut,
)
from controllers import AppointmentController, RatingController
from routes.deps import get_current_active_user, require_consultant

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# ─────────────────────────────────────────────────────────────────────
# CLIENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=AppointmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Book an appointment",
)
def book_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Books an appointment with a consultant for a specific service.
    Appointment is created with status 'pending' — payment must be made to confirm it.
    Only regular users (clients) can book appointments.
    """
    return AppointmentController.book_appointment(db, current_user, appt_in)


@router.post(
    "/{appointment_id}/pay",
    response_model=InvoiceOut,
    summary="Pay for a pending appointment",
)
def pay_appointment(
    appointment_id: str,
    payment_in: PaymentSimulate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Confirms payment for a pending appointment.
    - Appointment status changes from 'pending' to 'confirmed'.
    - A paid invoice is generated with 14% VAT applied.
    - Accepted payment methods: card, cash, wallet.
    Only the appointment owner (client) can pay.
    """
    return AppointmentController.pay_appointment(
        db, current_user, appointment_id, payment_in
    )


@router.get(
    "/my",
    response_model=List[AppointmentOut],
    summary="Get my appointments (client view)",
)
def get_my_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the logged-in client's own appointment history, newest first.
    Only regular users (clients) can use this endpoint.
    """
    return AppointmentController.get_my_appointments(
        db, current_user, page=page, limit=limit
    )


@router.post(
    "/{appointment_id}/cancel",
    status_code=status.HTTP_200_OK,
    summary="Cancel an appointment",
)
def cancel_appointment(
    appointment_id: str,
    cancel_in: AppointmentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Cancels an appointment.
    - Clients cannot cancel within 24 hours of the scheduled time.
    - Consultants and admins can cancel at any time.
    """
    return AppointmentController.cancel_appointment(
        db, current_user, appointment_id, cancel_in
    )


@router.post(
    "/{appointment_id}/rate",
    response_model=RatingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Rate a completed appointment",
)
def rate_appointment(
    appointment_id: str,
    rating_in: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits a rating (1–5 stars) for a completed appointment.
    Ratings under 2 stars require a reason.
    Only the client who booked the appointment can rate it.
    """
    return RatingController.rate_appointment(db, current_user, appointment_id, rating_in)


# ─────────────────────────────────────────────────────────────────────
# CONSULTANT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/incoming",
    response_model=List[AppointmentOut],
    summary="Get incoming appointments (consultant view)",
)
def get_consultant_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Returns the logged-in consultant's incoming appointments, newest first.
    Only approved consultants (including platform_consultants) can use this endpoint.
    """
    return AppointmentController.get_consultant_appointments(
        db, current_user, page=page, limit=limit
    )


@router.post(
    "/{appointment_id}/approve",
    response_model=AppointmentOut,
    summary="Approve a booking request (consultant only)",
)
def approve_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Consultant approves a pending booking request.
    - Appointment status moves from `pending_approval` → `pending_payment`.
    - The client receives a notification to complete payment.
    - Only the assigned consultant can approve their own appointments.
    """
    return AppointmentController.approve_appointment(db, current_user, appointment_id)


@router.post(
    "/{appointment_id}/reschedule",
    response_model=AppointmentOut,
    summary="Reschedule a confirmed appointment",
)
def reschedule_appointment(
    appointment_id: str,
    reschedule_in: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Reschedules a confirmed (paid) appointment to a new time.
    - **Consultants**: Can reschedule at any time (they cannot cancel paid appointments).
    - **Clients**: Can reschedule only if more than 24h remain before the session.
    - The other party is automatically notified of the change.
    """
    return AppointmentController.reschedule_appointment(
        db, current_user, appointment_id, reschedule_in
    )

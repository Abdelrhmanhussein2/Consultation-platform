import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from helpers.database import get_db
from helpers.enums import AppointmentStatus
from models import User, Appointment, ConsultantProfile
from schemes import SessionJoinOut
from services import DailyService
from routes.deps import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["Session Meetings"])

@router.post(
    "/{appointment_id}/join",
    response_model=SessionJoinOut,
    summary="Join an appointment video session",
)
def join_session(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Validates that the caller is authorized (either the client or the consultant for this appointment),
    and generates a Daily.co meeting token to join the private video room.
    """
    try:
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID format",
        )

    appointment = db.query(Appointment).filter(Appointment.id == appt_uuid).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Resolve consultant's user_id
    consultant = db.query(ConsultantProfile).filter(
        ConsultantProfile.id == appointment.consultant_id
    ).first()
    if not consultant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultant profile associated with this appointment not found",
        )

    # Verify authorization: caller must be either the client (user_id) or the consultant (consultant.user_id)
    is_client = appointment.user_id == current_user.id
    is_consultant = consultant.user_id == current_user.id

    if not (is_client or is_consultant):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to join this session",
        )

    # Check if the appointment is in a state that permits joining
    allowed_statuses = {
        AppointmentStatus.confirmed,
        AppointmentStatus.completed,
    }
    if appointment.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join session. Appointment is currently '{appointment.status.value}' and must be paid/confirmed.",
        )

    # Verify that a room has been created
    if not appointment.session_room_url or not appointment.session_room_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video session room has not been initialized for this appointment.",
        )

    # Generate token
    is_owner = is_consultant
    user_name = current_user.full_name or "Participant"
    meeting_token = DailyService.generate_meeting_token(
        room_name=appointment.session_room_name,
        user_name=user_name,
        is_owner=is_owner
    )

    # Determine expiry time
    expires_at = datetime.now(timezone.utc) + timedelta(hours=2)

    return {
        "room_url": appointment.session_room_url,
        "token": meeting_token,
        "expires_at": expires_at,
        "appointment_id": appointment.id
    }

@router.post(
    "/webhook",
    summary="Daily.co webhook receiver",
)
async def daily_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives webhook events from Daily.co and updates appointment status accordingly.
    Specifically handles 'meeting.ended' to transition appointment status to 'completed'.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event_type = payload.get("type")
    event_payload = payload.get("payload", {})
    
    # We want to identify the room name
    room_name = event_payload.get("room_name")
    
    logger.info(f"Received Daily.co webhook event: {event_type} for room: {room_name}")

    if not room_name:
        return {"status": "skipped", "reason": "No room_name in payload"}

    if event_type == "meeting.ended":
        appointment = db.query(Appointment).filter(
            Appointment.session_room_name == room_name
        ).first()
        
        if appointment:
            if appointment.status == AppointmentStatus.confirmed:
                appointment.status = AppointmentStatus.completed
                db.commit()
                logger.info(f"Updated Appointment {appointment.id} to completed via Daily.co webhook.")
                return {"status": "processed", "action": "completed_appointment"}
            else:
                return {"status": "skipped", "reason": f"Appointment status is {appointment.status.value}"}
        else:
            return {"status": "skipped", "reason": "No matching appointment found"}

    return {"status": "ignored_event_type"}

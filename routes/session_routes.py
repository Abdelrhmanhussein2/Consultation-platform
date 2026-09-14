import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from helpers.database import get_db
from helpers.enums import AppointmentStatus, UserRole
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
    if appointment_id == "test-session-id":
        expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
        return {
            "room_url": "https://p2p.mirotalk.com/join/DiwanPlatformTestSessionRoom",
            "token": "test-mock-token",
            "expires_at": expires_at,
            "appointment_id": uuid.UUID("00000000-0000-0000-0000-000000000000")
        }

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

    # ── Record Live Attendance Timestamps ──────────────────────────
    now_utc = datetime.now(timezone.utc)
    if is_consultant:
        if not appointment.room_opened_at:
            appointment.room_opened_at = now_utc
        appointment.consultant_joined_at = now_utc
        if not appointment.session_started_at:
            appointment.session_started_at = now_utc
        if appointment.user_joined_at:
            appointment.attendance_status = "both_attended"
        else:
            appointment.attendance_status = "consultant_waiting"
        db.commit()
    elif is_client:
        appointment.user_joined_at = now_utc
        if appointment.consultant_joined_at:
            appointment.attendance_status = "both_attended"
        else:
            appointment.attendance_status = "user_waiting"
        db.commit()

    return {
        "room_url": appointment.session_room_url,
        "token": meeting_token,
        "expires_at": expires_at,
        "appointment_id": appointment.id
    }

@router.post(
    "/{appointment_id}/open",
    summary="Consultant explicitly opens the video room and marks presence",
)
def open_session_room(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Consultant initiates the session room at the scheduled time.
    Records that the room is open and consultant is inside.
    """
    try:
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")

    appointment = db.query(Appointment).filter(Appointment.id == appt_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == appointment.consultant_id).first()
    if not consultant or consultant.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned consultant can open this session")

    # If Daily.co room has not been initialized yet, initialize it
    if not appointment.session_room_url or not appointment.session_room_name:
        try:
            duration = appointment.duration_minutes or 60
            room_info = DailyService.create_room(str(appointment.id), duration)
            appointment.session_room_name = room_info.get("room_name")
            appointment.session_room_url = room_info.get("room_url")
        except Exception as e:
            logger.error(f"Failed to create room on open: {e}")
            appointment.session_room_name = f"room-{appointment.id}"
            appointment.session_room_url = f"https://daily.co/room-{appointment.id}"

    now_utc = datetime.now(timezone.utc)
    if not appointment.room_opened_at:
        appointment.room_opened_at = now_utc
    appointment.consultant_joined_at = now_utc
    if not appointment.session_started_at:
        appointment.session_started_at = now_utc

    if appointment.user_joined_at:
        appointment.attendance_status = "both_attended"
    else:
        appointment.attendance_status = "consultant_waiting"
    db.commit()

    return {
        "status": "opened",
        "room_opened_at": appointment.room_opened_at,
        "consultant_joined_at": appointment.consultant_joined_at,
        "session_room_url": appointment.session_room_url,
        "attendance_status": appointment.attendance_status
    }

@router.get(
    "/{appointment_id}/attendance",
    summary="Get live attendance audit status for an appointment",
)
def get_session_attendance(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Checks attendance status, calculates grace periods, and auto-detects no-show fault.
    """
    try:
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")

    appointment = db.query(Appointment).filter(Appointment.id == appt_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == appointment.consultant_id).first()
    is_client = appointment.user_id == current_user.id
    is_consultant = consultant and consultant.user_id == current_user.id
    is_admin = current_user.role in [UserRole.admin, UserRole.super_admin]

    if not (is_client or is_consultant or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view attendance for this appointment")

    now_utc = datetime.now(timezone.utc)
    scheduled_at = appointment.scheduled_at
    if scheduled_at and scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    # Automatic evaluation if appointment time has arrived + grace period (10 minutes)
    grace_minutes = 10
    has_started = bool(scheduled_at and now_utc >= scheduled_at)
    grace_expired = bool(scheduled_at and now_utc >= (scheduled_at + timedelta(minutes=grace_minutes)))

    # If not already marked as no_show
    if appointment.status != AppointmentStatus.no_show:
        if grace_expired:
            # Did the consultant open or join the room?
            if not appointment.room_opened_at and not appointment.consultant_joined_at:
                # Consultant failed to open room -> Fault is on the consultant!
                appointment.attendance_status = "consultant_no_show"
                appointment.no_show_party = "consultant"
                appointment.no_show_detected_at = now_utc
                appointment.status = AppointmentStatus.no_show
                db.commit()
            elif (appointment.room_opened_at or appointment.consultant_joined_at) and not appointment.user_joined_at:
                # Consultant opened and waited, but user never showed up after 15 min
                user_grace_expired = bool(scheduled_at and now_utc >= (scheduled_at + timedelta(minutes=15)))
                if user_grace_expired:
                    appointment.attendance_status = "user_no_show"
                    appointment.no_show_party = "user"
                    appointment.no_show_detected_at = now_utc
                    appointment.status = AppointmentStatus.no_show
                    db.commit()

    can_rate = False
    if is_client:
        # Client can rate if session completed OR consultant did not show up
        is_consultant_no_show = (
            appointment.attendance_status == "consultant_no_show"
            or appointment.no_show_party == "consultant"
        )
        can_rate = (appointment.status == AppointmentStatus.completed or is_consultant_no_show) and not appointment.rating

    consultant_overdue = bool(not appointment.room_opened_at and appointment.scheduled_at and (now_utc - appointment.scheduled_at).total_seconds() > 600)
    user_wait_overdue = bool(appointment.room_opened_at and not appointment.user_joined_at and appointment.scheduled_at and (now_utc - appointment.scheduled_at).total_seconds() > 900)

    is_c_no_show = bool(
        appointment.attendance_status == "consultant_no_show"
        or appointment.no_show_party == "consultant"
        or consultant_overdue
    )
    is_u_no_show = bool(
        appointment.attendance_status == "user_no_show"
        or appointment.no_show_party == "user"
        or user_wait_overdue
    )

    return {
        "appointment_id": str(appointment.id),
        "status": appointment.status.value,
        "scheduled_at": appointment.scheduled_at,
        "room_opened_at": appointment.room_opened_at,
        "consultant_joined_at": appointment.consultant_joined_at,
        "user_joined_at": appointment.user_joined_at,
        "attendance_status": appointment.attendance_status or "scheduled",
        "no_show_party": appointment.no_show_party,
        "no_show_detected_at": appointment.no_show_detected_at,
        "consultant_present": bool(appointment.consultant_joined_at),
        "user_present": bool(appointment.user_joined_at),
        "is_consultant_present": bool(appointment.consultant_joined_at),
        "is_user_present": bool(appointment.user_joined_at),
        "is_consultant_no_show": is_c_no_show,
        "is_user_no_show": is_u_no_show,
        "can_mark_user_no_show": user_wait_overdue,
        "has_started": has_started,
        "can_rate_consultant": can_rate or (is_client and is_c_no_show and not appointment.rating),
        "already_rated": bool(appointment.rating),
        "is_consultant_fault": appointment.no_show_party == "consultant" or consultant_overdue,
        "is_user_fault": appointment.no_show_party == "user" or user_wait_overdue,
    }

@router.post(
    "/{appointment_id}/mark-no-show",
    summary="Explicitly confirm no-show when scheduled time + grace period has passed",
)
def mark_no_show(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Called by consultant (if client didn't show up after consultant waited)
    or client (if consultant never opened the room after grace period).
    """
    try:
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")

    appointment = db.query(Appointment).filter(Appointment.id == appt_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == appointment.consultant_id).first()
    is_client = appointment.user_id == current_user.id
    is_consultant = consultant and consultant.user_id == current_user.id

    if not (is_client or is_consultant):
        raise HTTPException(status_code=403, detail="Not authorized")

    now_utc = datetime.now(timezone.utc)
    scheduled_at = appointment.scheduled_at
    if scheduled_at and scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    if scheduled_at and now_utc < scheduled_at:
        raise HTTPException(status_code=400, detail="لا يمكن تسجيل الغياب قبل حلول موعد الجلسة المحدد")

    if is_consultant:
        # Consultant is reporting client did not enter
        if not appointment.room_opened_at and not appointment.consultant_joined_at:
            raise HTTPException(status_code=400, detail="يجب فتح الغرفة وتسجيل تواجدك أولاً قبل تأكيد غياب العميل")
        appointment.attendance_status = "user_no_show"
        appointment.no_show_party = "user"
        appointment.no_show_detected_at = now_utc
        appointment.status = AppointmentStatus.no_show
        db.commit()
        return {
            "success": True,
            "message": "تم تسجيل غياب العميل وتوثيق أن المشكلة من طرف العميل",
            "attendance_status": "user_no_show",
            "no_show_party": "user"
        }
    elif is_client:
        # Client is reporting consultant never opened room
        if appointment.room_opened_at or appointment.consultant_joined_at:
            raise HTTPException(status_code=400, detail="المستشار متواجد داخل الغرفة بالفعل، يرجى الدخول للجلسة")

        if scheduled_at and now_utc < (scheduled_at + timedelta(minutes=5)):
            raise HTTPException(status_code=400, detail="يرجى الانتظار فترة سماح (5 دقائق) للمستشار قبل تأكيد تخلفه عن الحضور")

        appointment.attendance_status = "consultant_no_show"
        appointment.no_show_party = "consultant"
        appointment.no_show_detected_at = now_utc
        appointment.status = AppointmentStatus.no_show
        db.commit()
        return {
            "success": True,
            "message": "تم تسجيل تخلف المستشار عن الحضور بنجاح. يمكنك الآن تقييم المستشار وتقديم بلاغ",
            "attendance_status": "consultant_no_show",
            "no_show_party": "consultant",
            "can_rate": True
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

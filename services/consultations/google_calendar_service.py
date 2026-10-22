import uuid
import logging
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta
import httpx
from sqlalchemy.orm import Session
from helpers.config import settings
from models import ConsultantProfile, Appointment, User

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    @staticmethod
    def get_auth_url(state: str) -> str:
        """
        Generates Google OAuth authorization URL.
        """
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/calendar.events",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        return f"{base_url}?{urlencode(params)}"

    @staticmethod
    def exchange_code_for_tokens(db: Session, consultant_id: uuid.UUID, code: str) -> dict:
        """
        Exchanges Google OAuth auth code for access and refresh tokens.
        """
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValueError("Google OAuth credentials are not configured in settings")

        url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        with httpx.Client() as client:
            r = client.post(url, data=data)
            if r.status_code != 200:
                logger.error(f"Failed to exchange Google OAuth code: {r.text}")
                raise ValueError(f"Failed to exchange Google OAuth code: {r.text}")
            tokens = r.json()

        profile = db.query(ConsultantProfile).filter(ConsultantProfile.id == consultant_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")

        profile.google_access_token = tokens.get("access_token")
        if "refresh_token" in tokens:
            profile.google_refresh_token = tokens["refresh_token"]

        expires_in = tokens.get("expires_in", 3600)
        profile.google_token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        db.commit()
        db.refresh(profile)
        logger.info(f"Successfully linked Google Account for consultant profile {consultant_id}")
        return tokens

    @staticmethod
    def refresh_access_token(db: Session, profile: ConsultantProfile) -> str:
        """
        Refreshes Google Access Token if expired or close to expiry.
        """
        if not profile.google_refresh_token:
            raise ValueError("Google account is not linked (no refresh token)")

        now = datetime.now(timezone.utc)
        expiry = profile.google_token_expiry
        if expiry and expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if profile.google_access_token and expiry and expiry > now + timedelta(minutes=5):
            return profile.google_access_token

        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": profile.google_refresh_token,
            "grant_type": "refresh_token"
        }

        with httpx.Client() as client:
            r = client.post(url, data=data)
            if r.status_code != 200:
                logger.error(f"Failed to refresh Google access token: {r.text}")
                raise ValueError(f"Failed to refresh Google access token: {r.text}")
            tokens = r.json()

        profile.google_access_token = tokens["access_token"]
        expires_in = tokens.get("expires_in", 3600)
        profile.google_token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        db.commit()
        return profile.google_access_token

    @staticmethod
    def create_calendar_event(db: Session, appointment_id: uuid.UUID) -> dict | None:
        """
        Creates a Google Calendar event for the given appointment.
        Automatically sets up a Google Meet meeting.
        """
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            logger.error(f"Appointment {appointment_id} not found for calendar syncing")
            return None

        profile = appt.consultant
        if not profile or not profile.google_refresh_token:
            logger.info(f"Consultant for appointment {appointment_id} does not have Google Calendar linked. Skipping.")
            return None

        try:
            access_token = GoogleCalendarService.refresh_access_token(db, profile)
        except Exception as e:
            logger.error(f"Failed to refresh Google token for consultant {profile.id}: {str(e)}")
            return None

        # Format datetimes for Google Calendar API (RFC3339)
        start_dt = appt.scheduled_at
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        
        end_dt = start_dt + timedelta(minutes=appt.duration_minutes)

        event_data = {
            "summary": f"جلسة استشارية - منصة الاستشارات",
            "description": f"جلسة استشارية بين المستشار والعميل.\nملاحظات العميل: {appt.notes or 'لا توجد'}",
            "start": {
                "dateTime": start_dt.isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": "UTC"
            },
            "attendees": [
                {"email": appt.user.email},
                {"email": profile.user.email}
            ]
        }

        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client() as client:
                r = client.post(url, headers=headers, json=event_data)
                if r.status_code != 200:
                    logger.error(f"Failed to create Google Calendar event: {r.text}")
                    return None
                result = r.json()

            # Store event ID
            appt.google_event_id = result.get("id")
            
            db.commit()
            logger.info(f"Google Calendar event successfully created for appointment {appointment_id}")
            return result
        except Exception as e:
            logger.error(f"Exception during Google Calendar event creation for appointment {appointment_id}: {str(e)}")
            return None

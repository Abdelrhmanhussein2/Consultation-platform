import logging
import httpx
from datetime import datetime, timezone, timedelta
from helpers.config import settings

logger = logging.getLogger(__name__)

class DailyService:
    BASE_URL = "https://api.daily.co/v1"

    @classmethod
    def get_headers(cls) -> dict:
        return {
            "Authorization": f"Bearer {settings.DAILY_API_KEY}",
            "Content-Type": "application/json"
        }

    @classmethod
    def create_room(cls, appointment_id: str, duration_minutes: int) -> dict:
        """
        Creates a new Daily.co video room for the given appointment.
        If DAILY_API_KEY is not configured, it returns a mock session link for testing.
        """
        room_name = f"consultation-{str(appointment_id)[:8]}"
        
        # Calculate expiration time: scheduled_at + duration + 60 minutes buffer
        # Since we don't have scheduled_at here, let's set it to expire 2 hours from now
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes + 60)
        exp_timestamp = int(expires_at.timestamp())

        if not settings.DAILY_API_KEY:
            logger.warning("DAILY_API_KEY is not set. Generating mock session room details.")
            return {
                "room_name": room_name,
                "room_url": f"https://mock.daily.co/{room_name}",
                "expires_at": expires_at
            }

        url = f"{cls.BASE_URL}/rooms"
        payload = {
            "name": room_name,
            "privacy": "private",  # Make room private to require meeting tokens
            "properties": {
                "exp": exp_timestamp,
                "enable_chat": True,
                "enable_recording": None,  # Not enabling cloud recording on free tier
                "eject_at_room_exp": True
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload, headers=cls.get_headers())
                
                # Check for errors and handle them
                if response.status_code == 400 and "already exists" in response.text:
                    # Room might have been created already, retrieve it
                    retrieve_url = f"{url}/{room_name}"
                    get_resp = client.get(retrieve_url, headers=cls.get_headers())
                    if get_resp.status_code == 200:
                        room_data = get_resp.json()
                        return {
                            "room_name": room_name,
                            "room_url": room_data.get("url"),
                            "expires_at": expires_at
                        }

                response.raise_for_status()
                room_data = response.json()
                return {
                    "room_name": room_name,
                    "room_url": room_data.get("url"),
                    "expires_at": expires_at
                }
        except httpx.HTTPStatusError as e:
            logger.error(f"Daily.co API error creating room: {e.response.text}")
            raise ValueError(f"Failed to create video room: {e.response.text}")
        except Exception as e:
            logger.error(f"Error calling Daily.co API: {str(e)}")
            # Fallback to mock url so app doesn't crash in local test if offline or API is down
            logger.warning("Falling back to mock session url due to API connection error.")
            return {
                "room_name": room_name,
                "room_url": f"https://mock.daily.co/{room_name}",
                "expires_at": expires_at
            }

    @classmethod
    def generate_meeting_token(cls, room_name: str, user_name: str, is_owner: bool = False) -> str:
        """
        Generates a meeting token for a user to access a private Daily.co room.
        """
        if not settings.DAILY_API_KEY:
            logger.warning("DAILY_API_KEY is not set. Generating mock meeting token.")
            return "mock-meeting-token-123456"

        url = f"{cls.BASE_URL}/meeting-tokens"
        # Expiry set to 2 hours from now
        exp_timestamp = int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())
        
        payload = {
            "properties": {
                "room_name": room_name,
                "is_owner": is_owner,
                "user_name": user_name,
                "exp": exp_timestamp
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload, headers=cls.get_headers())
                response.raise_for_status()
                token_data = response.json()
                return token_data.get("token")
        except Exception as e:
            logger.error(f"Error generating Daily.co meeting token: {str(e)}")
            return "mock-meeting-token-fallback"

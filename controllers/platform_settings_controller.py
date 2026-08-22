import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

from models import User
from services.platform_settings_service import PlatformSettingsService

logger = logging.getLogger(__name__)


class PlatformSettingsController:

    @staticmethod
    def get_public_settings(db: Session) -> dict:
        """Returns public platform settings for frontend consumers."""
        return PlatformSettingsService.get_public_settings(db)

    @staticmethod
    def get_admin_settings(db: Session) -> dict:
        """Returns all configuration sections with masked credentials for administrators."""
        return PlatformSettingsService.get_all_admin_settings(db)

    @staticmethod
    def update_section(
        db: Session,
        section_key: str,
        data: dict,
        admin_user: User
    ) -> dict:
        """Updates a specific settings section."""
        return PlatformSettingsService.update_section(db, section_key, data, admin_user)

    @staticmethod
    def test_smtp_email(
        db: Session,
        target_email: str,
        admin_user: User
    ) -> dict:
        """Dispatches an interactive test email."""
        return PlatformSettingsService.send_test_email(db, target_email, admin_user)

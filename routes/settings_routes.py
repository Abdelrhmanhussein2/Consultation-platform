from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from helpers.database import get_db
from schemes import PublicPlatformSettingsOut
from controllers.platform_settings_controller import PlatformSettingsController

router = APIRouter(prefix="/settings", tags=["Platform Settings"])


@router.get(
    "/public",
    response_model=PublicPlatformSettingsOut,
    summary="Get public platform settings",
)
def get_public_platform_settings(
    db: Session = Depends(get_db),
):
    """
    Returns public brand, active currencies, display formatting, and enabled payment methods
    without exposing any confidential API keys, passwords, or secrets.
    """
    return PlatformSettingsController.get_public_settings(db)

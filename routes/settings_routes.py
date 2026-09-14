from typing import Any, Dict
from fastapi import APIRouter, Depends, Body, Path
from sqlalchemy.orm import Session

from helpers.database import get_db
from models import User
from routes.deps import require_admin
from schemes import (
    PublicPlatformSettingsOut,
    AllPlatformSettingsOut,
    TestEmailRequest,
    TestEmailResponse,
)
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


@router.get(
    "/admin",
    response_model=AllPlatformSettingsOut,
    summary="Get all platform settings (Admin only)",
)
def get_all_admin_settings(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Returns all configuration sections (brand, company, currency, smtp, payment gateways,
    sms, ai, policies) with sensitive secrets masked for administrators.
    """
    return PlatformSettingsController.get_admin_settings(db)


@router.put(
    "/admin/section/{section_key}",
    summary="Update a specific settings section (Admin only)",
)
def update_settings_section(
    section_key: str = Path(..., description="The configuration section key e.g. brand, smtp, currency, company, contract, gateways, sms, ai, policies"),
    data: Dict[str, Any] = Body(..., description="Configuration payload for this section"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Updates the configuration for a given section with input validation,
    encryption for secrets, and automatic audit logging.
    """
    return PlatformSettingsController.update_section(db, section_key, data, admin_user)


@router.post(
    "/admin/test-email",
    response_model=TestEmailResponse,
    summary="Send a test SMTP email (Admin only)",
)
def test_admin_smtp_email(
    payload: TestEmailRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Dispatches a real test email through the currently saved or system SMTP settings.
    """
    return PlatformSettingsController.test_smtp_email(db, payload.email, admin_user)


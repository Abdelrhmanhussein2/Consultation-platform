"""
Unified Services Entry Point & Re-exports
(Provides clean 100% backward compatibility for all imports from services.services)
"""

from services.users import UserService
from services.consultations import (
    ConsultantService, ServiceExpansionService, AppointmentService,
    RatingService, SpecializationService
)
from services.finance import InvoiceService

__all__ = [
    "UserService",
    "ConsultantService",
    "ServiceExpansionService",
    "AppointmentService",
    "RatingService",
    "InvoiceService",
    "SpecializationService",
]

"""
Unified Services Entry Point & Re-exports
(Provides clean 100% backward compatibility for all imports from services.services)
"""

from services.user_service import UserService
from services.consultant_service import ConsultantService
from services.service_expansion_service import ServiceExpansionService
from services.appointment_service import AppointmentService
from services.rating_service import RatingService
from services.invoice_service import InvoiceService
from services.specialization_service import SpecializationService

__all__ = [
    "UserService",
    "ConsultantService",
    "ServiceExpansionService",
    "AppointmentService",
    "RatingService",
    "InvoiceService",
    "SpecializationService",
]

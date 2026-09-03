from fastapi import APIRouter, Depends, Query, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal
import os
import uuid

from helpers.database import get_db
from models import User
from datetime import date
from schemes import (
    ConsultantProfileCreate, ConsultantProfileOut,
    ConsultantPublicProfileOut, ConsultantListItemOut,
    CredentialCreate, CredentialReview, CredentialOut,
    ServiceExpansionRequestCreate, ServiceExpansionRequestOut,
    ConsultantServiceCreate, ConsultantServiceUpdate, ConsultantServiceOut,
    ConsultantApplicationStatus, ClientSummaryOut,
    ConsultantAvailabilityCreate, ConsultantAvailabilityOut, AvailableSlotOut,
    SupportedBankOut, ConsultantBankAccountCreate, ConsultantBankAccountOut,
    ConsultantWalletOut, PayoutRequestCreate, PayoutRequestOut
)
from controllers import ConsultantController, RatingController
from routes.deps import get_current_active_user, require_consultant, require_super_admin

router = APIRouter(prefix="/consultants", tags=["Consultants"])


# ─────────────────────────────────────────────────────────────────────
# PUBLIC ENDPOINTS  (require authentication, no role restriction)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=List[ConsultantListItemOut],
    summary="Browse all approved consultants",
)
def list_consultants(
    specialization_id: Optional[int] = Query(None, description="Filter by specialization ID"),
    service_name: Optional[str] = Query(None, description="Keyword search in service names"),
    min_price: Optional[Decimal] = Query(None, description="Minimum service price"),
    max_price: Optional[Decimal] = Query(None, description="Maximum service price"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating"),
    platform_only: bool = Query(False, description="Filter by platform consultants only"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns a paginated list of all approved consultants.
    Visible to both users and consultants.
    Supports filtering by specialization, service name keyword, price range, rating, and platform role.
    """
    return ConsultantController.list_consultants(
        db,
        specialization_id=specialization_id,
        service_name=service_name,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        platform_only=platform_only,
        page=page,
        limit=limit,
    )


@router.get(
    "/{profile_id}",
    response_model=ConsultantPublicProfileOut,
    summary="Get a consultant's public profile",
)
def get_consultant_public_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the full public profile of an approved consultant,
    including their bio, specialization, rating, and active services.
    Visible to both users and consultants.
    """
    return ConsultantController.get_public_profile(db, profile_id)


@router.get(
    "/{profile_id}/services",
    response_model=List[ConsultantServiceOut],
    summary="List all active services for a consultant",
)
def get_consultant_services_public(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all active services offered by a specific consultant.
    Visible to both users and consultants.
    """
    return ConsultantController.get_consultant_services_public(db, profile_id)


@router.get(
    "/{profile_id}/ratings",
    summary="List all published ratings for a consultant",
)
def get_consultant_ratings_public(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all published ratings and reviews for a specific consultant.
    Visible to both users and consultants.
    """
    return RatingController.get_consultant_ratings(db, profile_id)


# ─────────────────────────────────────────────────────────────────────
# CONSULTANT SELF-MANAGEMENT ENDPOINTS (consultant role required)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/me/application",
    response_model=ConsultantApplicationStatus,
    summary="Check my application verification status",
)
def get_my_application_status(
    current_user: User = Depends(get_current_active_user),
):
    """
    Allows any consultant user to check their own profile verification status
    and see rejection reasons if applicable.
    """
    from helpers.enums import UserRole
    from fastapi import HTTPException
    if current_user.role not in (UserRole.consultant, UserRole.platform_consultant):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only consultants can view their application status",
        )
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultant profile not found",
        )
    return current_user.profile


@router.get(
    "/me/profile",
    response_model=ConsultantProfileOut,
    summary="Get my own consultant profile",
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Retrieves the logged-in consultant's own profile (approved consultants only)."""
    return ConsultantController.get_profile(db, current_user)


@router.put(
    "/me/profile",
    response_model=ConsultantProfileOut,
    summary="Update my consultant profile (PUT)",
)
@router.patch(
    "/me/profile",
    response_model=ConsultantProfileOut,
    summary="Update my consultant profile (PATCH)",
)
def update_my_profile(
    profile_in: ConsultantProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Updates the consultant's bio or main specialization (supports both PUT and PATCH)."""
    return ConsultantController.update_profile(db, current_user, profile_in)



@router.get(
    "/me/clients",
    response_model=List[ClientSummaryOut],
    summary="Get my clients list with details and stats",
)
def get_my_clients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Returns a paginated list of clients who have booked appointments with the logged-in consultant.
    Includes count of sessions, cancellation rates, total money spent, and last/next appointment times.
    """
    return ConsultantController.get_clients(db, current_user, page=page, limit=limit)


@router.get(
    "/me/services",
    response_model=List[ConsultantServiceOut],
    summary="Get all my services (including inactive)",
)
def get_my_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Returns all services (active and inactive) belonging to the logged-in consultant."""
    return ConsultantController.get_my_services(db, current_user)


@router.post(
    "/me/services",
    response_model=ConsultantServiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new service",
)
def add_service(
    service_in: ConsultantServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Adds a new service to the consultant's profile.
    Out-of-specialization services require an approved expansion request ID.
    """
    return ConsultantController.add_service(db, current_user, service_in)


@router.put(
    "/me/services/{service_id}",
    response_model=ConsultantServiceOut,
    summary="Update a service (PUT)",
)
@router.patch(
    "/me/services/{service_id}",
    response_model=ConsultantServiceOut,
    summary="Update a service (PATCH)",
)
def update_service(
    service_id: str,
    update_in: ConsultantServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Updates the name, description, price, or duration of a service."""
    return ConsultantController.update_service(db, current_user, service_id, update_in)


@router.patch(
    "/me/services/{service_id}/toggle",
    response_model=ConsultantServiceOut,
    summary="Toggle a service active/inactive",
)
def toggle_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Activates or deactivates a service."""
    return ConsultantController.toggle_service(db, current_user, service_id)


@router.post(
    "/me/expansion-requests/{request_id}/credentials",
    response_model=CredentialOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload credential for a specific service expansion request",
)
def upload_expansion_credential(
    request_id: str,
    cred_in: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Uploads qualification credentials specifically tied to a pending service expansion request.
    """
    try:
        req_uuid = uuid.UUID(request_id)
        return ConsultantController.upload_expansion_credential(db, current_user, req_uuid, cred_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put(
    "/me/availability",
    response_model=List[ConsultantAvailabilityOut],
    summary="Save weekly availability settings (PUT)",
)
@router.patch(
    "/me/availability",
    response_model=List[ConsultantAvailabilityOut],
    summary="Save weekly availability settings (PATCH)",
)
def set_availability(
    availabilities_in: List[ConsultantAvailabilityCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Sets the weekly availability schedule for the logged-in consultant.
    Replaces any existing settings.
    """
    return ConsultantController.set_availability(db, current_user, availabilities_in)


@router.get(
    "/me/availability",
    response_model=List[ConsultantAvailabilityOut],
    summary="Retrieve own availability settings",
)
def get_availabilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Retrieves the logged-in consultant's own weekly availability settings.
    """
    return ConsultantController.get_availabilities(db, current_user)

@router.get(
    "/{id}/available-slots",
    response_model=List[AvailableSlotOut],
    summary="Query free availability slots of a consultant",
)
def get_available_slots(
    id: str,
    start_date: date = Query(..., description="Query start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Query end date (YYYY-MM-DD)"),
    duration_minutes: int = Query(60, ge=1, le=480, description="Slot duration in minutes"),
    db: Session = Depends(get_db),
):
    """
    Retrieves a list of available (free) slots for a specific consultant within a date range.
    Automatically excludes already booked or pending appointments.
    """
    return ConsultantController.get_available_slots(
        db,
        profile_id=id,
        start_date=start_date,
        end_date=end_date,
        duration_minutes=duration_minutes
    )


@router.get(
    "/auth/google/url",
    summary="Get Google OAuth authorization URL",
)
def get_google_auth_url(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Generates and returns the Google OAuth consent page URL.
    The consultant should navigate to this URL to link their Google Calendar.
    """
    return ConsultantController.get_google_auth_url(db, current_user)


@router.get(
    "/auth/google/callback",
    summary="Google OAuth callback handler",
)
def google_auth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    """
    OAuth redirect callback. Google redirects here with authorization code and state (profile UUID).
    """
    return ConsultantController.google_auth_callback(db, code, state)


@router.post(
    "/me/credentials",
    response_model=CredentialOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a specialization credential",
)
def submit_credentials(
    cred_in: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Submits a credential document for admin review."""
    return ConsultantController.submit_credential(db, current_user, cred_in)


@router.post(
    "/me/expansions",
    response_model=ServiceExpansionRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a service expansion request",
)
def submit_service_expansion(
    request_in: ServiceExpansionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Submits a request to offer a service outside the consultant's main specialization.
    The request goes to admin for approval, and upon approval the consultant's role
    is upgraded to 'platform_consultant'.
    """
    return ConsultantController.submit_service_expansion(db, current_user, request_in)


@router.post(
    "/me/upload-proof",
    status_code=status.HTTP_201_CREATED,
    summary="Upload qualification proof or JCPA license document",
)
async def upload_proof_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_consultant),
):
    """
    Uploads a qualification proof document or license (PDF or images) up to 10MB.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الملف المرفوع يجب أن يكون صورة أو مستند PDF فقط"
        )
        
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حجم الملف يجب أن لا يتجاوز 10 ميجابايت"
        )
        
    _, ext = os.path.splitext(file.filename or "")
    if not ext:
        ext = ".pdf" if file.content_type == "application/pdf" else ".jpg"
    ext = ext.lower()
    
    os.makedirs(os.path.join("static", "documents"), exist_ok=True)
    new_filename = f"proof_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join("static", "documents", new_filename)
    
    with open(filepath, "wb") as f:
        f.write(file_bytes)
        
    return {
        "file_url": f"/static/documents/{new_filename}",
        "filename": file.filename
    }


# ─────────────────────────────────────────────────────────────────────
# BANK ACCOUNTS, WALLET & PAYOUTS (PHASE 2)
# ─────────────────────────────────────────────────────────────────────

@router.get(
    "/banks/supported",
    response_model=List[SupportedBankOut],
    summary="Get list of supported banks",
)
def get_supported_banks(
    country: Optional[str] = Query(None, description="Filter by country code: EG, SA, AE, INT"),
):
    """Returns the list of supported financial institutions for consultant bank accounts."""
    from services.wallet_service import WalletService
    return WalletService.get_supported_banks(country=country)


@router.get(
    "/me/bank-account",
    response_model=ConsultantBankAccountOut,
    summary="Get consultant registered bank account",
)
def get_my_bank_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Returns the logged-in consultant's registered bank account with masked sensitive numbers."""
    return ConsultantController.get_bank_account(db, current_user)


@router.put(
    "/me/bank-account",
    response_model=ConsultantBankAccountOut,
    summary="Register or update consultant bank account (PUT)",
)
@router.patch(
    "/me/bank-account",
    response_model=ConsultantBankAccountOut,
    summary="Register or update consultant bank account (PATCH)",
)
def save_my_bank_account(
    bank_in: ConsultantBankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):

    """
    Saves or updates the consultant's bank account with AES-256 field-level encryption for
    account number, IBAN, and SWIFT code.
    """
    return ConsultantController.save_bank_account(db, current_user, bank_in)


@router.get(
    "/me/wallet",
    response_model=ConsultantWalletOut,
    summary="Get consultant financial wallet balance",
)
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """
    Returns real-time financial stats:
    - Available balance eligible for withdrawal
    - Pending escrow balance for upcoming sessions
    - Total lifetime earnings
    - Total withdrawn
    - Pending payout requests in flight
    """
    return ConsultantController.get_wallet(db, current_user)


@router.post(
    "/me/payouts",
    response_model=PayoutRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new payout withdrawal request",
)
def request_payout(
    payout_in: PayoutRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Submits a payout request from the consultant's available balance."""
    return ConsultantController.request_payout(db, current_user, payout_in)


@router.get(
    "/me/payouts",
    response_model=List[PayoutRequestOut],
    summary="List consultant payout requests",
)
def list_my_payouts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Lists historical and pending payout requests for the logged-in consultant."""
    return ConsultantController.list_payouts(db, current_user, limit=limit, offset=offset)


@router.delete(
    "/me/payouts/{payout_id}",
    response_model=PayoutRequestOut,
    summary="Cancel a pending payout request",
)
def cancel_my_payout(
    payout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Cancels a pending payout request before it is processed by admin."""
    return ConsultantController.cancel_payout(db, current_user, payout_id)



# ─────────────────────────────────────────────────────────────────────
# ADMIN-ONLY ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

@router.post(
    "/credentials/{credential_id}/review",
    response_model=CredentialOut,
    summary="Review a consultant credential (Admin only)",
)
def review_credentials(
    credential_id: str,
    review_in: CredentialReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Approves or rejects a consultant's specialization credential."""
    return ConsultantController.review_credential(db, current_user, credential_id, review_in)

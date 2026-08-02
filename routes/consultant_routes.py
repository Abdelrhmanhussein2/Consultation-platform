from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal

from helpers.database import get_db
from models import User
from schemes import (
    ConsultantProfileCreate, ConsultantProfileOut,
    ConsultantPublicProfileOut, ConsultantListItemOut,
    CredentialCreate, CredentialReview, CredentialOut,
    ServiceExpansionRequestCreate, ServiceExpansionRequestOut,
    ConsultantServiceCreate, ConsultantServiceUpdate, ConsultantServiceOut,
    ConsultantApplicationStatus,
)
from controllers import ConsultantController
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
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns a paginated list of all approved consultants.
    Visible to both users and consultants.
    Supports filtering by specialization, service name keyword, price range, and rating.
    """
    return ConsultantController.list_consultants(
        db,
        specialization_id=specialization_id,
        service_name=service_name,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
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
    summary="Update my consultant profile",
)
def update_my_profile(
    profile_in: ConsultantProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant),
):
    """Updates the consultant's bio or main specialization (approved consultants only)."""
    return ConsultantController.update_profile(db, current_user, profile_in)


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
    summary="Update a service",
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

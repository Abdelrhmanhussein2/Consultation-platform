from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from helpers.database import get_db
from helpers.enums import UserRole
from models import User
from schemes import (
    ConsultantProfileCreate, ConsultantProfileOut,
    CredentialCreate, CredentialReview, CredentialOut,
    ServiceExpansionRequestCreate, ServiceExpansionRequestOut,
    ConsultantServiceCreate, ConsultantServiceOut,
    ConsultantApplicationStatus
)
from controllers import ConsultantController
from routes.deps import require_consultant, require_super_admin, get_current_active_user

router = APIRouter(prefix="/consultants", tags=["Consultants"])

@router.get("/my-application", response_model=ConsultantApplicationStatus)
def get_my_application_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Allows a consultant user to check their own profile application verification status and rejection reasons.
    """
    if current_user.role != UserRole.consultant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not a consultant"
        )
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultant profile not found"
        )
    return current_user.profile

@router.get("/profile", response_model=ConsultantProfileOut)
def get_my_profile(
    db: Session = Depends(get_db), current_user: User = Depends(require_consultant)
):
    """
    Retrieves the consultant profile (Approved consultants only).
    """
    return ConsultantController.get_profile(db, current_user)

@router.put("/profile", response_model=ConsultantProfileOut)
def update_my_profile(
    profile_in: ConsultantProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant)
):
    """
    Updates the consultant profile bio or specialization (Approved consultants only).
    """
    return ConsultantController.update_profile(db, current_user, profile_in)

@router.post("/credentials", response_model=CredentialOut, status_code=status.HTTP_201_CREATED)
def submit_credentials(
    cred_in: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant)
):
    """
    Submits a specialization credential document (Approved consultants only).
    """
    return ConsultantController.submit_credential(db, current_user, cred_in)

@router.post("/credentials/{credential_id}/review", response_model=CredentialOut)
def review_credentials(
    credential_id: str,
    review_in: CredentialReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Reviews/approves a consultant's specialization credentials (Super Admin only).
    """
    return ConsultantController.review_credential(db, current_user, credential_id, review_in)

@router.post("/expansions", response_model=ServiceExpansionRequestOut, status_code=status.HTTP_201_CREATED)
def submit_service_expansion(
    request_in: ServiceExpansionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant)
):
    """
    Submits a service expansion request (Approved consultants only).
    """
    return ConsultantController.submit_service_expansion(db, current_user, request_in)

@router.post("/services", response_model=ConsultantServiceOut, status_code=status.HTTP_201_CREATED)
def add_service(
    service_in: ConsultantServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_consultant)
):
    """
    Adds a new consultant service (Approved consultants only).
    """
    return ConsultantController.add_service(db, current_user, service_in)

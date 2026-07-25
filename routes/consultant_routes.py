from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from models.database import get_db
from models import User
from schemes import (
    ConsultantProfileCreate, ConsultantProfileOut,
    CredentialCreate, CredentialReview, CredentialOut,
    ServiceExpansionRequestCreate, ServiceExpansionRequestOut,
    ConsultantServiceCreate, ConsultantServiceOut
)
from controllers import ConsultantController
from routes.deps import get_current_user

router = APIRouter(prefix="/consultants", tags=["Consultants"])

@router.get("/profile", response_model=ConsultantProfileOut)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.get_profile(db, current_user)

@router.put("/profile", response_model=ConsultantProfileOut)
def update_my_profile(profile_in: ConsultantProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.update_profile(db, current_user, profile_in)

@router.post("/credentials", response_model=CredentialOut, status_code=status.HTTP_201_CREATED)
def submit_credentials(cred_in: CredentialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.submit_credential(db, current_user, cred_in)

@router.post("/credentials/{credential_id}/review", response_model=CredentialOut)
def review_credentials(credential_id: str, review_in: CredentialReview, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.review_credential(db, current_user, credential_id, review_in)

@router.post("/expansions", response_model=ServiceExpansionRequestOut, status_code=status.HTTP_201_CREATED)
def submit_service_expansion(request_in: ServiceExpansionRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.submit_service_expansion(db, current_user, request_in)

@router.post("/services", response_model=ConsultantServiceOut, status_code=status.HTTP_201_CREATED)
def add_service(service_in: ConsultantServiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ConsultantController.add_service(db, current_user, service_in)

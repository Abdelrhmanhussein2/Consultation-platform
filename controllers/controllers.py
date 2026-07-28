import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from schemes import (
    UserCreate, UserLogin, ConsultantProfileCreate, CredentialCreate,
    CredentialReview, ServiceExpansionRequestCreate, ConsultantServiceCreate,
    AppointmentCreate, AppointmentCancel, RatingCreate
)
from services import UserService, ConsultantService, AppointmentService, RatingService
from models import UserRole, User


class ConsultantController:
    @staticmethod
    def get_profile(db: Session, current_user: User):
        if current_user.role != UserRole.consultant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a consultant"
            )
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found"
            )
        return profile

    @staticmethod
    def update_profile(db: Session, current_user: User, profile_in: ConsultantProfileCreate):
        if current_user.role != UserRole.consultant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a consultant"
            )
        return ConsultantService.update_profile(db, current_user.id, profile_in)

    @staticmethod
    def submit_credential(db: Session, current_user: User, cred_in: CredentialCreate):
        if current_user.role != UserRole.consultant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a consultant"
            )
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found"
            )
        return ConsultantService.submit_credential(db, profile.id, cred_in.specialization_id, cred_in.document_url)

    @staticmethod
    def review_credential(db: Session, current_user: User, credential_id: str, review_in: CredentialReview):
        if current_user.role not in (UserRole.admin, UserRole.super_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can review credentials"
            )
        try:
            cred_uuid = uuid.UUID(credential_id)
            return ConsultantService.review_credential(db, cred_uuid, current_user.id, review_in.status, review_in.rejection_reason)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def submit_service_expansion(db: Session, current_user: User, request_in: ServiceExpansionRequestCreate):
        if current_user.role != UserRole.consultant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a consultant"
            )
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found"
            )
        return ConsultantService.submit_service_expansion(db, profile.id, request_in)

    @staticmethod
    def add_service(db: Session, current_user: User, service_in: ConsultantServiceCreate):
        if current_user.role != UserRole.consultant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a consultant"
            )
        profile = ConsultantService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultant profile not found"
            )
        try:
            return ConsultantService.add_service(db, profile.id, service_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


class AppointmentController:
    @staticmethod
    def book_appointment(db: Session, current_user: User, appt_in: AppointmentCreate):
        if current_user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can book appointments"
            )
        try:
            return AppointmentService.book_appointment(db, current_user.id, appt_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def cancel_appointment(db: Session, current_user: User, appointment_id: str, cancel_in: AppointmentCancel):
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return AppointmentService.cancel_appointment(db, current_user.id, appt_uuid, cancel_in.reason, current_user.role)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e).split('\n')[0]
            )


class RatingController:
    @staticmethod
    def rate_appointment(db: Session, current_user: User, appointment_id: str, rating_in: RatingCreate):
        if current_user.role != UserRole.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can rate appointments"
            )
        try:
            appt_uuid = uuid.UUID(appointment_id)
            return RatingService.rate_appointment(db, current_user.id, appt_uuid, rating_in.stars, rating_in.comment, rating_in.low_rating_reason)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e).split('\n')[0]
            )

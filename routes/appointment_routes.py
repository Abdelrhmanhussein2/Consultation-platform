from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from helpers.database import get_db
from models import User
from schemes import AppointmentCreate, AppointmentCancel, AppointmentOut, RatingCreate, RatingOut
from controllers import AppointmentController, RatingController
from routes.deps import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(appt_in: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AppointmentController.book_appointment(db, current_user, appt_in)

@router.post("/{appointment_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_appointment(appointment_id: str, cancel_in: AppointmentCancel, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AppointmentController.cancel_appointment(db, current_user, appointment_id, cancel_in)

@router.post("/{appointment_id}/rate", response_model=RatingOut, status_code=status.HTTP_201_CREATED)
def rate_appointment(appointment_id: str, rating_in: RatingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RatingController.rate_appointment(db, current_user, appointment_id, rating_in)

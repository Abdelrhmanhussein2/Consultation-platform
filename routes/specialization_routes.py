from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from schemes import SpecializationOut
from controllers import SpecializationController

router = APIRouter(prefix="/specializations", tags=["Specializations"])


@router.get(
    "/",
    response_model=List[SpecializationOut],
    summary="Get all specializations",
)
def get_specializations(db: Session = Depends(get_db)):
    """
    Returns a list of all available professional specializations on the platform.
    Publicly accessible to help users browse/filter and consultants register.
    """
    return SpecializationController.list_specializations(db)

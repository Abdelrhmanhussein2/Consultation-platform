from fastapi import APIRouter, Depends
from models import User
from schemes import UserOut
from routes.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_active_user)):
    """
    Returns details of the currently authenticated active user.
    """
    return current_user

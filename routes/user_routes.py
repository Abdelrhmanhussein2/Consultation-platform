from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from helpers.database import get_db
from models import User
from schemes import UserCreate, UserLogin, UserOut, Token
from controllers import UserController
from routes.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return UserController.register(db, user_in)

@router.post("/login", response_model=Token)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    return UserController.login(db, login_in)

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

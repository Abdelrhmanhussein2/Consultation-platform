from fastapi import APIRouter, Depends, Query, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from helpers.database import get_db
from helpers.enums import InvoiceStatus
from models import User
from schemes.invoice_schemes import InvoiceOut, InvoiceCreate
from controllers import InvoiceController
from services.auth_utils import verify_access_token
from services import UserService

router = APIRouter(prefix="/invoices", tags=["Invoices & Billing"])

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Safely retrieves the current active user if a valid bearer token is provided,
    otherwise returns None without throwing 401 unauthenticated errors.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    if not token or token == "null" or token == "undefined":
        return None
    payload = verify_access_token(token)
    if not payload:
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_uuid = uuid.UUID(user_id_str)
        return UserService.get_user_by_id(db, user_uuid)
    except Exception:
        return None


@router.get(
    "/all",
    response_model=List[InvoiceOut],
    summary="Get all invoices (Admin)",
)
def get_all_invoices(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return InvoiceController.get_all_invoices(db, page=page, limit=limit)


@router.get(
    "/next-number",
    summary="Get next sequential invoice and reference number",
)
def get_next_invoice_number(db: Session = Depends(get_db)):
    return InvoiceController.get_next_number(db)


@router.post(
    "/",
    response_model=InvoiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new invoice with backend-generated payment reference",
)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return InvoiceController.create_invoice(db, current_user, invoice_in)


@router.get(
    "/my",
    response_model=List[InvoiceOut],
    summary="Get user invoices history",
)
def get_my_invoices(
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status", description="Filter by invoice status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Returns the user's invoices and payment history, newest first.
    """
    user_id = current_user.id if current_user else None
    return InvoiceController.get_my_invoices(
        db, current_user, status_filter=status_filter, page=page, limit=limit
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceOut,
    summary="Get invoice details",
)
def get_invoice_detail(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Returns the full details of a specific invoice.
    """
    return InvoiceController.get_invoice_detail(db, current_user, invoice_id)



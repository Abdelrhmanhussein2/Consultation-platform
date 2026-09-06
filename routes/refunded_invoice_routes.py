from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from models import User
from schemes.refunded_invoice_schemes import RefundedInvoiceOut, RefundedInvoiceCreate
from controllers.refunded_invoice_controller import RefundedInvoiceController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/refunded-invoices", tags=["Refunded Invoices"])

@router.get(
    "/all",
    response_model=List[RefundedInvoiceOut],
    summary="Get all refunded invoices (Admin)"
)
def get_all_refunded_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RefundedInvoiceController.get_all_refunded_invoices(db, page=page, limit=limit)

@router.get(
    "/{refund_id}",
    response_model=RefundedInvoiceOut,
    summary="Get refunded invoice details"
)
def get_refunded_invoice_detail(
    refund_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RefundedInvoiceController.get_refunded_invoice_detail(db, refund_id)

@router.post(
    "/",
    response_model=RefundedInvoiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new refunded invoice request"
)
def create_refunded_invoice(
    data: RefundedInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RefundedInvoiceController.create_refunded_invoice(db, data)

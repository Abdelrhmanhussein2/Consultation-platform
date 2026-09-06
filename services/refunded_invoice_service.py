from sqlalchemy.orm import Session
from typing import List, Optional
from models.refunded_invoice import RefundedInvoice
from schemes.refunded_invoice_schemes import RefundedInvoiceCreate

from services.invoice_service_utils import generate_payment_reference_number

class RefundedInvoiceService:
    @staticmethod
    def get_all(db: Session, page: int = 1, limit: int = 50) -> List[RefundedInvoice]:
        skip = (page - 1) * limit
        return db.query(RefundedInvoice).order_by(RefundedInvoice.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, refund_id: str) -> Optional[RefundedInvoice]:
        return db.query(RefundedInvoice).filter(RefundedInvoice.id == refund_id).first()

    @staticmethod
    def create(db: Session, data: RefundedInvoiceCreate) -> RefundedInvoice:
        inv_data = data.dict(exclude_unset=True)
        if not inv_data.get("reference_number"):
            inv_data["reference_number"] = generate_payment_reference_number(db)
        if not inv_data.get("refund_number"):
            import random, datetime
            inv_data["refund_number"] = f"REF-{datetime.datetime.now().year}-{random.randint(1000, 9999)}"

        ref_inv = RefundedInvoice(**inv_data)
        db.add(ref_inv)
        db.commit()
        db.refresh(ref_inv)
        return ref_inv

import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from models.refunded_invoice import RefundedInvoice
from schemes.refunded_invoice_schemes import RefundedInvoiceCreate, RefundedInvoiceUpdate
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
        year = datetime.datetime.now().year

        if not inv_data.get("reference_number"):
            inv_data["reference_number"] = generate_payment_reference_number(db)
        else:
            existing_ref = db.query(RefundedInvoice).filter(RefundedInvoice.reference_number == inv_data["reference_number"]).first()
            if existing_ref:
                inv_data["reference_number"] = generate_payment_reference_number(db)

        if not inv_data.get("refund_number"):
            count = db.query(RefundedInvoice).count() + 1
            inv_data["refund_number"] = f"REF-{year}-{str(count).zfill(6)}"
        else:
            existing_num = db.query(RefundedInvoice).filter(RefundedInvoice.refund_number == inv_data["refund_number"]).first()
            if existing_num:
                count = db.query(RefundedInvoice).count() + 1
                inv_data["refund_number"] = f"REF-{year}-{str(count).zfill(6)}"

        ref_inv = RefundedInvoice(**inv_data)
        db.add(ref_inv)
        db.commit()
        db.refresh(ref_inv)
        return ref_inv

    @staticmethod
    def update(db: Session, refund_id: str, data: RefundedInvoiceUpdate) -> Optional[RefundedInvoice]:
        ref_inv = db.query(RefundedInvoice).filter(RefundedInvoice.id == refund_id).first()
        if not ref_inv:
            return None
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ref_inv, key, value)
        db.commit()
        db.refresh(ref_inv)
        return ref_inv

    @staticmethod
    def delete(db: Session, refund_id: str) -> bool:
        ref_inv = db.query(RefundedInvoice).filter(RefundedInvoice.id == refund_id).first()
        if not ref_inv:
            return False
        db.delete(ref_inv)
        db.commit()
        return True

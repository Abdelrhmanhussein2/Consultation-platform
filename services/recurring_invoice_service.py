from sqlalchemy.orm import Session
from typing import List, Optional
from models.recurring_invoice import RecurringInvoice
from schemes.recurring_invoice_schemes import RecurringInvoiceCreate

from services.invoice_service_utils import generate_payment_reference_number

class RecurringInvoiceService:
    @staticmethod
    def get_all(db: Session, page: int = 1, limit: int = 50) -> List[RecurringInvoice]:
        skip = (page - 1) * limit
        return db.query(RecurringInvoice).order_by(RecurringInvoice.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, recurring_id: str) -> Optional[RecurringInvoice]:
        return db.query(RecurringInvoice).filter(RecurringInvoice.id == recurring_id).first()

    @staticmethod
    def create(db: Session, data: RecurringInvoiceCreate) -> RecurringInvoice:
        inv_data = data.dict(exclude_unset=True)
        if not inv_data.get("reference_number"):
            inv_data["reference_number"] = generate_payment_reference_number(db)
        if not inv_data.get("recurring_number"):
            import random, datetime
            inv_data["recurring_number"] = f"RINV-{datetime.datetime.now().year}-{random.randint(1000, 9999)}"

        rec_inv = RecurringInvoice(**inv_data)
        db.add(rec_inv)
        db.commit()
        db.refresh(rec_inv)
        return rec_inv

import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from models.recurring_invoice import RecurringInvoice
from schemes.recurring_invoice_schemes import RecurringInvoiceCreate, RecurringInvoiceUpdate
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
        year = datetime.datetime.now().year

        if not inv_data.get("reference_number"):
            inv_data["reference_number"] = generate_payment_reference_number(db)
        else:
            existing_ref = db.query(RecurringInvoice).filter(RecurringInvoice.reference_number == inv_data["reference_number"]).first()
            if existing_ref:
                inv_data["reference_number"] = generate_payment_reference_number(db)

        if not inv_data.get("recurring_number"):
            count = db.query(RecurringInvoice).count() + 1
            inv_data["recurring_number"] = f"RINV-{year}-{str(count).zfill(6)}"
        else:
            existing_num = db.query(RecurringInvoice).filter(RecurringInvoice.recurring_number == inv_data["recurring_number"]).first()
            if existing_num:
                count = db.query(RecurringInvoice).count() + 1
                inv_data["recurring_number"] = f"RINV-{year}-{str(count).zfill(6)}"

        rec_inv = RecurringInvoice(**inv_data)
        db.add(rec_inv)
        db.commit()
        db.refresh(rec_inv)
        return rec_inv

    @staticmethod
    def update(db: Session, recurring_id: str, data: RecurringInvoiceUpdate) -> Optional[RecurringInvoice]:
        rec_inv = db.query(RecurringInvoice).filter(RecurringInvoice.id == recurring_id).first()
        if not rec_inv:
            return None
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(rec_inv, key, value)
        db.commit()
        db.refresh(rec_inv)
        return rec_inv

    @staticmethod
    def delete(db: Session, recurring_id: str) -> bool:
        rec_inv = db.query(RecurringInvoice).filter(RecurringInvoice.id == recurring_id).first()
        if not rec_inv:
            return False
        db.delete(rec_inv)
        db.commit()
        return True

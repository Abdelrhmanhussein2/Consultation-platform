from sqlalchemy.orm import Session
from services.recurring_invoice_service import RecurringInvoiceService
from schemes.recurring_invoice_schemes import RecurringInvoiceCreate

class RecurringInvoiceController:
    @staticmethod
    def get_all_recurring_invoices(db: Session, page: int = 1, limit: int = 50):
        return RecurringInvoiceService.get_all(db, page=page, limit=limit)

    @staticmethod
    def get_recurring_invoice_detail(db: Session, recurring_id: str):
        return RecurringInvoiceService.get_by_id(db, recurring_id)

    @staticmethod
    def create_recurring_invoice(db: Session, data: RecurringInvoiceCreate):
        return RecurringInvoiceService.create(db, data)

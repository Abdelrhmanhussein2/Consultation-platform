from sqlalchemy.orm import Session
from services.refunded_invoice_service import RefundedInvoiceService
from schemes.refunded_invoice_schemes import RefundedInvoiceCreate

class RefundedInvoiceController:
    @staticmethod
    def get_all_refunded_invoices(db: Session, page: int = 1, limit: int = 50):
        return RefundedInvoiceService.get_all(db, page=page, limit=limit)

    @staticmethod
    def get_refunded_invoice_detail(db: Session, refund_id: str):
        return RefundedInvoiceService.get_by_id(db, refund_id)

    @staticmethod
    def create_refunded_invoice(db: Session, data: RefundedInvoiceCreate):
        return RefundedInvoiceService.create(db, data)

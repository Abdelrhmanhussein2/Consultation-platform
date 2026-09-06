from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from services.recurring_invoice_service import RecurringInvoiceService
from schemes.recurring_invoice_schemes import RecurringInvoiceCreate, RecurringInvoiceUpdate

class RecurringInvoiceController:
    @staticmethod
    def get_all_recurring_invoices(db: Session, page: int = 1, limit: int = 50):
        return RecurringInvoiceService.get_all(db, page=page, limit=limit)

    @staticmethod
    def get_recurring_invoice_detail(db: Session, recurring_id: str):
        rec_inv = RecurringInvoiceService.get_by_id(db, recurring_id)
        if not rec_inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفاتورة الدورية غير موجودة")
        return rec_inv

    @staticmethod
    def create_recurring_invoice(db: Session, data: RecurringInvoiceCreate):
        return RecurringInvoiceService.create(db, data)

    @staticmethod
    def update_recurring_invoice(db: Session, recurring_id: str, data: RecurringInvoiceUpdate):
        updated = RecurringInvoiceService.update(db, recurring_id, data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفاتورة الدورية غير موجودة")
        return updated

    @staticmethod
    def delete_recurring_invoice(db: Session, recurring_id: str):
        deleted = RecurringInvoiceService.delete(db, recurring_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفاتورة الدورية غير موجودة")
        return {"detail": "تم حذف الفاتورة الدورية بنجاح"}

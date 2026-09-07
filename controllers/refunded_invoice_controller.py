from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from services.refunded_invoice_service import RefundedInvoiceService
from schemes.refunded_invoice_schemes import RefundedInvoiceCreate, RefundedInvoiceUpdate

class RefundedInvoiceController:
    @staticmethod
    def get_all_refunded_invoices(db: Session, page: int = 1, limit: int = 50):
        return RefundedInvoiceService.get_all(db, page=page, limit=limit)

    @staticmethod
    def get_next_number(db: Session):
        return RefundedInvoiceService.get_next_number(db)

    @staticmethod
    def get_refunded_invoice_detail(db: Session, refund_id: str):
        ref_inv = RefundedInvoiceService.get_by_id(db, refund_id)
        if not ref_inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="طلب الاسترداد غير موجود")
        return ref_inv

    @staticmethod
    def create_refunded_invoice(db: Session, data: RefundedInvoiceCreate):
        return RefundedInvoiceService.create(db, data)

    @staticmethod
    def update_refunded_invoice(db: Session, refund_id: str, data: RefundedInvoiceUpdate):
        updated = RefundedInvoiceService.update(db, refund_id, data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="طلب الاسترداد غير موجود")
        return updated

    @staticmethod
    def delete_refunded_invoice(db: Session, refund_id: str):
        deleted = RefundedInvoiceService.delete(db, refund_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="طلب الاسترداد غير موجود")
        return {"detail": "تم حذف طلب الاسترداد بنجاح"}

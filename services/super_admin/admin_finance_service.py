import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from models import (
    User, ConsultantProfile, Invoice, PayoutRequest,
    UserRole, InvoiceStatus, PayoutStatus, NotificationType
)
from services.notification_service import NotificationService


class AdminFinanceService:
    @staticmethod
    def list_all_payments_transfers(db: Session) -> list:
        """
        Retrieves unified live payments, invoices, subscription orders, and consultant payout requests from the database.
        """
        results = []
        item_counter = 1

        # 1. Consultant Payout Requests
        payouts = db.query(PayoutRequest).order_by(PayoutRequest.requested_at.desc()).all()
        for p in payouts:
            consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == p.consultant_id).first()
            consultant_user = db.query(User).filter(User.id == consultant.user_id).first() if consultant else None
            user_name = consultant_user.full_name if consultant_user else "مستشار غير معروف"
            
            # Status mapping
            if p.status in (PayoutStatus.paid, PayoutStatus.approved):
                st = "معتمدة"
            elif p.status == PayoutStatus.rejected:
                st = "مرفوضة"
            else:
                st = "معلّقة"

            # Parse method from bank details snapshot
            method = "تحويل بنكي"
            try:
                if p.bank_details_snapshot:
                    snap = json.loads(p.bank_details_snapshot) if isinstance(p.bank_details_snapshot, str) else p.bank_details_snapshot
                    if snap.get("masked_iban") and "cliq" in str(snap.get("bank_name", "")).lower():
                        method = "CliQ"
                    elif snap.get("bank_name"):
                        method = "تحويل بنكي"
            except Exception:
                pass

            date_str = p.requested_at.strftime("%d-%m-%Y %H:%M") if p.requested_at else datetime.now().strftime("%d-%m-%Y %H:%M")
            order_num = p.transfer_reference or f"ORD-PO-{str(p.id)[:8].upper()}"
            file_name = p.receipt_url.split("/")[-1] if p.receipt_url else "payout_receipt.pdf"

            results.append({
                "id": str(p.id),
                "order": order_num,
                "date": date_str,
                "name": user_name,
                "type": "مستشار",
                "method": method,
                "amount": f"{float(p.amount):.3f} د.أ",
                "status": st,
                "service": "سحب أرباح واستحقاقات",
                "ref": p.transfer_reference or f"REF-PO-{str(p.id)[:6].upper()}",
                "file": p.receipt_url or "proof-04.png",
                "fileName": file_name,
                "entity_type": "payout_request",
                "entity_id": str(p.id),
                "user_id": str(consultant_user.id) if consultant_user else None,
                "notes": p.admin_notes or ""
            })
            item_counter += 1

        # 2. Invoices (Appointment payments and direct invoices)
        invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
        for inv in invoices:
            inv_user = db.query(User).filter(User.id == inv.issued_to_user_id).first() if inv.issued_to_user_id else None
            user_name = inv_user.full_name if inv_user else "عميل المنصة"
            user_role_str = "مستشار" if inv_user and inv_user.role == UserRole.consultant else "مستخدم"

            if inv.status == InvoiceStatus.paid:
                st = "معتمدة"
            elif inv.status == InvoiceStatus.cancelled:
                st = "مرفوضة"
            else:
                st = "معلّقة"

            method = inv.payment_method or ("CliQ" if float(inv.total_amount) < 100 else "تحويل بنكي")
            date_str = inv.created_at.strftime("%d-%m-%Y %H:%M") if inv.created_at else datetime.now().strftime("%d-%m-%Y %H:%M")

            results.append({
                "id": str(inv.id),
                "order": inv.invoice_number or f"ORD-INV-{str(inv.id)[:8].upper()}",
                "date": date_str,
                "name": user_name,
                "type": user_role_str,
                "method": method,
                "amount": f"{float(inv.total_amount):.3f} د.أ",
                "status": st,
                "service": "استشارة ضريبية وجلسة مهنية",
                "ref": f"REF-INV-{str(inv.id)[:6].upper()}",
                "file": "proof-invoice.pdf",
                "fileName": f"invoice_{inv.invoice_number}.pdf",
                "entity_type": "invoice",
                "entity_id": str(inv.id),
                "user_id": str(inv_user.id) if inv_user else None,
                "notes": inv.notes or ""
            })
            item_counter += 1

        # 3. Subscription Requests (if available)
        try:
            from models.subscription_request import SubscriptionRequest
            sub_requests = db.query(SubscriptionRequest).order_by(SubscriptionRequest.created_at.desc()).all()
            for sr in sub_requests:
                sr_user = db.query(User).filter(User.id == sr.user_id).first() if sr.user_id else None
                user_name = sr_user.full_name if sr_user else "مشترك باقة"
                user_role_str = "مستشار" if sr_user and sr_user.role == UserRole.consultant else "مستخدم"

                if sr.status == "approved":
                    st = "معتمدة"
                elif sr.status == "rejected":
                    st = "مرفوضة"
                else:
                    st = "معلّقة"

                date_str = sr.created_at.strftime("%d-%m-%Y %H:%M") if sr.created_at else datetime.now().strftime("%d-%m-%Y %H:%M")
                results.append({
                    "id": str(sr.id),
                    "order": sr.request_no or f"ORD-SUB-{str(sr.id)[:8].upper()}",
                    "date": date_str,
                    "name": user_name,
                    "type": user_role_str,
                    "method": sr.payment_method or "تحويل بنكي",
                    "amount": f"{float(sr.amount):.3f} د.أ",
                    "status": st,
                    "service": f"اشتراك باقة ({sr.subscription})",
                    "ref": f"REF-SUB-{str(sr.id)[:6].upper()}",
                    "file": sr.proof_file_url or "proof-subscription.png",
                    "fileName": sr.proof_file_url.split('/')[-1] if sr.proof_file_url else "sub_receipt.png",
                    "entity_type": "subscription_request",
                    "entity_id": str(sr.id),
                    "user_id": str(sr_user.id) if sr_user else None,
                    "notes": sr.reject_reason or sr.grant_reason or ""
                })
                item_counter += 1
        except Exception:
            pass

        return results

    @staticmethod
    def process_payment_action(
        db: Session,
        current_admin: User,
        payment_id: str,
        action: str,
        admin_notes: Optional[str] = None,
        transfer_ref: Optional[str] = None
    ) -> dict:
        """
        Approves, rejects, or holds a payment/payout record and dispatches live notification to the owner.
        """
        action_clean = action.strip().lower()

        # 1. Try PayoutRequest
        payout = db.query(PayoutRequest).filter(PayoutRequest.id == payment_id).first()
        if payout:
            consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == payout.consultant_id).first()
            consultant_user = db.query(User).filter(User.id == consultant.user_id).first() if consultant else None
            
            payout.processed_by = current_admin.id
            payout.processed_at = datetime.now(timezone.utc)
            if admin_notes:
                payout.admin_notes = admin_notes
            if transfer_ref:
                payout.transfer_reference = transfer_ref

            if action_clean in ("approve", "معتمدة", "اعتمد"):
                payout.status = PayoutStatus.paid
                new_status_str = "معتمدة"
                if consultant_user:
                    NotificationService.send(
                        db=db,
                        user_id=consultant_user.id,
                        notification_type=NotificationType.payout_processed,
                        title="تم اعتماد وصرف طلب سحب الأرباح",
                        message=f"تمت الموافقة على طلب سحب الأرباح بقيمة {float(payout.amount):.2f} {payout.currency} بنجاح. رقم الحوالة: {transfer_ref or payout.transfer_reference or 'مكتمل'}.",
                        related_entity_type="payout_request",
                        related_entity_id=payout.id
                    )
            elif action_clean in ("reject", "مرفوضة", "رفض"):
                payout.status = PayoutStatus.rejected
                new_status_str = "مرفوضة"
                if consultant_user:
                    NotificationService.send(
                        db=db,
                        user_id=consultant_user.id,
                        notification_type=NotificationType.payout_processed,
                        title="تم رفض طلب سحب الأرباح",
                        message=f"نأسف، تم رفض طلب سحب الأرباح بقيمة {float(payout.amount):.2f} {payout.currency}. السبب: {admin_notes or 'يرجى مراجعة الإدارة وتدقيق الحساب البنكي'}.",
                        related_entity_type="payout_request",
                        related_entity_id=payout.id
                    )
            else:
                payout.status = PayoutStatus.pending
                new_status_str = "معلّقة"

            db.commit()
            db.refresh(payout)
            return {"status": "success", "message": f"تم تحديث حالة طلب السحب إلى {new_status_str}", "new_status": new_status_str}

        # 2. Try Invoice
        invoice = db.query(Invoice).filter(Invoice.id == payment_id).first()
        if invoice:
            inv_user = db.query(User).filter(User.id == invoice.issued_to_user_id).first() if invoice.issued_to_user_id else None
            if admin_notes:
                invoice.notes = admin_notes

            if action_clean in ("approve", "معتمدة", "اعتمد"):
                invoice.status = InvoiceStatus.paid
                invoice.paid_at = datetime.now(timezone.utc)
                new_status_str = "معتمدة"
                if inv_user:
                    NotificationService.send(
                        db=db,
                        user_id=inv_user.id,
                        notification_type=NotificationType.payment_confirmed,
                        title="تم اعتماد سداد الفاتورة بنجاح",
                        message=f"تم اعتماد سداد الفاتورة رقم {invoice.invoice_number} بقيمة {float(invoice.total_amount):.2f} {invoice.currency}.",
                        related_entity_type="invoice",
                        related_entity_id=invoice.id
                    )
            elif action_clean in ("reject", "مرفوضة", "رفض"):
                invoice.status = InvoiceStatus.cancelled
                new_status_str = "مرفوضة"
                if inv_user:
                    NotificationService.send(
                        db=db,
                        user_id=inv_user.id,
                        notification_type=NotificationType.system_announcement,
                        title="تم إلغاء / رفض الفاتورة",
                        message=f"تم رفض/إلغاء الفاتورة رقم {invoice.invoice_number}. السبب: {admin_notes or 'تم الإلغاء بواسطة الإدارة'}.",
                        related_entity_type="invoice",
                        related_entity_id=invoice.id
                    )
            else:
                invoice.status = InvoiceStatus.issued
                new_status_str = "معلّقة"

            db.commit()
            db.refresh(invoice)
            return {"status": "success", "message": f"تم تحديث حالة الفاتورة إلى {new_status_str}", "new_status": new_status_str}

        # 3. Try SubscriptionRequest
        try:
            from models.subscription_request import SubscriptionRequest
            sr = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == payment_id).first()
            if sr:
                sr_user = db.query(User).filter(User.id == sr.user_id).first() if sr.user_id else None
                if action_clean in ("approve", "معتمدة", "اعتمد"):
                    sr.status = "approved"
                    new_status_str = "معتمدة"
                    if sr_user:
                        NotificationService.send(
                            db=db,
                            user_id=sr_user.id,
                            notification_type=NotificationType.subscription_activated,
                            title="تم اعتماد وتفعيل اشتراك الباقة",
                            message=f"تم تأكيد عملية الدفع وتفعيل اشتراكك في باقة المنصة بنجاح.",
                            related_entity_type="subscription_request",
                            related_entity_id=sr.id
                        )
                elif action_clean in ("reject", "مرفوضة", "رفض"):
                    sr.status = "rejected"
                    sr.reject_reason = admin_notes
                    new_status_str = "مرفوضة"
                    if sr_user:
                        NotificationService.send(
                            db=db,
                            user_id=sr_user.id,
                            notification_type=NotificationType.system_announcement,
                            title="تم رفض طلب الاشتراك في الباقة",
                            message=f"تم رفض طلب الاشتراك في الباقة. السبب: {admin_notes or 'يرجى مراجعة صحة إيصال التحويل'}.",
                            related_entity_type="subscription_request",
                            related_entity_id=sr.id
                        )
                else:
                    sr.status = "pending"
                    new_status_str = "معلّقة"

                db.commit()
                db.refresh(sr)
                return {"status": "success", "message": f"تم تحديث حالة طلب الاشتراك إلى {new_status_str}", "new_status": new_status_str}
        except Exception:
            pass

        raise ValueError("سجل الدفع غير موجود بالمنظومة")

    @staticmethod
    def delete_payment_record(db: Session, payment_id: str) -> dict:
        """
        Deletes a payment, payout, or invoice record securely.
        """
        payout = db.query(PayoutRequest).filter(PayoutRequest.id == payment_id).first()
        if payout:
            db.delete(payout)
            db.commit()
            return {"status": "success", "message": "تم حذف سجل طلب السحب بنجاح"}

        invoice = db.query(Invoice).filter(Invoice.id == payment_id).first()
        if invoice:
            db.delete(invoice)
            db.commit()
            return {"status": "success", "message": "تم حذف الفاتورة بنجاح"}

        try:
            from models.subscription_request import SubscriptionRequest
            sr = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == payment_id).first()
            if sr:
                db.delete(sr)
                db.commit()
                return {"status": "success", "message": "تم حذف طلب الاشتراك بنجاح"}
        except Exception:
            pass

        return {"status": "success", "message": "تم حذف السجل"}

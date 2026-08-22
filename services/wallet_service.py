import json
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from helpers.enums import (
    AppointmentStatus, PayoutStatus, NotificationType
)
from helpers.encryption import (
    encrypt_text, decrypt_text,
    mask_bank_account, mask_iban, mask_string
)
from models.consultant_profile import ConsultantProfile
from models.consultant_bank_account import ConsultantBankAccount
from models.payout_request import PayoutRequest
from models.appointment import Appointment
from models.notification import Notification
from models.user import User
from schemes.schemes import (
    ConsultantBankAccountCreate, ConsultantBankAccountOut,
    ConsultantWalletOut, PayoutRequestOut
)

# Fixed official peg exchange rate: 1 USD = 0.709 JOD (1 JOD ≈ 1.4104 USD)
JOD_TO_USD_RATE = Decimal("1.4104")
USD_TO_JOD_RATE = Decimal("0.7090")

SUPPORTED_BANKS = [
    # المملكة الأردنية الهاشمية (Jordan) - Primary
    {"code": "ARAB", "name_ar": "البنك العربي", "name_en": "Arab Bank", "country": "JO"},
    {"code": "HBTF", "name_ar": "بنك الإسكان للتجارة والتمويل", "name_en": "The Housing Bank for Trade and Finance", "country": "JO"},
    {"code": "JIB", "name_ar": "البنك الإسلامي الأردني", "name_en": "Jordan Islamic Bank", "country": "JO"},
    {"code": "UBSI", "name_ar": "بنك الاتحاد", "name_en": "Bank al Etihad", "country": "JO"},
    {"code": "CAB", "name_ar": "بنك القاهرة عمان", "name_en": "Cairo Amman Bank", "country": "JO"},
    {"code": "JKB", "name_ar": "بنك الأردن والكويت", "name_en": "Jordan Kuwait Bank", "country": "JO"},
    {"code": "BOJ", "name_ar": "بنك الأردن", "name_en": "Bank of Jordan", "country": "JO"},
    {"code": "SAFWA", "name_ar": "بنك صفوة الإسلامي", "name_en": "Safwa Islamic Bank", "country": "JO"},
    {"code": "EXIM", "name_ar": "كابيتال بنك", "name_en": "Capital Bank of Jordan", "country": "JO"},
    {"code": "AJIB", "name_ar": "بنك الاستثمار العربي الأردني", "name_en": "Arab Jordan Investment Bank", "country": "JO"},
    {"code": "AHLI", "name_ar": "البنك الأهلي الأردني", "name_en": "Jordan Ahli Bank", "country": "JO"},
    {"code": "IIAB", "name_ar": "البنك العربي الإسلامي الدولي", "name_en": "Islamic International Arab Bank", "country": "JO"},
    {"code": "ABC_JO", "name_ar": "المؤسسة المصرفية العربية - الأردن", "name_en": "Bank ABC Jordan", "country": "JO"},
    {"code": "SCB_JO", "name_ar": "بنك ستاندرد تشارترد الأردن", "name_en": "Standard Chartered Jordan", "country": "JO"},

    # بنوك إقليمية ودولية (International & Regional)
    {"code": "OTHER", "name_ar": "بنك آخر / تحويل دولي (سويفت)", "name_en": "Other Bank / International Swift", "country": "INT"}
]



class WalletService:

    @staticmethod
    def get_supported_banks(country: Optional[str] = None) -> List[dict]:
        """Returns the list of supported financial institutions filtered by country if provided."""
        if not country:
            return SUPPORTED_BANKS
        return [b for b in SUPPORTED_BANKS if b["country"].upper() == country.upper() or b["country"] == "INT"]

    @staticmethod
    def format_bank_account_out(acc: ConsultantBankAccount) -> dict:
        """Converts an encrypted database model to a safe masked output dictionary."""
        decrypted_acc_num = decrypt_text(acc.account_number_encrypted)
        decrypted_iban = decrypt_text(acc.iban_encrypted) if acc.iban_encrypted else None
        decrypted_swift = decrypt_text(acc.swift_code_encrypted) if acc.swift_code_encrypted else None

        return {
            "id": acc.id,
            "consultant_id": acc.consultant_id,
            "bank_name": acc.bank_name,
            "account_holder_name": acc.account_holder_name,
            "masked_account_number": mask_bank_account(decrypted_acc_num),
            "masked_iban": mask_iban(decrypted_iban) if decrypted_iban else None,
            "masked_swift_code": mask_string(decrypted_swift, visible_suffix=3) if decrypted_swift else None,
            "branch_name": acc.branch_name,
            "currency": acc.currency or "JOD",
            "is_verified": acc.is_verified,
            "created_at": acc.created_at,
            "updated_at": acc.updated_at,
        }

    @staticmethod
    def upsert_bank_account(
        db: Session,
        consultant_id: uuid.UUID,
        bank_in: ConsultantBankAccountCreate
    ) -> dict:
        """
        Securely saves or updates the consultant bank account with AES-256 field encryption.
        """
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.id == consultant_id).first()
        if not profile:
            raise ValueError("ملف المستشار غير موجود")

        # Check existing bank account
        acc = db.query(ConsultantBankAccount).filter(
            ConsultantBankAccount.consultant_id == consultant_id
        ).first()

        enc_account_number = encrypt_text(bank_in.account_number.strip())
        enc_iban = encrypt_text(bank_in.iban.strip().replace(" ", "").upper()) if bank_in.iban else None
        enc_swift = encrypt_text(bank_in.swift_code.strip().upper()) if bank_in.swift_code else None
        currency_val = bank_in.currency.strip().upper() if bank_in.currency else "JOD"

        if acc:
            acc.bank_name = bank_in.bank_name.strip()
            acc.account_holder_name = bank_in.account_holder_name.strip()
            acc.account_number_encrypted = enc_account_number
            acc.iban_encrypted = enc_iban
            acc.swift_code_encrypted = enc_swift
            acc.branch_name = bank_in.branch_name.strip() if bank_in.branch_name else None
            acc.currency = currency_val
        else:
            acc = ConsultantBankAccount(
                id=uuid.uuid4(),
                consultant_id=consultant_id,
                bank_name=bank_in.bank_name.strip(),
                account_holder_name=bank_in.account_holder_name.strip(),
                account_number_encrypted=enc_account_number,
                iban_encrypted=enc_iban,
                swift_code_encrypted=enc_swift,
                branch_name=bank_in.branch_name.strip() if bank_in.branch_name else None,
                currency=currency_val,
                is_verified=False
            )
            db.add(acc)

        db.commit()
        db.refresh(acc)
        return WalletService.format_bank_account_out(acc)

    @staticmethod
    def get_bank_account(db: Session, consultant_id: uuid.UUID) -> Optional[dict]:
        """Retrieves and formats the consultant's registered bank account if found."""
        acc = db.query(ConsultantBankAccount).filter(
            ConsultantBankAccount.consultant_id == consultant_id
        ).first()
        if not acc:
            return None
        return WalletService.format_bank_account_out(acc)

    @staticmethod
    def get_wallet_balance(db: Session, consultant_id: uuid.UUID) -> dict:
        """
        Calculates real-time financial wallet state for a consultant:
        - Total earned: Sum of prices from all completed appointments.
        - Pending escrow: Sum of prices from confirmed upcoming appointments.
        - Total withdrawn: Sum of transferred payouts.
        - Pending payouts: Sum of pending / approved payout requests in flight.
        - Available balance: Max(0, Total earned - Total withdrawn - Pending payouts).
        - Dual currency display (JOD primary with USD equivalent).
        """
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.id == consultant_id).first()
        if not profile:
            raise ValueError("ملف المستشار غير موجود")

        # 1. Completed Appointments Revenue (Total Earned)
        completed_sum = db.query(func.coalesce(func.sum(Appointment.price), 0)).filter(
            Appointment.consultant_id == consultant_id,
            Appointment.status == AppointmentStatus.completed
        ).scalar()
        total_earned = Decimal(str(completed_sum or 0)).quantize(Decimal("0.01"))

        # 2. Upcoming Confirmed Appointments Escrow (Pending Balance)
        confirmed_sum = db.query(func.coalesce(func.sum(Appointment.price), 0)).filter(
            Appointment.consultant_id == consultant_id,
            Appointment.status == AppointmentStatus.confirmed
        ).scalar()
        pending_balance = Decimal(str(confirmed_sum or 0)).quantize(Decimal("0.01"))

        # 3. Transferred Payouts (Total Withdrawn)
        transferred_sum = db.query(func.coalesce(func.sum(PayoutRequest.amount), 0)).filter(
            PayoutRequest.consultant_id == consultant_id,
            PayoutRequest.status == PayoutStatus.transferred
        ).scalar()
        total_withdrawn = Decimal(str(transferred_sum or 0)).quantize(Decimal("0.01"))

        # 4. In-Flight Payout Requests (Pending + Approved)
        inflight_sum = db.query(func.coalesce(func.sum(PayoutRequest.amount), 0)).filter(
            PayoutRequest.consultant_id == consultant_id,
            PayoutRequest.status.in_([PayoutStatus.pending, PayoutStatus.approved])
        ).scalar()
        pending_payouts = Decimal(str(inflight_sum or 0)).quantize(Decimal("0.01"))

        # 5. Available Balance for Withdrawal
        available_balance = max(Decimal("0.00"), total_earned - total_withdrawn - pending_payouts).quantize(Decimal("0.01"))

        # Check bank account
        bank_account = WalletService.get_bank_account(db, consultant_id)
        currency_code = bank_account.get("currency", "JOD") if bank_account else "JOD"

        # USD & JOD Dual Currency Equivalence
        if currency_code == "JOD":
            equivalent_usd = (available_balance * JOD_TO_USD_RATE).quantize(Decimal("0.01"))
            total_earned_usd = (total_earned * JOD_TO_USD_RATE).quantize(Decimal("0.01"))
            secondary_currency = "USD"
            secondary_balance = equivalent_usd
        else:
            equivalent_jod = (available_balance * USD_TO_JOD_RATE).quantize(Decimal("0.01"))
            total_earned_usd = total_earned
            secondary_currency = "JOD"
            secondary_balance = equivalent_jod

        return {
            "available_balance": available_balance,
            "pending_balance": pending_balance,
            "total_earned": total_earned,
            "total_withdrawn": total_withdrawn,
            "pending_payouts": pending_payouts,
            "currency": currency_code,
            "secondary_currency": secondary_currency,
            "secondary_available_balance": secondary_balance,
            "has_bank_account": bank_account is not None,
            "bank_account": bank_account,
        }

    @staticmethod
    def create_payout_request(
        db: Session,
        consultant_id: uuid.UUID,
        amount: Decimal
    ) -> dict:
        """
        Creates a new payout request after validating balance eligibility and bank details.
        """
        if amount <= 0:
            raise ValueError("مبلغ السحب يجب أن يكون أكبر من الصفر")

        bank_acc = WalletService.get_bank_account(db, consultant_id)
        if not bank_acc:
            raise ValueError("يجب تسجيل وتأكيد بيانات الحساب البنكي أولاً قبل تقديم طلب سحب الأرباح")

        # Check minimum withdrawal limit (10 JOD or 15 USD)
        min_payout = Decimal("15.00") if bank_acc["currency"] == "USD" else Decimal("10.00")
        if amount < min_payout:
            raise ValueError(f"الحد الأدنى لطلب السحب هو {min_payout} {bank_acc['currency']}")

        # Verify sufficient available funds
        wallet = WalletService.get_wallet_balance(db, consultant_id)
        if amount > wallet["available_balance"]:
            raise ValueError(
                f"الرصيد المتاح للسحب ({wallet['available_balance']} {wallet['currency']}) "
                f"أقل من المبلغ المطلوب ({amount} {wallet['currency']})"
            )

        # Build bank snapshot
        snapshot = {
            "bank_name": bank_acc["bank_name"],
            "account_holder_name": bank_acc["account_holder_name"],
            "masked_account_number": bank_acc["masked_account_number"],
            "masked_iban": bank_acc.get("masked_iban"),
            "masked_swift_code": bank_acc.get("masked_swift_code"),
            "branch_name": bank_acc.get("branch_name"),
            "currency": bank_acc["currency"]
        }

        payout = PayoutRequest(
            id=uuid.uuid4(),
            consultant_id=consultant_id,
            amount=amount,
            currency=bank_acc["currency"],
            bank_details_snapshot=json.dumps(snapshot, ensure_ascii=False),
            status=PayoutStatus.pending
        )
        db.add(payout)
        db.commit()
        db.refresh(payout)

        return WalletService.format_payout_out(payout)

    @staticmethod
    def format_payout_out(payout: PayoutRequest) -> dict:
        """Formats a PayoutRequest model into an API response dict."""
        try:
            snapshot_dict = json.loads(payout.bank_details_snapshot) if isinstance(payout.bank_details_snapshot, str) else payout.bank_details_snapshot
        except Exception:
            snapshot_dict = {"raw": payout.bank_details_snapshot}

        consultant_name = None
        if payout.consultant and payout.consultant.user:
            consultant_name = payout.consultant.user.full_name

        processor_name = None
        if payout.processor:
            processor_name = payout.processor.full_name

        return {
            "id": payout.id,
            "consultant_id": payout.consultant_id,
            "consultant_name": consultant_name,
            "amount": payout.amount,
            "currency": payout.currency,
            "bank_details_snapshot": snapshot_dict,
            "status": payout.status,
            "transfer_reference": payout.transfer_reference,
            "receipt_url": payout.receipt_url,
            "admin_notes": payout.admin_notes,
            "processed_by_name": processor_name,
            "requested_at": payout.requested_at,
            "processed_at": payout.processed_at,
        }

    @staticmethod
    def list_consultant_payouts(
        db: Session,
        consultant_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[dict]:
        """Lists all payout requests for a consultant ordered newest first."""
        items = db.query(PayoutRequest).filter(
            PayoutRequest.consultant_id == consultant_id
        ).order_by(PayoutRequest.requested_at.desc()).offset(offset).limit(limit).all()

        return [WalletService.format_payout_out(p) for p in items]

    @staticmethod
    def cancel_payout_request(
        db: Session,
        consultant_id: uuid.UUID,
        payout_id: uuid.UUID
    ) -> dict:
        """Cancels a pending payout request."""
        payout = db.query(PayoutRequest).filter(
            PayoutRequest.id == payout_id,
            PayoutRequest.consultant_id == consultant_id
        ).first()
        if not payout:
            raise ValueError("طلب السحب غير موجود")

        if payout.status != PayoutStatus.pending:
            raise ValueError("لا يمكن إلغاء الطلب بعد مراجعته أو تحويله")

        payout.status = PayoutStatus.cancelled
        db.commit()
        db.refresh(payout)
        return WalletService.format_payout_out(payout)

    @staticmethod
    def admin_list_payouts(
        db: Session,
        status: Optional[PayoutStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[dict]:
        """Admin view: Lists all payout requests across all consultants."""
        query = db.query(PayoutRequest)
        if status:
            query = query.filter(PayoutRequest.status == status)

        items = query.order_by(PayoutRequest.requested_at.desc()).offset(offset).limit(limit).all()
        return [WalletService.format_payout_out(p) for p in items]

    @staticmethod
    def admin_process_payout(
        db: Session,
        payout_id: uuid.UUID,
        admin_user: User,
        action: str,
        transfer_reference: Optional[str] = None,
        receipt_url: Optional[str] = None,
        admin_notes: Optional[str] = None
    ) -> dict:
        """
        Processes a payout request:
        - 'approve': Marks as approved (ready for bank wire).
        - 'transfer': Marks as transferred and records transfer reference/receipt.
        - 'reject': Rejects request with mandatory explanation note.
        Dispatches in-app notification to the consultant.
        """
        payout = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
        if not payout:
            raise ValueError("طلب السحب غير موجود")

        if payout.status in [PayoutStatus.transferred, PayoutStatus.cancelled]:
            raise ValueError("لا يمكن تعديل طلب تم تحويله أو إلغاؤه بالفعل")

        now_utc = datetime.now(timezone.utc)

        if action == "approve":
            payout.status = PayoutStatus.approved
            notif_msg = f"تمت الموافقة على طلب سحب الأرباح بقيمة {payout.amount} {payout.currency} وجاري تجهيز التحويل البنكي."
        elif action == "transfer":
            if not transfer_reference and not receipt_url:
                raise ValueError("يجب إدخال رقم الحوالة أو رابط إيصال التحويل لإتمام العملية")
            payout.status = PayoutStatus.transferred
            payout.transfer_reference = transfer_reference
            payout.receipt_url = receipt_url
            notif_msg = f"تم تحويل مبلغ {payout.amount} {payout.currency} بنجاح إلى حسابك البنكي. رقم الحوالة: {transfer_reference or 'مرفق بالإيصال'}."
        elif action == "reject":
            if not admin_notes or not admin_notes.strip():
                raise ValueError("يجب كتابة سبب الرفض لتوضيحه للمستشار")
            payout.status = PayoutStatus.rejected
            payout.admin_notes = admin_notes
            notif_msg = f"تم رفض طلب سحب الأرباح بقيمة {payout.amount} {payout.currency}. السبب: {admin_notes}"
        else:
            raise ValueError(f"إجراء غير معروف: {action}")

        payout.admin_notes = admin_notes or payout.admin_notes
        payout.processed_by = admin_user.id
        payout.processed_at = now_utc

        # Send in-app notification and live WebSocket update to consultant
        if payout.consultant and payout.consultant.user:
            notif = Notification(
                id=uuid.uuid4(),
                user_id=payout.consultant.user.id,
                title="تحديث حالة طلب سحب الأرباح",
                message=notif_msg,
                type=NotificationType.payout_status_updated,
                is_read=False,
                created_at=now_utc
            )
            db.add(notif)

            # Live WebSocket Push (Phase 3)
            try:
                from services.live_notification_service import LiveNotificationService
                LiveNotificationService.push_payout_update(
                    consultant_user_id=payout.consultant.user.id,
                    payout_id=payout.id,
                    status=payout.status.value if hasattr(payout.status, "value") else str(payout.status),
                    amount=payout.amount,
                    currency=payout.currency,
                    message=notif_msg
                )
            except Exception:
                pass

        db.commit()
        db.refresh(payout)
        return WalletService.format_payout_out(payout)


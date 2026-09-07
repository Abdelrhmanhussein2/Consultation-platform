import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from models import Invoice, User, InvoiceStatus
from helpers.enums import InvoiceType
from services.invoice_service_utils import generate_invoice_number, generate_payment_reference_number


class InvoiceService:

    @staticmethod
    def get_user_invoices(
        db: Session,
        user_id: uuid.UUID,
        status: InvoiceStatus | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> list[Invoice]:
        """
        Retrieves paginated invoices issued to a specific user, newest first.
        """
        query = db.query(Invoice).filter(Invoice.issued_to_user_id == user_id)
        if status is not None:
            query = query.filter(Invoice.status == status)

        offset = (page - 1) * limit
        return query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_all_invoices(
        db: Session,
        page: int = 1,
        limit: int = 50,
    ) -> list[Invoice]:
        """
        Retrieves all invoices for admin.
        """
        offset = (page - 1) * limit
        return db.query(Invoice).order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_invoice_by_id(
        db: Session,
        user_id: uuid.UUID,
        invoice_id: uuid.UUID,
        is_admin: bool = False,
    ) -> Invoice:
        """
        Retrieves a single invoice by ID. Regular users can only access their own invoices.
        """
        query = db.query(Invoice).filter(Invoice.id == invoice_id)
        if not is_admin:
            query = query.filter(Invoice.issued_to_user_id == user_id)

        invoice = query.first()
        if not invoice:
            raise ValueError("الفاتورة غير موجودة أو ليس لديك صلاحية للوصول إليها")
        return invoice

    @staticmethod
    def create_invoice(db: Session, data: dict) -> Invoice:
        """
        Creates a new invoice and generates invoice_number and reference_number via PostgreSQL sequences.
        """
        if not data.get("type"):
            data["type"] = InvoiceType.client_invoice

        # Use PostgreSQL sequence if missing, placeholder, random pattern, or marked auto-generate
        inv_no_str = str(data.get("invoice_number") or "").strip()
        if not inv_no_str or inv_no_str == "(توليد تلقائي متسلسل)" or inv_no_str.startswith("INV-2026-"):
            data["invoice_number"] = generate_invoice_number(db)

        ref_no_str = str(data.get("reference_number") or "").strip()
        if not ref_no_str or ref_no_str == "(توليد تلقائي متسلسل)" or ref_no_str.startswith("TX-2026-"):
            data["reference_number"] = generate_payment_reference_number(db)

        # Parse string dates if provided
        for date_field in ["issued_at", "due_date", "paid_at", "recurring_start_date", "recurring_next_date"]:
            if date_field in data and isinstance(data[date_field], str):
                try:
                    val = data[date_field]
                    if len(val) == 10:
                        data[date_field] = datetime.strptime(val, "%Y-%m-%d")
                    else:
                        data[date_field] = datetime.fromisoformat(val)
                except Exception:
                    data[date_field] = None

        invoice = Invoice(**data)
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_next_number(db: Session) -> dict:
        year = datetime.now().year
        
        # Calculate next invoice number from DB sequence & MAX DB invoice_number
        try:
            seq_val = db.execute(text("SELECT last_value FROM invoice_number_seq")).scalar()
            max_db = db.execute(text("SELECT MAX(CAST(SUBSTRING(invoice_number FROM '(\\d+)$') AS INTEGER)) FROM invoices WHERE invoice_number LIKE 'INV-%'")).scalar()
            next_seq = max(int(seq_val or 1), int(max_db or 0) + 1)
        except Exception:
            next_seq = 1

        # Calculate next payment reference number from DB sequence & MAX DB reference_number
        try:
            ref_val = db.execute(text("SELECT last_value FROM payment_reference_seq")).scalar()
            max_ref = db.execute(text("SELECT MAX(CAST(SUBSTRING(reference_number FROM '(\\d+)$') AS INTEGER)) FROM invoices WHERE reference_number LIKE 'TX-%'")).scalar()
            next_ref = max(int(ref_val or 1), int(max_ref or 0) + 1)
        except Exception:
            next_ref = next_seq

        return {
            "next_invoice_number": f"INV-{year}-{next_seq:06d}",
            "next_reference_number": f"TX-{year}-{next_ref:06d}"
        }

    @staticmethod
    def search_customers(db: Session, q: str = "") -> list[dict]:
        query = db.query(User)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                (User.full_name.ilike(term)) |
                (User.company_name.ilike(term)) |
                (User.email.ilike(term)) |
                (User.phone.ilike(term)) |
                (User.tax_number.ilike(term))
            )
        users = query.limit(30).all()
        results = []
        for u in users:
            name = u.company_name or u.full_name or u.email
            tax = u.tax_number or ""
            address = u.address or "عمّان - الأردن"
            entity = u.entity_type.value if hasattr(u.entity_type, 'value') else (str(u.entity_type) if u.entity_type else "أفراد")
            results.append({
                "id": str(u.id),
                "name": name,
                "type": entity,
                "tax": tax,
                "address": address,
                "email": u.email or "",
                "phone": u.phone or "",
            })
        return results

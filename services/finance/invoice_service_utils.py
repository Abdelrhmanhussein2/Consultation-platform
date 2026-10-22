import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

def generate_invoice_number(db: Session) -> str:
    """
    Generates a thread-safe invoice number using PostgreSQL nextval('invoice_number_seq').
    Format: INV-{YEAR}-{SEQUENCE:06d} (e.g. INV-2026-000001)
    """
    year = datetime.datetime.now().year
    try:
        seq_val = db.execute(text("SELECT nextval('invoice_number_seq')")).scalar()
        max_db = db.execute(text("SELECT MAX(CAST(SUBSTRING(invoice_number FROM '(\\d+)$') AS INTEGER)) FROM invoices WHERE invoice_number LIKE 'INV-%'")).scalar()
        if max_db and int(seq_val) <= int(max_db):
            seq_val = int(max_db) + 1
            db.execute(text(f"SELECT setval('invoice_number_seq', {seq_val})"))
    except Exception:
        seq_val = 1
    return f"INV-{year}-{int(seq_val):06d}"

def generate_payment_reference_number(db: Session) -> str:
    """
    Generates a thread-safe payment reference number using PostgreSQL nextval('payment_reference_seq').
    Format: TX-{YEAR}-{SEQUENCE:06d} (e.g. TX-2026-000001)
    """
    year = datetime.datetime.now().year
    try:
        seq_val = db.execute(text("SELECT nextval('payment_reference_seq')")).scalar()
        max_db = db.execute(text("SELECT MAX(CAST(SUBSTRING(reference_number FROM '(\\d+)$') AS INTEGER)) FROM invoices WHERE reference_number LIKE 'TX-%'")).scalar()
        if max_db and int(seq_val) <= int(max_db):
            seq_val = int(max_db) + 1
            db.execute(text(f"SELECT setval('payment_reference_seq', {seq_val})"))
    except Exception:
        seq_val = 1
    return f"TX-{year}-{int(seq_val):06d}"

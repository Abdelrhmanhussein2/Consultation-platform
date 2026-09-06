import sys
sys.path.append(".")
from helpers.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    invs = db.execute(text("SELECT id, invoice_number, reference_number FROM invoices ORDER BY created_at DESC LIMIT 10")).fetchall()
    print("Recent Invoices:", invs)
except Exception as e:
    print("Error querying invoices:", e)

try:
    seq_inv = db.execute(text("SELECT last_value FROM invoice_number_seq")).scalar()
    print("invoice_number_seq last_value:", seq_inv)
except Exception as e:
    print("Error querying invoice_number_seq:", e)

try:
    seq_tx = db.execute(text("SELECT last_value FROM payment_reference_seq")).scalar()
    print("payment_reference_seq last_value:", seq_tx)
except Exception as e:
    print("Error querying payment_reference_seq:", e)

db.close()

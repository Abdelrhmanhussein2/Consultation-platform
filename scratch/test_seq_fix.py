import sys
sys.path.append(".")
from helpers.database import SessionLocal
from services import InvoiceService

db = SessionLocal()
res = InvoiceService.get_next_number(db)
print("Updated get_next_number response:", res)
db.close()

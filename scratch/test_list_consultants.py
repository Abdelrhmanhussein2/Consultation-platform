import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from services.services import ConsultantService

db = SessionLocal()
results = ConsultantService.list_consultants(db)
print(f"Total returned from list_consultants: {len(results)}")
for r in results:
    print(f"  Name: {r.get('full_name')} | City: '{r.get('city')}' | Address in User: '{r.get('city')}'")
db.close()

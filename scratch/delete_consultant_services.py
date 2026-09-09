import sys
import os

# Add current workspace to path
sys.path.insert(0, os.path.abspath('.'))

from helpers.database import SessionLocal
from models import ConsultantService, Appointment

db = SessionLocal()
try:
    services = db.query(ConsultantService).all()
    print(f"Found {len(services)} services in consultant_services:")
    for s in services:
        print(f" - ID: {s.id}, Name: {s.name}, Price: {s.price}, Duration: {s.duration_minutes}, Consultant ID: {s.consultant_id}")

    # Nullify service_id on appointments if any exist before deleting services to avoid FK constraint issues
    appts = db.query(Appointment).filter(Appointment.service_id.isnot(None)).all()
    if appts:
        print(f"Unlinking {len(appts)} appointments from services...")
        for a in appts:
            a.service_id = None
        db.commit()

    deleted_count = db.query(ConsultantService).delete()
    db.commit()
    print(f"Successfully deleted {deleted_count} services from database.")
except Exception as e:
    db.rollback()
    print("Error deleting services:", e)
finally:
    db.close()

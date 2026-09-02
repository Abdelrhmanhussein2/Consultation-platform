import sys
import os

sys.path.append(os.path.abspath("e:/Consultation-platform"))

from helpers.database import SessionLocal
from models.consultant_service import ConsultantService

db = SessionLocal()
try:
    services = db.query(ConsultantService).filter(ConsultantService.duration_minutes == 45).all()
    print(f"Found {len(services)} services with 45 minutes duration.")
    for s in services:
        s.duration_minutes = 60
        print(f"Updated service ID {s.id} to 60 minutes.")
    db.commit()
    print("Database updated successfully!")
except Exception as e:
    db.rollback()
    print(f"Error updating database: {e}")
finally:
    db.close()

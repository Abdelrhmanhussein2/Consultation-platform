import sys
import os

sys.path.append(os.path.abspath("e:/Consultation-platform"))

from helpers.database import SessionLocal
from models.consultant_profile import ConsultantProfile
from models.consultant_service import ConsultantService

db = SessionLocal()
try:
    profiles = db.query(ConsultantProfile).all()
    print(f"Updating {len(profiles)} consultant profiles price_per_hour to 30.0...")
    for p in profiles:
        p.price_per_hour = 30.0
    
    services = db.query(ConsultantService).all()
    for s in services:
        s.price = 30.0

    db.commit()
    print("Database price_per_hour updated successfully to 30.0!")
except Exception as e:
    db.rollback()
    print(f"Error updating prices in database: {e}")
finally:
    db.close()

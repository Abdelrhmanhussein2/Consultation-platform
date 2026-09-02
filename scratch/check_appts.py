import sys
import os

sys.path.append(os.path.abspath("e:/Consultation-platform"))

from helpers.database import SessionLocal
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment

db = SessionLocal()
try:
    consultants = db.query(ConsultantProfile).all()
    print("=== CONSULTANT PROFILES IN DB ===")
    for c in consultants:
        u = db.query(User).filter(User.id == c.user_id).first()
        print(f"Profile ID: {c.id} | User ID: {c.user_id} | Email: {u.email if u else 'N/A'}")
    
    appts = db.query(Appointment).all()
    print(f"\n=== ALL APPOINTMENTS IN DB ({len(appts)}) ===")
    for a in appts:
        print(f"Appt ID: {a.id} | Consultant ID: {a.consultant_id} | User ID: {a.user_id} | Status: {a.status} | Scheduled: {a.scheduled_at}")
finally:
    db.close()

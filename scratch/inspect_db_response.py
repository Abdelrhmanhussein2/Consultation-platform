import sys
import os

sys.path.append(os.path.abspath("e:/Consultation-platform"))

from helpers.database import SessionLocal
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.appointment import Appointment
from controllers.controllers import AppointmentController

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'abdelrhmanhussein886@gmail.com').first()
    print(f"Logged in User Role: {user.role} | ID: {user.id}")
    
    profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
    print(f"Consultant Profile ID: {profile.id if profile else 'NO PROFILE'}")

    res = AppointmentController.get_my_appointments(db, user, page=1, limit=20)
    print(f"\nTotal appointments returned by get_my_appointments: {len(res)}")
    for idx, appt in enumerate(res, 1):
        print(f"\n--- Appointment #{idx} ---")
        print(f"ID: {appt.id}")
        print(f"Consultant ID: {appt.consultant_id}")
        print(f"User ID: {appt.user_id}")
        print(f"Status: {appt.status.value if hasattr(appt.status, 'value') else appt.status}")
        print(f"Scheduled At: {appt.scheduled_at}")
        print(f"Price: {appt.price}")
finally:
    db.close()

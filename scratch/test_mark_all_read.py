import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from services.notification_service import NotificationService

db = SessionLocal()
consultant = db.query(User).filter(User.email == 'consultant2@platform.com').first()
print(f"Consultant: {consultant.id}")

try:
    updated = NotificationService.mark_all_as_read(db, consultant.id)
    print(f"Mark all read result: {updated}")
except Exception as e:
    print(f"ERROR: {e}")

db.close()

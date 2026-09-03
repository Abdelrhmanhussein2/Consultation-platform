import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.notification import Notification
from models.user import User
from helpers.enums import UserRole

db = SessionLocal()

notifs = db.query(Notification).all()
deleted = 0
for n in notifs:
    u = db.query(User).filter(User.id == n.user_id).first()
    if u and u.role not in [UserRole.admin, UserRole.super_admin] and 'بانتظار الموافقة' in (n.title or ''):
        db.delete(n)
        deleted += 1

db.commit()
print(f"Deleted {deleted} misplaced notifications from DB")
db.close()

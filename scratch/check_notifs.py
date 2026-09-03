import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.notification import Notification
from models.user import User

db = SessionLocal()
notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(15).all()

for n in notifs:
    u = db.query(User).filter(User.id == n.user_id).first()
    print(f"Notif ID: {n.id} | User: {u.full_name if u else 'N/A'} ({u.email if u else 'N/A'}, Role: {u.role if u else 'N/A'}) | Title: {n.title} | Msg: {n.message}")

db.close()

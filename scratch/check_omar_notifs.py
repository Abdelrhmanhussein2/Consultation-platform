import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.notification import Notification

db = SessionLocal()
omar = db.query(User).filter(User.email == 'omar@haddad.io').first()

if omar:
    print(f"Omar ID: {omar.id}, Role: {omar.role}")
    notifs = db.query(Notification).filter(Notification.user_id == omar.id).all()
    for n in notifs:
        print(f"ID: {n.id} | Title: {n.title} | Msg: {n.message}")
else:
    print("Omar not found")

db.close()

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.notification import Notification

db = SessionLocal()
notifs = db.query(Notification).all()

for n in notifs:
    # Remove emoji characters
    clean_title = n.title.replace('🎉', '').replace('🔔', '').replace('⚠️', '').replace('⚡', '').replace('⏳', '').strip()
    clean_msg = n.message.replace('🎉', '').replace('🔔', '').replace('⚠️', '').replace('⚡', '').replace('⏳', '').strip()
    n.title = clean_title
    n.message = clean_msg

db.commit()
print(f"Cleaned emojis from {len(notifs)} notifications in DB!")
db.close()

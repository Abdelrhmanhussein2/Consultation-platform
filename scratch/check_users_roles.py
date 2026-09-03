import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"User: {u.full_name} | Email: {u.email} | Role: {u.role} (type: {type(u.role)})")
db.close()

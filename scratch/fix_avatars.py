"""
Fix script: clear avatar_url for users whose avatar file is missing from disk.
Also checks and reports the state of all avatars.
"""
import os, sys
sys.path.insert(0, '/mnt/d/Work/Consultation-platform')
os.chdir('/mnt/d/Work/Consultation-platform')

from helpers.database import SessionLocal
from models import User

db = SessionLocal()
users = db.query(User).filter(User.avatar_url != None).all()

fixed = 0
for u in users:
    file_path = u.avatar_url.lstrip('/')
    # Check both relative and absolute path
    abs_path = os.path.join('/mnt/d/Work/Consultation-platform', file_path)
    exists = os.path.exists(file_path) or os.path.exists(abs_path)
    if not exists:
        print(f"FIXING: {u.email} → clearing broken avatar_url: {u.avatar_url}")
        u.avatar_url = None
        fixed += 1
    else:
        print(f"OK: {u.email} → {u.avatar_url}")

if fixed > 0:
    db.commit()
    print(f"\nFixed {fixed} broken avatar URL(s).")
else:
    print("\nAll avatar URLs are valid. No fixes needed.")

db.close()

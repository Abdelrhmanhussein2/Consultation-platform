import os, sys
sys.path.insert(0, '/mnt/d/Work/Consultation-platform')
os.chdir('/mnt/d/Work/Consultation-platform')

from helpers.database import SessionLocal
from models import User

db = SessionLocal()
users = db.query(User).filter(User.avatar_url != None).all()
print(f"Found {len(users)} users with avatar_url:")
for u in users:
    file_path = u.avatar_url.lstrip('/')
    exists = os.path.exists(file_path)
    print(f"  Email: {u.email}")
    print(f"  Name: {u.full_name}")
    print(f"  DB avatar_url: {u.avatar_url}")
    print(f"  File exists on disk: {exists}")
    print()
db.close()

# Also list all files in static/avatars
print("Files in static/avatars/:")
avatars_dir = 'static/avatars'
if os.path.exists(avatars_dir):
    for f in os.listdir(avatars_dir):
        print(f"  {f}")
else:
    print("  Directory does not exist!")

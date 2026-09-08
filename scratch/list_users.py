import sys, os
sys.path.insert(0, os.path.abspath('.'))
from helpers.database import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f'Total Users: {len(users)}')
for u in users:
    print(f'User: id={u.id}, name={u.full_name}, email={u.email}, role={u.role.value if hasattr(u.role, "value") else u.role}')
db.close()

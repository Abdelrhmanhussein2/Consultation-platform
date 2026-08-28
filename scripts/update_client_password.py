import os
import sys

# Append the project root directory to sys.path to resolve relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from services.auth_utils import hash_password

def update_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "client1@platform.com").first()
        if user:
            user.password_hash = hash_password("Password123!")
            db.commit()
            print("SUCCESS: Updated client1@platform.com password to Password123!")
        else:
            print("ERROR: User client1@platform.com not found.")
    finally:
        db.close()

if __name__ == "__main__":
    update_password()

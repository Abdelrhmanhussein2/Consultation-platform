import sys
import os

try:
    import main
    print("✓ main imported successfully")
except Exception as e:
    print("❌ Error importing main:", e)
    import traceback
    traceback.print_exc()

try:
    from helpers.database import SessionLocal
    from models.user import User
    from services.auth_service import AuthService
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'consultant2@platform.com').first()
    if user:
        print(f"✓ Found user: {user.email} (role: {user.role})")
    else:
        print("❌ User consultant2@platform.com not found in DB")
    db.close()
except Exception as e:
    print("❌ DB check error:", e)
    import traceback
    traceback.print_exc()

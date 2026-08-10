import os
import sys

# Append the project root directory to sys.path to resolve relative helper and model imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from helpers.config import settings
from helpers.enums import UserRole
from models import User, Specialization
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import importlib.util
spec = importlib.util.spec_from_file_location("auth_utils", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "auth_utils.py"))
_auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_auth)
hash_password = _auth.hash_password

def seed_super_admin():
    """
    Checks if a super admin already exists. If not, seeds a super admin user using configuration.
    Also seeds default specializations if they are empty.
    """
    db = SessionLocal()
    try:
        # 1. Seed Default Specializations
        if db.query(Specialization).count() == 0:
            default_specs = [
                Specialization(id=1, name="Legal", description="Legal & Corporate Consultations"),
                Specialization(id=2, name="Finance", description="Financial & Investment Planning"),
                Specialization(id=3, name="Business", description="Business Development & Marketing"),
                Specialization(id=4, name="Tech", description="Software & IT Architecture")
            ]
            db.add_all(default_specs)
            db.commit()
            print("INFO: Seeded default specializations (Legal, Finance, Business, Tech)")

        # 2. Seed Super Admin
        email = settings.SUPER_ADMIN_EMAIL
        password = settings.SUPER_ADMIN_PASSWORD
        full_name = settings.SUPER_ADMIN_FULL_NAME
        
        if not email or not password:
            print("ERROR: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured.")
            return
            
        # Check if any super admin exists in DB
        existing_admin = db.query(User).filter(User.role == UserRole.super_admin).first()
        if existing_admin:
            print(f"Super Admin already exists in database: {existing_admin.email}")
            return
            
        # Verify the target email is not used by a regular user or consultant
        email_taken = db.query(User).filter(User.email == email).first()
        if email_taken:
            print(f"ERROR: Email {email} is registered under another role: {email_taken.role}")
            return
            
        # Seed the super admin
        hashed_pw = hash_password(password)
        super_admin = User(
            full_name=full_name,
            email=email,
            password_hash=hashed_pw,
            role=UserRole.super_admin,
            is_active=True
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        print("--------------------------------------------------")
        print("SUCCESS: Super Admin has been seeded successfully!")
        print(f"Full Name: {super_admin.full_name}")
        print(f"Email:     {super_admin.email}")
        print("--------------------------------------------------")
    except Exception as e:
        print(f"CRITICAL ERROR seeding super admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_admin()

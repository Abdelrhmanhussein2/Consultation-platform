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
        # 1. Seed/Update Default Specializations
        default_specs_data = [
            {"name": "ضريبة القيمة المضافة (VAT)", "description": "استشارات ضريبة القيمة المضافة والامتثال والتقارير"},
            {"name": "ضريبة الدخل والمبيعات", "description": "استشارات ضريبة الدخل والامتثال القانوني للأفراد والشركات"},
            {"name": "التخطيط والامتثال الضريبي", "description": "التخطيط الضريبي الاستراتيجي وتخفيف المخاطر"},
            {"name": "الاستشارات النزاعية والاعتراضات", "description": "تمثيل مكلفي الضرائب والاعتراضات أمام اللجان الضريبية"}
        ]
        
        existing_specs = db.query(Specialization).all()
        existing_by_name = {spec.name: spec for spec in existing_specs}
        
        target_names = [d["name"] for d in default_specs_data]
        needed_names = [name for name in target_names if name not in existing_by_name]
        obsolete_specs = [spec for spec in existing_specs if spec.name not in target_names]
        
        # Rename obsolete items to avoid unique constraint issues and preserve foreign keys
        for spec in obsolete_specs:
            if needed_names:
                new_name = needed_names.pop(0)
                desc = next(d["description"] for d in default_specs_data if d["name"] == new_name)
                print(f"INFO: Renaming specialization '{spec.name}' (ID {spec.id}) to '{new_name}'")
                spec.name = new_name
                spec.description = desc
            else:
                # Keep other specializations if they exist and are not in default list
                pass
                
        # Create remaining needed ones if any
        for new_name in needed_names:
            desc = next(d["description"] for d in default_specs_data if d["name"] == new_name)
            new_spec = Specialization(name=new_name, description=desc)
            db.add(new_spec)
            print(f"INFO: Created new specialization: '{new_name}'")
            
        db.commit()
        print("INFO: Seeded/Updated default specializations (VAT, Income Tax, Tax Planning, Dispute resolution)")

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

import os
import sys

# Append the project root directory to sys.path to resolve relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from helpers.enums import UserRole, VerificationStatus
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.specialization import Specialization

import importlib.util
spec = importlib.util.spec_from_file_location(
    "auth_utils",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "auth_utils.py")
)
_auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_auth)
hash_password = _auth.hash_password

def seed_consultant():
    db = SessionLocal()
    try:
        # Check if the specialization exists, otherwise get the first one or seed
        tech_spec = db.query(Specialization).filter(Specialization.id == 4).first()
        if not tech_spec:
            tech_spec = db.query(Specialization).first()
        
        specialization_id = tech_spec.id if tech_spec else None
        
        email = "consultant@platform.com"
        password = "Password123!"
        full_name = "مستشار تجريبي"
        
        # Check if consultant already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"INFO: Consultant user already exists with email: {email}")
            # Ensure the role is consultant and they have a profile
            if existing_user.role != UserRole.consultant:
                existing_user.role = UserRole.consultant
                db.commit()
                print(f"INFO: Updated role of existing user to consultant")
            
            existing_profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == existing_user.id).first()
            if not existing_profile:
                new_profile = ConsultantProfile(
                    user_id=existing_user.id,
                    bio="مستشار تقني تجريبي لتقديم الاستشارات البرمجية والتقنية.",
                    main_specialization_id=specialization_id,
                    verification_status=VerificationStatus.approved,
                    years_of_experience=10,
                    activity_type="مستشار مستقل"
                )
                db.add(new_profile)
                db.commit()
                print("INFO: Created missing consultant profile for the existing user.")
            else:
                existing_profile.verification_status = VerificationStatus.approved
                db.commit()
                print("INFO: Consultant profile verified successfully.")
            return

        # Seed the consultant User
        hashed_pw = hash_password(password)
        consultant_user = User(
            full_name=full_name,
            email=email,
            phone="+966500000000",
            password_hash=hashed_pw,
            role=UserRole.consultant,
            verification_status=VerificationStatus.approved,
            is_active=True,
            language="ar"
        )
        db.add(consultant_user)
        db.commit()
        db.refresh(consultant_user)
        
        # Seed the Consultant Profile
        consultant_profile = ConsultantProfile(
            user_id=consultant_user.id,
            bio="مستشار تقني تجريبي لتقديم الاستشارات البرمجية والتقنية.",
            main_specialization_id=specialization_id,
            verification_status=VerificationStatus.approved,
            years_of_experience=10,
            activity_type="مستشار مستقل"
        )
        db.add(consultant_profile)
        db.commit()
        
        print("--------------------------------------------------")
        print("SUCCESS: Consultant account has been seeded successfully!")
        print(f"Full Name: {consultant_user.full_name}")
        print(f"Email:     {consultant_user.email}")
        print(f"Password:  {password}")
        print(f"Role:      {consultant_user.role}")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"CRITICAL ERROR seeding consultant: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_consultant()

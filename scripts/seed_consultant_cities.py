import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.consultant_profile import ConsultantProfile
from models.user import User

def update_cities():
    db = SessionLocal()
    try:
        profiles = db.query(ConsultantProfile).all()
        print(f"Found {len(profiles)} profiles.")

        cities = ["عمّان", "الزرقاء", "إربد", "العقبة", "مادبا"]

        for idx, p in enumerate(profiles):
            city_name = cities[idx % len(cities)]
            if p.user:
                p.user.address = city_name
                print(f"Updated user {p.user.full_name}: city = {city_name}")

        db.commit()
        print("\nSUCCESS: All consultant cities updated successfully in DB!")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    update_cities()

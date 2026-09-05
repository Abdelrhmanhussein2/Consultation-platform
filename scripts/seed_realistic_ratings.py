import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.consultant_profile import ConsultantProfile

def update_ratings():
    db = SessionLocal()
    try:
        profiles = db.query(ConsultantProfile).all()
        print(f"Found {len(profiles)} profiles.")
        
        # Realistic sample rating values to distribute among consultants
        sample_ratings = [
            (Decimal("4.90"), 28),
            (Decimal("4.80"), 15),
            (Decimal("4.75"), 22),
            (Decimal("5.00"), 9),
            (Decimal("4.60"), 11),
            (Decimal("4.85"), 34),
            (Decimal("4.95"), 40),
        ]

        for idx, p in enumerate(profiles):
            rating_val, rating_count = sample_ratings[idx % len(sample_ratings)]
            p.average_rating = rating_val
            p.ratings_count = rating_count
            name = p.user.full_name if p.user else str(p.id)
            print(f"Updated {name}: rating = {rating_val}, count = {rating_count}")

        db.commit()
        print("\nSUCCESS: All consultant ratings updated successfully with realistic DB data!")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    update_ratings()

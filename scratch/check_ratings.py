import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models import ConsultantProfile, Rating

db = SessionLocal()
profiles = db.query(ConsultantProfile).all()
print(f"FOUND PROFILES: {len(profiles)}")
for p in profiles:
    name = p.user.full_name if p.user else 'No Name'
    print(f"ID={p.id} | Name={name} | avg_rating={p.average_rating} ({type(p.average_rating)}) | count={p.ratings_count}")

ratings = db.query(Rating).all()
print(f"\nTOTAL RATINGS: {len(ratings)}")
for r in ratings:
    print(f"Rating ID={r.id} | ConsultantID={r.consultant_id} | Stars={r.stars} | Status={r.status}")

db.close()

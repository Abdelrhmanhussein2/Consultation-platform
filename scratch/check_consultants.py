import sys
sys.path.insert(0, '/mnt/d/Work/Consultation-platform')

from helpers.database import SessionLocal
from models import ConsultantProfile
from helpers.enums import VerificationStatus

db = SessionLocal()
profiles = db.query(ConsultantProfile).all()
print("Total profiles:", len(profiles))
for p in profiles:
    approved = "(APPROVED)" if p.verification_status == VerificationStatus.approved else f"({p.verification_status})"
    name = p.user.full_name if p.user else "NO USER"
    price = p.price_per_hour
    spec = p.main_specialization_id
    print(f"  {approved} name={name}, price={price}, spec_id={spec}, id={p.id}")

approved_count = db.query(ConsultantProfile).filter(
    ConsultantProfile.verification_status == VerificationStatus.approved
).count()
print(f"\nApproved consultants: {approved_count}")
db.close()

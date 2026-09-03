import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.subscription_request import SubscriptionRequest

db = SessionLocal()

# Delete test duplicate requests created during testing
db.query(SubscriptionRequest).filter(SubscriptionRequest.request_no.in_(['REQ-2026-0012', 'REQ-2026-0013', 'REQ-2026-0014', 'REQ-2026-0015'])).delete(synchronize_session=False)
db.commit()
print("Cleaned up duplicate test requests!")
db.close()

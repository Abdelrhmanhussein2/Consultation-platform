import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.subscription_plan import SubscriptionPlan

db = SessionLocal()
plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == 'احترافية').first()
plan.is_active = True
db.commit()
print("Reset احترافية is_active to True")
db.close()

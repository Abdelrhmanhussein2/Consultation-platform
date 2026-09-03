import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.subscription_plan import SubscriptionPlan
from controllers.subscription_controller import SubscriptionController

db = SessionLocal()
plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == 'احترافية').first()
print(f"Plan: {plan.name}, is_active initially: {plan.is_active}")

# Toggle active
new_status = SubscriptionController.toggle_plan_active(db, str(plan.id))
print(f"Plan: {plan.name}, is_active after first toggle: {new_status}")

# Toggle back on
new_status2 = SubscriptionController.toggle_plan_active(db, str(plan.id))
print(f"Plan: {plan.name}, is_active after second toggle: {new_status2}")

db.close()

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.subscription_plan import SubscriptionPlan
from controllers.subscription_controller import SubscriptionController
from helpers.enums import UserRole
from fastapi import HTTPException

db = SessionLocal()
client = db.query(User).filter(User.role == UserRole.user).first()
plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == 'احترافية').first()

print(f"1. Submitting first request for plan: {plan.name}")
res1 = SubscriptionController.submit_subscription_request(
    db=db,
    user_id=client.id,
    plan_id=str(plan.id),
    cycle="شهري",
    payment_method="بطاقة بنكية",
    notes="طلب أول"
)
print("First request submitted:", res1)

print(f"2. Attempting duplicate second request for SAME plan: {plan.name}")
try:
    res2 = SubscriptionController.submit_subscription_request(
        db=db,
        user_id=client.id,
        plan_id=str(plan.id),
        cycle="شهري",
        payment_method="بطاقة بنكية",
        notes="محاولة تكرار"
    )
    print("Error: duplicate was unexpectedly accepted!", res2)
except HTTPException as he:
    print(f"SUCCESS: Duplicate blocked properly! Status: {he.status_code}, Detail: {he.detail}")

# Check my_subscription pending list
my_sub = SubscriptionController.get_my_subscription(db, client.id)
print(f"User pending plans list: {my_sub.get('pending_plan_names')}")

db.close()

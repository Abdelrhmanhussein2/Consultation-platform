import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.subscription_plan import SubscriptionPlan
from controllers.subscription_controller import SubscriptionController
from helpers.enums import UserRole

db = SessionLocal()
client = db.query(User).filter(User.role == UserRole.user).first()
plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == 'أساسية').first()

print(f"Testing subscription request for plan: {plan.name} (id: {plan.id})")

res = SubscriptionController.submit_subscription_request(
    db=db,
    user_id=client.id,
    plan_id=str(plan.id),
    cycle="شهري",
    payment_method="بطاقة بنكية / فيزا / ماستركارد",
    notes="طلب اشتراك تجريبي للتأكد من حل الخطأ"
)

print(f"Result: {res}")
db.close()

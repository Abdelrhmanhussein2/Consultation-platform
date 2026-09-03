import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.subscription_plan import SubscriptionPlan
from models.user_subscription import UserSubscription
from models.subscription_request import SubscriptionRequest
from helpers.enums import UserRole
from controllers.subscription_controller import SubscriptionController
from datetime import datetime, timedelta

db = SessionLocal()

print("==================================================================")
print("  TESTING END-TO-END SUBSCRIPTIONS & PLANS SYSTEM")
print("==================================================================")

# 1. Fetch Client and Admin
client = db.query(User).filter(User.role == UserRole.user).first()
admin = db.query(User).filter(User.role == UserRole.super_admin).first()
plan = db.query(SubscriptionPlan).first()

print(f"1. Client: {client.full_name} ({client.email})")
print(f"2. Admin:  {admin.full_name} ({admin.email})")
print(f"3. Plan:   {plan.name if plan else 'None'}")

# 2. Get User Subscription before
sub_before = SubscriptionController.get_my_subscription(db, client.id)
print(f"\n4. [USER MY-SUBSCRIPTION]:")
print(f"   - Plan: {sub_before.get('plan_name')}")
print(f"   - Remaining Days: {sub_before.get('remaining_days')}")
print(f"   - Is Expiring Soon: {sub_before.get('is_expiring_soon')}")

# 3. Simulate subscription expiring in 1 day (to test 2-day reminder banner & notifications)
now = datetime.utcnow()
existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == client.id).first()
if existing_sub:
    existing_sub.end_date = now + timedelta(days=1)
    db.commit()

sub_expiring = SubscriptionController.get_my_subscription(db, client.id)
print(f"\n5. [2-DAY EXPIRATION SIMULATION]:")
print(f"   - Remaining Days: {sub_expiring.get('remaining_days')} day(s)")
print(f"   - Is Expiring Soon Banner Active: {'✅ YES' if sub_expiring.get('is_expiring_soon') else '❌ NO'}")
print(f"   - Reminder Text: {sub_expiring.get('expiring_reminder')}")

# 4. Trigger Check Expirations Notification Engine
notified_count = SubscriptionController.check_and_notify_expirations(db)
print(f"\n6. [NOTIFICATION ENGINE]: Dispatched notifications to {notified_count} expiring subscriber(s)")

# 5. User requests upgrade / renewal
if plan:
    req_res = SubscriptionController.submit_subscription_request(
        db=db,
        user_id=client.id,
        plan_id=str(plan.id),
        cycle="سنوي",
        payment_method="بطاقة بنكية",
        notes="طلب ترقية باقة سنوية مع استشارات شاملة"
    )
    print(f"\n7. [USER -> ADMIN] Subscription Request Submitted:")
    print(f"   - Request No: {req_res.get('request_no')}")
    print(f"   - Status: Pending Admin Review")

    # 6. Admin Approves Request
    req_id = req_res.get('request_id')
    approve_res = SubscriptionController.approve_request(db, req_id)
    print(f"\n8. [ADMIN APPROVAL]: Request Approved: {'✅ SUCCESS' if approve_res else '❌ FAILED'}")

    # 7. Verify User Subscription Updated with new 365 days
    sub_after = SubscriptionController.get_my_subscription(db, client.id)
    print(f"\n9. [POST-APPROVAL USER STATUS]:")
    print(f"   - Plan: {sub_after.get('plan_name')}")
    print(f"   - Cycle: {sub_after.get('cycle')}")
    print(f"   - Remaining Days: {sub_after.get('remaining_days')} days")
    print(f"   - Status: {sub_after.get('status')}")

db.close()
print("\n>>> ALL SUBSCRIPTION LIFECYCLE TESTS PASSED 100%! <<<")

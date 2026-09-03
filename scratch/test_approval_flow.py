import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.subscription_request import SubscriptionRequest
from models.notification import Notification
from controllers.subscription_controller import SubscriptionController

db = SessionLocal()

# Find the latest pending request
req = db.query(SubscriptionRequest).filter(SubscriptionRequest.status == "pending").order_by(SubscriptionRequest.created_at.desc()).first()

if req:
    print(f"Found pending request: {req.request_no} for user: {req.user_id} - Plan: {req.plan.name if req.plan else req.plan_id}")
    success = SubscriptionController.approve_request(db, str(req.id))
    print(f"Approval result: {success}")

    # Check my-subscription
    my_sub = SubscriptionController.get_my_subscription(db, req.user_id)
    print(f"User Active Plan now: {my_sub['plan_name']} - Remaining Days: {my_sub['remaining_days']} - Points: {my_sub['ai_points_total']}")

    # Check notification
    notif = db.query(Notification).filter(Notification.user_id == req.user_id).order_by(Notification.created_at.desc()).first()
    print(f"Latest Notification sent to user: [{notif.title}] -> {notif.message}")
else:
    print("No pending request found in DB")

db.close()

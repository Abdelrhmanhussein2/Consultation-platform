import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.user_subscription import UserSubscription
from controllers.subscription_controller import SubscriptionController
from models.notification import Notification

db = SessionLocal()

# Find consultant (أ. عبدالرحمن حسين)
consultant = db.query(User).filter(User.email == 'consultant2@platform.com').first()
sub = db.query(UserSubscription).filter(UserSubscription.user_id == consultant.id).first()

print(f"Before upgrade: Plan ID: {sub.plan_id}, Points: {sub.points_total}")

# Upgrade to احترافية
success = SubscriptionController.change_subscriber_plan(
    db=db,
    sub_id=str(sub.id),
    target_plan_name='احترافية',
    mode='immediate'
)
print(f"Upgrade to احترافية success: {success}")

db.refresh(sub)
print(f"After upgrade: Plan: {sub.plan.name}, Points: {sub.points_total}, Consultations: {sub.consultations_total}, Downloads: {sub.downloads_total}")

# Check notification
notif = db.query(Notification).filter(Notification.user_id == consultant.id).order_by(Notification.created_at.desc()).first()
print(f"User Notification: Title: '{notif.title}', Msg: '{notif.message}'")

db.close()

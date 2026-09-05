import sys
import os

sys.path.insert(0, os.path.abspath("."))

from helpers.database import SessionLocal
from models import (
    User, ConsultantProfile, Specialization, Appointment,
    UserSubscription, SubscriptionPlan, Invoice, SupportTicket,
    AdminActionLog
)

db = SessionLocal()

users_count = db.query(User).count()
clients_count = db.query(User).filter(User.role == 'user').count()
consultants_count = db.query(User).filter(User.role.in_(['consultant', 'platform_consultant'])).count()
approved_consultants = db.query(ConsultantProfile).filter(ConsultantProfile.verification_status == 'approved').count()
pending_consultants = db.query(ConsultantProfile).filter(ConsultantProfile.verification_status == 'pending').count()
appointments_count = db.query(Appointment).count()
completed_appointments = db.query(Appointment).filter(Appointment.status == 'completed').count()
subscriptions_count = db.query(UserSubscription).count()
active_subscriptions = db.query(UserSubscription).filter(UserSubscription.status == 'active').count()
tickets_count = db.query(SupportTicket).count()

print("DATABASE STATS:")
print("Total Users:", users_count)
print("Clients:", clients_count)
print("Consultants:", consultants_count)
print("Approved Consultants:", approved_consultants)
print("Pending Consultants:", pending_consultants)
print("Total Appointments:", appointments_count)
print("Completed Appointments:", completed_appointments)
print("Total Subscriptions:", subscriptions_count)
print("Active Subscriptions:", active_subscriptions)
print("Support Tickets:", tickets_count)

# Print sample real users
users = db.query(User).limit(5).all()
print("\nSample Users:")
for u in users:
    print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}, Entity: {u.entity_type}, Sector: {u.sector}, City: {u.address}")

# Print sample real consultants
consultants = db.query(User).join(ConsultantProfile, User.id == ConsultantProfile.user_id).limit(5).all()
print("\nSample Consultants:")
for c in consultants:
    prof = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == c.id).first()
    print(f"ID: {c.id}, Name: {c.full_name}, Email: {c.email}, Rate: {prof.price_per_hour if prof else 0}, Status: {prof.verification_status if prof else 'None'}")

db.close()

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.append('e:/Consultation-platform')

from helpers.database import SessionLocal
from helpers.enums import UserRole, VerificationStatus, AppointmentStatus, ActorRole
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.consultant_service import ConsultantService
from models.appointment import Appointment

def seed_data():
    db = SessionLocal()
    try:
        # 1. Update Consultant Name to match screenshot
        consultant_user = db.query(User).filter(User.email == "consultant@platform.com").first()
        if not consultant_user:
            print("ERROR: Consultant user not found. Run seed_consultant.py first.")
            return
            
        consultant_user.full_name = "أ. رأفت حداد (تجريبي)"
        db.commit()
        print(f"INFO: Updated consultant name to: {consultant_user.full_name}")

        consultant_profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == consultant_user.id).first()
        if not consultant_profile:
            print("ERROR: Consultant profile not found.")
            return

        # 2. Add or Get a Consultant Service
        service = db.query(ConsultantService).filter(ConsultantService.consultant_id == consultant_profile.id).first()
        if not service:
            service = ConsultantService(
                consultant_id=consultant_profile.id,
                name="جلسة تجريبية - اختبار الفيديو والملخص الذكي",
                price=0.00,
                duration_minutes=60,
                is_active=True
            )
            db.add(service)
            db.commit()
            db.refresh(service)
            print(f"INFO: Created consultant service: {service.name}")
        else:
            print(f"INFO: Using existing consultant service: {service.name}")

        # 3. Create or Get Client Users
        clients_data = [
            {"email": "client1@platform.com", "full_name": "عميل", "phone": "0550000001"},
            {"email": "client2@platform.com", "full_name": "أ. رأفت حداد (تجريبي)", "phone": "0550000002"},
            {"email": "client3@platform.com", "full_name": "عميل", "phone": "0550000003"}
        ]
        
        seeded_clients = []
        for cdata in clients_data:
            user = db.query(User).filter(User.email == cdata["email"]).first()
            if not user:
                user = User(
                    full_name=cdata["full_name"],
                    email=cdata["email"],
                    phone=cdata["phone"],
                    password_hash="dummy_hash",
                    role=UserRole.user,
                    is_active=True,
                    language="ar"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"INFO: Created client user: {user.full_name} ({user.email})")
            else:
                user.full_name = cdata["full_name"]
                user.phone = cdata["phone"]
                db.commit()
                print(f"INFO: Existing client user verified: {user.full_name}")
            seeded_clients.append(user)

        # 4. Seed Appointments
        # First, delete existing appointments to avoid duplication
        db.query(Appointment).filter(Appointment.consultant_id == consultant_profile.id).delete()
        db.commit()
        print("INFO: Cleared old appointments for clean seeding.")

        # Client 1: 2 sessions total (1 completed, 1 pending)
        appt1 = Appointment(
            consultant_id=consultant_profile.id,
            user_id=seeded_clients[0].id,
            service_id=service.id,
            scheduled_at=datetime.now(timezone.utc) - timedelta(days=2),
            duration_minutes=60,
            status=AppointmentStatus.completed,
            created_by_role=ActorRole.user,
            price=0.00
        )
        appt2 = Appointment(
            consultant_id=consultant_profile.id,
            user_id=seeded_clients[0].id,
            service_id=service.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
            duration_minutes=60,
            status=AppointmentStatus.pending_approval,
            created_by_role=ActorRole.user,
            price=0.00
        )
        db.add_all([appt1, appt2])

        # Client 2: 20 sessions total (19 completed, 1 confirmed)
        for i in range(19):
            completed_appt = Appointment(
                consultant_id=consultant_profile.id,
                user_id=seeded_clients[1].id,
                service_id=service.id,
                scheduled_at=datetime.now(timezone.utc) - timedelta(days=i + 5),
                duration_minutes=60,
                status=AppointmentStatus.completed,
                created_by_role=ActorRole.user,
                price=0.00
            )
            db.add(completed_appt)
            
        confirmed_appt = Appointment(
            consultant_id=consultant_profile.id,
            user_id=seeded_clients[1].id,
            service_id=service.id,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=3),
            duration_minutes=60,
            status=AppointmentStatus.confirmed,
            created_by_role=ActorRole.user,
            price=0.00
        )
        db.add(confirmed_appt)

        # Client 3: 1 completed session
        appt3 = Appointment(
            consultant_id=consultant_profile.id,
            user_id=seeded_clients[2].id,
            service_id=service.id,
            scheduled_at=datetime.now(timezone.utc) - timedelta(days=20),
            duration_minutes=60,
            status=AppointmentStatus.completed,
            created_by_role=ActorRole.user,
            price=0.00
        )
        db.add(appt3)

        db.commit()
        print("SUCCESS: Seeded all client appointments successfully!")
        
    finally:
        db.close()

if __name__ == '__main__':
    seed_data()

import os
import sys

# Append the project root directory to sys.path to resolve relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal
from models.user import User
from models.appointment import Appointment

def clear_seeded_clients():
    db = SessionLocal()
    try:
        # Seed client emails
        client_emails = ["client1@platform.com", "client2@platform.com", "client3@platform.com"]
        
        # Find users
        users = db.query(User).filter(User.email.in_(client_emails)).all()
        user_ids = [u.id for u in users]
        
        if user_ids:
            # Delete appointments associated with these client users
            deleted_appointments = db.query(Appointment).filter(Appointment.user_id.in_(user_ids)).delete(synchronize_session=False)
            print(f"INFO: Deleted {deleted_appointments} appointments.")
            
            # Delete the client users themselves
            deleted_users = db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            print(f"INFO: Deleted {deleted_users} client users.")
            
            db.commit()
            print("SUCCESS: Database cleared of seeded clients and their appointments!")
        else:
            print("INFO: No seeded client users found in database.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {repr(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_seeded_clients()

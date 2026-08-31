import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import engine

def fix_enum():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'user_role';")).fetchall()
        existing_vals = [r[0] for r in res]
        print('Current PostgreSQL user_role enum values:', existing_vals)
        
        if 'platform_consultant' not in existing_vals:
            print("Adding 'platform_consultant' to user_role PostgreSQL enum...")
            conn.execute(text("ALTER TYPE user_role ADD VALUE 'platform_consultant';"))
            conn.commit()
            print("SUCCESS: 'platform_consultant' added to user_role enum!")
        else:
            print("'platform_consultant' already exists in user_role enum.")

if __name__ == '__main__':
    fix_enum()

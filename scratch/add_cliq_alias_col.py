import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal, engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE consultant_bank_accounts ADD COLUMN IF NOT EXISTS cliq_alias VARCHAR(100);"))
        conn.commit()
        print("Successfully added cliq_alias column to consultant_bank_accounts!")
    except Exception as e:
        print("Migration error or already exists:", e)

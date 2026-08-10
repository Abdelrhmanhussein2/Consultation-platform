#!/bin/bash
# Run enum migration on the running PostgreSQL database
source /home/mo/miniconda3/bin/activate legal_ai

cd /mnt/d/Work/Consultation-platform
export DATABASE_URL="postgresql://postgres:consultation123@localhost:5432/consultation_db"

echo ">>> Running enum migration..."
python -c "
from sqlalchemy import create_engine, text
import os

engine = create_engine(os.environ['DATABASE_URL'])
new_appt_statuses = ['pending_approval', 'pending_payment']
new_notif_types = ['appointment_approved', 'appointment_rescheduled', 'payment_required']

with engine.connect() as conn:
    conn.execute(text('COMMIT'))
    for val in new_appt_statuses:
        conn.execute(text(f\"ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS '{val}'\"))
        print(f'  + appointment_status: {val}')
    for val in new_notif_types:
        conn.execute(text(f\"ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '{val}'\"))
        print(f'  + notification_type: {val}')

print('Migration complete!')
"

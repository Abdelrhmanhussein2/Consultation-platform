#!/bin/bash
source /home/mo/miniconda3/bin/activate legal_ai

cd /mnt/d/Work/Consultation-platform

export DATABASE_URL="postgresql://postgres:consultation123@localhost:5432/consultation_db"

echo ">>> Creating tables..."
python -c "
from helpers.database import engine, Base
import models
Base.metadata.create_all(bind=engine)
print('Tables created successfully!')
"

echo ">>> Seeding Super Admin..."
python scripts/seed_super_admin.py

echo ">>> Done!"

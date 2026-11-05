"""Seed script to populate tax_entities table from static/tax_directory_initial.xlsx."""
import os
import sys

# Ensure repository root is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from helpers.database import SessionLocal
from services.tax_directory_service import parse_tax_file, commit_import

EXCEL_PATH = os.path.join(ROOT_DIR, "static", "tax_directory_initial.xlsx")

def main():
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: Initial Excel file not found at {EXCEL_PATH}")
        sys.exit(1)

    print(f"Reading Excel data from {EXCEL_PATH}...")
    with open(EXCEL_PATH, "rb") as f:
        content = f.read()

    records, errors = parse_tax_file(content, "tax_directory_initial.xlsx")
    if errors:
        print(f"Warnings/Errors while parsing: {errors}")

    print(f"Found {len(records)} unique tax entity records to process.")
    db = SessionLocal()
    try:
        result = commit_import(db, records, user_id=None)
        print(f"Success: {result['inserted']} inserted, {result['updated']} updated out of {result['total_processed']} records.")
    except Exception as e:
        db.rollback()
        print(f"Database error during seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()


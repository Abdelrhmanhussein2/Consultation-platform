#!/usr/bin/env python
"""
scripts/import_legal_terms.py
==============================
Idempotent importer for قاموس مصطلحات ديوان Excel file.

Writes to PostgreSQL legal_terms table.
Safe to re-run: uses SHA-256 row_hash to skip already-imported rows.

Usage:
    python scripts/import_legal_terms.py [--excel "path/to/file.xlsx"] [--batch-id "2026-10-24"]
"""
import argparse
import hashlib
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("ERROR: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

# Allow running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from helpers.database import SessionLocal
from models.ai.legal_term import LegalTerm

COL_POPULAR      = 0
COL_LEGISLATIVE  = 1
COL_REF_TYPE     = 2
COL_LAW_NAME     = 3
COL_LAW_NUM_YEAR = 4
COL_ARTICLE_REF  = 5
COL_LITERAL_TEXT = 6
COL_OFFICIAL_URL = 7


def compute_hash(row_values: list) -> str:
    raw = "\x00".join(str(v) if v is not None else "" for v in row_values)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def find_excel(hint: str = None) -> Path:
    if hint:
        p = Path(hint)
        if p.exists():
            return p
        raise FileNotFoundError(f"File not found: {hint}")
    for f in Path(".").iterdir():
        if f.suffix in (".xlsx", ".xls") and f.stat().st_size > 5000:
            return f
    raise FileNotFoundError("No Excel file found in current directory.")


def run(excel_path: str = None, batch_id: str = None):
    path = find_excel(excel_path)
    batch_id = batch_id or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    print(f"Importing from: {path.resolve()}")
    print(f"Batch ID: {batch_id}")

    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active

    db = SessionLocal()
    inserted = 0
    skipped = 0
    errors = 0

    try:
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not any(row):
                continue

            row = list(row) + [None] * max(0, 8 - len(row))
            popular     = str(row[COL_POPULAR]).strip()      if row[COL_POPULAR]      else None
            legislative = str(row[COL_LEGISLATIVE]).strip()  if row[COL_LEGISLATIVE]  else None

            if not popular or not legislative:
                print(f"  SKIP row {row_idx}: missing required field")
                errors += 1
                continue

            row_values = row[:8]
            row_hash = compute_hash(row_values)

            # Idempotency: skip if hash already exists
            existing = db.query(LegalTerm).filter(LegalTerm.row_hash == row_hash).first()
            if existing:
                skipped += 1
                continue

            term = LegalTerm(
                popular_term      = popular,
                legislative_term  = legislative,
                ref_type          = str(row[COL_REF_TYPE]).strip()     if row[COL_REF_TYPE]     else None,
                law_name          = str(row[COL_LAW_NAME]).strip()     if row[COL_LAW_NAME]     else None,
                law_number_year   = str(row[COL_LAW_NUM_YEAR]).strip() if row[COL_LAW_NUM_YEAR] else None,
                article_reference = str(row[COL_ARTICLE_REF]).strip()  if row[COL_ARTICLE_REF]  else None,
                literal_text      = str(row[COL_LITERAL_TEXT]).strip() if row[COL_LITERAL_TEXT] else None,
                official_url      = str(row[COL_OFFICIAL_URL]).strip() if row[COL_OFFICIAL_URL] else None,
                row_hash          = row_hash,
                import_batch_id   = batch_id,
                is_active         = True,
            )
            db.add(term)
            inserted += 1

            # Commit in batches of 100
            if inserted % 100 == 0:
                db.commit()
                print(f"  ... committed {inserted} rows so far")

        db.commit()
        wb.close()

        print(f"\nDone!")
        print(f"  Inserted: {inserted}")
        print(f"  Skipped (already exist): {skipped}")
        print(f"  Errors (missing fields): {errors}")

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel")
    parser.add_argument("--batch-id")
    args = parser.parse_args()
    run(args.excel, args.batch_id)

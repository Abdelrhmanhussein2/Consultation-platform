#!/usr/bin/env python
"""
scripts/seed_legal_terms.py
===========================
Seeds the legal_terms table from data/legal_terms_seed.json.
Completely standalone: does NOT require Excel, openpyxl, or any external files.

Safe and idempotent:
- If table already has data, it skips immediately (unless --force is passed).
- Uses SHA-256 row_hash for deduplication.
"""
import io
import json
import sys
from pathlib import Path

# Allow importing helpers & models from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from helpers.database import SessionLocal, engine
from models.ai.legal_term import LegalTerm


SEED_FILE = ROOT_DIR / "data" / "legal_terms_seed.json"


def seed_legal_terms(force: bool = False, quiet: bool = False) -> int:
    """
    Seed legal terms into PostgreSQL.
    Returns number of inserted rows.
    """
    if not SEED_FILE.exists():
        if not quiet:
            print(f"WARN: Seed file not found at {SEED_FILE}")
        return 0

    db = SessionLocal()
    try:
        current_count = db.query(LegalTerm).count()
        if current_count > 0 and not force:
            if not quiet:
                print(f"INFO: legal_terms already contains {current_count} records. Skipping seed.")
            return 0

        with io.open(SEED_FILE, "r", encoding="utf-8") as f:
            items = json.load(f)

        inserted = 0
        skipped = 0

        for item in items:
            row_hash = item.get("row_hash")
            if row_hash:
                exists = db.query(LegalTerm).filter(LegalTerm.row_hash == row_hash).first()
                if exists:
                    skipped += 1
                    continue

            term = LegalTerm(
                popular_term=item.get("popular_term"),
                legislative_term=item.get("legislative_term"),
                ref_type=item.get("ref_type"),
                law_name=item.get("law_name"),
                law_number_year=item.get("law_number_year"),
                article_reference=item.get("article_reference"),
                literal_text=item.get("literal_text"),
                official_url=item.get("official_url"),
                neo4j_article_id=None,
                law_id=None,
                version_id=None,
                match_status=None,
                is_openable=False,
                review_status="pending",
                row_hash=row_hash,
                import_batch_id="seed_initial",
                is_active=True,
            )
            db.add(term)
            inserted += 1

            if inserted % 100 == 0:
                db.commit()

        db.commit()

        if not quiet:
            print(f"SUCCESS: Seeded {inserted} legal terms into legal_terms table. (Skipped {skipped})")

        return inserted

    except Exception as e:
        db.rollback()
        if not quiet:
            print(f"ERROR seeding legal terms: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    force_run = "--force" in sys.argv
    seed_legal_terms(force=force_run, quiet=False)

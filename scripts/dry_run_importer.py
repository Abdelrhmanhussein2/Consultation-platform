#!/usr/bin/env python
"""
scripts/dry_run_importer.py
===========================
Dry-run importer for قاموس مصطلحات ديوان Excel file.

READ-ONLY — does NOT write to any database.
Produces a JSON report: dry_run_report.json

Usage:
    python scripts/dry_run_importer.py [--excel "path/to/file.xlsx"] [--out dry_run_report.json]
"""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

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


def parse_excel(path: Path) -> list:
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active
    rows_out = []
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not any(row):
            continue
        row = list(row) + [None] * max(0, 8 - len(row))
        rows_out.append({
            "excel_row":       row_idx,
            "popular_term":    str(row[COL_POPULAR]).strip()      if row[COL_POPULAR]      else None,
            "legislative_term":str(row[COL_LEGISLATIVE]).strip()  if row[COL_LEGISLATIVE]  else None,
            "ref_type":        str(row[COL_REF_TYPE]).strip()     if row[COL_REF_TYPE]     else None,
            "law_name":        str(row[COL_LAW_NAME]).strip()     if row[COL_LAW_NAME]     else None,
            "law_number_year": str(row[COL_LAW_NUM_YEAR]).strip() if row[COL_LAW_NUM_YEAR] else None,
            "article_reference": str(row[COL_ARTICLE_REF]).strip() if row[COL_ARTICLE_REF] else None,
            "literal_text":    str(row[COL_LITERAL_TEXT]).strip() if row[COL_LITERAL_TEXT] else None,
            "official_url":    str(row[COL_OFFICIAL_URL]).strip() if row[COL_OFFICIAL_URL] else None,
            "row_values":      row[:8],
        })
    wb.close()
    return rows_out


def validate(rows: list) -> dict:
    seen_hashes = {}
    seen_popular_terms = {}
    valid = []
    invalid = []
    duplicate_hash_rows = []
    duplicate_popular_term_rows = []

    for row in rows:
        errors = []
        if not row.get("popular_term"):
            errors.append("missing popular_term")
        if not row.get("legislative_term"):
            errors.append("missing legislative_term")

        row_hash = compute_hash(row["row_values"])
        row["row_hash"] = row_hash

        if errors:
            row["errors"] = errors
            row.pop("row_values", None)
            invalid.append(row)
            continue

        if row_hash in seen_hashes:
            row["duplicate_of_excel_row"] = seen_hashes[row_hash]
            row.pop("row_values", None)
            duplicate_hash_rows.append(row)
            continue
        seen_hashes[row_hash] = row["excel_row"]

        pop = row["popular_term"]
        if pop in seen_popular_terms:
            row["also_appears_at_excel_row"] = seen_popular_terms[pop]
            duplicate_popular_term_rows.append({k: v for k, v in row.items() if k != "row_values"})
        else:
            seen_popular_terms[pop] = row["excel_row"]

        r = {k: v for k, v in row.items() if k != "row_values"}
        valid.append(r)

    unique_legislative = sorted(set(r["legislative_term"] for r in valid))
    unique_laws = sorted(set(r["law_name"] for r in valid if r.get("law_name")))
    unique_ref_types = sorted(set(r["ref_type"] for r in valid if r.get("ref_type")))

    statistics = {
        "total_excel_rows":         len(rows),
        "valid_rows":               len(valid),
        "invalid_rows":             len(invalid),
        "exact_duplicate_hashes":   len(duplicate_hash_rows),
        "duplicate_popular_terms":  len(duplicate_popular_term_rows),
        "unique_popular_terms":     len(seen_popular_terms),
        "unique_legislative_terms": len(unique_legislative),
        "unique_law_names":         len(unique_laws),
        "unique_ref_types":         len(unique_ref_types),
        "laws_covered":             unique_laws,
        "ref_types_covered":        unique_ref_types,
    }

    return {
        "valid_rows":                valid,
        "invalid_rows":              invalid,
        "duplicate_hash_rows":       duplicate_hash_rows,
        "duplicate_popular_term_rows": duplicate_popular_term_rows,
        "unique_legislative_terms":  unique_legislative,
        "statistics":                statistics,
    }


def run(excel_path=None, output_path="dry_run_report.json"):
    print("=" * 60)
    print("Diwan Legal Terms — DRY-RUN IMPORTER (read-only)")
    print("=" * 60)

    path = find_excel(excel_path)
    print(f"\nOK Excel file: {path.resolve()}")

    rows = parse_excel(path)
    print(f"OK Parsed {len(rows)} non-empty rows")

    result = validate(rows)
    stats = result["statistics"]

    print(f"\n{'─'*40}")
    print(f"  Total rows scanned:     {stats['total_excel_rows']}")
    print(f"  Valid (would INSERT):   {stats['valid_rows']}")
    print(f"  Invalid (skipped):      {stats['invalid_rows']}")
    print(f"  Exact hash duplicates:  {stats['exact_duplicate_hashes']}")
    print(f"  Same popular term:      {stats['duplicate_popular_terms']}")
    print(f"  Unique popular terms:   {stats['unique_popular_terms']}")
    print(f"  Unique legislative:     {stats['unique_legislative_terms']}")
    print(f"{'─'*40}")

    print("\n=== Golden Test Cases Verification ===")
    golden = [
        "صافي الدخل", "شو ضل من الدخل", "دخل معفي",
        "مصاريف مقبولة", "تنزيل المصاريف", "غرامة ضريبية", "مصاريف شخصية",
    ]
    valid_map = {r["popular_term"]: r for r in result["valid_rows"]}
    for term in golden:
        if term in valid_map:
            row = valid_map[term]
            print(f"  OK '{term}' -> '{row['legislative_term']}' | {row['article_reference']}")
        else:
            print(f"  MISSING '{term}' NOT FOUND")

    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "excel_file": str(path.resolve()),
        "mode": "dry_run",
        "db_writes": False,
        **result,
    }
    out = Path(output_path)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nOK Full report written to: {out.resolve()}")
    print("\n  NO DATABASE WAS MODIFIED. This was a read-only dry-run.")
    print("=" * 60)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel")
    parser.add_argument("--out", default="dry_run_report.json")
    args = parser.parse_args()
    run(args.excel, args.out)

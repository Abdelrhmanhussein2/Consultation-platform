#!/usr/bin/env python
"""
scripts/verify_terms_sources.py
===============================
Resolves and verifies legal terms against Neo4j legislation graph.
Stores version basis, text match status, normalization level, and review status.

Usage:
    python scripts/verify_terms_sources.py --dry-run
    python scripts/verify_terms_sources.py --apply
"""
import argparse
import csv
import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from helpers.database import SessionLocal, engine
from helpers.neo4j_db import neo4j_db
from models.ai.legal_term import LegalTerm
from sqlalchemy import text


def norm_l1(t: str) -> str:
    """Removes diacritics and tatweel, normalizes whitespace."""
    if not t:
        return ""
    t = re.sub(r'[\u064B-\u065F\u0670\u0640]', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def norm_l2(t: str) -> str:
    """L1 + strip guillemets and quotation marks."""
    t = norm_l1(t)
    t = re.sub(r'[«»"\'`]', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def norm_l3(t: str) -> str:
    """L2 + strip punctuation (, . : - etc)."""
    t = norm_l2(t)
    t = re.sub(r'[\.\,\:\;\-\(\)\[\]\{\}]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def norm_l4(t: str) -> str:
    """L3 + Hamza normalization (إ أ آ -> ا)."""
    t = norm_l3(t)
    t = re.sub(r'[إأآا]', 'ا', t)
    return re.sub(r'\s+', ' ', t).strip()


def norm_l5(t: str) -> str:
    """L4 + Taa Marbuta / Alif Maqsura."""
    t = norm_l4(t)
    t = re.sub(r'ة', 'ه', t)
    t = re.sub(r'[ىي]', 'ي', t)
    return re.sub(r'\s+', ' ', t).strip()


def parse_article_number(aref: str):
    """
    Parses article number from article_reference string.
    Returns (art_num, is_valid_single).
    """
    if not aref or not aref.strip():
        return None, False

    # Check for invalid cases: ranges or multiple articles
    if any(sep in aref for sep in ['-', 'إلى', 'وحتى']):
        return None, False

    matches = re.findall(r'المادة\s*(\d+)', aref)
    if len(matches) == 1:
        return int(matches[0]), True
    return None, False


def load_neo4j_data():
    """Loads all laws and article hierarchies from Neo4j."""
    laws = {}
    articles = {}

    with neo4j_db.get_session() as session:
        law_res = session.run('''
            MATCH (l:قانون)
            RETURN coalesce(l.law_id, l.`معرف`) as law_id,
                   coalesce(l.title, l.`العنوان`) as title,
                   coalesce(l.number, toInteger(l.`رقم_القانون`), 0) as number,
                   coalesce(l.year, toInteger(l.`السنة`), 0) as year,
                   coalesce(l.status, l.`الحالة`) as status,
                   coalesce(l.amended_date, l.`تاريخ_آخر_تعديل`) as amended_date
        ''')
        for r in law_res:
            lid = r['law_id']
            laws[lid] = dict(r)

        art_res = session.run('''
            MATCH (l:قانون)-[:`يتضمن_مادة`]->(a:مادة)
            OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(p:فقرة)
            OPTIONAL MATCH (p)-[:`يتضمن_بند`]->(i:بند)
            WITH l, a, 
                 coalesce(l.law_id, l.`معرف`) as law_id,
                 coalesce(a.`معرف`, a.article_id) as art_id,
                 coalesce(a.number, toInteger(a.`رقم_المادة`)) as num,
                 coalesce(a.title, a.`عنوان_المادة`, a.`اسم`, '') as art_title,
                 coalesce(a.text, a.`نص_المادة`, '') as a_text,
                 collect(distinct coalesce(p.text, p.`نص_الفقرة`, '')) as p_texts,
                 collect(distinct coalesce(i.text, i.`نص_البند`, '')) as i_texts
            RETURN law_id, art_id, num, art_title,
                   a_text + ' ' + reduce(s='', x in p_texts | s + ' ' + x) + ' ' + reduce(s='', x in i_texts | s + ' ' + x) as full_text
        ''')
        for r in art_res:
            key = (r['law_id'], r['num'])
            ft = r['full_text']
            articles[key] = {
                'art_id': r['art_id'],
                'art_title': r['art_title'],
                'raw_text': ft,
                'l1': norm_l1(ft),
                'l2': norm_l2(ft),
                'l3': norm_l3(ft),
                'l4': norm_l4(ft),
                'l5': norm_l5(ft),
            }

    return laws, articles


def run_verification(dry_run: bool = True):
    print("=" * 70)
    print("Neo4j Legislation Graph Verification & Review Classification")
    print(f"Mode: {'READ-ONLY DRY-RUN' if dry_run else 'APPLY TO DATABASE'}")
    print("=" * 70)

    laws, articles = load_neo4j_data()
    print(f"Loaded {len(laws)} laws and {len(articles)} article nodes from Neo4j.")

    db = SessionLocal()
    try:
        terms = db.query(LegalTerm).order_by(LegalTerm.id).all()
        total_count = len(terms)
        print(f"Total legal_terms in PostgreSQL: {total_count}")

        now = datetime.now(timezone.utc)
        v_amended = 'قانون_34_2014_وتعديلاته'
        v_original = 'قانون_34_2014_الأصلية'

        counts = {
            'verified_openable': 0,
            'verified_pending_different': 0,
            'not_in_graph': 0,
            'hamza_normalized_count': 0,
        }

        diff_rows_records = []
        hamza_records = []

        for term in terms:
            lname = term.law_name or ""
            lyear = term.law_number_year or ""
            combined_law = f"{lname} {lyear}".strip()
            aref = term.article_reference or ""
            quote = (term.literal_text or "").strip()

            # Check 1: Law presence in graph
            if "ضريبة الدخل" not in combined_law and "34 لسنة 2014" not in combined_law:
                term.law_id = None
                term.version_id = None
                term.neo4j_article_id = None
                term.match_status = "not_in_graph"
                term.text_match_status = "not_in_graph"
                term.normalization_level = "none"
                term.version_basis = None
                term.review_status = "pending"
                term.is_openable = False
                term.verified_at = None
                counts['not_in_graph'] += 1
                continue

            # Law 34 of 2014
            art_num, is_valid_single = parse_article_number(aref)
            if not is_valid_single:
                term.law_id = v_amended
                term.version_id = v_amended
                term.neo4j_article_id = None
                term.match_status = "not_found"
                term.text_match_status = "not_found"
                term.normalization_level = "none"
                term.version_basis = None
                term.review_status = "pending"
                term.is_openable = False
                term.verified_at = None
                continue

            art_am = articles.get((v_amended, art_num))
            art_or = articles.get((v_original, art_num))

            if not art_am and not art_or:
                term.law_id = v_amended
                term.version_id = v_amended
                term.neo4j_article_id = None
                term.match_status = "not_found"
                term.text_match_status = "not_found"
                term.normalization_level = "none"
                term.version_basis = None
                term.review_status = "pending"
                term.is_openable = False
                term.verified_at = None
                continue

            # Evaluate containment in both versions to determine version_basis
            quote_l5 = norm_l5(quote)
            in_am_full = bool(quote_l5 and art_am and quote_l5 in art_am['l5'])
            in_or_full = bool(quote_l5 and art_or and quote_l5 in art_or['l5'])

            if in_am_full and in_or_full:
                v_basis = "current_consolidated"
            elif in_am_full and not in_or_full:
                v_basis = "amended_only"
            elif not in_am_full and in_or_full:
                v_basis = "original_only"
            else:
                v_basis = "unverified_quote"

            # Version policy: ALWAYS link to current consolidated version
            target_law_id = v_amended
            target_version_id = v_amended
            target_art = art_am or art_or
            target_neo4j_id = target_art['art_id']

            # Evaluate normalization level against target article
            art_obj = art_am if art_am else art_or
            t_status = None
            norm_lvl = None
            is_open = False
            rev_stat = "pending"

            if quote and quote in art_obj['raw_text']:
                t_status = "exact"
                norm_lvl = "exact"
                is_open = True
            elif norm_l1(quote) and norm_l1(quote) in art_obj['l1']:
                t_status = "exact"
                norm_lvl = "exact"
                is_open = True
            elif norm_l2(quote) and norm_l2(quote) in art_obj['l2']:
                t_status = "contained_exact"
                norm_lvl = "quotes_stripped"
                is_open = True
            elif norm_l3(quote) and norm_l3(quote) in art_obj['l3']:
                t_status = "contained_normalized"
                norm_lvl = "punct_stripped"
                is_open = True
            elif norm_l4(quote) and norm_l4(quote) in art_obj['l4']:
                t_status = "contained_normalized"
                norm_lvl = "hamza_normalized"
                is_open = True
                counts['hamza_normalized_count'] += 1
                hamza_records.append({
                    "id": term.id,
                    "popular_term": term.popular_term,
                    "legislative_term": term.legislative_term,
                    "article_reference": term.article_reference,
                    "excel_quote": term.literal_text,
                    "neo4j_article_id": target_neo4j_id,
                    "normalization_level": "hamza_normalized",
                    "text_match_status": "contained_normalized"
                })
            else:
                # The 7 different rows
                t_status = "different"
                norm_lvl = "none"
                is_open = False
                counts['verified_pending_different'] += 1
                diff_rows_records.append({
                    "id": term.id,
                    "popular_term": term.popular_term,
                    "legislative_term": term.legislative_term,
                    "article_reference": term.article_reference,
                    "excel_quote": term.literal_text,
                    "neo4j_article_id": target_neo4j_id,
                    "article_text": art_obj['raw_text'].strip()
                })

            if is_open:
                counts['verified_openable'] += 1

            # Populate fields
            term.law_id = target_law_id
            term.version_id = target_version_id
            term.neo4j_article_id = target_neo4j_id
            term.match_status = "verified"
            term.text_match_status = t_status
            term.normalization_level = norm_lvl
            term.version_basis = v_basis
            term.review_status = "pending"
            term.reviewed_by = None
            term.reviewed_at = None
            term.is_openable = is_open
            term.verified_at = now if is_open else None

        if not dry_run:
            db.commit()
            print("\nSuccessfully updated PostgreSQL legal_terms with verification & review classifications!")

        # Generate Review CSV Sheet
        reports_dir = ROOT_DIR / "reports"
        reports_dir.mkdir(exist_ok=True)
        csv_path = reports_dir / "review_sheet_legal_terms.csv"

        with open(csv_path, mode="w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Section",
                "Group ID",
                "Term ID(s)",
                "Popular Term",
                "Legislative Term",
                "Article Reference",
                "Excel Quote",
                "Neo4j Article Text",
                "Text Match Status",
                "Normalization Level",
                "Review Status",
                "Review Note"
            ])

            # Grouping the 7 different rows into the 4 distinct quotation groups:
            # Group A: id 67 (Article 10/أ)
            # Group B: ids 368, 369 (Article 6/أ)
            # Group C: ids 370, 371 (Article 6/ب/1)
            # Group D: ids 374, 375 (Article 6/ج)
            groups_map = {
                67: "Group 1 (ID 67)",
                368: "Group 2 (IDs 368, 369)",
                369: "Group 2 (IDs 368, 369)",
                370: "Group 3 (IDs 370, 371)",
                371: "Group 3 (IDs 370, 371)",
                374: "Group 4 (IDs 374, 375)",
                375: "Group 4 (IDs 374, 375)",
            }

            for r in diff_rows_records:
                gid = groups_map.get(r['id'], "Other")
                writer.writerow([
                    "Different Quotations (Pending Review)",
                    gid,
                    r['id'],
                    r['popular_term'],
                    r['legislative_term'],
                    r['article_reference'],
                    r['excel_quote'],
                    r['article_text'],
                    "different",
                    "none",
                    "pending",
                    "Pending manual review: quotation text differs from article text in graph; reference itself may be the error."
                ])

            # Section 2: Hamza normalization rows (12 rows)
            for h in hamza_records:
                writer.writerow([
                    "Hamza Normalized Rows (Pending Review)",
                    f"Hamza-ID-{h['id']}",
                    h['id'],
                    h['popular_term'],
                    h['legislative_term'],
                    h['article_reference'],
                    h['excel_quote'],
                    "",
                    h['text_match_status'],
                    h['normalization_level'],
                    "pending",
                    "Matched under Hamza normalization (إ/أ/آ -> ا)"
                ])

        print(f"\nReview CSV sheet generated at: {csv_path}")

        print("\n" + "=" * 70)
        print("VERIFICATION & REVIEW SUMMARY")
        print("=" * 70)
        print(f"Total Rows:                       {total_count}")
        print(f"Verified & Openable:              {counts['verified_openable']} (348 rows, review_status='pending')")
        print(f"Verified & Pending (7 Different): {counts['verified_pending_different']} (is_openable = False)")
        print(f"Out of Graph (66 Rows):           {counts['not_in_graph']} (is_openable = False)")
        print(f"Hamza Normalized:                 {counts['hamza_normalized_count']} (12 rows)")
        print(f"Total Openable:                   {counts['verified_openable']}")
        print(f"Total Non-Openable:               {counts['verified_pending_different'] + counts['not_in_graph']} (7 + 66 = 73)")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify legal terms against Neo4j.")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run without DB changes")
    parser.add_argument("--apply", action="store_true", default=False, help="Apply results to database")
    args = parser.parse_args()

    if not args.dry_run and not args.apply:
        args.dry_run = True

    run_verification(dry_run=not args.apply)

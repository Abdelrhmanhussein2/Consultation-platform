"""
controllers/legal_terms_controller.py
=====================================
Controller for legal dictionary auto-complete and search enhancement.
Enforces legal source availability against Neo4j legislation graph.
Only returns suggestions that resolve to an openable article node.
"""
import io
import re
from datetime import datetime, timezone
from typing import List, Optional, Set
from fastapi import HTTPException
from sqlalchemy import or_, and_

from helpers.database import SessionLocal
from helpers.neo4j_db import neo4j_db
from models.ai.legal_term import LegalTerm


def full_norm(t: str) -> str:
    """Full Arabic normalization for query & term matching."""
    if not t:
        return ""
    # Strip diacritics and tatweel directly without inserting spaces
    t = re.sub(r'[\u064B-\u065F\u0670\u0640]', '', t)
    # Replace punctuation with spaces
    t = re.sub(r'[«»"\'\(\)\[\]\.\,\:\-]', ' ', t)
    # Normalize Alif variants
    t = re.sub(r'[إأآا]', 'ا', t)
    # Normalize Yaa and Alif Maqsura
    t = re.sub(r'[ىي]', 'ي', t)
    # Normalize Taa Marbuta
    t = re.sub(r'ة', 'ه', t)
    # Remove any non-alphanumeric except spaces
    t = re.sub(r'[^\w\s]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def parse_article_number(aref: str) -> Optional[int]:
    """Extracts numeric article from article reference string."""
    if not aref:
        return None
    matches = re.findall(r'المادة\s*(\d+)', aref)
    if len(matches) == 1:
        return int(matches[0])
    return None


# In-memory TTL cache for Neo4j article verification (60 seconds TTL)
_NEO4J_CACHE = {}
_CACHE_TTL_SECONDS = 60.0

# In-memory aggregate gap logger for suppressed/unmatched terms
_AGGREGATE_GAPS = {}


def verify_article_in_neo4j(source_id: str) -> bool:
    """
    Checks if article node exists in Neo4j with 60s memory cache.
    Fails closed (raises HTTPException 503) if Neo4j is unavailable.
    """
    if not source_id:
        return False

    now = datetime.now(timezone.utc).timestamp()
    if source_id in _NEO4J_CACHE:
        val, ts = _NEO4J_CACHE[source_id]
        if now - ts < _CACHE_TTL_SECONDS:
            return val

    try:
        with neo4j_db.get_session() as session:
            res = session.run(
                "MATCH (a:مادة {`معرف`: $art_id}) RETURN count(a) > 0 AS exists",
                art_id=source_id
            ).single()
            exists = bool(res and res["exists"])
            _NEO4J_CACHE[source_id] = (exists, now)
            return exists
    except Exception as e:
        # Strict fail-closed policy: service unavailable when graph is down
        raise HTTPException(
            status_code=503,
            detail=f"Legal source verification service unavailable (Neo4j unreachable): {str(e)}"
        )


def log_gap(query_norm: str, reason: str = "not_found"):
    """Logs aggregate query gaps without storing user IP/identities."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if query_norm in _AGGREGATE_GAPS:
        _AGGREGATE_GAPS[query_norm]["count"] += 1
        _AGGREGATE_GAPS[query_norm]["last_seen"] = now_iso
    else:
        _AGGREGATE_GAPS[query_norm] = {
            "term": query_norm,
            "count": 1,
            "first_seen": now_iso,
            "last_seen": now_iso,
            "reason": reason
        }


class LegalTermsController:

    @staticmethod
    def suggest(query: str, limit: int = 5) -> dict:
        """
        Returns verified, openable legislative term suggestions for query.
        Returns empty options and matched: false if nothing is eligible.
        Layer (a): exact, then normalized-exact on popular term (is_direct_banner=True).
        Layer (b): whole-word match (min 3 chars), ranked by closeness (is_direct_banner=False).
        """
        raw_query = (query or "").strip()
        if not raw_query or len(raw_query) < 2:
            return {"matched": False, "is_direct_banner": False, "options": []}

        norm_query = full_norm(raw_query)
        db = SessionLocal()

        try:
            # ─────────────────────────────────────────────────────────────
            # 1. Base Filter (Strict Openability, Verification, & Approval)
            # ─────────────────────────────────────────────────────────────
            base_q = db.query(LegalTerm).filter(
                LegalTerm.is_active == True,
                LegalTerm.is_openable == True,
                LegalTerm.match_status == 'verified',
                LegalTerm.review_status != 'rejected'
            )

            # ─────────────────────────────────────────────────────────────
            # 2. Candidate Matching Strategies
            #    Layer (a): Exact on popular_term, then normalized-exact
            #    Layer (b): Whole-word match (min 3 chars), ranked by closeness
            # ─────────────────────────────────────────────────────────────
            candidates: List[LegalTerm] = []
            is_direct_banner: bool = False

            # Layer (a) - Step 1: Exact on popular_term
            candidates = base_q.filter(LegalTerm.popular_term == raw_query).all()
            if candidates:
                is_direct_banner = True

            # Layer (a) - Step 2: Normalized-exact on popular_term
            if not candidates:
                all_eligible = base_q.all()
                candidates = [
                    t for t in all_eligible 
                    if full_norm(t.popular_term) == norm_query
                ]
                if candidates:
                    is_direct_banner = True

            # Layer (b): Whole-word match (word boundary, minimum 3 characters)
            if not candidates and len(norm_query) >= 3:
                is_direct_banner = False
                all_eligible = base_q.all()
                pattern = re.compile(rf'(?:^|\s){re.escape(norm_query)}(?:\s|$)')

                scored = []
                for t in all_eligible:
                    p_norm = full_norm(t.popular_term)
                    l_norm = full_norm(t.legislative_term)

                    matched_in_pop = bool(pattern.search(p_norm))
                    matched_in_leg = bool(pattern.search(l_norm))

                    if matched_in_pop or matched_in_leg:
                        prio = 0 if matched_in_pop else 1
                        diff = abs(len(t.popular_term) - len(raw_query))
                        pos = p_norm.find(norm_query) if matched_in_pop else l_norm.find(norm_query)
                        scored.append((prio, diff, pos, t))

                # Sort by priority, closeness, position
                scored.sort(key=lambda x: (x[0], x[1], x[2]))
                candidates = [x[3] for x in scored[:limit]]

            # ─────────────────────────────────────────────────────────────
            # 3. Gap Logging if no candidates found
            # ─────────────────────────────────────────────────────────────
            if not candidates:
                ineligible = db.query(LegalTerm).filter(
                    LegalTerm.is_active == True,
                    or_(
                        LegalTerm.popular_term.ilike(f"%{raw_query}%"),
                        LegalTerm.legislative_term.ilike(f"%{raw_query}%")
                    )
                ).first()
                if ineligible:
                    log_gap(norm_query, reason=ineligible.match_status or "ineligible")

                return {
                    "matched": False,
                    "is_direct_banner": False,
                    "options": []
                }

            # ─────────────────────────────────────────────────────────────
            # 4. Request-Time Confirmation against Neo4j & Deduplication
            # ─────────────────────────────────────────────────────────────
            seen_targets: Set[tuple] = set()
            valid_options = []

            for term in candidates:
                source_id = term.neo4j_article_id
                target_key = (term.legislative_term, source_id)
                if target_key in seen_targets:
                    continue

                # Confirm article exists in Neo4j at request-time (fails closed if Neo4j is down)
                if not verify_article_in_neo4j(source_id):
                    continue

                seen_targets.add(target_key)
                from urllib.parse import quote_plus
                hl_query = (term.literal_text or term.legislative_term or term.popular_term or "")[:80]
                # open_url uses the full stable article identifier with highlight query
                open_url = f"/regulations/law/{term.law_id}?article={source_id}&version={term.version_id}&highlight={quote_plus(hl_query)}"

                art_num = parse_article_number(term.article_reference)
                if art_num is None and source_id:
                    m = re.search(r'مادة_(\d+)', source_id)
                    if m:
                        art_num = int(m.group(1))

                valid_options.append({
                    "id": term.id,
                    "title": term.legislative_term,
                    "law_name": term.law_name,
                    "law_id": term.law_id,
                    "version_id": term.version_id,
                    "version_basis": term.version_basis or "current_consolidated",
                    "version_status": "ساري",
                    "source_id": source_id,
                    "article_reference": term.article_reference,
                    "article_number": art_num,
                    "match_status": term.match_status,
                    "text_match_status": term.text_match_status or "contained_normalized",
                    "normalization_level": term.normalization_level or "exact",
                    "is_openable": True,
                    "is_direct_banner": is_direct_banner,
                    "open_url": open_url,
                    "literal_text": term.literal_text,
                    "official_url": term.official_url
                })

                if len(valid_options) >= limit:
                    break

            if not valid_options:
                return {
                    "matched": False,
                    "is_direct_banner": False,
                    "options": []
                }

            return {
                "matched": True,
                "is_direct_banner": is_direct_banner,
                "options": valid_options
            }

        finally:
            db.close()

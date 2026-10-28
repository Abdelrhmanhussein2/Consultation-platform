"""
helpers/arabic_search_utils.py
==============================
Lightweight Arabic text normalization, sliding-window trigram similarity,
safe prefix handling, and relevance scoring for Jordanian legislation search.
Pure Python, zero external NLP/AI dependencies.
"""
import re
from typing import Set, Tuple, List, Optional


def normalize_arabic(text: Optional[str]) -> str:
    """
    Standard Arabic text normalization:
    - Removes diacritics (tashkeel) and tatweel (kashida).
    - Normalizes alef variants (أ, إ, آ, ٱ) -> ا.
    - Normalizes yaa and alef maqsura (ي, ى) -> ي.
    - Normalizes taa marbuta and haa (ة, ه) -> ه.
    - Normalizes hamza variants (ؤ, ئ) -> ء.
    - Strips punctuation and unifies whitespace.
    """
    if not text:
        return ""

    # Remove tashkeel and tatweel
    s = re.sub(r'[\u064B-\u065F\u0670\u0640]', '', str(text))
    # Normalize alef variants
    s = re.sub(r'[أإآٱ]', 'ا', s)
    # Normalize yaa and alef maqsura
    s = re.sub(r'[ىي]', 'ي', s)
    # Normalize taa marbuta and haa
    s = re.sub(r'[ةه]', 'ه', s)
    # Normalize hamza variants
    s = re.sub(r'[ؤئ]', 'ء', s)
    # Replace non-alphanumeric / punctuation with space (keep Arabic letters, digits, latin)
    s = re.sub(r'[^\w\s]', ' ', s)
    # Normalize whitespace
    return re.sub(r'\s+', ' ', s).strip()


def strip_common_prefixes(w: str) -> str:
    """
    Safely strips common Arabic attached prefixes (ال، للـ، بالـ، والـ)
    only when the remaining word has at least 3 characters.
    """
    if len(w) < 4:
        return w
    if (w.startswith("بال") or w.startswith("كال") or w.startswith("فال") or w.startswith("وال")) and len(w) >= 6:
        return w[3:]
    if w.startswith("لل") and len(w) >= 5:
        return w[2:]
    if w.startswith("ال") and len(w) >= 5:
        return w[2:]
    return w


def extract_search_numbers(text: str) -> Tuple[Optional[int], Optional[int]]:
    """
    Extracts legislation number and year from Arabic search queries like:
    - "قانون 34 لسنة 2014"
    - "رقم 34 لعام 2014"
    - "34 / 2014"
    Returns (number, year) if detected.
    """
    if not text:
        return None, None

    # Number + Year patterns
    m1 = re.search(r'(?:رقم|قانون)?\s*(\d{1,4})\s*(?:لسنة|لعام|\/)\s*(\d{4})', text)
    if m1:
        return int(m1.group(1)), int(m1.group(2))

    # Just year (e.g. "لسنة 2014" or "لعام 2014")
    m2 = re.search(r'(?:لسنة|لعام)\s*(\d{4})', text)
    year = int(m2.group(1)) if m2 else None

    # Just law number
    m3 = re.search(r'رقم\s*(\d{1,4})', text)
    number = int(m3.group(1)) if m3 else None

    return number, year


def get_trigrams(text: str) -> Set[str]:
    """
    Computes character trigrams matching PostgreSQL's pg_trgm logic
    (prepends two spaces and appends one space).
    """
    norm = normalize_arabic(text)
    if not norm:
        return set()

    padded = f"  {norm} "
    trigrams = set()
    for i in range(len(padded) - 2):
        trigrams.add(padded[i:i + 3])
    return trigrams


def trigram_similarity(s1: str, s2: str) -> float:
    """
    Calculates trigram similarity between two Arabic strings,
    mirroring PostgreSQL's similarity() function:
    similarity = |tri(s1) ∩ tri(s2)| / |tri(s1) ∪ tri(s2)|
    """
    t1 = get_trigrams(s1)
    t2 = get_trigrams(s2)
    if not t1 or not t2:
        return 0.0

    intersection = len(t1.intersection(t2))
    union = len(t1.union(t2))
    if union == 0:
        return 0.0

    return round(intersection / union, 4)


def best_window_trigram_similarity(query: str, target: str) -> float:
    """
    Computes maximum trigram similarity across sliding windows of target words.
    Handles matching short queries (e.g. 'ضرييبة الددخل') against full law titles
    ('قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته').
    Also evaluates form with definite articles stripped.
    """
    norm_q = normalize_arabic(query)
    norm_t = normalize_arabic(target)
    if not norm_q or not norm_t:
        return 0.0

    base_sim = trigram_similarity(norm_q, norm_t)
    q_words = norm_q.split()
    t_words = norm_t.split()
    if not q_words or not t_words:
        return base_sim

    w_len = len(q_words)
    best_sim = base_sim

    # 1. Slide window of length w_len, w_len+1, and w_len+2 over target title words
    for sz in (w_len, w_len + 1, min(w_len + 2, len(t_words))):
        for i in range(len(t_words) - sz + 1):
            window = " ".join(t_words[i:i + sz])
            sim = trigram_similarity(norm_q, window)
            if sim > best_sim:
                best_sim = sim

            # Also test with common prefixes stripped from both
            q_clean = " ".join(strip_common_prefixes(w) for w in q_words)
            w_clean = " ".join(strip_common_prefixes(w) for w in t_words[i:i + sz])
            sim_no_al = trigram_similarity(q_clean, w_clean)
            if sim_no_al > best_sim:
                best_sim = sim_no_al

    return best_sim


def score_legislation_match(
    query: str,
    law: dict,
    linked_excel_terms: Optional[List[str]] = None
) -> Tuple[float, str]:
    """
    Scores a single legislation record against a user query using strict ranked priority:
    1. Exact match on title (1.0)
    2. Exact match on number + year (0.98)
    3. Normalized exact match on title (0.95)
    4. Match via linked Excel popular/legislative terms (0.90 - 0.94)
    5. Substring / Prefix match on title (0.80 - 0.88)
    6. Token coverage (all query words present in title) (0.75 - 0.82)
    7. Sliding-window trigram similarity >= 0.35 (0.50 - 0.78)
    
    Returns (score, match_reason). If below threshold (0.35), returns (0.0, "").
    """
    raw_q = (query or "").strip()
    if not raw_q:
        return 0.0, ""

    norm_q = normalize_arabic(raw_q)
    if not norm_q:
        return 0.0, ""

    title = law.get("title") or law.get("name") or ""
    norm_title = normalize_arabic(title)
    law_num = law.get("number")
    law_year = law.get("year")
    summary = law.get("summary") or law.get("description") or ""
    norm_summary = normalize_arabic(summary)

    # 1. Exact match
    if raw_q.lower() == title.strip().lower():
        return 1.0, "تطابق تام مع اسم التشريع"

    # 2. Number + Year exact extraction match
    req_num, req_year = extract_search_numbers(raw_q)
    if req_num is not None and req_year is not None:
        if str(law_num) == str(req_num) and str(law_year) == str(req_year):
            return 0.98, f"تطابق تام برقم القانون ({req_num}) وسنته ({req_year})"

    # 3. Normalized exact match
    if norm_q == norm_title:
        return 0.95, "تطابق مع اسم التشريع بعد توحيد الإملاء"

    # 4. Excel-linked Terms Match (Popular or Legislative Term)
    if linked_excel_terms:
        for term in linked_excel_terms:
            norm_term = normalize_arabic(term)
            if norm_q == norm_term:
                return 0.93, f"مطابقة تامة عبر المصطلح: {term}"
            if norm_q in norm_term or norm_term in norm_q:
                return 0.88, f"مطابقة جزئية عبر المصطلح: {term}"
            sim = best_window_trigram_similarity(norm_q, norm_term)
            if sim >= 0.45:
                return round(0.70 + (sim * 0.22), 2), f"مطابقة تقريبية عبر المصطلح: {term}"

    # 5. Substring / Prefix match on Title
    if norm_q in norm_title:
        ratio = len(norm_q) / max(len(norm_title), 1)
        score = round(0.80 + (ratio * 0.12), 2)
        return min(score, 0.92), "تطابق جزئي ضمن اسم التشريع"

    if norm_title in norm_q:
        return 0.82, "تطابق اسم التشريع ضمن نص البحث"

    # 6. All or major query tokens present in title
    q_tokens = [t for t in norm_q.split() if len(t) > 1 and t not in ('قانون', 'رقم', 'لسنة', 'لعام')]
    if q_tokens:
        matched_tokens = []
        for t in q_tokens:
            t_base = strip_common_prefixes(t)
            if t in norm_title or t_base in norm_title or any(t_base in strip_common_prefixes(wt) for wt in norm_title.split()):
                matched_tokens.append(t)
        
        if len(matched_tokens) == len(q_tokens):
            return 0.80, "تطابق جميع كلمات البحث في اسم التشريع"
        elif len(matched_tokens) >= 1 and (len(matched_tokens) / len(q_tokens)) >= 0.5:
            return 0.65, "تطابق معظم كلمات البحث في اسم التشريع"

    # 7. Sliding-Window Trigram similarity on Title
    sim_title = best_window_trigram_similarity(norm_q, norm_title)
    if sim_title >= 0.35:
        score = round(0.40 + (sim_title * 0.5), 2)
        return score, "تطابق تقريبي بالتشابه الإملائي"

    # 8. Match in Summary (as secondary relevance)
    if norm_summary and norm_q in norm_summary:
        return 0.55, "تطابق ضمن ملخص موضوع التشريع"

    sim_summary = best_window_trigram_similarity(norm_q, norm_summary)
    if sim_summary >= 0.40:
        return 0.45, "تطابق تقريبي مع ملخص التشريع"

    return 0.0, ""

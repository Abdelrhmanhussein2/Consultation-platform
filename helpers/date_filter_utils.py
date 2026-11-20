# helpers/date_filter_utils.py
import re
import calendar
from datetime import date
from typing import Optional, Tuple, Dict, Any
from fastapi import HTTPException, status

ARABIC_TO_ENGLISH_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

def normalize_digits(s: str) -> str:
    if not s:
        return ""
    return str(s).translate(ARABIC_TO_ENGLISH_DIGITS).strip()

def parse_and_validate_date_param(val: Optional[str], param_name: str = "date") -> Optional[Tuple[date, date]]:
    """
    Validates a date parameter (date_from or date_to).
    Supported formats:
      - YYYY (e.g. 2024) -> (2024-01-01, 2024-12-31)
      - YYYY-MM (e.g. 2024-02) -> (2024-02-01, 2024-02-29)
      - YYYY-MM-DD (e.g. 2024-02-15) -> (2024-02-15, 2024-02-15)
      - DD-MM-YYYY (e.g. 15-02-2024) -> (2024-02-15, 2024-02-15)

    Throws HTTPException(400) on invalid calendar date or syntax.
    Returns (min_date, max_date) representing the range spanned by this parameter.
    """
    if not val or not str(val).strip():
        return None

    clean = normalize_digits(str(val))
    # Remove surrounding quotes or spaces
    clean = clean.strip("'\" \t\r\n")

    # 1. Full Date: YYYY-MM-DD
    m_iso = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", clean)
    if m_iso:
        y, m, d = int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3))
        _validate_calendar(y, m, d, param_name)
        d_val = date(y, m, d)
        return (d_val, d_val)

    # 2. Full Date: DD-MM-YYYY
    m_dmy = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})$", clean)
    if m_dmy:
        d, m, y = int(m_dmy.group(1)), int(m_dmy.group(2)), int(m_dmy.group(3))
        _validate_calendar(y, m, d, param_name)
        d_val = date(y, m, d)
        return (d_val, d_val)

    # 3. Year-Month: YYYY-MM
    m_ym = re.match(r"^(\d{4})-(\d{1,2})$", clean)
    if m_ym:
        y, m = int(m_ym.group(1)), int(m_ym.group(2))
        _validate_month(y, m, param_name)
        last_day = calendar.monthrange(y, m)[1]
        return (date(y, m, 1), date(y, m, last_day))

    # 4. Year only: YYYY
    m_y = re.match(r"^(\d{4})$", clean)
    if m_y:
        y = int(m_y.group(1))
        if y < 1900 or y > 2100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"قيمة السنة في {param_name} غير مقبولة ({y}). يجب أن تكون بين 1900 و 2100."
            )
        return (date(y, 1, 1), date(y, 12, 31))

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"صيغة التاريخ في {param_name} غير صحيحة ({val}). الصيغ المدعومة: YYYY، YYYY-MM، YYYY-MM-DD."
    )

def _validate_month(y: int, m: int, param_name: str):
    if y < 1900 or y > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"قيمة السنة في {param_name} غير مقبولة ({y})."
        )
    if m < 1 or m > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"قيمة الشهر في {param_name} غير صحيحة ({m}). يجب أن تكون بين 1 و 12."
        )

def _validate_calendar(y: int, m: int, d: int, param_name: str):
    _validate_month(y, m, param_name)
    max_d = calendar.monthrange(y, m)[1]
    if d < 1 or d > max_d:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"قيمة اليوم في {param_name} غير صالحة ({d}) لشهر {m}/{y}. الحد الأقصى هو {max_d}."
        )

def parse_db_date(val: Any) -> Optional[date]:
    """
    Parses date strings stored in DB (Neo4j/PostgreSQL/Qdrant) into a date object.
    Supports DD-MM-YYYY, YYYY-MM-DD, YYYY.
    Ignores non-date values like '—', 'لا ينطبق (نص أصلي)', 'None'.
    """
    if not val:
        return None
    s = normalize_digits(str(val)).strip()
    if not s or s in ("—", "-", "لا ينطبق", "لا ينطبق (نص أصلي)", "none", "null"):
        return None

    # YYYY-MM-DD
    m_iso = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})", s)
    if m_iso:
        try:
            return date(int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3)))
        except ValueError:
            pass

    # DD-MM-YYYY
    m_dmy = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})", s)
    if m_dmy:
        try:
            return date(int(m_dmy.group(3)), int(m_dmy.group(2)), int(m_dmy.group(1)))
        except ValueError:
            pass

    # YYYY
    m_y = re.match(r"^(\d{4})$", s)
    if m_y:
        try:
            return date(int(m_y.group(1)), 1, 1)
        except ValueError:
            pass

    return None

def extract_law_effective_date(law: Dict[str, Any]) -> Optional[date]:
    """
    Applies the logical COALESCE:
    1. amended_date (تاريخ_آخر_تعديل) if present and valid.
    2. fallback to issue_date (تاريخ_الصدور).
    Returns None if neither exists/valid.
    """
    amended_raw = law.get("amended_date") or law.get("تاريخ_آخر_تعديل")
    amended_d = parse_db_date(amended_raw)
    if amended_d:
        return amended_d

    issue_raw = law.get("issue_date") or law.get("تاريخ_الصدور") or law.get("تاريخ_النشر")
    issue_d = parse_db_date(issue_raw)
    if issue_d:
        return issue_d

    return None

def extract_judgment_effective_date(judgment: Dict[str, Any]) -> Optional[date]:
    """
    Judgments date:
    coalesce(j.date, j.decision_date, j.ruling_date, j.تاريخ_الفصل)
    """
    for key in ("date", "decision_date", "ruling_date", "تاريخ_الفصل", "تاريخ_القرار"):
        val = judgment.get(key)
        d = parse_db_date(val)
        if d:
            return d
    return None

def matches_date_filter(
    effective_date: Optional[date],
    date_from_range: Optional[Tuple[date, date]],
    date_to_range: Optional[Tuple[date, date]]
) -> bool:
    """
    Returns True if effective_date matches the active date filters.
    If date filters are active and effective_date is None, returns False.
    """
    if date_from_range is None and date_to_range is None:
        return True

    if effective_date is None:
        return False

    if date_from_range:
        # Lower bound is the start of the from-range
        min_date = date_from_range[0]
        if effective_date < min_date:
            return False

    if date_to_range:
        # Upper bound is the end of the to-range (e.g. end of year or end of month)
        max_date = date_to_range[1]
        if effective_date > max_date:
            return False

    return True

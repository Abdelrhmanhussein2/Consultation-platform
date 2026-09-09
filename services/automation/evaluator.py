from typing import Any, Dict, Optional

# Whitelist of allowed field paths in context to prevent unsafe inspection
ALLOWED_FIELD_PATHS = {
    "rating.score",
    "rating.stars",
    "ticket.priority",
    "ticket.wait_time_hours",
    "ticket.status",
    "payment.amount",
    "payment.status",
    "consultant.rating_avg",
    "consultant.cancellation_rate",
    "session.status",
}

def extract_field_value(context: Dict[str, Any], field_path: str) -> Optional[Any]:
    """Safely extracts nested field value from context dictionary using path notation e.g. 'rating.score'."""
    if not field_path or field_path not in ALLOWED_FIELD_PATHS:
        return None
    
    parts = field_path.split(".")
    curr = context
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr

def evaluate_condition(rule, context: Dict[str, Any]) -> bool:
    """
    Evaluates rule condition against given context.
    Operators supported: 'always', 'lte', 'gte', 'eq', 'contains'
    No dynamic code execution (eval) used.
    """
    op = (rule.condition_op or "always").lower().strip()
    if op == "always":
        return True

    if not rule.condition_field:
        return True

    val = extract_field_value(context, rule.condition_field)
    if val is None:
        return False

    target_val = rule.condition_value
    if target_val is None:
        return False

    try:
        if op == "lte":
            return float(val) <= float(target_val)
        elif op == "gte":
            return float(val) >= float(target_val)
        elif op == "eq":
            return str(val).strip() == str(target_val).strip()
        elif op == "contains":
            return str(target_val).lower() in str(val).lower()
    except (ValueError, TypeError):
        return False

    return False

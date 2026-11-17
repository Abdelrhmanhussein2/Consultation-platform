import re
import io
import csv
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    import openpyxl
except ImportError:
    openpyxl = None

from models.users.tax_entity import TaxEntity
from models.admin.admin_action_log import AdminActionLog

CANONICAL_MAP = {
    "سفارات": "سفارات وقنصليات", "سفارة": "سفارات وقنصليات", "قنصلية": "سفارات وقنصليات", "ملحقية": "سفارات وقنصليات",
    "وزارة": "وزارات ومؤسسات حكومية", "مؤسسة": "وزارات ومؤسسات حكومية", "دائرة": "وزارات ومؤسسات حكومية",
    "هيئة": "هيئات ومجالس مستقلة", "مجلس": "هيئات ومجالس مستقلة", "سلطة": "هيئات ومجالس مستقلة",
    "جامعة": "جامعات وكليات", "كلية": "جامعات وكليات",
    "بلدية": "بلديات وأمانات", "أمانة": "بلديات وأمانات",
    "نقابة": "نقابات واتحادات", "اتحاد": "نقابات واتحادات", "جمعية": "نقابات واتحادات",
    "منظمة": "منظمات ووكالات دولية", "وكالة": "منظمات ووكالات دولية", "أمم": "منظمات ووكالات دولية",
    "أوقاف": "أوقاف ولجان زكاة", "زكاة": "أوقاف ولجان زكاة",
    "شركة": "شركات مملوكة للحكومة"
}

def normalize_arabic(text: Optional[str]) -> str:
    if not text:
        return ""
    s = str(text).strip()
    s = re.sub(r"[\u064B-\u065F\u0670\u0640]", "", s)
    s = re.sub(r"[أإآ]", "ا", s)
    s = re.sub(r"ى", "ي", s)
    s = re.sub(r"ة", "ه", s)
    return s.lower()

def clean_tax_number(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, float):
        val = f"{int(val)}"
    s = str(val).strip()
    indic_digits = "٠١٢٣٤٥٦٧٨٩"
    for i, d in enumerate(indic_digits):
        s = s.replace(d, str(i))
    s = re.sub(r"[^\d]", "", s)
    return s

def canonicalize_type(raw_type: str) -> str:
    raw = (raw_type or "").strip()
    for kw, canon in CANONICAL_MAP.items():
        if kw in raw:
            return canon
    return raw if raw else "جهات أخرى"

def _parse_xlsx_stdlib(content: bytes) -> List[List[str]]:
    rows = []
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
            ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
            for elem in tree.findall(f".//{ns}si"):
                shared.append("".join(t.text or "" for t in elem.findall(f".//{ns}t")))
        sheet = next((n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")), None)
        if not sheet:
            return []
        tree = ET.fromstring(z.read(sheet))
        ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
        for row in tree.findall(f".//{ns}row"):
            r_vals = []
            for c in row.findall(f".//{ns}c"):
                t = c.get("t")
                v = c.find(f"{ns}v")
                val = ""
                if v is not None and v.text:
                    if t == "s" and v.text.isdigit() and int(v.text) < len(shared):
                        val = shared[int(v.text)]
                    else:
                        val = v.text
                elif t == "inlineStr":
                    t_node = c.find(f".//{ns}t")
                    val = t_node.text if (t_node is not None and t_node.text) else ""
                r_vals.append(val)
            if any(r_vals):
                rows.append(r_vals)
    return rows

def merge_names(existing_name: str, new_name: str) -> str:
    """
    دمج اسمين لمكلفين يشتركان في نفس الرقم الضريبي بدون تكرار الأجزاء المتطابقة.
    مثال: "مشروع حماية" و "DAI GLOBAL LLC - مشروع حماية USAID"
    أو "شركة الأمل" و "فرع العقبة" -> "شركة الأمل / فرع العقبة"
    """
    if not existing_name:
        return (new_name or "").strip()
    if not new_name:
        return (existing_name or "").strip()

    e_clean = existing_name.strip()
    n_clean = new_name.strip()

    norm1 = normalize_arabic(e_clean)
    norm2 = normalize_arabic(n_clean)

    if norm1 == norm2:
        return e_clean
    if norm2 in norm1:
        return e_clean
    if norm1 in norm2:
        return n_clean

    # Divide by "/" and ensure no duplicate segments
    parts = [p.strip() for p in e_clean.split("/") if p.strip()]
    if not any(normalize_arabic(p) == norm2 for p in parts):
        parts.append(n_clean)
    return " / ".join(parts)

def parse_tax_file(content: bytes, filename: str) -> Tuple[List[Dict[str, str]], List[str]]:
    records = []
    errors = []
    fname = filename.lower()
    if fname.endswith(('.xlsx', '.xlsm')):
        if openpyxl is not None:
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
        else:
            rows = _parse_xlsx_stdlib(content)
        if not rows:
            return [], ["الملف فارغ"]
        headers = [str(c or "").strip() for c in rows[0]]
        col_type = next((i for i, h in enumerate(headers) if "نوع" in h or "type" in h.lower()), 0)
        col_name = next((i for i, h in enumerate(headers) if "اسم" in h or "جهة" in h or "name" in h.lower()), 1)
        col_tax = next((i for i, h in enumerate(headers) if "ضريب" in h or "رقم" in h or "tax" in h.lower()), 2)
        for r_idx, row in enumerate(rows[1:], start=2):
            if not row or not any(row):
                continue
            t_val = str(row[col_type] or "").strip() if col_type < len(row) else ""
            n_val = str(row[col_name] or "").strip() if col_name < len(row) else ""
            x_val = clean_tax_number(row[col_tax] if col_tax < len(row) else "")
            if not n_val or not x_val:
                continue
            records.append({"entity_type": canonicalize_type(t_val), "name": n_val, "tax_number": x_val})
    else:
        for enc in ("utf-8-sig", "utf-8", "cp1256"):
            try:
                reader = csv.reader(io.StringIO(content.decode(enc)))
                rows = list(reader)
                if not rows:
                    continue
                headers = [h.strip() for h in rows[0]]
                col_type = next((i for i, h in enumerate(headers) if "نوع" in h or "type" in h.lower()), 0)
                col_name = next((i for i, h in enumerate(headers) if "اسم" in h or "جهة" in h or "name" in h.lower()), 1)
                col_tax = next((i for i, h in enumerate(headers) if "ضريب" in h or "رقم" in h or "tax" in h.lower()), 2)
                for row in rows[1:]:
                    if not row or not any(row):
                        continue
                    t_val = row[col_type].strip() if col_type < len(row) else ""
                    n_val = row[col_name].strip() if col_name < len(row) else ""
                    x_val = clean_tax_number(row[col_tax] if col_tax < len(row) else "")
                    if not n_val or not x_val:
                        continue
                    records.append({"entity_type": canonicalize_type(t_val), "name": n_val, "tax_number": x_val})
                break
            except Exception:
                continue

    # Deduplicate exact duplicates within the file itself, but preserve different names for same tax number
    unique_rows = []
    seen_exact = set()
    for r in records:
        key = (normalize_arabic(r["name"]), r["tax_number"])
        if key not in seen_exact:
            seen_exact.add(key)
            unique_rows.append(r)
    return unique_rows, errors

def run_dry_run(db: Session, records: List[Dict[str, str]]) -> Dict[str, Any]:
    existing_entities = db.query(TaxEntity).filter(TaxEntity.is_active == True).all()
    existing_by_tax = {e.tax_number: e for e in existing_entities}
    existing_by_name = {e.name_normalized: e for e in existing_entities}

    # Tracking within current batch to handle multi-row duplicate occurrences in the file itself
    batch_seen_tax: Dict[str, Dict[str, str]] = {}
    batch_seen_name: Dict[str, Dict[str, str]] = {}

    inserted_count = 0
    merged_count = 0          # Tax number matches / similarities
    duplicate_name_count = 0  # Name matches / similarities
    exact_duplicates_count = 0
    samples = []

    for r in records:
        tax = r["tax_number"]
        name = r["name"].strip()
        norm_name = normalize_arabic(name)

        cur_tax = existing_by_tax.get(tax)
        cur_name = existing_by_name.get(norm_name)
        in_batch_tax = batch_seen_tax.get(tax)
        in_batch_name = batch_seen_name.get(norm_name)

        has_tax_match = bool(cur_tax or in_batch_tax)
        has_name_match = bool(cur_name or in_batch_name or (cur_tax and normalize_arabic(cur_tax.name) == norm_name))

        if has_tax_match:
            merged_count += 1

        if has_name_match:
            duplicate_name_count += 1

        # 1. Exact Duplicate (same name AND same tax) -> Skip
        if (cur_tax and normalize_arabic(cur_tax.name) == norm_name) or (in_batch_tax and normalize_arabic(in_batch_tax["name"]) == norm_name):
            exact_duplicates_count += 1
            if len(samples) < 40:
                samples.append({
                    **r,
                    "action": "skip",
                    "reason": "مكرر بالكامل (الاسم والرقم الضريبي مسجلان مسبقاً)",
                    "existing_name": cur_tax.name if cur_tax else in_batch_tax["name"],
                    "existing_tax": tax
                })
        # 2. Same Tax Number, different name -> Candidate to merge / put together
        elif has_tax_match:
            target_name = cur_tax.name if cur_tax else in_batch_tax["name"]
            suggested = merge_names(target_name, name)
            if len(samples) < 40:
                samples.append({
                    **r,
                    "action": "merge",
                    "reason": "تشابه في الرقم الضريبي (سيتم وضع الاسمين معاً ودمج السجلين)",
                    "existing_name": target_name,
                    "existing_tax": tax,
                    "suggested_merged_name": suggested
                })
            # update batch merged tracking
            if in_batch_tax:
                batch_seen_tax[tax]["name"] = suggested
        # 3. Same Name, different tax number -> duplicate by name warning
        elif has_name_match:
            target_tax = cur_name.tax_number if cur_name else in_batch_name["tax_number"]
            if len(samples) < 40:
                samples.append({
                    **r,
                    "action": "duplicate_name",
                    "reason": "مكلف مسجل مسبقاً بنفس الاسم برقم ضريبي مختلف",
                    "existing_name": name,
                    "existing_tax": target_tax
                })
            batch_seen_tax[tax] = r
            batch_seen_name[norm_name] = r
        # 4. Completely New
        else:
            inserted_count += 1
            batch_seen_tax[tax] = r
            batch_seen_name[norm_name] = r
            if len(samples) < 40:
                samples.append({
                    **r,
                    "action": "insert",
                    "reason": "جهة جديدة تماماً",
                    "diff": None
                })

    return {
        "total_parsed": len(records),
        "valid_count": len(records),
        "inserted_count": inserted_count,
        "merged_count": merged_count,
        "duplicate_name_count": duplicate_name_count,
        "exact_duplicates_count": exact_duplicates_count,
        "conflicts_count": merged_count + duplicate_name_count,
        "samples": samples,
        "errors": []
    }

def commit_import(
    db: Session,
    records: List[Dict[str, str]],
    user_id: Any,
    merge_same_tax: bool = True,
    skip_duplicates: bool = True
) -> Dict[str, Any]:
    existing_entities = db.query(TaxEntity).filter(TaxEntity.is_active == True).all()
    existing_by_tax = {e.tax_number: e for e in existing_entities}
    existing_by_name = {e.name_normalized: e for e in existing_entities}

    ins_cnt = 0
    merge_cnt = 0
    skip_cnt = 0

    for r in records:
        tax = r["tax_number"]
        name = r["name"].strip()
        norm_name = normalize_arabic(name)

        cur_tax = existing_by_tax.get(tax)
        cur_name = existing_by_name.get(norm_name)

        # 1. Exact Duplicate
        if cur_tax and normalize_arabic(cur_tax.name) == norm_name:
            skip_cnt += 1
            continue

        # 2. Same Tax Number -> Merge together
        if cur_tax:
            if merge_same_tax:
                new_name = merge_names(cur_tax.name, name)
                if new_name != cur_tax.name:
                    cur_tax.name = new_name
                    cur_tax.name_normalized = normalize_arabic(new_name)
                    cur_tax.updated_by = user_id
                    merge_cnt += 1
                else:
                    skip_cnt += 1
            else:
                skip_cnt += 1
            continue

        # 3. Same Name exists with different tax number
        if cur_name and skip_duplicates:
            skip_cnt += 1
            continue

        # 4. Insert new entity
        new_entity = TaxEntity(
            name=name,
            name_normalized=norm_name,
            tax_number=tax,
            entity_type=r.get("entity_type", "جهات أخرى"),
            created_by=user_id,
            updated_by=user_id
        )
        db.add(new_entity)
        existing_by_tax[tax] = new_entity
        existing_by_name[norm_name] = new_entity
        ins_cnt += 1

    db.commit()
    return {
        "success": True,
        "inserted": ins_cnt,
        "merged": merge_cnt,
        "skipped": skip_cnt,
        "updated": merge_cnt,
        "total_processed": len(records)
    }

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
    deduped = {}
    for r in records:
        deduped[r["tax_number"]] = r
    return list(deduped.values()), errors

def run_dry_run(db: Session, records: List[Dict[str, str]]) -> Dict[str, Any]:
    existing = {e.tax_number: e for e in db.query(TaxEntity).filter(TaxEntity.is_active == True).all()}
    inserted, updated, conflicts = 0, 0, 0
    samples = []
    for r in records:
        cur = existing.get(r["tax_number"])
        if not cur:
            inserted += 1
            if len(samples) < 20:
                samples.append({**r, "action": "insert", "diff": None})
        else:
            diff = {}
            if cur.name != r["name"]:
                diff["name"] = {"old": cur.name, "new": r["name"]}
            if cur.entity_type != r["entity_type"]:
                diff["entity_type"] = {"old": cur.entity_type, "new": r["entity_type"]}
            if diff:
                updated += 1
                if len(samples) < 20:
                    samples.append({**r, "action": "update", "diff": diff})
            else:
                if len(samples) < 20:
                    samples.append({**r, "action": "skip", "diff": None})
    return {
        "total_parsed": len(records), "valid_count": len(records),
        "inserted_count": inserted, "updated_count": updated, "conflicts_count": conflicts,
        "samples": samples, "errors": []
    }

def commit_import(db: Session, records: List[Dict[str, str]], user_id: Any) -> Dict[str, Any]:
    existing = {e.tax_number: e for e in db.query(TaxEntity).filter(TaxEntity.is_active == True).all()}
    ins_cnt, upd_cnt = 0, 0
    for r in records:
        cur = existing.get(r["tax_number"])
        if cur:
            changed = False
            if cur.name != r["name"]:
                cur.name = r["name"]
                cur.name_normalized = normalize_arabic(r["name"])
                changed = True
            if cur.entity_type != r["entity_type"]:
                cur.entity_type = r["entity_type"]
                changed = True
            if changed:
                cur.updated_by = user_id
                upd_cnt += 1
        else:
            db.add(TaxEntity(
                name=r["name"],
                name_normalized=normalize_arabic(r["name"]),
                tax_number=r["tax_number"],
                entity_type=r["entity_type"],
                created_by=user_id,
                updated_by=user_id
            ))
            ins_cnt += 1
    db.commit()
    return {"success": True, "inserted": ins_cnt, "updated": upd_cnt, "total_processed": len(records)}

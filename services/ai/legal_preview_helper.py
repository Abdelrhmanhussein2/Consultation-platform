import io
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import Any, Dict


def extract_law_metadata(full_text: str) -> Dict[str, Any]:
    """Extracts official metadata headers from Arabic legislative texts."""
    meta_patterns = {
        "gazette": r"الجريدة\s*[:\-]\s*([^\n\r]+)",
        "number": r"الرقم\s*[:\-]\s*([^\n\r]+)",
        "year": r"السنة\s*[:\-]\s*([^\n\r]+)",
        "replaced_law": r"حل\s+محل\s*[:\-]\s*([^\n\r]+)",
        "issue_date": r"تاريخ\s+الصدور\s*[:\-]\s*([^\n\r]+)",
        "effective_date": r"تاريخ\s+السريان\s*[:\-]\s*([^\n\r]+)",
        "subject": r"الموضوع\s*[:\-]\s*([^\n\r]+)",
    }
    metadata = {}
    sample = full_text[:3500] if full_text else ""
    for k, pat in meta_patterns.items():
        m = re.search(pat, sample)
        if m:
            metadata[k] = m.group(1).strip()
    return metadata


def extract_file_preview(file_bytes: bytes, filename: str, source_type: str = "law") -> Dict[str, Any]:
    """Extracts metadata and full text preview from DOCX or TXT legal files."""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    full_text = ""
    if ext in ('docx', 'doc'):
        try:
            import docx
            d = docx.Document(io.BytesIO(file_bytes))
            parts = [p.text for p in d.paragraphs if p.text.strip()]
            for t in d.tables:
                for row in t.rows:
                    parts.extend([c.text.strip() for c in row.cells if c.text.strip()])
            full_text = "\n".join(parts)
        except Exception:
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                    tree = ET.fromstring(z.read('word/document.xml'))
                    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                    p_list = [''.join([n.text or '' for n in p.iter(f'{ns}t')]).strip() for p in tree.iter(f'{ns}p')]
                    full_text = "\n".join([x for x in p_list if x])
            except Exception as e:
                full_text = f"تعذر قراءة DOCX: {e}"
    else:
        try:
            full_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            full_text = ""

    clean_name = re.sub(r'\.[^.]+$', '', filename).replace('_', ' ').strip()
    clean_name = re.sub(r'\s*—\s*كما صدر', '', clean_name)
    clean_name = re.sub(r'\s*-\s*كما صدر', '', clean_name)
    clean_name = re.sub(r'\s+كما صدر', '', clean_name).strip()
    data: Dict[str, Any] = {"title": clean_name, "year": 2024, "tags": "", "full_text": full_text}
    yr_m = (
        re.search(r'(?:لسنة|عام|سنة)[_\s]*(\d{4})', filename)
        or re.search(r'\b(19\d{2}|20\d{2})\b', filename)
        or re.search(r'(?:لسنة|عام|سنة)[_\s]*(\d{4})', full_text[:1500])
    )
    if yr_m:
        data["year"] = int(yr_m.group(1))

    if source_type == "judgment":
        data["principle"] = full_text
        court = "cassation_rights"
        if "إدارية" in filename or "الإدارية العليا" in full_text[:1500]:
            court = "admin_supreme"
        elif "جزاء" in filename or "الجزائية" in full_text[:1500]:
            court = "cassation_penal"
        elif "بداية" in filename or "البداية الضريبية" in full_text[:1500]:
            court = "tax_first_instance"
        elif "استئناف" in filename or "الاستئناف الضريبية" in full_text[:1500]:
            court = "tax_appeal"
        data["court"] = court
        c_num = re.search(r'(?:رقم|الحكم رقم|قرار رقم)[_\s]*(\d+)', filename)
        data["case_number"] = f"{c_num.group(1) if c_num else '1'}/{data['year']}"
        dispute = re.findall(r'(?:المادة|مادة)[_\s]*\(?(\d+)\)?', full_text[:3000])
        sorted_d = sorted(list(set(dispute)), key=lambda x: int(x) if x.isdigit() else 999)
        data["dispute_item"] = f"المادة {sorted_d[0]} - قانون ضريبة الدخل" if sorted_d else "مادة 3 - قانون ضريبة الدخل"
        data["tags"] = f"أحكام قضائية، {'جزاء' if 'penal' in court else 'حقوق'}، ضرائب"
    else:
        data["body"] = full_text
        meta = extract_law_metadata(full_text)
        data.update(meta)
        law_num = meta.get("number")
        if not law_num:
            c_code = re.search(r'رقم[_\s]*(\d+)', filename)
            law_num = c_code.group(1) if c_code else '1'
        if meta.get("year"):
            try:
                data["year"] = int(re.search(r'\d{4}', str(meta["year"])).group(0))
            except Exception:
                pass
        data["code"] = f"{law_num}/{data['year']}"
        data["tags"] = meta.get("subject") or "تشريع، ضرائب، ضريبة الدخل"

    from services.ai.legal_duplicate_helper import check_file_duplicate
    dup = check_file_duplicate(file_bytes, filename, source_type)
    data["is_duplicate"] = dup.get("is_duplicate", False)
    data["file_hash"] = dup.get("file_hash", "")
    if dup.get("is_duplicate"):
        data["duplicate_message"] = dup.get("message", "")
        data["existing_title"] = dup.get("existing_title", "")

    return {"status": "success", "data": data}


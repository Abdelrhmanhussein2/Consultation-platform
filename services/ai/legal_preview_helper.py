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


def extract_law_preamble(full_text: str) -> str:
    """
    Dynamically extracts the document description/preamble from any legal text:
    The narrative text / short title citation located after 'الموضوع' up to definition notes or Article 1.
    """
    if not full_text:
        return ""

    art1_match = re.search(r'(?:(?:\r?\n)+\s*المادة\s*\(?0?1\)?|\bالمادة\s+الأولى\b)', full_text)
    if not art1_match:
        art1_match = re.search(r'(?:(?:\r?\n)+\s*المادة\s*\(?\d+\)?)', full_text)

    pre_article_text = full_text[:art1_match.start()] if art1_match else full_text[:3500]

    m_subj = re.search(r'(?:الموضوع\s*[:\-]?)(.*)', pre_article_text, flags=re.DOTALL)
    candidate_section = m_subj.group(1) if m_subj else pre_article_text

    lines = [line.strip() for line in candidate_section.splitlines() if line.strip()]
    preamble_lines = []
    in_bullets = bool(m_subj)

    metadata_prefixes = (
        'الجريدة:', 'الرقم:', 'السنة:', 'حل محل:', 'يحل محل:', 'تاريخ الصدور:',
        'تاريخ الإصدار:', 'تاريخ السريان:', 'تاريخ النفاذ:', 'تاريخ آخر تعديل:',
        'آخر تعديل:', 'عدد المواد:', 'عدد التعديلات:', 'المعلومات', 'الموضوع:'
    )

    for line in lines:
        clean = re.sub(r'^[•\-\*\.]\s*', '', line).strip()
        if any(clean.startswith(p) for p in metadata_prefixes):
            continue
        if in_bullets:
            if len(clean) < 45 and not clean.startswith(('قانون', 'يقصد', 'المشار', 'نحن', 'بمقتضى', 'صدر', 'بناء', 'قرر', 'مرسوم', 'إعلان')):
                continue
            in_bullets = False

        # Stop before explanatory definition notes (e.g. يقصد بقانون / يقصد بهذا القانون)
        if clean.startswith(('يقصد ب', 'يقصد بالقانون', 'يقصد بهذا')):
            break

        preamble_lines.append(clean)

        # The short-title clause marks the end of the official publication preamble
        if 'بالاسم المختصر' in clean:
            break

    return "\n\n".join(preamble_lines).strip()


def extract_file_preview(file_bytes: bytes, filename: str, source_type: str = "law") -> Dict[str, Any]:
    """Extracts metadata and full text preview from DOCX or TXT legal files."""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    full_text = ""
    highlighted_paragraphs = []
    if ext in ('docx', 'doc'):
        try:
            import docx
            d = docx.Document(io.BytesIO(file_bytes))
            parts = []
            seen_first_article = False
            for p in d.paragraphs:
                txt = p.text.strip()
                if txt:
                    parts.append(txt)
                    if not seen_first_article and any(txt.startswith(x) for x in ('المادة 1', 'المادة (1)', 'المادة 01', 'المادة الأولى')):
                        seen_first_article = True
                    if not seen_first_article and any(r.font.highlight_color is not None for r in p.runs):
                        highlighted_paragraphs.append(txt)
            for t in d.tables:
                for row in t.rows:
                    parts.extend([c.text.strip() for c in row.cells if c.text.strip()])
            full_text = "\n".join(parts)
        except Exception:
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                    tree = ET.fromstring(z.read('word/document.xml'))
                    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                    parts = []
                    seen_first_article = False
                    for p in tree.iter(f'{ns}p'):
                        txt = ''.join([n.text or '' for n in p.iter(f'{ns}t')]).strip()
                        if txt:
                            parts.append(txt)
                            if not seen_first_article and any(txt.startswith(x) for x in ('المادة 1', 'المادة (1)', 'المادة 01', 'المادة الأولى')):
                                seen_first_article = True
                            if not seen_first_article and p.find(f'.//{ns}highlight') is not None:
                                highlighted_paragraphs.append(txt)
                    full_text = "\n".join(parts)
            except Exception as e:
                full_text = f"تعذر قراءة DOCX: {e}"
    else:
        try:
            full_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            full_text = ""

    clean_name = re.sub(r'\.[^.]+$', '', filename).replace('_', ' ').strip()
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
        if highlighted_paragraphs:
            data["preamble"] = "\n\n".join(highlighted_paragraphs).strip()
        else:
            data["preamble"] = extract_law_preamble(full_text)
        data["description"] = data["preamble"]
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


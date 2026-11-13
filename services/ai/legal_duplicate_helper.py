import hashlib
import re
from typing import Dict, Any
from helpers.neo4j_db import neo4j_db


def calculate_file_hash(file_bytes: bytes) -> str:
    """Calculates SHA-256 hash of file bytes."""
    return hashlib.sha256(file_bytes).hexdigest() if file_bytes else ""


def check_file_duplicate(file_bytes: bytes, filename: str, source_type: str = "law") -> Dict[str, Any]:
    """
    Checks if a legal file (law or judgment) already exists by comparing:
    1. File content SHA-256 hash
    2. File name (with and without extension)
    3. Document title
    """
    file_hash = calculate_file_hash(file_bytes)
    clean_name = (filename or "").strip()
    base_name = re.sub(r'\.[^.]+$', '', clean_name).strip()
    clean_no_ext = re.sub(r'[\s_]+', ' ', base_name).strip()

    query = """
    MATCH (n)
    WHERE (
        ($source_type = 'law' AND (n:Law OR n:`قانون`))
        OR
        ($source_type = 'judgment' AND (n:Judgment OR n:JudicialRuling OR n:`حكم_قضائي`))
    )
    AND (
        (n.file_hash IS NOT NULL AND n.file_hash = $file_hash)
        OR (n.`هاش_الملف` IS NOT NULL AND n.`هاش_الملف` = $file_hash)
        OR (n.file_name IS NOT NULL AND (n.file_name = $clean_name OR n.file_name = $base_name))
        OR (n.`اسم_الملف` IS NOT NULL AND (n.`اسم_الملف` = $clean_name OR n.`اسم_الملف` = $base_name))
        OR (size($clean_no_ext) > 5 AND (
            n.file_name = $clean_no_ext
            OR n.`اسم_الملف` = $clean_no_ext
            OR n.title = $clean_no_ext
            OR n.`العنوان` = $clean_no_ext
        ))
    )
    RETURN coalesce(n.title, n.`العنوان`, n.name, '') as title,
           coalesce(n.file_name, n.`اسم_الملف`, '') as file_name,
           coalesce(n.file_hash, n.`هاش_الملف`, '') as file_hash,
           coalesce(n.law_id, n.ruling_id, n.`معرف`, '') as id
    LIMIT 1
    """
    try:
        with neo4j_db.get_session() as session:
            rec = session.run(
                query,
                source_type=source_type,
                file_hash=file_hash,
                clean_name=clean_name,
                base_name=base_name,
                clean_no_ext=clean_no_ext
            ).single()

            if not rec:
                return {"is_duplicate": False, "file_hash": file_hash}

            m_title = rec["title"] or ""
            m_fname = rec["file_name"] or ""
            m_hash = rec["file_hash"] or ""

            if m_hash and m_hash == file_hash and m_fname and (clean_name in m_fname or m_fname in clean_name):
                msg = "هذا الملف موجود بالفعل في المنصة."
            elif m_fname and (clean_name in m_fname or m_fname in clean_name or base_name in m_fname):
                msg = "يوجد ملف مسجل مسبقاً بنفس الاسم."
            elif m_hash and m_hash == file_hash:
                msg = "محتوى هذا الملف مسجل بالفعل في المنصة."
            else:
                msg = "هذا القانون موجود بالفعل في المنصة." if source_type == "law" else "هذا الحكم القضائي موجود بالفعل في المنصة."

            return {
                "is_duplicate": True,
                "message": msg,
                "existing_title": m_title,
                "existing_id": rec["id"],
                "file_hash": file_hash
            }
    except Exception:
        return {"is_duplicate": False, "file_hash": file_hash}


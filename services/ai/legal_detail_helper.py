from typing import Any, Dict, Optional
from helpers.neo4j_db import neo4j_db


def get_source_detail(source_id: str, source_type: str = "law") -> Optional[Dict[str, Any]]:
    """Fetches full details and body for a law or judgment, reconstructing articles if needed."""
    with neo4j_db.get_session() as session:
        if source_type == "judgment":
            rec = session.run("""
                MATCH (j) WHERE (j:Judgment OR j:JudicialRuling OR j:`حكم_قضائي`) AND (j.ruling_id = $sid OR j.`معرف` = $sid)
                RETURN 'judgment' as source_type, coalesce(j.ruling_id, j.`معرف`) as id,
                       coalesce(j.title, j.`العنوان`, 'حكم قضائي') as title,
                       coalesce(j.ruling_number, j.`رقم_الحكم`, j.case_number, '-') as number,
                       coalesce(j.ruling_year, j.`السنة`, '-') as year,
                       coalesce(j.court, j.`المحكمة`, '') as court,
                       coalesce(j.is_active, true) as is_active,
                       coalesce(j.full_text, j.`نص_الحكم`, j.`مقتطف_الحكم`, '') as body
                LIMIT 1
            """, sid=source_id).single()
            return dict(rec) if rec else None

        rec = session.run("""
            MATCH (l) WHERE (l:Law OR l:`قانون`) AND (l.law_id = $sid OR l.`معرف` = $sid)
            RETURN 'law' as source_type, coalesce(l.law_id, l.`معرف`) as id,
                   coalesce(l.title, l.law_title, l.`العنوان`, l.`name`, 'قانون') as title,
                   coalesce(l.number, l.law_number, l.`رقم_القانون`, '-') as number,
                   coalesce(l.year, l.law_year, l.`السنة`, '-') as year,
                   null as court, coalesce(l.is_active, true) as is_active,
                   coalesce(l.body, l.full_text, '') as body
            LIMIT 1
        """, sid=source_id).single()
        if not rec:
            return None
        data = dict(rec)
        if not (data.get("body") or "").strip():
            from services.ai.legal_graph_service import LegalGraphService
            tree = LegalGraphService.get_law_version_tree(source_id)
            if tree and tree.get("articles"):
                parts = []
                for art in tree["articles"]:
                    head = art.get("title") or f"المادة {art.get('number', '')}"
                    txt = (art.get("text") or "").strip()
                    parts.append(f"{head}\n{txt}" if txt else head)
                    for p in art.get("paragraphs", []):
                        if p.get("text"):
                            parts.append(p["text"].strip())
                        for it in p.get("items", []):
                            if it.get("text"):
                                parts.append(it["text"].strip())
                data["body"] = "\n\n".join(parts)
        return data


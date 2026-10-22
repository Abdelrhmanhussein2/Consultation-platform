import re
from typing import Dict, Any, List, Tuple
from helpers.neo4j_db import neo4j_db


def normalize_ar(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'[إأآا]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'ى', 'ي', text)
    return text.strip()


class Neo4jRAGService:
    """
    محرك استرجاع السياق القانوني والضريبي من قاعدة بيانات الرسم البياني المعرفي (Neo4j).
    يقوم بالبحث عن:
    1. نصوص المواد والفقرات والبنود ذات الصلة.
    2. التعديلات اللاحقة على المواد وتواريخ سريانها.
    3. الأحكام القضائية والسوابق المرتبطة بالمواد والقوانين.
    """

    STOP_WORDS = {
        "ما", "هو", "هي", "هل", "كيف", "متى", "أين", "في", "من", "إلى", "على", "عن",
        "مع", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي", "الذين", "اللواتي", "أن",
        "إن", "لو", "إذا", "أو", "ثم", "كل", "بعض", "غير", "بين", "حول", "لدى", "عند",
        "تم", "كان", "كانت", "يكون", "تكون", "أرجو", "اريد", "أريد", "شرح", "توضيح",
        "سؤال", "استفسار", "ماذا", "بشأن", "بخصوص"
    }

    @classmethod
    def extract_article_numbers(cls, query: str) -> List[str]:
        matches = re.findall(r'(?:المادة|مادة)\s*\(?(\d+)\)?', query)
        if not matches:
            pure_digits = re.findall(r'\b(\d{1,3})\b', query)
            if len(pure_digits) == 1 and ("مادة" in query or "المادة" in query):
                matches = pure_digits
        return list(dict.fromkeys(matches))

    @classmethod
    def extract_keywords(cls, query: str) -> List[str]:
        clean = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', query)
        tokens = [w.strip() for w in clean.split() if len(w.strip()) >= 3]
        keywords = []
        for w in tokens:
            if w in cls.STOP_WORDS:
                continue
            keywords.append(w)
            # إضافة الجذر بعد نزع ال التعريف إذا وجدت
            if w.startswith("ال") and len(w) > 4:
                keywords.append(w[2:])
            elif (w.startswith("بال") or w.startswith("وال") or w.startswith("فال") or w.startswith("كال")) and len(w) > 5:
                keywords.append(w[3:])
                keywords.append(w[1:])
            elif (w.startswith("ب") or w.startswith("و") or w.startswith("ف") or w.startswith("ل")) and len(w) > 4:
                keywords.append(w[1:])

        # إزالة التكرار وترتيب حسب الطول
        unique_kws = list(dict.fromkeys([k for k in keywords if len(k) >= 3 and k not in cls.STOP_WORDS]))
        return sorted(unique_kws, key=len, reverse=True)[:6]

    @classmethod
    def retrieve_context(cls, query: str) -> Tuple[str, List[Dict[str, Any]]]:
        article_numbers = cls.extract_article_numbers(query)
        keywords = cls.extract_keywords(query)

        articles_found = []
        rulings_found = []
        citations: List[Dict[str, Any]] = []

        try:
            with neo4j_db.get_session() as session:
                # 1. إذا كان الاستفسار يحدد رقم مادة معينة
                for art_num in article_numbers:
                    art_query = """
                    MATCH (a:`مادة` {`رقم_المادة`: $art_num})
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_مادة`]->(a)
                    OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           a.`تاريخ_السريان` AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments,
                           collect(DISTINCT {ruling: r.`اسم`, court: m.`اسم_المحكمة`, snippet: r.`مقتطف_الحكم`}) AS rulings
                    LIMIT 2
                    """
                    for rec in session.run(art_query, art_num=art_num):
                        articles_found.append(rec)
                        citations.append({
                            "type": "قانون",
                            "law": rec.get("law_name"),
                            "article": rec.get("name"),
                            "effective_date": rec.get("effective_date"),
                            "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                        })

                # 2. البحث النصي الموسع في كافة المستويات (مادة، فقرة، بند)
                if keywords:
                    search_query = """
                    MATCH (target)
                    WHERE (target:مادة OR target:فقرة OR target:بند)
                      AND any(t IN $terms WHERE
                          (target.`نص_المادة` IS NOT NULL AND target.`نص_المادة` CONTAINS t) OR
                          (target.`نص_الفقرة` IS NOT NULL AND target.`نص_الفقرة` CONTAINS t) OR
                          (target.`نص_البند` IS NOT NULL AND target.`نص_البند` CONTAINS t)
                      )
                    WITH target
                    MATCH (a:`مادة`)
                    WHERE a = target OR (a)-[:`يتضمن_فقرة`]->(target) OR (a)-[:`يتضمن_فقرة`]->()-[:`يتضمن_بند`]->(target) OR (a)-[:`يتضمن_بند`]->(target)
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i1:`بند`)
                    OPTIONAL MATCH (a)-[:`يتضمن_بند`]->(i2:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_مادة`]->(a)
                    OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
                    RETURN a.`معرف` AS id,
                           a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           a.`تاريخ_السريان` AS effective_date,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: coalesce(i1.`اسم`, i2.`اسم`), text: coalesce(i1.`نص_البند`, i2.`نص_البند`)}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments,
                           collect(DISTINCT {ruling: r.`اسم`, court: m.`اسم_المحكمة`, snippet: r.`مقتطف_الحكم`}) AS rulings
                    LIMIT 5
                    """
                    for rec in session.run(search_query, terms=keywords):
                        # تجنب التكرار
                        if not any(x.get("id") == rec.get("id") for x in articles_found):
                            articles_found.append(rec)
                            citations.append({
                                "type": "قانون",
                                "law": rec.get("law_name"),
                                "article": rec.get("name"),
                                "effective_date": rec.get("effective_date"),
                                "has_amendments": bool(rec.get("amendments") and any(a.get("mod") for a in rec.get("amendments", [])))
                            })

                    # بحث في الأحكام القضائية بالكلمات المفتاحية
                    ruling_query = """
                    MATCH (r:`حكم_قضائي`)
                    WHERE any(t IN $terms WHERE
                        (r.`مقتطف_الحكم` IS NOT NULL AND r.`مقتطف_الحكم` CONTAINS t) OR
                        (r.`العنوان` IS NOT NULL AND r.`العنوان` CONTAINS t)
                    )
                    OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
                    OPTIONAL MATCH (r)-[:`استند_إلى_مادة`]->(a:`مادة`)
                    RETURN r.`اسم` AS name, r.`العنوان` AS title, r.`السنة` AS year,
                           m.`اسم_المحكمة` AS court, a.`اسم` AS cited_article,
                           r.`مقتطف_الحكم` AS snippet
                    LIMIT 2
                    """
                    for rec in session.run(ruling_query, terms=keywords):
                        rulings_found.append(rec)
                        citations.append({
                            "type": "حكم قضائي",
                            "ruling": rec.get("name"),
                            "court": rec.get("court"),
                            "cited_article": rec.get("cited_article")
                        })

        except Exception as e:
            print(f"[Neo4jRAGService Warning] Failed to query Neo4j: {e}")
            return "", []

        context_parts = []
        if articles_found:
            context_parts.append("### [المواد والأنظمة القانونية المسترجعة من الرسم البياني المعرفي Neo4j]:")
            for art in articles_found:
                law_title = art.get('law_name') or "قانون ضريبة الدخل"
                art_name = art.get('name') or "المادة"
                eff_date = art.get('effective_date') or "غير محدد"
                context_parts.append(f"\n- **{art_name}** من ({law_title}) [سارية اعتباراً من: {eff_date}]:")
                if art.get("text"):
                    context_parts.append(f"  نص المادة: {art['text']}")

                for cl in art.get("clauses", []):
                    if cl.get("text"):
                        context_parts.append(f"  * {cl.get('clause')}: {cl.get('text')}")

                for it in art.get("items", []):
                    if it.get("text") and it.get("item"):
                        context_parts.append(f"    - {it.get('item')}: {it.get('text')}")

                amends = [a for a in art.get("amendments", []) if a.get("mod")]
                if amends:
                    context_parts.append("  ⚠️ **التعديلات اللاحقة على هذه المادة:**")
                    for a in amends:
                        context_parts.append(f"    - {a.get('mod')} (تاريخ سريان التعديل: {a.get('eff')})")

                ruls = [r for r in art.get("rulings", []) if r.get("ruling")]
                if ruls:
                    context_parts.append("  ⚖️ **أحكام قضائية استندت إلى هذه المادة:**")
                    for r in ruls:
                        snippet = (r.get("snippet") or "")[:200].replace("\n", " ")
                        context_parts.append(f"    - {r.get('ruling')} ({r.get('court')}): {snippet}...")

        if rulings_found:
            context_parts.append("\n### [سوابق وتطبيقات قضائية من Neo4j]:")
            for r in rulings_found:
                court = r.get("court") or "المحكمة المختصة"
                title = r.get("title") or r.get("name")
                snippet = (r.get("snippet") or "")[:350].replace("\n", " ")
                context_parts.append(f"- **{title}** صادر عن ({court}):\n  المبدأ/المقتطف: {snippet}...")

        final_context = "\n".join(context_parts) if context_parts else ""
        return final_context, citations

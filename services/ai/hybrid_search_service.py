from typing import Tuple, List, Dict, Any
from qdrant_client import models
from helpers.qdrant_client import qdrant_db
from helpers.neo4j_db import neo4j_db
from helpers.config import settings
from services.ai.embeddings_service import EmbeddingsService
from services.ai.neo4j_rag_service import Neo4jRAGService
from services.ai.legal_tools import LegalTools


class HybridSearchService:
    """
    محرك البحث الهجين الذكي (Hybrid GraphRAG):
    يتم توجيهه بالأدوات القانونية المتخصصة بحسب نوع الوضع (mode):
    1. consultation: استشارة ضريبية (قوانين فقط عبر get_laws_only).
    2. deep_analysis: تحليل تشريعي عميق (قوانين وأحكام عبر get_laws_and_rulings).
    3. comparison: مقارنة تشريعية (تتبع الإصدارات والفيرجنينج عبر compare_law_versions).
    """

    @classmethod
    def search(cls, query: str, mode: str = "consultation", limit: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """
        تنفيذ البحث الهجين الموجه بنوع الاستشارة (Mode-Aware Retrieval).
        """
        clean_mode = (mode or "consultation").strip().lower()

        # إذا كان الوضع هو مقارنة تشريعية، نتجه فوراً لأداة الفيرجنينج والمقارنة
        if clean_mode in ["comparison", "مقارنة تشريعية"]:
            return LegalTools.compare_law_versions(query, limit=limit)

        # إذا لم يتم إعداد مفتاح Cohere أو حدث خطأ، ننتقل مباشرة للبحث في Neo4j عبر الأداة المحددة
        if not settings.COHERE_API_KEY or settings.COHERE_API_KEY == "your-cohere-api-key" or not settings.COHERE_API_KEY.strip():
            return LegalTools.execute_by_mode(mode=clean_mode, query=query)

        try:
            # 1. فحص وجود بيانات في كولكشن Qdrant
            client = qdrant_db.client
            collection = qdrant_db.collection_name
            col_info = client.get_collection(collection)
            if col_info.points_count == 0:
                return LegalTools.execute_by_mode(mode=clean_mode, query=query)

            # 2. توليد المتجه لسؤال المستخدم
            query_vectors = EmbeddingsService.get_embeddings([query], is_query=True, strict_mode=False)
            if not query_vectors or not query_vectors[0]:
                return LegalTools.execute_by_mode(mode=clean_mode, query=query)

            query_vector = query_vectors[0]

            # 3. البحث الدلالي في Qdrant مع استبعاد المحذوف
            scored_points = []
            try:
                active_filter = models.Filter(
                    must_not=[models.FieldCondition(key="is_active", match=models.MatchValue(value=False))]
                )
                if hasattr(client, "query_points"):
                    query_res = client.query_points(
                        collection_name=collection,
                        query=query_vector,
                        query_filter=active_filter,
                        limit=limit
                    )
                    scored_points = query_res.points
                else:
                    scored_points = client.search(
                        collection_name=collection,
                        query_vector=query_vector,
                        query_filter=active_filter,
                        limit=limit
                    )
            except Exception as filter_err:
                # إذا لم يكن الحقل مفهرساً في Qdrant، يتم البحث بدون فلتر لتجنب 400
                if hasattr(client, "query_points"):
                    query_res = client.query_points(collection_name=collection, query=query_vector, limit=limit)
                    scored_points = query_res.points
                else:
                    scored_points = client.search(collection_name=collection, query_vector=query_vector, limit=limit)

            if not scored_points:
                return Neo4jRAGService.retrieve_context(query)

            # 4. استخراج المعرفات والربط مع Neo4j
            matched_article_ids = set()
            matched_judgment_ids = set()
            chunks_found = []
            citations = []

            for pt in scored_points:
                payload = pt.payload or {}
                if payload.get("is_active") is False:
                    continue
                item_type = payload.get("type")
                score = pt.score

                # تخطي النتائج شديدة الضعف إن وجدت
                if score < 0.25:
                    continue

                chunks_found.append(payload)

                art_id = payload.get("article_id")
                if art_id:
                    matched_article_ids.add(art_id)

                if item_type == "judgment":
                    r_id = payload.get("ruling_id")
                    if r_id:
                        matched_judgment_ids.add(r_id)

            # 5. استعلام Neo4j للحصول على السياق التشريعي الكامل للمواد المتطابقة
            context_parts = []
            context_parts.append("### [النصوص والأنظمة القانونية المعتمدة]:\n")

            with neo4j_db.get_session() as session:
                for art_id in list(matched_article_ids)[:4]:
                    art_query = """
                    MATCH (a:`مادة` {`معرف`: $art_id})
                    OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
                    OPTIONAL MATCH (a)-[:`يتضمن_فقرة`]->(c:`فقرة`)
                    OPTIONAL MATCH (c)-[:`يتضمن_بند`]->(i:`بند`)
                    OPTIONAL MATCH (a)-[:`له_تعديل`]->(t:`تعديل`)
                    OPTIONAL MATCH (r:`حكم_قضائي`)-[:`استند_إلى_مادة`]->(a)
                    OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
                    RETURN a.`اسم` AS name,
                           a.`رقم_المادة` AS num,
                           a.`تاريخ_السريان` AS eff,
                           a.`نص_المادة` AS text,
                           l.`اسم` AS law_name,
                           collect(DISTINCT {clause: c.`اسم`, text: c.`نص_الفقرة`}) AS clauses,
                           collect(DISTINCT {item: i.`اسم`, text: i.`نص_البند`}) AS items,
                           collect(DISTINCT {mod: t.`اسم`, eff: t.`تاريخ_السريان`}) AS amendments,
                           collect(DISTINCT {ruling: r.`اسم`, court: m.`اسم_المحكمة`, snippet: r.`مقتطف_الحكم`}) AS rulings
                    LIMIT 1
                    """
                    records = session.run(art_query, art_id=art_id).data()
                    for r in records:
                        law = r.get("law_name") or "قانون ضريبة الدخل"
                        art_name = r.get("name") or "المادة"
                        eff = r.get("eff") or "غير محدد"
                        context_parts.append(f"\n- **{art_name}** من ({law}) [سارية اعتباراً من: {eff}]:")

                        if r.get("text"):
                            context_parts.append(f"  نص المادة: {r['text']}")

                        for cl in r.get("clauses", []):
                            if cl.get("text"):
                                context_parts.append(f"  * {cl['clause']}: {cl['text']}")

                        for it in r.get("items", []):
                            if it.get("text"):
                                context_parts.append(f"    - {it['item']}: {it['text']}")

                        amends = [a for a in r.get("amendments", []) if a.get("mod")]
                        if amends:
                            context_parts.append("  ⚠️ **التعديلات التشريعية اللاحقة:**")
                            for a in amends:
                                context_parts.append(f"    - {a['mod']} (ساري من: {a.get('eff')})")

                        include_rulings = clean_mode in ["deep_analysis", "تحليل تشريعي عميق"]

                        if include_rulings:
                            ruls = [rl for rl in r.get("rulings", []) if rl.get("ruling")]
                            if ruls:
                                context_parts.append("  ⚖️ **سوابق قضائية مرتبطة:**")
                                for rl in ruls:
                                    snip = (rl.get("snippet") or "")[:200].replace("\n", " ")
                                    context_parts.append(f"    - {rl['ruling']} ({rl.get('court')}): {snip}...")

                        citations.append({
                            "type": "قانون",
                            "law": law,
                            "article": art_name,
                            "effective_date": eff,
                            "has_amendments": bool(amends)
                        })

                # استرجاع الأحكام المتطابقة دلالياً فقط في وضع التحليل التشريعي العميق
                if include_rulings:
                    for r_id in list(matched_judgment_ids)[:3]:
                        r_query = """
                        MATCH (r)
                        WHERE (r:Judgment OR r:`حكم_قضائي`) AND (r.ruling_id = $r_id OR r.`معرف` = $r_id)
                        OPTIONAL MATCH (r)-[:CITES|`استند_إلى_مادة`]->(a)
                        RETURN coalesce(r.title, r.`العنوان`, r.`اسم`, r.ruling_id) AS title,
                               coalesce(r.ruling_id, r.`معرف`, r.`اسم`, 'حكم') AS name,
                               coalesce(r.court, r.`اسم_المحكمة`, 'المحكمة المختصة') AS court,
                               coalesce(a.title, a.`اسم`, 'مادة') AS cited_article,
                               coalesce(r.outcome, substring(r.full_text, 0, 450), r.`مقتطف_الحكم`, '') AS snippet
                        LIMIT 1
                        """
                        for rec in session.run(r_query, r_id=r_id):
                            snip = (rec.get("snippet") or "")[:450].replace("\n", " ")
                            context_parts.append(f"\n- **{rec.get('title') or rec.get('name')}** صادر عن ({rec.get('court')}):")
                            context_parts.append(f"  مقتطف الحكم والنتيجة: {snip}...")
                            citations.append({
                                "type": "حكم قضائي",
                                "ruling": rec.get("title") or rec.get("name"),
                                "court": rec.get("court"),
                                "cited_article": rec.get("cited_article")
                            })

            final_context = "\n".join(context_parts) if len(context_parts) > 1 else ""
            if not final_context:
                return LegalTools.execute_by_mode(mode=clean_mode, query=query)

            return final_context, citations

        except Exception as e:
            print(f"[HybridSearchService Warning] Error in hybrid search: {e}, falling back to LegalTools.")
            return LegalTools.execute_by_mode(mode=clean_mode, query=query)

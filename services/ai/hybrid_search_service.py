from typing import Tuple, List, Dict, Any
from helpers.qdrant_client import qdrant_db
from helpers.neo4j_db import neo4j_db
from helpers.config import settings
from services.ai.embeddings_service import EmbeddingsService
from services.ai.neo4j_rag_service import Neo4jRAGService


class HybridSearchService:
    """
    محرك البحث الهجين الذكي (Hybrid GraphRAG):
    1. البحث الدلالي بالمتجهات في Qdrant للوصول لأقرب النصوص والفقرات بالمعنى (Semantic Search).
    2. استخراج الشجرة التشريعية الكاملة من Neo4j (المادة الأصلية، التعديلات، الأحكام القضائية).
    3. آلية Fallback ذكية في حال كانت قاعدة Qdrant فارغة أو مفتاح Cohere غير متوفر.
    """

    @classmethod
    def search(cls, query: str, limit: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """
        تنفيذ البحث الهجين واسترجاع السياق التشريعي وقائمة الاستشهادات.
        """
        # إذا لم يتم إعداد مفتاح Cohere أو حدث خطأ، ننتقل مباشرة للبحث في Neo4j Graph
        if not settings.COHERE_API_KEY or settings.COHERE_API_KEY == "your-cohere-api-key" or not settings.COHERE_API_KEY.strip():
            print("[HybridSearch] Cohere key not set, using Neo4j Graph RAG directly.")
            return Neo4jRAGService.retrieve_context(query)

        try:
            # 1. فحص وجود بيانات في كولكشن Qdrant
            client = qdrant_db.client
            collection = qdrant_db.collection_name
            col_info = client.get_collection(collection)
            if col_info.points_count == 0:
                print("[HybridSearch] Qdrant collection is empty, falling back to Neo4j Graph RAG.")
                return Neo4jRAGService.retrieve_context(query)

            # 2. توليد المتجه لسؤال المستخدم
            query_vectors = EmbeddingsService.get_embeddings([query], is_query=True, strict_mode=False)
            if not query_vectors or not query_vectors[0]:
                return Neo4jRAGService.retrieve_context(query)

            query_vector = query_vectors[0]

            # 3. البحث الدلالي في Qdrant
            if hasattr(client, "query_points"):
                query_res = client.query_points(
                    collection_name=collection,
                    query=query_vector,
                    limit=limit
                )
                scored_points = query_res.points
            else:
                scored_points = client.search(
                    collection_name=collection,
                    query_vector=query_vector,
                    limit=limit
                )

            if not scored_points:
                return Neo4jRAGService.retrieve_context(query)

            # 4. استخراج المعرفات والربط مع Neo4j
            matched_article_ids = set()
            matched_judgment_ids = set()
            chunks_found = []
            citations = []

            for pt in scored_points:
                payload = pt.payload or {}
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
            context_parts.append("### [أقرب النتائج التشريعية المسترجعة دلالياً من Qdrant & الرسم البياني Neo4j]:\n")

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

                # الأحكام المتطابقة دلالياً
                for r_id in list(matched_judgment_ids)[:2]:
                    r_query = """
                    MATCH (r:`حكم_قضائي` {`معرف`: $r_id})
                    OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
                    OPTIONAL MATCH (r)-[:`استند_إلى_مادة`]->(a:`مادة`)
                    RETURN r.`اسم` AS name, r.`العنوان` AS title, m.`اسم_المحكمة` AS court,
                           a.`اسم` AS cited_article, r.`مقتطف_الحكم` AS snippet
                    LIMIT 1
                    """
                    for rec in session.run(r_query, r_id=r_id):
                        snip = (rec.get("snippet") or "")[:350].replace("\n", " ")
                        context_parts.append(f"\n- **{rec.get('title') or rec.get('name')}** صادر عن ({rec.get('court')}):")
                        context_parts.append(f"  مقتطف الحكم: {snip}...")
                        citations.append({
                            "type": "حكم قضائي",
                            "ruling": rec.get("name"),
                            "court": rec.get("court"),
                            "cited_article": rec.get("cited_article")
                        })

            final_context = "\n".join(context_parts) if len(context_parts) > 1 else ""
            if not final_context:
                return Neo4jRAGService.retrieve_context(query)

            return final_context, citations

        except Exception as e:
            print(f"[HybridSearchService Warning] Error in hybrid search: {e}, falling back to Neo4j.")
            return Neo4jRAGService.retrieve_context(query)

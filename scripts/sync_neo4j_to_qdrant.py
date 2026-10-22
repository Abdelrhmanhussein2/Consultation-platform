import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from helpers.neo4j_db import neo4j_db
from helpers.qdrant_client import qdrant_db
from helpers.config import settings
from services.ai.embeddings_service import EmbeddingsService
from qdrant_client.http import models


def build_chunks_from_neo4j():
    """
    استخراج كافة المواد، الفقرات، البنود، والأحكام القضائية من Neo4j
    وتجهيزها كقطع نصية (Chunks) غنية بالسياق التشريعي لرفعها إلى Qdrant.
    """
    chunks = []
    print("⏳ جاري استخراج البيانات من Neo4j...")

    with neo4j_db.get_session() as session:
        # 1. استخراج المواد
        articles_query = """
        MATCH (a:`مادة`)
        OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
        RETURN a.`معرف` AS id, a.`اسم` AS name, a.`رقم_المادة` AS num,
               a.`تاريخ_السريان` AS eff, a.`نص_المادة` AS text,
               l.`اسم` AS law_name
        """
        for r in session.run(articles_query):
            txt = (r["text"] or "").strip()
            if not txt:
                txt = f"{r['name']} من {r['law_name'] or 'قانون ضريبة الدخل'}"
            full_chunk_text = f"{r['law_name'] or 'قانون ضريبة الدخل'} - {r['name']} (ساري من {r['eff'] or 'غير محدد'}): {txt}"
            chunks.append({
                "type": "article",
                "id": r["id"],
                "text": full_chunk_text,
                "payload": {
                    "type": "article",
                    "article_id": r["id"],
                    "article_name": r["name"],
                    "article_num": r["num"],
                    "law_name": r["law_name"],
                    "effective_date": r["eff"],
                    "text": txt
                }
            })

        # 2. استخراج الفقرات
        clauses_query = """
        MATCH (a:`مادة`)-[:`يتضمن_فقرة`]->(c:`فقرة`)
        OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
        RETURN c.`معرف` AS id, c.`اسم` AS name, c.`حرف_الفقرة` AS letter,
               c.`نص_الفقرة` AS text, a.`معرف` AS article_id, a.`اسم` AS article_name,
               a.`تاريخ_السريان` AS eff, l.`اسم` AS law_name
        """
        for r in session.run(clauses_query):
            txt = (r["text"] or "").strip()
            if not txt:
                continue
            full_chunk_text = f"{r['law_name'] or 'قانون ضريبة الدخل'} - {r['article_name']} {r['name']}: {txt}"
            chunks.append({
                "type": "paragraph",
                "id": r["id"],
                "text": full_chunk_text,
                "payload": {
                    "type": "paragraph",
                    "paragraph_id": r["id"],
                    "article_id": r["article_id"],
                    "article_name": r["article_name"],
                    "clause_name": r["name"],
                    "clause_letter": r["letter"],
                    "law_name": r["law_name"],
                    "effective_date": r["eff"],
                    "text": txt
                }
            })

        # 3. استخراج البنود
        items_query = """
        MATCH (c:`فقرة`)-[:`يتضمن_بند`]->(i:`بند`)
        MATCH (a:`مادة`)-[:`يتضمن_فقرة`]->(c)
        OPTIONAL MATCH (l:`قانون`)-[:`يتضمن_مادة`]->(a)
        RETURN i.`معرف` AS id, i.`اسم` AS name, i.`رقم_البند` AS num,
               i.`نص_البند` AS text, c.`معرف` AS clause_id, c.`اسم` AS clause_name,
               a.`معرف` AS article_id, a.`اسم` AS article_name,
               a.`تاريخ_السريان` AS eff, l.`اسم` AS law_name
        """
        for r in session.run(items_query):
            txt = (r["text"] or "").strip()
            if not txt:
                continue
            full_chunk_text = f"{r['law_name'] or 'قانون ضريبة الدخل'} - {r['article_name']} {r['clause_name']} {r['name']}: {txt}"
            chunks.append({
                "type": "item",
                "id": r["id"],
                "text": full_chunk_text,
                "payload": {
                    "type": "item",
                    "item_id": r["id"],
                    "paragraph_id": r["clause_id"],
                    "article_id": r["article_id"],
                    "article_name": r["article_name"],
                    "clause_name": r["clause_name"],
                    "item_name": r["name"],
                    "item_num": r["num"],
                    "law_name": r["law_name"],
                    "effective_date": r["eff"],
                    "text": txt
                }
            })

        # 4. استخراج الأحكام القضائية
        rulings_query = """
        MATCH (r:`حكم_قضائي`)
        OPTIONAL MATCH (r)-[:`صادر_عن`]->(m:`محكمة`)
        OPTIONAL MATCH (r)-[:`استند_إلى_مادة`]->(a:`مادة`)
        RETURN r.`معرف` AS id, r.`اسم` AS name, r.`العنوان` AS title,
               r.`السنة` AS year, r.`مقتطف_الحكم` AS text,
               m.`اسم_المحكمة` AS court, a.`اسم` AS cited_article
        """
        for r in session.run(rulings_query):
            txt = (r["text"] or "").strip()
            if not txt:
                continue
            court = r["court"] or "المحكمة المختصة"
            full_chunk_text = f"{r['title']} صادر عن {court}: {txt}"
            chunks.append({
                "type": "judgment",
                "id": r["id"],
                "text": full_chunk_text,
                "payload": {
                    "type": "judgment",
                    "ruling_id": r["id"],
                    "title": r["title"] or r["name"],
                    "court": court,
                    "year": r["year"],
                    "cited_article": r["cited_article"],
                    "text": txt
                }
            })

    print(f"✅ تم تجهيز {len(chunks)} قطعة نصية (Chunks) من Neo4j.")
    return chunks


def upload_chunks_to_qdrant(chunks: list, batch_size: int = 40):
    """
    توليد الـ Embeddings ورفع الـ Chunks إلى Qdrant على دفعات.
    """
    if not settings.COHERE_API_KEY or settings.COHERE_API_KEY == "your-cohere-api-key":
        print("❌ تنبيه: لم يتم تعيين COHERE_API_KEY في ملف .env!")
        print("يرجى وضع مفتاح Cohere API في ملف .env ثم إعادة تشغيل هذا السكربت.")
        return False

    qdrant_db.init_collection()
    client = qdrant_db.client
    collection_name = qdrant_db.collection_name

    total = len(chunks)
    print(f"🚀 بدء توليد المتجهات ورفع {total} نقطة إلى Qdrant (دفعة كل {batch_size} عنصر)...")

    for i in range(0, total, batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["text"] for c in batch]

        try:
            vectors = EmbeddingsService.get_embeddings(texts, is_query=False, strict_mode=True)
            if not vectors or len(vectors) != len(batch):
                print(f"⚠️ فشل توليد المتجهات للدفعة {i} - {i + len(batch)}")
                continue

            points = []
            for item, vec in zip(batch, vectors):
                point_id = EmbeddingsService.generate_deterministic_uuid(item["type"], item["id"])
                points.append(
                    models.PointStruct(
                        id=point_id,
                        vector=vec,
                        payload=item["payload"]
                    )
                )

            client.upsert(
                collection_name=collection_name,
                points=points
            )
            print(f"  [✓] تم رفع {min(i + batch_size, total)}/{total} عنصر بنجاح...")
            # مهلة قصيرة لتجنب الـ Rate limit المجاني
            time.sleep(0.5)

        except Exception as e:
            print(f"❌ خطأ أثناء معالجة الدفعة {i}: {e}")
            return False

    print("\n🎉 تم بنجاح مزامنة وتخزين كافة القوانين والأحكام كـ Chunks في Qdrant!")
    return True


if __name__ == "__main__":
    chunks = build_chunks_from_neo4j()
    upload_chunks_to_qdrant(chunks)

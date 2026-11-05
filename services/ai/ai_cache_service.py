import hashlib
import json
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from helpers.redis_client import get_redis
from helpers.qdrant_client import qdrant_db
from services.ai.embeddings_service import EmbeddingsService

logger = logging.getLogger(__name__)


class AICacheService:
    TTL_DEFAULT = 86_400       # 24 hours
    TTL_ADVANCED = 172_800     # 48 hours
    TTL_SEMANTIC = 604_800     # 7 days
    SEMANTIC_THRESHOLD = 0.82  # Ideal for Cohere v3 multilingual Arabic queries
    SEMANTIC_COLLECTION = "ai_semantic_cache"

    @classmethod
    def _ensure_collection(cls):
        try:
            client = qdrant_db.client
            existing = [c.name for c in client.get_collections().collections]
            if cls.SEMANTIC_COLLECTION not in existing:
                from qdrant_client.http import models as q_models
                client.create_collection(
                    collection_name=cls.SEMANTIC_COLLECTION,
                    vectors_config=q_models.VectorParams(size=1024, distance=q_models.Distance.COSINE)
                )
                print(f"[AICache] Qdrant collection '{cls.SEMANTIC_COLLECTION}' created.")
        except Exception as e:
            print(f"[AICache] Collection ensure error: {e}")

    @classmethod
    def _make_exact_key(cls, mode: str, text: str) -> str:
        clean = f"{mode.lower().strip()}::{text.strip().lower()}"
        digest = hashlib.sha256(clean.encode("utf-8")).hexdigest()
        return f"ai_cache:exact:{digest}"

    @classmethod
    def get_exact(cls, mode: str, text: str) -> Optional[Dict[str, Any]]:
        try:
            r = get_redis()
            key = cls._make_exact_key(mode, text)
            raw = r.get(key)
            if raw:
                hit_key = f"ai_cache:hits:{key[-16:]}"
                r.incr(hit_key)
                r.expire(hit_key, cls.TTL_ADVANCED)
                return {"data": json.loads(raw), "cache_key": key}
        except Exception as e:
            print(f"[AICache] Exact get error: {e}")
        return None

    @classmethod
    def set_exact(cls, mode: str, text: str, data: Dict[str, Any], is_advanced: bool = False) -> Optional[str]:
        try:
            r = get_redis()
            key = cls._make_exact_key(mode, text)
            ttl = cls.TTL_ADVANCED if is_advanced else cls.TTL_DEFAULT
            r.setex(key, ttl, json.dumps(data, ensure_ascii=False))
            hit_key = f"ai_cache:hits:{key[-16:]}"
            if not r.exists(hit_key):
                r.setex(hit_key, ttl, 0)
            return key
        except Exception as e:
            print(f"[AICache] Exact set error: {e}")
            return None

    @classmethod
    def get_semantic(cls, mode: str, text: str) -> Optional[Dict[str, Any]]:
        cls._ensure_collection()
        try:
            embedding = EmbeddingsService.get_embedding(text, is_query=True)
            if not embedding:
                return None
            client = qdrant_db.client
            results = client.search(
                collection_name=cls.SEMANTIC_COLLECTION,
                query_vector=embedding,
                limit=1,
                score_threshold=cls.SEMANTIC_THRESHOLD,
            )
            if results and len(results) > 0:
                hit = results[0]
                payload = hit.payload or {}
                cached_mode = payload.get("mode", "default")
                if cached_mode == mode or {cached_mode, mode}.issubset({"default", "consultation"}):
                    point_id = str(hit.id)
                    hit_key = f"ai_cache:sem_hits:{point_id}"
                    r = get_redis()
                    r.incr(hit_key)
                    r.expire(hit_key, cls.TTL_SEMANTIC)
                    print(f"[AICache] Semantic HIT! Score={hit.score:.3f} for: {text[:40]}")
                    return {
                        "data": payload,
                        "score": float(hit.score),
                        "point_id": point_id,
                    }
        except Exception as e:
            print(f"[AICache] Semantic search error: {e}")
        return None

    @classmethod
    def index_semantic(
        cls, mode: str, question: str, answer: str, usage: Dict[str, Any],
        model_name: str, citations: Optional[List[Any]] = None
    ) -> Optional[str]:
        cls._ensure_collection()
        try:
            embedding = EmbeddingsService.get_embedding(question, is_query=False)
            if not embedding:
                return None
            point_id = str(uuid.uuid4())
            payload = {
                "question": question,
                "answer": answer,
                "mode": mode,
                "citations": citations or [],
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
                "model_name": model_name,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            from qdrant_client.http import models as q_models
            client = qdrant_db.client
            client.upsert(
                collection_name=cls.SEMANTIC_COLLECTION,
                points=[
                    q_models.PointStruct(id=point_id, vector=embedding, payload=payload)
                ],
            )
            r = get_redis()
            hit_key = f"ai_cache:sem_hits:{point_id}"
            r.setex(hit_key, cls.TTL_SEMANTIC, 0)
            print(f"[AICache] Indexed semantic point: {point_id} for: {question[:40]}")
            return point_id
        except Exception as e:
            print(f"[AICache] Semantic indexing error: {e}")
            return None

    @classmethod
    def list_semantic_entries(cls, limit: int = 20, offset: Optional[str] = None) -> Dict[str, Any]:
        cls._ensure_collection()
        try:
            client = qdrant_db.client
            res = client.scroll(
                collection_name=cls.SEMANTIC_COLLECTION,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            points, next_offset = res
            r = get_redis()
            items = []
            for p in points:
                pid = str(p.id)
                hits = int(r.get(f"ai_cache:sem_hits:{pid}") or 0)
                items.append({"id": pid, "payload": p.payload, "hits": hits})
            return {"items": items, "next_offset": next_offset}
        except Exception as e:
            return {"items": [], "next_offset": None, "error": str(e)}

    @classmethod
    def delete_semantic_entry(cls, point_id: str) -> bool:
        try:
            client = qdrant_db.client
            from qdrant_client.http import models as q_models
            client.delete(
                collection_name=cls.SEMANTIC_COLLECTION,
                points_selector=q_models.PointIdsList(points=[point_id]),
            )
            r = get_redis()
            r.delete(f"ai_cache:sem_hits:{point_id}")
            return True
        except Exception:
            return False

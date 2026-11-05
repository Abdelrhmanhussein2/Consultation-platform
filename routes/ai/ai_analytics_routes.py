import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_

from helpers.database import get_db
from helpers.enums import AIChatRole
from helpers.encryption import decrypt_text
from helpers.redis_client import get_redis
from models import AIChatMessage, AIChatSession, User
from routes.deps import get_current_active_user
from services.ai.ai_cache_service import AICacheService

router = APIRouter(prefix="/ai-assistant", tags=["AI Analytics & Cache"])
COST_PER_TOKEN = 0.0009 / 1_000_000


@router.get("/analytics")
def get_ai_analytics(
    period: str = Query("14d", pattern="^(7d|14d|30d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    days = 7 if period == "7d" else (30 if period == "30d" else 14)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # 1. Summary
    row = db.query(
        func.count(AIChatMessage.id).label("total"),
        func.sum(case((AIChatMessage.cache_type == "exact", 1), else_=0)).label("exact_hits"),
        func.sum(case((AIChatMessage.cache_type == "semantic", 1), else_=0)).label("semantic_hits"),
        func.sum(case((AIChatMessage.is_cached == True, 1), else_=0)).label("total_cached"),
        func.sum(AIChatMessage.total_tokens).label("total_tokens"),
        func.sum(case((AIChatMessage.is_cached == True, AIChatMessage.total_tokens), else_=0)).label("saved_tokens"),
        func.avg(AIChatMessage.latency_ms).label("avg_latency"),
    ).filter(AIChatMessage.role == AIChatRole.assistant, AIChatMessage.created_at >= cutoff).first()

    total_requests = int(row.total or 0)
    total_cached = int(row.total_cached or 0)
    total_tokens = int(row.total_tokens or 0)
    saved_tokens = int(row.saved_tokens or 0)
    total_sessions = db.query(AIChatSession).filter(AIChatSession.created_at >= cutoff).count()
    cache_hit_rate = round((total_cached / total_requests * 100), 1) if total_requests > 0 else 0.0

    # 2. Daily Timeline
    daily_rows = db.query(
        func.date_trunc('day', AIChatMessage.created_at).label("day"),
        func.count(AIChatMessage.id).label("requests"),
        func.sum(case((AIChatMessage.is_cached == True, 1), else_=0)).label("cache_hits"),
        func.sum(case((AIChatMessage.is_cached == True, AIChatMessage.total_tokens), else_=0)).label("saved_tokens"),
    ).filter(AIChatMessage.role == AIChatRole.assistant, AIChatMessage.created_at >= cutoff)\
     .group_by(func.date_trunc('day', AIChatMessage.created_at))\
     .order_by(func.date_trunc('day', AIChatMessage.created_at).asc()).all()

    tokens_by_day = [
        {
            "date": d.day.strftime("%d/%m") if d.day else "",
            "full_date": d.day.strftime("%Y-%m-%d") if d.day else "",
            "requests": int(d.requests or 0),
            "cache_hits": int(d.cache_hits or 0),
            "saved_tokens": int(d.saved_tokens or 0),
        }
        for d in daily_rows
    ]

    # 3. Top 5 Most Frequent User Queries
    user_msgs = db.query(AIChatMessage.content_encrypted)\
        .filter(AIChatMessage.role == AIChatRole.user, AIChatMessage.created_at >= cutoff)\
        .limit(300).all()
    counts = Counter()
    for m in user_msgs:
        try:
            txt = decrypt_text(m.content_encrypted)
            if txt and len(txt.strip()) > 5:
                counts[txt.strip()] += 1
        except Exception:
            pass

    top_frequent = [
        {"id": f"fq-{i+1}", "text": q, "count": c, "segment": "استفسار ضريبي", "tokens_saved": c * 580}
        for i, (q, c) in enumerate(counts.most_common(5))
    ]

    # 4. Top Cached Queries with Redis/Qdrant text resolution
    r_client = get_redis()
    top_cached_rows = db.query(
        AIChatMessage.cache_key, AIChatMessage.cache_type, AIChatMessage.mode,
        func.count(AIChatMessage.id).label("hit_count"),
        func.sum(AIChatMessage.total_tokens).label("tokens_saved"),
        func.avg(AIChatMessage.latency_ms).label("avg_lat"),
        func.max(AIChatMessage.created_at).label("last_hit"),
    ).filter(AIChatMessage.is_cached == True, AIChatMessage.cache_key.isnot(None), AIChatMessage.created_at >= cutoff)\
     .group_by(AIChatMessage.cache_key, AIChatMessage.cache_type, AIChatMessage.mode)\
     .order_by(func.count(AIChatMessage.id).desc()).limit(10).all()

    top_cached = []
    for r in top_cached_rows:
        q_text = r.cache_key
        if r.cache_type == "semantic" and ":" in (r.cache_key or ""):
            try:
                pid = r.cache_key.split(":")[-1]
                from helpers.qdrant_client import qdrant_db
                pts = qdrant_db.client.retrieve("ai_semantic_cache", [pid], with_payload=True)
                if pts and pts[0].payload:
                    q_text = pts[0].payload.get("question") or q_text
            except Exception:
                pass
        else:
            try:
                raw = r_client.get(r.cache_key)
                if raw:
                    q_text = json.loads(raw).get("question") or q_text
            except Exception:
                pass
        top_cached.append({
            "id": r.cache_key,
            "question": q_text,
            "category": "استشارة متقدمة" if r.mode in ["deep", "compare"] else "ضريبة واستشارات",
            "cache_type": r.cache_type,
            "cache_hits": int(r.hit_count or 0),
            "response_time": f"{round((r.avg_lat or 15) / 1000, 2)} ثانية",
            "saved_tokens": f"token {int(r.tokens_saved or 0):,}",
            "last_cached": r.last_hit.strftime("%H:%M") if r.last_hit else "اليوم",
        })

    # 5. Failed / Unresolved Queries
    failed_rows = db.query(AIChatMessage).filter(
        AIChatMessage.role == AIChatRole.assistant,
        AIChatMessage.created_at >= cutoff,
        AIChatMessage.is_cached == False,
        or_(
            AIChatMessage.total_tokens == 0,
            AIChatMessage.total_tokens.is_(None),
            AIChatMessage.citations.op('->>')('is_unresolved') == 'true'
        )
    ).order_by(AIChatMessage.created_at.desc()).limit(15).all()

    failed_queries = []
    for f in failed_rows:
        c_dict = f.citations if isinstance(f.citations, dict) else {}
        q_text = c_dict.get("original_question")
        if not q_text and f.session_id:
            last_u = db.query(AIChatMessage).filter(AIChatMessage.session_id == f.session_id, AIChatMessage.role == AIChatRole.user, AIChatMessage.created_at <= f.created_at).order_by(AIChatMessage.created_at.desc()).first()
            if last_u and last_u.content_encrypted:
                try: q_text = decrypt_text(last_u.content_encrypted)
                except Exception: pass
        if not q_text:
            try: q_text = decrypt_text(f.content_encrypted)[:90] if f.content_encrypted else "تعذر الرد"
            except Exception: q_text = "استفسار غير محدد"
        failed_queries.append({
            "id": str(f.id), "question": q_text,
            "reason": c_dict.get("unresolved_reason") or "تجاوز مهلة الرد أو عدم توفر سياق مطابق",
            "status": "بحاجة لمستشار", "time": f.created_at.strftime("%H:%M") if f.created_at else "اليوم",
        })

    return {
        "summary": {
            "total_requests": total_requests,
            "total_sessions": total_sessions,
            "total_tokens": total_tokens,
            "active_search_buttons": 4,
            "cache_hit_rate": cache_hit_rate,
            "saved_tokens": saved_tokens,
            "saved_llm_calls": total_cached,
            "avg_latency_ms": int(row.avg_latency or 0),
            "cost_saved_usd": round(saved_tokens * COST_PER_TOKEN, 4),
        },
        "tokens_by_day": tokens_by_day,
        "top_frequent_queries": top_frequent,
        "top_cached_queries": top_cached,
        "failed_queries": failed_queries,
    }


@router.get("/cache/semantic")
def list_semantic_cache(limit: int = 20, offset: Optional[str] = None):
    return AICacheService.list_semantic_entries(limit=limit, offset=offset)


@router.delete("/cache/semantic/{point_id}")
def delete_semantic_cache(point_id: str):
    if not AICacheService.delete_semantic_entry(point_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    return {"message": "تم الحذف بنجاح"}

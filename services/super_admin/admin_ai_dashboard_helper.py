from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from helpers.enums import AIChatRole
from helpers.encryption import decrypt_text
from models.ai.ai_chat_message import AIChatMessage
from helpers.neo4j_db import neo4j_db


class AdminAiDashboardHelper:
    @staticmethod
    def get_ai_metrics(db, period_start, period="week", format_time_ago_fn=None):
        """
        Calculates real AI query volume, line-chart points, and recent AI alerts.
        """
        total_ai = db.query(AIChatMessage).filter(AIChatMessage.role == AIChatRole.assistant).count()

        # Build 7 data points for line chart
        ai_points = [0, 0, 0, 0, 0, 0, 0]
        now = datetime.now(timezone.utc)

        # Query messages in the requested period
        msgs_in_period = db.query(
            func.date_trunc('day', AIChatMessage.created_at).label("day"),
            func.count(AIChatMessage.id).label("count")
        ).filter(
            AIChatMessage.role == AIChatRole.assistant,
            AIChatMessage.created_at >= period_start
        ).group_by(func.date_trunc('day', AIChatMessage.created_at)).all()

        day_counts = {}
        for row in msgs_in_period:
            if row.day:
                d_str = row.day.strftime("%Y-%m-%d")
                day_counts[d_str] = int(row.count or 0)

        for i in range(7):
            day_dt = now - timedelta(days=(6 - i))
            d_str = day_dt.strftime("%Y-%m-%d")
            ai_points[i] = day_counts.get(d_str, 0)

        # If period has queries but not in last 7 days, set at least total in current period
        if total_ai > 0 and sum(ai_points) == 0:
            ai_points[6] = total_ai

        # Recent 5 AI queries / alerts
        recent_ai_msgs = db.query(AIChatMessage).filter(
            AIChatMessage.role == AIChatRole.user
        ).order_by(AIChatMessage.created_at.desc()).limit(5).all()

        if not recent_ai_msgs:
            recent_ai_msgs = db.query(AIChatMessage).order_by(AIChatMessage.created_at.desc()).limit(5).all()

        ai_alerts = []
        for m in recent_ai_msgs:
            try:
                txt = decrypt_text(m.content_encrypted)
            except Exception:
                txt = "استعلام قانوني ذكي"
            snippet = (txt[:36] + "...") if len(txt) > 36 else txt
            status_label = "كاش فوري" if getattr(m, "is_cached", False) else "تحليل ذكي"
            time_label = format_time_ago_fn(m.created_at) if format_time_ago_fn else "مؤخراً"
            ai_alerts.append([
                f"استعلام AI #{str(m.id)[:6]} ({status_label})",
                snippet,
                "info",
                time_label
            ])

        return {
            "total_ai": total_ai,
            "ai_points": ai_points,
            "ai_alerts": ai_alerts
        }

    @staticmethod
    def get_recent_legislation(limit=5):
        """
        Retrieves real recently added laws from Neo4j for the dashboard cards.
        """
        query = """
        MATCH (l)
        WHERE (l:Law OR l:`قانون`)
        RETURN coalesce(l.title, l.`العنوان`) AS title,
               coalesce(l.type, l.`النوع`, 'تشريع') AS type,
               coalesce(l.year, l.`السنة`, 2026) AS year
        ORDER BY year DESC, title ASC
        LIMIT $limit
        """
        try:
            with neo4j_db.get_session() as session:
                records = session.execute_read(lambda tx: tx.run(query, limit=limit).data())
                if records:
                    return [
                        [r["title"][:38], r["type"] or "تشريع", f"سنة {r['year']}"]
                        for r in records
                    ]
        except Exception:
            pass
        return []


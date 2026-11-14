from datetime import datetime, timezone, timedelta
from sqlalchemy import func, cast, Date
from helpers.enums import AIChatRole
from helpers.encryption import decrypt_text
from models.ai.ai_chat_message import AIChatMessage
from helpers.neo4j_db import neo4j_db


class AdminAiDashboardHelper:
    @staticmethod
    def get_ai_metrics(db, period_start, period="week", format_time_ago_fn=None):
        """
        Calculates real AI query volume, dynamic line-chart points & labels, and recent AI alerts.
        Supports: day, week, month, quarter, half, year.
        """
        total_ai = db.query(AIChatMessage).filter(AIChatMessage.role == AIChatRole.assistant).count()
        now = datetime.now(timezone.utc)
        day_names_ar = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

        # 1. Dynamic points & labels based on period
        if period == "day":
            labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
            ai_points = [0] * 6
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            day_msgs = db.query(AIChatMessage.created_at).filter(
                AIChatMessage.role == AIChatRole.assistant,
                AIChatMessage.created_at >= start_of_day
            ).all()
            for (created_at,) in day_msgs:
                if created_at:
                    slot = min(5, created_at.hour // 4)
                    ai_points[slot] += 1

        elif period == "week":
            # 7 continuous days ending today
            labels = []
            ai_points = []
            day_counts = {}
            day_col = cast(AIChatMessage.created_at, Date)
            week_start = now - timedelta(days=6)
            week_start_date = week_start.date()

            msgs = db.query(
                day_col.label("day"),
                func.count(AIChatMessage.id).label("count")
            ).filter(
                AIChatMessage.role == AIChatRole.assistant,
                AIChatMessage.created_at >= week_start
            ).group_by(day_col).all()

            for r in msgs:
                if r.day:
                    day_counts[r.day.strftime("%Y-%m-%d")] = int(r.count or 0)

            for i in range(7):
                target_dt = week_start + timedelta(days=i)
                labels.append(day_names_ar[target_dt.weekday()])
                ai_points.append(day_counts.get(target_dt.strftime("%Y-%m-%d"), 0))

        elif period == "month":
            # 6 intervals of 5 days across the last 30 days
            labels = []
            ai_points = []
            month_start = now - timedelta(days=30)
            for i in range(6):
                slot_start = month_start + timedelta(days=i * 5)
                slot_end = slot_start + timedelta(days=5)
                labels.append(slot_end.strftime("%d/%m"))
                cnt = db.query(AIChatMessage).filter(
                    AIChatMessage.role == AIChatRole.assistant,
                    AIChatMessage.created_at >= slot_start,
                    AIChatMessage.created_at < slot_end
                ).count()
                ai_points.append(cnt)

        else:
            # quarter, half, year: 6 monthly intervals
            months_back = 12 if period == "year" else (6 if period == "half" else 3)
            step_days = max(15, (months_back * 30) // 6)
            labels = []
            ai_points = []
            long_start = now - timedelta(days=months_back * 30)
            month_names_ar = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
            for i in range(6):
                slot_start = long_start + timedelta(days=i * step_days)
                slot_end = slot_start + timedelta(days=step_days)
                labels.append(month_names_ar[slot_end.month - 1])
                cnt = db.query(AIChatMessage).filter(
                    AIChatMessage.role == AIChatRole.assistant,
                    AIChatMessage.created_at >= slot_start,
                    AIChatMessage.created_at < slot_end
                ).count()
                ai_points.append(cnt)

        # Recent 4 AI queries / alerts
        recent_ai_msgs = db.query(AIChatMessage).filter(
            AIChatMessage.role == AIChatRole.user
        ).order_by(AIChatMessage.created_at.desc()).limit(4).all()

        if not recent_ai_msgs:
            recent_ai_msgs = db.query(AIChatMessage).order_by(AIChatMessage.created_at.desc()).limit(4).all()

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
            "ai_labels": labels,
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


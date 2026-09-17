import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from models import User
from models.file_download_log import FileDownloadLog


class FileDownloadService:
    @staticmethod
    def log_download(
        db: Session,
        file_id: str,
        file_name: str,
        file_category: str = "documents",
        user_id: Optional[uuid.UUID] = None,
        user_name: Optional[str] = None,
        user_role: str = "client",
        status: str = "success",
        block_reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_info: Optional[str] = None
    ) -> FileDownloadLog:
        """
        Logs a file download event or blocked attempt into PostgreSQL.
        """
        if user_id and not user_name:
            u = db.query(User).filter(User.id == user_id).first()
            if u:
                user_name = u.full_name or u.email
                user_role = str(u.role.value if hasattr(u.role, 'value') else u.role)

        log = FileDownloadLog(
            file_id=str(file_id),
            file_name=file_name,
            file_category=file_category,
            user_id=user_id,
            user_name=user_name or "زائر / غير مسجل",
            user_role=user_role,
            status=status,
            block_reason=block_reason,
            ip_address=ip_address or "127.0.0.1",
            user_agent=user_agent or "Mozilla/5.0",
            device_info=device_info or "متصفح الويب"
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_download_logs(
        db: Session,
        search: Optional[str] = None,
        file_category: Optional[str] = None,
        status: Optional[str] = None,
        user_role: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Retrieves paginated and filtered file download logs.
        """
        # Pure database queries only - zero mock or seed records
        query = db.query(FileDownloadLog)

        if search:
            pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    FileDownloadLog.file_name.ilike(pat),
                    FileDownloadLog.file_id.ilike(pat),
                    FileDownloadLog.user_name.ilike(pat),
                    FileDownloadLog.ip_address.ilike(pat),
                    FileDownloadLog.block_reason.ilike(pat)
                )
            )

        if file_category and file_category != "all":
            query = query.filter(FileDownloadLog.file_category == file_category)

        if status and status != "all":
            query = query.filter(FileDownloadLog.status == status)

        if user_role and user_role != "all":
            query = query.filter(FileDownloadLog.user_role == user_role)

        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                query = query.filter(FileDownloadLog.created_at >= dt_from)
            except Exception:
                pass

        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                query = query.filter(FileDownloadLog.created_at <= dt_to)
            except Exception:
                pass

        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(FileDownloadLog.created_at.desc()).offset(offset).limit(limit).all()

        formatted_items = []
        for item in items:
            formatted_items.append({
                "id": str(item.id),
                "file_id": item.file_id,
                "file_name": item.file_name,
                "file_category": item.file_category,
                "user_id": str(item.user_id) if item.user_id else None,
                "user_name": item.user_name or "مستخدم",
                "user_role": item.user_role,
                "status": item.status,
                "block_reason": item.block_reason,
                "ip_address": item.ip_address,
                "user_agent": item.user_agent,
                "device_info": item.device_info,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "formatted_time": item.created_at.strftime("%d/%m/%Y %H:%M") if item.created_at else "—"
            })

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "items": formatted_items
        }


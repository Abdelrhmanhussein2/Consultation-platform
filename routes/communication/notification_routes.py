from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from controllers import NotificationController
from helpers.database import get_db
from helpers.enums import NotificationType, UserRole
from models import User, AdminBroadcast
from routes.communication.notification_ws import websocket_notifications_endpoint
from routes.deps import get_current_active_user
from schemes import NotificationBulkReadOut, NotificationOut, UnreadCountOut
from services.communication.admin_broadcast_service import count_broadcast_recipients, send_admin_broadcast
from services.communication.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationOut], summary="Get user notifications")
def get_notifications(
    is_read: Optional[bool] = Query(None), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user),
):
    return NotificationController.get_my_notifications(db, current_user, is_read=is_read, page=page, limit=limit)


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_notifications_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return NotificationController.get_unread_count(db, current_user)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notification_id: str, payload: Optional[dict] = Body(None),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    is_read = payload.get("is_read") if payload else None
    return NotificationController.mark_as_read(db, current_user, notification_id, is_read=is_read)


@router.post("/read-all", response_model=NotificationBulkReadOut)
def mark_all_notifications_as_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return NotificationController.mark_all_as_read(db, current_user)


@router.delete("/{notification_id}")
def delete_notification(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return NotificationController.delete_notification(db, current_user, notification_id)


@router.post("/contact-admin")
def user_contact_admin(msg_in: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    text = msg_in.get("message", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="نص الرسالة مطلوب")
    admins = db.query(User).filter(User.role.in_([UserRole.super_admin, UserRole.admin])).all()
    for admin in admins:
        NotificationService.send(
            db=db, user_id=admin.id, notification_type=NotificationType.general,
            title=f"رسالة جديدة من {current_user.full_name}", message=text,
            related_entity_type="user", related_entity_id=current_user.id,
        )
    return {"success": True, "message": "تم إرسال الرسالة إلى إدارة المنصة"}


@router.get("/broadcasts", summary="Get admin broadcasts history")
def get_broadcasts_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    return [item.to_dict() for item in db.query(AdminBroadcast).order_by(AdminBroadcast.sent_at.desc()).all()]


@router.post("/broadcasts/preview", summary="Preview target recipients count for broadcast filters")
def preview_broadcast_audience(
    payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user),
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    target_group = payload.get("target_group") or payload.get("targetGroup") or "all"
    user_filters = payload.get("user_filters") or payload.get("userFilters") or {}
    consultant_filters = payload.get("consultant_filters") or payload.get("consultantFilters") or {}
    audience = payload.get("audience")

    try:
        matching_count = count_broadcast_recipients(
            db, target_group=target_group, user_filters=user_filters,
            consultant_filters=consultant_filters, audience=audience,
        )
        return {"success": True, "target_group": target_group, "matching_count": matching_count}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin-broadcast", summary="Admin broadcast notification to selected audience")
def admin_broadcast_notification(
    payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user),
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    title = (payload.get("title") or "تنبيه تشريعي").strip()
    message = (payload.get("message") or "").strip()
    target_group = payload.get("target_group") or payload.get("targetGroup") or "all"
    user_filters = payload.get("user_filters") or payload.get("userFilters") or {}
    consultant_filters = payload.get("consultant_filters") or payload.get("consultantFilters") or {}
    audience = payload.get("audience")
    priority = payload.get("priority") or "normal"

    if not message or not title:
        raise HTTPException(status_code=400, detail="العنوان ونص الرسالة مطلوبان")

    try:
        matching_count = count_broadcast_recipients(
            db, target_group=target_group, user_filters=user_filters,
            consultant_filters=consultant_filters, audience=audience,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if matching_count == 0:
        raise HTTPException(
            status_code=400,
            detail="لا يوجد أي مستخدم أو مستشار يطابق الفلاتر المحددة، تم إلغاء الإرسال"
        )

    source_id = payload.get("source_id") or payload.get("sourceId")
    source_title = payload.get("source_title") or payload.get("sourceTitle")

    stored_user_filters = dict(user_filters or {})
    if source_id:
        stored_user_filters["source_id"] = str(source_id)
    if source_title:
        stored_user_filters["source_title"] = str(source_title)

    sent_count = send_admin_broadcast(
        db, title=title, message=message, target_group=target_group,
        user_filters=user_filters, consultant_filters=consultant_filters,
        priority=priority, audience=audience, source_id=source_id,
    )

    labels = {"all": "كافة المسجلين", "users": "المستخدمين والشركات", "consultants": "المستشارون فقط"}
    bc = AdminBroadcast(
        title=title, message=message, target_group=target_group,
        audience_label=labels.get(target_group, "الكل"),
        type=payload.get("type") or "update", priority=priority,
        user_filters=stored_user_filters, consultant_filters=consultant_filters,
        delivered_count=sent_count, created_by=current_user.id,
    )
    db.add(bc)
    db.commit()
    db.refresh(bc)
    return {"success": True, "sent_count": sent_count, "broadcast": bc.to_dict()}


@router.post("/broadcasts/{broadcast_id}/resend", summary="Resend an admin broadcast")
def resend_admin_broadcast(broadcast_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    bc = db.query(AdminBroadcast).filter(AdminBroadcast.id == broadcast_id).first()
    if not bc:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    sent_count = send_admin_broadcast(
        db, title=bc.title, message=bc.message, target_group=bc.target_group,
        user_filters=bc.user_filters or {}, consultant_filters=bc.consultant_filters or {}, priority=bc.priority,
    )
    bc.sent_at = datetime.now(timezone.utc)
    bc.delivered_count = sent_count
    db.commit()
    return {"success": True, "sent_count": sent_count, "broadcast": bc.to_dict()}


@router.delete("/broadcasts/{broadcast_id}", summary="Delete an admin broadcast")
def delete_admin_broadcast(broadcast_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    bc = db.query(AdminBroadcast).filter(AdminBroadcast.id == broadcast_id).first()
    if not bc:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    db.delete(bc)
    db.commit()
    return {"success": True, "message": "تم حذف الإشعار من سجل البث"}


router.add_api_websocket_route("/ws", websocket_notifications_endpoint)

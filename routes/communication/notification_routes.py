from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from controllers import NotificationController
from helpers.database import get_db
from helpers.enums import NotificationType, UserRole
from models import User
from routes.communication.notification_ws import websocket_notifications_endpoint
from routes.deps import get_current_active_user
from schemes import NotificationBulkReadOut, NotificationOut, UnreadCountOut
from services.communication.admin_broadcast_service import send_admin_broadcast
from services.communication.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationOut], summary="Get user notifications")
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status (true/false)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return NotificationController.get_my_notifications(
        db, current_user, is_read=is_read, page=page, limit=limit
    )


@router.get("/unread-count", response_model=UnreadCountOut, summary="Get unread notifications count")
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return NotificationController.get_unread_count(db, current_user)


@router.patch("/{notification_id}/read", response_model=NotificationOut, summary="Mark a notification as read")
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return NotificationController.mark_as_read(db, current_user, notification_id)


@router.post("/read-all", response_model=NotificationBulkReadOut, summary="Mark all notifications as read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return NotificationController.mark_all_as_read(db, current_user)


@router.delete("/{notification_id}", summary="Delete a notification")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return NotificationController.delete_notification(db, current_user, notification_id)


@router.post("/contact-admin", summary="Send direct message from user to platform administration")
def user_contact_admin(
    msg_in: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    text = msg_in.get("message", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="نص الرسالة مطلوب")
    admins = db.query(User).filter(User.role.in_([UserRole.super_admin, UserRole.admin])).all()
    for admin in admins:
        NotificationService.send(
            db=db,
            user_id=admin.id,
            notification_type=NotificationType.general,
            title=f"رسالة جديدة من {current_user.full_name}",
            message=text,
            related_entity_type="user",
            related_entity_id=current_user.id,
        )
    return {"success": True, "message": "تم إرسال الرسالة إلى إدارة المنصة"}


@router.post("/admin-broadcast", summary="Admin broadcast notification to selected audience")
def admin_broadcast_notification(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="غير مصرح")
    title = (payload.get("title") or "تنبيه تشريعي").strip()
    message = (payload.get("message") or "").strip()
    audience = payload.get("audience") or []
    if not message:
        raise HTTPException(status_code=400, detail="نص الرسالة مطلوب")
    if not audience:
        raise HTTPException(status_code=400, detail="اختر فئة مستهدفة واحدة على الأقل")
    sent_count = send_admin_broadcast(db, title=title, message=message, audience=audience)
    return {"success": True, "sent_count": sent_count}


router.add_api_websocket_route("/ws", websocket_notifications_endpoint)

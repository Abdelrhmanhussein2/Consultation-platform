from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from models import User
from schemes import NotificationOut, UnreadCountOut, NotificationBulkReadOut
from controllers import NotificationController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=List[NotificationOut],
    summary="Get user notifications",
)
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status (true/false)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user's notifications, newest first.
    Can filter by `is_read` status (e.g. `?is_read=false` to see only unread notifications).
    """
    return NotificationController.get_my_notifications(
        db, current_user, is_read=is_read, page=page, limit=limit
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountOut,
    summary="Get unread notifications count",
)
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the count of unread notifications for badge display in the frontend.
    """
    return NotificationController.get_unread_count(db, current_user)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
    summary="Mark a notification as read",
)
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks a single notification as read.
    Only the owner of the notification can mark it as read.
    """
    return NotificationController.mark_as_read(db, current_user, notification_id)


@router.post(
    "/read-all",
    response_model=NotificationBulkReadOut,
    summary="Mark all notifications as read",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks all unread notifications for the logged-in user as read.
    """
    return NotificationController.mark_all_as_read(db, current_user)

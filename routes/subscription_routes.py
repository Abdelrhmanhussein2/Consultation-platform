from fastapi import APIRouter, Depends, status, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from helpers.database import get_db
from models.user import User
from routes.deps import get_current_user
from controllers.subscription_controller import SubscriptionController

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Plans"])

# ══════════════════════════════════════════════════════════════════
# USER & CONSULTANT PORTAL ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@router.get("/my-subscription")
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the authenticated user's/consultant's active subscription,
    including quotas, remaining days, and 2-day expiration alert.
    """
    return SubscriptionController.get_my_subscription(db, current_user.id)

@router.post("/request-subscription")
async def submit_subscription_request(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a subscription upgrade/purchase request to the admin desk.
    """
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    plan_id = payload.get("plan_id")
    if not plan_id:
        raise HTTPException(status_code=400, detail="plan_id is required")
    cycle = payload.get("cycle", "شهري")
    payment_method = payload.get("payment_method", "بطاقة بنكية")
    notes = payload.get("notes", "")

    return SubscriptionController.submit_subscription_request(
        db=db,
        user_id=current_user.id,
        plan_id=plan_id,
        cycle=cycle,
        payment_method=payment_method,
        notes=notes
    )

@router.post("/renew-subscription")
def renew_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renew the current active subscription with the same services.
    """
    return SubscriptionController.renew_subscription(db, current_user.id)

@router.post("/check-expirations")
def check_expirations(db: Session = Depends(get_db)):
    """
    Scans expiring subscriptions (<= 2 days) and triggers reminder notifications.
    """
    count = SubscriptionController.check_and_notify_expirations(db)
    return {"success": True, "notified_subscribers": count}

# ══════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return SubscriptionController.get_dashboard_stats(db)

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    return SubscriptionController.get_all_plans(db)

@router.post("/plans")
def save_plan(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    return SubscriptionController.create_or_update_plan(db, payload)

@router.patch("/plans/{plan_id}/toggle-active")
def toggle_plan_active(plan_id: str, db: Session = Depends(get_db)):
    is_active = SubscriptionController.toggle_plan_active(db, plan_id)
    return {"success": True, "active": is_active}

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, db: Session = Depends(get_db)):
    success = SubscriptionController.delete_plan(db, plan_id)
    return {"success": success}

@router.get("/subscribers")
def get_subscribers(
    search: Optional[str] = None,
    plan: Optional[str] = None,
    life: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return SubscriptionController.get_subscribers(db, search, plan, life)

@router.post("/override")
def admin_override(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    sub_id = payload.get("sub_id")
    override_type = payload.get("type")
    value = payload.get("value", "")
    reason = payload.get("reason", "")
    success = SubscriptionController.admin_override(db, sub_id, override_type, value, reason)
    return {"success": success}

@router.post("/upgrade")
def change_plan(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    sub_id = payload.get("sub_id")
    target_plan = payload.get("target_plan")
    mode = payload.get("mode", "immediate")
    success = SubscriptionController.change_subscriber_plan(db, sub_id, target_plan, mode)
    return {"success": success}

@router.get("/requests")
def get_requests(db: Session = Depends(get_db)):
    return SubscriptionController.get_requests(db)

@router.post("/requests/{req_id}/approve")
def approve_request(req_id: str, db: Session = Depends(get_db)):
    success = SubscriptionController.approve_request(db, req_id)
    return {"success": success}

@router.post("/requests/{req_id}/reject")
def reject_request(req_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    reason = payload.get("reason", "تم الرفض")
    success = SubscriptionController.reject_request(db, req_id, reason)
    return {"success": success}

@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return SubscriptionController.get_orders(db)

@router.get("/versions")
def get_versions(db: Session = Depends(get_db)):
    return SubscriptionController.get_versions(db)

@router.post("/migrate")
def migrate_subscribers(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    plan_name = payload.get("plan_name")
    source_ver = payload.get("source_version")
    target_ver = payload.get("target_version")
    mode = payload.get("mode", "immediate")
    reason = payload.get("reason", "ترحيل دوري")
    count = SubscriptionController.migrate_subscribers(db, plan_name, source_ver, target_ver, mode, reason)
    return {"success": True, "migrated_count": count}

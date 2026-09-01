from fastapi import APIRouter, Depends, status, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from helpers.database import get_db
from models.user import User
from controllers.subscription_controller import SubscriptionController

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Plans"])

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

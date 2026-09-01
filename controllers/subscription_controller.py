import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc

from models.subscription_plan import SubscriptionPlan, SubscriptionPlanCycle, SubscriptionPlanVersion
from models.user_subscription import UserSubscription, SubscriptionUsageLog, SubscriptionTimeline
from models.subscription_request import SubscriptionRequest, SubscriptionOrder
from models.user import User

class SubscriptionController:

    # ══════════════════════════════════════════════════════════════════
    # 1. DASHBOARD & ANALYTICS
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        total_subscribers = db.query(UserSubscription).count()
        active_count = db.query(UserSubscription).filter(UserSubscription.status == "active").count()
        grace_count = db.query(UserSubscription).filter(UserSubscription.status.in_(["grace", "payment"])).count()
        
        now = datetime.utcnow()
        thirty_days_later = now + timedelta(days=30)
        expiring_count = db.query(UserSubscription).filter(
            UserSubscription.end_date.between(now, thirty_days_later)
        ).count()

        # Plan Distribution
        plans = db.query(SubscriptionPlan).all()
        plan_distribution = []
        for p in plans:
            count = db.query(UserSubscription).filter(UserSubscription.plan_id == p.id).count()
            plan_distribution.append({
                "plan_name": p.name,
                "count": count
            })

        # Monthly vs Yearly
        monthly_count = db.query(UserSubscription).filter(UserSubscription.cycle == "شهري").count()
        yearly_count = db.query(UserSubscription).filter(UserSubscription.cycle == "سنوي").count()

        # Expiring soon list
        expiring_subs = db.query(UserSubscription).options(
            joinedload(UserSubscription.user),
            joinedload(UserSubscription.plan)
        ).filter(
            UserSubscription.end_date >= now
        ).order_by(UserSubscription.end_date.asc()).limit(5).all()

        expiring_list = [
            {
                "id": str(s.id),
                "name": s.user.full_name if s.user else "مشترك",
                "plan": s.plan.name if s.plan else "—",
                "cycle": s.cycle,
                "end_date": s.end_date.strftime("%Y-%m-%d") if s.end_date else "—",
                "status": s.status
            }
            for s in expiring_subs
        ]

        return {
            "active_subscriptions": active_count,
            "expiring_30_days": expiring_count,
            "upgrades_this_month": 11,
            "grace_period_count": grace_count,
            "plan_distribution": plan_distribution,
            "monthly_count": monthly_count,
            "yearly_count": yearly_count,
            "expiring_list": expiring_list,
            "total_subscribers": total_subscribers
        }

    # ══════════════════════════════════════════════════════════════════
    # 2. PLANS MANAGEMENT
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_all_plans(db: Session) -> List[Dict[str, Any]]:
        plans = db.query(SubscriptionPlan).options(
            joinedload(SubscriptionPlan.cycles)
        ).order_by(SubscriptionPlan.created_at.asc()).all()

        results = []
        for p in plans:
            cycles_dict = {}
            for c in p.cycles:
                cycles_dict[c.period] = {
                    "enabled": c.is_enabled,
                    "price": c.price,
                    "cases": c.cases_limit,
                    "points": c.points_limit,
                    "downloads": c.downloads_limit,
                    "prints": c.prints_limit,
                    "consultations": c.free_consultations_limit,
                    "trialDays": c.trial_days,
                    "labels": {
                        "price": "السعر الشهري" if c.period == "monthly" else "السعر السنوي",
                        "cases": "الحالات / الملفات الضريبية",
                        "points": "عدد النقاط",
                        "downloads": "التحميلات",
                        "prints": "الطباعة",
                        "consultations": "الاستشارات المجانية",
                        "trialDays": "عدد أيام التجربة"
                    }
                }
            
            results.append({
                "id": str(p.id),
                "name": p.name,
                "desc": p.desc,
                "team": p.team_members,
                "support": p.support_level,
                "ai": p.ai_enabled,
                "trial": p.trial_enabled,
                "refund": p.refund_policy,
                "active": p.is_active,
                "default": p.is_default,
                "recommended": p.is_recommended,
                "cycles": cycles_dict
            })
        return results

    @staticmethod
    def create_or_update_plan(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        plan_id = data.get("id")
        plan = None
        if plan_id:
            try:
                plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == uuid.UUID(str(plan_id))).first()
            except ValueError:
                plan = None

        if not plan:
            plan = SubscriptionPlan(
                name=data.get("name"),
                desc=data.get("desc"),
                team_members=data.get("team", 1),
                support_level=data.get("support", "خلال 48 ساعة"),
                ai_enabled=data.get("ai", False),
                trial_enabled=data.get("trial", False),
                refund_policy=data.get("refund", False),
                is_active=data.get("active", True),
                is_default=data.get("default", False),
                is_recommended=data.get("recommended", False)
            )
            db.add(plan)
            db.flush()
        else:
            plan.name = data.get("name", plan.name)
            plan.desc = data.get("desc", plan.desc)
            plan.team_members = data.get("team", plan.team_members)
            plan.support_level = data.get("support", plan.support_level)
            plan.ai_enabled = data.get("ai", plan.ai_enabled)
            plan.trial_enabled = data.get("trial", plan.trial_enabled)
            plan.refund_policy = data.get("refund", plan.refund_policy)
            plan.is_active = data.get("active", plan.is_active)
            plan.is_default = data.get("default", plan.is_default)
            plan.is_recommended = data.get("recommended", plan.is_recommended)

        if plan.is_default:
            db.query(SubscriptionPlan).filter(SubscriptionPlan.id != plan.id).update({"is_default": False})

        # Save Cycles
        cycles_data = data.get("cycles", {})
        for period, c_info in cycles_data.items():
            cycle_obj = db.query(SubscriptionPlanCycle).filter(
                SubscriptionPlanCycle.plan_id == plan.id,
                SubscriptionPlanCycle.period == period
            ).first()
            if not cycle_obj:
                cycle_obj = SubscriptionPlanCycle(
                    plan_id=plan.id,
                    period=period,
                    price=c_info.get("price", 0.0),
                    cases_limit=c_info.get("cases", 5),
                    points_limit=c_info.get("points", 0),
                    downloads_limit=c_info.get("downloads", 5),
                    prints_limit=c_info.get("prints", 5),
                    free_consultations_limit=c_info.get("consultations", 0),
                    trial_days=c_info.get("trialDays", 0),
                    is_enabled=c_info.get("enabled", True)
                )
                db.add(cycle_obj)
            else:
                cycle_obj.price = c_info.get("price", cycle_obj.price)
                cycle_obj.cases_limit = c_info.get("cases", cycle_obj.cases_limit)
                cycle_obj.points_limit = c_info.get("points", cycle_obj.points_limit)
                cycle_obj.downloads_limit = c_info.get("downloads", cycle_obj.downloads_limit)
                cycle_obj.prints_limit = c_info.get("prints", cycle_obj.prints_limit)
                cycle_obj.free_consultations_limit = c_info.get("consultations", cycle_obj.free_consultations_limit)
                cycle_obj.trial_days = c_info.get("trialDays", cycle_obj.trial_days)
                cycle_obj.is_enabled = c_info.get("enabled", cycle_obj.is_enabled)

        db.commit()
        db.refresh(plan)
        return {"success": True, "plan_id": str(plan.id)}

    @staticmethod
    def toggle_plan_active(db: Session, plan_id: str) -> bool:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == uuid.UUID(plan_id)).first()
        if plan:
            plan.is_active = not plan.is_active
            db.commit()
            return plan.is_active
        return False

    @staticmethod
    def delete_plan(db: Session, plan_id: str) -> bool:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == uuid.UUID(plan_id)).first()
        if plan:
            db.delete(plan)
            db.commit()
            return True
        return False

    # ══════════════════════════════════════════════════════════════════
    # 3. SUBSCRIBERS
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_subscribers(db: Session, search: Optional[str] = None, plan_filter: Optional[str] = None, life_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(UserSubscription).options(
            joinedload(UserSubscription.user),
            joinedload(UserSubscription.plan),
            joinedload(UserSubscription.usage_logs),
            joinedload(UserSubscription.timeline)
        )

        subs = query.order_by(UserSubscription.created_at.desc()).all()
        results = []
        for s in subs:
            user_name = s.user.full_name if s.user else "مشترك"
            user_email = s.user.email if s.user else "—"
            plan_name = s.plan.name if s.plan else "—"

            if search:
                if search not in user_name and search not in user_email:
                    continue
            if plan_filter and plan_filter != "all":
                if plan_name != plan_filter:
                    continue
            if life_filter and life_filter != "all":
                if s.status != life_filter:
                    continue

            # Group usage logs
            usage_logs = {"points": [], "downloads": [], "consultations": [], "team": []}
            for log in s.usage_logs:
                if log.resource_type in usage_logs:
                    usage_logs[log.resource_type].append({
                        "title": log.title,
                        "desc": log.description,
                        "date": log.created_at.strftime("%Y-%m-%d %I:%M %p") if log.created_at else "—",
                        "badge": log.category_badge
                    })

            # History timeline
            history = [
                {
                    "t": h.title,
                    "d": h.created_at.strftime("%Y-%m-%d %I:%M %p") if h.created_at else "—",
                    "p": h.actor_name
                }
                for h in s.timeline
            ]

            results.append({
                "id": str(s.id),
                "name": user_name,
                "email": user_email,
                "plan": plan_name,
                "cycle": s.cycle,
                "life": s.status,
                "start": s.start_date.strftime("%Y-%m-%d") if s.start_date else "—",
                "end": s.end_date.strftime("%Y-%m-%d") if s.end_date else "—",
                "renew": s.renewal_date.strftime("%Y-%m-%d") if s.renewal_date else "—",
                "trialInfo": s.trial_info or "",
                "pointsUsed": s.points_used,
                "pointsTotal": s.points_total,
                "downloadsUsed": s.downloads_used,
                "downloadsTotal": s.downloads_total,
                "consultUsed": s.consultations_used,
                "consultTotal": s.consultations_total,
                "teamUsed": s.team_used,
                "teamTotal": s.team_total,
                "scheduled": s.scheduled_change or "لا يوجد",
                "planVersion": s.plan_version,
                "history": history,
                "usageLogs": usage_logs
            })
        return results

    @staticmethod
    def admin_override(db: Session, sub_id: str, override_type: str, value: str, reason: str) -> bool:
        s = db.query(UserSubscription).filter(UserSubscription.id == uuid.UUID(sub_id)).first()
        if not s:
            return False

        if override_type == "إضافة رصيد نقاط":
            added = int(value) if value.isdigit() else 500
            s.points_total += added
        elif override_type == "منح استشارة مجانية إضافية":
            s.consultations_total += 1
        elif override_type == "تمديد فترة الاشتراك":
            days = int(value) if value.isdigit() else 14
            s.end_date += timedelta(days=days)
            s.renewal_date += timedelta(days=days)

        # Add to timeline
        tl = SubscriptionTimeline(
            subscription_id=s.id,
            title=f"استثناء إداري: {override_type} ({value})",
            actor_name="مدير الباقات — أحمد منصور",
            event_type="override",
            details=reason
        )
        db.add(tl)
        db.commit()
        return True

    @staticmethod
    def change_subscriber_plan(db: Session, sub_id: str, target_plan_name: str, mode: str) -> bool:
        s = db.query(UserSubscription).filter(UserSubscription.id == uuid.UUID(sub_id)).first()
        target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == target_plan_name).first()
        if not s or not target_plan:
            return False

        if mode == "immediate":
            s.plan_id = target_plan.id
            tl = SubscriptionTimeline(
                subscription_id=s.id,
                title=f"ترقية فورية إلى باقة {target_plan_name}",
                actor_name="مدير الباقات — أحمد منصور",
                event_type="upgrade"
            )
        else:
            s.scheduled_change = f"التحويل إلى باقة {target_plan_name} عند التجديد"
            s.status = "scheduled"
            tl = SubscriptionTimeline(
                subscription_id=s.id,
                title=f"جدولة تغيير الباقة إلى {target_plan_name} عند التجديد",
                actor_name="مدير الباقات — أحمد منصور",
                event_type="upgrade"
            )
        db.add(tl)
        db.commit()
        return True

    # ══════════════════════════════════════════════════════════════════
    # 4. REQUESTS & ORDERS
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_requests(db: Session) -> List[Dict[str, Any]]:
        reqs = db.query(SubscriptionRequest).options(
            joinedload(SubscriptionRequest.user),
            joinedload(SubscriptionRequest.plan)
        ).order_by(SubscriptionRequest.created_at.desc()).all()

        return [
            {
                "id": str(r.id),
                "requestNo": r.request_no,
                "name": r.user.full_name if r.user else "عميل",
                "email": r.user.email if r.user else "—",
                "plan": r.plan.name if r.plan else "—",
                "subscription": r.subscription,
                "payment": r.payment_method,
                "amount": r.amount,
                "status": r.status,
                "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "—",
                "time": r.created_at.strftime("%I:%M %p") if r.created_at else "—",
                "isFreeGrant": r.is_free_grant,
                "grantDuration": r.grant_duration,
                "grantedBy": r.granted_by,
                "grantReason": r.grant_reason,
                "rejectReason": r.reject_reason
            }
            for r in reqs
        ]

    @staticmethod
    def approve_request(db: Session, req_id: str) -> bool:
        r = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == uuid.UUID(req_id)).first()
        if not r:
            return False
        r.status = "approved"

        # Create or update user subscription
        existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == r.user_id).first()
        now = datetime.utcnow()
        end_d = now + timedelta(days=365 if r.subscription == "سنوي" else 30)
        
        if not existing_sub:
            new_sub = UserSubscription(
                user_id=r.user_id,
                plan_id=r.plan_id,
                cycle=r.subscription,
                status="active",
                start_date=now,
                end_date=end_d,
                renewal_date=end_d,
                points_total=800 if r.plan.name == "أساسية" else 3000 if r.plan.name == "احترافية" else 20,
                downloads_total=25 if r.plan.name == "أساسية" else 100 if r.plan.name == "احترافية" else 5,
                consultations_total=1 if r.plan.name == "أساسية" else 3 if r.plan.name == "احترافية" else 0
            )
            db.add(new_sub)
            db.flush()
            tl = SubscriptionTimeline(
                subscription_id=new_sub.id,
                title="تم اعتماد وتفعيل الاشتراك",
                actor_name="مدير الباقات — أحمد منصور"
            )
            db.add(tl)
        else:
            existing_sub.plan_id = r.plan_id
            existing_sub.cycle = r.subscription
            existing_sub.status = "active"
            existing_sub.start_date = now
            existing_sub.end_date = end_d
            existing_sub.renewal_date = end_d

        db.commit()
        return True

    @staticmethod
    def reject_request(db: Session, req_id: str, reason: str) -> bool:
        r = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == uuid.UUID(req_id)).first()
        if not r:
            return False
        r.status = "rejected"
        r.reject_reason = reason
        db.commit()
        return True

    @staticmethod
    def get_orders(db: Session) -> List[Dict[str, Any]]:
        orders = db.query(SubscriptionOrder).options(
            joinedload(SubscriptionOrder.user)
        ).order_by(SubscriptionOrder.created_at.desc()).all()

        return [
            {
                "id": str(o.id),
                "orderNo": o.order_no,
                "name": o.user.full_name if o.user else "مشترك",
                "email": o.user.email if o.user else "—",
                "plan": o.plan_name,
                "subscription": o.subscription,
                "amount": o.amount,
                "yearlyDiscount": o.yearly_discount_pct,
                "payment": o.payment_method,
                "status": o.status,
                "date": o.created_at.strftime("%Y-%m-%d") if o.created_at else "—",
                "time": o.created_at.strftime("%I:%M %p") if o.created_at else "—"
            }
            for o in orders
        ]

    # ══════════════════════════════════════════════════════════════════
    # 5. VERSIONS & MIGRATIONS
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_versions(db: Session) -> List[Dict[str, Any]]:
        vers = db.query(SubscriptionPlanVersion).options(
            joinedload(SubscriptionPlanVersion.plan)
        ).order_by(SubscriptionPlanVersion.created_at.desc()).all()

        return [
            {
                "id": str(v.id),
                "plan": v.plan.name if v.plan else "—",
                "version": v.version,
                "date": v.release_date,
                "scope": v.scope,
                "changes": v.changes,
                "active": v.is_active
            }
            for v in vers
        ]

    @staticmethod
    def migrate_subscribers(db: Session, plan_name: str, source_version: str, target_version: str, mode: str, reason: str) -> int:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan_name).first()
        if not plan:
            return 0

        subs = db.query(UserSubscription).filter(
            UserSubscription.plan_id == plan.id,
            UserSubscription.plan_version == source_version
        ).all()

        count = 0
        for s in subs:
            count += 1
            if mode == "immediate":
                s.plan_version = target_version
                tl = SubscriptionTimeline(
                    subscription_id=s.id,
                    title=f"تم ترحيل الاشتراك من {source_version} إلى {target_version}",
                    actor_name="مدير الباقات — أحمد منصور",
                    details=reason
                )
            else:
                s.scheduled_change = f"الترحيل إلى {target_version} عند التجديد"
                s.status = "scheduled"
                tl = SubscriptionTimeline(
                    subscription_id=s.id,
                    title=f"جدولة الترحيل إلى {target_version} عند التجديد",
                    actor_name="مدير الباقات — أحمد منصور",
                    details=reason
                )
            db.add(tl)

        db.commit()
        return count

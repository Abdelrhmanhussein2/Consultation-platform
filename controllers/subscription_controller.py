import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc

from models.subscription_plan import SubscriptionPlan, SubscriptionPlanCycle, SubscriptionPlanVersion
from models.user_subscription import UserSubscription, SubscriptionUsageLog, SubscriptionTimeline
from models.subscription_request import SubscriptionRequest, SubscriptionOrder
from models.user import User
from models.notification import Notification
from helpers.enums import NotificationType, UserRole

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
    def change_subscriber_plan(db: Session, sub_id: str, target_plan_name: str, mode: str = "immediate") -> bool:
        s = None
        try:
            sub_uuid = uuid.UUID(sub_id)
            s = db.query(UserSubscription).filter(UserSubscription.id == sub_uuid).first()
            if not s:
                # In case sub_id is user_id
                s = db.query(UserSubscription).filter(UserSubscription.user_id == sub_uuid).first()
        except Exception:
            pass

        target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == target_plan_name).first()
        if not target_plan:
            return False

        now = datetime.utcnow()
        is_yearly = (s.cycle == "سنوي") if (s and s.cycle) else False
        end_d = now + timedelta(days=365 if is_yearly else 30)

        points = (42000 if is_yearly else 3000) if target_plan_name == "احترافية" else (12000 if is_yearly else 800) if target_plan_name == "أساسية" else 20
        downloads = (1400 if is_yearly else 100) if target_plan_name == "احترافية" else (350 if is_yearly else 25) if target_plan_name == "أساسية" else 5
        consultations = (40 if is_yearly else 3) if target_plan_name == "احترافية" else (15 if is_yearly else 1) if target_plan_name == "أساسية" else 0

        if not s:
            try:
                user_uuid = uuid.UUID(sub_id)
                user = db.query(User).filter(User.id == user_uuid).first()
                if user:
                    s = UserSubscription(
                        user_id=user.id,
                        plan_id=target_plan.id,
                        cycle="سنوي" if is_yearly else "شهري",
                        status="active",
                        start_date=now,
                        end_date=end_d,
                        renewal_date=end_d,
                        points_total=points,
                        points_used=0,
                        downloads_total=downloads,
                        downloads_used=0,
                        consultations_total=consultations,
                        consultations_used=0
                    )
                    db.add(s)
                    db.flush()
            except Exception:
                return False

        if not s:
            return False

        if mode == "immediate":
            s.plan_id = target_plan.id
            s.status = "active"
            s.start_date = now
            s.end_date = end_d
            s.renewal_date = end_d
            s.points_total = points
            s.points_used = 0
            s.downloads_total = downloads
            s.downloads_used = 0
            s.consultations_total = consultations
            s.consultations_used = 0
            tl = SubscriptionTimeline(
                subscription_id=s.id,
                title=f"تغيير فوري للباقة إلى {target_plan_name}",
                actor_name="إدارة المنصة",
                event_type="upgrade"
            )
            db.add(tl)
        else:
            s.scheduled_change = f"التحويل إلى باقة {target_plan_name} عند التجديد"
            tl = SubscriptionTimeline(
                subscription_id=s.id,
                title=f"جدولة تغيير الباقة إلى {target_plan_name} عند التجديد",
                actor_name="إدارة المنصة",
                event_type="upgrade"
            )
            db.add(tl)

        # Dispatch live in-app notification to user
        notif = Notification(
            user_id=s.user_id,
            type=NotificationType.general,
            title="تحديث باقة الاشتراك",
            message=f"تم تغيير باقة اشتراكك بواسطة إدارة المنصة إلى باقة [{target_plan_name}]. تم تحديث حسابك ورصيدك الجديد تلقائياً."
        )
        db.add(notif)
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
        is_yearly = (r.subscription == "سنوي")
        end_d = now + timedelta(days=365 if is_yearly else 30)
        
        plan_name = r.plan.name if r.plan else "المعتمدة"
        points = (42000 if is_yearly else 3000) if plan_name == "احترافية" else (12000 if is_yearly else 800) if plan_name == "أساسية" else 0
        downloads = (1400 if is_yearly else 100) if plan_name == "احترافية" else (350 if is_yearly else 25) if plan_name == "أساسية" else 5
        consultations = (40 if is_yearly else 3) if plan_name == "احترافية" else (15 if is_yearly else 1) if plan_name == "أساسية" else 0

        if not existing_sub:
            new_sub = UserSubscription(
                user_id=r.user_id,
                plan_id=r.plan_id,
                cycle=r.subscription,
                status="active",
                start_date=now,
                end_date=end_d,
                renewal_date=end_d,
                points_total=points,
                points_used=0,
                downloads_total=downloads,
                downloads_used=0,
                consultations_total=consultations,
                consultations_used=0
            )
            db.add(new_sub)
            db.flush()
            tl = SubscriptionTimeline(
                subscription_id=new_sub.id,
                title="تم اعتماد وتفعيل الاشتراك",
                actor_name="إدارة المنصة"
            )
            db.add(tl)
        else:
            existing_sub.plan_id = r.plan_id
            existing_sub.cycle = r.subscription
            existing_sub.status = "active"
            existing_sub.start_date = now
            existing_sub.end_date = end_d
            existing_sub.renewal_date = end_d
            existing_sub.points_total = points
            existing_sub.points_used = 0
            existing_sub.downloads_total = downloads
            existing_sub.downloads_used = 0
            existing_sub.consultations_total = consultations
            existing_sub.consultations_used = 0

        # Dispatch Notification to User
        notif = Notification(
            user_id=r.user_id,
            type=NotificationType.general,
            title="تمت الموافقة على اشتراكك بنجاح",
            message=f"تمت الموافقة على تفعيل باقة [{plan_name}] ({r.subscription}). تم تحديث باقتك ورصيدك الجديد تلقائياً ويمكنك استخدامه الآن."
        )
        db.add(notif)
        db.commit()
        return True

    @staticmethod
    def reject_request(db: Session, req_id: str, reason: str) -> bool:
        r = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == uuid.UUID(req_id)).first()
        if not r:
            return False
        r.status = "rejected"
        r.reject_reason = reason

        plan_name = r.plan.name if r.plan else "الباقة"
        notif = Notification(
            user_id=r.user_id,
            type=NotificationType.general,
            title=f"تحديث بخصوص طلب باقة [{plan_name}]",
            message=f"نعتذر، لم يتم قبول طلب الاشتراك في باقة [{plan_name}]. السبب: {reason}"
        )
        db.add(notif)
        db.commit()
        return True

    # ══════════════════════════════════════════════════════════════════
    # 6. USER & CONSULTANT PORTAL LIFECYCLE (Active Sub, Remaining Days, Renew)
    # ══════════════════════════════════════════════════════════════════
    @staticmethod
    def get_my_subscription(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        sub = db.query(UserSubscription).options(
            joinedload(UserSubscription.plan)
        ).filter(
            UserSubscription.user_id == user_id
        ).order_by(UserSubscription.created_at.desc()).first()

        now = datetime.utcnow()

        # Get all pending requests for this user
        pending_reqs = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id,
            SubscriptionRequest.status == "pending"
        ).all()
        pending_plan_ids = [str(r.plan_id) for r in pending_reqs if r.plan_id]
        pending_plan_names = [r.plan.name for r in pending_reqs if r.plan]

        if not sub:
            # Default Free Tier
            return {
                "has_subscription": False,
                "plan_name": "الباقة المجانية",
                "badge": "مجاني",
                "badge_color": "gray",
                "status": "active",
                "cycle": "غير محدود",
                "start_date": "—",
                "end_date": "—",
                "renewal_date": "—",
                "remaining_days": 0,
                "is_expiring_soon": False,
                "expiring_reminder": None,
                "consultations_total": 0,
                "consultations_used": 0,
                "ai_points_total": 20,
                "ai_points_used": 0,
                "tax_forms_total": 1,
                "tax_forms_used": 0,
                "auto_renew": False,
                "pending_plan_ids": pending_plan_ids,
                "pending_plan_names": pending_plan_names
            }

        # Calculate remaining days
        remaining_days = 0
        if sub.end_date:
            end_d = sub.end_date.replace(tzinfo=None) if hasattr(sub.end_date, 'tzinfo') and sub.end_date.tzinfo else sub.end_date
            now_naive = datetime.utcnow()
            delta = end_d - now_naive
            remaining_days = max(0, delta.days)

        is_expiring_soon = (remaining_days <= 2 and remaining_days >= 0 and sub.status == "active")
        expiring_reminder = (
            f"تنبيه: باقتك تنتهي خلال {remaining_days} يوم. يمكنك التجديد الآن بنفس الخدمات والخصائص بنقرة واحدة."
            if is_expiring_soon else None
        )

        plan_obj = sub.plan
        plan_name = plan_obj.name if plan_obj else "الباقة الأساسية"
        badge_text = "نشط" if sub.status == "active" else "معلّق"
        badge_col = "green" if sub.status == "active" else "amber"

        return {
            "has_subscription": True,
            "subscription_id": str(sub.id),
            "plan_id": str(sub.plan_id) if sub.plan_id else None,
            "plan_name": plan_name,
            "badge": badge_text,
            "badge_color": badge_col,
            "status": sub.status,
            "cycle": sub.cycle or "شهري",
            "start_date": sub.start_date.strftime("%Y-%m-%d") if sub.start_date else "2026-08-01",
            "end_date": sub.end_date.strftime("%Y-%m-%d") if sub.end_date else "2026-09-01",
            "renewal_date": sub.renewal_date.strftime("%Y-%m-%d") if sub.renewal_date else "2026-09-01",
            "remaining_days": remaining_days,
            "is_expiring_soon": is_expiring_soon,
            "expiring_reminder": expiring_reminder,
            "consultations_total": getattr(sub, 'consultations_total', 0),
            "consultations_used": getattr(sub, 'consultations_used', 0),
            "ai_points_total": getattr(sub, 'points_total', 0),
            "ai_points_used": getattr(sub, 'points_used', 0),
            "tax_forms_total": getattr(sub, 'downloads_total', 0),
            "tax_forms_used": getattr(sub, 'downloads_used', 0),
            "auto_renew": getattr(sub, 'auto_renew', True),
            "pending_plan_ids": pending_plan_ids,
            "pending_plan_names": pending_plan_names
        }

    @staticmethod
    def submit_subscription_request(
        db: Session,
        user_id: uuid.UUID,
        plan_id: str,
        cycle: str = "شهري",
        payment_method: str = "بطاقة بنكية",
        notes: str = ""
    ) -> Dict[str, Any]:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == uuid.UUID(plan_id)).first()
        if not plan:
            raise ValueError("Plan not found")

        # Check if user already has a pending request for this exact plan
        existing_pending = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id,
            SubscriptionRequest.plan_id == plan.id,
            SubscriptionRequest.status == "pending"
        ).first()

        if existing_pending:
            raise HTTPException(
                status_code=400,
                detail=f"يوجد لديك طلب اشتراك معلّق بالفعل لباقة [{plan.name}] برقم ({existing_pending.request_no}). يرجى انتظار قرار الإدارة قبل تقديم طلب جديد لنفس الباقة."
            )

        user = db.query(User).filter(User.id == user_id).first()

        # Generate unique request number
        req_count = db.query(SubscriptionRequest).count() + 1
        req_no = f"REQ-2026-{req_count:04d}"

        amount = 50.0 if cycle in ["شهري", "monthly"] else 480.0
        # Check cycle price if exists
        period_val = "monthly" if cycle in ["شهري", "monthly"] else "yearly"
        cycle_obj = db.query(SubscriptionPlanCycle).filter(
            SubscriptionPlanCycle.plan_id == plan.id,
            or_(SubscriptionPlanCycle.period == period_val, SubscriptionPlanCycle.period == cycle)
        ).first()
        if cycle_obj:
            amount = float(cycle_obj.price)

        req = SubscriptionRequest(
            user_id=user_id,
            plan_id=plan.id,
            request_no=req_no,
            subscription=cycle,
            amount=amount,
            payment_method=payment_method,
            status="pending",
            grant_reason=notes
        )
        db.add(req)

        # Notify strictly ONLY administrators (role == admin or super_admin, not the subscriber themselves)
        admins = db.query(User).filter(
            User.role.in_([UserRole.admin, UserRole.super_admin]),
            User.id != user_id
        ).all()
        user_name = user.full_name if user else "مستخدم"
        for adm in admins:
            adm_notif = Notification(
                user_id=adm.id,
                type=NotificationType.general,
                title="طلب اشتراك جديد بانتظار الموافقة 🔔",
                message=f"قام [{user_name}] بتقديم طلب اشتراك في باقة [{plan.name}] ({cycle}). يرجى مراجعة الطلب واعتماده."
            )
            db.add(adm_notif)

        # Notify submitter
        client_notif = Notification(
            user_id=user_id,
            type=NotificationType.general,
            title="تم استلام طلب اشتراكك بنجاح",
            message=f"تم إرسال طلب اشتراكك في باقة [{plan.name}] للإدارة للمراجعة والاعتماد الفوري."
        )
        db.add(client_notif)

        db.commit()
        db.refresh(req)
        return {
            "success": True,
            "request_id": str(req.id),
            "request_no": req.request_no,
            "message": "تم إرسال طلب الاشتراك بنجاح وهو قيد مراجعة الإدارة."
        }

    @staticmethod
    def renew_subscription(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
        if not sub or not sub.plan_id:
            raise ValueError("No active subscription to renew")

        return SubscriptionController.submit_subscription_request(
            db=db,
            user_id=user_id,
            plan_id=str(sub.plan_id),
            cycle=sub.cycle,
            payment_method="تجديد تلقائي / بطاقة بنكية",
            notes="طلب تجديد الباقة الحالية بنفس الخدمات المعتمدة"
        )

    @staticmethod
    def check_and_notify_expirations(db: Session) -> int:
        now = datetime.utcnow()
        two_days_later = now + timedelta(days=2)

        expiring_subs = db.query(UserSubscription).options(
            joinedload(UserSubscription.user),
            joinedload(UserSubscription.plan)
        ).filter(
            UserSubscription.status == "active",
            UserSubscription.end_date.between(now, two_days_later)
        ).all()

        count = 0
        for s in expiring_subs:
            if s.user and s.end_date:
                plan_name = s.plan.name if s.plan else "المعتمدة"
                end_d = s.end_date.replace(tzinfo=None) if hasattr(s.end_date, 'tzinfo') and s.end_date.tzinfo else s.end_date
                days_left = max(0, (end_d - datetime.utcnow()).days)
                notif = Notification(
                    user_id=s.user_id,
                    type=NotificationType.general,
                    title="⚠️ تنبيه انتهاء الباقة (متبقي أقل من يومين)",
                    message=f"عزيزي المشترك، باقتك [{plan_name}] ستنتهي خلال {days_left} يوم. نوصي بالتجديد الآن للاحتفاظ بحصص الاستشارات ومزايا المساعد الذكي."
                )
                db.add(notif)
                count += 1

        db.commit()
        return count

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

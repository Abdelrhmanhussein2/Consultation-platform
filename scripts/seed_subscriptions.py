import os
import sys
import uuid
from datetime import datetime, timedelta

# Append the project root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from helpers.database import SessionLocal, engine, Base
from helpers.enums import UserRole, VerificationStatus, EntityType
from models.user import User
from models.subscription_plan import SubscriptionPlan, SubscriptionPlanCycle, SubscriptionPlanVersion
from models.user_subscription import UserSubscription, SubscriptionUsageLog, SubscriptionTimeline
from models.subscription_request import SubscriptionRequest, SubscriptionOrder

def seed_subscriptions():
    print("Creating all tables if they don't exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Plans
        plans_data = [
            {
                "name": "مجانية",
                "desc": "للبدء واستكشاف الخدمات الأساسية في المنصة.",
                "team": 1,
                "support": "خلال 48 ساعة",
                "ai": False,
                "trial": False,
                "refund": False,
                "active": True,
                "default": True,
                "recommended": False,
                "cycles": [
                    {"period": "monthly", "price": 0.0, "cases": 5, "points": 0, "downloads": 5, "prints": 5, "consultations": 0, "trialDays": 0},
                    {"period": "yearly", "price": 0.0, "cases": 60, "points": 0, "downloads": 60, "prints": 60, "consultations": 0, "trialDays": 0}
                ]
            },
            {
                "name": "أساسية",
                "desc": "مناسبة للأفراد والمنشآت الصغيرة التي تحتاج أدوات ضريبية أوسع.",
                "team": 5,
                "support": "خلال 24 ساعة",
                "ai": True,
                "trial": True,
                "refund": True,
                "active": True,
                "default": False,
                "recommended": False,
                "cycles": [
                    {"period": "monthly", "price": 29.99, "cases": 25, "points": 800, "downloads": 25, "prints": 25, "consultations": 1, "trialDays": 7},
                    {"period": "yearly", "price": 284.30, "cases": 350, "points": 12000, "downloads": 350, "prints": 350, "consultations": 15, "trialDays": 14}
                ]
            },
            {
                "name": "احترافية",
                "desc": "للفرق والمنشآت التي تحتاج استخدامًا مكثفًا وأولوية أعلى.",
                "team": 10,
                "support": "أولوية قصوى — 24/7",
                "ai": True,
                "trial": True,
                "refund": True,
                "active": True,
                "default": False,
                "recommended": True,
                "cycles": [
                    {"period": "monthly", "price": 79.99, "cases": 100, "points": 3000, "downloads": 100, "prints": 100, "consultations": 3, "trialDays": 14},
                    {"period": "yearly", "price": 758.30, "cases": 1400, "points": 42000, "downloads": 1400, "prints": 1400, "consultations": 40, "trialDays": 21}
                ]
            }
        ]

        plan_map = {}
        for p_data in plans_data:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == p_data["name"]).first()
            if not plan:
                plan = SubscriptionPlan(
                    name=p_data["name"],
                    desc=p_data["desc"],
                    team_members=p_data["team"],
                    support_level=p_data["support"],
                    ai_enabled=p_data["ai"],
                    trial_enabled=p_data["trial"],
                    refund_policy=p_data["refund"],
                    is_active=p_data["active"],
                    is_default=p_data["default"],
                    is_recommended=p_data["recommended"]
                )
                db.add(plan)
                db.flush()
                print(f"Created Plan: {plan.name}")

                # Add cycles
                for c_data in p_data["cycles"]:
                    cycle = SubscriptionPlanCycle(
                        plan_id=plan.id,
                        period=c_data["period"],
                        price=c_data["price"],
                        cases_limit=c_data["cases"],
                        points_limit=c_data["points"],
                        downloads_limit=c_data["downloads"],
                        prints_limit=c_data["prints"],
                        free_consultations_limit=c_data["consultations"],
                        trial_days=c_data["trialDays"],
                        is_enabled=True
                    )
                    db.add(cycle)
            plan_map[plan.name] = plan

        # 2. Seed Plan Versions
        versions_data = [
            {"plan": "أساسية", "version": "v1.0", "date": "2026-01-01", "scope": "الإصدار الحالي للمشتركين القدامى", "changes": "800 نقطة، 25 تحميلاً، استشارة مجانية واحدة"},
            {"plan": "أساسية", "version": "v2.0", "date": "2026-08-01", "scope": "للاشتراكات الجديدة فقط", "changes": "تعديل السعر السنوي وتحسين أولوية الدعم"},
            {"plan": "احترافية", "version": "v1.0", "date": "2026-01-01", "scope": "الإصدار السابق", "changes": "3000 نقطة، 100 تحميل، 3 استشارات مجانية"},
            {"plan": "احترافية", "version": "v2.0", "date": "2026-08-15", "scope": "للاشتراكات الجديدة فقط", "changes": "3500 نقطة، 120 تحميلاً، 4 استشارات مجانية"}
        ]
        for v_data in versions_data:
            plan = plan_map.get(v_data["plan"])
            if plan:
                ver_obj = db.query(SubscriptionPlanVersion).filter(
                    SubscriptionPlanVersion.plan_id == plan.id,
                    SubscriptionPlanVersion.version == v_data["version"]
                ).first()
                if not ver_obj:
                    ver_obj = SubscriptionPlanVersion(
                        plan_id=plan.id,
                        version=v_data["version"],
                        release_date=v_data["date"],
                        scope=v_data["scope"],
                        changes=v_data["changes"],
                        is_active=True
                    )
                    db.add(ver_obj)

        # 3. Seed Users & Subscriptions
        subscriber_names = [
            "شركة الأفق للتجارة", "أحمد الخطيب", "شركة المدار", "ليان الحسن", "مؤسسة الرواد", "شركة النور", "سارة المصري", "خالد منصور",
            "شركة القمة", "شركة المستقبل", "نور حداد", "شركة الشروق", "مؤسسة الصفوة", "شركة الأعمال الحديثة", "محمد العلي", "هبة الزعبي"
        ]

        for i, name in enumerate(subscriber_names):
            email = f"subscriber{i+1}@example.com"
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    full_name=name,
                    email=email,
                    phone=f"+96279{1000000+i}",
                    password_hash="mock_hash_password",
                    role=UserRole.user,
                    entity_type=EntityType.company if "شركة" in name or "مؤسسة" in name else EntityType.individual,
                    company_name=name if "شركة" in name or "مؤسسة" in name else None,
                    verification_status=VerificationStatus.approved
                )
                db.add(user)
                db.flush()

            # Create UserSubscription if not exists
            sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
            if not sub:
                free = i % 4 == 0
                p_name = "مجانية" if free else "احترافية" if i % 3 == 0 else "أساسية"
                target_plan = plan_map[p_name]
                cycle = "شهري" if free or i % 3 != 0 else "سنوي"
                life_options = ["active", "active", "renewal", "expiring", "payment", "grace"]
                status = life_options[i % len(life_options)]

                now = datetime.utcnow()
                start_d = now - timedelta(days=15)
                end_d = start_d + timedelta(days=365 if cycle == "سنوي" else 30)

                points_total = 20 if free else 3000 if p_name == "احترافية" else 800
                downloads_total = 5 if free else 100 if p_name == "احترافية" else 25
                consult_total = 0 if free else 3 if p_name == "احترافية" else 1

                sub = UserSubscription(
                    user_id=user.id,
                    plan_id=target_plan.id,
                    cycle=cycle,
                    status=status,
                    start_date=start_d,
                    end_date=end_d,
                    renewal_date=end_d,
                    points_total=points_total,
                    points_used=0 if free else int(points_total * 0.2),
                    downloads_total=downloads_total,
                    downloads_used=1 if free else 3,
                    consultations_total=consult_total,
                    consultations_used=0 if free else 1,
                    team_total=1 if free else 10 if p_name == "احترافية" else 5,
                    team_used=1,
                    plan_version="v2.0" if p_name == "احترافية" else "v1.0",
                    is_trial=free,
                    trial_info="تجربة مجانية لمدة 3 أيام • 20 نقطة • 5 تحميـلات" if free else None
                )
                db.add(sub)
                db.flush()

                # Add Usage Logs
                log1 = SubscriptionUsageLog(
                    subscription_id=sub.id,
                    resource_type="points",
                    title="المساعد الذكي — تحليل سؤال ضريبي",
                    description="تم تحليل استفسار ضريبي واستخراج المواد القانونية المرتبطة به.",
                    category_badge="المساعد الذكي"
                )
                log2 = SubscriptionUsageLog(
                    subscription_id=sub.id,
                    resource_type="downloads",
                    title="قانون ضريبة الدخل رقم 34 لسنة 2014",
                    description="تحميل بصيغة PDF من مكتبة التشريعات.",
                    category_badge="تحميل PDF"
                )
                db.add_all([log1, log2])

                # Add Timeline Steps
                tl1 = SubscriptionTimeline(
                    subscription_id=sub.id,
                    title="تم إنشاء الاشتراك",
                    actor_name="النظام",
                    event_type="create"
                )
                tl2 = SubscriptionTimeline(
                    subscription_id=sub.id,
                    title="تم اعتماد عملية الدفع",
                    actor_name="الإدارة المالية — ليان حداد",
                    event_type="pay"
                )
                tl3 = SubscriptionTimeline(
                    subscription_id=sub.id,
                    title="تم تفعيل الاشتراك",
                    actor_name="مدير الباقات — أحمد منصور",
                    event_type="activate"
                )
                db.add_all([tl1, tl2, tl3])

        # 4. Seed Requests & Orders
        for i in range(8):
            req_no = f"PR-{2026001 + i}"
            existing_req = db.query(SubscriptionRequest).filter(SubscriptionRequest.request_no == req_no).first()
            if not existing_req:
                user = db.query(User).filter(User.email == f"subscriber{i+1}@example.com").first()
                if user:
                    free_case = i % 3 == 0
                    p_name = "مجانية" if free_case else "أساسية"
                    plan = plan_map[p_name]
                    req = SubscriptionRequest(
                        request_no=req_no,
                        user_id=user.id,
                        plan_id=plan.id,
                        subscription="شهري",
                        payment_method="باقة مجانية" if free_case else "CliQ",
                        amount=0.0 if free_case else 29.99,
                        status="approved" if i % 2 == 0 else "pending",
                        is_free_grant=free_case,
                        grant_duration="30 يوماً" if free_case else None,
                        granted_by="مدير الباقات — أحمد منصور" if free_case else None,
                        grant_reason="منحة تعريفية للعميل" if free_case else None
                    )
                    db.add(req)

            order_no = f"PO-{chr(65+i)}{2026100+i}"
            existing_order = db.query(SubscriptionOrder).filter(SubscriptionOrder.order_no == order_no).first()
            if not existing_order:
                user = db.query(User).filter(User.email == f"subscriber{i+1}@example.com").first()
                if user:
                    order = SubscriptionOrder(
                        order_no=order_no,
                        user_id=user.id,
                        plan_name="أساسية" if i % 2 == 0 else "احترافية",
                        subscription="شهري",
                        amount=29.99 if i % 2 == 0 else 79.99,
                        yearly_discount_pct=0,
                        payment_method="Visa" if i % 2 == 0 else "تحويل بنكي",
                        status="approved"
                    )
                    db.add(order)

        db.commit()
        print("Subscriptions seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding subscriptions: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_subscriptions()

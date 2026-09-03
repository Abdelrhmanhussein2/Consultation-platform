import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import Toast, { useToast } from '../components/Toast/Toast';
import './UserSubscriptionsPage.css';

// Fallback plans exactly matching Admin & Database seed
const FALLBACK_PLANS = [
  {
    id: 'plan-1',
    name: 'مجانية',
    desc: 'للبدء واستكشاف الخدمات الأساسية في المنصة.',
    team: 1,
    support: 'خلال 48 ساعة',
    ai: false,
    active: true,
    default: true,
    recommended: false,
    cycles: {
      monthly: { price: 0, cases: 5, points: 0, downloads: 5, consultations: 0 },
      yearly: { price: 0, cases: 60, points: 0, downloads: 60, consultations: 0 }
    }
  },
  {
    id: 'plan-2',
    name: 'أساسية',
    desc: 'مناسبة للأفراد والمنشآت الصغيرة التي تحتاج أدوات ضريبية أوسع.',
    team: 5,
    support: 'خلال 24 ساعة',
    ai: true,
    active: true,
    default: false,
    recommended: false,
    cycles: {
      monthly: { price: 29.99, cases: 25, points: 800, downloads: 25, consultations: 1 },
      yearly: { price: 284.30, cases: 350, points: 12000, downloads: 350, consultations: 15 }
    }
  },
  {
    id: 'plan-3',
    name: 'احترافية',
    desc: 'للفرق والمنشآت التي تحتاج استخدامًا مكثفًا وأولوية أعلى.',
    team: 10,
    support: 'أولوية قصوى — 24/7',
    ai: true,
    active: true,
    default: false,
    recommended: true,
    cycles: {
      monthly: { price: 79.99, cases: 100, points: 3000, downloads: 100, consultations: 3 },
      yearly: { price: 758.30, cases: 1400, points: 42000, downloads: 1400, consultations: 40 }
    }
  }
];

export default function UserSubscriptionsPage({ navigate }) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [activeSub, setActiveSub] = useState(null);
  const [rawPlans, setRawPlans] = useState([]);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('بطاقة بنكية / فيزا');
  const [submitting, setSubmitting] = useState(false);

  // ══════════════════════════════════════════════════════════════════
  // 1. LOAD LIVE PLANS & USER SUBSCRIPTION DIRECTLY FROM DB (Auto-Poll)
  // ══════════════════════════════════════════════════════════════════
  const loadSubscriptionData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        apiFetch('/api/subscriptions/my-subscription', {}, token).catch(() => null),
        apiFetch('/api/subscriptions/plans', {}, token).catch(() => [])
      ]);

      if (subRes) {
        setActiveSub(subRes);
      }

      if (plansRes && Array.isArray(plansRes) && plansRes.length > 0) {
        setRawPlans(plansRes);
      } else {
        setRawPlans(FALLBACK_PLANS);
      }
    } catch (err) {
      console.warn('Error fetching subscriptions:', err);
      setRawPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
    // Real-time polling every 3 seconds and on window focus
    const interval = setInterval(loadSubscriptionData, 3000);
    const onFocus = () => loadSubscriptionData();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Normalize plans from database
  const plans = useMemo(() => {
    if (!rawPlans || rawPlans.length === 0) return FALLBACK_PLANS;
    const visiblePlans = rawPlans.filter(p => p.active !== false || (activeSub && activeSub.plan_name === p.name));
    return visiblePlans.map(p => {
      const monthlyCycle = p.cycles?.monthly || { price: 0, cases: 5, points: 0, downloads: 5, consultations: 0 };
      const yearlyCycle = p.cycles?.yearly || { price: 0, cases: 60, points: 0, downloads: 60, consultations: 0 };
      return {
        id: p.id,
        name: p.name,
        desc: p.desc || (p.name === 'مجانية' ? 'للبدء واستكشاف الخدمات الأساسية في المنصة.' : p.name === 'أساسية' ? 'مناسبة للأفراد والمنشآت الصغيرة التي تحتاج أدوات ضريبية أوسع.' : 'للفرق والمنشآت التي تحتاج استخدامًا مكثفًا وأولوية أعلى.'),
        team: p.team || p.team_members || (p.name === 'احترافية' ? 10 : p.name === 'أساسية' ? 5 : 1),
        support: p.support || p.support_level || (p.name === 'احترافية' ? 'أولوية قصوى — 24/7' : p.name === 'أساسية' ? 'خلال 24 ساعة' : 'خلال 48 ساعة'),
        ai: p.ai !== undefined ? p.ai : (p.name !== 'مجانية'),
        active: p.active !== undefined ? p.active : true,
        default: p.default || (p.name === 'مجانية'),
        recommended: p.recommended || (p.name === 'احترافية'),
        cycles: {
          monthly: monthlyCycle,
          yearly: yearlyCycle
        }
      };
    });
  }, [rawPlans]);

  // ══════════════════════════════════════════════════════════════════
  // 2. REQUEST UPGRADE / SUBSCRIBE ACTION
  // ══════════════════════════════════════════════════════════════════
  const handleSubscribeRequest = (plan) => {
    setSelectedPlanModal(plan);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlanModal) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/subscriptions/request-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          plan_id: selectedPlanModal.id,
          cycle: billingCycle === 'yearly' ? 'سنوي' : 'شهري',
          payment_method: paymentMethod,
          notes: requestNotes || `طلب اشتراك في باقة [${selectedPlanModal.name}] (${billingCycle === 'yearly' ? 'سنوي' : 'شهري'})`
        }
      }, token);

      showToast(res.message || 'تم إرسال طلب الاشتراك بنجاح وهو بانتظار موافقة الإدارة', 'success');
      setSelectedPlanModal(null);
      setRequestNotes('');
      loadSubscriptionData();
    } catch (err) {
      showToast(err.message || 'تعذر إرسال طلب الاشتراك، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // 3. RENEW ACTIVE PLAN ACTION
  // ══════════════════════════════════════════════════════════════════
  const handleRenewPlan = async () => {
    try {
      setSubmitting(true);
      const res = await apiFetch('/api/subscriptions/renew-subscription', {
        method: 'POST'
      }, token);

      showToast(res.message || 'تم إرسال طلب تجديد الباقة الحالية بنفس الخدمات للإدارة بنجاح', 'success');
      loadSubscriptionData();
    } catch (err) {
      showToast(err.message || 'تعذر إرسال طلب التجديد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toast {...toast} />
      <div className="user-subs-container">
        
        {/* Page Header */}
        <div className="subs-header-row">
          <div>
            <h1 className="subs-page-title">باقات الاشتراك المعتمدة</h1>
            <p className="subs-page-subtitle">
              أنشئ وأدر باقات اشتراك مرنة تناسب احتياجات المستشارين والعملاء في المنصة الضريبية.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            1. ACTIVE SUBSCRIPTION STATUS CARD & REMAINING DAYS
        ══════════════════════════════════════════════════════════════════ */}
        {activeSub && (
          <div className="active-sub-card">
            
            {/* 2-Day Expiration Alert Banner */}
            {activeSub.is_expiring_soon && (
              <div className="expiring-soon-banner">
                <div className="expiring-banner-content">
                  <div>
                    <div className="expiring-title">تنبيه انتهاء الباقة القريب</div>
                    <div className="expiring-desc">
                      متبقي <strong>{activeSub.remaining_days} يوم فقط</strong> على انتهاء باقتك الحالية. ننصحك بالتجديد الآن بنفس الخدمات والخصائص للاحتفاظ برصيد النقاط والاستشارات المتبقية.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="expiring-renew-btn"
                  onClick={handleRenewPlan}
                  disabled={submitting}
                >
                  تجديد الباقة الآن بنفس الخدمات
                </button>
              </div>
            )}

            <div className="active-sub-head">
              <div className="active-sub-title-group">
                <span className="active-plan-badge">{activeSub.badge || 'نشط'}</span>
                <h2>باقتك الحالية: {activeSub.plan_name}</h2>
                <span className="active-cycle-tag">دورة الدفع: {activeSub.cycle}</span>
              </div>

              <div className="active-sub-days-box">
                <div className="days-number">{activeSub.remaining_days}</div>
                <div className="days-label">يوماً متبقياً في الباقة</div>
              </div>
            </div>

            <div className="active-sub-details-grid">
              <div className="sub-detail-item">
                <span className="sub-detail-label">تاريخ بدء الاشتراك:</span>
                <span className="sub-detail-val">{activeSub.start_date}</span>
              </div>
              <div className="sub-detail-item">
                <span className="sub-detail-label">تاريخ نهاية الاشتراك:</span>
                <span className="sub-detail-val">{activeSub.end_date}</span>
              </div>
              <div className="sub-detail-item">
                <span className="sub-detail-label">موعد التجديد القادم:</span>
                <span className="sub-detail-val highlight">{activeSub.renewal_date}</span>
              </div>
              <div className="sub-detail-item">
                <span className="sub-detail-label">الحالة:</span>
                <span className="sub-detail-val" style={{ color: '#16A34A' }}>مفعلة ونشطة</span>
              </div>
            </div>

            {/* Quotas Progress Bars */}
            <div className="quotas-section">
              <div className="quotas-title">حصص الاستهلاك والرصيد المتاح:</div>
              <div className="quotas-grid">
                
                {/* 1. Consultations */}
                <div className="quota-card">
                  <div className="quota-head">
                    <span>الاستشارات المجانية المباشرة</span>
                    <strong>{activeSub.consultations_used} / {activeSub.consultations_total}</strong>
                  </div>
                  <div className="quota-bar-bg">
                    <div
                      className="quota-bar-fill gold"
                      style={{
                        width: `${Math.min(100, (activeSub.consultations_used / (activeSub.consultations_total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="quota-hint">متبقي {Math.max(0, activeSub.consultations_total - activeSub.consultations_used)} جلسة</span>
                </div>

                {/* 2. AI Points */}
                <div className="quota-card">
                  <div className="quota-head">
                    <span>عدد النقاط (المساعد الذكي ديوان AI)</span>
                    <strong>{activeSub.ai_points_used} / {activeSub.ai_points_total}</strong>
                  </div>
                  <div className="quota-bar-bg">
                    <div
                      className="quota-bar-fill navy"
                      style={{
                        width: `${Math.min(100, (activeSub.ai_points_used / (activeSub.ai_points_total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="quota-hint">رصيد كافي للبحث والتدقيق التشريعي</span>
                </div>

                {/* 3. Tax Forms / Cases */}
                <div className="quota-card">
                  <div className="quota-head">
                    <span>التحميلات والحالات الضريبية</span>
                    <strong>{activeSub.tax_forms_used} / {activeSub.tax_forms_total}</strong>
                  </div>
                  <div className="quota-bar-bg">
                    <div
                      className="quota-bar-fill green"
                      style={{
                        width: `${Math.min(100, (activeSub.tax_forms_used / (activeSub.tax_forms_total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="quota-hint">متبقي {Math.max(0, activeSub.tax_forms_total - activeSub.tax_forms_used)} ملف متاح</span>
                </div>

              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="active-sub-actions">
              <button
                type="button"
                className="sub-action-btn primary"
                onClick={handleRenewPlan}
                disabled={submitting}
              >
                طلب تجديد الباقة الحالية بنفس الخدمات
              </button>
              <button
                type="button"
                className="sub-action-btn secondary"
                onClick={() => {
                  const target = document.getElementById('admin-matching-plans-section');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ترقية أو تغيير الباقة
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            2. EXACT ADMIN-MATCHING PLANS GRID & CYCLES
        ══════════════════════════════════════════════════════════════════ */}
        <div className="admin-plans-wrapper" id="admin-matching-plans-section">
          
          {/* Cycle Switcher exactly matching Admin */}
          <div className="admin-plans-top-bar">
            <div className="admin-cycle-switch">
              <button
                type="button"
                className={`admin-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                شهري
              </button>
              <button
                type="button"
                className={`admin-cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                سنوي
                <span className="save-badge">وفر 21%</span>
              </button>
            </div>
          </div>

          {/* 3 Unified Cards Grid */}
          <div className="admin-unified-cards-grid">
            {plans.map((plan) => {
              const cycleData = plan.cycles[billingCycle] || plan.cycles.monthly;
              const isCurrent = activeSub?.plan_name === plan.name;
              const isPending = activeSub?.pending_plan_ids?.includes(String(plan.id)) || activeSub?.pending_plan_names?.includes(plan.name);
              const isYearly = billingCycle === 'yearly';

              return (
                <div
                  key={plan.id}
                  className={`admin-plan-card ${plan.recommended ? 'recommended-border' : ''} ${isCurrent ? 'current-active-card' : ''} ${isPending ? 'pending-request-card' : ''}`}
                >
                  {/* Top Pill for Recommended */}
                  {plan.recommended && (
                    <div className="top-pill-recommended">
                      موصى بها
                    </div>
                  )}

                  {/* Header Badges */}
                  <div className="card-top-badges">
                    <span className="badge-pill active-pill">فعّالة</span>
                    {plan.default && <span className="badge-pill default-pill">افتراضية</span>}
                    {isPending && <span className="badge-pill pending-badge-pill">طلب معلّق</span>}
                  </div>

                  {/* Plan Name */}
                  <h2 className="card-plan-title">{plan.name}</h2>

                  {/* Price Row */}
                  <div className="card-price-row">
                    <span className="price-number">
                      {typeof cycleData.price === 'number' ? cycleData.price.toFixed(2) : cycleData.price}
                    </span>
                    <span className="price-currency-cycle">
                      د.أ / {isYearly ? 'سنوياً' : 'شهرياً'}
                    </span>
                  </div>

                  {/* Plan Description */}
                  <p className="card-plan-desc">{plan.desc}</p>

                  {/* Included Features Section (المزايا المضمنة) */}
                  <div className="features-included-box">
                    <div className="features-section-title">المزايا المضمنة</div>
                    <div className="feature-row-item">
                      <span className="feature-label">أعضاء الفريق</span>
                      <span className="feature-value">
                        {plan.team === 1 ? 'عضو فريق واحد' : `حتى ${plan.team} أعضاء`}
                      </span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">الحالات / الملفات الضريبية</span>
                      <span className="feature-value">{cycleData.cases || (plan.name === 'احترافية' ? (isYearly ? 1400 : 100) : plan.name === 'أساسية' ? (isYearly ? 350 : 25) : (isYearly ? 60 : 5))}</span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">عدد النقاط</span>
                      <span className="feature-value">{cycleData.points ? cycleData.points.toLocaleString() : '·'}</span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">استخدام الذكاء الاصطناعي</span>
                      <span className="feature-value">
                        {plan.ai ? <span className="check-green">مفعل</span> : <span className="cross-gray">غير مفعل</span>}
                      </span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">التحميلات</span>
                      <span className="feature-value">{cycleData.downloads || (plan.name === 'احترافية' ? (isYearly ? 1400 : 100) : plan.name === 'أساسية' ? (isYearly ? 350 : 25) : (isYearly ? 60 : 5))}</span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">الاستشارات المجانية</span>
                      <span className="feature-value">{cycleData.consultations ? cycleData.consultations : '·'}</span>
                    </div>

                    <div className="feature-row-item">
                      <span className="feature-label">أولوية الدعم</span>
                      <span className="feature-value support-val">{plan.support}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="card-cta-wrapper">
                    <button
                      type="button"
                      className={`plan-request-btn ${isCurrent ? 'current-btn' : isPending ? 'pending-btn' : plan.recommended ? 'recommended-btn' : 'standard-btn'}`}
                      onClick={() => handleSubscribeRequest(plan)}
                      disabled={isCurrent || isPending}
                    >
                      {isCurrent ? 'باقتك الحالية النشطة' : isPending ? 'طلبك قيد المراجعة' : 'طلب الاشتراك والترقية'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. CONFIRMATION MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {selectedPlanModal && (
          <div className="subs-modal-overlay">
            <div className="subs-modal-card">
              <div className="subs-modal-head">
                <h3>تأكيد طلب الاشتراك في باقة [{selectedPlanModal.name}]</h3>
                <button
                  type="button"
                  className="subs-modal-close"
                  onClick={() => setSelectedPlanModal(null)}
                >
                  إغلاق
                </button>
              </div>

              <div className="subs-modal-body">
                <div className="modal-summary-box">
                  <div className="summary-row">
                    <span>الباقة المطلوبة:</span>
                    <strong>{selectedPlanModal.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>دورة الدفع:</span>
                    <strong>{billingCycle === 'yearly' ? 'سنوي (وفر 21%)' : 'شهري'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>القيمة الإجمالية:</span>
                    <strong className="summary-price">
                      {selectedPlanModal.cycles[billingCycle]?.price?.toFixed(2) || '0.00'} دينار أردني
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <label>طريقة الدفع المفضلة:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="بطاقة بنكية / فيزا">بطاقة بنكية / فيزا / ماستركارد</option>
                    <option value="تحويل بنكي / CliQ">تحويل بنكي فوري (CliQ / IBAN)</option>
                    <option value="محفظة إلكترونية (زين كاش / أورنج موني)">محفظة إلكترونية (زين كاش / أورنج موني)</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>ملاحظات إضافية للإدارة (اختياري):</label>
                  <textarea
                    placeholder="اكتب أي متطلبات خاصة بالفوترة أو التفعيل..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="subs-modal-foot">
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={handleConfirmSubscription}
                  disabled={submitting}
                >
                  {submitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب للإدارة'}
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setSelectedPlanModal(null)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

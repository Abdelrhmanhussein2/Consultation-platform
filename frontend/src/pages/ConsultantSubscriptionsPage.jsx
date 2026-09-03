import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import Toast, { useToast } from '../components/Toast/Toast';

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

export default function ConsultantSubscriptionsPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [subscribing, setSubscribing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [rawPlans, setRawPlans] = useState([]);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('اقتطاع من الأرباح / بطاقة بنكية');

  const loadConsultantSubscription = async () => {
    try {
      setLoading(true);
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
    } catch (e) {
      console.warn('Consultant sub fetch error:', e);
      setRawPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultantSubscription();
    // Real-time polling every 3 seconds and on window focus
    const interval = setInterval(loadConsultantSubscription, 3000);
    const onFocus = () => loadConsultantSubscription();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

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

  const handleSubscribePlan = (plan) => {
    setSelectedPlanModal(plan);
  };

  const handleConfirmPlanRequest = async () => {
    if (!selectedPlanModal) return;
    setSubscribing(selectedPlanModal.id);
    try {
      const res = await apiFetch('/api/subscriptions/request-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          plan_id: selectedPlanModal.id,
          cycle: billingCycle === 'yearly' ? 'سنوي' : 'شهري',
          payment_method: paymentMethod,
          notes: requestNotes || `طلب ترقية باقة المستشار إلى [${selectedPlanModal.name}] (${billingCycle === 'yearly' ? 'سنوي' : 'شهري'})`
        }
      }, token);

      showToast(res.message || 'تم إرسال طلب الترقية لإدارة ديوان بنجاح', 'success');
      setSelectedPlanModal(null);
      loadConsultantSubscription();
    } catch (err) {
      showToast(err.message || 'تعذر إرسال طلب الترقية', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  const handleRenewConsultantPlan = async () => {
    try {
      setSubscribing('renew');
      const res = await apiFetch('/api/subscriptions/renew-subscription', {
        method: 'POST'
      }, token);

      showToast(res.message || 'تم إرسال طلب تجديد باقة المستشار بنفس المزايا للإدارة بنجاح', 'success');
      loadConsultantSubscription();
    } catch (err) {
      showToast(err.message || 'تعذر إرسال طلب التجديد', 'error');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif', color: '#1E293B', paddingBottom: '50px' }}>
      <Toast {...toast} />

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0D3C5C', margin: 0 }}>
            الباقات والاشتراكات
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            أنشئ وأدر باقات اشتراك مرنة تناسب احتياجات المستشارين والعملاء في المنصة الضريبية.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          1. ACTIVE CONSULTANT SUBSCRIPTION & REMAINING DAYS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSub && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
        }}>
          
          {/* 2-Day Expiration Banner */}
          {activeSub.is_expiring_soon && (
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #F59E0B',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontWeight: '900', color: '#92400E', fontSize: '13.5px' }}>تنبيه انتهاء باقة المستشار</div>
                <div style={{ color: '#78350F', fontSize: '12px' }}>
                  متبقي <strong>{activeSub.remaining_days} يوم</strong> على انتهاء باقتك الحالية. ننصحك بالتجديد للاحتفاظ برصيد النقاط والخدمات المعتمدة.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRenewConsultantPlan}
                disabled={subscribing === 'renew'}
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {subscribing === 'renew' ? 'جاري التجديد...' : 'تجديد الباقة الآن بنفس المزايا'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#10B981', color: '#FFFFFF', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                {activeSub.badge || 'نشط'}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0D3C5C', margin: 0 }}>
                باقتك الحالية: {activeSub.plan_name}
              </h2>
            </div>
            <div style={{ background: '#0D3C5C', color: '#FFFFFF', padding: '10px 20px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', lineHeight: 1 }}>{activeSub.remaining_days}</div>
              <div style={{ fontSize: '10.5px', color: '#E0F2FE', marginTop: '2px' }}>يوماً متبقياً في الباقة</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>تاريخ البدء:</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{activeSub.start_date}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>تاريخ الانتهاء:</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{activeSub.end_date}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>موعد التجديد:</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#005D9C' }}>{activeSub.renewal_date}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>الحالة:</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#16A34A' }}>مفعلة ونشطة</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleRenewConsultantPlan}
              disabled={subscribing === 'renew'}
              style={{
                background: '#005D9C',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              طلب تجديد باقة المستشار بنفس المزايا
            </button>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          2. EXACT ADMIN MATCHING PLANS GRID & TOGGLE
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={{
          display: 'inline-flex',
          background: '#EEF2F6',
          padding: '5px',
          borderRadius: '30px',
          border: '1px solid #E2E8F0',
          gap: '6px'
        }}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: 'none',
              background: billingCycle === 'monthly' ? '#FFFFFF' : 'transparent',
              color: billingCycle === 'monthly' ? '#0D3C5C' : '#64748B',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            شهري
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: 'none',
              background: billingCycle === 'yearly' ? '#FFFFFF' : 'transparent',
              color: billingCycle === 'yearly' ? '#0D3C5C' : '#64748B',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: billingCycle === 'yearly' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            سنوي
            <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
              وفر 21%
            </span>
          </button>
        </div>
      </div>

      {/* Grid of 3 Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {plans.map((p) => {
          const cycleData = p.cycles[billingCycle] || p.cycles.monthly;
          const isCurrent = activeSub?.plan_name === p.name;
          const isPending = activeSub?.pending_plan_ids?.includes(String(p.id)) || activeSub?.pending_plan_names?.includes(p.name);
          const isYearly = billingCycle === 'yearly';

          return (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                border: isPending ? '2px solid #F59E0B' : p.recommended ? '2px solid #10B981' : '1.5px solid #E2E8F0',
                borderRadius: '20px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
              }}
            >
              {p.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: '900',
                  padding: '4px 18px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                }}>
                  موصى بها
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px' }}>
                  فعّالة
                </span>
                {p.default && (
                  <span style={{ background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px' }}>
                    افتراضية
                  </span>
                )}
                {isPending && (
                  <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px' }}>
                    طلب معلّق
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0D3C5C', margin: '0 0 12px 0', textAlign: 'center' }}>
                {p.name}
              </h2>

              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '38px', fontWeight: '900', color: '#0D3C5C', lineHeight: 1 }}>
                  {typeof cycleData.price === 'number' ? cycleData.price.toFixed(2) : cycleData.price}
                </span>
                <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '700', marginRight: '6px' }}>
                  د.أ / {isYearly ? 'سنوياً' : 'شهرياً'}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: '#64748B', textAlign: 'center', lineHeight: 1.5, margin: '0 0 24px 0', minHeight: '38px' }}>
                {p.desc}
              </p>

              {/* Included Features Section */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0D3C5C', marginBottom: '4px' }}>المزايا المضمنة</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>أعضاء الفريق</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{p.team === 1 ? 'عضو فريق واحد' : `حتى ${p.team} أعضاء`}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>الحالات / الملفات الضريبية</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{cycleData.cases || (p.name === 'احترافية' ? (isYearly ? 1400 : 100) : p.name === 'أساسية' ? (isYearly ? 350 : 25) : (isYearly ? 60 : 5))}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>عدد النقاط</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{cycleData.points ? cycleData.points.toLocaleString() : '·'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>استخدام الذكاء الاصطناعي</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{p.ai ? <span style={{ color: '#10B981', fontWeight: '900', fontSize: '14px' }}>مفعل</span> : <span style={{ color: '#94A3B8', fontWeight: '900', fontSize: '14px' }}>غير مفعل</span>}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>التحميلات</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{cycleData.downloads || (p.name === 'احترافية' ? (isYearly ? 1400 : 100) : p.name === 'أساسية' ? (isYearly ? 350 : 25) : (isYearly ? 60 : 5))}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>الاستشارات المجانية</span>
                  <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{cycleData.consultations ? cycleData.consultations : '·'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>أولوية الدعم</span>
                  <span style={{ fontWeight: '800', color: '#005D9C', fontSize: '11.5px' }}>{p.support}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => handleSubscribePlan(p)}
                  disabled={isCurrent || isPending || subscribing === p.id}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    border: isPending ? '1.5px solid #F59E0B' : 'none',
                    background: isCurrent ? '#E2E8F0' : isPending ? '#FEF3C7' : p.recommended ? '#10B981' : '#005D9C',
                    color: isCurrent ? '#64748B' : isPending ? '#92400E' : '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: (isCurrent || isPending) ? 'not-allowed' : 'pointer',
                    boxShadow: (isCurrent || isPending) ? 'none' : p.recommended ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(0, 93, 156, 0.2)'
                  }}
                >
                  {isCurrent ? 'باقتك الحالية النشطة' : isPending ? 'طلبك قيد المراجعة' : subscribing === p.id ? 'جاري الإرسال...' : 'طلب ترقية الباقة'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Request Modal */}
      {selectedPlanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 300 }}>
          <div style={{ width: '480px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0D3C5C', margin: '0 0 14px 0' }}>
              تأكيد طلب الاشتراك في باقة [{selectedPlanModal.name}]
            </h3>
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>دورة الدفع:</span>
                <strong>{billingCycle === 'yearly' ? 'سنوي (وفر 21%)' : 'شهري'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>القيمة الإجمالية:</span>
                <strong style={{ color: '#005D9C' }}>
                  {selectedPlanModal.cycles[billingCycle]?.price?.toFixed(2) || '0.00'} دينار أردني
                </strong>
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px' }}>طريقة الخصم / السداد:</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <option>اقتطاع من الأرباح المكتسبة القادمة</option>
                <option>بطاقة بنكية / فيزا</option>
                <option>تحويل بنكي / CliQ</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmPlanRequest}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '11px 22px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
              >
                تأكيد وإرسال للإدارة
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                style={{ background: '#E2E8F0', border: 'none', padding: '11px 18px', borderRadius: '10px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

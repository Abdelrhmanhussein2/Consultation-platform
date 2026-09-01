import React, { useState, useEffect } from 'react';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantSubscriptionsPage({ navigate }) {
  const { toast, showToast } = useToast();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [activePlan, setActivePlan] = useState('pro'); // 'free', 'pro', 'business'
  const [subscribing, setSubscribing] = useState(null);
  const [dbPlans, setDbPlans] = useState([]);

  useEffect(() => {
    fetch('/api/subscriptions/plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setDbPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  // Prices based on cycle
  const prices = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 85, yearly: 1000 },
    business: { monthly: 150, yearly: 1800 }
  };

  const handleSubscribe = async (planKey) => {
    if (planKey === activePlan) return;
    setSubscribing(planKey);
    
    try {
      await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sub_id: 'mock-sub',
          target_plan: planKey === 'business' ? 'احترافية' : planKey === 'pro' ? 'أساسية' : 'مجانية',
          mode: 'immediate'
        })
      });
    } catch (e) {}
    
    // Simulate payment mock delay
    await new Promise(r => setTimeout(r, 1000));
    
    setActivePlan(planKey);
    setSubscribing(null);
    showToast(`تم الترقية إلى خطة ${planKey === 'business' ? 'الأعمال' : planKey === 'pro' ? 'الاحترافية' : 'المجانية'} بنجاح ومزامنتها!`);
  };

  const cycleLabel = billingCycle === 'monthly' ? 'JOD / شهر' : 'JOD / سنة';

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '40px' }}>
      <Toast {...toast} />

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(245, 165, 42, 0.2)'
        }}>
          <span style={{ fontSize: '20px', color: '#FFFFFF' }}>💳</span>
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            الاشتراكات
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            اختر خطتك وادفع بطريقة محاكاة (وضع تجريبي).
          </p>
        </div>
      </div>

      {/* Active Subscription Banner */}
      {activePlan === 'pro' && (
        <div style={{
          background: '#FFFDF5',
          border: '1.5px solid #FEF08A',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(254, 240, 138, 0.2)'
        }}>
          <span style={{ fontSize: '20px' }}>🌟</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '800', color: '#854D0E', fontSize: '14px' }}>اشتراكك الحالي: احترافي</span>
              <span style={{
                background: '#0D3C5C',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                active
              </span>
            </div>
            <div style={{ color: '#A16207', fontSize: '11px', fontWeight: '600' }}>
              ينتهي في 2026/7/22 - سيتم الإلغاء تلقائياً
            </div>
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: '99px',
          display: 'flex',
          gap: '4px',
          border: '1px solid #E2E8F0'
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '6px 20px',
              borderRadius: '99px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              fontFamily: 'Tajawal, sans-serif',
              cursor: 'pointer',
              background: billingCycle === 'monthly' ? '#FFFFFF' : 'transparent',
              color: billingCycle === 'monthly' ? '#0D3C5C' : '#64748B',
              boxShadow: billingCycle === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            شهري
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '6px 20px',
              borderRadius: '99px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              fontFamily: 'Tajawal, sans-serif',
              cursor: 'pointer',
              background: billingCycle === 'yearly' ? '#FFFFFF' : 'transparent',
              color: billingCycle === 'yearly' ? '#0D3C5C' : '#64748B',
              boxShadow: billingCycle === 'yearly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            سنوي (وفر ~16%)
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        alignItems: 'stretch',
        marginBottom: '32px',
        maxWidth: '960px',
        margin: '0 auto 32px auto'
      }}>
        
        {/* Card 1: Free Plan */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: activePlan === 'free' ? '2px solid #F5A52A' : '1.5px solid #E2E8F0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 4px 10px rgba(13, 60, 92, 0.01)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 2px 0' }}>مجاني</h3>
          <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 16px 0', textAlign: 'center' }}>التجربة والاستخدام الخفيف</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#0D3C5C' }}>{prices.free[billingCycle]}</span>
            <span style={{ color: '#64748B', fontSize: '11px' }}>{cycleLabel}</span>
          </div>

          <div style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> مساعد ذكي محدود
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> بحث في التشريعات
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('free')}
            disabled={activePlan === 'free' || subscribing !== null}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              fontFamily: 'Tajawal, sans-serif',
              cursor: activePlan === 'free' || subscribing !== null ? 'default' : 'pointer',
              background: activePlan === 'free' ? '#FFFBEB' : '#F1F5F9',
              color: activePlan === 'free' ? '#D97706' : '#94A3B8',
              transition: 'all 0.15s'
            }}
          >
            {activePlan === 'free' ? 'خطتك الحالية' : 'ابدأ مجاناً'}
          </button>
        </div>

        {/* Card 2: Pro Plan (Popular) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '2px solid #F5A52A',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 6px 18px rgba(245, 165, 42, 0.05)'
        }}>
          {/* Badge */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
            color: '#FFFFFF',
            padding: '3px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '800',
            boxShadow: '0 4px 8px rgba(245,165,42,0.15)'
          }}>
            الأكثر شيوعاً
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 2px 0' }}>احترافي</h3>
          <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 16px 0', textAlign: 'center' }}>للمحترفين والمكاتب الصغيرة</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#0D3C5C' }}>{prices.pro[billingCycle]}</span>
            <span style={{ color: '#64748B', fontSize: '11px' }}>{cycleLabel}</span>
          </div>

          <div style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> مساعد ذكي غير محدود
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> تحليل المستندات
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> استشارات شهرية
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('pro')}
            disabled={activePlan === 'pro' || subscribing !== null}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              fontFamily: 'Tajawal, sans-serif',
              cursor: activePlan === 'pro' || subscribing !== null ? 'default' : 'pointer',
              background: activePlan === 'pro' ? '#FEF3C7' : '#F1F5F9',
              color: activePlan === 'pro' ? '#D97706' : '#94A3B8',
              transition: 'all 0.15s'
            }}
          >
            {subscribing === 'pro' ? 'جاري التحويل...' : activePlan === 'pro' ? 'خطتك الحالية' : 'ترقية الآن'}
          </button>
        </div>

        {/* Card 3: Business Plan */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: activePlan === 'business' ? '2px solid #F5A52A' : '1.5px solid #E2E8F0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 4px 10px rgba(13, 60, 92, 0.01)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 2px 0' }}>أعمال</h3>
          <p style={{ color: '#64748B', fontSize: '11px', margin: '0 0 16px 0', textAlign: 'center' }}>للشركات والمؤسسات</p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#0D3C5C' }}>{prices.business[billingCycle]}</span>
            <span style={{ color: '#64748B', fontSize: '11px' }}>{cycleLabel}</span>
          </div>

          <div style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> كل ميزات Pro
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> مستشار مخصص
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> فريق متعدد المستخدمين
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> تقارير
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('business')}
            disabled={subscribing !== null}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              fontFamily: 'Tajawal, sans-serif',
              cursor: subscribing !== null ? 'default' : 'pointer',
              background: activePlan === 'business' ? '#FEF3C7' : '#F1F5F9',
              color: activePlan === 'business' ? '#FEF3C7' : '#005D9C',
              transition: 'all 0.15s'
            }}
          >
            {subscribing === 'business' ? 'جاري التحويل...' : activePlan === 'business' ? 'خطتك الحالية' : 'اشترك الآن'}
          </button>
        </div>

      </div>

      {/* Subscription Invoices Table Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #F1F5F9',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px' }}>🧾</span>
          <span style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '15px' }}>فواتير الاشتراك</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', marginBottom: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #F1F5F9', color: '#64748B', fontWeight: '800' }}>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>رقم</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>التاريخ</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>المبلغ</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '14px 16px', color: '#64748B' }}>INV-20260622-ae5a45f1</td>
              <td style={{ padding: '14px 16px', color: '#64748B' }}>2026/6/22</td>
              <td style={{ padding: '14px 16px', color: '#64748B' }}>JOD 33.64</td>
              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                <span style={{
                  background: '#D1FAE5',
                  color: '#065F46',
                  padding: '4px 14px',
                  borderRadius: '25px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'inline-block'
                }}>
                  paid
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* View All Invoices link */}
        <button
          onClick={() => navigate && navigate('/invoices')}
          style={{
            background: 'none',
            border: 'none',
            color: '#005D9C',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'Tajawal, sans-serif'
          }}
        >
          عرض جميع الفواتير ←
        </button>
      </div>

    </div>
  );
}

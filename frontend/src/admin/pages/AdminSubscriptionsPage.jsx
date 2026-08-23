import React, { useState } from 'react';
import { IconSubscription, IconCheck } from '../components/AdminIcons';

export default function AdminSubscriptionsPage({ navigate }) {
  const [plans, setPlans] = useState([
    {
      id: 'free',
      name: 'مجاني',
      status: 'نشطة',
      priceMonthly: '0 JOD',
      priceYearly: '0 JOD',
      activeCount: 0,
      monthlyRevenue: '0 د.أ'
    },
    {
      id: 'pro',
      name: 'احترافي',
      status: 'نشطة',
      priceMonthly: '85 JOD',
      priceYearly: '1000 JOD',
      activeCount: 3,
      monthlyRevenue: '255 د.أ'
    },
    {
      id: 'business',
      name: 'أعمال',
      status: 'نشطة',
      priceMonthly: '150 JOD',
      priceYearly: '1800 JOD',
      activeCount: 0,
      monthlyRevenue: '0 د.أ'
    }
  ]);

  const recentSubscriptions = [
    {
      id: 's1',
      user: 'Saeed',
      date: '2026/7/30',
      plan: 'احترافي',
      status: 'active'
    },
    {
      id: 's2',
      user: 'مستخدم تجريبي',
      date: '2026/6/22',
      plan: 'احترافي',
      status: 'active'
    },
    {
      id: 's3',
      user: 'أ. رأفت حداد (تجريبي)',
      date: '2026/6/22',
      plan: 'احترافي',
      status: 'active'
    }
  ];

  const [editModal, setEditModal] = useState(null);

  const handleSavePlan = () => {
    setPlans(plans.map(p => p.id === editModal.id ? editModal : p));
    alert(`تم حفظ وتحديث خطة [${editModal.name}] بنجاح`);
    setEditModal(null);
  };

  return (
    <div>
      {/* 1. Top 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي الاشتراكات</span>
            <span style={{ fontSize: '15px' }}>👥</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">3</span>
          </div>
          <div className="admin-kpi-footer">إجمالي الاشتراكات</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">اشتراكات نشطة</span>
            <span style={{ fontSize: '15px' }}>✨</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">3</span>
          </div>
          <div className="admin-kpi-footer">اشتراكات نشطة</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">مدفوعات مؤكدة</span>
            <span style={{ fontSize: '15px' }}>💳</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#E58A13' }}>165.88</span>
            <span className="admin-kpi-currency">د.أ</span>
          </div>
          <div className="admin-kpi-footer">مدفوعات مؤكدة</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">معدل التجديد</span>
            <span style={{ fontSize: '15px' }}>📈</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#10B981' }}>100%</span>
          </div>
          <div className="admin-kpi-footer">معدل التجديد</div>
        </div>
      </div>

      {/* 2. Middle Row: 3 Pricing / Plan Cards (مجاني, احترافي, أعمال) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {plans.map((plan) => (
          <div key={plan.id} className="admin-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '230px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="admin-badge-info" style={{ fontSize: '11px', padding: '2px 8px' }}>{plan.status}</span>
                <span style={{ color: '#E58A13', fontSize: '18px' }}>👑</span>
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '4px 0 2px 0', textAlign: 'center' }}>
                {plan.name}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginBottom: '18px' }}>
                {plan.priceMonthly}/شهر • {plan.priceYearly}/سنة
              </div>

              {/* 2 Mini Stats Boxes inside Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #EDF2F7', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{plan.activeCount}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>نشط</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #EDF2F7', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{plan.monthlyRevenue}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>إيراد شهري</div>
                </div>
              </div>
            </div>

            <button 
              className="admin-btn-action-outline" 
              style={{ width: '100%', justifyContent: 'center', padding: '9px 0', fontSize: '13px', fontWeight: '700' }}
              onClick={() => setEditModal(plan)}
            >
              تعديل الخطة والحدود
            </button>
          </div>
        ))}
      </div>

      {/* 3. Bottom Row: Plan Distribution Chart + Recent Subscriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Plan Distribution Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">توزيع الخطط</h3>
          </div>

          <div style={{ height: '190px', width: '100%', position: 'relative', marginTop: '6px' }}>
            <svg viewBox="0 0 350 180" style={{ width: '100%', height: '100%' }}>
              {/* Horizontal Gridlines */}
              <line x1="40" y1="20" x2="330" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="58" x2="330" y2="58" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="95" x2="330" y2="95" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="133" x2="330" y2="133" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="160" x2="330" y2="160" stroke="#E2E8F0" strokeWidth="1" />

              {/* Y Axis Numbers */}
              <text x="30" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">3</text>
              <text x="30" y="62" fontSize="10" fill="#94A3B8" textAnchor="end">2.25</text>
              <text x="30" y="99" fontSize="10" fill="#94A3B8" textAnchor="end">1.5</text>
              <text x="30" y="137" fontSize="10" fill="#94A3B8" textAnchor="end">0.75</text>
              <text x="30" y="164" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

              {/* Golden Center Bar for Pro Plan (3 active) */}
              <rect x="140" y="20" width="80" height="140" rx="3" fill="#E58A13" />

              {/* X Axis Labels */}
              <text x="90" y="175" fontSize="11" fill="#64748B" textAnchor="middle">مجاني</text>
              <text x="180" y="175" fontSize="11" fill="#64748B" textAnchor="middle">احترافي</text>
              <text x="270" y="175" fontSize="11" fill="#64748B" textAnchor="middle">أعمال</text>
            </svg>
          </div>
        </div>

        {/* Recent Subscriptions List */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">آخر الاشتراكات</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentSubscriptions.map(s => (
              <div 
                key={s.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#FFFFFF',
                  borderBottom: '1px solid #F1F5F9'
                }}
              >
                {/* Left side: Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {s.status}
                  </span>
                  <span className="admin-category-chip" style={{ fontSize: '11px', padding: '3px 8px' }}>
                    {s.plan}
                  </span>
                </div>

                {/* Right side: User & Date */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>{s.user}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{s.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800' }}>تعديل باقة: {editModal.name}</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>السعر الشهري:</label>
              <input 
                type="text" 
                className="admin-search-input" 
                value={editModal.priceMonthly} 
                onChange={e => setEditModal({ ...editModal, priceMonthly: e.target.value })} 
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>السعر السنوي:</label>
              <input 
                type="text" 
                className="admin-search-input" 
                value={editModal.priceYearly} 
                onChange={e => setEditModal({ ...editModal, priceYearly: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="admin-btn-action-outline" onClick={() => setEditModal(null)}>إلغاء</button>
              <button className="admin-btn-action-primary" onClick={handleSavePlan}>حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

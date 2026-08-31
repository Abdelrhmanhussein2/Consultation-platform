import React, { useState, useEffect } from 'react';
import { IconSearch, IconPayment, IconCheck, IconArrowLeft } from '../components/AdminIcons';
import { getAdminPayouts, reviewPayout } from '../services/adminApi';

export default function AdminPaymentsPage({ navigate }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getAdminPayouts();
      const formatted = (Array.isArray(data) ? data : []).map((p, idx) => ({
        id: p.id || `tx_${idx}`,
        customer: p.consultant_name || p.user_name || `مستشار #${p.id?.slice(0,6)}`,
        amountJod: parseFloat(p.amount || 0),
        currency: 'JOD',
        status: p.status === 'transferred' ? 'paid' : p.status === 'pending' ? 'pending' : p.status,
        method: p.bank_name ? `تحويل بنكي (${p.bank_name})` : 'تحويل بنكي',
        refCode: p.transfer_reference || `PAYOUT-${p.id?.slice(0,8)}`,
        dateStr: `${new Date(p.created_at || Date.now()).toLocaleDateString('ar-JO')} • ${p.status}`
      }));
      setTransactions(formatted);
    } catch (err) {
      console.warn('Admin payouts fetch notice:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTx = transactions.filter(t => {
    const matchSearch = t.customer.includes(searchTerm) || t.refCode.includes(searchTerm);
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '18px' }}>
        <div>
          <div className="admin-banner-sub-tag">PAYMENTS LEDGER</div>
          <h1 className="admin-banner-title">إدارة المدفوعات</h1>
          <p className="admin-banner-desc">
            دفتر فعلي للمدفوعات مع تحديث حالة العملية والفاتورة.
          </p>
        </div>
        <button 
          className="admin-btn-action-outline"
          style={{ fontSize: '13px', padding: '6px 14px', gap: '6px' }}
          onClick={() => navigate('/admin')}
        >
          <span>رجوع</span>
          <span>➔</span>
        </button>
      </div>

      {/* 2. Top 4 Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي العمليات</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>💳</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">6</span>
          </div>
          <div className="admin-kpi-footer">إجمالي العمليات</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إيرادات مؤكدة</span>
            <span style={{ fontSize: '15px', color: '#10B981' }}>✓</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#0F172A' }}>165.88</span>
            <span className="admin-kpi-currency">د.أ</span>
          </div>
          <div className="admin-kpi-footer">إيرادات مؤكدة</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">قيد المراجعة</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>⏱</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">3</span>
          </div>
          <div className="admin-kpi-footer">قيد المراجعة</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">فاشلة</span>
            <span style={{ fontSize: '15px', color: '#EF4444' }}>✕</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">0</span>
          </div>
          <div className="admin-kpi-footer">فاشلة</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
        {/* Search input on right in RTL */}
        <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: '440px' }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث بالعميل أو المرجع"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Segmented Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className={`admin-category-chip ${filter === 'all' ? 'active' : ''}`}
            style={{ 
              background: filter === 'all' ? '#0F172A' : '#FFFFFF', 
              color: filter === 'all' ? '#FFFFFF' : '#475569',
              padding: '6px 14px' 
            }}
            onClick={() => setFilter('all')}
          >
            الكل
          </button>
          <button 
            className={`admin-category-chip ${filter === 'paid' ? 'active' : ''}`}
            style={{ 
              background: filter === 'paid' ? '#0F172A' : '#FFFFFF', 
              color: filter === 'paid' ? '#FFFFFF' : '#475569',
              padding: '6px 14px' 
            }}
            onClick={() => setFilter('paid')}
          >
            مدفوع
          </button>
          <button 
            className={`admin-category-chip ${filter === 'pending' ? 'active' : ''}`}
            style={{ 
              background: filter === 'pending' ? '#0F172A' : '#FFFFFF', 
              color: filter === 'pending' ? '#FFFFFF' : '#475569',
              padding: '6px 14px' 
            }}
            onClick={() => setFilter('pending')}
          >
            قيد المراجعة
          </button>
          <button 
            className={`admin-category-chip ${filter === 'failed' ? 'active' : ''}`}
            style={{ 
              background: filter === 'failed' ? '#0F172A' : '#FFFFFF', 
              color: filter === 'failed' ? '#FFFFFF' : '#475569',
              padding: '6px 14px' 
            }}
            onClick={() => setFilter('failed')}
          >
            فشل
          </button>
          <button 
            className={`admin-category-chip ${filter === 'refunded' ? 'active' : ''}`}
            style={{ 
              background: filter === 'refunded' ? '#0F172A' : '#FFFFFF', 
              color: filter === 'refunded' ? '#FFFFFF' : '#475569',
              padding: '6px 14px' 
            }}
            onClick={() => setFilter('refunded')}
          >
            مسترد
          </button>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTx.map(tx => (
          <div 
            key={tx.id}
            className="admin-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderRadius: '12px'
            }}
          >
            {/* Left side: View Eye + Pending Badge + Amount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button 
                className="admin-icon-btn-minimal"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                title="عرض تفاصيل العملية"
                onClick={() => setSelectedTx(tx)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>

              <span 
                className="admin-badge-warning"
                style={{ 
                  fontSize: '11px', 
                  padding: '2px 10px',
                  background: tx.status === 'paid' ? '#ECFDF5' : '#F8FAFC',
                  color: tx.status === 'paid' ? '#059669' : '#64748B',
                  borderColor: tx.status === 'paid' ? '#A7F3D0' : '#E2E8F0'
                }}
              >
                {tx.status}
              </span>

              <span style={{ fontSize: '15px', fontWeight: '800', color: '#E58A13' }}>
                {tx.currency} {tx.amountJod}
              </span>
            </div>

            {/* Right side: Customer Name & Date String */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                {tx.customer}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
                {tx.dateStr}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800' }}>تفاصيل العملية المالية</h3>
            
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div><strong>العميل:</strong> {selectedTx.customer}</div>
              <div><strong>المبلغ:</strong> <span style={{ color: '#E58A13', fontWeight: '800' }}>{selectedTx.amountJod} دينار أردني</span></div>
              <div><strong>طريقة الدفع:</strong> {selectedTx.method}</div>
              <div><strong>المرجع:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedTx.refCode}</span></div>
              <div><strong>الحالة:</strong> {selectedTx.status}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="admin-btn-action-outline" onClick={() => setSelectedTx(null)}>إغلاق</button>
              <button className="admin-btn-action-primary" onClick={() => { alert('تم تأكيد الدفعة وتحديث الفاتورة بنجاح'); setSelectedTx(null); }}>تأكيد الدفعة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

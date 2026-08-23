import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InvoicesIcon } from '../components/UserPortal/Icons';

export default function InvoicesPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/invoices/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { setInvoices(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <InvoicesIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            الفواتير والمدفوعات
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            عرض واستعراض جميع الفواتير الصادرة وسجلات دفع الاستشارات الضريبية.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>جاري تحميل الفواتير...</div>
      ) : invoices.length > 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '12px 16px' }}>رقم الفاتورة</th>
                <th style={{ padding: '12px 16px' }}>المبلغ الأساسي</th>
                <th style={{ padding: '12px 16px' }}>الضريبة</th>
                <th style={{ padding: '12px 16px' }}>الإجمالي</th>
                <th style={{ padding: '12px 16px' }}>تاريخ الإصدار</th>
                <th style={{ padding: '12px 16px' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#005D9C' }}>#{inv.invoice_number || inv.id.substring(0, 8)}</td>
                  <td style={{ padding: '14px 16px' }}>{inv.amount} د.أ</td>
                  <td style={{ padding: '14px 16px' }}>{inv.tax_amount || 0} د.أ</td>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: '#1E293B' }}>{inv.total_amount || inv.amount} د.أ</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{new Date(inv.created_at).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>مدفوعة ✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '56px', height: '56px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <InvoicesIcon size={26} color="#005D9C" />
          </div>
          <h3 style={{ color: '#1E293B', marginBottom: '8px' }}>لا توجد فواتير صادرة حتى الآن</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>ستظهر فواتيرك هنا بمجرد حجز ودفع أي استشارة ضريبية.</p>
        </div>
      )}
    </div>
  );
}

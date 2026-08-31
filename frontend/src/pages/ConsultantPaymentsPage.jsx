import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantPaymentsPage({ navigate }) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/invoices/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        // Filter only paid invoices to represent payments/transactions
        const paidInvoices = data.filter(inv => inv.status === 'paid');
        
        const formattedPayments = paidInvoices.map((inv, idx) => ({
          id: inv.id,
          reference: inv.invoice_number ? `PAY-${inv.invoice_number.substring(4)}` : `PAY-${new Date(inv.created_at).toISOString().slice(0, 10).replace(/-/g, '')}-${inv.id.substring(0, 4)}`,
          date: `${new Date(inv.created_at).toLocaleDateString('zh-Hans-CN')}، ${new Date(inv.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
          amount: parseFloat(inv.total_amount || 0),
          method: inv.payment_method || 'بطاقة بنكية',
          status: 'مدفوعة'
        }));

        setPayments(formattedPayments);
        setLoading(false);
      })
      .catch(() => {
        setPayments([]);
        setLoading(false);
      });
  }, [token]);

  const totalPaid = payments.reduce((acc, pay) => acc + pay.amount, 0);

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
          <span style={{ fontSize: '20px', color: '#FFFFFF' }}>🗎</span>
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            المدفوعات
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            سجل العمليات المالية وطرق الدفع (وضع محاكاة).
          </p>
        </div>
      </div>

      {/* Internal Payment Mode Banner */}
      <div style={{
        background: '#F0FDF4',
        border: '1.5px solid #BBF7D0',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(34, 197, 94, 0.05)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#DCFCE7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#15803D',
          fontSize: '16px'
        }}>
          🛡️
        </div>
        <div>
          <div style={{ fontWeight: '800', color: '#166534', fontSize: '13px', marginBottom: '2px' }}>
            وضع المدفوعات: محاكاة داخلية
          </div>
          <div style={{ color: '#15803D', fontSize: '12px', fontWeight: '600' }}>
            جميع العمليات تُسجل فعلياً في قاعدة البيانات بدون مزود دفع خارجي.
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #F1F5F9',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#FFF7ED',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#F5A52A'
          }}>
            💳
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
              إجمالي المدفوعات الناجحة
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0D3C5C' }}>
              JOD {totalPaid.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #F1F5F9',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px' }}>📋</span>
          <span style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '15px' }}>سجل العمليات</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#0D3C5C' }}>
            جاري تحميل سجل العمليات...
          </div>
        ) : payments.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #F1F5F9', color: '#64748B', fontWeight: '800' }}>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>المرجع</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>التاريخ</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>المبلغ</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>الطريقة</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 16px', color: '#64748B', fontWeight: '700' }}>{pay.reference}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{pay.date}</td>
                  <td style={{ padding: '16px 16px', fontWeight: '800', color: '#0D3C5C' }}>JOD {pay.amount.toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{pay.method}</td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: '#D1FAE5',
                      color: '#065F46',
                      padding: '4px 14px',
                      borderRadius: '25px',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'inline-block'
                    }}>
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>💳</span>
            لا توجد عمليات مدفوعات مسجلة حالياً.
          </div>
        )}
      </div>

    </div>
  );
}

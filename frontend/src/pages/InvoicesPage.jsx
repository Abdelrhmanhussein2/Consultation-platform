import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';

export default function InvoicesPage() {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/invoices/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data || []);
      } else {
        showToast('فشل في جلب الفواتير من الخادم.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  // Calculate summary totals from backend data
  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? parseFloat(inv.total_amount || 0) : 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? parseFloat(inv.total_amount || 0) : 0), 0);
  const totalOutstanding = totalAmount - totalPaid;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

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
          <span style={{ fontSize: '20px', color: '#FFFFFF' }}>💵</span>
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            الفواتير
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            سجل الفواتير المرتبط بحسابك.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Total Invoiced Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #F1F5F9',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
        }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>الإجمالي</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C' }}>JOD {totalAmount.toFixed(2)}</div>
        </div>

        {/* Paid Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #F1F5F9',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
        }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>المدفوع</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#22C55E' }}>JOD {totalPaid.toFixed(2)}</div>
        </div>

        {/* Outstanding Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #F1F5F9',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
        }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>المستحق</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#F5A52A' }}>JOD {totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      {/* Invoices Table Card */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#0D3C5C', background: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #F1F5F9' }}>
          <div style={{
            width: '24px', height: '24px',
            border: '2.5px solid #E2E8F0', borderTopColor: '#F5A52A',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          جاري تحميل سجل الفواتير...
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
        </div>
      ) : invoices.length > 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #F1F5F9',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #F1F5F9', color: '#64748B', fontWeight: '800' }}>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>رقم الفاتورة</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>التاريخ</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>المجموع الفرعي</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>الضريبة</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>الإجمالي</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>الحالة</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>الخيارات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>
                    {new Date(inv.created_at).toLocaleDateString('zh-Hans-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{inv.currency} {parseFloat(inv.amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{inv.currency} {parseFloat(inv.tax_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', fontWeight: '800', color: '#005D9C' }}>{inv.currency} {parseFloat(inv.total_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: inv.status === 'paid' ? '#D1FAE5' : inv.status === 'cancelled' ? '#FEE2E2' : '#FEF3C7',
                      color: inv.status === 'paid' ? '#065F46' : inv.status === 'cancelled' ? '#991B1B' : '#D97706',
                      padding: '4px 14px',
                      borderRadius: '25px',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'inline-block'
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      {/* View Button */}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                        title="عرض الفاتورة"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Download/Print Button */}
                      <button
                        onClick={() => { setSelectedInvoice(inv); setTimeout(() => handlePrint(), 100); }}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                        title="تحميل الفاتورة"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <span style={{ fontSize: '48px' }}>💵</span>
          <h3 style={{ color: '#1E293B', marginBottom: '8px' }}>لا توجد فواتير صادرة حتى الآن</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>ستظهر فواتيرك هنا بمجرد حجز ودفع أي استشارة ضريبية.</p>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              margin: '0 16px',
              border: '1.5px solid #F1F5F9',
              position: 'relative'
            }}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                fontSize: '18px',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ×
            </button>

            {/* Printable Area Wrapper */}
            <div id="printable-invoice" style={{ padding: '36px 40px', background: '#FFFFFF', color: '#1E293B' }}>
              <div style={{ position: 'relative' }}>
                
                {/* Diagonal Watermark */}
                <div style={{
                  position: 'absolute',
                  top: '55%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-20deg)',
                  fontSize: '84px',
                  fontWeight: '900',
                  color: '#0D3C5C',
                  opacity: 0.04,
                  letterSpacing: '12px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  DIWAN
                </div>

                {/* Invoice Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  {/* Right: Company name & title */}
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
                      منصة ديوان للاستشارات الضريبية
                    </h2>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>فاتورة رسمية</span>
                  </div>

                  {/* Left: Invoice ID and Date */}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0E1726' }}>
                      {selectedInvoice.invoice_number}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      {new Date(selectedInvoice.created_at).toLocaleDateString('zh-Hans-CN')}، {new Date(selectedInvoice.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Yellow divider line */}
                <div style={{ height: '2px', background: '#F5A52A', width: '100%', marginBottom: '24px' }} />

                {/* Status Box */}
                <div style={{
                  background: '#FAFAFA',
                  border: '1.5px solid #F1F5F9',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: '700' }}>الحالة:</span>
                    <span style={{ fontWeight: '800', color: selectedInvoice.status === 'paid' ? '#22C55E' : '#F5A52A' }}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#64748B', fontWeight: '700' }}>العملة:</span>
                    <span style={{ fontWeight: '800', color: '#0D3C5C' }}>
                      {selectedInvoice.currency}
                    </span>
                  </div>
                </div>

                {/* Table of items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', marginBottom: '28px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #F1F5F9', color: '#64748B', fontWeight: '800' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>الوصف</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px' }}>الكمية</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', width: '100px' }}>السعر</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', width: '120px' }}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 8px', color: '#1E293B', fontWeight: '700' }}>
                        {selectedInvoice.description || (selectedInvoice.type === 'subscription' ? 'اشتراك احترافي (شهري)' : 'جلسة استشارة ضريبية')}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#64748B' }}>1</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#64748B' }}>{selectedInvoice.currency} {parseFloat(selectedInvoice.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'left', color: '#1E293B', fontWeight: '700' }}>{selectedInvoice.currency} {parseFloat(selectedInvoice.amount || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '8px',
                  fontSize: '13px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                    <span style={{ color: '#64748B', fontWeight: '700' }}>المجموع الفرعي:</span>
                    <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{selectedInvoice.currency} {parseFloat(selectedInvoice.amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                    <span style={{ color: '#64748B', fontWeight: '700' }}>الضريبة:</span>
                    <span style={{ fontWeight: '800', color: '#0D3C5C' }}>{selectedInvoice.currency} {parseFloat(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ height: '1.5px', background: '#F1F5F9', width: '220px', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '15px' }}>
                    <span style={{ color: '#0D3C5C', fontWeight: '800' }}>الإجمالي:</span>
                    <span style={{ fontWeight: '900', color: '#0D3C5C' }}>{selectedInvoice.currency} {parseFloat(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              background: '#FAFAFA',
              padding: '16px 24px',
              borderTop: '1.5px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <button
                onClick={handlePrint}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '6px 20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                طباعة
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

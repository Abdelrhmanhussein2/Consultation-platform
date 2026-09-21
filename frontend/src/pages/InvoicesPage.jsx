import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('zh-Hans-CN') : '—';
const fmt = (n) => Number(n || 0).toLocaleString('ar-JO', { minimumFractionDigits: 3 });

const STATUS_MAP = {
  paid:      { label: 'مدفوعة',           bg: '#D1FAE5', color: '#065F46' },
  issued:    { label: 'صادرة',            bg: '#DBEAFE', color: '#1E40AF' },
  draft:     { label: 'مسودة',            bg: '#F1F5F9', color: '#475569' },
  cancelled: { label: 'ملغاة',            bg: '#FEE2E2', color: '#991B1B' },
  partial:   { label: 'مدفوعة جزئياً',   bg: '#FEF9C3', color: '#854D0E' },
  overdue:   { label: 'متأخرة',           bg: '#FFE4E6', color: '#BE123C' },
  pending:   { label: 'بانتظار الموافقة', bg: '#FEF9C3', color: '#B45309' },
};
const getStatus = (s) => STATUS_MAP[s] || { label: s || '—', bg: '#F1F5F9', color: '#475569' };

function numberToArabicWords(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'فقط صفر دينار أردني لا غير';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];
  const parseGroup = (n) => {
    if (n === 0) return '';
    let r = '';
    if (n >= 100) { r += hundreds[Math.floor(n / 100)] + ' '; n %= 100; }
    if (n >= 20) { r += tens[Math.floor(n / 10)]; if (n % 10) r += ' و' + ones[n % 10]; }
    else if (n > 0) r += ones[n];
    return r.trim();
  };
  const rounded = Math.round(amount * 1000) / 1000;
  const dinars = Math.floor(rounded);
  const fils = Math.round((rounded - dinars) * 1000);
  let result = 'فقط ';
  if (dinars > 0) {
    if (dinars >= 1000) result += parseGroup(Math.floor(dinars / 1000)) + ' ألف ';
    result += parseGroup(dinars % 1000) + ' دينار أردني';
  }
  if (fils > 0) {
    if (dinars > 0) result += ' و';
    result += parseGroup(fils) + ' فلس';
  }
  return result + ' لا غير';
}

export default function InvoicesPage() {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const invoiceRef = useRef(null);

  useEffect(() => {
    fetch('/api/platform-settings/logo').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.logo_url) setLogoUrl(d.logo_url);
    }).catch(() => {});
  }, []);

  const fetchInvoices = async () => {
    if (!token) { setLoading(false); return; }
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

  useEffect(() => { fetchInvoices(); }, [token]);

  // Calculate summary totals from backend data
  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.status !== 'cancelled' ? parseFloat(inv.total_amount || 0) : 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? parseFloat(inv.total_amount || 0) : 0), 0);
  const totalOutstanding = totalAmount - totalPaid;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`${selectedInvoice?.invoice_number || 'invoice'}.pdf`);
    } catch {
      showToast('فشل في تحميل الفاتورة.', 'error');
    }
  };

  const inv = selectedInvoice;

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
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #F1F5F9', padding: '24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)' }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>الإجمالي</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C' }}>JOD {totalAmount.toFixed(2)}</div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #F1F5F9', padding: '24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)' }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>المدفوع</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#22C55E' }}>JOD {totalPaid.toFixed(2)}</div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #F1F5F9', padding: '24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)' }}>
          <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>المستحق</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#F5A52A' }}>JOD {totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      {/* Invoices Table Card */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#0D3C5C', background: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #F1F5F9' }}>
          <div style={{ width: '24px', height: '24px', border: '2.5px solid #E2E8F0', borderTopColor: '#F5A52A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px auto' }} />
          جاري تحميل سجل الفواتير...
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
        </div>
      ) : invoices.length > 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #F1F5F9', padding: '24px', boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)' }}>
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
                      background: getStatus(inv.status).bg,
                      color: getStatus(inv.status).color,
                      padding: '4px 14px', borderRadius: '25px', fontSize: '12px', fontWeight: '800', display: 'inline-block'
                    }}>
                      {getStatus(inv.status).label}
                    </span>
                  </td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                        title="عرض الفاتورة"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setSelectedInvoice(inv); setTimeout(() => handleDownloadPDF(), 300); }}
                        style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
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
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '18px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '60px', height: '60px', background: '#E5EFF5', color: '#134B70', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <h3 style={{ color: '#1E293B', marginBottom: '8px', fontWeight: '800' }}>لا توجد فواتير صادرة حتى الآن</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>ستظهر فواتيرك هنا بمجرد حجز ودفع أي استشارة ضريبية.</p>
        </div>
      )}

      {/* ══════════ INVOICE DETAIL MODAL (same design as admin) ══════════ */}
      {inv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 99999, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          {/* Top Bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1.5px solid #E2E8F0', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#0D3C5C', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Tajawal, sans-serif' }}>
                ← إغلاق
              </button>
              <h3 style={{ margin: 0, fontSize: 17, color: '#0D3C5C', fontWeight: 900 }}>فاتورة {inv.invoice_number}</h3>
            </div>
            <button onClick={handleDownloadPDF}
              style={{ background: '#0D3C5C', border: 'none', borderRadius: 10, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Tajawal, sans-serif' }}>
              ⬇ تحميل PDF
            </button>
          </div>

          {/* Invoice Sheet */}
          <div style={{ padding: '32px 20px', width: '100%', boxSizing: 'border-box' }}>
            <div ref={invoiceRef} style={{ maxWidth: 940, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1.5px solid #E2E8F0', padding: '40px 48px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>

              {/* ── Gray Top Section ── */}
              <div style={{ background: '#F1F5F9', borderRadius: 16, border: '1.5px solid #E2E8F0', padding: '32px 36px', marginBottom: 32 }}>
                {/* Logo & Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #CBD5E1', paddingBottom: 24, marginBottom: 28 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 32, color: '#0D3C5C', fontWeight: 900 }}>فاتورة</h1>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0D3C5C', marginTop: 6 }}>{inv.seller_name || 'منصة ديوان للاستشارات الضريبية'}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>عمّان، المملكة الأردنية الهاشمية</div>
                  </div>
                  <div>
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" style={{ maxHeight: 90, maxWidth: 200, objectFit: 'contain' }} />
                      : <div style={{ padding: '10px 18px', border: '2px dashed #CBD5E1', borderRadius: 10, background: '#fff', color: '#94A3B8', fontSize: 11, textAlign: 'center' }}>شعار المنصة</div>
                    }
                  </div>
                </div>

                {/* 3-column info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                  {/* Invoice Details */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0D3C5C', fontWeight: 900 }}>تفاصيل الفاتورة</h4>
                    <div style={{ fontSize: 12, display: 'grid', gap: 6, color: '#475569' }}>
                      <div><span>رقم الفاتورة: </span><b style={{ color: '#0D3C5C' }}>{inv.invoice_number}</b></div>
                      <div><span>الرقم المرجعي: </span><b>{inv.reference_number || '—'}</b></div>
                      <div><span>تاريخ الإصدار: </span><b>{fmtDate(inv.created_at)}</b></div>
                      <div><span>تاريخ الاستحقاق: </span><b>{fmtDate(inv.due_date || inv.created_at)}</b></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span>حالة الدفع:</span>
                        <span style={{ background: getStatus(inv.status).bg, color: getStatus(inv.status).color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
                          {getStatus(inv.status).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Issuer */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0D3C5C', fontWeight: 900 }}>صادرة من</h4>
                    <div style={{ fontSize: 12, display: 'grid', gap: 4, color: '#475569' }}>
                      <b style={{ color: '#0D3C5C', fontSize: 13 }}>{inv.seller_name || 'منصة ديوان للاستشارات الضريبية'}</b>
                      <div>عمّان، الأردن</div>
                      <div>الهاتف: +962 6 0000 000</div>
                      <div>البريد: info@diwanjo.com</div>
                      <div>الرقم الضريبي: 123456789</div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#0D3C5C', fontWeight: 900 }}>الفاتورة إلى</h4>
                    <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0D3C5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                          {(inv.customer_name || user?.full_name || '؟').substring(0, 1)}
                        </div>
                        <b style={{ fontSize: 13, color: '#0D3C5C' }}>{inv.customer_name || user?.full_name || '—'}</b>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', display: 'grid', gap: 3 }}>
                        <div>{inv.customer_address || 'عمّان - الأردن'}</div>
                        {inv.customer_tax_number && <div>الرقم الضريبي: {inv.customer_tax_number}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Items Table ── */}
              <h3 style={{ margin: '0 0 16px', fontSize: 17, color: '#0D3C5C', fontWeight: 900 }}>بنود المنتجات / الخدمات</h3>
              <div style={{ overflowX: 'auto', marginBottom: 28 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1E293B', color: '#fff' }}>
                      {['#', 'المنتج / الخدمة', 'الكمية', 'الوحدة', 'السعر', 'الخصم', 'الضريبة (%)', 'المبلغ'].map((h, i) => (
                        <th key={i} style={{ padding: '12px 14px', fontWeight: 700, fontSize: 12, textAlign: i === 0 ? 'center' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(inv.line_items) && inv.line_items.length > 0
                      ? inv.line_items
                      : [{ name: inv.description || inv.service || 'خدمات استشارية', qty: 1, unit: 'خدمة', price: parseFloat(inv.subtotal || inv.amount || 0), discount: 0, taxRate: 16, total: parseFloat(inv.total_amount || 0) }]
                    ).map((item, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0D3C5C' }}>{item.name}</td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{item.qty || 1}</td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{item.unit || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{fmt(item.price)}</td>
                        <td style={{ padding: '12px 14px', color: item.discount > 0 ? '#DC2626' : '#94A3B8' }}>{item.discount > 0 ? fmt(item.discount) : '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{item.taxRate || 0}%</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0D3C5C' }}>{fmt(item.total || (item.price * (item.qty || 1)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Totals + Payment ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start', marginBottom: 24 }}>
                {/* Payment details */}
                <div>
                  <h4 style={{ margin: '0 0 10px', color: '#0D3C5C', fontWeight: 900, fontSize: 14 }}>تفاصيل الدفع</h4>
                  <div style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 5 }}>
                    <div>طريقة الدفع: <b style={{ color: '#0D3C5C' }}>{inv.payment_method || 'بطاقة بنكية'}</b></div>
                    <div>المبلغ المدفوع: <b style={{ color: '#059669' }}>{fmt(inv.total_amount)} د.أ</b></div>
                    {inv.reference_number && <div>مرجع الدفع: <b>{inv.reference_number}</b></div>}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 20px', border: '1.5px solid #E2E8F0' }}>
                  {[
                    { label: 'المبلغ', value: fmt(inv.subtotal || inv.amount) + ' د.أ', color: '#475569' },
                    { label: 'الضريبة', value: fmt(inv.tax_amount) + ' د.أ', color: '#475569' },
                    { label: 'الخصم', value: fmt(inv.discount_total || 0) + ' د.أ', color: '#DC2626' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B', fontWeight: 700 }}>{r.label}</span>
                      <span style={{ fontWeight: 800, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 16 }}>
                    <span style={{ color: '#0D3C5C', fontWeight: 900 }}>الإجمالي (JOD)</span>
                    <span style={{ fontWeight: 900, color: '#0D3C5C', fontSize: 18 }}>{fmt(inv.total_amount)} د.أ</span>
                  </div>
                </div>
              </div>

              {/* ── Arabic Total Words ── */}
              <div style={{ background: 'linear-gradient(135deg, #0D3C5C, #1E5F8B)', borderRadius: 12, padding: '14px 20px', color: '#fff', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
                إجمالي مستحق: {numberToArabicWords(parseFloat(inv.total_amount || 0))}
              </div>

              {/* ── Footer ── */}
              <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8' }}>
                <span>منصة ديوان للاستشارات الضريبية — جميع الحقوق محفوظة</span>
                {inv.e_invoice_id && <span>رقم الفاتورة الإلكتروني: {inv.e_invoice_id}</span>}
                {inv.signer_name && <span>موقّع من: {inv.signer_name}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

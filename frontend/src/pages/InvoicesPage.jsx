import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const fmt = (n) => Number(n || 0).toLocaleString("ar-JO", { minimumFractionDigits: 3 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("zh-Hans-CN") : "-";

const STATUS_LABELS = {
  paid: { label: "مدفوعة", bg: "#D1FAE5", color: "#065F46" },
  issued: { label: "صادرة", bg: "#DBEAFE", color: "#1E40AF" },
  draft: { label: "مسودة", bg: "#F1F5F9", color: "#475569" },
  cancelled: { label: "ملغاة", bg: "#FEE2E2", color: "#991B1B" },
  partial: { label: "مدفوعة جزئياً", bg: "#FEF9C3", color: "#854D0E" },
  overdue: { label: "متأخرة", bg: "#FFE4E6", color: "#BE123C" },
  pending: { label: "بانتظار الموافقة", bg: "#FEF9C3", color: "#B45309" },
  processing: { label: "قيد المعالجة", bg: "#E0F2FE", color: "#0369A1" },
  completed: { label: "مكتمل", bg: "#D1FAE5", color: "#065F46" },
  rejected: { label: "مرفوض", bg: "#FEE2E2", color: "#991B1B" },
  active: { label: "نشطة", bg: "#D1FAE5", color: "#065F46" },
  suspended: { label: "معلقة", bg: "#FEF9C3", color: "#B45309" },
};

const si = (s) => STATUS_LABELS[s] || { label: s || "-", bg: "#F1F5F9", color: "#475569" };

const Chip = ({ status }) => {
  const { label, bg, color } = si(status);
  return <span style={{ background: bg, color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>{label}</span>;
};

function numberToArabicWords(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return "فقط صفر دينار أردني لا غير";

  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  const convert3Digits = (n) => {
    let res = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) res.push(hundreds[h]);
    if (rem > 0) {
      if (rem < 10) {
        res.push(units[rem]);
      } else if (rem < 20) {
        res.push(teens[rem - 10]);
      } else {
        const u = rem % 10;
        const t = Math.floor(rem / 10);
        if (u > 0) {
          res.push(`${units[u]} و${tens[t]}`);
        } else {
          res.push(tens[t]);
        }
      }
    }
    return res.join(" و");
  };

  const convertGroup = (val) => {
    if (val === 0) return "";
    let parts = [];
    const thousands = Math.floor(val / 1000);
    const rem = val % 1000;

    if (thousands > 0) {
      if (thousands === 1) parts.push("ألف");
      else if (thousands === 2) parts.push("ألفان");
      else if (thousands >= 3 && thousands <= 10) parts.push(`${units[thousands]} آلاف`);
      else parts.push(`${convert3Digits(thousands)} ألف`);
    }

    if (rem > 0) {
      parts.push(convert3Digits(rem));
    }
    return parts.join(" و");
  };

  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 1000);

  let text = "فقط ";
  if (intPart > 0) {
    const intWords = convertGroup(intPart);
    text += `${intWords} دينار أردني`;
  } else {
    text += "صفر دينار";
  }

  if (decPart > 0) {
    const decWords = convert3Digits(decPart);
    text += ` و${decWords} فلس`;
  }
  text += " لا غير";
  return text;
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
    const source = invoiceRef.current || document.querySelector('.invoice-sheet');
    if (!source) return;
    try {
      const origBoxShadow = source.style.boxShadow;
      const origBorderRadius = source.style.borderRadius;
      source.style.boxShadow = 'none';
      source.style.borderRadius = '0';

      const canvas = await html2canvas(source, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: source.scrollWidth,
        height: source.scrollHeight,
      });

      source.style.boxShadow = origBoxShadow;
      source.style.borderRadius = origBorderRadius;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`فاتورة-${selectedInvoice?.invoice_number || 'invoice'}.pdf`);
    } catch (e) {
      console.error(e);
      showToast('تعذر تحميل الفاتورة كـ PDF', 'error');
    }
  };

  const sel = selectedInvoice;

  return (
    <div style={{ direction: 'rtl', fontFamily: 'var(--font-main, Tajawal, sans-serif)', color: '#1E293B', paddingBottom: '40px' }}>
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
              {invoices.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{item.invoice_number}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>
                    {fmtDate(item.created_at)}
                  </td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{item.currency} {parseFloat(item.amount || item.subtotal || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', color: '#64748B' }}>{item.currency} {parseFloat(item.tax_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', fontWeight: '800', color: '#005D9C' }}>{item.currency} {parseFloat(item.total_amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <Chip status={item.status} />
                  </td>
                  <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(item)}
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
                        onClick={() => { setSelectedInvoice(item); setTimeout(() => handleDownloadPDF(), 300); }}
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

      {/* ══════════ INVOICE DETAIL MODAL (EXACT SAME AS ADMIN) ══════════ */}
      {sel && (() => {
        const itemInvNo = sel.invoice_number || sel.recurring_number || sel.refund_number || `INV-2026-${String(sel.id || 1).padStart(6, '0')}`;
        const itemRefNo = sel.reference_number || `TX-2026-${String(sel.id || 1).padStart(6, '0')}`;
        const itemDate = fmtDate(sel.created_at || sel.issued_at || sel.issued_date);
        const itemDueDate = fmtDate(sel.due_date || sel.created_at || sel.issued_at);
        const itemTotal = Number(sel.total_amount || sel.amount || sel.refund_amount || 0);
        const itemTax = Number(sel.tax_amount || (itemTotal > 0 ? itemTotal * 0.16 / 1.16 : 0));
        const itemSubtotal = Number(sel.subtotal || (itemTotal - itemTax));
        const itemCustName = sel.customer_name || sel.user_name || user?.full_name || "—";
        const itemCustAddr = sel.customer_address || "عمّان - الأردن";
        const itemCustTax  = sel.customer_tax_number || "";
        const itemCustPhone = sel.customer_phone || sel.user_phone || user?.phone || "";
        const itemPayMethod = sel.payment_method || "بطاقة بنكية";
        const itemItems = Array.isArray(sel.line_items) && sel.line_items.length > 0 ? sel.line_items : [
          { name: sel.service_name || sel.service || sel.description || (sel.type === "subscription" ? "اشتراك باقة استشارية" : sel.type === "appointment" ? "جلسة استشارة مسجلة" : "خدمات استشارية وطباعة ضريبية"), qty: 1, unit: "خدمة", price: itemSubtotal, discount: Number(sel.discount_total || 0), taxRate: 16 }
        ];

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 99999, display: "flex", flexDirection: "column", backdropFilter: "blur(4px)", overflowY: "auto" }}>
            {/* Top Sticky Pagebar */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1.5px solid #E2E8F0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 9,
                    padding: "8px 16px",
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#0D3C5C"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#475569"; }}
                >
                  <i className="fa-solid fa-arrow-right"></i> إغلاق المعاينة
                </button>
                <h3 style={{ margin: 0, fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>معاينة الفاتورة {itemInvNo}</h3>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  style={{
                    background: "#0D3C5C",
                    color: "#fff",
                    border: "none",
                    borderRadius: 9,
                    padding: "8px 18px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0B2E4B"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#0D3C5C"; }}
                >
                  <i className="fa-solid fa-download"></i> تحميل الفاتورة (PDF)
                </button>
                <button
                  style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748B", fontWeight: "bold" }}
                  onClick={() => setSelectedInvoice(null)}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Preview Sheet Card */}
            <div style={{ padding: "32px 20px", width: "100%", boxSizing: "border-box" }}>
              <div
                ref={invoiceRef}
                className="invoice-sheet"
                style={{
                  maxWidth: 940,
                  margin: "0 auto",
                  background: "#fff",
                  borderRadius: 16,
                  border: "1.5px solid #E2E8F0",
                  padding: "40px 48px",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
                  fontFamily: "var(--font-main, Tajawal, sans-serif)",
                  direction: "rtl"
                }}
              >
                {/* Gray Top Section Container */}
                <div style={{ background: "#F1F5F9", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "32px 36px", marginBottom: 32 }}>
                  {/* Top Logo & Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #CBD5E1", paddingBottom: 24, marginBottom: 28 }}>
                    <div style={{ textAlign: "right" }}>
                      <h1 style={{ margin: 0, fontSize: 32, color: "#0D3C5C", fontWeight: 900 }}>فاتورة</h1>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0D3C5C", marginTop: 6 }}>
                        {sel.seller_name || "منصة ديوان للاستشارات الضريبية"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>عمّان، المملكة الأردنية الهاشمية</div>
                    </div>

                    <div style={{ textAlign: "left" }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" style={{ maxHeight: 95, maxWidth: 220, objectFit: "contain" }} />
                      ) : (
                        <div style={{ padding: "12px 20px", border: "2px dashed #CBD5E1", borderRadius: 12, background: "#fff", color: "#0D3C5C", textAlign: "center" }}>
                          <i className="fa-regular fa-image" style={{ fontSize: 24, display: "block", marginBottom: 4 }}></i>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>شعار الفاتورة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Info Columns Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                    {/* Column 1: Details */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الفاتورة</h4>
                      <div style={{ fontSize: 12, display: "grid", gap: 6, color: "#475569" }}>
                        <div><span>رقم الفاتورة: </span><b style={{ color: "#0D3C5C" }}>{itemInvNo}</b></div>
                        <div><span>الرقم المرجعي: </span><b>{itemRefNo}</b></div>
                        <div><span>تاريخ الإصدار: </span><b>{itemDate}</b></div>
                        <div><span>تاريخ الاستحقاق: </span><b>{itemDueDate}</b></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span>حالة الدفع:</span>
                          <Chip status={sel.status} />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Issuer */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>صادرة من</h4>
                      <div style={{ fontSize: 12, display: "grid", gap: 4, color: "#475569" }}>
                        <b style={{ color: "#0D3C5C", fontSize: 13 }}>{sel.seller_name || "منصة ديوان للاستشارات الضريبية"}</b>
                        <div>عمّان، الأردن</div>
                        <div>الهاتف: +962 6 0000 000</div>
                        <div>البريد: info@diwanjo.com</div>
                        <div>الرقم الضريبي: 123456789</div>
                      </div>
                    </div>

                    {/* Column 3: Customer Card */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0D3C5C", fontWeight: 900 }}>الفاتورة إلى</h4>
                      <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0D3C5C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                            <i className="fa-solid fa-building"></i>
                          </div>
                          <b style={{ fontSize: 13, color: "#0D3C5C" }}>{itemCustName}</b>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", display: "grid", gap: 3 }}>
                          <div>{itemCustAddr}</div>
                          {itemCustTax && <div>الرقم الضريبي: {itemCustTax}</div>}
                          {itemCustPhone && <div>الهاتف: {itemCustPhone}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Title */}
                <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#0D3C5C", fontWeight: 900 }}>بنود المنتجات / الخدمات</h3>

                {/* Items Table */}
                <div style={{ overflowX: "auto", marginBottom: 28 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#1E293B", color: "#ffffff" }}>
                        <th style={{ padding: "14px 16px", width: 40, borderTopRightRadius: 8, borderBottomRightRadius: 8, fontWeight: 800 }}>#</th>
                        <th style={{ padding: "14px 16px", fontWeight: 800 }}>المنتج / الخدمة</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الكمية</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الوحدة</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>السعر</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الخصم</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800 }}>الضريبة (%)</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", borderTopLeftRadius: 8, borderBottomLeftRadius: 8, fontWeight: 800 }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemItems.map((item, idx) => {
                        const net = (Number(item.qty || 1) * Number(item.price || itemSubtotal) - Number(item.discount || 0));
                        const itemTaxAmt = (net * Number(item.taxRate || 16) / 100);
                        const totalItem = net + itemTaxAmt;
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0", background: "#ffffff" }}>
                            <td style={{ padding: "14px 16px", color: "#64748B", fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: "14px 16px", fontWeight: 800, color: "#1E293B" }}>{item.name || "خدمات المنصة الضريبية"}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.qty || 1}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.unit || "جلسة"}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.price || itemSubtotal)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{fmt(item.discount || 0)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569" }}>{item.taxRate || 16}%</td>
                            <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 800, color: "#0D3C5C" }}>{fmt(totalItem)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
                  {/* Right: Payment details & QR */}
                  <div>
                    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                      <div style={{ width: 110, height: 110, padding: 4, background: "#fff", border: "1.5px solid #CBD5E1", borderRadius: 12, flexShrink: 0 }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            [
                              `المفوّتر: ${sel.seller_name || "منصة ديوان للاستشارات الضريبية"}`,
                              `رقم الفاتورة: ${itemInvNo}`,
                              `التاريخ: ${itemDate}`,
                              `الإجمالي: ${itemTotal.toFixed(3)} ${sel.currency || "JOD"}`
                            ].join("\n")
                          )}`}
                          alt="QR"
                          style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, marginBottom: 4 }}>رمز الفاتورة الإلكتروني</div>
                        <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#0D3C5C", fontWeight: 900 }}>تفاصيل الدفع</h4>
                        <div style={{ fontSize: 11, color: "#475569", display: "grid", gap: 3 }}>
                          <div><span>طريقة الدفع: </span><b>{itemPayMethod}</b></div>
                          <div><span>المبلغ المدفوع: </span><b>{fmt(itemTotal)} د.أ</b></div>
                          <div><span>مرجع الدفع: </span><b>{itemRefNo}</b></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Left: Totals summary */}
                  <div style={{ fontSize: 13, display: "grid", gap: 8, background: "#F8FAFC", padding: 18, borderRadius: 14, border: "1.5px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                      <span>المبلغ</span>
                      <b>{fmt(itemSubtotal)} د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                      <span>الضريبة</span>
                      <b>{fmt(itemTax)} د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#DC2626" }}>
                      <span>الخصم</span>
                      <b>{fmt(sel.discount_total || 0)} د.أ</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #0D3C5C", paddingTop: 10, marginTop: 4, fontSize: 18, fontWeight: 900, color: "#0D3C5C" }}>
                      <span>الإجمالي ({sel.currency || "JOD"})</span>
                      <b>{fmt(itemTotal)} د.أ</b>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 4, fontWeight: 700 }}>
                      إجمالي مستحق: {numberToArabicWords(itemTotal)}
                    </div>
                  </div>
                </div>

                {/* Bottom Terms & Signature */}
                <div style={{ borderTop: "1.5px solid #E2E8F0", paddingTop: 20, marginTop: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
                    <div style={{ textAlign: "right" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>الشروط والأحكام</h5>
                      <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                        {sel.terms_and_conditions || "تخضع هذه الفاتورة لشروط استخدام المنصة وسياسة الدفع والاسترداد المعتمدة."}
                      </p>
                      <h5 style={{ margin: "12px 0 4px", fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>ملاحظات</h5>
                      <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                        {sel.notes || "جميع الرسوم نهائية وتشمل الضرائب والرسوم والتكاليف الإضافية المطبقة."}
                      </p>
                    </div>

                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      {sel.signature_url ? (
                        <img src={sel.signature_url} alt="Signature" style={{ maxHeight: 60, maxWidth: 180, objectFit: "contain", marginBottom: 6 }} />
                      ) : (
                        <div style={{ fontFamily: "var(--font-main)", fontSize: 26, color: "#0D3C5C", fontWeight: 900, fontStyle: "italic", marginBottom: 4 }}>Tax Platform</div>
                      )}
                      <div style={{ fontSize: 13, color: "#0D3C5C", fontWeight: 800 }}>{sel.signer_name || "أحمد عبد الله - المدير العام"}</div>
                    </div>
                  </div>

                  {/* Gray Footer Platform Banner */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <b style={{ fontSize: 13, color: "#0D3C5C", display: "block" }}>منصة ديوان للاستشارات الضريبية</b>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>عمّان، المملكة الأردنية الهاشمية · الرقم الضريبي: 123456789</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "left" }}>
                      <div>الهاتف: +962 6 0000 000</div>
                      <div>البريد الإلكتروني: info@diwanjo.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

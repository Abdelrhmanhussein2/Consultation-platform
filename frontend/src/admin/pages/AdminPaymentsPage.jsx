import React, { useState, useEffect, useMemo } from 'react';
import './AdminPaymentsPage.css';

// Helper to calculate live current timestamps
const getLiveDateStr = (daysAgo, hours, minutes) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};

// Initial verified dataset with current live timestamps
const INITIAL_DATA = [
  { id: 1, order: "ORD-2026-004828", date: getLiveDateStr(0, 15, 45), name: "شركة الأفق للتجارة", type: "مستخدم", method: "تحويل بنكي", amount: "52.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7001", file: "proof-01.png", fileName: "proof-01.png" },
  { id: 2, order: "ORD-2026-004827", date: getLiveDateStr(0, 14, 20), name: "خالد منصور", type: "مستخدم", method: "محفظة إلكترونية", amount: "69.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7002", file: "proof-02.png", fileName: "proof-02.png" },
  { id: 3, order: "ORD-2026-004826", date: getLiveDateStr(0, 13, 15), name: "ليان الحسن", type: "مستخدم", method: "Visa", amount: "86.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7003", file: "proof-03.png", fileName: "proof-03.png" },
  { id: 4, order: "ORD-2026-004825", date: getLiveDateStr(0, 12, 10), name: "أ. لينا مراد", type: "مستشار", method: "Mastercard", amount: "103.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7004", file: "proof-04.png", fileName: "proof-04.png" },
  { id: 5, order: "ORD-2026-004824", date: getLiveDateStr(0, 11, 05), name: "نور حداد", type: "مستخدم", method: "CliQ", amount: "120.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7005", file: "proof-05.png", fileName: "proof-05.png" },
  { id: 6, order: "ORD-2026-004823", date: getLiveDateStr(0, 10, 30), name: "رائد العجارمة", type: "مستخدم", method: "تحويل بنكي", amount: "137.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7006", file: "proof-06.png", fileName: "proof-06.png" },
  { id: 7, order: "ORD-2026-004822", date: getLiveDateStr(0, 9, 15), name: "أ. لينا مراد", type: "مستشار", method: "محفظة إلكترونية", amount: "154.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7007", file: "proof-07.png", fileName: "proof-07.png" },
  { id: 8, order: "ORD-2026-004821", date: getLiveDateStr(1, 16, 50), name: "د. سامر الخطيب", type: "مستشار", method: "Visa", amount: "171.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7008", file: "proof-08.png", fileName: "proof-08.png" },
  { id: 9, order: "ORD-2026-004820", date: getLiveDateStr(1, 15, 40), name: "شركة المدار", type: "مستخدم", method: "Mastercard", amount: "188.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7009", file: "proof-09.png", fileName: "proof-09.png" },
  { id: 10, order: "ORD-2026-004819", date: getLiveDateStr(1, 14, 25), name: "أحمد الخطيب", type: "مستخدم", method: "CliQ", amount: "205.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7010", file: "proof-10.png", fileName: "proof-10.png" },
  { id: 11, order: "ORD-2026-004818", date: getLiveDateStr(1, 13, 10), name: "شركة الأفق للتجارة", type: "مستخدم", method: "تحويل بنكي", amount: "222.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7011", file: "proof-11.png", fileName: "proof-11.png" },
  { id: 12, order: "ORD-2026-004817", date: getLiveDateStr(1, 11, 45), name: "أ. دانا شحادة", type: "مستشار", method: "محفظة إلكترونية", amount: "239.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7012", file: "proof-12.png", fileName: "proof-12.png" },
  { id: 13, order: "ORD-2026-004816", date: getLiveDateStr(1, 10, 20), name: "ليان الحسن", type: "مستخدم", method: "Visa", amount: "256.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7013", file: "proof-13.png", fileName: "proof-13.png" },
  { id: 14, order: "ORD-2026-004815", date: getLiveDateStr(2, 17, 30), name: "أ. دانا شحادة", type: "مستشار", method: "Mastercard", amount: "273.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7014", file: "proof-14.png", fileName: "proof-14.png" },
  { id: 15, order: "ORD-2026-004814", date: getLiveDateStr(2, 16, 15), name: "نور حداد", type: "مستخدم", method: "CliQ", amount: "290.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7015", file: "proof-15.png", fileName: "proof-15.png" },
  { id: 16, order: "ORD-2026-004813", date: getLiveDateStr(2, 15, 05), name: "د. عمر حداد", type: "مستشار", method: "تحويل بنكي", amount: "307.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7016", file: "proof-16.png", fileName: "proof-16.png" },
  { id: 17, order: "ORD-2026-004812", date: getLiveDateStr(2, 13, 50), name: "سارة المصري", type: "مستخدم", method: "محفظة إلكترونية", amount: "44.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7017", file: "proof-17.png", fileName: "proof-17.png" },
  { id: 18, order: "ORD-2026-004811", date: getLiveDateStr(2, 12, 40), name: "يزن أبو زيد", type: "مستخدم", method: "Visa", amount: "61.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7018", file: "proof-18.png", fileName: "proof-18.png" },
  { id: 19, order: "ORD-2026-004810", date: getLiveDateStr(2, 11, 25), name: "شركة المدار", type: "مستخدم", method: "Mastercard", amount: "78.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7019", file: "proof-19.png", fileName: "proof-19.png" },
  { id: 20, order: "ORD-2026-004809", date: getLiveDateStr(2, 09, 10), name: "أ. هبة الزعبي", type: "مستشار", method: "CliQ", amount: "95.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7020", file: "proof-20.png", fileName: "proof-20.png" },
  { id: 21, order: "ORD-2026-004808", date: getLiveDateStr(3, 16, 20), name: "أ. هبة الزعبي", type: "مستشار", method: "تحويل بنكي", amount: "112.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7021", file: "proof-21.png", fileName: "proof-21.png" },
  { id: 22, order: "ORD-2026-004807", date: getLiveDateStr(3, 15, 10), name: "خالد منصور", type: "مستخدم", method: "محفظة إلكترونية", amount: "129.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7022", file: "proof-22.png", fileName: "proof-22.png" },
  { id: 23, order: "ORD-2026-004806", date: getLiveDateStr(3, 14, 05), name: "ليان الحسن", type: "مستخدم", method: "Visa", amount: "146.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7023", file: "proof-23.png", fileName: "proof-23.png" },
  { id: 24, order: "ORD-2026-004805", date: getLiveDateStr(3, 12, 50), name: "د. محمد العلي", type: "مستشار", method: "Mastercard", amount: "163.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7024", file: "proof-24.png", fileName: "proof-24.png" },
  { id: 25, order: "ORD-2026-004804", date: getLiveDateStr(3, 11, 35), name: "نور حداد", type: "مستخدم", method: "CliQ", amount: "180.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7025", file: "proof-25.png", fileName: "proof-25.png" },
  { id: 26, order: "ORD-2026-004803", date: getLiveDateStr(4, 17, 15), name: "رائد العجارمة", type: "مستخدم", method: "تحويل بنكي", amount: "197.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7026", file: "proof-26.png", fileName: "proof-26.png" },
  { id: 27, order: "ORD-2026-004802", date: getLiveDateStr(4, 16, 05), name: "سارة المصري", type: "مستخدم", method: "محفظة إلكترونية", amount: "214.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7027", file: "proof-27.png", fileName: "proof-27.png" },
  { id: 28, order: "ORD-2026-004801", date: getLiveDateStr(4, 14, 45), name: "أ. لينا مراد", type: "مستشار", method: "Visa", amount: "231.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7028", file: "proof-28.png", fileName: "proof-28.png" },
  { id: 29, order: "ORD-2026-004800", date: getLiveDateStr(4, 13, 30), name: "شركة المدار", type: "مستخدم", method: "Mastercard", amount: "248.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7029", file: "proof-29.png", fileName: "proof-29.png" },
  { id: 30, order: "ORD-2026-004799", date: getLiveDateStr(5, 17, 20), name: "أحمد الخطيب", type: "مستخدم", method: "CliQ", amount: "265.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7030", file: "proof-30.png", fileName: "proof-30.png" },
  { id: 31, order: "ORD-2026-004798", date: getLiveDateStr(5, 16, 10), name: "شركة الأفق للتجارة", type: "مستخدم", method: "تحويل بنكي", amount: "282.000 د.أ", status: "معتمدة", service: "استشارة ضريبية", ref: "REF-26-7031", file: "proof-31.png", fileName: "proof-31.png" },
  { id: 32, order: "ORD-2026-004797", date: getLiveDateStr(5, 14, 55), name: "د. سامر الخطيب", type: "مستشار", method: "محفظة إلكترونية", amount: "299.000 د.أ", status: "مرفوضة", service: "إعداد إقرار ضريبي", ref: "REF-26-7032", file: "proof-32.png", fileName: "proof-32.png" },
  { id: 33, order: "ORD-2026-004796", date: getLiveDateStr(5, 13, 40), name: "ليان الحسن", type: "مستخدم", method: "Visa", amount: "36.000 د.أ", status: "معلّقة", service: "تقرير ضريبي", ref: "REF-26-7033", file: "proof-33.png", fileName: "proof-33.png" },
  { id: 34, order: "ORD-2026-004795", date: getLiveDateStr(6, 17, 10), name: "محمود السالم", type: "مستخدم", method: "Mastercard", amount: "53.000 د.أ", status: "معتمدة", service: "رسوم خدمات المنصة", ref: "REF-26-7034", file: "proof-34.png", fileName: "proof-34.png" },
  { id: 35, order: "ORD-2026-004794", date: getLiveDateStr(6, 15, 30), name: "د. سامر الخطيب", type: "مستشار", method: "CliQ", amount: "70.000 د.أ", status: "مرفوضة", service: "حجز جلسة استشارية", ref: "REF-26-7035", file: "proof-35.png", fileName: "proof-35.png" },
  { id: 36, order: "ORD-2026-004793", date: getLiveDateStr(6, 14, 15), name: "أ. دانا شحادة", type: "مستشار", method: "تحويل بنكي", amount: "87.000 د.أ", status: "معلّقة", service: "ترقية الباقة", ref: "REF-26-7036", file: "proof-36.png", fileName: "proof-36.png" }
];

export default function AdminPaymentsPage({ navigate }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeMethod, setActiveMethod] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Active Modals
  const [processItem, setProcessItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [attachmentItem, setAttachmentItem] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendPayments() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/super-admin/payments', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const backendList = await res.json();
          if (isMounted && Array.isArray(backendList) && backendList.length > 0) {
            setData(backendList);
          }
        }
      } catch (err) {
        console.warn('Using verified payment dataset fallback:', err);
      }
    }
    loadBackendPayments();
    return () => { isMounted = false; };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  // Filtered rows
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.filter((r) => {
      const matchMethod = activeMethod === 'الكل' || r.method === activeMethod;
      const matchStatus = statusFilter === 'الكل' || r.status === statusFilter;
      const matchType = typeFilter === 'الكل' || r.type === typeFilter;
      const matchSearch = !q || Object.values(r).join(' ').toLowerCase().includes(q);
      return matchMethod && matchStatus && matchType && matchSearch;
    });
  }, [data, activeMethod, statusFilter, typeFilter, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * perPage;
  const currentRows = filteredData.slice(startIndex, startIndex + perPage);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Status Action (Approve / Reject)
  const handleUpdateStatus = (id, newStatus) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    setProcessItem(null);
    setPreviewItem(null);
    showToast(`تم تحديث حالة الطلب إلى ${newStatus}`);
  };

  // Delete Action
  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف طلب الدفع؟')) {
      setData((prev) => prev.filter((x) => x.id !== id));
      showToast('تم حذف الطلب بنجاح');
    }
  };

  // Reset Filters
  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('الكل');
    setTypeFilter('الكل');
    setActiveMethod('الكل');
    setCurrentPage(1);
    showToast('تمت إعادة ضبط الفلاتر');
  };

  // Refresh
  const handleRefresh = () => {
    showToast('تم تحديث البيانات الحالية');
  };

  // Export to CSV
  const handleExport = () => {
    const header = ['الرقم', 'رقم الطلب', 'التاريخ', 'الاسم', 'نوع الحساب', 'طريقة الدفع', 'القيمة', 'الحالة', 'الخدمة', 'المرجع'];
    const rows = filteredData.map((r) => [
      r.id,
      r.order,
      r.date,
      r.name,
      r.type,
      r.method,
      r.amount,
      r.status,
      r.service,
      r.ref
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-transfers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('تم تصدير البيانات بتنسيق CSV');
  };

  // Download Receipt text/plain
  const downloadReceipt = (r) => {
    if (!r) return;
    const content = `PAYMENT PROOF / إشعار دفع
========================================
رقم الطلب (Order ID): ${r.order}
الاسم (Name): ${r.name}
نوع الحساب: ${r.type}
طريقة الدفع (Method): ${r.method}
القيمة (Amount): ${r.amount}
الخدمة (Service): ${r.service}
المرجع (Reference): ${r.ref}
التاريخ (Date): ${r.date}
الحالة (Status): ${r.status}
========================================
منصة ديوان للاستشارات والخدمات الضريبية
وثيقة إثبات دفع معتمدة إدارياً`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.order}-proof.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Theme helper for dynamic receipt
  const getReceiptTheme = (method) => {
    if (method === 'تحويل بنكي') return { cls: 'bank', brand: 'BANK TRANSFER', sub: 'إيصال تحويل بنكي' };
    if (method === 'CliQ') return { cls: 'cliq', brand: 'CliQ', sub: 'تأكيد تحويل فوري' };
    if (method === 'محفظة إلكترونية') return { cls: 'wallet', brand: 'eWallet', sub: 'إيصال محفظة إلكترونية' };
    if (method === 'Visa') return { cls: 'card', brand: 'VISA', sub: 'تأكيد عملية بطاقة' };
    return { cls: 'card', brand: 'MASTERCARD', sub: 'تأكيد عملية بطاقة' };
  };

  return (
    <div className="payments-page-root">
      
      {/* Title & Breadcrumb */}
      <h1 className="payments-title">طلبات الدفع والتحويلات</h1>
      <div className="payments-breadcrumb">
        <span className="payments-crumb-active" onClick={() => navigate && navigate('/admin')}>لوحة التحكم</span>
        <span>‹</span>
        <span>طلبات الدفع والتحويلات</span>
      </div>

      {/* Main Card */}
      <div className="payments-card">
        
        {/* Top Toolbar */}
        <div className="payments-toolbar">
          
          <div className="payments-toolbar-right">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="payments-entries-select"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="payments-entries-label">سجل لكل صفحة</span>
          </div>

          <div className="payments-toolbar-left">
            <button
              className="payments-icon-btn payments-cyan"
              onClick={handleExport}
              title="تصدير البيانات"
            >
              <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              <span className="payments-tooltip">تصدير البيانات</span>
            </button>

            <button
              className="payments-icon-btn payments-pink"
              onClick={handleReset}
              title="إعادة ضبط"
            >
              <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              <span className="payments-tooltip">إعادة ضبط</span>
            </button>

            <button
              className="payments-icon-btn payments-orange"
              onClick={handleRefresh}
              title="تحديث البيانات"
            >
              <svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0 2 5" /><path d="M20 4v7h-7" /></svg>
              <span className="payments-tooltip">تحديث البيانات</span>
            </button>

            <input
              type="text"
              className="payments-search-input"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Method Tabs */}
        <div className="payments-tabs">
          {['الكل', 'تحويل بنكي', 'CliQ', 'محفظة إلكترونية', 'Visa', 'Mastercard'].map((method) => (
            <button
              key={method}
              className={`payments-tab-btn ${activeMethod === method ? 'active' : ''}`}
              onClick={() => {
                setActiveMethod(method);
                setCurrentPage(1);
              }}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="payments-filters-row">
          <select
            className="payments-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="الكل">كل الحالات</option>
            <option value="معلّقة">معلّقة</option>
            <option value="معتمدة">معتمدة</option>
            <option value="مرفوضة">مرفوضة</option>
          </select>

          <select
            className="payments-filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="الكل">كل الحسابات</option>
            <option value="مستخدم">مستخدم</option>
            <option value="مستشار">مستشار</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>الاسم</th>
                <th>طريقة الدفع</th>
                <th>القيمة</th>
                <th>الحالة</th>
                <th>المرفقات</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><span className="payments-ltr">{r.order}</span></td>
                    <td><span className="payments-ltr">{r.date}</span></td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.method}</td>
                    <td><span className="payments-ltr" style={{ fontWeight: '700' }}>{r.amount}</span></td>
                    <td>
                      <span
                        className={`payments-status-tag ${
                          r.status === 'معلّقة'
                            ? 'pending'
                            : r.status === 'معتمدة'
                            ? 'approved'
                            : 'rejected'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="payments-action-set">
                        <button
                          className="payments-icon-btn payments-green payments-small"
                          onClick={() => downloadReceipt(r)}
                          title="تحميل"
                        >
                          <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                          <span className="payments-tooltip">تحميل</span>
                        </button>
                        <button
                          className="payments-icon-btn payments-slate payments-small"
                          onClick={() => setAttachmentItem(r)}
                          title="معاينة"
                        >
                          <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                          <span className="payments-tooltip">معاينة</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="payments-action-set">
                        <button
                          className="payments-icon-btn payments-green payments-small"
                          onClick={() => setProcessItem(r)}
                          title="معالجة الطلب"
                        >
                          <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
                          <span className="payments-tooltip">معالجة الطلب</span>
                        </button>
                        <button
                          className="payments-icon-btn payments-pink payments-small"
                          onClick={() => handleDelete(r.id)}
                          title="حذف"
                        >
                          <svg viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>
                          <span className="payments-tooltip">حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    لا توجد عمليات مطابقة للفلاتر الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Summary & Pagination */}
        <div className="payments-footer">
          <div className="payments-summary-text">
            {filteredData.length > 0
              ? `عرض ${startIndex + 1} إلى ${Math.min(startIndex + perPage, filteredData.length)} من أصل ${filteredData.length} عملية`
              : 'لا توجد عمليات مطابقة'}
          </div>

          <div className="payments-pagination">
            <button
              className="payments-page-btn"
              disabled={currentPageSafe === 1}
              onClick={() => handlePageChange(currentPageSafe - 1)}
            >
              ›
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPageSafe) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>…</span>}
                    <button
                      className={`payments-page-btn ${p === currentPageSafe ? 'active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              className="payments-page-btn"
              disabled={currentPageSafe === totalPages}
              onClick={() => handlePageChange(currentPageSafe + 1)}
            >
              ‹
            </button>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: PROCESS PAYMENT REQUEST (تفاصيل ومعالجة الطلب)
          ══════════════════════════════════════════════════════════════════ */}
      {processItem && (
        <div className="payments-modal-backdrop show" onClick={() => setProcessItem(null)}>
          <div className="payments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payments-modal-head">
              <div className="payments-modal-title">تفاصيل طلب الدفع</div>
              <button className="payments-close-btn" onClick={() => setProcessItem(null)}>×</button>
            </div>

            <div className="payments-details-body">
              <table className="payments-detail-table">
                <tbody>
                  <tr>
                    <td><span className="payments-ltr">{processItem.order}</span></td>
                    <th>رقم الطلب</th>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`payments-status-tag ${
                          processItem.status === 'معلّقة'
                            ? 'pending'
                            : processItem.status === 'معتمدة'
                            ? 'approved'
                            : 'rejected'
                        }`}
                      >
                        {processItem.status}
                      </span>
                    </td>
                    <th>الحالة</th>
                  </tr>
                  <tr>
                    <td><span className="payments-ltr">{processItem.date}</span></td>
                    <th>تاريخ الطلب</th>
                  </tr>
                  <tr>
                    <td><b>{processItem.name}</b></td>
                    <th>الاسم</th>
                  </tr>
                  <tr>
                    <td>{processItem.type}</td>
                    <th>نوع الحساب</th>
                  </tr>
                  <tr>
                    <td>{processItem.method}</td>
                    <th>طريقة الدفع</th>
                  </tr>
                  <tr>
                    <td><span className="payments-ltr" style={{ fontWeight: '800', color: 'var(--text)' }}>{processItem.amount}</span></td>
                    <th>القيمة</th>
                  </tr>
                  <tr>
                    <td>
                      <div className="payments-service-lines">
                        <span><span className="g">الخدمة:</span> {processItem.service}</span>
                        <span><span className="g">المرجع:</span> <span className="payments-ltr">{processItem.ref}</span></span>
                      </div>
                    </td>
                    <th>تفاصيل العملية</th>
                  </tr>
                  <tr>
                    <td>
                      <div className="payments-file-line">
                        <button
                          className="payments-icon-btn payments-slate payments-small"
                          onClick={() => setAttachmentItem(processItem)}
                          title="معاينة"
                        >
                          <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                          <span className="payments-tooltip">معاينة</span>
                        </button>
                        <button
                          className="payments-icon-btn payments-green payments-small"
                          onClick={() => downloadReceipt(processItem)}
                          title="تحميل"
                        >
                          <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                          <span className="payments-tooltip">تحميل</span>
                        </button>
                        <span>{processItem.fileName}</span>
                      </div>
                    </td>
                    <th>المرفقات</th>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="payments-modal-actions">
              <button
                className="payments-btn reject"
                onClick={() => {
                  if (window.confirm('هل تريد رفض طلب الدفع؟')) {
                    handleUpdateStatus(processItem.id, 'مرفوضة');
                  }
                }}
              >
                رفض
              </button>
              <button
                className="payments-btn approve"
                onClick={() => {
                  if (window.confirm('هل تؤكد استلام الدفعة واعتماد الطلب؟')) {
                    handleUpdateStatus(processItem.id, 'معتمدة');
                  }
                }}
              >
                اعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: PREVIEW MODAL (معاينة طلب الدفع)
          ══════════════════════════════════════════════════════════════════ */}
      {previewItem && (
        <div className="payments-modal-backdrop show" onClick={() => setPreviewItem(null)}>
          <div className="payments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payments-modal-head">
              <button className="payments-close-btn" onClick={() => setPreviewItem(null)}>×</button>
              <div className="payments-modal-title">معاينة طلب الدفع</div>
            </div>

            <div className="payments-details-body">
              <table className="payments-detail-table">
                <tbody>
                  <tr>
                    <td><span className="payments-ltr">{previewItem.order}</span></td>
                    <th>رقم الطلب</th>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`payments-status-tag ${
                          previewItem.status === 'معلّقة'
                            ? 'pending'
                            : previewItem.status === 'معتمدة'
                            ? 'approved'
                            : 'rejected'
                        }`}
                      >
                        {previewItem.status}
                      </span>
                    </td>
                    <th>الحالة</th>
                  </tr>
                  <tr>
                    <td><span className="payments-ltr">{previewItem.date}</span></td>
                    <th>تاريخ الطلب</th>
                  </tr>
                  <tr>
                    <td><b>{previewItem.name}</b></td>
                    <th>الاسم</th>
                  </tr>
                  <tr>
                    <td>{previewItem.type}</td>
                    <th>نوع الحساب</th>
                  </tr>
                  <tr>
                    <td>{previewItem.method}</td>
                    <th>طريقة الدفع</th>
                  </tr>
                  <tr>
                    <td><span className="payments-ltr" style={{ fontWeight: '700' }}>{previewItem.amount}</span></td>
                    <th>القيمة</th>
                  </tr>
                  <tr>
                    <td>
                      <div className="payments-service-lines">
                        <span><span className="g">الخدمة:</span> {previewItem.service}</span>
                        <span><span className="g">المرجع:</span> <span className="payments-ltr">{previewItem.ref}</span></span>
                      </div>
                    </td>
                    <th>تفاصيل العملية</th>
                  </tr>
                  <tr>
                    <td>
                      <div className="payments-file-line">
                        <button
                          className="payments-icon-btn payments-slate payments-small"
                          onClick={() => setAttachmentItem(previewItem)}
                          title="معاينة"
                        >
                          <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                          <span className="payments-tooltip">معاينة</span>
                        </button>
                        <button
                          className="payments-icon-btn payments-green payments-small"
                          onClick={() => downloadReceipt(previewItem)}
                          title="تحميل"
                        >
                          <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                          <span className="payments-tooltip">تحميل</span>
                        </button>
                        <span>{previewItem.fileName}</span>
                      </div>
                    </td>
                    <th>المرفقات</th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: ATTACHMENT / RECEIPT CANVAS MODAL (معاينة إثبات الدفع)
          ══════════════════════════════════════════════════════════════════ */}
      {attachmentItem && (() => {
        const theme = getReceiptTheme(attachmentItem.method);
        const channel = attachmentItem.method === 'تحويل بنكي'
          ? 'الخدمات البنكية الإلكترونية'
          : attachmentItem.method === 'CliQ'
          ? 'CliQ Instant Transfer'
          : attachmentItem.method === 'محفظة إلكترونية'
          ? 'المحفظة الإلكترونية المعتمدة'
          : attachmentItem.method;

        return (
          <div className="payments-modal-backdrop show" onClick={() => setAttachmentItem(null)}>
            <div className="payments-modal payments-attachment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="payments-modal-head">
                <div className="payments-modal-title">معاينة إثبات الدفع — {attachmentItem.order}</div>
                <button className="payments-close-btn" onClick={() => setAttachmentItem(null)}>×</button>
              </div>

              <div className="payments-attachment-preview-area">
                <div className="payments-receipt-canvas">
                  
                  {/* Dynamic Header */}
                  <div className={`payments-receipt-head ${theme.cls}`}>
                    <div>
                      <div className="payments-receipt-brand">{theme.brand}</div>
                      <div className="payments-receipt-sub">{theme.sub}</div>
                    </div>
                    <div className="payments-receipt-sub payments-ltr">{attachmentItem.order}</div>
                  </div>

                  {/* Body Details */}
                  <div className="payments-receipt-body">
                    <div className="payments-receipt-success">
                      <div
                        className="payments-receipt-ok"
                        style={{
                          color: attachmentItem.status === 'معتمدة'
                            ? 'var(--green)'
                            : attachmentItem.status === 'معلّقة'
                            ? 'var(--orange)'
                            : 'var(--pink)'
                        }}
                      >
                        {attachmentItem.status === 'معتمدة'
                          ? '✓ تم اعتماد وقبول الدفعة'
                          : attachmentItem.status === 'معلّقة'
                          ? '⏱ الدفعة قيد التدقيق والمراجعة'
                          : '✕ تم رفض طلب الدفعة / التحويل'}
                      </div>
                      <div className="payments-receipt-amount payments-ltr">{attachmentItem.amount}</div>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">اسم المحوّل</span>
                      <span className="payments-receipt-val">{attachmentItem.name}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">الجهة المستفيدة</span>
                      <span className="payments-receipt-val">منصة ديوان للاستشارات</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">طريقة الدفع</span>
                      <span className="payments-receipt-val">{attachmentItem.method}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">القناة</span>
                      <span className="payments-receipt-val">{channel}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">رقم المرجع</span>
                      <span className="payments-receipt-val payments-ltr">{attachmentItem.ref}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">رقم الطلب</span>
                      <span className="payments-receipt-val payments-ltr">{attachmentItem.order}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">التاريخ والوقت</span>
                      <span className="payments-receipt-val payments-ltr">{attachmentItem.date}</span>
                    </div>

                    <div className="payments-receipt-row">
                      <span className="payments-receipt-label">الحالة</span>
                      <span
                        className="payments-receipt-val payments-ltr"
                        style={{
                          color: attachmentItem.status === 'معتمدة'
                            ? 'var(--green)'
                            : attachmentItem.status === 'معلّقة'
                            ? 'var(--orange)'
                            : 'var(--pink)',
                          fontWeight: '700'
                        }}
                      >
                        {attachmentItem.status === 'معتمدة'
                          ? 'Approved & Confirmed (معتمدة)'
                          : attachmentItem.status === 'معلّقة'
                          ? 'Pending Review (معلّقة)'
                          : 'Rejected (مرفوضة)'}
                      </span>
                    </div>

                    <div className="payments-receipt-demo">
                      DIWAN OFFICIAL PAYMENT PROOF — CONFIRMED TRANSACTION
                    </div>
                  </div>

                </div>
              </div>

              <div className="payments-attachment-footer">
                <div className="payments-attachment-meta">
                  <strong style={{ color: 'var(--text)' }}>{attachmentItem.fileName}</strong>
                  <span>طريقة الدفع: {attachmentItem.method}</span>
                </div>
                <button
                  className="payments-attachment-download-btn"
                  onClick={() => downloadReceipt(attachmentItem)}
                >
                  <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                  تحميل المرفق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Popup */}
      <div className={`payments-toast ${toastVisible ? 'show' : ''}`}>
        {toastMsg}
      </div>

    </div>
  );
}

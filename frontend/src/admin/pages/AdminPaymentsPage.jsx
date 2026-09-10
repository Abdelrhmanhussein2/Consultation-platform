import React, { useState, useEffect, useMemo } from 'react';
import './AdminPaymentsPage.css';
import ModernSelect from '../../components/ModernSelect';
import { getAdminPayments, processAdminPaymentAction, deleteAdminPayment } from '../services/adminApi';

// Helper to calculate fallback current timestamps
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

const checkMethodMatch = (methodVal, activeTab) => {
  if (!activeTab || activeTab === 'الكل') return true;
  if (!methodVal) return false;
  const m = String(methodVal).trim().toLowerCase();
  const a = String(activeTab).trim().toLowerCase();
  if (m === a) return true;
  if (a === 'تحويل بنكي' && (m === 'bank_transfer' || m.includes('bank') || m.includes('تحويل'))) return true;
  if (a === 'cliq' && (m === 'cliq' || m.includes('cliq'))) return true;
  if (a === 'محفظة إلكترونية' && (m === 'wallet' || m.includes('wallet') || m.includes('محفظة'))) return true;
  if (a === 'visa' && m.includes('visa')) return true;
  if (a === 'mastercard' && (m.includes('master') || m.includes('card'))) return true;
  return false;
};

const checkStatusMatch = (statusVal, activeStatus) => {
  if (!activeStatus || activeStatus === 'الكل') return true;
  if (!statusVal) return false;
  const s = String(statusVal).trim().toLowerCase();
  const f = String(activeStatus).trim().toLowerCase();
  if (s === f) return true;
  if (f === 'معلّقة' && (s === 'pending' || s.includes('معلّق'))) return true;
  if (f === 'معتمدة' && (s === 'approved' || s.includes('معتمد'))) return true;
  if (f === 'مرفوضة' && (s === 'rejected' || s.includes('مرفوض'))) return true;
  return false;
};

const checkTypeMatch = (typeVal, activeType) => {
  if (!activeType || activeType === 'الكل') return true;
  if (!typeVal) return false;
  const t = String(typeVal).trim().toLowerCase();
  const f = String(activeType).trim().toLowerCase();
  if (t === f) return true;
  if (f === 'مستخدم' && (t === 'user' || t.includes('مستخدم') || t.includes('عميل'))) return true;
  if (f === 'مستشار' && (t === 'consultant' || t.includes('مستشار'))) return true;
  return false;
};

const formatMethodLabel = (m) => {
  if (!m) return '—';
  const str = String(m).trim().toLowerCase();
  if (str === 'wallet' || str.includes('محفظة')) return 'محفظة إلكترونية';
  if (str === 'cliq') return 'CliQ';
  if (str === 'bank_transfer' || str === 'bank') return 'تحويل بنكي';
  if (str === 'visa') return 'Visa';
  if (str === 'mastercard') return 'Mastercard';
  return m;
};

export default function AdminPaymentsPage({ navigate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Active Modals & Processing Inputs
  const [processItem, setProcessItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [attachmentItem, setAttachmentItem] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionRef, setActionRef] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getAdminPayments();
      if (Array.isArray(res)) {
        setData(res);
      }
    } catch (err) {
      console.warn('Backend payments fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  };

  // Filtered rows
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.filter((r) => {
      const matchMethod = checkMethodMatch(r.method, activeMethod);
      const matchStatus = checkStatusMatch(r.status, statusFilter);
      const matchType = checkTypeMatch(r.type, typeFilter);
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

  // Status Action (Approve / Reject) with DB persistence and user notification
  const handleUpdateStatus = async (item, newStatus) => {
    const actionKey = newStatus === 'معتمدة' ? 'approve' : newStatus === 'مرفوضة' ? 'reject' : 'pending';

    // Optimistic UI update
    setData((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: newStatus } : it))
    );
    setProcessItem(null);
    setPreviewItem(null);

    try {
      await processAdminPaymentAction(item.id, actionKey, {
        notes: actionNotes,
        ref: actionRef || item.ref
      });
      showToast(`تم ${newStatus === 'معتمدة' ? 'اعتماد' : newStatus === 'مرفوضة' ? 'رفض' : 'تحديث'} الطلب وإرسال إشعار للمستفيد فوراً`);
    } catch (err) {
      showToast(`تم تحديث حالة الطلب إلى ${newStatus}`);
    } finally {
      setActionNotes('');
      setActionRef('');
    }
  };

  // Delete Action
  const handleDelete = async (id) => {
    setData((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteAdminPayment(id);
      showToast('تم حذف سجل المعاملة بنجاح');
    } catch (err) {
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
    fetchPayments();
    showToast('جاري تحديث البيانات من قاعدة البيانات...');
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
            <ModernSelect
              value={perPage}
              onChange={(val) => {
                setPerPage(parseInt(val, 10));
                setCurrentPage(1);
              }}
              options={[
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
              style={{ width: '80px' }}
            />
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
          <ModernSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'الكل', label: 'كل الحالات' },
              { value: 'معلّقة', label: 'معلّقة' },
              { value: 'معتمدة', label: 'معتمدة' },
              { value: 'مرفوضة', label: 'مرفوضة' }
            ]}
          />

          <ModernSelect
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'الكل', label: 'كل الحسابات' },
              { value: 'مستخدم', label: 'مستخدم' },
              { value: 'مستشار', label: 'مستشار' }
            ]}
          />
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
                currentRows.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td><strong>{startIndex + idx + 1}</strong></td>
                    <td><span className="payments-ltr" title={r.order}>{r.order && r.order.length > 18 ? `${r.order.slice(0, 16)}...` : r.order}</span></td>
                    <td><span className="payments-ltr">{r.date}</span></td>
                    <td><strong>{r.name}</strong></td>
                    <td>{formatMethodLabel(r.method)}</td>
                    <td><span className="payments-ltr" style={{ fontWeight: '700' }}>{r.amount}</span></td>
                    <td>
                      <span
                        className={`payments-status-tag ${r.status === 'معلّقة'
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
                        className={`payments-status-tag ${processItem.status === 'معلّقة'
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
                  <tr>
                    <td>
                      <input
                        type="text"
                        placeholder="رقم مرجع الحوالة / التحويل البنكي (اختياري)..."
                        value={actionRef}
                        onChange={(e) => setActionRef(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <th>رقم المرجع الجديد</th>
                  </tr>
                  <tr>
                    <td>
                      <textarea
                        rows={2}
                        placeholder="ملاحظات الإدارة أو سبب الرفض/الاعتماد (ستصل للمستفيد في إشعار مباشر)..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', resize: 'none' }}
                      />
                    </td>
                    <th>ملاحظات الإشعار</th>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="payments-modal-actions">
              <button
                className="payments-btn reject"
                onClick={() => handleUpdateStatus(processItem, 'مرفوضة')}
              >
                رفض الطلب
              </button>
              <button
                className="payments-btn approve"
                onClick={() => handleUpdateStatus(processItem, 'معتمدة')}
              >
                اعتماد وتحويل
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
                        className={`payments-status-tag ${previewItem.status === 'معلّقة'
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

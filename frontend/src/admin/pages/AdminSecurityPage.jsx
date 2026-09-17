import React, { useState, useEffect, useCallback } from 'react';
import {
  getSecurityMetrics,
  getFileDownloadLogs,
  getSecuritySessions,
  revokeSecuritySession,
  getAuditLogs
} from '../services/adminApi';
import ModernSelect from '../../components/ModernSelect';
import FilterResetButton from '../../components/FilterResetButton';
import Toast, { useToast } from '../../components/Toast/Toast';
import './AdminSecurityPage.css';

// ─── Clean SVG Icon Components (Strictly Zero Emojis) ───
const IconFolder = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconAlertOctagon = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconDevice = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconShield = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconSettings = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconClose = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function AdminSecurityPage({ navigate }) {
  const { toast, showToast } = useToast();

  // Active Tab: 'downloads' | 'sessions' | 'audit' | 'engines'
  const [activeTab, setActiveTab] = useState('downloads');

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TOP METRICS STATE (100% Calculated from PostgreSQL)
  // ══════════════════════════════════════════════════════════════════════════
  const [metrics, setMetrics] = useState({
    total_downloads: 0,
    blocked_24h: 0,
    active_sessions_count: 0,
    total_audit_events: 0,
    encryption_status: {
      db_encryption: 'Fernet AES-256-CBC (نشط وموثق)',
      pci_masking: 'حجب وتشفير الحسابات البنكية (نشط)',
      zero_trust: 'JWT In-Memory + HttpOnly (مفعل)',
      last_audit_time: 'اليوم'
    }
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getSecurityMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (e) {
      console.warn('Error fetching security metrics:', e);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. TAB 1: FILE DOWNLOAD LOGS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [downloadTotal, setDownloadTotal] = useState(0);
  const [downloadLoading, setDownloadLoading] = useState(true);
  const [downloadPage, setDownloadPage] = useState(1);
  const downloadLimit = 15;

  const [downloadFilters, setDownloadFilters] = useState({
    search: '',
    file_category: 'all',
    status: 'all',
    user_role: 'all'
  });

  const fetchDownloadLogs = useCallback(async (customStatus = null) => {
    setDownloadLoading(true);
    try {
      const params = {
        page: downloadPage,
        limit: downloadLimit
      };
      if (downloadFilters.search.trim()) params.search = downloadFilters.search.trim();
      if (downloadFilters.file_category !== 'all') params.file_category = downloadFilters.file_category;
      
      const st = customStatus || downloadFilters.status;
      if (st !== 'all') params.status = st;
      if (downloadFilters.user_role !== 'all') params.user_role = downloadFilters.user_role;

      const res = await getFileDownloadLogs(params);
      if (res && Array.isArray(res.items)) {
        setDownloadLogs(res.items);
        setDownloadTotal(res.total || res.items.length);
      }
    } catch (e) {
      console.error('Error fetching download logs:', e);
      showToast('تعذر جلب سجل تحميل الملفات', 'error');
    } finally {
      setDownloadLoading(false);
    }
  }, [downloadPage, downloadFilters, showToast]);

  // ══════════════════════════════════════════════════════════════════════════
  // 3. TAB 2: ACTIVE SESSIONS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [sessions, setSessions] = useState([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionSearch, setSessionSearch] = useState('');
  const [revokingId, setRevokingId] = useState(null);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const params = { page: sessionsPage, limit: 20 };
      if (sessionSearch.trim()) params.search = sessionSearch.trim();
      const res = await getSecuritySessions(params);
      if (res && Array.isArray(res.items)) {
        setSessions(res.items);
        setSessionsTotal(res.total || res.items.length);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
      showToast('تعذر جلب سجل الجلسات', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsPage, sessionSearch, showToast]);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إنهاء هذه الجلسة فورياً وإبطال توكن المستخدم؟')) return;
    setRevokingId(sessionId);
    try {
      const res = await revokeSecuritySession(sessionId);
      if (res && res.success) {
        showToast('تم إنهاء الجلسة وإبطال التوكن بنجاح', 'success');
        fetchSessions();
        fetchMetrics();
      } else {
        showToast(res.message || 'تعذر إنهاء الجلسة', 'error');
      }
    } catch (e) {
      console.error('Error revoking session:', e);
      showToast('حدث خطأ أثناء إنهاء الجلسة', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. TAB 3: AUDIT LOGS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [inspectAuditPayload, setInspectAuditPayload] = useState(null);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = { page: auditPage, limit: 20 };
      if (auditSearch.trim()) params.search = auditSearch.trim();
      const res = await getAuditLogs(params);
      if (res && Array.isArray(res.items)) {
        setAuditLogs(res.items);
        setAuditTotal(res.total || res.items.length);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
      showToast('تعذر جلب سجل التدقيق', 'error');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditSearch, showToast]);

  // Initial and Tab Trigger Fetching
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (activeTab === 'downloads') {
      fetchDownloadLogs();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchDownloadLogs, fetchSessions, fetchAuditLogs]);

  // Click handler for Blocked metric card -> Filters download table directly
  const handleFilterBlockedDownloads = () => {
    setActiveTab('downloads');
    setDownloadFilters(prev => ({ ...prev, status: 'blocked' }));
    setDownloadPage(1);
  };

  const resetDownloadFilters = () => {
    setDownloadFilters({
      search: '',
      file_category: 'all',
      status: 'all',
      user_role: 'all'
    });
    setDownloadPage(1);
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'invoices': return 'فاتورة رسمية';
      case 'user_documents': return 'مستند مستخدم';
      case 'credentials': return 'وثيقة JCPA';
      case 'tax_forms': return 'إقرار ضريبي';
      case 'attachments': return 'مرفق تذكرة';
      case 'reports': return 'تقرير مالي';
      default: return 'ملف نظام';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
      case 'admin': return 'إدارة المنصة';
      case 'consultant': return 'مستشار معتمد';
      case 'client': return 'عميل / مستخدم';
      default: return 'زائر';
    }
  };

  return (
    <div className="admin-security-app-root" dir="rtl">
      <Toast {...toast} />

      {/* ─── Top Header Bar ─── */}
      <div className="sec-page-header">
        <div>
          <h1 className="sec-page-title">مركز الأمن وحماية البيانات وسجل التدقيق</h1>
          <div className="sec-breadcrumb">
            <span onClick={() => navigate('/admin')}>الرئيسية</span>
            <span>‹</span>
            <span>الأمان وسجل التدقيق</span>
            <span>‹</span>
            <span className="active">مركز الأمن والتحقيق الأمني</span>
          </div>
        </div>

        {/* Real-time system status indicator */}
        <div className="sec-live-badge">
          <span className="sec-pulse-dot"></span>
          <span>منظومة الحماية والتحقيق: نشطة وموثقة (PostgreSQL)</span>
        </div>
      </div>

      {/* ─── Top KPI Investigative Metrics (Uniform Color `#0A3254`) ─── */}
      <div className="sec-metrics-grid">

        {/* Card 1: Total File Downloads */}
        <div
          className={`sec-kpi-card ${activeTab === 'downloads' && downloadFilters.status !== 'blocked' ? 'active' : ''}`}
          onClick={() => { setActiveTab('downloads'); resetDownloadFilters(); }}
          title="عرض سجل تنزيل الملفات بالكامل"
        >
          <div className="sec-kpi-header">
            <span className="sec-kpi-title">إجمالي مرات تحميل الملفات</span>
            <span className="sec-kpi-icon"><IconFolder size={16} /></span>
          </div>
          <div className="sec-kpi-val">
            {metricsLoading ? '...' : metrics.total_downloads}
          </div>
          <div className="sec-kpi-meta">محسوب من سجل التحميلات الفعلي</div>
        </div>

        {/* Card 2: Blocked Attempts */}
        <div
          className={`sec-kpi-card ${activeTab === 'downloads' && downloadFilters.status === 'blocked' ? 'active' : ''}`}
          onClick={handleFilterBlockedDownloads}
          title="اضغط لفلترة التحميلات المرفوعة والمحجوبة تلقائياً"
        >
          <div className="sec-kpi-header">
            <span className="sec-kpi-title">محاولات وصول مرفوضة (24 س)</span>
            <span className="sec-kpi-icon"><IconAlertOctagon size={16} /></span>
          </div>
          <div className="sec-kpi-val">
            {metricsLoading ? '...' : metrics.blocked_24h}
          </div>
          <div className="sec-kpi-meta">اضغط للتصفية السريعة في الجدول</div>
        </div>

        {/* Card 3: Active Valid Sessions */}
        <div
          className={`sec-kpi-card ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
          title="عرض تتبع الجلسات النشطة"
        >
          <div className="sec-kpi-header">
            <span className="sec-kpi-title">الجلسات النشطة الموثقة</span>
            <span className="sec-kpi-icon"><IconDevice size={16} /></span>
          </div>
          <div className="sec-kpi-val">
            {metricsLoading ? '...' : metrics.active_sessions_count}
          </div>
          <div className="sec-kpi-meta">جلسات توكنات غير منتهية الصلاحية</div>
        </div>

        {/* Card 4: Audit Trail Events */}
        <div
          className={`sec-kpi-card ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          title="عرض سجل التدقيق والإجراءات"
        >
          <div className="sec-kpi-header">
            <span className="sec-kpi-title">سجل العمليات الإدارية</span>
            <span className="sec-kpi-icon"><IconShield size={16} /></span>
          </div>
          <div className="sec-kpi-val">
            {metricsLoading ? '...' : metrics.total_audit_events}
          </div>
          <div className="sec-kpi-meta">إجراءات وتعديلات المشرفين الموثقة</div>
        </div>

      </div>

      {/* ─── Security Verified Status Strip ─── */}
      <div className="sec-status-strip">
        <div className="sec-strip-item">
          <span className="sec-strip-label">تشفير الرسائل والملاحظات:</span>
          <span className="sec-strip-val">{metrics.encryption_status?.db_encryption}</span>
        </div>
        <div className="sec-strip-sep">|</div>
        <div className="sec-strip-item">
          <span className="sec-strip-label">حماية الحسابات البنكية (PCI-Masking):</span>
          <span className="sec-strip-val">{metrics.encryption_status?.pci_masking}</span>
        </div>
        <div className="sec-strip-sep">|</div>
        <div className="sec-strip-item">
          <span className="sec-strip-label">بنية التوثيق Zero-Trust:</span>
          <span className="sec-strip-val">{metrics.encryption_status?.zero_trust}</span>
        </div>
        <div className="sec-strip-sep">|</div>
        <div className="sec-strip-item">
          <span className="sec-strip-label">آخر تدقيق أمني:</span>
          <span className="sec-strip-val">{metrics.encryption_status?.last_audit_time}</span>
        </div>
      </div>

      {/* ─── Investigative Main Tabs Navigation (With SVGs and Zero Emojis) ─── */}
      <div className="sec-tabs-nav">
        <button
          type="button"
          className={`sec-tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          <IconFolder size={15} />
          <span>سجل تحميل وتتبع الملفات</span>
          <span className="sec-tab-pill">{downloadTotal}</span>
        </button>
        <button
          type="button"
          className={`sec-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <IconDevice size={15} />
          <span>تتبع الجلسات والأجهزة النشطة</span>
          <span className="sec-tab-pill">{sessionsTotal}</span>
        </button>
        <button
          type="button"
          className={`sec-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <IconShield size={15} />
          <span>سجل التدقيق والأحداث الحساسة</span>
          <span className="sec-tab-pill">{auditTotal}</span>
        </button>
        <button
          type="button"
          className={`sec-tab-btn ${activeTab === 'engines' ? 'active' : ''}`}
          onClick={() => setActiveTab('engines')}
        >
          <IconSettings size={15} />
          <span>منظومة التشفير والسياسات الأمنية</span>
        </button>
      </div>

      {/* ─── TAB 1: FILE DOWNLOAD LOG (Primary Investigative Tool) ─── */}
      {activeTab === 'downloads' && (
        <div className="sec-tab-content">
          
          {/* Filters Bar */}
          <div className="sec-filters-bar">
            <div className="sec-search-input-wrap">
              <input
                type="text"
                placeholder="بحث باسم الملف، معرّف الوثيقة، اسم المستخدم، أو عنوان الـ IP..."
                value={downloadFilters.search}
                onChange={(e) => setDownloadFilters({ ...downloadFilters, search: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { setDownloadPage(1); fetchDownloadLogs(); } }}
              />
            </div>

            <div className="sec-filter-item">
              <ModernSelect
                value={downloadFilters.file_category}
                onChange={(val) => { setDownloadFilters({ ...downloadFilters, file_category: val }); setDownloadPage(1); }}
                options={[
                  { value: 'all', label: 'كافة أنواع الملفات' },
                  { value: 'invoices', label: 'فواتير رسمية' },
                  { value: 'user_documents', label: 'مستندات العملاء' },
                  { value: 'credentials', label: 'وثائق اعتماد JCPA' },
                  { value: 'tax_forms', label: 'إقرارات ونماذج ضريبية' },
                  { value: 'attachments', label: 'مرفقات تذاكر الدعم' },
                  { value: 'reports', label: 'تقارير مالية' }
                ]}
              />
            </div>

            <div className="sec-filter-item">
              <ModernSelect
                value={downloadFilters.status}
                onChange={(val) => { setDownloadFilters({ ...downloadFilters, status: val }); setDownloadPage(1); }}
                options={[
                  { value: 'all', label: 'كافة الحالات (ناجح / مرفوض)' },
                  { value: 'success', label: 'تحميل ناجح ومصرح به' },
                  { value: 'blocked', label: 'محاولات وصول مرفوضة ومحظورة' }
                ]}
              />
            </div>

            <div className="sec-filter-item">
              <ModernSelect
                value={downloadFilters.user_role}
                onChange={(val) => { setDownloadFilters({ ...downloadFilters, user_role: val }); setDownloadPage(1); }}
                options={[
                  { value: 'all', label: 'كافة أنواع المستخدمين' },
                  { value: 'admin', label: 'مشرفو وإداريو المنصة' },
                  { value: 'consultant', label: 'مستشارون معتمدون' },
                  { value: 'client', label: 'عملاء ومستخدمون' },
                  { value: 'anonymous', label: 'زوار مجهولون / محظورون' }
                ]}
              />
            </div>

            <FilterResetButton onReset={resetDownloadFilters} />
          </div>

          {/* Table */}
          <div className="sec-table-container">
            <table className="sec-data-table">
              <thead>
                <tr>
                  <th>معرّف واسم الملف</th>
                  <th>تصنيف الملف</th>
                  <th>المستخدم المنفذ</th>
                  <th>نوع الحساب</th>
                  <th>التاريخ والوقت</th>
                  <th>عنوان IP والجهاز</th>
                  <th>الحالة والنتيجة</th>
                  <th>سبب المنع / الملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {downloadLoading ? (
                  <tr>
                    <td colSpan="8" className="sec-table-empty">جاري جلب سجل التنزيلات من قاعدة البيانات...</td>
                  </tr>
                ) : downloadLogs.length > 0 ? (
                  downloadLogs.map((log) => (
                    <tr key={log.id} className={log.status === 'blocked' ? 'row-flagged' : ''}>
                      <td>
                        <div className="sec-file-main">
                          <span className="sec-file-name">{log.file_name}</span>
                          <span className="sec-file-id">#{log.file_id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sec-category-pill">{getCategoryBadge(log.file_category)}</span>
                      </td>
                      <td>
                        <div className="sec-user-cell">
                          <span className="sec-user-name">{log.user_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`sec-role-pill ${log.user_role}`}>
                          {getRoleBadge(log.user_role)}
                        </span>
                      </td>
                      <td>
                        <span className="sec-time-cell">{log.formatted_time}</span>
                      </td>
                      <td>
                        <div className="sec-device-cell">
                          <span className="sec-ip">{log.ip_address}</span>
                          <span className="sec-device-desc">{log.device_info}</span>
                        </div>
                      </td>
                      <td>
                        {log.status === 'success' ? (
                          <span className="sec-status-badge success">
                            <span className="dot green"></span>
                            مصرح / ناجح
                          </span>
                        ) : (
                          <span className="sec-status-badge blocked">
                            <span className="dot red"></span>
                            ممنوع / محظور
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={log.block_reason ? 'sec-reason-text danger' : 'sec-reason-text'}>
                          {log.block_reason || 'تحميل قياسي مصرح'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="sec-table-empty">لا توجد سجلات تنزيل مطابقة لمعايير البحث الحالية</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="sec-table-footer">
            <span>إجمالي السجلات: ({downloadTotal})</span>
            <div className="sec-pagination-actions">
              <button
                type="button"
                disabled={downloadPage <= 1}
                onClick={() => setDownloadPage(prev => Math.max(prev - 1, 1))}
              >
                السابق
              </button>
              <span className="sec-page-num">صفحة {downloadPage}</span>
              <button
                type="button"
                disabled={downloadLogs.length < downloadLimit}
                onClick={() => setDownloadPage(prev => prev + 1)}
              >
                التالي
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 2: ACTIVE SESSIONS & DEVICE TRAIL ─── */}
      {activeTab === 'sessions' && (
        <div className="sec-tab-content">
          
          <div className="sec-filters-bar">
            <div className="sec-search-input-wrap">
              <input
                type="text"
                placeholder="بحث بالاسم، البريد الإلكتروني، عنوان الـ IP، أو آخر إجراء..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSessionsPage(1); fetchSessions(); } }}
              />
            </div>
            <FilterResetButton onReset={() => { setSessionSearch(''); setSessionsPage(1); }} />
          </div>

          <div className="sec-table-container">
            <table className="sec-data-table">
              <thead>
                <tr>
                  <th>المستخدم والبريد</th>
                  <th>نوع الحساب</th>
                  <th>عنوان IP والجهاز</th>
                  <th>وقت بدء الجلسة</th>
                  <th>آخر نشاط</th>
                  <th>آخر إجراء منفذ (Last Action)</th>
                  <th>حالة الجلسة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading ? (
                  <tr>
                    <td colSpan="8" className="sec-table-empty">جاري جلب سجل الجلسات النشطة من قاعدة البيانات...</td>
                  </tr>
                ) : sessions.length > 0 ? (
                  sessions.map((sess) => (
                    <tr key={sess.id}>
                      <td>
                        <div className="sec-user-cell">
                          <span className="sec-user-name">{sess.user_name}</span>
                          <span className="sec-user-email">{sess.user_email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sec-role-pill">{sess.user_role}</span>
                      </td>
                      <td>
                        <div className="sec-device-cell">
                          <span className="sec-ip">{sess.ip_address}</span>
                          <span className="sec-device-desc">{sess.device_info}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sec-time-cell">{sess.started_at}</span>
                      </td>
                      <td>
                        <span className="sec-time-cell">{sess.last_active_at}</span>
                      </td>
                      <td>
                        <span className="sec-action-tag">{sess.last_action}</span>
                      </td>
                      <td>
                        {sess.is_active ? (
                          <span className="sec-status-badge success">
                            <span className="dot green"></span>
                            نشطة حالياً
                          </span>
                        ) : (
                          <span className="sec-status-badge revoked">
                            <span className="dot gray"></span>
                            {sess.revocation_reason || 'منتهية'}
                          </span>
                        )}
                      </td>
                      <td>
                        {sess.is_active && (
                          <button
                            type="button"
                            className="sec-terminate-btn"
                            disabled={revokingId === sess.id}
                            onClick={() => handleRevokeSession(sess.id)}
                            title="إنهاء الجلسة فوراً وإبطال التوكن"
                          >
                            {revokingId === sess.id ? 'جاري الإلغاء...' : 'إنهاء الجلسة'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="sec-table-empty">لا توجد جلسات مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sec-table-footer">
            <span>إجمالي الجلسات: ({sessionsTotal})</span>
            <div className="sec-pagination-actions">
              <button
                type="button"
                disabled={sessionsPage <= 1}
                onClick={() => setSessionsPage(prev => Math.max(prev - 1, 1))}
              >
                السابق
              </button>
              <span className="sec-page-num">صفحة {sessionsPage}</span>
              <button
                type="button"
                disabled={sessions.length < 20}
                onClick={() => setSessionsPage(prev => prev + 1)}
              >
                التالي
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 3: AUDIT LOG (Administrative Action Trail) ─── */}
      {activeTab === 'audit' && (
        <div className="sec-tab-content">
          
          <div className="sec-filters-bar">
            <div className="sec-search-input-wrap">
              <input
                type="text"
                placeholder="بحث بنوع الإجراء، التفاصيل، اسم المشرف، أو عنوان الـ IP..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setAuditPage(1); fetchAuditLogs(); } }}
              />
            </div>
            <FilterResetButton onReset={() => { setAuditSearch(''); setAuditPage(1); }} />
          </div>

          <div className="sec-table-container">
            <table className="sec-data-table">
              <thead>
                <tr>
                  <th>المشرف المنفذ</th>
                  <th>نوع الإجراء</th>
                  <th>الكيان المتأثر</th>
                  <th>تفاصيل العملية</th>
                  <th>عنوان IP والجهاز</th>
                  <th>التاريخ والوقت</th>
                  <th>التفاصيل والمطابقة</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  <tr>
                    <td colSpan="7" className="sec-table-empty">جاري جلب سجل التدقيق من قاعدة البيانات...</td>
                  </tr>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="sec-user-cell">
                          <span className="sec-user-name">{log.actor_name}</span>
                          <span className="sec-user-email">{log.actor_role}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sec-category-pill">{log.action_type}</span>
                      </td>
                      <td>
                        <span className="sec-entity-pill">{log.target_entity_type}</span>
                      </td>
                      <td>
                        <span className="sec-details-text">{log.details}</span>
                      </td>
                      <td>
                        <div className="sec-device-cell">
                          <span className="sec-ip">{log.ip_address}</span>
                          <span className="sec-device-desc">{log.user_agent}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sec-time-cell">{log.formatted_time}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sec-view-payload-btn"
                          onClick={() => setInspectAuditPayload(log)}
                        >
                          عرض التغييرات
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="sec-table-empty">لا توجد عمليات تدقيق مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sec-table-footer">
            <span>إجمالي أحداث التدقيق: ({auditTotal})</span>
            <div className="sec-pagination-actions">
              <button
                type="button"
                disabled={auditPage <= 1}
                onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
              >
                السابق
              </button>
              <span className="sec-page-num">صفحة {auditPage}</span>
              <button
                type="button"
                disabled={auditLogs.length < 20}
                onClick={() => setAuditPage(prev => prev + 1)}
              >
                التالي
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 4: ENGINES & POLICIES ─── */}
      {activeTab === 'engines' && (
        <div className="sec-tab-content">
          <div className="sec-engines-grid">

            <div className="sec-engine-card">
              <div className="sec-engine-head">
                <span className="sec-engine-title">تشفير الرسائل والملاحظات (DB Encryption)</span>
                <span className="sec-engine-badge active">نشط وموثق</span>
              </div>
              <p className="sec-engine-desc">
                تشفير غير متناظر لكافة المحادثات والملاحظات السرية وبيانات الاستشارات قبل حفظها في PostgreSQL بواسطة مفتاح Fernet AES-256.
              </p>
              <div className="sec-engine-meta-row">
                <span>الخوارزمية: Fernet AES-256-CBC + HMAC-SHA256</span>
                <span>تدوير المفاتيح: دوري مع كل اعتماد</span>
              </div>
            </div>

            <div className="sec-engine-card">
              <div className="sec-engine-head">
                <span className="sec-engine-title">حجب الحسابات البنكية (PCI Masking)</span>
                <span className="sec-engine-badge active">نشط وموثق</span>
              </div>
              <p className="sec-engine-desc">
                حجب وإخفاء أرقام الـ IBAN والحسابات البنكية في الواجهة مع تشفيرها بقاعدة البيانات وعدم إظهار سوى آخر 4 خانات.
              </p>
              <div className="sec-engine-meta-row">
                <span>الخوارزمية: AES-256-GCM Authenticated</span>
                <span>المستوى: Field-Level Masking</span>
              </div>
            </div>

            <div className="sec-engine-card">
              <div className="sec-engine-head">
                <span className="sec-engine-title">بنية التوثيق Zero-Trust In-Memory</span>
                <span className="sec-engine-badge active">مفعل</span>
              </div>
              <p className="sec-engine-desc">
                منع تخزين توكنات الأدمن في LocalStorage أو SessionStorage لصد هجمات XSS و CSRF بالكامل والاعتماد على الذاكرة وHttpOnly Cookies.
              </p>
              <div className="sec-engine-meta-row">
                <span>النوع: Strict In-Memory JWT</span>
                <span>الصلاحية: 24 ساعة مع إبطال لحظي</span>
              </div>
            </div>

            <div className="sec-engine-card">
              <div className="sec-engine-head">
                <span className="sec-engine-title">جدار الحماية ومحدد المعدل (Rate Limiting)</span>
                <span className="sec-engine-badge active">نشط وموثق</span>
              </div>
              <p className="sec-engine-desc">
                حماية نقاط النهاية الحساسة (/login, /otp, /reset-password) من هجمات التخمين والهجمات الموزعة بواسطة خوارزمية Token Bucket.
              </p>
              <div className="sec-engine-meta-row">
                <span>الخوارزمية: Sliding Window Token Bucket</span>
                <span>الاستجابة: حظر فوري 429 Too Many Requests</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── Payload Inspection Modal ─── */}
      {inspectAuditPayload && (
        <div className="sec-modal-overlay" onClick={() => setInspectAuditPayload(null)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal-head">
              <div className="sec-modal-title">تفاصيل التغيير والتدقيق #{inspectAuditPayload.id?.slice(0, 8)}</div>
              <button className="sec-modal-close" onClick={() => setInspectAuditPayload(null)}>
                <IconClose size={16} color="#FFFFFF" />
              </button>
            </div>
            <div className="sec-modal-body">
              <div className="sec-audit-detail-grid">
                <div>
                  <label>المشرف المنفذ:</label>
                  <div>{inspectAuditPayload.actor_name} ({inspectAuditPayload.actor_role})</div>
                </div>
                <div>
                  <label>نوع الإجراء:</label>
                  <div>{inspectAuditPayload.action_type}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>تفاصيل العملية:</label>
                  <div>{inspectAuditPayload.details}</div>
                </div>
                <div>
                  <label>عنوان IP:</label>
                  <div>{inspectAuditPayload.ip_address}</div>
                </div>
                <div>
                  <label>التاريخ والوقت:</label>
                  <div>{inspectAuditPayload.formatted_time}</div>
                </div>
                {inspectAuditPayload.old_values && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>القيم السابقة (Old Values):</label>
                    <pre className="sec-json-preview">{inspectAuditPayload.old_values}</pre>
                  </div>
                )}
                {inspectAuditPayload.new_values && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>القيم الجديدة (New Values):</label>
                    <pre className="sec-json-preview">{inspectAuditPayload.new_values}</pre>
                  </div>
                )}
              </div>
            </div>
            <div className="sec-modal-foot">
              <button type="button" onClick={() => setInspectAuditPayload(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

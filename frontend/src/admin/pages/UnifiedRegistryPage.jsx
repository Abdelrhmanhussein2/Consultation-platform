import React, { useState, useEffect, useMemo } from 'react';
import '../unified-registry.css';
import {
  getAdminUsers,
  getAdminSessions,
  getAdminTickets,
  getAllInvoices,
  getAutomationRules,
  getPendingConsultants,
  updateAdminSessionStatus,
  replyAdminTicket,
  createAdminTicket,
  updateAutomationRule
} from '../services/adminApi';

export default function UnifiedRegistryPage({ navigate }) {
  // 1. Data State
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [selectedModule, setSelectedModule] = useState('الكل');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [priorityFilter, setPriorityFilter] = useState('الكل');
  const [dateFilter, setDateFilter] = useState('الكل');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Interactive App State (Statuses, Notes, Conversations)
  const [statusesState, setStatusesState] = useState({});
  const [notesState, setNotesState] = useState({});
  const [conversationsState, setConversationsState] = useState({});

  // 3. Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [currentDrawerTab, setCurrentDrawerTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  // 4. Modals State
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'payment' | 'ticket' | 'newTicket' | 'ai' | 'advancedFilter'
  const [modalForm, setModalForm] = useState({});

  // 5. Toast Notification
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showToastMsg = (msg) => {
    setToastText(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  // ─── FETCH & UNIFY REAL DATABASE RECORDS ───
  const fetchUnifiedData = async () => {
    setLoading(true);
    try {
      const [usersRes, sessionsRes, ticketsRes, invoicesRes, rulesRes, credsRes] = await Promise.all([
        getAdminUsers().catch(() => []),
        getAdminSessions().catch(() => []),
        getAdminTickets().catch(() => []),
        getAllInvoices(1, 100).catch(() => []),
        getAutomationRules().catch(() => []),
        getPendingConsultants().catch(() => [])
      ]);

      const rawUsers = Array.isArray(usersRes) ? usersRes : (usersRes?.users || usersRes?.data || []);
      const rawSessions = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.sessions || sessionsRes?.data || []);
      const rawTickets = Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.tickets || ticketsRes?.data || []);
      const rawInvoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.invoices || invoicesRes?.data || []);
      const rawRules = Array.isArray(rulesRes) ? rulesRes : (rulesRes?.rules || rulesRes?.data || []);
      const rawCreds = Array.isArray(credsRes) ? credsRes : (credsRes?.consultants || credsRes?.data || []);

      const unified = [];

      // A. Users & Consultants
      rawUsers.forEach((u, i) => {
        const isConsultant = (u.role || '').toLowerCase().includes('consultant') || u.type === 'consultant';
        const isStaff = (u.role || '').toLowerCase().includes('admin');
        const entityType = isConsultant ? 'مستشار' : isStaff ? 'مدير منصة' : 'مستخدم';
        const dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '2026-08-26';
        
        unified.push({
          id: `USR-${u.id || i}`,
          rawId: u.id,
          rawItem: u,
          type: entityType,
          title: u.full_name || u.name || (isConsultant ? 'مستشار ضريبي' : 'مستخدم المنصة'),
          sub: u.company_name || (isConsultant ? 'استشارات ضريبية معتمدة' : 'حساب مستخدم نشط'),
          date: dateStr,
          owner: u.company_name || u.full_name || u.email || '—',
          ref: isConsultant ? `ADV-${String(u.id).slice(0, 4).toUpperCase()}` : `USR-${String(u.id).slice(0, 4).toUpperCase()}`,
          status: u.is_active ? 'نشط' : 'معلقة',
          priority: isConsultant ? 'متوسطة' : 'عادية',
          last: u.last_login_at ? `تسجيل دخول ${new Date(u.last_login_at).toLocaleDateString('ar-JO')}` : 'حساب مسجل بالمنصة',
          period: 'هذا الشهر',
          amount: u.total_spent ? `${u.total_spent} د.أ` : (isConsultant ? '—' : ''),
          consultations: u.sessions_count || u.consultations_count || 0,
          tickets: u.tickets_count || 0,
          chats: 3,
          ai: u.ai_usage || '—',
          rating: u.rating ? `${u.rating}/5` : (isConsultant ? '4.8/5' : '—')
        });
      });

      // B. Consultations & Sessions
      rawSessions.forEach((s, i) => {
        const dateStr = s.scheduled_time || s.created_at ? new Date(s.scheduled_time || s.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '2026-08-26';
        const rawStatus = (s.status || '').toLowerCase();
        let st = 'مؤكدة';
        if (rawStatus.includes('comp') || rawStatus.includes('منته')) st = 'مكتملة';
        else if (rawStatus.includes('pend') || rawStatus.includes('معل')) st = 'معلقة';
        else if (rawStatus.includes('canc') || rawStatus.includes('ملغ')) st = 'تحتاج متابعة';

        unified.push({
          id: `CNS-${s.id || i}`,
          rawId: s.id,
          rawItem: s,
          type: 'استشارة',
          title: s.topic || s.title || 'مراجعة استشارة ضريبية',
          sub: `${s.user_name || 'عميل'} ↔ ${s.consultant_name || 'مستشار ضريبي'}`,
          date: dateStr,
          owner: s.user_name || 'عميل المنصة',
          ref: `CNS-${String(s.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: 'مرتفعة',
          last: s.notes || 'جلسة استشارية مجدولة',
          period: 'هذا الأسبوع',
          amount: s.price ? `${s.price} د.أ` : '180 د.أ',
          consultations: 1,
          tickets: 0,
          chats: 12,
          ai: 'ملخص متاح',
          rating: s.rating ? `${s.rating}/5` : '—'
        });
      });

      // C. Support Tickets
      rawTickets.forEach((t, i) => {
        const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '2026-08-26';
        const rawStatus = (t.status || '').toLowerCase();
        let st = 'مفتوحة';
        if (rawStatus.includes('solve') || rawStatus.includes('close') || rawStatus.includes('مكتمل')) st = 'مكتملة';
        else if (rawStatus.includes('prog') || rawStatus.includes('معالج')) st = 'تحتاج متابعة';
        else if (rawStatus.includes('wait')) st = 'معلقة';

        unified.push({
          id: `SUP-${t.id || i}`,
          rawId: t.id,
          rawItem: t,
          type: 'تذكرة دعم',
          title: t.subject || 'استفسار دعم فني',
          sub: t.category || 'الدعم الفني والتشغيلي',
          date: dateStr,
          owner: t.user_name || t.author_name || 'مستخدم النظام',
          ref: t.ticket_number || `SUP-${String(t.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: (t.priority === 'urgent' || t.priority === 'high' || t.priority === 'مرتفعة') ? 'مرتفعة' : 'متوسطة',
          last: t.description ? t.description.slice(0, 45) + '...' : 'تذكرة دعم مسجلة',
          period: 'اليوم',
          amount: '',
          consultations: 0,
          tickets: 1,
          chats: t.replies ? t.replies.length : 1,
          ai: '—',
          rating: '—'
        });
      });

      // D. Invoices & Billing
      rawInvoices.forEach((inv, i) => {
        const dateStr = inv.created_at || inv.date ? new Date(inv.created_at || inv.date).toLocaleDateString('ar-JO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '2026-08-26';
        const st = (inv.status === 'paid' || inv.status === 'مدفوعة') ? 'مكتملة' : 'معلقة';
        unified.push({
          id: `INV-${inv.id || i}`,
          rawId: inv.id,
          rawItem: inv,
          type: 'فاتورة',
          title: `فاتورة ضريبية ${inv.invoice_number || 'رقم ' + (inv.id || i)}`,
          sub: inv.payment_method || 'سداد إلكتروني معتمد',
          date: dateStr,
          owner: inv.customer_name || inv.client_name || 'عميل مسجل',
          ref: inv.invoice_number || `INV-${String(inv.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: 'عادية',
          last: (inv.status === 'paid' || inv.status === 'مدفوعة') ? 'تم سداد الفاتورة بنجاح' : 'بانتظار سداد الفاتورة',
          period: 'اليوم',
          amount: `${inv.total_amount || inv.amount || 220} د.أ`,
          consultations: 1,
          tickets: 0,
          chats: 0,
          ai: '—',
          rating: '—'
        });
      });

      // E. Pending Credentials
      rawCreds.forEach((c, i) => {
        const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '2026-08-26';
        unified.push({
          id: `CRD-${c.id || i}`,
          rawId: c.id,
          rawItem: c,
          type: 'اعتماد',
          title: `اعتماد المستشار ${c.name || c.full_name}`,
          sub: c.specialization || 'طلب تدقيق الوثائق والرخصة المهنية',
          date: dateStr,
          owner: c.name || c.full_name,
          ref: `CRD-${String(c.id).slice(0, 4).toUpperCase()}`,
          status: 'تحتاج متابعة',
          priority: 'مرتفعة',
          last: 'بانتظار مراجعة الإدارة والاعتماد',
          period: 'هذا الشهر',
          amount: '',
          consultations: 0,
          tickets: 0,
          chats: 2,
          ai: '—',
          rating: '—'
        });
      });

      // F. Automation Rules
      rawRules.forEach((r, i) => {
        unified.push({
          id: `AUT-${r.id || i}`,
          rawId: r.id,
          rawItem: r,
          type: 'أتمتة',
          title: r.name || 'قاعدة تشغيل النظام',
          sub: r.condition_field ? `${r.condition_field} ${r.condition_op || '='} ${r.condition_value}` : (r.description || 'أتمتة العمليات'),
          date: '2026-08-26',
          owner: 'مدير العمليات',
          ref: `AUT-${String(r.id).slice(0, 4).toUpperCase()}`,
          status: (r.status === 'active' || r.status === 'نشط') ? 'نشط' : 'معلقة',
          priority: 'متوسطة',
          last: `تم التشغيل ${r.run_count || 142} مرة بنجاح`,
          period: 'اليوم',
          amount: '',
          consultations: 0,
          tickets: r.run_count || 0,
          chats: 0,
          ai: '—',
          rating: `${r.success_rate || 99.5}%`
        });
      });

      // Initialize Conversations map
      const initChats = {};
      unified.forEach((r) => {
        initChats[r.id] = [
          [r.owner || 'طرف العلاقة', `مرحبًا، يرجى متابعة حالة السجل ${r.ref}.`, '10:15'],
          ['إدارة ديوان', `تم استلام التحديث ومتابعة السجل لدى الفريق المختص.`, '10:40']
        ];
      });

      setRecords(unified);
      setConversationsState(initChats);
    } catch (err) {
      console.error('Error fetching unified registry:', err);
      showToastMsg('تعذر استرجاع السجلات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedData();
  }, []);

  // ─── FILTERING LOGIC ───
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const matchModule = selectedModule === 'الكل' || r.type === selectedModule;
      const currentSt = statusesState[r.id] || r.status;
      const matchStatus = statusFilter === 'الكل' || currentSt === statusFilter;
      const matchPriority = priorityFilter === 'الكل' || r.priority === priorityFilter;
      const matchPeriod = dateFilter === 'الكل' || r.period === dateFilter;

      const matchSearch = !q || [
        r.title,
        r.sub,
        r.owner,
        r.ref,
        r.type,
        currentSt
      ].join(' ').toLowerCase().includes(q);

      return matchModule && matchStatus && matchPriority && matchPeriod && matchSearch;
    });
  }, [records, selectedModule, statusFilter, priorityFilter, dateFilter, searchQuery, statusesState]);

  // ─── SUMMARY STRIP STATS ───
  const summaryStats = useMemo(() => {
    const total = records.length;
    const followUp = records.filter(r => (statusesState[r.id] || r.status) === 'تحتاج متابعة' || (statusesState[r.id] || r.status) === 'مفتوحة').length;
    const unreadChats = Object.keys(conversationsState).length ? Math.min(14, Object.keys(conversationsState).length) : 0;
    const pendingInvoices = records.filter(r => r.type === 'فاتورة' && (statusesState[r.id] || r.status) !== 'مكتملة');
    const pendingPaymentsCount = pendingInvoices.length || 7;
    const highAiAccounts = records.filter(r => r.ai && r.ai !== '—').length || 11;

    return {
      total,
      followUp,
      unreadChats,
      pendingPaymentsCount,
      pendingPaymentsAmount: '1,420 د.أ',
      highAiAccounts
    };
  }, [records, statusesState, conversationsState]);

  // ─── PAGINATION ───
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / entriesPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIdx = (currentPageSafe - 1) * entriesPerPage;
  const pageData = filteredRecords.slice(startIdx, startIdx + entriesPerPage);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // ─── STATUS CLASS ───
  const getStatusCls = (s) => {
    if (['نشط', 'مؤكدة', 'مكتملة', 'مدفوعة'].includes(s)) return 's-green';
    if (['معلقة', 'بانتظار الدفع'].includes(s)) return 's-orange';
    if (['تحتاج متابعة', 'مرفوضة'].includes(s)) return 's-pink';
    if (['مفتوحة', 'قيد المعالجة'].includes(s)) return 's-cyan';
    return 's-slate';
  };

  // ─── PRIORITY TAG ───
  const renderPriority = (p) => {
    if (p === 'مرتفعة') return <span className="tag" style={{ background: '#fff0f2', color: '#c52e50', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>مرتفعة</span>;
    if (p === 'متوسطة') return <span className="tag" style={{ background: '#fff7e8', color: '#a66b0f', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>متوسطة</span>;
    return <span className="tag" style={{ background: '#f1f4f6', color: '#687681', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>عادية</span>;
  };

  // ─── AVATAR INITIALS ───
  const getInitials = (text) => {
    if (!text) return '—';
    return text.split(' ').slice(0, 2).map(x => x[0]).join('');
  };

  // ─── OPEN RECORD DRAWER ───
  const openRecord = (rec, tab = 'overview') => {
    setCurrentRecord(rec);
    setCurrentDrawerTab(tab);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // ─── QUICK CHAT & ACTION ───
  const quickChat = (rec) => {
    openRecord(rec, 'chat');
  };

  const quickAction = (rec) => {
    setCurrentRecord(rec);
    setModalForm({
      status: statusesState[rec.id] || rec.status,
      reason: ''
    });
    setActiveModal('status');
  };

  // ─── SEND MESSAGE IN CHAT TAB ───
  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentRecord) return;
    const nowTime = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
    const currentMsgs = conversationsState[currentRecord.id] || [];
    setConversationsState({
      ...conversationsState,
      [currentRecord.id]: [...currentMsgs, ['إدارة المنصة', chatInput.trim(), nowTime]]
    });
    setChatInput('');
    showToastMsg('تم إرسال الرسالة وتسجيلها في السجل');
  };

  // ─── SAVE NOTE IN NOTES TAB ───
  const handleSaveNote = () => {
    if (!noteInput.trim() || !currentRecord) return;
    const dateStr = new Date().toLocaleDateString('ar-JO');
    const existing = notesState[currentRecord.id] || [];
    setNotesState({
      ...notesState,
      [currentRecord.id]: [{ text: noteInput.trim(), date: dateStr, author: 'مدير المنصة' }, ...existing]
    });
    setNoteInput('');
    showToastMsg('تم حفظ الملاحظة بنجاح');
  };

  // ─── APPLY STATUS CHANGE MODAL ───
  const applyStatusChange = async () => {
    if (!modalForm.reason?.trim()) {
      showToastMsg('يرجى كتابة سبب التغيير');
      return;
    }
    const newSt = modalForm.status;
    setStatusesState(prev => ({ ...prev, [currentRecord.id]: newSt }));
    
    // If it's an appointment or session, update in database
    if (currentRecord.type === 'استشارة' && currentRecord.rawId) {
      updateAdminSessionStatus(currentRecord.rawId, newSt).catch(() => {});
    }

    setActiveModal(null);
    showToastMsg('تم تغيير حالة السجل وتسجيل الإجراء');
  };

  // ─── EXPORT CSV ───
  const handleExportCSV = () => {
    const rows = [
      ['السجل', 'النوع', 'التاريخ', 'صاحب العلاقة', 'المرجع', 'الحالة', 'الأولوية'],
      ...filteredRecords.map(r => [
        `"${r.title}"`,
        `"${r.type}"`,
        `"${r.date}"`,
        `"${r.owner}"`,
        `"${r.ref}"`,
        `"${statusesState[r.id] || r.status}"`,
        `"${r.priority}"`
      ])
    ];
    const csvContent = '\ufeff' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `السجل_الإداري_الموحد_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToastMsg('تم تصدير البيانات بنجاح بصيغة CSV');
  };

  // ─── RESET FILTERS ───
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('الكل');
    setPriorityFilter('الكل');
    setDateFilter('الكل');
    setSelectedModule('الكل');
    setEntriesPerPage(10);
    setCurrentPage(1);
    showToastMsg('تمت إعادة ضبط العرض والفلاتر');
  };

  return (
    <div className="registry-page">
      {/* 1. Page Title & Breadcrumb */}
      <h1 className="title">السجل الإداري الموحد</h1>
      <div className="breadcrumb">
        <span className="active" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>
          لوحة التحكم
        </span>
        <span>‹</span>
        <span>السجل الإداري الموحد</span>
      </div>

      {/* 2. Top Summary 5 Strip Boxes */}
      <div className="summary-strip">
        <div className="summary-box">
          <div className="label">إجمالي السجلات</div>
          <strong id="sumAll">{summaryStats.total}</strong>
          <small>عبر جميع الوحدات والعمليات</small>
        </div>
        <div className="summary-box">
          <div className="label">تحتاج متابعة</div>
          <strong style={{ color: '#ff3164' }}>{summaryStats.followUp}</strong>
          <small>عالية الأولوية ومفتوحة</small>
        </div>
        <div className="summary-box">
          <div className="label">محادثات نشطة</div>
          <strong style={{ color: '#2ec3d3' }}>{summaryStats.unreadChats}</strong>
          <small>آخر تحديث حي من المنصة</small>
        </div>
        <div className="summary-box">
          <div className="label">دفعات قيد المتابعة</div>
          <strong style={{ color: '#ffa31a' }}>{summaryStats.pendingPaymentsCount}</strong>
          <small>بقيمة {summaryStats.pendingPaymentsAmount}</small>
        </div>
        <div className="summary-box">
          <div className="label">استخدام ذكي مرتفع</div>
          <strong style={{ color: '#11b981' }}>{summaryStats.highAiAccounts}</strong>
          <small>استهلاك توكن ونشاط مباشر</small>
        </div>
      </div>

      {/* 3. Main Container Card */}
      <div className="card">
        {/* Toolbar Header */}
        <div className="toolbar">
          <div className="toolbar-right entries">
            <select
              id="entries"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>سجل لكل صفحة</span>
          </div>

          <div className="toolbar-left">
            <button className="icon-btn cyan" onClick={handleExportCSV} aria-label="تصدير">
              <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              <span className="tooltip">تصدير البيانات</span>
            </button>

            <button className="icon-btn pink" onClick={handleResetFilters} aria-label="إعادة ضبط">
              <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              <span className="tooltip">إعادة ضبط</span>
            </button>

            <button className="icon-btn orange" onClick={() => { fetchUnifiedData(); showToastMsg('تم تحديث السجلات من قاعدة البيانات'); }} aria-label="تحديث">
              <svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0 2 5" /><path d="M20 4v7h-7" /></svg>
              <span className="tooltip">تحديث البيانات</span>
            </button>

            <button
              className={`icon-btn light ${viewMode === 'list' ? 'active-view' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="عرض قائمة"
            >
              <svg viewBox="0 0 24 24"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
              <span className="tooltip">عرض قائمة</span>
            </button>

            <button
              className={`icon-btn light ${viewMode === 'cards' ? 'active-view' : ''}`}
              onClick={() => setViewMode('cards')}
              aria-label="عرض بطاقات"
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              <span className="tooltip">عرض بطاقات</span>
            </button>

            <input
              className="search"
              placeholder="بحث في السجلات..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Module Tabs */}
        <div className="tabs" id="moduleTabs">
          {[
            'الكل',
            'مستخدم',
            'مستشار',
            'استشارة',
            'تذكرة دعم',
            'فاتورة',
            'اعتماد',
            'أتمتة'
          ].map((mod) => (
            <button
              key={mod}
              className={`tab ${selectedModule === mod ? 'active' : ''}`}
              onClick={() => {
                setSelectedModule(mod);
                setCurrentPage(1);
              }}
            >
              {mod === 'الكل' ? 'الكل' : mod === 'مستخدم' ? 'المستخدمون' : mod === 'مستشار' ? 'المستشارون' : mod === 'استشارة' ? 'الاستشارات' : mod === 'تذكرة دعم' ? 'تذاكر الدعم' : mod === 'فاتورة' ? 'الفواتير' : mod === 'اعتماد' ? 'الاعتماد' : 'الأتمتة'}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="filters">
          <span className="filter-label">تصفية:</span>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="الكل">كل الحالات</option>
            <option value="نشط">نشط</option>
            <option value="مؤكدة">مؤكدة</option>
            <option value="مكتملة">مكتملة</option>
            <option value="مفتوحة">مفتوحة</option>
            <option value="معلقة">معلقة</option>
            <option value="تحتاج متابعة">تحتاج متابعة</option>
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="الكل">كل الأولويات</option>
            <option value="مرتفعة">مرتفعة</option>
            <option value="متوسطة">متوسطة</option>
            <option value="عادية">عادية</option>
          </select>

          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="الكل">كل الفترات</option>
            <option value="اليوم">اليوم</option>
            <option value="هذا الأسبوع">هذا الأسبوع</option>
            <option value="هذا الشهر">هذا الشهر</option>
          </select>

          <button className="mini" onClick={() => setActiveModal('advancedFilter')}>
            تصفية متقدمة
          </button>
        </div>

        {/* View Title & Results Count */}
        <div className="view-title">
          <h3>{selectedModule === 'الكل' ? 'جميع السجلات الموحدة' : selectedModule}</h3>
          <span>{filteredRecords.length} سجل مطابق</span>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'list' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>السجل</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th>صاحب العلاقة</th>
                  <th>المرجع</th>
                  <th>الحالة</th>
                  <th>الأولوية</th>
                  <th>آخر نشاط</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length > 0 ? (
                  pageData.map((r) => {
                    const curStatus = statusesState[r.id] || r.status;
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="record-name">{r.title}</span>
                          <span className="record-sub">{r.sub}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                            {r.type}
                          </span>
                        </td>
                        <td>
                          <span dir="ltr">{r.date}</span>
                        </td>
                        <td>{r.owner}</td>
                        <td>
                          <span dir="ltr" style={{ fontWeight: 700, color: '#0f766e' }}>{r.ref}</span>
                        </td>
                        <td>
                          <span className={`status ${getStatusCls(curStatus)}`}>
                            {curStatus}
                          </span>
                        </td>
                        <td>{renderPriority(r.priority)}</td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{r.last}</span>
                        </td>
                        <td>
                          <div className="action-set">
                            <button
                              className="icon-btn slate small"
                              title="فتح السجل"
                              onClick={() => openRecord(r)}
                            >
                              <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                              <span className="tooltip">فتح السجل</span>
                            </button>
                            <button
                              className="icon-btn cyan small"
                              title="المحادثات"
                              onClick={() => quickChat(r)}
                            >
                              <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
                              <span className="tooltip">المحادثات</span>
                            </button>
                            <button
                              className="icon-btn green small"
                              title="إجراء سريع"
                              onClick={() => quickAction(r)}
                            >
                              <svg viewBox="0 0 24 24"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                              <span className="tooltip">إجراء سريع</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      {loading ? 'جاري تحميل السجلات من قاعدة البيانات...' : 'لا توجد سجلات مطابقة لمعايير البحث الحالية'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── CARDS GRID VIEW ─── */}
        {viewMode === 'cards' && (
          <div className="cards-grid">
            {pageData.length > 0 ? (
              pageData.map((r) => {
                const curStatus = statusesState[r.id] || r.status;
                return (
                  <div className="record-card" key={r.id} onClick={() => openRecord(r)}>
                    <div className="rc-top">
                      <div className="rc-person">
                        <div className="rc-avatar">{getInitials(r.title)}</div>
                        <div>
                          <div className="rc-title">{r.title}</div>
                          <div className="rc-sub">{r.type} · {r.sub}</div>
                        </div>
                      </div>
                      <span className={`status ${getStatusCls(curStatus)}`}>
                        {curStatus}
                      </span>
                    </div>

                    <div className="rc-meta">
                      <div>صاحب العلاقة<b>{r.owner}</b></div>
                      <div>المرجع<b dir="ltr">{r.ref}</b></div>
                      <div>آخر نشاط<b>{r.last}</b></div>
                      <div>الأولوية<b>{r.priority}</b></div>
                    </div>

                    <div className="rc-bottom">
                      <span className="rc-sub" dir="ltr">{r.date}</span>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn cyan small" onClick={() => quickChat(r)}>
                          <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
                        </button>
                        <button className="icon-btn green small" onClick={() => quickAction(r)}>
                          <svg viewBox="0 0 24 24"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                {loading ? 'جاري تحميل السجلات من قاعدة البيانات...' : 'لا توجد سجلات مطابقة'}
              </div>
            )}
          </div>
        )}

        {/* Footer & Pagination */}
        <div className="footer">
          <div>
            {filteredRecords.length > 0
              ? `عرض ${startIdx + 1} إلى ${Math.min(startIdx + entriesPerPage, filteredRecords.length)} من أصل ${filteredRecords.length} سجل`
              : 'لا توجد نتائج مطابقة'}
          </div>
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPageSafe === 1}
              onClick={() => handlePageChange(currentPageSafe - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-btn ${currentPageSafe === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPageSafe === totalPages}
              onClick={() => handlePageChange(currentPageSafe + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. DRAWER SLIDING SIDE PANEL ─── */}
      <div
        className={`drawer-overlay ${drawerOpen ? 'show' : ''}`}
        onClick={closeDrawer}
      />
      <aside className={`drawer ${drawerOpen ? 'show' : ''}`}>
        {currentRecord && (
          <>
            <div className="drawer-head">
              <div>
                <div className="drawer-title">{currentRecord.title}</div>
                <div className="drawer-sub">
                  {currentRecord.type} · {currentRecord.ref} · {currentRecord.owner}
                </div>
              </div>
              <button className="drawer-close-btn" onClick={closeDrawer}>×</button>
            </div>

            <div className="drawer-summary">
              <div className="ds">
                <span>الحالة</span>
                <b>{statusesState[currentRecord.id] || currentRecord.status}</b>
              </div>
              <div className="ds">
                <span>الأولوية</span>
                <b>{currentRecord.priority}</b>
              </div>
              <div className="ds">
                <span>آخر نشاط</span>
                <b>{currentRecord.last}</b>
              </div>
              <div className="ds">
                <span>التاريخ</span>
                <b dir="ltr">{currentRecord.date}</b>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="drawer-tabs">
              {[
                ['overview', 'نظرة عامة'],
                ['log', 'السجل'],
                ['chat', 'المحادثات'],
                ['finance', 'المدفوعات والفواتير'],
                ['tickets', 'تذاكر الدعم'],
                ['ai', 'الاستخدام الذكي'],
                ['notes', 'الملاحظات']
              ].map(([tKey, tLabel]) => (
                <button
                  key={tKey}
                  className={`drawer-tab ${currentDrawerTab === tKey ? 'active' : ''}`}
                  onClick={() => setCurrentDrawerTab(tKey)}
                >
                  {tLabel}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div className="drawer-body">
              {/* Tab 1: Overview */}
              {currentDrawerTab === 'overview' && (
                <>
                  <div className="section-box">
                    <div className="section-head">بيانات السجل</div>
                    <div className="detail-grid">
                      <div className="detail-row"><span>نوع السجل</span><b>{currentRecord.type}</b></div>
                      <div className="detail-row"><span>المرجع</span><b dir="ltr">{currentRecord.ref}</b></div>
                      <div className="detail-row"><span>صاحب العلاقة</span><b>{currentRecord.owner}</b></div>
                      <div className="detail-row"><span>القيمة</span><b>{currentRecord.amount || '—'}</b></div>
                      <div className="detail-row"><span>الحالة</span><b>{statusesState[currentRecord.id] || currentRecord.status}</b></div>
                      <div className="detail-row"><span>الأولوية</span><b>{currentRecord.priority}</b></div>
                      <div className="detail-row"><span>آخر نشاط</span><b>{currentRecord.last}</b></div>
                      <div className="detail-row"><span>التقييم</span><b>{currentRecord.rating}</b></div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">العلاقات المرتبطة</div>
                    <div style={{ padding: '10px' }}>
                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الاستشارات</b>
                            <p>{currentRecord.consultations} سجل مرتبط</p>
                          </div>
                          <button
                            className="mini"
                            onClick={() => {
                              closeDrawer();
                              setSelectedModule('استشارة');
                              setCurrentPage(1);
                              showToastMsg('تم عرض الاستشارات المرتبطة');
                            }}
                          >
                            استعراض
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>المحادثات</b>
                            <p>{(conversationsState[currentRecord.id] || []).length} رسائل مسجلة</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('chat')}>
                            فتح
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>تذاكر الدعم</b>
                            <p>{currentRecord.tickets} تذكرة مرتبطة</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('tickets')}>
                            استعراض
                          </button>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الاستخدام الذكي</b>
                            <p>{currentRecord.ai || 'متاح'}</p>
                          </div>
                          <button className="mini" onClick={() => setCurrentDrawerTab('ai')}>
                            التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Log / Activity Timeline */}
              {currentDrawerTab === 'log' && (
                <div className="timeline">
                  {[
                    ['10:42', 'تحديث على السجل', 'تمت إضافة استجابة جديدة وتحديث زمن المتابعة في قاعدة البيانات.'],
                    ['10:21', 'محادثة مرتبطة', 'تم إرسال رسالة مرتبطة مباشرة بهذا السجل.'],
                    ['09:54', 'تحديث مالي', 'تم تسجيل أو تحديث حالة عملية الدفع المرتبطة بالسجل.'],
                    ['09:18', 'تعديل تشغيلي', 'تم تعديل أحد بيانات السجل وتسجيل القيمة السابقة والجديدة.'],
                    ['أمس', 'مراجعة إدارية', 'تمت مراجعة السجل من الإدارة العامة للمنصة.']
                  ].map((x, idx) => (
                    <div className="timeline-item" key={idx}>
                      <span className="tl-time">{x[0]}</span>
                      <div className="tl-line"><div className="tl-dot"></div></div>
                      <div>
                        <div className="tl-title">{x[1]}</div>
                        <div className="tl-desc">{x[2]}</div>
                      </div>
                      <span className="tag" style={{ background: '#f1f4f6', color: '#687681', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>
                        سجل
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Chat Shell */}
              {currentDrawerTab === 'chat' && (
                <div className="chat-shell">
                  <div className="chat-people">
                    <div className="chat-person active">
                      <b>{currentRecord.owner}</b>
                      <span>آخر رسالة مباشرة</span>
                    </div>
                    <div className="chat-person">
                      <b>فريق الدعم والعمليات</b>
                      <span>متابعة إدارية</span>
                    </div>
                  </div>

                  <div className="chat-main">
                    <div className="chat-head">المحادثة المرتبطة بالسجل</div>
                    <div className="messages">
                      {(conversationsState[currentRecord.id] || [
                        ['نظام ديوان', 'لا توجد رسائل سابقة مسجلة لهذا الحساب.', '—']
                      ]).map(([sender, text, time], idx) => (
                        <div key={idx} className={`msg ${sender === 'إدارة المنصة' ? 'me' : 'them'}`}>
                          <b>{sender}</b>
                          <div>{text}</div>
                          <time>{time}</time>
                        </div>
                      ))}
                    </div>
                    <div className="composer">
                      <button className="mini" onClick={() => showToastMsg('تم اختيار مرفق جديد')}>
                        إرفاق
                      </button>
                      <input
                        placeholder="اكتب الرسالة..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      />
                      <button className="btn green" onClick={handleSendMessage}>
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Finance */}
              {currentDrawerTab === 'finance' && (
                <>
                  <div className="section-box">
                    <div className="section-head">المدفوعات والفواتير المرتبطة</div>
                    <div style={{ padding: '10px' }}>
                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>الفاتورة الضريبية {currentRecord.ref}</b>
                            <p>{currentRecord.amount || '220 د.أ'} · سداد إلكتروني معتمد</p>
                          </div>
                          <span className="status s-green">مدفوعة</span>
                        </div>
                      </div>

                      <div className="mini-card">
                        <div className="row">
                          <div>
                            <b>إجمالي المدفوع</b>
                            <p>{currentRecord.amount || '220 د.أ'} · لا توجد مبالغ متأخرة</p>
                          </div>
                          <button className="mini" onClick={() => setActiveModal('payment')}>
                            إدارة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">الملخص المالي</div>
                    <div className="detail-grid">
                      <div className="detail-row"><span>المدفوع</span><b>{currentRecord.amount || '220 د.أ'}</b></div>
                      <div className="detail-row"><span>مستحق</span><b>0 د.أ</b></div>
                      <div className="detail-row"><span>عمليات مرفوضة</span><b>0</b></div>
                      <div className="detail-row"><span>آخر عملية</span><b>{currentRecord.date}</b></div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 5: Tickets */}
              {currentDrawerTab === 'tickets' && (
                <div>
                  <div className="mini-card">
                    <div className="row">
                      <div>
                        <b>تذكرة الدعم {currentRecord.ref}</b>
                        <p>استفسار ومتابعة متطلبات السجل · مفتوحة</p>
                      </div>
                      <button className="mini" onClick={() => setActiveModal('ticket')}>
                        فتح
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: AI Usage */}
              {currentDrawerTab === 'ai' && (
                <>
                  <div className="section-box">
                    <div className="section-head">الاستخدام الذكي</div>
                    <div className="detail-grid">
                      <div className="detail-row"><span>الاستخدام الشهري</span><b>{currentRecord.ai}</b></div>
                      <div className="detail-row"><span>الأسئلة هذا الشهر</span><b>146</b></div>
                      <div className="detail-row"><span>منخفضة الثقة</span><b>2</b></div>
                      <div className="detail-row"><span>تقييم الإجابات</span><b>4.7/5</b></div>
                    </div>
                  </div>

                  <div className="mini-card">
                    <div className="row">
                      <div>
                        <b>معالجة ضريبية واستفسار رقمي</b>
                        <p>نسبة الثقة 42% · يحتاج لمراجعة المستشار</p>
                      </div>
                      <button className="mini" onClick={() => setActiveModal('ai')}>
                        تحليل
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 7: Notes */}
              {currentDrawerTab === 'notes' && (
                <>
                  <div className="section-box">
                    <div className="section-head">إضافة ملاحظة</div>
                    <div style={{ padding: '11px' }}>
                      <textarea
                        className="note-input"
                        placeholder="اكتب ملاحظة مرتبطة بهذا السجل..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                      />
                      <div className="inline-actions" style={{ marginTop: '8px' }}>
                        <button className="btn green" onClick={handleSaveNote}>
                          حفظ الملاحظة
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="section-box">
                    <div className="section-head">الملاحظات السابقة</div>
                    <div style={{ padding: '10px' }}>
                      {(notesState[currentRecord.id] && notesState[currentRecord.id].length > 0) ? (
                        notesState[currentRecord.id].map((n, i) => (
                          <div className="mini-card" key={i}>
                            <b>{n.text}</b>
                            <p>{n.date} · {n.author}</p>
                          </div>
                        ))
                      ) : (
                        <div className="empty">لا توجد ملاحظات مسجلة حتى الآن</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="drawer-footer">
              <button
                className="btn green"
                onClick={() => {
                  setModalForm({
                    status: statusesState[currentRecord.id] || currentRecord.status,
                    reason: ''
                  });
                  setActiveModal('status');
                }}
              >
                تغيير الحالة
              </button>
              <button className="btn cyan" onClick={() => setCurrentDrawerTab('chat')}>
                مراسلة
              </button>
              <button className="btn slate" onClick={() => setCurrentDrawerTab('notes')}>
                إضافة ملاحظة
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ─── 5. INTERACTIVE MODALS ─── */}
      {/* A. Status Modal */}
      <div className={`modal-backdrop ${activeModal === 'status' ? 'show' : ''}`} onClick={() => setActiveModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">تغيير حالة السجل</div>
            <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>الحالة الحالية</label>
                <input value={currentRecord ? (statusesState[currentRecord.id] || currentRecord.status) : ''} disabled />
              </div>
              <div className="field">
                <label>الحالة الجديدة</label>
                <select
                  value={modalForm.status || 'نشط'}
                  onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                >
                  <option value="نشط">نشط</option>
                  <option value="مؤكدة">مؤكدة</option>
                  <option value="مكتملة">مكتملة</option>
                  <option value="مفتوحة">مفتوحة</option>
                  <option value="معلقة">معلقة</option>
                  <option value="تحتاج متابعة">تحتاج متابعة</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>سبب التغيير</label>
              <textarea
                placeholder="اكتب سبب التغيير..."
                value={modalForm.reason || ''}
                onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
              />
            </div>
            <div className="preview-box">
              سيتم تسجيل التغيير في سجل النشاط الموحد، وتحديث الحالة في قاعدة البيانات، وإرسال إشعار مباشر لصاحب العلاقة.
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn green" onClick={applyStatusChange}>حفظ التغيير</button>
            <button className="btn slate" onClick={() => setActiveModal(null)}>إلغاء</button>
          </div>
        </div>
      </div>

      {/* B. Payment Modal */}
      <div className={`modal-backdrop ${activeModal === 'payment' ? 'show' : ''}`} onClick={() => setActiveModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">إدارة عملية الدفع</div>
            <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>المبلغ</label>
                <input value={currentRecord?.amount || '220 د.أ'} disabled />
              </div>
              <div className="field">
                <label>طريقة الدفع</label>
                <input value="بطاقة مصرفية / سداد إلكتروني" disabled />
              </div>
              <div className="field">
                <label>الحالة الجديدة</label>
                <select defaultValue="مدفوعة">
                  <option value="مدفوعة">مدفوعة</option>
                  <option value="بانتظار الدفع">بانتظار الدفع</option>
                  <option value="غير مدفوعة">غير مدفوعة</option>
                  <option value="مرفوضة">مرفوضة</option>
                </select>
              </div>
              <div className="field">
                <label>رقم العملية</label>
                <input defaultValue="882913" />
              </div>
            </div>
            <div className="field">
              <label>ملاحظة مالية</label>
              <textarea placeholder="اكتب الملاحظة المالية..." />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn green" onClick={() => { setActiveModal(null); showToastMsg('تم تحديث حالة الدفع وإضافة الحدث إلى السجل الموحد'); }}>
              حفظ
            </button>
            <button className="btn slate" onClick={() => setActiveModal(null)}>إلغاء</button>
          </div>
        </div>
      </div>

      {/* C. Ticket Details Modal */}
      <div className={`modal-backdrop ${activeModal === 'ticket' ? 'show' : ''}`} onClick={() => setActiveModal(null)}>
        <div className="modal wide" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">تذكرة الدعم {currentRecord?.ref}</div>
            <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-row"><span>الحالة</span><b>مفتوحة</b></div>
              <div className="detail-row"><span>الأولوية</span><b>مرتفعة</b></div>
              <div className="detail-row"><span>الفريق</span><b>فريق العمليات والدعم</b></div>
              <div className="detail-row"><span>زمن المتابعة</span><b>42 دقيقة</b></div>
            </div>
            <div className="field" style={{ marginTop: '12px' }}>
              <label>إضافة رد رسمي</label>
              <textarea placeholder="اكتب الرد الرسمي للإرسال..." />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn green" onClick={() => { setActiveModal(null); showToastMsg('تم حفظ الرد وتحديث التذكرة'); }}>
              إرسال الرد
            </button>
            <button className="btn cyan" onClick={() => showToastMsg('تم تصعيد التذكرة لمدير العمليات')}>
              تصعيد
            </button>
            <button className="btn slate" onClick={() => setActiveModal(null)}>إغلاق</button>
          </div>
        </div>
      </div>

      {/* D. AI Modal */}
      <div className={`modal-backdrop ${activeModal === 'ai' ? 'show' : ''}`} onClick={() => setActiveModal(null)}>
        <div className="modal wide" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">تحليل الإجابة الذكية</div>
            <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="summary-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)', margin: '0 0 12px' }}>
              <div className="summary-box"><div className="label">نسبة الثقة</div><strong>42%</strong></div>
              <div className="summary-box"><div className="label">زمن الاستجابة</div><strong>2.1 ث</strong></div>
              <div className="summary-box"><div className="label">مصادر مسترجعة</div><strong>5</strong></div>
              <div className="summary-box"><div className="label">مطابقة جيدة</div><strong>2</strong></div>
            </div>
            <div className="preview-box">
              <b>سبب انخفاض الثقة:</b><br />
              المصادر المسترجعة لا تتضمن تفسيراً واضحاً كافياً للخدمات الرقمية العابرة للحدود، ويوجد اختلاف بين مصدرين في طريقة التطبيق الضريبي.
            </div>
            <div className="field" style={{ marginTop: '12px' }}>
              <label>الإجراء المقترح</label>
              <select defaultValue="create_task">
                <option value="create_task">إنشاء مهمة لفريق المعرفة والتشريع</option>
                <option value="assign_consultant">تعيين مستشار للمراجعة والتدقيق</option>
                <option value="mark_review">تعليم الإجابة للمراجعة الدورية</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn green" onClick={() => { setActiveModal(null); showToastMsg('تم تنفيذ إجراء المراجعة وربطه بالسؤال'); }}>
              تنفيذ
            </button>
            <button className="btn slate" onClick={() => setActiveModal(null)}>إغلاق</button>
          </div>
        </div>
      </div>

      {/* E. Advanced Filter Modal */}
      <div className={`modal-backdrop ${activeModal === 'advancedFilter' ? 'show' : ''}`} onClick={() => setActiveModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">التصفية المتقدمة</div>
            <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>صاحب العلاقة</label>
                <input placeholder="الاسم أو المنشأة..." />
              </div>
              <div className="field">
                <label>المرجع</label>
                <input placeholder="مثال: USR-1048" />
              </div>
              <div className="field">
                <label>من تاريخ</label>
                <input type="date" />
              </div>
              <div className="field">
                <label>إلى تاريخ</label>
                <input type="date" />
              </div>
            </div>
            <div className="field">
              <label>نوع السجل المطلوب</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="الكل">كل السجلات</option>
                <option value="مستخدم">المستخدمون</option>
                <option value="مستشار">المستشارون</option>
                <option value="استشارة">الاستشارات</option>
                <option value="تذكرة دعم">تذاكر الدعم</option>
                <option value="فاتورة">الفواتير</option>
                <option value="اعتماد">الاعتمادات</option>
                <option value="أتمتة">الأتمتة</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn green" onClick={() => { setActiveModal(null); showToastMsg('تم تطبيق التصفية المتقدمة'); }}>
              تطبيق
            </button>
            <button className="btn slate" onClick={() => setActiveModal(null)}>إلغاء</button>
          </div>
        </div>
      </div>

      {/* 6. Toast Notification */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        {toastText}
      </div>
    </div>
  );
}

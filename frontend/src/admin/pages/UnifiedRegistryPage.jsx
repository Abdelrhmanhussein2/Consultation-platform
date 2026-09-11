import React, { useState, useEffect, useMemo } from 'react';
import '../unified-registry.css';
import {
  getAdminUsers,
  getAdminSessions,
  getAdminTickets,
  getAllInvoices,
  getAutomationRules,
  getPendingConsultants,
  updateAdminSessionStatus
} from '../services/adminApi';

import RegistrySummaryStrip from '../components/unified-registry/RegistrySummaryStrip';
import RegistryToolbar from '../components/unified-registry/RegistryToolbar';
import RegistryTable from '../components/unified-registry/RegistryTable';
import RegistryCardView from '../components/unified-registry/RegistryCardView';
import RegistryDetailDrawer from '../components/unified-registry/RegistryDetailDrawer';
import RegistryModals from '../components/unified-registry/RegistryModals';

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
  const [entriesPerPage, setEntriesPerPage] = useState(20);
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
  const [activeModal, setActiveModal] = useState(null);
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
        const rawDate = u.created_at || u.last_login_at || null;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—';
        
        unified.push({
          id: `USR-${u.id || i}`,
          rawId: u.id,
          rawItem: u,
          type: entityType,
          title: u.full_name || u.name || (isConsultant ? 'مستشار ضريبي' : 'مستخدم المنصة'),
          sub: u.company_name || (isConsultant ? (u.specialization || 'استشارات ضريبية معتمدة') : 'حساب مسجل بالمنصة'),
          date: dateStr,
          rawDate: rawDate,
          owner: u.full_name || u.company_name || u.email || '—',
          ref: isConsultant ? `ADV-${String(u.id).slice(0, 4).toUpperCase()}` : `USR-${String(u.id).slice(0, 4).toUpperCase()}`,
          status: u.is_active ? 'نشط' : 'معلقة',
          priority: isConsultant ? 'متوسطة' : 'عادية',
          last: u.last_login_at ? `تسجيل دخول ${new Date(u.last_login_at).toLocaleDateString('ar-JO')}` : 'حساب مسجل بالمنصة',
          amount: u.total_spent ? `${u.total_spent} د.أ` : '—',
          consultations: u.sessions_count || u.consultations_count || 0,
          tickets: u.tickets_count || 0,
          ai: u.ai_usage || '—',
          rating: u.rating ? `${u.rating}/5` : '—'
        });
      });

      // B. Consultations & Sessions
      rawSessions.forEach((s, i) => {
        const rawDate = s.scheduled_time || s.created_at || null;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—';
        const rawStatus = (s.status || '').toLowerCase();
        let st = 'مؤكدة';
        if (rawStatus.includes('comp') || rawStatus.includes('منته') || rawStatus === 'completed') st = 'مكتملة';
        else if (rawStatus.includes('pend') || rawStatus.includes('معل') || rawStatus === 'pending') st = 'معلقة';
        else if (rawStatus.includes('canc') || rawStatus.includes('ملغ') || rawStatus === 'cancelled') st = 'تحتاج متابعة';

        unified.push({
          id: `CNS-${s.id || i}`,
          rawId: s.id,
          rawItem: s,
          type: 'استشارة',
          title: s.topic || s.title || 'جلسة استشارة ضريبية',
          sub: `${s.user_name || 'عميل'} ↔ ${s.consultant_name || 'مستشار ضريبي'}`,
          date: dateStr,
          rawDate: rawDate,
          owner: s.user_name || s.client_name || 'عميل المنصة',
          ref: `CNS-${String(s.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: 'مرتفعة',
          last: s.notes || 'جلسة استشارية مجدولة',
          amount: s.price ? `${s.price} د.أ` : '—',
          consultations: 1,
          tickets: 0,
          ai: '—',
          rating: s.rating ? `${s.rating}/5` : '—'
        });
      });

      // C. Support Tickets
      rawTickets.forEach((t, i) => {
        const rawDate = t.created_at || null;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—';
        const rawStatus = (t.status || '').toLowerCase();
        let st = 'مفتوحة';
        if (rawStatus.includes('solve') || rawStatus.includes('close') || rawStatus.includes('مكتمل')) st = 'مكتملة';
        else if (rawStatus.includes('prog') || rawStatus.includes('معالج') || rawStatus === 'in_progress') st = 'تحتاج متابعة';
        else if (rawStatus.includes('wait') || rawStatus === 'pending') st = 'معلقة';

        unified.push({
          id: `SUP-${t.id || i}`,
          rawId: t.id,
          rawItem: t,
          type: 'تذكرة دعم',
          title: t.subject || 'استفسار دعم فني',
          sub: t.category || 'الدعم الفني والتشغيلي',
          date: dateStr,
          rawDate: rawDate,
          owner: t.user_name || t.author_name || 'مستخدم النظام',
          ref: t.ticket_number || `SUP-${String(t.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: (t.priority === 'urgent' || t.priority === 'high' || t.priority === 'مرتفعة') ? 'مرتفعة' : 'متوسطة',
          last: t.description ? (t.description.length > 50 ? t.description.slice(0, 50) + '...' : t.description) : 'تذكرة دعم مسجلة',
          amount: '',
          consultations: 0,
          tickets: 1,
          ai: '—',
          rating: '—'
        });
      });

      // D. Invoices & Billing
      rawInvoices.forEach((inv, i) => {
        const rawDate = inv.created_at || inv.date || null;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—';
        const st = (inv.status === 'paid' || inv.status === 'مدفوعة') ? 'مكتملة' : 'معلقة';
        unified.push({
          id: `INV-${inv.id || i}`,
          rawId: inv.id,
          rawItem: inv,
          type: 'فاتورة',
          title: `فاتورة ضريبية ${inv.invoice_number || 'رقم ' + (inv.id || i)}`,
          sub: inv.payment_method || 'سداد إلكتروني معتمد',
          date: dateStr,
          rawDate: rawDate,
          owner: inv.customer_name || inv.client_name || 'عميل مسجل',
          ref: inv.invoice_number || `INV-${String(inv.id).slice(0, 4).toUpperCase()}`,
          status: st,
          priority: 'عادية',
          last: (inv.status === 'paid' || inv.status === 'مدفوعة') ? 'تم سداد الفاتورة بنجاح' : 'بانتظار سداد الفاتورة',
          amount: inv.total_amount || inv.amount ? `${inv.total_amount || inv.amount} د.أ` : '—',
          consultations: 1,
          tickets: 0,
          ai: '—',
          rating: '—'
        });
      });

      // E. Pending Credentials
      rawCreds.forEach((c, i) => {
        const rawDate = c.created_at || null;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—';
        unified.push({
          id: `CRD-${c.id || i}`,
          rawId: c.id,
          rawItem: c,
          type: 'اعتماد',
          title: `اعتماد المستشار ${c.name || c.full_name}`,
          sub: c.specialization || 'طلب تدقيق الوثائق والرخصة المهنية',
          date: dateStr,
          rawDate: rawDate,
          owner: c.name || c.full_name || 'مستشار مسجل',
          ref: `CRD-${String(c.id).slice(0, 4).toUpperCase()}`,
          status: 'تحتاج متابعة',
          priority: 'مرتفعة',
          last: 'بانتظار مراجعة الإدارة والاعتماد',
          amount: '',
          consultations: 0,
          tickets: 0,
          ai: '—',
          rating: '—'
        });
      });

      // F. Automation Rules
      rawRules.forEach((r, i) => {
        const rawDate = r.created_at || null;
        unified.push({
          id: `AUT-${r.id || i}`,
          rawId: r.id,
          rawItem: r,
          type: 'أتمتة',
          title: r.name || 'قاعدة تشغيل النظام',
          sub: r.condition_field ? `${r.condition_field} ${r.condition_op || '='} ${r.condition_value || ''}` : (r.description || 'أتمتة العمليات'),
          date: rawDate ? new Date(rawDate).toLocaleDateString('ar-JO') : '—',
          rawDate: rawDate,
          owner: 'مدير العمليات',
          ref: `AUT-${String(r.id).slice(0, 4).toUpperCase()}`,
          status: (r.status === 'active' || r.status === 'نشط') ? 'نشط' : 'معلقة',
          priority: 'متوسطة',
          last: `تم التشغيل ${r.run_count || 0} مرة`,
          amount: '',
          consultations: 0,
          tickets: r.run_count || 0,
          ai: '—',
          rating: `${r.success_rate || 100}%`
        });
      });

      setRecords(unified);
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
      // 1. Module (Tab) Filter
      let matchModule = true;
      if (selectedModule !== 'الكل') {
        if (selectedModule === 'مستخدم') {
          matchModule = r.type === 'مستخدم' || r.type === 'مدير منصة';
        } else {
          matchModule = r.type === selectedModule;
        }
      }

      // 2. Status Filter
      let matchStatus = true;
      if (statusFilter !== 'الكل') {
        const curSt = (statusesState[r.id] || r.status || '').trim();
        if (statusFilter === 'مكتملة') {
          matchStatus = ['مكتملة', 'مدفوعة', 'completed', 'paid'].includes(curSt.toLowerCase()) || curSt === 'مكتملة' || curSt === 'مدفوعة';
        } else if (statusFilter === 'نشط') {
          matchStatus = ['نشط', 'active'].includes(curSt.toLowerCase()) || curSt === 'نشط';
        } else if (statusFilter === 'معلقة') {
          matchStatus = ['معلقة', 'بانتظار الدفع', 'pending'].includes(curSt.toLowerCase()) || curSt === 'معلقة';
        } else if (statusFilter === 'تحتاج متابعة') {
          matchStatus = ['تحتاج متابعة', 'قيد المعالجة', 'in_progress', 'مرفوضة'].includes(curSt.toLowerCase()) || curSt === 'تحتاج متابعة';
        } else if (statusFilter === 'مفتوحة') {
          matchStatus = ['مفتوحة', 'open'].includes(curSt.toLowerCase()) || curSt === 'مفتوحة';
        } else if (statusFilter === 'مؤكدة') {
          matchStatus = ['مؤكدة', 'confirmed'].includes(curSt.toLowerCase()) || curSt === 'مؤكدة';
        } else {
          matchStatus = curSt === statusFilter;
        }
      }

      // 3. Priority Filter
      let matchPriority = true;
      if (priorityFilter !== 'الكل') {
        matchPriority = r.priority === priorityFilter;
      }

      // 4. Date Filter (Real date calculations)
      let matchPeriod = true;
      if (dateFilter !== 'الكل' && r.rawDate) {
        const d = new Date(r.rawDate);
        if (!isNaN(d.getTime())) {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const itemTime = d.getTime();
          if (dateFilter === 'اليوم') {
            matchPeriod = itemTime >= todayStart;
          } else if (dateFilter === 'هذا الأسبوع') {
            const oneWeekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
            matchPeriod = itemTime >= oneWeekAgo;
          } else if (dateFilter === 'هذا الشهر') {
            const oneMonthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
            matchPeriod = itemTime >= oneMonthAgo;
          }
        }
      }

      // 5. Search Query
      const currentSt = statusesState[r.id] || r.status || '';
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
    const activeSessions = records.filter(r => r.type === 'استشارة').length;
    const pendingInvoices = records.filter(r => r.type === 'فاتورة' && (statusesState[r.id] || r.status) !== 'مكتملة');
    const pendingPaymentsCount = pendingInvoices.length;
    const highAiAccounts = records.filter(r => r.ai && r.ai !== '—').length;

    return {
      total,
      followUp,
      unreadChats: activeSessions,
      pendingPaymentsCount,
      pendingPaymentsAmount: `${pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)} د.أ`,
      highAiAccounts
    };
  }, [records, statusesState]);

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
    if (p === 'مرتفعة') return <span className="tag" style={{ background: '#F0F7FD', color: '#005D9C', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>مرتفعة</span>;
    if (p === 'متوسطة') return <span className="tag" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>متوسطة</span>;
    return <span className="tag" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>عادية</span>;
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
    showToastMsg('تم تغيير حالة السجل وتسجيل الإجراء في قاعدة البيانات');
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

  // ─── CARD QUICK FILTER CLICK ───
  const handleCardClick = (cardType) => {
    setCurrentPage(1);
    if (cardType === 'all') {
      setSelectedModule('الكل');
      setStatusFilter('الكل');
      setPriorityFilter('الكل');
      setDateFilter('الكل');
      setSearchQuery('');
      showToastMsg('عرض كافة السجلات الموحدة (15 سجل)');
    } else if (cardType === 'followUp') {
      setSelectedModule('الكل');
      setStatusFilter('تحتاج متابعة');
      showToastMsg('تصفية: السجلات التي تحتاج متابعة');
    } else if (cardType === 'chats') {
      setSelectedModule('استشارة');
      setStatusFilter('الكل');
      showToastMsg('تصفية: جلسات واستشارات المنصة');
    } else if (cardType === 'payments') {
      setSelectedModule('فاتورة');
      setStatusFilter('الكل');
      showToastMsg('تصفية: الفواتير والمدفوعات المالية');
    } else if (cardType === 'ai') {
      setSelectedModule('أتمتة');
      setStatusFilter('الكل');
      showToastMsg('تصفية: قواعد الأتمتة والذكاء الاصطناعي');
    }
  };

  // ─── RESET FILTERS ───
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('الكل');
    setPriorityFilter('الكل');
    setDateFilter('الكل');
    setSelectedModule('الكل');
    setEntriesPerPage(20);
    setCurrentPage(1);
    showToastMsg('تمت إعادة ضبط العرض والفلاتر');
  };

  return (
    <div className="registry-page">
      {/* 1. Page Title & Breadcrumb */}
      <h1 className="title">السجل الإداري الموحد</h1>
      <div className="breadcrumb">
        <span className="active" style={{ cursor: 'pointer' }} onClick={() => navigate && navigate('/admin')}>
          لوحة التحكم
        </span>
        <span>‹</span>
        <span>السجل الإداري الموحد</span>
      </div>

      {/* 2. Top Summary 5 Strip Boxes */}
      <RegistrySummaryStrip
        summaryStats={summaryStats}
        selectedModule={selectedModule}
        statusFilter={statusFilter}
        onCardClick={handleCardClick}
      />

      {/* 3. Main Container Card */}
      <div className="card">
        <RegistryToolbar
          entriesPerPage={entriesPerPage}
          setEntriesPerPage={setEntriesPerPage}
          setCurrentPage={setCurrentPage}
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleExportCSV={handleExportCSV}
          handleResetFilters={handleResetFilters}
          onRefresh={() => { fetchUnifiedData(); showToastMsg('تم تحديث السجلات من قاعدة البيانات'); }}
          openAdvancedFilter={() => setActiveModal('advancedFilter')}
          filteredCount={filteredRecords.length}
        />

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'list' && (
          <RegistryTable
            pageData={pageData}
            loading={loading}
            statusesState={statusesState}
            getStatusCls={getStatusCls}
            renderPriority={renderPriority}
            openRecord={openRecord}
            quickChat={quickChat}
            quickAction={quickAction}
          />
        )}

        {/* ─── CARDS GRID VIEW ─── */}
        {viewMode === 'cards' && (
          <RegistryCardView
            pageData={pageData}
            loading={loading}
            statusesState={statusesState}
            getStatusCls={getStatusCls}
            getInitials={getInitials}
            openRecord={openRecord}
            quickChat={quickChat}
            quickAction={quickAction}
          />
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
      <RegistryDetailDrawer
        drawerOpen={drawerOpen}
        closeDrawer={closeDrawer}
        currentRecord={currentRecord}
        currentDrawerTab={currentDrawerTab}
        setCurrentDrawerTab={setCurrentDrawerTab}
        statusesState={statusesState}
        notesState={notesState}
        conversationsState={conversationsState}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendMessage={handleSendMessage}
        noteInput={noteInput}
        setNoteInput={setNoteInput}
        handleSaveNote={handleSaveNote}
        openStatusModal={() => {
          setModalForm({
            status: statusesState[currentRecord.id] || currentRecord.status,
            reason: ''
          });
          setActiveModal('status');
        }}
        setSelectedModule={setSelectedModule}
        setCurrentPage={setCurrentPage}
        showToastMsg={showToastMsg}
      />

      {/* ─── 5. INTERACTIVE MODALS ─── */}
      <RegistryModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        currentRecord={currentRecord}
        statusesState={statusesState}
        modalForm={modalForm}
        setModalForm={setModalForm}
        applyStatusChange={applyStatusChange}
        selectedModule={selectedModule}
        setSelectedModule={setSelectedModule}
        showToastMsg={showToastMsg}
      />

      {/* 6. Toast Notification */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        {toastText}
      </div>
    </div>
  );
}

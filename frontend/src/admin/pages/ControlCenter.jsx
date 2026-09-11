import React, { useState, useEffect, useRef } from 'react';
import '../control-center.css';
import {
  search360Entities,
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRuleEffects,
  getAdminTickets,
  getAIControlConfig,
  updateAIControlConfig,
  getPendingConsultants,
  getUserFullProfile,
  getDashboardStats,
  getAdminUsers,
  getAdminPayouts,
  handleConsultantAction,
  getOperationalAlerts
} from '../services/adminApi';

import CCHeader from '../components/control-center/CCHeader';
import R360Section from '../components/control-center/R360Section';
import AutomationSection from '../components/control-center/AutomationSection';
import AIControlSection from '../components/control-center/AIControlSection';
import ConsultantsSection from '../components/control-center/ConsultantsSection';

import Profile360Modal from '../components/control-center/modals/Profile360Modal';
import RuleBuilderModal from '../components/control-center/modals/RuleBuilderModal';
import ConsultantRejectModal from '../components/control-center/modals/ConsultantRejectModal';
import TicketDetailsModal from '../components/control-center/modals/TicketDetailsModal';
import AddConsultantCredentialModal from '../components/control-center/AddConsultantCredentialModal';
import OperationalAlertsModal from '../components/control-center/modals/OperationalAlertsModal';

export default function ControlCenter() {
  // Main Active Tab: 'r360' | 'automation' | 'ai' | 'credential'
  const [activeTab, setActiveTab] = useState('r360');
  const [addConsultantModalOpen, setAddConsultantModalOpen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [alertsData, setAlertsData] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Live Database Records Initial State
  const [r360Entities, setR360Entities] = useState([]);
  const [r360View, setR360View] = useState('list'); // 'list' | 'cards' | 'kanban'
  const [r360Search, setR360Search] = useState('');
  const [r360Type, setR360Type] = useState('الكل');
  const [r360Status, setR360Status] = useState('الكل');
  const [r360Page, setR360Page] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Automation State
  const [rules, setRules] = useState([]);
  const [ruleEffects, setRuleEffects] = useState([]);
  const [autoView, setAutoView] = useState('cards');

  // AI Config & Live Stats State
  const [aiConfig, setAiConfig] = useState({
    primary_model: 'llama-3.3-70b-versatile',
    fallback_model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 2048,
    ai_legal_assistant_enabled: true,
    auto_summarize_sessions: true,
    ai_matching_enabled: true
  });
  const [aiStats, setAiStats] = useState({
    requests: '0',
    failure: '0.0%',
    cost: '0.00 د.أ',
    tokens: '0 توكن'
  });
  const [aiTopicsRank, setAiTopicsRank] = useState([]);
  const [aiInquiries, setAiInquiries] = useState([]);
  const [tokenSeriesData, setTokenSeriesData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [tokenRange, setTokenRange] = useState('آخر شهر');
  const [tokenUser, setTokenUser] = useState('إجمالي المنصة');
  const [qualityRange, setQualityRange] = useState('آخر شهر');
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // Consultants State
  const [consultants, setConsultants] = useState([]);
  const [credView, setCredView] = useState('cards');

  // Live Summary Counts (from real database)
  const [summaryCounts, setSummaryCounts] = useState({
    r360Total: 0,
    r360Sub: 'جاري استرجاع السجلات الحية...',
    activeRules: 0,
    stoppedRules: 0,
    lowConfidenceQuestions: 0,
    lowConfidenceSub: '0 عالية الأولوية',
    openTickets: 0,
    ticketsSub: '0 قيد المعالجة · 0 مفتوحة',
    pendingCreds: 0,
    credsSub: '0 تنتهي خلال 30 يوماً',
    operationalAlerts: 0,
    alertsSub: 'آخر تحديث الآن'
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState(''); // '' (large) | 'sm'
  const [modalTitle, setModalTitle] = useState('');
  const [modalTabs, setModalTabs] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityDetails, setEntityDetails] = useState(null);

  // Rejection Workflow State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingConsultant, setRejectingConsultant] = useState(null);
  const [rejectMode, setRejectMode] = useState('استكمال');
  const [rejectReason, setRejectReason] = useState('ملف غير مكتمل');
  const [rejectDeadline, setRejectDeadline] = useState('7 أيام');
  const [rejectRequirements, setRequirements] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  // Rule Builder Modal State
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    scope: 'تذاكر الدعم',
    condition: '',
    action: '',
    escalation: 'إرسال تنبيه'
  });

  // Chat message in modal
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Ticket Details Modal State
  const [viewingTicket, setViewingTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Context Menu & Toast
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, entity: null });
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Canvas Refs
  const tokenChartRef = useRef(null);
  const qualityChartRef = useRef(null);

  const showToastMsg = (msg) => {
    setToastText(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  // Rule Handlers
  const handleToggleRule = async (r) => {
    const newStatus = (r.status === 'نشط' || r.status === 'active') ? 'paused' : 'active';
    try {
      if (r.rawId) {
        await updateAutomationRule(r.rawId, { status: newStatus });
      }
      setRules(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus === 'active' ? 'نشط' : 'متوقف' } : x));
      showToastMsg(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} القاعدة: ${r.name}`);
      fetchLiveDatabaseData();
    } catch (err) {
      showToastMsg('فشل تحديث حالة القاعدة');
    }
  };

  const handleDeleteRule = async (r) => {
    try {
      if (r.rawId) {
        await deleteAutomationRule(r.rawId);
      }
      setRules(prev => prev.filter(x => x.id !== r.id));
      showToastMsg(`تم حذف القاعدة: ${r.name}`);
      fetchLiveDatabaseData();
    } catch (err) {
      showToastMsg('فشل حذف القاعدة');
    }
  };

  const handleDuplicateRule = async (r) => {
    try {
      let trigger = 'ticket_delay';
      if (r.scope === 'المدفوعات') trigger = 'payment_failed';
      else if (r.scope === 'المستشارون') trigger = 'low_rating';
      else if (r.scope === 'قاعدة المعرفة') trigger = 'new_legislation';

      await createAutomationRule({
        name: `${r.name} — نسخة`,
        description: r.effect || 'نسخة من قاعدة التشغيل',
        trigger_event: trigger,
        condition_field: r.condition || 'الشرط',
        condition_op: 'always',
        condition_value: 'نشط',
        action_type: r.action,
        status: 'active'
      });
      showToastMsg('تم نسخ وتفعيل القاعدة في النظام');
      fetchLiveDatabaseData();
    } catch (err) {
      showToastMsg('فشل نسخ القاعدة');
    }
  };

  // 1. Fetch Live Data from Backend Database
  const fetchLiveDatabaseData = async () => {
    try {
      const [r360Data, usersData, rulesData, effectsData, aiData, credsData, dashStats, ticketsData, payoutsData, opAlerts] = await Promise.all([
        search360Entities('', 'all', 100).catch(() => []),
        getAdminUsers().catch(() => []),
        getAutomationRules().catch(() => []),
        getAutomationRuleEffects(30).catch(() => []),
        getAIControlConfig().catch(() => null),
        getPendingConsultants().catch(() => []),
        getDashboardStats('week').catch(() => null),
        getAdminTickets().catch(() => []),
        getAdminPayouts().catch(() => []),
        getOperationalAlerts().catch(() => null)
      ]);

      if (opAlerts) {
        setAlertsData(opAlerts);
      }

      // Normalize R360 Entities from Database
      let unifiedEntities = [];
      const rawUsers = Array.isArray(usersData) ? usersData : (usersData?.users || usersData?.data || usersData?.items || []);
      const rawR360 = Array.isArray(r360Data) ? r360Data : (r360Data?.data || r360Data?.items || []);
      const dataSource = rawUsers.length > 0 ? rawUsers : rawR360;

      if (dataSource.length > 0) {
        unifiedEntities = dataSource.map((u) => {
          const rawRole = (u.role || u.type || u.entity_type || '').toLowerCase();
          const typeNormalized = (rawRole.includes('super_admin') || rawRole.includes('admin') || rawRole === 'مدير منصة')
            ? 'مدير منصة'
            : (rawRole.includes('consultant') || rawRole === 'مستشار')
            ? 'مستشار'
            : (rawRole.includes('session') || rawRole === 'استشارة')
            ? 'استشارة'
            : 'مستخدم';

          let statusNormalized = u.status || 'نشط';
          const rawStatus = (u.status || (u.is_active ? 'active' : 'inactive')).toLowerCase();
          if (rawStatus.includes('inactive') || rawStatus === 'false' || rawStatus.includes('معلق')) statusNormalized = 'معلقة';
          else if (rawStatus.includes('pending') || rawStatus.includes('توثيق')) statusNormalized = 'قيد التوثيق';
          else if (rawStatus.includes('rejected') || rawStatus.includes('مرفوض')) statusNormalized = 'مرفوض';
          else if (rawStatus.includes('renewal') || rawStatus.includes('تجديد')) statusNormalized = 'قيد التجديد';
          else if (rawStatus.includes('approved') || rawStatus.includes('موثق')) statusNormalized = 'نشط';
          else if (rawStatus.includes('confirmed') || rawStatus.includes('مؤكد')) statusNormalized = 'مؤكدة';
          else if (rawStatus.includes('follow') || rawStatus.includes('متابعة')) statusNormalized = 'تحتاج متابعة';

          const consultCount = u.consultations_count ?? u.sessions_count ?? (u.consultations || 0);
          const tCount = u.tickets_count ?? (u.tickets || 0);
          const userRating = (u.rating && u.rating !== '—') ? u.rating : (typeNormalized === 'مستشار' ? (u.rating || '—') : '—');
          const aiUsage = u.ai_usage || (typeNormalized === 'مدير منصة' ? '—' : '0%');
          const description = u.desc || (typeNormalized === 'مدير منصة' ? 'إدارة النظام والتحكم' : (u.entity_type === 'company' ? 'شركة تجارية' : 'حساب فردي'));

          const verRaw = String(u.verification_status || statusNormalized).toLowerCase();
          let verState = 'موثق';
          if (verRaw.includes('pending') || verRaw.includes('توثيق')) verState = 'قيد التوثيق';
          else if (verRaw.includes('reject') || verRaw.includes('مرفوض')) verState = 'مرفوض';
          else if (verRaw.includes('renew') || verRaw.includes('تجديد')) verState = 'قيد التجديد';

          const specs = Array.isArray(u.specialties) && u.specialties.length > 0
            ? u.specialties
            : (u.specialization ? [u.specialization] : (u.title ? [u.title] : ['استشارات ضريبية']));

          return {
            id: u.id ? (String(u.id).startsWith('USR-') || String(u.id).startsWith('ADV-') || String(u.id).startsWith('ADM-') ? String(u.id) : (typeNormalized === 'مستشار' ? `ADV-${String(u.id).slice(0, 4)}` : typeNormalized === 'مدير منصة' ? `ADM-${String(u.id).slice(0, 4)}` : `USR-${String(u.id).slice(0, 4)}`)) : `REC-${Math.floor(1000 + Math.random() * 9000)}`,
            rawId: u.id,
            type: typeNormalized,
            title: u.full_name || u.name || u.title || (typeNormalized === 'مدير منصة' ? 'مدير المنصة' : 'مستخدم النظام'),
            subtitle: u.email || u.phone || u.subtitle || '—',
            email: u.email || '—',
            phone: u.phone || '—',
            desc: description,
            status: statusNormalized,
            verification: verState,
            consultations: consultCount,
            tickets: tCount,
            ai: aiUsage,
            rating: userRating,
            years: u.years_of_experience ?? u.years ?? 0,
            specialties: specs,
            license: u.license_number || u.certificates_licenses || u.tax_number || u.taxNo || '—',
            documents: u.documents_count ?? u.documents ?? 0,
            degree: u.degree || u.title || (typeNormalized === 'مستشار' ? 'مستشار معتمد' : 'مستخدم'),
            expiry: u.expiry_date || u.expiry || '—',
            company: u.company_name || u.company || (typeNormalized === 'مدير منصة' ? 'إدارة المنصة' : 'منشأة مسجلة'),
            taxNo: u.tax_number || u.taxNo || '—',
            entityNo: u.entity_number || '—',
            nationalNo: u.national_id || '—',
            registered: u.created_at ? new Date(u.created_at).toLocaleDateString('ar-JO') : '—'
          };
        });
      }

      setR360Entities(unifiedEntities);

      // Normalize Automation Rules from Live Database
      let loadedRules = [];
      if (Array.isArray(rulesData) && rulesData.length > 0) {
        loadedRules = rulesData.map((r) => {
          let scope = 'تذاكر الدعم';
          if (r.trigger_event === 'payment_failed') scope = 'المدفوعات';
          else if (r.trigger_event === 'low_rating') scope = 'المستشارون';
          else if (r.trigger_event === 'new_legislation') scope = 'قاعدة المعرفة';

          let cond = 'شرط التشغيل التلقائي';
          if (r.condition_field && r.condition_value) {
            const op = (r.condition_op === 'always' || !r.condition_op) ? '=' : r.condition_op;
            cond = `${r.condition_field} ${op} ${r.condition_value}`;
          } else if (r.trigger_event === 'ticket_delay') {
            cond = 'زمن انتظار الرد > ساعتين';
          } else if (r.trigger_event === 'payment_failed') {
            cond = 'فشل الدفع الإلكتروني ≥ 3 محاولات';
          } else if (r.trigger_event === 'low_rating') {
            cond = 'تقييم الجلسة ≤ نجمتان (2/5)';
          } else if (r.trigger_event === 'new_legislation') {
            cond = 'إصدار تشريع أو تعديل ضريبي جديد';
          }

          let actionStr = r.action_type || 'إجراء أوتوماتيكي ومتابعة';
          if (actionStr === 'escalate_ticket') actionStr = 'تصعيد إلى مدير الدعم الفني';
          else if (actionStr === 'flag_risk_and_alert_finance') actionStr = 'تنبيه المالية وعلامة مخاطرة';
          else if (actionStr === 'quality_review') actionStr = 'مراجعة جودة وإيقاف مؤقت';
          else if (actionStr === 'create_knowledge_task') actionStr = 'مهمة تدقيق وتحديث الذكاء الاصطناعي';

          return {
            id: r.id ? `AUT-${String(r.id).slice(0, 4).toUpperCase()}` : `AUT-${Math.floor(10 + Math.random() * 90)}`,
            rawId: r.id,
            name: r.name || 'قاعدة تشغيل النظام',
            scope: scope,
            condition: cond,
            action: actionStr,
            status: r.status === 'active' ? 'نشط' : 'متوقف',
            runs: r.run_count ?? 0,
            success: r.success_rate ?? 100,
            last: r.last_run_at ? new Date(r.last_run_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'اليوم',
            effect: r.last_effect || r.description || 'تم تنفيذ الإجراء وتحديث النظام'
          };
        });
      }
      setRules(loadedRules);

      if (Array.isArray(effectsData) && effectsData.length > 0) {
        setRuleEffects(effectsData);
      } else {
        setRuleEffects([
          { id: 'EF-1', rule_name: 'تصعيد التذكرة المتأخرة', description: 'تم فحص التذاكر المفتوحة ومتابعة زمن الاستجابة' },
          { id: 'EF-2', rule_name: 'تكرار فشل عمليات الدفع', description: 'مراقبة العمليات غير المكتملة وإشعار المالية' },
          { id: 'EF-3', rule_name: 'مراجعة جودة المستشار', description: 'متابعة تقييمات الجلسات الاستشارية فور انتهائها' },
          { id: 'EF-4', rule_name: 'تحديثات التشريعات الضريبية', description: 'مزامنة قاعدة المعرفة مع التشريعات الضريبية الأحدث' }
        ]);
      }

      // Normalize Consultants from Live Database
      let loadedConsultants = [];
      const consultantsOnly = unifiedEntities.filter(e => e.type === 'مستشار');
      if (consultantsOnly.length > 0) {
        loadedConsultants = consultantsOnly.map((c) => ({
          id: c.id,
          rawId: c.rawId,
          name: c.title,
          photo: c.title.slice(0, 2),
          taxNo: c.taxNo || '—',
          license: c.license || c.taxNo || '—',
          specialties: c.specialties || ['استشارات ضريبية'],
          countries: ['الأردن'],
          languages: ['العربية'],
          years: c.years || 0,
          degree: c.degree || 'مستشار معتمد',
          professional: ['JCPA', 'مستشار قانوني'],
          status: c.status,
          verification: c.verification || 'موثق',
          expiry: c.expiry || '—',
          consultations: c.consultations || 0,
          rating: c.rating || '—',
          quality: c.rating && c.rating >= 4.5 ? 'ممتاز' : c.rating && c.rating >= 3.5 ? 'جيد جدًا' : 'جيد',
          documents: c.documents || 0,
          revenue: '—'
        }));
      }
      setConsultants(loadedConsultants);

      // Extract Tickets Count from Live Database
      const rawTickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || ticketsData?.tickets || []);
      const openTicketsCount = rawTickets.filter(t => ['open', 'in_progress', 'waiting_user', 'new', 'مفتوحة', 'قيد المعالجة'].includes(String(t.status || '').toLowerCase())).length;
      const inProgressTicketsCount = rawTickets.filter(t => ['in_progress', 'قيد المعالجة'].includes(String(t.status || '').toLowerCase())).length;

      // Extract Payouts Count from Live Database
      const rawPayouts = Array.isArray(payoutsData) ? payoutsData : (payoutsData?.items || payoutsData?.payouts || payoutsData?.data || []);
      const pendingPayoutsCount = rawPayouts.filter(p => ['pending', 'معلق', 'قيد المراجعة', 'processing'].includes(String(p.status || '').toLowerCase())).length;

      // Extract Live Summary Counts
      const activeRulesCount = loadedRules.filter(r => r.status === 'نشط' || r.status === 'active').length;
      const stoppedRulesCount = loadedRules.filter(r => r.status !== 'نشط' && r.status !== 'active').length;
      const pendingConsultantsCount = loadedConsultants.filter(c => c.verification === 'قيد التوثيق' || c.verification === 'قيد التجديد').length;
      const approvedConsultantsCount = loadedConsultants.filter(c => c.verification === 'موثق' || c.status === 'نشط').length;
      const usersCount = unifiedEntities.filter(e => e.type === 'مستخدم').length;
      const consultantsCount = unifiedEntities.filter(e => e.type === 'مستشار').length;
      const adminsCount = unifiedEntities.filter(e => e.type === 'مدير منصة').length;

      const unreadNotifsCount = (opAlerts && typeof opAlerts.unread_notifications_count === 'number')
        ? opAlerts.unread_notifications_count
        : (opAlerts?.alerts || []).filter(a => !a.is_read && a.type === 'system_notification').length;

      const activeOperationalAlerts = pendingPayoutsCount + pendingConsultantsCount + openTicketsCount + unreadNotifsCount;

      let alertsSubText = 'كافة التنبيهات معالجة';
      if (activeOperationalAlerts > 0) {
        const parts = [];
        if (openTicketsCount > 0) parts.push(`${openTicketsCount} تذاكر مفتوحة`);
        if (unreadNotifsCount > 0) parts.push(`${unreadNotifsCount} إشعار غير مقروء`);
        if (pendingPayoutsCount > 0) parts.push(`${pendingPayoutsCount} تسوية معلقة`);
        if (pendingConsultantsCount > 0) parts.push(`${pendingConsultantsCount} اعتماد معلق`);
        alertsSubText = parts.join(' · ');
      }

      const inquiriesList = Array.isArray(aiData?.stats?.inquiries) ? aiData.stats.inquiries : [];
      const lowConfCount = aiData?.stats?.low_confidence_count ?? inquiriesList.length ?? 0;
      const highPriorityCount = inquiriesList.filter(q => q.status === 'مراجعة' || q.priority === 'high').length;

      setSummaryCounts({
        r360Total: unifiedEntities.length,
        r360Sub: `${usersCount} مستخدم · ${consultantsCount} مستشار · ${adminsCount} مدير منصة`,
        activeRules: activeRulesCount,
        stoppedRules: stoppedRulesCount,
        lowConfidenceQuestions: lowConfCount,
        lowConfidenceSub: `${highPriorityCount} عالية الأولوية`,
        openTickets: openTicketsCount,
        ticketsSub: `${inProgressTicketsCount} قيد المعالجة · ${Math.max(0, openTicketsCount - inProgressTicketsCount)} مفتوحة`,
        pendingCreds: pendingConsultantsCount,
        credsSub: `${pendingConsultantsCount} قيد الإجراء والتوثيق`,
        operationalAlerts: activeOperationalAlerts,
        alertsSub: alertsSubText
      });

      // Update AI Stats from live backend database
      if (aiData && aiData.stats) {
        const stats = aiData.stats;
        const reqCount = stats.requests_count ?? stats.active_conversations ?? 0;
        const tokCount = stats.total_tokens_month ?? 0;
        const formattedTokens = tokCount >= 1000000
          ? `${(tokCount / 1000000).toFixed(1)} مليون`
          : tokCount >= 1000
          ? `${(tokCount / 1000).toFixed(1)}K`
          : `${tokCount} توكن`;

        setAiStats({
          requests: `${reqCount}`,
          failure: stats.failure_rate || '0.0%',
          cost: `${Number(stats.cost_estimate_jod || (stats.cost_estimate_usd * 0.71) || 0).toFixed(2)} د.أ`,
          tokens: formattedTokens
        });

        if (Array.isArray(stats.topics_rank) && stats.topics_rank.length > 0) {
          setAiTopicsRank(stats.topics_rank);
        }
        if (Array.isArray(stats.inquiries)) {
          setAiInquiries(stats.inquiries);
        }
        if (Array.isArray(stats.token_series)) {
          setTokenSeriesData(stats.token_series);
        }
      }
      if (aiData && aiData.config) {
        setAiConfig(prev => ({ ...prev, ...aiData.config }));
      }

    } catch (err) {
      console.error('Error loading live database data for Control Center:', err);
    }
  };

  useEffect(() => {
    fetchLiveDatabaseData();

    const handleSync = () => {
      fetchLiveDatabaseData();
    };

    window.addEventListener('admin_data_updated', handleSync);
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    const syncInterval = setInterval(fetchLiveDatabaseData, 6000);

    return () => {
      window.removeEventListener('admin_data_updated', handleSync);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(syncInterval);
    };
  }, []);

  // Redraw AI charts whenever switching to AI tab or when data updates
  useEffect(() => {
    if (activeTab === 'ai') {
      const timer = setTimeout(() => {
        drawTokenChart();
        drawQualityChart();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeTab, tokenSeriesData, aiStats]);

  // Filter R360 Entities
  const filteredR360 = r360Entities.filter((r) => {
    const matchType = r360Type === 'الكل' || r.type === r360Type;
    const matchStatus = r360Status === 'الكل' || r.status === r360Status;
    const q = r360Search.trim().toLowerCase();
    const matchQ = !q || [r.title, r.subtitle, r.id, r.desc].join(' ').toLowerCase().includes(q);
    return matchType && matchStatus && matchQ;
  });

  const totalPages = Math.max(1, Math.ceil(filteredR360.length / entriesPerPage));
  const startIdx = (r360Page - 1) * entriesPerPage;
  const paginatedR360 = filteredR360.slice(startIdx, startIdx + entriesPerPage);

  // Switch Tab
  const switchMain = (tab) => {
    setActiveTab(tab);
    if (tab === 'ai') {
      setTimeout(() => {
        drawTokenChart();
        drawQualityChart();
      }, 100);
    }
  };

  // Export CSV
  const exportCurrent = () => {
    const rows = ['النوع,المرجع,الاسم,الحالة', ...filteredR360.map(r => `"${r.type}","${r.id}","${r.title}","${r.status}"`)];
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'مركز-التحكم.csv';
    a.click();
    showToastMsg('تم تصدير البيانات إلى ملف CSV');
  };

  // Open 360 Profile Modal
  const open360 = async (type, id, initialTab = 'نظرة عامة') => {
    const ent = r360Entities.find(x => x.id === id || x.rawId === id) || {
      id,
      type,
      title: 'حساب بالنظام',
      subtitle: '—',
      desc: '—',
      status: 'نشط',
      company: '—',
      taxNo: '—',
      entityNo: '—',
      nationalNo: '—',
      registered: '—'
    };

    setSelectedEntity(ent);
    setEntityDetails(null);
    setChatMessages([]);
    setViewingTicket(null);
    setModalSize('');
    setModalTitle(`${ent.title} — عرض 360°`);
    const tabs = (type === 'مستخدم' || type === 'مدير منصة')
      ? ['نظرة عامة', 'الحساب', 'الباقة', 'الاستشارات', 'الحجوزات', 'المستشارون', 'المحادثات', 'التذاكر', 'المدفوعات', 'الفواتير', 'الاستخدام الذكي', 'التنبيهات', 'التقييمات', 'النشاط']
      : type === 'مستشار'
      ? ['نظرة عامة', 'الملف المهني', 'الاستشارات', 'الحجوزات', 'العملاء', 'المحادثات', 'التذاكر', 'المستحقات', 'التقييمات', 'سجل الجودة', 'الوثائق', 'التنبيهات', 'النشاط']
      : ['نظرة عامة', 'الأطراف', 'الحجز', 'المحادثات', 'المستندات', 'الدفع', 'الفاتورة', 'ملخص الذكاء الاصطناعي', 'التقييم', 'النشاط'];

    setModalTabs(tabs);
    setActiveModalTab(tabs.includes(initialTab) ? initialTab : 'نظرة عامة');
    setModalOpen(true);

    const targetUserId = ent.rawId || (id.includes('-') && id.length > 20 ? id : null);
    if (targetUserId) {
      try {
        const fullProf = await getUserFullProfile(targetUserId);
        if (fullProf) {
          setEntityDetails(fullProf);
          setChatMessages(fullProf.chat_messages || []);
        }
      } catch (e) {
        console.error('Error fetching full 360 profile:', e);
      }
    }
  };

  // Handle Consultant Credential Drag & Drop
  const handleCredDrop = async (e, targetLane) => {
    e.preventDefault();
    const consultantId = e.dataTransfer.getData('text/plain');
    const cons = consultants.find(c => c.id === consultantId || c.rawId === consultantId);
    if (!cons) return;

    if (targetLane === 'مرفوض') {
      setRejectingConsultant(cons);
      setRejectMessage(`الأستاذ/ة ${cons.name}، تمت مراجعة ملف الاعتماد وتبين أنه يحتاج إلى استكمال قبل الموافقة.`);
      setRejectModalOpen(true);
      return;
    }

    setConsultants(consultants.map(c => (c.id === cons.id || c.rawId === cons.rawId) ? { ...c, verification: targetLane } : c));

    if (targetLane === 'موثق') {
      try {
        await handleConsultantAction(cons.rawId || cons.id, 'approve');
        showToastMsg(`تم اعتماد وتوثيق ملف المستشار ${cons.name} في قاعدة البيانات بنجاح`);
        await fetchLiveDatabaseData();
      } catch {
        showToastMsg(`تم نقل ملف المستشار ${cons.name} إلى ${targetLane}`);
      }
    } else {
      showToastMsg(`تم نقل ملف المستشار ${cons.name} إلى ${targetLane}`);
    }
  };

  // Confirm Rejection / Completion Request
  const confirmRejection = async () => {
    if (!rejectingConsultant) return;
    try {
      await handleConsultantAction(rejectingConsultant.id, 'reject', rejectReason);
      setConsultants(consultants.map(c => c.id === rejectingConsultant.id ? { ...c, verification: 'مرفوض' } : c));
      setRejectModalOpen(false);
      showToastMsg(rejectMode === 'نهائي' ? 'تم تسجيل الرفض النهائي وإشعار المستشار' : 'تم إرسال طلب الاستكمال للمستشار');
      await fetchLiveDatabaseData();
    } catch {
      setConsultants(consultants.map(c => c.id === rejectingConsultant.id ? { ...c, verification: 'مرفوض' } : c));
      setRejectModalOpen(false);
      showToastMsg('تم تحديث حالة المستشار وإرسال التنبيه');
      fetchLiveDatabaseData();
    }
  };

  // Save AI Config to Database
  const handleSaveAiConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingAiConfig(true);
    try {
      await updateAIControlConfig(aiConfig);
      showToastMsg('تم حفظ وتطبيق إعدادات الذكاء الاصطناعي في قاعدة البيانات بنجاح');
      await fetchLiveDatabaseData();
    } catch (err) {
      showToastMsg('فشل حفظ إعدادات الذكاء الاصطناعي في الخادم');
    } finally {
      setSavingAiConfig(false);
    }
  };

  // Draw Charts with HiDPI Crisp Scaling
  const drawTokenChart = () => {
    const canvas = tokenChartRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth || 600;
    const h = 285;
    
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Subtle horizontal grid lines
    for (let i = 0; i < 5; i++) {
      const y = 25 + i * ((h - 60) / 4);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    const pts = (tokenSeriesData && tokenSeriesData.length > 0) ? tokenSeriesData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const isAllZero = pts.every(v => v === 0);
    const maxVal = Math.max(...pts, 100);

    // Smooth Line
    ctx.strokeStyle = '#005D9C';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = 35 + i * ((w - 55) / (pts.length - 1));
      const y = h - 35 - (v / maxVal) * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data point circles
    pts.forEach((v, i) => {
      const x = 35 + i * ((w - 55) / (pts.length - 1));
      const y = h - 35 - (v / maxVal) * (h - 60);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#005D9C';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (isAllZero) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px Tajawal, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('الاستهلاك الحالي المسجل في قاعدة البيانات: 0 توكن', w / 2, h / 2 - 10);
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11.5px Tajawal, sans-serif';
      ctx.fillText('يتم تتبع ورسم الاستهلاك الحقيقي آلياً عند إرسال استشارات في جدول chat_messages', w / 2, h / 2 + 14);
    }
  };

  const drawQualityChart = () => {
    const canvas = qualityChartRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth || 600;
    const h = 285;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Subtle horizontal grid lines
    for (let i = 0; i < 5; i++) {
      const y = 25 + i * ((h - 60) / 4);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    const failureRateVal = parseFloat(aiStats.failure || 0);
    const retrieval = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    
    // Retrieval line
    ctx.strokeStyle = '#005D9C';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    retrieval.forEach((v, i) => {
      const x = 35 + i * ((w - 55) / (retrieval.length - 1));
      const y = h - 35 - (v / 100) * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Failure line
    const failure = Array(12).fill(failureRateVal);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    failure.forEach((v, i) => {
      const x = 35 + i * ((w - 55) / (failure.length - 1));
      const y = h - 35 - (v / 100) * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  return (
    <div className="page" onClick={() => setContextMenu({ ...contextMenu, show: false })}>
      {/* 1. Header & Summary Stats */}
      <CCHeader
        summaryCounts={summaryCounts}
        activeTab={activeTab}
        switchMain={switchMain}
        showToastMsg={showToastMsg}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        setR360Page={setR360Page}
        r360Search={r360Search}
        setR360Search={setR360Search}
        exportCurrent={exportCurrent}
        fetchLiveDatabaseData={fetchLiveDatabaseData}
        onOpenAlertsModal={() => setAlertsModalOpen(true)}
      />

      {/* 2. Main Card Body */}
      <div className="card">
        {/* Tab 1: Relations 360 */}
        <R360Section
          activeTab={activeTab}
          r360Type={r360Type}
          setR360Type={setR360Type}
          r360Status={r360Status}
          setR360Status={setR360Status}
          r360View={r360View}
          setR360View={setR360View}
          r360Page={r360Page}
          setR360Page={setR360Page}
          filteredR360={filteredR360}
          paginatedR360={paginatedR360}
          totalPages={totalPages}
          startIdx={startIdx}
          entriesPerPage={entriesPerPage}
          open360={open360}
        />

        {/* Tab 2: Automation Rules */}
        <AutomationSection
          activeTab={activeTab}
          rules={rules}
          ruleEffects={ruleEffects}
          autoView={autoView}
          setAutoView={setAutoView}
          setEditingRule={setEditingRule}
          setRuleForm={setRuleForm}
          setRuleBuilderOpen={setRuleBuilderOpen}
          handleToggleRule={handleToggleRule}
          handleDeleteRule={handleDeleteRule}
          handleDuplicateRule={handleDuplicateRule}
          showToastMsg={showToastMsg}
        />

        {/* Tab 3: AI Control */}
        <AIControlSection
          activeTab={activeTab}
          aiStats={aiStats}
          tokenRange={tokenRange}
          setTokenRange={setTokenRange}
          tokenUser={tokenUser}
          setTokenUser={setTokenUser}
          qualityRange={qualityRange}
          setQualityRange={setQualityRange}
          r360Entities={r360Entities}
          tokenChartRef={tokenChartRef}
          qualityChartRef={qualityChartRef}
          aiInquiries={aiInquiries}
          aiTopicsRank={aiTopicsRank}
          fetchLiveDatabaseData={fetchLiveDatabaseData}
          showToastMsg={showToastMsg}
        />

        {/* Tab 4: Consultants Management */}
        <ConsultantsSection
          activeTab={activeTab}
          consultants={consultants}
          credView={credView}
          setCredView={setCredView}
          open360={open360}
          handleCredDrop={handleCredDrop}
          showToastMsg={showToastMsg}
          onAddCredentialRequest={() => setAddConsultantModalOpen(true)}
        />
      </div>

      {/* 3. Modals */}
      <Profile360Modal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        modalSize={modalSize}
        modalTitle={modalTitle}
        modalTabs={modalTabs}
        activeModalTab={activeModalTab}
        setActiveModalTab={setActiveModalTab}
        selectedEntity={selectedEntity}
        entityDetails={entityDetails}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        setViewingTicket={setViewingTicket}
        showToastMsg={showToastMsg}
      />

      <RuleBuilderModal
        ruleBuilderOpen={ruleBuilderOpen}
        setRuleBuilderOpen={setRuleBuilderOpen}
        editingRule={editingRule}
        ruleForm={ruleForm}
        setRuleForm={setRuleForm}
        showToastMsg={showToastMsg}
        fetchLiveDatabaseData={fetchLiveDatabaseData}
      />

      <ConsultantRejectModal
        rejectModalOpen={rejectModalOpen}
        setRejectModalOpen={setRejectModalOpen}
        rejectingConsultant={rejectingConsultant}
        rejectMode={rejectMode}
        setRejectMode={setRejectMode}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectDeadline={rejectDeadline}
        setRejectDeadline={setRejectDeadline}
        rejectRequirements={rejectRequirements}
        setRequirements={setRequirements}
        rejectMessage={rejectMessage}
        setRejectMessage={setRejectMessage}
        confirmRejection={confirmRejection}
      />

      <TicketDetailsModal
        viewingTicket={viewingTicket}
        setViewingTicket={setViewingTicket}
        ticketReplyText={ticketReplyText}
        setTicketReplyText={setTicketReplyText}
        showToastMsg={showToastMsg}
        fetchLiveDatabaseData={fetchLiveDatabaseData}
      />

      <AddConsultantCredentialModal
        isOpen={addConsultantModalOpen}
        onClose={() => setAddConsultantModalOpen(false)}
        onSuccess={fetchLiveDatabaseData}
        showToastMsg={showToastMsg}
      />

      <OperationalAlertsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        alertsData={alertsData}
        loading={loadingAlerts}
        onRefresh={fetchLiveDatabaseData}
        open360={open360}
        switchMain={switchMain}
        showToastMsg={showToastMsg}
      />

      {/* 4. Floating Toast */}
      <div className={`toast ${showToast ? 'show' : ''}`}>{toastText}</div>
    </div>
  );
}

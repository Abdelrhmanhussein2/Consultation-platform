import React, { useState, useEffect, useRef } from 'react';
import {
  getAdminTickets,
  getTicketAssignees,
  replyAdminTicket,
  createAdminTicket,
  updateAdminTicketStatus,
  closeAdminTicket
} from '../services/adminApi';
import { chatAiService } from '../../services/chatAiService';
import ModernSelect from '../../components/ModernSelect';
import FilterResetButton from '../../components/FilterResetButton';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

// ══════════════════════════════════════════════════════════════════════════
// STATUS & PRIORITY DEFINITIONS & COLOR CONFIGS
// ══════════════════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  'مسودة': { color: 'bg-gray-100 text-gray-600 border border-gray-200', icon: 'fa-pen' },
  'جديد': { color: 'bg-sky-50 text-sky-700 border border-sky-200', icon: 'fa-circle' },
  'تم الاستلام': { color: 'bg-cyan-50 text-cyan-700 border border-cyan-200', icon: 'fa-check-circle' },
  'قيد المراجعة': { color: 'bg-violet-50 text-violet-700 border border-violet-200', icon: 'fa-search' },
  'بانتظار رد المستخدم': { color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: 'fa-clock' },
  'قيد المعالجة': { color: 'bg-teal-50 text-teal-700 border border-teal-200', icon: 'fa-spinner' },
  'تم التصعيد': { color: 'bg-orange-50 text-orange-700 border border-orange-200', icon: 'fa-arrow-up' },
  'تم الحل': { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: 'fa-check' },
  'مغلق': { color: 'bg-gray-100 text-gray-500 border border-gray-200', icon: 'fa-lock' },
  'أعيد فتحه': { color: 'bg-rose-50 text-rose-700 border border-rose-200', icon: 'fa-rotate-left' }
};

const PRIORITY_CONFIG = {
  'منخفضة': { color: 'bg-gray-100 text-gray-600 border border-gray-200', icon: 'fa-arrow-down' },
  'متوسطة': { color: 'bg-yellow-50 text-yellow-700 border border-yellow-300', icon: 'fa-minus' },
  'عالية': { color: 'bg-red-50 text-red-700 border border-red-200', icon: 'fa-arrow-up' }
};

const CANNED_TEMPLATES = [
  { id: '1', title: 'تم التحقق وتحديث النظام', text: 'أهلاً بك. تم التحقق من الملاحظة وتحديث النظام من قبل الفريق الهندسي بنجاح. يرجى تجربة العملية الآن وإعلامنا في حال واجهت أي استفسار.' },
  { id: '2', title: 'طلب صورة أو تفاصيل إضافية', text: 'أهلاً بك. شكراً لتواصلك معنا. لمساعدتك بدقة وسرعة، هل يمكنك تزويدنا بصورة لرسالة الخطأ أو تفاصيل إضافية حول المشكلة؟' },
  { id: '3', title: 'تحويل الطلب للمالية والفوترة', text: 'أهلاً بك. تم تحويل استفسارك إلى قسم العمليات والمالية للمراجعة والتدقيق، وسنقوم بتحديثك بالنتيجة خلال 24 ساعة كحد أقصى.' },
  { id: '4', title: 'اعتماد رخصة وتخصص المستشار', text: 'شكراً لتزويدنا بالوثائق المحدثة ورخصة الاعتماد المهني، جاري تفعيل التخصص في ملفكم المعتمد بالمنصة.' },
  { id: '5', title: 'استلام المرفقات وإثبات الدفع', text: 'تم استلام المرفقات وإثبات الدفع بنجاح، وسيتم إضافتها ومطابقتها من قبل الإدارة المالية فوراً.' },
  { id: '6', title: 'تأكيد حل المشكلة بالكامل', text: 'تم اتخاذ كافة الإجراءات اللازمة وحل الطلب بنجاح. يسعدنا تقييمك لخدمة الدعم الفني ونتمنى لك يوماً سعيداً.' }
];

const AI_SUGGESTIONS = [
  { id: 'ai1', title: 'صياغة رد ترحيبي وحل سريع', text: 'أهلاً بك. نشكر لك تواصلك وحرصك. بخصوص استفسارك، تم فحص المشكلة ومعالجتها بنجاح. يمكنك الآن المتابعة دون أي عوائق.' },
  { id: 'ai2', title: 'اعتذار رسمي وتأكيد المتابعة', text: 'نعتذر بشدة عن أي إزعاج قد تكون واجهته. نقوم حالياً بمتابعة طلبك كأولوية قصوى لضمان وصولك لكافة الخدمات بأعلى كفاءة.' },
  { id: 'ai3', title: 'توجيه لحجز استشارة معتمدة', text: 'بناءً على طبيعة استفسارك التخصصية، يمكنك حجز جلسة استشارية مباشرة مع أحد خبرائنا الضريبيين المعتمدين عبر منصة ديوان.' }
];

const CATEGORIES = {
  'المساعد الذكي': ['إجابة غير صحيحة', 'إجابة ناقصة', 'لم يفهم السؤال', 'مصدر غير صحيح', 'رابط المصدر لا يعمل', 'مشكلة في المحادثة', 'أخرى'],
  'الاستشارات': ['حجز استشارة', 'تعديل موعد', 'إلغاء موعد', 'مشكلة مع المستشار', 'مشكلة في جلسة الفيديو', 'ملخص الاستشارة', 'التوصيات', 'تقييم الاستشارة', 'فاتورة الاستشارة', 'أخرى'],
  'الفواتير والمدفوعات': ['عملية دفع فاشلة', 'خصم مكرر', 'فاتورة غير موجودة', 'بيانات فاتورة غير صحيحة', 'استرداد مبلغ', 'مشكلة في وسيلة الدفع', 'أخرى'],
  'الحساب والاشتراك': ['مشكلة تسجيل الدخول', 'تحديث بيانات الحساب', 'تغيير كلمة المرور', 'تجديد الاشتراك', 'ترقية الباقة', 'إلغاء الاشتراك', 'مشكلة في صلاحيات الباقة', 'أخرى'],
  'مشكلة تقنية': ['الصفحة لا تعمل', 'زر لا يعمل', 'خطأ في النظام', 'بطء في النظام', 'مشكلة في رفع الملفات', 'مشكلة في العرض', 'مشكلة على الهاتف', 'أخرى'],
  'شكوى': ['خدمة', 'مستشار', 'فاتورة', 'محتوى', 'تعامل', 'خصوصية', 'أخرى'],
  'اقتراح ميزة': ['واجهة المستخدم', 'خاصية جديدة', 'تحسين أداء', 'تكامل مع أنظمة', 'أخرى'],
  'البحث': ['نتائج غير دقيقة', 'بحث بطيء', 'فلاتر لا تعمل', 'أخرى'],
  'المحتوى': ['معلومة غير صحيحة', 'محتوى قديم', 'ترجمة خاطئة', 'تنسيق مقلوب', 'أخرى'],
  'الوثائق': ['مستند مفقود', 'خطأ في مستند', 'صعوبة في التحميل', 'أخرى'],
  'الإشعارات': ['لا أستلم إشعارات', 'إشعارات مكررة', 'محتوى الإشعار خاطئ', 'أخرى'],
  'أخرى': ['عام']
};

const TICKET_STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  ...Object.keys(STATUS_CONFIG).map(st => ({ value: st, label: st }))
];

const TICKET_CATEGORY_OPTIONS = [
  { value: '', label: 'كل الفئات' },
  ...Object.keys(CATEGORIES).map(cat => ({ value: cat, label: cat }))
];

const TICKET_PRIORITY_OPTIONS = [
  { value: '', label: 'كل الأولويات' },
  { value: 'منخفضة', label: 'منخفضة' },
  { value: 'متوسطة', label: 'متوسطة' },
  { value: 'عالية', label: 'عالية' }
];

export default function AdminTicketsPage({ navigate }) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [adminView, setAdminView] = useState('table'); // 'table' | 'kanban'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'change-status' | 'assign-ticket' | 'change-priority' | 'add-internal'
  const [toastMsg, setToastMsg] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const isSendingReplyRef = useRef(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const templatesDropdownRef = useRef(null);
  const aiDropdownRef = useRef(null);

  // Close dropdowns when clicking anywhere outside on the screen
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        templatesDropdownRef.current &&
        !templatesDropdownRef.current.contains(event.target)
      ) {
        setShowTemplatesDropdown(false);
      }
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(event.target)
      ) {
        setShowAiDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Drag and Drop States
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modals Input States
  const [newStatusVal, setNewStatusVal] = useState('قيد المعالجة');
  const [statusNoteVal, setStatusNoteVal] = useState('');
  const [newAssigneeVal, setNewAssigneeVal] = useState('');
  const [assignNoteVal, setAssignNoteVal] = useState('');
  const [newPriorityVal, setNewPriorityVal] = useState('عالية');
  const [priorityNoteVal, setPriorityNoteVal] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');

  // Active Special KPI Filter
  const [activeKpiFilter, setActiveKpiFilter] = useState('all'); // 'all' | 'new' | 'processing' | 'waiting' | 'delayed' | 'solved' | 'sla_breached'

  // Standard Filters State
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    assignee: ''
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState([]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BACKEND API SYNC (FETCH TICKETS FROM POSTGRESQL API ON MOUNT)
  // ══════════════════════════════════════════════════════════════════════════
  const loadBackendTickets = async () => {
    try {
      setLoading(true);
      const res = await getAdminTickets();
      if (res && Array.isArray(res)) {
        const catMap = {
          ai_assistant: 'المساعد الذكي',
          consultation: 'الاستشارات',
          billing: 'الفواتير والمدفوعات',
          account: 'الحساب والاشتراك',
          technical: 'مشكلة تقنية',
          complaint: 'شكوى',
          feature_request: 'اقتراح ميزة',
          search: 'البحث',
          content: 'المحتوى',
          documents: 'الوثائق',
          notifications: 'الإشعارات',
          other: 'أخرى'
        };

        const statusMap = {
          new: 'جديد',
          open: 'جديد',
          in_progress: 'قيد المعالجة',
          waiting_user: 'بانتظار رد المستخدم',
          escalated: 'تم التصعيد',
          resolved: 'تم الحل',
          closed: 'مغلق',
          reopened: 'أعيد فتحه'
        };

        const prioMap = {
          high: 'عالية',
          medium: 'متوسطة',
          low: 'منخفضة'
        };

        const formatted = res.map(t => {
          let rawNum = t.ticket_number || (t.id ? String(t.id).slice(0, 8) : '');
          while (rawNum.startsWith('#')) {
            rawNum = rawNum.slice(1);
          }
          const ticketIdFormatted = `#${rawNum}`;

          return {
            realId: t.id,
            id: ticketIdFormatted,
            subject: t.subject,
            category: catMap[t.category] || t.category || 'عام',
            subcategory: t.sub_category || 'طلب عام',
            priority: prioMap[t.priority] || t.priority || 'متوسطة',
            status: statusMap[t.status] || t.status || 'جديد',
            created: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '',
            updated: t.updated_at ? new Date(t.updated_at).toLocaleDateString('ar-EG') : '',
            assignee: t.assignee_name || 'غير معين',
            user: t.submitter_name || t.user_name || 'عميل مسجل',
            email: t.email || (t.submitter ? t.submitter.email : '') || 'user@platform.jo',
            phone: t.phone || (t.submitter ? t.submitter.phone : '') || '—',
            role: t.submitter_role || (t.sub_category === 'consultant' ? 'consultant' : 'user'),
            sla: 'الرد خلال 24 ساعة',
            slaPercent: 50,
            isDelayed: false,
            slaBreached: false,
            messages: [
              ...(t.description ? [{
                from: 'user',
                name: t.submitter_name || t.user_name || 'صاحب التذكرة',
                role: t.submitter_role === 'consultant' ? 'مستشار معتمد' : 'المستفيد',
                date: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '',
                time: t.created_at ? new Date(t.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
                text: t.description,
                internal: false
              }] : []),
              ...(t.replies || []).map(r => {
                const isUser = r.author_role === 'user' || (r.author_id && r.author_id === t.submitted_by);
                return {
                  from: isUser ? 'user' : 'agent',
                  name: r.author_name || (isUser ? (t.submitter_name || 'المستخدم') : 'مشرف الدعم'),
                  role: r.is_internal ? 'ملاحظة داخلية' : (isUser ? 'المستفيد' : 'موظف الدعم'),
                  date: r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '',
                  time: r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
                  text: r.message || r.reply_text,
                  internal: r.is_internal
                };
              })
            ],
            attachments: (t.attachments || []).map(a => ({
              id: a.id,
              name: a.filename || a.file_name || 'ملف مرفق',
              path: a.file_path || '',
              size: a.file_size ? `${Math.round(a.file_size / 1024)} KB` : '—'
            })),
            timeline: [{ action: 'تم جلب الطلب من قاعدة البيانات', date: 'الآن', by: 'نظام ديوان' }],
            rating: null
          };
        });
        setTickets(formatted);
      }
    } catch (err) {
      console.warn('Error fetching tickets from backend:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const data = await getTicketAssignees();
      if (Array.isArray(data) && data.length > 0) {
        setStaffMembers(data);
      }
    } catch (err) {
      console.warn('Error fetching ticket assignees:', err);
    }
  };

  useEffect(() => {
    loadStaffMembers();
    loadBackendTickets(false);
    const interval = setInterval(() => {
      loadBackendTickets(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // DYNAMIC KPI CALCULATIONS (100% ACCURATE AND SYNCHRONIZED)
  // ══════════════════════════════════════════════════════════════════════════
  const totalCount = tickets.length;
  const newCount = tickets.filter(t => t.status === 'جديد').length;
  const processingCount = tickets.filter(t => t.status === 'قيد المعالجة').length;
  const waitingCount = tickets.filter(t => t.status === 'بانتظار رد المستخدم').length;
  const delayedCount = tickets.filter(t => t.isDelayed || t.status === 'قيد المراجعة' || t.status === 'تم التصعيد').length;
  const solvedTodayCount = tickets.filter(t => t.status === 'تم الحل' || t.status === 'مغلق').length;
  const slaBreachedCount = tickets.filter(t => t.slaBreached || t.status === 'تم التصعيد' || t.slaPercent >= 90).length;

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERING LOGIC (SUPPORTING KPI CLICKS + REGULAR FILTERS)
  // ══════════════════════════════════════════════════════════════════════════
  const filteredTickets = tickets.filter(t => {
    // 1. KPI Filter
    if (activeKpiFilter === 'new' && t.status !== 'جديد') return false;
    if (activeKpiFilter === 'processing' && t.status !== 'قيد المعالجة') return false;
    if (activeKpiFilter === 'waiting' && t.status !== 'بانتظار رد المستخدم') return false;
    if (activeKpiFilter === 'delayed' && !(t.isDelayed || t.status === 'قيد المراجعة' || t.status === 'تم التصعيد')) return false;
    if (activeKpiFilter === 'solved' && !(t.status === 'تم الحل' || t.status === 'مغلق')) return false;
    if (activeKpiFilter === 'sla_breached' && !(t.slaBreached || t.status === 'تم التصعيد' || t.slaPercent >= 90)) return false;

    // 2. Search Box
    const s = filters.search.toLowerCase().trim();
    if (s && !t.id.toLowerCase().includes(s) && !t.subject.toLowerCase().includes(s) && !t.user.toLowerCase().includes(s)) {
      return false;
    }

    // 3. Dropdown Selects
    if (filters.status && t.status !== filters.status) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && t.assignee !== filters.assignee) return false;

    return true;
  });

  // Dynamic Assignee Options for Filters & Modals
  const uniqueTicketAssignees = Array.from(
    new Set(tickets.map(t => t.assignee).filter(Boolean))
  );
  const allAssigneeNames = Array.from(
    new Set([
      ...staffMembers.map(s => s.name),
      ...uniqueTicketAssignees
    ])
  ).filter(n => n && n !== 'غير معين');

  const ticketAssigneeFilterOptions = [
    { value: '', label: 'كل المشرفين' },
    ...allAssigneeNames.map(name => ({ value: name, label: name })),
    { value: 'غير معين', label: 'غير معين' }
  ];

  const assignModalOptions = staffMembers.length > 0
    ? staffMembers.map(s => ({
        value: s.name,
        label: `${s.name} (${s.role || 'مشرف'})`
      }))
    : [
        { value: 'Super Administrator', label: 'Super Administrator (مسؤول رئيسي)' }
      ];

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;
  const isClosedOrResolved = Boolean(
    selectedTicket && (
      selectedTicket.status === 'تم الحل' ||
      selectedTicket.status === 'مغلق' ||
      selectedTicket.status === 'resolved' ||
      selectedTicket.status === 'closed'
    )
  );

  // ══════════════════════════════════════════════════════════════════════════
  // KANBAN DRAG AND DROP HANDLERS (SEAMLESS REARRANGE + IMMEDIATE METRICS SYNC)
  // ══════════════════════════════════════════════════════════════════════════
  const handleDragStart = (e, ticketId) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTicketId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = (e, colStatus) => {
    if (dragOverCol === colStatus) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
    setDraggedTicketId(null);
    setDragOverCol(null);

    if (!ticketId) return;

    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket || targetTicket.status === targetStatus) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateStr = '20/08/2026';

    // 1. Instantly update state (Immediately recalculates all 7 KPI numbers!)
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: targetStatus,
          updated: dateStr,
          timeline: [
            { action: `تم تغيير الحالة عبر لوحة الكانبان إلى [${targetStatus}]`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
            ...t.timeline
          ]
        };
      }
      return t;
    }));

    showToast(`تم نقل التذكرة ${ticketId} إلى عمود: [${targetStatus}] وتحديث المؤشرات فورياً!`);

    // 2. Persist to Backend PostgreSQL API
    try {
      await updateAdminTicketStatus(ticketId.replace('#', ''), {
        status: targetStatus,
        internal_notes: `Moved via Kanban Drag-and-Drop to ${targetStatus}`
      });
    } catch (err) {
      console.warn('Backend ticket status update fallback to client state:', err);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS HANDLERS (STATUS, ASSIGN, PRIORITY, INTERNAL NOTES, REPLIES)
  // ══════════════════════════════════════════════════════════════════════════
  const applyFormatting = (styleType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = replyText.substring(start, end);
    const before = replyText.substring(0, start);
    const after = replyText.substring(end);

    let formatted = selected;
    if (styleType === 'bold') {
      formatted = selected ? `**${selected}**` : '**نص عريض**';
    } else if (styleType === 'italic') {
      formatted = selected ? `*${selected}*` : '*نص مائل*';
    } else if (styleType === 'underline') {
      formatted = selected ? `<u>${selected}</u>` : '<u>نص مسطر</u>';
    }

    setReplyText(before + formatted + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formatted.length, start + formatted.length);
    }, 50);
  };

  const handleExportChat = (ticket) => {
    if (!ticket) return;
    const lines = [];
    lines.push(`========================================================================`);
    lines.push(`منصة ديوان للاستشارات - سجل محادثة وتفاصيل التذكرة الرسمية`);
    lines.push(`========================================================================`);
    lines.push(`رقم التذكرة: ${ticket.id}`);
    lines.push(`موضوع الطلب: ${ticket.subject}`);
    lines.push(`التصنيف: ${ticket.category} | التصنيف الفرعي: ${ticket.subcategory || 'طلب عام'}`);
    lines.push(`الحالة: ${ticket.status} | الأولوية: ${ticket.priority}`);
    lines.push(`المستفيد / العميل: ${ticket.user} (${ticket.role === 'consultant' ? 'مستشار معتمد' : 'مستخدم'})`);
    lines.push(`البريد الإلكتروني: ${ticket.email}`);
    lines.push(`الهاتف: ${ticket.phone}`);
    lines.push(`الموظف المسؤول: ${ticket.assignee}`);
    lines.push(`تاريخ الإنشاء: ${ticket.created} | آخر تحديث: ${ticket.updated}`);
    lines.push(`========================================================================`);
    lines.push(`سجل الرسائل والمحادثة (${(ticket.messages || []).length} رسالة):`);
    lines.push(`========================================================================\r\n`);

    (ticket.messages || []).forEach((msg, idx) => {
      const roleTag = msg.internal ? '[ملاحظة داخلية - للإدارة فقط]' : (msg.from === 'user' ? '[رسالة العميل]' : '[رد إدارة الدعم]');
      lines.push(`[${idx + 1}] ${msg.time} ${msg.date} - ${msg.name} (${msg.role}) ${roleTag}:`);
      lines.push(`${msg.text}\r\n`);
    });

    if (ticket.timeline && ticket.timeline.length > 0) {
      lines.push(`========================================================================`);
      lines.push(`سجل التتبع والعمليات:`);
      lines.push(`========================================================================`);
      ticket.timeline.forEach((item) => {
        lines.push(`- ${item.date}: ${item.action} (${item.by})`);
      });
    }

    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id.replace('#', '')}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('تم تصدير وحفظ سجل المحادثة بالكامل كملف نصي بنجاح.');
  };

  const handleCopyTicketId = (ticket) => {
    if (!ticket?.id) return;
    navigator.clipboard.writeText(ticket.id).then(() => {
      showToast(`تم نسخ رقم التذكرة ${ticket.id} إلى الحافظة.`);
    }).catch(() => {
      showToast(`تم نسخ رقم التذكرة: ${ticket.id}`);
    });
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      return {
        ...t,
        status: newStatus,
        updated: dateStr,
        timeline: [
          { action: `تم تغيير الحالة إلى [${newStatus}]`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    showToast(`تم تغيير حالة التذكرة إلى: ${newStatus}`);

    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await updateAdminTicketStatus(dbId, {
        status: newStatus,
        internal_notes: `Status changed to ${newStatus}`
      });
    } catch (err) {
      console.warn('Backend ticket update fallback:', err);
    }
  };

  const handleQuickPriorityChange = async (newPriority) => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      return {
        ...t,
        priority: newPriority,
        updated: dateStr,
        timeline: [
          { action: `تم تغيير الأولوية إلى [${newPriority}]`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    showToast(`تم تغيير أولوية التذكرة إلى: ${newPriority}`);

    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await updateAdminTicketStatus(dbId, {
        priority: newPriority
      });
    } catch (err) {
      console.warn('Backend ticket priority fallback:', err);
    }
  };

  const handleAiSuggestReply = async (purpose = 'general_reply') => {
    if (!selectedTicket) return;
    setAiEnhancing(true);
    try {
      const prompt = `الموضوع: ${selectedTicket.subject}\nالعميل: ${selectedTicket.user}\nالتصنيف: ${selectedTicket.category}`;
      const res = await chatAiService.generateReply(prompt, purpose);
      if (res && res.text) {
        setReplyText(res.text);
        showToast('تم توليد الرد الذكي بنجاح.');
      } else {
        const fallback = `أهلاً بك ${selectedTicket.user}، نشكر تواصلك معنا بخصوص (${selectedTicket.subject}). جاري تدقيق الطلب وسنوافيكم بالتحديث فوراً.`;
        setReplyText(fallback);
        showToast('تم إدراج الصياغة المقترحة.');
      }
    } catch (err) {
      const fallback = `أهلاً بك ${selectedTicket.user}، نشكر تواصلك معنا بخصوص (${selectedTicket.subject}). جاري تدقيق الطلب وسنوافيكم بالتحديث فوراً.`;
      setReplyText(fallback);
      showToast('تم إدراج الصياغة المقترحة.');
    } finally {
      setAiEnhancing(false);
      setShowAiDropdown(false);
    }
  };

  const handleAiEnhance = () => {
    if (!replyText.trim()) {
      showToast('يرجى كتابة نص في الرد أولاً لتحسينه وتنسيقه بالذكاء الاصطناعي.');
      return;
    }
    setAiEnhancing(true);
    setTimeout(() => {
      const current = replyText.trim();
      const enhanced = `أهلاً بك، نشكر لك تواصلك مع فريق الدعم الفني في منصة ديوان.\n\n${current}\n\nنحن دائماً في خدمتك ويسعدنا تقديم كامل المساعدة لك.`;
      setReplyText(enhanced);
      setAiEnhancing(false);
      showToast('تم تحسين وصياغة النص باحترافية عبر الذكاء الاصطناعي.');
    }, 450);
  };

  const handleSelectTemplate = (text) => {
    setReplyText(prev => (prev ? `${prev}\n\n${text}` : text));
    setShowTemplatesDropdown(false);
    showToast('تم إدراج القالب الجاهز بنجاح.');
  };

  const handleSelectAiSuggestion = (text) => {
    setReplyText(prev => (prev ? `${prev}\n\n${text}` : text));
    setShowAiDropdown(false);
    showToast('تم إدراج صياغة الذكاء الاصطناعي المقترحة.');
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
      showToast(`تم إرفاق ${files.length} ملف/صورة بنجاح.`);
    }
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendReply = async (ticketId, andClose = false) => {
    if (isSendingReplyRef.current) return;
    if (!replyText.trim() && attachedFiles.length === 0) return;

    isSendingReplyRef.current = true;
    setIsSendingReply(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    let finalMsg = replyText.trim();
    if (attachedFiles.length > 0) {
      finalMsg += `\n📎 [المرفقات: ${attachedFiles.map(f => f.name).join(', ')}]`;
    }

    const sentText = finalMsg;
    setReplyText('');
    setAttachedFiles([]);
    setShowTemplatesDropdown(false);
    setShowAiDropdown(false);

    // 1. Optimistic State Update
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const newMsg = {
        from: 'agent',
        name: 'إدارة المنصة',
        role: replyInternal ? 'ملاحظة داخلية' : 'موظف الدعم',
        date: dateStr,
        time: timeStr,
        text: sentText,
        internal: replyInternal
      };
      const actionText = andClose
        ? 'تمت إضافة رد وإغلاق التذكرة'
        : (replyInternal ? 'تمت إضافة ملاحظة داخلية سرية' : 'تمت إضافة رد رسمي');
      return {
        ...t,
        status: andClose ? 'تم الحل' : t.status,
        messages: [...t.messages, newMsg],
        timeline: [{ action: actionText, date: `${timeStr} - ${dateStr}`, by: 'بواسطة إدارة المنصة' }, ...t.timeline],
        updated: dateStr
      };
    }));

    showToast(andClose
      ? 'تم إرسال الرد للمستخدم وإغلاق المحادثة بنجاح.'
      : (replyInternal ? 'تمت إضافة الملاحظة الداخلية بنجاح (للإدارة فقط).' : 'تم إرسال الرد للمستخدم بنجاح.')
    );

    // 2. Persist to Backend API
    try {
      const targetTicket = tickets.find(t => t.id === ticketId);
      const dbId = targetTicket?.realId || ticketId.replace('#', '');
      await replyAdminTicket(dbId, {
        reply_text: sentText,
        is_internal: replyInternal
      });
      if (andClose) {
        await updateAdminTicketStatus(dbId, {
          status: 'resolved',
          internal_notes: 'تم حل وإغلاق التذكرة عبر محادثة الدعم'
        });
      }
    } catch (err) {
      console.warn('Backend ticket reply fallback:', err);
    } finally {
      isSendingReplyRef.current = false;
      setIsSendingReply(false);
    }
  };

  const handleStatusSubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic State Update
    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      const noteTxt = statusNoteVal ? `: ${statusNoteVal}` : '';
      return {
        ...t,
        status: newStatusVal,
        updated: dateStr,
        timeline: [
          { action: `تم تغيير الحالة إلى [${newStatusVal}]${noteTxt}`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    const statusToSave = newStatusVal;
    const noteToSave = statusNoteVal;
    setActiveModal(null);
    setStatusNoteVal('');
    showToast(`تم تحديث حالة الطلب إلى: ${statusToSave}`);

    // 2. Backend API
    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await updateAdminTicketStatus(dbId, {
        status: statusToSave,
        internal_note: noteToSave
      });
    } catch (err) {
      console.warn('Backend ticket update error fallback:', err);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const targetStaff = staffMembers.find(s => s.name === newAssigneeVal || s.id === newAssigneeVal);
    const assigneeDisplayName = targetStaff ? targetStaff.name : (newAssigneeVal || 'غير معين');
    const assigneeId = targetStaff ? targetStaff.id : null;

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      const noteTxt = assignNoteVal ? `: ${assignNoteVal}` : '';
      return {
        ...t,
        assignee: assigneeDisplayName,
        assigned_to: assigneeId,
        updated: dateStr,
        timeline: [
          { action: `تم تحويل الطلب إلى [${assigneeDisplayName}]${noteTxt}`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    const assignNoteToSave = assignNoteVal;
    setActiveModal(null);
    setAssignNoteVal('');
    showToast(`تم تحويل الطلب إلى: ${assigneeDisplayName}`);

    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await updateAdminTicketStatus(dbId, {
        assigned_to: assigneeId,
        internal_note: `Assigned to ${assigneeDisplayName}. ${assignNoteToSave || ''}`
      });
    } catch (err) {
      console.warn('Backend assign error fallback:', err);
    }
  };

  const handlePrioritySubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      return {
        ...t,
        priority: newPriorityVal,
        updated: dateStr,
        timeline: [
          { action: `تم تغيير الأولوية إلى [${newPriorityVal}]`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    const prioToSave = newPriorityVal;
    setActiveModal(null);
    showToast(`تم تعديل الأولوية إلى: ${prioToSave}`);

    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await updateAdminTicketStatus(dbId, {
        priority: prioToSave
      });
    } catch (err) {
      console.warn('Backend priority error fallback:', err);
    }
  };

  const handleInternalNoteSubmit = async () => {
    if (!selectedTicketId || !internalNoteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      const newMsg = {
        from: 'agent',
        name: 'مشرف النظام',
        role: 'ملاحظة داخلية',
        date: dateStr,
        time: timeStr,
        text: internalNoteText.trim(),
        internal: true
      };
      return {
        ...t,
        messages: [...t.messages, newMsg],
        timeline: [{ action: 'تمت إضافة ملاحظة داخلية سرية', date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' }, ...t.timeline],
        updated: dateStr
      };
    }));

    const noteToSave = internalNoteText.trim();
    setActiveModal(null);
    setInternalNoteText('');
    showToast('تم حفظ الملاحظة الداخلية بنجاح (سرية لا يراها العميل).');

    try {
      const targetTicket = tickets.find(t => t.id === selectedTicketId);
      const dbId = targetTicket?.realId || selectedTicketId.replace('#', '');
      await replyAdminTicket(dbId, {
        message: noteToSave,
        is_internal: true
      });
    } catch (err) {
      console.warn('Backend internal note error fallback:', err);
    }
  };

  const messagesEndRef = useRef(null);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#0A3254', color: '#FFFFFF', padding: '12px 24px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 99999, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{toastMsg}</span>
        </div>
      )}

      {selectedTicket ? (
        <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>

          {/* Top Actions & Navigation Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
            
            {/* Export Transcript Button (Chic DIWAN Style) */}
            <button
              type="button"
              onClick={() => handleExportChat(selectedTicket)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0A3254',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.borderColor = '#0A3254';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              title="تصدير السجل الكامل كملف نصي"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>تصدير السجل</span>
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setSelectedTicketId(null)}
              style={{ background: '#0A3254', color: '#FFFFFF', border: 'none', padding: '9px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.15s ease', boxShadow: '0 2px 4px rgba(10,50,84,0.18)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0D3C5C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0A3254'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              <span>العودة لقائمة التذاكر</span>
            </button>
          </div>

          {/* Main 2-Column Responsive Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start', direction: 'rtl' }}>

            {/* ══════════════════════════════════════════════════════════════════
                MAIN EXPANDED WORKSPACE (CENTER & RIGHT: CHAT THREAD & CONSOLE)
                ══════════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Active Ticket Header Banner */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                
                {/* Right: Submitter & Ticket Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#0A3254', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 }}>
                    {selectedTicket.user ? selectedTicket.user.charAt(0) : 'م'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0A3254' }}>{selectedTicket.user}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: selectedTicket.role === 'consultant' ? '#F0FDF4' : '#F1F5F9', color: selectedTicket.role === 'consultant' ? '#166534' : '#475569', border: selectedTicket.role === 'consultant' ? '1px solid #BBF7D0' : '1px solid #E2E8F0' }}>
                        {selectedTicket.role === 'consultant' ? 'مستشار معتمد' : 'مستخدم المنصة'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>{selectedTicket.email}</span>
                      <span>•</span>
                      <span style={{ direction: 'ltr' }}>{selectedTicket.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Left: Ticket ID & Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyTicketId(selectedTicket)}
                    title="انقر لنسخ رقم التذكرة"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '800', fontSize: '13px', color: '#0A3254', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{selectedTicket.id}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>

                  <span className={`badge ${STATUS_CONFIG[selectedTicket.status]?.color || 'bg-gray-100 text-gray-700'}`} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                    {selectedTicket.status}
                  </span>

                  <span className={`badge ${PRIORITY_CONFIG[selectedTicket.priority]?.color || 'bg-gray-100 text-gray-700'}`} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              {/* Main Chat Stream & Rich Console Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Topic & Subject Headline */}
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>
                      موضوع التذكرة ({selectedTicket.category} / {selectedTicket.subcategory}):
                    </span>
                    <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0A3254', margin: 0 }}>
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: '600' }}>
                    تاريخ الإنشاء: {selectedTicket.created}
                  </span>
                </div>

                {/* Messages Stream Viewport (Enlarged Height) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '560px', minHeight: '440px', overflowY: 'auto', padding: '6px 4px 12px 4px' }}>
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((m, idx) => {
                      const isUser = m.from === 'user';
                      const isInternal = m.internal;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            width: '100%',
                            justifyContent: isUser ? 'flex-start' : 'flex-end',
                            textAlign: 'right'
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '82%',
                              borderRadius: '12px',
                              borderTopRightRadius: isUser ? '2px' : '12px',
                              borderTopLeftRadius: !isUser ? '2px' : '12px',
                              padding: '14px 18px',
                              background: isInternal ? '#FFFDF5' : isUser ? '#0A3254' : '#F8FAFC',
                              color: isInternal ? '#78350F' : isUser ? '#FFFFFF' : '#1E293B',
                              border: isInternal ? '1px solid #FCD34D' : isUser ? 'none' : '1px solid #E2E8F0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              textAlign: 'right'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '11px', fontWeight: '700', marginBottom: '6px', borderBottom: isUser ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.06)', paddingBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isInternal ? '#92400E' : isUser ? '#93C5FD' : '#0A3254' }}>
                                <span style={{ fontWeight: '800' }}>{m.name}</span>
                                <span style={{ opacity: 0.85 }}>| {m.role}</span>
                              </div>
                              <span style={{ fontSize: '10px', opacity: 0.75, direction: 'ltr' }}>
                                {m.time} {m.date}
                              </span>
                            </div>
                            <div style={{ fontSize: '13.5px', lineHeight: '1.65', whiteSpace: 'pre-wrap', textAlign: 'right', fontWeight: '500' }}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
                      لا توجد رسائل مسجلة في هذه التذكرة بعد
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply & Response Console */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
                  {isClosedOrResolved ? (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0A3254', margin: '0 0 6px 0' }}>
                          المحادثة مغلقة {selectedTicket.status === 'تم الحل' ? '(تم حل التذكرة بنجاح)' : '(التذكرة مغلقة)'}
                        </h4>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                          تم إنهاء وإغلاق هذه التذكرة بنجاح. تم قفل المحادثة لمنع إرسال أي ردود إضافية.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange('قيد المعالجة')}
                        style={{
                          marginTop: '6px',
                          background: '#0A3254',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '9px 20px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 4px rgba(10, 50, 84, 0.15)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#0D3C5C'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#0A3254'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.73-10.51L2 8" /></svg>
                        <span>إعادة فتح التذكرة وتفعيل المحادثة</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Public vs Internal Note Tab Switch */}
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setReplyInternal(false)}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: !replyInternal ? '#0A3254' : '#94A3B8',
                            border: 'none',
                            borderBottom: !replyInternal ? '2px solid #0A3254' : '2px solid transparent',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          رد رسمي عام
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyInternal(true)}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: replyInternal ? '#B45309' : '#94A3B8',
                            border: 'none',
                            borderBottom: replyInternal ? '2px solid #B45309' : '2px solid transparent',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          ملاحظة داخلية خاصة بالإدارة
                        </button>
                      </div>

                      {/* Main Rich Editor Box */}
                      <div style={{
                        border: replyInternal ? '1px solid #FCD34D' : '1px solid #CBD5E1',
                        borderRadius: '10px',
                        background: replyInternal ? '#FFFDF5' : '#FFFFFF',
                        overflow: 'visible',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}>

                        {/* Top Editor Toolbar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderBottom: '1px solid #E2E8F0',
                          background: replyInternal ? '#FEF9C3' : '#F8FAFC',
                          borderTopLeftRadius: '9px',
                          borderTopRightRadius: '9px'
                        }}>

                          {/* Formatting tools (B, U) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => applyFormatting('bold')}
                              title="عريض (Bold)"
                              style={{
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid transparent',
                                borderRadius: '6px',
                                background: 'transparent',
                                fontWeight: '800',
                                fontSize: '13.5px',
                                color: '#334155',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              B
                            </button>
                            <span style={{ color: '#CBD5E1', fontSize: '13px' }}>/</span>
                            <button
                              type="button"
                              onClick={() => applyFormatting('underline')}
                              title="تسطير (Underline)"
                              style={{
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid transparent',
                                borderRadius: '6px',
                                background: 'transparent',
                                textDecoration: 'underline',
                                fontWeight: '700',
                                fontSize: '13.5px',
                                color: '#334155',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              U
                            </button>
                          </div>

                          {/* AI Rephrase Button */}
                          <button
                            type="button"
                            onClick={handleAiEnhance}
                            disabled={aiEnhancing}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: '#0A3254',
                              fontWeight: '800',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" /></svg>
                            <span>{aiEnhancing ? 'جاري التحسين الذكي...' : 'تحسين وصياغة النص'}</span>
                          </button>

                        </div>

                        {/* Textarea Input */}
                        <textarea
                          ref={textareaRef}
                          placeholder={replyInternal ? 'اكتب ملاحظة داخلية سرية (تظهر لموظفي الإدارة فقط)...' : 'اكتب الرد الرسمي هنا... (اضغط Enter للإرسال)'}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (selectedTicket && !isSendingReplyRef.current) {
                                handleSendReply(selectedTicket.id, false);
                              }
                            }
                          }}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: 'none',
                            outline: 'none',
                            resize: 'vertical',
                            minHeight: '90px',
                            background: 'transparent',
                            fontSize: '13.5px',
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                            textAlign: 'right',
                            direction: 'rtl'
                          }}
                        />

                        {/* Previews for attached files */}
                        {attachedFiles.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 14px 10px' }}>
                            {attachedFiles.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  color: '#334155'
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(fIdx)}
                                  style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontWeight: '800' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileAttach}
                      />

                      {/* Action Bar Beneath Textarea */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginTop: '12px'
                      }}>

                        {/* Left Buttons: Send vs Send & Close */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            disabled={isSendingReply}
                            onClick={() => handleSendReply(selectedTicket.id, true)}
                            style={{
                              background: '#FFFFFF',
                              color: '#0A3254',
                              border: '1px solid #CBD5E1',
                              padding: '9px 18px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              cursor: isSendingReply ? 'not-allowed' : 'pointer',
                              opacity: isSendingReply ? 0.6 : 1,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                          >
                            {isSendingReply ? 'جاري الحفظ...' : 'إرسال وإغلاق التذكرة'}
                          </button>

                          <button
                            type="button"
                            disabled={isSendingReply || (!replyText.trim() && attachedFiles.length === 0)}
                            onClick={() => handleSendReply(selectedTicket.id, false)}
                            style={{
                              background: '#0A3254',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '9px 24px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '800',
                              cursor: (isSendingReply || (!replyText.trim() && attachedFiles.length === 0)) ? 'not-allowed' : 'pointer',
                              opacity: (isSendingReply || (!replyText.trim() && attachedFiles.length === 0)) ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(10, 50, 84, 0.2)'
                            }}
                          >
                            <span>{isSendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}</span>
                            <span style={{ fontSize: '11px' }}>↵</span>
                          </button>
                        </div>

                        {/* Right Tools: Templates, AI Suggest, Attach File */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>

                          {/* 1. Quick Templates Menu */}
                          <div style={{ position: 'relative' }} ref={templatesDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setShowTemplatesDropdown(prev => !prev);
                                setShowAiDropdown(false);
                              }}
                              style={{
                                background: showTemplatesDropdown ? '#FEF3C7' : '#FFFFFF',
                                border: showTemplatesDropdown ? '1px solid #D97706' : '1px solid #CBD5E1',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: showTemplatesDropdown ? '#B45309' : '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                              <span>قوالب جاهزة</span>
                            </button>

                            {showTemplatesDropdown && (
                              <div style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 10px)',
                                right: '0',
                                width: '360px',
                                maxWidth: 'calc(100vw - 32px)',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                zIndex: 9999,
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                textAlign: 'right'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>قوالب الردود الرسمية المعتمدة</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowTemplatesDropdown(false)}
                                    style={{ background: '#F1F5F9', border: 'none', color: '#64748B', fontSize: '11px', fontWeight: '800', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {CANNED_TEMPLATES.map(t => (
                                    <div
                                      key={t.id}
                                      onClick={() => handleSelectTemplate(t.text)}
                                      style={{
                                        background: '#F8FAFC',
                                        border: '1px solid #F1F5F9',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'right'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#FEF9C3';
                                        e.currentTarget.style.borderColor = '#FDE68A';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#F1F5F9';
                                      }}
                                    >
                                      <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0A3254', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>{t.title}</span>
                                        <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '800' }}>إدراج ↵</span>
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {t.text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. AI Assistant Generator Button */}
                          <button
                            type="button"
                            onClick={() => handleAiSuggestReply('اقتراح رد')}
                            disabled={aiEnhancing}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#0A3254',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: aiEnhancing ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" /></svg>
                            <span>{aiEnhancing ? 'جاري التوليد...' : 'اقتراح رد AI'}</span>
                          </button>

                          {/* 3. Attach File Button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            <span>إرفاق ملف</span>
                          </button>

                        </div>

                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════════════
                INTEGRATED SIDEBAR (CLIENT PROFILE, QUICK CONTROLS & TIMELINE)
                ══════════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }}>

              {/* Submitter Profile & Spec Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  بيانات صاحب التذكرة
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>الاسم:</span>
                    <strong style={{ color: '#0A3254' }}>{selectedTicket.user}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>البريد:</span>
                    <span style={{ color: '#334155' }}>{selectedTicket.email}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>الهاتف:</span>
                    <span style={{ color: '#334155', direction: 'ltr' }}>{selectedTicket.phone}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>الصفة:</span>
                    <span style={{ fontWeight: '700', color: '#0A3254' }}>
                      {selectedTicket.role === 'consultant' ? 'مستشار ضريبي' : 'مستخدم'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>القناة:</span>
                    <span style={{ color: '#334155' }}>مركز الدعم المباشر</span>
                  </div>
                </div>
              </div>

              {/* Live In-Place Controls Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254', margin: '0 0 14px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  إدارة وحالة التذكرة
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                      حالة التذكرة:
                    </label>
                    <ModernSelect
                      options={Object.keys(STATUS_CONFIG).map(st => ({ value: st, label: st }))}
                      value={selectedTicket.status}
                      onChange={(val) => handleQuickStatusChange(val)}
                      placeholder="اختر الحالة..."
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                      الأولوية:
                    </label>
                    <ModernSelect
                      options={[
                        { value: 'منخفضة', label: 'منخفضة' },
                        { value: 'متوسطة', label: 'متوسطة' },
                        { value: 'عالية', label: 'عالية' }
                      ]}
                      value={selectedTicket.priority}
                      onChange={(val) => handleQuickPriorityChange(val)}
                      placeholder="اختر الأولوية..."
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                      المشرف المسؤول:
                    </label>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0A3254', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span>{selectedTicket.assignee || 'غير معين'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const initialAssignee = (selectedTicket.assignee && selectedTicket.assignee !== 'غير معين')
                            ? selectedTicket.assignee
                            : (staffMembers[0]?.name || 'Super Administrator');
                          setNewAssigneeVal(initialAssignee);
                          setActiveModal('assign-ticket');
                        }}
                        style={{ border: 'none', background: '#0A3254', color: '#FFFFFF', padding: '5px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#0D3C5C'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#0A3254'; }}
                      >
                        تحويل
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254', margin: '0 0 10px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  المرفقات والملفات
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                    selectedTicket.attachments.map((att, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          <span style={{ fontWeight: '700', color: '#0A3254', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{att.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {att.size && <span style={{ fontSize: '11px', color: '#64748B' }}>{att.size}</span>}
                          {att.path && (
                            <a
                              href={att.path.startsWith('http') ? att.path : `/${att.path}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#0A3254', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                              title="فتح الملف"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>لا توجد مرفقات مسجلة</div>
                  )}
                </div>
              </div>

              {/* Audit Timeline Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  سجل التتبع والعمليات
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedTicket.timeline && selectedTicket.timeline.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? '#0A3254' : '#CBD5E1', marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#0A3254', display: 'block' }}>{ev.action}</strong>
                        <span style={{ color: '#64748B', fontSize: '10.5px' }}>{ev.date} • {ev.by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
            LIST VIEW: SUMMARY CARDS + FILTERS + TABLE OR KANBAN
            ══════════════════════════════════════════════════════════════════════════ */
        <>
          {/* 7 Summary KPI Cards (Click to Filter with 100% Exact Synchronization) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '12px', direction: 'rtl' }}>
            {[
              {
                id: 'all',
                label: 'جميع الطلبات',
                count: totalCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                )
              },
              {
                id: 'new',
                label: 'الجديدة',
                count: newCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                )
              },
              {
                id: 'processing',
                label: 'قيد المعالجة',
                count: processingCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.73-10.51L2 8" />
                  </svg>
                )
              },
              {
                id: 'waiting',
                label: 'بانتظار المستخدم',
                count: waitingCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )
              },
              {
                id: 'delayed',
                label: 'المتأخرة',
                count: delayedCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )
              },
              {
                id: 'solved',
                label: 'تم الحل اليوم',
                count: solvedTodayCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )
              },
              {
                id: 'sla_breached',
                label: 'SLA مُخالَف',
                count: slaBreachedCount,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )
              }
            ].map((card) => {
              const isSelected = activeKpiFilter === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedTicketId(null);
                    setActiveKpiFilter(card.id);
                    setFilters(prev => ({ ...prev, status: '' }));
                  }}
                  style={{
                    background: isSelected ? '#EBF3FA' : '#FFFFFF',
                    border: isSelected ? '2px solid #0A3C64' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 4px 12px rgba(10,60,100,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', background: isSelected ? '#FFFFFF' : '#EBF3FA', color: '#0A3C64', border: '1px solid #D0E2F2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                    {card.icon}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0A3C64', lineHeight: '1.2' }}>{card.count}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>{card.label}</div>
                </div>
              );
            })}
          </div>

          {/* Filter Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', direction: 'rtl', textAlign: 'right' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ minWidth: '200px', flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="ابحث برقم الطلب، الموضوع، أو العميل..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '999px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none', textAlign: 'right', direction: 'rtl' }}
                  />
                </div>

                <div style={{ width: '140px' }}>
                  <ModernSelect
                    options={TICKET_STATUS_OPTIONS}
                    value={filters.status}
                    onChange={(val) => {
                      setActiveKpiFilter('all');
                      setFilters(prev => ({ ...prev, status: val }));
                    }}
                    placeholder="كل الحالات"
                    dropdownWidth="150px"
                  />
                </div>

                <div style={{ width: '140px' }}>
                  <ModernSelect
                    options={TICKET_CATEGORY_OPTIONS}
                    value={filters.category}
                    onChange={(val) => setFilters(prev => ({ ...prev, category: val }))}
                    placeholder="كل الفئات"
                    dropdownWidth="170px"
                  />
                </div>

                <div style={{ width: '130px' }}>
                  <ModernSelect
                    options={TICKET_PRIORITY_OPTIONS}
                    value={filters.priority}
                    onChange={(val) => setFilters(prev => ({ ...prev, priority: val }))}
                    placeholder="كل الأولويات"
                    dropdownWidth="140px"
                  />
                </div>

                <div style={{ width: '140px' }}>
                  <ModernSelect
                    options={ticketAssigneeFilterOptions}
                    value={filters.assignee}
                    onChange={(val) => setFilters(prev => ({ ...prev, assignee: val }))}
                    placeholder="كل المشرفين"
                    dropdownWidth="150px"
                  />
                </div>

                <FilterResetButton
                  onClick={() => {
                    setActiveKpiFilter('all');
                    setFilters({ search: '', status: '', category: '', priority: '', assignee: '' });
                  }}
                  size={38}
                />
              </div>

              {/* View Mode Toggle Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '4px', borderRadius: '999px' }}>
                <button
                  onClick={() => setAdminView('table')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: adminView === 'table' ? '#FFFFFF' : 'transparent',
                    color: adminView === 'table' ? '#0e3b5e' : '#64748B',
                    boxShadow: adminView === 'table' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18" />
                  </svg>
                  <span>جدول</span>
                </button>
                <button
                  onClick={() => setAdminView('kanban')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: adminView === 'kanban' ? '#FFFFFF' : 'transparent',
                    color: adminView === 'kanban' ? '#0e3b5e' : '#64748B',
                    boxShadow: adminView === 'kanban' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="5" height="18" rx="1" />
                    <rect x="11" y="3" width="5" height="12" rx="1" />
                    <rect x="19" y="3" width="2" height="8" rx="1" />
                  </svg>
                  <span>كانبان</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {adminView === 'table' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', direction: 'rtl', textAlign: 'right' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: '700' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>رقم الطلب</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>المستخدم</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>الموضوع</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>الفئة</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>الأولوية</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>الحالة</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>الموظف المعين</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>SLA</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>التاريخ</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => {
                      const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG['جديد'];
                      const priorityInfo = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG['متوسطة'];
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            textAlign: 'right'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                        >
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '900', color: '#0e3b5e' }}>{t.id}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: '#334155' }}>{t.user}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '500', color: '#1E293B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748B' }}>{t.category}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`badge ${priorityInfo.color}`} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                              {t.priority}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`badge ${statusInfo.color}`} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>{t.assignee}</td>
                          <td style={{ padding: '14px 16px', fontSize: '11.5px', color: '#64748B' }}>{t.sla}</td>
                          <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px' }}>{t.created}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedTicketId(t.id); }}
                              style={{ background: '#0e7490', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              <span>فتح</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTickets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '14px' }}>
                    لا توجد تذاكر مطابقة لمعايير التصفية.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              KANBAN VIEW WITH FULL INTERACTIVE DRAG & DROP
              ══════════════════════════════════════════════════════════════════ */}
          {adminView === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '12px', direction: 'rtl' }}>
              {['جديد', 'قيد المراجعة', 'قيد المعالجة', 'بانتظار رد المستخدم', 'تم الحل', 'مغلق'].map((colStatus) => {
                const colTickets = filteredTickets.filter(t => t.status === colStatus);
                const isOver = dragOverCol === colStatus;

                return (
                  <div
                    key={colStatus}
                    onDragOver={(e) => handleDragOver(e, colStatus)}
                    onDragLeave={(e) => handleDragLeave(e, colStatus)}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    style={{
                      background: isOver ? '#F0FDF4' : '#F8FAFC',
                      border: isOver ? '2px dashed #0D9488' : '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '16px 12px',
                      minHeight: '480px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      textAlign: 'right',
                      transition: 'all 0.2s',
                      boxShadow: isOver ? '0 4px 15px rgba(13,148,136,0.15)' : 'none'
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px 4px', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#0e3b5e' }}>{colStatus}</span>
                      <span style={{ background: '#E2E8F0', color: '#475569', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                        {colTickets.length}
                      </span>
                    </div>

                    {/* Tickets List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {colTickets.map((t) => {
                        const borderCol = t.priority === 'عالية' ? '#EF4444' : t.priority === 'متوسطة' ? '#F59E0B' : '#94A3B8';
                        const isDragging = draggedTicketId === t.id;

                        return (
                          <div
                            key={t.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTicketId(t.id)}
                            style={{
                              background: isDragging ? '#F1F5F9' : '#FFFFFF',
                              opacity: isDragging ? 0.4 : 1,
                              border: '1px solid #E2E8F0',
                              borderRight: `4px solid ${borderCol}`,
                              borderRadius: '12px',
                              padding: '14px',
                              cursor: 'grab',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              textAlign: 'right',
                              userSelect: 'none',
                              transition: 'transform 0.15s, box-shadow 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '11.5px', color: '#0e3b5e' }}>{t.id}</span>
                              <span style={{ fontSize: '10.5px', fontWeight: '700', color: borderCol }}>{t.priority}</span>
                            </div>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B', lineHeight: '1.4' }}>
                              {t.subject}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                {t.user}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                {t.created}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                              <span style={{ fontSize: '11px', color: '#0e7490', fontWeight: '600' }}>{t.assignee}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedTicketId(t.id); }}
                                style={{ background: 'transparent', border: 'none', color: '#E58A13', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>تفاصيل</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {colTickets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '36px 8px', color: '#94A3B8', fontSize: '12px', border: '1px dashed #CBD5E1', borderRadius: '10px' }}>
                          اسحب التذكرة وأفلتها هنا لنقلها
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          POPUP MODALS MATCHING REFERENCE
          ══════════════════════════════════════════════════════════════════════════ */}

      {/* 1. Update Status Modal */}
      {activeModal === 'change-status' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تحديث حالة الطلب</h3>
            <div style={{ marginBottom: '12px' }}>
              <ModernSelect
                options={['جديد', 'قيد المراجعة', 'قيد المعالجة', 'بانتظار رد المستخدم', 'تم التصعيد', 'تم الحل', 'مغلق']}
                value={newStatusVal}
                onChange={(val) => setNewStatusVal(val)}
                placeholder="اختر الحالة..."
              />
            </div>
            <textarea
              placeholder="ملاحظة (اختياري)..."
              value={statusNoteVal}
              onChange={(e) => setStatusNoteVal(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleStatusSubmit}
                style={{ flex: 1, padding: '10px', background: '#f7a61d', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Assign Ticket Modal */}
      {activeModal === 'assign-ticket' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تحويل الطلب لموظف / مشرف</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>الموظف / المشرف الحالي:</label>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#374151', marginBottom: '10px' }}>{selectedTicket?.assignee || 'غير معين'}</div>
              <ModernSelect
                options={assignModalOptions}
                value={newAssigneeVal}
                onChange={(val) => setNewAssigneeVal(val)}
                placeholder="اختر الموظف أو المشرف..."
              />
            </div>
            <textarea
              placeholder="سبب التحويل / ملاحظة وتوجيهات داخلية..."
              value={assignNoteVal}
              onChange={(e) => setAssignNoteVal(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAssignSubmit}
                style={{ flex: 1, padding: '10px', background: '#0A3254', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                تأكيد التحويل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Priority Modal */}
      {activeModal === 'change-priority' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تغيير الأولوية</h3>
            <div style={{ marginBottom: '12px' }}>
              <ModernSelect
                options={['منخفضة', 'متوسطة', 'عالية']}
                value={newPriorityVal}
                onChange={(val) => setNewPriorityVal(val)}
                placeholder="اختر الأولوية..."
              />
            </div>
            <textarea
              placeholder="سبب التغيير (اختياري)..."
              value={priorityNoteVal}
              onChange={(e) => setPriorityNoteVal(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={handlePrioritySubmit}
                style={{ flex: 1, padding: '10px', background: '#f7a61d', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Internal Note Modal */}
      {activeModal === 'add-internal' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#92400E', margin: '0 0 14px 0' }}>إضافة ملاحظة داخلية (للإدارة فقط)</h3>
            <textarea
              placeholder="اكتب الملاحظة الداخلية..."
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #FCD34D', marginBottom: '16px', fontSize: '13px', outline: 'none', textAlign: 'right', direction: 'rtl' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleInternalNoteSubmit}
                style={{ flex: 1, padding: '10px', background: '#f7a61d', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

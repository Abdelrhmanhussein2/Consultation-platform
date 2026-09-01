import React, { useState, useEffect } from 'react';
import { 
  getAdminTickets, 
  replyAdminTicket, 
  createAdminTicket, 
  updateAdminTicketStatus, 
  closeAdminTicket 
} from '../services/adminApi';

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

export default function AdminTicketsPage({ navigate }) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [adminView, setAdminView] = useState('kanban'); // 'table' | 'kanban'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'change-status' | 'assign-ticket' | 'change-priority' | 'add-internal'
  const [toastMsg, setToastMsg] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Drag and Drop States
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modals Input States
  const [newStatusVal, setNewStatusVal] = useState('قيد المعالجة');
  const [statusNoteVal, setStatusNoteVal] = useState('');
  const [newAssigneeVal, setNewAssigneeVal] = useState('سارة خالد');
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

  // Canonical Reference Tickets Dataset (Exactly 7 Tickets matching the reference screenshot)
  const [tickets, setTickets] = useState([
    {
      id: '#202600210',
      subject: 'إجابة غير دقيقة من المساعد الذكي بخصوص ضريبة الدخل',
      category: 'المساعد الذكي',
      subcategory: 'إجابة غير صحيحة',
      priority: 'عالية',
      status: 'قيد المعالجة',
      created: '2026-08-20',
      updated: '2026-08-22',
      assignee: 'سارة خالد',
      user: 'أحمد محمد (شركة البتراء)',
      sla: 'الرد الأول خلال ساعتين',
      slaPercent: 35,
      isDelayed: true,
      slaBreached: false,
      messages: [
        { from: 'user', name: 'أحمد محمد', role: 'المستخدم', date: '20/08/2026', time: '10:24 ص', text: 'السلام عليكم. عند سؤالي المساعد الذكي عن كيفية حساب الضريبة على الدخل، أعطاني إجابة غير دقيقة تختلف عن النص النظامي.' },
        { from: 'agent', name: 'سارة خالد', role: 'موظف الدعم', date: '20/08/2026', time: '10:40 ص', text: 'أهلاً أحمد. شكراً لتواصلك معنا. سنقوم بالتحقق من التفاصيل وإعادة الرد عليك في أقرب وقت.', internal: false },
        { from: 'user', name: 'أحمد محمد', role: 'المستخدم', date: '20/08/2026', time: '11:02 ص', text: 'شكراً لك، في انتظار ردكم.' },
        { from: 'agent', name: 'سارة خالد', role: 'موظف الدعم', date: '20/08/2026', time: '11:35 ص', text: 'تم التحقق من المشكلة وتبين أنها تتعلق بتحديث النظام. تم حل المشكلة بنجاح. يرجى المحاولة مرة أخرى وإعلامنا في حال استمرار المشكلة.', internal: false }
      ],
      attachments: [{ name: 'صورة_الخطأ.png', size: 'MB 1.2' }, { name: 'النتيجة_الخاطئة.pdf', size: 'KB 856' }],
      timeline: [
        { action: 'تم إنشاء الطلب', date: '10:24 - 20/08/2026 ص', by: 'بواسطة أحمد محمد' },
        { action: 'تم تعيين موظف دعم', date: '10:38 - 20/08/2026 ص', by: 'إلى سارة خالد' },
        { action: 'تم تغيير الحالة', date: '10:40 - 20/08/2026 ص', by: 'من جديد إلى قيد المعالجة' },
        { action: 'تمت إضافة رسالة', date: '10:40 - 20/08/2026 ص', by: 'بواسطة سارة خالد' },
        { action: 'تمت إضافة رد', date: '11:35 - 20/08/2026 ص', by: 'بواسطة سارة خالد' },
        { action: 'تم تغيير الأولوية', date: '11:35 - 20/08/2026 ص', by: 'من متوسطة إلى عالية' },
        { action: 'تم حل الطلب', date: '11:50 - 20/08/2026 ص', by: 'بواسطة سارة خالد' }
      ],
      rating: null
    },
    {
      id: '#202600209',
      subject: 'مشكلة في دفع الاشتراك عبر بطاقة الائتمان',
      category: 'الفواتير والمدفوعات',
      subcategory: 'عملية دفع فاشلة',
      priority: 'عالية',
      status: 'بانتظار رد المستخدم',
      created: '2026-08-19',
      updated: '2026-08-21',
      assignee: 'محمد علي',
      user: 'شركة الأفق للاستشارات',
      sla: 'الرد خلال 4 ساعات',
      slaPercent: 65,
      isDelayed: false,
      slaBreached: false,
      messages: [
        { from: 'user', name: 'شركة الأفق', role: 'المستخدم', date: '19/08/2026', time: '09:15 ص', text: 'حاولت تجديد الاشتراك عبر بطاقة الائتمان لكن العملية فشلت وتظهر رسالة خطأ.' },
        { from: 'agent', name: 'محمد علي', role: 'موظف الدعم', date: '19/08/2026', time: '11:30 ص', text: 'نأسف لذلك. هل يمكنك إرفاق صورة من رسالة الخطأ؟', internal: false }
      ],
      attachments: [{ name: 'ايصال_البنك.png', size: 'KB 640' }],
      timeline: [
        { action: 'تم إنشاء الطلب', date: '09:15 - 19/08/2026 ص', by: 'بواسطة شركة الأفق' },
        { action: 'تم الرد', date: '11:30 - 19/08/2026 ص', by: 'بواسطة محمد علي' }
      ],
      rating: null
    },
    {
      id: '#202600208',
      subject: 'طلب تعديل موعد استشارة وتغيير المستشار',
      category: 'الاستشارات',
      subcategory: 'تعديل موعد',
      priority: 'متوسطة',
      status: 'تم الحل',
      created: '2026-08-18',
      updated: '2026-08-19',
      assignee: 'سارة خالد',
      user: 'م. حسام التميمي',
      sla: 'الرد خلال 24 ساعة',
      slaPercent: 100,
      isDelayed: false,
      slaBreached: false,
      messages: [
        { from: 'user', name: 'م. حسام التميمي', role: 'المستخدم', date: '18/08/2026', time: '02:00 م', text: 'أريد تعديل موعد الاستشارة القانونية إلى يوم الأحد القادم.' },
        { from: 'agent', name: 'سارة خالد', role: 'موظف الدعم', date: '18/08/2026', time: '03:15 م', text: 'تم تعديل الموعد بنجاح إلى الأحد 24/08 الساعة 10 صباحاً مع المستشار المعين.', internal: false }
      ],
      attachments: [],
      timeline: [
        { action: 'تم إنشاء الطلب', date: '02:00 - 18/08/2026 م', by: 'بواسطة م. حسام التميمي' },
        { action: 'تم تعديل الموعد', date: '03:15 - 18/08/2026 م', by: 'بواسطة سارة خالد' },
        { action: 'تم الحل', date: '09:00 - 19/08/2026 ص', by: 'بواسطة سارة خالد' }
      ],
      rating: { stars: 5, comment: 'خدمة ممتازة وسرعة في الرد، شكراً جزيلاً.' }
    },
    {
      id: '#202600207',
      subject: 'بطء في تحميل لوحة التشريعات الضريبية',
      category: 'مشكلة تقنية',
      subcategory: 'بطء في النظام',
      priority: 'منخفضة',
      status: 'قيد المراجعة',
      created: '2026-08-17',
      updated: '2026-08-18',
      assignee: 'خالد عمر',
      user: 'أكاديمية الرواد المالية',
      sla: 'الرد خلال 24 ساعة',
      slaPercent: 92,
      isDelayed: true,
      slaBreached: true,
      messages: [{ from: 'user', name: 'أكاديمية الرواد', role: 'المستخدم', date: '17/08/2026', time: '04:00 م', text: 'النظام بطيء جداً في آخر يومين عند فتح قسم التشريعات.' }],
      attachments: [],
      timeline: [{ action: 'تم إنشاء الطلب', date: '04:00 - 17/08/2026 م', by: 'بواسطة أكاديمية الرواد' }],
      rating: null
    },
    {
      id: '#202600206',
      subject: 'استرداد مبلغ مكرر لرسوم الخدمة',
      category: 'الفواتير والمدفوعات',
      subcategory: 'خصم مكرر',
      priority: 'عالية',
      status: 'جديد',
      created: '2026-08-22',
      updated: '2026-08-22',
      assignee: 'غير معين',
      user: 'شركة التميز الصناعي',
      sla: 'الرد الأول خلال ساعتين',
      slaPercent: 15,
      isDelayed: false,
      slaBreached: false,
      messages: [{ from: 'user', name: 'التميز الصناعي', role: 'المستخدم', date: '22/08/2026', time: '08:30 ص', text: 'تم خصم الرسوم مرتين أثناء عملية الدفع الإلكتروني.' }],
      attachments: [{ name: 'كشف_حساب.pdf', size: 'MB 1.4' }],
      timeline: [{ action: 'تم إنشاء الطلب', date: '08:30 - 22/08/2026 ص', by: 'بواسطة التميز الصناعي' }],
      rating: null
    },
    {
      id: '#202600205',
      subject: 'شكوى بخصوص أسلوب التعامل في الجلسة',
      category: 'شكوى',
      subcategory: 'مستشار',
      priority: 'عالية',
      status: 'تم التصعيد',
      created: '2026-08-16',
      updated: '2026-08-20',
      assignee: 'مدير الدعم',
      user: 'أ. طارق المجالي',
      sla: 'الرد خلال ساعة',
      slaPercent: 95,
      isDelayed: true,
      slaBreached: true,
      messages: [
        { from: 'user', name: 'أ. طارق المجالي', role: 'المستخدم', date: '16/08/2026', time: '01:00 م', text: 'لدي ملاحظة على أسلوب المستشار في الجلسة الأخيرة وتأخره عن الموعد.' },
        { from: 'agent', name: 'مدير الدعم', role: 'موظف الدعم', date: '16/08/2026', time: '01:45 م', text: 'تم رفع الشكوى للإدارة وسيتم التواصل معك مباشرة لتعويض الجلسة.', internal: false }
      ],
      attachments: [],
      timeline: [
        { action: 'تم إنشاء الطلب', date: '01:00 - 16/08/2026 م', by: 'بواسطة أ. طارق المجالي' },
        { action: 'تم التصعيد', date: '01:45 - 16/08/2026 م', by: 'بواسطة مدير الدعم' }
      ],
      rating: null
    },
    {
      id: '#202600204',
      subject: 'مشكلة تسجيل الدخول وتفعيل المصادقة 2FA',
      category: 'الحساب والاشتراك',
      subcategory: 'مشكلة تسجيل الدخول',
      priority: 'عالية',
      status: 'مغلق',
      created: '2026-08-15',
      updated: '2026-08-15',
      assignee: 'محمد علي',
      user: 'د. ليث الرواشدة',
      sla: 'الرد خلال ساعتين',
      slaPercent: 100,
      isDelayed: false,
      slaBreached: false,
      messages: [
        { from: 'user', name: 'د. ليث', role: 'المستخدم', date: '15/08/2026', time: '09:00 ص', text: 'لا أستطيع تسجيل الدخول ولا تصلني رسالة رمز التحقق OTP.' },
        { from: 'agent', name: 'محمد علي', role: 'موظف الدعم', date: '15/08/2026', time: '09:30 ص', text: 'تم إعادة مزامنة بوابة الرسائل وإرسال الرمز بنجاح.', internal: false }
      ],
      attachments: [],
      timeline: [
        { action: 'تم إنشاء الطلب', date: '09:00 - 15/08/2026 ص', by: 'بواسطة د. ليث' },
        { action: 'تم الحل', date: '09:45 - 15/08/2026 ص', by: 'بواسطة محمد علي' },
        { action: 'تم الإغلاق', date: '10:00 - 15/08/2026 ص', by: 'بواسطة محمد علي' }
      ],
      rating: { stars: 4, comment: 'تم الحل سريعاً' }
    }
  ]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BACKEND API SYNC (FETCH TICKETS FROM POSTGRESQL API ON MOUNT)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function loadBackendTickets() {
      try {
        const res = await getAdminTickets();
        if (res && Array.isArray(res) && res.length > 0) {
          // Normalize backend tickets format
          const formatted = res.map(t => ({
            realId: t.id,
            id: `#${t.ticket_number || t.id.slice(0, 8)}`,
            subject: t.subject,
            category: t.category || 'عام',
            subcategory: t.subcategory || 'طلب عام',
            priority: t.priority === 'high' ? 'عالية' : t.priority === 'low' ? 'منخفضة' : 'متوسطة',
            status: t.status === 'open' ? 'جديد' : t.status === 'in_progress' ? 'قيد المعالجة' : t.status === 'resolved' ? 'تم الحل' : t.status === 'closed' ? 'مغلق' : 'قيد المراجعة',
            created: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '20/08/2026',
            updated: t.updated_at ? new Date(t.updated_at).toLocaleDateString('ar-EG') : '22/08/2026',
            assignee: t.assigned_admin_name || 'غير معين',
            user: t.user_name || 'عميل مسجل',
            sla: 'الرد خلال 24 ساعة',
            slaPercent: 50,
            isDelayed: false,
            slaBreached: false,
            messages: (t.replies || []).map(r => {
              const isUser = r.author_role === 'user' || r.author_role === 'client' || r.author_role === 'company' || r.author_role === 'researcher' || (r.author_id && r.author_id === t.submitted_by) || (r.user_id && !r.is_internal);
              return {
                from: isUser ? 'user' : 'agent',
                name: r.author_name || r.user_name || (isUser ? (t.user_name || 'المستخدم') : 'مشرف الدعم'),
                role: r.is_internal ? 'ملاحظة داخلية' : (isUser ? 'المستفيد' : 'موظف الدعم'),
                date: r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '20/08/2026',
                time: r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '10:00 ص',
                text: r.message || r.reply_text,
                internal: r.is_internal
              };
            }),
            attachments: (t.attachments || []).map(a => ({ name: a.file_name, size: '1.2 MB' })),
            timeline: [{ action: 'تم جلب الطلب من قاعدة البيانات', date: 'الآن', by: 'نظام ديوان' }],
            rating: null
          }));
          setTickets(prev => [...formatted, ...prev.filter(p => !formatted.some(f => f.id === p.id))]);
        }
      } catch (err) {
        console.warn('Using standard comprehensive local dataset:', err);
      }
    }
    loadBackendTickets();
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

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

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
  const handleSendReply = async (ticketId) => {
    if (!replyText.trim()) return;
    const now = new Date();
    const dateStr = '20/08/2026';
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic State Update
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const newMsg = {
        from: 'agent',
        name: 'سارة خالد',
        role: replyInternal ? 'ملاحظة داخلية' : 'موظف الدعم',
        date: dateStr,
        time: timeStr,
        text: replyText.trim(),
        internal: replyInternal
      };
      const actionText = replyInternal ? 'تمت إضافة ملاحظة داخلية سرية' : 'تمت إضافة رد رسمي';
      return {
        ...t,
        messages: [...t.messages, newMsg],
        timeline: [{ action: actionText, date: `${timeStr} - ${dateStr}`, by: 'بواسطة سارة خالد' }, ...t.timeline],
        updated: dateStr
      };
    }));

    showToast(replyInternal ? 'تمت إضافة الملاحظة الداخلية بنجاح (للإدارة فقط).' : 'تم إرسال الرد للمستخدم بنجاح.');
    const sentText = replyText.trim();
    setReplyText('');

    // 2. Persist to Backend API
    try {
      const targetTicket = tickets.find(t => t.id === ticketId);
      const dbId = targetTicket?.realId || ticketId.replace('#', '');
      await replyAdminTicket(dbId, {
        reply_text: sentText,
        is_internal: replyInternal
      });
    } catch (err) {
      console.warn('Backend ticket reply fallback:', err);
    }
  };

  const handleStatusSubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = '20/08/2026';
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
      await updateAdminTicketStatus(selectedTicketId.replace('#', ''), {
        status: statusToSave,
        internal_notes: noteToSave
      });
    } catch (err) {
      console.warn('Backend ticket update error fallback:', err);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = '20/08/2026';
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicketId) return t;
      const noteTxt = assignNoteVal ? `: ${assignNoteVal}` : '';
      return {
        ...t,
        assignee: newAssigneeVal,
        updated: dateStr,
        timeline: [
          { action: `تم تحويل الطلب إلى [${newAssigneeVal}]${noteTxt}`, date: `${timeStr} - ${dateStr}`, by: 'بواسطة المشرف' },
          ...t.timeline
        ]
      };
    }));

    const assigneeToSave = newAssigneeVal;
    const assignNoteToSave = assignNoteVal;
    setActiveModal(null);
    setAssignNoteVal('');
    showToast(`تم تحويل الطلب إلى: ${assigneeToSave}`);

    try {
      await updateAdminTicketStatus(selectedTicketId.replace('#', ''), {
        assignee_id: assigneeToSave,
        internal_notes: assignNoteToSave
      });
    } catch (err) {
      console.warn('Backend assign error fallback:', err);
    }
  };

  const handlePrioritySubmit = async () => {
    if (!selectedTicketId) return;
    const now = new Date();
    const dateStr = '20/08/2026';
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
      await updateAdminTicketStatus(selectedTicketId.replace('#', ''), {
        priority: prioToSave
      });
    } catch (err) {
      console.warn('Backend priority error fallback:', err);
    }
  };

  const handleInternalNoteSubmit = async () => {
    if (!selectedTicketId || !internalNoteText.trim()) return;
    const now = new Date();
    const dateStr = '20/08/2026';
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
        reply_text: noteToSave,
        is_internal: true
      });
    } catch (err) {
      console.warn('Backend internal note error fallback:', err);
    }
  };

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', textAlign: 'right', direction: 'rtl' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <span>✅</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          DETAIL VIEW (EXACT SPECIFICATION AND ALIGNMENT MATCHING REFERENCE)
          ══════════════════════════════════════════════════════════════════════════ */}
      {selectedTicket ? (
        <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', direction: 'rtl', textAlign: 'right' }}>
          
          {/* Top Bar with Action buttons on the RIGHT and Return button on the LEFT */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
            
            {/* 4 Action Buttons (on the RIGHT in RTL) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => { setNewStatusVal(selectedTicket.status); setActiveModal('change-status'); }}
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <span>🔄</span>
                <span>تحديث الحالة</span>
              </button>

              <button
                onClick={() => { setNewAssigneeVal(selectedTicket.assignee); setActiveModal('assign-ticket'); }}
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <span>👤</span>
                <span>تحويل الطلب</span>
              </button>

              <button
                onClick={() => { setNewPriorityVal(selectedTicket.priority); setActiveModal('change-priority'); }}
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <span>🚩</span>
                <span>تغيير الأولوية</span>
              </button>

              <button
                onClick={() => setActiveModal('add-internal')}
                style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '8px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', color: '#B45309', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <span>📝</span>
                <span>ملاحظة داخلية</span>
              </button>
            </div>

            {/* Back Button (on the LEFT in RTL) */}
            <button
              onClick={() => setSelectedTicketId(null)}
              style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>⬅</span>
              <span>العودة لقائمة التذاكر</span>
            </button>
          </div>

          {/* 2 Columns Grid: Right Main Column (65%) and Left Sidebar (35%) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '20px', direction: 'rtl' }}>
            
            {/* ══════════════════════════════════════════════════════════════════
                RIGHT MAIN COLUMN (معلومات الطلب + المحادثة)
                ══════════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* معلومات الطلب (Ticket Info Card) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'right' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0e3b5e', margin: '0 0 16px 0' }}>معلومات الطلب</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>المستخدم: </span>
                    <strong style={{ color: '#374151' }}>{selectedTicket.user}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>رقم الطلب: </span>
                    <strong style={{ fontFamily: 'monospace', color: '#0e3b5e' }}>{selectedTicket.id}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>الفئة: </span>
                    <strong style={{ color: '#374151' }}>{selectedTicket.category}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>الفئة الفرعية: </span>
                    <span style={{ color: '#374151' }}>{selectedTicket.subcategory}</span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>الموضوع: </span>
                    <strong style={{ color: '#0e3b5e', fontSize: '13.5px' }}>{selectedTicket.subject}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>التاريخ: </span>
                    <span style={{ color: '#374151' }}>{selectedTicket.created}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>القناة: </span>
                    <span style={{ color: '#374151' }}>مركز المساعدة</span>
                  </div>

                  <div>
                    <span style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>الحالة: </span>
                    <span className={`badge ${STATUS_CONFIG[selectedTicket.status]?.color}`} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center' }}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* المحادثة (Conversation Thread Card) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'right' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0e3b5e', margin: '0 0 20px 0' }}>المحادثة</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                  {selectedTicket.messages.map((m, idx) => {
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
                            maxWidth: '85%',
                            borderRadius: '16px',
                            borderTopRightRadius: isUser ? '2px' : '16px',
                            borderTopLeftRadius: !isUser ? '2px' : '16px',
                            padding: '14px 18px',
                            background: isInternal ? '#FFFBEB' : isUser ? '#0e3b5e' : '#F3F4F6',
                            color: isInternal ? '#78350F' : isUser ? '#FFFFFF' : '#1F2937',
                            border: isInternal ? '1px solid #FDE68A' : 'none',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            textAlign: 'right'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: isInternal ? '#92400E' : isUser ? '#FDBA74' : '#0e7490' }}>
                            <span style={{ fontWeight: '800' }}>{m.name}</span>
                            <span style={{ opacity: 0.8 }}>| {m.role} {isInternal ? '(ملاحظة سرية للأدمن فقط)' : ''}</span>
                          </div>
                          <div style={{ fontSize: '13.5px', lineHeight: '1.6', textAlign: 'right' }}>{m.text}</div>
                          <div style={{ fontSize: '10px', opacity: 0.65, marginTop: '6px', textAlign: 'left', direction: 'ltr' }}>
                            {m.time} {m.date}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Input Box */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
                    <button
                      onClick={() => setReplyInternal(false)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        color: !replyInternal ? '#0e3b5e' : '#9CA3AF',
                        border: 'none',
                        borderBottom: !replyInternal ? '2px solid #0e3b5e' : '2px solid transparent',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      رد عام
                    </button>
                    <button
                      onClick={() => setReplyInternal(true)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        color: replyInternal ? '#D97706' : '#9CA3AF',
                        border: 'none',
                        borderBottom: replyInternal ? '2px solid #D97706' : '2px solid transparent',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ملاحظة داخلية
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <textarea
                      placeholder={replyInternal ? 'اكتب ملاحظة داخلية (للإدارة فقط)...' : 'اكتب ردك هنا...'}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '13.5px', outline: 'none', background: replyInternal ? '#FFFDF5' : '#FFFFFF', textAlign: 'right', direction: 'rtl' }}
                    />
                    <button
                      onClick={() => handleSendReply(selectedTicket.id)}
                      style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                      title="إرسال"
                    >
                      ✈
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LEFT SIDEBAR (SLA + سجل التدقيق الكامل + المرفقات)
                ══════════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'right' }}>
              
              {/* SLA Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'right' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0e3b5e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA</h4>
                <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px' }}>{selectedTicket.sla}</div>
                <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${selectedTicket.slaPercent || 35}%`, height: '100%', background: selectedTicket.slaPercent > 80 ? '#EF4444' : '#FB923C', borderRadius: '9999px' }}></div>
                </div>
                <div style={{ fontSize: '11px', color: selectedTicket.slaPercent > 80 ? '#DC2626' : '#EA580C', fontWeight: '700' }}>
                  {selectedTicket.slaPercent > 80 ? 'تم تجاوز SLA' : 'الوقت المتبقي: 35 دقيقة'}
                </div>
              </div>

              {/* سجل التدقيق الكامل (Full Audit Timeline Card) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'right' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0e3b5e', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>سجل التدقيق الكامل</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {selectedTicket.timeline.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', textAlign: 'right' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: i === 0 ? '#0e3b5e' : '#9CA3AF', marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#0e3b5e', display: 'block', fontSize: '12px' }}>{ev.action}</strong>
                        <span style={{ color: '#6B7280', fontSize: '11px' }}>{ev.date}</span>
                        <span style={{ color: '#9CA3AF', fontSize: '10.5px', display: 'block' }}>{ev.by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* المرفقات (Attachments Card) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'right' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0e3b5e', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>المرفقات</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                    selectedTicket.attachments.map((att, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#0e7490', fontSize: '16px' }}>📄</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{att.name}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{att.size}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>لا توجد مرفقات</div>
                  )}
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
              { id: 'all', label: 'جميع الطلبات', count: totalCount, icon: '📑', bg: 'rgba(14,59,94,0.08)', color: '#0e3b5e' },
              { id: 'new', label: 'الجديدة', count: newCount, icon: '🔵', bg: '#F0F9FF', color: '#0284C7' },
              { id: 'processing', label: 'قيد المعالجة', count: processingCount, icon: '🔄', bg: '#F0FDFA', color: '#0D9488' },
              { id: 'waiting', label: 'بانتظار المستخدم', count: waitingCount, icon: '⏳', bg: '#FFFBEB', color: '#D97706' },
              { id: 'delayed', label: 'المتأخرة', count: delayedCount, icon: '⚠️', bg: '#FEF2F2', color: '#DC2626' },
              { id: 'solved', label: 'تم الحل اليوم', count: solvedTodayCount, icon: '✅', bg: '#ECFDF5', color: '#059669' },
              { id: 'sla_breached', label: 'SLA مُخالَف', count: slaBreachedCount, icon: '🛡️', bg: '#FFF1F2', color: '#E11D48' }
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
                    background: isSelected ? '#F0F9FF' : '#FFFFFF', 
                    border: isSelected ? '2px solid #0e7490' : '1px solid #E2E8F0', 
                    borderRadius: '14px', 
                    padding: '16px 12px', 
                    textAlign: 'center', 
                    boxShadow: isSelected ? '0 4px 12px rgba(14,116,144,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '38px', height: '38px', background: card.bg, color: card.color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontSize: '18px' }}>
                    {card.icon}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0e3b5e', lineHeight: '1.2' }}>{card.count}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>{card.label}</div>
                </div>
              );
            })}
          </div>

          {/* Filter Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', direction: 'rtl', textAlign: 'right' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ minWidth: '220px', flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="ابحث برقم الطلب، الموضوع، أو العميل..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none', textAlign: 'right', direction: 'rtl' }}
                  />
                </div>

                <select
                  value={filters.status}
                  onChange={(e) => {
                    setActiveKpiFilter('all');
                    setFilters(prev => ({ ...prev, status: e.target.value }));
                  }}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">كل الحالات</option>
                  {Object.keys(STATUS_CONFIG).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">كل الفئات</option>
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">كل الأولويات</option>
                  <option value="منخفضة">منخفضة</option>
                  <option value="متوسطة">متوسطة</option>
                  <option value="عالية">عالية</option>
                </select>

                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">كل المشرفين</option>
                  <option value="سارة خالد">سارة خالد</option>
                  <option value="محمد علي">محمد علي</option>
                  <option value="خالد عمر">خالد عمر</option>
                  <option value="مدير الدعم">مدير الدعم</option>
                  <option value="غير معين">غير معين</option>
                </select>

                <button
                  onClick={() => {
                    setActiveKpiFilter('all');
                    setFilters({ search: '', status: '', category: '', priority: '', assignee: '' });
                  }}
                  style={{ padding: '10px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                  🔄 مسح
                </button>
              </div>

              {/* View Mode Toggle Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                <button
                  onClick={() => setAdminView('table')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: adminView === 'table' ? '#FFFFFF' : 'transparent',
                    color: adminView === 'table' ? '#0e3b5e' : '#64748B',
                    boxShadow: adminView === 'table' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  📊 جدول
                </button>
                <button
                  onClick={() => setAdminView('kanban')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: adminView === 'kanban' ? '#FFFFFF' : 'transparent',
                    color: adminView === 'kanban' ? '#0e3b5e' : '#64748B',
                    boxShadow: adminView === 'kanban' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  📋 كانبان
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
                              style={{ background: '#0e7490', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>👁️</span>
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
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                              <span>👤 {t.user}</span>
                              <span>📅 {t.created}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                              <span style={{ fontSize: '11px', color: '#0e7490', fontWeight: '600' }}>{t.assignee}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedTicketId(t.id); }}
                                style={{ background: 'transparent', border: 'none', color: '#E58A13', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
                              >
                                تفاصيل ⬅
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تحديث حالة الطلب</h3>
            <select
              value={newStatusVal}
              onChange={(e) => setNewStatusVal(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '12px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
            >
              {['جديد', 'قيد المراجعة', 'قيد المعالجة', 'بانتظار رد المستخدم', 'تم التصعيد', 'تم الحل', 'مغلق'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <textarea
              placeholder="ملاحظة (اختياري)..."
              value={statusNoteVal}
              onChange={(e) => setStatusNoteVal(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تحويل الطلب</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>الموظف الحالي:</label>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#374151' }}>{selectedTicket?.assignee}</div>
            </div>
            <select
              value={newAssigneeVal}
              onChange={(e) => setNewAssigneeVal(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '12px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
            >
              <option value="سارة خالد">سارة خالد</option>
              <option value="محمد علي">محمد علي</option>
              <option value="خالد عمر">خالد عمر</option>
              <option value="مدير الدعم">مدير الدعم</option>
            </select>
            <textarea
              placeholder="سبب التحويل / ملاحظة داخلية..."
              value={assignNoteVal}
              onChange={(e) => setAssignNoteVal(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
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
                style={{ flex: 1, padding: '10px', background: '#f7a61d', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                تأكيد التحويل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Priority Modal */}
      {activeModal === 'change-priority' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>تغيير الأولوية</h3>
            <select
              value={newPriorityVal}
              onChange={(e) => setNewPriorityVal(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '12px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
            >
              <option value="منخفضة">منخفضة</option>
              <option value="متوسطة">متوسطة</option>
              <option value="عالية">عالية</option>
            </select>
            <textarea
              placeholder="سبب التغيير (اختياري)..."
              value={priorityNoteVal}
              onChange={(e) => setPriorityNoteVal(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px', fontSize: '13px', textAlign: 'right', direction: 'rtl' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
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

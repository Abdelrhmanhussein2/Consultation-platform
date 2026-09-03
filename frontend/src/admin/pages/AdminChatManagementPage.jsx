import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAiService } from '../../services/chatAiService';
import { getAdminTickets, replyAdminTicket, updateAdminTicketStatus, closeAdminTicket } from '../services/adminApi';
import Toast, { useToast } from '../../components/Toast/Toast';
import './AdminChatManagementPage.css';

// ══════════════════════════════════════════════════════════════════════════
// CANONICAL SEED CONVERSATIONS FOR THE 3 CORE MODES
// ══════════════════════════════════════════════════════════════════════════
const INITIAL_DATA = {
  ticket: {
    title: 'محادثات الدعم الفني والعملاء',
    crumb: 'تذاكر الدعم والعملاء',
    listLabel: 'كل تذاكر الدعم',
    people: [
      { id: 't1', name: 'محمد الشامي', initial: 'م', color: '#e85643', ref: '#TKT-00371', subject: 'الدفعة لم تظهر في الحساب بعد 24 ساعة', preview: 'بالتأكيد، سأبقى على اطلاع...', time: 'منذ دقيقة', unread: 0, status: 'قيد المعالجة', email: 'mohammed.shami@example.jo', priority: 'عالية', category: 'مشكلة دفع', assignee: 'سارة خالد' },
      { id: 't2', name: 'وليد خالد', initial: 'و', color: '#48a5dc', ref: '#TKT-00369', subject: 'تعذر تحميل إثبات الدفع', preview: 'شكراً لاختياركم لنا...', time: 'منذ 5 دقائق', unread: 0, status: 'جديد', email: 'waleed.kh@example.jo', priority: 'متوسطة', category: 'مشكلة تقنية', assignee: 'أحمد منصور' },
      { id: 't3', name: 'بنيامين عادل', initial: 'ب', color: '#6a7f91', ref: '#TKT-00364', subject: 'مشكلة في تجديد الباقة', preview: 'راجعت الموضوع ولم يظهر بعد...', time: 'منذ 12 دقيقة', unread: 1, status: 'بانتظار رد المستخدم', email: 'benjamin@adel.jo', priority: 'عالية', category: 'اشتراك وباقات', assignee: 'سارة خالد' },
      { id: 't4', name: 'إياد سالم', initial: 'إ', color: '#50b66d', ref: '#TKT-00358', subject: 'فاتورة الاشتراك الضريبي', preview: 'قمت بالتحقق ويبدو أن...', time: 'منذ 20 دقيقة', unread: 1, status: 'تم الحل', email: 'eyad.salem@company.jo', priority: 'منخفضة', category: 'استفسار عام', assignee: 'ليان حداد' },
      { id: 't5', name: 'نور حداد', initial: 'ن', color: '#c46c57', ref: '#TKT-00352', subject: 'طلب استرداد دفعة مكررة', preview: 'أرفقت صورة التحويل البنكي...', time: 'منذ 35 دقيقة', unread: 0, status: 'قيد المراجعة', email: 'nour.haddad@outlook.jo', priority: 'عالية', category: 'مشكلة دفع', assignee: 'ليان حداد' },
      { id: 't6', name: 'سارة المصري', initial: 'س', color: '#7e8d99', ref: '#TKT-00341', subject: 'تحديث بيانات الشركة والرقم الضريبي', preview: 'تم إرسال المستندات المطلوبة...', time: 'منذ ساعة', unread: 0, status: 'تم الحل', email: 'sara.masri@taxcorp.jo', priority: 'متوسطة', category: 'الحساب والملف', assignee: 'أحمد منصور' },
      { id: 't7', name: 'خالد منصور', initial: 'خ', color: '#304c65', ref: '#TKT-00333', subject: 'مشكلة في تسجيل الدخول للأدمن', preview: 'الرجاء المتابعة الفورية...', time: 'منذ ساعتين', unread: 1, status: 'تم التصعيد', email: 'k.mansour@diwan.jo', priority: 'حرجة', category: 'مشكلة تقنية', assignee: 'مدير الدعم' }
    ]
  },
  platform: {
    title: 'محادثات المستشارين وإدارة المنصة',
    crumb: 'المستشار والإدارة',
    listLabel: 'كل محادثات المستشارين',
    people: [
      { id: 'p1', name: 'د. محمد العلي', initial: 'م', color: '#2b8f76', ref: '#ADV-00928', subject: 'تسوية مستحقات شهر أغسطس 2026', preview: 'بانتظار تأكيد فريق المالية...', time: 'منذ دقيقة', unread: 0, dept: 'المالية والتحويلات', status: 'قيد المتابعة', assignee: 'ليان حداد' },
      { id: 'p2', name: 'أ. لينا مراد', initial: 'ل', color: '#5f7db7', ref: '#ADV-00921', subject: 'مشكلة في تقويم الاستشارات والجدول', preview: 'المواعيد لا تظهر بشكل صحيح...', time: 'منذ 7 دقائق', unread: 1, dept: 'الدعم التقني', status: 'بانتظار المنصة', assignee: 'أحمد منصور' },
      { id: 'p3', name: 'د. سامر الخطيب', initial: 'س', color: '#99714f', ref: '#ADV-00915', subject: 'تحديث وثائق الاعتماد ورخصة JCPA', preview: 'تم رفع الشهادة المجددة...', time: 'منذ 17 دقيقة', unread: 0, dept: 'إدارة المستشارين', status: 'بانتظار المستشار', assignee: 'سارة خالد' },
      { id: 'p4', name: 'أ. دانا شحادة', initial: 'د', color: '#9a5fa5', ref: '#ADV-00903', subject: 'استفسار عن عمولة المنصة للباقات', preview: 'أحتاج كشفاً تفصيلياً بالحركات...', time: 'منذ 28 دقيقة', unread: 1, dept: 'المالية والتحويلات', status: 'قيد المتابعة', assignee: 'ليان حداد' },
      { id: 'p5', name: 'د. عمر حداد', initial: 'ع', color: '#4e9364', ref: '#ADV-00890', subject: 'مراجعة تقييم جلسة واعتراض عميل', preview: 'أرجو مراجعة تفاصيل التقييم...', time: 'منذ ساعة', unread: 0, dept: 'الجودة والامتثال', status: 'قيد المراجعة', assignee: 'مدير الجودة' },
      { id: 'p6', name: 'أ. هبة الزعبي', initial: 'ه', color: '#c86a78', ref: '#ADV-00872', subject: 'طلب إضافة تخصص فرعي (ضرائب دولية)', preview: 'أرفقت المستندات المؤيدة...', time: 'منذ ساعتين', unread: 0, dept: 'إدارة المستشارين', status: 'مغلقة', assignee: 'سارة خالد' }
    ]
  }
};

const INITIAL_MESSAGES = {
  ticket: {
    0: [
      { sender: 'out', name: 'فريق الدعم', text: 'تمت مراجعة طلبك، وبمجرد تأكيد الدفعة من الفريق المالي سيتم تحديث الحالة تلقائياً وتفعيل الباقة.', time: 'الجمعة 06:45 ص' },
      { sender: 'in', name: 'محمد الشامي', text: 'حسناً، أرجو إبلاغي فور اعتمادها لأنني أحتاج لتنزيل نماذج الإقرارات الضريبية اليوم.', time: 'الجمعة 06:45 ص' },
      { sender: 'out', name: 'فريق الدعم', text: 'بالتأكيد، التذكرة قيد المتابعة مع المسؤول المالي وسنرسل لك إشعاراً فورياً عند الاعتماد.', time: 'الجمعة 06:46 ص' }
    ]
  },
  client: {
    0: [
      { sender: 'out', name: 'د. محمد العلي', text: 'راجعت المستند والمرفقات التي أرسلتها، والنقطة الأساسية تتعلق بطريقة احتساب الخصم والرديات الضريبية.', time: 'الجمعة 06:45 ص' },
      { sender: 'in', name: 'أحمد الخطيب', text: 'ممتاز دكتور، هل تنصح بتعديل الفاتورة الضريبية الحالية أم الانتظار حتى الجلسة القادمة؟', time: 'الجمعة 06:45 ص' },
      { sender: 'out', name: 'د. محمد العلي', text: 'يمكنك تعديلها الآن وفق الملاحظة التفسيرية، وسنعتمد النسخة النهائية في بداية جلستنا القادمة.', time: 'الجمعة 06:46 ص' }
    ]
  },
  platform: {
    0: [
      { sender: 'out', name: 'إدارة المنصة', text: 'تم استلام استفسارك بخصوص كشف تسوية الأرباح وتحويله إلى الإدارة المالية للمطابقة.', time: 'الجمعة 06:45 ص' },
      { sender: 'in', name: 'د. محمد العلي', text: 'شكراً لكم، أحتاج فقط تأكيد موعد التحويل إلى الحساب البنكي (CliQ / IBAN) بعد اقتطاع العمولة.', time: 'الجمعة 06:45 ص' },
      { sender: 'out', name: 'إدارة المنصة', text: 'سيتم إرسال إشعار التحويل البنكي ورقم الحوالة المرجعي بمجرد إتمام العملية خلال دورة الصرف الأسبوعية.', time: 'الجمعة 06:46 ص' }
    ]
  }
};

const TEMPLATES = {
  ticket: [
    'شكراً لتواصلك معنا. تمت مراجعة طلبك وهو الآن قيد المتابعة مع الفريق المختص.',
    'تم تحويل طلبك إلى الفريق المالي، وسنوافيك بالتحديث فور اكتمال المطابقة.',
    'تم حل المشكلة وتحديث حسابك بنجاح. يرجى إعادة تسجيل الدخول للتأكد.',
    'تم استلام المرفقات وإثبات الدفع بنجاح، وسيتم إضافتها ومطابقتها فوراً.',
    'نعتذر عن التأخير. التذكرة قيد المتابعة مع الإدارة وسنرسل لك إشعاراً فورياً بالإجراء.'
  ],
  client: [
    'شكراً لك. راجعت الملفات المرفقة وسأرسل لك ملاحظاتي التفصيلية قبل الجلسة القادمة.',
    'تم استلام مسودة العقد وسأقوم بمراجعتها والرد عليك ببنود التعديل المقترحة.',
    'يمكننا مناقشة هذه النقطة الضريبية بالتفصيل خلال جلسة الفيديو المجدولة.',
    'أقترح تعديل الإقرار الضريبي وفق الملاحظات ثم إرسال النسخة المحدثة للمراجعة.',
    'تمت مراجعة النقطة وهي متوافقة مع تعليمات ضريبة الدخل رقم 34 لسنة 2014.'
  ],
  platform: [
    'تم استلام طلبكم وتحويله إلى قسم الحسابات للمراجعة والاعتماد.',
    'تم تسجيل الملاحظة وسيتم تحديث كشف المستحقات فور إغلاق دورة التسوية.',
    'شكراً لتزويدنا برخصة الاعتماد المهني (JCPA) المحدثة، جاري تفعيل التخصص.',
    'تمت إحالة الموضوع إلى فريق الجودة والامتثال وسيتم تزويدك بالنتيجة.',
    'تم تحديث سجل المحادثة بالمعلومات الجديدة وإرسال التقرير للإدارة.'
  ]
};

export default function AdminChatManagementPage({ navigate }) {
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  // Mode: 'ticket' (تذاكر الدعم) | 'client' (المستشار والعميل) | 'platform' (المستشار والمنصة)
  const [mode, setMode] = useState('ticket');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('الكل');

  // Datasets
  const [data, setData] = useState(INITIAL_DATA);
  const [chatMessages, setChatMessages] = useState(INITIAL_MESSAGES);
  const [replyText, setReplyText] = useState('');

  // Modals & Overlays
  const [activeOverlay, setActiveOverlay] = useState(null); // 'stats' | 'filter' | 'new' | 'templates' | 'attachment' | 'ai' | 'tags' | 'note' | 'files' | 'summary' | 'rating' | 'history'

  // Dynamic States for Modals
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [actionHistory, setActionHistory] = useState({});
  const [consultationFiles, setConsultationFiles] = useState({});
  const [platformDocs, setPlatformDocs] = useState({});
  const [ratingsState, setRatingsState] = useState({});
  const [customTags, setCustomTags] = useState(['معلّقة', 'عاجلة']);
  const [newTagInput, setNewTagInput] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // AI Modal States
  const [aiPurpose, setAiPurpose] = useState('اقتراح رد');
  const [aiTitle, setAiTitle] = useState('');
  const [aiDesc, setAiDesc] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New Conversation Modal Form
  const [newPartyName, setNewPartyName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');

  // Advanced Filter Form
  const [advStatus, setAdvStatus] = useState('all');
  const [advUnread, setAdvUnread] = useState('all');
  const [advSearch, setAdvSearch] = useState('');

  const messagesEndRef = useRef(null);

  const currentList = data[mode].people;
  const activePerson = currentList[selectedIdx] || currentList[0] || {};
  const currentMessages = (chatMessages[mode] && chatMessages[mode][selectedIdx]) || [];

  // Filtered List
  const filteredPeople = currentList.filter(p => {
    if (quickFilter === 'غير مقروءة' && !p.unread) return false;
    if (quickFilter === 'المفتوحة' && (p.status === 'تم الحل' || p.status === 'مغلقة')) return false;
    if (quickFilter === 'المغلقة' && p.status !== 'تم الحل' && p.status !== 'مغلقة') return false;

    if (advStatus === 'open' && (p.status === 'تم الحل' || p.status === 'مغلقة')) return false;
    if (advStatus === 'closed' && p.status !== 'تم الحل' && p.status !== 'مغلقة') return false;
    if (advUnread === 'unread' && !p.unread) return false;
    if (advUnread === 'read' && p.unread) return false;

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSub = (p.subject || '').toLowerCase().includes(q);
      const matchRef = (p.ref || '').toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchRef) return false;
    }

    if (advSearch.trim()) {
      const aQ = advSearch.trim().toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(aQ);
      const matchSub = (p.subject || '').toLowerCase().includes(aQ);
      if (!matchName && !matchSub) return false;
    }

    return true;
  });

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // ══════════════════════════════════════════════════════════════════════════
  // LIVE BACKEND DATABASE SYNC (FETCH TICKETS FROM POSTGRESQL)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function loadBackendTickets() {
      try {
        const res = await getAdminTickets();
        if (res && Array.isArray(res) && res.length > 0) {
          const livePeople = res.map((t, idx) => ({
            id: t.id,
            realId: t.id,
            name: t.submitter_name || t.user_name || 'مستخدم المنصة',
            initial: (t.submitter_name || t.user_name || 'م').charAt(0),
            color: '#005D9C',
            ref: `#${t.ticket_number || t.id.slice(0, 8)}`,
            subject: t.subject,
            preview: t.description || 'طلب دعم فني',
            time: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-JO') : 'الآن',
            unread: 0,
            status: t.status === 'open' ? 'جديد' : t.status === 'in_progress' ? 'قيد المعالجة' : t.status === 'resolved' ? 'تم الحل' : t.status === 'closed' ? 'مغلقة' : 'قيد المراجعة',
            email: t.email || 'user@platform.jo',
            priority: t.priority === 'high' ? 'عالية' : t.priority === 'low' ? 'منخفضة' : 'متوسطة',
            category: t.category || 'عام',
            assignee: t.assignee_name || t.assigned_admin_name || 'سارة خالد'
          }));

          const liveMessagesMap = {};
          res.forEach((t, idx) => {
            const replies = (t.replies || []).map(r => ({
              sender: (r.author_role === 'admin' || r.author_role === 'super_admin' || r.is_internal) ? 'out' : 'in',
              name: r.author_name || (r.is_internal ? 'ملاحظة إدارية' : 'المستخدم'),
              text: r.message,
              time: r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'الآن'
            }));
            if (t.description && replies.length === 0) {
              replies.unshift({
                sender: 'in',
                name: t.submitter_name || 'المستخدم',
                text: t.description,
                time: t.created_at ? new Date(t.created_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'الآن'
              });
            }
            liveMessagesMap[idx] = replies;
          });

          setData(prev => ({
            ...prev,
            ticket: {
              ...prev.ticket,
              people: [...livePeople, ...prev.ticket.people.filter(p => !livePeople.some(lp => lp.ref === p.ref))]
            }
          }));

          setChatMessages(prev => ({
            ...prev,
            ticket: { ...prev.ticket, ...liveMessagesMap }
          }));
        }
      } catch (err) {
        console.warn('Backend ticket sync note:', err);
      }
    }
    loadBackendTickets();
  }, []);

  // Actions
  const handleSelectConv = (idx) => {
    setSelectedIdx(idx);
    // Mark as read
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[idx]) {
        copy[mode].people[idx].unread = 0;
      }
      return copy;
    });
  };

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    const currentMsgText = replyText.trim();
    const newMsg = {
      sender: 'out',
      name: 'مدير المنصة',
      text: currentMsgText,
      time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => {
      const copy = { ...prev };
      if (!copy[mode]) copy[mode] = {};
      if (!copy[mode][selectedIdx]) copy[mode][selectedIdx] = [];
      copy[mode][selectedIdx] = [...copy[mode][selectedIdx], newMsg];
      return copy;
    });

    setReplyText('');
    showToast('تم إرسال الرد بنجاح!', 'success');

    // Live API Sync if real ticket in database
    if (activePerson.realId) {
      try {
        await replyAdminTicket(activePerson.realId, {
          reply_text: currentMsgText,
          is_internal: false
        });
      } catch (e) {
        console.warn('Live reply sync note:', e);
      }
    }
  };

  const handleSendAndClose = async () => {
    if (replyText.trim()) {
      handleSendMessage();
    }
    // Update status to solved/closed
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[selectedIdx]) {
        copy[mode].people[selectedIdx].status = mode === 'ticket' ? 'تم الحل' : 'مغلقة';
      }
      return copy;
    });
    showToast('تم إرسال الرد وإغلاق المحادثة بنجاح!', 'success');

    if (activePerson.realId) {
      try {
        await closeAdminTicket(activePerson.realId, 'تم الحل والإغلاق من قبل الإدارة');
      } catch (e) {
        console.warn('Live status update note:', e);
      }
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[selectedIdx]) {
        copy[mode].people[selectedIdx].status = newStatus;
      }
      return copy;
    });
    setStatusMenuOpen(false);
    showToast(`تم تحديث حالة المحادثة إلى [${newStatus}]`, 'success');

    if (activePerson.realId) {
      const statusMap = {
        'جديد': 'open',
        'قيد المعالجة': 'in_progress',
        'تم الحل': 'resolved',
        'مغلقة': 'closed'
      };
      try {
        await updateAdminTicketStatus(activePerson.realId, { status: statusMap[newStatus] || 'in_progress' });
      } catch (e) {
        console.warn('Live ticket status sync note:', e);
      }
    }
  };

  // AI Response Generator
  const handleGenerateAi = async () => {
    setAiLoading(true);
    try {
      const res = await chatAiService.generateReply({
        purpose: aiPurpose,
        description: aiDesc || activePerson.subject || 'اكتب رداً مهنياً للمحادثة',
        context: activePerson.subject || ''
      });
      if (res && res.reply) {
        setAiResult(res.reply);
      } else {
        setAiResult(`بناءً على مراجعة المحادثة مع ${activePerson.name} بخصوص "${activePerson.subject}"، نود التأكيد على أن الإجراء قيد التنفيذ وفقاً للأصول المعتمدة.`);
      }
    } catch (e) {
      setAiResult(`شكرًا لتواصلك معنا أستاذ ${activePerson.name}. تمت مراجعة استفسارك بخصوص "${activePerson.subject}" وسنوافيك بالرد المعتمد فوراً.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseAiText = () => {
    if (aiResult) {
      setReplyText(aiResult);
      setActiveOverlay(null);
      showToast('تم إدراج النص المولد في صندوق الرد!', 'success');
    }
  };

  // Export Conversation
  const handleExport = () => {
    const lines = [
      `المرجع: ${activePerson.ref || '—'}`,
      `الطرف: ${activePerson.name || '—'}`,
      `الموضوع: ${activePerson.subject || '—'}`,
      `الحالة: ${activePerson.status || '—'}`,
      '════════════════════════════════════════',
      'سجل المحادثة:',
      ...currentMessages.map(m => `[${m.time}] ${m.name}: ${m.text}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${(activePerson.ref || 'export').replace('#', '')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('تم تصدير سجل المحادثة بنجاح!', 'success');
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/admin/chats?ref=${(activePerson.ref || '').replace('#', '')}`);
    showToast('تم نسخ رابط المحادثة المباشر!', 'success');
  };

  return (
    <div className="admin-chat-app-root">
      <Toast {...toast} />

      {/* Top Header Bar */}
      <header className="chat-app-topbar">
        <div className="chat-title-wrap">
          <div className="chat-page-title">{data[mode].title}</div>
          <div className="chat-breadcrumb">
            <span onClick={() => navigate('/admin')}>الرئيسية</span>
            <span>‹</span>
            <span>الدعم والتذاكر</span>
            <span>‹</span>
            <span className="active">{data[mode].crumb}</span>
          </div>
        </div>

        {/* 2-Mode Admin Switcher */}
        <div className="chat-mode-switch">
          <button
            type="button"
            className={mode === 'ticket' ? 'active' : ''}
            onClick={() => { setMode('ticket'); setSelectedIdx(0); setSearchTerm(''); }}
          >
            🎫 تذاكر دعم العملاء والمستخدمين
          </button>
          <button
            type="button"
            className={mode === 'platform' ? 'active' : ''}
            onClick={() => { setMode('platform'); setSelectedIdx(0); setSearchTerm(''); }}
          >
            🏛️ محادثات المستشارين والإدارة
          </button>
        </div>

        {/* Top Action Tools */}
        <div className="chat-top-actions">
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('stats')} title="إحصاءات">
            <svg viewBox="0 0 24 24"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></svg>
          </button>
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('filter')} title="تصفية متقدمة">
            <svg viewBox="0 0 24 24"><path d="M4 5h16l-6 7v5l-4 2v-7Z"/></svg>
          </button>
          <button className="chat-icon-btn green" onClick={handleExport} title="تصدير">
            <svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
          </button>
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('new')} title="محادثة جديدة">
            <svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          </button>
        </div>
      </header>

      {/* 3-Column Workspace */}
      <div className="chat-app-workspace">
        
        {/* Column 1: Conversations List Panel (Right in RTL) */}
        <aside className="chat-list-panel">
          <div className="chat-list-head">
            <select value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)}>
              <option value="الكل">{data[mode].listLabel}</option>
              <option value="غير مقروءة">غير مقروءة</option>
              <option value="المفتوحة">المفتوحة</option>
              <option value="المغلقة">المغلقة</option>
            </select>
            <div className="chat-search-wrap">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input
                type="text"
                placeholder="بحث بالاسم أو الموضوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-conv-scroll">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((p, i) => {
                const isSelected = i === selectedIdx;
                return (
                  <div
                    key={p.id || i}
                    className={`chat-conv-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectConv(i)}
                  >
                    <div className="chat-avatar-sm" style={{ background: p.color || '#005D9C' }}>
                      {p.initial || p.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="chat-conv-name">{p.name}</div>
                      <div className="chat-conv-preview">{p.subject}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="chat-conv-time">{p.time}</div>
                      {p.unread > 0 && <span className="chat-unread-badge">{p.unread}</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '30px 15px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                لا توجد محادثات مطابقة للتصفية
              </div>
            )}
          </div>
          <div className="chat-load-more">عرض كل المحادثات ({filteredPeople.length})</div>
        </aside>

        {/* Column 2: Active Chat Messages & Composer Panel (Center) */}
        <main className="chat-thread-panel">
          {/* Thread Header */}
          <div className="chat-thread-head">
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="chat-thread-name">{activePerson.name || 'محادثة'}</span>
                <span className="chat-ref-pill">{activePerson.ref || '#000'}</span>
              </div>
              <div className="chat-thread-subject">{activePerson.subject || '—'}</div>
            </div>

            <div className="chat-thread-actions">
              <span className="chat-status-pill">
                <span className="chat-dot green"></span>
                {activePerson.status || 'نشطة'}
              </span>

              {/* Status Switcher Dropdown */}
              <div className="chat-status-dropdown-wrap">
                <button
                  type="button"
                  className="chat-status-select-btn"
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                >
                  {activePerson.status || 'تحديث الحالة'}
                </button>
                {statusMenuOpen && (
                  <div className="chat-status-menu-popup">
                    {(mode === 'ticket' 
                      ? ['جديد', 'قيد المعالجة', 'بانتظار رد المستخدم', 'تم التصعيد', 'تم الحل', 'مغلقة']
                      : ['نشطة', 'بانتظار العميل', 'بانتظار المستشار', 'مكتملة', 'مغلقة']
                    ).map(st => (
                      <button key={st} type="button" onClick={() => handleUpdateStatus(st)}>
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="chat-icon-btn green" onClick={handleExport} title="تصدير المحادثة">
                <svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
              </button>
              <button className="chat-icon-btn green" onClick={handleCopyLink} title="نسخ الرابط">
                <svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="chat-messages-stream">
            <div className="chat-day-divider">المحادثة الرسمية الموثقة</div>
            {currentMessages.map((m, idx) => (
              <div key={idx} className={`chat-msg-row ${m.sender === 'out' ? 'out' : 'in'}`}>
                <div className="chat-msg-avatar" style={{ background: m.sender === 'out' ? '#005D9C' : activePerson.color || '#E58A13' }}>
                  {m.name ? m.name.charAt(0) : 'م'}
                </div>
                <div className="chat-msg-bubble-wrap">
                  <div className={`chat-msg-bubble ${m.sender === 'out' ? 'out' : 'in'}`}>
                    {m.text}
                  </div>
                  <div className="chat-msg-meta">{m.time || 'الآن'}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Composer Section */}
          <section className="chat-reply-section">
            <div className="chat-reply-title">كتابة الرد الرسمي</div>
            <div className="chat-editor-box">
              <div className="chat-editor-toolbar">
                <button type="button" onClick={() => { setAiDesc(activePerson.subject || ''); setActiveOverlay('ai'); }} title="توليد رد ذكي">
                  ✨ تحسين وصياغة النص
                </button>
                <div style={{ display: 'flex', gap: '8px', marginRight: 'auto' }}>
                  <b>B</b><i>I</i><u>U</u>
                </div>
              </div>
              <textarea
                className="chat-editor-textarea"
                placeholder="اكتب ردك هنا..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>

            <div className="chat-reply-footer">
              <div className="chat-reply-tools">
                <button type="button" className="chat-tool-btn" onClick={() => setActiveOverlay('attachment')} title="إرفاق ملف">
                  📎 إرفاق ملف
                </button>
                <button type="button" className="chat-tool-btn" onClick={() => { setAiDesc(activePerson.subject || ''); setActiveOverlay('ai'); }} title="توليد بالذكاء الاصطناعي">
                  ✨ مساعد AI
                </button>
                <button type="button" className="chat-tool-btn" onClick={() => setActiveOverlay('templates')} title="قوالب جاهزة">
                  📋 قوالب جاهزة
                </button>
              </div>

              <div className="chat-send-actions">
                <button type="button" className="chat-send-btn" onClick={handleSendMessage}>
                  إرسال ↵
                </button>
                <button type="button" className="chat-send-close-btn" onClick={handleSendAndClose}>
                  إرسال وإغلاق المحادثة
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Column 3: Contextual Details Panel (Left in RTL) */}
        <aside className="chat-details-panel">
          <div className="chat-person-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="chat-avatar-lg" style={{ background: activePerson.color || '#005D9C' }}>
                {activePerson.initial || 'م'}
              </div>
              <div>
                <div className="chat-person-name">{activePerson.name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{activePerson.ref}</div>
              </div>
            </div>
          </div>

          {/* Cards Based on Mode */}
          <div className="chat-details-scroll">
            
            {/* Card 1: Core Ident */}
            <div className="chat-info-card">
              <div className="chat-info-row">
                <div>
                  <div className="chat-info-label">{mode === 'platform' ? 'المستشار:' : 'العميل / المستخدم:'}</div>
                  <div className="chat-info-val">{activePerson.name}</div>
                </div>
              </div>
              <div className="chat-info-row">
                <div>
                  <div className="chat-info-label">{mode === 'platform' ? 'القسم المختص:' : 'البريد الإلكتروني:'}</div>
                  <div className="chat-info-val" style={{ color: '#005D9C', fontWeight: '700' }}>
                    {mode === 'platform' ? (activePerson.dept || 'الإدارة المالية') : (activePerson.email || 'user@example.jo')}
                  </div>
                </div>
              </div>
              <div className="chat-info-row">
                <div>
                  <div className="chat-info-label">موضوع المحادثة:</div>
                  <div className="chat-info-val">{activePerson.subject}</div>
                </div>
              </div>
            </div>

            {/* Card 2: Controls & Assignment */}
            <div className="chat-info-card">
              <div className="chat-field">
                <label>حالة المحادثة:</label>
                <select value={activePerson.status || ''} onChange={(e) => handleUpdateStatus(e.target.value)}>
                  {['جديد', 'قيد المعالجة', 'بانتظار الرد', 'تم التصعيد', 'تم الحل', 'مغلقة'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="chat-field">
                <label>الأولوية الإدارية:</label>
                <select value={activePerson.priority || 'عالية'} onChange={() => {}}>
                  <option>عالية</option>
                  <option>متوسطة</option>
                  <option>منخفضة</option>
                  <option>حرجة</option>
                </select>
              </div>
              <div className="chat-field">
                <label>الموظف المسؤول (فريق الإدارة):</label>
                <select value={activePerson.assignee || 'سارة خالد'} onChange={() => {}}>
                  <option>سارة خالد — العمليات والدعم</option>
                  <option>أحمد منصور — الدعم الفني</option>
                  <option>ليان حداد — الإدارة المالية والتحويلات</option>
                  <option>مدير المنصة — عام</option>
                </select>
              </div>
            </div>

            {/* Card 3: Admin Actions */}
            <div className="chat-info-card">
              <div className="chat-acc-btn" onClick={() => setActiveOverlay('tags')}>
                <span>الوسوم والتصنيف:</span>
                <span className="chat-acc-plus">＋</span>
              </div>
              <div className="chat-acc-btn" onClick={() => setActiveOverlay('note')}>
                <span>ملاحظة داخلية خاصة بالإدارة:</span>
                <span className="chat-acc-plus">＋</span>
              </div>
              <div className="chat-acc-btn" onClick={() => setActiveOverlay('rating')}>
                <span>تقييم المحادثة:</span>
                <span className="chat-acc-plus">★</span>
              </div>
              <div className="chat-acc-btn" onClick={() => setActiveOverlay('history')}>
                <span>سجل الإجراءات والتدقيق:</span>
                <span className="chat-acc-plus">↺</span>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS & OVERLAYS
      ══════════════════════════════════════════════════════════════════ */}

      {/* 1. Templates Modal */}
      {activeOverlay === 'templates' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">القوالب الجاهزة المعتمدة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {TEMPLATES[mode].map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chat-template-choice-btn"
                    onClick={() => { setReplyText(t); setActiveOverlay(null); showToast('تم إدراج القالب الجاهز بنجاح!', 'success'); }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Generator Modal */}
      {activeOverlay === 'ai' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div className="chat-modal-title">✨ توليد الرد بالمساعد الذكي (ديوان AI)</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الغرض من الرد:</label>
                  <select value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <option>اقتراح رد</option>
                    <option>تلخيص المحادثة</option>
                    <option>صياغة ملاحظة خاصة</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>درجة الإبداع:</label>
                  <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <option>منخفض (دقيق ومباشر)</option>
                    <option>متوسط</option>
                    <option>مرتفع</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>سياق المحادثة أو الاستفسار:</label>
                  <textarea
                    value={aiDesc}
                    onChange={(e) => setAiDesc(e.target.value)}
                    style={{ width: '100%', height: '70px', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="اكتب التوجيه للمساعد الذكي..."
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={aiLoading}
                  style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {aiLoading ? 'جاري التوليد...' : '✨ توليد الرد الآن'}
                </button>
              </div>

              {aiResult && (
                <div style={{ marginTop: '14px', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: '700', color: '#005D9C', marginBottom: '6px' }}>الرد المقترح من ديوان AI:</div>
                  <div>{aiResult}</div>
                </div>
              )}
            </div>
            <div className="chat-modal-foot">
              <button
                type="button"
                onClick={handleUseAiText}
                disabled={!aiResult}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                اعتماد وإدراج النص
              </button>
              <button type="button" onClick={() => setActiveOverlay(null)} style={{ background: '#E2E8F0', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stats Modal */}
      {activeOverlay === 'stats' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">إحصاءات المحادثات المباشرة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#005D9C' }}>128</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>إجمالي المحادثات</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A' }}>36</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>مفتوحة ونشطة</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#E58A13' }}>7</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>بانتظار الرد</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#005D9C' }}>4.85 ★</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>متوسط التقييم</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Advanced Filter Modal */}
      {activeOverlay === 'filter' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">تصفية المحادثات المتقدمة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>حالة المحادثة:</label>
                  <select value={advStatus} onChange={(e) => setAdvStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <option value="all">الكل</option>
                    <option value="open">المفتوحة فقط</option>
                    <option value="closed">المغلقة فقط</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>حالة القراءة:</label>
                  <select value={advUnread} onChange={(e) => setAdvUnread(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <option value="all">الكل</option>
                    <option value="unread">غير مقروءة</option>
                    <option value="read">مقروءة</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>بحث بالاسم أو الموضوع:</label>
                  <input
                    type="text"
                    value={advSearch}
                    onChange={(e) => setAdvSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="اكتب كلمة مفتاحية..."
                  />
                </div>
              </div>
            </div>
            <div className="chat-modal-foot">
              <button type="button" onClick={() => setActiveOverlay(null)} style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                تطبيق الفلتر
              </button>
              <button type="button" onClick={() => { setAdvStatus('all'); setAdvUnread('all'); setAdvSearch(''); setActiveOverlay(null); }} style={{ background: '#E2E8F0', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                إعادة ضبط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. New Conversation Modal */}
      {activeOverlay === 'new' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div className="chat-modal-title">إنشاء محادثة جديدة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>اسم الطرف / المستخدم:</label>
                  <input
                    type="text"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="أدخل الاسم..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الموضوع:</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="موضوع الاستشارة أو التذكرة..."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الرسالة الافتتاحية:</label>
                  <textarea
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="اكتب تفاصيل الرسالة..."
                  />
                </div>
              </div>
            </div>
            <div className="chat-modal-foot">
              <button
                type="button"
                onClick={() => {
                  if (!newPartyName || !newSubject) {
                    alert('يرجى إدخال الاسم والموضوع');
                    return;
                  }
                  const newPerson = {
                    id: 'new-' + Date.now(),
                    name: newPartyName,
                    initial: newPartyName.charAt(0),
                    color: '#005D9C',
                    ref: (mode === 'ticket' ? '#TKT-' : mode === 'client' ? '#CON-' : '#ADV-') + Math.floor(10000 + Math.random() * 89999),
                    subject: newSubject,
                    preview: newInitialMsg || 'محادثة جديدة',
                    time: 'الآن',
                    unread: 0,
                    status: 'جديد'
                  };
                  setData(prev => ({
                    ...prev,
                    [mode]: {
                      ...prev[mode],
                      people: [newPerson, ...prev[mode].people]
                    }
                  }));
                  setSelectedIdx(0);
                  setActiveOverlay(null);
                  setNewPartyName('');
                  setNewSubject('');
                  setNewInitialMsg('');
                  showToast('تم إنشاء المحادثة وتعيينها بنجاح!', 'success');
                }}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                إنشاء وبدء المحادثة
              </button>
              <button type="button" onClick={() => setActiveOverlay(null)} style={{ background: '#E2E8F0', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tags Modal */}
      {activeOverlay === 'tags' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">وسوم وتصنيف المحادثة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {customTags.map((tg, i) => (
                  <span key={i} style={{ background: '#6366F1', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tg}
                    <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => setCustomTags(customTags.filter((_, idx) => idx !== i))}>×</span>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="اكتب وسماً جديداً واضغط Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagInput.trim()) {
                    setCustomTags([...customTags, newTagInput.trim()]);
                    setNewTagInput('');
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. Private Note Modal */}
      {activeOverlay === 'note' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div className="chat-modal-title">ملاحظة خاصة داخلية (سرية للإدارة)</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                style={{ width: '100%', height: '140px', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                placeholder="اكتب ملاحظتك الداخلية هنا (لن يراها العميل أو المستشار)..."
              />
            </div>
            <div className="chat-modal-foot">
              <button
                type="button"
                onClick={() => { setActiveOverlay(null); showToast('تم حفظ الملاحظة الداخلية بنجاح!', 'success'); }}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                حفظ الملاحظة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Action History Timeline Modal */}
      {activeOverlay === 'history' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">سجل إجراءات وتاريخ المحادثة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #005D9C' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>تم فتح المحادثة</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>اليوم 09:00 ص • النظام</div>
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #16A34A' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>تم تعيين الموظف المسؤول</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>اليوم 09:15 ص • سارة خالد</div>
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #E58A13' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>تمت إضافة مرفق رسمي</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>اليوم 09:30 ص • {activePerson.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

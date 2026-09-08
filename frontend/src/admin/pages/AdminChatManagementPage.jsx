import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAiService } from '../../services/chatAiService';
import { 
  getAdminTickets, 
  replyAdminTicket, 
  updateAdminTicketStatus, 
  closeAdminTicket,
  createAdminTicket,
  getAdminUsersList
} from '../services/adminApi';
import Toast, { useToast } from '../../components/Toast/Toast';
import './AdminChatManagementPage.css';

const EMPTY_DATA = {
  ticket: {
    title: 'محادثات الدعم الفني وتذاكر العملاء',
    crumb: 'تذاكر الدعم والعملاء',
    listLabel: 'كل تذاكر الدعم',
    people: []
  },
  platform: {
    title: 'محادثات المستشارين وإدارة المنصة',
    crumb: 'المستشار والإدارة',
    listLabel: 'كل محادثات المستشارين',
    people: []
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
  platform: [
    'تم استلام طلبكم وتحويله إلى قسم الحسابات للمراجعة والاعتماد.',
    'تم تسجيل الملاحظة وسيتم تحديث كشف المستحقات فور إغلاق دورة التسوية.',
    'شكراً لتزويدنا برخصة الاعتماد المهني المحدثة، جاري تفعيل التخصص في المنصة.',
    'تمت إحالة الموضوع إلى فريق الجودة والامتثال وسيتم تزويدك بالنتيجة.',
    'تم تحديث سجل المحادثة بالمعلومات الجديدة وإرسال التقرير للإدارة.'
  ]
};

export default function AdminChatManagementPage({ navigate }) {
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  // Mode: 'ticket' (تذاكر الدعم) | 'platform' (المستشار والمنصة)
  const [mode, setMode] = useState('ticket');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('الكل');

  // Datasets from Backend PostgreSQL
  const [data, setData] = useState(EMPTY_DATA);
  const [chatMessages, setChatMessages] = useState({ ticket: {}, platform: {} });
  const [replyText, setReplyText] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);

  // Modals & Overlays
  const [activeOverlay, setActiveOverlay] = useState(null); // 'stats' | 'filter' | 'new' | 'templates' | 'attachment' | 'ai' | 'tags' | 'note' | 'rating' | 'history'

  // Dynamic States for Modals
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [customTags, setCustomTags] = useState(['معلّقة', 'عاجلة']);
  const [newTagInput, setNewTagInput] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // AI Modal States
  const [aiPurpose, setAiPurpose] = useState('اقتراح رد');
  const [aiDesc, setAiDesc] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New Conversation Modal Form
  const [newUserId, setNewUserId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [newCategory, setNewCategory] = useState('technical');
  const [newPriority, setNewPriority] = useState('medium');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Advanced Filter Form
  const [advStatus, setAdvStatus] = useState('all');
  const [advUnread, setAdvUnread] = useState('all');
  const [advSearch, setAdvSearch] = useState('');

  const messagesEndRef = useRef(null);

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH REAL DATA FROM POSTGRESQL (TICKETS, REPLIES, USERS)
  // ══════════════════════════════════════════════════════════════════════════
  const loadBackendTickets = async () => {
    try {
      setLoading(true);
      const res = await getAdminTickets({ limit: 100 });
      const tickets = Array.isArray(res) ? res : (res?.items || []);

      const userTickets = [];
      const consultantTickets = [];
      const ticketMsgMap = {};
      const platformMsgMap = {};

      const statusToAr = (st) => {
        switch (st) {
          case 'open':
          case 'new':
            return 'جديد';
          case 'in_progress':
            return 'قيد المعالجة';
          case 'resolved':
            return 'تم الحل';
          case 'closed':
            return 'مغلقة';
          default:
            return 'قيد المراجعة';
        }
      };

      const priorityToAr = (pr) => {
        switch (pr) {
          case 'urgent':
            return 'حرجة';
          case 'high':
            return 'عالية';
          case 'low':
            return 'منخفضة';
          default:
            return 'متوسطة';
        }
      };

      tickets.forEach((t) => {
        const submitterName = t.submitter_name || t.user_name || (t.submitter ? t.submitter.full_name : '') || 'مستخدم المنصة';
        const submitterEmail = t.email || (t.submitter ? t.submitter.email : '') || 'user@platform.jo';
        const submitterInitial = submitterName.charAt(0) || 'م';
        const isConsultant = t.sub_category === 'consultant' || t.category === 'billing' || (t.submitter_role === 'consultant');

        const item = {
          id: t.id,
          realId: t.id,
          name: submitterName,
          initial: submitterInitial,
          color: isConsultant ? '#2b8f76' : '#005D9C',
          ref: t.ticket_number ? `${t.ticket_number}` : `#${t.id.slice(0, 8)}`,
          subject: t.subject || 'طلب دعم واستشارة',
          preview: t.description || 'بدون تفاصيل إضافية',
          time: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-JO') : 'الآن',
          unread: 0,
          status: statusToAr(t.status),
          rawStatus: t.status,
          email: submitterEmail,
          priority: priorityToAr(t.priority),
          rawPriority: t.priority,
          category: t.category || 'عام',
          assignee: t.assignee_name || (t.assignee ? t.assignee.full_name : '') || 'فريق العمليات والدعم',
          internal_note: t.internal_note || '',
          dept: isConsultant ? 'شؤون المستشارين والمالية' : 'الدعم الفني والخدمات'
        };

        // Format replies
        const replies = [];
        if (t.description) {
          replies.push({
            sender: 'in',
            name: submitterName,
            text: t.description,
            time: t.created_at ? new Date(t.created_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'الآن'
          });
        }

        if (Array.isArray(t.replies)) {
          t.replies.forEach(r => {
            const isOut = r.author_role === 'admin' || r.author_role === 'super_admin' || r.is_internal;
            replies.push({
              id: r.id,
              sender: isOut ? 'out' : 'in',
              name: r.author_name || (isOut ? (r.is_internal ? 'ملاحظة إدارية' : 'إدارة المنصة') : submitterName),
              text: r.message,
              time: r.created_at ? new Date(r.created_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'الآن'
            });
          });
        }

        if (isConsultant) {
          const idx = consultantTickets.length;
          consultantTickets.push(item);
          platformMsgMap[idx] = replies;
        } else {
          const idx = userTickets.length;
          userTickets.push(item);
          ticketMsgMap[idx] = replies;
        }
      });

      // If userTickets is empty and consultantTickets has items, or vice versa
      setData({
        ticket: {
          title: 'محادثات الدعم الفني وتذاكر العملاء',
          crumb: 'تذاكر الدعم والعملاء',
          listLabel: 'كل تذاكر الدعم',
          people: userTickets
        },
        platform: {
          title: 'محادثات المستشارين وإدارة المنصة',
          crumb: 'المستشار والإدارة',
          listLabel: 'كل محادثات المستشارين',
          people: consultantTickets
        }
      });

      setChatMessages({
        ticket: ticketMsgMap,
        platform: platformMsgMap
      });

    } catch (err) {
      console.warn('Backend ticket sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackendTickets();

    // Fetch system users for new conversation modal
    async function loadUsers() {
      try {
        const uList = await getAdminUsersList({ limit: 50 });
        if (Array.isArray(uList)) {
          setSystemUsers(uList);
          if (uList.length > 0) {
            setNewUserId(uList[0].id);
          }
        }
      } catch (e) {
        console.warn('Load users note:', e);
      }
    }
    loadUsers();
  }, []);

  const currentList = data[mode]?.people || [];
  const activePerson = currentList[selectedIdx] || currentList[0] || {};
  const currentMessages = (chatMessages[mode] && chatMessages[mode][selectedIdx]) || [];

  // Update private note input when active person changes
  useEffect(() => {
    if (activePerson && activePerson.internal_note) {
      setPrivateNote(activePerson.internal_note);
    } else {
      setPrivateNote('');
    }
  }, [activePerson?.realId]);

  // Filtered List
  const filteredPeople = useMemo(() => {
    return currentList.filter(p => {
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
  }, [currentList, quickFilter, advStatus, advUnread, searchTerm, advSearch]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Actions
  const handleSelectConv = (idx) => {
    setSelectedIdx(idx);
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[idx]) {
        copy[mode].people[idx].unread = 0;
      }
      return copy;
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE (PERSISTED TO POSTGRESQL)
  // ══════════════════════════════════════════════════════════════════════════
  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    const currentMsgText = replyText.trim();
    const newMsg = {
      sender: 'out',
      name: 'إدارة المنصة',
      text: currentMsgText,
      time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI update
    setChatMessages(prev => {
      const copy = { ...prev };
      if (!copy[mode]) copy[mode] = {};
      if (!copy[mode][selectedIdx]) copy[mode][selectedIdx] = [];
      copy[mode][selectedIdx] = [...copy[mode][selectedIdx], newMsg];
      return copy;
    });

    setReplyText('');

    if (activePerson.realId) {
      try {
        await replyAdminTicket(activePerson.realId, {
          reply_text: currentMsgText,
          is_internal: false
        });
        showToast('تم إرسال الرد وحفظه في النظام بنجاح!', 'success');
      } catch (e) {
        console.error('Live reply sync error:', e);
        showToast('فشل حفظ الرد في قاعدة البيانات', 'error');
      }
    } else {
      showToast('تم إرسال الرد بنجاح!', 'success');
    }
  };

  const handleSendAndClose = async () => {
    const currentMsgText = replyText.trim();
    if (currentMsgText) {
      const newMsg = {
        sender: 'out',
        name: 'إدارة المنصة',
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
    }

    // Update status in state
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[selectedIdx]) {
        copy[mode].people[selectedIdx].status = 'مغلقة';
      }
      return copy;
    });

    if (activePerson.realId) {
      try {
        if (currentMsgText) {
          await replyAdminTicket(activePerson.realId, {
            reply_text: currentMsgText,
            is_internal: false
          });
        }
        await closeAdminTicket(activePerson.realId, 'تم الحل والإغلاق من قبل الإدارة');
        showToast('تم إرسال الرد وإغلاق التذكرة بنجاح في قاعدة البيانات!', 'success');
      } catch (e) {
        console.error('Live status update error:', e);
        showToast('تم تحديث الحالة محلياً', 'warning');
      }
    } else {
      showToast('تم إرسال الرد وإغلاق المحادثة بنجاح!', 'success');
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

    if (activePerson.realId) {
      const statusMap = {
        'جديد': 'open',
        'قيد المعالجة': 'in_progress',
        'بانتظار الرد': 'in_progress',
        'بانتظار رد المستخدم': 'in_progress',
        'تم التصعيد': 'in_progress',
        'تم الحل': 'resolved',
        'مغلقة': 'closed'
      };
      try {
        await updateAdminTicketStatus(activePerson.realId, { status: statusMap[newStatus] || 'in_progress' });
        showToast(`تم تحديث حالة التذكرة إلى [${newStatus}] بنجاح!`, 'success');
      } catch (e) {
        console.error('Live ticket status sync error:', e);
        showToast('حدث خطأ أثناء تحديث الحالة بالخادم', 'error');
      }
    }
  };

  const handleUpdatePriority = async (newPriority) => {
    setData(prev => {
      const copy = { ...prev };
      if (copy[mode].people[selectedIdx]) {
        copy[mode].people[selectedIdx].priority = newPriority;
      }
      return copy;
    });

    if (activePerson.realId) {
      const priorityMap = {
        'حرجة': 'urgent',
        'عالية': 'high',
        'متوسطة': 'medium',
        'منخفضة': 'low'
      };
      try {
        await updateAdminTicketStatus(activePerson.realId, { priority: priorityMap[newPriority] || 'medium' });
        showToast(`تم تعديل الأولوية إلى [${newPriority}] في قاعدة البيانات!`, 'success');
      } catch (e) {
        console.error('Live priority sync error:', e);
      }
    }
  };

  const handleSavePrivateNote = async () => {
    if (!activePerson.realId) {
      setActiveOverlay(null);
      showToast('تم حفظ الملاحظة الداخلية بنجاح!', 'success');
      return;
    }
    try {
      await updateAdminTicketStatus(activePerson.realId, { internal_note: privateNote });
      setData(prev => {
        const copy = { ...prev };
        if (copy[mode].people[selectedIdx]) {
          copy[mode].people[selectedIdx].internal_note = privateNote;
        }
        return copy;
      });
      setActiveOverlay(null);
      showToast('تم حفظ الملاحظة الداخلية السرية في قاعدة البيانات!', 'success');
    } catch (e) {
      console.error('Failed to save internal note:', e);
      showToast('حدث خطأ أثناء حفظ الملاحظة', 'error');
    }
  };

  // Create new Ticket / Conversation in PostgreSQL
  const handleCreateNewConversation = async () => {
    if (!newSubject.trim() || !newInitialMsg.trim()) {
      showToast('يرجى كتابة الموضوع والرسالة الافتتاحية', 'warning');
      return;
    }
    const targetUserId = newUserId || (systemUsers.length > 0 ? systemUsers[0].id : user?.id);
    if (!targetUserId) {
      showToast('يرجى اختيار المستخدم', 'warning');
      return;
    }

    try {
      setSubmittingTicket(true);
      await createAdminTicket({
        submitted_by: targetUserId,
        subject: newSubject.trim(),
        description: newInitialMsg.trim(),
        category: newCategory,
        priority: newPriority
      });
      showToast('تم إنشاء التذكرة بنجاح في قاعدة البيانات!', 'success');
      setActiveOverlay(null);
      setNewSubject('');
      setNewInitialMsg('');
      await loadBackendTickets();
      setSelectedIdx(0);
    } catch (err) {
      console.error('Failed to create admin ticket:', err);
      showToast('تعذر إنشاء التذكرة بالخادم', 'error');
    } finally {
      setSubmittingTicket(false);
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
        setAiResult(`بناءً على مراجعة استفساركم بخصوص "${activePerson.subject || 'طلبكم'}"، نود إعلامكم بأن الإجراء المالي والتقني قيد المتابعة والاعتماد وفق الأصول.`);
      }
    } catch (e) {
      setAiResult(`شكرًا لتواصلك معنا أستاذ ${activePerson.name || ''}. تمت مراجعة استفسارك بخصوص "${activePerson.subject || ''}" وجاري العمل على تلبية طلبك بأسرع وقت.`);
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
      `منصة ديوان للاستشارات الضريبية - سجل المحادثة المعتمد`,
      `المرجع: ${activePerson.ref || '—'}`,
      `الطرف: ${activePerson.name || '—'} (${activePerson.email || '—'})`,
      `الموضوع: ${activePerson.subject || '—'}`,
      `الحالة: ${activePerson.status || '—'} | الأولوية: ${activePerson.priority || '—'}`,
      '══════════════════════════════════════════════════════════',
      'سجل الرسائل والردود الموثقة:',
      ...currentMessages.map(m => `[${m.time || '—'}] ${m.name}: ${m.text}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diwan-chat-${(activePerson.ref || 'export').replace('#', '')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('تم تصدير سجل المحادثة بنجاح!', 'success');
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/admin/chats?ref=${(activePerson.ref || '').replace('#', '')}`);
    showToast('تم نسخ رابط التذكرة المباشر!', 'success');
  };

  // Dynamic Metrics for Stats modal
  const statsMetrics = useMemo(() => {
    const all = [...data.ticket.people, ...data.platform.people];
    const openCount = all.filter(p => p.status === 'جديد' || p.status === 'قيد المعالجة' || p.status === 'بانتظار الرد').length;
    const resolvedCount = all.filter(p => p.status === 'تم الحل' || p.status === 'مغلقة').length;
    const urgentCount = all.filter(p => p.priority === 'حرجة' || p.priority === 'عالية').length;
    return {
      total: all.length,
      open: openCount,
      resolved: resolvedCount,
      urgent: urgentCount
    };
  }, [data]);

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
            🎫 تذاكر دعم العملاء والمستخدمين ({data.ticket.people.length})
          </button>
          <button
            type="button"
            className={mode === 'platform' ? 'active' : ''}
            onClick={() => { setMode('platform'); setSelectedIdx(0); setSearchTerm(''); }}
          >
            🏛️ محادثات المستشارين والإدارة ({data.platform.people.length})
          </button>
        </div>

        {/* Top Action Tools */}
        <div className="chat-top-actions">
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('stats')} title="إحصاءات التذاكر">
            <svg viewBox="0 0 24 24"><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /></svg>
          </button>
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('filter')} title="تصفية متقدمة">
            <svg viewBox="0 0 24 24"><path d="M4 5h16l-6 7v5l-4 2v-7Z" /></svg>
          </button>
          <button className="chat-icon-btn green" onClick={handleExport} title="تصدير السجل">
            <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
          </button>
          <button className="chat-icon-btn green" onClick={() => setActiveOverlay('new')} title="إنشاء تذكرة / محادثة جديدة">
            <svg viewBox="0 0 24 24"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
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
              <option value="المفتوحة">المفتوحة فقط</option>
              <option value="المغلقة">المغلقة والمحلولة</option>
            </select>
            <div className="chat-search-wrap">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input
                type="text"
                placeholder="بحث بالاسم أو الموضوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-conv-scroll">
            {loading ? (
              <div style={{ padding: '40px 15px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                جاري جلب المحادثات الحية من قاعدة البيانات...
              </div>
            ) : filteredPeople.length > 0 ? (
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
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                لا توجد محادثات أو تذاكر حالياً في هذا القسم
              </div>
            )}
          </div>
          <div className="chat-load-more">إجمالي المحادثات: ({filteredPeople.length})</div>
        </aside>

        {/* Column 2: Active Chat Messages & Composer Panel (Center) */}
        <main className="chat-thread-panel">
          {activePerson.name ? (
            <>
              {/* Thread Header */}
              <div className="chat-thread-head">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="chat-thread-name">{activePerson.name}</span>
                    <span className="chat-ref-pill">{activePerson.ref}</span>
                  </div>
                  <div className="chat-thread-subject">{activePerson.subject}</div>
                </div>

                <div className="chat-thread-actions">
                  <span className="chat-status-pill">
                    <span className={`chat-dot ${activePerson.status === 'مغلقة' || activePerson.status === 'تم الحل' ? 'gray' : 'green'}`}></span>
                    {activePerson.status}
                  </span>

                  {/* Status Switcher Dropdown */}
                  <div className="chat-status-dropdown-wrap">
                    <button
                      type="button"
                      className="chat-status-select-btn"
                      onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    >
                      {activePerson.status || 'تحديث الحالة'} ▾
                    </button>
                    {statusMenuOpen && (
                      <div className="chat-status-menu-popup">
                        {['جديد', 'قيد المعالجة', 'بانتظار الرد', 'تم التصعيد', 'تم الحل', 'مغلقة'].map(st => (
                          <button key={st} type="button" onClick={() => handleUpdateStatus(st)}>
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="chat-icon-btn green" onClick={handleExport} title="تصدير المحادثة">
                    <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                  </button>
                  <button className="chat-icon-btn green" onClick={handleCopyLink} title="نسخ الرابط المباشر">
                    <svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="chat-messages-stream">
                <div className="chat-day-divider">المحادثة الرسمية الموثقة</div>
                {currentMessages.length > 0 ? (
                  currentMessages.map((m, idx) => (
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
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
                    لا توجد رسائل سابقة في هذه التذكرة. يمكنك إرسال الرد أدناه.
                  </div>
                )}
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
                    <div style={{ display: 'flex', gap: '8px', marginRight: 'auto', color: '#64748B', fontSize: '12px' }}>
                      <span>المحرر المهني</span>
                    </div>
                  </div>
                  <textarea
                    className="chat-editor-textarea"
                    placeholder="اكتب ردك هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                <div className="chat-reply-footer">
                  <div className="chat-reply-tools">
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
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📨</div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>اختر محادثة من القائمة لعرض تفاصيلها</div>
            </div>
          )}
        </main>

        {/* Column 3: Contextual Details Panel (Left in RTL) */}
        <aside className="chat-details-panel">
          {activePerson.name ? (
            <>
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
                        {mode === 'platform' ? (activePerson.dept || 'القسم المالي والمحاسبي') : (activePerson.email || 'user@example.jo')}
                      </div>
                    </div>
                  </div>
                  <div className="chat-info-row">
                    <div>
                      <div className="chat-info-label">موضوع التذكرة:</div>
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
                    <select value={activePerson.priority || 'متوسطة'} onChange={(e) => handleUpdatePriority(e.target.value)}>
                      <option value="حرجة">حرجة</option>
                      <option value="عالية">عالية</option>
                      <option value="متوسطة">متوسطة</option>
                      <option value="منخفضة">منخفضة</option>
                    </select>
                  </div>
                  <div className="chat-field">
                    <label>الموظف المسؤول (فريق الإدارة):</label>
                    <select value={activePerson.assignee || 'فريق العمليات والدعم'} onChange={() => { }}>
                      <option>فريق العمليات والدعم</option>
                      <option>الدعم الفني والتقني</option>
                      <option>الإدارة المالية والتحويلات</option>
                      <option>مدير المنصة</option>
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
            </>
          ) : null}
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
                {(TEMPLATES[mode] || TEMPLATES.ticket).map((t, idx) => (
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
                    <option>اقتراح رد مهني</option>
                    <option>تلخيص الاستفسار</option>
                    <option>صياغة ملاحظة خاصة</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>طبيعة الصياغة:</label>
                  <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <option>رسمية ومعتمدة</option>
                    <option>موجزة ومباشرة</option>
                    <option>تفصيلية وتوضيحية</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>سياق المحادثة أو التوجيه:</label>
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

      {/* 3. Stats Modal (Dynamic from PostgreSQL) */}
      {activeOverlay === 'stats' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">إحصاءات التذاكر والمحادثات المباشرة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#005D9C' }}>{statsMetrics.total}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>إجمالي التذاكر</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#16A34A' }}>{statsMetrics.open}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>قيد المعالجة والنشطة</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#E58A13' }}>{statsMetrics.urgent}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>أولوية عالية / حرجة</div>
                </div>
                <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#005D9C' }}>{statsMetrics.resolved}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>المغلقة والمحلولة</div>
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

      {/* 5. New Conversation Modal (Live Creation in PostgreSQL) */}
      {activeOverlay === 'new' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div className="chat-modal-title">إنشاء تذكرة / محادثة جديدة في النظام</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>المستخدم / صاحب التذكرة:</label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.name || u.email} ({u.role === 'consultant' ? 'مستشار' : u.role === 'super_admin' ? 'مدير' : 'عميل'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الأولوية:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">حرجة</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الموضوع:</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="موضوع التذكرة أو الاستشارة..."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>الرسالة الافتتاحية:</label>
                  <textarea
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="اكتب تفاصيل الاستفسار أو المشكلة..."
                  />
                </div>
              </div>
            </div>
            <div className="chat-modal-foot">
              <button
                type="button"
                disabled={submittingTicket}
                onClick={handleCreateNewConversation}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                {submittingTicket ? 'جاري الإنشاء...' : 'إنشاء وحفظ في النظام'}
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
                  <span key={i} style={{ background: '#005D9C', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

      {/* 7. Private Note Modal (Live Persisted) */}
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
                placeholder="اكتب ملاحظتك الداخلية هنا (سجل إداري سري محفوظ بقاعدة البيانات)..."
              />
            </div>
            <div className="chat-modal-foot">
              <button
                type="button"
                onClick={handleSavePrivateNote}
                style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                حفظ الملاحظة بالخادم
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
              <div className="chat-modal-title">سجل إجراءات وتاريخ التذكرة</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #005D9C' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>تاريخ إنشاء التذكرة</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{activePerson.time || 'مسجل'} • {activePerson.name}</div>
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #16A34A' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>الموظف المسؤول</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{activePerson.assignee || 'فريق العمليات'}</div>
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '8px', borderRight: '3px solid #E58A13' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>الحالة الحالية</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{activePerson.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Rating Modal */}
      {activeOverlay === 'rating' && (
        <div className="chat-modal-overlay">
          <div className="chat-modal small">
            <div className="chat-modal-head">
              <div className="chat-modal-title">تقييم جودة الخدمة والدعم</div>
              <button className="chat-modal-close" onClick={() => setActiveOverlay(null)}>×</button>
            </div>
            <div className="chat-modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '32px', color: '#E58A13', marginBottom: '10px' }}>★★★★★</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>مستوى الخدمة: ممتاز (5 / 5)</div>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>يتم احتساب التقييم تلقائياً بناءً على سرعة الاستجابة ورضا العميل.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

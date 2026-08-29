import React, { useState, useEffect, useCallback } from 'react';
import { IconTickets, IconSearch, IconMessage, IconUsers } from '../components/AdminIcons';
import { 
  getAdminTickets, 
  replyAdminTicket, 
  createAdminTicket, 
  updateAdminTicketStatus, 
  closeAdminTicket 
} from '../services/adminApi';

export default function AdminTicketsPage({ navigate }) {
  // Available Platform Consultants list for reassignment
  const platformConsultants = [
    { id: 'c_1', name: 'أ. سارة المجالي', specialty: 'ضريبة الشركات والمصانع', rating: '4.9 ★', activeSessions: 4 },
    { id: 'c_2', name: 'أ. رأفت حداد', specialty: 'ضريبة الدخل والمبيعات', rating: '4.8 ★', activeSessions: 6 },
    { id: 'c_3', name: 'م. ديما المجالي', specialty: 'قوانين وتشريعات جمركية', rating: '4.9 ★', activeSessions: 3 },
    { id: 'c_4', name: 'سعد هارون', specialty: 'تدقيق ومحاسبة جنائية', rating: '4.7 ★', activeSessions: 2 },
    { id: 'c_5', name: 'د. عبدالسلام الخوالدة', specialty: 'استشارات مالية وضريبية كبرى', rating: '5.0 ★', activeSessions: 5 }
  ];

  // Available Support Supervisors list
  const supportAgents = [
    'م. يوسف العمر (القسم المالي)',
    'أ. ديما المجالي (التوثيق والامتثال)',
    'م. خلدون شاهين (الدعم الفني والجلسات)',
    'م. رشا سمارة (الذكاء الاصطناعي)'
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // INITIAL RICH TICKETS DATASET WITH LINKED SESSIONS
  // ══════════════════════════════════════════════════════════════════════════
  const [tickets, setTickets] = useState([
    {
      id: 't_1002',
      ticketNumber: '#TCK-1002',
      subject: 'استفسار حول تفعيل بوابة الدفع بالبطاقة وتجديد الاشتراك',
      category: 'مالي ودفع',
      categoryBadge: 'بوابات الدفع',
      submitter: 'شركة أفق للتقنية',
      userType: 'شركة',
      email: 'finance@ofooq.jo',
      phone: '+962 7 9123 4567',
      plan: 'باقة الشركات الاحترافية',
      consultationsCount: 14,
      priority: 'medium',
      status: 'open',
      slaMinutes: 45,
      assignee: 'م. يوسف العمر (القسم المالي)',
      createdAt: '2026-08-29 10:15',
      updatedAt: 'منذ 15 دقيقة',
      linkedSession: {
        sessionId: '#SES-1092',
        consultantName: 'د. عبدالسلام الخوالدة',
        sessionType: 'جلسة مرئية تخصصية',
        sessionStatus: 'confirmed', // 'confirmed' | 'in_progress' | 'completed' | 'pending' | 'cancelled'
        scheduledAt: '2026-08-30 11:00',
        topic: 'مراجعة خطة الامتثال الضريبي السنوية',
        durationMinutes: 60,
        fee: '75 د.أ'
      },
      replies: [
        { 
          sender: 'شركة أفق للتقنية (العميل)', 
          role: 'client', 
          text: 'السلام عليكم، هل يمكن تفعيل السداد عبر بطاقات فيزا/ماستركارد مباشرة للاشتراك السنوي وتزويدنا برقم ضريبي معتمد؟', 
          isInternal: false, 
          time: '10:15' 
        }
      ]
    },
    {
      id: 't_1001',
      ticketNumber: '#TCK-1001',
      subject: 'طلب تعديل وثيقة التخصص الضريبي والشهادة المهنية',
      category: 'توثيق الحسابات',
      categoryBadge: 'اعتماد مستشار',
      submitter: 'أ. عمر القضاة',
      userType: 'مستشار',
      email: 'omar.qudah@taxpro.jo',
      phone: '+962 7 8888 1122',
      plan: 'مستشار معتمد',
      consultationsCount: 48,
      priority: 'high',
      status: 'in_progress',
      slaMinutes: 20,
      assignee: 'أ. ديما المجالي (التوثيق والامتثال)',
      createdAt: '2026-08-29 09:30',
      updatedAt: 'منذ 35 دقيقة',
      linkedSession: null,
      replies: [
        { 
          sender: 'أ. عمر القضاة (المستشار)', 
          role: 'consultant', 
          text: 'تم رفع الشهادة الجديدة المعتمدة من جمعية المحاسبين القانونيين، يرجى تدقيقها وتحديث تخصصي في الملف الشخصي.', 
          isInternal: false, 
          time: '09:30' 
        },
        { 
          sender: 'أ. ديما المجالي (ملاحظة سرية للمدراء)', 
          role: 'admin', 
          text: 'تم مراجعة الوثيقة من قبل قسم التدقيق وهي مطابقة للأصل. بانتظار موافقة المشرف لاعتمادها نهائياً.', 
          isInternal: true, 
          time: '10:05' 
        }
      ]
    },
    {
      id: 't_1003',
      ticketNumber: '#TCK-1003',
      subject: 'انقطاع الاتصال أثناء جلسة استشارية مرئية',
      category: 'جلسات وفيديو',
      categoryBadge: 'جلسة فيديو Daily.co',
      submitter: 'محمد راتب عوض',
      userType: 'فرد',
      email: 'm.awad@gmail.com',
      phone: '+962 7 7766 5544',
      plan: 'باقة سنوية',
      consultationsCount: 6,
      priority: 'urgent',
      status: 'open',
      slaMinutes: 12,
      assignee: 'م. خلدون شاهين (الدعم الفني والجلسات)',
      createdAt: '2026-08-29 11:20',
      updatedAt: 'منذ 5 دقائق',
      linkedSession: {
        sessionId: '#SES-1029',
        consultantName: 'أ. سارة المجالي',
        sessionType: 'جلسة مرئية (Daily.co)',
        sessionStatus: 'in_progress',
        scheduledAt: '2026-08-29 11:00',
        topic: 'استشارة الإعفاءات الضريبية للمصانع والشركات',
        durationMinutes: 45,
        fee: '50 د.أ'
      },
      replies: [
        { 
          sender: 'محمد راتب عوض (العميل)', 
          role: 'client', 
          text: 'حدث خلل في اتصال الجلسة المرئية مع المستشار عند الدقيقة 20 وتم خصم الرصيد. أرجو تغيير المستشار أو إعادة جدولة الجلسة.', 
          isInternal: false, 
          time: '11:20' 
        }
      ]
    },
    {
      id: 't_1004',
      ticketNumber: '#TCK-1004',
      subject: 'استفسار حول دقة تحليل الإقرار الضريبي عبر الذكاء الاصطناعي',
      category: 'الذكاء الاصطناعي',
      categoryBadge: 'المساعد الضريبي AI',
      submitter: 'مؤسسة النخبة التجارية',
      userType: 'شركة',
      email: 'info@nokhba-trade.com',
      phone: '+962 6 567 8900',
      plan: 'باقة مخصصة',
      consultationsCount: 22,
      priority: 'low',
      status: 'pending_client',
      slaMinutes: 180,
      assignee: 'م. رشا سمارة (الذكاء الاصطناعي)',
      createdAt: '2026-08-28 16:00',
      updatedAt: 'منذ يوم',
      linkedSession: null,
      replies: [
        { 
          sender: 'مؤسسة النخبة (العميل)', 
          role: 'client', 
          text: 'قمنا برفع إقرار ضريبة المبيعات وسؤال المساعد الذكي عن نسبة الإعفاء، ونرغب في التأكد هل تشمل بنود الصادرات؟', 
          isInternal: false, 
          time: '16:00' 
        },
        { 
          sender: 'م. رشا سمارة (فريق الدعم)', 
          role: 'admin', 
          text: 'أهلاً بكم. نعم، محرك الذكاء الاصطناعي يستند للمادة (6) من قانون ضريبة المبيعات. أرسلنا لكم الدليل المعتمد ونرجو مراجعته.', 
          isInternal: false, 
          time: '17:15' 
        }
      ]
    },
    {
      id: 't_1005',
      ticketNumber: '#TCK-1005',
      subject: 'طلب استرداد مبلغ استشارة ملغاة قبل الموعد',
      category: 'مالي ودفع',
      categoryBadge: 'استرداد أموال',
      submitter: 'د. ليلى الحنيطي',
      userType: 'فرد',
      email: 'dr.layla@yahoo.com',
      phone: '+962 7 9000 3344',
      plan: 'باقة قياسية',
      consultationsCount: 3,
      priority: 'medium',
      status: 'resolved',
      slaMinutes: 0,
      assignee: 'م. يوسف العمر (القسم المالي)',
      createdAt: '2026-08-27 12:00',
      updatedAt: 'منذ يومين',
      linkedSession: {
        sessionId: '#SES-1025',
        consultantName: 'أ. رأفت حداد',
        sessionType: 'جلسة صوتية',
        sessionStatus: 'cancelled',
        scheduledAt: '2026-08-27 16:00',
        topic: 'مراجعة إقرار الدخل السنوي للأطباء',
        durationMinutes: 30,
        fee: '40 د.أ'
      },
      replies: [
        { 
          sender: 'د. ليلى الحنيطي (العميل)', 
          role: 'client', 
          text: 'قمت بإلغاء الجلسة قبل موعدها بـ 24 ساعة حسب الشروط وأرغب في استرداد المبلغ للمحفظة.', 
          isInternal: false, 
          time: '12:00' 
        },
        { 
          sender: 'م. يوسف العمر (المشرف المالي)', 
          role: 'admin', 
          text: 'تم إعادة رصيد الجلسة بالكامل (50 د.أ) إلى محفظتك الإلكترونية بنجاح.', 
          isInternal: false, 
          time: '13:30' 
        }
      ]
    },
    {
      id: 't_1006',
      ticketNumber: '#TCK-1006',
      subject: 'اعتراض على تقييم جلسة استشارية',
      category: 'شكاوى ونزاعات',
      categoryBadge: 'نزاع تقييم',
      submitter: 'أ. رأفت حداد',
      userType: 'مستشار',
      email: 'raafat.haddad@diwantax.jo',
      phone: '+962 7 8765 4321',
      plan: 'مستشار معتمد',
      consultationsCount: 85,
      priority: 'high',
      status: 'closed',
      slaMinutes: 0,
      assignee: 'أ. ديما المجالي (التوثيق والامتثال)',
      createdAt: '2026-08-25 15:40',
      updatedAt: 'منذ 4 أيام',
      linkedSession: {
        sessionId: '#SES-1018',
        consultantName: 'أ. رأفت حداد',
        sessionType: 'استشارة مكتوبة ومذكرة',
        sessionStatus: 'completed',
        scheduledAt: '2026-08-25 14:00',
        topic: 'اعتراض على تقدير ضريبة المبيعات لعام 2025',
        durationMinutes: 45,
        fee: '60 د.أ'
      },
      replies: [
        { 
          sender: 'أ. رأفت حداد (المستشار)', 
          role: 'consultant', 
          text: 'العميل قام بتقييم نجمة واحدة دون كتابة سبب رغم تقديم الاستشارة كاملة وتقديم المذكرة الضريبية.', 
          isInternal: false, 
          time: '15:40' 
        },
        { 
          sender: 'أ. ديما المجالي (إدارة المنصة)', 
          role: 'admin', 
          text: 'تم مراجعة تسجيل الجلسة والمذكرة والتواصل مع العميل وتصحيح التقييم إلى 5 نجوم وإغلاق النزاع.', 
          isInternal: false, 
          time: '18:20' 
        }
      ]
    }
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTER STATES
  // ══════════════════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');

  // ══════════════════════════════════════════════════════════════════════════
  // MODALS & DRAWER STATES
  // ══════════════════════════════════════════════════════════════════════════
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedCannedTemplate, setSelectedCannedTemplate] = useState('');
  const [replyStatusUpdate, setReplyStatusUpdate] = useState('');

  // Reassign & Session Status Modal
  const [sessionModalTicket, setSessionModalTicket] = useState(null);
  const [newConsultantSelection, setNewConsultantSelection] = useState('');
  const [newSessionStatusSelection, setNewSessionStatusSelection] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');

  // SLA Performance Modal
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);

  // Create Ticket Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    submitter: '',
    userType: 'شركة',
    email: '',
    phone: '',
    subject: '',
    category: 'مالي ودفع',
    priority: 'medium',
    assignee: 'م. يوسف العمر (القسم المالي)',
    initialMessage: ''
  });

  // Load from Backend on mount
  useEffect(() => {
    let mounted = true;
    async function loadBackendTickets() {
      try {
        const data = await getAdminTickets();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setTickets(prev => {
            const backendMap = new Map(data.map(t => [t.id, t]));
            return prev.map(p => backendMap.has(p.id) ? { ...p, ...backendMap.get(p.id) } : p);
          });
        }
      } catch (err) {
        console.warn('Backend tickets sync fallback:', err);
      }
    }
    loadBackendTickets();
    return () => { mounted = false; };
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // CANNED RESPONSES / QUICK TEMPLATES
  // ══════════════════════════════════════════════════════════════════════════
  const cannedTemplates = [
    {
      id: 'docs',
      label: '📄 طلب وثائق وإيضاحات إضافية',
      text: 'مرحباً بكم، لمتابعة طلبكم بدقة، يرجى تزويدنا بصورة واضحة عن الوثيقة أو الإشعار الضريبي المعني ليتسنى لفريقنا التدقيق المباشر. شكراً لتعاونكم.'
    },
    {
      id: 'finance',
      label: '💳 التحويل للإدارة المالية للتدقيق',
      text: 'تم تحويل معاملتكم المالية للقسم المالي المختص للتحقق من قيد الحوالة/العملية، وسيتم تأكيد التحديث خلال ساعتي عمل كحد أقصى.'
    },
    {
      id: 'resolved',
      label: '✅ تأكيد حل المشكلة والانتهاء',
      text: 'يسعدنا إعلامكم بأنه تم حل المشكلة وتغيير المستشار/المشرف بنجاح واستكمال كافة الإجراءات المطلوبة. نتمنى لكم التوفيق دائماً.'
    },
    {
      id: 'session',
      label: '🗓️ إعادة جدولة الجلسة وتعيين مستشار بديل',
      text: 'تم تعديل وضعية الجلسة وإعادة جدولتها وتعيين مستشار معتمد لمتابعة استشارتكم. يمكنكم الانضمام في الموعد المحدد عبر الرابط المتاح في لوحتكم.'
    }
  ];

  const handleApplyTemplate = (templateId) => {
    const tmpl = cannedTemplates.find(t => t.id === templateId);
    if (tmpl) {
      setReplyText(tmpl.text);
      setSelectedCannedTemplate(templateId);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ACTION HANDLERS: REASSIGN AGENT & CHANGE SESSION STATUS
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenSessionModal = (ticket) => {
    setSessionModalTicket(ticket);
    setNewConsultantSelection(ticket.linkedSession?.consultantName || platformConsultants[0].name);
    setNewSessionStatusSelection(ticket.linkedSession?.sessionStatus || 'confirmed');
    setNewScheduledDate(ticket.linkedSession?.scheduledAt || '2026-08-30 11:00');
  };

  const handleSaveSessionAndConsultantChanges = () => {
    if (!sessionModalTicket) return;

    const updatedLinkedSession = sessionModalTicket.linkedSession ? {
      ...sessionModalTicket.linkedSession,
      consultantName: newConsultantSelection,
      sessionStatus: newSessionStatusSelection,
      scheduledAt: newScheduledDate
    } : {
      sessionId: `#SES-${Date.now().toString().slice(-4)}`,
      consultantName: newConsultantSelection,
      sessionType: 'جلسة استشارية مرئية',
      sessionStatus: newSessionStatusSelection,
      scheduledAt: newScheduledDate,
      topic: sessionModalTicket.subject,
      durationMinutes: 45,
      fee: '50 د.أ'
    };

    // Auto-generate an internal activity record
    const activityReply = {
      sender: 'نظام إدارة المنصة (تحديث تلقائي)',
      role: 'admin',
      text: `🔄 تم تعديل الجلسة وتعيين المستشار: [${newConsultantSelection}] | وضعية الجلسة: [${newSessionStatusSelection === 'confirmed' ? 'مؤكدة' : newSessionStatusSelection === 'in_progress' ? 'قيد التنفيذ' : newSessionStatusSelection === 'completed' ? 'مكتملة' : newSessionStatusSelection === 'pending' ? 'معلقة' : 'ملغاة'}] | الموعد: [${newScheduledDate}]`,
      isInternal: true,
      time: 'الآن'
    };

    const updatedTicket = {
      ...sessionModalTicket,
      linkedSession: updatedLinkedSession,
      updatedAt: 'الآن',
      replies: [...sessionModalTicket.replies, activityReply]
    };

    setTickets(tickets.map(t => t.id === sessionModalTicket.id ? updatedTicket : t));
    if (selectedTicket && selectedTicket.id === sessionModalTicket.id) {
      setSelectedTicket(updatedTicket);
    }

    setSessionModalTicket(null);
    alert('تم حفظ التعديلات وتحديث المستشار المتابع ووضعية الجلسة بنجاح!');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('يرجى كتابة نص الرد أو الملاحظة أولاً');
      return;
    }

    try {
      await replyAdminTicket(selectedTicket.id, {
        reply_text: replyText,
        is_internal: isInternalNote,
        status_update: replyStatusUpdate || null
      });
    } catch (e) {
      console.warn('Reply submitted locally');
    }

    const newReply = {
      sender: isInternalNote ? 'مدير المنصة (🔒 ملاحظة داخلية سرية)' : 'إدارة الدعم الفني (ديوان)',
      role: 'admin',
      text: replyText,
      isInternal: isInternalNote,
      time: 'الآن'
    };

    const newStatus = replyStatusUpdate || selectedTicket.status;

    const updated = {
      ...selectedTicket,
      status: newStatus,
      updatedAt: 'الآن',
      replies: [...selectedTicket.replies, newReply]
    };

    setTickets(tickets.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setReplyText('');
    setSelectedCannedTemplate('');
    setReplyStatusUpdate('');
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await updateAdminTicketStatus(ticketId, { status: newStatus });
    } catch (e) {}

    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: 'الآن' } : t));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus, updatedAt: 'الآن' });
    }
  };

  const handleUpdatePriority = async (ticketId, newPriority) => {
    try {
      await updateAdminTicketStatus(ticketId, { priority: newPriority });
    } catch (e) {}

    setTickets(tickets.map(t => t.id === ticketId ? { ...t, priority: newPriority, updatedAt: 'الآن' } : t));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, priority: newPriority, updatedAt: 'الآن' });
    }
  };

  const handleAssignAgent = async (ticketId, newAssignee) => {
    try {
      await updateAdminTicketStatus(ticketId, { assignee: newAssignee });
    } catch (e) {}

    setTickets(tickets.map(t => t.id === ticketId ? { ...t, assignee: newAssignee, updatedAt: 'الآن' } : t));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, assignee: newAssignee, updatedAt: 'الآن' });
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('هل أنت متأكد من إغلاق هذه التذكرة؟')) return;
    try {
      await closeAdminTicket(ticketId, 'تم الحل والإغلاق');
    } catch (e) {}

    handleUpdateStatus(ticketId, 'closed');
  };

  const handleCreateNewTicket = async (e) => {
    e.preventDefault();
    if (!newTicketData.submitter || !newTicketData.subject) {
      alert('يرجى ملء اسم الجهة وعنوان المشكلة');
      return;
    }

    const newTckId = `t_${Date.now().toString().slice(-4)}`;
    const newEntry = {
      id: newTckId,
      ticketNumber: `#TCK-${Date.now().toString().slice(-4)}`,
      subject: newTicketData.subject,
      category: newTicketData.category,
      categoryBadge: newTicketData.category,
      submitter: newTicketData.submitter,
      userType: newTicketData.userType,
      email: newTicketData.email || 'contact@client.jo',
      phone: newTicketData.phone || '+962 7 9000 0000',
      plan: 'اشتراك معتمد',
      consultationsCount: 1,
      priority: newTicketData.priority,
      status: 'open',
      slaMinutes: 60,
      assignee: newTicketData.assignee,
      createdAt: 'اليوم',
      updatedAt: 'الآن',
      linkedSession: {
        sessionId: `#SES-${Date.now().toString().slice(-4)}`,
        consultantName: platformConsultants[0].name,
        sessionType: 'جلسة استشارية مباشرة',
        sessionStatus: 'confirmed',
        scheduledAt: '2026-08-31 10:00',
        topic: newTicketData.subject,
        durationMinutes: 45,
        fee: '50 د.أ'
      },
      replies: [
        {
          sender: `${newTicketData.submitter} (${newTicketData.userType})`,
          role: 'client',
          text: newTicketData.initialMessage || newTicketData.subject,
          isInternal: false,
          time: 'الآن'
        }
      ]
    };

    try {
      await createAdminTicket(newEntry);
    } catch (err) {}

    setTickets([newEntry, ...tickets]);
    setIsCreateModalOpen(false);
    setNewTicketData({
      submitter: '',
      userType: 'شركة',
      email: '',
      phone: '',
      subject: '',
      category: 'مالي ودفع',
      priority: 'medium',
      assignee: 'م. يوسف العمر (القسم المالي)',
      initialMessage: ''
    });
    alert('تم إنشاء التذكرة وتعيين المشرف بنجاح!');
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "رقم التذكرة,الموضوع,القسم,مقدم التذكرة,نوع الحساب,الهاتف,المستشار المتابع,وضعية الجلسة,الأولوية,الحالة,المشرف المسؤول,تاريخ الإنشاء\n"
      + tickets.map(t => `${t.ticketNumber},"${t.subject}",${t.category},"${t.submitter}",${t.userType},"${t.phone}","${t.linkedSession?.consultantName || 'غير محدد'}","${t.linkedSession?.sessionStatus || 'لا توجد'} ",${t.priority},${t.status},"${t.assignee}",${t.createdAt}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_تذاكر_الدعم_والجلسات_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setUserTypeFilter('all');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED TICKETS & STATS COMPUTATION
  // ══════════════════════════════════════════════════════════════════════════
  const filteredTickets = tickets.filter(t => {
    const matchSearch = searchQuery === '' || 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.submitter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      (t.linkedSession?.consultantName && t.linkedSession.consultantName.includes(searchQuery));

    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchUserType = userTypeFilter === 'all' || t.userType === userTypeFilter;

    return matchSearch && matchStatus && matchPriority && matchCategory && matchUserType;
  });

  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const inProgressTicketsCount = tickets.filter(t => t.status === 'in_progress').length;
  const urgentTicketsCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div className="admin-banner-sub-tag">CUSTOMER SUPPORT & TICKET ESCALATION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>الدعم الفني وإدارة التذاكر والجلسات</h1>
            <span style={{ fontSize: '20px' }}>🎧</span>
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            مركز قيادة متكامل لمتابعة التذاكر، وتغيير المستشار أو المشرف المتابع، وتعديل وضعيات الجلسات وإعادة جدولتها مباشرة.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleExportCSV}
            className="admin-btn-action-outline"
            style={{ fontSize: '12.5px', padding: '7px 14px', background: '#FFFFFF', cursor: 'pointer' }}
          >
            <span>تصدير Excel</span>
            <span>📥</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="admin-btn-action-primary"
            style={{ fontSize: '12.5px', padding: '7px 18px', background: '#E58A13', borderColor: '#E58A13', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span>+ تذكرة جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. Top 6 Interactive KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
        
        {/* Card 1: إجمالي التذاكر */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '14px 16px', 
            borderTop: '3px solid #0A3C64', 
            cursor: 'pointer',
            background: statusFilter === 'all' && priorityFilter === 'all' ? '#F8FAFC' : '#FFFFFF',
            transform: statusFilter === 'all' && priorityFilter === 'all' ? 'translateY(-2px)' : 'none',
            boxShadow: statusFilter === 'all' && priorityFilter === 'all' ? '0 4px 12px rgba(10,60,100,0.1)' : 'none'
          }}
          onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}
          title="انقر لعرض كافة التذاكر"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>إجمالي التذاكر</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0A3C64', margin: '4px 0' }}>142</div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>معدل الإغلاق 92% ↗</div>
        </div>

        {/* Card 2: تذاكر مفتوحة */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '14px 16px', 
            borderTop: '3px solid #E58A13', 
            cursor: 'pointer',
            background: statusFilter === 'open' ? '#FFFBEB' : '#FFFFFF',
            transform: statusFilter === 'open' ? 'translateY(-2px)' : 'none',
            boxShadow: statusFilter === 'open' ? '0 4px 12px rgba(229,138,19,0.15)' : 'none'
          }}
          onClick={() => { setStatusFilter('open'); setPriorityFilter('all'); }}
          title="انقر لتصفية التذاكر المفتوحة"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>بانتظار الرد</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E58A13', margin: '4px 0' }}>{openTicketsCount}</div>
          <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: '700' }}>تتطلب استجابة فورية ⚡</div>
        </div>

        {/* Card 3: قيد المعالجة */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '14px 16px', 
            borderTop: '3px solid #0284C7', 
            cursor: 'pointer',
            background: statusFilter === 'in_progress' ? '#F0F9FF' : '#FFFFFF',
            transform: statusFilter === 'in_progress' ? 'translateY(-2px)' : 'none',
            boxShadow: statusFilter === 'in_progress' ? '0 4px 12px rgba(2,132,199,0.15)' : 'none'
          }}
          onClick={() => { setStatusFilter('in_progress'); setPriorityFilter('all'); }}
          title="انقر لتصفية التذاكر قيد المعالجة"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>قيد المعالجة</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284C7', margin: '4px 0' }}>{inProgressTicketsCount}</div>
          <div style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: '700' }}>تحت المتابعة الفنية ⚙️</div>
        </div>

        {/* Card 4: تذاكر حرجة */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '14px 16px', 
            borderTop: '3px solid #DC2626', 
            cursor: 'pointer',
            background: priorityFilter === 'urgent' || priorityFilter === 'high' ? '#FEF2F2' : '#FFFFFF',
            transform: priorityFilter === 'urgent' || priorityFilter === 'high' ? 'translateY(-2px)' : 'none',
            boxShadow: priorityFilter === 'urgent' || priorityFilter === 'high' ? '0 4px 12px rgba(220,38,38,0.15)' : 'none'
          }}
          onClick={() => { setPriorityFilter('high'); setStatusFilter('all'); }}
          title="انقر لتصفية التذاكر ذات الأولوية العالية والحرجة"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>أولوية حرجة / عالية</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{urgentTicketsCount}</span>
            <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: '4px' }}>⚡ عاجل</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#DC2626', fontWeight: '700' }}>SLA متبقي &lt; 20 دقيقة</div>
        </div>

        {/* Card 5: تذاكر محلولة */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '14px 16px', 
            borderTop: '3px solid #059669', 
            cursor: 'pointer',
            background: statusFilter === 'resolved' || statusFilter === 'closed' ? '#F0FDF4' : '#FFFFFF',
            transform: statusFilter === 'resolved' || statusFilter === 'closed' ? 'translateY(-2px)' : 'none',
            boxShadow: statusFilter === 'resolved' || statusFilter === 'closed' ? '0 4px 12px rgba(5,150,105,0.15)' : 'none'
          }}
          onClick={() => { setStatusFilter('closed'); setPriorityFilter('all'); }}
          title="انقر لتصفية التذاكر المغلقة والمحلولة"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>محلولة ومغلقة</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', margin: '4px 0' }}>{resolvedTicketsCount}</div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>رضا العملاء 98.4% ✓</div>
        </div>

        {/* Card 6: متوسط وقت الاستجابة */}
        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #6366F1', cursor: 'pointer' }}
          onClick={() => setIsSlaModalOpen(true)}
          title="انقر لعرض تقرير كفاءة الـ SLA"
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>متوسط الاستجابة</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#6366F1', margin: '4px 0' }}>14 دقيقة</div>
          <div style={{ fontSize: '10.5px', color: '#6366F1', fontWeight: '700' }}>تحسن بنسبة +24% 📊</div>
        </div>
      </div>

      {/* 3. Advanced Multi-Filter Toolbar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input 
            type="text"
            className="admin-search-input"
            placeholder="بحث برقم التذكرة #TCK-، اسم العميل، المستشار المتابع، أو الموضوع..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingRight: '12px', height: '36px', fontSize: '12.5px' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>الحالة:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '130px', height: '36px', fontSize: '12px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">كافة الحالات</option>
            <option value="open">مفتوحة (جديدة)</option>
            <option value="in_progress">قيد المعالجة</option>
            <option value="pending_client">بانتظار رد العميل</option>
            <option value="resolved">تم الحل</option>
            <option value="closed">مغلقة نهائياً</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>الأولوية:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '120px', height: '36px', fontSize: '12px' }}
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">كافة الأولويات</option>
            <option value="urgent">حرجة (عاجلة جداً)</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>القسم:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '140px', height: '36px', fontSize: '12px' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">كافة الأقسام</option>
            <option value="مالي ودفع">مالي وبوابات الدفع</option>
            <option value="توثيق الحسابات">توثيق الحسابات</option>
            <option value="جلسات وفيديو">جلسات الاستشارة</option>
            <option value="الذكاء الاصطناعي">المساعد الذكي AI</option>
            <option value="شكاوى ونزاعات">شكاوى ونزاعات</option>
          </select>
        </div>

        {/* User Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>الجهة:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '110px', height: '36px', fontSize: '12px' }}
            value={userTypeFilter}
            onChange={e => setUserTypeFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="شركة">شركات</option>
            <option value="مستشار">مستشارون</option>
            <option value="فرد">أفراد</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || userTypeFilter !== 'all') && (
          <button 
            type="button" 
            onClick={clearAllFilters}
            className="admin-btn-action-outline"
            style={{ fontSize: '11.5px', padding: '6px 12px', color: '#DC2626', borderColor: '#FCA5A5', cursor: 'pointer' }}
          >
            مسح الفلاتر ✕
          </button>
        )}
      </div>

      {/* 4. Rich Tickets Grid / Table */}
      <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
            قائمة التذاكر والجلسات النشطة ({filteredTickets.length})
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            انقر على أي صف لفتح المحادثة أو إدارة الجلسة والمستشار المتابع
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>رقم التذكرة</th>
                <th>الموضوع والجهة</th>
                <th>مقدم التذكرة</th>
                <th style={{ width: '150px' }}>المستشار والجلسة</th>
                <th style={{ width: '100px' }}>الأولوية</th>
                <th style={{ width: '120px' }}>الحالة</th>
                <th>المشرف المتابع</th>
                <th style={{ width: '110px' }}>آخر نشاط</th>
                <th style={{ width: '140px', textAlign: 'center' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    لا توجد تذاكر مطابقة لخيارات البحث والتصفية المحددة.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr 
                    key={t.id} 
                    style={{ 
                      background: t.priority === 'urgent' ? '#FFFBEB' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => setSelectedTicket(t)}
                  >
                    {/* Ticket Number & SLA Badge */}
                    <td>
                      <div style={{ fontWeight: '900', color: '#0A3C64', fontSize: '13px' }}>{t.ticketNumber}</div>
                      {t.status === 'open' && t.slaMinutes > 0 && (
                        <div style={{ fontSize: '10px', color: t.slaMinutes <= 20 ? '#DC2626' : '#D97706', fontWeight: '800', marginTop: '2px' }}>
                          ⏱ SLA: {t.slaMinutes} دقيقة
                        </div>
                      )}
                    </td>

                    {/* Subject & Department Badge */}
                    <td>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13px', marginBottom: '4px' }}>
                        {t.subject}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', padding: '1px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontWeight: '700' }}>
                          {t.category}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>• {t.categoryBadge}</span>
                      </div>
                    </td>

                    {/* Submitter Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '12.5px' }}>{t.submitter}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          fontWeight: '800',
                          background: t.userType === 'شركة' ? '#EFF6FF' : t.userType === 'مستشار' ? '#FEF3C7' : '#F3F4F6',
                          color: t.userType === 'شركة' ? '#1D4ED8' : t.userType === 'مستشار' ? '#B45309' : '#374151'
                        }}>
                          {t.userType}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>{t.phone}</div>
                    </td>

                    {/* Linked Consultant & Session status */}
                    <td onClick={e => e.stopPropagation()}>
                      {t.linkedSession ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0A3C64', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>⚖️ {t.linkedSession.consultantName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              fontWeight: '700',
                              background: t.linkedSession.sessionStatus === 'confirmed' ? '#DCFCE7' : t.linkedSession.sessionStatus === 'in_progress' ? '#E0F2FE' : t.linkedSession.sessionStatus === 'completed' ? '#F1F5F9' : '#FEE2E2',
                              color: t.linkedSession.sessionStatus === 'confirmed' ? '#15803D' : t.linkedSession.sessionStatus === 'in_progress' ? '#0284C7' : t.linkedSession.sessionStatus === 'completed' ? '#475569' : '#DC2626'
                            }}>
                              {t.linkedSession.sessionStatus === 'confirmed' ? 'مؤكدة' : t.linkedSession.sessionStatus === 'in_progress' ? 'قيد التنفيذ' : t.linkedSession.sessionStatus === 'completed' ? 'مكتملة' : 'ملغاة'}
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleOpenSessionModal(t)}
                              style={{ fontSize: '10.5px', background: 'transparent', border: 'none', color: '#E58A13', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                              title="تغيير المستشار أو تعديل وضعية الجلسة"
                            >
                              تعديل 🔄
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleOpenSessionModal(t)}
                          className="admin-btn-action-outline"
                          style={{ fontSize: '10.5px', padding: '2px 8px', color: '#0A3C64' }}
                        >
                          + ربط بمستشار
                        </button>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td onClick={e => e.stopPropagation()}>
                      <select 
                        className="admin-select-input"
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          padding: '2px 6px', 
                          height: '28px',
                          background: t.priority === 'urgent' ? '#FEE2E2' : t.priority === 'high' ? '#FFEDD5' : t.priority === 'medium' ? '#FEF3C7' : '#F1F5F9',
                          color: t.priority === 'urgent' ? '#DC2626' : t.priority === 'high' ? '#C2410C' : t.priority === 'medium' ? '#B45309' : '#64748B',
                          border: 'none'
                        }}
                        value={t.priority}
                        onChange={e => handleUpdatePriority(t.id, e.target.value)}
                      >
                        <option value="urgent">🔴 حرجة</option>
                        <option value="high">🟠 عالية</option>
                        <option value="medium">🟡 متوسطة</option>
                        <option value="low">🟢 منخفضة</option>
                      </select>
                    </td>

                    {/* Status Badge */}
                    <td onClick={e => e.stopPropagation()}>
                      <select 
                        className="admin-select-input"
                        style={{ 
                          fontSize: '11.5px', 
                          fontWeight: '800', 
                          padding: '2px 8px', 
                          height: '28px',
                          background: t.status === 'open' ? '#FEF3C7' : t.status === 'in_progress' ? '#E0F2FE' : t.status === 'pending_client' ? '#EDE9FE' : t.status === 'resolved' ? '#DCFCE7' : '#F1F5F9',
                          color: t.status === 'open' ? '#D97706' : t.status === 'in_progress' ? '#0284C7' : t.status === 'pending_client' ? '#7C3AED' : t.status === 'resolved' ? '#15803D' : '#64748B',
                          border: 'none'
                        }}
                        value={t.status}
                        onChange={e => handleUpdateStatus(t.id, e.target.value)}
                      >
                        <option value="open">مفتوحة</option>
                        <option value="in_progress">قيد المعالجة</option>
                        <option value="pending_client">بانتظار العميل</option>
                        <option value="resolved">تم الحل</option>
                        <option value="closed">مغلقة</option>
                      </select>
                    </td>

                    {/* Assignee Supervisor */}
                    <td onClick={e => e.stopPropagation()}>
                      <select 
                        className="admin-select-input"
                        style={{ fontSize: '11px', height: '28px', border: '1px solid #E2E8F0', padding: '2px 4px', maxWidth: '140px' }}
                        value={t.assignee}
                        onChange={e => handleAssignAgent(t.id, e.target.value)}
                      >
                        {supportAgents.map((agent, i) => (
                          <option key={i} value={agent}>{agent.split(' ')[0]} {agent.split(' ')[1]}</option>
                        ))}
                      </select>
                    </td>

                    {/* Last Updated */}
                    <td style={{ fontSize: '11.5px', color: '#64748B' }}>
                      {t.updatedAt}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="admin-btn-action-primary"
                          style={{ fontSize: '11.5px', padding: '5px 10px', background: '#E58A13', borderColor: '#E58A13', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer' }}
                        >
                          عرض والرد
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleOpenSessionModal(t)}
                          className="admin-btn-action-outline"
                          style={{ fontSize: '11.5px', padding: '5px 8px', background: '#FFFFFF', cursor: 'pointer' }}
                          title="تعديل المستشار أو الجلسة"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. INTERACTIVE TICKET CONVERSATION DRAWER / MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '1080px', width: '94%', maxHeight: '92vh', overflowY: 'auto', padding: '24px', borderRadius: '12px' }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#0A3C64' }}>{selectedTicket.ticketNumber}</span>
                  <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontWeight: '800' }}>
                    {selectedTicket.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>• {selectedTicket.createdAt}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>
                  {selectedTicket.subject}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Change Status select */}
                <select 
                  className="admin-select-input"
                  style={{ height: '34px', fontSize: '12px', fontWeight: '700' }}
                  value={selectedTicket.status}
                  onChange={e => handleUpdateStatus(selectedTicket.id, e.target.value)}
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="pending_client">بانتظار رد العميل</option>
                  <option value="resolved">تم الحل</option>
                  <option value="closed">إغلاق التذكرة</option>
                </select>

                {selectedTicket.status !== 'closed' && (
                  <button 
                    type="button"
                    className="admin-btn-action-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', color: '#DC2626', borderColor: '#FCA5A5', cursor: 'pointer' }}
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                  >
                    إغلاق التذكرة ✕
                  </button>
                )}

                <button 
                  type="button"
                  className="admin-icon-btn-minimal" 
                  style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer' }}
                  onClick={() => setSelectedTicket(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Two-Column Drawer Content (Left: Profile & Session Card, Right: Conversation & Reply Box) */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* Column 1: Submitter Info & LINKED SESSION MANAGEMENT CARD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1.1 Customer Info Card */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '900', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '10px' }}>
                    بيانات صاحب التذكرة
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>الاسم / الجهة:</span>
                      <strong style={{ color: '#0F172A', fontSize: '13px' }}>{selectedTicket.submitter}</strong>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>نوع الحساب:</span>
                      <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: '800' }}>
                        {selectedTicket.userType}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>الهاتف / البريد:</span>
                      <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: '11.5px' }}>{selectedTicket.phone}</span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>المشرف المسؤول:</span>
                      <strong style={{ color: '#0A3C64' }}>{selectedTicket.assignee}</strong>
                    </div>
                  </div>
                </div>

                {/* 1.2 LINKED SESSION & CONSULTANT MANAGEMENT CARD */}
                <div style={{ background: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#0A3C64' }}>
                      ⚖️ الجلسة والمستشار المتابع
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleOpenSessionModal(selectedTicket)}
                      style={{ fontSize: '11px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      تعديل 🔄
                    </button>
                  </div>

                  {selectedTicket.linkedSession ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>المستشار المعين:</span>
                        <strong style={{ color: '#0A3C64', fontSize: '13px' }}>{selectedTicket.linkedSession.consultantName}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>وضعية وحالة الجلسة:</span>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontWeight: '800',
                          background: selectedTicket.linkedSession.sessionStatus === 'confirmed' ? '#DCFCE7' : selectedTicket.linkedSession.sessionStatus === 'in_progress' ? '#E0F2FE' : '#FEE2E2',
                          color: selectedTicket.linkedSession.sessionStatus === 'confirmed' ? '#15803D' : selectedTicket.linkedSession.sessionStatus === 'in_progress' ? '#0284C7' : '#DC2626'
                        }}>
                          {selectedTicket.linkedSession.sessionStatus === 'confirmed' ? '✓ مؤكدة' : selectedTicket.linkedSession.sessionStatus === 'in_progress' ? '⚙️ قيد التنفيذ' : selectedTicket.linkedSession.sessionStatus === 'completed' ? '✓ مكتملة' : '✕ ملغاة'}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>الموعد المجدول:</span>
                        <span style={{ color: '#334155', fontWeight: '600' }}>{selectedTicket.linkedSession.scheduledAt}</span>
                      </div>

                      {/* Quick Session Management Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => handleOpenSessionModal(selectedTicket)}
                          className="admin-btn-action-primary"
                          style={{ fontSize: '11.5px', padding: '6px 10px', background: '#0A3C64', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                        >
                          🔄 تغيير المستشار / إعادة الجدولة
                        </button>

                        <button 
                          type="button" 
                          onClick={() => alert(`جاري الانضمام بصفة مراقب إداري مخفي للجلسة ${selectedTicket.linkedSession.sessionId}`)}
                          className="admin-btn-action-outline"
                          style={{ fontSize: '11.5px', padding: '5px 10px', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                        >
                          👁️ فتح غرفة المراقبة الحية
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 8px 0' }}>لا توجد جلسة مرتبطة بهذه التذكرة حالياً</p>
                      <button 
                        type="button" 
                        onClick={() => handleOpenSessionModal(selectedTicket)}
                        className="admin-btn-action-outline"
                        style={{ fontSize: '11px', padding: '4px 10px', color: '#0A3C64' }}
                      >
                        + ربط استشارة وتعيين مستشار
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Thread Timeline & Rich Reply Console */}
              <div>
                {/* Messages Thread Timeline */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedTicket.replies.map((rep, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: rep.isInternal ? '#FEF3C7' : rep.role === 'client' ? '#F8FAFC' : rep.role === 'consultant' ? '#F0FDF4' : '#EFF6FF',
                        border: rep.isInternal ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                        borderRight: rep.isInternal ? '4px solid #E58A13' : rep.role === 'client' ? '4px solid #94A3B8' : '4px solid #0A3C64'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '12.5px', color: rep.isInternal ? '#B45309' : '#0F172A' }}>
                            {rep.sender}
                          </strong>
                          {rep.isInternal && (
                            <span style={{ fontSize: '10px', background: '#D97706', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              🔒 سرية للمدراء
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{rep.time}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: rep.isInternal ? '#78350F' : '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {rep.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Rich Reply Console */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  {/* Mode Selector Tabs (Public Reply vs Private Internal Note) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          background: !isInternalNote ? '#0A3C64' : '#FFFFFF',
                          color: !isInternalNote ? '#FFFFFF' : '#64748B',
                          border: !isInternalNote ? '1px solid #0A3C64' : '1px solid #CBD5E1'
                        }}
                      >
                        💬 رد رسمي للعميل
                      </button>

                      <button 
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          background: isInternalNote ? '#E58A13' : '#FFFFFF',
                          color: isInternalNote ? '#FFFFFF' : '#64748B',
                          border: isInternalNote ? '1px solid #E58A13' : '1px solid #CBD5E1'
                        }}
                      >
                        🔒 تدوين ملاحظة سرية للمدراء
                      </button>
                    </div>

                    {/* Canned Templates Dropdown */}
                    {!isInternalNote && (
                      <select 
                        className="admin-select-input"
                        style={{ fontSize: '11.5px', height: '32px', width: '210px', background: '#FFFFFF' }}
                        value={selectedCannedTemplate}
                        onChange={e => handleApplyTemplate(e.target.value)}
                      >
                        <option value="">⚡ اختيار قالب رد سريع...</option>
                        {cannedTemplates.map(tmpl => (
                          <option key={tmpl.id} value={tmpl.id}>{tmpl.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Reply Textarea */}
                  <textarea 
                    rows="3"
                    className="admin-search-input"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      background: isInternalNote ? '#FFFDF5' : '#FFFFFF',
                      borderColor: isInternalNote ? '#FDE68A' : '#CBD5E1'
                    }}
                    placeholder={isInternalNote ? "اكتب ملاحظة داخلية سرية يراها فريق الإدارة فقط..." : "اكتب ردك الرسمي للعميل هنا..."}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />

                  {/* Submit Bar with Auto-status Changer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>تحديث الحالة بعد الإرسال:</span>
                      <select 
                        className="admin-select-input"
                        style={{ height: '30px', fontSize: '11px', background: '#FFFFFF' }}
                        value={replyStatusUpdate}
                        onChange={e => setReplyStatusUpdate(e.target.value)}
                      >
                        <option value="">(الإبقاء على الحالة الحالية)</option>
                        <option value="pending_client">تحويل إلى: بانتظار رد العميل</option>
                        <option value="in_progress">تحويل إلى: قيد المعالجة</option>
                        <option value="resolved">تحويل إلى: تم الحل</option>
                      </select>
                    </div>

                    <button 
                      type="button"
                      onClick={handleSendReply}
                      className="admin-btn-action-primary"
                      style={{
                        padding: '7px 22px',
                        fontSize: '12.5px',
                        fontWeight: '800',
                        background: isInternalNote ? '#E58A13' : '#0A3C64',
                        borderColor: isInternalNote ? '#E58A13' : '#0A3C64',
                        cursor: 'pointer'
                      }}
                    >
                      {isInternalNote ? 'حفظ الملاحظة السرية 🔒' : 'إرسال الرد للعميل ✉️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          6. REASSIGN CONSULTANT & CHANGE SESSION STATUS MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {sessionModalTicket && (
        <div className="admin-modal-overlay" onClick={() => setSessionModalTicket(null)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '580px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                  🔄 تعديل المستشار المتابع ووضعية الجلسة
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  للتذكرة: {sessionModalTicket.ticketNumber} — {sessionModalTicket.submitter}
                </span>
              </div>
              <button 
                type="button"
                className="admin-icon-btn-minimal" 
                style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer' }}
                onClick={() => setSessionModalTicket(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Select Consultant */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  المستشار المعين للمتابعة:
                </label>
                <select 
                  className="admin-select-input"
                  style={{ width: '100%', height: '38px', fontSize: '13px' }}
                  value={newConsultantSelection}
                  onChange={e => setNewConsultantSelection(e.target.value)}
                >
                  {platformConsultants.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.specialty}) — تقييم: {c.rating}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  سيتم إرسال إشعار للمستشار الجديد برقم التذكرة والجلسة.
                </span>
              </div>

              {/* 2. Select Session Status */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  وضعية وحالة الجلسة:
                </label>
                <select 
                  className="admin-select-input"
                  style={{ width: '100%', height: '38px', fontSize: '13px', fontWeight: '700' }}
                  value={newSessionStatusSelection}
                  onChange={e => setNewSessionStatusSelection(e.target.value)}
                >
                  <option value="confirmed">🟢 مؤكدة وجاهزة للانعقاد (Confirmed)</option>
                  <option value="in_progress">🔵 قيد التنفيذ والمحادثة (In Progress)</option>
                  <option value="completed">⚪ مكتملة ومنتهية بنجاح (Completed)</option>
                  <option value="pending">🟡 معلقة بانتظار التأكيد (Pending)</option>
                  <option value="cancelled">🔴 ملغاة مع إعادة الرصيد للعميل (Cancelled)</option>
                </select>
              </div>

              {/* 3. Reschedule Date & Time */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  موعد وتوقيت الجلسة (إعادة الجدولة):
                </label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  value={newScheduledDate}
                  onChange={e => setNewScheduledDate(e.target.value)}
                  style={{ width: '100%', height: '38px', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}
                  placeholder="مثال: 2026-08-31 10:00"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setSessionModalTicket(null)}
                  className="admin-btn-action-outline"
                  style={{ fontSize: '12.5px', padding: '7px 18px', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveSessionAndConsultantChanges}
                  className="admin-btn-action-primary"
                  style={{ fontSize: '12.5px', padding: '7px 22px', background: '#0A3C64', borderColor: '#0A3C64', cursor: 'pointer' }}
                >
                  حفظ وتطبيق التغييرات ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          7. CREATE NEW TICKET MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                + إنشاء تذكرة دعم أو تصعيد داخلي
              </h3>
              <button 
                type="button"
                className="admin-icon-btn-minimal" 
                style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer' }}
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    اسم العميل / الجهة المتقدمة: *
                  </label>
                  <input 
                    type="text" 
                    required
                    className="admin-search-input" 
                    placeholder="مثال: شركة الرؤية المتقدمة أو أ. خالد النعيمي..."
                    value={newTicketData.submitter}
                    onChange={e => setNewTicketData({ ...newTicketData, submitter: e.target.value })}
                    style={{ width: '100%', height: '36px', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>نوع الحساب:</label>
                    <select 
                      className="admin-select-input"
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                      value={newTicketData.userType}
                      onChange={e => setNewTicketData({ ...newTicketData, userType: e.target.value })}
                    >
                      <option value="شركة">شركة / مؤسسة</option>
                      <option value="مستشار">مستشار ضريبي</option>
                      <option value="فرد">فرد / باحث</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>القسم المختص:</label>
                    <select 
                      className="admin-select-input"
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                      value={newTicketData.category}
                      onChange={e => setNewTicketData({ ...newTicketData, category: e.target.value })}
                    >
                      <option value="مالي ودفع">مالي وبوابات الدفع</option>
                      <option value="توثيق الحسابات">توثيق الحسابات والشهادات</option>
                      <option value="جلسات وفيديو">جلسات الاستشارة والفيديو</option>
                      <option value="الذكاء الاصطناعي">المساعد الذكي AI</option>
                      <option value="شكاوى ونزاعات">شكاوى ونزاعات</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>درجة الأولوية:</label>
                    <select 
                      className="admin-select-input"
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                      value={newTicketData.priority}
                      onChange={e => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                    >
                      <option value="urgent">🔴 حرجة (عاجل جداً)</option>
                      <option value="high">🟠 عالية</option>
                      <option value="medium">🟡 متوسطة</option>
                      <option value="low">🟢 منخفضة</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>المشرف المسؤول:</label>
                    <select 
                      className="admin-select-input"
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                      value={newTicketData.assignee}
                      onChange={e => setNewTicketData({ ...newTicketData, assignee: e.target.value })}
                    >
                      {supportAgents.map((agent, i) => (
                        <option key={i} value={agent}>{agent}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    موضوع التذكرة: *
                  </label>
                  <input 
                    type="text" 
                    required
                    className="admin-search-input" 
                    placeholder="عنوان المشكلة أو الاستفسار باختصار..."
                    value={newTicketData.subject}
                    onChange={e => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                    style={{ width: '100%', height: '36px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    تفاصيل الرسالة أو المشكلة:
                  </label>
                  <textarea 
                    rows="3"
                    className="admin-search-input" 
                    placeholder="شرح كامل لتفاصيل المشكلة أو طلب العميل..."
                    value={newTicketData.initialMessage}
                    onChange={e => setNewTicketData({ ...newTicketData, initialMessage: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="admin-btn-action-outline"
                    style={{ fontSize: '12px', padding: '7px 16px', cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="admin-btn-action-primary"
                    style={{ fontSize: '12px', padding: '7px 20px', background: '#0A3C64', borderColor: '#0A3C64', cursor: 'pointer' }}
                  >
                    إنشاء التذكرة وحفظها ✓
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          8. SLA PERFORMANCE METRICS MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {isSlaModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsSlaModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '650px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                📊 تقرير أداء وسرعة الاستجابة (SLA Performance)
              </h3>
              <button 
                type="button"
                className="admin-icon-btn-minimal" 
                style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer' }}
                onClick={() => setIsSlaModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B' }}>متوسط أول رد:</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0A3C64' }}>14 دقيقة</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B' }}>الالتزام بـ SLA:</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#059669' }}>98.4%</div>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.7', background: '#F0F9FF', padding: '12px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
              يتم احتساب اتفاقية مستوى الخدمة تلقائياً بناءً على درجة الأولوية:
              <br />• <strong>أولوية حرجة:</strong> الرد خلال 15 دقيقة كحد أقصى.
              <br />• <strong>أولوية عالية:</strong> الرد خلال 45 دقيقة.
              <br />• <strong>أولوية متوسطة:</strong> الرد خلال ساعتين.
              <br />• <strong>أولوية منخفضة:</strong> الرد خلال 24 ساعة.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setIsSlaModalOpen(false)}
                className="admin-btn-action-outline"
                style={{ fontSize: '12px', padding: '6px 18px', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

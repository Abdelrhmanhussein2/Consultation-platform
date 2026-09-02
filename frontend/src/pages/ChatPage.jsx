import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { appointmentService } from '../services/appointmentService';
import { chatAiService } from '../services/chatAiService';
import Toast, { useToast } from '../components/Toast/Toast';
import './ChatPage.css';

// Formal SVG Icons (No childish emojis)
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#627D98" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PinIcon = ({ isPinned }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? '#F5A52A' : 'none'} stroke={isPinned ? '#F5A52A' : '#829AB1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function ChatPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  // Chats list & active chat
  const [appointments, setAppointments] = useState([]);
  const [activeAppt, setActiveAppt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [pinnedApptIds, setPinnedApptIds] = useState([]);
  // Track unread count per appointment id
  const [unreadCounts, setUnreadCounts] = useState({});
  // Track last message time per appointment for sorting
  const [lastMsgTime, setLastMsgTime] = useState({});
  // Persist hidden (deleted) chat IDs across page refreshes
  const [hiddenChatIds, setHiddenChatIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cp_hidden_chats') || '[]'); } catch { return []; }
  });
  // Custom confirmation modal (replaces window.confirm)
  const [confirmModal, setConfirmModal] = useState({ open: false, apptId: null });

  // UI Filters & Search
  const [chatSearch, setChatSearch] = useState('');
  const [consultationFilter, setConsultationFilter] = useState('all');

  // Formatting state for rich editor (Bold, Italic, Underline)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Left Details Accordion Open States
  const [expandedSections, setExpandedSections] = useState({
    client: false,
    consultant: false,
    topic: true,
    status: true,
    schedule: false,
    service_type: false,
    files: false,
    ai_summary: false,
    rating: false
  });
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);

  // Modals state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [customNewTemplate, setCustomNewTemplate] = useState('');
  const [templatesList, setTemplatesList] = useState([
    'شكراً لك، راجعت المعلومات وسأرسل لك ملاحظاتي التفصيلية قبل الجلسة القادمة.',
    'تم استلام المستند وسأقوم بمراجعته والرد عليك ضمن المحادثة.',
    'يمكننا مناقشة هذه النقطة بالتفصيل خلال الجلسة القادمة.',
    'أقترح تعديل المستند وفق الملاحظات الحالية ثم إرسال النسخة المحدثة للمراجعة النهائية.',
    'تمت مراجعة النقطة، ويمكنك المتابعة بالإجراء المقتَرَح وسنقوم بتأكيد النتيجة في الجلسة القادمة.'
  ]);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiParams, setAiParams] = useState({
    purpose: 'اقتراح رد',
    language: 'ar',
    creativity: 'منخفض',
    results_count: 1,
    max_length: 120,
    description: 'اكتب رداً مهنياً ومختصراً اعتماداً على سياق المحادثة الحالية'
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultText, setAiResultText] = useState('');

  const [showAuditLogModal, setShowAuditLogModal] = useState(false);

  // Refs
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Load appointments
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!token) return;
      setLoading(true);
      try {
        let list = await appointmentService.getMyAppointments(token).catch(() => []);
        if (!Array.isArray(list) || list.length === 0) {
          const incoming = await consultantService.getIncomingAppointments(token).catch(() => []);
          if (Array.isArray(incoming) && incoming.length > 0) list = incoming;
        }

        // Deduplicate conversations so each partner has 1 single chat thread
        const partnerMap = new Map();
        (list || []).forEach(appt => {
          if (appt.status === 'cancelled') return;
          const isConsultantRole = user?.role === 'consultant' ||
            (user?.profile && String(appt.consultant_id) === String(user.profile.id));

          const partnerIdKey = isConsultantRole
            ? (appt.user_id || appt.user?.id || appt.client_name || 'client')
            : (appt.consultant_id || appt.consultant?.id || appt.consultant_name || 'consultant');

          if (!partnerMap.has(partnerIdKey)) {
            partnerMap.set(partnerIdKey, appt);
          }
        });

        let validChats = Array.from(partnerMap.values());
        if (validChats.length === 0) {
          validChats = [
            {
              id: '929fbe80-60b6-455b-a818-b2a8c3dca018',
              client_name: 'رانيا الخطيب',
              consultant_name: 'عبدالرحمن حسين محمد حسين الأصفر',
              service_name: 'جلسة فيديو 30 دقيقة',
              status: 'confirmed',
              scheduled_at: new Date().toISOString()
            }
          ];
        }

        setAppointments(validChats);

        // Initialize last message time from scheduled_at as fallback
        const initTimes = {};
        validChats.forEach(a => { initTimes[a.id] = a.updated_at || a.scheduled_at || a.created_at || ''; });
        setLastMsgTime(initTimes);

        const urlParams = new URLSearchParams(window.location.search);
        const paramApptId = urlParams.get('apptId') || urlParams.get('appointment_id');
        const paramUser = urlParams.get('user');
        let targetChat = null;

        if (paramApptId) {
          targetChat = validChats.find(a => String(a.id) === String(paramApptId));
        }

        if (!targetChat && paramUser) {
          const uSearch = paramUser.toLowerCase().trim();
          targetChat = validChats.find(a => {
            const pName = (getPartnerName(a) || '').toLowerCase();
            const clientName = (a.client_name || a.user?.full_name || '').toLowerCase();
            const consultantName = (a.consultant_name || a.consultant?.user?.full_name || '').toLowerCase();
            return pName.includes(uSearch) || uSearch.includes(pName) ||
                   clientName.includes(uSearch) || uSearch.includes(clientName) ||
                   consultantName.includes(uSearch) || uSearch.includes(consultantName);
          });

          if (!targetChat) {
            const isConsultantRole = user?.role === 'consultant';
            targetChat = {
              id: `new-chat-${Date.now()}`,
              client_name: isConsultantRole ? paramUser : (user?.full_name || 'عميل الاستشارة'),
              consultant_name: isConsultantRole ? (user?.full_name || 'عبدالرحمن حسين محمد حسين الأصفر') : paramUser,
              service_name: 'محادثة استشارية جديدة',
              status: 'confirmed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            validChats = [targetChat, ...validChats];
            setAppointments(validChats);
          }
        }

        if (targetChat) {
          handleSelectChat(targetChat);
        } else if (validChats.length > 0) {
          handleSelectChat(validChats[0]);
        }
      } catch (err) {
        showToast('فشل تحميل قائمة المحادثات.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [token, user]);

  // Handle WebSocket Connection
  useEffect(() => {
    if (!activeAppt) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/chat/ws/${activeAppt.id}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'read' }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_message') {
          const msg = payload.data;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Update last message time for sorting
          setLastMsgTime(prev => ({ ...prev, [activeAppt.id]: msg.created_at || new Date().toISOString() }));
          // Increment unread count only if this chat is NOT active
          setUnreadCounts(prev => {
            // msg.sender_id not equal to current user = incoming message
            if (msg.sender_id !== user?.id) {
              return { ...prev, [activeAppt.id]: (prev[activeAppt.id] || 0) + 1 };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error parsing socket event:', err);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeAppt, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Real-time message polling fallback (every 3 seconds) to ensure messages update instantly
  useEffect(() => {
    if (!activeAppt?.id || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${activeAppt.id}/messages?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const msgs = await res.json();
          if (Array.isArray(msgs)) {
            setMessages(prev => {
              if (msgs.length !== prev.length || (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1].id)) {
                return msgs;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // silent polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeAppt, token]);

  const handleSelectChat = async (appt) => {
    setActiveAppt(appt);
    setMessages([]);
    // Clear unread badge when opening conversation
    setUnreadCounts(prev => ({ ...prev, [appt.id]: 0 }));

    if (appt?.id) {
      const newUrl = `${window.location.pathname}?apptId=${appt.id}`;
      window.history.pushState({ apptId: appt.id }, '', newUrl);
    }

    try {
      const res = await fetch(`/api/chat/${appt.id}/messages?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        // Set last message time from actual messages
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          setLastMsgTime(prev => ({ ...prev, [appt.id]: lastMsg.created_at || prev[appt.id] }));
        }
      }
    } catch (err) {
      showToast('خطأ أثناء جلب الرسائل.', 'error');
    }
  };

  const handleSendMessage = async (e, closeAfter = false) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    let textToSend = inputText.trim();

    if (isBold && !textToSend.includes('**')) textToSend = `**${textToSend}**`;
    if (isItalic && !textToSend.includes('*')) textToSend = `*${textToSend}*`;
    if (isUnderline && !textToSend.includes('<u>')) textToSend = `<u>${textToSend}</u>`;

    setInputText('');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);

    // Update timestamp immediately to float active chat to the top of the sidebar list
    const nowIso = new Date().toISOString();
    setLastMsgTime(prev => ({ ...prev, [activeAppt.id]: nowIso }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message_text: textToSend,
        attachment_url: null
      }));
    } else {
      try {
        const res = await fetch(`/api/chat/${activeAppt.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message_text: textToSend })
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages(prev => [...prev, newMsg]);
        }
      } catch (err) {
        showToast('فشل إرسال الرسالة.', 'error');
      }
    }

    if (closeAfter) {
      showToast('تم إرسال الرد وإغلاق الجلسة.', 'info');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeAppt) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('جاري رفع الملف...', 'info');
      const res = await fetch(`/api/chat/${activeAppt.id}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        showToast('تم رفع إرفاق المستند بنجاح', 'success');
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || 'حدث خطأ أثناء رفع الملف.', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء رفع الملف.', 'error');
    }
  };

  const togglePinChat = (apptId, e) => {
    if (e) e.stopPropagation();
    setPinnedApptIds(prev => {
      if (prev.includes(apptId)) {
        showToast('تم إلغاء تثبيت المحادثة', 'info');
        return prev.filter(id => id !== apptId);
      } else {
        showToast('تم تثبيت المحادثة في الأعلى', 'success');
        return [...prev, apptId];
      }
    });
  };

  const handleDeleteChat = async (apptId, e) => {
    if (e) e.stopPropagation();
    // Open custom confirm modal instead of window.confirm
    setConfirmModal({ open: true, apptId });
  };

  const handleConfirmDelete = async () => {
    const apptId = confirmModal.apptId;
    setConfirmModal({ open: false, apptId: null });
    try {
      const res = await fetch(`/api/chat/${apptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('تم حذف المحادثة وإزالتها بنجاح', 'success');
        const newHidden = [...hiddenChatIds, String(apptId)];
        setHiddenChatIds(newHidden);
        localStorage.setItem('cp_hidden_chats', JSON.stringify(newHidden));
        setAppointments(prev => {
          const updated = prev.filter(a => String(a.id) !== String(apptId));
          if (activeAppt && String(activeAppt.id) === String(apptId)) {
            if (updated.length > 0) { handleSelectChat(updated[0]); }
            else { setActiveAppt(null); setMessages([]); }
          }
          return updated;
        });
      }
    } catch {
      showToast('فشل حذف المحادثة.', 'error');
    }
  };

  // Selection-based Formatting Helper (Bold, Italic, Underline)
  const applyFormattingToSelection = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      if (type === 'bold') setIsBold(!isBold);
      if (type === 'italic') setIsItalic(!isItalic);
      if (type === 'underline') setIsUnderline(!isUnderline);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let prefix = '';
    let suffix = '';
    if (type === 'bold') { prefix = '**'; suffix = '**'; }
    else if (type === 'italic') { prefix = '*'; suffix = '*'; }
    else if (type === 'underline') { prefix = '<u>'; suffix = '</u>'; }

    if (start !== end) {
      const selectedText = inputText.substring(start, end);
      const updatedText =
        inputText.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        inputText.substring(end);

      setInputText(updatedText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 40);
    } else {
      if (type === 'bold') setIsBold(!isBold);
      if (type === 'italic') setIsItalic(!isItalic);
      if (type === 'underline') setIsUnderline(!isUnderline);
    }
  };

  // Rich Text Message Renderer (**bold**, *italic*, <u>underline</u>)
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, lIdx) => {
      let elements = [line];

      elements = elements.flatMap((item, idx) => {
        if (typeof item !== 'string') return item;
        const parts = item.split(/(<u>.*?<\/u>)/gi);
        return parts.map((part, pIdx) => {
          if (part.toLowerCase().startsWith('<u>') && part.toLowerCase().endsWith('</u>')) {
            const inner = part.slice(3, -4);
            return <u key={`u-${idx}-${pIdx}`}>{inner}</u>;
          }
          return part;
        });
      });

      elements = elements.flatMap((item, idx) => {
        if (typeof item !== 'string') return item;
        const parts = item.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const inner = part.slice(2, -2);
            return <strong key={`b-${idx}-${pIdx}`}>{inner}</strong>;
          }
          return part;
        });
      });

      elements = elements.flatMap((item, idx) => {
        if (typeof item !== 'string') return item;
        const parts = item.split(/(\*[^\*]+?\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            const inner = part.slice(1, -1);
            return <em key={`i-${idx}-${pIdx}`}>{inner}</em>;
          }
          return part;
        });
      });

      return (
        <React.Fragment key={lIdx}>
          {lIdx > 0 && <br />}
          {elements}
        </React.Fragment>
      );
    });
  };

  const handleAddCustomTemplate = () => {
    if (!customNewTemplate.trim()) return;
    setTemplatesList(prev => [...prev, customNewTemplate.trim()]);
    setCustomNewTemplate('');
    showToast('تم إضافة القالب الجاهز بنجاح', 'success');
  };

  const handleGenerateAi = async () => {
    if (!activeAppt) return;
    setAiLoading(true);
    setAiResultText('');
    try {
      const data = await chatAiService.generateReply({
        appointment_id: activeAppt.id,
        purpose: aiParams.purpose,
        language: aiParams.language,
        creativity: aiParams.creativity,
        max_length: aiParams.max_length,
        custom_instructions: aiParams.description
      });
      setAiResultText(data.reply);
      showToast('تم توليد المحتوى بالذكاء الاصطناعي بنجاح', 'success');
    } catch (err) {
      showToast(err.message || 'فشل توليد محتوى بالذكاء الاصطناعي', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiText = () => {
    if (!aiResultText) return;
    navigator.clipboard.writeText(aiResultText);
    showToast('تم نسخ النص إلى الحافظة', 'info');
  };

  const handleUseAiText = () => {
    if (!aiResultText) return;
    setInputText(aiResultText);
    setShowAiModal(false);
    showToast('تم إدراج النص إلى محرر الكتابة', 'info');
  };

  const handleUpdateAppointmentStatus = async (newStatus) => {
    if (!activeAppt) return;
    try {
      const res = await fetch(`/api/appointments/${activeAppt.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast('تم تحديث حالة المحادثة بنجاح', 'success');
        setActiveAppt(prev => ({ ...prev, status: newStatus }));
        setAppointments(prev => prev.map(a => a.id === activeAppt.id ? { ...a, status: newStatus } : a));
      }
    } catch {
      showToast('خطأ أثناء تحديث الحالة.', 'error');
    }
  };

  const getPartnerName = (appt) => {
    if (!appt) return 'مستخدم';
    const isConsultantAppt = user?.role === 'consultant' ||
      (appt.consultant && String(appt.consultant.user_id) === String(user?.id)) ||
      (appt.consultant_id && user?.profile && String(appt.consultant_id) === String(user.profile.id));

    if (isConsultantAppt) {
      return appt.client_name || appt.user?.full_name || appt.user_name || appt.client?.full_name || 'رانيا الخطيب';
    }
    return appt.consultant_name || appt.consultant?.user?.full_name || 'عبدالرحمن حسين محمد الأصفر';
  };

  const getPartnerInitial = (name) => {
    if (!name) return 'أ';
    return name.trim().charAt(0);
  };

  const formatArabicTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getStatusLabel = (statusStr, scheduledAt) => {
    if (!statusStr) return 'استشارة نشطة';
    if (statusStr === 'completed') return 'متابعة ما بعد الجلسة (مكتملة)';
    if (statusStr === 'confirmed' || statusStr === 'pending_approval' || statusStr === 'pending_payment') {
      const isPast = new Date(scheduledAt) < new Date();
      return isPast ? 'قيد الانعقاد / متابعة' : 'تحدث ما قبل الجلسة (نشطة)';
    }
    if (statusStr.startsWith('cancelled') || statusStr === 'no_show') return 'استشارة ملغاة';
    return 'استشارة نشطة';
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Filter and sort appointments: pinned first, then by last message time (most recent first)
  let rawFiltered = appointments
    .filter(a => {
      // Never exclude the currently active appointment!
      if (activeAppt && String(a.id) === String(activeAppt.id)) return true;
      if (hiddenChatIds.includes(String(a.id))) return false;

      const pName = (getPartnerName(a) || '').toLowerCase();
      const matchesSearch = !chatSearch || pName.includes(chatSearch.toLowerCase());

      let matchesStatus = true;
      if (consultationFilter === 'active') {
        matchesStatus = a.status !== 'completed' && !String(a.status || '').startsWith('cancelled');
      } else if (consultationFilter === 'follow_up' || consultationFilter === 'completed') {
        matchesStatus = a.status === 'completed';
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const isAPinned = pinnedApptIds.includes(a.id);
      const isBPinned = pinnedApptIds.includes(b.id);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      const tA = lastMsgTime[a.id] || a.updated_at || a.scheduled_at || '';
      const tB = lastMsgTime[b.id] || b.updated_at || b.scheduled_at || '';
      return tB.localeCompare(tA);
    });

  if (activeAppt && !rawFiltered.some(a => String(a.id) === String(activeAppt.id))) {
    rawFiltered = [activeAppt, ...rawFiltered];
  }

  const filteredAppointments = rawFiltered;

  const renderAttachmentCard = (attachmentUrl, isMe) => {
    if (!attachmentUrl) return null;

    const rawFileName = attachmentUrl.split('/').pop() || 'مستند مرفق';
    const ext = rawFileName.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

    return (
      <div
        style={{
          marginTop: '8px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: isMe ? 'rgba(255, 255, 255, 0.15)' : '#FFFFFF',
          border: isMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #BCCCDC',
          color: isMe ? '#FFFFFF' : '#0D3C5C',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {isImage ? (
          <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
            <img
              src={attachmentUrl}
              alt="مرفق"
              style={{ width: '100%', maxHeight: '220px', borderRadius: '6px', objectFit: 'cover', display: 'block' }}
            />
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isMe ? '#F5A52A' : '#005D9C',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.75rem',
                flexShrink: 0
              }}
            >
              {ext?.toUpperCase() || 'FILE'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rawFileName}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                انقر لفتح المعاينة والتحميل
              </div>
            </div>
          </div>
        )}

        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: isMe ? '#F5A52A' : '#005D9C',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: '700',
            textDecoration: 'none',
            marginTop: '2px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <span>فتح / معاينة المستند</span>
          <span>↗</span>
        </a>
      </div>
    );
  };

  return (
    <div className="chat-page-root">
      <Toast {...toast} />

      {/* Custom Delete Confirmation Modal */}
      {confirmModal.open && (
        <div onClick={() => setConfirmModal({ open: false, apptId: null })} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(13, 60, 92, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px 28px',
            maxWidth: '380px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(13, 60, 92, 0.2)',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            {/* Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#FEE2E2', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px'
            }}>
              🗑️
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 8px' }}>
              حذف المحادثة
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
              هل أنت متأكد من حذف هذه المحادثة وإزالتها نهائياً من السجل؟<br />
              <strong style={{ color: '#EF4444' }}>لا يمكن التراجع عن هذا الإجراء.</strong>
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmModal({ open: false, apptId: null })}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: '10px',
                  border: '1px solid #E2E8F0', background: '#F8FAFC',
                  color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: '10px',
                  border: 'none', background: '#EF4444',
                  color: '#FFFFFF', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#DC2626'}
                onMouseOut={e => e.currentTarget.style.background = '#EF4444'}
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="chat-page-header">
        <div className="chat-page-title-group">
          <h1>محادثات الاستشارات</h1>
          <div className="chat-breadcrumbs">
            الرئيسية • المحادثات والرسائل
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (RTL DOM Order: 1st=FAR RIGHT, 2nd=MIDDLE, 3rd=FAR LEFT) */}
      <div className="chat-workspace">

        {/* 1. FAR RIGHT in RTL: Conversations Sidebar (Users/Inbox List) */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <div className="conversations-filter-row">
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0D3C5C' }}>
                المحادثات
              </span>

              <select
                value={consultationFilter}
                onChange={e => setConsultationFilter(e.target.value)}
                className="conversations-select-filter"
              >
                <option value="all">كل الاستشارات</option>
                <option value="active">استشارات نشطة</option>
                <option value="follow_up">متابعة ما بعد الجلسة</option>
                <option value="completed">استشارات مكتملة</option>
              </select>
            </div>

            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="بحث..."
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                className="search-input-field"
              />
              <span className="search-input-icon">
                <SearchIcon />
              </span>
            </div>
          </div>

          <div className="conversations-list-container">
            {loading ? (
              <div style={{ textAlign: 'center', color: '#627D98', padding: '16px', fontSize: '0.82rem' }}>
                جاري التحميل...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#627D98', padding: '16px', fontSize: '0.82rem' }}>
                لا توجد محادثات مطابقة.
              </div>
            ) : (
              filteredAppointments.map(appt => {
                const partnerName = getPartnerName(appt);
                const isSelected = activeAppt && activeAppt.id === appt.id;
                const isPinned = pinnedApptIds.includes(appt.id);
                const unread = unreadCounts[appt.id] || 0;
                return (
                  <div
                    key={appt.id}
                    onClick={() => handleSelectChat(appt)}
                    className={`conversation-item-card ${isSelected ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <div className="conversation-avatar">
                      {getPartnerInitial(partnerName)}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-name-time">
                        <span className="conversation-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {partnerName}
                          {unread > 0 && (
                            <span style={{
                              background: '#EF4444',
                              color: '#fff',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: '800',
                              minWidth: '18px',
                              height: '18px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 5px',
                              lineHeight: 1
                            }}>
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </span>
                        <span className="conversation-time">
                          {formatArabicTime(lastMsgTime[appt.id] || appt.scheduled_at) || 'الآن'}
                        </span>
                      </div>
                      <div className="conversation-preview" style={{ fontWeight: unread > 0 ? '700' : '400' }}>
                        {appt.notes || appt.service_name || 'استشارة موثقة'}
                      </div>
                    </div>

                    {/* Quick Item Actions: Pin & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}>
                      <button
                        onClick={(e) => togglePinChat(appt.id, e)}
                        title={isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <PinIcon isPinned={isPinned} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteChat(appt.id, e)}
                        title="حذف المحادثة نهائياً"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="load-more-btn">
            تحميل المزيد من المحادثات
          </button>
        </div>

        {/* 2. MIDDLE in RTL: Main Chat Area & Editor */}
        <div className="chat-center-pane">
          {activeAppt ? (
            <>
              {/* Header */}
              <div className="chat-pane-header">
                <div className="chat-partner-title-area">
                  <h2>{getPartnerName(activeAppt)}</h2>

                  <span className="code-badge">
                    CON-{String(activeAppt.id).substring(0, 6).toUpperCase()}
                  </span>
                  <span className="topic-subtext">
                    {activeAppt.notes || activeAppt.service_name || 'استشارة تخصصية'} — {getStatusLabel(activeAppt.status, activeAppt.scheduled_at)}
                  </span>
                </div>

                {!isDetailsVisible && (
                  <button
                    onClick={() => setIsDetailsVisible(true)}
                    style={{ background: '#F8FAFC', border: '1px solid #BCCCDC', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    إظهار التفاصيل ◄
                  </button>
                )}
              </div>

              {/* Messages Viewport */}
              <div className="chat-messages-container">
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', color: '#627D98', fontSize: '0.88rem' }}>
                    لا توجد رسائل سابقة.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user?.id || msg.sender_id === 'me';
                    return (
                      <div key={msg.id} className={`msg-row ${isMe ? 'sent' : 'received'}`}>
                        <div className="msg-box">
                          {msg.message_text && !msg.message_text.startsWith('إرفاق مستند:') && (
                            <div>{renderFormattedText(msg.message_text)}</div>
                          )}
                          {renderAttachmentCard(msg.attachment_url, isMe)}
                        </div>
                        <div className="msg-meta">
                          <span>{formatArabicTime(msg.created_at)}</span>
                          {isMe && <span>✓✓</span>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Rich Text Editor Footer Area */}
              <div className="chat-editor-container">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Editor Top Toolbar */}
                <div className="editor-toolbar">
                  <button
                    type="button"
                    onClick={() => applyFormattingToSelection('bold')}
                    className="editor-tool-btn"
                    style={{
                      background: isBold ? '#005D9C' : '#F8FAFC',
                      color: isBold ? '#FFFFFF' : '#0D3C5C',
                      borderColor: isBold ? '#005D9C' : '#BCCCDC',
                      fontWeight: '800'
                    }}
                    title="عريض B"
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFormattingToSelection('italic')}
                    className="editor-tool-btn"
                    style={{
                      background: isItalic ? '#005D9C' : '#F8FAFC',
                      color: isItalic ? '#FFFFFF' : '#0D3C5C',
                      borderColor: isItalic ? '#005D9C' : '#BCCCDC',
                      fontStyle: 'italic'
                    }}
                    title="مائل I"
                  >
                    I
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFormattingToSelection('underline')}
                    className="editor-tool-btn"
                    style={{
                      background: isUnderline ? '#005D9C' : '#F8FAFC',
                      color: isUnderline ? '#FFFFFF' : '#0D3C5C',
                      borderColor: isUnderline ? '#005D9C' : '#BCCCDC',
                      textDecoration: 'underline'
                    }}
                    title="تحته خط U"
                  >
                    U
                  </button>

                  {user?.role === 'consultant' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowTemplatesModal(true)}
                        className="editor-tool-btn"
                        title="القوالب الجاهزة"
                      >
                        القوالب الجاهزة
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="editor-tool-btn"
                        style={{ borderColor: '#005D9C', color: '#005D9C' }}
                        title="توليد محتوى بالذكاء الاصطناعي"
                      >
                        توليد محتوى بالذكاء الاصطناعي
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="editor-tool-btn"
                    title="إرفاق ملف"
                  >
                    إرفاق
                  </button>
                </div>

                {/* Textarea Input */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="اكتب ردك هنا..."
                  className="editor-textarea"
                />

                {/* Bottom Bar Controls */}
                <div className="editor-bottom-bar">
                  <div className="editor-actions-left">
                    {user?.role === 'consultant' && (
                      <button
                        type="button"
                        onClick={(e) => handleSendMessage(e, true)}
                        className="btn-send-close"
                      >
                        إرسال وإغلاق
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="btn-send-main"
                  >
                    إرسال ↵
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', color: '#627D98', textAlign: 'center' }}>
              اختر محادثة لبدء التراسل.
            </div>
          )}
        </div>

        {/* 3. FAR LEFT in RTL: Consultation Details Pane */}
        {activeAppt && isDetailsVisible && (
          <div className="chat-left-details-pane">
            <div className="details-top-bar">
              <div className="details-pane-title">تفاصيل الاستشارة</div>
              <div className="details-window-controls">
                <button onClick={() => setIsDetailsVisible(false)} className="window-btn" title="إغلاق اللوحة">✕</button>
              </div>
            </div>

            {/* Collapsible Accordions for All Fields */}
            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('client')}>
                <span>العميل</span>
                <span>{expandedSections.client ? '−' : '+'}</span>
              </div>
              {expandedSections.client && (
                <div className="accordion-body">
                  <div className="info-value">
                    {activeAppt.client_name || activeAppt.user?.full_name || 'عميل الاستشارة'}
                  </div>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('consultant')}>
                <span>المستشار</span>
                <span>{expandedSections.consultant ? '−' : '+'}</span>
              </div>
              {expandedSections.consultant && (
                <div className="accordion-body">
                  <div className="info-value">
                    {activeAppt.consultant_name || activeAppt.consultant?.user?.full_name || 'د. مستشار المنصة'}
                  </div>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('topic')}>
                <span>موضوع الاستشارة</span>
                <span>{expandedSections.topic ? '−' : '+'}</span>
              </div>
              {expandedSections.topic && (
                <div className="accordion-body">
                  <div className="info-value">
                    {activeAppt.notes || activeAppt.service_name || 'استشارة تخصصية'}
                  </div>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('status')}>
                <span>حالة الاستشارة</span>
                <span>{expandedSections.status ? '−' : '+'}</span>
              </div>
              {expandedSections.status && (
                <div className="accordion-body">
                  {user?.role === 'consultant' ? (
                    <select
                      value={activeAppt.status || 'confirmed'}
                      onChange={e => handleUpdateAppointmentStatus(e.target.value)}
                      className="status-dropdown"
                    >
                      <option value="confirmed">تحدث ما قبل الجلسة (نشطة)</option>
                      <option value="completed">متابعة ما بعد الجلسة (مكتملة)</option>
                      <option value="cancelled_by_consultant">إلغاء الاستشارة</option>
                    </select>
                  ) : (
                    <div className="info-value">
                      {getStatusLabel(activeAppt.status, activeAppt.scheduled_at)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('schedule')}>
                <span>موعد الجلسة</span>
                <span>{expandedSections.schedule ? '−' : '+'}</span>
              </div>
              {expandedSections.schedule && (
                <div className="accordion-body">
                  <div className="info-value">
                    {new Date(activeAppt.scheduled_at).toLocaleDateString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('service_type')}>
                <span>نوع الخدمة</span>
                <span>{expandedSections.service_type ? '−' : '+'}</span>
              </div>
              {expandedSections.service_type && (
                <div className="accordion-body">
                  <div className="info-value">
                    {activeAppt.session_type === 'video_call'
                      ? 'استشارة فيديو'
                      : activeAppt.session_type === 'audio_call'
                      ? 'استشارة صوتية'
                      : 'محادثة كتابية'}
                  </div>
                </div>
              )}
            </div>

            {/* Expandable Accordion Items */}
            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('files')}>
                <span>ملفات الاستشارة</span>
                <span>{expandedSections.files ? '−' : '+'}</span>
              </div>
              {expandedSections.files && (
                <div className="accordion-body">
                  <div className="info-label">المستندات المرفقة:</div>
                  <div className="info-value">
                    {messages.find(m => m.attachment_url)?.attachment_url?.split('/').pop() || 'لا توجد مرفقات حتى الآن'}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#0D3C5C', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    رفع ملف جديد +
                  </button>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('ai_summary')}>
                <span>ملخص الجلسة بالذكاء الاصطناعي</span>
                <span>{expandedSections.ai_summary ? '−' : '+'}</span>
              </div>
              {expandedSections.ai_summary && (
                <div className="accordion-body">
                  <div className="info-label">الملخص المولد:</div>
                  <div className="info-value">
                    {activeAppt.status === 'completed'
                      ? 'تمت مراجعة جميع محاور الاستشارة والاتفاق على الخطوات التنفيذية.'
                      : 'سيظهر ملخص الجلسة هنا بعد اكتمال الاستشارة.'}
                  </div>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-header" onClick={() => toggleSection('rating')}>
                <span>تقييم المحادثة</span>
                <span>{expandedSections.rating ? '−' : '+'}</span>
              </div>
              {expandedSections.rating && (
                <div className="accordion-body">
                  <div className="info-value">★★★★★ (5/5)</div>
                  <div className="info-label">محادثة موثقة ومحمية</div>
                </div>
              )}
            </div>

            {user?.role === 'consultant' && (
              <div className="accordion-section">
                <div
                  className="accordion-header"
                  onClick={() => setShowAuditLogModal(true)}
                  style={{ color: '#005D9C' }}
                >
                  <span>سجل الإجراءات</span>
                  <span>+</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: القوالب الجاهزة */}
      {showTemplatesModal && (
        <div className="modal-overlay">
          <div className="modal-dialog-clean">
            <div className="modal-dialog-header">
              <h3>القوالب الجاهزة</h3>
              <button onClick={() => setShowTemplatesModal(false)} className="modal-close-icon">✕</button>
            </div>

            <div className="modal-dialog-body">
              {templatesList.map((tplText, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInputText(tplText);
                    setShowTemplatesModal(false);
                    showToast('تم اختيار القالب الجاهز', 'info');
                  }}
                  className="template-option-box"
                >
                  {tplText}
                </div>
              ))}

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5EFF5' }}>
                <label className="form-label-clean">إضافة قالب جاهز جديد</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="اكتب نص الرد الجاهز..."
                    value={customNewTemplate}
                    onChange={e => setCustomNewTemplate(e.target.value)}
                    className="form-control-clean"
                  />
                  <button
                    onClick={handleAddCustomTemplate}
                    className="btn-primary-action"
                    style={{ flexShrink: 0 }}
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-dialog-footer">
              <button onClick={() => setShowTemplatesModal(false)} className="btn-send-close">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: توليد محتوى بالذكاء الاصطناعي */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-dialog-clean">
            <div className="modal-dialog-header">
              <h3>توليد محتوى بالذكاء الاصطناعي</h3>
              <button onClick={() => setShowAiModal(false)} className="modal-close-icon">✕</button>
            </div>

            <div className="modal-dialog-body">
              <div className="form-grid-2">
                <div className="form-group-clean">
                  <label className="form-label-clean">الغرض</label>
                  <select
                    value={aiParams.purpose}
                    onChange={e => setAiParams(p => ({ ...p, purpose: e.target.value }))}
                    className="form-control-clean"
                  >
                    <option value="اقتراح رد">اقتراح رد</option>
                    <option value="عرض">عرض</option>
                    <option value="تلخيص">تلخيص</option>
                    <option value="متابعة">متابعة</option>
                  </select>
                </div>

                <div className="form-group-clean">
                  <label className="form-label-clean">اللغة</label>
                  <select
                    value={aiParams.language}
                    onChange={e => setAiParams(p => ({ ...p, language: e.target.value }))}
                    className="form-control-clean"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group-clean">
                  <label className="form-label-clean">إبداع الذكاء الاصطناعي</label>
                  <select
                    value={aiParams.creativity}
                    onChange={e => setAiParams(p => ({ ...p, creativity: e.target.value }))}
                    className="form-control-clean"
                  >
                    <option value="منخفض">منخفض</option>
                    <option value="متوسط">متوسط</option>
                    <option value="مرتفع">مرتفع</option>
                  </select>
                </div>

                <div className="form-group-clean">
                  <label className="form-label-clean">عدد النتائج</label>
                  <input
                    type="number"
                    value={aiParams.results_count}
                    onChange={e => setAiParams(p => ({ ...p, results_count: Number(e.target.value) }))}
                    className="form-control-clean"
                  />
                </div>
              </div>

              <div className="form-group-clean">
                <label className="form-label-clean">عنوان المحادثة</label>
                <input
                  type="text"
                  value={activeAppt ? (activeAppt.notes || activeAppt.service_name || 'استشارة') : 'استشارة'}
                  readOnly
                  className="form-control-clean"
                  style={{ background: '#F8FAFC' }}
                />
              </div>

              <div className="form-group-clean">
                <label className="form-label-clean">الحد الأقصى لطول النتيجة</label>
                <input
                  type="number"
                  value={aiParams.max_length}
                  onChange={e => setAiParams(p => ({ ...p, max_length: Number(e.target.value) }))}
                  className="form-control-clean"
                />
              </div>

              <div className="form-group-clean">
                <label className="form-label-clean">الوصف</label>
                <textarea
                  rows={2}
                  value={aiParams.description}
                  onChange={e => setAiParams(p => ({ ...p, description: e.target.value }))}
                  className="form-control-clean"
                />
              </div>

              {aiResultText && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#E5EFF5', border: '1px solid #BCCCDC', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <label className="form-label-clean" style={{ color: '#0D3C5C' }}>الرد المولد:</label>
                  <div>{aiResultText}</div>
                </div>
              )}
            </div>

            <div className="modal-dialog-footer">
              <button
                onClick={handleGenerateAi}
                disabled={aiLoading}
                className="btn-primary-action"
              >
                {aiLoading ? 'جاري التوليد...' : 'توليد'}
              </button>

              {aiResultText && (
                <>
                  <button onClick={handleCopyAiText} className="btn-amber-action">
                    نسخ النص
                  </button>

                  <button onClick={handleUseAiText} className="btn-primary-action">
                    استخدام النص
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: سجل الإجراءات */}
      {showAuditLogModal && (
        <div className="modal-overlay">
          <div className="modal-dialog-clean" style={{ maxWidth: '460px' }}>
            <div className="modal-dialog-header">
              <h3>سجل الإجراءات</h3>
              <button onClick={() => setShowAuditLogModal(false)} className="modal-close-icon">✕</button>
            </div>

            <div className="modal-dialog-body">
              <div className="audit-timeline-item">
                <div className="audit-dot" />
                <div>
                  <div className="audit-info-title">تم تحديث حالة المحادثة</div>
                  <div className="audit-info-meta">
                    {formatArabicTime(activeAppt?.updated_at || activeAppt?.created_at)} • {user?.full_name || 'المستشار'}
                  </div>
                </div>
              </div>

              <div className="audit-timeline-item">
                <div className="audit-dot" />
                <div>
                  <div className="audit-info-title">تم فتح محادثة الاستشارة</div>
                  <div className="audit-info-meta">
                    {formatArabicTime(activeAppt?.created_at)} • المنصة
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-dialog-footer">
              <button onClick={() => setShowAuditLogModal(false)} className="btn-send-close">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { appointmentService } from '../services/appointmentService';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ChatPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  // Chats list & active chat
  const [appointments, setAppointments] = useState([]);
  const [activeAppt, setActiveAppt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');

  // UI Filters & Search
  const [chatSearch, setChatSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [activeChatTab, setActiveChatTab] = useState('الكل'); // 'الكل', 'غير مقروء', 'مرفقات'

  // WebSocket Ref
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load appointments (which host chats)
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!token) return;
      setLoading(true);
      try {
        let list = [];
        if (user?.role === 'consultant') {
          list = await consultantService.getIncomingAppointments(token);
        } else {
          list = await appointmentService.getMyAppointments(token);
        }

        // Filter out cancelled ones
        const validChats = (list || []).filter(appt => appt.status !== 'cancelled');
        setAppointments(validChats);

        // Check URL search params for auto-selecting target chat room
        const urlParams = new URLSearchParams(window.location.search);
        const paramApptId = urlParams.get('apptId') || urlParams.get('appointment_id');
        const paramUser = urlParams.get('user') || urlParams.get('userId') || urlParams.get('client');

        let targetChat = null;
        if (paramApptId) {
          targetChat = validChats.find(a => String(a.id) === String(paramApptId));
        }
        if (!targetChat && paramUser) {
          const queryStr = decodeURIComponent(paramUser).toLowerCase();
          targetChat = validChats.find(a => {
            const partnerName = (a.user?.full_name || a.consultant_name || a.client_name || '').toLowerCase();
            const partnerId = String(a.user?.id || a.client_id || a.user_id || '');
            return partnerName.includes(queryStr) || partnerId === queryStr;
          });
        }

        if (targetChat) {
          handleSelectChat(targetChat);
        } else if (validChats.length > 0) {
          handleSelectChat(validChats[0]);
        }
      } catch (err) {
        showToast('فشل تحميل قائمة المحادثات النشطة.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [token, user]);

  // Handle Websocket Connection
  useEffect(() => {
    if (!activeAppt) return;

    // Connect to WebSocket room
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/chat/ws/${activeAppt.id}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Mark messages as read
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
        }
      } catch (err) {
        console.error('Error parsing socket event:', err);
      }
    };

    ws.onclose = () => {
      console.log('Chat WebSocket connection closed.');
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

  const handleSelectChat = async (appt) => {
    setActiveAppt(appt);
    setMessages([]);

    const partnerName = getChatPartnerName(appt);
    const partnerAppts = appointments.filter(a => getChatPartnerName(a) === partnerName);
    const apptIdsToFetch = partnerAppts.length > 0 ? partnerAppts.map(a => a.id) : [appt.id];

    // Fetch message history from REST API across all appointments with this partner
    try {
      const allMsgsArrays = await Promise.all(
        apptIdsToFetch.map(id =>
          fetch(`/api/chat/${id}/messages?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : [])
        )
      );

      const combined = allMsgsArrays.flat().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const uniqueMsgs = [];
      const seenMsgIds = new Set();
      for (const m of combined) {
        if (!seenMsgIds.has(m.id)) {
          seenMsgIds.add(m.id);
          uniqueMsgs.push(m);
        }
      }

      setMessages(uniqueMsgs);
    } catch (err) {
      showToast('خطأ أثناء جلب سجل الرسائل.', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message_text: textToSend,
        attachment_url: null
      }));
    } else {
      // Fallback to REST API
      try {
        const res = await fetch(`/api/chat/${activeAppt.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message_text: textToSend
          })
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages(prev => [...prev, newMsg]);
        }
      } catch (err) {
        showToast('فشل إرسال الرسالة.', 'error');
      }
    }
  };

  const getChatPartnerName = (appt) => {
    if (!appt) return 'مستخدم';
    if (user?.role === 'consultant') {
      return appt.client_name || appt.user?.full_name || appt.user_name || 'عميل';
    }
    return appt.consultant_name || 'مستشار';
  };

  const getInitials = (name) => {
    if (!name) return 'م';
    const clean = name.replace('أ. ', '').trim();
    return clean.charAt(0);
  };

  const formatArabicTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const [pinnedChatKeys, setPinnedChatKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(`pinned_chats_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [deletedChatKeys, setDeletedChatKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(`deleted_chats_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePinChat = (partnerName, e) => {
    if (e) e.stopPropagation();
    setPinnedChatKeys(prev => {
      const isPinned = prev.includes(partnerName);
      const updated = isPinned
        ? prev.filter(k => k !== partnerName)
        : [...prev, partnerName];
      try {
        localStorage.setItem(`pinned_chats_${user?.id}`, JSON.stringify(updated));
      } catch (err) { }
      showToast(isPinned ? 'تم إلغاء تثبيت المحادثة' : 'تم تثبيت المحادثة في الأعلى 📌', 'info');
      return updated;
    });
  };

  const confirmDeleteChat = async () => {
    if (!activeAppt) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/${activeAppt.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const partnerName = getChatPartnerName(activeAppt);
        setDeletedChatKeys(prev => {
          const updated = [...prev, partnerName];
          try {
            localStorage.setItem(`deleted_chats_${user?.id}`, JSON.stringify(updated));
          } catch (err) { }
          return updated;
        });
        setAppointments(prev => prev.filter(a => getChatPartnerName(a) !== partnerName));
        setActiveAppt(null);
        setMessages([]);
        showToast('تم حذف المحادثة وإخفاؤها تماماً.', 'success');
      } else {
        showToast('حدث خطأ أثناء حذف المحادثة.', 'error');
      }
    } catch (e) {
      showToast('تعذر الاتصال بخادم المحادثات.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Deduplicate appointments by partner name & exclude deleted chats
  const uniqueAppointments = [];
  const seenPartners = new Set();
  for (const appt of appointments) {
    const pName = getChatPartnerName(appt);
    if (!seenPartners.has(pName) && !deletedChatKeys.includes(pName)) {
      seenPartners.add(pName);
      uniqueAppointments.push(appt);
    }
  }

  // Sort pinned chats to the top
  uniqueAppointments.sort((a, b) => {
    const isAPinned = pinnedChatKeys.includes(getChatPartnerName(a));
    const isBPinned = pinnedChatKeys.includes(getChatPartnerName(b));
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0;
  });

  // Filter chats by search
  const filteredChats = uniqueAppointments.filter(appt => {
    const partnerName = getChatPartnerName(appt).toLowerCase();
    const matchesSearch = partnerName.includes(chatSearch.toLowerCase());
    return matchesSearch;
  });

  // Filter messages in active chat by search
  const filteredMessages = messages.filter(msg =>
    msg.message_text?.toLowerCase().includes(messageSearch.toLowerCase())
  );

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '30px' }}>
      <Toast {...toast} />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>الرسائل 💬</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            محادثات موثقة مع المستشارين. مرفقات، بحث، فلاتر، وأوقات دقيقة.
          </p>
        </div>
        <button
          onClick={() => {
            if (user?.role === 'consultant') {
              navigate('/consultant/dashboard');
            } else {
              navigate('/dashboard');
            }
          }}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: '#475569',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          رجوع →
        </button>
      </div>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 200px)', minHeight: '520px' }}>

        {/* Right Pane: Chats Inbox */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Box Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✉️ صندوق المحادثات
            </span>
            <span style={{
              fontSize: '10px',
              backgroundColor: '#F5A52A',
              color: '#FFFFFF',
              fontWeight: '700',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {uniqueAppointments.length}
            </span>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="ابحث في اسم جهة الاتصال..."
              value={chatSearch}
              onChange={e => setChatSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 36px 10px 14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>

          {/* Tab Filters */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {['الكل', 'غير مقروء', 'مرفقات'].map(tab => {
              const isSelected = activeChatTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveChatTab(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: isSelected ? 'none' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F5A52A' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Chat List Items */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>جاري التحميل...</span>
            ) : filteredChats.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>لا توجد محادثات نشطة.</span>
            ) : (
              filteredChats.map(appt => {
                const partnerName = getChatPartnerName(appt);
                const isSelected = activeAppt && activeAppt.id === appt.id;
                const isPinned = pinnedChatKeys.includes(partnerName);
                const lastMsgText = messages.length > 0 && isSelected
                  ? messages[messages.length - 1].message_text
                  : 'مرحبا بك في المحادثة';

                return (
                  <button
                    key={appt.id}
                    onClick={() => handleSelectChat(appt)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #FEF08A' : isPinned ? '1px solid #BAE6FD' : '1px solid #F1F5F9',
                      backgroundColor: isSelected ? '#FFFDF5' : isPinned ? '#F0F9FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'right',
                      boxSizing: 'border-box',
                      position: 'relative'
                    }}
                  >
                    {/* Unread badge / Pin action */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>{formatArabicTime(appt.scheduled_at)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          onClick={(e) => togglePinChat(partnerName, e)}
                          title={isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                          style={{
                            fontSize: '12px',
                            opacity: isPinned ? 1 : 0.4,
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          📌
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAppt(appt);
                            setShowDeleteModal(true);
                          }}
                          title="حذف المحادثة"
                          style={{
                            fontSize: '12px',
                            opacity: 0.5,
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          🗑️
                        </span>
                      </div>
                    </div>

                    {/* Name & Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0D3C5C' }}>{partnerName}</span>
                          {isPinned && (
                            <span style={{ fontSize: '9px', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>
                              مثبتة 📌
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '130px', marginTop: '2px' }}>
                          {lastMsgText}
                        </span>
                      </div>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isPinned ? '#BAE6FD' : '#FFF0D9',
                        color: isPinned ? '#0284C7' : '#F5A52A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '13px'
                      }}>
                        {getInitials(partnerName)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Left Pane: Active Chat Room */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {activeAppt ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

              {/* Header profile info */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FFF0D9',
                    color: '#F5A52A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '14px'
                  }}>
                    {getInitials(getChatPartnerName(activeAppt))}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
                      {getChatPartnerName(activeAppt)}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                      محادثة آمنة وموثقة • {messages.length} رسالة
                    </span>
                  </div>
                </div>
              </div>

        {/* Inside chat search box */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="فلترة داخل الرسائل..."
            value={messageSearch}
            onChange={e => setMessageSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              borderRadius: '10px',
              border: '1px solid #F1F5F9',
              fontSize: '11px',
              backgroundColor: '#F8FAFC',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>

        {/* Chat bubbles container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#FAFAFA',
          borderRadius: '16px',
          border: '1px solid #F1F5F9',
          marginBottom: '16px'
        }}>
          {filteredMessages.length === 0 ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px' }}>
              لا توجد رسائل سابقة. ابدأ المحادثة الآن!
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.sender_id === user?.id || msg.sender_id === 'me';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-start' : 'flex-end',
                    backgroundColor: isMe ? '#FFFBEB' : '#FFFFFF',
                    border: isMe ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    maxWidth: '65%',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    textAlign: 'right'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: isMe ? '#D97706' : '#0D3C5C', marginBottom: '4px' }}>
                    {isMe ? 'أنا' : msg.sender_name || getChatPartnerName(activeAppt)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5', display: 'block' }}>
                    {msg.message_text}
                  </span>
                  <span style={{ display: 'block', fontSize: '10px', color: '#94A3B8', textAlign: 'left', marginTop: '6px' }}>
                    {formatArabicTime(msg.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message inputs bottom bar */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Paper plane orange send button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(245, 165, 42, 0.25)',
              flexShrink: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)', marginRight: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder="اكتب رسالتك..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '25px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* File Attachment paperclip button */}
          <button
            type="button"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="إرفاق ملف"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        </form>
      </div>
      ) : (
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        <span>💬</span>
        <h4 style={{ margin: '12px 0 4px', color: '#0D3C5C' }}>اختر محادثة لبدء التراسل</h4>
        <p style={{ fontSize: '12px', margin: 0 }}>يمكنك مراسلة العميل أو المستشار الخاص بجلستك هنا.</p>
      </div>
          )}
    </div>
      </div >

    {/* Delete Confirmation React Modal */ }
  {
    showDeleteModal && ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="fade-in"
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            padding: '28px',
            direction: 'rtl',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            🗑️
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
            حذف المحادثة النهائي
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
            هل أنت تأكد من حذف وإخفاء سجّل المحادثة مع <strong style={{ color: '#0D3C5C' }}>"{activeAppt ? getChatPartnerName(activeAppt) : ''}"</strong>؟ لن تتمكن من استرجاع الرسائل بعد الحذف.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={confirmDeleteChat}
              disabled={deleting}
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
              }}
            >
              {deleting ? 'جاري الحذف...' : 'نعم، حذف المحادثة'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={{
                flex: 1,
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }
    </div >
  );
}

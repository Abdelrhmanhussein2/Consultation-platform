import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from './supportFormConfig';

// SVG Icons
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function SupportTicketDetailPage({ ticketId, navigate }) {
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const isSendingRef = useRef(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const isFirstLoad = useRef(true);

  const scrollChatToBottom = (smooth = true) => {
    // Scroll only the chat container, not the whole page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    try {
      const data = await apiFetch(`/api/tickets/${ticketId}`, {}, token);
      setTicket(data);
    } catch (e) {
      console.error(e);
      setError('فشل في تحميل تفاصيل التذكرة. قد لا تملك الصلاحية لعرضها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(fetchTicketDetails, 3000);
    return () => clearInterval(interval);
  }, [token, ticketId]);

  // Scroll chat container to bottom when replies update, NOT the whole page
  useEffect(() => {
    if (ticket?.replies) {
      // Use requestAnimationFrame to wait for DOM paint
      requestAnimationFrame(() => {
        scrollChatToBottom();
      });
    }
  }, [ticket?.replies?.length]);

  const handleSendReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSendingRef.current || !replyText.trim() || sendingReply) return;

    isSendingRef.current = true;
    setSendingReply(true);
    const msgToSend = replyText.trim();
    setReplyText('');

    try {
      await apiFetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: { message: msgToSend }
      }, token);

      await fetchTicketDetails();
    } catch (e) {
      alert(e.message || 'خطأ في الاتصال بالخادم');
      setReplyText(msgToSend);
    } finally {
      isSendingRef.current = false;
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#0D3C5C] flex flex-col items-center justify-center gap-3" dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
        <div className="w-10 h-10 border-3 border-[#005D9C] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-bold text-sm text-[#0D3C5C]">جاري تحميل تفاصيل التذكرة والمحادثة...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center" dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
        <div className="mb-4 flex justify-center text-red-400">
          <WarningIcon />
        </div>
        <h3 className="font-bold text-red-600 text-base mb-2">{error || 'التذكرة غير موجودة'}</h3>
        <p className="text-xs text-gray-500 mb-6">يرجى التأكد من رقم التذكرة أو الرجوع لقائمة طلباتك.</p>
        <button
          onClick={() => navigate('/support/tickets')}
          className="btn-navy text-xs px-6 py-2.5 rounded-xl font-bold"
        >
          العودة لطلبات الدعم
        </button>
      </div>
    );
  }

  const stat = STATUS_CONFIG[ticket.status] || { label: ticket.status || 'مفتوحة', color: 'bg-blue-50 text-blue-700' };
  const prioLabel = ticket.priority === 'high' || ticket.priority === 'urgent' ? 'عالية' : ticket.priority === 'low' ? 'منخفضة' : 'متوسطة';
  const prio = PRIORITY_CONFIG[ticket.priority] || { label: prioLabel, color: 'bg-amber-50 text-amber-700' };
  
  const catConfig = CATEGORIES[ticket.category] || null;
  const subConfig = (ticket.category && ticket.sub_category && catConfig?.subs[ticket.sub_category])
    ? catConfig.subs[ticket.sub_category]
    : null;
  const fields = subConfig ? subConfig.fields : [];
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  const formattedDate = new Date(ticket.created_at).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const submitterName = ticket.user_name || ticket.submitter_name || ticket.submitter?.full_name || user?.full_name || 'صاحب التذكرة';

  return (
    <div className="fade-in max-w-6xl mx-auto p-4 md:p-6" dir="rtl" style={{ fontFamily: 'var(--font-main)' }}>
      
      {/* 1. Top Bar Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/support/tickets')}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-[#0D3C5C] transition duration-150 shrink-0 font-bold"
            title="العودة لطلبات الدعم"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold bg-slate-100 text-[#005D9C] px-2.5 py-1 rounded-lg border border-slate-200">
                {ticket.ticket_number || `#${ticket.id.slice(0, 8)}`}
              </span>
              <h1 className="text-base md:text-lg font-black text-[#0D3C5C] leading-snug">
                {ticket.subject}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span>تاريخ الفتح: {formattedDate}</span>
              <span>•</span>
              <span>القسم: {catConfig?.label || ticket.category || 'الدعم الفني'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${stat.color} border border-current/20`}>
            {stat.label}
          </span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${prio.color} border border-current/20`}>
            أولوية {prio.label}
          </span>
        </div>
      </div>

      {/* 2. Main Content Grid: Expanded Chat (Right/Main) & Info Sidebar (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Chat Column */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            
            {/* Chat Room Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="font-extrabold text-[#0D3C5C] text-sm md:text-base m-0">
                  محادثة الدعم الفني المباشر
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                قناة تواصل آمنة وموثقة
              </span>
            </div>

            {/* Chat Messages Timeline — scrolls independently */}
            <div
              ref={chatContainerRef}
              className="p-5 md:p-6 space-y-5 overflow-y-auto bg-slate-50/30"
              style={{ height: '520px', maxHeight: '520px' }}
            >
              
              {/* Message #0: The Original Ticket Inquiry / Description — User is on RIGHT (items-start = visual right in RTL) */}
              <div className="flex flex-col gap-1.5 items-start">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold px-1">
                  <span>{submitterName} (صاحب الطلب)</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="max-w-[90%] md:max-w-[80%] bg-[#0D3C5C] text-white rounded-2xl rounded-tr-sm p-4 md:p-5 shadow-sm text-right">
                  <div className="text-xs font-bold text-sky-200 mb-1.5 pb-1.5 border-b border-sky-400/20">
                    موضوع التذكرة: {ticket.subject}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
                    {ticket.description}
                  </div>
                </div>
              </div>

              {/* Replies — User RIGHT, Support LEFT */}
              {ticket.replies && ticket.replies.map((m) => {
                // isAdminReply → support team → LEFT side
                const isAdminReply = m.author_role === 'admin' || m.author_role === 'super_admin';
                const replyDate = new Date(m.created_at).toLocaleDateString('ar-EG', {
                  month: 'short',
                  day: 'numeric'
                });
                const replyTime = new Date(m.created_at).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                // In RTL: items-start = visual RIGHT, items-end = visual LEFT
                // User → items-start (RIGHT), Admin/Support → items-end (LEFT)
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col gap-1.5 ${isAdminReply ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-center gap-2 text-[11px] text-slate-500 font-bold px-1`}>
                      {isAdminReply ? (
                        <>
                          <span>{replyDate} {replyTime}</span>
                          <span>•</span>
                          <span className="text-[#005D9C] font-extrabold flex items-center gap-1.5">
                            فريق الدعم الفني والعمليات
                            <ShieldIcon />
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{m.author_name || submitterName}</span>
                          <span>•</span>
                          <span>{replyDate} {replyTime}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-sm text-right ${
                        isAdminReply
                          ? 'bg-white text-slate-800 border-2 border-sky-100 rounded-tl-sm'
                          : 'bg-[#005D9C] text-white rounded-tr-sm'
                      }`}
                    >
                      <div className={`text-sm leading-relaxed whitespace-pre-line font-medium ${isAdminReply ? 'text-slate-800' : 'text-white'}`}>
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Reply Composer Area */}
            {!isClosed ? (
              <div className="p-4 md:p-5 bg-white border-t border-slate-200">
                <div className="flex flex-col gap-3">
                  <textarea
                    placeholder="اكتب ردك أو استفسارك الإضافي هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#005D9C] focus:ring-2 focus:ring-[#005D9C]/10 outline-none transition duration-150 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <InfoIcon />
                      اضغط <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">Enter</kbd> للإرسال •&nbsp;<kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">Shift+Enter</kbd> لسطر جديد
                    </span>

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="px-6 py-2.5 rounded-xl font-extrabold text-sm text-white bg-[#005D9C] hover:bg-[#0D3C5C] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {sendingReply ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>جاري الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <SendIcon />
                          <span>إرسال الرد</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-xs font-bold flex items-center justify-center gap-2">
                <LockIcon />
                <span>تم إغلاق هذه التذكرة. إذا كنت بحاجة لمساعدة جديدة يمكنك فتح تذكرة دعم جديدة.</span>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Ticket Metadata */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="font-extrabold text-[#0D3C5C] text-xs uppercase tracking-wider pb-3 mb-3 border-b border-slate-100">
              بيانات التذكرة
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">رقم التذكرة:</span>
                <span className="font-mono font-bold text-[#0D3C5C]">{ticket.ticket_number || `#${ticket.id.slice(0, 8)}`}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">القسم الرئيسي:</span>
                <span className="font-bold text-slate-700">{catConfig?.label || ticket.category || 'عام'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">الفئة الفرعية:</span>
                <span className="font-bold text-slate-700">{ticket.sub_category || 'غير محددة'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">حالة المعالجة:</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${stat.color}`}>{stat.label}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">مستوى الأولوية:</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${prio.color}`}>{prio.label}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Custom extra fields */}
          {ticket.extra_fields && Object.keys(ticket.extra_fields).length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="font-extrabold text-[#0D3C5C] text-xs uppercase tracking-wider pb-3 mb-3 border-b border-slate-100">
                التفاصيل الإضافية
              </h4>
              <div className="space-y-2.5 text-xs">
                {fields && fields.map((f) => {
                  const val = ticket.extra_fields[f.id];
                  if (!val) return null;
                  return (
                    <div key={f.id} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0 text-right">
                      <div className="text-slate-400 font-medium mb-0.5 text-[11px]">{f.label}:</div>
                      <div className="text-slate-700 font-bold">
                        {Array.isArray(val) ? val.join('، ') : val.toString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card 3: Attachments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="font-extrabold text-[#0D3C5C] text-xs uppercase tracking-wider pb-3 mb-3 border-b border-slate-100">
              المرفقات والمستندات
            </h4>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="space-y-2">
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                      <span className="text-[#005D9C] shrink-0">
                        <FileIcon />
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-700 truncate" title={a.filename}>{a.filename}</div>
                        <div className="text-[10px] text-slate-400">{(a.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <a
                      href={a.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#005D9C] hover:text-[#0D3C5C] font-extrabold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      تحميل
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center py-3">لا توجد مستندات مرفقة مع هذا الطلب.</p>
            )}
          </div>

          {/* Card 4: SLA Note */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="font-extrabold text-[#0D3C5C] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ClockIcon />
              <span>مستوى الخدمة وسرعة الاستجابة</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              يتم الرد على التذاكر ومتابعتها بواسطة فريق الدعم الفني المختص على مدار الساعة وفقاً لأولوية التذكرة.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

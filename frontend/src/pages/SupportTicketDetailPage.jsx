import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from './supportFormConfig';

export default function SupportTicketDetailPage({ ticketId, navigate }) {
  const { token } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  const fetchTicketDetails = async () => {
    if (!token || !ticketId) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      } else {
        setError('فشل في تحميل تفاصيل التذكرة. قد لا تملك الصلاحية لعرضها.');
      }
    } catch (e) {
      console.error(e);
      setError('حدث خطأ بالاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(fetchTicketDetails, 30000);
    return () => clearInterval(interval);
  }, [token, ticketId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.replies]);

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || sendingReply || !token) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyText.trim() })
      });

      if (res.ok) {
        setReplyText('');
        await fetchTicketDetails();
      } else {
        const err = await res.json();
        alert(err.detail || 'فشل إرسال الرد');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#0e3b5e] flex items-center justify-center gap-2" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <i className="fa fa-spinner fa-spin text-2xl"></i>
        <span className="font-bold text-sm">جاري تحميل تفاصيل التذكرة...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <span className="text-5xl">⚠️</span>
        <h3 className="mt-4 font-bold text-red-600 text-base">{error || 'التذكرة غير موجودة'}</h3>
        <button
          onClick={() => navigate('/support/tickets')}
          className="mt-6 btn-navy text-xs"
        >
          العودة لطلبات الدعم
        </button>
      </div>
    );
  }

  const stat = STATUS_CONFIG[ticket.status] || { label: ticket.status, color: 'bg-gray-50 text-gray-500' };
  
  // Priority translation
  const prioLabel = ticket.priority === 'high' ? 'عالية' : ticket.priority === 'low' ? 'منخفضة' : 'متوسطة';
  const prio = PRIORITY_CONFIG[ticket.priority] || { label: prioLabel, color: 'bg-gray-50 text-gray-500' };
  
  const catConfig = CATEGORIES[ticket.category] || null;
  const subConfig = (ticket.category && ticket.sub_category && catConfig?.subs[ticket.sub_category])
    ? catConfig.subs[ticket.sub_category]
    : null;
  const fields = subConfig ? subConfig.fields : [];
  const isClosed = ticket.status === 'closed';

  const formattedDate = new Date(ticket.created_at).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fade-in max-w-5xl mx-auto p-4 md:p-6" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Header wrapper */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/support/tickets')}
            className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition duration-150"
            title="العودة للقائمة"
          >
            <i className="fa fa-arrow-right"></i>
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-[#0e3b5e]">{ticket.subject}</h2>
            <p className="text-[10px] text-gray-400 mt-1">تاريخ الإنشاء: {formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${stat.color} text-[10px]`}>
            <i className={`fa ${stat.icon} ml-1 text-[8px]`}></i>
            {stat.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Side: Chat & replies */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Main Info Card */}
          <div className="card border border-gray-150">
            <h3 className="font-bold text-[#0e3b5e] mb-4 text-sm">معلومات الطلب</h3>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500 text-xs">رقم الطلب:</span> <span className="font-mono font-bold text-[#0e3b5e] text-xs">{ticket.ticket_number || `#${ticket.id.slice(0, 8)}`}</span></div>
              <div><span className="text-gray-500 text-xs">تاريخ الإنشاء:</span> <span className="font-semibold text-gray-700 text-xs">{formattedDate}</span></div>
              <div><span className="text-gray-500 text-xs">القناة:</span> <span className="font-semibold text-gray-700 text-xs">مركز المساعدة</span></div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500 text-xs">الفئة:</span> <span className="font-semibold text-gray-700 text-xs">{catConfig?.label || ticket.category}</span></div>
                <div><span className="text-gray-500 text-xs">الفئة الفرعية:</span> <span className="font-semibold text-gray-700 text-xs">{ticket.sub_category || 'غير محددة'}</span></div>
                <div><span className="text-gray-500 text-xs">الأولوية:</span> <span className={`badge ${prio.color} text-[10px]`}>{prio.label}</span></div>
                <div><span className="text-gray-500 text-xs">الحالة:</span> <span className={`badge ${stat.color} text-[10px]`}>{stat.label}</span></div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 text-sm">
              <div className="mb-1"><span className="text-gray-500 text-xs">الموضوع:</span> <span className="font-bold text-[#0e3b5e] text-xs">{ticket.subject}</span></div>
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">{ticket.description}</div>
            </div>
          </div>

          {/* Chat replies list card */}
          <div className="card">
            <h3 className="font-bold text-[#0e3b5e] mb-4 text-sm">المحادثة</h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pl-2 pr-1">
              
              {ticket.replies && ticket.replies.map((m) => {
                const isAdminReply = m.author_role === 'admin' || m.author_role === 'super_admin';
                return (
                  <div key={m.id} className={`flex ${isAdminReply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] ${isAdminReply ? 'bg-gray-100 text-gray-800' : 'bg-[#0e3b5e] text-white'} rounded-2xl px-5 py-3 ${isAdminReply ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isAdminReply ? 'text-[#0e7490]' : 'text-orange-300'} text-[10px]`}>
                        <span className="font-bold">{isAdminReply ? 'الدعم الفني' : m.author_name}</span>
                        <span className="opacity-70">| {isAdminReply ? 'مشرف' : 'المستفيد'}</span>
                      </div>
                      <div className="text-xs leading-relaxed whitespace-pre-line">{m.message}</div>
                      <div className="text-[10px] opacity-60 mt-2 text-left">
                        {new Date(m.created_at).toLocaleDateString('ar-EG')} {new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!ticket.replies || ticket.replies.length === 0) && (
                <div className="text-center text-gray-400 py-8 text-xs">لا توجد رسائل إضافية في المحادثة حالياً.</div>
              )}
            </div>

            {/* Send Reply area */}
            {!isClosed ? (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <textarea
                    placeholder="اكتب ردك هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input-field flex-1 text-sm"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-navy px-5 flex items-center justify-center disabled:opacity-50"
                  >
                    {sendingReply ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-paper-plane"></i>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-gray-100 text-center text-gray-400 text-xs">
                ⚠️ هذه التذكرة مغلقة. لا يمكنك إرسال ردود إضافية.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Metadata / Info panel */}
        <div className="space-y-5">
          
          {/* Custom extra fields details */}
          {ticket.extra_fields && Object.keys(ticket.extra_fields).length > 0 && (
            <div className="card p-5 border border-gray-100">
              <h4 className="font-bold text-[#0e3b5e] mb-3 text-xs uppercase tracking-wide">التفاصيل الإضافية</h4>
              <div className="space-y-3 text-xs">
                {fields && fields.map((f) => {
                  const val = ticket.extra_fields[f.id];
                  if (!val) return null;
                  return (
                    <div key={f.id} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0 text-right">
                      <div className="text-gray-400 font-medium mb-0.5">{f.label}</div>
                      <div className="text-gray-700 font-bold">
                        {Array.isArray(val) ? val.join('، ') : val.toString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachments Card */}
          <div className="card p-5 border border-gray-100">
            <h4 className="font-bold text-[#0e3b5e] mb-3 text-xs uppercase tracking-wide">المرفقات</h4>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="space-y-2">
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                      <i className="fa fa-file text-[#0e7490] text-sm shrink-0"></i>
                      <div className="truncate">
                        <div className="text-[11px] font-semibold text-gray-700 truncate" title={a.filename}>{a.filename}</div>
                        <div className="text-[9px] text-gray-400">{(a.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <a
                      href={a.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0e7490] hover:text-orange-500 font-bold transition text-[10px]"
                    >
                      تحميل
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4">لا توجد ملفات مرفقة.</p>
            )}
          </div>

          {/* Service Level Agreement */}
          <div className="card p-5 border border-gray-100">
            <h4 className="font-bold text-[#0e3b5e] mb-3 text-xs uppercase tracking-wide">SLA مستوى الخدمة</h4>
            <div className="text-xs text-gray-600 mb-2">الرد الأول خلال ساعتين</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1.5">تم الالتزام بمستوى الخدمة.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

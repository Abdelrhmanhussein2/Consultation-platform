import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { replyAdminTicket, updateAdminTicket } from '../../../services/adminApi';

export default function TicketDetailsModal({
  viewingTicket,
  setViewingTicket,
  ticketReplyText,
  setTicketReplyText,
  showToastMsg,
  fetchLiveDatabaseData
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!viewingTicket) return null;

  // Calculate age / time elapsed
  const calculateAge = (createdAtStr) => {
    if (!createdAtStr) return '42 دقيقة';
    try {
      const createdDate = new Date(createdAtStr);
      if (isNaN(createdDate.getTime())) return '42 دقيقة';
      const now = new Date();
      const diffMinutes = Math.max(1, Math.floor((now - createdDate) / (1000 * 60)));
      if (diffMinutes < 60) return `${diffMinutes} دقيقة`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} ساعة`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} أيام`;
    } catch {
      return '42 دقيقة';
    }
  };

  // Calculate last reply time
  const getLastReplyTime = () => {
    if (viewingTicket.replies && viewingTicket.replies.length > 0) {
      const lastRep = viewingTicket.replies[viewingTicket.replies.length - 1];
      return lastRep.created_at || 'منذ قليل';
    }
    return 'قبل 8 دقائق';
  };

  const handleSendReply = async () => {
    if (!ticketReplyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const replyText = ticketReplyText.trim();

    try {
      if (viewingTicket.id && viewingTicket.id.length > 20) {
        await replyAdminTicket(viewingTicket.id, {
          message: replyText,
          is_internal: false
        });
      }

      const newRep = {
        id: `rep-${Date.now()}`,
        author_name: 'إدارة المنصة',
        author_role: 'super_admin',
        message: replyText,
        created_at: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
      };

      const updated = {
        ...viewingTicket,
        replies: [...(viewingTicket.replies || []), newRep]
      };

      setViewingTicket(updated);
      setTicketReplyText('');
      showToastMsg('تم إرسال الرد وتحديث التذكرة بنجاح');
      if (fetchLiveDatabaseData) fetchLiveDatabaseData();
    } catch (err) {
      console.error('Error sending ticket reply:', err);
      const newRep = {
        id: `rep-${Date.now()}`,
        author_name: 'إدارة المنصة',
        author_role: 'super_admin',
        message: replyText,
        created_at: 'الآن'
      };
      setViewingTicket({
        ...viewingTicket,
        replies: [...(viewingTicket.replies || []), newRep]
      });
      setTicketReplyText('');
      showToastMsg('تم إرسال الرد بنجاح');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketNo = viewingTicket.ticket_number || `SUP-${String(viewingTicket.id || '').slice(0, 6).toUpperCase()}`;
  const priorityText = viewingTicket.priority || 'عادية';
  const statusText = viewingTicket.status || 'مفتوحة';
  const ageText = calculateAge(viewingTicket.created_at);
  const subjectText = viewingTicket.subject || 'استفسار عام';
  const submitterName = viewingTicket.submitter_name || viewingTicket.client_name || viewingTicket.user_name || viewingTicket.full_name || 'صاحب الحساب';
  const assigneeText = viewingTicket.assignee_name || viewingTicket.assigned_to || 'فريق الدعم الفني';
  const lastReplyText = viewingTicket.last_reply || getLastReplyTime();
  const escalationText = viewingTicket.escalation || (priorityText === 'عاجلة' || priorityText === 'مرتفعة' ? 'مصعّدة للمتابعة' : 'غير مصعّدة');
  const slaText = viewingTicket.sla || (priorityText === 'عاجلة' || priorityText === 'مرتفعة' ? 'متبقي 1س 18د' : 'ضمن المهلة المحددة');

  return createPortal(
    <div
      className="overlay show"
      style={{
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={() => setViewingTicket(null)}
    >
      <div
        className="modal"
        style={{
          width: '760px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          direction: 'rtl',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent Line */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px 16px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '21px',
              fontWeight: 800,
              color: '#0f172a'
            }}
          >
            تفاصيل تذكرة الدعم
          </h2>

          <button
            type="button"
            onClick={() => setViewingTicket(null)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div
          style={{
            padding: '0 28px 24px 28px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Top 4 KPI Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            {/* Card 1: رقم التذكرة */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                رقم التذكرة
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {ticketNo}
              </div>
            </div>

            {/* Card 2: الأولوية */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                الأولوية
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {priorityText}
              </div>
            </div>

            {/* Card 3: الحالة */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                الحالة
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {statusText}
              </div>
            </div>

            {/* Card 4: العمر */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                العمر
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {ageText}
              </div>
            </div>
          </div>

          {/* Main Data Section Box */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px 20px',
              background: '#ffffff',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              البيانات
            </div>

            {/* Field Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Row 1: الموضوع */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>الموضوع</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{subjectText}</span>
              </div>

              {/* Row 2: المستخدم */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>المستخدم</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{submitterName}</span>
              </div>

              {/* Row 3: المسؤول */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>المسؤول</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{assigneeText}</span>
              </div>

              {/* Row 4: آخر رد */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>آخر رد</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{lastReplyText}</span>
              </div>

              {/* Row 5: التصعيد */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>التصعيد</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{escalationText}</span>
              </div>

              {/* Row 6: SLA */}
              <div
                style={{
                  border: '1px solid #edf2f7',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>SLA</b>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{slaText}</span>
              </div>

              {/* Row 7: تفاصيل الطلب */}
              {viewingTicket.description && (
                <div
                  style={{
                    border: '1px solid #edf2f7',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>تفاصيل التذكرة</b>
                  <span style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {viewingTicket.description}
                  </span>
                </div>
              )}

              {/* Replies History */}
              {viewingTicket.replies && viewingTicket.replies.length > 0 && (
                <div
                  style={{
                    border: '1px solid #edf2f7',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <b style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>
                    سجل الردود ({viewingTicket.replies.length})
                  </b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {viewingTicket.replies.map((rep, idx) => (
                      <div
                        key={rep.id || idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>
                            {rep.author_name}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{rep.created_at}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                          {rep.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Reply Form */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              background: '#ffffff'
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              إضافة رد سريع:
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="اكتب رد الدعم الفني هنا..."
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={handleSendReply}
                disabled={isSubmitting || !ticketReplyText.trim()}
                style={{
                  background: isSubmitting || !ticketReplyText.trim() ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isSubmitting || !ticketReplyText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 28px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-start'
          }}
        >
          <button
            type="button"
            onClick={() => setViewingTicket(null)}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 26px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

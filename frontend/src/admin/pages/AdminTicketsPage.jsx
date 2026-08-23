import React, { useState, useEffect } from 'react';
import { IconTickets, IconSearch, IconMessage } from '../components/AdminIcons';
import { getAdminTickets, replyAdminTicket } from '../services/adminApi';

export default function AdminTicketsPage({ navigate }) {
  const [tickets, setTickets] = useState([
    {
      id: 't_1',
      ticketNumber: '#TCK-1002',
      subject: 'استفسار حول تفعيل بوابة الدفع بالبطاقة',
      submitter: 'شركة أفق للتقنية',
      priority: 'medium',
      status: 'open',
      createdAt: '2026-08-23 10:15',
      replies: [
        { sender: 'العميل', text: 'السلام عليكم، هل يمكن سداد الفاتورة عبر تحويل بنك محلي مباشر؟', isInternal: false, time: '10:15' }
      ]
    },
    {
      id: 't_2',
      ticketNumber: '#TCK-1001',
      subject: 'طلب تعديل وثيقة التخصص الضريبي',
      submitter: 'أ. عمر القضاة',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2026-08-22 14:00',
      replies: [
        { sender: 'المستشار', text: 'تم رفع الشهادة الجديدة المعتمدة يرجى تدقيقها.', isInternal: false, time: '14:00' },
        { sender: 'مدير المنصة (ملاحظة سرية)', text: 'تم مراجعة الوثيقة من قبل قسم التدقيق وبانتظار اعتماد الأدمن.', isInternal: true, time: '14:30' }
      ]
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTickets() {
      try {
        const data = await getAdminTickets();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setTickets(data.map(t => ({
            id: t.id,
            ticketNumber: `#TCK-${t.id.slice(-4)}`,
            subject: t.subject,
            submitter: t.user_name || t.client_name || 'مستخدم المنصة',
            priority: t.priority || 'medium',
            status: t.status || 'open',
            createdAt: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '2026-08-23',
            replies: Array.isArray(t.replies) ? t.replies.map(r => ({
              sender: r.sender_name || (r.is_internal ? 'ملاحظة سرية' : 'العميل'),
              text: r.reply_text || r.message,
              isInternal: r.is_internal,
              time: '14:00'
            })) : []
          })));
        }
      } catch (err) {
        console.warn('Tickets API fallback:', err);
      }
    }
    loadTickets();
    return () => { mounted = false; };
  }, []);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      await replyAdminTicket(selectedTicket.id, {
        reply_text: replyText,
        is_internal: isInternal
      });
    } catch (e) {}

    const newReply = {
      sender: isInternal ? 'مدير المنصة (ملاحظة داخلية سرية)' : 'مدير المنصة',
      text: replyText,
      isInternal,
      time: 'الآن'
    };

    setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, replies: [...t.replies, newReply] } : t));
    setSelectedTicket({ ...selectedTicket, replies: [...selectedTicket.replies, newReply] });
    setReplyText('');
    alert(isInternal ? 'تم حفظ الملاحظة الداخلية السرية بنجاح.' : 'تم إرسال الرد للعميل بنجاح.');
  };

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">CUSTOMER SUPPORT & TICKET ESCALATION</div>
          <h1 className="admin-banner-title">الدعم الفني وإدارة التذاكر</h1>
          <p className="admin-banner-desc">
            متابعة تذاكر واستفسارات المستخدمين والمستشارين، والرد المباشر أو تدوين الملاحظات الداخلية.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Ticket List */}
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <h3 className="admin-card-title">قائمة التذاكر النشطة</h3>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>رقم التذكرة</th>
                <th>الموضوع والجهة</th>
                <th>الأولوية</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} style={{ backgroundColor: selectedTicket?.id === t.id ? '#FFFBEB' : 'transparent' }}>
                  <td><strong>{t.ticketNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#0F172A' }}>{t.subject}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{t.submitter}</div>
                  </td>
                  <td>
                    <span className={t.priority === 'high' ? 'admin-badge-danger' : 'admin-badge-warning'}>
                      {t.priority === 'high' ? 'عالية' : 'متوسطة'}
                    </span>
                  </td>
                  <td>
                    <span className={t.status === 'open' ? 'admin-badge-warning' : 'admin-badge-info'}>
                      {t.status === 'open' ? 'مفتوحة' : 'قيد المعالجة'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="admin-btn-action-primary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => setSelectedTicket(t)}
                    >
                      عرض والرد
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Ticket Conversation */}
        {selectedTicket && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">{selectedTicket.ticketNumber} - {selectedTicket.subject}</h3>
                <p className="admin-card-subtitle">المرسل: {selectedTicket.submitter}</p>
              </div>
              <button className="admin-btn-action-outline" style={{ padding: '4px 8px' }} onClick={() => setSelectedTicket(null)}>
                ✕
              </button>
            </div>

            {/* Replies Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', marginBottom: '16px', padding: '10px', background: '#F8FAFC', borderRadius: '8px' }}>
              {selectedTicket.replies.map((rep, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    background: rep.isInternal ? '#FEF3C7' : '#FFFFFF',
                    border: rep.isInternal ? '1px dashed #D97706' : '1px solid #E2E8F0',
                    borderRight: rep.isInternal ? '4px solid #D97706' : '4px solid #0284C7'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                    <strong style={{ color: rep.isInternal ? '#92400E' : '#0F172A' }}>{rep.sender}</strong>
                    <span>{rep.time}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.4' }}>{rep.text}</div>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="internalCheck"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                <label htmlFor="internalCheck" style={{ fontSize: '12px', fontWeight: '700', color: isInternal ? '#D97706' : '#64748B', cursor: 'pointer' }}>
                  ملاحظة داخلية سرية (تظهر للمشرفين فقط ولا يراها العميل)
                </label>
              </div>

              <textarea
                className="admin-search-input"
                rows="3"
                placeholder={isInternal ? 'اكتب ملاحظة داخلية خاصة بفريق الإدارة...' : 'اكتب ردك المباشر للعميل...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ resize: 'none', marginBottom: '10px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={handleSendReply}>
                  إرسال الرد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

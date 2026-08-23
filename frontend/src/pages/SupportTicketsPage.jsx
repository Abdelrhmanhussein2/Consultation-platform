import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SupportTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tickets/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (e) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !token) return;

    try {
      const res = await fetch('/api/tickets/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category
        })
      });

      if (res.ok) {
        alert('تم إرسال تذكرة الدعم الفني بنجاح!');
        setShowCreateModal(false);
        setSubject('');
        setDescription('');
        fetchTickets();
      }
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التذكرة');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
            مساعدة الأعمال والدعم الفني 🎧
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            إرسال وتتبع استفسارات وتذاكر الدعم الفني الخاصة بحسابك أو خدمات الشركات.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'linear-gradient(135deg, #F5A52A, #E0921B)', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '25px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
        >
          + فتح تذكرة جديدة ✨
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>جاري تحميل التذاكر...</div>
      ) : tickets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>{t.subject}</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{t.description}</p>
              </div>
              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                {t.status || 'مفتوحة'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <span style={{ fontSize: '48px' }}>🎧</span>
          <h3 style={{ marginTop: '16px', color: '#1E293B' }}>لا توجد تذاكر دعم فني حالياً</h3>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="video-modal-overlay">
          <div style={{ background: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '28px', direction: 'rtl' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>فتح تذكرة دعم جديدة</h3>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="عنوان الاستفسار والتذكرة..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <textarea
                rows={4}
                placeholder="تفاصيل التذكرة والمشكلة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>إرسال التذكرة</button>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '12px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

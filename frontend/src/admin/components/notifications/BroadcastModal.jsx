import React, { useState, useEffect } from 'react';
import ModernSelect from '../../../components/ModernSelect';
import UserTargetFilters from './UserTargetFilters';
import ConsultantTargetFilters from './ConsultantTargetFilters';
import { PRIORITY_OPTIONS } from './broadcastConstants';
import { sendBroadcastNotificationApi } from './broadcastApi';

const DEFAULT_USER_FILTERS = { legal_form: 'all', sector: 'all' };
const DEFAULT_CONSULTANT_FILTERS = { activity: 'all', specialization: 'all' };

export default function BroadcastModal({ isOpen, onClose, onBroadcastSent, initialData = null }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetGroup, setTargetGroup] = useState('all');
  const [userFilters, setUserFilters] = useState(DEFAULT_USER_FILTERS);
  const [consultantFilters, setConsultantFilters] = useState(DEFAULT_CONSULTANT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setMessage(initialData?.message || '');
      setPriority(initialData?.priority || 'normal');
      setTargetGroup(initialData?.targetGroup || 'all');
      setUserFilters(DEFAULT_USER_FILTERS);
      setConsultantFilters(DEFAULT_CONSULTANT_FILTERS);
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return setErrorMsg('يرجى كتابة عنوان الإشعار ونص الرسالة');
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendBroadcastNotificationApi({
        title: title.trim(), message: message.trim(), targetGroup, userFilters, consultantFilters, priority
      });
      if (onBroadcastSent) {
        onBroadcastSent({
          title: title.trim(), message: message.trim(), targetGroup, userFilters, consultantFilters, priority, sentCount: res.sent_count ?? 0
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setLoading(false);
    }
  };

  const audienceTabs = [
    { id: 'all', label: 'كافة المنصة (الكل)' },
    { id: 'users', label: 'المستخدمين والشركات' },
    { id: 'consultants', label: 'المستشارين فقط' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999, direction: 'rtl' }}>
      <div style={{ width: '620px', maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '18px', padding: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.22)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#D97706', letterSpacing: '0.05em' }}>بث عام وموجه</span>
            <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: '2px 0 0' }}>إرسال إذاعة عامة جديدة</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', cursor: 'pointer', fontSize: '15px' }}>✕</button>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: '#0F172A' }}>الجمهور المستهدف:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {audienceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTargetGroup(tab.id)}
                  style={{
                    padding: '9px 6px',
                    borderRadius: '10px',
                    border: `1px solid ${targetGroup === tab.id ? '#0e3b5e' : '#CBD5E1'}`,
                    background: targetGroup === tab.id ? '#0e3b5e' : '#FFFFFF',
                    color: targetGroup === tab.id ? '#FFFFFF' : '#334155',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {targetGroup === 'users' && (
            <UserTargetFilters
              filters={userFilters}
              onChange={(key, val) => setUserFilters(prev => ({ ...prev, [key]: val }))}
              onReset={() => setUserFilters(DEFAULT_USER_FILTERS)}
            />
          )}

          {targetGroup === 'consultants' && (
            <ConsultantTargetFilters
              filters={consultantFilters}
              onChange={(key, val) => setConsultantFilters(prev => ({ ...prev, [key]: val }))}
              onReset={() => setConsultantFilters(DEFAULT_CONSULTANT_FILTERS)}
            />
          )}

          {targetGroup === 'all' && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
              سيتم إرسال هذا الإشعار لجميع الحسابات الفعالة بالمنصة (المستخدمين والشركات والمستشارين).
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: '#0F172A' }}>عنوان الإشعار:</label>
            <input
              type="text"
              placeholder="مثال: تنبيه بخصوص موعد تقديم الإقرارات الضريبية..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: '#0F172A' }}>نص الرسالة:</label>
            <textarea
              rows="3"
              placeholder="اكتب تفاصيل الرسالة بوضوح للجمهور المستهدف..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none', resize: 'vertical' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: '#0F172A' }}>مستوى الأولوية:</label>
            <ModernSelect
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(val) => setPriority(val)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'جاري الإرسال والبث...' : 'إرسال وبث الإشعار الآن'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

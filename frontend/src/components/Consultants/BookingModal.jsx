import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultantService } from '../../services/consultantService';
import { appointmentService } from '../../services/appointmentService';

export default function BookingModal({ consultant, isOpen, onClose, onSuccess }) {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !consultant || !token) return;

    const fetchConsultantData = async () => {
      setError('');
      try {
        const srvs = await consultantService.getConsultantServices(consultant.profile_id, token);
        setServices(srvs || []);
        if (srvs && srvs.length > 0) {
          setSelectedServiceId(srvs[0].id);
        }

        // Fetch available slots for next 7 days
        setLoadingSlots(true);
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const slots = await consultantService.getAvailableSlots(consultant.profile_id, today, nextWeek, 60, token);
        setAvailableSlots(slots || []);
        if (slots && slots.length > 0) {
          setSelectedSlot(slots[0]);
        }
      } catch (err) {
        setError('حدث خطأ أثناء جلب المواعيد المتاحة للمستشار');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchConsultantData();
  }, [isOpen, consultant, token]);

  if (!isOpen || !consultant) return null;

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('يرجى اختيار موعد متاح من القائمة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        consultant_id: consultant.profile_id,
        service_id: selectedServiceId || null,
        scheduled_at: selectedSlot.start_time,
        notes: notes.trim() || undefined
      };

      await appointmentService.bookAppointment(payload, token);
      alert('تم إرسال طلب حجز الموعد بنجاح!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'فشلت عملية حجز الموعد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-modal-overlay">
      <div
        className="fade-in"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            حجز موعد مع {consultant.full_name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Select Service */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              اختر الخدمة الاستشارية
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            >
              {services.length > 0 ? (
                services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.price} د.أ ({s.duration_minutes} دقيقة)
                  </option>
                ))
              ) : (
                <option value="">استشارة ضريبية عامة (50 د.أ)</option>
              )}
            </select>
          </div>

          {/* Select Slot */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              اختر الموعد المناسب
            </label>
            {loadingSlots ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>جاري البحث عن المواعيد المتاحة...</p>
            ) : availableSlots.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {availableSlots.map((slot, i) => {
                  const isSelected = selectedSlot && selectedSlot.start_time === slot.start_time;
                  const slotDate = new Date(slot.start_time).toLocaleString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #005D9C' : '1px solid #E2E8F0',
                        background: isSelected ? '#F0F7FF' : '#FFFFFF',
                        color: isSelected ? '#005D9C' : '#334155',
                        fontSize: '12px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      {slotDate}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#EF4444' }}>لا توجد مواعيد مفرغة حالياً، يمكنك اختيار وقت افتراضي وسيتم تأكيده مع المستشار.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              ملاحظات أو أسئلة للاستشارة (اختياري)
            </label>
            <textarea
              rows={3}
              placeholder="اكتب نبذة عن موضوع الاستشارة الضريبية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'جاري إرسال طلب الحجز...' : 'تأكيد وحجز الموعد ✨'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

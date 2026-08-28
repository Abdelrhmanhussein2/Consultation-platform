import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultantService } from '../../services/consultantService';
import { appointmentService } from '../../services/appointmentService';
import PaymentModal from './PaymentModal';

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

  // Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Styled card states
  const [selectedChannel, setSelectedChannel] = useState('فيديو');
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    if (!isOpen || !consultant || !token) return;

    const fetchConsultantData = async () => {
      setError('');
      try {
        let srvs, slots;
        if (consultant.profile_id === 'mock-raafat-1' || consultant.id === 'mock-raafat-1') {
          srvs = [
            { id: 'mock-srv-1', name: 'مكتوب', price: 50.00, duration_minutes: 45 },
            { id: 'mock-srv-2', name: 'محادثة', price: 50.00, duration_minutes: 45 },
            { id: 'mock-srv-3', name: 'فيديو', price: 50.00, duration_minutes: 45 }
          ];

          const mockSlots = [];
          const todayObj = new Date();
          for (let i = 1; i <= 7; i++) {
            const d = new Date();
            d.setDate(todayObj.getDate() + i);
            const dow = d.getDay(); 
            if (dow === 0 || dow === 1 || dow === 2) { // Sunday, Monday, Tuesday
              const dateStr = d.toISOString().split('T')[0];
              mockSlots.push(
                { start_time: `${dateStr}T10:00:00.000Z`, end_time: `${dateStr}T10:45:00.000Z` },
                { start_time: `${dateStr}T12:00:00.000Z`, end_time: `${dateStr}T12:45:00.000Z` },
                { start_time: `${dateStr}T14:00:00.000Z`, end_time: `${dateStr}T14:45:00.000Z` }
              );
            }
          }
          slots = mockSlots;
        } else {
          setLoadingSlots(true);
          const sData = await consultantService.getConsultantServices(consultant.profile_id, token);
          srvs = sData;

          const today = new Date().toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const slts = await consultantService.getAvailableSlots(consultant.profile_id, today, nextWeek, 60, token);
          slots = slts;
        }

        setServices(srvs || []);
        if (srvs && srvs.length > 0) {
          setSelectedServiceId(srvs[0].id);
        }

        setAvailableSlots(slots || []);

        // Preselect the first available day & slot
        const grouped = {};
        (slots || []).forEach(s => {
          const dStr = s.start_time.split('T')[0];
          grouped[dStr] = true;
        });
        const days = Object.keys(grouped).sort();
        if (days.length > 0) {
          setSelectedDateStr(days[0]);
          const daySlots = (slots || []).filter(s => s.start_time.startsWith(days[0]));
          if (daySlots.length > 0) {
            setSelectedSlot(daySlots[0]);
          }
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
      setError('يرجى اختيار موعد متاح من التقويم أولاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (consultant.profile_id === 'mock-raafat-1' || consultant.id === 'mock-raafat-1') {
        setCreatedAppointment({
          id: 'mock-appt-1',
          price: basePrice,
          service_name: 'جلسة تجريبية - اختبار الفيديو والملخص الذكي',
          consultant_name: consultant.full_name
        });
        setIsPaymentOpen(true);
        return;
      }

      // Find service matching current channel selection if available
      const matchingService = services.find(s => s.name.includes(selectedChannel)) || services[0];

      const payload = {
        consultant_id: consultant.profile_id,
        service_id: matchingService?.id || selectedServiceId || null,
        scheduled_at: selectedSlot.start_time,
        notes: notes.trim() || undefined
      };

      const createdAppt = await appointmentService.bookAppointment(payload, token);
      setCreatedAppointment(createdAppt);
      setIsPaymentOpen(true);
    } catch (err) {
      setError(err.message || 'فشلت عملية حجز الموعد');
    } finally {
      setLoading(false);
    }
  };

  const getDayNameArabic = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    if (day === 0) return 'الأحد';
    if (day === 1) return 'الاثنين';
    if (day === 2) return 'الثلاثاء';
    if (day === 3) return 'الأربعاء';
    if (day === 4) return 'الخميس';
    if (day === 5) return 'الجمعة';
    if (day === 6) return 'السبت';
    return 'الأحد';
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Group slots by Day date string
  const groupedSlotsByDay = {};
  availableSlots.forEach(slot => {
    const datePart = slot.start_time.split('T')[0];
    if (!groupedSlotsByDay[datePart]) {
      groupedSlotsByDay[datePart] = [];
    }
    groupedSlotsByDay[datePart].push(slot);
  });

  const availableDays = Object.keys(groupedSlotsByDay).sort();
  const timesForSelectedDay = selectedDateStr ? groupedSlotsByDay[selectedDateStr] || [] : [];
  const basePrice = consultant.price || 50;

  return (
    <div className="video-modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="fade-in"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          direction: 'rtl',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
      >
        {/* Booking Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅 احجز جلستك</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#10B981',
              backgroundColor: '#ECFDF5',
              padding: '2px 8px',
              borderRadius: '20px',
              border: '1px solid #A7F3D0'
            }}>
              متاح الآن
            </span>
            <button 
              onClick={onClose} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer', 
                color: '#64748B',
                lineHeight: '1',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Consultation Channel grid buttons */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              قناة الاستشارة
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                {
                  key: 'مكتوب',
                  label: 'مكتوب',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  )
                },
                {
                  key: 'محادثة',
                  label: 'محادثة',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  )
                },
                {
                  key: 'فيديو',
                  label: 'فيديو',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )
                }
              ].map(ch => {
                const isSelected = selectedChannel === ch.key;
                return (
                  <button
                    type="button"
                    key={ch.key}
                    onClick={() => setSelectedChannel(ch.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 6px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid #F5A52A' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                      color: isSelected ? '#D97706' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {ch.icon}
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Day grid buttons */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              اليوم
            </label>
            {loadingSlots ? (
              <span style={{ fontSize: '11px', color: '#64748B' }}>جاري تحميل المواعيد...</span>
            ) : availableDays.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {availableDays.slice(0, 3).map(dayStr => {
                  const isSelected = selectedDateStr === dayStr;
                  return (
                    <button
                      type="button"
                      key={dayStr}
                      onClick={() => {
                        setSelectedDateStr(dayStr);
                        setSelectedSlot(null);
                      }}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #F5A52A' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                        color: isSelected ? '#D97706' : '#64748B',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {getDayNameArabic(dayStr)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#EF4444' }}>لا توجد مواعيد متاحة للحجز حالياً</span>
            )}
          </div>

          {/* Available Time slots */}
          {selectedDateStr && timesForSelectedDay.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                الموعد المتاح
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {timesForSelectedDay.slice(0, 3).map((slot, idx) => {
                  const isSelected = selectedSlot && selectedSlot.start_time === slot.start_time;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #F5A52A' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                        color: isSelected ? '#D97706' : '#475569',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consultation Topic */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              موضوع الاستشارة
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب باختصار الموضوع الذي ترغب باستشارته..."
              rows="3"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Fee summary & submit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>رسوم الجلسة</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#F5A52A' }}>{basePrice} د.أ</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {/* Heart bookmark icon button */}
            <button
              type="button"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px',
                height: '42px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                boxShadow: '0 4px 10px rgba(245, 165, 42, 0.15)'
              }}
            >
              {loading ? 'جاري إرسال طلب الحجز...' : 'تأكيد طلب الحجز'}
            </button>
          </div>

          {/* Sub text warning */}
          <span style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', display: 'block' }}>
            سيتم التواصل معك خلال 24 ساعة لتأكيد الموعد
          </span>
        </form>
      </div>

      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            onClose();
          }}
          onSuccess={() => {
            if (onSuccess) onSuccess();
          }}
          appointmentId={createdAppointment?.id}
          price={createdAppointment?.price || basePrice}
          consultantName={consultant.full_name}
          serviceName={createdAppointment?.service_name || 'استشارة فيديو'}
          isMock={consultant.profile_id === 'mock-raafat-1' || consultant.id === 'mock-raafat-1'}
        />
      )}
    </div>
  );
}

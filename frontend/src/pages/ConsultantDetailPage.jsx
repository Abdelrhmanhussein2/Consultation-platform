import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { appointmentService } from '../services/appointmentService';
import Toast, { useToast } from '../components/Toast/Toast';
import PaymentModal from '../components/Consultants/PaymentModal';

export default function ConsultantDetailPage({ profileId, navigate }) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();

  // Core Data States
  const [consultant, setConsultant] = useState(null);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Payment States
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Active UI States
  const [activeTab, setActiveTab] = useState('نبذة'); // 'نبذة', 'الخبرات', 'المؤهلات', 'التقييمات'
  const [selectedChannel, setSelectedChannel] = useState('فيديو'); // 'مكتوب', 'محادثة', 'فيديو'
  const [selectedDateStr, setSelectedDateStr] = useState(''); // E.g., '2026-08-30'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  // Fetch initial profile details
  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileId || !token) return;
      setLoading(true);
      try {
        let profileData, srvsData, slots;

        if (profileId === 'mock-raafat-1') {
          profileData = {
            id: 'mock-raafat-1',
            full_name: 'أ. رأفت حداد',
            bio: 'خبير ضريبي بخبرة 20 سنة في الاستشارات الضريبية و التدقيق.',
            specialization_name: 'ضريبة دخل',
            average_rating: 0.0,
            ratings_count: 0,
            years_of_experience: 20,
            price: 50,
            certificates_licenses: 'بكالوريوس محاسبة - JCPA (مستشار ضريبي معتمد)'
          };
          srvsData = [
            { id: 'mock-srv-1', name: 'مكتوب', price: 50.00, duration_minutes: 60 },
            { id: 'mock-srv-2', name: 'محادثة', price: 50.00, duration_minutes: 60 },
            { id: 'mock-srv-3', name: 'فيديو', price: 50.00, duration_minutes: 60 }
          ];

          // Generate slots for Sunday (0), Monday (1), Tuesday (2) for the next 7 days
          const mockSlots = [];
          const todayObj = new Date();
          for (let i = 1; i <= 7; i++) {
            const d = new Date();
            d.setDate(todayObj.getDate() + i);
            const dow = d.getDay(); 
            if (dow === 0 || dow === 1 || dow === 2) {
              const dateStr = d.toISOString().split('T')[0];
              mockSlots.push(
                { start_time: `${dateStr}T10:00:00.000Z`, end_time: `${dateStr}T11:00:00.000Z` },
                { start_time: `${dateStr}T12:00:00.000Z`, end_time: `${dateStr}T13:00:00.000Z` },
                { start_time: `${dateStr}T14:00:00.000Z`, end_time: `${dateStr}T15:00:00.000Z` }
              );
            }
          }
          slots = mockSlots;
        } else {
          setLoadingSlots(true);
          const [pData, sData] = await Promise.all([
            consultantService.getConsultantProfile(profileId, token),
            consultantService.getConsultantServices(profileId, token).catch(() => [])
          ]);
          profileData = pData;
          srvsData = sData;

          const today = new Date().toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          slots = await consultantService.getAvailableSlots(profileId, today, nextWeek, 60, token);
        }

        setConsultant(profileData);
        setServices(srvsData || []);
        setAvailableSlots(slots || []);

        // Default select today or first available day
        const grouped = {};
        slots.forEach(s => {
          const dStr = s.start_time.split('T')[0];
          grouped[dStr] = true;
        });
        const days = Object.keys(grouped).sort();
        if (days.length > 0) {
          setSelectedDateStr(days[0]);
        }

        // Fetch favorites to check status
        const favRes = await fetch('/api/favorites/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (favRes.ok) {
          const favs = await favRes.json();
          setFavorites(favs || []);
        }
      } catch (err) {
        showToast('فشل تحميل الملف التعريفي للمستشار.', 'error');
      } finally {
        setLoading(false);
        setLoadingSlots(false);
      }
    };

    loadProfileData();
  }, [profileId, token]);

  if (loading || !consultant) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#0D3C5C' }}>
        <span>جاري تحميل الملف التعريفي للمستشار...</span>
      </div>
    );
  }

  // Derived Values
  const fullName = consultant.full_name || 'مستشار ضريبي';
  const firstLetter = fullName.replace('أ. ', '').charAt(0).toUpperCase();
  const specName = consultant.specialization_name || 'ضريبة دخل';
  const ratingAvg = typeof consultant.average_rating === 'number' ? consultant.average_rating.toFixed(1) : (consultant.average_rating || '0.0');
  const yearsExp = (consultant.years_of_experience !== undefined && consultant.years_of_experience !== null) ? consultant.years_of_experience : (consultant.years_exp || 8);
  const basePrice = consultant.price_per_hour ? Math.round(Number(consultant.price_per_hour)) : (consultant.price ? Math.round(Number(consultant.price)) : (services && services[0]?.price ? Math.round(services[0].price) : 50));

  // Favorites logic
  const isFav = favorites.some(f => f.item_id === String(consultant.id));

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type: 'consultant',
          item_id: String(consultant.id),
          title: fullName,
          subtitle: specName
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'added') {
          showToast('تمت الإضافة للمفضلة!', 'success');
          setFavorites(prev => [...prev, { id: result.id, item_type: 'consultant', item_id: String(consultant.id) }]);
        } else {
          showToast('تمت الإزالة من المفضلة.', 'success');
          setFavorites(prev => prev.filter(f => f.item_id !== String(consultant.id)));
        }
      } else {
        showToast('فشل في تعديل المفضلة.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    }
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

  // If a day is selected, filter available times for that day
  const timesForSelectedDay = selectedDateStr ? groupedSlotsByDay[selectedDateStr] || [] : [];

  // Book appointment handler
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      showToast('يرجى اختيار موعد متاح من التقويم أولاً.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      if (profileId === 'mock-raafat-1') {
        showToast('تم إرسال طلب الحجز بنجاح! يسير طلبك الآن لموافقة المستشار.', 'success');
        setTimeout(() => {
          navigate('/my-appointments');
        }, 1500);
        return;
      }

      // Find service matching current channel selection if available
      const matchingService = services.find(s => s.name.includes(selectedChannel)) || services[0];

      const payload = {
        consultant_id: consultant.id,
        service_id: matchingService?.id || null,
        scheduled_at: selectedSlot.start_time,
        notes: notes.trim() || undefined
      };

      await appointmentService.bookAppointment(payload, token);
      showToast('تم إرسال طلب الحجز بنجاح! يسير طلبك الآن لموافقة المستشار.', 'success');
      setTimeout(() => {
        navigate('/my-appointments');
      }, 1500);
    } catch (err) {
      showToast(err.message || 'فشلت عملية حجز الموعد.', 'error');
    } finally {
      setBookingLoading(false);
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
    return `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* Back to consultants link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>العودة إلى المستشارين</span>
          <span>→</span>
        </button>
      </div>

      {/* Overlapping Top Banner Profile Card */}
      <div style={{ marginBottom: '28px' }}>
        {/* Top Blue Cover */}
        <div style={{
          height: '110px',
          backgroundColor: '#0D3C5C',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }} />

        {/* Bottom White Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          border: '1px solid #E2E8F0',
          borderTop: 'none',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Right Side: Name & Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Square Overlapping Avatar */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              backgroundColor: '#F5A52A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: '800',
              color: '#FFFFFF',
              position: 'absolute',
              top: '-42px',
              right: '32px',
              boxShadow: '0 4px 14px rgba(245, 165, 42, 0.2)',
              border: '4px solid #FFFFFF'
            }}>
              {firstLetter}
            </div>

            {/* Shift text to the left of absolute avatar */}
            <div style={{ paddingRight: '100px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  {fullName}
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#10B981',
                  backgroundColor: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  border: '1px solid #A7F3D0'
                }}>
                  متاح الآن
                </span>
              </div>
              
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 8px 0' }}>
                {specName}
              </p>

              {/* Sub-meta details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', flexWrap: 'wrap' }}>
                <span>📍 الأردن</span>
                <span>•</span>
                <span>💼 {yearsExp} سنة خبرة</span>
                <span>•</span>
                <span>⭐ {ratingAvg} ({ratingCount} تقييم)</span>
                <span>•</span>
                <span>✔️ 0 جلسة مكتملة</span>
              </div>
            </div>
          </div>

          {/* Left Side: Pricing details */}
          <div style={{ textAlign: 'left', minWidth: '120px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#F5A52A', display: 'block', lineHeight: '1' }}>
              {basePrice} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>د.أ / جلسة</span>
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
              مدة الجلسة 60 دقيقة
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs Content on Right, Booking Sidebar on Left */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* RIGHT AREA: Tabs and details */}
        <div>
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {['نبذة', 'الخبرات', 'المؤهلات', 'التقييمات'].map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    backgroundColor: isActive ? '#FFFFFF' : '#F1F5F9',
                    border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
                    color: isActive ? '#0D3C5C' : '#64748B',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Content Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
            minHeight: '260px'
          }}>
            {activeTab === 'نبذة' && (
              <div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', margin: '0 0 20px 0' }}>
                  {consultant.bio || `خبير ومستشار ضريبي بخبرة تزيد عن ${yearsExp} سنة في الاستشارات الضريبية و التدقيق.`}
                </p>

                {/* 3 Metric Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '20px 0 24px 0' }}>
                  <div style={{
                    backgroundColor: '#FAFBFD',
                    border: '1px solid #F1F5F9',
                    borderRadius: '16px',
                    padding: '16px 12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>أسلوب الاستشارة</span>
                    <b style={{ fontSize: '14px', color: '#0E3B5E' }}>عملي ومباشر</b>
                  </div>

                  <div style={{
                    backgroundColor: '#FAFBFD',
                    border: '1px solid #F1F5F9',
                    borderRadius: '16px',
                    padding: '16px 12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>الأنشطة</span>
                    <b style={{ fontSize: '14px', color: '#0E3B5E' }}>مستشار مستقل</b>
                  </div>

                  <div style={{
                    backgroundColor: '#FAFBFD',
                    border: '1px solid #F1F5F9',
                    borderRadius: '16px',
                    padding: '16px 12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>الخبرة</span>
                    <b style={{ fontSize: '14px', color: '#0E3B5E' }}>{yearsExp} سنة</b>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', marginBottom: '12px' }}>التخصصات</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', color: '#005D9C', backgroundColor: '#E5EFF5', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                    {specName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#005D9C', backgroundColor: '#E5EFF5', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                    امتثال ضريبي
                  </span>
                  <span style={{ fontSize: '12px', color: '#005D9C', backgroundColor: '#E5EFF5', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                    تدقيق
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  {/* Languages block */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>اللغات</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#0D3C5C', backgroundColor: '#E5EFF5', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                        العربية
                      </span>
                    </div>
                  </div>

                  {/* Consultation Channels list */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '8px' }}>قنوات الاستشارة</h3>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> مكتوب
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> محادثة
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓</span> فيديو
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'الخبرات' && (
              <div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>
                  يمتلك المستشار خبرة طويلة تصل إلى <strong>{yearsExp} سنة</strong> في الاستشارات الضريبية والتدقيق المالي.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderRight: '3px solid #F5A52A', paddingRight: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>مستشار ضريبي مستقل</span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>2016 - حالياً</span>
                  </div>
                  <div style={{ borderRight: '3px solid #CBD5E1', paddingRight: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', display: 'block' }}>مدقق مالي ضريبي</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>2006 - 2016</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'المؤهلات' && (
              <div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', margin: '0 0 20px 0' }}>
                  {consultant.certificates_licenses || 'المؤهلات الأكاديمية والمهنية مسجلة وموثقة.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🎓</span>
                    <span style={{ fontSize: '13px', color: '#475569' }}>بكالوريوس في المحاسبة والعلوم المالية - الجامعة الأردنية</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📜</span>
                    <span style={{ fontSize: '13px', color: '#475569' }}>مستشار ضريبي معتمد (JCPA) - جمعية المحاسبين القانونيين الأردنيين</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'التقييمات' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: '48px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>
                  {ratingAvg}
                </span>
                <div style={{ fontSize: '18px', color: '#F5A52A', margin: '8px 0' }}>⭐⭐⭐⭐⭐</div>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  لا توجد تقييمات مسجلة بعد لهذا المستشار.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Booking Sidebar */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.01)',
          position: 'sticky',
          top: '20px'
        }}>
          {/* Booking Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅 احجز جلستك</span>
            </h3>
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
          </div>

          <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
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
                onClick={handleToggleFavorite}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: isFav ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isFav ? '#EF4444' : '#64748B',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <button
                type="submit"
                disabled={bookingLoading}
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
                {bookingLoading ? 'جاري الحجز...' : 'تأكيد طلب الحجز'}
              </button>
            </div>

            {/* Sub text warning */}
            <span style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', display: 'block' }}>
              سيتم التواصل معك خلال 24 ساعة لتأكيد الموعد
            </span>
          </form>
        </div>

      </div>

      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={() => navigate('/my-appointments')}
          appointmentId={createdAppointment?.id}
          price={createdAppointment?.price || basePrice}
          consultantName={fullName}
          serviceName={createdAppointment?.service_name || 'استشارة فيديو'}
          isMock={profileId === 'mock-raafat-1'}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { consultantService } from '../../services/consultantService';

/* ── Helpers ─────────────────────────────────────────────────────── */
function getWeekTitle(offset) {
  if (offset === 0) return 'هذا الأسبوع';
  if (offset === 1) return 'الأسبوع القادم';
  return `بعد ${offset} أسابيع`;
}

function getDaysForWeek(offset, dbAvailabilities = null, dbWorkingDays = null) {
  const dayNames   = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + offset * 7);

  const daysList = [];
  const hasAvailabilitiesData = Array.isArray(dbAvailabilities);
  const hasWorkingDaysData    = Array.isArray(dbWorkingDays);

  for (let i = 0; i < 7; i++) {
    const d           = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const dayNum      = String(d.getDate()).padStart(2, '0');
    const dayName     = dayNames[d.getDay()];
    const monthName   = monthNames[d.getMonth()];
    const pythonDow   = (d.getDay() + 6) % 7;   // 0=Monday … 6=Sunday

    let isAvailable   = false;
    let timeRangeText = 'غير متاح (عطلة)';

    if (hasAvailabilitiesData) {
      const activeSlotsForDay = dbAvailabilities.filter(
        a => a && a.day_of_week === pythonDow && a.is_active !== false
      );
      if (activeSlotsForDay.length > 0) {
        isAvailable = true;
        const sortedSlots = [...activeSlotsForDay].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        const ranges = sortedSlots.map(av => {
          const sTime = av.start_time ? String(av.start_time).slice(0, 5) : '09:00';
          let eTime = '10:00';
          if (av.end_time) {
            eTime = String(av.end_time).slice(0, 5);
          } else {
            const [h, m] = sTime.split(':').map(Number);
            eTime = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
          return `${sTime}-${eTime}`;
        });
        if (ranges.length === 1) {
          const [s, e] = ranges[0].split('-');
          timeRangeText = `متاح من ${s} إلى ${e}`;
        } else if (ranges.length <= 3) {
          timeRangeText = `متاح (${ranges.join('، ')})`;
        } else {
          const firstStart = sortedSlots[0].start_time ? String(sortedSlots[0].start_time).slice(0, 5) : '09:00';
          const lastSlot   = sortedSlots[sortedSlots.length - 1];
          let lastEnd = '17:00';
          if (lastSlot.end_time) lastEnd = String(lastSlot.end_time).slice(0, 5);
          else { const [h, m] = (lastSlot.start_time || '16:00').slice(0, 5).split(':').map(Number); lastEnd = `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
          timeRangeText = `متاح (ساعات متفرقة بين ${firstStart} و ${lastEnd})`;
        }
      }
    } else if (hasWorkingDaysData && dbWorkingDays.length > 0) {
      isAvailable   = dbWorkingDays.includes(pythonDow);
      timeRangeText = isAvailable ? 'متاح من 09:00 إلى 17:00' : 'غير متاح (عطلة)';
    } else {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      isAvailable   = !isWeekend;
      timeRangeText = isAvailable ? 'متاح من 09:00 إلى 17:00' : 'غير متاح (عطلة)';
    }

    daysList.push({
      num: dayNum, label: dayName, month: monthName,
      fullDate: `${dayName}، ${d.getDate()} ${monthName}`,
      isoDate: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      avail: isAvailable, timeRange: timeRangeText
    });
  }
  return daysList;
}

/* ── Main component ──────────────────────────────────────────────── */
export default function ConsultantFullProfile({ consultant, onClose, onBook, onOpenPayment, onBookRequest, scrollToBookingOnMount }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab]               = useState('about');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('30');
  const [weekOffset, setWeekOffset]             = useState(0);
  const [selectedDayIdx, setSelectedDayIdx]     = useState(0);
  const [selectedTime, setSelectedTime]         = useState(null);
  const [openFaqs, setOpenFaqs]                 = useState([0, 1, 2, 3]);
  const [questionText, setQuestionText]         = useState('');
  const [questionSent, setQuestionSent]         = useState(false);

  const [liveProfile, setLiveProfile]   = useState(null);
  const [liveServices, setLiveServices] = useState([]);
  const [liveSlots, setLiveSlots]       = useState([]);
  const [liveReviews, setLiveReviews]   = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileId = consultant?.profile_id || consultant?.id || 'mock-raafat-1';

  useEffect(() => {
    if (!profileId) return;
    const fetchBackendData = async () => {
      setProfileLoading(true);
      try {
        if (profileId === 'mock-raafat-1') {
          const mockAvails = [
            { day_of_week: 6, start_time: '11:00:00', end_time: '16:00:00', is_active: true },
            { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
            { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_active: true }
          ];
          setLiveProfile({ ...consultant, availabilities: mockAvails });
          const defaultServices = [
            { id: 'srv-1', name: 'جلسة فيديو 30 دقيقة',    price: 42.50, duration_minutes: 30 },
            { id: 'srv-2', name: 'جلسة محادثة ساعة واحدة', price: 55.00, duration_minutes: 60 },
            { id: 'srv-3', name: 'تقرير مكتوب',             price: 120.0, duration_minutes: 120 }
          ];
          setLiveServices(defaultServices);
          setSelectedServiceId(defaultServices[0].id);
          setLiveReviews([
            { id: 'rev-1', reviewer_name: 'رانيا الخطيب', stars: 5, comment: 'شرح واضح ومباشر.', created_at: '2026-08-07' },
            { id: 'rev-2', reviewer_name: 'عمر حداد',     stars: 5, comment: 'استشارة عملية ومهنية.', created_at: '2026-08-05' },
          ]);
          return;
        }

        const profData = await consultantService.getConsultantProfile(profileId, token).catch(() => null);
        if (profData) setLiveProfile(profData);

        const srvData = await consultantService.getConsultantServices(profileId, token).catch(() => []);
        if (Array.isArray(srvData) && srvData.length > 0) {
          setLiveServices(srvData); setSelectedServiceId(srvData[0].id);
        } else if (profData?.services?.length > 0) {
          setLiveServices(profData.services); setSelectedServiceId(profData.services[0].id);
        }

        const startDate = new Date().toISOString().split('T')[0];
        const endDate   = new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0];
        const slotsData = await consultantService.getAvailableSlots(profileId, startDate, endDate, 30, token).catch(() => []);
        if (Array.isArray(slotsData)) setLiveSlots(slotsData);

        const ratingsData = await consultantService.getConsultantRatings(profileId, token).catch(() => []);
        if (Array.isArray(ratingsData)) setLiveReviews(ratingsData);

      } catch (e) { console.error('Error loading consultant profile:', e); }
      finally { setProfileLoading(false); }
    };
    fetchBackendData();
  }, [profileId, consultant, token]);

  const triggerWidgetGlow = useCallback(() => {
    setActiveTab('availability');
    const sidebarContainer = document.querySelector('.left-sidebar-stack');
    if (sidebarContainer) sidebarContainer.scrollTo({ top: 0, behavior: 'smooth' });
    const widget = document.getElementById('booking-widget-section');
    if (widget) {
      widget.classList.remove('widget-pulse'); void widget.offsetWidth;
      widget.classList.add('widget-pulse');
      setTimeout(() => widget.classList.remove('widget-pulse'), 1500);
    }
  }, []);

  useEffect(() => {
    if (scrollToBookingOnMount) {
      const t = setTimeout(() => triggerWidgetGlow(), 200);
      return () => clearTimeout(t);
    }
  }, [scrollToBookingOnMount, triggerWidgetGlow]);

  if (!consultant) return null;

  const activeProfile = liveProfile || consultant;
  const days          = getDaysForWeek(weekOffset, activeProfile.availabilities, activeProfile.working_days);
  const currentDayObj = days[selectedDayIdx] || days[0];

  const name = activeProfile.full_name || activeProfile.name || 'مستشار';
  const init = name.slice(0, 2);

  const basePriceVal = (activeProfile.price_per_hour !== undefined && activeProfile.price_per_hour !== null)
    ? Math.round(Number(activeProfile.price_per_hour))
    : (liveServices.length > 0 ? Math.round(Number(liveServices[0].price)) : 30);

  const displayServices = [
    { id: 'dur-30-min', name: 'جلسة استشارة 30 دقيقة',    duration_minutes: 30, price: Math.round(basePriceVal * 0.5) || 15 },
    { id: 'dur-60-min', name: 'جلسة محادثة ساعة واحدة', duration_minutes: 60, price: basePriceVal || 30 }
  ];
  const selectedService = displayServices.find(s => s.id === selectedServiceId) || displayServices[0];

  const hasRatingVal    = activeProfile.average_rating !== null && activeProfile.average_rating !== undefined && Number(activeProfile.average_rating) > 0;
  const ratingVal       = hasRatingVal ? parseFloat(activeProfile.average_rating) : 0.0;
  const ratingFormatted = hasRatingVal ? ratingVal.toFixed(1) : 'جديد';
  const totalReviewsCount = liveReviews.length > 0 ? liveReviews.length : (activeProfile.ratings_count ?? 0);
  const getStarPct = (n) => {
    if (liveReviews.length === 0) return n === 5 ? (totalReviewsCount > 0 ? 86 : 0) : (n === 4 ? (totalReviewsCount > 0 ? 14 : 0) : 0);
    return Math.round(liveReviews.filter(r => Math.round(r.stars) === n).length / liveReviews.length * 100);
  };

  const sessionsCount  = activeProfile.sessions_count ?? activeProfile.completed_sessions_count ?? 182;
  const years          = activeProfile.years_of_experience ?? 8;
  const minServicePrice = basePriceVal;
  const city           = activeProfile.city || 'عمّان، الأردن';
  const bio            = activeProfile.bio  || 'خبير ومستشار ضريبي بخبرة تزيد عن 20 سنة في الاستشارات الضريبية.';
  const activityType   = activeProfile.activity_type || 'مستشار مستقل';
  const certificates   = activeProfile.certificates_licenses || 'بكالوريوس محاسبة - مستشار ضريبي معتمد';
  const isVerified     = activeProfile.verification_status === 'approved' || activeProfile.is_verified === true;
  const tier           = activeProfile.tier || 'مستشار VIP معتمد';

  const buildSlotsFromAvailability = () => {
    const pythonDow = (new Date(currentDayObj.isoDate + 'T12:00:00').getDay() + 6) % 7;
    if (!Array.isArray(activeProfile?.availabilities)) return null;
    const avails = activeProfile.availabilities.filter(a => a && a.day_of_week === pythonDow && a.is_active !== false);
    if (avails.length === 0) return [];
    const slotDuration = parseInt(selectedService?.duration_minutes || 30, 10);
    const slots = [];
    for (const av of avails) {
      const [startH, startM] = (av.start_time || '09:00').split(':').map(Number);
      let endH, endM;
      if (av.end_time) {
        const [pH, pM] = String(av.end_time).split(':').map(Number);
        if (pH * 60 + pM <= startH * 60 + startM) { endH = startH + 1; endM = startM; }
        else { endH = pH; endM = pM; }
      } else { endH = startH + 1; endM = startM; }
      let cur = startH * 60 + startM;
      const winEnd = endH * 60 + endM;
      while (cur + slotDuration <= winEnd) {
        const hh = Math.floor(cur / 60), mm = cur % 60;
        slots.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
        cur += 30;
      }
    }
    return [...new Set(slots)].sort();
  };

  const freeSlotsForDate = Array.isArray(liveSlots)
    ? liveSlots.filter(s => s?.start_time && String(s.start_time).split('T')[0] === currentDayObj.isoDate)
    : null;
  const freeTimeStrings = freeSlotsForDate !== null
    ? new Set(freeSlotsForDate.map(s => String(s.start_time).split('T')[1]?.substring(0,5)))
    : null;
  const computedSlots = buildSlotsFromAvailability();
  const rawTimeslots  = computedSlots !== null ? computedSlots
    : (Array.isArray(activeProfile?.availabilities) && activeProfile.availabilities.length === 0
      ? [] : ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']);
  const timeslots = freeTimeStrings !== null ? rawTimeslots.filter(t => freeTimeStrings.has(t)) : rawTimeslots;

  const handleProceedToBookingRequest = () => {
    try {
      const timeToUse   = selectedTime || (timeslots.length > 0 ? timeslots[0] : '10:00');
      const dayObj      = currentDayObj || { fullDate: 'اليوم', isoDate: new Date().toISOString().split('T')[0] };
      const serviceTitle = `${selectedService?.name || 'جلسة فيديو'} - ${dayObj.fullDate} الساعة ${timeToUse}`;
      const [hh, mm]    = timeToUse.split(':').map(Number);
      const localDt     = new Date(`${dayObj.isoDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`);
      if (typeof onBookRequest === 'function') {
        onBookRequest({
          consultantName: name, serviceName: serviceTitle,
          price: selectedService?.price || 42.50,
          consultant_id: profileId, service_id: selectedService?.id,
          scheduled_at: localDt.toISOString()
        });
      }
    } catch (err) { console.error('Error booking:', err); }
  };

  const scrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    const element   = document.getElementById(sectionId);
    const container = document.querySelector('.profile-main-column');
    if (element && container) container.scrollTo({ top: element.offsetTop - container.offsetTop, behavior: 'smooth' });
  };

  const toggleFaq = idx => setOpenFaqs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  const handleSendQuestion = () => {
    if (!questionText.trim()) return;
    setQuestionSent(true);
    setTimeout(() => { setQuestionSent(false); setQuestionText(''); }, 3500);
  };

  return (
    <div className="profile-spa-view">
      <div className="profile-spa-topbar">
        <span style={{ fontWeight: '800', color: '#0B2E4B', fontSize: '15px' }}>
          ملف المستشار {profileLoading && '(جاري التحميل...)'}
        </span>
        <button className="profile-spa-back-btn" onClick={onClose}>← العودة إلى المستشارين</button>
      </div>

      {/* Profile Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-cover-bg" />
        <div className="profile-main-info">
          <div className="profile-avatar-box">
            {activeProfile.profile_image_url || activeProfile.img
              ? <img src={activeProfile.profile_image_url || activeProfile.img} alt={name} />
              : init}
          </div>
          <div className="profile-details-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0B2E4B' }}>{name}</h1>
              {isVerified && <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '800' }}>✔ موثق</span>}
            </div>
            <div className="profile-tagline-text">{bio}</div>
            <div style={{ margin: '8px 0' }}><span className="cp-tier">✔ {tier}</span></div>
            <div className="profile-meta-row">
              <span>📍 {city}</span><span>•</span>
              <span style={{ color: '#16A36D', fontWeight: '700' }}>● يرد عادةً خلال ساعة</span>
            </div>
            <div className="profile-meta-row" style={{ marginTop: '10px', fontSize: '13px', color: '#0B2E4B' }}>
              <span style={{ fontWeight: '800', color: '#F59A23' }}>{ratingFormatted} ⭐⭐⭐⭐⭐</span>
              <span>•</span><span><b>{totalReviewsCount}</b> تقييم</span>
              <span>•</span><span><b>{sessionsCount}</b> جلسة مكتملة</span>
              <span>•</span><span><b>{years}</b> سنة خبرة</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span className="cp-chip active">{activeProfile.specialization_name || 'ضريبة المبيعات'}</span>
              <span className="cp-chip active">ضريبة الدخل</span>
            </div>
          </div>
          <div className="profile-price-action">
            <div style={{ fontSize: '11px', color: '#64748B' }}>ابتداءً من</div>
            <div className="profile-price-val">{minServicePrice} <span style={{ fontSize: '13px', fontWeight: '800' }}>د.أ / ساعة</span></div>
            <button className="profile-book-now-btn" onClick={triggerWidgetGlow}>احجز جلسة</button>
          </div>
        </div>
        <div className="profile-nav-tabs">
          <button className={activeTab==='about'        ?'active':''} onClick={()=>scrollToSection('sec-about','about')}>نبذة</button>
          <button className={activeTab==='experience'   ?'active':''} onClick={()=>scrollToSection('sec-experience','experience')}>الخبرة</button>
          <button className={activeTab==='services'     ?'active':''} onClick={()=>scrollToSection('sec-services','services')}>الخدمات ({displayServices.length})</button>
          <button className={activeTab==='reviews'      ?'active':''} onClick={()=>scrollToSection('sec-reviews','reviews')}>التقييمات ({totalReviewsCount})</button>
          <button className={activeTab==='availability' ?'active':''} onClick={triggerWidgetGlow}>التوفر والتقويم</button>
          <button className={activeTab==='pricing'      ?'active':''} onClick={()=>scrollToSection('sec-pricing','pricing')}>الأسعار</button>
          <button className={activeTab==='faq'          ?'active':''} onClick={()=>scrollToSection('sec-faq','faq')}>الأسئلة الشائعة</button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="profile-grid-layout">
        <div className="profile-main-column">

          {/* نبذة */}
          <div id="sec-about" className="profile-section-card">
            <h2>نبذة</h2><p>{bio}</p>
            <div className="profile-stats-grid">
              <div className="profile-stat-box"><small>أسلوب الاستشارة</small><b>عملي ومباشر</b></div>
              <div className="profile-stat-box"><small>الأنشطة</small><b>{activityType}</b></div>
              <div className="profile-stat-box"><small>الخبرة</small><b>{years} سنة</b></div>
            </div>
          </div>

          {/* الخبرة */}
          <div id="sec-experience" className="profile-section-card">
            <h2>الخبرة والمؤهلات</h2>
            <div style={{ borderRight: '3px solid #F59A23', paddingRight: '14px', margin: '14px 0' }}>
              <h4 style={{ margin: '0 0 4px', color: '#0B2E4B', fontSize: '14px' }}>مستشار ضرائب أول — {activeProfile.specialization_name || 'ضريبة الدخل والمبيعات'}</h4>
              <p style={{ fontSize: '12px', color: '#64748B' }}>{activityType}</p>
            </div>
            <p style={{ marginTop: '14px' }}>{certificates}</p>
            <div className="profile-stats-grid" style={{ marginTop: '16px' }}>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}>
                <small>الهوية موثقة</small>
                <b style={{ color: isVerified ? '#166534' : '#64748B', fontSize: '13px' }}>{isVerified ? '✔ تم اعتمادها' : 'قيد المراجعة'}</b>
              </div>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}><small>الشهادات المهنية</small><b style={{ color: '#0B2E4B', fontSize: '13px' }}>JCPA • دورات ضريبية</b></div>
              <div className="profile-stat-box" style={{ background: '#FFF9F0', borderColor: '#FDE68A' }}><small>التراخيص</small><b style={{ color: '#0B2E4B', fontSize: '13px' }}>سارية ومعتمدة</b></div>
            </div>
          </div>

          {/* الخدمات */}
          <div id="sec-services" className="profile-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2>الخدمات والمجالات</h2>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>اضغط على أي خدمة لتحديدها</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayServices.map(s => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div key={s.id} onClick={() => { setSelectedServiceId(s.id); setSelectedDuration(String(s.duration_minutes)); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isSelected ? '#FFF9F0' : '#F8FAFC', padding: '16px 20px', borderRadius: '16px',
                      border: isSelected ? '2px solid #F59A23' : '1px solid #E2E8F0', cursor: 'pointer', transition: 'all .18s' }}>
                    <div>
                      <b style={{ color: '#0B2E4B', fontSize: '15px' }}>{s.name}</b>
                      <small style={{ display: 'block', color: '#64748B', marginTop: '4px' }}>⏱ {s.duration_minutes} دقيقة</small>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <b style={{ color: '#F59A23', fontSize: '18px', fontWeight: '900', display: 'block' }}>{s.price} د.أ</b>
                      <span style={{ fontSize: '11px', color: isSelected ? '#F59A23' : '#0B2E4B', fontWeight: '800' }}>
                        {isSelected ? '✓ ممررة للتقويم' : 'حدد هذه الخدمة ←'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ color: '#166534', fontWeight: '700', background: '#F0FDF4', padding: '12px 16px', borderRadius: '12px', marginTop: '18px', border: '1px solid #BBF7D0' }}>
              👍 موصى به من {totalReviewsCount > 0 ? totalReviewsCount : sessionsCount || 10} عميلاً بناءً على استشارات موثقة.
            </p>
          </div>

          {/* التقييمات */}
          <div id="sec-reviews" className="profile-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, border: 'none', padding: 0 }}>التقييمات ({totalReviewsCount})</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0,1fr)', gap: '24px', alignItems: 'center', marginBottom: '28px', direction: 'rtl' }}>
              <div style={{ background: '#F1F5F9', borderRadius: '20px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: '900', color: '#0B2E4B', lineHeight: '1' }}>{ratingFormatted}</div>
                <div style={{ color: '#F59A23', fontSize: '16px', margin: '8px 0 4px' }}>⭐⭐⭐⭐⭐</div>
                <div style={{ color: '#64748B', fontSize: '12px' }}>{totalReviewsCount} تقييم</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[5,4,3,2,1].map(n => {
                  const pct = getStarPct(n);
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                      <span style={{ width: '36px', textAlign: 'right', color: '#64748B', fontSize: '12px' }}>{pct}%</span>
                      <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', direction: 'ltr' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F59A23', borderRadius: '4px', float: 'right' }} />
                      </div>
                      <span style={{ width: '28px' }}>{n}★</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {liveReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {liveReviews.map((r, i) => {
                  const rName = r.reviewer_name || 'عميل موثق';
                  return (
                    <div key={r.id || i} className="cp-review-box">
                      <div className="cp-review-top">
                        <div className="cp-reviewer-info">
                          <div className="cp-reviewer-avatar">{rName.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                          <div><div className="cp-reviewer-name">{rName}</div><div className="cp-reviewer-tag">حجز موثّق</div></div>
                        </div>
                        <div className="cp-review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG',{day:'numeric',month:'long',year:'numeric'}) : ''}</div>
                      </div>
                      <div className="cp-review-stars">{'⭐'.repeat(r.stars||5)}</div>
                      <p className="cp-review-body">{r.comment}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '30px', borderRadius: '16px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                <b style={{ color: '#0B2E4B' }}>لا توجد تقييمات بعد</b>
              </div>
            )}
          </div>

          {/* التوفر */}
          <div id="sec-availability" className="profile-section-card">
            <h2>التوفر الأسبوعي</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
              {days.map((d, i) => (
                <div key={d.num+i} onClick={() => { if(d.avail){setSelectedDayIdx(i);setSelectedTime(null);} }}
                  style={{ background: d.avail ? (selectedDayIdx===i?'#FFF9F0':'#F0FDF4') : '#F8FAFC',
                    border: `1px solid ${d.avail?(selectedDayIdx===i?'#F59A23':'#BBF7D0'):'#E2E8F0'}`,
                    padding: '14px 18px', borderRadius: '14px', cursor: d.avail?'pointer':'default', transition: 'all .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#0B2E4B', fontSize: '14px' }}>{d.label} {d.num} {d.month}</b>
                    {d.avail && selectedDayIdx===i && <span style={{ fontSize: '11px', color: '#F59A23', fontWeight: '800' }}>محدد ✓</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: d.avail?'#166534':'#94A3B8', margin: '6px 0 0', fontWeight: '700' }}>{d.timeRange}</p>
                </div>
              ))}
            </div>
          </div>

          {/* الأسعار */}
          <div id="sec-pricing" className="profile-section-card">
            <h2>الأسعار والخدمات المتاحة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(displayServices.length,3)},1fr)`, gap: '16px', margin: '20px 0 16px', direction: 'rtl' }}>
              {displayServices.map(s => (
                <div key={s.id} style={{ background: '#F1F5F9', borderRadius: '16px', padding: '22px 16px', textAlign: 'center' }}>
                  <small style={{ color: '#64748B', fontSize: '11px', display: 'block', marginBottom: '8px' }}>{s.name}</small>
                  <b style={{ fontSize: '22px', color: '#0B2E4B', fontWeight: '900' }}>{s.price} <span style={{ fontSize: '13px' }}>د.أ / {s.duration_minutes} دقيقة</span></b>
                </div>
              ))}
            </div>
          </div>

          {/* الأسئلة الشائعة */}
          <div id="sec-faq" className="profile-section-card">
            <h2>الأسئلة الشائعة</h2>
            {[
              { q: 'كيف تتم الاستشارة؟', a: 'تبدأ الاستشارة بتحديد السؤال أو المشكلة الضريبية، ثم مراجعة المعلومات وتقديم الرأي المهني والخطوات العملية.' },
              { q: 'كيف أحجز استشارة؟', a: 'اختر نوع الخدمة، المدة، اليوم والوقت المناسب، ثم تابع إلى تأكيد الحجز والدفع.' },
              { q: 'ماذا لو احتجت لإعادة جدولة الجلسة؟', a: 'يمكن إعادة الجدولة وفق سياسة الحجز والإلغاء المعتمدة في المنصة.' },
              { q: 'كيف يتم الدفع؟', a: 'يتم الدفع عبر وسائل الدفع المتاحة في المنصة قبل تأكيد الخدمة.' }
            ].map((faq, idx, arr) => {
              const isOpen = openFaqs.includes(idx);
              return (
                <div key={idx} style={{ padding: '18px 0', borderBottom: idx<arr.length-1?'1px solid #F1F5F9':'none' }}>
                  <div onClick={() => toggleFaq(idx)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0B2E4B' }}>{faq.q}</h4>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#F59A23', userSelect: 'none' }}>{isOpen?'−':'+'}</span>
                  </div>
                  {isOpen && <p style={{ margin: '10px 0 0', color: '#64748B', fontSize: '13.5px', lineHeight: '1.7' }}>{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Sidebar */}
        <div className="left-sidebar-stack">
          {/* Booking Widget */}
          <div id="booking-widget-section" className="booking-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <small style={{ color: '#64748B', fontSize: '11px', fontWeight: '700' }}>حجز جلسة</small>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0B2E4B', margin: '2px 0 0' }}>{getWeekTitle(weekOffset)}</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{onClick:()=>{setWeekOffset(w=>w+1);setSelectedTime(null);},label:'‹',title:'الأسبوع القادم',disabled:false},
                  {onClick:()=>{setWeekOffset(w=>Math.max(0,w-1));setSelectedTime(null);},label:'›',title:'الأسبوع السابق',disabled:weekOffset===0}
                ].map((btn,i) => (
                  <button key={i} onClick={btn.onClick} disabled={btn.disabled} title={btn.title}
                    style={{ border:'1px solid #CBD5E1',borderRadius:'50%',width:'30px',height:'30px',background:btn.disabled?'#F1F5F9':'#fff',cursor:btn.disabled?'not-allowed':'pointer',fontWeight:'800',color:btn.disabled?'#94A3B8':'#0B2E4B',opacity:btn.disabled?0.4:1 }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-durations" style={{ gridTemplateColumns: displayServices.length>1?'1fr 1fr':'1fr' }}>
              {displayServices.map((srv,idx) => {
                const isSel = selectedServiceId===srv.id || (!selectedServiceId&&idx===0);
                return (
                  <div key={srv.id||idx} className={`booking-dur-item ${isSel?'active':''}`}
                    onClick={()=>{setSelectedServiceId(srv.id);setSelectedDuration(String(srv.duration_minutes));}}>
                    <span style={{ fontSize:'14px' }}>⏱</span>
                    <div><small style={{ display:'block',color:'#64748B',fontSize:'10px' }}>{srv.name}</small><b>{srv.duration_minutes} دقيقة</b></div>
                    <small>{srv.price} د.أ</small>
                  </div>
                );
              })}
            </div>

            <div className="booking-days-row">
              {days.map((d, i) => (
                <button key={d.num+i}
                  className={`booking-day-btn ${selectedDayIdx===i?'active':d.avail?'available':''}`}
                  onClick={()=>{setSelectedDayIdx(i);setSelectedTime(null);}}>
                  <div>{d.label}</div><b style={{ fontSize:'13px' }}>{d.num}</b>
                </button>
              ))}
            </div>

            <div style={{ fontSize:'13px',color:'#0B2E4B',fontWeight:'800',marginTop:'12px',textAlign:'center' }}>
              {currentDayObj.fullDate}
              <small style={{ display:'block',color:currentDayObj.avail?'#166534':'#EF4444',fontSize:'11px',marginTop:'2px' }}>
                {currentDayObj.timeRange}
              </small>
            </div>

            {!currentDayObj.avail ? (
              <div style={{ border:'1px dashed #CBD5E1',background:'#F8FAFC',borderRadius:'16px',padding:'24px 16px',textAlign:'center',color:'#64748B',fontSize:'14px',fontWeight:'700',marginTop:'14px' }}>
                لا توجد مواعيد متاحة في هذا اليوم.
              </div>
            ) : timeslots.length === 0 ? (
              <div style={{ border:'1px dashed #FCA5A5',background:'#FEF2F2',borderRadius:'16px',padding:'24px 16px',textAlign:'center',color:'#991B1B',fontSize:'13px',fontWeight:'700',marginTop:'14px' }}>
                جميع المواعيد المتاحة محجوزة.
              </div>
            ) : (
              <div className="booking-slots-grid">
                {timeslots.map(t => (
                  <button key={t} className={`booking-slot-btn ${selectedTime===t?'active':''}`} onClick={()=>setSelectedTime(t)}>{t}</button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button onClick={handleProceedToBookingRequest}
                style={{ width:'100%',background:'#F59A23',color:'#fff',border:'none',borderRadius:'25px',padding:'12px',fontWeight:'800',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 14px rgba(245,154,35,0.35)' }}>
                إرسال طلب الحجز ←
              </button>
              <button onClick={handleProceedToBookingRequest}
                style={{ width:'100%',background:'#fff',color:'#0B2E4B',border:'1px solid #0B2E4B',borderRadius:'30px',padding:'12px',fontWeight:'800',fontSize:'12.5px',cursor:'pointer',fontFamily:'inherit',marginTop:'10px' }}>
                إرسال طلب الحجز • {selectedService?.price||42.50} د.أ
              </button>
              <p style={{ fontSize:'11px',color:'#64748B',textAlign:'center',margin:'10px 0 0' }}>✓ إلغاء مجاني حتى 24 ساعة قبل الجلسة</p>
            </div>
          </div>

          {/* Quick Overview */}
          <div className="booking-widget-card">
            <h3 style={{ fontSize:'15px',fontWeight:'800',color:'#64748B',marginBottom:'14px' }}>نظرة سريعة</h3>
            {[['وقت الاستجابة','عادةً خلال ساعة'],['الجلسات المكتملة',sessionsCount],['عضو منذ','2024'],['الخبرة',`${years} سنة`],['رسوم الجلسات',`${minServicePrice} د.أ`],['الحجز','فوري']].map(([k,v],i)=>(
              <div key={i} className="quick-overview-row">
                <span className="quick-overview-label">{k}</span>
                <span className="quick-overview-val" style={k==='الحجز'?{color:'#166534'}:{}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Ask Question */}
          <div className="ask-question-card">
            <h3 style={{ margin:0,fontSize:'15px',fontWeight:'800',color:'#fff' }}>لست متأكداً بعد؟</h3>
            <p style={{ fontSize:'11.5px',color:'#94A3B8',margin:'4px 0 0' }}>يرد عادةً خلال ساعة في أيام العمل.</p>
            {questionSent ? (
              <div style={{ background:'rgba(22,163,109,0.2)',border:'1px solid #16A36D',color:'#6EE7B7',padding:'10px 14px',borderRadius:'14px',fontSize:'12px',fontWeight:'700',marginTop:'12px' }}>✅ تم إرسال سؤالك بنجاح!</div>
            ) : (
              <div className="ask-question-input-wrap">
                <input placeholder="اكتب سؤالك للمستشار..." value={questionText} onChange={e=>setQuestionText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSendQuestion();}} />
                <button className="ask-question-btn" onClick={handleSendQuestion}>إرسال</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

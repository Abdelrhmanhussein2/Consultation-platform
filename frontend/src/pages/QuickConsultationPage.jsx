import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { appointmentService } from '../services/appointmentService';
import '../components/QuickConsultation/QuickConsultationWizard.css';

// Custom Icons matching system
const SoundIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function QuickConsultationPage({ navigate }) {
  const { token } = useAuth();
  
  // Wizard flow states
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step selection data
  const [sessionType, setSessionType] = useState('video_call'); // 'audio_call', 'video_call', 'chat'
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [duration, setDuration] = useState(30); // 30, 45, 60, 90 minutes
  const [customDuration, setCustomDuration] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  // UI Modals
  const [activeModalConsultant, setActiveModalConsultant] = useState(null);

  // Calendar states
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Arabic Months Jordanian Context
  const arabicMonths = [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
  ];

  // 1. Fetch specializations
  useEffect(() => {
    async function loadSpecs() {
      try {
        const data = await consultantService.getSpecializations();
        if (Array.isArray(data)) {
          setSpecializations(data);
        }
      } catch (err) {
        console.error('Failed to load specializations:', err);
      }
    }
    loadSpecs();
  }, []);

  // 2. Fetch consultants when step 3 is reached
  useEffect(() => {
    if (currentStep === 3 && selectedSpec) {
      async function loadConsultants() {
        setLoading(true);
        setError('');
        try {
          const data = await consultantService.getConsultants({
            specialization_id: selectedSpec.id
          }, token);
          if (Array.isArray(data)) {
            setConsultants(data);
          } else {
            setConsultants([]);
          }
        } catch (err) {
          setError('فشل تحميل قائمة المستشارين. يرجى المحاولة مرة أخرى.');
          setConsultants([]);
        } finally {
          setLoading(false);
        }
      }
      loadConsultants();
    }
  }, [currentStep, selectedSpec, token]);

  // 3. Fetch slots when date or duration changes
  useEffect(() => {
    if (currentStep === 6 && selectedConsultant && selectedDate) {
      async function loadSlots() {
        setLoading(true);
        setError('');
        setSelectedSlot(null);
        try {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          
          const actualDuration = customDuration ? parseInt(customDuration, 10) : duration;
          const data = await consultantService.getAvailableSlots(
            selectedConsultant.profile_id || selectedConsultant.id,
            formattedDate,
            formattedDate,
            actualDuration,
            token
          );
          if (Array.isArray(data)) {
            setSlots(data);
          } else {
            setSlots([]);
          }
        } catch (err) {
          setError('حدث خطأ أثناء تحميل الأوقات المتاحة.');
          setSlots([]);
        } finally {
          setLoading(false);
        }
      }
      loadSlots();
    }
  }, [currentStep, selectedConsultant, selectedDate, duration, customDuration, token]);

  // Calculate pricing
  const getCalculatedPrice = () => {
    if (!selectedConsultant) return 0;
    const actualDuration = customDuration ? parseInt(customDuration, 10) : duration;
    const rate = parseFloat(selectedConsultant.price_per_hour) || 0;
    return ((actualDuration / 60) * rate).toFixed(2);
  };

  // Helper: check if we can proceed in current step
  const canProceed = () => {
    if (currentStep === 1) return !!sessionType;
    if (currentStep === 2) return !!selectedSpec;
    if (currentStep === 3) return !!selectedConsultant;
    if (currentStep === 4) return (duration > 0 || (customDuration && parseInt(customDuration, 10) > 0));
    if (currentStep === 5) return !!selectedDate;
    if (currentStep === 6) return !!selectedSlot;
    return true;
  };

  // Helper: next step navigation
  const handleNext = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  // Helper: prev step navigation
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit booking
  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const actualDuration = customDuration ? parseInt(customDuration, 10) : duration;
      const data = {
        consultant_id: selectedConsultant.profile_id || selectedConsultant.id,
        scheduled_at: selectedSlot.start_time,
        duration_minutes: actualDuration,
        session_type: sessionType,
        notes: notes || 'استشارة سريعة مستعجلة'
      };
      
      await appointmentService.bookAppointment(data, token);
      
      // Clear wizard status and navigate to my appointments
      setCurrentStep(8);
    } catch (err) {
      setError(err.message || 'فشل إرسال طلب الحجز. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  // Custom Monthly Calendar generation logic
  const renderMonthlyCalendar = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Sat index mapping: Saturday starts week (index 0)
    const satStartIndex = (firstDayIndex + 1) % 7;
    
    const dayCells = [];
    // 1. Render empty cells before the first day of the month
    for (let i = 0; i < satStartIndex; i++) {
      dayCells.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Render actual day cells
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const dateObj = new Date(currentYear, currentMonth, dNum);
      const isPast = dateObj < today;
      
      // Map JS day (0=Sunday, 1=Monday ... 6=Saturday) to backend day_of_week (0=Monday ... 6=Sunday)
      const jsDay = dateObj.getDay();
      const beDay = jsDay === 0 ? 6 : jsDay - 1;

      // Filter by consultant's working days
      const isWorkingDay = selectedConsultant?.working_days
        ? selectedConsultant.working_days.includes(beDay)
        : true;

      const isDisabled = isPast || !isWorkingDay;
      const isSelected = selectedDate && selectedDate.getDate() === dNum && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;

      dayCells.push(
        <button
          key={`day-${dNum}`}
          type="button"
          disabled={isDisabled}
          className={`calendar-day-cell ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(dateObj)}
        >
          {dNum}
        </button>
      );
    }

    return dayCells;
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div className="quick-consultation-container">
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
          حجز استشارة سريعة
        </h1>
        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
          احجز جلستك الفورية في خطوات بسيطة وسيقوم المستشار بالرد وتأكيد الجلسة في أقرب وقت.
        </p>
      </div>

      <div className="wizard-card">
        {/* Step progress indicators */}
        {currentStep <= 7 && (
          <div className="wizard-progress-bar">
            <div 
              className="wizard-progress-line" 
              style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
            ></div>
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <div 
                key={num} 
                className={`wizard-step-node ${num === currentStep ? 'active' : ''} ${num < currentStep ? 'completed' : ''}`}
              >
                {num}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', fontWeight: '700' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Session Type */}
        {currentStep === 1 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              كيف تود التواصل مع المستشار؟
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              اختر طريقة إجراء الجلسة المفضلة لديك:
            </p>
            <div className="grid-cards">
              <div 
                className={`option-card ${sessionType === 'video_call' ? 'selected' : ''}`}
                onClick={() => setSessionType('video_call')}
              >
                <div style={{ color: '#005d9c', marginBottom: '4px' }}>
                  <VideoIcon />
                </div>
                <span className="option-card-title">مكالمة فيديو</span>
                <span className="option-card-desc">مقابلة مرئية وصوتية تفاعلية مباشرة مع مستشار المنصة</span>
              </div>

              <div 
                className={`option-card ${sessionType === 'audio_call' ? 'selected' : ''}`}
                onClick={() => setSessionType('audio_call')}
              >
                <div style={{ color: '#005d9c', marginBottom: '4px' }}>
                  <SoundIcon />
                </div>
                <span className="option-card-title">مكالمة صوتية</span>
                <span className="option-card-desc">اتصال صوتي فقط للاستماع والمناقشة السريعة</span>
              </div>

              <div 
                className={`option-card ${sessionType === 'chat' ? 'selected' : ''}`}
                onClick={() => setSessionType('chat')}
              >
                <div style={{ color: '#005d9c', marginBottom: '4px' }}>
                  <ChatIcon />
                </div>
                <span className="option-card-title">محادثة نصية</span>
                <span className="option-card-desc">غرفة دردشة فورية مع إمكانية إرفاق الملفات والمستندات</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Specialization */}
        {currentStep === 2 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              ما هو مجال الاستشارة المطلوبة؟
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              اختر تخصص الموضوع أو المشكلة التي ترغب في حلها:
            </p>
            <div className="grid-cards">
              {specializations.map(spec => (
                <div 
                  key={spec.id}
                  className={`option-card ${selectedSpec?.id === spec.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSpec(spec)}
                  style={{ minHeight: '120px' }}
                >
                  <span className="option-card-title" style={{ fontSize: '15px' }}>{spec.name}</span>
                  <span className="option-card-desc">{spec.description || 'استشارات متخصصة'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Consultant */}
        {currentStep === 3 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              اختر المستشار المتاح للاستشارة السريعة
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px 0' }}>
              هؤلاء المستشارين معتمدون من إدارة المنصة وجاهزون للرد المباشر:
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="spinner"></div>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '12px' }}>جاري تحميل المستشارين المتاحين...</p>
              </div>
            ) : consultants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {consultants.map(c => (
                  <div 
                    key={c.profile_id || c.id}
                    className={`consultant-item-card ${selectedConsultant?.profile_id === c.profile_id ? 'selected' : ''}`}
                    onClick={() => setSelectedConsultant(c)}
                  >
                    <div className="consultant-avatar-placeholder">
                      {c.full_name ? c.full_name[0] : 'م'}
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1E293B', fontWeight: '700' }}>{c.full_name}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.bio}</p>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', fontWeight: '700', color: '#005d9c' }}>
                          <span>⭐ {c.average_rating} ({c.ratings_count || 0} تقييم)</span>
                          <span>⏱️ {c.price_per_hour || 0} د.أ / ساعة</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalConsultant(c);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#005d9c',
                            fontSize: '11px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: '#f1f5f9',
                            marginTop: '10px',
                            display: 'inline-block',
                            transition: 'all 0.15s'
                          }}
                        >
                          عرض الملف الشخصي للمستشار
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', border: '1px dashed #cbd5e1', borderRadius: '16px' }}>
                لا يوجد مستشارين تابعين للموقع متاحين لهذا التخصص حالياً. يرجى تجربة تخصص آخر.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Duration */}
        {currentStep === 4 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              ما هي مدة الجلسة المطلوبة?
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 24px 0' }}>
              سيتم احتساب التكلفة النهائية بناءً على المدة المحددة:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[30, 45, 60, 90].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDuration(m);
                    setCustomDuration('');
                  }}
                  style={{
                    padding: '16px 8px',
                    borderRadius: '16px',
                    border: (duration === m && !customDuration) ? '2px solid #005d9c' : '1px solid #cbd5e1',
                    background: (duration === m && !customDuration) ? '#e5eff5' : '#ffffff',
                    color: (duration === m && !customDuration) ? '#005d9c' : '#475569',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {m} دقيقة
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                أو أدخل مدة أخرى بالدقائق:
              </label>
              <input
                type="number"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setDuration(0);
                }}
                placeholder="مثال: 50"
                min="10"
                max="360"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Day Selector (Monthly Calendar Grid) */}
        {currentStep === 5 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              اختر اليوم المناسب للاستشارة
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px 0' }}>
              انقر على أي من الأيام المفعلة (الملونة والمناسبة لجدول عمل المستشار {selectedConsultant?.full_name}):
            </p>

            <div className="monthly-calendar">
              <div className="calendar-month-header">
                <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth}>&lt;</button>
                <span className="calendar-month-title">
                  {arabicMonths[currentMonth]} {currentYear}
                </span>
                <button type="button" className="calendar-nav-btn" onClick={handleNextMonth}>&gt;</button>
              </div>

              {/* Saturday is start of week in Arabic context */}
              <div className="calendar-weekdays">
                <div>السبت</div>
                <div>الأحد</div>
                <div>الإثنين</div>
                <div>الثلاثاء</div>
                <div>الأربعاء</div>
                <div>الخميس</div>
                <div>الجمعة</div>
              </div>

              <div className="calendar-days-grid">
                {renderMonthlyCalendar()}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Time Slot */}
        {currentStep === 6 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              اختر الوقت المتاح للجلسة
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px 0' }}>
              الأوقات المتاحة لهذا اليوم حسب جدول عمل المستشار وجلساته الحالية:
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="spinner"></div>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '12px' }}>جاري جلب أوقات العمل الشاغرة...</p>
              </div>
            ) : slots.length > 0 ? (
              <div className="slots-grid">
                {slots.map((s, idx) => {
                  const startTime = new Date(s.start_time);
                  const endTime = new Date(s.end_time);
                  const formatTime = (d) => d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const timeString = `${formatTime(startTime)} - ${formatTime(endTime)}`;
                  const isSelected = selectedSlot && selectedSlot.start_time === s.start_time;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`slot-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(s)}
                    >
                      {timeString}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', border: '1px dashed #cbd5e1', borderRadius: '16px' }}>
                لا توجد مواعيد متاحة للمستشار في هذا اليوم. يرجى اختيار يوم آخر.
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Confirm Booking */}
        {currentStep === 7 && (
          <div className="wizard-step-content">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0d3c5c', margin: '0 0 8px 0' }}>
              تأكيد طلب حجز الاستشارة
            </h3>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 24px 0' }}>
              يرجى مراجعة تفاصيل الاستشارة والأسعار قبل إرسال الطلب:
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>المستشار المختار:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{selectedConsultant?.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>مجال التخصص:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{selectedSpec?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>نوع الجلسة:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>
                  {sessionType === 'video_call' && 'فيديو'}
                  {sessionType === 'audio_call' && 'صوتية'}
                  {sessionType === 'chat' && 'دردشة نصية'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>التاريخ والوقت:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>
                  {selectedDate?.toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} في تمام الساعة {new Date(selectedSlot?.start_time).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>مدة الجلسة:</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{customDuration || duration} دقيقة</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                <span style={{ color: '#1E293B', fontSize: '14px', fontWeight: '800' }}>التكلفة المتوقعة:</span>
                <span style={{ fontWeight: '900', color: '#005d9c', fontSize: '18px' }}>{getCalculatedPrice()} د.أ</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                ملاحظات أو أسئلة ترغب في طرحها على المستشار (اختياري):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب تفاصيل الاستشارة لتساعد المستشار في الاستعداد..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 8: Success screen */}
        {currentStep === 8 && (
          <div className="wizard-step-content" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: '64px', height: '64px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', margin: '0 auto 20px auto', justifyContent: 'center' }}>
              <span style={{ fontSize: '32px', color: '#16A34A' }}>✓</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: '0 0 8px 0' }}>
              تم إرسال طلب الحجز بنجاح
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 28px 0', lineHeight: '1.6' }}>
              لقد تم إرسال طلب الحجز الخاص بك إلى المستشار <strong>{selectedConsultant?.full_name}</strong> بانتظار موافقته لتفعيل الفاتورة ومتابعة عملية الدفع.
            </p>
            <button
              type="button"
              onClick={() => navigate('/my-appointments')}
              className="wizard-btn-next"
              style={{ width: '100%' }}
            >
              الذهاب إلى استشاراتي ومواعيدي
            </button>
          </div>
        )}

        {/* Wizard Actions (Steps 1 to 7) */}
        {currentStep <= 7 && (
          <div className="wizard-footer">
            {currentStep > 1 ? (
              <button 
                type="button" 
                className="wizard-btn-prev" 
                onClick={handlePrev}
                disabled={loading}
              >
                السابق
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 7 ? (
              <button 
                type="button" 
                className="wizard-btn-next" 
                onClick={handleNext}
                disabled={!canProceed() || loading}
              >
                التالي
              </button>
            ) : (
              <button 
                type="button" 
                className="wizard-btn-next" 
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? 'جاري إرسال الطلب...' : 'تأكيد وحفظ الطلب'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Glassmorphic Consultant Profile Modal */}
      {activeModalConsultant && (
        <div className="profile-modal-overlay" onClick={() => setActiveModalConsultant(null)}>
          <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActiveModalConsultant(null)}
              style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700'
              }}
            >
              ✕
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e5eff5', color: '#005d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700' }}>
                  {activeModalConsultant.full_name ? activeModalConsultant.full_name[0] : 'م'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1E293B', fontWeight: '800' }}>
                    {activeModalConsultant.full_name}
                  </h4>
                  <span style={{ fontSize: '13px', color: '#F5A52A', fontWeight: '700' }}>
                    {activeModalConsultant.specialization_name || 'مستشار ضريبي معتمد'}
                  </span>
                </div>
              </div>

              <div>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569', fontWeight: '700' }}>النبذة المهنية</h5>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  {activeModalConsultant.bio || 'لا يوجد نبذة مهنية متوفرة.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>سنوات الخبرة:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{activeModalConsultant.years_of_experience || 'غير محدد'} سنة</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>سعر ساعة الاستشارة:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#005d9c' }}>{activeModalConsultant.price_per_hour || '0'} د.أ</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>الشهادات والاعتمادات:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{activeModalConsultant.certificates_licenses || 'غير متوفرة'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '2px' }}>تقييم العملاء:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#F5A52A' }}>⭐ {activeModalConsultant.average_rating} ({activeModalConsultant.ratings_count || 0} تقييم)</span>
                </div>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569', fontWeight: '700' }}>أيام العمل المتاحة لدى المستشار:</h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'].map((dayName, idx) => {
                    // Monday is index 0 in backend, Sunday is index 6.
                    const isAvailable = activeModalConsultant.working_days?.includes(idx);
                    return (
                      <span 
                        key={idx}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: isAvailable ? '#E5EFF5' : '#F1F5F9',
                          color: isAvailable ? '#005d9c' : '#94a3b8',
                          border: isAvailable ? '1px solid #BAE6FD' : '1px solid #e2e8f0'
                        }}
                      >
                        {dayName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

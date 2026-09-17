import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function jsDayToBackend(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

const TIME_OPTIONS = [];
for (let h = 8; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
}

function CustomDropdown({ value, options, onChange, placeholder, width = '100%' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);
  const listRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => (typeof opt === 'object' ? opt.value === value : opt === value));
    if (!found) return placeholder || value;
    return typeof found === 'object' ? found.label : found;
  }, [value, options, placeholder]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width, userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        style={{
          width: '100%',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          border: isOpen ? '1.5px solid #005D9C' : '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '0 12px',
          fontSize: '13.5px',
          fontWeight: '700',
          color: '#0A3254',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(0,93,156,0.1)' : 'none',
          transition: 'all 0.15s ease',
          fontFamily: "'Tajawal', sans-serif"
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0A3254"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span style={{ fontFamily: "'Tajawal', sans-serif" }}>{selectedLabel}</span>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            left: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -4px rgba(10,50,84,0.15)',
            zIndex: 150,
            padding: '4px',
            scrollbarWidth: 'thin'
          }}
        >
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSel = optVal === value;
            return (
              <div
                key={idx}
                data-selected={isSel}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isSel ? '800' : '600',
                  color: '#0A3254',
                  backgroundColor: isSel ? '#F1F5F9' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'background 0.12s ease',
                  fontFamily: "'Tajawal', sans-serif"
                }}
                onMouseEnter={(e) => {
                  if (!isSel) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isSel) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConsultantSchedulePage() {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const today = new Date();

  // Default to August 2026 matching screenshots
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7); // 7 is August (0-indexed)
  const [selectedDay, setSelectedDay] = useState(null); // null if not yet selected

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPeriods, setCurrentPeriods] = useState([]);

  const [dateSchedule, setDateSchedule] = useState({});
  const [weeklyFallback, setWeeklyFallback] = useState({});

  const [showLastMonthBanner, setShowLastMonthBanner] = useState(false);
  const [lastMonthSchedule, setLastMonthSchedule] = useState(null);
  const [isCopyingSaving, setIsCopyingSaving] = useState(false);
  const LAST_SCHEDULE_KEY = 'consultant_last_month_schedule';
  const LAST_SCHEDULE_MONTH_KEY = 'consultant_last_schedule_saved_month';

  const isoDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const selectedDateStr = useMemo(
    () => (selectedDay ? isoDate(selectedYear, selectedMonth, selectedDay) : null),
    [selectedYear, selectedMonth, selectedDay]
  );

  const selectedBackendDow = useMemo(
    () => (selectedDay ? jsDayToBackend(new Date(selectedYear, selectedMonth, selectedDay).getDay()) : null),
    [selectedYear, selectedMonth, selectedDay]
  );

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    consultantService
      .getAvailabilities(token)
      .then((data) => {
        if (data && Array.isArray(data)) {
          const dateMap = {};
          const weeklyMap = {};
          data.forEach((av) => {
            const slot = {
              start: (av.start_time || '09:00').slice(0, 5),
              end: (av.end_time || '17:00').slice(0, 5)
            };
            if (av.specific_date) {
              const key = av.specific_date;
              if (!dateMap[key]) dateMap[key] = [];
              dateMap[key].push(slot);
            } else {
              const dow = av.day_of_week;
              if (!weeklyMap[dow]) weeklyMap[dow] = [];
              weeklyMap[dow].push(slot);
            }
          });
          setDateSchedule(dateMap);
          setWeeklyFallback(weeklyMap);

          const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
          const lastSavedMonthKey = localStorage.getItem(LAST_SCHEDULE_MONTH_KEY);
          const savedScheduleRaw = localStorage.getItem(LAST_SCHEDULE_KEY);
          const isStartOfMonth = today.getDate() <= 7;
          const isNewMonth = lastSavedMonthKey && lastSavedMonthKey !== currentMonthKey;
          if (isStartOfMonth && isNewMonth && savedScheduleRaw) {
            try {
              const saved = JSON.parse(savedScheduleRaw);
              const hasSavedSlots = Object.values(saved).some((s) => Array.isArray(s) && s.length > 0);
              if (hasSavedSlots) {
                setLastMonthSchedule(saved);
                setShowLastMonthBanner(true);
              }
            } catch (e) {
              /* ignore */
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth]
  );

  const totalCalendarCells = useMemo(() => {
    return Math.ceil(daysInMonth / 7) * 7;
  }, [daysInMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((p) => p - 1);
    } else {
      setSelectedMonth((p) => p - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((p) => p + 1);
    } else {
      setSelectedMonth((p) => p + 1);
    }
    setSelectedDay(null);
  };

  const syncDateSchedule = useCallback((dateStr, periods) => {
    setDateSchedule((prev) => ({ ...prev, [dateStr]: periods }));
  }, []);

  const handleSelectDay = (dayNum) => {
    setSelectedDay(dayNum);
    const dateKey = isoDate(selectedYear, selectedMonth, dayNum);
    const existing = dateSchedule[dateKey];
    if (existing && existing.length > 0) {
      setCurrentPeriods([...existing]);
    } else {
      // Default draft period: 09:00 - 12:00 shown in editor, but NOT saved yet
      setCurrentPeriods([{ start: '09:00', end: '12:00' }]);
    }
  };

  const handleAddPeriod = () => {
    let np = { start: '14:00', end: '17:00' };
    if (currentPeriods.length >= 2) {
      const lastEnd = currentPeriods[currentPeriods.length - 1].end || '17:00';
      const eh = parseInt(lastEnd.split(':')[0], 10);
      np = {
        start: `${String(Math.min(eh + 1, 22)).padStart(2, '0')}:00`,
        end: `${String(Math.min(eh + 3, 23)).padStart(2, '0')}:00`
      };
    }
    setCurrentPeriods([...currentPeriods, np]);
  };

  const handleUpdatePeriod = (idx, field, val) => {
    setCurrentPeriods(currentPeriods.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  };

  const summaryCalc = useMemo(() => {
    let mins = 0;
    const ranges = [];
    currentPeriods.forEach((p) => {
      if (p.start && p.end) {
        const [sh, sm] = p.start.split(':').map(Number);
        const [eh, em] = p.end.split(':').map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff > 0) {
          mins += diff;
          ranges.push(`${p.end} - ${p.start}`);
        }
      }
    });
    const hours = Math.round((mins / 60) * 10) / 10;
    return { ranges, totalHours: hours };
  }, [currentPeriods]);

  const handleSaveChanges = async () => {
    if (!token) {
      showToast('يجب تسجيل الدخول أولاً', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const updatedDateSchedule = {
        ...dateSchedule,
        ...(selectedDateStr ? { [selectedDateStr]: currentPeriods } : {})
      };

      const payload = [];
      Object.entries(updatedDateSchedule).forEach(([dateStr, periods]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const dow = jsDayToBackend(d.getDay());
        periods.forEach((p) => {
          if (p.start && p.end) {
            payload.push({
              day_of_week: dow,
              specific_date: dateStr,
              start_time: p.start,
              end_time: p.end
            });
          }
        });
      });
      await consultantService.setAvailability(payload, token);
      setDateSchedule(updatedDateSchedule);
      const currentMonthKey = `${selectedYear}-${selectedMonth}`;
      localStorage.setItem(LAST_SCHEDULE_KEY, JSON.stringify(updatedDateSchedule));
      localStorage.setItem(LAST_SCHEDULE_MONTH_KEY, currentMonthKey);
      showToast('تم حفظ التغييرات بنجاح ✓', 'success');
    } catch (err) {
      showToast(err?.detail ? `خطأ: ${err.detail}` : 'حدث خطأ أثناء الحفظ، حاول مرة أخرى', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!selectedDay || !selectedDateStr) return;
    setCurrentPeriods([]);
    setDateSchedule((prev) => ({ ...prev, [selectedDateStr]: [] }));
    if (selectedBackendDow !== null) {
      setWeeklyFallback((prev) => ({ ...prev, [selectedBackendDow]: [] }));
    }
    setSelectedDay(null);

    if (!token) {
      showToast('تم مسح المواعيد محلياً', 'info');
      return;
    }

    try {
      const payload = [];
      Object.entries({ ...dateSchedule, [selectedDateStr]: [] }).forEach(([dateStr, periods]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const dow = jsDayToBackend(d.getDay());
        (periods || []).forEach((p) => {
          if (p.start && p.end) {
            payload.push({ day_of_week: dow, specific_date: dateStr, start_time: p.start, end_time: p.end });
          }
        });
      });
      await consultantService.setAvailability(payload, token);
      showToast('تم مسح المواعيد وحفظ التغييرات ✓', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ المسح، حاول مرة أخرى', 'error');
    }
  };

  const handleApplyLastMonthSchedule = async () => {
    if (!lastMonthSchedule || !token) return;
    setIsCopyingSaving(true);
    try {
      const payload = [];
      Object.entries(lastMonthSchedule).forEach(([dow, periods]) => {
        (periods || []).forEach((p) => {
          if (p.start && p.end) {
            payload.push({ day_of_week: parseInt(dow, 10), start_time: p.start, end_time: p.end });
          }
        });
      });
      await consultantService.setAvailability(payload, token);
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
      localStorage.setItem(LAST_SCHEDULE_KEY, JSON.stringify(lastMonthSchedule));
      localStorage.setItem(LAST_SCHEDULE_MONTH_KEY, currentMonthKey);
      setShowLastMonthBanner(false);
      showToast('تم تطبيق مواعيد الشهر الماضي بنجاح ✓', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تطبيق المواعيد، حاول مرة أخرى', 'error');
    } finally {
      setIsCopyingSaving(false);
    }
  };

  const hasScheduledSlots = (dayNum) => {
    const dateKey = isoDate(selectedYear, selectedMonth, dayNum);
    return Array.isArray(dateSchedule[dateKey]) && dateSchedule[dateKey].length > 0;
  };

  const prevMonthName = ARABIC_MONTHS[today.getMonth() === 0 ? 11 : today.getMonth() - 1];

  return (
    <div
      style={{
        padding: '32px 20px 60px',
        maxWidth: '980px',
        margin: '0 auto',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        color: '#1E293B'
      }}
    >
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ─── LAST MONTH SCHEDULE MODAL ─── */}
      {showLastMonthBanner && lastMonthSchedule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,50,84,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px 32px 28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(10,50,84,0.22)',
              textAlign: 'center',
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <span style={{ fontSize: '28px' }}>📅</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
              تطبيق مواعيد {prevMonthName}؟
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#64748B', lineHeight: '1.7', fontFamily: "'Tajawal', sans-serif" }}>
              لديك جدول مواعيد محفوظ من شهر <strong style={{ color: '#1E40AF' }}>{prevMonthName}</strong>.
              <br />هل تريد تطبيق نفس الأوقات على الشهر الحالي؟
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={isCopyingSaving}
                onClick={() => setShowLastMonthBanner(false)}
                style={{
                  flex: 1,
                  background: '#F8FAFC',
                  color: '#64748B',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                ✗ لا، شكراً
              </button>
              <button
                type="button"
                disabled={isCopyingSaving}
                onClick={handleApplyLastMonthSchedule}
                style={{
                  flex: 1,
                  background: isCopyingSaving ? '#93C5FD' : '#0A3254',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: isCopyingSaving ? 'not-allowed' : 'pointer',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                {isCopyingSaving ? '⏳ جاري التطبيق...' : '✓ تطبيق المواعيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAGE HEADER ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Calendar with clock icon in orange */}
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M16 2V6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 2V6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 10H21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15.5" cy="15.5" r="3.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M15.5 14V15.5L16.5 16.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0A3254', margin: 0, fontFamily: "'Tajawal', sans-serif" }}>
            جدولة المواعيد
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', marginBottom: 0, fontFamily: "'Tajawal', sans-serif" }}>
          وقتك بيدك – تحكّم بتوفرك، ونظّم مواعيدك بالطريقة التي تناسبك.
        </p>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', fontSize: '14px', fontFamily: "'Tajawal', sans-serif" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#0A3254', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
          <br />جاري تحميل جدول المواعيد...
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '28px', alignItems: 'start' }}>

          {/* ─── COLUMN 1 (Right in RTL): Calendar Card ─── */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #E2E8F0',
              padding: '28px 28px 22px',
              boxShadow: '0 4px 20px rgba(10,50,84,0.03)'
            }}
          >
            {/* Header: Month & Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px'
              }}
            >
              {/* Left: Nav Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="الشهر السابق"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="الشهر القادم"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  {'>'}
                </button>
              </div>

              {/* Right: Month Title + Navy Calendar Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#0A3254',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  {ARABIC_MONTHS[selectedMonth]} {selectedYear}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0A3254"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>

            {/* Days of Week Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                textAlign: 'center',
                marginBottom: '14px',
                direction: 'ltr'
              }}
            >
              {['السبت', 'الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الإثنين', 'الأحد'].map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#0A3254',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                direction: 'ltr'
              }}
            >
              {Array.from({ length: totalCalendarCells }).map((_, i) => {
                const dayNum = i + 1;
                if (dayNum > daysInMonth) {
                  return (
                    <div
                      key={`empty-${i}`}
                      style={{
                        height: '48px',
                        borderRadius: '11px',
                        backgroundColor: '#F4F8FA'
                      }}
                    />
                  );
                }

                const isSel = selectedDay === dayNum;
                const hasSlots = hasScheduledSlots(dayNum);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    style={{
                      height: '48px',
                      borderRadius: '11px',
                      border: isSel ? '1.5px solid #93C5FD' : 'none',
                      backgroundColor: isSel ? '#EFF6FF' : '#F4F8FA',
                      color: '#0A3254',
                      fontSize: '15px',
                      fontWeight: isSel ? '800' : '700',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.backgroundColor = '#EAEFF2';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.backgroundColor = '#F4F8FA';
                    }}
                  >
                    <span style={{ lineHeight: 1, marginTop: hasSlots ? '-4px' : '0' }}>{dayNum}</span>
                    {hasSlots && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#005D9C',
                          position: 'absolute',
                          bottom: '6px'
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '16px',
                marginTop: '22px',
                paddingTop: '16px',
                fontSize: '12px',
                color: '#64748B',
                fontWeight: '700',
                fontFamily: "'Tajawal', sans-serif",
                direction: 'rtl'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: '#F4F8FA',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', backgroundColor: '#005D9C' }} />
                </span>
                <span>متاح</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    border: '1.5px solid #93C5FD',
                    backgroundColor: '#EFF6FF',
                    display: 'inline-block'
                  }}
                />
                <span>محدّد</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: '#F4F8FA',
                    display: 'inline-block'
                  }}
                />
                <span>غير محدّد</span>
              </div>
            </div>
          </div>

          {/* ─── COLUMN 2 (Left in RTL): Empty State OR Period Editor ─── */}
          {selectedDay === null ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                padding: '36px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '210px'
              }}
            >
              {/* Calendar outline icon */}
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '16px' }}
              >
                <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '15.5px',
                  fontWeight: '800',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                اختر يوماً من التقويم لتحديد فترة التوفر
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#64748B',
                  lineHeight: '1.6',
                  maxWidth: '320px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                ثم حدّد الأوقات المتاحة لهذا اليوم، ويمكنك إضافة أكثر من فترة زمنية حسب توفرك.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '24px 24px 20px',
                boxShadow: '0 4px 20px rgba(10,50,84,0.03)'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'right', marginBottom: '22px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15.5px',
                    fontWeight: '800',
                    color: '#0A3254',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  الفترة الزمنية - {selectedDay} {ARABIC_MONTHS[selectedMonth]}
                </h3>
              </div>

              {/* Periods List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '16px' }}>
                {currentPeriods.map((period, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {/* Right: بداية المواعيد */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: '#0A3254',
                            marginBottom: '8px',
                            textAlign: 'right',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        >
                          بداية المواعيد
                        </label>
                        <CustomDropdown
                          value={period.start}
                          options={TIME_OPTIONS}
                          onChange={(val) => handleUpdatePeriod(idx, 'start', val)}
                        />
                      </div>

                      {/* Left: نهاية المواعيد */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: '#0A3254',
                            marginBottom: '8px',
                            textAlign: 'right',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        >
                          نهاية المواعيد
                        </label>
                        <CustomDropdown
                          value={period.end}
                          options={TIME_OPTIONS}
                          onChange={(val) => handleUpdatePeriod(idx, 'end', val)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* + إضافة فترة (shown when 1 period) */}
              {currentPeriods.length < 2 && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0A3254',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      padding: '4px 0',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    + إضافة فترة
                  </button>
                </div>
              )}

              {/* Summary Pills (shown when 2 or more periods) */}
              {currentPeriods.length >= 2 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'flex-end',
                    marginBottom: '24px'
                  }}
                >
                  {/* Line 1: الفترات المتاحة */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {currentPeriods.map((p, i) => (
                        <React.Fragment key={i}>
                          <span
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '20px',
                              padding: '3px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#0A3254',
                              fontFamily: "'Tajawal', sans-serif"
                            }}
                          >
                            {p.end} - {p.start}
                          </span>
                          {i < currentPeriods.length - 1 && <span style={{ color: '#0A3254', fontWeight: '700' }}>—</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0A3254',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      الفترات المتاحة:
                    </span>
                  </div>

                  {/* Line 2: المواعيد المتاحة */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '20px',
                        padding: '3px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#0A3254',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      {summaryCalc.totalHours} ساعات
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0A3254',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      المواعيد المتاحة:
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {/* Right: حفظ التغييرات */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveChanges}
                  style={{
                    flex: 1.4,
                    backgroundColor: '#0A3254',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    height: '42px',
                    padding: '0 20px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: "'Tajawal', sans-serif",
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#07243D')}
                  onMouseLeave={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#0A3254')}
                >
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </button>

                {/* Left: مسح الكل */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    flex: 0.8,
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    height: '42px',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: "'Tajawal', sans-serif",
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  مسح الكل
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

// Arabic Month Names
const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

// Arabic Days of Week (Starting from Sunday as per standard Arabic calendar)
const ARABIC_DAYS_HEADER = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

// Time Options (every 30 mins from 00:00 to 23:30)
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:30`);
}

// Custom Sleek Dropdown Component
function CustomDropdown({ value, options, onChange, placeholder, width = '100%', minWidth }) {
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
      const selectedEl = listRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => (typeof opt === 'object' ? opt.value === value : opt === value));
    if (!found) return placeholder || value;
    return typeof found === 'object' ? found.label : found;
  }, [value, options, placeholder]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width, minWidth, userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: '42px',
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
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 93, 156, 0.1)' : 'none',
          transition: 'all 0.15s ease',
          fontFamily: "'Tajawal', sans-serif"
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: '#64748B',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '6px'
          }}
        >
          ▼
        </span>
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
            maxHeight: '190px',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -4px rgba(10, 50, 84, 0.15), 0 4px 10px -2px rgba(10, 50, 84, 0.08)',
            zIndex: 150,
            padding: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent'
          }}
        >
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSelected = optVal === value;

            return (
              <div
                key={idx}
                data-selected={isSelected}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? '#005D9C' : '#1E293B',
                  backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'background 0.12s ease',
                  fontFamily: "'Tajawal', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{optLabel}</span>
                {isSelected && <span style={{ color: '#005D9C', fontSize: '12px' }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConsultantSchedulePage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [isSaving, setIsSaving] = useState(false);

  // Storage key for date-specific custom schedules
  const storageKey = `consultant_schedule_slots_${user?.id || 'demo'}`;

  // Schedule mapping: { "YYYY-MM-DD": [ { start: "09:00", end: "12:00" }, ... ] }
  const [scheduleData, setScheduleData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default seed for demo: Day 11 and Day 19 have periods
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const k1 = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-11`;
    const k2 = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-19`;

    return {
      [k1]: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' }
      ],
      [k2]: [
        { start: '10:00', end: '13:00' },
        { start: '15:00', end: '18:00' }
      ]
    };
  });

  // Current selected date key
  const selectedDateKey = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth, selectedDay]);

  // Active periods for the selected date
  const [currentPeriods, setCurrentPeriods] = useState([
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '17:00' }
  ]);

  // Load backend weekly availabilities on mount
  useEffect(() => {
    if (!token) return;
    consultantService.getAvailabilities(token).then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        // Successfully fetched
      }
    }).catch(() => {});
  }, [token]);

  // Sync currentPeriods whenever selectedDateKey changes
  useEffect(() => {
    if (scheduleData && selectedDateKey in scheduleData) {
      setCurrentPeriods(scheduleData[selectedDateKey] || []);
    } else {
      // If date was never configured, default to empty
      setCurrentPeriods([]);
    }
  }, [selectedDateKey, scheduleData]);

  // Days in selected Month calculation
  const { daysInMonth, firstDayOfWeek } = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sunday
    return { daysInMonth: totalDays, firstDayOfWeek: firstDay };
  }, [selectedYear, selectedMonth]);

  // Navigation: Previous Month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  // Navigation: Next Month
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Period management
  const handleAddPeriod = () => {
    let newPeriod = { start: '09:00', end: '12:00' };
    if (currentPeriods.length === 1) {
      newPeriod = { start: '14:00', end: '17:00' };
    } else if (currentPeriods.length >= 2) {
      const last = currentPeriods[currentPeriods.length - 1];
      const endHour = last?.end ? parseInt(last.end.split(':')[0], 10) : 17;
      const nextStart = `${String(Math.min(endHour + 1, 22)).padStart(2, '0')}:00`;
      const nextEnd = `${String(Math.min(endHour + 3, 23)).padStart(2, '0')}:00`;
      newPeriod = { start: nextStart, end: nextEnd };
    }
    const updatedPeriods = [...currentPeriods, newPeriod];
    setCurrentPeriods(updatedPeriods);
    const updatedSchedule = {
      ...scheduleData,
      [selectedDateKey]: updatedPeriods
    };
    setScheduleData(updatedSchedule);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
    } catch {}
  };

  const handleRemovePeriod = (idx) => {
    const updatedPeriods = currentPeriods.filter((_, i) => i !== idx);
    setCurrentPeriods(updatedPeriods);
    const updatedSchedule = {
      ...scheduleData,
      [selectedDateKey]: updatedPeriods
    };
    setScheduleData(updatedSchedule);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
    } catch {}
  };

  const handleUpdatePeriod = (idx, field, value) => {
    const updatedPeriods = currentPeriods.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    );
    setCurrentPeriods(updatedPeriods);
    const updatedSchedule = {
      ...scheduleData,
      [selectedDateKey]: updatedPeriods
    };
    setScheduleData(updatedSchedule);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
    } catch {}
  };

  // Calculate total duration in hours and total appointment slots
  const summaryCalculations = useMemo(() => {
    let totalMinutes = 0;
    const formattedRanges = [];

    currentPeriods.forEach((p) => {
      if (p.start && p.end) {
        const [sh, sm] = p.start.split(':').map(Number);
        const [eh, em] = p.end.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;
        if (endTotal > startTotal) {
          totalMinutes += endTotal - startTotal;
          formattedRanges.push(`${p.start} - ${p.end}`);
        }
      }
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const slotsCount = Math.floor(totalMinutes / 60);

    return {
      rangesText: formattedRanges.length > 0 ? formattedRanges.join(' — ') : 'لا توجد فترات محددة',
      totalHours,
      slotsCount
    };
  }, [currentPeriods]);

  // Save changes to database and local store
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updated = {
        ...scheduleData,
        [selectedDateKey]: currentPeriods
      };
      setScheduleData(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}

      // Save to backend availability if token is present
      if (token) {
        const jsDate = new Date(selectedYear, selectedMonth, selectedDay);
        const jsDay = jsDate.getDay(); // 0 = Sunday
        const dow = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon, 6 = Sun in backend

        const payload = currentPeriods.map((p) => ({
          day_of_week: dow,
          start_time: p.start.length === 5 ? `${p.start}:00` : p.start,
          end_time: p.end.length === 5 ? `${p.end}:00` : p.end,
          is_active: true
        }));

        await consultantService.setAvailability(payload, token).catch(() => {});
      }

      showToast('تم حفظ التغييرات وتحديث جدول المواعيد بنجاح', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ التغييرات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear all periods for the selected day
  const handleClearAll = () => {
    const updated = {
      ...scheduleData,
      [selectedDateKey]: []
    };
    setScheduleData(updated);
    setCurrentPeriods([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    showToast('تم مسح جميع الفترات لليوم المحدد', 'info');
  };

  // Check if a specific day in the active month has scheduled periods (for green dot)
  const hasScheduledSlots = (dayNum) => {
    const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const slots = scheduleData[key];
    return Array.isArray(slots) && slots.length > 0;
  };

  return (
    <div
      style={{
        padding: '28px 20px 60px',
        maxWidth: '920px',
        margin: '0 auto',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        color: '#1E293B'
      }}
    >
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ── 1. Top Header Banner ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Orange Square Icon with inner square */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              border: '2px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#F59E0B',
                borderRadius: '1.5px'
              }}
            />
          </div>

          {/* Page Title */}
          <h1
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#0A3254',
              margin: 0,
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            جدولة المواعيد
          </h1>
        </div>

        <p
          style={{
            fontSize: '13.5px',
            color: '#64748B',
            marginTop: '6px',
            marginBottom: 0,
            lineHeight: 1.5,
            fontFamily: "'Tajawal', sans-serif"
          }}
        >
          وقتك بيدك — تحكم بتوفرك، ونظم مواعيدك بالطريقة التي تناسبك.
        </p>
      </div>

      {/* ── 2. Main Two-Card Layout: RIGHT is Calendar, LEFT is Time Periods ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '22px',
          alignItems: 'start'
        }}
      >
        {/* ── CARD 1 (RIGHT in RTL): Calendar Picker ────────────────── */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(10, 50, 84, 0.04)',
            padding: '24px 28px',
            fontFamily: "'Tajawal', sans-serif"
          }}
        >
          {/* Calendar Header: Month & Year Dropdowns (Right) and Arrows (Left) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}
          >
            {/* Child 1 (RIGHT in RTL): Month and Year Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Month Selector */}
              <CustomDropdown
                value={selectedMonth}
                options={ARABIC_MONTHS.map((m, idx) => ({ value: idx, label: m }))}
                onChange={(val) => setSelectedMonth(val)}
                minWidth="110px"
              />

              {/* Year Selector */}
              <CustomDropdown
                value={selectedYear}
                options={[2024, 2025, 2026, 2027, 2028].map((y) => ({ value: y, label: String(y) }))}
                onChange={(val) => setSelectedYear(val)}
                minWidth="90px"
              />
            </div>

            {/* Child 2 (LEFT in RTL): Prev / Next Arrow Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'ltr' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="الشهر السابق"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0A3254',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="الشهر القادم"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0A3254',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                ›
              </button>
            </div>
          </div>

          {/* Days of Week Header (7 Columns) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              textAlign: 'center',
              marginBottom: '14px'
            }}
          >
            {ARABIC_DAYS_HEADER.map((dayName, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Grid (Days of Month) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}
          >
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '52px' }} />
            ))}

            {/* Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDay === dayNum;
              const hasSlots = hasScheduledSlots(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  style={{
                    height: '52px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #3B82F6' : '1px solid #F1F5F9',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    color: '#0A3254',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <span>{dayNum}</span>

                  {/* Green Dot for Scheduled Days */}
                  {hasSlots && (
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        marginTop: '3px',
                        display: 'block'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend at the bottom-left */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '16px',
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid #F1F5F9',
              fontSize: '11.5px',
              color: '#94A3B8',
              fontWeight: '600'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'inline-block'
                }}
              />
              <span>متاح</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  border: '1.5px solid #3B82F6',
                  backgroundColor: '#EFF6FF',
                  display: 'inline-block'
                }}
              />
              <span>محدد</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  display: 'inline-block'
                }}
              />
              <span>غير محدد</span>
            </div>
          </div>
        </div>

        {/* ── CARD 2 (LEFT in RTL): Time Periods for Selected Date ── */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(10, 50, 84, 0.04)',
            padding: '24px 28px',
            fontFamily: "'Tajawal', sans-serif"
          }}
        >
          {/* Header of Time Periods Card */}
          <div
            style={{
              textAlign: 'right',
              marginBottom: '20px',
              paddingBottom: '12px'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '15.5px',
                fontWeight: '800',
                color: '#0A3254',
                fontFamily: "'Tajawal', sans-serif"
              }}
            >
              الفترة الزمنية - {selectedDay} {ARABIC_MONTHS[selectedMonth]} {selectedYear}
            </h3>
          </div>

          {/* List of Periods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            {currentPeriods.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1',
                  color: '#64748B',
                  fontSize: '13.5px'
                }}
              >
                لا توجد فترات عمل محددة لهذا اليوم. انقر بالأسفل لإضافة فترة.
              </div>
            ) : (
              currentPeriods.map((period, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '16px 18px',
                    position: 'relative'
                  }}
                >
                  {/* Card Header: Title on Right, Delete ✕ on Left */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#0A3254',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      الفترة {idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemovePeriod(idx)}
                      title="حذف هذه الفترة"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#64748B',
                        cursor: 'pointer',
                        fontSize: '17px',
                        padding: '2px 6px',
                        lineHeight: 1,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Two Select Dropdowns: بداية الموعد (Right) / نهاية الموعد (Left) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px'
                    }}
                  >
                    {/* Child 1 (RIGHT in RTL): بداية الموعد */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0A3254',
                          marginBottom: '6px',
                          textAlign: 'right',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        بداية الموعد
                      </label>
                      <CustomDropdown
                        value={period.start}
                        options={TIME_OPTIONS}
                        onChange={(val) => handleUpdatePeriod(idx, 'start', val)}
                      />
                    </div>

                    {/* Child 2 (LEFT in RTL): نهاية الموعد */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0A3254',
                          marginBottom: '6px',
                          textAlign: 'right',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        نهاية الموعد
                      </label>
                      <CustomDropdown
                        value={period.end}
                        options={TIME_OPTIONS}
                        onChange={(val) => handleUpdatePeriod(idx, 'end', val)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Period Button */}
          <button
            type="button"
            onClick={handleAddPeriod}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px dashed #CBD5E1',
              borderRadius: '8px',
              padding: '11px 16px',
              fontSize: '13.5px',
              fontWeight: '700',
              color: '#0A3254',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'all 0.15s ease',
              fontFamily: "'Tajawal', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#0A3254';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            + إضافة فترة زمنية أخرى
          </button>

          {/* Summary Information */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#0A3254',
                marginBottom: '4px',
                fontFamily: "'Tajawal', sans-serif"
              }}
            >
              الفترات المتاحة: {summaryCalculations.rangesText}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748B',
                fontFamily: "'Tajawal', sans-serif"
              }}
            >
              المواعيد المتاحة: {summaryCalculations.totalHours} ساعات — بمعدل ساعة للجلسة
            </div>
          </div>

          {/* Footer Action Buttons: حفظ التغييرات (Right), مسح الكل (Left) */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Child 1 (RIGHT in RTL): حفظ التغييرات */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveChanges}
              style={{
                flex: 1.2,
                backgroundColor: '#0A3254',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: '800',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(10, 50, 84, 0.2)',
                fontFamily: "'Tajawal', sans-serif"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#07243D')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A3254')}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>

            {/* Child 2 (LEFT in RTL): مسح الكل */}
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                color: '#0A3254',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14.5px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center',
                fontFamily: "'Tajawal', sans-serif"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              مسح الكل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

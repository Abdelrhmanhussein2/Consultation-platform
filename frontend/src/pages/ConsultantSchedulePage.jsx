import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ARABIC_DAYS_HEADER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function jsDayToBackend(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:30`);
}

function CustomDropdown({ value, options, onChange, placeholder, width = '100%', minWidth }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);
  const listRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
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
    <div ref={containerRef} style={{ position: 'relative', width, minWidth, userSelect: 'none' }}>
      <button type="button" onClick={() => setIsOpen((p) => !p)} style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', border: isOpen ? '1.5px solid #005D9C' : '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', fontSize: '13.5px', fontWeight: '700', color: '#0A3254', cursor: 'pointer', outline: 'none', boxShadow: isOpen ? '0 0 0 3px rgba(0,93,156,0.1)' : 'none', transition: 'all 0.15s ease', fontFamily: "'Tajawal', sans-serif" }}>
        <span style={{ fontSize: '10px', color: '#64748B', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '6px' }}>▼</span>
        <span style={{ fontFamily: "'Tajawal', sans-serif" }}>{selectedLabel}</span>
      </button>
      {isOpen && (
        <div ref={listRef} style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, left: 0, maxHeight: '190px', overflowY: 'auto', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 10px 25px -4px rgba(10,50,84,0.15)', zIndex: 150, padding: '4px', scrollbarWidth: 'thin' }}>
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSel = optVal === value;
            return (
              <div key={idx} data-selected={isSel} onClick={() => { onChange(optVal); setIsOpen(false); }}
                style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: isSel ? '800' : '600', color: isSel ? '#005D9C' : '#1E293B', backgroundColor: isSel ? '#EFF6FF' : 'transparent', cursor: 'pointer', textAlign: 'right', transition: 'background 0.12s ease', fontFamily: "'Tajawal', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span>{optLabel}</span>
                {isSel && <span style={{ color: '#005D9C', fontSize: '12px' }}>✓</span>}
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
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [currentPeriods, setCurrentPeriods] = useState([]);
  const [showLastMonthBanner, setShowLastMonthBanner] = useState(false);
  const [lastMonthSchedule, setLastMonthSchedule] = useState(null);
  const [isCopyingSaving, setIsCopyingSaving] = useState(false);
  const LAST_SCHEDULE_KEY = 'consultant_last_month_schedule';
  const LAST_SCHEDULE_MONTH_KEY = 'consultant_last_schedule_saved_month';

  // Helper: ISO date string for a given year/month/day
  const isoDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const selectedDateStr = useMemo(
    () => isoDate(selectedYear, selectedMonth, selectedDay),
    [selectedYear, selectedMonth, selectedDay]
  );

  // Schedule keyed by ISO date string (YYYY-MM-DD) for specific dates
  // AND also by 'dow:{N}' for weekly recurring fallbacks loaded from backend
  const [dateSchedule, setDateSchedule] = useState({});   // { 'YYYY-MM-DD': [{start,end},...] }
  const [weeklyFallback, setWeeklyFallback] = useState({}); // { dow: [{start,end},...] } – weekly from backend

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    consultantService.getAvailabilities(token)
      .then((data) => {
        if (data && Array.isArray(data)) {
          const dateMap = {};
          const weeklyMap = {};
          data.forEach((av) => {
            const slot = { start: (av.start_time || '09:00').slice(0, 5), end: (av.end_time || '17:00').slice(0, 5) };
            if (av.specific_date) {
              // Specific date entry
              const key = av.specific_date; // YYYY-MM-DD string from backend
              if (!dateMap[key]) dateMap[key] = [];
              dateMap[key].push(slot);
            } else {
              // Weekly recurring entry
              const dow = av.day_of_week;
              if (!weeklyMap[dow]) weeklyMap[dow] = [];
              weeklyMap[dow].push(slot);
            }
          });
          setDateSchedule(dateMap);
          setWeeklyFallback(weeklyMap);

          // Check last-month banner
          const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
          const lastSavedMonthKey = localStorage.getItem(LAST_SCHEDULE_MONTH_KEY);
          const savedScheduleRaw = localStorage.getItem(LAST_SCHEDULE_KEY);
          const isStartOfMonth = today.getDate() <= 7;
          const isNewMonth = lastSavedMonthKey && lastSavedMonthKey !== currentMonthKey;
          if (isStartOfMonth && isNewMonth && savedScheduleRaw) {
            try {
              const saved = JSON.parse(savedScheduleRaw);
              const hasSavedSlots = Object.values(saved).some(s => Array.isArray(s) && s.length > 0);
              if (hasSavedSlots) { setLastMonthSchedule(saved); setShowLastMonthBanner(true); }
            } catch (e) { /* ignore */ }
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  // Resolve periods for selected date:
  // 1st: check if there's a specific-date override
  // 2nd: fall back to weekly recurring for that day-of-week
  const selectedBackendDow = useMemo(
    () => jsDayToBackend(new Date(selectedYear, selectedMonth, selectedDay).getDay()),
    [selectedYear, selectedMonth, selectedDay]
  );

  useEffect(() => {
    const specific = dateSchedule[selectedDateStr];
    if (specific) {
      setCurrentPeriods([...specific]);
    } else {
      // No specific override — show weekly fallback (read-only hint) or empty
      const weekly = weeklyFallback[selectedBackendDow];
      setCurrentPeriods(weekly ? [...weekly] : []);
    }
  }, [selectedDateStr, dateSchedule, weeklyFallback, selectedBackendDow]);

  const { daysInMonth, firstDayOfWeek } = useMemo(() => ({
    daysInMonth: new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    firstDayOfWeek: new Date(selectedYear, selectedMonth, 1).getDay()
  }), [selectedYear, selectedMonth]);

  const handlePrevMonth = () => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(p => p - 1); } else setSelectedMonth(p => p - 1); };
  const handleNextMonth = () => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(p => p + 1); } else setSelectedMonth(p => p + 1); };

  const syncDateSchedule = useCallback((dateStr, periods) =>
    setDateSchedule(prev => ({ ...prev, [dateStr]: periods })), []);

  const handleAddPeriod = () => {
    let np = { start: '09:00', end: '12:00' };
    if (currentPeriods.length === 1) np = { start: '14:00', end: '17:00' };
    else if (currentPeriods.length >= 2) {
      const eh = parseInt((currentPeriods[currentPeriods.length - 1].end || '17:00').split(':')[0], 10);
      np = { start: `${String(Math.min(eh + 1, 22)).padStart(2, '0')}:00`, end: `${String(Math.min(eh + 3, 23)).padStart(2, '0')}:00` };
    }
    const updated = [...currentPeriods, np];
    setCurrentPeriods(updated);
    syncDateSchedule(selectedDateStr, updated);
  };

  const handleRemovePeriod = (idx) => {
    const u = currentPeriods.filter((_, i) => i !== idx);
    setCurrentPeriods(u);
    syncDateSchedule(selectedDateStr, u);
  };
  const handleUpdatePeriod = (idx, field, val) => {
    const u = currentPeriods.map((p, i) => i === idx ? { ...p, [field]: val } : p);
    setCurrentPeriods(u);
    syncDateSchedule(selectedDateStr, u);
  };

  const summaryCalc = useMemo(() => {
    let mins = 0; const ranges = [];
    currentPeriods.forEach(p => {
      if (p.start && p.end) {
        const [sh, sm] = p.start.split(':').map(Number); const [eh, em] = p.end.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) { mins += diff; ranges.push(`${p.start} - ${p.end}`); }
      }
    });
    return { rangesText: ranges.length > 0 ? ranges.join(' — ') : 'لا توجد فترات محددة', totalHours: Math.round((mins / 60) * 10) / 10 };
  }, [currentPeriods]);

  const handleSaveChanges = async () => {
    if (!token) { showToast('يجب تسجيل الدخول أولاً', 'error'); return; }
    setIsSaving(true);
    try {
      // Build payload: specific-date entries for each date in dateSchedule,
      // keeping weekly fallbacks intact (don't overwrite them)
      const payload = [];
      Object.entries(dateSchedule).forEach(([dateStr, periods]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const dow = jsDayToBackend(d.getDay());
        periods.forEach(p => {
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
      // Persist for last-month copy feature
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
      localStorage.setItem(LAST_SCHEDULE_KEY, JSON.stringify(dateSchedule));
      localStorage.setItem(LAST_SCHEDULE_MONTH_KEY, currentMonthKey);
      showToast('تم حفظ مواعيد هذا اليوم بنجاح ✓', 'success');
    } catch (err) {
      showToast((err && err.detail) ? `خطأ: ${err.detail}` : 'حدث خطأ أثناء الحفظ، حاول مرة أخرى', 'error');
    } finally { setIsSaving(false); }
  };

  const handleApplyLastMonthSchedule = async () => {
    if (!lastMonthSchedule || !token) return;
    setIsCopyingSaving(true);
    try {
      const payload = [];
      Object.entries(lastMonthSchedule).forEach(([dow, periods]) => {
        (periods || []).forEach(p => { if (p.start && p.end) payload.push({ day_of_week: parseInt(dow, 10), start_time: p.start, end_time: p.end }); });
      });
      await consultantService.setAvailability(payload, token);
      setWeeklySchedule(lastMonthSchedule);
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
      localStorage.setItem(LAST_SCHEDULE_KEY, JSON.stringify(lastMonthSchedule));
      localStorage.setItem(LAST_SCHEDULE_MONTH_KEY, currentMonthKey);
      setShowLastMonthBanner(false);
      showToast('تم تطبيق مواعيد الشهر الماضي بنجاح ✓', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تطبيق المواعيد، حاول مرة أخرى', 'error');
    } finally { setIsCopyingSaving(false); }
  };

  const handleClearAll = async () => {
    // Update local state immediately
    setCurrentPeriods([]);
    setDateSchedule(prev => ({ ...prev, [selectedDateStr]: [] }));
    setWeeklyFallback(prev => ({ ...prev, [selectedBackendDow]: [] }));

    if (!token) { showToast('تم المسح محلياً', 'info'); return; }

    // Save immediately to backend so refresh doesn't restore old data
    try {
      // Build payload from dateSchedule WITHOUT the cleared date
      const payload = [];
      Object.entries({ ...dateSchedule, [selectedDateStr]: [] }).forEach(([dateStr, periods]) => {
        const d = new Date(dateStr + 'T12:00:00');
        const dow = jsDayToBackend(d.getDay());
        (periods || []).forEach(p => {
          if (p.start && p.end) {
            payload.push({ day_of_week: dow, specific_date: dateStr, start_time: p.start, end_time: p.end });
          }
        });
      });
      await consultantService.setAvailability(payload, token);
      showToast('تم مسح المواعيد وحفظها ✓', 'success');
    } catch (err) {
      showToast('تم المسح — فشل الحفظ، حاول مرة أخرى', 'error');
    }
  };

  const hasScheduledSlots = (dayNum) => {
    const dateKey = isoDate(selectedYear, selectedMonth, dayNum);
    // Check specific-date override first
    if (dateSchedule[dateKey] && dateSchedule[dateKey].length > 0) return true;
    // Fall back to weekly recurring
    const dow = jsDayToBackend(new Date(selectedYear, selectedMonth, dayNum).getDay());
    return Array.isArray(weeklyFallback[dow]) && weeklyFallback[dow].length > 0;
  };

  const selectedDayName = useMemo(
    () => ARABIC_DAYS_HEADER[new Date(selectedYear, selectedMonth, selectedDay).getDay()],
    [selectedYear, selectedMonth, selectedDay]
  );
  // Whether the selected date has a specific override (vs weekly fallback)
  const hasSpecificOverride = !!dateSchedule[selectedDateStr];
  const prevMonthName = ARABIC_MONTHS[today.getMonth() === 0 ? 11 : today.getMonth() - 1];

  return (
    <div style={{ padding: '28px 20px 60px', maxWidth: '920px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif", direction: 'rtl', color: '#1E293B' }}>
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ─── LAST MONTH SCHEDULE MODAL ─── */}
      {showLastMonthBanner && lastMonthSchedule && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,50,84,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '36px 32px 28px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(10,50,84,0.22)',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            animation: 'fadeInScale 0.22s ease'
          }}>
            <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>

            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
            }}>
              <span style={{ fontSize: '30px' }}>📅</span>
            </div>

            {/* Title */}
            <h2 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
              تطبيق مواعيد {prevMonthName}؟
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: '13.5px', color: '#64748B', lineHeight: '1.7', fontFamily: "'Tajawal', sans-serif" }}>
              لديك جدول مواعيد محفوظ من شهر <strong style={{ color: '#1E40AF' }}>{prevMonthName}</strong>.
              <br />هل تريد تطبيق نفس الأوقات على الشهر الحالي؟
            </p>

            {/* Preview chips */}
            {(() => {
              const slots = Object.entries(lastMonthSchedule)
                .filter(([, periods]) => Array.isArray(periods) && periods.length > 0);
              const dayLabels = ['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'];
              return slots.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
                  {slots.map(([dow, periods]) => (
                    <span key={dow} style={{
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      borderRadius: '20px', padding: '4px 12px',
                      fontSize: '12px', fontWeight: '700', color: '#1D4ED8',
                      fontFamily: "'Tajawal', sans-serif"
                    }}>
                      {dayLabels[parseInt(dow, 10)]} · {periods.map(p => `${p.start}–${p.end}`).join(', ')}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* Reject */}
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
                  padding: '13px 20px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: "'Tajawal', sans-serif",
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
              >
                ✗ لا، شكراً
              </button>

              {/* Approve */}
              <button
                type="button"
                disabled={isCopyingSaving}
                onClick={handleApplyLastMonthSchedule}
                style={{
                  flex: 1,
                  background: isCopyingSaving ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px 20px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: isCopyingSaving ? 'not-allowed' : 'pointer',
                  fontFamily: "'Tajawal', sans-serif",
                  boxShadow: isCopyingSaving ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => !isCopyingSaving && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {isCopyingSaving ? '⏳ جاري التطبيق...' : '✓ موافق — تطبيق المواعيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '5px', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '1.5px' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0A3254', margin: 0, fontFamily: "'Tajawal', sans-serif" }}>جدولة المواعيد</h1>
        </div>
        <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', marginBottom: 0, fontFamily: "'Tajawal', sans-serif" }}>وقتك بيدك — تحكم بتوفرك الأسبوعي، ونظّم مواعيدك بالطريقة التي تناسبك.</p>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', fontSize: '14px', fontFamily: "'Tajawal', sans-serif" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#0A3254', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
          <br />جاري تحميل جدول المواعيد...
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '22px', alignItems: 'start' }}>

          {/* LEFT: Sticky Calendar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(10,50,84,0.04)',
            padding: '24px 28px',
            position: 'sticky',
            top: '20px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CustomDropdown value={selectedMonth} options={ARABIC_MONTHS.map((m, i) => ({ value: i, label: m }))} onChange={setSelectedMonth} minWidth="110px" />
                <CustomDropdown value={selectedYear} options={[2024,2025,2026,2027,2028].map(y => ({ value: y, label: String(y) }))} onChange={setSelectedYear} minWidth="90px" />
              </div>
              <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                {[['‹', handlePrevMonth, 'الشهر السابق'], ['›', handleNextMonth, 'الشهر القادم']].map(([icon, fn, title]) => (
                  <button key={title} type="button" onClick={fn} title={title} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0A3254', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >{icon}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '14px' }}>
              {ARABIC_DAYS_HEADER.map((d, i) => <div key={i} style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={i} style={{ height: '52px' }} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1; const isSel = selectedDay === dayNum; const hasSlots = hasScheduledSlots(dayNum);
                return (
                  <button key={dayNum} type="button" onClick={() => setSelectedDay(dayNum)} style={{ height: '52px', borderRadius: '10px', border: isSel ? '2px solid #3B82F6' : '1px solid #F1F5F9', backgroundColor: isSel ? '#EFF6FF' : '#FFFFFF', color: '#0A3254', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', boxShadow: isSel ? '0 2px 8px rgba(59,130,246,0.15)' : 'none', fontFamily: "'Tajawal', sans-serif" }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                  >
                    <span>{dayNum}</span>
                    {hasSlots && <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '3px', display: 'block' }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', fontSize: '11.5px', color: '#94A3B8', fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} /><span>متاح</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', border: '1.5px solid #3B82F6', backgroundColor: '#EFF6FF', display: 'inline-block' }} /><span>محدد</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', display: 'inline-block' }} /><span>غير محدد</span></div>
            </div>
          </div>

          {/* RIGHT: Scrollable Periods Panel */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(10,50,84,0.04)',
            padding: '24px 28px',
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin'
          }}>
            <div style={{ textAlign: 'right', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                  الفترة الزمنية — {selectedDayName}
                </h3>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                  borderRadius: '20px', fontFamily: "'Tajawal', sans-serif",
                  background: hasSpecificOverride ? '#DCFCE7' : '#FEF3C7',
                  color: hasSpecificOverride ? '#16A34A' : '#D97706',
                  border: hasSpecificOverride ? '1px solid #86EFAC' : '1px solid #FCD34D'
                }}>
                  {hasSpecificOverride ? 'خاص بهذا اليوم' : 'من الجدول الأسبوعي'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {currentPeriods.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '13.5px', fontFamily: "'Tajawal', sans-serif" }}>لا توجد فترات عمل محددة لهذا اليوم. انقر بالأسفل لإضافة فترة.</div>
              ) : currentPeriods.map((period, idx) => (
                <div key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>الفترة {idx + 1}</span>
                    <button type="button" onClick={() => handleRemovePeriod(idx)} title="حذف" style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '17px', padding: '2px 6px', lineHeight: 1 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0A3254', marginBottom: '6px', textAlign: 'right', fontFamily: "'Tajawal', sans-serif" }}>بداية الموعد</label>
                      <CustomDropdown value={period.start} options={TIME_OPTIONS} onChange={val => handleUpdatePeriod(idx, 'start', val)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0A3254', marginBottom: '6px', textAlign: 'right', fontFamily: "'Tajawal', sans-serif" }}>نهاية الموعد</label>
                      <CustomDropdown value={period.end} options={TIME_OPTIONS} onChange={val => handleUpdatePeriod(idx, 'end', val)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddPeriod} style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '11px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0A3254', cursor: 'pointer', marginBottom: '20px', fontFamily: "'Tajawal', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#0A3254'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}>
              + إضافة فترة زمنية أخرى
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A3254', marginBottom: '4px', fontFamily: "'Tajawal', sans-serif" }}>الفترات المتاحة: {summaryCalc.rangesText}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', fontFamily: "'Tajawal', sans-serif" }}>إجمالي التوفر ليوم {selectedDay} {ARABIC_MONTHS[selectedMonth]}: {summaryCalc.totalHours} ساعات</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" disabled={isSaving} onClick={handleSaveChanges}
                style={{ flex: 1.2, backgroundColor: '#0A3254', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14.5px', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(10,50,84,0.2)', fontFamily: "'Tajawal', sans-serif" }}
                onMouseEnter={e => !isSaving && (e.currentTarget.style.backgroundColor = '#07243D')}
                onMouseLeave={e => !isSaving && (e.currentTarget.style.backgroundColor = '#0A3254')}>
                {isSaving ? 'جاري الحفظ...' : `حفظ مواعيد ${selectedDay} ${ARABIC_MONTHS[selectedMonth]}`}
              </button>
              <button type="button" onClick={handleClearAll} style={{ flex: 1, backgroundColor: '#FFFFFF', color: '#0A3254', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 20px', fontSize: '14.5px', fontWeight: '800', cursor: 'pointer', fontFamily: "'Tajawal', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                مسح الكل
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

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

  const selectedBackendDow = useMemo(() => {
    return jsDayToBackend(new Date(selectedYear, selectedMonth, selectedDay).getDay());
  }, [selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    consultantService.getAvailabilities(token)
      .then((data) => {
        if (data && Array.isArray(data)) {
          const schedule = {};
          data.forEach((av) => {
            const dow = av.day_of_week;
            if (!schedule[dow]) schedule[dow] = [];
            schedule[dow].push({ start: (av.start_time || '09:00').slice(0, 5), end: (av.end_time || '17:00').slice(0, 5) });
          });
          setWeeklySchedule(schedule);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    const periods = weeklySchedule[selectedBackendDow] || [];
    setCurrentPeriods(periods.length > 0 ? [...periods] : []);
  }, [selectedBackendDow, weeklySchedule]);

  const { daysInMonth, firstDayOfWeek } = useMemo(() => ({
    daysInMonth: new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    firstDayOfWeek: new Date(selectedYear, selectedMonth, 1).getDay()
  }), [selectedYear, selectedMonth]);

  const handlePrevMonth = () => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(p => p - 1); } else setSelectedMonth(p => p - 1); };
  const handleNextMonth = () => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(p => p + 1); } else setSelectedMonth(p => p + 1); };

  const syncSchedule = useCallback((dow, periods) => setWeeklySchedule(prev => ({ ...prev, [dow]: periods })), []);

  const handleAddPeriod = () => {
    let np = { start: '09:00', end: '12:00' };
    if (currentPeriods.length === 1) np = { start: '14:00', end: '17:00' };
    else if (currentPeriods.length >= 2) {
      const eh = parseInt((currentPeriods[currentPeriods.length - 1].end || '17:00').split(':')[0], 10);
      np = { start: `${String(Math.min(eh + 1, 22)).padStart(2, '0')}:00`, end: `${String(Math.min(eh + 3, 23)).padStart(2, '0')}:00` };
    }
    const updated = [...currentPeriods, np];
    setCurrentPeriods(updated); syncSchedule(selectedBackendDow, updated);
  };

  const handleRemovePeriod = (idx) => { const u = currentPeriods.filter((_, i) => i !== idx); setCurrentPeriods(u); syncSchedule(selectedBackendDow, u); };
  const handleUpdatePeriod = (idx, field, val) => { const u = currentPeriods.map((p, i) => i === idx ? { ...p, [field]: val } : p); setCurrentPeriods(u); syncSchedule(selectedBackendDow, u); };

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
      const payload = [];
      Object.entries(weeklySchedule).forEach(([dow, periods]) => {
        periods.forEach(p => { if (p.start && p.end) payload.push({ day_of_week: parseInt(dow, 10), start_time: p.start, end_time: p.end }); });
      });
      await consultantService.setAvailability(payload, token);
      showToast('تم حفظ جدول المواعيد بنجاح ✓', 'success');
    } catch (err) {
      showToast((err && err.detail) ? `خطأ: ${err.detail}` : 'حدث خطأ أثناء الحفظ، حاول مرة أخرى', 'error');
    } finally { setIsSaving(false); }
  };

  const handleClearAll = () => { setCurrentPeriods([]); syncSchedule(selectedBackendDow, []); showToast('تم مسح جميع الفترات لهذا اليوم', 'info'); };

  const hasScheduledSlots = (dayNum) => { const dow = jsDayToBackend(new Date(selectedYear, selectedMonth, dayNum).getDay()); const slots = weeklySchedule[dow]; return Array.isArray(slots) && slots.length > 0; };

  const selectedDayName = useMemo(() => ARABIC_DAYS_HEADER[new Date(selectedYear, selectedMonth, selectedDay).getDay()], [selectedYear, selectedMonth, selectedDay]);

  return (
    <div style={{ padding: '28px 20px 60px', maxWidth: '920px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif", direction: 'rtl', color: '#1E293B' }}>
      <Toast show={toast.show} message={toast.message} type={toast.type} />

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

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(10,50,84,0.04)', padding: '24px 28px' }}>
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

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(10,50,84,0.04)', padding: '24px 28px' }}>
            <div style={{ textAlign: 'right', marginBottom: '20px', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>الفترة الزمنية — {selectedDayName}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontFamily: "'Tajawal', sans-serif" }}>{selectedDay} {ARABIC_MONTHS[selectedMonth]} {selectedYear} · تُطبَّق على كل {selectedDayName} أسبوعياً</p>
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
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', fontFamily: "'Tajawal', sans-serif" }}>إجمالي التوفر: {summaryCalc.totalHours} ساعات في {selectedDayName}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" disabled={isSaving} onClick={handleSaveChanges} style={{ flex: 1.2, backgroundColor: '#0A3254', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '14.5px', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(10,50,84,0.2)', fontFamily: "'Tajawal', sans-serif" }}
                onMouseEnter={e => !isSaving && (e.currentTarget.style.backgroundColor = '#07243D')} onMouseLeave={e => !isSaving && (e.currentTarget.style.backgroundColor = '#0A3254')}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ الجدول الأسبوعي'}
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

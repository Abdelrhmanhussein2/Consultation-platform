// frontend/src/components/ModernDatePicker/ModernDatePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import './ModernDatePicker.css';

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ARABIC_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function ModernDatePicker({
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  label,
  presets = true,
  format: propFormat,
  placement = 'top',
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  // Detect format: if value or prop is YYYY-MM-DD vs DD/MM/YYYY
  const isIsoFormat = propFormat === 'YYYY-MM-DD' || (value && value.includes('-')) || (!propFormat && placeholder.includes('-'));

  // Calendar View State
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const containerRef = useRef(null);

  // Sync internal state when value prop changes & set initial calendar month/year
  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      if (value.includes('-')) {
        const parts = value.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setViewYear(y);
            setViewMonth(m);
          }
        }
      } else if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m)) {
            setViewYear(y);
            setViewMonth(m);
          }
        } else if (parts.length === 2) {
          const m = parseInt(parts[0], 10) - 1;
          const y = parseInt(parts[1], 10);
          if (!isNaN(y) && !isNaN(m)) {
            setViewYear(y);
            setViewMonth(m);
          }
        }
      } else if (/^\d{4}$/.test(value)) {
        const y = parseInt(value, 10);
        if (!isNaN(y)) setViewYear(y);
      }
    }
  }, [value]);

  // Close calendar popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format manual typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (onChange) onChange(val);
  };

  const formatDateOutput = (y, mIndex, day) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(mIndex + 1).padStart(2, '0');
    if (isIsoFormat) {
      return `${y}-${mStr}-${dStr}`;
    }
    return `${dStr}/${mStr}/${y}`;
  };

  const handleConfirm = () => {
    let val = inputValue ? inputValue.trim() : '';
    if (!val) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      val = isIsoFormat ? `${viewYear}-${mStr}` : `${mStr}/${viewYear}`;
      setInputValue(val);
    }
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  const handleSelectDay = (day) => {
    const dateStr = formatDateOutput(viewYear, viewMonth, day);
    setInputValue(dateStr);
    if (onChange) onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handlePresetSelect = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const dateStr = formatDateOutput(y, m, d);

    setViewYear(y);
    setViewMonth(m);
    setInputValue(dateStr);
    if (onChange) onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) onChange('');
    setIsOpen(false);
  };

  // Generate calendar grid for current viewMonth and viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Parse currently selected day if matching viewMonth and viewYear
  let selectedDay = null;
  if (inputValue) {
    if (inputValue.includes('-')) {
      const parts = inputValue.split('-');
      if (parts.length === 3) {
        const pY = parseInt(parts[0], 10);
        const pM = parseInt(parts[1], 10) - 1;
        const pD = parseInt(parts[2], 10);
        if (pM === viewMonth && pY === viewYear) {
          selectedDay = pD;
        }
      }
    } else if (inputValue.includes('/')) {
      const parts = inputValue.split('/');
      if (parts.length === 3) {
        const pD = parseInt(parts[0], 10);
        const pM = parseInt(parts[1], 10) - 1;
        const pY = parseInt(parts[2], 10);
        if (pM === viewMonth && pY === viewYear) {
          selectedDay = pD;
        }
      }
    }
  }

  return (
    <div className="modern-date-picker-wrap" ref={containerRef}>
      {label && <label className="modern-date-label">{label}</label>}

      <div className={`modern-date-input-box ${isOpen ? 'active-focus' : ''}`}>
        <input
          type="text"
          className="modern-date-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleConfirm();
            }
          }}
        />
        
        <button
          type="button"
          className="modern-date-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="افتح التقويم"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {/* Calendar Dropdown Popup */}
      {isOpen && (
        <div
          className={`modern-date-popup fade-in placement-${placement} align-${align}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleConfirm();
            }
          }}
        >
          {/* Header Month/Year Selector */}
          <div className="calendar-header-row">
            <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} title="الشهر السابق">
              ‹
            </button>

            <div className="cal-title-box">
              <select
                className="cal-month-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                title="اختر الشهر"
              >
                {ARABIC_MONTHS.map((mName, mIdx) => (
                  <option key={mIdx} value={mIdx}>{mName}</option>
                ))}
              </select>

              <select
                className="cal-year-select"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                title="اختر السنة"
              >
                {Array.from({ length: 60 }, (_, i) => 1970 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button type="button" className="cal-nav-btn" onClick={handleNextMonth} title="الشهر التالي">
              ›
            </button>
          </div>

          {presets && (
            <div className="calendar-presets-row">
              <button
                type="button"
                className="cal-confirm-btn"
                onClick={handleConfirm}
                title="تأكيد وحفظ التاريخ (Enter)"
              >
                موافق ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  const mStr = String(viewMonth + 1).padStart(2, '0');
                  const val = isIsoFormat ? `${viewYear}-${mStr}` : `${mStr}/${viewYear}`;
                  setInputValue(val);
                  if (onChange) onChange(val);
                  setIsOpen(false);
                }}
                title="اختيار هذا الشهر والسنة فقط"
              >
                {ARABIC_MONTHS[viewMonth]} {viewYear}
              </button>
              <button type="button" onClick={() => handlePresetSelect(new Date())}>اليوم</button>
              <button type="button" onClick={() => {
                const val = String(viewYear);
                setInputValue(val);
                if (onChange) onChange(val);
                setIsOpen(false);
              }}>سنة {viewYear}</button>
              <button type="button" className="clear" onClick={handleClear}>مسح</button>
            </div>
          )}

          {/* Days of Week Header */}
          <div className="calendar-days-head">
            {ARABIC_DAYS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid - All 28-31 days completely rendered */}
          <div className="calendar-grid">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <span key={`empty-${i}`} className="cal-day empty" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDay === dayNum;
              const isToday =
                now.getDate() === dayNum &&
                now.getMonth() === viewMonth &&
                now.getFullYear() === viewYear;

              return (
                <button
                  key={dayNum}
                  type="button"
                  className={`cal-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleSelectDay(dayNum)}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

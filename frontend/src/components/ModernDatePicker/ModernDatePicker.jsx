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
  placeholder = 'DD/MM/YYYY',
  label,
  presets = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  // Calendar View State
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
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

  // Format manual typing as DD/MM/YYYY
  const handleInputChange = (e) => {
    let val = e.target.value.replace(/[^\d/]/g, '');

    // Auto add slashes
    if (val.length === 2 && !val.includes('/')) {
      val = val + '/';
    } else if (val.length === 5 && val.split('/').length === 2) {
      val = val + '/';
    }

    if (val.length > 10) val = val.slice(0, 10);

    setInputValue(val);
    if (onChange) onChange(val);
  };

  const handleSelectDay = (day) => {
    const d = String(day).padStart(2, '0');
    const m = String(viewMonth + 1).padStart(2, '0');
    const y = viewYear;
    const dateStr = `${d}/${m}/${y}`;

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

  const handlePresetSelect = (presetYear, presetMonth = 0, presetDay = 1) => {
    const d = String(presetDay).padStart(2, '0');
    const m = String(presetMonth + 1).padStart(2, '0');
    const y = presetYear;
    const dateStr = `${d}/${m}/${y}`;

    setViewYear(presetYear);
    setViewMonth(presetMonth);
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
  if (inputValue && inputValue.length === 10) {
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
        <div className="modern-date-popup fade-in">
          {/* Header Month/Year Selector */}
          <div className="calendar-header-row">
            <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} title="الشهر السابق">
              ‹
            </button>

            <div className="cal-title-box">
              <span className="cal-month-name">{ARABIC_MONTHS[viewMonth]}</span>
              <select
                className="cal-year-select"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
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

          {/* Quick Presets Bar */}
          {presets && (
            <div className="calendar-presets-row">
              <button type="button" onClick={() => handlePresetSelect(now.getFullYear(), now.getMonth(), now.getDate())}>اليوم</button>
              <button type="button" onClick={() => handlePresetSelect(2024, 0, 1)}>2024</button>
              <button type="button" onClick={() => handlePresetSelect(2020, 0, 1)}>2020</button>
              <button type="button" onClick={() => handlePresetSelect(2014, 11, 31)}>2014</button>
              <button type="button" className="clear" onClick={handleClear}>مسح</button>
            </div>
          )}

          {/* Days of Week Header */}
          <div className="calendar-days-head">
            {ARABIC_DAYS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
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

import React, { useState, useRef, useEffect } from 'react';
import './CurvedDatePicker.css';

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function CurvedDatePicker({ value = '', onChange, placeholder = 'YYYY-MM-DD' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parseDate = (str) => {
    if (!str) return null;
    if (str.includes('-')) {
      const [y, m, d] = str.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    } else if (str.includes('/')) {
      const [d, m, y] = str.split('/').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return null;
  };

  const parsed = parseDate(value) || new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    const d = parseDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDate = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoStr = `${viewYear}-${mm}-${dd}`;
    if (onChange) onChange(isoStr);
    setIsOpen(false);
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setViewYear(y);
    setViewMonth(today.getMonth());
    if (onChange) onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
    setIsOpen(false);
  };

  const selectedDateObj = parseDate(value);
  const isSelected = (day) => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getDate() === day &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getFullYear() === viewYear
    );
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className="curved-dp-container" ref={containerRef}>
      <div
        className={`curved-dp-input ${isOpen ? 'focused' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="curved-dp-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className="curved-dp-value">
          {value || <span className="curved-dp-placeholder">{placeholder}</span>}
        </span>
      </div>

      {isOpen && (
        <div className="curved-dp-popup" onClick={(e) => e.stopPropagation()}>
          <div className="curved-dp-header">
            <button type="button" className="curved-dp-arrow" onClick={handlePrevMonth} title="الشهر السابق">
              ‹
            </button>
            <div className="curved-dp-title">
              <span>{MONTH_NAMES_AR[viewMonth]}</span>
              <span className="curved-dp-year">{viewYear}</span>
            </div>
            <button type="button" className="curved-dp-arrow" onClick={handleNextMonth} title="الشهر التالي">
              ›
            </button>
          </div>

          <div className="curved-dp-days-row">
            {DAY_NAMES_AR.map(d => (
              <span key={d} className="curved-dp-day-label">{d}</span>
            ))}
          </div>

          <div className="curved-dp-grid">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="curved-dp-cell empty" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <div key={day} className="curved-dp-cell">
                  <button
                    type="button"
                    className={`curved-dp-btn ${sel ? 'selected' : ''} ${tod && !sel ? 'today' : ''}`}
                    onClick={() => selectDate(day)}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="curved-dp-footer">
            <button type="button" className="curved-dp-footer-btn clear" onClick={handleClear}>
              مسح
            </button>
            <button type="button" className="curved-dp-footer-btn today" onClick={handleToday}>
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

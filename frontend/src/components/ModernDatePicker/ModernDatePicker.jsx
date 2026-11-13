// frontend/src/components/ModernDatePicker/ModernDatePicker.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import './ModernDatePicker.css';

const ARABIC_MONTHS = [
  { index: 0, num: '01', name: 'يناير' },
  { index: 1, num: '02', name: 'فبراير' },
  { index: 2, num: '03', name: 'مارس' },
  { index: 3, num: '04', name: 'أبريل' },
  { index: 4, num: '05', name: 'مايو' },
  { index: 5, num: '06', name: 'يونيو' },
  { index: 6, num: '07', name: 'يوليو' },
  { index: 7, num: '08', name: 'أغسطس' },
  { index: 8, num: '09', name: 'سبتمبر' },
  { index: 9, num: '10', name: 'أكتوبر' },
  { index: 10, num: '11', name: 'نوفمبر' },
  { index: 11, num: '12', name: 'ديسمبر' }
];

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const CURRENT_YEAR = new Date().getFullYear();
const ALL_YEARS = Array.from({ length: (CURRENT_YEAR + 2) - 1950 }, (_, i) => (CURRENT_YEAR + 1) - i);

export default function ModernDatePicker({
  value = '',
  onChange,
  label,
  placeholder = 'اختر التاريخ...',
  format: propFormat,
  placement = 'top',
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Selected values
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Active dropdown inside popup: 'year' | 'month' | 'day' | null
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Search filter for years
  const [yearSearch, setYearSearch] = useState('');

  const containerRef = useRef(null);

  // Check if ISO format
  const isIsoFormat = propFormat === 'YYYY-MM-DD' || (value && value.includes('-')) || (!propFormat && placeholder.includes('YYYY-MM-DD'));

  // Normalize Arabic numerals
  const normalizeDigits = (str) => {
    if (!str) return '';
    return String(str).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  };

  // Sync state with incoming value
  useEffect(() => {
    if (!value) {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
      return;
    }

    const s = normalizeDigits(String(value).trim());

    // 1. DD/MM/YYYY
    const slashFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashFull) {
      setSelectedDay(parseInt(slashFull[1], 10));
      setSelectedMonth(parseInt(slashFull[2], 10) - 1);
      setSelectedYear(parseInt(slashFull[3], 10));
      return;
    }

    // 2. YYYY-MM-DD
    const isoFull = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoFull) {
      setSelectedYear(parseInt(isoFull[1], 10));
      setSelectedMonth(parseInt(isoFull[2], 10) - 1);
      setSelectedDay(parseInt(isoFull[3], 10));
      return;
    }

    // 3. MM/YYYY
    const slashMonth = s.match(/^(\d{1,2})\/(\d{4})$/);
    if (slashMonth) {
      setSelectedDay(null);
      setSelectedMonth(parseInt(slashMonth[1], 10) - 1);
      setSelectedYear(parseInt(slashMonth[2], 10));
      return;
    }

    // 4. YYYY-MM
    const isoMonth = s.match(/^(\d{4})-(\d{1,2})$/);
    if (isoMonth) {
      setSelectedDay(null);
      setSelectedMonth(parseInt(isoMonth[2], 10) - 1);
      setSelectedYear(parseInt(isoMonth[1], 10));
      return;
    }

    // 5. YYYY
    if (/^\d{4}$/.test(s)) {
      setSelectedDay(null);
      setSelectedMonth(null);
      setSelectedYear(parseInt(s, 10));
      return;
    }
  }, [value]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format outputs
  const formatFullDate = (y, m, d) => {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(m + 1).padStart(2, '0');
    return isIsoFormat ? `${y}-${mStr}-${dStr}` : `${dStr}/${mStr}/${y}`;
  };

  const formatMonthOnly = (y, m) => {
    const mStr = String(m + 1).padStart(2, '0');
    return isIsoFormat ? `${y}-${mStr}` : `${mStr}/${y}`;
  };

  const formatYearOnly = (y) => String(y);

  // Open popup
  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!selectedYear) {
        setActiveDropdown('year');
      } else if (selectedMonth === null) {
        setActiveDropdown('month');
      } else {
        setActiveDropdown(null);
      }
    } else {
      setIsOpen(false);
      setActiveDropdown(null);
    }
  };

  // 1. Select Year -> Opens Month Box underneath
  const handleSelectYear = (y) => {
    setSelectedYear(y);
    setYearSearch('');
    if (onChange) onChange(formatYearOnly(y));
    setActiveDropdown('month');
  };

  // 2. Select Month -> Opens Day Box underneath
  const handleSelectMonth = (mIdx) => {
    setSelectedMonth(mIdx);
    if (onChange) onChange(formatMonthOnly(selectedYear, mIdx));
    setActiveDropdown('day');
  };

  // 3. Select Day -> Completes date & closes popup
  const handleSelectDay = (dNum) => {
    setSelectedDay(dNum);
    const dateStr = formatFullDate(selectedYear, selectedMonth, dNum);
    if (onChange) onChange(dateStr);
    setActiveDropdown(null);
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setActiveDropdown('year');
    if (onChange) onChange('');
  };

  // Quick preset: Today
  const handleSelectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    const dateStr = formatFullDate(y, m, d);
    if (onChange) onChange(dateStr);
    setActiveDropdown(null);
    setIsOpen(false);
  };

  // Filtered years
  const filteredYears = useMemo(() => {
    if (!yearSearch.trim()) return ALL_YEARS;
    const q = normalizeDigits(yearSearch.trim());
    return ALL_YEARS.filter(y => String(y).includes(q));
  }, [yearSearch]);

  // Days list for selected month
  const daysInMonth = useMemo(() => {
    if (!selectedYear || selectedMonth === null) return 30;
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysList = useMemo(() => {
    if (!selectedYear || selectedMonth === null) return [];
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() === selectedMonth;

    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(selectedYear, selectedMonth, dayNum);
      const weekdayName = ARABIC_WEEKDAYS[dateObj.getDay()];
      const isToday = isCurrentMonth && now.getDate() === dayNum;
      return { dayNum, weekdayName, isToday };
    });
  }, [selectedYear, selectedMonth, daysInMonth]);

  const selectedMonthObj = selectedMonth !== null ? ARABIC_MONTHS[selectedMonth] : null;

  return (
    <div className="modern-date-picker-wrap" ref={containerRef}>
      {label && <label className="modern-date-label">{label}</label>}

      {/* Main input field in the form */}
      <div
        className={`modern-date-input-field ${isOpen ? 'active-focus' : ''}`}
        onClick={handleToggleOpen}
        title="انقر لاختيار التاريخ"
      >
        <div className="input-field-start">
          <svg className="calendar-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className={`date-display-text ${value ? 'has-val' : 'is-placeholder'}`}>
            {value ? value : placeholder}
          </span>
        </div>

        <div className="input-field-end">
          {value && (
            <button
              type="button"
              className="date-clear-inline-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
                setIsOpen(false);
              }}
              title="مسح التاريخ"
            >
              ✕
            </button>
          )}
          <svg className={`calendar-dropdown-chevron ${isOpen ? 'open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Popup Window Opened Above (المربع المنبثق فوق) */}
      {isOpen && (
        <div className={`modern-date-popup placement-${placement} align-${align} fade-in`}>
          <div className="cascade-popup-inner">

            {/* BOX 1: مربع السنين */}
            <div className="cascade-step-block">
              <label className="cascade-step-label">1. السنة:</label>
              <div
                className={`cascade-selector-box ${activeDropdown === 'year' ? 'active' : ''} ${selectedYear ? 'has-value' : ''}`}
                onClick={() => setActiveDropdown(prev => prev === 'year' ? null : 'year')}
              >
                <span className="cascade-box-title">
                  {selectedYear ? `سنة ${selectedYear}` : 'اضغط لاختيار السنة'}
                </span>
                <svg className={`cascade-chevron-icon ${activeDropdown === 'year' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* القائمة المنسدلة لسنوات */}
              {activeDropdown === 'year' && (
                <div className="cascade-dropdown-panel fade-in">
                  <div className="cascade-search-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      className="cascade-search-input"
                      placeholder="ابحث عن سنة (مثلاً 2024)..."
                      value={yearSearch}
                      onChange={(e) => setYearSearch(e.target.value)}
                      autoFocus
                    />
                    {yearSearch && (
                      <button type="button" className="cascade-search-clear" onClick={() => setYearSearch('')}>✕</button>
                    )}
                  </div>

                  <div className="cascade-scroll-items">
                    {filteredYears.map(y => {
                      const isSelected = selectedYear === y;
                      return (
                        <label
                          key={y}
                          className={`standard-checklist-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectYear(y)}
                        >
                          <input
                            type="checkbox"
                            className="standard-checkbox"
                            checked={isSelected}
                            readOnly
                          />
                          <span className="checklist-label-text">{y}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BOX 2: مربع الشهور (يفتح تحته بمجرد اختيار السنة) */}
            {selectedYear && (
              <div className="cascade-step-block fade-in">
                <label className="cascade-step-label">2. الشهر (لسنة {selectedYear}):</label>
                <div
                  className={`cascade-selector-box ${activeDropdown === 'month' ? 'active' : ''} ${selectedMonth !== null ? 'has-value' : ''}`}
                  onClick={() => setActiveDropdown(prev => prev === 'month' ? null : 'month')}
                >
                  <span className="cascade-box-title">
                    {selectedMonthObj ? selectedMonthObj.name : 'اضغط لاختيار الشهر'}
                  </span>
                  <svg className={`cascade-chevron-icon ${activeDropdown === 'month' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {/* القائمة المنسدلة للشهور */}
                {activeDropdown === 'month' && (
                  <div className="cascade-dropdown-panel fade-in">
                    <div className="cascade-months-grid">
                      {ARABIC_MONTHS.map(m => {
                        const isSelected = selectedMonth === m.index;
                        return (
                          <label
                            key={m.index}
                            className={`standard-checklist-item month-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectMonth(m.index)}
                          >
                            <input
                              type="checkbox"
                              className="standard-checkbox"
                              checked={isSelected}
                              readOnly
                            />
                            <span className="checklist-label-text">{m.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOX 3: مربع الأيام (يفتح تحته بمجرد اختيار الشهر) */}
            {selectedYear && selectedMonth !== null && (
              <div className="cascade-step-block fade-in">
                <label className="cascade-step-label">3. اليوم ({selectedMonthObj?.name} {selectedYear}):</label>
                <div
                  className={`cascade-selector-box ${activeDropdown === 'day' ? 'active' : ''} ${selectedDay ? 'has-value' : ''}`}
                  onClick={() => setActiveDropdown(prev => prev === 'day' ? null : 'day')}
                >
                  <span className="cascade-box-title">
                    {selectedDay ? `يوم ${selectedDay}` : 'اضغط لاختيار اليوم'}
                  </span>
                  <svg className={`cascade-chevron-icon ${activeDropdown === 'day' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {/* القائمة المنسدلة للأيام */}
                {activeDropdown === 'day' && (
                  <div className="cascade-dropdown-panel fade-in">
                    <div className="cascade-days-scroll">
                      <div className="cascade-days-grid">
                        {daysList.map(({ dayNum, weekdayName, isToday }) => {
                          const isSelected = selectedDay === dayNum;
                          return (
                            <label
                              key={dayNum}
                              className={`standard-checklist-item day-item ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                              onClick={() => handleSelectDay(dayNum)}
                            >
                              <input
                                type="checkbox"
                                className="standard-checkbox"
                                checked={isSelected}
                                readOnly
                              />
                              <span className="checklist-label-text">
                                {dayNum} <small className="day-weekday-small">({weekdayName})</small>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* أزرار التأكيد السريع بالأسفل */}
            <div className="cascade-bottom-bar">
              {selectedYear && (
                <button
                  type="button"
                  className="cascade-action-btn confirm"
                  onClick={() => setIsOpen(false)}
                >
                  تأكيد وحفظ ✓
                </button>
              )}
              <button
                type="button"
                className="cascade-action-btn today"
                onClick={handleSelectToday}
              >
                اليوم
              </button>
              <button
                type="button"
                className="cascade-action-btn clear"
                onClick={handleClear}
              >
                مسح
              </button>
              <button
                type="button"
                className="cascade-action-btn close"
                onClick={() => setIsOpen(false)}
              >
                إغلاق ✕
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

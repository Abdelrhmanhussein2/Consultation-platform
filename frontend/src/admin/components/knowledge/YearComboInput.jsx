import React, { useState, useRef, useEffect } from 'react';
import '../../../components/ModernSelect.css';

const DEFAULT_YEARS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2014'];

export default function YearComboInput({
  value = '',
  onChange,
  placeholder = 'سنة الصدور'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (y) => {
    onChange(y);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`modern-select-wrapper ${isOpen ? 'is-open' : ''} ${value ? 'has-value' : ''}`}
      style={{ width: '135px', minWidth: '120px' }}
    >
      <div
        className="modern-select-trigger"
        style={{ padding: '0 8px 0 10px', height: '38px', cursor: 'text' }}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
            onChange(v);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontWeight: 700,
            fontSize: '12px',
            color: '#0e3b5e',
            fontFamily: 'inherit',
            textAlign: 'right'
          }}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="مسح السنة"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: '#64748B'
          }}
          aria-label="خيارات السنوات"
        >
          <svg
            className={`modern-select-chevron ${isOpen ? 'open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="modern-select-dropdown align-right" style={{ minWidth: '100%' }}>
          <div className="modern-select-options">
            {DEFAULT_YEARS.map((y) => {
              const active = String(value) === String(y);
              return (
                <div
                  key={y || 'all'}
                  className={`modern-select-option ${active ? 'selected' : ''}`}
                  onClick={() => handleSelect(y)}
                >
                  <span className="modern-select-option-text">
                    {y ? y : 'كل السنوات'}
                  </span>
                  {active && (
                    <svg
                      className="modern-select-check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


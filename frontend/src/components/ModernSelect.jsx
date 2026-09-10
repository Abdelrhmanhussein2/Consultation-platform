import React, { useState, useRef, useEffect } from 'react';
import './ModernSelect.css';

export default function ModernSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'اختر...',
  prefixIcon = null,
  className = '',
  dropdownWidth = 'auto',
  align = 'right',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format options: support array of strings or array of objects { value, label }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label || opt.value };
    }
    return { value: opt, label: opt };
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const isSelected = value !== '' && value !== null && value !== undefined;

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`modern-select-wrapper ${isOpen ? 'is-open' : ''} ${isSelected ? 'has-value' : ''} ${className}`} ref={containerRef} style={style}>
      <button
        type="button"
        className="modern-select-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
      >
        {prefixIcon && <span className="modern-select-prefix-icon">{prefixIcon}</span>}
        <span className="modern-select-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {isSelected && <span className="modern-select-active-dot" />}

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

      {isOpen && (
        <div className={`modern-select-dropdown align-${align}`} style={{ minWidth: dropdownWidth }}>
          <div className="modern-select-options">
            {normalizedOptions.map((opt, idx) => {
              const active = opt.value === value;
              return (
                <div
                  key={idx}
                  className={`modern-select-option ${active ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="modern-select-option-text">{opt.label}</span>
                  {active && (
                    <svg className="modern-select-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

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
  direction = 'down',
  style = {},
  multiple = false,
  multiLabelFormat = null
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

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : (value && value !== 'all' ? [value] : []))
    : [];
  const activeValues = multiple ? selectedValues.filter(v => v !== 'all') : [];
  const selectedOption = !multiple ? normalizedOptions.find(opt => opt.value === value) : null;
  const isSelected = multiple
    ? activeValues.length > 0
    : (value !== '' && value !== null && value !== undefined && value !== 'all');

  let labelText = placeholder;
  if (multiple) {
    if (activeValues.length === 0) {
      labelText = placeholder || 'الكل';
    } else if (activeValues.length === 1) {
      const match = normalizedOptions.find(opt => opt.value === activeValues[0]);
      labelText = match ? match.label : activeValues[0];
    } else if (typeof multiLabelFormat === 'function') {
      labelText = multiLabelFormat(activeValues.length);
    } else {
      labelText = `تم تحديد (${activeValues.length})`;
    }
  } else {
    labelText = selectedOption ? selectedOption.label : placeholder;
  }

  const handleSelect = (optValue) => {
    if (multiple) {
      if (optValue === 'all') {
        onChange([]);
        return;
      }
      const current = selectedValues.filter(v => v !== 'all');
      const exists = current.includes(optValue);
      const next = exists ? current.filter(v => v !== optValue) : [...current, optValue];
      onChange(next);
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  return (
    <div className={`modern-select-wrapper ${isOpen ? 'is-open' : ''} ${isSelected ? 'has-value' : ''} ${direction === 'up' ? 'dropup' : ''} ${className}`} ref={containerRef} style={style}>
      <button
        type="button"
        className="modern-select-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
      >
        {prefixIcon && <span className="modern-select-prefix-icon">{prefixIcon}</span>}
        <span className="modern-select-label">
          {labelText}
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
              const active = multiple
                ? (opt.value === 'all'
                    ? activeValues.length === 0
                    : activeValues.includes(opt.value))
                : opt.value === value;
              return (
                <div
                  key={idx}
                  className={`modern-select-option ${multiple ? 'has-checkbox' : ''} ${active ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {multiple && (
                    <div className={`modern-select-checkbox-box ${active ? 'checked' : ''}`}>
                      {active && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  )}
                  <span className="modern-select-option-text">{opt.label}</span>
                  {!multiple && active && (
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

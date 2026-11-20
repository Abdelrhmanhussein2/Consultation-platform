import React, { useState, useRef, useEffect } from 'react';

/**
 * Multi-Select Dropdown for Consultant Specializations
 * Features:
 * - Dropdown list with checkboxes
 * - Refresh/Reset icon in header to clear selections
 * - Confirmation button ("تأكيد") in footer
 * - Plain and clean selected tags below
 */
export default function SpecializationsMultiSelect({
  specializations = [],
  selectedIds = [],
  onChange,
  placeholder = 'اختر التخصصات...'
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

  const handleToggle = (id) => {
    const numId = Number(id);
    const isSelected = selectedIds.includes(numId);
    let next;
    if (isSelected) {
      next = selectedIds.filter((item) => item !== numId);
    } else {
      next = [...selectedIds, numId];
    }
    onChange(next);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Summary display text for the trigger button
  const getTriggerSummary = () => {
    return { text: placeholder, isPlaceholder: true };
  };

  const summary = getTriggerSummary();

  return (
    <div className="spec-multiselect-wrap" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`spec-multiselect-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="spec-multiselect-trigger-content">
          <span className="spec-multiselect-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <path d="m9 14 2 2 4-4"></path>
            </svg>
          </span>
          <span className={`spec-multiselect-label ${summary.isPlaceholder ? 'placeholder' : ''}`}>
            {summary.text}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedIds.length > 0 && (
            <span className="spec-multiselect-count-badge">
              {selectedIds.length}
            </span>
          )}
          <svg
            className={`spec-multiselect-chevron ${isOpen ? 'open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="spec-multiselect-dropdown">
          {/* Header with Title and Reset/Refresh Icon */}
          <div className="spec-multiselect-header">
            <span className="spec-multiselect-header-title">
              اختر التخصصات ({selectedIds.length} من {specializations.length})
            </span>
            <button
              type="button"
              className="spec-multiselect-reset-btn"
              title="إعادة تعيين الاختيارات"
              onClick={handleClearAll}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>

          {/* List of Specializations with checkboxes */}
          <div className="spec-multiselect-list">
            {specializations.map((spec) => {
              const isSelected = selectedIds.includes(spec.id);
              return (
                <div
                  key={spec.id}
                  className={`spec-multiselect-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleToggle(spec.id)}
                >
                  <div className="spec-multiselect-checkbox">
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="spec-multiselect-item-text">{spec.name}</span>
                </div>
              );
            })}
          </div>

          {/* Footer with Confirm Button */}
          <div className="spec-multiselect-footer">
            <button
              type="button"
              className="spec-multiselect-confirm-btn"
              onClick={() => setIsOpen(false)}
            >
              تأكيد
            </button>
          </div>
        </div>
      )}

      {/* Selected Tags Display below the dropdown (Plain / سادة) */}
      {selectedIds.length > 0 && (
        <div className="spec-selected-tags-container">
          {selectedIds.map((id) => {
            const spec = specializations.find((s) => s.id === id);
            if (!spec) return null;
            return (
              <span key={id} className="spec-selected-tag">
                <span>{spec.name}</span>
                <button
                  type="button"
                  className="spec-tag-remove-btn"
                  title="إزالة التخصص"
                  onClick={() => handleToggle(id)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

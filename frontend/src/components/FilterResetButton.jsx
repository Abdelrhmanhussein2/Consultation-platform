import React from 'react';

/**
 * FilterResetButton Component
 * 
 * Reusable filter reset button across the platform.
 * Displays a clean, standard SVG reset icon with tooltip and interactive hover states.
 * 
 * Props:
 * - onClick: Function to trigger reset logic
 * - title: Tooltip text (default: 'إعادة تعيين الفلتر')
 * - size: Icon box size in px (default: 32)
 * - className: Additional CSS classes
 * - style: Inline style overrides
 */
export default function FilterResetButton({
  onClick,
  title = 'إعادة تعيين الفلتر',
  ariaLabel = 'إعادة تعيين الفلتر',
  size = 32,
  className = '',
  style = {}
}) {
  return (
    <button
      type="button"
      className={`filter-reset-button ${className}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        padding: 0,
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        color: '#E0921B',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        flexShrink: 0,
        fontFamily: "'Tajawal', sans-serif",
        boxSizing: 'border-box',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFBEB';
        e.currentTarget.style.borderColor = '#FCD34D';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
        e.currentTarget.style.borderColor = '#E2E8F0';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <svg
        width={Math.round(size * 0.48)}
        height={Math.round(size * 0.48)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  );
}

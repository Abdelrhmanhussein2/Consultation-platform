// frontend/src/components/TaxForms/TaxFormsFilterBar.jsx
import React from 'react';
import FilterResetButton from '../FilterResetButton';

const TAX_FORM_CATEGORIES = [
  'الكل',
  'ضريبة الدخل',
  'ضريبة المبيعات',
  'العقود',
  'الشركات',
  'العمل والضمان',
  'عام'
];

const SearchIcon = ({ size = 17, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function TaxFormsFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onReset
}) {
  return (
    <div className="tax-filters-section">
      {/* Search Input Box with FilterResetButton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '780px', marginBottom: '18px' }}>
        <div className="tax-search-wrap" style={{ flex: 1, maxWidth: 'none', marginBottom: 0 }}>
          <span className="tax-search-icon" aria-hidden="true">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            className="tax-search-input"
            placeholder="ابحث عن نموذج..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="ابحث عن نموذج"
          />
          {searchQuery && (
            <button
              type="button"
              className="tax-search-clear"
              onClick={() => onSearchChange('')}
              title="مسح البحث"
              aria-label="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        {onReset && (
          <FilterResetButton
            onClick={onReset}
            size={44}
            title="إعادة ضبط البحث والتصنيف"
          />
        )}
      </div>

      {/* Categories Horizontal Pills */}
      <div className="tax-categories-bar" role="tablist" aria-label="تصنيفات النماذج">
        {TAX_FORM_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tax-cat-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

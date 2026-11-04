// frontend/src/components/TaxDirectory/TaxDirectoryToolbar.jsx
import React from 'react';

const SearchIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

export default function TaxDirectoryToolbar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableTypes = [],
  totalFiltered = 0,
  onReset
}) {
  const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

  return (
    <>
      <div className="td-panel-head">
        <div>
          <h2 className="td-panel-title">سجل الجهات والأرقام الضريبية</h2>
          <div className="td-panel-desc">
            ابحث بالاسم أو الرقم الضريبي أو نوع المكلف، ثم اضغط على أي سجل لعرض التفاصيل.
          </div>
        </div>
        <div className="td-count-pill">{fmt(totalFiltered)} سجل</div>
      </div>

      <div className="td-toolbar">
        <div className="td-searchbox">
          <span className="td-searchicon" aria-hidden="true">
            <SearchIcon size={18} color="#94A3B8" />
          </span>
          <input
            type="search"
            placeholder="ابحث باسم الجهة أو الرقم الضريبي..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            aria-label="البحث في السجلات"
          />
          {searchQuery && (
            <button
              type="button"
              className="td-clear-search"
              onClick={() => onSearchChange('')}
              aria-label="مسح البحث"
              title="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="td-filter"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="تصفية حسب نوع المكلف"
        >
          <option value="">جميع أنواع المكلفين</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="td-btn-reset"
          onClick={onReset}
          title="إعادة ضبط البحث والتصفية"
        >
          <RefreshIcon size={14} color="#0D3C5C" />
          <span>إعادة ضبط</span>
        </button>
      </div>
    </>
  );
}


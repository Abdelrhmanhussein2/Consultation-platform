// frontend/src/components/TaxDirectory/TaxDirectoryStats.jsx
import React from 'react';

const FileTextIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SearchIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LayersIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2z" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export default function TaxDirectoryStats({ totalCount = 0, resultCount = 0, typeCount = 0 }) {
  const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

  return (
    <section className="td-stats" aria-label="إحصائيات الدليل">
      <div className="td-stat">
        <div className="td-stat-icon" aria-hidden="true">
          <FileTextIcon size={20} color="#0D3C5C" />
        </div>
        <div>
          <div className="td-stat-label">إجمالي السجلات</div>
          <div className="td-stat-value">{fmt(totalCount)}</div>
          <div className="td-stat-note">سجل متاح في الدليل</div>
        </div>
      </div>

      <div className="td-stat">
        <div className="td-stat-icon" aria-hidden="true">
          <SearchIcon size={20} color="#0D3C5C" />
        </div>
        <div>
          <div className="td-stat-label">نتائج البحث</div>
          <div className="td-stat-value">{fmt(resultCount)}</div>
          <div className="td-stat-note">تتحدث تلقائياً حسب البحث</div>
        </div>
      </div>

      <div className="td-stat">
        <div className="td-stat-icon" aria-hidden="true">
          <LayersIcon size={20} color="#0D3C5C" />
        </div>
        <div>
          <div className="td-stat-label">أنواع الجهات</div>
          <div className="td-stat-value">{fmt(typeCount)}</div>
          <div className="td-stat-note">تصنيفات مختلفة</div>
        </div>
      </div>
    </section>
  );
}


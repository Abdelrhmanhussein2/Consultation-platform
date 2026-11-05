import React from 'react';
import TaxFormCard from './TaxFormCard';

const FolderSearchIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

export default function TaxFormsGrid({
  forms,
  favoritesSet,
  isAdmin = false,
  onDownload,
  onToggleFavorite,
  onEdit,
  onDelete,
  onResetFilters
}) {
  if (!forms || forms.length === 0) {
    return (
      <div className="tax-empty-state">
        <div className="tax-empty-icon" aria-hidden="true">
          <FolderSearchIcon size={26} color="#94A3B8" />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D3C5C', margin: '0 0 6px 0' }}>
          لا توجد نماذج مطابقة للبحث
        </h3>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
          جرّب البحث باسم آخر أو اختيار تصنيف مختلف من القائمة أعلاه.
        </p>
        {onResetFilters && (
          <button
            type="button"
            className="tax-cat-pill active"
            style={{ margin: '0 auto', display: 'inline-block' }}
            onClick={onResetFilters}
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="tax-cards-grid">
      {forms.map((form) => (
        <TaxFormCard
          key={form.id || form.code}
          form={form}
          isFavorite={favoritesSet.has(form.id || form.code)}
          isAdmin={isAdmin}
          onDownload={onDownload}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

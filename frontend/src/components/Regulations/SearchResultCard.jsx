// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated, onOpenFilters }) {
  return (
    <div className="reg-result-card-item">
      <div className="reg-card-badges-row">
        <span className="reg-badge-tag">{law.type || 'قانون'}</span>
        <span className="reg-badge-tag green">{law.status || 'ساري'}</span>
        <span className="reg-badge-tag">{law.year_short || '2014'}</span>
      </div>

      <h3 className="reg-card-main-title" onClick={() => onOpenPreview(law)}>
        {law.title || "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته"}
      </h3>

      {/* 4 Grey Metadata Boxes */}
      <div className="reg-card-meta-grid">
        <div className="reg-meta-box">
          <span className="reg-meta-box-label">سنة الإصدار</span>
          <span className="reg-meta-box-val">{law.issue_date || '30-12-2014'}</span>
        </div>
        <div className="reg-meta-box">
          <span className="reg-meta-box-label">تاريخ النفاذ</span>
          <span className="reg-meta-box-val">{law.effective_date || '01-01-2015'}</span>
        </div>
        <div className="reg-meta-box">
          <span className="reg-meta-box-label">تعديل الساري</span>
          <span className="reg-meta-box-val">{law.amended_date || '01-01-2019'}</span>
        </div>
        <div className="reg-meta-box">
          <span className="reg-meta-box-label">عدد المواد</span>
          <span className="reg-meta-box-val">{law.total_articles || 82} مادة</span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="reg-card-action-row">
        <button
          type="button"
          className="reg-action-btn"
          onClick={() => onOpenFilters && onOpenFilters()}
        >
          البحث المتقدم
        </button>
        <button
          type="button"
          className="reg-action-btn"
          onClick={() => onOpenPreview(law)}
        >
          نص القانون
        </button>
        <button
          type="button"
          className="reg-action-btn"
          onClick={() => onOpenRelated(law)}
        >
          اسأل ديوان من القانون
        </button>
      </div>
    </div>
  );
}

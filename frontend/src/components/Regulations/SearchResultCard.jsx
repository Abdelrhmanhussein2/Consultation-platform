// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated, onOpenFullPage }) {
  // زر "نص القانون" → يفتح Modal المعاينة أولاً (حسب الاختيار)
  // زر "فتح النص الكامل" في الـ Modal → ينقل لصفحة مستقلة

  const handleOpenText = () => {
    // يفتح الـ Preview Modal الذي يعرض البيانات الحقيقية وأول 3 مواد
    if (onOpenPreview) onOpenPreview(law);
  };

  return (
    <article className="reg-result-card-item">
      {/* Badges */}
      <div className="badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span className="badge">{law.type || 'قانون'}</span>
        <span className="badge good">{law.status || 'ساري'}</span>
        <span className="badge">{law.year_short || '2014'}</span>
      </div>

      {/* Title */}
      <h2
        style={{ margin: '3px 0 7px', color: 'var(--reg-navy)', fontSize: '21px', cursor: 'pointer' }}
        onClick={handleOpenText}
      >
        {law.title || 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته'}
      </h2>

      {/* 4 Meta Boxes */}
      <div className="result-law-meta">
        <div>
          <span>تاريخ الإصدار</span>
          <strong>{law.issue_date || '—'}</strong>
        </div>
        <div>
          <span>تاريخ السريان</span>
          <strong>{law.effective_date || '—'}</strong>
        </div>
        <div>
          <span>آخر تعديل</span>
          <strong>{law.amended_date || '—'}</strong>
        </div>
        <div>
          <span>عدد المواد</span>
          <strong>{law.total_articles ? `${law.total_articles} مادة` : '—'}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions result-actions-v3">
        {/* البحث المتقدم → يفتح LegalReader كما هو */}
        <button className="btn" onClick={() => onOpenReader && onOpenReader(law)}>
          البحث المتقدم
        </button>

        {/* نص القانون → يفتح Preview Modal بالبيانات الحقيقية */}
        <button className="btn" onClick={handleOpenText}>
          نص القانون
        </button>

        {/* اسأل ديوان */}
        <button className="btn" onClick={() => onOpenRelated && onOpenRelated(law)}>
          اسأل ديوان عن القانون
        </button>
      </div>
    </article>
  );
}

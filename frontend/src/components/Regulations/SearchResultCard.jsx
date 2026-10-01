// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated }) {
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
        onClick={() => onOpenPreview && onOpenPreview(law)}
      >
        {law.title || 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته'}
      </h2>

      {/* 4 Meta Boxes - exact match to HTML reference */}
      <div className="result-law-meta">
        <div>
          <span>تاريخ الإصدار</span>
          <strong>{law.issue_date || '30-12-2014'}</strong>
        </div>
        <div>
          <span>تاريخ السريان</span>
          <strong>{law.effective_date || '01-01-2015'}</strong>
        </div>
        <div>
          <span>آخر تعديل</span>
          <strong>{law.amended_date || '01-01-2019'}</strong>
        </div>
        <div>
          <span>عدد المواد</span>
          <strong>{law.total_articles || 82} مادة</strong>
        </div>
      </div>

      {/* Action Buttons - same as HTML reference */}
      <div className="actions result-actions-v3">
        <button className="btn" onClick={() => onOpenReader && onOpenReader(law)}>
          البحث المتقدم
        </button>
        <button className="btn" onClick={() => onOpenPreview && onOpenPreview(law)}>
          نص القانون
        </button>
        <button className="btn" onClick={() => onOpenRelated && onOpenRelated(law)}>
          اسأل ديوان عن القانون
        </button>
        <button
          className="btn"
          onClick={() => {
            const url = law.source_url || 'https://www.istd.gov.jo';
            window.open(url, '_blank');
          }}
        >
          المصدر الرسمي ↗
        </button>
      </div>
    </article>
  );
}

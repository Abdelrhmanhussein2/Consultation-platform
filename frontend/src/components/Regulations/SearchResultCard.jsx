// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';

function formatDisplayDate(val) {
  if (!val || val === '—' || val === '-') return '';
  if (typeof val !== 'string') return String(val);
  const trimmed = val.trim();
  if (trimmed === 'لا ينطبق (نص أصلي)') return trimmed;
  const m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const dd = m[3].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${dd}-${mm}-${m[1]}`;
  }
  return trimmed;
}

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated, onOpenFullPage, isTargeted = false }) {
  // زر "نص القانون" → يفتح Modal المعاينة أولاً (حسب الاختيار)
  // زر "فتح النص الكامل" في الـ Modal → ينقل لصفحة مستقلة

  const handleOpenText = () => {
    // يفتح الـ Preview Modal الذي يعرض البيانات الحقيقية وأول 3 مواد
    if (onOpenPreview) onOpenPreview(law);
  };

  const isOriginal = (law.type || '').includes('أصلية') ||
    (law.title || '').includes('النسخة الأصلية') ||
    (law.title || '').includes('النسخة') ||
    String(law.law_id || '').includes('النسخة') ||
    String(law.law_id || '').includes('الأصلية');

  const issueDateDisplay = formatDisplayDate(law.issue_date) || (law.year ? `${law.year}` : '—');
  const effectiveDateDisplay = formatDisplayDate(law.effective_date) || '—';
  const amendedDateDisplay = formatDisplayDate(law.amended_date) || (isOriginal ? 'لا ينطبق (نص أصلي)' : '—');

  return (
    <article className={`reg-result-card-item ${isTargeted ? 'reg-card-fade-highlight' : ''}`}>
      {/* Badges */}
      <div className="badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
        <span className="badge">{law.type || 'تشريع'}</span>
        <span className={`badge ${law.status === 'ساري' ? 'good' : 'warning'}`}>{law.status || 'ساري'}</span>
        <span className="badge">{law.year_short || law.year || '2014'}</span>
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
          <strong>{issueDateDisplay}</strong>
        </div>
        <div>
          <span>تاريخ السريان</span>
          <strong>{effectiveDateDisplay}</strong>
        </div>
        <div>
          <span>آخر تعديل</span>
          <strong>{amendedDateDisplay}</strong>
        </div>
        <div>
          <span>عدد المواد</span>
          <strong>{law.total_articles !== undefined && law.total_articles !== null ? `${law.total_articles} مادة` : '—'}</strong>
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

        {/* اسأل ديوان عن القانون */}
        <button className="btn" onClick={() => onOpenRelated && onOpenRelated(law)}>
          اسأل ديوان عن القانون
        </button>
      </div>
    </article>
  );
}

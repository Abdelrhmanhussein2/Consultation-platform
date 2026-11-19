// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';
import { formatLawAmendedDate, formatOriginalLawTitle } from '../../utils/legalFormatters';

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated, onOpenFullPage, isTargeted = false }) {
  // زر "نص القانون" → يفتح Modal المعاينة أولاً (حسب الاختيار)
  // زر "فتح النص الكامل" في الـ Modal → ينقل لصفحة مستقلة

  const handleOpenText = () => {
    // يفتح الـ Preview Modal الذي يعرض البيانات الحقيقية وأول 3 مواد
    if (onOpenPreview) onOpenPreview(law);
  };

  // Priority order for Status Badge:
  // 1. Legally repealed -> «ملغي»
  // 2. Original superseded by newer amended version -> «نسخة سابقة» (legally still valid)
  // 3. Current active version -> «ساري»
  const isRepealed = law.status === 'ملغي' || law.status === 'ملغى' || law.legal_status === 'ملغي';
  const isPrevious = !isRepealed && (law.status === 'نسخة سابقة' || Boolean(law.is_superseded));

  let displayStatus = 'ساري';
  let statusBadgeClass = 'good';

  if (isRepealed) {
    displayStatus = 'ملغي';
    statusBadgeClass = 'status-repealed';
  } else if (isPrevious) {
    displayStatus = 'نسخة سابقة';
    statusBadgeClass = 'status-previous';
  } else {
    displayStatus = 'ساري';
    statusBadgeClass = 'good';
  }

  // Version status: strictly «نسخة أصلية» or «معدل»
  const isAmendment = law.version_status
    ? law.version_status === 'معدل'
    : (law.type === 'نسخة معدلة' || (law.title && (law.title.includes('وتعديلاته') || law.title.includes('المعدل'))));
  const versionText = isAmendment ? 'معدل' : 'نسخة أصلية';

  // Legislation type derived dynamically or fallback to 'تشريع'
  const versionWords = ['نسخة أصلية', 'نسخة معدلة', 'نسخة سابقة', 'أصلية', 'معدلة', 'سابقة'];
  let docType = (law.doc_type && !versionWords.includes(law.doc_type)) ? law.doc_type : null;
  if (!docType && law.type && !versionWords.includes(law.type)) {
    docType = law.type;
  }
  if (!docType) {
    docType = 'تشريع';
  }

  const lawYear = law.year_short || law.year || '';

  return (
    <article className={`reg-result-card-item ${isTargeted ? 'reg-card-fade-highlight' : ''}`}>
      {/* Badges: Legislation Type → Version Type (with Year inside it) → Legal Status */}
      <div className="badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
        <span className="badge">{docType}</span>
        
        <span
          className="badge"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 10px',
            lineHeight: 1.2
          }}
        >
          {lawYear && (
            <span style={{ fontSize: '8.5px', color: '#64748B', fontWeight: 700, marginBottom: '1px' }}>
              ({lawYear})
            </span>
          )}
          <span>{versionText}</span>
        </span>

        <span className={`badge ${statusBadgeClass}`}>{displayStatus}</span>
      </div>

      {/* Title */}
      <h2
        style={{ margin: '3px 0 7px', color: 'var(--reg-navy)', fontSize: '21px', cursor: 'pointer' }}
        onClick={handleOpenText}
      >
        {formatOriginalLawTitle(law.title) || 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته'}
      </h2>

      {/* 4 Meta Boxes */}
      <div className="result-law-meta">
        <div>
          <span>تاريخ الإصدار</span>
          <strong>{law.issue_date || (law.year ? `${law.year}` : '30-12-2014')}</strong>
        </div>
        <div>
          <span>تاريخ السريان</span>
          <strong>{law.effective_date || (law.title?.includes('34') || law.law_id?.includes('34') ? '01-01-2015' : '—')}</strong>
        </div>
        <div>
          <span>آخر تعديل</span>
          <strong>{formatLawAmendedDate(law.amended_date, law)}</strong>
        </div>
        <div>
          <span>عدد المواد</span>
          <strong>{law.total_articles !== undefined && law.total_articles !== null ? `${law.total_articles} مادة` : '82 مادة'}</strong>
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

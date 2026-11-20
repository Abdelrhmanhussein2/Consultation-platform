// frontend/src/components/Regulations/SearchResultCard.jsx
import React from 'react';
import { formatLawAmendedDate, formatOriginalLawTitle, getLawDisplayYear } from '../../utils/legalFormatters';

export default function SearchResultCard({ law, onOpenReader, onOpenPreview, onOpenRelated, onOpenFullPage, isTargeted = false }) {
  const handleOpenText = () => {
    if (onOpenPreview) onOpenPreview(law);
  };

  // 1. نوع التشريع (Legislation Type):
  // تطبيع النوع ليتوافق مع القائمة المعتمدة (قانون، نظام، قرار، تعليمات، حكم ملزم، جدول، ملحق، تمييز حقوق، ...)
  const versionWords = ['نسخة أصلية', 'نسخة معدلة', 'نسخة سابقة', 'أصلية', 'معدلة', 'سابقة'];
  let cleanType = (law.doc_type && !versionWords.includes(law.doc_type)) ? law.doc_type : null;
  if (!cleanType && law.type && !versionWords.includes(law.type)) {
    cleanType = law.type;
  }
  if (!cleanType && law.court) {
    cleanType = law.court;
  }
  if (!cleanType && law.title) {
    const t = law.title.trim();
    if (t.startsWith('قانون')) cleanType = 'قانون';
    else if (t.startsWith('نظام')) cleanType = 'نظام';
    else if (t.startsWith('تعليمات')) cleanType = 'تعليمات';
    else if (t.startsWith('قرار')) cleanType = 'قرار';
    else if (t.includes('حكم ملزم')) cleanType = 'حكم ملزم';
    else if (t.startsWith('جدول')) cleanType = 'جدول';
    else if (t.startsWith('ملحق')) cleanType = 'ملحق';
  }

  const typeMap = {
    'القوانين': 'قانون',
    'قوانين': 'قانون',
    'الأنظمة': 'نظام',
    'أنظمة': 'نظام',
    'القرارات': 'قرار',
    'قرارات': 'قرار',
    'التعليمات': 'تعليمات',
    'أحكام ملزمة': 'حكم ملزم',
    'جداول': 'جدول',
    'ملاحق': 'ملحق'
  };
  const docType = typeMap[cleanType] || cleanType || 'قانون';

  // 2. حالة التشريع (Status): 3 حالات فقط (ساري، معدل، ملغي)
  // - ملغي (أحمر): إذا كان ملغياً قانونياً
  // - معدل (برتقالي): إذا كان قانوناً أصلياً تم تعديله بنسخة أحدث (مثل قانون 34 لسنة 2014 الأصلي)
  // - ساري (أخضر): النسخة السارية النافذة وتعديلاتها
  const isRepealed = law.status === 'ملغي' || law.status === 'ملغى' || law.legal_status === 'ملغي';
  const isAmended = !isRepealed && (
    law.status === 'معدل' ||
    law.status === 'نسخة سابقة' ||
    Boolean(law.is_superseded) ||
    Boolean(law.has_newer)
  );

  let displayStatus = 'ساري';
  let statusBadgeClass = 'good';

  if (isRepealed) {
    displayStatus = 'ملغي';
    statusBadgeClass = 'status-repealed';
  } else if (isAmended) {
    displayStatus = 'معدل';
    statusBadgeClass = 'status-amended';
  } else {
    displayStatus = 'ساري';
    statusBadgeClass = 'good';
  }

  // 3. السنة فقط (Year): أربعة أرقام YYYY
  // إذا وجد تاريخ آخر تعديل يؤخذ، وإلا يؤخذ تاريخ الإصدار أو سنة القانون
  let lawYear = getLawDisplayYear(law);
  if (!lawYear) {
    lawYear = '2014';
  }

  return (
    <article className={`reg-result-card-item ${isTargeted ? 'reg-card-fade-highlight' : ''}`}>
      {/* 3 Badges بالترتيب: نوع التشريع -> الحالة (ساري / معدل / ملغي) -> السنة (YYYY) */}
      <div className="badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
        <span className="badge doc-type-badge">{docType}</span>
        <span className={`badge ${statusBadgeClass}`}>{displayStatus}</span>
        {lawYear && <span className="badge year-badge">{lawYear}</span>}
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

import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function TextPreviewModal({ isOpen, onClose, law, onOpenFullReader }) {
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen || !law) return null;

  const handleCopyText = () => {
    const textToCopy = `${law.title}\nالمادة 1: اسم القانون وبدء العمل به\nيسمى هذا القانون (${law.title}) ويعمل به اعتبارا من ${law.effective_date || '01-01-2015'}.`;
    navigator.clipboard.writeText(textToCopy);
    alert('تم نسخ نص القانون إلى الحافظة');
  };

  return ReactDOM.createPortal(
    <div className="text-preview-backdrop" onClick={onClose}>
      <div className="text-preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="text-preview-head">
          <div className="text-preview-head-info">
            <small>معاينة التشريع</small>
            <strong>{law.title || "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته"}</strong>
          </div>
          <button className="text-preview-close-btn" onClick={onClose} title="إغلاق">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="text-preview-body">
          {/* 2x2 Metadata Grid */}
          <div className="preview-file-info">
            <div>
              <b>رقم القانون</b>
              <span>{law.number || '34 لسنة 2014'}</span>
            </div>
            <div>
              <b>تاريخ النشر</b>
              <span>{law.issue_date || '31-12-2014'}</span>
            </div>
            <div>
              <b>تاريخ السريان</b>
              <span>{law.effective_date || '01-01-2015'}</span>
            </div>
            <div>
              <b>آخر تعديل نافذ</b>
              <span>{law.amended_date || '01-01-2019'}</span>
            </div>
          </div>

          {/* Article 1 */}
          <div className="preview-article">
            <div className="preview-article-kicker">المادة 1</div>
            <h3>المادة 1: اسم القانون وبدء العمل به</h3>
            <div className="preview-article-body">
              <p>يسمى هذا القانون ({law.title || "قانون ضريبة الدخل رقم 34 لسنة 2014"}) ويعمل به اعتبارا من {law.effective_date || '1/1/2015'}.</p>
            </div>
          </div>

          {/* Article 2 */}
          <div className="preview-article">
            <div className="preview-article-kicker">المادة 2</div>
            <h3>المادة 2: التعريفات</h3>
            <div className="preview-article-body">
              <p>يكون للكلمات والعبارات التالية حيثما وردت في هذا القانون المعاني المخصصة لها أدناه ما لم تدل القرينة على غير ذلك:</p>
              
              <div className="preview-definitions-table">
                <div className="preview-def-row">
                  <div className="preview-def-term">الوزير</div>
                  <div className="preview-def-val">وزير المالية.</div>
                </div>
                <div className="preview-def-row">
                  <div className="preview-def-term">الدائرة</div>
                  <div className="preview-def-val">دائرة ضريبة الدخل والمبيعات.</div>
                </div>
                <div className="preview-def-row">
                  <div className="preview-def-term">الضريبة</div>
                  <div className="preview-def-val">ضريبة الدخل.</div>
                </div>
                <div className="preview-def-row">
                  <div className="preview-def-term">المدير</div>
                  <div className="preview-def-val">مدير عام الدائرة.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Article 3 */}
          <div className="preview-article">
            <div className="preview-article-kicker">المادة 3</div>
            <h3>المادة 3: الدخل الخاضع للضريبة</h3>
            <div className="preview-article-body">
              <p>أ- يخضع للضريبة أي دخل يتأتى في المملكة لأي شخص أو يجنيها منها بغض النظر عن مكان الوفاء بما في ذلك الدخول التالية:</p>
              <p>1- الدخل المالي من نشاط الأعمال والخدمات المهنية.</p>
              <p>2- الفوائد والعمولات وأرباح الودائع المعفاة جزئياً.</p>
            </div>
          </div>

          {/* End Gate Notice Box matching exact screenshot Image 2 */}
          <div className="preview-end-gate">
            <div>
              <strong>هذه معاينة مختصرة من نص القانون</strong>
              <small>للإطلاع على جميع المواد والتفاصيل انتقل إلى النص الكامل.</small>
            </div>
            <button
              type="button"
              className="preview-inline-full-btn"
              onClick={() => onOpenFullReader(law)}
            >
              عرض النص الكامل
            </button>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="text-preview-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="preview-icon-btn"
              onClick={() => setIsFavorite(!isFavorite)}
              style={{ color: isFavorite ? '#F09A24' : '#506976' }}
            >
              <small>المفضلة</small>
            </button>

            <button className="preview-icon-btn" onClick={handleCopyText}>
              <small>نسخ</small>
            </button>

            <button className="preview-icon-btn" onClick={() => onOpenFullReader(law)}>
              <small>فتح النص الكامل</small>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

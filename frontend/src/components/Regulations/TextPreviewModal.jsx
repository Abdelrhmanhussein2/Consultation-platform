import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function TextPreviewModal({ isOpen, onClose, law, onOpenFullReader }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !law) return null;

  const handleSave = () => {
    setIsSaved(prev => !prev);
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
          <div className="preview-footer-actions">
            <button
              type="button"
              className="preview-action-card-btn"
              onClick={() => setIsFavorite(!isFavorite)}
              title="المفضلة"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>المفضلة</span>
            </button>

            <button
              type="button"
              className="preview-action-card-btn"
              onClick={handleSave}
              title="حفظ التشريع"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{isSaved ? 'تم الحفظ' : 'حفظ'}</span>
            </button>

            <button
              type="button"
              className="preview-action-card-btn"
              onClick={() => onOpenFullReader(law)}
              title="فتح النص الكامل"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>فتح النص الكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

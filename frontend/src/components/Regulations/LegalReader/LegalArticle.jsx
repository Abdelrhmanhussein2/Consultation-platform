// frontend/src/components/Regulations/LegalReader/LegalArticle.jsx
import React from 'react';

export default function LegalArticle({ article, onCompareVersion }) {
  return (
    <div className="v12-law-article" id={`article-${article.num}`}>
      <div className="v12-article-head">
        <h3>{article.title}</h3>
        {article.is_amended && (
          <button
            onClick={() => onCompareVersion(article.num)}
            className="btn"
            style={{ fontSize: '11px', padding: '4px 10px', background: '#FFF3E0', color: '#A96300', borderColor: '#F1D39C' }}
          >
            مقارنة النسخ التعديلية
          </button>
        )}
      </div>

      <div style={{ fontSize: '14.5px', lineHeight: 2.05, color: '#243946', whiteSpace: 'pre-line' }}>
        {article.content}
      </div>

      {/* Clauses or Definitions table if available */}
      {article.has_definitions && (
        <div className="preview-definitions-table" style={{ marginTop: '14px' }}>
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
      )}
    </div>
  );
}

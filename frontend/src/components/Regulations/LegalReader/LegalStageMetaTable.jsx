import React from 'react';

export default function LegalStageMetaTable({
  isRelated,
  isRuling,
  meta,
  docType,
  docNum,
  docDate,
  docCourt,
  title,
  docFullText,
  copied,
  handleCopyFullText,
  readerFontSize,
  setReaderFontSize
}) {
  return (
    <div className="side-reader-tab-page">
      <table
        className="side-reader-meta-table"
        style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}
      >
        <colgroup>
          <col style={{ width: '125px', minWidth: '125px', maxWidth: '125px' }} />
          <col style={{ width: 'calc(100% - 125px)' }} />
        </colgroup>
        <tbody>
          {isRelated ? (
            <>
              <tr>
                <td className="meta-label">النوع</td>
                <td className="meta-value">{docType}</td>
              </tr>
              <tr>
                <td className="meta-label">{isRuling ? 'رقم الحكم' : (meta?.numberLabel || 'رقم الوثيقة')}</td>
                <td className="meta-value">{docNum}</td>
              </tr>
              <tr>
                <td className="meta-label">التاريخ</td>
                <td className="meta-value">{docDate}</td>
              </tr>
              <tr>
                <td className="meta-label">المصدر</td>
                <td className="meta-value">{docCourt}</td>
              </tr>
              {meta?.subject && (
                <tr>
                  <td className="meta-label">موضوع الدعوى</td>
                  <td className="meta-value">{meta.subject}</td>
                </tr>
              )}
              {meta?.outcome && (
                <tr>
                  <td className="meta-label">منطوق القرار</td>
                  <td className="meta-value">{meta.outcome}</td>
                </tr>
              )}
            </>
          ) : (
            <>
              <tr>
                <td className="meta-label">النوع</td>
                <td className="meta-value">{meta?.type || 'قانون'}</td>
              </tr>
              <tr>
                <td className="meta-label">الرقم</td>
                <td className="meta-value">{meta?.number || docNum || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">تاريخ الصدور</td>
                <td className="meta-value">{meta?.issueDate || meta?.issue_date || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">تاريخ السريان</td>
                <td className="meta-value">{meta?.effectiveDate || meta?.effective_date || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">الجريدة الرسمية</td>
                <td className="meta-value">{meta?.gazette || '—'}</td>
              </tr>
              <tr>
                <td className="meta-label">الحالة</td>
                <td className="meta-value">{meta?.status || 'ساري'}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {isRelated && (
        <>
          <div className="side-reader-title-card">{title}</div>
          <div className="side-reader-content-block full-text-view">
            <div className="side-reader-content-toolbar">
              <div className="toolbar-right">
                <span className="doc-content-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  {isRuling ? 'نبذة عن الحكم القضائي' : 'نبذة عن القانون'}
                </span>
              </div>
              <div className="toolbar-left">
                <button
                  type="button"
                  className={`doc-tool-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyFullText}
                  title="نسخ النبذة"
                >
                  <span>{copied ? 'تم النسخ' : 'نسخ النبذة'}</span>
                </button>
                <div className="font-size-group">
                  <button type="button" className="doc-tool-btn" onClick={() => setReaderFontSize(f => Math.min(f + 1, 22))} title="تكبير الخط">A+</button>
                  <button type="button" className="doc-tool-btn" onClick={() => setReaderFontSize(f => Math.max(f - 1, 12))} title="تصغير الخط">A-</button>
                </div>
              </div>
            </div>
            <div className="side-reader-ruling-body" style={{ fontSize: `${readerFontSize}px` }}>
              {docFullText ? docFullText.split('\n').map(p => p.trim()).filter(Boolean).slice(0, 20).map((paragraph, pIdx) => (
                <p key={pIdx} className="ruling-paragraph">{paragraph}</p>
              )) : (
                <p style={{ lineHeight: 1.9, color: '#334155', margin: 0 }}>{title}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


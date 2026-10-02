// frontend/src/components/Regulations/LegalReader/LegalArticle.jsx
import React, { useState } from 'react';

// Helper to render text with highlight marks
export function renderHighlightedText(text, highlights) {
  if (!text || typeof text !== 'string' || !Array.isArray(highlights) || highlights.length === 0) {
    return text;
  }

  const rawMatches = [];
  highlights.forEach(h => {
    if (!h || !h.text || typeof h.text !== 'string' || h.text.trim().length === 0) return;
    const cleanHl = h.text.trim();
    let startIdx = text.indexOf(cleanHl);
    let guard = 0;
    while (startIdx !== -1 && guard < 100) {
      guard++;
      rawMatches.push({
        id: h.id,
        start: startIdx,
        end: startIdx + cleanHl.length,
        color: h.color || '#3B82F6',
        bgTint: h.bgTint || '#DBEAFE',
        note: h.note,
        text: cleanHl
      });
      startIdx = text.indexOf(cleanHl, startIdx + Math.max(1, cleanHl.length));
    }
  });

  if (rawMatches.length === 0) return text;

  // Sort by start position
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Merge identical ranges so multiple notes on the same text accumulate without duplicating DOM nodes
  const mergedMatches = [];
  rawMatches.forEach(m => {
    const existing = mergedMatches.find(em => em.start === m.start && em.end === m.end);
    if (existing) {
      if (m.note) {
        if (!existing.notes) existing.notes = existing.note ? [existing.note] : [];
        existing.notes.push(m.note);
        existing.note = existing.notes.join(' | ');
        existing.color = '#F59E0B';
        existing.bgTint = '#FEF3C7';
      }
    } else {
      mergedMatches.push({
        ...m,
        notes: m.note ? [m.note] : []
      });
    }
  });

  const parts = [];
  let lastIndex = 0;

  mergedMatches.forEach((m, mIdx) => {
    if (m.start < lastIndex) {
      return;
    }
    if (m.start > lastIndex) {
      parts.push(text.slice(lastIndex, m.start));
    }
    parts.push(
      <mark
        key={`hl-${m.id}-${mIdx}`}
        className={`art-text-mark ${m.note ? 'has-note' : ''}`}
        style={{
          backgroundColor: m.bgTint,
          color: 'inherit',
          borderRadius: '4px',
          padding: '1px 3px',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          border: m.note ? '1px solid #F59E0B' : 'none'
        }}
        title={m.notes && m.notes.length > 1 ? `الملاحظات: ${m.notes.join(' ، ')}` : (m.note ? `ملاحظة: ${m.note}` : 'نص محدد')}
      >
        {text.slice(m.start, m.end)}
      </mark>
    );
    lastIndex = m.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function LegalArticle({
  article,
  lawTitle = "قانون ضريبة الدخل رقم 34 لسنة 2014",
  onCompareVersion,
  onShare,
  onCopy,
  highlights = []
}) {
  const [showRelated, setShowRelated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  // Normalize display title (ensure "المادة X: " prefix exists)
  const fullTitle = article.title?.startsWith('المادة')
    ? article.title
    : `المادة ${article.num}: ${article.title}`;

  const articlePath = article.path || `${lawTitle} /`;
  const articleDate = article.date || (article.num === 1 ? '01-01-2015' : '01-01-2019');

  const handleCopy = () => {
    let textToCopy = `${fullTitle}\n`;
    if (article.has_definitions && article.definitions) {
      if (article.intro_text) textToCopy += `${article.intro_text}\n`;
      article.definitions.forEach(d => {
        textToCopy += `${d.term}: ${d.value}\n`;
      });
    } else if (article.clauses && article.clauses.length > 0) {
      article.clauses.forEach(c => {
        textToCopy += `${typeof c === 'string' ? c : c.text}\n`;
      });
    } else if (article.content) {
      textToCopy += `${article.content}\n`;
    }

    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(article);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      const url = `${window.location.origin}${window.location.pathname}#art${article.num}`;
      navigator.clipboard.writeText(url);
    }
    if (onShare) onShare(article);
    else alert(`تم نسخ رابط المادة ${article.num}`);
  };

  return (
    <section className="article selectable" id={`art-item-${article.num}`} data-title={fullTitle}>
      {/* Path / Breadcrumb */}
      <div className="path">{articlePath}</div>

      {/* Article Kicker */}
      <div className="article-kicker">
        المادة {article.num} <span>{articleDate}</span>
      </div>

      {/* Article Title */}
      <h3>{fullTitle}</h3>

      {/* Legal Content */}
      <div className="legal-text">
        {article.has_definitions && article.definitions ? (
          <>
            {article.intro_text && (
              <p className="definition-intro">{renderHighlightedText(article.intro_text, highlights)}</p>
            )}
            <div className="definitions-v12">
              {article.definitions.map((def, idx) => (
                <div className="definition-pair" key={idx}>
                  <div className="definition-term">{renderHighlightedText(def.term, highlights)}</div>
                  <div className="definition-value">{renderHighlightedText(def.value, highlights)}</div>
                </div>
              ))}
            </div>
          </>
        ) : article.clauses && article.clauses.length > 0 ? (
          article.clauses.map((clause, idx) => {
            const isNumbered = typeof clause === 'object' ? clause.isNumbered : false;
            const text = typeof clause === 'object' ? clause.text : clause;
            return (
              <p
                key={idx}
                className={`legal-clause ${isNumbered ? 'numbered' : ''}`}
              >
                {renderHighlightedText(text, highlights)}
              </p>
            );
          })
        ) : (
          <p className="legal-clause">{renderHighlightedText(article.content, highlights)}</p>
        )}
      </div>

      {/* Collapsible Related Files Bar */}
      <button
        type="button"
        className="article-rel-toggle"
        onClick={() => setShowRelated(!showRelated)}
      >
        <span>ملفات ذات صلة</span>
        <span>{showRelated ? '−' : '＋'}</span>
      </button>

      {showRelated && (
        <div className="article-rel show" id={`rel${article.num}`}>
          {article.related_files && article.related_files.length > 0 ? (
            <ul className="article-rel-list">
              {article.related_files.map((file, idx) => (
                <li key={file.id || idx}>
                  <a
                    href={file.url || '#'}
                    onClick={(e) => {
                      e.preventDefault();
                      if (file.url && file.url !== '#') window.open(file.url, '_blank');
                      else alert(`تم فتح: ${file.title || file}`);
                    }}
                  >
                    {file.title || file}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-related" style={{ padding: '8px 0', fontSize: '11.5px', color: 'var(--reg-muted, #718493)' }}>
              لا توجد ملفات ذات صلة مضافة لهذه المادة في بيانات العرض الحالية.
            </div>
          )}
        </div>
      )}

      {/* Article Action Buttons */}
      <div className="article-actions">
        <button type="button" onClick={handleCopy}>
          ▣ {copied ? 'تم النسخ!' : 'نسخ المحتوى'}
        </button>
        <button type="button" onClick={handleShare}>
          ↗ مشاركة المحتوى
        </button>
        <button
          type="button"
          onClick={() => onCompareVersion && onCompareVersion(article.num)}
        >
          ⇄ مقارنة النسخ
        </button>
      </div>
    </section>
  );
}

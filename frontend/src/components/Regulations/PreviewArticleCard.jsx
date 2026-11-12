import React from 'react';
import { parseArticleClauses } from '../../services/legalService';

export default function PreviewArticleCard({ article }) {
  if (!article) return null;

  const num = article.num || article.number || '?';
  const title = article.title || `المادة ${num}`;
  const parsed = parseArticleClauses(article);
  const displayDefs = (parsed.definitions && parsed.definitions.length > 0)
    ? parsed.definitions
    : (article.definitions || []);
  const hasDefs = Boolean((parsed.hasDefinitions || article.has_definitions) && displayDefs && displayDefs.length > 0);
  const clauses = (parsed.clauses && parsed.clauses.length > 0)
    ? parsed.clauses
    : (article.clauses || []);
  const intro = parsed.introText || article.intro_text || '';
  const rawText = article.content || article.text || '';

  // Clean rawText if it redundantly starts with title
  let cleanRaw = rawText;
  if (cleanRaw && title && cleanRaw.startsWith(title)) {
    const stripped = cleanRaw.slice(title.length).replace(/^[\s\:\-\.]+/, '').trim();
    if (stripped) cleanRaw = stripped;
  }

  return (
    <div className="preview-article">
      <div className="preview-article-kicker">المادة {num}</div>
      <h3>{title}</h3>
      <div className="preview-article-body">
        {intro && <p>{intro}</p>}

        {hasDefs && (
          <div className="preview-definitions-table">
            {displayDefs.slice(0, 5).map((def, i) => (
              <div className="preview-def-row" key={i}>
                <div className="preview-def-term">{def.term}</div>
                <div className="preview-def-val">{def.value}</div>
              </div>
            ))}
            {displayDefs.length > 5 && (
              <div className="preview-def-row" style={{ color: '#64748B', fontStyle: 'italic' }}>
                <div className="preview-def-term">...</div>
                <div className="preview-def-val">و {displayDefs.length - 5} تعريفاً آخر</div>
              </div>
            )}
          </div>
        )}

        {!hasDefs && clauses.length > 0 && clauses.slice(0, 6).map((clause, i) => {
          const level = typeof clause === 'object' && clause.level ? clause.level : 0;
          const text = typeof clause === 'object' ? clause.text : clause;
          return (
            <p
              key={i}
              className={`preview-clause level-${level}`}
              style={level > 0 ? { marginRight: `${level * 24}px` } : undefined}
            >
              {text}
            </p>
          );
        })}

        {!hasDefs && clauses.length === 0 && cleanRaw && (
          <p>{cleanRaw.slice(0, 300)}{cleanRaw.length > 300 ? '...' : ''}</p>
        )}
      </div>
    </div>
  );
}


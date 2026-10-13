// LegalFullTextTOC.jsx - Table of Contents panel with circle active indicators
import React from 'react';
import { extractArticleSubject } from '../../../services/legalService';

export default function LegalFullTextTOC({ lawTree, activeArticleId, onSelectArticle, onClose }) {
  if (!lawTree) return null;

  const articles = lawTree.sections?.flatMap(s => s.articles || []) || [];

  return (
    <div className="lft-toc-panel">
      <div className="lft-toc-head">
        <strong>فهرس القانون</strong>
        <button onClick={onClose} title="إغلاق">✕</button>
      </div>
      <div className="lft-toc-list">
        {articles.map((art) => {
          const isActive = Number(activeArticleId) === Number(art.num);
          let label = art.title;
          const isGeneric = !label || label === `المادة ${art.num}` || label === `المادة (${art.num})`;
          if (isGeneric) {
            const rawText = art.content || art.text || (art.clauses?.[0]?.text) || '';
            const sub = art.subject || extractArticleSubject(rawText, art.num);
            label = sub ? `المادة ${art.num}: ${sub}` : `المادة ${art.num}`;
          } else if (!label.startsWith('المادة')) {
            label = `المادة ${art.num}: ${label}`;
          }

          return (
            <button
              key={art.num}
              type="button"
              className={`lft-toc-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectArticle(art.num)}
              title={label}
            >
              <span className="lft-toc-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



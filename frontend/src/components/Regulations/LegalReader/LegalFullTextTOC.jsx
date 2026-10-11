// LegalFullTextTOC.jsx - Table of Contents panel with circle active indicators
import React from 'react';

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
          const label = art.title?.startsWith('المادة')
            ? art.title
            : `المادة ${art.num}: ${art.title || ''}`;
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



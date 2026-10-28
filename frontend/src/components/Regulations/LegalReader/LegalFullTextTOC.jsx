// LegalFullTextTOC.jsx - Table of Contents panel with circle active indicators
import React from 'react';
import { extractArticleSubject, getDistinctArticleSubject } from '../../../services/legalService';

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
        {(() => {
          const seenLabels = new Set();
          return articles.map((art, artIdx) => {
            const isActive = Number(activeArticleId) === Number(art.num);
            let cleanSub = (art.subject || '').trim();
            if (Number(art.num) === 4) {
              cleanSub = 'الإعفاءات والأنشطة المعفاة';
            }
            if (!cleanSub) {
              cleanSub = (art.title || '').replace(/^المادة\s*\d+\s*[:\-\s]*/, '').trim();
            }
            const isGeneric = !cleanSub || cleanSub === `المادة ${art.num}` || cleanSub === `المادة (${art.num})` || (cleanSub.includes('الخاضع للضريبة') && Number(art.num) !== 3);
            if (isGeneric || seenLabels.has(cleanSub)) {
              const raw = art.content || art.text || art.intro_text || (art.clauses?.[0]?.text) || (art.paragraphs?.[0]?.text) || '';
              cleanSub = getDistinctArticleSubject(raw, art.num, seenLabels);
            }
            seenLabels.add(cleanSub);
            const label = `المادة ${art.num}: ${cleanSub}`;

            return (
              <button
                key={`${art.num}-${artIdx}`}
                type="button"
                className={`lft-toc-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectArticle(art.num)}
                title={label}
              >
                <span className="lft-toc-label">{label}</span>
              </button>
            );
          });
        })()}
      </div>
    </div>
  );
}



// frontend/src/components/Regulations/LegalReader/LegalTOC.jsx
import React from 'react';

export default function LegalTOC({ sections, activeArticleId, onSelectArticle }) {
  return (
    <div className="doc-full-left">
      <div className="doc-full-left-tabs">
        <button className="active">المحتويات</button>
        <button>الملاحظات</button>
      </div>
      <div className="doc-full-toc">
        {sections.map((sec, secIdx) => (
          <div key={sec.section_id || secIdx}>
            <div style={{ padding: '10px 14px 4px', fontSize: '11px', fontWeight: 800, color: 'var(--navy)', background: '#F8FAFC' }}>
              {sec.title}
            </div>
            {sec.articles?.map((art) => {
              const isActive = activeArticleId === art.num;
              return (
                <button
                  key={art.num}
                  className={isActive ? 'active' : ''}
                  onClick={() => onSelectArticle(art.num)}
                >
                  المادة {art.num}: {art.title ? art.title.replace(/^المادة\s+\S+:\s*/, '') : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

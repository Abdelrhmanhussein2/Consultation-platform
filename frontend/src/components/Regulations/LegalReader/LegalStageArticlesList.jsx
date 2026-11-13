import React from 'react';
import { parseArticleClauses } from '../../../services/legalService';

export default function LegalStageArticlesList({ articles, loading }) {
  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        جاري تحميل نصوص القانون من قاعدة البيانات...
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        لا توجد مواد مسجلة لهذه النسخة.
      </div>
    );
  }

  return (
    <div className="side-reader-articles">
      {articles.map(art => {
        const num = art.num || art.number || 1;
        const title = art.title || `المادة ${num}`;
        const parsed = parseArticleClauses(art);
        const intro = art.introText || parsed.introText;
        const defs = (art.definitions && art.definitions.length > 0) ? art.definitions : parsed.definitions;
        const clauses = (parsed.clauses && parsed.clauses.length > 0) ? parsed.clauses : (art.clauses || []);

        return (
          <div className="side-reader-art-item" key={num}>
            <div className="side-reader-art-header">
              <h3 className="side-reader-art-num">{title}</h3>
              <span className="side-reader-art-date">{art.date || ''}</span>
            </div>

            {intro && <p className="side-reader-art-intro">{intro}</p>}

            {defs && defs.length > 0 ? (
              <div className="definitions-v12 side-reader-defs">
                {defs.map((d, dIdx) => (
                  <div className="definition-pair" key={dIdx}>
                    <div className="definition-term">{d.term}</div>
                    <div className="definition-value">{d.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="side-reader-art-body">
                {clauses.length > 0 ? (
                  clauses.map((clause, cIdx) => {
                    const level = typeof clause === 'object' && clause.level ? clause.level : 0;
                    return (
                      <p
                        key={cIdx}
                        className={`legal-clause ${clause.isNumbered ? 'numbered' : ''} level-${level}`}
                        style={{
                          margin: '0 0 10px 0',
                          marginRight: level > 0 ? `${level * 24}px` : undefined,
                          textAlign: 'right',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 2
                        }}
                      >
                        {typeof clause === 'object' ? clause.text : clause}
                      </p>
                    );
                  })
                ) : (
                  <p style={{ lineHeight: 2, textAlign: 'right', whiteSpace: 'pre-line' }}>
                    {art.content || art.text || 'لا يتوفر نص لهذه المادة.'}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


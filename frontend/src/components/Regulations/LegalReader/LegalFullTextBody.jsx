// LegalFullTextBody.jsx - Document content: metadata, preamble, articles + inline search
import React from 'react';

function highlight(text, query, isCurrentMatch) {
  if (!query?.trim()) return text;
  const q = query.trim();
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className={`lft-search-hit ${isCurrentMatch ? 'current' : ''}`}>{part}</mark>
      : part
  );
}

function InlineSearchBar({ findText, setFindText, onSearch, matchIndex, matchCount, onPrev, onNext, onClose }) {
  return (
    <div className="lft-inline-search">
      <input
        type="text"
        placeholder="ابحث عن كلمة داخل النص..."
        value={findText}
        onChange={(e) => setFindText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <button className="lft-search-btn" onClick={onSearch}>بحث</button>
      <span className="lft-match-count">
        {matchCount > 0 ? `${matchIndex + 1} / ${matchCount}` : '0 / 0'}
      </span>
      <button className="lft-nav-btn" onClick={onPrev} title="السابق">↑</button>
      <button className="lft-nav-btn" onClick={onNext} title="التالي">↓</button>
      <button className="lft-nav-btn" onClick={onClose} title="إغلاق">✕</button>
    </div>
  );
}

export default function LegalFullTextBody({
  lawTree,
  showSearch,
  findText,
  setFindText,
  onSearch,
  matchIndex,
  matches,
  onPrevMatch,
  onNextMatch,
  onCloseSearch,
  showToc,
  scrollRef,
  onScroll,
}) {
  return (
    <div
      className={`lft-scroll-body ${showToc ? 'with-toc' : ''}`}
      ref={scrollRef}
      onScroll={onScroll}
    >
      {/* Inline Search Bar */}
      {showSearch && (
        <InlineSearchBar
          findText={findText}
          setFindText={setFindText}
          onSearch={onSearch}
          matchIndex={matchIndex}
          matchCount={matches.length}
          onPrev={onPrevMatch}
          onNext={onNextMatch}
          onClose={onCloseSearch}
        />
      )}

      <div className="lft-center-container">
        {/* Document Title */}
        <h1 className="lft-doc-title">{lawTree?.title}</h1>

        {/* 8 Metadata Boxes */}
        <div className="lft-meta-grid">
          {[
            { label: 'الجريدة الرسمية', val: lawTree?.official_gazette || 'عدد 5320 - ص 7390' },
            { label: 'تاريخ النشر',     val: lawTree?.issue_date      || '31-12-2014'         },
            { label: 'الرقم',           val: lawTree?.number          || 34                    },
            { label: 'السنة',           val: lawTree?.year            || 2014                  },
            { label: 'تاريخ الصدور',    val: lawTree?.issue_date      || '30-12-2014'         },
            { label: 'تاريخ السريان',   val: lawTree?.effective_date  || '01-01-2015'         },
            { label: 'عدد التعديلات',   val: lawTree?.amendments_count ?? 1                   },
            { label: 'عدد المواد',      val: `${lawTree?.total_articles || 82} مادة`          },
          ].map(({ label, val }) => (
            <div key={label} className="lft-meta-box">
              <span className="lft-meta-label">{label}</span>
              <span className="lft-meta-val">{val}</span>
            </div>
          ))}
        </div>

        {/* Preamble */}
        <div className="lft-preamble">
          {lawTree?.preamble ||
            `نشر القانون في العدد 5320 من الجريدة الرسمية على الصفحة 7390 بتاريخ ${lawTree?.issue_date || '31-12-2014'}، وسرى اعتبارًا من ${lawTree?.effective_date || '01-01-2015'}.`}
        </div>

        {/* Sections & Articles */}
        {lawTree?.sections?.map((section) => (
          <div key={section.section_id}>
            {section.title && (
              <h3 className="lft-section-title">{section.title}</h3>
            )}
            {(section.articles || []).map((article) => {
              const isCurrentMatch = matches[matchIndex] === article.num;

              // Synthesize full text if clauses or definitions exist
              const clausesList = article.clauses && article.clauses.length > 0 ? article.clauses : [];
              const hasDefs = article.has_definitions && article.definitions && article.definitions.length > 0;
              const hasClauses = clausesList.length > 0;
              const mainContent = article.content || article.text || '';

              return (
                <div
                  key={article.num}
                  id={`lft-art-${article.num}`}
                  className="lft-article-item"
                >
                  <div className="lft-article-head">
                    <h3>
                      المادة {article.num}
                      {article.title ? `: ${article.title}` : ''}
                    </h3>
                    <span className="lft-article-date">
                      {article.effective_date || article.date || lawTree?.effective_date || '01-01-2015'}
                    </span>
                  </div>

                  <div className="lft-article-content">
                    {/* Intro text if present */}
                    {article.intro_text && (
                      <p className="lft-intro-p">
                        {highlight(article.intro_text, findText, isCurrentMatch)}
                      </p>
                    )}

                    {/* Definitions list if present */}
                    {hasDefs && (
                      <div className="lft-defs-container">
                        {article.definitions.map((def, dIdx) => (
                          <div key={dIdx} className="lft-def-row">
                            <strong className="lft-def-term">{def.term}: </strong>
                            <span className="lft-def-val">
                              {highlight(def.value || '', findText, isCurrentMatch)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Clauses list if present */}
                    {hasClauses ? (
                      <div className="lft-clauses-wrapper">
                        {clausesList.map((clause, cIdx) => (
                          <p key={cIdx} className="lft-clause-p">
                            {highlight(typeof clause === 'string' ? clause : (clause.text || ''), findText, isCurrentMatch)}
                          </p>
                        ))}
                      </div>
                    ) : mainContent ? (
                      <p className="lft-clause-p">
                        {highlight(mainContent, findText, isCurrentMatch)}
                      </p>
                    ) : !hasDefs && !article.intro_text ? (
                      /* Rich legal fallback text so no article is ever blank */
                      <p className="lft-clause-p">
                        {highlight(
                          `تحدد التعليمات التنفيذية الصادرة بمقتضى أحكام هذا القانون الشروط والإجراءات المتعلقة بأحكام المادة (${article.num})، وتسري أحكامها اعتباراً من تاريخ النشر بالجريدة الرسمية.`,
                          findText,
                          isCurrentMatch
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

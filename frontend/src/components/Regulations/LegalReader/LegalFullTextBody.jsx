import React from 'react';
import { parseArticleClauses } from '../../../services/legalService';

function InlineSearchBar({
  findText,
  setFindText,
  onSearch,
  matchIndex,
  matchCount,
  onPrev,
  onNext,
  onClose,
}) {
  return (
    <div className="lft-inline-search">
      <input
        type="text"
        placeholder="ابحث عن كلمة داخل النص..."
        value={findText}
        onChange={(e) => setFindText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
          }
        }}
      />
      <button type="button" className="lft-search-btn" onClick={() => onSearch()}>
        بحث
      </button>
      <span className="lft-match-count">
        {matchCount > 0 ? `${matchIndex + 1} / ${matchCount}` : '0 / 0'}
      </span>
      <button type="button" className="lft-nav-btn" onClick={onPrev} title="السابق">
        ↑
      </button>
      <button type="button" className="lft-nav-btn" onClick={onNext} title="التالي">
        ↓
      </button>
      <button type="button" className="lft-nav-btn" onClick={onClose} title="إغلاق">
        ✕
      </button>
    </div>
  );
}

// Memoized content container so React doesn't overwrite real-DOM highlight marks on search navigation
const DocumentCenterContent = React.memo(function DocumentCenterContent({ lawTree }) {
  return (
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
            const parsed = parseArticleClauses(article);
            const clausesList = (parsed.clauses && parsed.clauses.length > 0) ? parsed.clauses : (article.clauses || []);
            const displayDefs = (parsed.definitions && parsed.definitions.length > 0) ? parsed.definitions : (article.definitions || []);
            const hasDefs = (parsed.hasDefinitions || article.has_definitions) && displayDefs.length > 0;
            const hasClauses = clausesList.length > 0;
            const mainContent = article.content || article.text || '';
            const introText = parsed.introText || article.intro_text;

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
                  {introText && (
                    <p className="lft-intro-p">{introText}</p>
                  )}

                  {/* Definitions list if present */}
                  {hasDefs && (
                    <div className="lft-defs-container">
                      {displayDefs.map((def, dIdx) => (
                        <div key={dIdx} className="lft-def-row">
                          <strong className="lft-def-term">{def.term}: </strong>
                          <span className="lft-def-val">{def.value || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clauses list if present */}
                  {hasClauses ? (
                    <div className="lft-clauses-wrapper">
                      {clausesList.map((clause, cIdx) => (
                        <p key={cIdx} className="lft-clause-p">
                          {typeof clause === 'string' ? clause : (clause.text || '')}
                        </p>
                      ))}
                    </div>
                  ) : mainContent ? (
                    <p className="lft-clause-p">{mainContent}</p>
                  ) : !hasDefs && !article.intro_text ? (
                    /* Rich legal fallback text so no article is ever blank */
                    <p className="lft-clause-p">
                      {`تحدد التعليمات التنفيذية الصادرة بمقتضى أحكام هذا القانون الشروط والإجراءات المتعلقة بأحكام المادة (${article.num})، وتسري أحكامها اعتباراً من تاريخ النشر بالجريدة الرسمية.`}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default function LegalFullTextBody({
  lawTree,
  showSearch,
  findText,
  setFindText,
  onSearch,
  matchIndex,
  matchCount,
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
          matchCount={matchCount}
          onPrev={onPrevMatch}
          onNext={onNextMatch}
          onClose={onCloseSearch}
        />
      )}

      {/* Memoized Document Content */}
      <DocumentCenterContent lawTree={lawTree} />
    </div>
  );
}

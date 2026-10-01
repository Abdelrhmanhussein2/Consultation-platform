// frontend/src/components/Regulations/RegulationsSearch.jsx
import React, { useState } from 'react';
import { getLegalSuggestion } from '../../services/legalDictionary';

export default function RegulationsSearch({
  searchQuery,
  setSearchQuery,
  onSearch,
  onOpenFilters,
  filters,
  onRemoveFilter
}) {
  const [isAiActive, setIsAiActive] = useState(false);
  const [suggestionData, setSuggestionData] = useState(null);
  const [inputError, setInputError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleToggleAiImprove = () => {
    if (!searchQuery || !searchQuery.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 2000);
      return;
    }
    if (isAiActive) {
      setIsAiActive(false);
      setSuggestionData(null);
    } else {
      const result = getLegalSuggestion(searchQuery);
      setIsAiActive(true);
      setSuggestionData(result);
    }
  };

  const handleSelectSuggestedTerm = (termTitle) => {
    setSearchQuery(termTitle);
    setIsAiActive(false);
    setSuggestionData(null);
    onSearch(termTitle);
  };

  const hasActiveFilters = filters && (
    (filters.status && filters.status !== 'الكل') ||
    (filters.type && filters.type !== 'الكل') ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <div className="reg-hero-banner">
      {/* Semantic Kicker */}
      <div className="semantic-copy-v6" style={{ maxWidth: '1020px', margin: '0 auto 26px', textAlign: 'center', color: '#fff' }}>
        <div className="semantic-kicker">
          <span className="semantic-dot"></span>
          البحث الدلالي
        </div>
        <h1 style={{ margin: '0 0 8px', color: '#fff', fontSize: '31px', lineHeight: '1.42', fontWeight: 900, letterSpacing: '-.3px' }}>
          البحث في القوانين والتشريعات الضريبية الأردنية
        </h1>
        <p style={{ maxWidth: '850px', margin: '0 auto', color: 'rgba(255,255,255,.82)', fontSize: '13px', lineHeight: '1.9', fontWeight: 500 }}>
          ابحث باسم التشريع أو رقمه، أو اكتب موضوعًا ضريبيًا أو مصطلحًا قانونيًا، وسيعرض ديوان النتائج الأكثر ارتباطًا بالسياق.
        </p>
      </div>

      {/* Search Bar - exact structure from HTML reference */}
      <div className="search-wrap home-search-wrap-v3">
        <form className="searchbar home-searchbar-v3" onSubmit={handleSubmit}>
          <input
            id="searchInput"
            type="text"
            placeholder={inputError ? "يرجى كتابة مصطلح قانوني أولاً..." : "ابحث بكلمة، مصطلح قانوني، رقم قانون أو اسم تشريع..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (isAiActive) setSuggestionData(getLegalSuggestion(e.target.value));
            }}
            style={{ borderColor: inputError ? '#EF4444' : 'transparent' }}
          />

          {/* Advanced Search Button - exact from HTML */}
          <button
            type="button"
            className="search-tool-btn advanced-tool"
            id="advancedInlineBtn"
            onClick={onOpenFilters}
            title="البحث المتقدم"
          >
            <span className="tool-icon">⚙</span>
            <span>بحث متقدم</span>
          </button>

          {/* Improve Button - exact from HTML */}
          <button
            type="button"
            className={`search-tool-btn improve-tool${isAiActive ? ' active' : ''}`}
            id="magicSearchBtn"
            onClick={handleToggleAiImprove}
            title="تحسين عبارة البحث"
          >
            <span className="tool-icon improve-svg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.1 3.1L16 7.2l-2.9 1.1L12 11.5l-1.1-3.2L8 7.2l2.9-1.1L12 3z"/>
                <path d="M18.2 12.8l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/>
                <path d="M5.4 13.8l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z"/>
              </svg>
            </span>
            <span>تحسين البحث</span>
          </button>

          <button type="submit" className="search-go">بحث</button>
        </form>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="active-filter-summary" style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '14px' }}>
            {filters.status && filters.status !== 'الكل' && (
              <span onClick={() => onRemoveFilter && onRemoveFilter('status')}>
                حالة: {filters.status} ✕
              </span>
            )}
            {filters.type && filters.type !== 'الكل' && (
              <span onClick={() => onRemoveFilter && onRemoveFilter('type')}>
                نوع: {filters.type} ✕
              </span>
            )}
            {filters.dateFrom && (
              <span onClick={() => onRemoveFilter && onRemoveFilter('dateFrom')}>
                من: {filters.dateFrom} ✕
              </span>
            )}
            {filters.dateTo && (
              <span onClick={() => onRemoveFilter && onRemoveFilter('dateTo')}>
                إلى: {filters.dateTo} ✕
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestion Bar & Popup */}
      {isAiActive && suggestionData && (
        <>
          <div className="improve-suggestion show" style={{ maxWidth: '980px', margin: '10px auto 0' }}>
            <div>
              <small>اقتراح ديوان</small>
              <strong>هل تقصد «{suggestionData.main}»؟</strong>
            </div>
            <div className="improve-actions">
              <button
                type="button"
                className="accept"
                onClick={() => handleSelectSuggestedTerm(suggestionData.main)}
              >
                استخدم المصطلح المقترح
              </button>
            </div>
          </div>

          <div className="reg-ai-dropdown-modal">
            {suggestionData.options?.map((opt, idx) => (
              <div
                key={idx}
                className="reg-ai-dropdown-item"
                onClick={() => handleSelectSuggestedTerm(opt.title)}
              >
                <div className="reg-ai-dropdown-item-title">{opt.title}</div>
                <div className="reg-ai-dropdown-item-desc">{opt.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

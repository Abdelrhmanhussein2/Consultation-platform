// frontend/src/components/Regulations/RegulationsSearch.jsx
import React, { useState, useRef } from 'react';
import { getLegalSuggestionAsync } from '../../services/legalDictionary';

export default function RegulationsSearch({
  navigate,
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
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Stale request guard
  const latestRequestIdRef = useRef(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleToggleAiImprove = async () => {
    if (!searchQuery || !searchQuery.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 2000);
      return;
    }

    if (isAiActive) {
      setIsAiActive(false);
      setSuggestionData(null);
      setApiError(null);
      return;
    }

    setIsAiActive(true);
    setIsLoadingSuggestion(true);
    setSuggestionData(null);
    setApiError(null);

    const requestId = ++latestRequestIdRef.current;

    try {
      const result = await getLegalSuggestionAsync(searchQuery);
      // Guard against stale overlapping responses
      if (requestId === latestRequestIdRef.current) {
        setSuggestionData(result);
        setApiError(null);
      }
    } catch (err) {
      if (requestId === latestRequestIdRef.current) {
        setSuggestionData(null);
        setApiError(err.message || 'verification_unavailable');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoadingSuggestion(false);
      }
    }
  };

  const handleSelectSuggestedTerm = (termTitle) => {
    setSearchQuery(termTitle);
    setIsAiActive(false);
    setSuggestionData(null);
    onSearch(termTitle);
  };

  const handleOpenDirectTarget = (e, openUrl, opt = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (openUrl && navigate) {
      setIsAiActive(false);
      setSuggestionData(null);
      let targetUrl = openUrl;
      const hlText = opt?.literal_text || opt?.title || searchQuery;
      if (hlText) {
        try {
          sessionStorage.setItem('last_legal_highlight', hlText);
        } catch (_) {}
      }
      if (hlText && !targetUrl.includes('highlight=')) {
        targetUrl += `&highlight=${encodeURIComponent(hlText.slice(0, 100))}`;
      }
      navigate(targetUrl);
    }
  };

  const hasActiveFilters = filters && (
    (filters.status && filters.status !== 'الكل') ||
    (filters.type && filters.type !== 'الكل') ||
    filters.dateFrom ||
    filters.dateTo
  );

  const options = suggestionData?.options || [];
  const hasOptions = options.length > 0;
  const topOption = hasOptions ? options[0] : null;

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

      {/* Search Bar */}
      <div className="search-wrap home-search-wrap-v3">
        <form className="searchbar home-searchbar-v3" onSubmit={handleSubmit}>
          <input
            id="searchInput"
            type="text"
            placeholder={inputError ? "يرجى كتابة مصطلح قانوني أولاً..." : "ابحث بكلمة، مصطلح قانوني، رقم قانون أو اسم تشريع..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (isAiActive) {
                setIsAiActive(false);
                setSuggestionData(null);
                setApiError(null);
              }
            }}
            style={inputError ? { borderColor: '#EF4444' } : undefined}
          />

          {/* Advanced Search Button */}
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

          {/* Improve Button */}
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
      {isAiActive && (
        <>
          {/* Loading state */}
          {isLoadingSuggestion && (
            <div className="improve-suggestion show" style={{ maxWidth: '980px', margin: '10px auto 0' }}>
              <div>
                <small>اقتراح ديوان</small>
                <strong>جاري التحقق من المراجع القانونية المتاحة في ديوان...</strong>
              </div>
            </div>
          )}

          {/* Verification Temporarily Unavailable Error state */}
          {!isLoadingSuggestion && apiError && (
            <div className="improve-suggestion show" style={{ maxWidth: '980px', margin: '10px auto 0', borderRight: '4px solid #EF4444' }}>
              <div>
                <small style={{ color: '#EF4444' }}>تنبيه</small>
                <strong>خدمة التحقق من المراجع القانونية غير متاحة مؤقتاً.</strong>
              </div>
              <div className="improve-actions">
                <button
                  type="button"
                  className="accept"
                  style={{ background: '#4B5563' }}
                  onClick={handleToggleAiImprove}
                >
                  إعادة المحاولة ↻
                </button>
              </div>
            </div>
          )}

          {/* Empty state: No banner, clear message */}
          {!isLoadingSuggestion && !apiError && !hasOptions && (
            <div style={{ maxWidth: '980px', margin: '12px auto 0', padding: '12px 18px', background: 'rgba(15, 23, 42, 0.75)', borderRadius: '8px', color: '#CBD5E1', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              لم يتم العثور على مصطلح مرتبط بمرجع قانوني متاح في ديوان.
            </div>
          )}

          {/* Success state: Top Banner built from layer (a) only */}
          {!isLoadingSuggestion && !apiError && hasOptions && topOption && (suggestionData?.is_direct_banner || topOption?.is_direct_banner) && (
            <div
              className="improve-suggestion show"
              style={{ maxWidth: '980px', margin: '10px auto 0', cursor: topOption.open_url ? 'pointer' : 'default' }}
              onClick={(e) => {
                if (topOption.open_url) {
                  handleOpenDirectTarget(e, topOption.open_url, topOption);
                }
              }}
              title={topOption.open_url ? "اضغط لفتح المادة مباشرة في قارئ القانون" : ""}
            >
              <div>
                <small>اقتراح ديوان (مطابقة مباشرة)</small>
                <strong>هل تقصد «{topOption.title}»؟</strong>
                <span style={{ marginRight: '10px', fontSize: '12px', opacity: 0.9, color: '#93C5FD' }}>
                  ({topOption.law_name} — <span style={{ fontWeight: 700, color: '#FCD34D' }}>{topOption.article_reference}</span>)
                </span>
              </div>
              <div className="improve-actions">
                <button
                  type="button"
                  className="accept"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSuggestedTerm(topOption.title);
                  }}
                  title="البحث باستخدام هذا المصطلح"
                >
                  استخدم المصطلح المقترح
                </button>
                {topOption.open_url && (
                  <button
                    type="button"
                    className="accept"
                    style={{ background: '#0D9488', marginRight: '6px' }}
                    onClick={(e) => handleOpenDirectTarget(e, topOption.open_url, topOption)}
                    title="فتح المادة في قارئ القانون"
                  >
                    عرض نص المادة ↗
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Verified Dropdown List */}
          {!isLoadingSuggestion && !apiError && hasOptions && (
            <div className="reg-ai-dropdown-modal">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="reg-ai-dropdown-item"
                    onClick={(e) => {
                      if (opt.open_url) {
                        handleOpenDirectTarget(e, opt.open_url, opt);
                      } else {
                        handleSelectSuggestedTerm(opt.title);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title="اضغط لفتح المادة مباشرة في قارئ القانون"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="reg-ai-dropdown-item-title">{opt.title}</div>
                      {opt.open_url && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#0D9488',
                            fontWeight: 600,
                            padding: '2px 8px',
                            background: 'rgba(13, 148, 136, 0.08)',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="فتح في قارئ القانون"
                        >
                          عرض المادة ↗
                        </span>
                      )}
                    </div>
                    <div className="reg-ai-dropdown-item-desc">
                      مادة قانونية من {opt.law_name}
                      {opt.article_reference && (
                        <span style={{ marginRight: '8px', fontWeight: 600, color: '#1E293B', fontSize: '12px' }}>
                          ({opt.article_reference})
                        </span>
                      )}
                    </div>
                    {opt.literal_text && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: 1.5 }}>
                        "{opt.literal_text.slice(0, 120)}..."
                      </div>
                    )}
                  </div>
                ))}
              </div>
          )}
        </>
      )}
    </div>
  );
}

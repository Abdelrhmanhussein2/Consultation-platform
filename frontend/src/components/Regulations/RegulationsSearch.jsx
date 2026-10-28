// frontend/src/components/Regulations/RegulationsSearch.jsx
import React, { useState, useRef, useEffect } from 'react';
import { getLegalSuggestionAsync, searchLocalDictionary } from '../../services/legalDictionary';
import { searchLegal } from '../../services/legalService';

const KNOWN_LAWS = [
  {
    type: 'law',
    title: 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته',
    subtitle: 'نسخة معدلة — ساري (2014)',
    badge: 'تشريع قانوني'
  },
  {
    type: 'law',
    title: 'قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية — كما صدر)',
    subtitle: 'نسخة أصلية — معدل لاحقاً (2014)',
    badge: 'تشريع قانوني'
  },
  {
    type: 'law',
    title: 'قانون الضريبة العامة على المبيعات رقم 6 لسنة 1994 وتعديلاته',
    subtitle: 'نسخة معدلة — ساري (1994)',
    badge: 'تشريع قانوني'
  },
  {
    type: 'law',
    title: 'تعليمات اقتطاع ضريبة الدخل من المصدر رقم 2 لسنة 2019',
    subtitle: 'تعليمات تنفيذية — ساري (2019)',
    badge: 'تعليمات تنفيذية'
  },
  {
    type: 'law',
    title: 'تعليمات المصاريف المقبولة لغايات ضريبة الدخل رقم 4 لسنة 2019',
    subtitle: 'تعليمات تنفيذية — ساري (2019)',
    badge: 'تعليمات تنفيذية'
  },
  {
    type: 'law',
    title: 'التعرفة الجمركية الأردنية وتعديلاتها',
    subtitle: 'تعرفة جمركية موحدة',
    badge: 'تعرفة جمركية'
  },
  {
    type: 'law',
    title: 'نظام تنظيم شؤون الفوترة والرقابة عليها رقم 34 لسنة 2019',
    subtitle: 'نظام تنفيذي — ساري (2019)',
    badge: 'نظام تنفيذي'
  }
];

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

  // Autocomplete live suggestions state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState([]);

  // Stale request guard & live debounce timer
  const latestRequestIdRef = useRef(0);
  const liveSearchTimerRef = useRef(null);
  const searchWrapRef = useRef(null);

  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (liveSearchTimerRef.current) clearTimeout(liveSearchTimerRef.current);
    setShowAutocomplete(false);
    onSearch(searchQuery);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (isAiActive) {
      setIsAiActive(false);
      setSuggestionData(null);
    }

    if (!val || !val.trim()) {
      setShowAutocomplete(false);
      setAutocompleteItems([]);
      if (liveSearchTimerRef.current) clearTimeout(liveSearchTimerRef.current);
      onSearch('');
      return;
    }

    // Build matching suggestions from laws & verified dictionary
    const qClean = val.trim().toLowerCase();
    const matchingLaws = KNOWN_LAWS.filter(l =>
      l.title.toLowerCase().includes(qClean) ||
      (l.subtitle && l.subtitle.toLowerCase().includes(qClean))
    );

    const matchingTerms = searchLocalDictionary(val, 4).map(opt => ({
      type: 'term',
      title: opt.title,
      subtitle: `${opt.law_name} — (${opt.article_reference})`,
      badge: 'مصطلح قانوني',
      opt
    }));

    const combined = [...matchingLaws, ...matchingTerms].slice(0, 7);
    setAutocompleteItems(combined);
    setShowAutocomplete(combined.length > 0);

    // Debounce live search for matching law cards below and dynamic backend autocomplete
    if (liveSearchTimerRef.current) clearTimeout(liveSearchTimerRef.current);
    liveSearchTimerRef.current = setTimeout(async () => {
      onSearch(val);
      try {
        const backendLaws = await searchLegal(val, 5);
        if (Array.isArray(backendLaws) && backendLaws.length > 0) {
          const dynamicLawItems = backendLaws.map(l => ({
            type: 'law',
            title: l.title,
            subtitle: `${l.type || 'تشريع'} — ${l.status || 'ساري'} (${l.year_short || l.year || ''})`,
            badge: l.type && l.type.includes('تعليمات') ? 'تعليمات تنفيذية' : (l.type && l.type.includes('نظام') ? 'نظام تنفيذي' : 'تشريع قانوني'),
            lawObj: l
          }));
          const seen = new Set();
          const allMerged = [];
          for (const itm of [...dynamicLawItems, ...matchingLaws, ...matchingTerms]) {
            if (!seen.has(itm.title)) {
              seen.add(itm.title);
              allMerged.push(itm);
            }
          }
          setAutocompleteItems(allMerged.slice(0, 8));
        }
      } catch (_) {}
    }, 300);
  };

  const handleSelectAutocomplete = (item) => {
    if (liveSearchTimerRef.current) clearTimeout(liveSearchTimerRef.current);
    setSearchQuery(item.title);
    setShowAutocomplete(false);
    if (isAiActive) {
      setIsAiActive(false);
      setSuggestionData(null);
    }
    onSearch(item.title);
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
      return;
    }

    setShowAutocomplete(false);
    setIsAiActive(true);
    setIsLoadingSuggestion(true);
    setSuggestionData(null);

    const requestId = ++latestRequestIdRef.current;

    try {
      const result = await getLegalSuggestionAsync(searchQuery);
      if (requestId === latestRequestIdRef.current) {
        setSuggestionData(result);
      }
    } catch (_err) {
      // Local fallback never throws, but keep safety guard
      if (requestId === latestRequestIdRef.current) {
        setSuggestionData({ matched: false, is_direct_banner: false, options: [] });
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

      {/* Search Bar Wrapper with Ref for Autocomplete */}
      <div className="search-wrap home-search-wrap-v3" ref={searchWrapRef} style={{ position: 'relative' }}>
        <form className="searchbar home-searchbar-v3" onSubmit={handleSubmit}>
          <input
            id="searchInput"
            type="text"
            placeholder={inputError ? "يرجى كتابة مصطلح قانوني أولاً..." : "ابحث بكلمة، مصطلح قانوني، رقم قانون أو اسم تشريع..."}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery && searchQuery.trim() && autocompleteItems.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            autoComplete="off"
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

        {/* Live Autocomplete Suggestions Dropdown Bar */}
        {showAutocomplete && autocompleteItems.length > 0 && (
          <div className="reg-search-autocomplete" role="listbox" aria-label="اقتراحات البحث الفوري">
            {autocompleteItems.map((item, idx) => (
              <div
                key={idx}
                className="reg-autocomplete-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectAutocomplete(item);
                }}
              >
                <div className="reg-autocomplete-item-left">
                  <span className="reg-autocomplete-icon" aria-hidden="true">
                    {item.type === 'law' ? '📜' : '⚖️'}
                  </span>
                  <div className="reg-autocomplete-text">
                    <span className="reg-autocomplete-title">{item.title}</span>
                    {item.subtitle && <span className="reg-autocomplete-sub">{item.subtitle}</span>}
                  </div>
                </div>
                <span className={`reg-autocomplete-badge ${item.type}`}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        )}

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

          {/* Empty state: Platform theme styled card, NO retry button */}
          {!isLoadingSuggestion && !hasOptions && (
            <div className="reg-terms-empty-card">
              لا توجد مصطلحات أو مراجع قانونية مرتبطة بعبارة البحث.
            </div>
          )}

          {/* Success state: Top Banner */}
          {!isLoadingSuggestion && hasOptions && topOption && (
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
                <small>اقتراح ديوان (مطابقة قانونية)</small>
                <strong>هل تقصد «{topOption.title}»؟</strong>
                <span style={{ marginRight: '10px', fontSize: '12px', opacity: 0.9, color: 'rgba(255, 255, 255, 0.85)' }}>
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
                    style={{ background: '#0D3C5C', border: '1px solid rgba(255, 255, 255, 0.45)', color: '#ffffff', marginRight: '6px' }}
                    onClick={(e) => handleOpenDirectTarget(e, topOption.open_url, topOption)}
                    title="فتح المادة في قارئ القانون"
                  >
                    عرض نص المادة ↗
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Verified Dropdown List matching platform theme */}
          {!isLoadingSuggestion && hasOptions && (
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
                          color: 'var(--reg-navy)',
                          fontWeight: 700,
                          padding: '3px 10px',
                          background: '#F1F4F6',
                          border: '1px solid #DCE4E9',
                          borderRadius: '999px',
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
                      "{opt.literal_text.slice(0, 140)}..."
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

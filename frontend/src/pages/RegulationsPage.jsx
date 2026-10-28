// frontend/src/pages/RegulationsPage.jsx
import React, { useState, useEffect } from 'react';
import '../components/Regulations/regulations.css';
import {
  RegulationsSearch,
  TrendingSearches,
  SearchResultCard,
  AdvancedFiltersModal,
  TextPreviewModal,
  RelatedDrawer,
  FullTextModal,
  LegalReader
} from '../components/Regulations';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { searchLegal } from '../services/legalService';
import { useAuth } from '../context/AuthContext';

function parseFlexibleDate(str, isEnd = false) {
  if (!str) return null;
  const s = String(str).trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if (!s) return null;

  // 1. Year only: e.g. '2014'
  if (/^\d{4}$/.test(s)) {
    const y = parseInt(s, 10);
    return isEnd ? new Date(y, 11, 31, 23, 59, 59).getTime() : new Date(y, 0, 1, 0, 0, 0).getTime();
  }

  // 2. Month and Year: MM/YYYY or YYYY-MM or MM-YYYY
  let mMatch = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (mMatch) {
    const m = parseInt(mMatch[1], 10) - 1;
    const y = parseInt(mMatch[2], 10);
    if (m >= 0 && m < 12) {
      return isEnd ? new Date(y, m + 1, 0, 23, 59, 59).getTime() : new Date(y, m, 1, 0, 0, 0).getTime();
    }
  }

  let yMatch = s.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (yMatch) {
    const y = parseInt(yMatch[1], 10);
    const m = parseInt(yMatch[2], 10) - 1;
    if (m >= 0 && m < 12) {
      return isEnd ? new Date(y, m + 1, 0, 23, 59, 59).getTime() : new Date(y, m, 1, 0, 0, 0).getTime();
    }
  }

  // 3. Full date: DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  let fullMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (fullMatch) {
    const d = parseInt(fullMatch[1], 10);
    const m = parseInt(fullMatch[2], 10) - 1;
    const y = parseInt(fullMatch[3], 10);
    return new Date(y, m, d, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0).getTime();
  }

  let isoMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0).getTime();
  }

  return null;
}

function getLawDateRange(l) {
  if (!l) return null;
  const rawDates = [l.issue_date, l.effective_date, l.amended_date, l.date].filter(Boolean);
  const timestamps = [];

  for (const rd of rawDates) {
    const ts = parseFlexibleDate(rd, false);
    if (ts) timestamps.push(ts);
  }

  const y = parseInt(l.year || l.year_short || '0', 10);
  if (y >= 1900 && y <= 2100) {
    timestamps.push(new Date(y, 0, 1).getTime());
    timestamps.push(new Date(y, 11, 31, 23, 59, 59).getTime());
  }

  if (timestamps.length === 0) return null;
  return {
    start: Math.min(...timestamps),
    end: Math.max(...timestamps)
  };
}

function matchLawType(l, filterType) {
  if (!filterType || filterType === 'الكل') return true;
  const t = filterType.trim();
  const lType = (l.type || '').trim();
  const lTitle = (l.title || '').trim();

  if (t === 'قانون') {
    return lType.includes('قانون') || lType.includes('نسخة') || lTitle.startsWith('قانون');
  }
  if (t === 'تعليمات') {
    return lType.includes('تعليمات') || lTitle.startsWith('تعليمات');
  }
  if (t === 'نظام') {
    return lType.includes('نظام') || lTitle.startsWith('نظام');
  }
  if (t.includes('أحكام') || t.includes('قضائ')) {
    return lType.includes('حكم') || lType.includes('قضائ') || lTitle.startsWith('الحكم') || lTitle.startsWith('قرار محكمة');
  }
  if (t.includes('قرار')) {
    return lType.includes('قرار') || lTitle.startsWith('قرار');
  }
  if (t.includes('نموذج') || t.includes('نماذج')) {
    return lType.includes('نموذج') || lType.includes('نماذج') || lTitle.includes('نموذج');
  }
  return lType.includes(t) || lTitle.includes(t);
}

function matchLawStatus(l, filterStatus) {
  if (!filterStatus || filterStatus === 'الكل') return true;
  const st = filterStatus.trim();
  const lSt = (l.status || '').trim();
  if (st === 'ساري') return lSt === 'ساري' || lSt === 'active';
  if (st === 'معدل') return lSt.includes('معدل') || lSt === 'amended';
  if (st === 'ملغى') return lSt.includes('ملغ') || lSt === 'cancelled';
  return lSt === st;
}

export default function RegulationsPage({ navigate, currentPath }) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedLawId, setHighlightedLawId] = useState(null);

  // Modals and Drawer States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ sector: "الكل", docType: "الكل", status: "الكل" });

  const [previewLaw, setPreviewLaw] = useState(null);
  const [relatedLaw, setRelatedLaw] = useState(null);
  const [readerLawId, setReaderLawId] = useState(null);

  useEffect(() => {
    // 1. Read query parameters strictly from currentPath (falling back to window.location.search)
    const searchPart = currentPath?.includes('?')
      ? currentPath.slice(currentPath.indexOf('?'))
      : (typeof window !== 'undefined' ? window.location.search : '');
    const params = new URLSearchParams(searchPart);
    const qParam = params.get('q') || '';
    const lawIdParam = params.get('lawId') || params.get('id') || '';
    const lawTitleParam = params.get('lawTitle') || params.get('title') || '';
    const lawTypeParam = params.get('lawType') || params.get('type') || '';

    // 2. Read stored law object from sessionStorage if matching or fallback
    let storedLaw = null;
    try {
      const raw = sessionStorage.getItem('selected_semantic_law');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!lawIdParam || parsed.law_id === lawIdParam || parsed.id === lawIdParam) {
          storedLaw = parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading selected_semantic_law:", e);
    }

    const effectiveTargetId = lawIdParam || storedLaw?.law_id || storedLaw?.id || null;
    const effectiveTargetTitle = lawTitleParam || storedLaw?.title || null;
    const effectiveTargetType = lawTypeParam || storedLaw?.type || null;

    setHighlightedLawId(effectiveTargetId);

    if (qParam) {
      setSearchQuery(qParam);
      handleSearch(qParam, filters, effectiveTargetId, effectiveTargetTitle, effectiveTargetType, storedLaw);
    } else {
      handleSearch('', filters, effectiveTargetId, effectiveTargetTitle, effectiveTargetType, storedLaw);
    }
  }, [token, currentPath]);

  // Auto-scroll to highlighted card when results are loaded
  useEffect(() => {
    if (highlightedLawId && results.length > 0) {
      const timer = setTimeout(() => {
        const topHighlighted = document.querySelector('.reg-card-fade-highlight') || document.querySelector('.reg-result-card-item');
        if (topHighlighted) {
          topHighlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [results, highlightedLawId]);

  const handleSearch = async (
    queryText,
    appliedFilters = filters,
    targetId = highlightedLawId,
    targetTitle = null,
    targetType = null,
    storedLawObj = null
  ) => {
    setLoading(true);
    const effectiveQuery = queryText !== undefined ? queryText : searchQuery;
    const data = await searchLegal(effectiveQuery, 20, token, appliedFilters);

    let filtered = [...data];

    if (appliedFilters.status && appliedFilters.status !== 'الكل') {
      filtered = filtered.filter(l => matchLawStatus(l, appliedFilters.status));
    }

    if (appliedFilters.type && appliedFilters.type !== 'الكل') {
      filtered = filtered.filter(l => matchLawType(l, appliedFilters.type));
    }

    if (appliedFilters.dateFrom || appliedFilters.dateTo) {
      const fromTs = appliedFilters.dateFrom ? parseFlexibleDate(appliedFilters.dateFrom, false) : null;
      const toTs = appliedFilters.dateTo ? parseFlexibleDate(appliedFilters.dateTo, true) : null;

      filtered = filtered.filter(l => {
        const range = getLawDateRange(l);
        if (!range) return true;
        let fromOk = true;
        let toOk = true;

        if (fromTs !== null) {
          fromOk = range.end >= fromTs;
        }

        if (toTs !== null) {
          toOk = range.start <= toTs;
        }

        return fromOk && toOk;
      });
    }

    // Pinned target law prioritization logic: Strict identification!
    const effectiveId = targetId || storedLawObj?.law_id || storedLawObj?.id;
    const effectiveTitle = targetTitle || storedLawObj?.title;
    const effectiveType = targetType || storedLawObj?.type;

    if (effectiveId || effectiveTitle || storedLawObj) {
      let matchIndex = -1;

      // Priority 1: Match strictly by exact law_id
      if (effectiveId) {
        matchIndex = filtered.findIndex(l => l.law_id === effectiveId || l.id === effectiveId);
      }

      // Priority 2: If no ID match, match by exact type AND exact title
      if (matchIndex === -1 && effectiveTitle && effectiveType) {
        matchIndex = filtered.findIndex(l => {
          const tSame = l.title && l.title.trim() === effectiveTitle.trim();
          const typeSame = l.type && l.type.trim() === effectiveType.trim();
          return tSame && typeSame;
        });
      }

      // Priority 3: Exact title match only (strict ===)
      if (matchIndex === -1 && effectiveTitle) {
        matchIndex = filtered.findIndex(l => l.title && l.title.trim() === effectiveTitle.trim());
      }

      if (matchIndex > 0) {
        // Move the targeted law to index 0 (top of the list)
        const [matchedLaw] = filtered.splice(matchIndex, 1);
        filtered.unshift(matchedLaw);
      } else if (matchIndex === -1 && storedLawObj) {
        // If not in fetched results, prepend the stored law
        const normalizedItem = {
          law_id: storedLawObj.law_id || storedLawObj.id || effectiveId || 'selected_law',
          title: storedLawObj.title || effectiveTitle || 'التشريع المختار',
          type: storedLawObj.type || effectiveType || 'تشريع',
          status: storedLawObj.status === 'active' ? 'ساري' : (storedLawObj.status || 'ساري'),
          year_short: String(storedLawObj.year || '2026'),
          issue_date: storedLawObj.pub || storedLawObj.issue_date || '2026/02/10',
          effective_date: storedLawObj.eff || storedLawObj.effective_date || '2026/03/01',
          amended_date: storedLawObj.amended_date || '—',
          total_articles: storedLawObj.total_articles || 82,
          summary: storedLawObj.desc || storedLawObj.summary || 'تعديل تشريعي وتنظيمي موثق ومحتوى معتمد رسمياً.'
        };
        filtered.unshift(normalizedItem);
      }
    }

    setResults(filtered);
    setLoading(false);
  };

  const handleOpenReader = (law) => {
    setReaderLawId(law.law_id || 'law_tax_34_2014');
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
    handleSearch(searchQuery, filters);
  };

  const handleRemoveFilter = (filterKey) => {
    const updated = {
      ...filters,
      [filterKey]: (filterKey === 'status' || filterKey === 'type') ? 'الكل' : ''
    };
    setFilters(updated);
    handleSearch(searchQuery, updated);
  };

  // فتح صفحة القانون المستقلة بتغيير الـ URL
  const handleOpenFullPage = (law) => {
    const lawId = law?.law_id || 'law_tax_34_2014';
    if (navigate) {
      navigate(`/regulations/law/${encodeURIComponent(lawId)}`);
    } else {
      window.history.pushState(null, '', `/regulations/law/${encodeURIComponent(lawId)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="regulations-page-wrap fade-in">
      <div className="reg-content-container">
        {/* Search Hero Banner */}
        <RegulationsSearch
          navigate={navigate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(q) => handleSearch(q, filters)}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
        />

        {/* Trending Topics Bar */}
        <TrendingSearches
          onSelectTopic={(topicQuery) => {
            setSearchQuery(topicQuery);
            handleSearch(topicQuery, filters);
          }}
        />

        {/* Results List */}
        {loading ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#0D3C5C', fontWeight: 700 }}>
            جاري البحث الفائق في النصوص والتشريعات الضريبية...
          </div>
        ) : (
          <div>
            {results.length === 0 ? (
              <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                لا توجد تشريعات مطابقة لشروط البحث والفلترة المحددة.
              </div>
            ) : (
              results.map((law, idx) => {
                const isThisLawTargeted = Boolean(
                  highlightedLawId && (
                    law.law_id === highlightedLawId ||
                    law.id === highlightedLawId
                  )
                );
                return (
                  <SearchResultCard
                    key={`${law.law_id || idx}_${highlightedLawId || 'initial'}`}
                    law={law}
                    isTargeted={isThisLawTargeted}
                    onOpenReader={handleOpenReader}
                    onOpenPreview={(l) => setPreviewLaw(l)}
                    onOpenRelated={(l) => setRelatedLaw(l)}
                    onOpenFilters={() => setIsFilterModalOpen(true)}
                    onOpenFullPage={handleOpenFullPage}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      {/* Quick Text Preview Modal - يجلب البيانات الحقيقية تلقائياً */}
      <TextPreviewModal
        isOpen={!!previewLaw}
        onClose={() => setPreviewLaw(null)}
        law={previewLaw}
        onOpenFullReader={(l) => {
          setPreviewLaw(null);
          handleOpenFullPage(l);
        }}
      />

      {/* Ask Diwan AI Assistant Drawer */}
      <RelatedDrawer
        isOpen={!!relatedLaw}
        onClose={() => setRelatedLaw(null)}
        law={relatedLaw}
        navigate={navigate}
      />

      {/* Full Screen Interactive Reader Workspace - يبقى للبحث المتقدم */}
      {readerLawId && (
        <ErrorBoundary
          title="تعذر فتح مساحة القراءة المتقدمة"
          onClose={() => setReaderLawId(null)}
        >
          <LegalReader
            lawId={readerLawId}
            onClose={() => setReaderLawId(null)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

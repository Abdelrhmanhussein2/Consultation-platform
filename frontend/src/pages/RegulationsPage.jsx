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
    const data = await searchLegal(effectiveQuery, 20, token);

    let filtered = [...data];

    if (appliedFilters.status && appliedFilters.status !== 'الكل') {
      filtered = filtered.filter(l => l.status === appliedFilters.status);
    }

    if (appliedFilters.type && appliedFilters.type !== 'الكل') {
      filtered = filtered.filter(l => l.type === appliedFilters.type);
    }

    if (appliedFilters.dateFrom || appliedFilters.dateTo) {
      filtered = filtered.filter(l => {
        const lawYear = parseInt(l.year_short || (l.issue_date ? l.issue_date.split('-')[2] : '2014'), 10);
        let fromOk = true;
        let toOk = true;

        if (appliedFilters.dateFrom) {
          const fromYear = parseInt(appliedFilters.dateFrom.slice(-4), 10);
          if (!isNaN(fromYear)) fromOk = lawYear >= fromYear;
        }

        if (appliedFilters.dateTo) {
          const toYear = parseInt(appliedFilters.dateTo.slice(-4), 10);
          if (!isNaN(toYear)) toOk = lawYear <= toYear;
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

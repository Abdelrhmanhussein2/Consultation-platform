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

export default function RegulationsPage() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals and Drawer States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ sector: "الكل", docType: "الكل", status: "الكل" });

  const [previewLaw, setPreviewLaw] = useState(null);
  const [relatedLaw, setRelatedLaw] = useState(null);
  const [fullTextLaw, setFullTextLaw] = useState(null);
  const [readerLawId, setReaderLawId] = useState(null);

  useEffect(() => {
    handleSearch('');
  }, [token]);

  const handleSearch = async (queryText, appliedFilters = filters) => {
    setLoading(true);
    const data = await searchLegal(queryText !== undefined ? queryText : searchQuery, 20, token);

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

  return (
    <div className="regulations-page-wrap fade-in">
      <div className="reg-content-container">
        {/* Search Hero Banner */}
        <RegulationsSearch
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
              results.map((law, idx) => (
                <SearchResultCard
                  key={law.law_id || idx}
                  law={law}
                  onOpenReader={handleOpenReader}
                  onOpenPreview={(l) => setPreviewLaw(l)}
                  onOpenRelated={(l) => setRelatedLaw(l)}
                  onOpenFilters={() => setIsFilterModalOpen(true)}
                />
              ))
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

      {/* Quick Text Preview Modal */}
      <TextPreviewModal
        isOpen={!!previewLaw}
        onClose={() => setPreviewLaw(null)}
        law={previewLaw}
        onOpenFullReader={(l) => {
          setPreviewLaw(null);
          handleOpenReader(l);
        }}
      />

      {/* Related Drawer Sliding from left */}
      <RelatedDrawer
        isOpen={!!relatedLaw}
        onClose={() => setRelatedLaw(null)}
        law={relatedLaw}
      />

      {/* Printable Full Text Modal */}
      <FullTextModal
        isOpen={!!fullTextLaw}
        onClose={() => setFullTextLaw(null)}
        law={fullTextLaw}
      />

      {/* Full Screen Interactive Reader Workspace */}
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

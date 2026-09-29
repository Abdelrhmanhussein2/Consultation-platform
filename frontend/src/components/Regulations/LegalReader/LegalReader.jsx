import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './LegalReader.css';
import LegalArticleCompare from './LegalArticleCompare';
import { getLawTree, getArticleHistory } from '../../../services/legalService';

export default function LegalReader({ lawId, onClose }) {
  const [lawTree, setLawTree] = useState(null);
  const [showTocDrawer, setShowTocDrawer] = useState(true);
  const [showSearchInline, setShowSearchInline] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState(1);
  const [compareArticleNum, setCompareArticleNum] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  
  // Search state inside document
  const [findText, setFindText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Scroll position state for scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollBodyRef = useRef(null);

  useEffect(() => {
    getLawTree(lawId).then(data => {
      setLawTree(data);
    });
  }, [lawId]);

  // Track active article while scrolling
  const handleScroll = () => {
    if (!scrollBodyRef.current) return;

    const scrollTop = scrollBodyRef.current.scrollTop;
    setShowScrollTop(scrollTop > 250);

    if (!lawTree || !lawTree.sections) return;

    for (const section of lawTree.sections) {
      for (const article of section.articles || []) {
        const el = document.getElementById(`full-art-${article.num}`);
        if (el) {
          const top = el.offsetTop - scrollBodyRef.current.offsetTop;
          if (scrollTop >= top - 120) {
            setActiveArticleId(article.num);
          }
        }
      }
    }
  };

  const handleSelectArticle = (artNum) => {
    setActiveArticleId(artNum);
    const el = document.getElementById(`full-art-${artNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Inline Search Logic - Find Keyword Occurrences
  const handleSearchText = () => {
    if (!findText || !findText.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const query = findText.trim().toLowerCase();
    const found = [];

    lawTree?.sections?.forEach(section => {
      section.articles?.forEach(article => {
        if (article.content.toLowerCase().includes(query) || article.title.toLowerCase().includes(query)) {
          found.push(article.num);
        }
      });
    });

    setMatches(found);
    if (found.length > 0) {
      setCurrentMatchIndex(0);
      handleSelectArticle(found[0]);
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    handleSelectArticle(matches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    handleSelectArticle(matches[prevIdx]);
  };

  const handleCompareVersion = async (artNum) => {
    setCompareArticleNum(artNum);
    const history = await getArticleHistory(lawTree?.law_id, artNum);
    setHistoryData(history);
  };

  // Helper to highlight ONLY the exact matching word in text
  const renderHighlightedText = (text, query, isCurrentMatch) => {
    if (!query || !query.trim()) return text;

    const q = query.trim();
    // Regex split keeping delimiter
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return parts.map((part, i) => {
      if (part.toLowerCase() === q.toLowerCase()) {
        return (
          <mark
            key={i}
            className={`full-search-hit ${isCurrentMatch ? 'current' : ''}`}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (!lawTree) {
    return ReactDOM.createPortal(
      <div className="full-text-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#0D3C5C' }}>
          <h3 style={{ margin: 0 }}>جاري تحميل الصفحة الكامله للنص التشريعي...</h3>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="full-text-overlay" onClick={onClose}>
      <div className="full-text-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="full-text-header">
          <div className="full-text-header-title">
            {lawTree.title}
          </div>

          <div className="full-text-header-buttons">
            <button
              className={`full-header-toggle-btn ${showTocDrawer ? 'active' : ''}`}
              onClick={() => setShowTocDrawer(!showTocDrawer)}
            >
              الفهرس
            </button>
            <button
              className={`full-header-toggle-btn ${showSearchInline ? 'active' : ''}`}
              onClick={() => setShowSearchInline(!showSearchInline)}
            >
              بحث داخل النص
            </button>
            <button className="full-header-toggle-btn" onClick={onClose} title="إغلاق">
              ✕
            </button>
          </div>
        </div>

        {/* Action Tools Row */}
        <div className="full-text-tools-row">
          <div className="full-tools-group">
            <button className="full-tool-btn" onClick={() => window.print()}>
              طباعة
            </button>
            <button className="full-tool-btn" onClick={() => alert('تم نسخ النص المتاح')}>
              نسخ النص
            </button>
            <button className="full-tool-btn" onClick={() => alert('رابط المشاركة جاهز')}>
              مشاركة
            </button>
            <button className="full-tool-btn" onClick={() => window.print()}>
              تحميل PDF
            </button>
          </div>

          <div className="full-tools-group">
            <span className="full-quota-tag">التظليل 0 من 20</span>
            <span className="full-quota-tag">المفضلة 0 من 20</span>
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <div className={`full-text-scroll-body ${showTocDrawer ? 'with-toc-left' : ''}`} ref={scrollBodyRef} onScroll={handleScroll}>
          {/* Sticky Inline Search Bar (Fixed at top of document while scrolling) */}
          {showSearchInline && (
            <div className="full-law-search">
              <input
                type="text"
                placeholder="ابحث عن كلمة داخل النص (مثال: القانون)..."
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchText()}
              />
              <button className="search-btn" onClick={handleSearchText}>بحث</button>
              
              <span className="find-count-badge">
                {matches.length > 0 ? `${currentMatchIndex + 1} / ${matches.length}` : '0 / 0'}
              </span>

              <button className="nav-match-btn" onClick={handlePrevMatch} title="السابق">↑</button>
              <button className="nav-match-btn" onClick={handleNextMatch} title="التالي">↓</button>
              <button className="nav-match-btn" onClick={() => setShowSearchInline(false)} title="إغلاق">✕</button>
            </div>
          )}

          <div className="full-text-center-container">
            {/* Main Document Title */}
            <h1 className="full-text-doc-title">{lawTree.title}</h1>

            {/* 8 Metadata Boxes Grid */}
            <div className="full-text-meta-grid">
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">الجريدة الرسمية</span>
                <span className="full-text-meta-box-val">عدد 5320 - ص 7390</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">تاريخ النشر</span>
                <span className="full-text-meta-box-val">{lawTree.issue_date || '31-12-2014'}</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">الرقم / السنة</span>
                <span className="full-text-meta-box-val">2014 / 34</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">تاريخ الصدور</span>
                <span className="full-text-meta-box-val">30-12-2014</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">تاريخ السريان</span>
                <span className="full-text-meta-box-val">01-01-2015</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">تاريخ آخر تعديل</span>
                <span className="full-text-meta-box-val">01-01-2019</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">عدد التعديلات</span>
                <span className="full-text-meta-box-val">1</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">عدد المواد</span>
                <span className="full-text-meta-box-val">82 مادة</span>
              </div>
              <div className="full-text-meta-box">
                <span className="full-text-meta-box-label">حل محل</span>
                <span className="full-text-meta-box-val">قانون مؤقت رقم 28 لسنة 2009</span>
              </div>
            </div>

            {/* Preamble Note Box */}
            <div className="full-text-preamble-box">
              نشر القانون في العدد 5320 من الجريدة الرسمية على الصفحة 7390 بتاريخ 31-12-2014، وسرى اعتبارًا من 01-01-2015. وقد عُدّل بقانون معدل رقم 38 لسنة 2018 المنشور في العدد 5547 على الصفحة 7285 بتاريخ 02-12-2018 والساري من 01-01-2019.
            </div>

            {/* Articles List */}
            {lawTree.sections?.map((section) => (
              <div key={section.section_id}>
                <h3 style={{ color: 'var(--reg-navy)', fontSize: '18px', fontWeight: 800, margin: '28px 0 16px', borderBottom: '1.5px solid var(--reg-blue)', paddingBottom: '6px' }}>
                  {section.title}
                </h3>
                {section.articles?.map((article) => {
                  const isCurrentMatch = matches[currentMatchIndex] === article.num;
                  return (
                    <div
                      key={article.num}
                      id={`full-art-${article.num}`}
                      className="full-text-article-item"
                    >
                      <div className="full-text-article-head">
                        <h3>المادة {article.num}</h3>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>01-01-2015</span>
                      </div>

                      <div style={{ fontSize: '15px', lineHeight: 2.05, color: '#354F5E', whiteSpace: 'pre-line' }}>
                        {renderHighlightedText(article.content, findText, isCurrentMatch)}
                      </div>

                      {article.has_definitions && (
                        <div className="preview-definitions-table" style={{ marginTop: '14px' }}>
                          <div className="preview-def-row">
                            <div className="preview-def-term">الوزير</div>
                            <div className="preview-def-val">وزير المالية.</div>
                          </div>
                          <div className="preview-def-row">
                            <div className="preview-def-term">الدائرة</div>
                            <div className="preview-def-val">دائرة ضريبة الدخل والمبيعات.</div>
                          </div>
                          <div className="preview-def-row">
                            <div className="preview-def-term">الضريبة</div>
                            <div className="preview-def-val">ضريبة الدخل.</div>
                          </div>
                          <div className="preview-def-row">
                            <div className="preview-def-term">المدير</div>
                            <div className="preview-def-val">مدير عام الدائرة.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Floating Table of Contents Drawer (Articles Only) */}
        {showTocDrawer && (
          <div className="full-law-toc-panel">
            <div className="full-law-toc-head">
              <strong>فهرس القانون</strong>
              <button onClick={() => setShowTocDrawer(false)} title="إغلاق">✕</button>
            </div>
            <div className="full-law-toc-list">
              {lawTree.sections?.flatMap(s => s.articles || []).map((art) => {
                const isActive = activeArticleId === art.num;
                return (
                  <button
                    key={art.num}
                    className={`full-text-toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectArticle(art.num)}
                  >
                    {art.title.includes('المادة') ? art.title : `المادة ${art.num}: ${art.title}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scroll to top floating button on bottom right */}
        {showScrollTop && (
          <button
            className="full-scroll-top-btn"
            onClick={scrollToTop}
            title="العودة للأعلى"
          >
            ↑
          </button>
        )}
      </div>

      {/* Version Compare Modal */}
      <LegalArticleCompare
        isOpen={!!compareArticleNum}
        onClose={() => { setCompareArticleNum(null); setHistoryData(null); }}
        historyData={historyData}
      />
    </div>,
    document.body
  );
}

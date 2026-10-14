// frontend/src/pages/LawDetailPage.jsx
// صفحة مستقلة لعرض النص الكامل لأي قانون - URL: /regulations/law/:lawId
// نفس تصميم LegalFullTextPage تماماً (يغطي الشاشة كاملة) لكن مع URL حقيقي

import React, { useState, useEffect, useRef } from 'react';
import '../components/Regulations/LegalReader/LegalFullTextPage.layout.css';
import '../components/Regulations/LegalReader/LegalFullTextPage.header.css';
import '../components/Regulations/LegalReader/LegalFullTextPage.content.css';
import '../components/Regulations/LegalReader/LegalFullTextPage.toc.css';
import LegalFullTextHeader     from '../components/Regulations/LegalReader/LegalFullTextHeader';
import LegalFullTextBody       from '../components/Regulations/LegalReader/LegalFullTextBody';
import LegalFullTextTOC        from '../components/Regulations/LegalReader/LegalFullTextTOC';
import LegalReadingProgressBar from '../components/Regulations/LegalReader/LegalReadingProgressBar';
import { useReadingProgress }  from '../components/Regulations/LegalReader/useReadingProgress';
import { useDocumentSearch }   from '../components/Regulations/LegalReader/useDocumentSearch';
import { getLawTree }          from '../services/legalService';

export default function LawDetailPage({ lawId, navigate }) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [lawTree, setLawTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── TOC ───────────────────────────────────────────────────────────────────
  const [showToc, setShowToc]                 = useState(false);
  const [activeArticleId, setActiveArticleId] = useState(1);

  // ── Inline Search ─────────────────────────────────────────────────────────
  const [showSearch, setShowSearch]   = useState(false);
  const scrollRef                     = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const {
    findText, setFindText,
    matchCount, matchIndex,
    doSearch, goToNext, goToPrev, clearSearch,
  } = useDocumentSearch(scrollRef);

  // ── Usage counters ────────────────────────────────────────────────────────
  const [printCount, setPrintCount]       = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);

  // ── Reading Progress ──────────────────────────────────────────────────────
  const { progressPercent, currentArticleNum, totalArticles } = useReadingProgress(scrollRef, lawTree);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lawId) return;
    setLoading(true);
    document.title = 'جاري التحميل... | منصة ديوان';
    getLawTree(lawId)
      .then(data => {
        setLawTree(data);
        setLoading(false);
        if (data?.title) document.title = `${data.title} | منصة ديوان`;
      })
      .catch(() => setLoading(false));

    // تنظيف عنوان الصفحة عند المغادرة
    return () => { document.title = 'منصة ديوان'; };
  }, [lawId]);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const st = scrollRef.current.scrollTop;
    setShowScrollTop(st > 250);
    if (!lawTree?.sections) return;
    for (const section of lawTree.sections) {
      for (const article of section.articles || []) {
        const el = document.getElementById(`lft-art-${article.num}`);
        if (el) {
          const top = el.offsetTop - (scrollRef.current.offsetTop || 0);
          if (st >= top - 120) setActiveArticleId(article.num);
        }
      }
    }
  };

  const scrollToArticle = (artNum) => {
    setActiveArticleId(artNum);
    const el = document.getElementById(`lft-art-${artNum}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Search handlers ───────────────────────────────────────────────────────
  const handleToggleSearch = () => {
    if (showSearch) { clearSearch(); setShowSearch(false); }
    else setShowSearch(true);
  };
  const handleCloseSearch = () => { clearSearch(); setShowSearch(false); };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (navigate) navigate('/regulations');
    else window.history.back();
  };

  const handlePrint    = () => { setPrintCount(p => p + 1);    window.print(); };
  const handleDownload = () => { setDownloadCount(p => p + 1); window.print(); };

  const handleCopy = () => {
    if (!lawTree) return;
    const text = (lawTree.sections || [])
      .flatMap(s => s.articles || [])
      .map(a => `المادة ${a.num}\n${a.content || ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    alert('تم نسخ النص الكامل إلى الحافظة');
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: lawTree?.title, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ رابط الصفحة'); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="lft-overlay">
        <div className="lft-modal">
          <div className="lft-header">
            <span className="lft-header-title">جاري التحميل...</span>
            <div className="lft-header-buttons">
              <button className="lft-toggle-btn" onClick={handleClose}>✕ رجوع</button>
            </div>
          </div>
          <div className="lft-loading">
            <div style={{ textAlign: 'center' }}>
              <div className="lft-spinner" />
              <p style={{ marginTop: 16, color: '#0D3C5C', fontWeight: 700 }}>
                جاري تحميل النص الكامل للتشريع...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lawTree) {
    return (
      <div className="lft-overlay">
        <div className="lft-modal">
          <div className="lft-header">
            <span className="lft-header-title">خطأ</span>
            <div className="lft-header-buttons">
              <button className="lft-toggle-btn" onClick={handleClose}>✕ رجوع</button>
            </div>
          </div>
          <div className="lft-loading">
            <div style={{ textAlign: 'center', color: '#64748B' }}>
              <p>تعذر تحميل بيانات القانون. يرجى المحاولة مرة أخرى.</p>
              <button
                onClick={handleClose}
                style={{ marginTop: 12, padding: '8px 20px', background: '#0D3C5C', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← العودة للبحث
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: نفس بنية LegalFullTextPage بالضبط (lft-overlay + lft-modal) ──
  // لكن بدون ReactDOM.createPortal لأنه صفحة حقيقية مع URL
  return (
    <div className="lft-overlay">
      <div className="lft-modal">

        <LegalFullTextHeader
          title={lawTree?.title}
          showToc={showToc}
          onToggleToc={() => setShowToc(!showToc)}
          showSearch={showSearch}
          onToggleSearch={handleToggleSearch}
          onClose={handleClose}
          printCount={printCount}
          downloadCount={downloadCount}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onShare={handleShare}
        />

        <LegalFullTextBody
          lawTree={lawTree}
          showSearch={showSearch}
          findText={findText}
          setFindText={setFindText}
          onSearch={doSearch}
          matchIndex={matchIndex}
          matchCount={matchCount}
          onPrevMatch={goToPrev}
          onNextMatch={goToNext}
          onCloseSearch={handleCloseSearch}
          showToc={showToc}
          scrollRef={scrollRef}
          onScroll={handleScroll}
        />

        {showToc && (
          <LegalFullTextTOC
            lawTree={lawTree}
            activeArticleId={activeArticleId}
            onSelectArticle={scrollToArticle}
            onClose={() => setShowToc(false)}
          />
        )}

        {showScrollTop && (
          <button className="lft-scroll-top" onClick={scrollToTop} title="العودة للأعلى">
            ↑
          </button>
        )}

        <LegalReadingProgressBar
          progressPercent={progressPercent}
          currentArticleNum={currentArticleNum || activeArticleId}
          totalArticles={totalArticles}
        />

      </div>
    </div>
  );
}

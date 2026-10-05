// frontend/src/components/Regulations/LegalReader/LegalFullTextPage.jsx
// ── Orchestrator: state + logic only, UI delegated to sub-components ──────────
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './LegalFullTextPage.layout.css';
import './LegalFullTextPage.header.css';
import './LegalFullTextPage.content.css';
import './LegalFullTextPage.toc.css';
import LegalFullTextHeader from './LegalFullTextHeader';
import LegalFullTextBody   from './LegalFullTextBody';
import LegalFullTextTOC    from './LegalFullTextTOC';
import { getLawTree }      from '../../../services/legalService';

export default function LegalFullTextPage({ lawId, onClose }) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [lawTree, setLawTree]       = useState(null);
  const [loading, setLoading]       = useState(true);

  // ── TOC ───────────────────────────────────────────────────────────────────
  const [showToc, setShowToc]               = useState(true);
  const [activeArticleId, setActiveArticleId] = useState(1);

  // ── Inline Search ─────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [findText, setFindText]     = useState('');
  const [matches, setMatches]       = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);

  // ── Usage counters ────────────────────────────────────────────────────────
  const [printCount, setPrintCount]       = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);

  // ── Scroll state ──────────────────────────────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    getLawTree(lawId)
      .then(data => { setLawTree(data); setLoading(false); })
      .catch(()  => setLoading(false));
  }, [lawId]);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    setShowScrollTop(scrollTop > 250);
    if (!lawTree?.sections) return;
    for (const section of lawTree.sections) {
      for (const article of section.articles || []) {
        const el = document.getElementById(`lft-art-${article.num}`);
        if (el) {
          const top = el.offsetTop - scrollRef.current.offsetTop;
          if (scrollTop >= top - 120) setActiveArticleId(article.num);
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

  // ── Inline search ─────────────────────────────────────────────────────────
  const doSearch = () => {
    if (!findText?.trim()) { setMatches([]); setMatchIndex(0); return; }
    const q = findText.trim().toLowerCase();
    const found = [];
    lawTree?.sections?.forEach(section => {
      (section.articles || []).forEach(article => {
        if (
          article.content?.toLowerCase().includes(q) ||
          article.title?.toLowerCase().includes(q)
        ) found.push(article.num);
      });
    });
    setMatches(found);
    if (found.length > 0) { setMatchIndex(0); scrollToArticle(found[0]); }
  };

  const goNext = () => {
    if (!matches.length) return;
    const next = (matchIndex + 1) % matches.length;
    setMatchIndex(next);
    scrollToArticle(matches[next]);
  };

  const goPrev = () => {
    if (!matches.length) return;
    const prev = (matchIndex - 1 + matches.length) % matches.length;
    setMatchIndex(prev);
    scrollToArticle(matches[prev]);
  };

  const closeSearch = () => { setShowSearch(false); setMatches([]); setFindText(''); };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePrint = () => {
    setPrintCount(prev => prev + 1);
    window.print();
  };

  const handleDownload = () => {
    setDownloadCount(prev => prev + 1);
    window.print();
  };

  const handleCopy = () => {
    if (!lawTree) return;
    const text = lawTree.sections
      ?.flatMap(s => s.articles || [])
      .map(a => `المادة ${a.num}\n${a.content}`)
      .join('\n\n') || '';
    navigator.clipboard.writeText(text);
    alert('تم نسخ النص الكامل إلى الحافظة');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: lawTree?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الصفحة');
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return ReactDOM.createPortal(
      <div className="lft-overlay">
        <div className="lft-modal">
          <div className="lft-header">
            <span className="lft-header-title">جاري التحميل...</span>
            <div className="lft-header-buttons">
              <button className="lft-toggle-btn" onClick={onClose}>✕ إغلاق</button>
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
      </div>,
      document.body
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return ReactDOM.createPortal(
    <div className="lft-overlay">
      <div className="lft-modal">

        <LegalFullTextHeader
          title={lawTree?.title}
          showToc={showToc}
          onToggleToc={() => setShowToc(!showToc)}
          showSearch={showSearch}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onClose={onClose}
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
          matches={matches}
          onPrevMatch={goPrev}
          onNextMatch={goNext}
          onCloseSearch={closeSearch}
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
      </div>
    </div>,
    document.body
  );
}

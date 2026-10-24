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

export default function LawDetailPage({ lawId, navigate, currentPath }) {
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

  // ── Auto-scroll & Highlight for ?article= URL parameter ───────────────────
  const [articleError, setArticleError] = useState(null);

  useEffect(() => {
    if (!lawTree || loading) return;

    const searchStr = currentPath?.includes('?')
      ? currentPath.slice(currentPath.indexOf('?'))
      : (typeof window !== 'undefined' ? window.location.search : '');

    const params = new URLSearchParams(searchStr);
    const targetArticleParam = params.get('article');
    if (!targetArticleParam) return;

    // Flatten all articles
    const allArticles = lawTree.sections
      ? lawTree.sections.flatMap(s => s.articles || [])
      : (lawTree.articles || []);

    const decodedParam = decodeURIComponent(targetArticleParam).trim();

    // 1. Strict match on full stable identifier (article_id / معرف / id)
    let targetArticle = allArticles.find(a =>
      (a.article_id && (a.article_id === targetArticleParam || a.article_id === decodedParam)) ||
      (a.id && (a.id === targetArticleParam || a.id === decodedParam)) ||
      (a.معرف && (a.معرف === targetArticleParam || a.معرف === decodedParam))
    );

    // 2. Extract article number specifically after 'مادة_' (e.g. قانون_34_2014_وتعديلاته_مادة_66 -> 66)
    // Avoids falsely matching law number 34 by strictly requiring '_مادة_' prefix
    if (!targetArticle) {
      const artMatch = decodedParam.match(/(?:^|_)مادة_(\d+)(?:_|$)/);
      if (artMatch) {
        const artNum = parseInt(artMatch[1], 10);
        targetArticle = allArticles.find(a => (a.number === artNum || a.num === artNum));
      }
    }

    // 3. ONLY allow numeric match if parameter is strictly pure digits (e.g. "66")
    if (!targetArticle && /^\d+$/.test(decodedParam)) {
      const num = parseInt(decodedParam, 10);
      targetArticle = allArticles.find(a => (a.number === num || a.num === num));
    }

    // Validate that the target article belongs to the loaded law
    if (!targetArticle) {
      console.warn(`[LawDetailPage] Article '${targetArticleParam}' not found in law '${lawId}'`);
      setArticleError(`المادة المطلوبة (${targetArticleParam}) غير موجودة في هذا التشريع.`);
      return;
    }

    setArticleError(null);
    const targetNum = targetArticle.number || targetArticle.num;

    let storedHl = '';
    try {
      storedHl = sessionStorage.getItem('last_legal_highlight') || '';
    } catch (_) {}

    const targetHighlightParam = params.get('highlight') || params.get('q') || storedHl;

    const highlightTargetClause = (articleEl, rawHighlight) => {
      if (!articleEl || !rawHighlight) return;

      const cleanNorm = (str) => (str || '')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let decodedHighlight = rawHighlight;
      try {
        decodedHighlight = decodeURIComponent(rawHighlight).trim();
      } catch (_) {
        decodedHighlight = String(rawHighlight).trim();
      }

      const normHl = cleanNorm(decodedHighlight);
      if (!normHl || normHl.length < 2) return;

      const hlWords = normHl.split(' ').filter(w => w.length >= 2);

      // Search for clause paragraphs or definition rows inside the article
      const clauseNodes = articleEl.querySelectorAll('.lft-clause-p, .lft-def-row, p');
      let bestNode = null;
      let highestScore = 0;

      clauseNodes.forEach((node) => {
        const text = node.textContent || '';
        const normNodeText = cleanNorm(text);
        if (!normNodeText) return;

        // 1. Exact substring match
        if (normNodeText.includes(normHl)) {
          bestNode = node;
          highestScore = 9999;
          return;
        }

        // 2. Substring of first 3-5 words
        for (let take = Math.min(hlWords.length, 5); take >= 3; take--) {
          const phrase = hlWords.slice(0, take).join(' ');
          if (phrase.length >= 6 && normNodeText.includes(phrase)) {
            const score = 1000 + phrase.length;
            if (score > highestScore) {
              highestScore = score;
              bestNode = node;
            }
            break;
          }
        }

        // 3. Word overlap match
        let score = 0;
        hlWords.forEach(w => {
          if (normNodeText.includes(w)) score += w.length;
        });
        if (score > highestScore && score >= 4) {
          highestScore = score;
          bestNode = node;
        }
      });

      if (bestNode) {
        // Highlight the entire clause as a continuous, light, transparent block
        bestNode.style.backgroundColor = 'rgba(254, 240, 138, 0.32)'; // خفيف وشفاف جداً ومتصل
        bestNode.style.borderRight = '4px solid #EAB308'; // شريط جانبي ذهبي أنيق
        bestNode.style.paddingRight = '12px';
        bestNode.style.paddingLeft = '8px';
        bestNode.style.paddingTop = '6px';
        bestNode.style.paddingBottom = '6px';
        bestNode.style.marginTop = '4px';
        bestNode.style.marginBottom = '4px';
        bestNode.style.borderRadius = '6px';
        bestNode.style.boxShadow = '0 1px 4px rgba(234, 179, 8, 0.12)';
        bestNode.style.transition = 'all 0.3s ease';

        // Center the matched clause smoothly in view
        setTimeout(() => {
          bestNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    };

    const doScrollAndHighlight = () => {
      scrollToArticle(targetNum);
      const el = document.getElementById(`lft-art-${targetNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Keep the article frame outline intact exactly as desired
        el.style.outline = '3px solid #0D9488';
        el.style.backgroundColor = 'rgba(13, 148, 136, 0.04)';
        el.style.borderRadius = '8px';
        el.style.boxShadow = '0 0 16px rgba(13, 148, 136, 0.2)';
        el.style.transition = 'all 0.4s ease';

        if (targetHighlightParam) {
          highlightTargetClause(el, targetHighlightParam);
        }
      }
    };

    const timer1 = setTimeout(doScrollAndHighlight, 120);
    const timer2 = setTimeout(doScrollAndHighlight, 450);
    const timer3 = setTimeout(doScrollAndHighlight, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [lawTree, loading, currentPath, lawId]);

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

        {articleError && (
          <div style={{
            margin: '10px 24px 0',
            padding: '10px 16px',
            background: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '8px',
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            zIndex: 10
          }}>
            <span>⚠️ {articleError}</span>
            <button
              onClick={() => setArticleError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

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

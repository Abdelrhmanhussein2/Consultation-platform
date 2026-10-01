// frontend/src/components/Regulations/LegalReader/LegalReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './LegalReader.css';
import LegalArticle from './LegalArticle';
import LegalArticleCompare from './LegalArticleCompare';
import { getLawTree } from '../../../services/legalService';

export default function LegalReader({ lawId, onClose }) {
  const [lawTree, setLawTree] = useState(null);
  const [leftTab, setLeftTab] = useState('content'); // 'content' | 'highlights'
  const [fileTab, setFileTab] = useState('info'); // 'info' | 'origin' | 'description' | 'related' | 'timeline'
  const [showFilePane, setShowFilePane] = useState(true);
  const [showSearchInline, setShowSearchInline] = useState(false);
  const [showPreamble, setShowPreamble] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState(1);
  const [compareArticleNum, setCompareArticleNum] = useState(null);
  const [isSavedInFolders, setIsSavedInFolders] = useState(false);

  // Highlights
  const [highlights, setHighlights] = useState([]);

  // Inline Search
  const [findText, setFindText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const rightPaneRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    getLawTree(lawId).then(data => {
      setLawTree(data);
    });
  }, [lawId]);

  // Track active article while scrolling right pane
  const handleScroll = () => {
    if (!rightPaneRef.current) return;
    const scrollTop = rightPaneRef.current.scrollTop;

    // Show scroll-to-top button after scrolling 120px
    setShowScrollTop(scrollTop > 120);

    if (!lawTree || !lawTree.sections) return;
    for (const section of lawTree.sections) {
      for (const article of section.articles || []) {
        const el = document.getElementById(`art-item-${article.num}`);
        if (el) {
          const top = el.offsetTop - rightPaneRef.current.offsetTop;
          if (scrollTop >= top - 140) {
            setActiveArticleId(article.num);
          }
        }
      }
    }
  };

  const jumpTo = (targetId, artNum = null) => {
    if (artNum !== null) setActiveArticleId(artNum);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Inline Find inside Document
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
        if (
          article.content?.toLowerCase().includes(query) ||
          article.title?.toLowerCase().includes(query) ||
          article.definitions?.some(d => d.term?.toLowerCase().includes(query) || d.value?.toLowerCase().includes(query)) ||
          article.clauses?.some(c => (typeof c === 'string' ? c : c.text)?.toLowerCase().includes(query))
        ) {
          found.push(article.num);
        }
      });
    });
    setMatches(found);
    if (found.length > 0) {
      setCurrentMatchIndex(0);
      jumpTo(`art-item-${found[0]}`, found[0]);
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    jumpTo(`art-item-${matches[nextIdx]}`, matches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    jumpTo(`art-item-${matches[prevIdx]}`, matches[prevIdx]);
  };

  const handleCompareVersion = (artNum) => {
    setCompareArticleNum(artNum);
  };

  if (!lawTree) {
    return ReactDOM.createPortal(
      <div className="advanced-backdrop show">
        <div className="advanced show" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#0D3C5C', fontWeight: 800, fontSize: '15px' }}>
            جاري فتح مساحة القراءة والبحث المتقدم...
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Find active article object & title for bottom card
  let activeArticle = null;
  for (const s of lawTree.sections || []) {
    const found = s.articles?.find(a => a.num === activeArticleId);
    if (found) {
      activeArticle = found;
      break;
    }
  }
  const activeArtTitle = activeArticle
    ? (activeArticle.title?.startsWith('المادة') ? activeArticle.title : `المادة ${activeArticle.num}: ${activeArticle.title}`)
    : 'اسم القانون وبدء العمل به';

  return ReactDOM.createPortal(
    <>
      <div className="advanced-backdrop show" onClick={onClose} />
      <section className={`advanced show ${readingMode ? 'reading-active' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="advanced-head">
          <div className="title">
            <small>البحث المتقدم داخل التشريع</small>
            <strong>{lawTree.title}</strong>
          </div>
          <button className="close" onClick={onClose} title="إغلاق">✕</button>
        </header>

        <div className="dual">
          {/* LEFT INDEPENDENT PANE (TOC & HIGHLIGHTS) */}
          {!readingMode && (
            <aside className="left" id="leftPane">
              <div className="left-tabs">
                <button
                  className={leftTab === 'content' ? 'active' : ''}
                  onClick={() => setLeftTab('content')}
                >
                  الفهرس
                </button>
                <button
                  className={leftTab === 'highlights' ? 'active' : ''}
                  onClick={() => setLeftTab('highlights')}
                >
                  التحديدات {highlights.length > 0 && `(${highlights.length})`}
                </button>
              </div>

              {leftTab === 'content' ? (
                <div id="leftContent">
                  <div className="toc">
                    <button className="toc-item" onClick={() => jumpTo('preamble-box')}>
                      الاطلاع على الديباجة
                    </button>
                    {lawTree.sections?.map(sec =>
                      sec.articles?.map(art => {
                        const label = art.title?.startsWith('المادة') ? art.title : `المادة ${art.num}: ${art.title}`;
                        return (
                          <button
                            key={art.num}
                            className={`toc-item ${activeArticleId === art.num ? 'active' : ''}`}
                            onClick={() => jumpTo(`art-item-${art.num}`, art.num)}
                          >
                            {label}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="left-related">
                    <h4>ملفات ذات صلة <span>↗</span></h4>
                    <small>{activeArtTitle}</small>
                    {activeArticle?.related_files && activeArticle.related_files.length > 0 ? (
                      <ul className="left-related-list">
                        {activeArticle.related_files.map((file, idx) => (
                          <li key={file.id || idx}>
                            <a
                              href={file.url || '#'}
                              onClick={(e) => {
                                e.preventDefault();
                                if (file.url && file.url !== '#') window.open(file.url, '_blank');
                                else alert(`تم فتح: ${file.title || file}`);
                              }}
                            >
                              {file.title || file}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-related">
                        لا توجد ملفات ذات صلة مضافة لهذه المادة في بيانات العرض الحالية.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div id="leftHighlights">
                  <div className="highlights">
                    {highlights.length === 0 ? (
                      <div className="no-highlights">
                        أي ملاحظة أو تحديد تضيفه داخل مواد النص سيظهر هنا.
                      </div>
                    ) : (
                      highlights.map(hl => (
                        <div key={hl.id} className="highlight-card" onClick={() => jumpTo(`art-item-${hl.artNum}`, hl.artNum)}>
                          <div className="hline"><strong>{hl.title}</strong></div>
                          <div style={{ color: '#475569', fontSize: '11.5px', marginTop: '4px' }}>{hl.text}</div>
                          <small>{hl.date}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* RIGHT INDEPENDENT SCROLL PANE */}
          <main className="right" id="rightPane" ref={rightPaneRef} onScroll={handleScroll}>
            <div className="right-inner">
              {/* Sticky Floating Capsule Toolbar */}
              <div className="floating">
                <button className={showFilePane ? 'on' : ''} onClick={() => setShowFilePane(!showFilePane)}>ⓘ معلومات الوثيقة</button>
                <button className={showSearchInline ? 'on' : ''} onClick={() => setShowSearchInline(!showSearchInline)}>⌕ بحث</button>
                <button className={isSavedInFolders ? 'on saved' : ''} onClick={() => setIsSavedInFolders(!isSavedInFolders)}>
                  {isSavedInFolders ? '✓ في مجلداتي' : '＋ أضف إلى مجلداتي'}
                </button>
                <button className={readingMode ? 'on' : ''} onClick={() => setReadingMode(!readingMode)}>◉ وضع القراءة</button>
                <button onClick={() => alert('رابط المشاركة السريع منسوخ')}>↗ مشاركة الملف</button>
              </div>

              {/* Inline Find Bar */}
              {showSearchInline && (
                <div className="inline-find show">
                  <input
                    placeholder="ابحث داخل نص القانون..."
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchText()}
                  />
                  <button onClick={handleSearchText}>بحث</button>
                  <span className="find-count">{matches.length > 0 ? `${currentMatchIndex + 1} / ${matches.length}` : '0 / 0'}</span>
                  <button className="find-nav" onClick={handlePrevMatch} title="السابق">↑</button>
                  <button className="find-nav" onClick={handleNextMatch} title="التالي">↓</button>
                  <button className="find-clear" onClick={() => setShowSearchInline(false)}>×</button>
                </div>
              )}

              {/* File Info Tabs */}
              {showFilePane && (
                <>
                  <div className="file-tabs">
                    <button className={fileTab === 'info' ? 'active' : ''} onClick={() => setFileTab('info')}>معلومات الوثيقة</button>
                    <button className={fileTab === 'origin' ? 'active' : ''} onClick={() => setFileTab('origin')}>أصل الوثيقة</button>
                    <button className={fileTab === 'description' ? 'active' : ''} onClick={() => setFileTab('description')}>وصف الوثيقة</button>
                    <button className={fileTab === 'related' ? 'active' : ''} onClick={() => setFileTab('related')}>ملفات ذات صلة</button>
                    <button className={fileTab === 'timeline' ? 'active' : ''} onClick={() => setFileTab('timeline')}>مراحل التشريع</button>
                  </div>

                  <div className="file-pane">
                    {fileTab === 'info' && (
                      <div className="info-grid">
                        <div>الجريدة الرسمية</div><div>عدد 5320 — ص 7390 — تاريخ النشر: 31-12-2014</div>
                        <div>الرقم</div><div>{lawTree.number || '34'}</div>
                        <div>السنة</div><div>2014</div>
                        <div>حل محل</div><div>قانون مؤقت رقم 28 لسنة 2009 (قانون ضريبة الدخل المؤقت لسنة 2009)</div>
                        <div>تاريخ الصدور</div><div>30-12-2014</div>
                        <div>تاريخ السريان</div><div>01-01-2015</div>
                        <div>تاريخ آخر تعديل</div><div>01-01-2019</div>
                        <div>عدد التعديلات</div><div>1</div>
                        <div>عدد المواد</div><div>{lawTree.sections?.reduce((acc, s) => acc + (s.articles?.length || 0), 0) || 82}</div>
                      </div>
                    )}
                    {fileTab === 'origin' && (
                      <div style={{ padding: '18px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--reg-navy)' }}>أصل الوثيقة الرسمية</h3>
                        <p style={{ fontSize: '12px', color: 'var(--reg-muted)', margin: 0 }}>عرض النسخة الرسمية المنشورة في الجريدة الرسمية وبيانات العدد.</p>
                      </div>
                    )}
                    {fileTab === 'description' && (
                      <div className="document-description-text">
                        {lawTree.title} وتعديلاته المنشور في الجريدة الرسمية بالعدد 5320 على الصفحة 7390 بتاريخ 31-12-2014 والساري بتاريخ 01-01-2015.
                      </div>
                    )}
                    {fileTab === 'related' && (
                      <div className="related-grid">
                        <a href="javascript:void(0)">1- التعليمات التنفيذية رقم 1 لسنة 2019</a>
                        <a href="javascript:void(0)">2- قرار محكمة التمييز بصفتها الحقوقية رقم 1442/2020</a>
                      </div>
                    )}
                    {fileTab === 'timeline' && (
                      <div className="timeline">
                        <div className="timeline-row"><time>01-01-2019</time><div><b>نفاذ التعديلات بموجب القانون المعدل رقم 38 لسنة 2018</b></div></div>
                        <div className="timeline-row"><time>01-01-2015</time><div><b>سريان قانون ضريبة الدخل رقم 34 لسنة 2014</b></div></div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Document Title Header */}
              <div className="law-name">
                <h2>{lawTree.title}</h2>
              </div>

              {/* Preamble Box */}
              <div className="preamble" id="preamble-box">
                <button onClick={() => setShowPreamble(!showPreamble)}>
                  إظهار معلومات وديباجة القانون {showPreamble ? '˄' : '˅'}
                </button>
                {showPreamble && (
                  <div className="preamble-body">
                    الجريدة الرسمية: العدد 5320، الصفحة 7390، تاريخ النشر 31-12-2014، تاريخ السريان 01-01-2015، وآخر تعديل نافذ بتاريخ 01-01-2019.
                  </div>
                )}
              </div>

              {/* Sections and Articles List using LegalArticle Component */}
              {lawTree.sections?.map((section) => (
                <div key={section.section_id}>
                  <div className="law-section-header">
                    <div className="path">الفصل التشريعي</div>
                    <h2>{section.title}</h2>
                  </div>

                  {section.articles?.map((article) => (
                    <LegalArticle
                      key={article.num}
                      article={article}
                      lawTitle={lawTree.title}
                      onCompareVersion={handleCompareVersion}
                    />
                  ))}
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Floating Scroll to Top button - only when scrolled down */}
        {showScrollTop && (
          <button
            type="button"
            className="full-scroll-top-btn"
            onClick={() => rightPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            title="الرجوع للأعلى"
          >
            ↑
          </button>
        )}

        {/* Compare Version Modal */}
        {compareArticleNum && (
          <LegalArticleCompare
            articleNum={compareArticleNum}
            lawTitle={lawTree.title}
            onClose={() => setCompareArticleNum(null)}
          />
        )}

      </section>
    </>,
    document.body
  );
}

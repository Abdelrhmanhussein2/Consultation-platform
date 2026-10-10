// frontend/src/components/Regulations/LegalReader/LegalReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './LegalReader.css';
import LegalArticle from './LegalArticle';
import LegalArticleCompare from './LegalArticleCompare';
import LegalStageSplitReader, { STAGES_CONFIG, getArticlesForStage } from './LegalStageSplitReader';
import RelatedFilesGrid from './RelatedFilesGrid';
import { RELATED_FILES_DATA, FILTER_HIERARCHY } from './relatedFilesData';
import AddToFolderModal from '../../UserPortal/AddToFolderModal';
import { useAuth } from '../../../context/AuthContext';
import { getLawTree, getMockLawDetail } from '../../../services/legalService';

export default function LegalReader({ lawId, onClose }) {
  const { token } = useAuth();
  const [lawTree, setLawTree] = useState(() => getMockLawDetail(lawId));
  const [leftTab, setLeftTab] = useState('content'); // 'content' | 'highlights'
  const [fileTab, setFileTab] = useState('info'); // 'info' | 'description' | 'related' | 'timeline'
  const [showFileInfoModal, setShowFileInfoModal] = useState(false);
  const [modalFileTab, setModalFileTab] = useState('info'); // 'info' | 'description' | 'related' | 'timeline'
  const [showFilePane, setShowFilePane] = useState(true);
  const [showSearchInline, setShowSearchInline] = useState(false);
  const [showPreamble, setShowPreamble] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState(1);
  const [compareArticleNum, setCompareArticleNum] = useState(null);
  const [isSavedInFolders, setIsSavedInFolders] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [splitStage, setSplitStage] = useState(null); // null | '2014_original' | '2018_amending' | '2019_current'
  const [mainStageId, setMainStageId] = useState('2019_current');
  const [showRelatedDrawer, setShowRelatedDrawer] = useState(false);
  const [selectedRelatedFile, setSelectedRelatedFile] = useState(null);
  const [showRelatedFilter, setShowRelatedFilter] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [filterSortOrder, setFilterSortOrder] = useState('relevance');
  const [relatedFilterSearch, setRelatedFilterSearch] = useState('');
  const [isDocPaneMaximized, setIsDocPaneMaximized] = useState(false);

  // Check if saved in folders on mount
  useEffect(() => {
    if (!token) return;
    const currentLawId = String(lawId || lawTree?.law_id || lawTree?.id || '34-2014');
    fetch(`/api/folders/check-status?item_type=regulation&item_id=${encodeURIComponent(currentLawId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setIsSavedInFolders(data.is_saved);
      })
      .catch(() => {});
  }, [token, lawId, lawTree?.law_id, lawTree?.id]);

  // Fetch highlights from database on mount / when law changes
  useEffect(() => {
    if (!token) return;
    const currentLawId = String(lawId || lawTree?.law_id || lawTree?.id || '34-2014');
    fetch(`/api/highlights?law_id=${encodeURIComponent(currentLawId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setHighlights(data.map(h => ({
            id: h.id,
            text: h.text,
            color: h.color || '#3B82F6',
            bgTint: h.bg_tint || '#DBEAFE',
            artNum: h.art_num,
            artTitle: h.art_title,
            date: h.created_at ? new Date(h.created_at).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
            note: h.note,
            starred: !!h.starred
          })));
        }
      })
      .catch(err => {
        console.error('Error fetching highlights:', err);
      });
  }, [token, lawId, lawTree?.id]);

  // Related files data source
  const RELATED_FILES = RELATED_FILES_DATA;
  const RELATED_PREVIEW = RELATED_FILES.slice(0, 10); // first 10 for preview

  // Filtered related files based on selectedFilterCategory and search
  const filteredRelatedFiles = RELATED_FILES.filter((file) => {
    const q = relatedFilterSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      file.title.toLowerCase().includes(q) ||
      (file.meta?.summary && file.meta.summary.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedFilterCategory === 'all') return true;
    return file.meta?.subCategory === selectedFilterCategory ||
           file.meta?.category?.includes(selectedFilterCategory) ||
           file.meta?.type?.includes(selectedFilterCategory);
  }).sort((a, b) => {
    if (filterSortOrder === 'newest') {
      return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
    }
    if (filterSortOrder === 'oldest') {
      return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
    }
    return 0; // relevance / default order
  });

  // Promote a stage version or related document to become the main document
  const handleSetStageAsMain = (docOrStageId) => {
    if (typeof docOrStageId === 'string') {
      const stageId = docOrStageId;
      const stage = STAGES_CONFIG[stageId];
      if (!stage) return;

      setMainStageId(stageId);

      if (stageId === '2019_current') {
        getLawTree(lawId)
          .then(data => {
            if (data) setLawTree(data);
          })
          .catch(() => {});
      } else {
        const stageArticles = getArticlesForStage(stageId, lawTree);
        setLawTree(prev => ({
          ...prev,
          id: stage.id,
          title: stage.title,
          number: stage.meta?.number || prev?.number,
          issueDate: stage.meta?.issueDate || prev?.issueDate,
          effectiveDate: stage.meta?.effectiveDate || prev?.effectiveDate,
          gazette: stage.meta?.gazette || prev?.gazette,
          status: stage.meta?.status || prev?.status,
          sections: [
            {
              id: 1,
              title: 'المواد',
              articles: stageArticles.map(a => ({
                num: a.num,
                title: a.title,
                date: a.date,
                has_definitions: a.num === 2,
                intro_text: a.introText,
                definitions: a.definitions,
                content: a.content || (a.introText ? a.introText + '\n' + (a.definitions?.map(d => `${d.term}: ${d.value}`).join('\n') || '') : '')
              }))
            }
          ]
        }));
      }
      setActiveArticleId(1);
      setSplitStage(null);
      setSelectedRelatedFile(null);
      setShowRelatedDrawer(false);
    } else if (docOrStageId && typeof docOrStageId === 'object') {
      // It's a related document object: promote to main screen!
      const doc = docOrStageId;
      const stageArticles = getArticlesForStage('2014_original', lawTree);
      setLawTree(prev => ({
        ...prev,
        id: `related_${doc.id}`,
        title: doc.title,
        number: doc.meta?.number || 'VI-2020-02',
        issueDate: doc.meta?.date || '1441-06-29',
        effectiveDate: doc.meta?.date || '1441-06-29',
        gazette: doc.meta?.source || 'لجان الفصل في المخالفات والمنازعات الضريبية',
        status: doc.meta?.type || 'قرار / حكم',
        sections: [
          {
            id: 1,
            title: 'المواد',
            articles: stageArticles.map(a => ({
              num: a.num,
              title: a.title,
              date: a.date,
              has_definitions: a.num === 2,
              intro_text: a.introText,
              definitions: a.definitions,
              content: a.content || (a.introText ? a.introText + '\n' + (a.definitions?.map(d => `${d.term}: ${d.value}`).join('\n') || '') : '')
            }))
          }
        ]
      }));
      setActiveArticleId(1);
      setSelectedRelatedFile(null);
      setShowRelatedDrawer(false);
      setSplitStage(null);
    }
  };

  // Highlights & Notes System
  const [highlights, setHighlights] = useState([]);
  const [selectionPopup, setSelectionPopup] = useState({
    visible: false,
    text: '',
    artNum: 1,
    artTitle: '',
    top: 0,
    left: 0
  });
  const [noteModal, setNoteModal] = useState({
    open: false,
    text: '',
    artNum: 1,
    artTitle: '',
    color: '#F59E0B',
    bgTint: '#FEF3C7'
  });
  const [noteInput, setNoteInput] = useState('');

  // 5 Color Palette (matching user screenshot 1)
  const HIGHLIGHT_COLORS = [
    { id: 'red', hex: '#EF4444', bg: '#FEE2E2' },
    { id: 'orange', hex: '#F59E0B', bg: '#FEF3C7' },
    { id: 'blue', hex: '#3B82F6', bg: '#DBEAFE' },
    { id: 'green', hex: '#10B981', bg: '#D1FAE5' },
    { id: 'purple', hex: '#8B5CF6', bg: '#EDE9FE' }
  ];

  // Detect Text Selection in Document
  const handleTextSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text || text.length < 2) return;

      if (!rightPaneRef.current) return;
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (!rightPaneRef.current.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;

      let artEl = range.commonAncestorContainer?.nodeType === 1
        ? range.commonAncestorContainer.closest('.article')
        : range.commonAncestorContainer?.parentElement?.closest('.article');

      let artNum = 1;
      let artTitle = 'المادة 1: التعريفات';
      if (artEl) {
        artNum = parseInt(artEl.id?.replace('art-item-', ''), 10) || 1;
        artTitle = artEl.getAttribute('data-title') || `المادة ${artNum}`;
      }

      const popupWidth = 360;
      const margin = 12;
      const isTopTight = rect.top < 65;

      const topPos = isTopTight ? (rect.bottom + margin) : (rect.top - margin);
      const leftPos = Math.min(
        window.innerWidth - popupWidth / 2 - 16,
        Math.max(popupWidth / 2 + 16, rect.left + rect.width / 2)
      );

      setSelectionPopup({
        visible: true,
        text,
        artNum,
        artTitle,
        top: topPos,
        left: leftPos,
        placeBelow: isTopTight
      });
    }, 20);
  };

  // Close floating popover when clicking outside
  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      if (e.target.closest('.selection-floating-bar') || e.target.closest('.note-modal-dialog')) {
        return;
      }
      setSelectionPopup(prev => prev.visible ? { ...prev, visible: false } : prev);
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  // Copy Selected Text
  const handleCopySelection = (e) => {
    e?.stopPropagation();
    if (selectionPopup.text) {
      navigator.clipboard?.writeText(selectionPopup.text);
    }
    setSelectionPopup(prev => ({ ...prev, visible: false }));
  };

  // Apply Highlight with Color
  const handleApplyHighlight = async (color) => {
    if (!selectionPopup.text) return;
    const text = selectionPopup.text;
    const artNum = selectionPopup.artNum;
    const artTitle = selectionPopup.artTitle;
    const colorHex = color.hex;
    const bgHex = color.bg;
    const currentLawId = String(lawId || lawTree?.id || '34-2014');
    const tempId = 'temp_' + Date.now();

    const newHl = {
      id: tempId,
      text,
      color: colorHex,
      bgTint: bgHex,
      artNum,
      artTitle,
      date: new Date().toLocaleDateString('en-CA'),
      note: null,
      starred: false
    };

    setHighlights(prev => [newHl, ...prev]);
    setLeftTab('highlights');
    setSelectionPopup(prev => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();

    if (token) {
      try {
        const res = await fetch('/api/highlights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            law_id: currentLawId,
            art_num: artNum,
            art_title: artTitle,
            text,
            color: colorHex,
            bg_tint: bgHex,
            note: null,
            starred: false
          })
        });
        if (res.ok) {
          const saved = await res.json();
          setHighlights(prev => prev.map(h => h.id === tempId ? { ...h, id: saved.id } : h));
        }
      } catch (err) {
        console.error('Failed to save highlight to database:', err);
      }
    }
  };

  // Open Add Note Modal
  const handleOpenNoteModal = (e) => {
    e?.stopPropagation();
    setNoteModal({
      open: true,
      text: selectionPopup.text,
      artNum: selectionPopup.artNum,
      artTitle: selectionPopup.artTitle,
      color: '#F59E0B',
      bgTint: '#FEF3C7'
    });
    setNoteInput('');
    setSelectionPopup(prev => ({ ...prev, visible: false }));
  };

  // Save Note (supports multiple notes on the exact same phrase)
  const handleSaveNote = async () => {
    if (!noteModal.text) return;
    const chosenColor = noteModal.color || '#F59E0B';
    const chosenBg = noteModal.bgTint || '#FEF3C7';
    const text = noteModal.text;
    const artNum = noteModal.artNum;
    const artTitle = noteModal.artTitle;
    const noteText = noteInput.trim() || 'ملاحظة';
    const currentLawId = String(lawId || lawTree?.id || '34-2014');
    const tempId = 'temp_' + Date.now();

    const newHl = {
      id: tempId,
      text,
      color: chosenColor,
      bgTint: chosenBg,
      artNum,
      artTitle,
      date: new Date().toLocaleDateString('en-CA'),
      note: noteText,
      starred: false
    };

    setHighlights(prev => [newHl, ...prev]);
    setLeftTab('highlights');
    setNoteModal({ open: false, text: '', artNum: 1, artTitle: '', color: '#F59E0B', bgTint: '#FEF3C7' });
    setNoteInput('');
    window.getSelection()?.removeAllRanges();

    if (token) {
      try {
        const res = await fetch('/api/highlights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            law_id: currentLawId,
            art_num: artNum,
            art_title: artTitle,
            text,
            color: chosenColor,
            bg_tint: chosenBg,
            note: noteText,
            starred: false
          })
        });
        if (res.ok) {
          const saved = await res.json();
          setHighlights(prev => prev.map(h => h.id === tempId ? { ...h, id: saved.id } : h));
        }
      } catch (err) {
        console.error('Failed to save note to database:', err);
      }
    }
  };

  // Delete Highlight or Note
  const handleDeleteHighlight = async (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    if (token && id && !String(id).startsWith('temp_')) {
      try {
        await fetch(`/api/highlights/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to delete highlight from database:', err);
      }
    }
  };

  // Toggle Starred
  const handleToggleStarHighlight = async (id) => {
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, starred: !h.starred } : h));
    if (token && id && !String(id).startsWith('temp_')) {
      try {
        await fetch(`/api/highlights/${id}/toggle-star`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to toggle star highlight in database:', err);
      }
    }
  };

  // Inline Search
  const [findText, setFindText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const rightPaneRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    getLawTree(lawId)
      .then(data => {
        if (data && (data.sections || data.articles)) {
          setLawTree(data);
        }
      })
      .catch(() => {});
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
        <header className="advanced-head">
          <div className="title">
            <small>البحث المتقدم داخل التشريع</small>
            <strong>{lawTree.title}</strong>
          </div>
          <button className="close" onClick={onClose} title="إغلاق">✕</button>
        </header>

        <div className="dual">
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
                          highlights.map(hl => {
                          const cardColor = hl.color || '#3B82F6';
                          return (
                            <div
                              key={hl.id}
                              className={`highlight-card ${hl.note ? 'has-note' : ''}`}
                              style={{
                                borderColor: cardColor,
                                borderWidth: '1.5px',
                                borderStyle: 'solid'
                              }}
                            >
                              {/* Card Top: Dot + Text on right, Delete on left */}
                              <div className="hl-card-top">
                                <div className="hl-card-title-wrap">
                                  <span
                                    className="hl-color-indicator"
                                    style={{ backgroundColor: cardColor }}
                                  />
                                  <strong className="hl-snippet" title={hl.text}>
                                    {hl.text.length > 35 ? `${hl.text.slice(0, 35)}...` : hl.text}
                                  </strong>
                                </div>
                                <button
                                  className="hl-delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHighlight(hl.id);
                                  }}
                                  title="حذف التحديد"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Subtitle / Article Info */}
                              <div className="hl-card-sub">
                                {hl.artTitle || `المادة ${hl.artNum}`}
                              </div>

                              {/* If note exists, show note badge and note box */}
                              {hl.note && (
                                <div className="hl-note-container">
                                  <div
                                    className="hl-note-badge"
                                    style={{
                                      color: cardColor,
                                      backgroundColor: hl.bgTint || `${cardColor}18`
                                    }}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9"></path>
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                    <span>ملاحظة</span>
                                  </div>
                                  <div
                                    className="hl-note-box"
                                    style={{
                                      borderColor: `${cardColor}50`,
                                      backgroundColor: hl.bgTint || `${cardColor}10`
                                    }}
                                  >
                                    {hl.note}
                                  </div>
                                </div>
                              )}

                              {/* Bottom Actions: Star & Popout */}
                              <div className="hl-card-actions">
                                <button
                                  className={`hl-action-icon-btn ${hl.starred ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStarHighlight(hl.id);
                                  }}
                                  title={hl.starred ? 'إزالة من المفضلة' : 'تمييز بنجمة'}
                                >
                                  {hl.starred ? '★' : '☆'}
                                </button>
                                <button
                                  className="hl-action-icon-btn"
                                  onClick={() => jumpTo(`art-item-${hl.artNum}`, hl.artNum)}
                                  title="الانتقال إلى المادة"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  )}
            </aside>
          )}

          {/* RIGHT INDEPENDENT SCROLL PANE */}
          <main className="right" id="rightPane" ref={rightPaneRef} onScroll={handleScroll} onMouseUp={handleTextSelection}>
            <div className="right-inner">
              {/* Sticky Floating Capsule Toolbar */}
              <div className="floating">
                <button className={showFileInfoModal ? 'on' : ''} onClick={() => { setShowFileInfoModal(true); setModalFileTab('info'); }}>ⓘ معلومات الوثيقة</button>
                <button className={showSearchInline ? 'on' : ''} onClick={() => setShowSearchInline(!showSearchInline)}>⌕ بحث</button>
                <button className={isSavedInFolders ? 'on saved' : ''} onClick={() => setShowFolderModal(true)}>
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
                    <button className={fileTab === 'description' ? 'active' : ''} onClick={() => setFileTab('description')}>وصف الوثيقة</button>
                    <button className={fileTab === 'related' ? 'active' : ''} onClick={() => setFileTab('related')}>ملفات ذات صلة</button>
                    <button className={fileTab === 'timeline' ? 'active' : ''} onClick={() => setFileTab('timeline')}>مراحل التشريع</button>
                  </div>

                  <div className={`file-pane ${fileTab === 'timeline' ? 'has-stages' : ''}`}>
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
                    {fileTab === 'description' && (
                      <div className="document-description-text">
                        {lawTree.title} وتعديلاته المنشور في الجريدة الرسمية بالعدد 5320 على الصفحة 7390 بتاريخ 31-12-2014 والساري بتاريخ 01-01-2015.
                      </div>
                    )}
                    {fileTab === 'related' && (
                      <div className="related-section">
                        <RelatedFilesGrid
                          selectedFileId={selectedRelatedFile?.id}
                          onSelectFile={(doc) => {
                            setSelectedRelatedFile(doc);
                            setShowRelatedDrawer(true);
                          }}
                        />
                        <button
                          className="related-all-btn"
                          onClick={() => setShowRelatedDrawer(true)}
                        >
                          كل الملفات ذات الصلة (319)
                        </button>
                      </div>
                    )}
                    {fileTab === 'timeline' && (
                      <div className="stages-outer-box">
                        <div
                          className={`stage-inner-card ${mainStageId === '2014_original' ? 'active' : ''}`}
                          onClick={() => {
                            setReadingMode(false);
                            setSplitStage('2014_original');
                          }}
                        >
                          <div className="stage-date-col">01-01-2015</div>
                          <div className="stage-content-col">
                            <h4 className="stage-col-title">قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر</h4>
                            <p className="stage-col-sub">النسخة السارية عند بدء العمل بالقانون</p>
                            <div className={`stage-action-badge ${mainStageId === '2014_original' ? 'active' : ''}`}>
                              عرض الإصدار
                            </div>
                          </div>
                        </div>

                        <div
                          className={`stage-inner-card ${mainStageId === '2018_amending' ? 'active' : ''}`}
                          onClick={() => {
                            setReadingMode(false);
                            setSplitStage('2018_amending');
                          }}
                        >
                          <div className="stage-date-col">02-12-2018</div>
                          <div className="stage-content-col">
                            <h4 className="stage-col-title">قانون معدل رقم 38 لسنة 2018</h4>
                            <p className="stage-col-sub">التشريع المعدل لقانون ضريبة الدخل</p>
                            <div className={`stage-action-badge ${mainStageId === '2018_amending' ? 'active' : ''}`}>
                              عرض الإصدار
                            </div>
                          </div>
                        </div>

                        <div
                          className={`stage-inner-card ${mainStageId === '2019_current' ? 'active' : ''}`}
                          onClick={() => {
                            setReadingMode(false);
                            setSplitStage('2019_current');
                          }}
                        >
                          <div className="stage-date-col">01-01-2019</div>
                          <div className="stage-content-col">
                            <h4 className="stage-col-title">قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته</h4>
                            <p className="stage-col-sub">النص المدمج النافذ بعد التعديل</p>
                            <div className={`stage-action-badge ${mainStageId === '2019_current' ? 'active' : ''}`}>
                              عرض الإصدار
                            </div>
                          </div>
                        </div>
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
                      highlights={highlights}
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

        {/* OVERLAY: RELATED FILES DRAWER & SPLIT READER OVER BACKGROUND */}
        {/* OVERLAY: RELATED FILES DRAWER & SPLIT READER OVER BACKGROUND */}
        {showRelatedDrawer && (
          <div
            className={`related-overlay-backdrop ${selectedRelatedFile ? 'has-doc-open' : ''} ${isDocPaneMaximized ? 'is-maximized' : ''}`}
            onClick={() => {
              setShowRelatedDrawer(false);
              setSelectedRelatedFile(null);
              setIsDocPaneMaximized(false);
            }}
          >
            <div
              className={`related-overlay-container ${selectedRelatedFile ? 'has-doc-open' : ''} ${isDocPaneMaximized ? 'is-maximized' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Halve: Document Reader Pane */}
              {selectedRelatedFile && (
                <div
                  className={`related-overlay-doc-pane ${isDocPaneMaximized ? 'maximized' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <LegalStageSplitReader
                    stageId="2014_original"
                    relatedDoc={selectedRelatedFile}
                    lawTree={lawTree}
                    isMaximized={isDocPaneMaximized}
                    onToggleMaximize={() => setIsDocPaneMaximized(!isDocPaneMaximized)}
                    onClose={() => {
                      setSelectedRelatedFile(null);
                      setIsDocPaneMaximized(false);
                    }}
                    onSetAsMain={handleSetStageAsMain}
                  />
                </div>
              )}

              {/* Right Halve: Separated Drawer Card */}
              {!isDocPaneMaximized && (
                <div
                  className="related-overlay-drawer-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* The Related Files List Pane */}
                  <div className="related-overlay-list-pane">
                    <div className="left-related-full-head">
                      <div className="left-related-head-right">
                        <button
                          className="left-related-full-close"
                          onClick={() => {
                            setShowRelatedDrawer(false);
                            setSelectedRelatedFile(null);
                            setIsDocPaneMaximized(false);
                          }}
                          title="إغلاق"
                        >
                          ✕
                        </button>
                        <h3 className="left-related-full-title">ملفات ذات صلة</h3>
                      </div>
                      <div className="left-related-head-left">
                        <div className="left-related-full-meta">
                          {selectedFilterCategory === 'all' && !relatedFilterSearch ? '319' : filteredRelatedFiles.length}
                        </div>
                        <button
                          type="button"
                          className={`left-related-filter-btn ${showRelatedFilter ? 'active' : ''}`}
                          onClick={() => setShowRelatedFilter(!showRelatedFilter)}
                          title="تصفية الملفات"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="6" x2="20" y2="6"></line>
                            <line x1="7" y1="12" x2="17" y2="12"></line>
                            <line x1="10" y1="18" x2="14" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="left-related-full-list">
                      {filteredRelatedFiles.length === 0 ? (
                        <div className="related-filter-empty">لا توجد ملفات مطابقة لشروط التصفية</div>
                      ) : (
                        filteredRelatedFiles.map((f) => {
                          const isSelected = selectedRelatedFile?.id === f.id;
                          const docYear = f.year || (f.meta?.date ? f.meta.date.split('-')[0] : '');
                          return (
                            <div
                              key={f.id}
                              className={`left-related-full-item ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedRelatedFile(f)}
                            >
                              {docYear && (
                                <span className="left-related-item-year">({docYear}</span>
                              )}
                              <a
                                href="javascript:void(0)"
                                className={`left-related-full-link ${isSelected ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedRelatedFile(f);
                                }}
                              >
                                {f.title}
                              </a>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* The Dedicated Filter Sidebar Panel (Matching Image 2) */}
                  {showRelatedFilter && (
                    <div className="related-filter-sidebar-panel">
                      <div className="filter-panel-header">
                        <h3 className="filter-panel-title">تصفية الملفات</h3>
                      </div>

                      <div className="filter-panel-body">
                        {/* All Button */}
                        <button
                          type="button"
                          className={`filter-cat-btn all-btn ${selectedFilterCategory === 'all' ? 'active' : ''}`}
                          onClick={() => setSelectedFilterCategory('all')}
                        >
                          <span>الكل</span>
                          <span>(319)</span>
                        </button>

                        {/* Hierarchy Groups */}
                        {FILTER_HIERARCHY.map((grp, gIdx) => (
                          <div className="filter-group" key={gIdx}>
                            <h4 className="filter-group-title">{grp.group}</h4>
                            {grp.sections.map((sec, sIdx) => (
                              <div className="filter-subgroup" key={sIdx}>
                                <h5 className="filter-subgroup-title">{sec.subTitle}</h5>
                                <div className="filter-items-list">
                                  {sec.items.map((item) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      className={`filter-item-btn ${selectedFilterCategory === item.key ? 'active' : ''}`}
                                      onClick={() => setSelectedFilterCategory(item.key)}
                                    >
                                      <span className="filter-item-name">{item.label}</span>
                                      <span className="filter-item-count">({item.count})</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Footer Sort Dropdown */}
                      <div className="filter-panel-footer">
                        <select
                          className="filter-sort-select"
                          value={filterSortOrder}
                          onChange={(e) => setFilterSortOrder(e.target.value)}
                        >
                          <option value="relevance">ترتيب: الأكثر صلة</option>
                          <option value="newest">ترتيب: الأحدث تاريخاً</option>
                          <option value="oldest">ترتيب: الأقدم تاريخاً</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING TEXT SELECTION POPOVER */}
        {selectionPopup.visible && (
          <div
            className={`selection-floating-bar ${selectionPopup.placeBelow ? 'place-below' : ''}`}
            style={{
              position: 'fixed',
              top: `${selectionPopup.top}px`,
              left: `${selectionPopup.left}px`,
              transform: selectionPopup.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              zIndex: 99999
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Action 1: Add Note */}
            <button className="sel-action-btn" onClick={handleOpenNoteModal} title="إضافة ملاحظة">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="18" x2="14" y2="18"></line>
              </svg>
              <span>إضافة ملاحظة</span>
            </button>

            {/* Action 2: Copy Content */}
            <button className="sel-action-btn" onClick={handleCopySelection} title="نسخ المحتوى">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>نسخ المحتوى</span>
            </button>

            <div className="sel-divider" />

            {/* 5 Color Circles */}
            <div className="sel-colors">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.id}
                  className="sel-color-dot"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => handleApplyHighlight(c)}
                  title="تحديد"
                />
              ))}
            </div>
          </div>
        )}

        {/* ADD NOTE MODAL */}
        {noteModal.open && (
          <div className="note-modal-backdrop" onClick={() => setNoteModal({ open: false, text: '', artNum: 1, artTitle: '', color: '#F59E0B', bgTint: '#FEF3C7' })}>
            <div className="note-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="note-modal-head">
                <button
                  className="note-modal-close"
                  onClick={() => setNoteModal({ open: false, text: '', artNum: 1, artTitle: '', color: '#F59E0B', bgTint: '#FEF3C7' })}
                  title="إغلاق"
                >
                  ✕
                </button>
                <h3 className="note-modal-title">إضافة ملاحظة على التحديد</h3>
              </div>

              <div className="note-modal-body">
                {/* Highlighted text preview box */}
                <div className="note-modal-quote">
                  <span className="quote-label">النص المحدد: </span>
                  <span className="quote-text">«{noteModal.text}»</span>
                </div>

                {/* Color choices for Note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 14px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>لون التمييز:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {HIGHLIGHT_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNoteModal(prev => ({ ...prev, color: c.hex, bgTint: c.bg }))}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: (noteModal.color === c.hex) ? '2.5px solid #0D3C5C' : '2px solid transparent',
                          cursor: 'pointer',
                          transform: (noteModal.color === c.hex) ? 'scale(1.18)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                        }}
                        title={c.id}
                      />
                    ))}
                  </div>
                </div>

                {/* Note input */}
                <textarea
                  className="note-modal-textarea"
                  placeholder="اكتب ملاحظتك..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={4}
                  autoFocus
                />

                {/* Footer Save Button */}
                <div className="note-modal-footer">
                  <button className="note-modal-submit" onClick={handleSaveNote}>
                    حفظ الملاحظة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* STAGE DRAWER POPUP */}
      {splitStage && (
        <aside className="stage-over-drawer" onClick={(e) => e.stopPropagation()}>
          <LegalStageSplitReader
            stageId={splitStage}
            lawTree={lawTree}
            onClose={() => setSplitStage(null)}
            onSetAsMain={handleSetStageAsMain}
          />
        </aside>
      )}

      {/* ADD TO FOLDER / FAVORITES MODAL */}
      <AddToFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        item={{
          item_type: 'regulation',
          item_id: String(lawId || lawTree?.law_id || lawTree?.id || '34-2014'),
          title: lawTree?.title || 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته',
          subtitle: 'تشريع ضريبي',
        }}
        onStatusChange={(saved) => setIsSavedInFolders(saved)}
      />

      {/* DOCUMENT INFO MODAL (معلومات الوثيقة) matching واجهة البحث الدلالي.html */}
      {showFileInfoModal && (
        <div className="file-info-modal-backdrop" onClick={() => setShowFileInfoModal(false)}>
          <div className="file-info-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="file-info-modal-head">
              <strong>معلومات الوثيقة</strong>
              <button
                type="button"
                className="modal-x"
                onClick={() => setShowFileInfoModal(false)}
                title="إغلاق"
              >
                ×
              </button>
            </div>
            <div className="file-info-modal-body">
              <div className="file-info-modal-tabs">
                <button
                  className={modalFileTab === 'info' ? 'active' : ''}
                  onClick={() => setModalFileTab('info')}
                >
                  معلومات الوثيقة
                </button>
                <button
                  className={modalFileTab === 'description' ? 'active' : ''}
                  onClick={() => setModalFileTab('description')}
                >
                  وصف الوثيقة
                </button>
                <button
                  className={modalFileTab === 'related' ? 'active' : ''}
                  onClick={() => setModalFileTab('related')}
                >
                  ملفات ذات صلة
                </button>
                <button
                  className={modalFileTab === 'timeline' ? 'active' : ''}
                  onClick={() => setModalFileTab('timeline')}
                >
                  مراحل التشريع
                </button>
              </div>

              {modalFileTab === 'info' && (
                <div className="file-info-modal-pane">
                  <div className="meta">
                    <div>الجريدة الرسمية</div>
                    <div>عدد 5320 — ص 7390 — تاريخ النشر: 31-12-2014</div>
                    <div>الرقم</div>
                    <div>{lawTree.number || '34'}</div>
                    <div>السنة</div>
                    <div>2014</div>
                    <div>حل محل</div>
                    <div>قانون مؤقت رقم 28 لسنة 2009 (قانون ضريبة الدخل المؤقت لسنة 2009)</div>
                    <div>تاريخ الصدور</div>
                    <div>30-12-2014</div>
                    <div>تاريخ السريان</div>
                    <div>01-01-2015</div>
                    <div>تاريخ آخر تعديل</div>
                    <div>01-01-2019</div>
                    <div>عدد التعديلات</div>
                    <div>1</div>
                    <div>عدد المواد</div>
                    <div>{lawTree.sections?.reduce((acc, s) => acc + (s.articles?.length || 0), 0) || 82}</div>
                  </div>
                </div>
              )}

              {modalFileTab === 'description' && (
                <div className="file-info-modal-pane">
                  <div className="document-description-text" style={{ padding: '20px 22px', lineHeight: 2.1 }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1F303B' }}>
                      قانون رقم 34 لسنة 2014 (قانون ضريبة الدخل لسنة 2014) وتعديلاته المنشور في العدد 5320 على الصفحة 7390 بتاريخ 31-12-2014 والساري بتاريخ 01-01-2015 المعدل بقانون معدل رقم 38 لسنة 2018 (قانون معدل لقانون ضريبة الدخل لسنة 2018) المنشور في العدد 5547 على الصفحة 7285 بتاريخ 02-12-2018 والساري بتاريخ 01-01-2019 (تصحيح الخطأ فيه بموجب إعلان تصحيح خطأ المنشور في العدد 5561 على الصفحة 674 بتاريخ 17-02-2019).
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1F303B' }}>
                      والمشار إليه هنا وفيما بعد بالاسم المختصر: <strong>قانون رقم 34 لسنة 2014 (قانون ضريبة الدخل لسنة 2014) وتعديلاته</strong>.
                    </p>
                  </div>
                </div>
              )}

              {modalFileTab === 'related' && (
                <div className="file-info-modal-pane modal-related-grid-wrap">
                  <RelatedFilesGrid
                    selectedFileId={selectedRelatedFile?.id}
                    onSelectFile={(doc) => {
                      setShowFileInfoModal(false);
                      setSelectedRelatedFile(doc);
                      setShowRelatedDrawer(true);
                    }}
                  />
                </div>
              )}

              {modalFileTab === 'timeline' && (
                <div className="file-info-modal-pane">
                  <div className="timeline">
                    <div
                      className="timeline-row clickable"
                      onClick={() => {
                        setShowFileInfoModal(false);
                        setReadingMode(false);
                        setSplitStage('2014_original');
                      }}
                    >
                      <time>2014</time>
                      <div>
                        <b>الإصدار الأصلي — قانون رقم 34 لسنة 2014</b>
                        <span className="version-tag">كما صدر (01-01-2015)</span>
                      </div>
                    </div>
                    <div
                      className="timeline-row clickable"
                      onClick={() => {
                        setShowFileInfoModal(false);
                        setReadingMode(false);
                        setSplitStage('2018_amending');
                      }}
                    >
                      <time>2018</time>
                      <div>
                        <b>قانون معدل رقم 38 لسنة 2018</b>
                        <span className="version-tag">نشر التعديل (02-12-2018)</span>
                      </div>
                    </div>
                    <div
                      className="timeline-row clickable"
                      onClick={() => {
                        setShowFileInfoModal(false);
                        setReadingMode(false);
                        setSplitStage('2019_current');
                      }}
                    >
                      <time>2019</time>
                      <div>
                        <b>نفاذ التعديل — النص المدمج النافذ</b>
                        <span className="version-tag">النص النافذ (01-01-2019)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

// frontend/src/components/Regulations/LegalReader/LegalReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './LegalReader.css';
import LegalArticle from './LegalArticle';
import LegalArticleCompare from './LegalArticleCompare';
import LegalStageSplitReader, { STAGES_CONFIG, getArticlesForStage } from './LegalStageSplitReader';
import AddToFolderModal from '../../UserPortal/AddToFolderModal';
import { useAuth } from '../../../context/AuthContext';
import { getLawTree, getMockLawDetail } from '../../../services/legalService';

export default function LegalReader({ lawId, onClose }) {
  const { token } = useAuth();
  const [lawTree, setLawTree] = useState(() => getMockLawDetail(lawId));
  const [leftTab, setLeftTab] = useState('content'); // 'content' | 'highlights'
  const [fileTab, setFileTab] = useState('info'); // 'info' | 'origin' | 'description' | 'related' | 'timeline'
  const [showFilePane, setShowFilePane] = useState(true);
  const [showSearchInline, setShowSearchInline] = useState(false);
  const [showPreamble, setShowPreamble] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState(1);
  const [compareArticleNum, setCompareArticleNum] = useState(null);
  const [isSavedInFolders, setIsSavedInFolders] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [splitStage, setSplitStage] = useState(null); // null | '2014_original' | '2018_amending' | '2019_current'
  const [mainStageId, setMainStageId] = useState('2019_current');
  const [showRelatedDrawer, setShowRelatedDrawer] = useState(false);
  const [selectedRelatedFile, setSelectedRelatedFile] = useState(null);

  // Check if saved in folders on mount
  useEffect(() => {
    if (!token) return;
    const currentLawId = String(lawId || lawTree?.id || '34-2014');
    fetch(`/api/folders/check-status?item_type=regulation&item_id=${encodeURIComponent(currentLawId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setIsSavedInFolders(data.is_saved);
      })
      .catch(() => {});
  }, [token, lawId, lawTree?.id]);

  // Static related files — replace with API data later
  const RELATED_FILES = [
    {
      id: 1,
      title: 'وثيقة لسنة 2015 (إرشادات عامة لتعبئة إقرار ضريبة الدخل للفترة عام 2015م وما بعدها لسنة 2015)',
      meta: {
        type: 'قرار / حكم',
        numberLabel: 'رقم الحكم',
        number: 'VI-2020-02',
        date: '1441-06-29',
        source: 'لجان الفصل في المخالفات والمنازعات الضريبية',
        summary: 'يتناول القرار مسألة إجرائية مرتبطة بالتسجيل والالتزام الضريبي، وآثارها على المكلف.'
      },
      docTitle: 'قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر'
    },
    {
      id: 2,
      title: 'نظام رقم 40 لسنة 2021 (نظام الأسعار التحويلية لغايات ضريبة الدخل لسنة 2021)',
      meta: {
        type: 'نظام',
        numberLabel: 'رقم النظام',
        number: '40 لسنة 2021',
        date: '2021-09-15',
        source: 'مجلس الوزراء',
        summary: 'تحديد القواعد والتعليمات الواجب اتباعها في تحديد أسعار المعاملات بين الأشخاص ذوي العلاقة.'
      },
      docTitle: 'نظام الأسعار التحويلية رقم 40 لسنة 2021'
    },
    {
      id: 3,
      title: 'قرار لسنة 2018 (قرار بتعيين مدع عام ضريبي لسنة 2018)',
      meta: {
        type: 'قرار',
        numberLabel: 'رقم القرار',
        number: '2018/12',
        date: '2018-05-20',
        source: 'وزارة المالية - دائرة ضريبة الدخل والمبيعات',
        summary: 'قرار بتعيين مدع عام ضريبي لمتابعة القضايا والجرائم الضريبية أمام المحاكم المختصة.'
      },
      docTitle: 'قرار تعيين مدع عام ضريبي لسنة 2018'
    },
    {
      id: 4,
      title: 'تعليمات رقم 4 لسنة 2019 (التعليمات التنفيذية احتساب ضريبة الدخل على الأساس النقدي للشخص الطبيعي المتأتي دخله من المهنة أو الحرفة لسنة 2019)',
      meta: {
        type: 'تعليمات تنفيذية',
        numberLabel: 'رقم التعليمات',
        number: '4 لسنة 2019',
        date: '2019-03-12',
        source: 'دائرة ضريبة الدخل والمبيعات',
        summary: 'تعليمات احتساب ضريبة الدخل على الأساس النقدي لأصحاب المهن والحرف الحرة.'
      },
      docTitle: 'التعليمات التنفيذية رقم 4 لسنة 2019'
    },
    {
      id: 5,
      title: 'جدول لسنة 2010 (جدول نسب الأرباح القائمة لسنة 2010)',
      meta: {
        type: 'جدول نسب',
        numberLabel: 'رقم الجدول',
        number: 'جدول 2010',
        date: '2010-01-01',
        source: 'دائرة ضريبة الدخل والمبيعات',
        summary: 'جدول يحدد نسب الأرباح الإجمالية القائمة لمختلف الأنشطة التجارية والصناعية.'
      },
      docTitle: 'جدول نسب الأرباح القائمة لسنة 2010'
    },
    {
      id: 6,
      title: 'قانون مؤقت رقم 28 لسنة 2009 (قانون ضريبة الدخل المؤقت لسنة 2009) ملغى',
      meta: {
        type: 'قانون مؤقت',
        numberLabel: 'رقم القانون',
        number: '28 لسنة 2009',
        date: '2009-12-30',
        source: 'الجريدة الرسمية',
        summary: 'قانون ضريبة الدخل المؤقت الذي تم إلغاؤه وحل محله قانون ضريبة الدخل رقم 34 لسنة 2014.'
      },
      docTitle: 'قانون ضريبة الدخل المؤقت رقم 28 لسنة 2009 ملغى'
    },
    {
      id: 7,
      title: 'الحكم رقم 193 لسنة 2025 محكمة تمييز حقوق',
      meta: {
        type: 'حكم قضائي',
        numberLabel: 'رقم الحكم',
        number: '193 لسنة 2025',
        date: '2025-02-10',
        source: 'محكمة التمييز بصفتها الحقوقية',
        summary: 'بيان شروط استحقاق الرديات الضريبية ومدد التقادم المسقط للحق في المطالبة بها.'
      },
      docTitle: 'حكم محكمة التمييز حقوق رقم 193 لسنة 2025'
    },
    {
      id: 8,
      title: 'الحكم رقم 10424 لسنة 2024 محكمة تمييز جزاء',
      meta: {
        type: 'حكم قضائي',
        numberLabel: 'رقم الحكم',
        number: '10424 لسنة 2024',
        date: '2024-11-18',
        source: 'محكمة التمييز بصفتها الجزائية',
        summary: 'أركان جريمة التهرب الضريبي والعقوبات المقررة وتطبيقات المادة 66 من القانون.'
      },
      docTitle: 'حكم محكمة التمييز جزاء رقم 10424 لسنة 2024'
    },
    {
      id: 9,
      title: 'الحكم رقم 1 لسنة 2024 - طعون دستورية',
      meta: {
        type: 'حكم دستوري',
        numberLabel: 'رقم الحكم',
        number: '1 لسنة 2024',
        date: '2024-04-05',
        source: 'المحكمة الدستورية',
        summary: 'دستورية فرض الضريبة التصاعدية وعدم تعارضها مع أحكام الدستور الأردني.'
      },
      docTitle: 'حكم المحكمة الدستورية رقم 1 لسنة 2024'
    },
    {
      id: 10,
      title: 'الحكم رقم 101 لسنة 2024 المحكمة الإدارية العليا',
      meta: {
        type: 'حكم قضائي',
        numberLabel: 'رقم الحكم',
        number: '101 لسنة 2024',
        date: '2024-08-22',
        source: 'المحكمة الإدارية العليا',
        summary: 'إلغاء قرار تقدير إداري صادر عن مقدر الضريبة لمخالفته الأصول القانونية.'
      },
      docTitle: 'حكم المحكمة الإدارية العليا رقم 101 لسنة 2024'
    },
    {
      id: 11,
      title: 'الحكم رقم 152 لسنة 2021 بداية حقوق ضريبية',
      meta: {
        type: 'حكم قضائي',
        numberLabel: 'رقم الحكم',
        number: '152 لسنة 2021',
        date: '2021-06-14',
        source: 'محكمة بداية حقوق ضريبية',
        summary: 'تحديد المصاريف المقبولة تنزيلاً من الدخل الإجمالي وفق المادة 9 من القانون.'
      },
      docTitle: 'حكم محكمة بداية حقوق ضريبية رقم 152 لسنة 2021'
    },
    {
      id: 12,
      title: 'الحكم رقم 152 لسنة 2021 بداية حقوق ضريبية',
      meta: {
        type: 'حكم قضائي',
        numberLabel: 'رقم الحكم',
        number: '152 لسنة 2021',
        date: '2021-06-14',
        source: 'محكمة بداية حقوق ضريبية',
        summary: 'تحديد المصاريف المقبولة تنزيلاً من الدخل الإجمالي وفق المادة 9 من القانون.'
      },
      docTitle: 'حكم محكمة بداية حقوق ضريبية رقم 152 لسنة 2021'
    },
    {
      id: 13,
      title: 'نظام رقم 11 لسنة 2021 (نظام ضريبة الدخل في المناطق التنموية لسنة 2021)',
      meta: {
        type: 'نظام',
        numberLabel: 'رقم النظام',
        number: '11 لسنة 2021',
        date: '2021-03-01',
        source: 'الجريدة الرسمية',
        summary: 'حوافز وإعفاءات ضريبة الدخل للأنشطة الاقتصادية داخل المناطق التنموية والحرة.'
      },
      docTitle: 'نظام ضريبة الدخل في المناطق التنموية رقم 11 لسنة 2021'
    },
    {
      id: 14,
      title: 'قرار لسنة 2018 (قرار بإلغاء وتعيين ثانيا عاما ضريبيا لسنة 2018)',
      meta: {
        type: 'قرار',
        numberLabel: 'رقم القرار',
        number: '2018/45',
        date: '2018-09-11',
        source: 'المجلس القضائي',
        summary: 'قرار تشكيل النيابة العامة الضريبية وتعيين نائب عام ضريبي.'
      },
      docTitle: 'قرار تشكيل النيابة العامة الضريبية لسنة 2018'
    },
    {
      id: 15,
      title: 'تعليمات رقم 3 لسنة 2020 (تعليمات تسوية الديون الضريبية المتنازع عليها)',
      meta: {
        type: 'تعليمات تنفيذية',
        numberLabel: 'رقم التعليمات',
        number: '3 لسنة 2020',
        date: '2020-05-18',
        source: 'دائرة ضريبة الدخل والمبيعات',
        summary: 'تعليمات وإجراءات تسوية ومطابقة المطالبات الضريبية العالقة مع المكلفين.'
      },
      docTitle: 'تعليمات تسوية الديون الضريبية لسنة 2020'
    },
    {
      id: 16,
      title: 'قانون رقم 1 لسنة 2016 (قانون ضريبة الدخل لسنة 2016)',
      meta: {
        type: 'قانون',
        numberLabel: 'رقم القانون',
        number: '1 لسنة 2016',
        date: '2016-01-10',
        source: 'الجريدة الرسمية',
        summary: 'تعديلات متعلقة بضريبة الدخل والمناطق الخاصة والتنموية.'
      },
      docTitle: 'قانون ضريبة الدخل لسنة 2016'
    }
  ];
  const RELATED_PREVIEW = RELATED_FILES.slice(0, 10); // first 10 for preview

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
  const handleApplyHighlight = (color) => {
    if (!selectionPopup.text) return;
    const newHl = {
      id: Date.now() + Math.random(),
      text: selectionPopup.text,
      color: color.hex,
      bgTint: color.bg,
      artNum: selectionPopup.artNum,
      artTitle: selectionPopup.artTitle,
      date: new Date().toLocaleDateString('en-CA'),
      note: null,
      starred: false
    };
    setHighlights(prev => [newHl, ...prev]);
    setLeftTab('highlights');
    setSelectionPopup(prev => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
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
  const handleSaveNote = () => {
    if (!noteModal.text) return;
    const chosenColor = noteModal.color || '#F59E0B';
    const chosenBg = noteModal.bgTint || '#FEF3C7';
    const newHl = {
      id: Date.now() + Math.random(),
      text: noteModal.text,
      color: chosenColor,
      bgTint: chosenBg,
      artNum: noteModal.artNum,
      artTitle: noteModal.artTitle,
      date: new Date().toLocaleDateString('en-CA'),
      note: noteInput.trim() || 'ملاحظة',
      starred: false
    };
    setHighlights(prev => [newHl, ...prev]);
    setLeftTab('highlights');
    setNoteModal({ open: false, text: '', artNum: 1, artTitle: '', color: '#F59E0B', bgTint: '#FEF3C7' });
    setNoteInput('');
    window.getSelection()?.removeAllRanges();
  };

  // Delete Highlight or Note
  const handleDeleteHighlight = (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  // Toggle Starred
  const handleToggleStarHighlight = (id) => {
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, starred: !h.starred } : h));
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
                <button className={showFilePane ? 'on' : ''} onClick={() => setShowFilePane(!showFilePane)}>ⓘ معلومات الوثيقة</button>
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
                    <button className={fileTab === 'origin' ? 'active' : ''} onClick={() => setFileTab('origin')}>أصل الوثيقة</button>
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
                    {fileTab === 'origin' && (
                      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 6px 0', color: 'var(--reg-navy)', fontSize: '18px', fontWeight: '800' }}>أصل الوثيقة</h3>
                          <p style={{ fontSize: '13px', color: 'var(--reg-muted)', margin: 0 }}>عرض النسخة الرسمية المنشورة وبيانات العدد وتاريخ النشر.</p>
                        </div>
                        <button
                          onClick={() => setShowOriginModal(true)}
                          style={{
                            background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '10px',
                            padding: '10px 22px', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                            fontFamily: 'Tajawal, sans-serif', display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 2px 8px rgba(13,60,92,0.25)', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          فتح أصل الوثيقة
                        </button>
                      </div>
                    )}
                    {fileTab === 'description' && (
                      <div className="document-description-text">
                        {lawTree.title} وتعديلاته المنشور في الجريدة الرسمية بالعدد 5320 على الصفحة 7390 بتاريخ 31-12-2014 والساري بتاريخ 01-01-2015.
                      </div>
                    )}
                    {fileTab === 'related' && (
                      <div className="related-section">
                        <div className="related-grid">
                          {RELATED_PREVIEW.map((f, idx) => (
                            <a
                              key={f.id}
                              href="javascript:void(0)"
                              className="related-grid-item"
                              onClick={() => {
                                setShowRelatedDrawer(true);
                                setSelectedRelatedFile(f);
                              }}
                            >
                              {idx + 1}- {f.title}
                            </a>
                          ))}
                        </div>
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
        {showRelatedDrawer && (
          <div
            className={`related-overlay-container ${selectedRelatedFile ? 'has-doc-open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* If a file is selected, open its document reader on the left */}
            {selectedRelatedFile && (
              <div className="related-overlay-doc-pane">
                <LegalStageSplitReader
                  stageId="2014_original"
                  relatedDoc={selectedRelatedFile}
                  lawTree={lawTree}
                  onClose={() => setSelectedRelatedFile(null)}
                  onSetAsMain={handleSetStageAsMain}
                />
              </div>
            )}

            {/* The Related Files List Pane */}
            <div className="related-overlay-list-pane">
              <div className="left-related-full-head">
                <div className="left-related-head-right">
                  <button
                    className="left-related-full-close"
                    onClick={() => {
                      setShowRelatedDrawer(false);
                      setSelectedRelatedFile(null);
                    }}
                    title="إغلاق"
                  >
                    ✕
                  </button>
                  <h3 className="left-related-full-title">ملفات ذات صلة</h3>
                </div>
                <div className="left-related-head-left">
                  <span className="left-related-filter-icon" title="تصفية">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6"></line>
                      <line x1="7" y1="12" x2="17" y2="12"></line>
                      <line x1="10" y1="18" x2="14" y2="18"></line>
                    </svg>
                  </span>
                  <div className="left-related-full-meta">319</div>
                </div>
              </div>

              <div className="left-related-full-list">
                {RELATED_FILES.map((f) => {
                  const isSelected = selectedRelatedFile?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      className={`left-related-full-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedRelatedFile(f)}
                    >
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
                })}
              </div>
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
          item_id: String(lawId || lawTree?.id || '34-2014'),
          title: lawTree?.title || 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته',
          subtitle: 'تشريع ضريبي',
        }}
        onStatusChange={(saved) => setIsSavedInFolders(saved)}
      />

      {/* OFFICIAL DOCUMENT MODAL (أصل الوثيقة) */}
      {showOriginModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(13, 60, 92, 0.55)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setShowOriginModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '680px',
              maxHeight: '85vh', overflowY: 'auto', direction: 'rtl', fontFamily: 'Tajawal, sans-serif',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Gazette Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0D3C5C', paddingBottom: '18px', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0D3C5C' }}>المملكة الأردنية الهاشمية</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#F5A52A', marginTop: '2px' }}>الجريدة الرسمية</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '8px' }}>
                <span>العدد: 5320</span>
                <span>•</span>
                <span>تاريخ النشر: 31-12-2014</span>
                <span>•</span>
                <span>الصفحة: 7390</span>
              </div>
            </div>

            {/* Law Heading */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0D3C5C', margin: '0 0 6px 0' }}>
                قانون ضريبة الدخل رقم (34) لسنة 2014
              </h2>
              <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#0D3C5C', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                النسخة الأصلية المنشورة في الجريدة الرسمية
              </span>
            </div>

            {/* Decree Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', lineHeight: '1.8', fontSize: '13.5px', color: '#1E293B', fontStyle: 'italic', textAlign: 'justify' }}>
              "نحن عبد الله الثاني ابن الحسين، ملك المملكة الأردنية الهاشمية، بمقتضى المادة (31) من الدستور، وبناءً على ما قرره مجلسا الأعيان والنواب، نصادق على القانون الآتي ونأمر بإصداره وإضافته إلى قوانين الدولة:"
            </div>

            {/* Preview of Law Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', marginBottom: '6px' }}>المادة (1)</div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  يسمى هذا القانون (قانون ضريبة الدخل لسنة 2014) ويعمل به من تاريخ 1 / 1 / 2015.
                </div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', marginBottom: '6px' }}>المادة (2) - التعاريف</div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  يكون للكلمات والعبارات التالية حيثما وردت في هذا القانون المعاني المخصصة لها أدناه ما لم تدل القرينة على غير ذلك:
                  <ul style={{ margin: '6px 0 0 0', paddingRight: '20px' }}>
                    <li><strong>الوزارة:</strong> وزارة المالية.</li>
                    <li><strong>الوزير:</strong> وزير المالية.</li>
                    <li><strong>الدائرة:</strong> دائرة ضريبة الدخل والمبيعات.</li>
                    <li><strong>المدير:</strong> مدير عام الدائرة.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  window.open('https://www.istd.gov.jo', '_blank');
                }}
                style={{
                  background: '#F1F5F9', color: '#0D3C5C', border: '1px solid #CBD5E1', borderRadius: '10px',
                  padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'
                }}
              >
                المصدر الرسمي ↗
              </button>
              <button
                onClick={() => setShowOriginModal(false)}
                style={{
                  background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '10px',
                  padding: '10px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

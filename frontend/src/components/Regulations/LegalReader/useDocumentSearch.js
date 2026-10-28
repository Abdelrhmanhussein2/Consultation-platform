// frontend/src/components/Regulations/LegalReader/useDocumentSearch.js
// Isolated, reusable in-document search logic & hook
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Creates a case-insensitive RegExp matching Arabic variations and optional diacritics
 */
function createArabicRegex(query) {
  const diacriticsPattern = '[\\u064B-\\u065F\\u0670\\u0640]*';
  const cleanQuery = query
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '');

  if (!cleanQuery) return null;

  const tokens = cleanQuery.split(/(\s+)/);
  const pattern = tokens
    .map((token) => {
      if (/^\s+$/.test(token)) {
        return '\\s+';
      }
      return token
        .split('')
        .map((char) => {
          let charPattern;
          if (/[أإآا]/.test(char)) {
            charPattern = '[أإآا]';
          } else if (/[ةه]/.test(char)) {
            charPattern = '[ةه]';
          } else if (/[يىئ]/.test(char)) {
            charPattern = '[يىئ]';
          } else {
            charPattern = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          }
          return charPattern + diacriticsPattern;
        })
        .join('');
    })
    .join('');

  return new RegExp(pattern, 'gi');
}

/**
 * Cleanly removes all existing search marks and merges adjacent text nodes
 */
function removeHighlights(rootEl) {
  if (!rootEl) return;
  const existingMarks = rootEl.querySelectorAll('mark.lft-search-hit');
  existingMarks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      mark.replaceWith(document.createTextNode(mark.textContent));
    }
  });
  rootEl.normalize();
}

/**
 * Searches and highlights all matches in rootEl
 */
function highlightInDOM(rootEl, query) {
  if (!rootEl || !query || !query.trim()) return [];

  // Remove any previous marks first & normalize text nodes
  removeHighlights(rootEl);

  const regex = createArabicRegex(query);
  if (!regex) return [];

  const textNodes = [];

  const walker = document.createTreeWalker(
    rootEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip search bar controls, floating toolbars, scripts, styles, buttons
        if (
          parent.closest('.lft-inline-search') ||
          parent.closest('.inline-find') ||
          parent.closest('.floating') ||
          parent.closest('button') ||
          parent.closest('script') ||
          parent.closest('style')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  const marks = [];

  for (const node of textNodes) {
    const text = node.nodeValue;
    regex.lastIndex = 0;
    if (!regex.test(text)) continue;
    regex.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
      }

      const mark = document.createElement('mark');
      mark.className = 'lft-search-hit';
      mark.textContent = match[0];
      frag.appendChild(mark);
      marks.push(mark);

      lastIdx = regex.lastIndex;

      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }

    if (node.parentNode) {
      node.parentNode.replaceChild(frag, node);
    }
  }

  return marks;
}

/**
 * useDocumentSearch - Isolated Hook for In-Document Full Text Search
 * @param {React.RefObject} containerRef - Reference to the scrollable container or text root element
 */
export function useDocumentSearch(containerRef) {
  const [findText, setFindText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [matchIndex, setMatchIndex] = useState(-1);
  const marksRef = useRef([]);
  const lastQueryRef = useRef('');

  // Scroll to and highlight current active match
  const activateMatch = useCallback((idx, marksList = marksRef.current) => {
    if (!marksList || !marksList.length || idx < 0 || idx >= marksList.length) return;

    marksList.forEach((m, i) => {
      if (i === idx) {
        m.classList.add('current');
      } else {
        m.classList.remove('current');
      }
    });

    const targetMark = marksList[idx];
    if (targetMark) {
      requestAnimationFrame(() => {
        targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    setMatchIndex(idx);
  }, []);

  // Execute Search
  const doSearch = useCallback((queryOverride) => {
    const q = (queryOverride !== undefined ? queryOverride : findText).trim();
    const container = containerRef?.current;
    if (!container) return 0;

    if (!q) {
      removeHighlights(container);
      marksRef.current = [];
      setMatchCount(0);
      setMatchIndex(-1);
      lastQueryRef.current = '';
      return 0;
    }

    // If same query and already searched, pressing search/Enter advances to next match (stops at last)
    if (q === lastQueryRef.current && marksRef.current.length > 0) {
      if (matchIndex < marksRef.current.length - 1) {
        activateMatch(matchIndex + 1);
      }
      return marksRef.current.length;
    }

    lastQueryRef.current = q;
    const newMarks = highlightInDOM(container, q);
    marksRef.current = newMarks;
    setMatchCount(newMarks.length);

    if (newMarks.length > 0) {
      activateMatch(0, newMarks);
    } else {
      setMatchIndex(-1);
    }

    return newMarks.length;
  }, [findText, containerRef, matchIndex, activateMatch]);

  // Go to Next Match (moves downward only; stops at the end, does not wrap back to top)
  const goToNext = useCallback(() => {
    const len = marksRef.current.length;
    if (len === 0) return;
    if (matchIndex < len - 1) {
      activateMatch(matchIndex + 1);
    }
  }, [matchIndex, activateMatch]);

  // Go to Previous Match (moves upward only; stops at the start, does not wrap to bottom)
  const goToPrev = useCallback(() => {
    const len = marksRef.current.length;
    if (len === 0) return;
    if (matchIndex > 0) {
      activateMatch(matchIndex - 1);
    }
  }, [matchIndex, activateMatch]);

  // Clear & Close Search
  const clearSearch = useCallback(() => {
    const container = containerRef?.current;
    if (container) {
      removeHighlights(container);
    }
    marksRef.current = [];
    setFindText('');
    setMatchCount(0);
    setMatchIndex(-1);
    lastQueryRef.current = '';
  }, [containerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const container = containerRef?.current;
      if (container) removeHighlights(container);
    };
  }, [containerRef]);

  return {
    findText,
    setFindText,
    matchCount,
    matchIndex,
    doSearch,
    goToNext,
    goToPrev,
    clearSearch,
  };
}

export default useDocumentSearch;

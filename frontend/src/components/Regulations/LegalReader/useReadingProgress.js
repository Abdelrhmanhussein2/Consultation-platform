// useReadingProgress.js - Reusable hook and helper to track reading progress and active article
import { useState, useEffect } from 'react';

/**
 * useReadingProgress
 * Hook to track scroll progress smoothly and determine current article
 * @param {React.RefObject} scrollRef - Reference to scrollable container element
 * @param {Array|Object} lawTreeOrArticles - Law tree object or array of articles
 * @returns {{ progressPercent: number, currentArticleNum: number|string, totalArticles: number }}
 */
export function useReadingProgress(scrollRef, lawTreeOrArticles) {
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentArticleNum, setCurrentArticleNum] = useState(1);

  // Extract all articles
  const articles = Array.isArray(lawTreeOrArticles)
    ? lawTreeOrArticles
    : (lawTreeOrArticles?.sections?.flatMap(s => s.articles || []) || []);

  const totalArticles = articles.length || (lawTreeOrArticles?.total_articles || 82);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const calculateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const percent = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
      setProgressPercent(Math.round(percent * 10) / 10);

      // Find currently visible article
      if (articles.length > 0) {
        for (let i = 0; i < articles.length; i++) {
          const art = articles[i];
          const artEl = document.getElementById(`lft-art-${art.num}`);
          if (artEl) {
            const top = artEl.offsetTop - el.offsetTop;
            if (scrollTop >= top - 140) {
              setCurrentArticleNum(art.num);
            }
          }
        }
      }
    };

    calculateProgress();
    el.addEventListener('scroll', calculateProgress, { passive: true });
    return () => el.removeEventListener('scroll', calculateProgress);
  }, [scrollRef, articles]);

  return { progressPercent, currentArticleNum, totalArticles };
}

/**
 * Standalone calculation function for reading percentage
 * @param {number} scrollTop
 * @param {number} scrollHeight
 * @param {number} clientHeight
 * @returns {number} Percentage between 0 and 100
 */
export function calculateReadingProgress(scrollTop, scrollHeight, clientHeight) {
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
}

export default useReadingProgress;

// LegalReadingProgressBar.jsx - Reusable reader progress bar matching Image 1
import React from 'react';
import './LegalReadingProgressBar.css';

/**
 * LegalReadingProgressBar
 * Reusable component showing progress line on top, article counter on right, percentage on left, with bottom white spacing
 * @param {number} progressPercent - Current reading progress (0 - 100)
 * @param {number|string} currentArticleNum - Number/title of active article
 * @param {number} totalArticles - Total number of articles in the regulation
 */
export default function LegalReadingProgressBar({
  progressPercent = 0,
  currentArticleNum = 1,
  totalArticles = 82,
}) {
  const safePercent = Math.min(100, Math.max(0, Number(progressPercent) || 0));

  return (
    <div className="lft-reading-progress-bar-container">
      {/* 1. Progress Track (on top) */}
      <div className="lft-progress-track">
        <div
          className="lft-progress-fill"
          style={{ width: `${safePercent}%` }}
        />
      </div>

      {/* 2. Meta Labels Row (underneath the line: Article on right, Percentage on left) */}
      <div className="lft-progress-meta-row">
        <span className="lft-progress-article-label">
          المادة {currentArticleNum} من {totalArticles}
        </span>
        <span className="lft-progress-percent-label">
          {Math.round(safePercent)}%
        </span>
      </div>
    </div>
  );
}

// LegalFullTextHeader.jsx - Header bar & Tools row matching screenshot layout
import React from 'react';

export default function LegalFullTextHeader({
  title,
  showToc,
  onToggleToc,
  showSearch,
  onToggleSearch,
  onClose,
  printCount = 1,
  downloadCount = 0,
  maxPrint = 20,
  maxDownload = 20,
  onPrint,
  onDownload,
  onCopy,
  onShare,
}) {
  const remPrint = Math.max(0, maxPrint - printCount);
  const remDownload = Math.max(0, maxDownload - downloadCount);

  return (
    <>
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <div className="lft-header">
        <div className="lft-header-right">
          <h2 className="lft-header-title">{title || 'النص الكامل للتشريع'}</h2>
        </div>

        <div className="lft-header-left">
          {/* Quota Badges matching image */}
          <div className="lft-quota-pill">
            <span>التحميل {downloadCount} من {maxDownload} <span className="lft-pill-rem"> (المتبقي {remDownload})</span></span>
            <button className="lft-pill-close" title="إغلاق">✕</button>
          </div>

          <div className="lft-quota-pill">
            <span>الطباعة {printCount} من {maxPrint} <span className="lft-pill-rem"> (المتبقي {remPrint})</span></span>
            <button className="lft-pill-close" title="إغلاق">✕</button>
          </div>

          {/* Close Modal Button */}
          <button className="lft-header-close-btn" onClick={onClose} title="إغلاق النافذة">
            ✕
          </button>
        </div>
      </div>

      {/* ── Tools / Action Navigation Row ──────────────────────── */}
      <div className="lft-tools-row">
        {/* Right side (RTL): Navigation buttons (الفهرس, بحث داخل النص) */}
        <div className="lft-tools-right">
          <button
            className={`lft-nav-toggle-btn ${showToc ? 'active' : ''}`}
            onClick={onToggleToc}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span>الفهرس</span>
          </button>

          <button
            className={`lft-nav-toggle-btn ${showSearch ? 'active' : ''}`}
            onClick={onToggleSearch}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>بحث داخل النص</span>
          </button>
        </div>

        {/* Left side (RTL): Action buttons (طباعة, نسخ النص, مشاركة, تحميل PDF) */}
        <div className="lft-tools-left">
          <button className="lft-action-btn" onClick={onPrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>طباعة</span>
          </button>

          <button className="lft-action-btn" onClick={onCopy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>نسخ النص</span>
          </button>

          <button className="lft-action-btn" onClick={onShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>مشاركة</span>
          </button>

          <button className="lft-action-btn" onClick={onDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            <span>تحميل PDF</span>
          </button>
        </div>
      </div>
    </>
  );
}


// frontend/src/components/AiAssistant/AiHeader.jsx
import React, { useState } from 'react';

export default function AiHeader({
  onOpenHistory,
  onNewChat,
  activeConvo,
  onToggleFavorite,
  onPrint,
  onShare
}) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  return (
    <div className="ai-header-bar">
      {/* Drawer Button */}
      <button className="ai-pill-btn" onClick={onOpenHistory} title="عرض سجل المحادثات السابقة">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>سجل المحادثات</span>
      </button>

      {/* New Chat Button */}
      <button className="ai-pill-btn" onClick={onNewChat} title="بدء محادثة استشارية جديدة">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>محادثة جديدة</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions when conversation exists */}
      {activeConvo && (
        <div className="ai-header-actions">
          {/* Favorite Star */}
          <button
            className={`ai-icon-btn ${activeConvo.is_favorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
            title={activeConvo.is_favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            aria-label="المفضلة"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill={activeConvo.is_favorite ? '#F59E0B' : 'none'} stroke={activeConvo.is_favorite ? '#F59E0B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          {/* Export / Print */}
          <button
            className="ai-icon-btn"
            onClick={onPrint}
            title="تصدير أو طباعة الاستشارة (PDF)"
            aria-label="طباعة"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>

          {/* Share Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="ai-icon-btn"
              onClick={() => setShowShareMenu(!showShareMenu)}
              title="مشاركة الاستشارة"
              aria-label="مشاركة"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {showShareMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  padding: '6px',
                  zIndex: 50,
                  minWidth: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <button
                  className="ai-msg-tool-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => { onShare('link'); setShowShareMenu(false); }}
                >
                  <span>📋</span>
                  <span>نسخ الرابط</span>
                </button>
                <button
                  className="ai-msg-tool-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => { onShare('whatsapp'); setShowShareMenu(false); }}
                >
                  <span>💬</span>
                  <span>واتساب</span>
                </button>
                <button
                  className="ai-msg-tool-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => { onShare('email'); setShowShareMenu(false); }}
                >
                  <span>✉️</span>
                  <span>بريد إلكتروني</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Logo */}
      <div className="ai-brand-badge" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="شعار منصة ديوان"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          onError={(e) => { e.target.src = '/logo_white.png'; }}
        />
      </div>
    </div>
  );
}

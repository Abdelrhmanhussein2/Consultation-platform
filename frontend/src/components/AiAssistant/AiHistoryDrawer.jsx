// frontend/src/components/AiAssistant/AiHistoryDrawer.jsx
import React, { useState, useEffect } from 'react';

export default function AiHistoryDrawer({
  isOpen,
  onClose,
  conversations = [],
  activeId,
  onSelect,
  onDelete,
  onToggleFavorite,
  onEditTitle,
  onNewChat
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const handleSave = (id) => {
    if (editTitle.trim() && onEditTitle) onEditTitle(id, editTitle.trim());
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذه المحادثة نهائياً؟')) {
      onDelete(id);
    }
  };

  return (
    <>
      {/* Backdrop scoped strictly within the assistant card */}
      <div
        className={`ai-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel smoothly sliding from right inside the card */}
      <div
        className={`ai-drawer-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="سجل المحادثات"
      >
        {/* Header */}
        <div className="ai-drawer-header">
          <div className="ai-drawer-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            <span>سجل المحادثات</span>
            {conversations.length > 0 && (
              <span className="ai-drawer-badge">{conversations.length}</span>
            )}
          </div>
          <button
            className="ai-drawer-close-btn"
            onClick={onClose}
            title="إغلاق السجل"
            aria-label="إغلاق"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="ai-drawer-new-btn-wrap">
          <button
            className="ai-drawer-new-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>بدء محادثة جديدة</span>
          </button>
        </div>

        {/* List of Conversations */}
        <div className="ai-drawer-list">
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '40px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
              <p style={{ fontWeight: 600 }}>لا توجد استشارات سابقة حتى الآن</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = String(c.id) === String(activeId);
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  className={`ai-drawer-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (!isEditing) {
                      onSelect(c.id);
                      onClose();
                    }
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(c.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '7px',
                          border: '1.5px solid #F59E0B',
                          fontSize: '12.5px',
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleSave(c.id)}
                        style={{
                          background: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '7px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          background: '#F1F5F9',
                          color: '#64748B',
                          border: 'none',
                          borderRadius: '7px',
                          padding: '6px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="ai-drawer-card-title">{c.title || 'استشارة بدون عنوان'}</div>
                      <div className="ai-drawer-card-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{formatDate(c.updated_at || c.created_at)}</span>
                      </div>
                    </div>
                  )}

                  <div className="ai-drawer-card-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ai-drawer-icon-btn"
                      onClick={() => onToggleFavorite(c.id)}
                      title={c.is_favorite ? 'إزالة من المفضلة' : 'تفضيل'}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill={c.is_favorite ? '#EF4444' : 'none'}
                        stroke={c.is_favorite ? '#EF4444' : '#94A3B8'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="ai-drawer-icon-btn"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditTitle(c.title || '');
                        }}
                        title="تعديل العنوان"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>

                      <button
                        className="ai-drawer-icon-btn danger"
                        onClick={(e) => handleDelete(e, c.id)}
                        title="حذف المحادثة"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

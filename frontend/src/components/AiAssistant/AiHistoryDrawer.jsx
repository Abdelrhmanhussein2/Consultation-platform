// frontend/src/components/AiAssistant/AiHistoryDrawer.jsx
import React, { useState } from 'react';

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

  if (!isOpen) return null;

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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '350px', maxWidth: '90vw', background: '#FFF', zIndex: 9999, display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: "'Cairo', sans-serif", boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px', color: '#0D3C5C' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
            <span>سجل المحادثات</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <button onClick={() => { onNewChat(); onClose(); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#F59E0B', color: '#FFF', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>+</span><span>محادثة جديدة</span>
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {conversations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '30px' }}>لا توجد استشارات سابقة</p>
          ) : (
            conversations.map((c) => {
              const isActive = String(c.id) === String(activeId);
              const isEditing = editingId === c.id;

              return (
                <div key={c.id} style={{ borderRadius: '12px', border: isActive ? '1.5px solid #F59E0B' : '1px solid #E2E8F0', background: '#FFF', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave(c.id)} style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #F59E0B', fontSize: '12px' }} />
                      <button onClick={() => handleSave(c.id)} style={{ background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditingId(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div onClick={() => { onSelect(c.id); onClose(); }} style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0D3C5C', lineHeight: 1.4, marginBottom: '4px' }}>{c.title}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>{formatDate(c.updated_at || c.created_at)}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F8FAFC', paddingTop: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id); }} title="تفضيل" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={c.is_favorite ? "#EF4444" : "none"} stroke={c.is_favorite ? "#EF4444" : "#94A3B8"} strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditTitle(c.title || ''); }} title="تعديل" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                      </button>
                      <button onClick={(e) => handleDelete(e, c.id)} title="حذف" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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

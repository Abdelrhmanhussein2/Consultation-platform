// frontend/src/components/AiAssistant/AiHistoryDrawer.jsx
import React from 'react';

export default function AiHistoryDrawer({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onToggleFavorite,
  onNewChat
}) {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 99980
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '340px',
          maxWidth: '90vw',
          background: '#FFFFFF',
          boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
          zIndex: 99990,
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
          fontFamily: "'Tajawal', sans-serif"
        }}
      >
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px', color: '#0D3C5C' }}>
            <span style={{ color: '#D97706' }}>🕒</span>
            <span>سجل المحادثات</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <button
            onClick={() => { onNewChat(); onClose(); }}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>➕</span>
            <span>محادثة جديدة</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conversations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '40px' }}>لا توجد استشارات سابقة</p>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <div
                  key={c.id}
                  style={{
                    borderRadius: '12px',
                    border: isActive ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                    background: isActive ? '#FFFBEB' : '#FFFFFF',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { onSelect(c.id); onClose(); }}
                    style={{ width: '100%', textAlign: 'right', padding: '12px 14px 8px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1E293B', lineHeight: 1.4 }}>{c.title}</p>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                      {formatDate(c.updated_at || c.created_at)}
                    </span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 8px', borderTop: '1px solid #F1F5F9' }}>
                    <button onClick={() => onDelete(c.id)} title="حذف" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}>
                      🗑️
                    </button>
                    <button
                      onClick={() => onToggleFavorite(c.id, !c.is_favorite)}
                      title="المفضلة"
                      style={{ background: 'none', border: 'none', color: c.is_favorite ? '#F59E0B' : '#94A3B8', cursor: 'pointer', fontSize: '14px' }}
                    >
                      {c.is_favorite ? '★' : '☆'}
                    </button>
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

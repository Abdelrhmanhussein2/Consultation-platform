// frontend/src/components/AiAssistant/AiHistoryDrawer.jsx
import React, { useState } from 'react';

export default function AiHistoryDrawer({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onToggleFavorite,
  onEditTitle,
  onNewChat
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const startEditing = (e, c) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitleValue(c.title || '');
  };

  const handleSaveTitle = (e, id) => {
    e.stopPropagation();
    const clean = editTitleValue.trim();
    if (clean && onEditTitle) {
      onEditTitle(id, clean);
    }
    setEditingId(null);
  };

  const handleCancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Background Overlay */}
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

      {/* Drawer Body */}
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
              const isActive = String(c.id) === String(activeId);
              const isEditing = String(editingId) === String(c.id);

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
                  {isEditing ? (
                    <div style={{ padding: '10px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(e, c.id);
                          if (e.key === 'Escape') handleCancelEditing(e);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: '12px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #F59E0B',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveTitle(e, c.id)}
                        title="حفظ"
                        style={{ background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        title="إلغاء"
                        style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
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
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 8px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                        title="حذف المحادثة"
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                      >
                        🗑️
                      </button>
                      <button
                        onClick={(e) => startEditing(e, c)}
                        title="تعديل اسم المحادثة"
                        style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                      >
                        ✏️
                      </button>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id, !c.is_favorite); }}
                      title={c.is_favorite ? "إلغاء التثبيت" : "تثبيت المحادثة"}
                      style={{ background: 'none', border: 'none', color: c.is_favorite ? '#F59E0B' : '#94A3B8', cursor: 'pointer', fontSize: '15px', padding: '2px' }}
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

      {/* Sleek In-App Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div
          onClick={() => setConfirmDeleteId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            direction: 'rtl',
            fontFamily: "'Tajawal', sans-serif"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#EF4444',
                fontSize: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              🗑️
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              حذف المحادثة نهائياً
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              هل أنت متأكد من حذف هذه المحادثة ورسائلها نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  onDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                نعم، احذف
              </button>

              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

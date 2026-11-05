import React, { useEffect } from 'react';

const TrashIcon = ({ size = 22, color = '#EF4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default function ConfirmModal({
  isOpen,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه.',
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  onConfirm,
  onClose
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13, 60, 92, 0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', direction: 'rtl',
        animation: 'tdFade 0.18s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '28px 24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(13, 60, 92, 0.22)',
          textAlign: 'center',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
      >
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#FEE2E2', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <TrashIcon size={24} color="#EF4444" />
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0D3C5C', margin: '0 0 8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 22px', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '9px',
              border: '1px solid #CBD5E1', background: '#F8FAFC',
              color: '#475569', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', transition: '0.15s', fontFamily: 'inherit'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '9px',
              border: 'none', background: '#EF4444',
              color: '#FFFFFF', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', transition: '0.15s', fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


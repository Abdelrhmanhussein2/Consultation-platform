// frontend/src/components/Regulations/SelectionMenu.jsx
import React from 'react';

export default function SelectionMenu({ position, selectedText, onHighlight, onAddNote, onCopy, onClose }) {
  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top - 50}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        background: '#0D3C5C',
        color: '#fff',
        borderRadius: '12px',
        padding: '6px 12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        fontFamily: 'var(--reg-font)'
      }}
    >
      <button
        style={{ background: 'transparent', border: 'none', color: '#FDE047', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        onClick={() => onHighlight('#FEF08A')}
      >
        🎨 تظليل
      </button>
      <span style={{ opacity: 0.3 }}>|</span>
      <button
        style={{ background: 'transparent', border: 'none', color: '#93C5FD', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        onClick={onAddNote}
      >
        📝 ملاحظة
      </button>
      <span style={{ opacity: 0.3 }}>|</span>
      <button
        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        onClick={onCopy}
      >
        📋 نسخ
      </button>
    </div>
  );
}

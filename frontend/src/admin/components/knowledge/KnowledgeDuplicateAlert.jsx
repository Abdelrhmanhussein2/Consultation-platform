import React from 'react';

export default function KnowledgeDuplicateAlert({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#991B1B',
        fontSize: '13px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}


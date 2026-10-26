// frontend/src/components/AiAssistant/AiArticleModal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function AiArticleModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && item) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const articleNum = item.paragraph ? `${item.article}/${item.paragraph}` : (item.article || '—');
  const status = item.status || 'ساري';
  const statusColor = status === 'ساري' ? '#16A34A' : '#D97706';

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12, 43, 62, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 99995,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
          fontFamily: "'Cairo', sans-serif",
          overflow: 'hidden'
        }}
      >
        {/* Modal Head */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0D3C5C' }}>
              المادة {articleNum}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>
              {item.source}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 4 Metadata Boxes */}
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>الفقرة:</span>
            <span style={{ fontWeight: 700 }}>{item.paragraph || '—'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>رقم المادة:</span>
            <span style={{ fontWeight: 700 }}>{item.article || '—'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>الحالة:</span>
            <span style={{ fontWeight: 700, color: statusColor }}>{status}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>التاريخ:</span>
            <span style={{ fontWeight: 700 }}>{item.year || '2021'}</span>
          </div>
        </div>

        {/* Article Text */}
        <div style={{ padding: '0 20px 16px', flex: 1, overflowY: 'auto' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            نص المادة:
          </span>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #FCD34D',
              background: '#FFFBEB',
              color: '#78350F',
              fontSize: '13px',
              lineHeight: 1.7,
              fontStyle: 'italic'
            }}
          >
            "{item.quote || 'النص الكامل للمادة متاح ومفهرس بالشبكة المعرفية...'}"
          </div>
        </div>

        {/* Footer Link to ISTD */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <a
            href="https://istd.gov.jo"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '12px', color: '#D97706', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>المصدر: دائرة ضريبة الدخل والمبيعات الأردنية</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

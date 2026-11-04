// frontend/src/components/TaxForms/TaxDisclosurePlaceholder.jsx
import React from 'react';

const ShieldCheckIcon = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default function TaxDisclosurePlaceholder({ onBackToForms }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '18px',
      padding: '48px 24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(13, 60, 92, 0.04)',
      maxWidth: '680px',
      margin: '20px auto 0'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '18px',
        background: 'rgba(245, 165, 42, 0.12)',
        color: '#E58A13',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 18px auto'
      }}>
        <ShieldCheckIcon size={30} color="#E58A13" />
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0D3C5C', margin: '0 0 8px 0' }}>
        الكشف الضريبي الذكي
      </h2>

      <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.8', margin: '0 0 22px 0' }}>
        جاري تهيئة وإعداد منظومة الكشف والإقرار الضريبي المتكاملة وفق أحدث المعايير والأنظمة المعتمدة في المملكة الأردنية الهاشمية.
      </p>

      {onBackToForms && (
        <button
          type="button"
          onClick={onBackToForms}
          style={{
            background: '#0D3C5C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          العودة إلى النماذج الرسمية ←
        </button>
      )}
    </div>
  );
}


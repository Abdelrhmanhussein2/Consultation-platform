import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(13, 60, 92, 0.05)',
      border: '1px solid #E2E8F0',
      animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(245, 165, 42, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        color: '#F5A52A'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '800',
        color: '#0D3C5C',
        marginBottom: '12px'
      }}>
        صفحة {title}
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#64748B',
        maxWidth: '450px',
        lineHeight: '1.6',
        margin: '0 auto 24px'
      }}>
        هذه الصفحة قيد التطوير والبرمجة حالياً وسوف تتوفر قريباً في التحديثات القادمة لمنصة ديوان.
      </p>
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#F5A52A',
        backgroundColor: 'rgba(245, 165, 42, 0.08)',
        padding: '8px 20px',
        borderRadius: '20px',
        display: 'inline-block'
      }}>
        قريباً • Under Development
      </div>
    </div>
  );
}

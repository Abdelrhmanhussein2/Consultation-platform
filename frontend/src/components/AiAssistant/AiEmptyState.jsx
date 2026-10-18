// frontend/src/components/AiAssistant/AiEmptyState.jsx
import React from 'react';
import { PROMPT_TEMPLATES } from './aiAssistantData';

export default function AiEmptyState({ onPickPrompt }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 16px 24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 12px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          boxShadow: '0 6px 18px rgba(217, 119, 6, 0.25)'
        }}
      >
        ✨
      </div>

      {/* Title */}
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0D3C5C', margin: '0 0 6px' }}>
        مساعد ديوان الذكي
      </h2>

      {/* Subtitle */}
      <p style={{ color: '#64748B', maxWidth: '560px', margin: '0 auto 18px', lineHeight: 1.5, fontSize: '13px' }}>
        اسألني عن أي موضوع ضريبي — أجيب وفق منهجية قانونية صارمة، مع مراجع قابلة للنقر.
      </p>

      {/* 4 Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px',
          width: '100%'
        }}
      >
        {PROMPT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPickPrompt(t.text)}
            style={{
              textAlign: 'right',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F59E0B';
              e.currentTarget.style.background = '#FFFBEB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#D97706', marginBottom: '4px' }}>
              {t.title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5 }}>
              {t.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

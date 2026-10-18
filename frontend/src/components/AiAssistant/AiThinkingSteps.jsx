// frontend/src/components/AiAssistant/AiThinkingSteps.jsx
import React, { useState, useEffect } from 'react';
import { THINKING_STEPS } from './aiAssistantData';

export default function AiThinkingSteps() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        padding: '18px 22px',
        maxWidth: '650px',
        width: '100%',
        borderRadius: '16px',
        border: '1px solid #FCD34D',
        background: '#FFFDF5',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
      }}
    >
      {/* Header with timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#92400E', marginBottom: '14px' }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
        <span>المستشار يحلل الحالة الآن…</span>
        <span style={{ marginRight: 'auto', fontSize: '12px', color: '#B45309', fontFamily: 'monospace' }}>
          {(elapsed / 1000).toFixed(1)} ث
        </span>
      </div>

      {/* Steps List */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {THINKING_STEPS.map((step) => {
          const isDone = elapsed >= step.delay + 300;
          const isCurrent = !isDone && elapsed >= step.delay - 200;

          return (
            <li
              key={step.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: isDone ? '#15803D' : isCurrent ? '#B45309' : '#94A3B8',
                fontWeight: isCurrent ? 700 : 500,
                transition: 'color 0.2s ease'
              }}
            >
              {isDone ? (
                <span style={{ color: '#16A34A', fontSize: '14px' }}>✓</span>
              ) : isCurrent ? (
                <span style={{ color: '#F59E0B', fontSize: '12px' }}>●</span>
              ) : (
                <span style={{ color: '#CBD5E1', fontSize: '12px' }}>○</span>
              )}
              <span>{step.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

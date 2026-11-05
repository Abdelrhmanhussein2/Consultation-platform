import React from 'react';

export default function AiMonitoringCards({ summary }) {
  const s = summary || {};
  const totalRequests = (s.total_requests || 0).toLocaleString();
  const totalSessions = (s.total_sessions || 0).toLocaleString();
  const totalTokens = (s.total_tokens || 0).toLocaleString();
  const cacheHitRate = `${s.cache_hit_rate || 0}%`;

  const cards = [
    { title: 'استعلامات AI', value: totalRequests, color: '#0F172A', sub: `${s.saved_llm_calls || 0} من الكاش` },
    { title: 'محادثات', value: totalSessions, color: '#0F172A', sub: 'جلسات استشارية' },
    { title: 'Tokens', value: totalTokens, color: '#0F172A', sub: `${(s.saved_tokens || 0).toLocaleString()} موفرة` },
    { title: 'نسبة التوفير بالكاش', value: cacheHitRate, color: '#16A34A', sub: `${s.saved_llm_calls || 0} استجابة فورية من الكاش` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' }}>
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 900, color: c.color, lineHeight: 1.2 }}>
            {c.value}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>
            {c.title}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useState } from 'react';

export default function AiMonitoringChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const items = data && data.length > 0 ? data : [
    { date: 'لا توجد بيانات', requests: 0, cache_hits: 0, saved_tokens: 0 }
  ];

  const maxVal = Math.max(...items.map(d => d.requests || 0), 5);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            معدل الاستعلامات اليومي ونشاط الكاش
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            توزيع الاستعلامات اليومية بين استدعاءات LLM المباشرة واستجابات الكاش
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0284C7' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284C7' }}></span>
            استعلامات الكاش
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#CBD5E1' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#CBD5E1' }}></span>
            استعلامات جديدة
          </span>
        </div>
      </div>

      <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '20px' }}>
        {items.map((item, idx) => {
          const req = item.requests || 0;
          const hits = item.cache_hits || 0;
          const totalHeightPct = Math.round((req / maxVal) * 100);
          const cacheHeightPct = req > 0 ? Math.round((hits / req) * 100) : 0;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '105%',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{item.date}</div>
                  <div>إجمالي: {req}</div>
                  <div>كاش: {hits}</div>
                  <div>توكينز موفرة: {(item.saved_tokens || 0).toLocaleString()}</div>
                </div>
              )}

              <div
                style={{
                  width: '100%',
                  height: `${Math.max(totalHeightPct, 6)}%`,
                  background: '#E2E8F0',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${cacheHeightPct}%`,
                    background: '#0284C7',
                    transition: 'height 0.3s ease'
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: '10px',
                  color: isHovered ? '#0F172A' : '#94A3B8',
                  marginTop: '6px',
                  fontWeight: isHovered ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '45px',
                  textAlign: 'center'
                }}
              >
                {item.date ? item.date.slice(-5) : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


import React, { useState } from 'react';

export default function AiCacheHistogram({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const items = data && data.length > 0 ? data : [
    { date: '1/11', cache_hits: 0, saved_tokens: 0 }
  ];

  const maxHits = Math.max(...items.map(d => d.cache_hits || 0), 5);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', marginBottom: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            مخطط نشاط الكاشينج اليومي (Cache Hits & Tokens Saved)
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            رصد زمني فوري لعدد مرات الاستجابة من الكاش وحجم التوكينز التي تم توفيرها يومياً
          </p>
        </div>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '4px 10px', borderRadius: '6px' }}>
          نشاط الكاش
        </span>
      </div>

      <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '16px' }}>
        {items.map((item, idx) => {
          const hits = item.cache_hits || 0;
          const heightPct = Math.round((hits / maxHits) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
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
                    padding: '5px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{item.date}</div>
                  <div>استدعاءات الكاش: {hits}</div>
                  <div>التوفير: {(item.saved_tokens || 0).toLocaleString()} token</div>
                </div>
              )}

              <div
                style={{
                  width: '100%',
                  height: `${Math.max(heightPct, 6)}%`,
                  background: isHovered ? '#0284C7' : '#38BDF8',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s ease'
                }}
              />

              <span
                style={{
                  fontSize: '10px',
                  color: isHovered ? '#0F172A' : '#94A3B8',
                  marginTop: '5px',
                  fontWeight: isHovered ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '45px',
                  textAlign: 'center'
                }}
              >
                {item.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


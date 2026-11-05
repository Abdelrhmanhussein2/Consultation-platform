import React, { useState } from 'react';

export default function AiDailyUsageChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const items = data || [];

  const maxVal = Math.max(...items.map(d => d.requests || 0), 10);
  const width = 560;
  const height = 180;
  const paddingX = 35;
  const paddingY = 25;

  const points = items.map((d, i) => {
    const x = paddingX + (i / Math.max(items.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.requests || 0) / maxVal) * (height - 2 * paddingY);
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>استعمالات AI اليومية</h2>
        {hoveredPoint && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', background: '#F0F9FF', padding: '2px 8px', borderRadius: '4px' }}>
            {hoveredPoint.data.date}: {hoveredPoint.data.requests} استعلام
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
          لا توجد بيانات استعلامات مسجلة في هذه الفترة حتى الآن
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width: '100%', height: '190px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E3B5E" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0E3B5E" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 0.5, 1].map((pct, idx) => {
                const y = height - paddingY - pct * (height - 2 * paddingY);
                return (
                  <g key={idx}>
                    <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={paddingX - 10} y={y + 3} fill="#94A3B8" fontSize="10" textAnchor="end">{Math.round(pct * maxVal)}</text>
                  </g>
                );
              })}

              {areaD && <path d={areaD} fill="url(#usageGradient)" />}
              {pathD && <path d={pathD} fill="none" stroke="#0E3B5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.data === p.data ? 5.5 : 3.5}
                  fill="#FFFFFF"
                  stroke="#0E3B5E"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '4px' }}>
            {items.map((d, i) => (
              <span key={i} style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>{d.date}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

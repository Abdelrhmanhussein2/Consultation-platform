import React, { useState } from 'react';

export default function RevenueSourcesChart() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = [
    { name: 'الاشتراكات', value: 0, y: 42, barY: 26, width: 0 },
    { name: 'جلسات\nالمستشارين', value: 0, y: 88, barY: 76, width: 0, multiLine: true },
    { name: 'الأدوات والنماذج', value: 0, y: 142, barY: 126, width: 0 },
    { name: 'AI', value: 165.88, y: 192, barY: 176, width: 235 }
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">مصادر الإيراد</h3>
      </div>

      <div style={{ height: '230px', width: '100%', position: 'relative', marginTop: '8px' }}>
        <svg 
          viewBox="0 0 380 220" 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Vertical Grid Lines */}
          <line x1="105" y1="15" x2="105" y2="210" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="220" y1="15" x2="220" y2="210" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="335" y1="15" x2="335" y2="210" stroke="#F1F5F9" strokeWidth="1" />

          {/* Hover highlight background */}
          {hoveredIndex !== null && (
            <rect 
              x="105" 
              y={data[hoveredIndex].barY - 6} 
              width="240" 
              height="44" 
              fill="#F8FAFC" 
              opacity="0.9"
            />
          )}

          {/* Y Axis Labels */}
          {data.map((d, i) => (
            <g key={i}>
              {d.multiLine ? (
                <>
                  <text x="96" y="82" fontSize="12" fill="#64748B" textAnchor="end" fontFamily="Tajawal, sans-serif" fontWeight="500">
                    جلسات
                  </text>
                  <text x="96" y="96" fontSize="12" fill="#64748B" textAnchor="end" fontFamily="Tajawal, sans-serif" fontWeight="500">
                    المستشارين
                  </text>
                </>
              ) : (
                <text 
                  x="96" 
                  y={d.y} 
                  fontSize="12.5" 
                  fill="#64748B" 
                  textAnchor="end" 
                  fontFamily="Tajawal, sans-serif"
                  fontWeight="500"
                >
                  {d.name}
                </text>
              )}

              {/* Horizontal Bar */}
              {d.width > 0 && (
                <rect
                  x="105"
                  y={d.barY}
                  width={d.width}
                  height="32"
                  rx="4"
                  fill="#E58A13"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              )}

              {/* Invisible touch/hover area */}
              <rect
                x="10"
                y={d.barY - 6}
                width="340"
                height="44"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '10px 16px',
              textAlign: 'center',
              zIndex: 30,
              pointerEvents: 'none',
              minWidth: '140px'
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
              {data[hoveredIndex].name.replace('\n', ' ')}
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#E58A13' }}>
              القيمة : {data[hoveredIndex].value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

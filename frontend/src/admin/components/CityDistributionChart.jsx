import React, { useState } from 'react';

export default function CityDistributionChart() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = [
    { name: 'عمان', value: 7, x: 65, width: 105, y: 40, height: 130, color: '#0F2438' },
    { name: 'غير محدد', value: 1, x: 195, width: 105, y: 152, height: 18, color: '#E58A13' }
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">توزيع المستخدمين حسب المدينة</h3>
      </div>

      <div style={{ height: '230px', width: '100%', position: 'relative', marginTop: '8px' }}>
        <svg 
          viewBox="0 0 350 220" 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Horizontal Gridlines */}
          <line x1="38" y1="20" x2="335" y2="20" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="38" y1="58" x2="335" y2="58" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="38" y1="95" x2="335" y2="95" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="38" y1="133" x2="335" y2="133" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="38" y1="170" x2="335" y2="170" stroke="#E2E8F0" strokeWidth="1" />

          {/* Y Axis Numbers */}
          <text x="26" y="24" fontSize="11.5" fill="#94A3B8" textAnchor="end" fontFamily="Tajawal, sans-serif">8</text>
          <text x="26" y="62" fontSize="11.5" fill="#94A3B8" textAnchor="end" fontFamily="Tajawal, sans-serif">6</text>
          <text x="26" y="99" fontSize="11.5" fill="#94A3B8" textAnchor="end" fontFamily="Tajawal, sans-serif">4</text>
          <text x="26" y="137" fontSize="11.5" fill="#94A3B8" textAnchor="end" fontFamily="Tajawal, sans-serif">2</text>
          <text x="26" y="174" fontSize="11.5" fill="#94A3B8" textAnchor="end" fontFamily="Tajawal, sans-serif">0</text>

          {/* Vertical Bars */}
          {data.map((d, i) => (
            <g key={i}>
              <rect
                x={d.x}
                y={d.y}
                width={d.width}
                height={d.height}
                rx="4"
                fill={d.color}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* X Axis Label */}
              <text
                x={d.x + d.width / 2}
                y="195"
                fontSize="13"
                fontWeight="700"
                fill="#64748B"
                textAnchor="middle"
                fontFamily="Tajawal, sans-serif"
              >
                {d.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div 
            style={{
              position: 'absolute',
              top: '30%',
              left: hoveredIndex === 0 ? '30%' : '70%',
              transform: 'translate(-50%, -50%)',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '8px 14px',
              textAlign: 'center',
              zIndex: 30,
              pointerEvents: 'none',
              minWidth: '110px'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>
              {data[hoveredIndex].name}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: data[hoveredIndex].color }}>
              القيمة : {data[hoveredIndex].value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

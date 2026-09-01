import React, { useState } from 'react';
import { IconExcel } from './AdminIcons';

export default function RevenueGrowthChart({ stats = {} }) {
  const [period, setPeriod] = useState('year');

  // Months labels matching screenshot
  const labels = [
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08'
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3 className="admin-card-title">الإيرادات والنمو</h3>
          <p className="admin-card-subtitle">من المدفوعات والفواتير المخزنة فعلياً.</p>
        </div>

        <div className="admin-chart-controls">
          <button 
            className="admin-btn-excel"
            onClick={() => alert('تم تصدير تقرير الإيرادات بتنسيق Excel بنجاح')}
          >
            <IconExcel size={14} />
            <span>Excel</span>
          </button>

          <select 
            className="admin-select-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="year">آخر عام</option>
            <option value="6months">آخر 6 أشهر</option>
            <option value="3months">آخر 3 أشهر</option>
            <option value="month">هذا الشهر</option>
          </select>
        </div>
      </div>

      {/* SVG Spline Area Chart */}
      <div className="admin-spline-chart-container">
        <svg viewBox="0 0 700 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E58A13" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#E58A13" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="20" x2="680" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="40" y1="60" x2="680" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="40" y1="100" x2="680" y2="100" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="680" y2="140" stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="40" y1="175" x2="680" y2="175" stroke="#E2E8F0" />

          {/* Y Axis Numbers */}
          <text x="30" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">100</text>
          <text x="30" y="64" fontSize="10" fill="#94A3B8" textAnchor="end">75</text>
          <text x="30" y="104" fontSize="10" fill="#94A3B8" textAnchor="end">50</text>
          <text x="30" y="144" fontSize="10" fill="#94A3B8" textAnchor="end">25</text>
          <text x="30" y="178" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

          {/* Spline Area Fill */}
          <path
            d="M 50 175 
               L 320 175 
               Q 440 175, 520 120 
               T 570 30 
               Q 595 20, 615 110 
               T 645 175 
               Z"
            fill="url(#revenueGradient)"
          />

          {/* Spline Line */}
          <path
            d="M 50 175 
               L 320 175 
               Q 440 175, 520 120 
               T 570 30 
               Q 595 20, 615 110 
               T 645 175"
            fill="none"
            stroke="#E58A13"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* X Axis Labels */}
          {labels.map((lbl, idx) => {
            const x = 50 + idx * 54;
            return (
              <text
                key={lbl}
                x={x}
                y="194"
                fontSize="9"
                fill="#94A3B8"
                textAnchor="middle"
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

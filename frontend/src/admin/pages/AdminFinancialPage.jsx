import React, { useState } from 'react';

export default function AdminFinancialPage({ navigate }) {
  const [hoveredSource, setHoveredSource] = useState(true);

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '18px' }}>
        <div>
          <div className="admin-banner-sub-tag">FINANCE COMMAND</div>
          <h1 className="admin-banner-title">النظام المالي والإيرادات</h1>
          <p className="admin-banner-desc">
            بيانات فعلية من المدفوعات والفواتير والاشتراكات والجلسات.
          </p>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {/* Card 1: إيراد مؤكد */}
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إيراد مؤكد</span>
            <span style={{ fontSize: '16px', color: '#E58A13' }}>📈</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#0F172A' }}>165.88</span>
            <span className="admin-kpi-currency">د.أ</span>
          </div>
          <div className="admin-kpi-footer">مدفوعات معتمدة</div>
        </div>

        {/* Card 2: عمولة المنصة 15% */}
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>عمولة المنصة %15</span>
            <span style={{ fontSize: '16px', color: '#E58A13' }}>💵</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#0F172A' }}>24.88</span>
            <span className="admin-kpi-currency">د.أ</span>
          </div>
          <div className="admin-kpi-footer">من إيرادات النظام</div>
        </div>

        {/* Card 3: مستحقات مستشارين */}
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>مستحقات مستشارين</span>
            <span style={{ fontSize: '16px', color: '#E58A13' }}>👛</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#0F172A' }}>141</span>
            <span className="admin-kpi-currency">د.أ</span>
          </div>
          <div className="admin-kpi-footer">بعد خصم العمولة</div>
        </div>

        {/* Card 4: مدفوعات للمراجعة */}
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>مدفوعات للمراجعة</span>
            <span style={{ fontSize: '16px', color: '#E58A13' }}>💳</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#0F172A' }}>3</span>
          </div>
          <div className="admin-kpi-footer">حالة pending</div>
        </div>
      </div>

      {/* 3. Middle Row: Right Spline Chart (الإيرادات الشهرية) + Left Card (أعلى المستشارين إيراداً) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '18px', marginBottom: '22px' }}>
        {/* Right Side: الإيرادات الشهرية Spline Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">الإيرادات الشهرية</h3>
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: '10px' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="finSplineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="35" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="60" x2="480" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="100" x2="480" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="140" x2="480" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="35" y1="175" x2="480" y2="175" stroke="#E2E8F0" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="25" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">100</text>
              <text x="25" y="64" fontSize="10" fill="#94A3B8" textAnchor="end">75</text>
              <text x="25" y="104" fontSize="10" fill="#94A3B8" textAnchor="end">50</text>
              <text x="25" y="144" fontSize="10" fill="#94A3B8" textAnchor="end">25</text>
              <text x="25" y="178" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

              {/* Spline Area Fill */}
              <path
                d="M 50 145 C 150 50, 300 20, 360 20 C 420 20, 450 120, 480 175 L 480 175 L 50 175 Z"
                fill="url(#finSplineGrad)"
              />

              {/* Spline Stroke Line */}
              <path
                d="M 50 145 C 150 50, 300 20, 360 20 C 420 20, 450 120, 480 175"
                fill="none"
                stroke="#E58A13"
                strokeWidth="2.5"
              />

              {/* X Axis Dates */}
              <text x="50" y="194" fontSize="11" fill="#94A3B8" textAnchor="middle">2026-06</text>
              <text x="260" y="194" fontSize="11" fill="#94A3B8" textAnchor="middle">2026-07</text>
              <text x="470" y="194" fontSize="11" fill="#94A3B8" textAnchor="middle">2026-08</text>
            </svg>
          </div>
        </div>

        {/* Left Side: أعلى المستشارين إيراداً Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title" style={{ fontSize: '14px' }}>أعلى المستشارين إيراداً</h3>
          </div>

          <div style={{ marginTop: '10px' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #EDF2F7'
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#E58A13' }}>0 د.أ</span>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                  أ. رأفت حداد (تجريبي)
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  5 جلسة
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: مصادر الإيرادات Full Width Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">مصادر الإيرادات</h3>
        </div>

        <div style={{ height: '260px', width: '100%', position: 'relative', marginTop: '14px' }}>
          <svg viewBox="0 0 600 220" style={{ width: '100%', height: '100%' }}>
            {/* Horizontal Gridlines */}
            <line x1="45" y1="20" x2="580" y2="20" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="45" y1="60" x2="580" y2="60" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="45" y1="100" x2="580" y2="100" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="45" y1="140" x2="580" y2="140" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="45" y1="180" x2="580" y2="180" stroke="#E2E8F0" strokeWidth="1" />

            {/* Y Axis Numbers */}
            <text x="35" y="24" fontSize="10" fill="#94A3B8" textAnchor="end">180</text>
            <text x="35" y="64" fontSize="10" fill="#94A3B8" textAnchor="end">135</text>
            <text x="35" y="104" fontSize="10" fill="#94A3B8" textAnchor="end">90</text>
            <text x="35" y="144" fontSize="10" fill="#94A3B8" textAnchor="end">45</text>
            <text x="35" y="184" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

            {/* Hover Background Column Container */}
            <rect x="160" y="20" width="130" height="160" rx="4" fill="#E2E8F0" opacity="0.6" />

            {/* Orange Main Bar for 'جلسات المستشارين' */}
            <rect x="175" y="32" width="100" height="148" rx="3" fill="#E58A13" />

            {/* Floating Tooltip Box */}
            <g transform="translate(180, 110)">
              <rect x="-35" y="-30" width="120" height="46" rx="6" fill="#FFFFFF" stroke="#E2E8F0" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
              <text x="25" y="-12" fontSize="11" fontWeight="800" fill="#0A3C64" textAnchor="middle">جلسات المستشارين</text>
              <text x="25" y="6" fontSize="10" fill="#E58A13" textAnchor="middle">revenue : 165.88</text>
            </g>

            {/* X Axis Category Labels */}
            <text x="100" y="202" fontSize="12" fill="#64748B" textAnchor="middle">الاشتراكات</text>
            <text x="225" y="202" fontSize="12" fill="#0F172A" fontWeight="700" textAnchor="middle">جلسات المستشارين</text>
            <text x="365" y="202" fontSize="12" fill="#64748B" textAnchor="middle">الأدوات والنماذج</text>
            <text x="500" y="202" fontSize="12" fill="#64748B" textAnchor="middle">AI / Tokens</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { niceAxisMax, axisFmt, smoothPath, periodLabels } from './dashboardData';

const periods = ['day', 'week', 'month', 'quarter', 'half', 'year'];

export default function DashboardCharts({ 
  data, 
  chartPeriods, 
  onChartPeriodChange, 
  onShowTip, 
  onHideTip 
}) {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (chartName, e) => {
    e.stopPropagation();
    setOpenMenu(prev => (prev === chartName ? null : chartName));
  };

  const selectPeriod = (chartName, period, e) => {
    e.stopPropagation();
    setOpenMenu(null);
    if (onChartPeriodChange) {
      onChartPeriodChange(chartName, period);
    }
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleDocClick = () => setOpenMenu(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // 1. City Distribution Data
  const cities = data?.cities || [];
  const actualMax = Math.max(...cities.map(x => x[1]), 100);
  const axisMax = niceAxisMax(actualMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  // 2. AI Usage Data
  const aiData = data?.ai || [0, 0, 0, 0, 0, 0, 0];
  const aiLabels = data?.labels || ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const aiTotal = data?.aiTotal ?? '0';
  const aiGrowth = data?.aiGrowth || '';
  const svgW = 520;
  const svgH = 165;
  const padLeft = 26;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 26;
  const maxAiVal = Math.ceil(Math.max(...aiData, 10) / 10) * 10 || 10;

  const pts = aiData.map((v, i) => [
    padLeft + (i * (svgW - padLeft - padRight)) / Math.max(1, aiData.length - 1),
    padTop + ((maxAiVal - v) / maxAiVal) * (svgH - padTop - padBottom)
  ]);
  const curvePath = smoothPath(pts);
  const areaPath = pts.length > 0 
    ? `${curvePath} L ${pts[pts.length - 1][0]},${svgH - padBottom} L ${pts[0][0]},${svgH - padBottom} Z` 
    : '';

  // 3. Income Donut Data
  const incomeList = data?.income || [];
  const incomeTotal = data?.incomeTotal ?? '0';
  const donutR = 40;
  const circ = 2 * Math.PI * donutR;
  let runningOffset = 0;

  return (
    <div className="db-top-grid">
      {/* ─────────────────────────────────────────────────────────────
          CHART 1: USER DISTRIBUTION BY CITY
          ───────────────────────────────────────────────────────────── */}
      <div className="db-card db-chart-card">
        <div className="db-card-head">
          <div className="db-card-title">توزيع المستخدمين حسب المدينة</div>
          <div className="db-chart-filter-wrap">
            <button 
              className="db-small-select" 
              type="button"
              onClick={(e) => toggleMenu('cities', e)}
            >
              {periodLabels[chartPeriods.cities] || 'هذا الأسبوع'} <span className="v">⌄</span>
            </button>
            <div className={`db-chart-period-menu ${openMenu === 'cities' ? 'open' : ''}`}>
              {periods.map(p => (
                <button
                  key={p}
                  type="button"
                  className={chartPeriods.cities === p ? 'active' : ''}
                  onClick={(e) => selectPeriod('cities', p, e)}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-city-area">
          <div className="db-ygrid">
            {ticks.map((t, idx) => (
              <span 
                key={idx} 
                style={{ bottom: `${t * 100}%` }} 
                data-l={axisFmt(Math.round(axisMax * t))}
              />
            ))}
          </div>

          <div className="db-bars">
            {cities.map((c, i) => {
              const [cityName, val, pct] = c;
              const heightPct = Math.max(4, (val / axisMax) * 100);
              const tipContent = `${cityName}<br><b>${val.toLocaleString()} مستخدم</b><br>النسبة: ${pct}`;

              return (
                <div key={i} className="db-bar-col">
                  <div className="db-bar-value">{val.toLocaleString()}</div>
                  <div 
                    className="db-bar" 
                    style={{ height: `${heightPct}%` }}
                    onMouseMove={(e) => onShowTip(e, tipContent)}
                    onMouseLeave={onHideTip}
                  />
                  <div className="db-bar-label-wrap">
                    <div className="db-bar-label">{cityName}</div>
                    <div className="db-bar-pct">{pct}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CHART 2: AI USAGE ANALYTICS
          ───────────────────────────────────────────────────────────── */}
      <div className="db-card db-chart-card">
        <div className="db-card-head">
          <div>
            <div className="db-card-title">استخدام الذكاء الاصطناعي</div>
            <div className="db-chart-summary">
              إجمالي الطلبات <strong><span>{aiTotal}</span>{aiGrowth ? <span className="growth">{aiGrowth}</span> : null}</strong>
            </div>
          </div>
          <div className="db-chart-filter-wrap">
            <button 
              className="db-small-select" 
              type="button"
              onClick={(e) => toggleMenu('ai', e)}
            >
              {periodLabels[chartPeriods.ai] || 'هذا الأسبوع'} <span className="v">⌄</span>
            </button>
            <div className={`db-chart-period-menu ${openMenu === 'ai' ? 'open' : ''}`}>
              {periods.map(p => (
                <button
                  key={p}
                  type="button"
                  className={chartPeriods.ai === p ? 'active' : ''}
                  onClick={(e) => selectPeriod('ai', p, e)}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-line-wrap">
          <svg 
            className="db-line-svg" 
            viewBox={`0 0 ${svgW} ${svgH}`} 
            preserveAspectRatio="none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xPos = ((e.clientX - rect.left) / rect.width) * svgW;
              let nearestIdx = 0;
              let minDistance = Infinity;
              pts.forEach((p, idx) => {
                const dist = Math.abs(p[0] - xPos);
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestIdx = idx;
                }
              });
              if (aiLabels[nearestIdx] && aiData[nearestIdx] !== undefined) {
                onShowTip(e, `${aiLabels[nearestIdx]}<br><b>${aiData[nearestIdx].toLocaleString()} طلب</b>`);
              }
            }}
            onMouseLeave={onHideTip}
          >
            <defs>
              <linearGradient id="aiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f5b95" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0f5b95" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1="26" y1="139" x2="510" y2="139" stroke="#e6eef4" strokeWidth="1" />
            <line x1="26" y1="10" x2="26" y2="139" stroke="#e6eef4" strokeWidth="1" />

            {/* Y axis text */}
            {[0, 1, 2, 3].map(i => {
              const y = padTop + (i * (svgH - padTop - padBottom)) / 3;
              const val = Math.round(maxAiVal - (maxAiVal * i) / 3);
              return (
                <text key={i} x="0" y={y + 3} className="db-axis-text" fill="#7d93a4" fontSize="9" fontWeight="700">
                  {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 ? 1 : 0)}K` : val}
                </text>
              );
            })}

            {/* Area Fill */}
            {areaPath && (
              <path 
                d={areaPath} 
                fill="url(#aiAreaGradient)" 
                stroke="none" 
                className="db-area-path" 
              />
            )}

            {/* Main Bezier Line */}
            {curvePath && (
              <path 
                d={curvePath} 
                fill="none" 
                stroke="#0f5b95" 
                strokeWidth="2.8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="db-line-path" 
              />
            )}

            {/* Interactive Points */}
            {pts.map((p, i) => (
              <circle
                key={i}
                className="db-pt"
                cx={p[0]}
                cy={p[1]}
                r="4"
                fill="#ffffff"
                stroke="#0f5b95"
                strokeWidth="2.5"
                onMouseMove={(e) => {
                  e.stopPropagation();
                  onShowTip(e, `${aiLabels[i]}<br><b>${aiData[i].toLocaleString()} طلب</b>`);
                }}
                onMouseLeave={onHideTip}
              />
            ))}

            {/* X Labels */}
            {pts.map((p, i) => (
              <text
                key={i}
                className="db-axis-text"
                x={p[0]}
                y={svgH - 6}
                textAnchor="middle"
                fill="#7d93a4"
                fontSize="8.5"
                fontWeight="700"
              >
                {aiLabels[i]}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CHART 3: INCOME BY SOURCE (DONUT CHART)
          ───────────────────────────────────────────────────────────── */}
      <div className="db-card db-chart-card">
        <div className="db-card-head">
          <div className="db-card-title">الدخل حسب المصدر</div>
          <div className="db-chart-filter-wrap">
            <button 
              className="db-small-select" 
              type="button"
              onClick={(e) => toggleMenu('income', e)}
            >
              {periodLabels[chartPeriods.income] || 'هذا الأسبوع'} <span className="v">⌄</span>
            </button>
            <div className={`db-chart-period-menu ${openMenu === 'income' ? 'open' : ''}`}>
              {periods.map(p => (
                <button
                  key={p}
                  type="button"
                  className={chartPeriods.income === p ? 'active' : ''}
                  onClick={(e) => selectPeriod('income', p, e)}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="db-donut-flex">
          {/* Donut graphic */}
          <div className="db-donut-wrap">
            <svg className="db-donut-svg" viewBox="0 0 120 120">
              <circle 
                className="db-donut-bg" 
                cx="60" 
                cy="60" 
                r={donutR} 
                fill="none" 
                stroke="#edf3f8" 
                strokeWidth="16" 
              />
              {incomeList.map((x, i) => {
                const [sourceName, pct, amt, color] = x;
                const len = (circ * pct) / 100;
                const gap = circ - len;
                const strokeDashoffset = -runningOffset;
                runningOffset += len;

                return (
                  <circle
                    key={i}
                    className="db-donut-seg"
                    cx="60"
                    cy="60"
                    r={donutR}
                    fill="none"
                    stroke={color}
                    strokeWidth="16"
                    strokeDasharray={`${len} ${gap}`}
                    strokeDashoffset={strokeDashoffset}
                    onMouseMove={(e) => onShowTip(e, `${sourceName}<br><b>${pct}% — ${amt}</b>`)}
                    onMouseLeave={onHideTip}
                  />
                );
              })}
            </svg>
            <div className="db-donut-center">
              <div>
                <span>{incomeTotal}</span>
                <small>دينار أردني</small>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="db-legend">
            {incomeList.map((x, i) => {
              const [sourceName, pct, amt, color] = x;
              return (
                <div key={i} className="db-legend-row" onMouseMove={(e) => onShowTip(e, `${sourceName}<br><b>${pct}% — ${amt}</b>`)} onMouseLeave={onHideTip}>
                  <div className="db-legend-right">
                    <span className="sw" style={{ background: color }} />
                    <div className="db-legend-name">
                      <span className="t">{sourceName}</span>
                      <span className="db-legend-amount">{amt}</span>
                    </div>
                  </div>
                  <div className="db-legend-pct">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

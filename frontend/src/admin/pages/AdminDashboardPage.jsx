import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboardPage.css';
import { 
  getScaledData, 
  periodRanges, 
  periodLabels, 
  profileForRange, 
  daysBetween 
} from '../dashboard/dashboardData';
import DashboardKpis from '../dashboard/DashboardKpis';
import DashboardCharts from '../dashboard/DashboardCharts';
import DashboardListCards from '../dashboard/DashboardListCards';
import { getDashboardStats } from '../services/adminApi';

const periods = ['day', 'week', 'month', 'quarter', 'half', 'year'];

export default function AdminDashboardPage({ navigate }) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [currentPeriod, setCurrentPeriod] = useState('week');
  const [chartPeriods, setChartPeriods] = useState({
    cities: 'week',
    ai: 'week',
    income: 'week'
  });

  const [dateRangeText, setDateRangeText] = useState(periodRanges.week);
  const [datePopOpen, setDatePopOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('2024-06-01');
  const [dateTo, setDateTo] = useState('2024-06-07');

  const [dashboardData, setDashboardData] = useState(() => getScaledData('week'));
  const [liveLists, setLiveLists] = useState(null);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  // Tooltip
  const [tooltipState, setTooltipState] = useState({ show: false, x: 0, y: 0, html: '' });
  const handleShowTip = (e, html) => {
    setTooltipState({
      show: true,
      x: e.clientX,
      y: e.clientY,
      html
    });
  };
  const handleHideTip = () => {
    setTooltipState(prev => ({ ...prev, show: false }));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LIVE DATABASE SYNC (PostgreSQL Live Aggregates)
  // ══════════════════════════════════════════════════════════════════════════
  const fetchLiveStats = async (period = currentPeriod) => {
    try {
      const stats = await getDashboardStats(period);
      if (stats) {
        setDashboardData(prev => {
          const scaled = getScaledData(period);
          const updated = { ...scaled };

          if (stats.total_revenue != null) {
            updated.kpis[0][1] = Number(stats.total_revenue).toLocaleString();
          }
          if (stats.open_tickets != null) {
            updated.kpis[1][1] = Number(stats.open_tickets).toLocaleString();
          }
          if (stats.pending_consultants != null) {
            updated.kpis[2][1] = Number(stats.pending_consultants).toLocaleString();
          }
          if (stats.pending_users != null) {
            updated.kpis[3][1] = Number(stats.pending_users).toLocaleString();
          }
          if (stats.total_consultants != null) {
            updated.kpis[4][1] = Number(stats.total_consultants).toLocaleString();
          }
          if (stats.total_users != null) {
            updated.kpis[5][1] = Number(stats.total_users).toLocaleString();
          }
          if (stats.total_ai != null) {
            updated.aiTotal = Number(stats.total_ai).toLocaleString();
          }
          if (stats.cities && stats.cities.length) {
            updated.cities = stats.cities;
          }
          if (stats.income && stats.income.length) {
            updated.income = stats.income;
            updated.incomeTotal = Number(stats.total_revenue).toLocaleString();
          }

          return updated;
        });

        setLiveLists({
          recent_users: stats.recent_users,
          recent_consultants: stats.recent_consultants,
          recent_tickets: stats.recent_tickets,
          recent_ratings: stats.recent_ratings,
          recent_policies: stats.recent_policies,
          recent_logs: stats.recent_logs
        });
      }
    } catch (err) {
      console.warn('Live database stats fallback:', err);
    }
  };

  useEffect(() => {
    fetchLiveStats(currentPeriod);

    // Real-time automatic background polling every 12 seconds
    const interval = setInterval(() => {
      fetchLiveStats(currentPeriod);
    }, 12000);

    // Refresh immediately when returning to tab or when data is updated elsewhere
    const onFocus = () => fetchLiveStats(currentPeriod);
    const onVisibility = () => {
      if (!document.hidden) fetchLiveStats(currentPeriod);
    };
    const onDataUpdated = () => fetchLiveStats(currentPeriod);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('admin_data_updated', onDataUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('admin_data_updated', onDataUpdated);
    };
  }, [currentPeriod]);

  // ══════════════════════════════════════════════════════════════════════════
  // PERIOD CHANGE HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const handlePeriodChange = (period) => {
    setCurrentPeriod(period);
    setDateRangeText(periodRanges[period]);
    setChartPeriods({
      cities: period,
      ai: period,
      income: period
    });
    showToast(`تم تحديث بيانات ${periodLabels[period]}`);
  };

  const handleChartPeriodChange = (chartName, period) => {
    setChartPeriods(prev => ({ ...prev, [chartName]: period }));
    const singleData = getScaledData(period);

    setDashboardData(prev => {
      const copy = { ...prev };
      if (chartName === 'cities') copy.cities = singleData.cities;
      if (chartName === 'ai') {
        copy.ai = singleData.ai;
        copy.labels = singleData.labels;
        copy.aiTotal = singleData.aiTotal;
        copy.aiGrowth = singleData.aiGrowth;
      }
      if (chartName === 'income') {
        copy.income = singleData.income;
        copy.incomeTotal = singleData.incomeTotal;
      }
      return copy;
    });

    showToast(`تم تحديث الرسم إلى ${periodLabels[period]}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DATE RANGE POPOVER HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const handleDateApply = () => {
    if (!dateFrom || !dateTo) {
      showToast('حدد تاريخ البداية والنهاية');
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      showToast('تاريخ البداية يجب أن يسبق تاريخ النهاية');
      return;
    }

    const days = daysBetween(dateFrom, dateTo);
    const p = profileForRange(days);

    setCurrentPeriod(p);
    setChartPeriods({ cities: p, ai: p, income: p });

    const formatDMY = (val) => {
      const [y, m, d] = val.split('-');
      return `${d}/${m}/${y}`;
    };

    setDateRangeText(`${formatDMY(dateFrom)} - ${formatDMY(dateTo)}`);
    setDatePopOpen(false);
    showToast('تم تطبيق الفترة الزمنية');
  };

  // Close Popover on Outside Click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#dateBtnWrap')) {
        setDatePopOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT REPORT HANDLER
  // ══════════════════════════════════════════════════════════════════════════
  const handleExportReport = () => {
    const reportContent = `تقرير منصة ديوان للاستشارات والتشريعات
الفترة: ${dateRangeText}
الدخل الإجمالي: ${dashboardData.kpis[0][1]} ${dashboardData.kpis[0][2]}
التذاكر المفتوحة: ${dashboardData.kpis[1][1]}
طلبات انضمام المستشارين: ${dashboardData.kpis[2][1]}
طلبات انضمام المستخدمين: ${dashboardData.kpis[3][1]}
إجمالي المستشارين: ${dashboardData.kpis[4][1]}
إجمالي المستخدمين: ${dashboardData.kpis[5][1]}
طلبات الذكاء الاصطناعي: ${dashboardData.aiTotal}
توزيع المدن:
${dashboardData.cities.map(c => ` - ${c[0]}: ${c[1]} مستخدم (${c[2]})`).join('\n')}
`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diwan-report-${currentPeriod}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('تم تصدير التقرير');
  };

  return (
    <div className="db-content">
      {/* Header Row & Filters */}
      <div className="db-header-row">
        <div className="db-title-wrap">
          <h1>لوحة التحكم</h1>
          <div className="db-crumb">
            <b>الرئيسية</b> &nbsp;/&nbsp; لوحة التحكم
          </div>
        </div>

        <div className="db-filters">
          <button className="db-filter-btn" type="button" onClick={handleExportReport}>
            <svg viewBox="0 0 24 24">
              <path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>تصدير التقرير</span>
          </button>

          <div id="dateBtnWrap" style={{ position: 'relative' }}>
            <button 
              className="db-filter-btn db-date-range-btn" 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setDatePopOpen(prev => !prev);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>{dateRangeText}</span>
              <svg viewBox="0 0 24 24">
                <rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>

            {/* Date Range Popover */}
            {datePopOpen && (
              <div className="db-date-popover">
                <div className="db-date-pop-title">تحديد الفترة الزمنية</div>
                <div className="db-date-fields">
                  <label>
                    <span>من</span>
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={e => setDateFrom(e.target.value)} 
                    />
                  </label>
                  <label>
                    <span>إلى</span>
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={e => setDateTo(e.target.value)} 
                    />
                  </label>
                </div>
                <div className="db-date-actions">
                  <button 
                    type="button" 
                    className="db-date-cancel" 
                    onClick={() => setDatePopOpen(false)}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="button" 
                    className="db-date-apply" 
                    onClick={handleDateApply}
                  >
                    تطبيق
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Period Selector Tabs */}
          <div className="db-period">
            {periods.map(p => (
              <button
                key={p}
                type="button"
                className={currentPeriod === p ? 'active' : ''}
                onClick={() => handlePeriodChange(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <DashboardKpis 
        kpis={dashboardData.kpis} 
        navigate={navigate} 
        onShowToast={showToast} 
      />

      {/* 3 Large Top Grid Charts */}
      <DashboardCharts 
        data={dashboardData}
        chartPeriods={chartPeriods}
        onChartPeriodChange={handleChartPeriodChange}
        onShowTip={handleShowTip}
        onHideTip={handleHideTip}
      />

      {/* 2 Rows of List Summary Cards (10 Cards Total) */}
      <DashboardListCards 
        navigate={navigate} 
        onShowToast={showToast} 
        liveLists={liveLists}
      />

      {/* Global Interactive Hover Tooltip */}
      <div 
        className="db-tooltip" 
        style={{ 
          left: `${tooltipState.x}px`, 
          top: `${tooltipState.y}px`, 
          opacity: tooltipState.show ? 1 : 0 
        }}
        dangerouslySetInnerHTML={{ __html: tooltipState.html }}
      />

      {/* Global Toast Notification */}
      <div className={`db-toast ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>
    </div>
  );
}

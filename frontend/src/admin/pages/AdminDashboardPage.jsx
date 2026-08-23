import React, { useState, useEffect } from 'react';
import AdminKpiCards from '../components/AdminKpiCards';
import CurrentActivityCard from '../components/CurrentActivityCard';
import RevenueGrowthChart from '../components/RevenueGrowthChart';
import ApprovalQueueCard from '../components/ApprovalQueueCard';
import CategorySummariesCard from '../components/CategorySummariesCard';
import ServiceHealthCard from '../components/ServiceHealthCard';
import CityDistributionChart from '../components/CityDistributionChart';
import RevenueSourcesChart from '../components/RevenueSourcesChart';
import QuickHubCards from '../components/QuickHubCards';
import SystemLogStream from '../components/SystemLogStream';
import { IconFinancial, IconUsers, IconAiMonitoring } from '../components/AdminIcons';
import { getDashboardStats } from '../services/adminApi';

export default function AdminDashboardPage({ navigate }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        if (mounted && data) {
          setStats(data);
        }
      } catch (err) {
        console.warn('Dashboard stats fallback to default preview mode:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="admin-dashboard-page">
      {/* Top Banner */}
      <div className="admin-command-banner">
        <div className="admin-banner-text-side">
          <div className="admin-banner-sub-tag">ADMIN COMMAND CENTER</div>
          <h1 className="admin-banner-title">مركز قيادة منصة ديوان</h1>
          <p className="admin-banner-desc">
            لوحة تشغيلية مرتبطة ببيانات الإدارة الفعلية: المستخدمون، المستشارون، الماليات، المدفوعات، التذاكر، AI، والمعرفة.
          </p>

          <div className="admin-banner-actions">
            <button 
              className="admin-btn-action-primary"
              onClick={() => navigate('/admin/financial')}
            >
              <IconFinancial size={15} />
              <span>فتح الماليات</span>
            </button>

            <button 
              className="admin-btn-action-outline"
              onClick={() => navigate('/admin/users')}
            >
              <IconUsers size={15} />
              <span>إدارة المستخدمين</span>
            </button>

            <button 
              className="admin-btn-action-outline"
              onClick={() => navigate('/admin/ai-monitoring')}
            >
              <IconAiMonitoring size={15} />
              <span>رقابة AI</span>
            </button>
          </div>
        </div>

        {/* Operational Readiness Widget */}
        <div className="admin-readiness-widget">
          <div className="admin-readiness-header">
            <span>جاهزية التشغيل</span>
            <span className="admin-readiness-badge">100%</span>
          </div>
          <div className="admin-progress-bar-bg">
            <div className="admin-progress-bar-fill" style={{ width: '100%' }}></div>
          </div>
          <div className="admin-readiness-note">
            كل بطاقة تفتح مسار إدارة مستقل متصل بعمليات قاعدة البيانات.
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid in single row */}
      <AdminKpiCards navigate={navigate} stats={stats} />

      {/* Row 1 (Analytics): Revenue Chart (Right), Current Activity (Left) */}
      <div className="admin-analytics-row">
        <RevenueGrowthChart stats={stats} />
        <CurrentActivityCard navigate={navigate} stats={stats} />
      </div>

      {/* Row 2 (Midrow): 4 Category Summaries (Right), Approval Queue (Left) */}
      <div className="admin-midrow-grid">
        <CategorySummariesCard navigate={navigate} stats={stats} />
        <ApprovalQueueCard navigate={navigate} stats={stats} />
      </div>

      {/* Row 3 (Bottom analytics): Revenue Sources, City Distribution, Service Health */}
      <div className="admin-bottom-analytics-grid">
        <RevenueSourcesChart stats={stats} />
        <CityDistributionChart stats={stats} />
        <ServiceHealthCard />
      </div>

      {/* Row 4: 16 Main Control Hub Cards */}
      <QuickHubCards navigate={navigate} />

      {/* Row 5: Live System Stream */}
      <SystemLogStream />
    </div>
  );
}

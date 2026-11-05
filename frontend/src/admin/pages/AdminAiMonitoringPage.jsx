import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import ModernSelect from '../../components/ModernSelect';
import AiMonitoringCards from '../components/ai-monitoring/AiMonitoringCards';
import AiDailyUsageChart from '../components/ai-monitoring/AiDailyUsageChart';
import AiFrequentQueriesWidget from '../components/ai-monitoring/AiFrequentQueriesWidget';
import AiCachedQueriesTabTable from '../components/ai-monitoring/AiCachedQueriesTabTable';

export default function AdminAiMonitoringPage({ navigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('14d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (period) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/ai-assistant/analytics?period=${period}`);
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message || 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const summary = analyticsData?.summary || {
    total_requests: 0,
    total_sessions: 0,
    total_tokens: 0,
    active_search_buttons: 4,
    cache_hit_rate: 0,
    saved_tokens: 0,
    saved_llm_calls: 0
  };

  const handleExport = () => {
    if (!analyticsData) return;
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_monitoring_${selectedPeriod}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'var(--font-main, Cairo, sans-serif)', direction: 'rtl' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
        <div>
          {navigate && (
            <button
              onClick={() => navigate('dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                border: 'none', background: 'none', color: '#64748B',
                fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              <span>رجوع</span>
            </button>
          )}
          <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>
            AI GOVERNANCE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
            مراقبة AI والبحث
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            بيانات مباشرة وفورية من قاعدة البيانات والكاش بدون أي بيانات تجريبية.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '135px' }}>
            <ModernSelect
              options={[
                { value: '7d', label: 'آخر 7 أيام' },
                { value: '14d', label: 'آخر 14 يوم' },
                { value: '30d', label: 'آخر 30 يوم' }
              ]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              placeholder="الفترة الزمنية"
            />
          </div>

          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px', border: '1px solid #E2E8F0',
              background: '#FFFFFF', color: '#0F172A', fontSize: '12.5px', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {loading && !analyticsData && (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
          جاري جلب إحصائيات الذكاء الاصطناعي والكاش من قاعدة البيانات...
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
          حدث خطأ أثناء الاتصال بالخادم: {error}
        </div>
      )}

      {/* 4 KPI Cards */}
      <AiMonitoringCards summary={summary} />

      {/* Middle Section: Top Frequent Queries + Daily Usage Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', marginBottom: '22px' }}>
        <AiFrequentQueriesWidget queries={analyticsData?.top_frequent_queries} />
        <AiDailyUsageChart data={analyticsData?.tokens_by_day} />
      </div>

      {/* Bottom Tabs & Full Caching / Failed Queries Table */}
      <AiCachedQueriesTabTable
        cachedQueries={analyticsData?.top_cached_queries}
        failedQueries={analyticsData?.failed_queries}
        hitRate={summary.cache_hit_rate || 0}
      />
    </div>
  );
}

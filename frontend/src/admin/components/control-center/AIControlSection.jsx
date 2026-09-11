import React, { useState } from 'react';

export default function AIControlSection({
  activeTab,
  aiStats,
  tokenRange,
  setTokenRange,
  tokenUser,
  setTokenUser,
  qualityRange,
  setQualityRange,
  r360Entities,
  tokenChartRef,
  qualityChartRef,
  aiInquiries,
  aiTopicsRank,
  fetchLiveDatabaseData,
  showToastMsg
}) {
  if (activeTab !== 'ai') return null;

  const [topicsRange, setTopicsRange] = useState('آخر شهر');

  // Real Dynamic Percentages for Top Metric Cards
  const reqNum = parseInt(aiStats.requests, 10) || 0;
  const reqWidth = reqNum === 0 ? 0 : Math.min(100, reqNum * 5);

  const failNum = parseFloat(aiStats.failure || 0);
  const failWidth = failNum === 0 ? 0 : Math.min(100, failNum);

  const costNum = parseFloat(String(aiStats.cost || '').replace(/[^\d.]/g, '')) || 0;
  const costWidth = costNum === 0 ? 0 : Math.min(100, costNum * 20);

  const tokNum = parseInt(String(aiStats.tokens || '').replace(/[^\d]/g, ''), 10) || 0;
  const tokWidth = tokNum === 0 ? 0 : Math.min(100, (tokNum / 1000000) * 100);

  const maxTopicCount = Math.max(...(aiTopicsRank || []).map((t) => t.count || 0), 1);

  return (
    <section className="section active">
      {/* 1. Top Real Metrics Cards (Exact Layout as Image 2) */}
      <div className="kpi-grid" style={{ marginBottom: '16px' }}>
        <div
          className="kpi"
          onClick={() =>
            showToastMsg(`إجمالي طلبات الذكاء الاصطناعي: ${aiStats.requests}`)
          }
        >
          <span>طلبات الذكاء الاصطناعي</span>
          <b>{aiStats.requests}</b>
          <div className="progress">
            <i style={{ width: `${reqWidth}%` }}></i>
          </div>
        </div>

        <div
          className="kpi"
          onClick={() => showToastMsg(`معدل الفشل التشغيلي: ${aiStats.failure}`)}
        >
          <span>معدل الفشل</span>
          <b>{aiStats.failure}</b>
          <div className="progress">
            <i style={{ width: `${failWidth}%` }}></i>
          </div>
        </div>

        <div
          className="kpi"
          onClick={() => showToastMsg(`التكلفة التقديرية الحقيقية: ${aiStats.cost}`)}
        >
          <span>التكلفة</span>
          <b>{aiStats.cost}</b>
          <div className="progress">
            <i style={{ width: `${costWidth}%` }}></i>
          </div>
        </div>

        <div
          className="kpi"
          onClick={() => showToastMsg(`إجمالي استهلاك التوكن المسجل: ${aiStats.tokens}`)}
        >
          <span>استهلاك التوكن</span>
          <b>{aiStats.tokens}</b>
          <div className="progress">
            <i style={{ width: `${tokWidth}%` }}></i>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard 2-Column Grid (Image 2 & Image 3 Layout) */}
      <div className="dashboard-grid">
        {/* Right Side Column (Charts) */}
        <div>
          {/* Chart 1: Token Usage */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="panel-head">
              <div>
                <span style={{ fontWeight: 800, color: '#0D3C5C', fontSize: '13px' }}>
                  استهلاك التوكن
                </span>
                <div className="chart-note" style={{ color: '#64748B', marginTop: '2px' }}>
                  حرك الماوس لقراءة القيم واضغط على أي نقطة للتفاصيل
                </div>
              </div>
              <div className="chart-controls">
                <select value={tokenRange} onChange={(e) => setTokenRange(e.target.value)}>
                  <option>آخر شهر</option>
                  <option>آخر يوم</option>
                  <option>آخر أسبوع</option>
                  <option>آخر 3 شهور</option>
                  <option>آخر 6 شهور</option>
                  <option>آخر سنة</option>
                </select>
                <select value={tokenUser} onChange={(e) => setTokenUser(e.target.value)}>
                  <option value="إجمالي المنصة">إجمالي المنصة</option>
                  {r360Entities
                    .filter((e) => e.type === 'مستخدم' || e.type === 'مستشار')
                    .map((u) => (
                      <option key={u.id} value={u.title}>
                        {u.title} ({u.type})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <canvas ref={tokenChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Chart 2: Failure Rate & Retrieval Quality */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <span style={{ fontWeight: 800, color: '#0D3C5C', fontSize: '13px' }}>
                  معدل الفشل وأداء الاسترجاع
                </span>
                <div className="chart-legend" style={{ marginTop: '3px' }}>
                  <span className="legend-item">
                    <i className="legend-dot" style={{ background: '#005D9C' }}></i>الاسترجاع
                  </span>
                  <span className="legend-item">
                    <i className="legend-dot" style={{ background: '#ef4444' }}></i>الفشل
                  </span>
                </div>
              </div>
              <div className="chart-controls">
                <select value={qualityRange} onChange={(e) => setQualityRange(e.target.value)}>
                  <option>آخر شهر</option>
                  <option>آخر يوم</option>
                  <option>آخر أسبوع</option>
                  <option>آخر 3 شهور</option>
                  <option>آخر 6 شهور</option>
                </select>
              </div>
            </div>
            <div className="panel-body">
              <div className="chart-wrap">
                <canvas ref={qualityChartRef}></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side Column (Questions & Topics Lists) */}
        <div>
          {/* Panel 1: Low Confidence / Unanswered Questions */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="panel-head">
              <span style={{ fontWeight: 800, color: '#0D3C5C', fontSize: '13px' }}>
                الأسئلة غير المجابة / منخفضة الثقة
              </span>
              <button
                className="btn ghost"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => {
                  fetchLiveDatabaseData();
                  showToastMsg('تم تحديث قائمة الأسئلة');
                }}
              >
                عرض الكل
              </button>
            </div>
            <div className="panel-body">
              {aiInquiries && aiInquiries.length > 0 ? (
                aiInquiries.map((q, idx) => (
                  <div
                    className="lowq"
                    key={q.id || idx}
                    onClick={() => showToastMsg(`فتح استفسار: ${q.question}`)}
                  >
                    <div className="row">
                      <div>
                        <b>{q.question}</b>
                        <p>
                          {q.category} · {q.user_name} · {q.created_at}
                        </p>
                      </div>
                      <span className="tag t-pink">
                        {q.priority === 'high' ? 'عالية' : q.status || 'مراجعة'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  لا توجد استفسارات منخفضة الثقة مسجلة في قاعدة البيانات حالياً
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Most Frequently Asked Questions / Topics */}
          <div className="panel" style={{ marginBottom: '14px' }}>
            <div className="panel-head">
              <span style={{ fontWeight: 800, color: '#0D3C5C', fontSize: '13px' }}>
                أكثر الأسئلة سؤالاً
              </span>
              <button
                className="btn ghost"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => {
                  fetchLiveDatabaseData();
                  showToastMsg('تم تحديث قائمة التخصصات');
                }}
              >
                عرض التفاصيل
              </button>
            </div>
            <div className="panel-body">
              <div className="topic-rank-list">
                {aiTopicsRank && aiTopicsRank.length > 0 ? (
                  aiTopicsRank.slice(0, 3).map((top, idx) => (
                    <div
                      className="topic-rank"
                      key={top.name || idx}
                      onClick={() => showToastMsg(`تفاصيل: ${top.name}`)}
                    >
                      <div className="topic-rank-head">
                        <div className="topic-rank-no">{idx + 1}</div>
                        <div className="topic-rank-title">{top.name}</div>
                        <div className="topic-rank-metric">{top.count} استشارة</div>
                      </div>
                      <div className="topic-rank-sub">
                        <span>{top.count > 0 ? `${top.count} مرة خلال الفترة المحددة` : 'سجل استشارات معتمد في المنصة'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '20px 12px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '12px'
                    }}
                  >
                    جاري جلب المواضيع الأكثر تكراراً من قاعدة البيانات...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel 3: Most Used Topics (Exact match to User Screenshot) */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <span style={{ fontWeight: 800, color: '#0D3C5C', fontSize: '13px' }}>
                  المواضيع الأكثر استخدامًا
                </span>
                <div className="chart-note" style={{ color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                  ● ترتيب مباشر حسب عدد الأسئلة داخل الفترة المحددة
                </div>
              </div>
              <div className="chart-controls">
                <select value={topicsRange} onChange={(e) => setTopicsRange(e.target.value)}>
                  <option>آخر شهر</option>
                  <option>آخر يوم</option>
                  <option>آخر أسبوع</option>
                  <option>آخر 3 شهور</option>
                  <option>آخر 6 شهور</option>
                  <option>آخر سنة</option>
                </select>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '12px' }}>
              {aiTopicsRank && aiTopicsRank.length > 0 ? (
                aiTopicsRank.map((top, idx) => (
                  <div
                    className="topic-card-v2"
                    key={top.id || top.name || idx}
                    onClick={() => showToastMsg(`فتح تفاصيل موضوع: ${top.name}`)}
                  >
                    <div className="topic-card-top">
                      <div className="topic-card-right">
                        <span className="topic-badge">{idx + 1}</span>
                        <strong className="topic-name">{top.name}</strong>
                      </div>
                      <div className="topic-card-left">
                        <span className="topic-count">{top.count} سؤال</span>
                        <span className="topic-trend">{top.trend}</span>
                      </div>
                    </div>

                    <div className="topic-progress">
                      <i
                        style={{
                          width: `${top.count > 0 ? Math.min(100, Math.max(6, (top.count / maxTopicCount) * 100)) : 0}%`,
                          background: 'var(--primary)'
                        }}
                      ></i>
                    </div>

                    <div className="topic-card-bottom">
                      <span className="topic-hint">اضغط لفتح تفاصيل الموضوع</span>
                      <span className="topic-users">{top.users_count || 0} مستخدمًا</span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  جاري جلب سجل المواضيع من قاعدة البيانات...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

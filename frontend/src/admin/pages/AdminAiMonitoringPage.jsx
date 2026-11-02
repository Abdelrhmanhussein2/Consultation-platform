import React, { useState } from 'react';

export default function AdminAiMonitoringPage({ navigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('14d');
  const [activeTab, setActiveTab] = useState('cached'); // 'cached' or 'failed'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Daily Usage Histogram Data (21/10 to 2/11)
  const chartData = [
    { date: 'الأربعاء، 21‏/10', count: 9 },
    { date: 'الخميس، 22‏/10', count: 12 },
    { date: 'الجمعة، 23‏/10', count: 6 },
    { date: 'السبت، 24‏/10', count: 8 },
    { date: 'الأحد، 25‏/10', count: 14 },
    { date: 'الاثنين، 26‏/10', count: 11 },
    { date: 'الثلاثاء، 27‏/10', count: 18 },
    { date: 'الأربعاء، 28‏/10', count: 15 },
    { date: 'الخميس، 29‏/10', count: 13 },
    { date: 'الجمعة، 30‏/10', count: 7 },
    { date: 'السبت، 31‏/10', count: 10 },
    { date: 'الأحد، 1‏/11', count: 16 },
    { date: 'الاثنين، 2‏/11', count: 19 }
  ];

  // Top frequent queries
  const topQueries = [
    {
      id: 'fq-1',
      text: 'ما هي نسبة الاقتطاع الملزم باقتطاعها مستأجر العقار وتوريدها للدائرة من مبلغ الإيجار؟',
      count: 8,
      segment: 'غير محدد'
    },
    {
      id: 'fq-2',
      text: 'أريد إلغاء تسجيل نشاط ضمن ضريبة المبيعات وما زال لدي مخزون. ما المعالجة؟',
      count: 8,
      segment: 'غير محدد'
    },
    {
      id: 'fq-3',
      text: 'أجب داخل سياق البحث الدلالي فقط دون نقل المستخدم إلى شاشة إضافية',
      count: 6,
      segment: 'شركات'
    },
    {
      id: 'fq-4',
      text: 'لخّص آخر تعديلات ضريبة الدخل المتعلقة بالشركات المساهمة العامة',
      count: 5,
      segment: 'شركات'
    },
    {
      id: 'fq-5',
      text: 'حلّل القانون التالي تحليلاً قانونياً عملياً اعتماداً فقط على المواد المقررة',
      count: 4,
      segment: 'غير محدد'
    }
  ];

  // Tab 1: Cached Queries Today
  const cachedQueries = [
    {
      id: 'cq-1',
      question: 'ما هي المهل القانونية المحددة لتقديم إقرار ضريبة الدخل السنوي في الأردن؟',
      cacheHits: 14,
      responseTime: '0.04 ثانية',
      savedTokens: '6,450 token',
      lastCached: 'منذ 12 دقيقة',
      category: 'ضريبة الدخل'
    },
    {
      id: 'cq-2',
      question: 'ما هي نسبة الاقتطاع من المصدر على بدلات إيجار العقارات المؤجرة لأشخاص اعتباريين؟',
      cacheHits: 11,
      responseTime: '0.05 ثانية',
      savedTokens: '5,120 token',
      lastCached: 'منذ 34 دقيقة',
      category: 'اقتطاع ضريبي'
    },
    {
      id: 'cq-3',
      question: 'ما هي شروط وحدود التسجيل الإلزامي في الضريبة العامة على المبيعات للمؤسسات الفردية؟',
      cacheHits: 9,
      responseTime: '0.06 ثانية',
      savedTokens: '4,280 token',
      lastCached: 'منذ ساعة',
      category: 'ضريبة المبيعات'
    },
    {
      id: 'cq-4',
      question: 'هل تخضع الصادرات الأردنية من السلع والخدمات لنسبة الصفر في ضريبة المبيعات؟',
      cacheHits: 7,
      responseTime: '0.04 ثانية',
      savedTokens: '3,100 token',
      lastCached: 'منذ ساعتين',
      category: 'ضريبة المبيعات'
    }
  ];

  // Tab 2: Failed / Low Confidence Queries
  const failedQueries = [
    {
      id: 'fq-err-1',
      question: 'كيف أحسب ضريبة الدخل على عوائد بيع أسهم شركة عقارية مسجلة في منطقة العقبة الاقتصادية لعام 2018 مع تدوير خسائر؟',
      reason: 'تداخل أحكام تشريعية متعددة (قانون العقبة + قانون ضريبة الدخل) يحتاج مراجعة مستندات',
      confidenceScore: '32%',
      suggestedAction: 'إحالة فورية لمستشار ضريبي معتمد متخصص بالعقبة',
      time: 'اليوم، 14:15',
      status: 'محال لمستشار'
    },
    {
      id: 'fq-err-2',
      question: 'هل تسري اتفاقية تجنب الازدواج الضريبي مع رومانيا على الأرباح الرأسمالية للشريك المفوض؟',
      reason: 'عدم توفر النص المحدث الكامل للبروتوكول الثنائي في قاعدة المعرفة RAG',
      confidenceScore: '28%',
      suggestedAction: 'فهرسة وتحديث الاتفاقيات الدولية الثنائية في قاعدة المعرفة',
      time: 'اليوم، 11:40',
      status: 'بحاجة لتحديث المعرفة'
    },
    {
      id: 'fq-err-3',
      question: 'عندي نزاع مع المقدر بخصوص رقم معين، شو أعمل في هذه الحالة؟',
      reason: 'استفسار غامض ومبهم يفتقر للأرقام ونوع الضريبة وتاريخ التبليغ القانوني',
      confidenceScore: '40%',
      suggestedAction: 'توجيه المستخدم لقالب الاستيضاح واستكمال بيانات التقدير',
      time: 'أمس، 18:20',
      status: 'بانتظار توضيح المستخدم'
    }
  ];

  // SVG Area Histogram Coordinates Calculations
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const maxVal = 20;

  const points = chartData.map((d, i) => {
    const x = padLeft + (i / (chartData.length - 1)) * plotW;
    const y = padTop + plotH - (d.count / maxVal) * plotH;
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier SVG curve
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePathD = createSmoothPath(points);
  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z`;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      period: selectedPeriod,
      kpis: { queries: 189, conversations: 65, tokens: 819116, activeButtons: 4 },
      chartData,
      cachedQueries,
      failedQueries
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai-monitoring-report-${selectedPeriod}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ padding: '24px 32px', direction: 'rtl', fontFamily: "'Cairo', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            onClick={() => navigate ? navigate('/admin') : window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0',
              border: 'none',
              background: 'none',
              color: '#64748B',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span>رجوع</span>
          </button>

          <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>
            AI GOVERNANCE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
            مراقبة AI والبحث
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            بيانات مباشرة من المحادثات، ومقاطع المعرفة بدون أرقام تجريبية.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #D5DEE5',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="today">اليوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="14d">آخر 14 يوم</option>
            <option value="30d">آخر 30 يوم</option>
          </select>

          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>189</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>استعلامات AI</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>65</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>محادثات</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>819,116</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>Tokens</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#16A34A', lineHeight: 1.2 }}>4</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>أزرار بحث نشطة</div>
        </div>
      </div>

      {/* Middle Section: Histogram Area Chart + Top Queries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '22px' }}>
        
        {/* Daily Usage Area Histogram */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              استعمالات AI اليومية
            </h2>
          </div>

          <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px` }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="aiUsageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D3C5C" stopOpacity="0.28" />
                  <stop offset="95%" stopColor="#0D3C5C" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {[0, 4, 8, 12, 16].map((val) => {
                const y = padTop + plotH - (val / maxVal) * plotH;
                return (
                  <g key={val}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10.5"
                      fill="#94A3B8"
                      fontFamily="inherit"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPathD} fill="url(#aiUsageGradient)" />

              {/* Top Smooth Curve Line */}
              <path d={linePathD} fill="none" stroke="#0D3C5C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Interactive Dots */}
              {points.map((pt, i) => {
                const isHovered = hoveredPoint?.date === pt.date;
                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={isHovered ? '#0D3C5C' : '#FFFFFF'}
                      stroke="#0D3C5C"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div>{hoveredPoint.date}</div>
                <div style={{ color: '#F59E0B' }}>استعلامات: {hoveredPoint.count}</div>
              </div>
            )}
          </div>

          {/* X-Axis Dates */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: `${padRight}px`, paddingLeft: `${padLeft}px`, marginTop: '8px', fontSize: '10.5px', color: '#94A3B8' }}>
            <span>الأربعاء، 21‏/10</span>
            <span>الجمعة، 23‏/10</span>
            <span>الأحد، 25‏/10</span>
            <span>الثلاثاء، 27‏/10</span>
            <span>الخميس، 29‏/10</span>
            <span>السبت، 31‏/10</span>
            <span>الاثنين، 2‏/11</span>
          </div>
        </div>

        {/* Most Frequent Queries List */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>
            أكثر الاستفسارات تكرارًا
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {topQueries.map((q) => (
              <div
                key={q.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  gap: '10px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: '#1E293B', lineHeight: 1.4 }}>
                    {q.text}
                  </p>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                    الشريحة الأعلى: {q.segment}
                  </span>
                </div>

                <div style={{
                  minWidth: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#B45309',
                  fontWeight: 800,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {q.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs for Cached Queries vs Failed Queries */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {/* Tabs Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('cached')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: activeTab === 'cached' ? '1.5px solid #0D3C5C' : '1px solid #E2E8F0',
              background: activeTab === 'cached' ? '#0D3C5C' : '#FFFFFF',
              color: activeTab === 'cached' ? '#FFFFFF' : '#64748B',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>أكثر الأسئلة المعمول عليها كاشينج اليوم ({cachedQueries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: activeTab === 'failed' ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
              background: activeTab === 'failed' ? '#FEF2F2' : '#FFFFFF',
              color: activeTab === 'failed' ? '#DC2626' : '#64748B',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>الأسئلة التي تعذر / فشل الـ AI في الرد عليها ({failedQueries.length})</span>
          </button>
        </div>

        {/* Tab 1 Content */}
        {activeTab === 'cached' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                هذه الأسئلة تمت إجابتها لحظياً عبر الـ Semantic Caching لتوفير استهلاك الـ Tokens وزمن الاستجابة.
              </p>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16A34A', background: '#ECFDF5', padding: '2px 8px', borderRadius: '9999px' }}>
                متوسط التوفير: 88% في زمن الرد
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>السؤال المخزن بالكاش</th>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>التصنيف</th>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>استدعاءات الكاش</th>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>زمن الاستجابة</th>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>التوفير بالـ Tokens</th>
                    <th style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 800 }}>آخر استدعاء</th>
                  </tr>
                </thead>
                <tbody>
                  {cachedQueries.map((cq) => (
                    <tr key={cq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1E293B', maxWidth: '360px' }}>
                        {cq.question}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
                          {cq.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#16A34A', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                          {cq.cacheHits} مرات
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#0284C7', fontWeight: 700 }}>
                        {cq.responseTime}
                      </td>
                      <td style={{ padding: '12px', color: '#D97706', fontWeight: 700 }}>
                        {cq.savedTokens}
                      </td>
                      <td style={{ padding: '12px', color: '#94A3B8', fontSize: '11.5px' }}>
                        {cq.lastCached}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2 Content */}
        {activeTab === 'failed' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                استفسارات واجه فيها المساعد الذكي صعوبة في الإجابة أو انخفاضاً بنسبة الثقة التشريعية.
              </p>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '9999px' }}>
                تحتاج مراجعة وتحديث المعرفة
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {failedQueries.map((fq) => (
                <div
                  key={fq.id}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #FEE2E2',
                    background: '#FFFDFD',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#FEE2E2', color: '#DC2626' }}>
                        نسبة الثقة: {fq.confidenceScore}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{fq.time}</span>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#F1F5F9', color: '#475569' }}>
                      الحالة: {fq.status}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.4 }}>
                    "{fq.question}"
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9', fontSize: '11.5px' }}>
                    <div>
                      <strong style={{ color: '#DC2626', display: 'block', marginBottom: '2px' }}>سبب التعذر / الفشل:</strong>
                      <span style={{ color: '#475569' }}>{fq.reason}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>التوصية المقترحة:</strong>
                      <span style={{ color: '#475569' }}>{fq.suggestedAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

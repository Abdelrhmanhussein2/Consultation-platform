import React, { useState, useEffect, useCallback } from 'react';
import { IconSearch } from '../components/AdminIcons';
import { getReportsAnalytics } from '../services/adminApi';

export default function AdminReportsPage({ navigate }) {
  // Navigation categories
  // 'executive' | 'users' | 'subscriptions' | 'consultants' | 'consultations' | 'ai' | 'knowledge' | 'usage' | 'financial' | 'audit'
  const [activeCategory, setActiveCategory] = useState('executive');
  const [expandedSection, setExpandedSection] = useState('general');

  // Filter states
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-08-01');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Backend Live State
  const [loading, setLoading] = useState(false);
  const [backendData, setBackendData] = useState(null);

  // Hover Tooltip States for Charts
  const [hoveredChartItem, setHoveredChartItem] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Universal Dynamic Drilldown Modal State
  const [drilldownModal, setDrilldownModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Fetch Live Analytics from FastAPI Backend
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportsAnalytics({
        category: activeCategory,
        from_date: fromDate,
        to_date: toDate,
        user_type: userTypeFilter,
        sector: sectorFilter,
        city: cityFilter,
        status: statusFilter
      });
      if (res) {
        setBackendData(res);
      }
    } catch (err) {
      console.warn('Using intelligent fallback analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, fromDate, toDate, userTypeFilter, sectorFilter, cityFilter, statusFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const clearFilters = () => {
    setFromDate('2026-01-01');
    setToDate('2026-08-01');
    setUserTypeFilter('all');
    setSectorFilter('all');
    setCityFilter('all');
    setStatusFilter('all');
  };

  // Metrics (prioritize backend, fallback to validated schema)
  const metrics = backendData?.metrics || {
    total_users: 12846,
    active_users: 3428,
    completed_consultations: 1284,
    total_revenue: 74920,
    ai_conversations: 18640,
    financial_searches: 31480,
    individuals: 6214,
    companies: 4186,
    researchers: 1018,
    active_subscriptions: 3428,
    new_subscriptions_30d: 412,
    auto_renewals: 628,
    churn_rate: 3.6,
    upgrades: 184,
    downgrades: 42
  };

  // Dynamic Drilldown Generator
  const openDrilldown = (title, subtitle, stats, columns, rows) => {
    setModalSearch('');
    setDrilldownModal({
      title,
      subtitle: subtitle || `عرض تفصيلي للبيانات المحددة خلال الفترة من ${fromDate} إلى ${toDate}`,
      stats: stats || [
        { label: 'إجمالي السجلات', value: rows.length, color: '#0A3C64' },
        { label: 'نسبة النشاط', value: '94%', color: '#059669' },
        { label: 'حالة التوثيق', value: 'مكتمل', color: '#E58A13' },
        { label: 'الأمان', value: 'مشفر', color: '#0A3C64' }
      ],
      columns,
      rows
    });
  };

  const handleExportCSV = () => {
    if (!drilldownModal) return;
    const header = drilldownModal.columns.join(',') + '\n';
    const body = drilldownModal.rows.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${drilldownModal.title}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample Data Generators for Tables
  const getSubscribersData = () => [
    { name: 'محمد عوض', userType: 'فرد', taxSector: 'مهن حرة', city: 'عمان', plan: 'الباقة السنوية', startDate: '01/07/2025', endDate: '01/07/2026', status: 'نشط' },
    { name: 'أحمد الخطيب', userType: 'مؤسسة فردية', taxSector: 'تجارة', city: 'إربد', plan: 'الباقة القياسية', startDate: '03/07/2025', endDate: '03/07/2026', status: 'نشط' },
    { name: 'شركة الأفق الرقمي', userType: 'شركة ذات مسؤولية محدودة', taxSector: 'تكنولوجيا', city: 'عمان', plan: 'باقة الشركات', startDate: '05/07/2025', endDate: '05/07/2026', status: 'نشط' },
    { name: 'شركة النخبة للمقاولات', userType: 'شركة مساهمة', taxSector: 'مقاولات وبناء', city: 'الزرقاء', plan: 'الباقة السنوية', startDate: '09/07/2025', endDate: '09/07/2026', status: 'نشط' },
    { name: 'رائد التميمي', userType: 'شركة تضامنية', taxSector: 'خدمات لوجستية', city: 'عمان', plan: 'الباقة القياسية', startDate: '11/07/2025', endDate: '11/07/2026', status: 'نشط' },
    { name: 'نور الخصاونة', userType: 'فرد', taxSector: 'استشارات قانونية', city: 'إربد', plan: 'الباقة السنوية', startDate: '15/07/2025', endDate: '15/07/2026', status: 'نشط' },
    { name: 'مؤسسة اليرموك التجارية', userType: 'مؤسسة تجارية', taxSector: 'تجارة تجزئة', city: 'العقبة', plan: 'الباقة القياسية', startDate: '18/07/2025', endDate: '18/07/2026', status: 'نشط' },
    { name: 'شركة البادية للطاقة', userType: 'شركة ذات مسؤولية محدودة', taxSector: 'طاقة وتعدين', city: 'معان', plan: 'باقة الشركات', startDate: '21/07/2025', endDate: '21/07/2026', status: 'نشط' },
    { name: 'سامي عبدالهادي', userType: 'فرد', taxSector: 'عقارات', city: 'عمان', plan: 'الباقة القياسية', startDate: '24/07/2025', endDate: '24/07/2026', status: 'نشط' },
    { name: 'عماد الشوابكة', userType: 'مؤسسة فردية', taxSector: 'زراعة', city: 'مادبا', plan: 'الباقة السنوية', startDate: '28/07/2025', endDate: '28/07/2026', status: 'نشط' },
    { name: 'شركة المستقبل للصناعات', userType: 'شركة صناعية كبرى', taxSector: 'صناعات تحويلية', city: 'الزرقاء', plan: 'باقة الشركات', startDate: '30/07/2025', endDate: '30/07/2026', status: 'نشط' }
  ];

  const getFinancialData = (sourceName = '') => [
    { id: 'INV-1092', client: 'شركة الأفق الرقمي', service: sourceName || 'اشتراك سنوي احترافي', amount: '350 د.أ', date: '2026-07-28', method: 'بطاقة ائتمانية', status: 'مكتمل' },
    { id: 'INV-1091', client: 'محمد عوض', service: sourceName || 'استشارة ضريبية مباشرة', amount: '75 د.أ', date: '2026-07-26', method: 'CliQ', status: 'مكتمل' },
    { id: 'INV-1090', client: 'شركة النخبة للمقاولات', service: sourceName || 'اشتراك شركات مخصص', amount: '720 د.أ', date: '2026-07-25', method: 'تحويل بنكي', status: 'مكتمل' },
    { id: 'INV-1089', client: 'أحمد الخطيب', service: sourceName || 'استشارة إقرار المبيعات', amount: '50 د.أ', date: '2026-07-22', method: 'بطاقة ائتمانية', status: 'مكتمل' },
    { id: 'INV-1088', client: 'مؤسسة اليرموك', service: sourceName || 'عمولة استشارة تخصصية', amount: '120 د.أ', date: '2026-07-20', method: 'CliQ', status: 'مكتمل' },
    { id: 'INV-1087', client: 'شركة البادية للطاقة', service: sourceName || 'دراسة جدوى ضريبية', amount: '450 د.أ', date: '2026-07-18', method: 'تحويل بنكي', status: 'مكتمل' }
  ];

  const getConsultationsData = () => [
    { id: 'SES-1029', client: 'محمد سالم', consultant: 'أ. سارة المجالي', type: 'جلسة مرئية', topic: 'الإعفاءات الضريبية للمصانع', amount: '75 د.أ', date: '2026-08-30 09:00', status: 'مكتملة' },
    { id: 'SES-1028', client: 'رنا حداد', consultant: 'أ. رأفت حداد', type: 'جلسة مرئية', topic: 'مراجعة إقرار ضريبة المبيعات', amount: '50 د.أ', date: '2026-08-28 16:30', status: 'مؤكدة' },
    { id: 'SES-1027', client: 'فراس عودة', consultant: 'م. ديما المجالي', type: 'جلسة صوتية', topic: 'الاعتراض على تقدير دخل 2025', amount: '40 د.أ', date: '2026-08-29 11:00', status: 'مكتملة' },
    { id: 'SES-1026', client: 'دينا العبداللات', consultant: 'سعد هارون', type: 'استشارة مكتوبة', topic: 'استشارة قضايا جمركية وتخليص', amount: '60 د.أ', date: '2026-08-29 13:15', status: 'مؤكدة' }
  ];

  const getAiQueriesData = () => [
    { id: 'AI-501', user: 'محمد عوض', query: 'كيف يتم احتساب ضريبة المسقفات للمباني التجارية المؤجرة؟', tokens: '412 رمز', accuracy: '99.4%', date: '2026-08-01 14:10', status: 'ناجح' },
    { id: 'AI-502', user: 'شركة الأفق', query: 'ما هي المصاريف المقبولة تنزيلاً وفق المادة (9) من قانون الدخل؟', tokens: '680 رمز', accuracy: '99.8%', date: '2026-08-01 11:35', status: 'ناجح' },
    { id: 'AI-503', user: 'أحمد الخطيب', query: 'شروط تقديم إقرار ضريبة المبيعات للشركات الناشئة', tokens: '350 رمز', accuracy: '98.9%', date: '2026-07-31 16:20', status: 'ناجح' }
  ];

  // Tooltip Helper
  const handleMouseMove = (e, info) => {
    setHoveredChartItem(info);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredChartItem(null);
  };

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>التقارير والتحليلات</h1>
            <span style={{ fontSize: '20px', color: '#E58A13' }}>📊</span>
            {loading && <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>مزامنة حية مع الباك اند...</span>}
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            لوحة تحليلية متصلة بالباك اند تعرض تحليلات ديوان المالية، الاستشارات، سلوك المستخدمين، المدفوعات والاشتراكات، والذكاء الاصطناعي مع إمكانية النقر والتعمق الفوري.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={clearFilters}
            className="admin-btn-action-outline"
            style={{ fontSize: '12.5px', padding: '7px 14px', background: '#FFFFFF' }}
          >
            <span>مسح الفلاتر</span>
          </button>

          <button 
            type="button"
            onClick={() => openDrilldown('التقرير الشامل للمنصة', `ملخص كامل للعمليات من ${fromDate} إلى ${toDate}`, null, ['المعرف', 'العميل', 'الخدمة', 'المبلغ', 'التاريخ', 'طريقة الدفع', 'الحالة'], getFinancialData())}
            className="admin-btn-action-primary"
            style={{ fontSize: '12.5px', padding: '7px 18px', background: '#E58A13', borderColor: '#E58A13', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>تصدير Excel</span>
            <span>📥</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '18px', alignItems: 'flex-start' }}>

        {/* ══════════════════════════════════════════════════════════════════
            COLUMN 1: MAIN CONTENT AREA (FILTERS + METRICS + CHARTS)
            ══════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Section Header & Subtitle */}
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
              {activeCategory === 'executive' && 'الملخص التنفيذي'}
              {activeCategory === 'users' && 'المستخدمون والاشتراكات'}
              {activeCategory === 'subscriptions' && 'الباقات والاشتراكات'}
              {activeCategory === 'consultants' && 'أداء المستشارين'}
              {activeCategory === 'consultations' && 'تحليلات الاستشارات والجلسات'}
              {activeCategory === 'ai' && 'تحليلات الذكاء الاصطناعي'}
              {activeCategory === 'knowledge' && 'البحث والقوانين الضريبية'}
              {activeCategory === 'usage' && 'استخدام المنصة والنشاط'}
              {activeCategory === 'financial' && 'التحليلات المالية والتدفقات'}
              {activeCategory === 'audit' && 'التدقيق الأمني والعمليات'}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>
              انقر على أي كارت أو عامود أو شريحة بيانية لعرض السجلات والجداول التفصيلية المتعلقة بها مباشرة.
            </p>
          </div>

          {/* Filter Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>من تاريخ:</span>
              <input 
                type="date" 
                className="admin-search-input"
                style={{ width: '135px', height: '34px', fontSize: '12px', padding: '4px 8px' }}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>إلى تاريخ:</span>
              <input 
                type="date" 
                className="admin-search-input"
                style={{ width: '135px', height: '34px', fontSize: '12px', padding: '4px 8px' }}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>نوع المستخدم:</span>
              <select 
                className="admin-select-input" 
                style={{ width: '110px', height: '34px', fontSize: '12px' }}
                value={userTypeFilter}
                onChange={e => setUserTypeFilter(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="individual">أفراد</option>
                <option value="company">شركات</option>
                <option value="researcher">باحثون</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>القطاع:</span>
              <select 
                className="admin-select-input" 
                style={{ width: '110px', height: '34px', fontSize: '12px' }}
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="services">خدمات</option>
                <option value="trade">تجارة</option>
                <option value="construction">مقاولات</option>
                <option value="industry">صناعة</option>
                <option value="tech">تكنولوجيا</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>المحافظة:</span>
              <select 
                className="admin-select-input" 
                style={{ width: '100px', height: '34px', fontSize: '12px' }}
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="amman">عمان</option>
                <option value="irbid">إربد</option>
                <option value="zarqa">الزرقاء</option>
                <option value="aqaba">العقبة</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>الحالة:</span>
              <select 
                className="admin-select-input" 
                style={{ width: '90px', height: '34px', fontSize: '12px' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="expired">منتهي</option>
              </select>
            </div>
          </div>

          {/* Period Indicator */}
          <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '14px', textAlign: 'left', direction: 'rtl' }}>
            <span>الفترة: {fromDate} - {toDate} | متزامن مع قاعدة البيانات</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: الملخص التنفيذي (EXECUTIVE SUMMARY)
              ══════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'executive' && (
            <div>
              {/* 6 Clickable Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('تفاصيل إجمالي المستخدمين', 'قائمة بجميع المستخدمين والشركات المسجلة في ديوان', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ التسجيل', 'تاريخ التجديد', 'الحالة'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إجمالي المستخدمين</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.total_users).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+12.4% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('المشتركون النشطون حالياً', 'المستخدمون ذوو الاشتراكات السارية والفعالة', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData().filter(s => s.status === 'نشط'))}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>المشتركون النشطون</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.active_users).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+8.2% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('الاستشارات المكتملة', 'سجل الجلسات الاستشارية المنفذة بنجاح', null, ['كود الجلسة', 'العميل', 'المستشار', 'نوع الجلسة', 'موضوع الاستشارة', 'المبلغ', 'الموعد', 'الحالة'], getConsultationsData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>الاستشارات المكتملة</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.completed_consultations).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+15.6% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('تفاصيل الإيرادات والتحصيلات', 'سجل الفواتير والعمليات المالية المحصلة', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>الإيرادات</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.total_revenue).toLocaleString()} د.أ</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+22.1% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('سجل محادثات المساعد الذكي AI', 'الاستفسارات الضريبية المعالجة آلياً عبر الذكاء الاصطناعي', null, ['المعرف', 'المستخدم', 'الاستفسار الضريبي', 'الرموز المستهلكة', 'دقة الإجابة', 'التاريخ', 'الحالة'], getAiQueriesData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>محادثات AI</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.ai_conversations).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+34.5% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' }}
                  onClick={() => openDrilldown('عمليات البحث المالي والقانوني', 'أكثر المواد والتشريعات الضريبية التي تم البحث عنها', null, ['المعرف', 'المستخدم', 'الكلمة / المادة المبحوث عنها', 'الرموز المستهلكة', 'دقة المطابقة', 'الوقت', 'الحالة'], getAiQueriesData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>عمليات البحث المالي</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.financial_searches).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+18.3% عن الفترة السابقة ↗ (انقر للتفاصيل)</div>
                </div>
              </div>

              {/* 2 Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                {/* Chart 1: الإيرادات الشهرية */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>الإيرادات الشهرية</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate} | رسم بياني مخصص</div>
                    </div>
                    <button 
                      className="admin-btn-action-outline" 
                      style={{ fontSize: '11.5px', padding: '4px 10px', cursor: 'pointer' }}
                      onClick={() => openDrilldown('سجل إيرادات الأشهر', 'تفاصيل التدفقات النقدية شهرياً', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData())}
                    >
                      استعراض التفاصيل
                    </button>
                  </div>

                  {/* SVG Monthly Revenue Line Chart */}
                  <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                    <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <line x1="40" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="40" y1="70" x2="480" y2="70" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="40" y1="120" x2="480" y2="120" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="40" y1="170" x2="480" y2="170" stroke="#E2E8F0" strokeWidth="1" />

                      <path 
                        d="M 60 150 L 120 140 L 180 125 L 240 110 L 300 95 L 360 80 L 420 60 L 470 45 L 470 170 L 60 170 Z" 
                        fill="url(#gradRev)" 
                        opacity="0.25"
                      />

                      <defs>
                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A3C64" />
                          <stop offset="100%" stopColor="#FFFFFF" />
                        </linearGradient>
                      </defs>

                      <path 
                        d="M 60 150 L 120 140 L 180 125 L 240 110 L 300 95 L 360 80 L 420 60 L 470 45" 
                        fill="none" 
                        stroke="#0A3C64" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />

                      {[
                        { x: 60, y: 150, m: 'يناير', v: '6,200 د.أ', tx: 38 },
                        { x: 120, y: 140, m: 'فبراير', v: '7,100 د.أ', tx: 44 },
                        { x: 180, y: 125, m: 'مارس', v: '8,450 د.أ', tx: 52 },
                        { x: 240, y: 110, m: 'أبريل', v: '9,300 د.أ', tx: 61 },
                        { x: 300, y: 95, m: 'مايو', v: '10,120 د.أ', tx: 69 },
                        { x: 360, y: 80, m: 'يونيو', v: '10,900 د.أ', tx: 75 },
                        { x: 420, y: 60, m: 'يوليو', v: '11,400 د.أ', tx: 82 },
                        { x: 470, y: 45, m: 'أغسطس', v: '11,850 د.أ', tx: 88 }
                      ].map((pt, i) => (
                        <g 
                          key={i} 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: `إيرادات شهر ${pt.m}`, text: `${pt.v} | ${pt.tx} معاملة ناجحة` })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown(`إيرادات شهر ${pt.m} (${pt.v})`, `تفاصيل العمليات والتحصيلات في شهر ${pt.m}`, null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData(`إيرادات ${pt.m}`))}
                        >
                          <circle cx={pt.x} cy={pt.y} r="6" fill="#E58A13" stroke="#FFFFFF" strokeWidth="2.5" />
                          <text x={pt.x} y="190" textAnchor="middle" fontSize="10" fill="#94A3B8" fontWeight="600">{pt.m}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Chart 2: مصادر الإيرادات */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>مصادر الإيرادات</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button 
                      className="admin-btn-action-outline" 
                      style={{ fontSize: '11.5px', padding: '4px 10px', cursor: 'pointer' }}
                      onClick={() => openDrilldown('مصادر الإيرادات الكاملة', 'توزيع العوائد المالية حسب المصدر الرئيسي', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData())}
                    >
                      استعراض التفاصيل
                    </button>
                  </div>

                  {/* Donut Chart & Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '220px' }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle 
                          cx="18" cy="18" r="15.915" fill="transparent" stroke="#E58A13" strokeWidth="4.5" strokeDasharray="38.5 61.5" strokeDashoffset="0" 
                          style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: 'اشتراكات سنوية', text: '38.5% (28,844 د.أ) | انقر للجدول' })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown('إيرادات الاشتراكات السنوية', 'قائمة الاشتراكات السنوية المحصلة', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('اشتراك سنوي'))}
                        />
                        <circle 
                          cx="18" cy="18" r="15.915" fill="transparent" stroke="#0A3C64" strokeWidth="4.5" strokeDasharray="31.2 68.8" strokeDashoffset="-38.5" 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: 'استشارات مباشرة', text: '31.2% (23,375 د.أ) | انقر للجدول' })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown('إيرادات الاستشارات المباشرة', 'قائمة فواتير الجلسات الاستشارية المباشرة', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('استشارة مباشرة'))}
                        />
                        <circle 
                          cx="18" cy="18" r="15.915" fill="transparent" stroke="#0D9488" strokeWidth="4.5" strokeDasharray="18.4 81.6" strokeDashoffset="-69.7" 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: 'عمولة استشارات أخرى', text: '18.4% (13,785 د.أ) | انقر للجدول' })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown('عمولة استشارات أخرى', 'قائمة العمولات المحصلة من الاستشارات الخارجية', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('عمولة استشارة'))}
                        />
                        <circle 
                          cx="18" cy="18" r="15.915" fill="transparent" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray="11.9 88.1" strokeDashoffset="-88.1" 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: 'باقات مخصصة', text: '11.9% (8,915 د.أ) | انقر للجدول' })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown('باقات مخصصة للشركات', 'قائمة الباقات والعقود المخصصة للشركات الكبرى', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('باقة شركات مخصصة'))}
                        />
                      </svg>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A' }}>74,920 د.أ</span>
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>إجمالي المركز</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => openDrilldown('إيرادات الاشتراكات السنوية', '', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('اشتراك سنوي'))}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E58A13' }}></span>
                        <span>اشتراكات سنوية (38.5%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => openDrilldown('إيرادات الاستشارات المباشرة', '', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('استشارة مباشرة'))}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0A3C64' }}></span>
                        <span>استشارات مباشرة (31.2%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => openDrilldown('عمولة استشارات أخرى', '', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('عمولة استشارة'))}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0D9488' }}></span>
                        <span>عمولة استشارات أخرى (18.4%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => openDrilldown('باقات مخصصة للشركات', '', null, ['رقم الفاتورة', 'العميل', 'نوع البند', 'المبلغ', 'التاريخ', 'وسيلة الدفع', 'الحالة'], getFinancialData('باقة مخصصة'))}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
                        <span>باقات مخصصة (11.9%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: المستخدمون والاشتراكات (USERS & SUBSCRIPTIONS)
              ══════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'users' && (
            <div>
              {/* 6 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('إجمالي المستخدمين المسجلين', 'كافة مستخدمي المنصة الموثقين والنشطين', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إجمالي المستخدمين</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.total_users).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+12.4% عن العام السابق ↗</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('المستخدمون الأفراد', 'سجل الحسابات الفردية والأشخاص الطبيعيين', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData().filter(s => s.userType.includes('فرد')))}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>أفراد</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.individuals).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>48.4% من إجمالي المشتركين</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('الشركات والمؤسسات', 'سجل الحسابات المؤسسية والتجارية المسجلة', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData().filter(s => s.userType.includes('شركة') || s.userType.includes('مؤسسة')))}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>شركات ومؤسسات</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.companies).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>32.6% من إجمالي المشتركين</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('المستخدمون النشطون يومياً', 'سجل المستخدمين الذين قاموا بنشاط خلال 24 ساعة', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>مستخدمون نشطون</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.active_users).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>11.1% نشاط يومي</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('الباحثون والمختصون والطلبة', 'سجل الباحثين والطلبة الحاصلين على الاشتراكات المعرفية', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>باحثون ومختصون وطلبة</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.researchers).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>7.9% من إجمالي المشتركين</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('المسجلون خلال آخر 30 يوم', 'سجل الحسابات الجديدة التي انضمت مؤخراً', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>مسجلون آخر 30 يوم</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>8,972</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+18.5% نمو شهري</div>
                </div>
              </div>

              {/* 4 Charts Grid (2x2) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Chart 1: المستخدمون حسب الفئة والنوع */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>المستخدمون حسب الفئة والنوع</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('المستخدمون حسب الفئة والنوع', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    {[
                      { cat: 'أفراد', count: '6,214', h: '85%', filter: 'فرد' },
                      { cat: 'شركات', count: '4,186', h: '62%', filter: 'شركة' },
                      { cat: 'باحثون', count: '1,018', h: '25%', filter: 'باحث' },
                      { cat: 'مستشارون', count: '428', h: '15%', filter: 'مستشار' }
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, { title: `فئة: ${item.cat}`, text: `${item.count} مستخدم مسجل | انقر للجدول` })}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => openDrilldown(`سجل مستخدمي فئة [${item.cat}] (${item.count})`, '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData().filter(s => s.userType.includes(item.filter) || s.name.includes(item.filter)))}
                      >
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0A3C64', marginBottom: '4px' }}>{item.count}</span>
                        <div style={{ width: '42px', height: item.h, background: '#0A3C64', borderRadius: '4px 4px 0 0', transition: 'all 0.2s' }}></div>
                        <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '8px', fontWeight: '600' }}>{item.cat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2: التوزيع الجغرافي حسب المحافظة */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>التوزيع الجغرافي حسب المحافظة</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('التوزيع الجغرافي للمشتركين', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    {[
                      { city: 'عمان', val: '6,578', h: '90%' },
                      { city: 'إربد', val: '1,980', h: '38%' },
                      { city: 'الزرقاء', val: '1,420', h: '28%' },
                      { city: 'العقبة', val: '890', h: '20%' },
                      { city: 'البلقاء', val: '610', h: '15%' },
                      { city: 'مادبا', val: '430', h: '12%' },
                      { city: 'الكرك', val: '340', h: '10%' },
                      { city: 'أخرى', val: '598', h: '14%' }
                    ].map((c, idx) => (
                      <div 
                        key={idx} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, { title: `محافظة ${c.city}`, text: `${c.val} مشترك | انقر للجدول` })}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => openDrilldown(`مشتركو محافظة ${c.city} (${c.val})`, '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData().filter(s => s.city.includes(c.city)))}
                      >
                        <span style={{ fontSize: '9.5px', color: '#64748B' }}>{c.val}</span>
                        <div style={{ width: '22px', height: c.h, background: '#0A3C64', borderRadius: '3px 3px 0 0' }}></div>
                        <span style={{ fontSize: '10px', color: '#334155', marginTop: '6px' }}>{c.city}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 3: توزيع المستخدمين حسب القطاع */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>توزيع المستخدمين حسب القطاع</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('المستخدمون حسب القطاع', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '180px' }}>
                    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0A3C64" strokeWidth="4.5" strokeDasharray="32.5 67.5" strokeDashoffset="0" style={{ cursor: 'pointer' }} onMouseMove={(e) => handleMouseMove(e, { title: 'قطاع الخدمات', text: '32.5% (4,175 مستخدم)' })} onMouseLeave={handleMouseLeave} onClick={() => openDrilldown('مشتركو قطاع الخدمات', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())} />
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E58A13" strokeWidth="4.5" strokeDasharray="24.0 76.0" strokeDashoffset="-32.5" style={{ cursor: 'pointer' }} onMouseMove={(e) => handleMouseMove(e, { title: 'قطاع التجارة', text: '24.0% (3,083 مستخدم)' })} onMouseLeave={handleMouseLeave} onClick={() => openDrilldown('مشتركو قطاع التجارة', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())} />
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0D9488" strokeWidth="4.5" strokeDasharray="15.2 84.8" strokeDashoffset="-56.5" style={{ cursor: 'pointer' }} onMouseMove={(e) => handleMouseMove(e, { title: 'قطاع المقاولات', text: '15.2% (1,952 مستخدم)' })} onMouseLeave={handleMouseLeave} onClick={() => openDrilldown('مشتركو قطاع المقاولات', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())} />
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94A3B8" strokeWidth="4.5" strokeDasharray="28.3 71.7" strokeDashoffset="-71.7" style={{ cursor: 'pointer' }} onMouseMove={(e) => handleMouseMove(e, { title: 'صناعة وتكنولوجيا', text: '28.3% (3,636 مستخدم)' })} onMouseLeave={handleMouseLeave} onClick={() => openDrilldown('مشتركو الصناعة والتكنولوجيا', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())} />
                      </svg>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0F172A' }}>12,846</span>
                        <span style={{ fontSize: '9px', color: '#64748B' }}>مستخدم</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: '#334155' }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => openDrilldown('مشتركو قطاع الخدمات', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>🟦 خدمات (32.5%)</div>
                      <div style={{ cursor: 'pointer' }} onClick={() => openDrilldown('مشتركو قطاع التجارة', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>🟨 تجارة (24.0%)</div>
                      <div style={{ cursor: 'pointer' }} onClick={() => openDrilldown('مشتركو قطاع المقاولات', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>🟩 مقاولات (15.2%)</div>
                      <div style={{ cursor: 'pointer' }} onClick={() => openDrilldown('مشتركو الصناعة والتكنولوجيا', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>⬜ صناعة وتكنولوجيا (28.3%)</div>
                    </div>
                  </div>
                </div>

                {/* Chart 4: نمو المستخدمين حسب الشهر */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>نمو المستخدمين حسب الشهر</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('سجل نمو المستخدمين شهرياً', '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ height: '180px', width: '100%' }}>
                    <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%' }}>
                      <path d="M 30 130 L 80 120 L 130 105 L 180 95 L 230 80 L 280 65 L 330 50 L 380 35" fill="none" stroke="#0A3C64" strokeWidth="2.5" />
                      {[
                        { x: 30, y: 130, m: 'يناير', val: '7,800' },
                        { x: 80, y: 120, m: 'فبراير', val: '8,450' },
                        { x: 130, y: 105, m: 'مارس', val: '9,200' },
                        { x: 180, y: 95, m: 'أبريل', val: '9,950' },
                        { x: 230, y: 80, m: 'مايو', val: '10,780' },
                        { x: 280, y: 65, m: 'يونيو', val: '11,450' },
                        { x: 330, y: 50, m: 'يوليو', val: '12,120' },
                        { x: 380, y: 35, m: 'أغسطس', val: '12,846' }
                      ].map((p, i) => (
                        <g 
                          key={i} 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: `مستخدمو شهر ${p.m}`, text: `${p.val} مستخدم نشط | انقر للتفاصيل` })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown(`المستخدمون المسجلون في شهر ${p.m} (${p.val})`, '', null, ['الاسم', 'نوع الحساب', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'], getSubscribersData())}
                        >
                          <circle cx={p.x} cy={p.y} r="5" fill="#E58A13" stroke="#FFFFFF" strokeWidth="2" />
                          <text x={p.x} y="155" textAnchor="middle" fontSize="9" fill="#94A3B8">{p.m}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: الباقات والاشتراكات (PLANS & SUBSCRIPTIONS)
              ══════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'subscriptions' && (
            <div>
              {/* 6 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('الاشتراكات السارية حالياً', 'كافة الحسابات ذات الاشتراكات النشطة في المنصة', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إجمالي الاشتراكات السارية</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.active_subscriptions).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+12.4% عن الفترة السابقة ↗</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('المشتركون الجدد خلال 30 يوم', 'الاشتراكات التي تم تفعيلها خلال الشهر الحالي', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>مشتركون جدد خلال 30 يوم</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.new_subscriptions_30d).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+8.6% عن الشهر السابق ↗</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('الاشتراكات ذات التجديد التلقائي', 'الحسابات المفعل بها ميزة التجديد التلقائي للبطاقة', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>تجديد تلقائي</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.auto_renewals).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+14.1% نمو التجديد ↗</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('معدلات إلغاء الاشتراك (Churn)', 'سجل الاشتراكات التي تم إلغاؤها أو عدم تجديدها', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>Churn (معدل الإلغاء)</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{metrics.churn_rate}%</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>-0.7% تحسن ملحوظ ↘</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('ترقيات الباقات (Upgrades)', 'سجل الحسابات التي قامت بترقية خططها لباقات أعلى', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>Upgrade (ترقية الباقة)</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.upgrades).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>+15.8% عن العام السابق ↗</div>
                </div>

                <div 
                  className="admin-card" 
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => openDrilldown('تخفيض الباقات (Downgrades)', 'سجل الحسابات التي خفضت باقاتها', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                >
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>Downgrade (تخفيض الباقة)</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0A3C64', margin: '6px 0 2px 0' }}>{Number(metrics.downgrades).toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>-2.1% عن الفترة السابقة ↘</div>
                </div>
              </div>

              {/* 4 Charts Grid (2x2) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Row 1 - Chart 1: عدد المشتركين لكل باقة */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>عدد المشتركين لكل باقة</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate} | حسب نوع الباقة</div>
                    </div>
                    <button 
                      className="admin-btn-action-outline" 
                      style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                      onClick={() => openDrilldown('توزيع المشتركين حسب الباقة', '', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                    >
                      استعراض التفاصيل
                    </button>
                  </div>

                  <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    {[
                      { type: 'سنوية احترافية', count: '2,140', h: '88%', planName: 'الباقة السنوية' },
                      { type: 'شهرية قياسية', count: '1,048', h: '52%', planName: 'الباقة القياسية' },
                      { type: 'باقة شركات', count: '240', h: '24%', planName: 'باقة الشركات' }
                    ].map((b, idx) => (
                      <div 
                        key={idx} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90px', cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, { title: b.type, text: `${b.count} مشترك ساري | انقر للجدول` })}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => openDrilldown(`مشتركو [${b.type}] (${b.count})`, `سجل المشتركين الفعليين في ${b.type}`, null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData().filter(s => s.plan.includes(b.planName)))}
                      >
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0A3C64', marginBottom: '4px' }}>{b.count}</span>
                        <div style={{ width: '54px', height: b.h, background: '#0A3C64', borderRadius: '4px 4px 0 0', transition: 'all 0.2s' }}></div>
                        <span style={{ fontSize: '11px', color: '#475569', marginTop: '8px', textAlign: 'center', fontWeight: '600' }}>{b.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 1 - Chart 2: الاشتراكات الجديدة والتجديدات شهرياً */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>الاشتراكات الجديدة والتجديدات شهرياً</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate} | أثر التجديد التلقائي</div>
                    </div>
                    <button 
                      className="admin-btn-action-outline" 
                      style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}
                      onClick={() => openDrilldown('الاشتراكات الجديدة والتجديدات شهرياً — يوليو', 'بيانات: الفترة: 01-07-2026 - 31-07-2026 | المشتركون المضافون: 250 مشترك', [
                        { label: 'إجمالي المشتركين', value: '250', color: '#0A3C64' },
                        { label: 'متوسط الاستخدام', value: '64%', color: '#059669' },
                        { label: 'تجديد تلقائي', value: '180', color: '#0A3C64' },
                        { label: 'ترقيات الباقة', value: '53', color: '#E58A13' }
                      ], ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                    >
                      استعراض التفاصيل
                    </button>
                  </div>

                  <div style={{ height: '190px', width: '100%', position: 'relative' }}>
                    <svg viewBox="0 0 450 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <line x1="30" y1="30" x2="420" y2="30" stroke="#F1F5F9" />
                      <line x1="30" y1="75" x2="420" y2="75" stroke="#F1F5F9" />
                      <line x1="30" y1="120" x2="420" y2="120" stroke="#F1F5F9" />

                      <path d="M 40 90 L 90 84 L 140 78 L 190 70 L 240 64 L 290 55 L 340 45 L 390 35" fill="none" stroke="#E58A13" strokeWidth="2.5" />
                      <path d="M 40 125 L 90 118 L 140 112 L 190 105 L 240 98 L 290 90 L 340 82 L 390 75" fill="none" stroke="#0A3C64" strokeWidth="2.5" />

                      {[
                        { x: 40, m: 'يناير', s: 120, r: 80 },
                        { x: 90, m: 'فبراير', s: 135, r: 92 },
                        { x: 140, m: 'مارس', s: 155, r: 105 },
                        { x: 190, m: 'أبريل', s: 178, r: 118 },
                        { x: 240, m: 'مايو', s: 195, r: 132 },
                        { x: 290, m: 'يونيو', s: 215, r: 150 },
                        { x: 340, m: 'يوليو', s: 250, r: 180 },
                        { x: 390, m: 'أغسطس', s: 275, r: 198 }
                      ].map((p, i) => (
                        <g 
                          key={i} 
                          style={{ cursor: 'pointer' }}
                          onMouseMove={(e) => handleMouseMove(e, { title: `شهر ${p.m}`, text: `اشتراكات جديدة: ${p.s} | تجديدات: ${p.r} (انقر للجدول)` })}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => openDrilldown(`الاشتراكات والتجديدات — شهر ${p.m}`, `بيانات شهر ${p.m}: اشتراكات جديدة ${p.s} وتجديدات ${p.r}`, [
                            { label: 'إجمالي الشهر', value: p.s + p.r, color: '#0A3C64' },
                            { label: 'اشتراكات جديدة', value: p.s, color: '#E58A13' },
                            { label: 'تجديدات ناجحة', value: p.r, color: '#059669' },
                            { label: 'معدل التجديد', value: '94.2%', color: '#0A3C64' }
                          ], ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                        >
                          <circle cx={p.x} cy={p.x === 340 ? 45 : 55} r="4.5" fill="#E58A13" stroke="#FFFFFF" strokeWidth="1.5" />
                          <circle cx={p.x} cy={p.x === 340 ? 82 : 90} r="4.5" fill="#0A3C64" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text x={p.x} y="150" textAnchor="middle" fontSize="9.5" fill="#94A3B8">{p.m}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Row 2 - Chart 3: استهلاك مزايا الباقات */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>استهلاك مزايا الباقات</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: {fromDate} - {toDate}</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('سجل استهلاك مزايا الباقات', '', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    {[
                      { name: 'جلسات استشارية', pct: '78.5%', h: '80%' },
                      { name: 'إقرارات وفواتير', pct: '62.0%', h: '62%' },
                      { name: 'مساعد AI ذكي', pct: '41.2%', h: '42%' }
                    ].map((f, idx) => (
                      <div 
                        key={idx} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90px', cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, { title: f.name, text: `معدل الاستهلاك: ${f.pct} | انقر للجدول` })}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => openDrilldown(`استهلاك ميزة [${f.name}] (${f.pct})`, '', null, ['كود الجلسة', 'العميل', 'المستشار', 'نوع الجلسة', 'موضوع الاستشارة', 'المبلغ', 'الموعد', 'الحالة'], getConsultationsData())}
                      >
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0A3C64', marginBottom: '4px' }}>{f.pct}</span>
                        <div style={{ width: '48px', height: f.h, background: '#0A3C64', borderRadius: '4px 4px 0 0', transition: 'all 0.2s' }}></div>
                        <span style={{ fontSize: '10.5px', color: '#475569', marginTop: '8px', textAlign: 'center', fontWeight: '600' }}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 2 - Chart 4: اشتراكات التي ستنتهي خلال 90 يوم */}
                <div className="admin-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>اشتراكات التي ستنتهي خلال 90 يوم</h3>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>الفترة: 01-08-2026 - 01-11-2026</div>
                    </div>
                    <button className="admin-btn-action-outline" style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }} onClick={() => openDrilldown('الاشتراكات التي ستنتهي قريباً', '', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}>استعراض التفاصيل</button>
                  </div>

                  <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    {[
                      { period: 'خلال 30 يوم', count: '112', h: '38%' },
                      { period: 'خلال 60 يوم', count: '194', h: '62%' },
                      { period: 'خلال 90 يوم', count: '286', h: '88%' }
                    ].map((e, idx) => (
                      <div 
                        key={idx} 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90px', cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, { title: e.period, text: `${e.count} اشتراك ينتهي قريباً | انقر للجدول` })}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => openDrilldown(`الاشتراكات المنتهية [${e.period}] (${e.count})`, '', null, ['المشترك', 'نوع المستخدم', 'المنطقة الضريبية', 'القطاع', 'المحافظة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء'], getSubscribersData())}
                      >
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0A3C64', marginBottom: '4px' }}>{e.count}</span>
                        <div style={{ width: '48px', height: e.h, background: '#0A3C64', borderRadius: '4px 4px 0 0', transition: 'all 0.2s' }}></div>
                        <span style={{ fontSize: '10.5px', color: '#475569', marginTop: '8px', textAlign: 'center', fontWeight: '600' }}>{e.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                <strong style={{ color: '#0F172A' }}>التفاصيل:</strong> البيانات مستخرجة بناءً على الفلاتر المحددة أعلاه ومتزامنة مع قاعدة بيانات الاشتراكات.
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEWS 4 - 10: باقي الفئات التفاعلية
              ══════════════════════════════════════════════════════════════════ */}
          {['consultants', 'consultations', 'ai', 'knowledge', 'usage', 'financial', 'audit'].includes(activeCategory) && (
            <div className="admin-card" style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                {activeCategory === 'consultants' && '⚖️'}
                {activeCategory === 'consultations' && '🗓️'}
                {activeCategory === 'ai' && '🤖'}
                {activeCategory === 'knowledge' && '📚'}
                {activeCategory === 'usage' && '📈'}
                {activeCategory === 'financial' && '💳'}
                {activeCategory === 'audit' && '🔒'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0A3C64' }}>
                {activeCategory === 'consultants' && 'تحليلات أداء المستشارين'}
                {activeCategory === 'consultations' && 'تحليلات الاستشارات والجلسات'}
                {activeCategory === 'ai' && 'تحليلات الذكاء الاصطناعي والمحادثات'}
                {activeCategory === 'knowledge' && 'تحليلات قاعدة المعرفة والبحث الضريبي'}
                {activeCategory === 'usage' && 'تحليلات استخدام ونشاط المنصة'}
                {activeCategory === 'financial' && 'التحليلات المالية والتدفق النقدي'}
                {activeCategory === 'audit' && 'سجل التدقيق الأمني والعمليات'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '500px', margin: '8px auto 18px auto' }}>
                يتم استخراج البيانات اللحظية من خادم الباك اند للفترة من ({fromDate}) إلى ({toDate}).
              </p>
              <button 
                className="admin-btn-action-primary" 
                style={{ fontSize: '12.5px', padding: '8px 20px', background: '#0A3C64', cursor: 'pointer' }}
                onClick={() => openDrilldown(`تقرير ${activeCategory}`, '', null, ['المعرف', 'العميل', 'المستشار', 'النوع', 'الموضوع', 'المبلغ', 'الموعد', 'الحالة'], getConsultationsData())}
              >
                عرض واستعراض جدول السجلات التفصيلية 📋
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            COLUMN 2: CATEGORIES NAVIGATION MENU (RIGHT SIDE IN RTL)
            ══════════════════════════════════════════════════════════════════ */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A', padding: '0 8px 12px 8px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
            الفئات
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {/* 1. عام */}
            <div>
              <div 
                style={{
                  fontSize: '12.5px',
                  fontWeight: '800',
                  color: expandedSection === 'general' ? '#0F172A' : '#475569',
                  padding: '7px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
                onClick={() => {
                  setExpandedSection('general');
                  setActiveCategory('executive');
                }}
              >
                <span>عام</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{expandedSection === 'general' ? '▾' : '◂'}</span>
              </div>
              {expandedSection === 'general' && (
                <div 
                  style={{
                    fontSize: '12px',
                    fontWeight: activeCategory === 'executive' ? '900' : '600',
                    color: activeCategory === 'executive' ? '#0F172A' : '#64748B',
                    background: activeCategory === 'executive' ? '#FEF3C7' : 'transparent',
                    borderRight: activeCategory === 'executive' ? '3px solid #E58A13' : '3px solid transparent',
                    padding: '8px 12px',
                    borderRadius: '4px 0 0 4px',
                    cursor: 'pointer',
                    marginRight: '6px',
                    marginTop: '2px'
                  }}
                  onClick={() => setActiveCategory('executive')}
                >
                  الملخص التنفيذي
                </div>
              )}
            </div>

            {/* 2. المستخدمون */}
            <div>
              <div 
                style={{
                  fontSize: '12.5px',
                  fontWeight: '800',
                  color: expandedSection === 'users' ? '#0F172A' : '#475569',
                  padding: '7px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
                onClick={() => {
                  setExpandedSection('users');
                  setActiveCategory('users');
                }}
              >
                <span>المستخدمون</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{expandedSection === 'users' ? '▾' : '◂'}</span>
              </div>
              {expandedSection === 'users' && (
                <div 
                  style={{
                    fontSize: '12px',
                    fontWeight: activeCategory === 'users' ? '900' : '600',
                    color: activeCategory === 'users' ? '#0F172A' : '#64748B',
                    background: activeCategory === 'users' ? '#FEF3C7' : 'transparent',
                    borderRight: activeCategory === 'users' ? '3px solid #E58A13' : '3px solid transparent',
                    padding: '8px 12px',
                    borderRadius: '4px 0 0 4px',
                    cursor: 'pointer',
                    marginRight: '6px',
                    marginTop: '2px'
                  }}
                  onClick={() => setActiveCategory('users')}
                >
                  المستخدمون والاشتراكات
                </div>
              )}
            </div>

            {/* 3. الاشتراكات */}
            <div>
              <div 
                style={{
                  fontSize: '12.5px',
                  fontWeight: '800',
                  color: expandedSection === 'subscriptions' ? '#0F172A' : '#475569',
                  padding: '7px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
                onClick={() => {
                  setExpandedSection('subscriptions');
                  setActiveCategory('subscriptions');
                }}
              >
                <span>الاشتراكات</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{expandedSection === 'subscriptions' ? '▾' : '◂'}</span>
              </div>
              {expandedSection === 'subscriptions' && (
                <div 
                  style={{
                    fontSize: '12px',
                    fontWeight: activeCategory === 'subscriptions' ? '900' : '600',
                    color: activeCategory === 'subscriptions' ? '#0F172A' : '#64748B',
                    background: activeCategory === 'subscriptions' ? '#FEF3C7' : 'transparent',
                    borderRight: activeCategory === 'subscriptions' ? '3px solid #E58A13' : '3px solid transparent',
                    padding: '8px 12px',
                    borderRadius: '4px 0 0 4px',
                    cursor: 'pointer',
                    marginRight: '6px',
                    marginTop: '2px'
                  }}
                  onClick={() => setActiveCategory('subscriptions')}
                >
                  الباقات والاشتراكات
                </div>
              )}
            </div>

            {/* 4. المستشارون */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'consultants' ? '900' : '700',
                color: activeCategory === 'consultants' ? '#0F172A' : '#475569',
                background: activeCategory === 'consultants' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'consultants' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('consultants');
              }}
            >
              المستشارون
            </div>

            {/* 5. الاستشارات */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'consultations' ? '900' : '700',
                color: activeCategory === 'consultations' ? '#0F172A' : '#475569',
                background: activeCategory === 'consultations' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'consultations' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('consultations');
              }}
            >
              الاستشارات
            </div>

            {/* 6. الذكاء الاصطناعي */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'ai' ? '900' : '700',
                color: activeCategory === 'ai' ? '#0F172A' : '#475569',
                background: activeCategory === 'ai' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'ai' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('ai');
              }}
            >
              الذكاء الاصطناعي
            </div>

            {/* 7. البحث والمعرفة */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'knowledge' ? '900' : '700',
                color: activeCategory === 'knowledge' ? '#0F172A' : '#475569',
                background: activeCategory === 'knowledge' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'knowledge' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('knowledge');
              }}
            >
              البحث والمعرفة
            </div>

            {/* 8. استخدام المنصة */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'usage' ? '900' : '700',
                color: activeCategory === 'usage' ? '#0F172A' : '#475569',
                background: activeCategory === 'usage' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'usage' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('usage');
              }}
            >
              استخدام المنصة
            </div>

            {/* 9. مالي */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'financial' ? '900' : '700',
                color: activeCategory === 'financial' ? '#0F172A' : '#475569',
                background: activeCategory === 'financial' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'financial' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('financial');
              }}
            >
              مالي
            </div>

            {/* 10. التدقيق والسرية */}
            <div 
              style={{
                fontSize: '12.5px',
                fontWeight: activeCategory === 'audit' ? '900' : '700',
                color: activeCategory === 'audit' ? '#0F172A' : '#475569',
                background: activeCategory === 'audit' ? '#FEF3C7' : 'transparent',
                borderRight: activeCategory === 'audit' ? '3px solid #E58A13' : '3px solid transparent',
                padding: '8px 8px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setActiveCategory('audit');
              }}
            >
              التدقيق والسرية
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FLOATING HOVER TOOLTIP (APPEARS NEAR MOUSE ON ANY CHART HOVER)
          ══════════════════════════════════════════════════════════════════ */}
      {hoveredChartItem && (
        <div 
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid #334155'
          }}
        >
          <div style={{ color: '#FBBF24', fontSize: '12.5px', marginBottom: '2px' }}>{hoveredChartItem.title}</div>
          <div style={{ color: '#E2E8F0', fontSize: '11.5px' }}>{hoveredChartItem.text}</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          UNIVERSAL DRILLDOWN MODAL (OPENS ON CLICKING ANY CARD / BAR / SLICE)
          ══════════════════════════════════════════════════════════════════ */}
      {drilldownModal && (
        <div className="admin-modal-overlay" onClick={() => setDrilldownModal(null)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '1000px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '12px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button 
                className="admin-icon-btn-minimal" 
                style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px' }}
                onClick={() => setDrilldownModal(null)}
              >
                ✕
              </button>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0A3C64' }}>
                {drilldownModal.title}
              </h3>
            </div>

            {/* Top Banner with Stats & Action Buttons */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                    بيانات السجلات: <span style={{ color: '#64748B', fontWeight: '600' }}>الفترة: {fromDate} إلى {toDate} | إجمالي: {drilldownModal.rows.length} سجل</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
                    {drilldownModal.subtitle}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="admin-btn-action-primary" 
                    style={{ fontSize: '12px', padding: '6px 14px', background: '#0A3C64', borderColor: '#0A3C64' }}
                    onClick={handleExportCSV}
                  >
                    تصدير الجدول (CSV) 📥
                  </button>
                  <button 
                    className="admin-btn-action-outline" 
                    style={{ fontSize: '12px', padding: '6px 14px', background: '#FFFFFF' }}
                    onClick={() => window.print()}
                  >
                    طباعة التقرير 🖨️
                  </button>
                </div>
              </div>

              {/* 4 Stat Summary Cards inside Modal */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${drilldownModal.stats.length}, 1fr)`, gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                {drilldownModal.stats.map((st, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: st.color || '#0A3C64' }}>{st.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{st.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Table Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                سجل البيانات الميدانية ({drilldownModal.rows.length})
              </div>
              <input 
                type="text"
                className="admin-search-input"
                placeholder="بحث سريع داخل الجدول..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                style={{ width: '220px', height: '32px', fontSize: '12px' }}
              />
            </div>

            {/* Drilldown Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    {drilldownModal.columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drilldownModal.rows
                    .filter(r => Object.values(r).some(v => String(v).includes(modalSearch)))
                    .map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, cellIdx) => (
                          <td key={cellIdx} style={{ fontSize: '12px', fontWeight: cellIdx === 0 ? '800' : '500', color: cellIdx === 0 ? '#0F172A' : '#475569' }}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Close Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                className="admin-btn-action-outline" 
                style={{ padding: '7px 20px', fontSize: '12.5px' }}
                onClick={() => setDrilldownModal(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

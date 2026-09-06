import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { apiFetch } from '../services/api';
import './UserDashboard.css';

export default function UserDashboard({ navigate }) {
  const { token, user } = useAuth();
  
  // Data States
  const [activeSub, setActiveSub] = useState(null);
  const [laws, setLaws] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [yearFrom, setYearFrom] = useState(1930);
  const [yearTo, setYearTo] = useState(2026);

  // Custom Dropdown States
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const activityDropdownRef = useRef(null);

  // Modal States
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('alerts');

  // Click outside for custom activity dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activityDropdownRef.current && !activityDropdownRef.current.contains(e.target)) {
        setShowActivityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    if (!token) return;
    const fetchAllData = async () => {
      try {
        const [subRes, lawsRes, apptsRes, notifsRes, ticketsRes] = await Promise.all([
          apiFetch('/api/subscriptions/my-subscription', {}, token).catch(() => null),
          apiFetch('/api/legal/laws', {}, token).catch(() => []),
          appointmentService.getMyAppointments(token).catch(() => []),
          notificationService.getMyNotifications(token).catch(() => []),
          apiFetch('/api/tickets/my?page=1&limit=20', {}, token).catch(() => [])
        ]);

        if (subRes && subRes.has_subscription) {
          setActiveSub(subRes);
        }
        setLaws(Array.isArray(lawsRes) ? lawsRes : []);

        // Handle client history as well as consultant incoming appointments
        let apptsData = Array.isArray(apptsRes) ? apptsRes : (apptsRes?.data || apptsRes?.appointments || []);
        if (!apptsData || apptsData.length === 0) {
          const incomingRes = await apiFetch('/api/appointments/incoming', {}, token).catch(() => []);
          apptsData = Array.isArray(incomingRes) ? incomingRes : (incomingRes?.data || incomingRes?.appointments || []);
        }
        setAppointments(apptsData);

        const notifsList = Array.isArray(notifsRes) ? notifsRes : (notifsRes?.data || notifsRes?.notifications || []);
        setNotifications(notifsList);
        
        // Handle tickets structure
        const ticketsList = Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.data || ticketsRes?.tickets || []);
        setTickets(ticketsList);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  // Default Laws matching HTML design reference exactly
  const defaultLaws = [
    { law_id: 'law_1', title: 'قانون معدل لقانون ضريبة الدخل', number: 34, year: 2026, status: 'active', type: 'law', pub: '18/08/2026', eff: '01/09/2026', desc: 'تعديل تشريعي على أحكام مختارة من قانون ضريبة الدخل وتنظيم تاريخ بدء العمل بها.' },
    { law_id: 'law_2', title: 'تعليمات معدلة لإجراءات الفوترة والامتثال', number: 4, year: 2026, status: 'active', type: 'instructions', pub: '14/08/2026', eff: '14/08/2026', desc: 'تحديث للإجراءات المرتبطة بالتوثيق والفوترة وفق المتطلبات الضريبية النافذة.' },
    { law_id: 'law_3', title: 'قرار بشأن تطبيق أحكام الاقتطاع الضريبي', number: 12, year: 2026, status: 'active', type: 'decisions', pub: '09/08/2026', eff: '09/08/2026', desc: 'قرار تنظيمي يوضح نطاق التطبيق والإجراءات المرتبطة بالاقتطاع من المصدر.' },
    { law_id: 'law_4', title: 'حكم تفسيري في نطاق الإعفاء الضريبي', number: 2, year: 2026, status: 'active', type: 'interpretive', pub: '03/08/2026', eff: 'ساري', desc: 'تفسير قانوني لنطاق تطبيق أحد الإعفاءات وشروط الاستفادة منه.' },
    { law_id: 'law_5', title: 'نظام معدل لنظام تنظيم الشؤون الضريبية', number: 15, year: 2026, status: 'active', type: 'regulation', pub: '29/07/2026', eff: '15/08/2026', desc: 'تعديلات تنظيمية على بعض الإجراءات الإدارية المرتبطة بالخدمات والالتزامات الضريبية.' },
    { law_id: 'law_6', title: 'قرار يتعلق بمعالجة بعض حالات رد الضريبة', number: 8, year: 2026, status: 'active', type: 'decisions', pub: '24/07/2026', eff: '24/07/2026', desc: 'تحديد إجراءات وضوابط تطبيقية لحالات مختارة من رد الضريبة والمستندات المؤيدة.' },
    { law_id: 'law_7', title: 'تعليمات بشأن الإقرار الضريبي الإلكتروني', number: 17, year: 2026, status: 'active', type: 'instructions', pub: '17/07/2026', eff: '01/08/2026', desc: 'تنظيم متطلبات تقديم الإقرار إلكترونياً وآليات التحقق والاحتفاظ بالسجلات.' },
    { law_id: 'law_8', title: 'حكم قضائي في خصم المصاريف المقبولة', number: 21, year: 2026, status: 'active', type: 'judicial', pub: '11/07/2026', eff: 'ساري', desc: 'حكم يتناول ضوابط قبول بعض المصاريف لغايات احتساب الدخل الخاضع للضريبة.' }
  ];

  const displayLaws = laws.length > 0 ? laws : defaultLaws;

  // Type & Status Label Mapping
  const typeMap = {
    all: 'الكل',
    law: 'قانون',
    regulation: 'نظام',
    instructions: 'تعليمات',
    decisions: 'قرار',
    judicial: 'حكم قضائي',
    interpretive: 'حكم تفسيري',
    forms: 'نماذج'
  };

  const statusMap = {
    all: 'الكل',
    active: 'ساري',
    amended: 'معدل',
    repealed: 'ملغى'
  };

  // Filtered Laws
  const filteredLaws = displayLaws.filter(l => {
    const matchesQuery = !searchQuery || (l.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const lawYear = parseInt(l.year || 2026);
    const matchesYear = lawYear >= yearFrom && lawYear <= yearTo;
    const matchesType = selectedType === 'all' || l.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || l.status === selectedStatus;
    return matchesQuery && matchesYear && matchesType && matchesStatus;
  });

  // Calculate Quotas & Usage Percentages
  const coUsed = activeSub?.consultations_used ?? (appointments.length > 0 ? appointments.length : 12);
  const coTotal = activeSub?.consultations_total || 20;
  const coPct = Math.min(100, Math.round((coUsed / coTotal) * 100));

  const aiUsed = 248;
  const aiTotal = 400;
  const aiPct = Math.min(100, Math.round((aiUsed / aiTotal) * 100));

  const dlUsed = 18;
  const dlTotal = 25;
  const dlPct = Math.min(100, Math.round((dlUsed / dlTotal) * 100));

  const totalUsedPct = Math.round((aiPct + dlPct + coPct) / 3);

  // Conic Gradient for Ring Chart matching design
  const ringStyle = {
    background: `conic-gradient(#123a54 0% ${aiPct}%, #d99a27 ${aiPct}% ${Math.min(100, aiPct + dlPct)}%, #27865F ${Math.min(100, aiPct + dlPct)}% 100%)`
  };

  // Status Arabic translation helper
  const getStatusLabel = (st) => {
    switch (st) {
      case 'confirmed': return 'مؤكدة';
      case 'completed': return 'مكتملة';
      case 'finished': return 'مكتملة';
      case 'pending': return 'بانتظار موافقة المستشار';
      case 'scheduled': return 'مجدولة';
      default: return st || 'نشطة';
    }
  };

  // Activity Click Handler - Navigates directly to the item's target page
  const handleActivityClick = (act) => {
    setShowAllActivity(false);

    // Check if the activity item represents a chat message or conversation update
    const isChatMessage = (act.title || '').includes('رسالة') || 
                          (act.sub || '').includes('رسالة') || 
                          (act.title || '').includes('شات') || 
                          (act.title || '').includes('محادثة') ||
                          act.type === 'message' ||
                          act.category === 'chat';

    if (isChatMessage) {
      if (act.appointment_id) {
        navigate(`/chat?apptId=${act.appointment_id}`);
        return;
      }
      if (act.rawId && act.type === 'consultation') {
        navigate(`/chat?apptId=${act.rawId}`);
        return;
      }
      // Search in appointments for a matching partner name in title or subtitle
      const titleOrSub = `${act.title || ''} ${act.sub || ''}`.toLowerCase();
      const partnerNameMatch = appointments.find(a => {
        const pName = (a.consultant_name || a.client_name || a.consultant?.full_name || a.user?.full_name || '').toLowerCase();
        return pName && pName.length > 2 && titleOrSub.includes(pName);
      });
      if (partnerNameMatch) {
        navigate(`/chat?apptId=${partnerNameMatch.id}`);
        return;
      }
      if (act.link && act.link.includes('/chat?apptId=')) {
        navigate(act.link);
        return;
      }
      navigate('/chat');
      return;
    }

    if (act.link) {
      navigate(act.link);
      return;
    }
    if (act.category === 'consults' || act.type === 'consultation') {
      navigate(act.rawId ? `/chat?apptId=${act.rawId}` : '/chat');
    } else if (act.category === 'tickets' || act.type === 'ticket') {
      navigate('/support/tickets');
    } else if (act.category === 'alerts' || act.type === 'notif') {
      navigate('/regulations');
    } else {
      navigate('/chat');
    }
  };

  // Activity Items Combined accurately
  const rawActivities = [
    ...notifications.map(n => ({
      id: `notif-${n.id}`,
      rawId: n.id,
      type: 'notif',
      title: n.title || n.message || 'تنبيه جديد',
      date: n.created_at ? new Date(n.created_at).toLocaleDateString('ar-EG') : 'اليوم',
      category: 'alerts',
      sub: n.message || 'تحديث على منصتك الضريبية',
      link: n.link || n.url || null,
      appointment_id: n.appointment_id || n.appt_id || n.data?.appointment_id || null
    })),
    ...appointments.map(a => ({
      id: `appt-${a.id}`,
      rawId: a.id,
      type: 'consultation',
      title: `استشارة: ${a.service_name || a.title || a.consultation_type || a.notes || 'استشارة ضريبية'}`,
      date: a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString('ar-EG') : (a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('ar-EG') : 'مؤخراً'),
      category: 'consults',
      sub: `المستشار/العميل: ${a.consultant_name || a.client_name || a.consultant?.full_name || a.user?.full_name || 'د. أحمد مسعد'} • ${getStatusLabel(a.status)}`,
      link: `/chat?apptId=${a.id}`,
      appointment_id: a.id
    })),
    ...tickets.map(t => ({
      id: `ticket-${t.id}`,
      rawId: t.id,
      type: 'ticket',
      title: `تذكرة: ${t.subject || t.title || 'تذكرة دعم'}`,
      date: t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : 'مؤخراً',
      category: 'tickets',
      sub: `الحالة: ${t.status || 'مفتوحة'}`,
      link: `/support/tickets`
    }))
  ];

  const defaultActivities = [
    { id: 1, title: 'صدر قانون معدل لقانون ضريبة الدخل', date: 'منذ ساعتين', category: 'alerts', sub: 'تمت إضافة النص والتعديلات والارتباطات التشريعية', link: '/regulations' },
    { id: 2, title: 'تحديث على تعليمات ضريبة المبيعات', date: 'منذ 5 ساعات', category: 'alerts', sub: 'أصبح النص المحدث متاحاً للبحث والمقارنة', link: '/regulations' },
    { id: 3, title: 'استشارة ضريبية — ضريبة الدخل', date: '12 سبتمبر · 10:00 ص', category: 'events', sub: 'جلسة فيديو مع المستشار رائد الحداد', link: '/my-appointments' },
    { id: 4, title: 'المعالجة الضريبية لعقود الخدمات', date: '12 أغسطس', category: 'consults', sub: 'استشارة مكتملة — الملخص والتوصيات متاحة', link: '/my-appointments' }
  ];

  // Correct Filtering:
  // - alerts: notifications/alerts
  // - events: upcoming appointments
  // - consults: ALL user appointments (pending, confirmed, completed)
  // - tickets: support tickets
  const filteredActivities = rawActivities.length > 0 
    ? rawActivities.filter(a => {
        if (activityFilter === 'alerts') return a.category === 'alerts';
        if (activityFilter === 'events') return a.category === 'consults' || a.category === 'events';
        if (activityFilter === 'consults') return a.category === 'consults';
        if (activityFilter === 'tickets') return a.category === 'tickets';
        return true;
      })
    : defaultActivities.filter(a => activityFilter === 'all' || a.category === activityFilter);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/regulations?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#123a54' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #dce5ea',
          borderTopColor: '#123a54',
          borderRadius: '50%',
          margin: '0 auto 16px auto',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', fontWeight: '700' }}>جاري تحميل الصفحة الرئيسية...</span>
      </div>
    );
  }

  const userName = user?.full_name || 'محمد مسعد';

  const activityOptions = [
    { value: 'alerts', label: 'التنبيهات' },
    { value: 'events', label: 'الأحداث القادمة' },
    { value: 'consults', label: 'آخر الاستشارات' },
    { value: 'tickets', label: 'التذاكر المفتوحة' }
  ];

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      
      {/* 1. Welcome Banner Header */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome-title">مرحباً بك، {userName} 👋</h1>
          <p className="dash-welcome-sub">أهلاً بك في منصتك الضريبية الموحدة — المستجدات والخدمات والرصيد في مكان واحد.</p>
        </div>
      </div>

      {/* 2. Attached Search Bar & Advanced Dropdown (Exact HTML Design) */}
      <div className="searchSectionContainer">
        <div className="searchWrap">
          <button type="button" className="searchIcon" onClick={handleSearchSubmit}>⌕</button>
          <input
            id="q"
            placeholder="ابحث في التشريعات الضريبية، القوانين، القرارات، التعليمات والتفسيرات…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button
            type="button"
            className={`advanced ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            بحث متقدم
          </button>
        </div>

        {/* Attached Dropdown Modal */}
        {showAdvanced && (
          <div className="advancedDropdown" id="modal">
            <div className="advancedFilterModal advancedFilterInline">
              
              <div className="advancedFilterHead">
                <div>
                  <h2>البحث المتقدم</h2>
                  <p>حدد نطاق البحث أولاً، ثم ابحث بالكلمة أو المصطلح في شريط البحث.</p>
                </div>
              </div>

              <div className="advancedFilterBody">
                
                {/* 1. حالة التشريع */}
                <section className="filterGroup">
                  <h3>حالة التشريع</h3>
                  <div className="filterChips" id="statusChips">
                    {[
                      { key: 'all', label: 'الكل' },
                      { key: 'active', label: 'ساري' },
                      { key: 'amended', label: 'معدل' },
                      { key: 'repealed', label: 'ملغى' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        className={`filterChip ${selectedStatus === item.key ? 'selected' : ''}`}
                        onClick={() => setSelectedStatus(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 2. نوع التشريع */}
                <section className="filterGroup">
                  <h3>نوع التشريع</h3>
                  <div className="filterChips typeChips" id="typeChips">
                    {[
                      { key: 'all', label: 'الكل' },
                      { key: 'law', label: 'قانون' },
                      { key: 'regulation', label: 'نظام' },
                      { key: 'instructions', label: 'تعليمات' },
                      { key: 'decisions', label: 'قرارات' },
                      { key: 'judicial', label: 'أحكام قضائية' },
                      { key: 'interpretive', label: 'أحكام تفسيرية' },
                      { key: 'forms', label: 'نماذج' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        className={`filterChip ${selectedType === item.key ? 'selected' : ''}`}
                        onClick={() => setSelectedType(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3. الفترة الزمنية */}
                <section className="filterGroup dateGroup">
                  <h3>الفترة الزمنية (السنة)</h3>
                  <div className="dateGrid">
                    <div className="dateField">
                      <span>من سنة:</span>
                      <input
                        type="number"
                        min="1930"
                        max="2030"
                        value={yearFrom}
                        onChange={(e) => setYearFrom(Number(e.target.value))}
                      />
                    </div>
                    <div className="dateField">
                      <span>إلى سنة:</span>
                      <input
                        type="number"
                        min="1930"
                        max="2030"
                        value={yearTo}
                        onChange={(e) => setYearTo(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </section>

              </div>

              <div className="advancedFilterFoot">
                <button
                  type="button"
                  className="applyFiltersBtn"
                  onClick={() => setShowAdvanced(false)}
                >
                  تطبيق الفلاتر
                </button>
                <button
                  type="button"
                  className="resetFiltersBtn"
                  onClick={() => {
                    setSelectedStatus('all');
                    setSelectedType('all');
                    setYearFrom(1930);
                    setYearTo(2026);
                  }}
                >
                  إعادة تعيين
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 3. آخر المستجدات والتشريعات الضريبية الأردنية (Exact HTML Design Cards & Animations) */}
      <section className="updates">
        <div className="sectionHead">
          <div>
            <h2>آخر مستجدات التشريعات الضريبية الأردنية</h2>
            <p></p>
          </div>
          <button className="link" onClick={() => setShowAllUpdates(true)}>
            عرض الكل ({filteredLaws.length}) ←
          </button>
        </div>

        <div className="updateGrid">
          {filteredLaws.slice(0, 8).map((law, idx) => (
            <article
              key={law.law_id || idx}
              className="updateCard"
              onClick={() => setSelectedUpdate(law)}
            >
              <div className="badges">
                <span className="badge">{typeMap[law.type] || law.type || 'قانون'}</span>
                <span className="badge">{statusMap[law.status] || law.status || 'ساري'}</span>
              </div>
              <h3>{law.title}</h3>
              <p>{law.desc || 'تعديل تشريعي وتنظيمي موثق ومحتوى معتمد رسمياً.'}</p>
              <div className="dates">
                <span>النشر {law.pub || '18/08/2026'}</span>
                <span>السريان {law.eff || '01/09/2026'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. 3-Column Operations Grid (EXACT HTML SPECIFICATION) */}
      <section className="operationsGrid">

        {/* Panel 1: Quick Access Stack */}
        <div className="panel quickStack">
          <div className="stackHead">
            <div>
              <h2>وصول سريع</h2>
              <p>المهام الأكثر استخدامًا</p>
            </div>
          </div>

          <button className="quickStackItem" onClick={() => navigate('/consultants')}>
            <span className="stackIcon">◴</span>
            <span className="stackText"><b>حجز استشارة</b><small>اختيار الموعد والمستشار</small></span>
            <span className="stackArrow">←</span>
          </button>

          <button className="quickStackItem" onClick={() => navigate('/ai-assistant')}>
            <span className="stackIcon">✦</span>
            <span className="stackText"><b>البحث الذكي</b><small>اسأل داخل المعرفة الضريبية</small></span>
            <span className="stackArrow">←</span>
          </button>

          <button className="quickStackItem" onClick={() => navigate('/quick-consultation')}>
            <span className="stackIcon">⚡</span>
            <span className="stackText"><b>استشارة سريعة</b><small>إجابة عاجلة ومباشرة على سؤالك</small></span>
            <span className="stackArrow">←</span>
          </button>

          <button className="quickStackItem" onClick={() => navigate('/regulations')}>
            <span className="stackIcon">▤</span>
            <span className="stackText"><b>النماذج والتشريعات</b><small>الوصول إلى النماذج المعتمدة</small></span>
            <span className="stackArrow">←</span>
          </button>
        </div>

        {/* Panel 2: Activity Feed */}
        <div className="panel activity activityRefined">
          <div className="activityTop">
            <div className="activityTitle">
              <span className="sectionIcon">◫</span>
              <div>
                <h2>سجل النشاطات</h2>
                <small>آخر التحديثات التي تتطلب انتباهك</small>
              </div>
            </div>

            <div className="activityControls">
              {/* Custom Modern Dropdown Component */}
              <div className="customSelectWrap" ref={activityDropdownRef}>
                <button
                  type="button"
                  className={`customSelectTrigger ${showActivityDropdown ? 'active' : ''}`}
                  onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                >
                  <span>
                    {activityOptions.find(o => o.value === activityFilter)?.label || 'التنبيهات'}
                  </span>
                  <span className="chevIcon">▼</span>
                </button>

                {showActivityDropdown && (
                  <div className="customSelectMenu">
                    {activityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`customOptionItem ${activityFilter === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setActivityFilter(opt.value);
                          setShowActivityDropdown(false);
                        }}
                      >
                        <span>{opt.label}</span>
                        {activityFilter === opt.value && <span style={{ fontSize: '11px', color: '#0f4a6b' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="viewAllBtn" onClick={() => setShowAllActivity(true)}>
                عرض الكل ←
              </button>
            </div>
          </div>

          <div className="activityBody compact">
            {filteredActivities.length > 0 ? (
              filteredActivities.slice(0, 4).map((act, i) => (
                <div key={act.id} className="row" style={{ cursor: 'pointer' }} onClick={() => handleActivityClick(act)}>
                  <span className="dot" style={{ background: act.category === 'consults' ? '#27865f' : '#d99a27' }}></span>
                  <div>
                    <strong>{act.title}</strong>
                    <small>{act.sub || 'متابعة وتحديث على المنصة'}</small>
                  </div>
                  <time>{act.date}</time>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8799a4', fontSize: '12px' }}>
                لا توجد عناصر في هذا الفلتر حالياً.
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Usage Panel */}
        <div className="panel usage usageRefined clickablePanel" onClick={() => setShowUsageModal(true)}>
          <div className="usageHeader">
            <div>
              <h2>استهلاك الباقة</h2>
              <p>ملخص الاستخدام الحالي</p>
            </div>
            <span className="usageOpen">↗</span>
          </div>

          <div className="usageCoreVertical">
            <div className="ring multi refinedRing" style={ringStyle}>
              <div className="ringText">
                <div>
                  <b>{totalUsedPct}%</b>
                  <span>مستخدم</span>
                </div>
              </div>
            </div>

            <div className="usageList refinedUsageList">
              <div className="uitem">
                <div className="uline">
                  <span><i className="legend ai"></i>أسئلة AI</span>
                  <b>{aiUsed} / {aiTotal}</b>
                </div>
                <div className="bar">
                  <div className="fill aiFill" style={{ width: `${aiPct}%` }}></div>
                </div>
              </div>

              <div className="uitem">
                <div className="uline">
                  <span><i className="legend downloads"></i>تحميل القوانين</span>
                  <b>{dlUsed} / {dlTotal}</b>
                </div>
                <div className="bar">
                  <div className="fill downloadsFill" style={{ width: `${dlPct}%` }}></div>
                </div>
              </div>

              <div className="uitem">
                <div className="uline">
                  <span><i className="legend consults"></i>الاستشارات</span>
                  <b>{coUsed} / {coTotal}</b>
                </div>
                <div className="bar">
                  <div className="fill consultsFill" style={{ width: `${coPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="usageFooter">عرض تفاصيل الاستخدام ←</div>
        </div>

      </section>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* Modal 1: Law Detail Preview */}
      {selectedUpdate && (
        <div className="dash-modal-overlay" onClick={() => setSelectedUpdate(null)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3 className="dash-modal-title">{selectedUpdate.title}</h3>
              <button className="dash-modal-close" onClick={() => setSelectedUpdate(null)}>×</button>
            </div>
            <div className="dash-modal-body">
              <div className="badges" style={{ marginBottom: '12px' }}>
                <span className="badge">{typeMap[selectedUpdate.type] || selectedUpdate.type}</span>
                <span className="badge">سنة {selectedUpdate.year || 2026}</span>
                <span className="badge">الحالة: {statusMap[selectedUpdate.status] || selectedUpdate.status}</span>
              </div>

              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.8', margin: 0 }}>
                {selectedUpdate.desc || 'هذا التشريع معتمد رسمياً من دائرة ضريبة الدخل والمبيعات الأردنية.'}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="applyFiltersBtn"
                  onClick={() => {
                    setSelectedUpdate(null);
                    navigate(`/regulations?lawId=${selectedUpdate.law_id}`);
                  }}
                >
                  فتح الوثيقة
                </button>
                <button className="resetFiltersBtn" onClick={() => setSelectedUpdate(null)}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: All Updates List */}
      {showAllUpdates && (
        <div className="dash-modal-overlay" onClick={() => setShowAllUpdates(false)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3 className="dash-modal-title">آخر مستجدات التشريعات الضريبية الأردنية ({displayLaws.length})</h3>
              <button className="dash-modal-close" onClick={() => setShowAllUpdates(false)}>×</button>
            </div>
            <div className="dash-modal-body">
              {displayLaws.map((law, idx) => (
                <div
                  key={law.law_id || idx}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px solid #dce5ea',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '12.5px', color: '#123a54' }}>{law.title}</h4>
                    <span style={{ fontSize: '10px', color: '#718797' }}>{typeMap[law.type] || law.type} • سنة {law.year}</span>
                  </div>
                  <button
                    className="resetFiltersBtn"
                    style={{ padding: '4px 12px', fontSize: '11px', minHeight: '32px' }}
                    onClick={() => {
                      setShowAllUpdates(false);
                      navigate(`/regulations?lawId=${law.law_id}`);
                    }}
                  >
                    عرض ←
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: All Activity List (Filtered by selected category with tabs & click navigation) */}
      {showAllActivity && (
        <div className="dash-modal-overlay" onClick={() => setShowAllActivity(false)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 className="dash-modal-title" style={{ margin: 0 }}>
                  سجل النشاطات — {activityOptions.find(o => o.value === activityFilter)?.label || 'الكل'}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  عدد العناصر: {filteredActivities.length}
                </span>
              </div>
              <button className="dash-modal-close" onClick={() => setShowAllActivity(false)}>✕</button>
            </div>

            {/* Filter Tabs Bar inside Modal */}
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
              {activityOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActivityFilter(opt.value)}
                  style={{
                    background: activityFilter === opt.value ? '#123a54' : '#ffffff',
                    color: activityFilter === opt.value ? '#ffffff' : '#475569',
                    border: activityFilter === opt.value ? '1px solid #123a54' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: activityFilter === opt.value ? '700' : '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="dash-modal-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px 16px' }}>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="row"
                    onClick={() => handleActivityClick(act)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #edf1f3',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="dot" style={{ background: act.category === 'consults' ? '#27865f' : '#d99a27', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '11.5px', color: '#123a54', display: 'block' }}>{act.title}</strong>
                      <small style={{ fontSize: '11px', color: '#718797', display: 'block', marginTop: '2px' }}>
                        {act.sub || ''}
                      </small>
                    </div>
                    <time style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{act.date}</time>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#8799a4', fontSize: '13px' }}>
                  لا توجد عناصر في هذا الفلتر حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Quota & Usage Details */}
      {showUsageModal && (
        <div className="dash-modal-overlay" onClick={() => setShowUsageModal(false)}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <div>
                <h3 className="dash-modal-title">تفاصيل استهلاك الباقة</h3>
                <span style={{ fontSize: '11px', color: '#718797' }}>الباقة الاحترافية · دورة الاستخدام الحالية</span>
              </div>
              <button className="dash-modal-close" onClick={() => setShowUsageModal(false)}>×</button>
            </div>
            <div className="dash-modal-body">
              <div style={{ background: '#fbfcfd', padding: '16px', borderRadius: '14px', border: '1px solid #dce5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#718797' }}>الخطة الحالية</span>
                  <h4 style={{ margin: '2px 0', fontSize: '18px', color: '#123a54' }}>
                    {activeSub?.plan_name || 'الاحترافية'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#718797' }}>
                    تجدد في {activeSub?.renewal_date || '28 سبتمبر 2026'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <b style={{ fontSize: '24px', color: '#123a54', display: 'block' }}>{totalUsedPct}%</b>
                  <span style={{ fontSize: '10px', color: '#718797' }}>إجمالي الاستخدام</span>
                </div>
              </div>

              <div className="dash-quota-grid">
                <div className="dash-quota-card">
                  <div className="dash-quota-val">{aiUsed} / {aiTotal}</div>
                  <div className="dash-quota-sub">أسئلة AI</div>
                </div>
                <div className="dash-quota-card">
                  <div className="dash-quota-val">{dlUsed} / {dlTotal}</div>
                  <div className="dash-quota-sub">تحميل القوانين</div>
                </div>
                <div className="dash-quota-card">
                  <div className="dash-quota-val">{coUsed} / {coTotal}</div>
                  <div className="dash-quota-sub">الاستشارات</div>
                </div>
              </div>

              <button
                className="applyFiltersBtn"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => {
                  setShowUsageModal(false);
                  navigate('/subscriptions');
                }}
              >
                إدارة الباقة وترقيتها
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

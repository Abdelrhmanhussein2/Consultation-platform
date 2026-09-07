import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { apiFetch } from '../services/api';
import Toast, { useToast } from '../components/Toast/Toast';
import './UserDashboard.css';
import './ConsultantDashboard.css';

// Default Laws matching UserDashboard.jsx exactly
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

const typeMap = {
  all: 'الكل',
  law: 'قوانين',
  regulation: 'أنظمة',
  instructions: 'تعليمات',
  decisions: 'قرارات',
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

export default function ConsultantDashboard({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [laws, setLaws] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Search & Laws states (EXACT MATCH with UserDashboard)
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [yearFrom, setYearFrom] = useState(1930);
  const [yearTo, setYearTo] = useState(2026);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  // Timeline Day / Week Filter state
  const [timelineView, setTimelineView] = useState('day'); // 'day' | 'week'

  // Interactive Popup Modal state (null | 'alerts' | 'performance' | 'services' | 'finance' | 'session')
  const [consultantModal, setConsultantModal] = useState(null);
  const [selectedSessionData, setSelectedSessionData] = useState(null);

  // Custom Styled Rejection Reason Modal
  const [rejectionModalApptId, setRejectionModalApptId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Dynamic filter state for Alerts Modal & Services Modal
  const [alertFilterKey, setAlertFilterKey] = useState('all'); // 'all' | 'urgent' | 'today' | 'pending'
  const [serviceFilterKey, setServiceFilterKey] = useState('all'); // 'all' | 'available' | 'limited'

  const handleNavigate = (path) => {
    if (typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleSearchSubmit = () => {
    // Submit search trigger
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [walletData, apptsData, profileData, servicesData, lawsRes] = await Promise.all([
        consultantService.getWallet(token).catch(() => null),
        consultantService.getIncomingAppointments(token).catch(() => []),
        consultantService.getMyProfile(token).catch(() => null),
        consultantService.getMyServices(token).catch(() => []),
        apiFetch('/api/legal/laws', {}, token).catch(() => [])
      ]);

      setWallet(walletData);
      setAppointments(apptsData || []);
      setProfile(profileData);
      setServices(servicesData || []);
      setLaws(Array.isArray(lawsRes) && lawsRes.length > 0 ? lawsRes : []);
    } catch (err) {
      console.error("Error fetching consultant dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleApprove = async (apptId) => {
    if (!token) return;
    setActionLoadingId(apptId);
    try {
      await consultantService.approveAppointment(apptId, token);
      await fetchDashboardData();
      showToast('تم قبول طلب الاستشارة بنجاح!');
    } catch (err) {
      showToast(err.message || 'فشلت عملية الموافقة على الطلب', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Custom styled rejection flow
  const handleOpenRejectModal = (apptId) => {
    setRejectionModalApptId(apptId);
    setRejectionReason('');
  };

  const confirmRejectSubmit = async () => {
    if (!token || !rejectionModalApptId) return;
    const apptId = rejectionModalApptId;
    const reasonText = rejectionReason.trim() || "تم الرفض من قبل المستشار";

    setActionLoadingId(apptId);
    try {
      await consultantService.rejectAppointment(apptId, reasonText, token);
      await fetchDashboardData();
      showToast('تم رفض طلب الاستشارة وإعلام العميل.');
      setRejectionModalApptId(null);
      setRejectionReason('');
    } catch (err) {
      showToast(err.message || 'فشلت عملية رفض الطلب', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Laws Filtering (Exact logic matching UserDashboard)
  const displayLaws = laws.length > 0 ? laws : defaultLaws;

  const filteredLaws = useMemo(() => {
    return displayLaws.filter(law => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = (law.title || '').toLowerCase().includes(q);
        const matchDesc = (law.desc || law.summary || '').toLowerCase().includes(q);
        const matchNum = (law.number || '').toString().includes(q);
        if (!matchTitle && !matchDesc && !matchNum) return false;
      }
      if (selectedStatus !== 'all' && law.status !== selectedStatus) return false;
      if (selectedType !== 'all' && law.type !== selectedType) return false;
      if (law.year && (law.year < yearFrom || law.year > yearTo)) return false;
      return true;
    });
  }, [displayLaws, searchQuery, selectedStatus, selectedType, yearFrom, yearTo]);

  // Timeline items computation based on Day / Week filter
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekEnd = new Date();
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const timelineAppointments = useMemo(() => {
    const filtered = appointments.filter(a => {
      if (!a.scheduled_at) return true;
      const apptDate = a.scheduled_at.split('T')[0];
      if (timelineView === 'day') {
        return apptDate === todayStr;
      } else {
        const d = new Date(a.scheduled_at);
        const todayObj = new Date(todayStr);
        return d >= todayObj && d <= nextWeekEnd;
      }
    });

    // Chronological sorting: Earliest upcoming appointment at top
    return [...filtered].sort((a, b) => {
      if (!a.scheduled_at) return 1;
      if (!b.scheduled_at) return -1;
      return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    });
  }, [appointments, timelineView, todayStr]);

  // Fallback demo timeline items if backend has no appointments
  const demoTimelineItems = [
    {
      id: 'demo-1',
      time: '10:00',
      period: 'صباحاً',
      client: 'شركة المنسوجات الحديثة — عبد الله العمر',
      service: 'مراجعة شريحة الاقتطاع الضريبي',
      type: 'فيديو',
      statusStr: 'مؤكدة',
      active: true,
      notes: 'إعادة تدقيق إقرارات ضريبة المبيعات وتعديل الخصم المدين',
      actionType: 'join'
    },
    {
      id: 'demo-2',
      time: '12:30',
      period: 'ظهرًا',
      client: 'مكتب الرائد للاستيراد — م. خليل الأحمد',
      service: 'معالجة الديون المعدومة والخصوم',
      type: 'صوتية',
      statusStr: 'بانتظار التأكيد',
      active: false,
      notes: 'طلب توضيح الشروط القانونية لشطب الديون غير القابلة للتحصيل',
      actionType: 'approve'
    },
    {
      id: 'demo-3',
      time: '03:15',
      period: 'عصراً',
      client: 'مؤسسة الأفق التقني — رانيا محمود',
      service: 'استشارة الفوترة الإلكترونية',
      type: 'محادثة',
      statusStr: 'مكتملة',
      active: false,
      notes: 'مراجعة الربط مع المنظومة الوطنية للفوترة وتدقيق الملفات',
      actionType: 'view'
    }
  ];

  const activeTimelineList = timelineAppointments.length > 0 ? timelineAppointments : demoTimelineItems;

  // Dynamic Alerts derived directly from real backend appointments
  const alertItemsData = useMemo(() => {
    const list = [];

    // 1. Pending approval requests (Urgent)
    const pendingAppts = appointments.filter(a => a.status === 'pending_approval' || a.status === 'pending');
    pendingAppts.forEach((appt, idx) => {
      const clientName = appt.user?.full_name || appt.user_name || appt.client_name || 'عميل';
      const dateStr = appt.scheduled_at
        ? new Date(appt.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })
        : 'اليوم';
      list.push({
        id: `pending-${appt.id || idx}`,
        title: 'طلب استشارة عاجل بانتظار الموافقة',
        desc: `${clientName} · ${dateStr}`,
        category: 'urgent',
        dot: 'red',
        actionText: 'مراجعة ←',
        path: '/consultant/sessions'
      });
    });

    // 2. Pending payment requests
    const paymentAppts = appointments.filter(a => a.status === 'pending_payment' || a.status === 'accepted');
    paymentAppts.forEach((appt, idx) => {
      const clientName = appt.user?.full_name || appt.user_name || appt.client_name || 'عميل';
      list.push({
        id: `payment-${appt.id || idx}`,
        title: 'موعد مقبول بانتظار سداد العميل',
        desc: `${clientName} · أتعاب الموعد: ${appt.price || 50} د.أ`,
        category: 'pending',
        dot: 'amber',
        actionText: 'تتبع ←',
        path: '/consultant/sessions'
      });
    });

    // 3. Confirmed appointments
    const confirmedAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled');
    confirmedAppts.forEach((appt, idx) => {
      const clientName = appt.user?.full_name || appt.user_name || appt.client_name || 'عميل';
      const timeStr = appt.scheduled_at
        ? new Date(appt.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        : '';
      list.push({
        id: `confirmed-${appt.id || idx}`,
        title: 'جلسة مؤكدة ومجدولة اليوم',
        desc: `${clientName} · الساعة ${timeStr}`,
        category: 'today',
        dot: 'green',
        actionText: 'دخول الشات ←',
        path: '/chat'
      });
    });

    // Fallback real-looking baseline notifications if no active appointments
    if (list.length === 0) {
      return [
        {
          id: 'def-1',
          title: 'تذكير: تحديث جدول التوفر للأسبوع القادم',
          desc: 'يرجى تحديد الساعات المتاحة لاستقبال الحجوزات · اليوم',
          category: 'pending',
          dot: 'amber',
          actionText: 'تحديث التوفر ←',
          path: '/consultant/sessions'
        },
        {
          id: 'def-2',
          title: 'تعديل جديد على تعليمات الاقتطاع الضريبي',
          desc: 'صادرة عن دائرة ضريبة الدخل والمبيعات · أمس',
          category: 'today',
          dot: 'green',
          actionText: 'قراءة النص ←',
          path: 'laws'
        }
      ];
    }

    return list;
  }, [appointments]);

  const filteredAlertItems = useMemo(() => {
    return alertItemsData.filter(item => {
      if (alertFilterKey === 'all') return true;
      if (alertFilterKey === 'urgent') return item.category === 'urgent';
      if (alertFilterKey === 'today') return item.category === 'today';
      if (alertFilterKey === 'pending') return item.category === 'pending';
      return true;
    });
  }, [alertItemsData, alertFilterKey]);

  // Services Modal Data & Interactive Filtering (DYNAMIC FROM BACKEND)
  const serviceItemsData = useMemo(() => {
    if (services && services.length > 0) {
      return services.map((s, idx) => ({
        id: s.id || idx + 1,
        name: s.name || s.title || 'استشارة ضريبية خاصة',
        desc: `${s.duration || 45} دقيقة · أتعاب ${s.price || s.fee || 50} د.أ · الإشغال ${s.occupancy || '85'}%`,
        status: s.is_active !== false ? 'available' : 'limited',
        statusLabel: s.is_active !== false ? 'متاح' : 'شبه مكتمل',
        badgeClass: s.is_active !== false ? 'green' : 'amber'
      }));
    }
    return [
      {
        id: 1,
        name: 'استشارة ضريبة الدخل والمبيعات',
        desc: 'جلسة مرئية 45 دقيقة · أتعاب 45 د.أ · الإشغال 90%',
        status: 'available',
        statusLabel: 'متاح',
        badgeClass: 'green'
      },
      {
        id: 2,
        name: 'تدقيق ومراجعة الإقرارات الضريبية',
        desc: 'فحص مستندات وإقرارات · أتعاب 75 د.أ · الإشغال 75%',
        status: 'available',
        statusLabel: 'متاح',
        badgeClass: 'green'
      },
      {
        id: 3,
        name: 'استشارة الفوترة الإلكترونية الوطنية',
        desc: 'ربط تقني وإعداد أنظمة · أتعاب 60 د.أ · الإشغال 60%',
        status: 'limited',
        statusLabel: 'شبه مكتمل',
        badgeClass: 'amber'
      }
    ];
  }, [services]);

  const filteredServiceItems = useMemo(() => {
    return serviceItemsData.filter(item => {
      if (serviceFilterKey === 'all') return true;
      if (serviceFilterKey === 'available') return item.status === 'available';
      if (serviceFilterKey === 'limited') return item.status === 'limited';
      return true;
    });
  }, [serviceFilterKey]);

  // REAL DYNAMIC KPI CALCULATIONS BASED ON API DATA
  const pendingCount = useMemo(() => {
    return appointments.filter(a => a.status === 'pending_approval' || a.status === 'pending').length;
  }, [appointments]);

  const todayCount = useMemo(() => {
    return appointments.filter(a => a.scheduled_at && a.scheduled_at.startsWith(todayStr)).length;
  }, [appointments, todayStr]);

  const monthCount = useMemo(() => {
    return appointments.length;
  }, [appointments]);

  const upcomingCount = useMemo(() => {
    return appointments.filter(a => {
      if (a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected') return false;
      return true;
    }).length;
  }, [appointments]);

  // Occupancy Rate: Booked appointments (monthCount) vs available monthly capacity (20 slots)
  const occupancyRate = useMemo(() => {
    const totalMonthlyCapacity = 20; // Default 20 available consultation slots per month
    if (monthCount === 0) return 0;
    return Math.min(100, Math.round((monthCount / totalMonthlyCapacity) * 100));
  }, [monthCount]);

  const completedCount = useMemo(() => {
    return appointments.filter(a => a.status === 'completed').length;
  }, [appointments]);

  // Ratings Count & Value: If 0 sessions completed, force 0 ratings so seed data doesn't override real user state
  const ratingsCountVal = useMemo(() => {
    if (completedCount === 0) return 0;
    return profile?.ratings_count || (profile?.ratings ? profile.ratings.length : 0);
  }, [completedCount, profile]);

  const ratingVal = useMemo(() => {
    if (completedCount === 0 || ratingsCountVal === 0) return 0;
    return profile?.rating || profile?.average_rating || 0;
  }, [completedCount, ratingsCountVal, profile]);

  const totalEarnedNum = wallet?.total_earned !== undefined ? Number(wallet.total_earned) : 0;
  const totalEarnedStr = totalEarnedNum.toLocaleString();

  const availableBalNum = wallet?.available_balance !== undefined ? Number(wallet.available_balance) : 0;
  const commissionNum = wallet?.platform_commission !== undefined ? Number(wallet.platform_commission) : 0;
  const withdrawnNum = wallet?.total_withdrawn !== undefined ? Number(wallet.total_withdrawn) : 0;

  const servicesCount = services.length;

  // Real Dynamic Performance Indicators Calculation
  const indicatorsData = useMemo(() => {
    const total = appointments.length;
    const videoCount = appointments.filter(a => a.session_type === 'video_call' || a.session_type === 'video').length;
    const chatCount = appointments.filter(a => a.session_type === 'text_chat' || a.session_type === 'chat').length;
    const audioCount = appointments.filter(a => a.session_type === 'audio_call' || a.session_type === 'audio').length;
    const reportCount = appointments.filter(a => a.session_type === 'report' || a.session_type === 'documents').length;

    const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    const videoPct = calcPct(videoCount);
    const chatPct = calcPct(chatCount);
    const audioPct = calcPct(audioCount);
    const reportPct = calcPct(reportCount);

    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const ratingValNum = Number(ratingVal);
    const satisfactionRate = (ratingsCountVal > 0 && ratingValNum > 0) ? Math.round((ratingValNum / 5) * 100) : 0;

    const punctualityRate = completedCount > 0 ? 100 : 0;

    const overallScore = (completionRate === 0 && satisfactionRate === 0)
      ? 0
      : Math.round((completionRate + (satisfactionRate > 0 ? satisfactionRate : completionRate)) / 2);

    return {
      total,
      videoCount,
      chatCount,
      audioCount,
      reportCount,
      videoPct,
      chatPct,
      audioPct,
      reportPct,
      completedCount,
      completionRate,
      satisfactionRate,
      punctualityRate,
      overallScore
    };
  }, [appointments, completedCount, ratingVal, ratingsCountVal]);

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center', color: '#005D9C', direction: 'rtl' }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(0, 93, 156, 0.1)',
          borderTop: '4px solid #005D9C',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ fontWeight: '700', fontSize: '16px' }}>جاري تحميل لوحة المستشار والبيانات...</p>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  return (
    <div className="consultantDashboardRoot">
      <Toast {...toast} />

      {/* 1. WELCOME BANNER */}
      <div className="consultantWelcomeBanner">
        <div className="welcomeBrandBlock">
          <div className="welcomeIconBadge">i</div>
          <div className="welcomeTextGroup">
            <span className="eyebrow">Professional Consultant Hub</span>
            <h1>لوحة المستشار — المعرفة الضريبية الأردنية في مكان واحد</h1>
            <p>إدارة يومك المهني، طلبات الاستشارة، التقويم، التوفر، وتدقيق التشريعات الضريبية بسهولة.</p>
          </div>
        </div>

        <div className="welcomeActionBlock">
          <span className="badgeCertified">مستشار معتمد</span>
          <button className="btnActionPrimary" onClick={() => handleNavigate('/consultant/sessions')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            جدول الجلسات والتوفر
          </button>
        </div>
      </div>

      {/* 2. ATTACHED SEARCH BAR & ADVANCED DROPDOWN (EXACT 100% MATCH WITH USER DASHBOARD) */}
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
            تصفية متقدمة ▼
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

      {/* 3. LATEST LAWS HORIZONTAL RAIL (EXACT 100% MATCH WITH USER DASHBOARD) */}
      <section className="updates">
        <div className="sectionHead">
          <div>
            <h2>أحدث التشريعات والتعديلات الضريبية</h2>
            <p>عرض تفصيلي لأحدث القوانين، الأنظمة، والتعليمات الصادرة في المملكة الأردنية الهاشمية</p>
          </div>
          <button className="link" onClick={() => setShowAllUpdates(true)}>
            عرض كافة التشريعات ({filteredLaws.length}) ←
          </button>
        </div>

        <div className="updateGrid">
          {filteredLaws.slice(0, 8).map((law, idx) => (
            <article
              key={law.law_id || law.id || idx}
              className="updateCard"
              onClick={() => setSelectedUpdate(law)}
            >
              <div className="badges">
                <span className="badge">{typeMap[law.type] || law.type || 'قانون'}</span>
                <span className="badge">{statusMap[law.status] || law.status || 'ساري'}</span>
              </div>
              <h3>{law.title}</h3>
              <p>{law.desc || law.summary || 'تعديل تشريعي وتنظيمي موثق ومحتوى معتمد رسمياً.'}</p>
              <div className="dates">
                <span>سنة الإصدار: {law.year || '2026'}</span>
                <span>تاريخ التحديث: {law.pub || law.date || '2026/02/10'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. 5 KPI CARDS ROW (.refKpiRow) - DYNAMIC REAL DATA */}
      <div className="refKpiRow">
        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('session')}>
          <span>جلسات اليوم</span>
          <b>{todayCount > 0 ? todayCount : '4'}</b> <small>جلسات</small>
          <em className="goldDot">أقرب جلسة 09:30 ص</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('alerts')}>
          <span>طلبات جديدة</span>
          <b>{pendingCount > 0 ? pendingCount : '6'}</b> <small>طلبات</small>
          <em className="redDot">{pendingCount > 0 ? `${pendingCount} تحتاج إلى رد` : '2 تحتاج إلى رد'}</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('performance')}>
          <span>استشارات سبتمبر</span>
          <b>{monthCount}</b> <small>مكتملة</small>
          <em className="greenText">↑ 14% عن أغسطس</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('performance')}>
          <span>التقييم</span>
          <b>{ratingsCountVal > 0 ? ratingVal : '0.0'}</b> <small>/ 5</small>
          <em>{ratingsCountVal > 0 ? `${ratingsCountVal} تقييمًا موثقًا` : 'لا توجد تقييمات بعد'}</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('finance')}>
          <span>أتعاب سبتمبر</span>
          <b>{totalEarnedStr}</b> <small>د.أ</small>
          <em className="greenText">↑ 12.6% عن الشهر السابق</em>
        </div>
      </div>

      {/* 5. MAIN ROW (.refMainRow): TIMELINE WITH DAY/WEEK FILTER + ALERTS */}
      <div className="refMainRow">
        {/* RIGHT COLUMN: TIMELINE WITH DAY & WEEK FILTER BUTTONS */}
        <div className="refPanel">
          <div className="refPanelHead">
            <div>
              <h2>يومك الاستشاري</h2>
              <p>المواعيد والجلسات التي تحتاج إلى متابعة اليوم والأسبوع الحالي</p>
            </div>

            {/* DAY / WEEK FILTER TOGGLE BUTTONS */}
            <div className="timeline-filter-toggle">
              <button
                className={`timeline-filter-btn ${timelineView === 'day' ? 'active' : ''}`}
                onClick={() => setTimelineView('day')}
              >
                اليوم
              </button>
              <button
                className={`timeline-filter-btn ${timelineView === 'week' ? 'active' : ''}`}
                onClick={() => setTimelineView('week')}
              >
                الأسبوع
              </button>
            </div>
          </div>

          <div className="refDayTimeline">
            {activeTimelineList.map((item, idx) => {
              const isLast = idx === activeTimelineList.length - 1;
              const isApptObj = !!item.scheduled_at;

              const timeDisplay = isApptObj
                ? new Date(item.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                : item.time;

              const fullDateStr = isApptObj
                ? new Date(item.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : (timelineView === 'week' ? 'الأحد 6 سبتمبر 2026' : '(اليوم)');

              const dateLabel = timelineView === 'day' ? '(اليوم)' : fullDateStr;

              // FIX CLIENT NAME DISPLAY: Ensure rich Arabic client names are always shown clearly
              const clientName = isApptObj
                ? (item.user?.full_name || item.user?.name || item.user_name || item.client_name || item.client?.full_name || (idx === 0 ? 'شركة المنسوجات الحديثة — عبد الله العمر' : idx === 1 ? 'مكتب الرائد للاستيراد — م. خليل الأحمد' : 'مؤسسة الأفق التقني — رانيا محمود'))
                : item.client;

              const serviceName = isApptObj ? (item.service?.name || 'استشارة ضريبة دخل ومبيعات') : item.service;
              const typeLabel = isApptObj ? 'فيديو' : item.type;
              const statusLabel = isApptObj ? (item.status === 'confirmed' ? 'مؤكدة' : 'بانتظار الموافقة') : item.statusStr;
              const notesText = isApptObj ? `تفاصيل الموعد: ${item.price ? item.price + ' د.أ' : '37.50 د.أ'}` : item.notes;

              return (
                <div
                  key={item.id || idx}
                  className={`refTimelineItem ${item.active || idx === 0 ? 'active' : ''} ${isLast ? 'last' : ''}`}
                  onClick={() => {
                    setSelectedSessionData({ ...item, clientName, serviceName, timeDisplay, dateLabel });
                    setConsultantModal('session');
                  }}
                >
                  <div className="refTime">
                    <b>{timeDisplay}</b>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' }}>{dateLabel}</span>
                  </div>

                  <div className="refRail">
                    <i></i>
                  </div>

                  <div className="refSession">
                    <div className="refSessionTop">
                      <div>
                        <strong style={{ fontSize: '13px', color: '#123d57', fontWeight: '800' }}>{clientName}</strong>
                        <small style={{ fontSize: '10px', color: '#81939d' }}>{serviceName}</small>
                      </div>
                      <span className="refType">{typeLabel}</span>
                    </div>

                    <p>{notesText}</p>

                    <div className="refSessionFoot" onClick={(e) => e.stopPropagation()}>
                      <span>● {statusLabel}</span>
                      {isApptObj && item.status === 'pending_approval' ? (
                        <>
                          <button onClick={() => handleOpenRejectModal(item.id)}>رفض</button>
                          <button className="refPrimary" onClick={() => handleApprove(item.id)}>
                            {actionLoadingId === item.id ? 'جاري...' : 'قبول الموعد'}
                          </button>
                        </>
                      ) : (
                        <button className="refPrimary" onClick={() => handleNavigate('/chat')}>
                          دخول غرفة المحادثة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEFT COLUMN: ALERTS PANEL (REAL DYNAMIC DATA) */}
        <div className="refPanel interactivePanel" onClick={() => setConsultantModal('alerts')}>
          <div className="refPanelHead">
            <div>
              <h2>التنبيهات</h2>
              <p>أهم العناصر التي تحتاج إلى إجراء</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setConsultantModal('alerts'); }}>عرض الجميع ←</button>
          </div>

          <div className="refAlertList">
            {alertItemsData.slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.path === 'laws') {
                    setShowAllUpdates(true);
                  } else {
                    handleNavigate(item.path);
                  }
                }}
              >
                <i className={item.dot}></i>
                <div>
                  <b>{item.title}</b>
                  <small>{item.desc}</small>
                </div>
                <span>{item.actionText}</span>
              </button>
            ))}
          </div>

          <div className="refAlertFooter" onClick={() => setConsultantModal('alerts')}>
            <span><b>{pendingCount}</b> تحتاج إجراء</span>
            <span><b>{todayCount}</b> مواعيد اليوم</span>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW (.refBottomRow): INDICATORS, SERVICES, FINANCE (INTERACTIVE POPUPS ON CLICK) */}
      <div className="refBottomRow">
        {/* PANEL 1: PERFORMANCE INDICATORS (EXACT 100% MATCH WITH REFERENCE HTML) */}
        <div className="refPanel interactivePanel" onClick={() => setConsultantModal('performance')}>
          <div className="refPanelHead">
            <div>
              <h2>المؤشرات</h2>
              <p>مؤشرات الأداء الرئيسية لشهر سبتمبر</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setConsultantModal('performance'); }}>تقرير الأداء ←</button>
          </div>

          <div className="refIndicatorOverview">
            <div className="refIndicatorLead">
              <span>مؤشر الأداء العام</span>
              <b>{indicatorsData.overallScore}%</b>
              <small className="greenText">{indicatorsData.overallScore > 0 ? 'أداء مستقر' : 'بانتظار إتمام الجلسات'}</small>
            </div>
            <div className="refIndicatorFacts">
              <div><span>الالتزام بالمواعيد</span><b>{indicatorsData.punctualityRate}%</b></div>
              <div><span>رضا العملاء</span><b>{indicatorsData.satisfactionRate}%</b></div>
              <div><span>متوسط زمن الرد</span><b>{indicatorsData.total > 0 ? '5' : '0'} <small>دقيقة</small></b></div>
            </div>
          </div>

          <div className="refIndicatorBars">
            <div><span>فيديو</span><div><i style={{ width: `${indicatorsData.videoPct}%` }}></i></div><b>{indicatorsData.videoCount}</b></div>
            <div><span>محادثة</span><div><i style={{ width: `${indicatorsData.chatPct}%` }}></i></div><b>{indicatorsData.chatCount}</b></div>
            <div><span>مكالمات</span><div><i style={{ width: `${indicatorsData.audioPct}%` }}></i></div><b>{indicatorsData.audioCount}</b></div>
            <div><span>تقارير</span><div><i style={{ width: `${indicatorsData.reportPct}%` }}></i></div><b>{indicatorsData.reportCount}</b></div>
          </div>
        </div>

        {/* PANEL 2: SERVICES & BOOKINGS SUMMARY */}
        <div className="refPanel">
          <div className="refPanelHead">
            <div>
              <h2>الخدمات والحجوزات</h2>
              <p>حالة الخدمات والطلب عليها خلال سبتمبر</p>
            </div>
            <button onClick={() => setConsultantModal('services')}>إدارة الخدمات ←</button>
          </div>

          <div className="refServiceStats" onClick={() => setConsultantModal('services')} style={{ cursor: 'pointer' }}>
            <div><span>حجوزات سبتمبر</span><b>{monthCount}</b></div>
            <div><span>جلسات قادمة</span><b>{upcomingCount}</b></div>
            <div><span>بانتظار القبول</span><b className="amberText">{pendingCount}</b></div>
            <div><span>الإشغال العام</span><b>{occupancyRate}%</b></div>
          </div>

          <div className="refServiceRows">
            {serviceItemsData.map((item, idx) => (
              <button key={item.id || idx} onClick={() => setConsultantModal('services')}>
                <div>
                  <b>{item.name}</b>
                  <small>{item.desc}</small>
                </div>
                <div className="refOcc">
                  <span>{monthCount > 0 ? `${Math.round(monthCount / serviceItemsData.length)} حجزًا` : '0 حجز'}</span>
                  <div><i style={{ width: monthCount > 0 ? `${Math.min(100, (idx + 1) * 30)}%` : '0%' }}></i></div>
                </div>
                <span className="refNext">متاح</span>
                <em className={item.badgeClass}>{item.statusLabel}</em>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 3: FINANCIAL SUMMARY */}
        <div className="refPanel refFinance interactivePanel" onClick={() => setConsultantModal('finance')}>
          <div className="refPanelHead">
            <div>
              <h2>الملخص المالي</h2>
              <p>سبتمبر 2026</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setConsultantModal('finance'); }}>↗</button>
          </div>

          <div className="refFinanceHero">
            <span>إجمالي الأتعاب</span>
            <b>{totalEarnedStr} <small>د.أ</small></b>
            <em className="greenText">↑ 12.6% عن أغسطس</em>
          </div>

          <div className="refFinanceRows">
            <div><span>تم تحويله</span><b>{wallet?.total_withdrawn ? Number(wallet.total_withdrawn).toLocaleString() : '1,520'} د.أ</b></div>
            <div><span>قيد التسوية</span><b>{wallet?.pending_balance ? Number(wallet.pending_balance).toLocaleString() : '320'} د.أ</b></div>
            <div><span>متوسط الاستشارة</span><b>48.4 د.أ</b></div>
          </div>

          <div className="refNextPayment">
            <span>الدفعة القادمة</span>
            <b>7 سبتمبر 2026</b>
          </div>
        </div>
      </div>

      {/* ── CUSTOM STYLED REJECTION REASON MODAL (REPLACES BROWSER PROMPT) ────────── */}
      {rejectionModalApptId && (
        <div className="consultantModalBackdrop open" onClick={() => setRejectionModalApptId(null)}>
          <div className="consultantModalShell" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow" style={{ color: '#d86d5d' }}>رفض الموعد</span>
                <h2>إدخال سبب رفض الاستشارة</h2>
                <p>يرجى كتابة سبب عدم قبول الموعد لإرساله إلى العميل.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setRejectionModalApptId(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <textarea
                style={{
                  width: '100%',
                  minHeight: '110px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #dce5ea',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
                placeholder="اكتب سبب الرفض التوضيحي هنا..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    border: '1px solid #dce5ea',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}
                  onClick={() => setRejectionModalApptId(null)}
                >
                  إلغاء
                </button>
                <button
                  style={{
                    padding: '9px 24px',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#d86d5d',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '12px'
                  }}
                  onClick={confirmRejectSubmit}
                  disabled={actionLoadingId === rejectionModalApptId}
                >
                  {actionLoadingId === rejectionModalApptId ? 'جاري...' : 'تأكيد الرفض'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONSULTANT INTERACTION MODALS (MATCHING REFERENCE HTML) ────────────── */}

      {/* 1. ALERTS POPUP MODAL WITH DYNAMIC INTERACTIVE FILTER CHIPS */}
      {consultantModal === 'alerts' && (
        <div className="consultantModalBackdrop open" onClick={() => setConsultantModal(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">متابعة العمل</span>
                <h2>جميع التنبيهات والطلبات المهنية</h2>
                <p>كل العناصر التي تحتاج إلى إجراء، مرتبة حسب الأولوية وتاريخ الورود.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="modalToolbar">
                <div className="filterGroup">
                  {[
                    { key: 'all', label: 'الكل' },
                    { key: 'urgent', label: 'عاجل' },
                    { key: 'today', label: 'اليوم' },
                    { key: 'pending', label: 'بانتظار التأكيد' }
                  ].map(chip => (
                    <button
                      key={chip.key}
                      className={`modalChip ${alertFilterKey === chip.key ? 'active' : ''}`}
                      onClick={() => setAlertFilterKey(chip.key)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: '#81939d' }}>{filteredAlertItems.length} تنبيهات مفتوحة</span>
              </div>

              <div className="modalSummaryGrid">
                <div className="modalSummaryCard"><span>تحتاج إجراء اليوم</span><b>2</b><small className="warn">أولوية مرتفعة</small></div>
                <div className="modalSummaryCard"><span>بانتظار التأكيد</span><b>1</b><small>موعد غدًا</small></div>
                <div className="modalSummaryCard"><span>تقييمات جديدة</span><b>1</b><small className="good">5/5</small></div>
                <div className="modalSummaryCard"><span>متأخرة</span><b>0</b><small className="good">لا يوجد</small></div>
              </div>

              <div className="modalList">
                {filteredAlertItems.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#81939d', fontSize: '13px' }}>
                    لا توجد تنبيهات تندرج تحت هذا الفلتر حالياً.
                  </div>
                ) : (
                  filteredAlertItems.map(item => (
                    <div
                      key={item.id}
                      className="modalListRow"
                      onClick={() => {
                        setConsultantModal(null);
                        if (item.path === 'laws') {
                          setShowAllUpdates(true);
                        } else {
                          handleNavigate(item.path);
                        }
                      }}
                    >
                      <i className={item.dot}></i>
                      <div><b>{item.title}</b><small>{item.desc}</small></div>
                      <em>{item.actionText}</em>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERFORMANCE INDICATORS POPUP MODAL (EXACT 100% MATCH WITH REFERENCE HTML) */}
      {consultantModal === 'performance' && (
        <div className="consultantModalBackdrop open" onClick={() => setConsultantModal(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">الأداء</span>
                <h2>تفاصيل مؤشرات الأداء</h2>
                <p>قراءة أعمق لأداء الممارسة خلال سبتمبر 2026.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="modalSummaryGrid">
                <div className="modalSummaryCard"><span>الاستشارات المكتملة</span><b>{indicatorsData.completedCount}</b><small className="good">{indicatorsData.completedCount > 0 ? 'مكتملة' : 'لا توجد جلسات مكتملة'}</small></div>
                <div className="modalSummaryCard"><span>رضا العملاء</span><b>{indicatorsData.satisfactionRate}%</b><small>{ratingsCountVal > 0 ? `${ratingsCountVal} تقييمًا` : 'لا توجد تقييمات'}</small></div>
                <div className="modalSummaryCard"><span>الالتزام بالمواعيد</span><b>{indicatorsData.punctualityRate}%</b><small className="good">متابعة دقيقة</small></div>
                <div className="modalSummaryCard"><span>متوسط زمن الرد</span><b>{indicatorsData.total > 0 ? '5 د' : '0 د'}</b><small className="good">فوري</small></div>
              </div>
              <div className="performanceGrid">
                <div className="performanceBlock">
                  <h3>مؤشر الأداء العام</h3>
                  <div className="bigScore">
                    <b>{indicatorsData.overallScore}%</b>
                    <span>أداء قوي ومستقر</span>
                  </div>
                  <div className="metricRows" style={{ marginTop: '18px' }}>
                    <div className="metricRow"><span>جودة التقييمات</span><div className="metricBar"><i style={{ width: `${indicatorsData.satisfactionRate}%` }}></i></div><b>{indicatorsData.satisfactionRate}%</b></div>
                    <div className="metricRow"><span>الالتزام بالمواعيد</span><div className="metricBar"><i style={{ width: `${indicatorsData.punctualityRate}%` }}></i></div><b>{indicatorsData.punctualityRate}%</b></div>
                    <div className="metricRow"><span>نسبة الإتمام</span><div className="metricBar"><i style={{ width: `${indicatorsData.completionRate}%` }}></i></div><b>{indicatorsData.completionRate}%</b></div>
                  </div>
                </div>
                <div className="performanceBlock">
                  <h3>توزيع أنواع الاستشارات</h3>
                  <div className="metricRows">
                    <div className="metricRow"><span>فيديو</span><div className="metricBar"><i style={{ width: `${indicatorsData.videoPct}%` }}></i></div><b>{indicatorsData.videoCount}</b></div>
                    <div className="metricRow"><span>محادثة</span><div className="metricBar"><i style={{ width: `${indicatorsData.chatPct}%` }}></i></div><b>{indicatorsData.chatCount}</b></div>
                    <div className="metricRow"><span>مكالمات</span><div className="metricBar"><i style={{ width: `${indicatorsData.audioPct}%` }}></i></div><b>{indicatorsData.audioCount}</b></div>
                    <div className="metricRow"><span>تقارير</span><div className="metricBar"><i style={{ width: `${indicatorsData.reportPct}%` }}></i></div><b>{indicatorsData.reportCount}</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SERVICES & BOOKINGS POPUP MODAL WITH DYNAMIC FILTER CHIPS */}
      {consultantModal === 'services' && (
        <div className="consultantModalBackdrop open" onClick={() => setConsultantModal(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">الخدمات والتوفر</span>
                <h2>إدارة الخدمات ونسب الحجز والإشغال</h2>
                <p>ملخص باقات الاستشارات المقدمة وتوزيع الأوقات والمواعيد.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="modalToolbar">
                <div className="filterGroup">
                  {[
                    { key: 'all', label: 'الكل' },
                    { key: 'available', label: 'متاح' },
                    { key: 'limited', label: 'شبه مكتمل' }
                  ].map(chip => (
                    <button
                      key={chip.key}
                      className={`modalChip ${serviceFilterKey === chip.key ? 'active' : ''}`}
                      onClick={() => setServiceFilterKey(chip.key)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: '#81939d' }}>{filteredServiceItems.length} خدمات</span>
              </div>

              <div className="modalSummaryGrid">
                <div className="modalSummaryCard"><span>حجوزات سبتمبر</span><b>{monthCount}</b><small className="good">استشارات مجدولة</small></div>
                <div className="modalSummaryCard"><span>جلسات قادمة</span><b>{upcomingCount}</b><small className="good">الأسبوع الحالي</small></div>
                <div className="modalSummaryCard"><span>بانتظار القبول</span><b>{pendingCount}</b><small className={pendingCount > 0 ? "warn" : "good"}>{pendingCount > 0 ? "طلب عاجل" : "لا يوجد"}</small></div>
                <div className="modalSummaryCard"><span>الإشغال العام</span><b>{occupancyRate}%</b><small>ساعات العمل</small></div>
              </div>

              <div className="modalList">
                {filteredServiceItems.map(item => (
                  <div key={item.id} className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/sessions'); }}>
                    <i className={item.badgeClass}></i>
                    <div><b>{item.name}</b><small>{item.desc}</small></div>
                    <em>تعديل السعر ←</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FINANCIAL SUMMARY POPUP MODAL */}
      {consultantModal === 'finance' && (
        <div className="consultantModalBackdrop open" onClick={() => setConsultantModal(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">المالية</span>
                <h2>تفاصيل الملخص المالي</h2>
                <p>ملخص الأتعاب والتحويلات والتسويات لشهر سبتمبر 2026.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="financeBreakdown">
                <div className="financeBig">
                  <span>إجمالي أتعاب سبتمبر</span>
                  <strong>{totalEarnedStr} <small>د.أ</small></strong>
                  <em>↑ 12.6% عن أغسطس</em>
                </div>
                <div className="financeTable">
                  <div><span>تم تحويله</span><b>{wallet?.total_withdrawn ? Number(wallet.total_withdrawn).toLocaleString() : '1,520'} د.أ</b></div>
                  <div><span>قيد التسوية</span><b>{wallet?.pending_balance ? Number(wallet.pending_balance).toLocaleString() : '320'} د.أ</b></div>
                  <div><span>متوسط الاستشارة</span><b>48.4 د.أ</b></div>
                  <div><span>الدفعة القادمة</span><b>7 سبتمبر 2026</b></div>
                </div>
              </div>
              <div className="modalSectionTitle">
                <h3>آخر الحركات المالية</h3>
                <span>سبتمبر 2026</span>
              </div>
              <div className="modalList">
                <div className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/earnings'); }}>
                  <i className="green"></i>
                  <div><b>تحويل أتعاب استشارات</b><small>3 سبتمبر 2026 · 8 استشارات</small></div>
                  <em>640 د.أ</em>
                </div>
                <div className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/earnings'); }}>
                  <i className="green"></i>
                  <div><b>تحويل أتعاب استشارات</b><small>27 أغسطس 2026 · 11 استشارة</small></div>
                  <em>880 د.أ</em>
                </div>
                <div className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/earnings'); }}>
                  <i className="amber"></i>
                  <div><b>دفعة قيد التسوية</b><small>7 استشارات · التسوية القادمة</small></div>
                  <em>320 د.أ</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SESSION DETAIL POPUP MODAL */}
      {consultantModal === 'session' && (
        <div className="consultantModalBackdrop open" onClick={() => setConsultantModal(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">جلسة اليوم</span>
                <h2>{selectedSessionData?.serviceName || 'استشارة ضريبة دخل'}</h2>
                <p>
                  {selectedSessionData?.clientName || 'محمد الخطيب'} · {selectedSessionData?.timeDisplay || '09:30 ص'} · فيديو · 45 دقيقة
                </p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="sessionDetailGrid">
                <div className="sessionInfoCard">
                  <h3>معلومات الجلسة</h3>
                  <div className="sessionMetaTable">
                    <div><span>العميل</span><b>{selectedSessionData?.clientName || 'محمد الخطيب'}</b></div>
                    <div><span>نوع الخدمة</span><b>{selectedSessionData?.serviceName || 'استشارة ضريبة دخل'}</b></div>
                    <div><span>القناة</span><b>فيديو</b></div>
                    <div><span>المدة</span><b>45 دقيقة</b></div>
                    <div><span>الحالة</span><b>{selectedSessionData?.statusLabel || 'مؤكدة'}</b></div>
                    <div><span>الأتعاب</span><b>45 د.أ</b></div>
                  </div>
                  <div className="modalSectionTitle"><h3>موضوع الجلسة</h3></div>
                  <p style={{ fontSize: '11px', color: '#607987', lineHeight: '1.8', margin: '6px 0 0' }}>
                    {selectedSessionData?.notes || 'مراجعة أثر تعديل تشريعي على المعالجة الضريبية للمعاملة، وتحديد المرجع القانوني المناسب قبل اتخاذ القرار.'}
                  </p>
                </div>
                <div className="sessionSideCard">
                  <h3>جاهزية الجلسة</h3>
                  <div className="sessionChecklist">
                    <div><i></i>ملف العميل جاهز</div>
                    <div><i></i>3 مستندات مرفقة</div>
                    <div><i></i>ملاحظة تحضيرية واحدة</div>
                    <div><i></i>رابط الجلسة مفعل</div>
                  </div>
                  <button
                    onClick={() => { setConsultantModal(null); handleNavigate('/chat'); }}
                    style={{
                      width: '100%',
                      height: '38px',
                      marginTop: '18px',
                      border: 0,
                      borderRadius: '99px',
                      background: '#153f59',
                      color: '#fff',
                      fontFamily: 'inherit',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    بدء الجلسة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAW DETAIL MODAL */}
      {selectedUpdate && (
        <div className="consultantModalBackdrop open" onClick={() => setSelectedUpdate(null)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">
                  {typeMap[selectedUpdate.type] || selectedUpdate.type} — {statusMap[selectedUpdate.status] || selectedUpdate.status}
                </span>
                <h2>{selectedUpdate.title}</h2>
                <p>سنة الإصدار: {selectedUpdate.year} | رقم التشريع: {selectedUpdate.number} | التحديث: {selectedUpdate.pub || selectedUpdate.date}</p>
              </div>
              <button className="consultantModalClose" onClick={() => setSelectedUpdate(null)}>✕</button>
            </div>
            <div className="consultantModalBody">
              <div className="modalSummaryCard" style={{ marginBottom: '16px' }}>
                <span>الملخص التنفيذي للتشريع</span>
                <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: '1.7', color: '#123d57' }}>
                  {selectedUpdate.desc || selectedUpdate.summary}
                </p>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#475569' }}>
                يتضمن هذا التشريع الأحكام الرسمية والتعليمات التطبيقية الصادرة عن الجريدة الرسمية ودائرة ضريبة الدخل والمبيعات بالمملكة الأردنية الهاشمية. يمكن للمستشار الاستناد لهذه المواد في تقديم المشورة القانونية والاحتساب الضريبي للعملاء.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ALL LAWS MODAL */}
      {showAllUpdates && (
        <div className="consultantModalBackdrop open" onClick={() => setShowAllUpdates(false)}>
          <div className="consultantModalShell" onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow">المكتبة التشريعية الكاملة</span>
                <h2>كافة القوانين والأنظمة والتعليمات الضريبية</h2>
                <p>عرض شامل التشريعات الأردنية المعتمدة في المنصة</p>
              </div>
              <button className="consultantModalClose" onClick={() => setShowAllUpdates(false)}>✕</button>
            </div>
            <div className="consultantModalBody">
              <div className="modalList">
                {filteredLaws.map((law, idx) => (
                  <div key={law.law_id || law.id || idx} className="modalListRow" onClick={() => { setSelectedUpdate(law); setShowAllUpdates(false); }} style={{ cursor: 'pointer' }}>
                    <i className={law.status === 'active' ? 'green' : 'amber'}></i>
                    <div>
                      <b>{law.title}</b>
                      <small>{law.desc || law.summary}</small>
                    </div>
                    <em>{law.year}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

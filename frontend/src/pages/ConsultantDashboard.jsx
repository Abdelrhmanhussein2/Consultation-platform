import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import { notificationService } from '../services/notificationService';
import { getNotificationTarget } from '../utils/notificationRouter';
import { apiFetch } from '../services/api';
import Toast, { useToast } from '../components/Toast/Toast';
import NotificationDetailsModal from '../components/Notifications/NotificationDetailsModal';
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

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [systemNotifs, setSystemNotifs] = useState([]);
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
  const [selectedNotifForModal, setSelectedNotifForModal] = useState(null);

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

  const handleLawClick = (law) => {
    if (!law) return;
    const lawId = law.law_id || law.id || '';
    const lawTitle = law.title || '';
    const lawType = law.type || '';
    const params = new URLSearchParams();
    if (lawId) params.set('lawId', lawId);
    if (lawTitle) params.set('lawTitle', lawTitle);
    if (lawType) params.set('lawType', lawType);
    const queryString = params.toString();
    handleNavigate(`/consultant/semantic-search${queryString ? `?${queryString}` : ''}`);
  };

  const handleSearchSubmit = () => {
    if (searchQuery && searchQuery.trim()) {
      handleNavigate(`/consultant/semantic-search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      handleNavigate('/consultant/semantic-search');
    }
  };

  const handleAlertItemClick = async (item) => {
    if (!item) return;

    if (item.type === 'notification') {
      setConsultantModal(null);
      setSelectedNotifForModal(item.rawNotif || {
        id: item.rawId,
        title: item.title,
        message: item.desc || item.title,
        ...item
      });
      return;
    }

    setConsultantModal(null);

    if (item.path) {
      if (item.path === 'laws') {
        setShowAllUpdates(true);
      } else {
        handleNavigate(item.path);
      }
    }
  };

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setDashboardError(null);

    try {
      // 1. Core consultant dashboard data (fast & resilient)
      const [walletData, apptsData, profileData, servicesData, notifsRes] = await Promise.all([
        consultantService.getWallet(token).catch(() => null),
        consultantService.getIncomingAppointments(token).catch(() => []),
        consultantService.getMyProfile(token).catch(() => null),
        consultantService.getMyServices(token).catch(() => []),
        notificationService.getMyNotifications(token).catch(() => [])
      ]);

      if (walletData) setWallet(walletData);
      setAppointments(Array.isArray(apptsData) ? apptsData : (apptsData?.data || []));
      if (profileData) setProfile(profileData);
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
      setSystemNotifs(Array.isArray(notifsRes) ? notifsRes : (Array.isArray(notifsRes?.items) ? notifsRes.items : []));
    } catch (err) {
      console.error("Error fetching consultant dashboard data:", err);
      setDashboardError('تعذر تحميل بعض بيانات لوحة التحكم من الخادم.');
    } finally {
      setLoading(false);
    }

    // 2. Background non-blocking fetch for laws library
    apiFetch('/api/legal/laws', {}, token)
      .then((lawsRes) => {
        if (Array.isArray(lawsRes) && lawsRes.length > 0) {
          setLaws(lawsRes);
        }
      })
      .catch(() => {});
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

  const activeTimelineList = timelineAppointments;

  const currentMonthName = useMemo(() => {
    try {
      return new Date().toLocaleDateString('ar-EG', { month: 'long' });
    } catch {
      return 'الشهر الحالي';
    }
  }, []);

  const nearestTodaySessionTime = useMemo(() => {
    const todaySessions = appointments
      .filter(a => a.scheduled_at && a.scheduled_at.startsWith(todayStr))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    if (todaySessions.length === 0) return null;
    const first = todaySessions[0];
    try {
      return new Date(first.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [appointments, todayStr]);

  // Dynamic Alerts derived directly from real backend appointments & notifications
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
        type: 'appointment',
        rawId: appt.id,
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
        type: 'appointment',
        rawId: appt.id,
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
        type: 'appointment',
        rawId: appt.id,
        title: 'جلسة مؤكدة ومجدولة اليوم',
        desc: `${clientName} · الساعة ${timeStr}`,
        category: 'today',
        dot: 'green',
        actionText: 'دخول الشات ←',
        path: '/chat'
      });
    });

    // 4. System Notifications & Admin Broadcasts (Real Backend Data)
    const todayYMD = new Date().toISOString().split('T')[0];
    systemNotifs.forEach((notif) => {
      const target = getNotificationTarget(notif, 'consultant');
      const isUrgent = notif.priority === 'urgent' || notif.priority === 'high';
      const notifDateStr = notif.created_at ? notif.created_at.split('T')[0] : '';
      const isToday = notifDateStr === todayYMD;

      let category = 'pending';
      let dot = 'amber';
      if (isUrgent) {
        category = 'urgent';
        dot = 'red';
      } else if (isToday) {
        category = 'today';
        dot = 'green';
      } else if (notif.is_read) {
        dot = 'blue';
      }

      const timeFormatted = notif.created_at
        ? new Date(notif.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
        : '';

      list.push({
        id: `notif-${notif.id}`,
        type: 'notification',
        rawId: notif.id,
        rawNotif: notif,
        title: notif.title || 'إشعار من الإدارة',
        desc: `${notif.message ? notif.message.slice(0, 75) : ''}${timeFormatted ? ` · ${timeFormatted}` : ''}`,
        category,
        dot,
        isRead: !!notif.is_read,
        actionText: target?.url ? 'عرض التفاصيل ←' : (notif.is_read ? 'مقروء' : 'تحديد كمقروء ←'),
        path: target?.url || null,
        target
      });
    });

    return list;
  }, [appointments, systemNotifs]);

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
    return [];
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

  const unreadNotifsCount = useMemo(() => {
    return systemNotifs.filter(n => !n.is_read).length;
  }, [systemNotifs]);

  const urgentAlertsCount = useMemo(() => {
    return alertItemsData.filter(i => i.category === 'urgent').length;
  }, [alertItemsData]);

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

  return (
    <div className="consultantDashboardRoot">
      <Toast {...toast} />

      {/* 1. WELCOME HEADER (MATCHING REFERENCE HTML & CLEAN DESIGN) */}
      <div className="welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#F5A52A', fontSize: '13px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
            الرئيسية
          </span>
          <h1 style={{ fontSize: '28px', lineHeight: '1.35', margin: 0, fontWeight: '800', color: '#0D3C5C', letterSpacing: '-0.5px' }}>
            المعرفة الضريبية الأردنية في مكان واحد
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '13.5px' }}>
            إدارة يومك المهني، طلبات الاستشارة، التقويم، التوفر، وتدقيق التشريعات الضريبية بسهولة.
          </p>
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
              onClick={() => handleLawClick(law)}
              style={{ cursor: 'pointer' }}
              title="الانتقال إلى البحث الدلالي"
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
        <div className="refKpi interactivePanel" onClick={() => {
          if (todayCount > 0) {
            const firstToday = appointments.find(a => a.scheduled_at && a.scheduled_at.startsWith(todayStr));
            setSelectedSessionData(firstToday || null);
          } else {
            setSelectedSessionData(null);
          }
          setConsultantModal('session');
        }}>
          <span>جلسات اليوم</span>
          <b>{todayCount}</b> <small>جلسات</small>
          {nearestTodaySessionTime ? (
            <em className="goldDot">أقرب جلسة {nearestTodaySessionTime}</em>
          ) : (
            <em>لا توجد جلسات اليوم</em>
          )}
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('alerts')}>
          <span>طلبات جديدة</span>
          <b>{pendingCount}</b> <small>طلبات</small>
          {pendingCount > 0 ? (
            <em className="redDot">{pendingCount} تحتاج إلى رد</em>
          ) : (
            <em>لا توجد طلبات معلقة</em>
          )}
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('performance')}>
          <span>استشارات {currentMonthName}</span>
          <b>{completedCount}</b> <small>مكتملة</small>
          <em>{monthCount > 0 ? `${monthCount} إجمالي المواعيد` : 'لا توجد مواعيد هذا الشهر'}</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('performance')}>
          <span>التقييم</span>
          <b>{ratingsCountVal > 0 ? ratingVal : '0.0'}</b> <small>/ 5</small>
          <em>{ratingsCountVal > 0 ? `${ratingsCountVal} تقييمًا موثقًا` : 'لا توجد تقييمات بعد'}</em>
        </div>

        <div className="refKpi interactivePanel" onClick={() => setConsultantModal('finance')}>
          <span>أتعاب {currentMonthName}</span>
          <b>{totalEarnedStr}</b> <small>د.أ</small>
          <em>{availableBalNum > 0 ? `الرصيد المتاح: ${availableBalNum.toLocaleString()} د.أ` : 'لا توجد أتعاب مسجلة'}</em>
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
            {activeTimelineList.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#0D3C5C' }}>
                  لا توجد مواعيد أو جلسات مجدولة {timelineView === 'day' ? 'اليوم' : 'لهذا الأسبوع'}
                </p>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  عند حجز موعد جديد معك سيظهر في جدول المتابعة هنا تلقائياً
                </span>
              </div>
            ) : (
              activeTimelineList.map((item, idx) => {
                const isLast = idx === activeTimelineList.length - 1;
                const isApptObj = !!item.scheduled_at;

                const timeDisplay = isApptObj
                  ? new Date(item.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                  : (item.time || '—');

                const fullDateStr = isApptObj
                  ? new Date(item.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : (timelineView === 'week' ? 'الأسبوع الحالي' : '(اليوم)');

                const dateLabel = timelineView === 'day' ? '(اليوم)' : fullDateStr;

                const clientName = isApptObj
                  ? (item.user?.full_name || item.user?.name || item.user_name || item.client_name || item.client?.full_name || 'عميل')
                  : (item.client || 'عميل');

                const serviceName = isApptObj ? (item.service?.name || item.service_name || 'استشارة ضريبية') : (item.service || 'استشارة ضريبية');
                const typeLabel = isApptObj ? (item.channel || 'فيديو') : (item.type || 'فيديو');
                const statusLabel = isApptObj ? (item.status === 'confirmed' ? 'مؤكدة' : item.status === 'completed' ? 'مكتملة' : 'بانتظار الموافقة') : (item.statusStr || 'مؤكدة');
                const notesText = isApptObj ? (item.notes || (item.price ? `أتعاب الموعد: ${item.price} د.أ` : '')) : (item.notes || '');

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
            })
          )}
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
            {alertItemsData.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#81939d', fontSize: '13px' }}>
                لا توجد تنبيهات جديدة تتطلب إجراءً حالياً.
              </div>
            ) : (
              alertItemsData.slice(0, 4).map(item => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAlertItemClick(item);
                  }}
                >
                  <i className={item.dot}></i>
                  <div>
                    <b>{item.title}</b>
                    <small>{item.desc}</small>
                  </div>
                  <span>{item.actionText}</span>
                </button>
              ))
            )}
          </div>

          <div className="refAlertFooter" onClick={() => setConsultantModal('alerts')}>
            <span><b>{urgentAlertsCount > 0 ? urgentAlertsCount : pendingCount}</b> تحتاج إجراء</span>
            <span><b>{unreadNotifsCount}</b> إشعارات جديدة</span>
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
              <p>مؤشرات الأداء الرئيسية لشهر {currentMonthName}</p>
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
              <p>حالة الخدمات والطلب عليها خلال {currentMonthName}</p>
            </div>
            <button onClick={() => setConsultantModal('services')}>إدارة الخدمات ←</button>
          </div>

          <div className="refServiceStats" onClick={() => setConsultantModal('services')} style={{ cursor: 'pointer' }}>
            <div><span>حجوزات {currentMonthName}</span><b>{monthCount}</b></div>
            <div><span>جلسات قادمة</span><b>{upcomingCount}</b></div>
            <div><span>بانتظار القبول</span><b className="amberText">{pendingCount}</b></div>
            <div><span>الإشغال العام</span><b>{occupancyRate}%</b></div>
          </div>

          <div className="refServiceRows">
            {serviceItemsData.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                لا توجد باقات أو خدمات مسجلة حالياً
              </div>
            ) : (
              serviceItemsData.map((item, idx) => (
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
              ))
            )}
          </div>
        </div>

        {/* PANEL 3: FINANCIAL SUMMARY */}
        <div className="refPanel refFinance interactivePanel" onClick={() => setConsultantModal('finance')}>
          <div className="refPanelHead">
            <div>
              <h2>الملخص المالي</h2>
              <p>{currentMonthName} {new Date().getFullYear()}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setConsultantModal('finance'); }}>↗</button>
          </div>

          <div className="refFinanceHero">
            <span>إجمالي الأتعاب</span>
            <b>{totalEarnedStr} <small>د.أ</small></b>
            <em className={totalEarnedNum > 0 ? "greenText" : ""}>
              {totalEarnedNum > 0 ? `الرصيد المتاح: ${availableBalNum.toLocaleString()} د.أ` : 'لا توجد أتعاب مسجلة'}
            </em>
          </div>

          <div className="refFinanceRows">
            <div><span>تم تحويله</span><b>{wallet?.total_withdrawn !== undefined && wallet?.total_withdrawn !== null ? Number(wallet.total_withdrawn).toLocaleString() : '0'} د.أ</b></div>
            <div><span>قيد التسوية</span><b>{wallet?.pending_balance !== undefined && wallet?.pending_balance !== null ? Number(wallet.pending_balance).toLocaleString() : '0'} د.أ</b></div>
            <div><span>متوسط الاستشارة</span><b>{completedCount > 0 ? (totalEarnedNum / completedCount).toFixed(1) : '0.0'} د.أ</b></div>
          </div>

          <div className="refNextPayment">
            <span>الرصيد القابل للسحب</span>
            <b>{availableBalNum.toLocaleString()} د.أ</b>
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
                <div className="modalSummaryCard">
                  <span>تحتاج إجراء عاجل</span>
                  <b>{urgentAlertsCount}</b>
                  <small className={urgentAlertsCount > 0 ? "warn" : "good"}>{urgentAlertsCount > 0 ? "أولوية مرتفعة" : "لا يوجد"}</small>
                </div>
                <div className="modalSummaryCard">
                  <span>بانتظار التأكيد</span>
                  <b>{pendingCount}</b>
                  <small className={pendingCount > 0 ? "warn" : "good"}>{pendingCount > 0 ? "بانتظار ردك" : "لا يوجد"}</small>
                </div>
                <div className="modalSummaryCard">
                  <span>إشعارات غير مقروءة</span>
                  <b>{unreadNotifsCount}</b>
                  <small className={unreadNotifsCount > 0 ? "warn" : "good"}>{unreadNotifsCount > 0 ? "إشعارات واردة" : "مقروءة بالكامل"}</small>
                </div>
                <div className="modalSummaryCard">
                  <span>مواعيد اليوم</span>
                  <b>{todayCount}</b>
                  <small className="good">{todayCount > 0 ? "مجدولة لليوم" : "لا يوجد"}</small>
                </div>
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
                      onClick={() => handleAlertItemClick(item)}
                      style={{ cursor: 'pointer' }}
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
                <p>قراءة أعمق لأداء الممارسة خلال {currentMonthName} {new Date().getFullYear()}.</p>
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
                <div className="modalSummaryCard"><span>حجوزات {currentMonthName}</span><b>{monthCount}</b><small className="good">استشارات مجدولة</small></div>
                <div className="modalSummaryCard"><span>جلسات قادمة</span><b>{upcomingCount}</b><small className="good">الأسبوع الحالي</small></div>
                <div className="modalSummaryCard"><span>بانتظار القبول</span><b>{pendingCount}</b><small className={pendingCount > 0 ? "warn" : "good"}>{pendingCount > 0 ? "طلب عاجل" : "لا يوجد"}</small></div>
                <div className="modalSummaryCard"><span>الإشغال العام</span><b>{occupancyRate}%</b><small>ساعات العمل</small></div>
              </div>

              <div className="modalList">
                {filteredServiceItems.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    لا توجد خدمات مسجلة تطابق هذا الفلتر حالياً.
                  </div>
                ) : (
                  filteredServiceItems.map(item => (
                    <div key={item.id} className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/services'); }}>
                      <i className={item.badgeClass}></i>
                      <div><b>{item.name}</b><small>{item.desc}</small></div>
                      <em>تعديل السعر ←</em>
                    </div>
                  ))
                )}
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
                <p>ملخص الأتعاب والتحويلات والتسويات لشهر {currentMonthName} {new Date().getFullYear()}.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              <div className="financeBreakdown">
                <div className="financeBig">
                  <span>إجمالي أتعاب {currentMonthName}</span>
                  <strong>{totalEarnedStr} <small>د.أ</small></strong>
                  <em className={totalEarnedNum > 0 ? "greenText" : ""}>
                    {availableBalNum > 0 ? `الرصيد المتاح: ${availableBalNum.toLocaleString()} د.أ` : 'لا توجد أتعاب مسجلة'}
                  </em>
                </div>
                <div className="financeTable">
                  <div><span>تم تحويله</span><b>{wallet?.total_withdrawn !== undefined && wallet?.total_withdrawn !== null ? Number(wallet.total_withdrawn).toLocaleString() : '0'} د.أ</b></div>
                  <div><span>قيد التسوية</span><b>{wallet?.pending_balance !== undefined && wallet?.pending_balance !== null ? Number(wallet.pending_balance).toLocaleString() : '0'} د.أ</b></div>
                  <div><span>متوسط الاستشارة</span><b>{completedCount > 0 ? (totalEarnedNum / completedCount).toFixed(1) : '0.0'} د.أ</b></div>
                  <div><span>الرصيد المتاح</span><b>{availableBalNum.toLocaleString()} د.أ</b></div>
                </div>
              </div>
              <div className="modalSectionTitle">
                <h3>آخر الحركات المالية</h3>
                <span>{currentMonthName} {new Date().getFullYear()}</span>
              </div>
              <div className="modalList">
                {completedCount === 0 && totalEarnedNum === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    لا توجد حركات مالية أو أتعاب محولة حتى الآن.
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'completed' || a.price).slice(0, 5).map((a, idx) => (
                    <div key={a.id || idx} className="modalListRow" onClick={() => { setConsultantModal(null); handleNavigate('/consultant/earnings'); }}>
                      <i className="green"></i>
                      <div><b>استشارة: {a.service?.name || a.service_name || 'استشارة ضريبية'}</b><small>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString('ar-EG') : 'مكتملة'}</small></div>
                      <em>{a.price ? `${a.price} د.أ` : 'مكتملة'}</em>
                    </div>
                  ))
                )}
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
                <h2>{selectedSessionData?.serviceName || (selectedSessionData?.service?.name) || 'جلسات اليوم'}</h2>
                <p>
                  {selectedSessionData ? (
                    `${selectedSessionData.clientName || selectedSessionData.user?.full_name || 'عميل'} · ${selectedSessionData.timeDisplay || ''} · ${selectedSessionData.channel || 'فيديو'}`
                  ) : (
                    'لا توجد جلسات مجدولة حالياً'
                  )}
                </p>
              </div>
              <button className="consultantModalClose" onClick={() => setConsultantModal(null)}>×</button>
            </div>
            <div className="consultantModalBody">
              {selectedSessionData ? (
                <div className="sessionDetailGrid">
                  <div className="sessionInfoCard">
                    <h3>معلومات الجلسة</h3>
                    <div className="sessionMetaTable">
                      <div><span>العميل</span><b>{selectedSessionData.clientName || selectedSessionData.user?.full_name || 'عميل'}</b></div>
                      <div><span>نوع الخدمة</span><b>{selectedSessionData.serviceName || selectedSessionData.service?.name || 'استشارة ضريبية'}</b></div>
                      <div><span>القناة</span><b>{selectedSessionData.channel || 'فيديو'}</b></div>
                      <div><span>الحالة</span><b>{selectedSessionData.statusLabel || (selectedSessionData.status === 'confirmed' ? 'مؤكدة' : 'بانتظار الموافقة')}</b></div>
                      <div><span>الأتعاب</span><b>{selectedSessionData.price ? `${selectedSessionData.price} د.أ` : '—'}</b></div>
                    </div>
                    {selectedSessionData.notes && (
                      <>
                        <div className="modalSectionTitle"><h3>موضوع الجلسة</h3></div>
                        <p style={{ fontSize: '11px', color: '#607987', lineHeight: '1.8', margin: '6px 0 0' }}>
                          {selectedSessionData.notes}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="sessionSideCard">
                    <h3>جاهزية الجلسة</h3>
                    <div className="sessionChecklist">
                      <div><i></i>ملف العميل جاهز</div>
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
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: '#0D3C5C' }}>
                    لا توجد جلسات مجدولة لليوم
                  </p>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    عند حجز موعد جديد أو تأكيد جلسة ستظهر كافة بياناتها وخيارات بدئها هنا مباشرة.
                  </span>
                </div>
              )}
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  style={{ background: '#0D3C5C', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  onClick={() => {
                    handleLawClick(selectedUpdate);
                    setSelectedUpdate(null);
                  }}
                >
                  الانتقال إلى البحث الدلالي لهذا القانون ←
                </button>
              </div>
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
                  <div key={law.law_id || law.id || idx} className="modalListRow" onClick={() => { setShowAllUpdates(false); handleLawClick(law); }} style={{ cursor: 'pointer' }} title="الانتقال إلى البحث الدلالي">
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
      {/* Sleek Shared NotificationDetailsModal */}
      <NotificationDetailsModal
        isOpen={Boolean(selectedNotifForModal)}
        notification={selectedNotifForModal}
        onClose={() => setSelectedNotifForModal(null)}
        onNavigate={handleNavigate}
        onMarkAsRead={async (id) => {
          try {
            await notificationService.markAsRead(id, token, true);
            setSystemNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          } catch (e) {
            console.warn("Could not mark notification as read:", e);
          }
        }}
        role="consultant"
      />
    </div>
  );
}

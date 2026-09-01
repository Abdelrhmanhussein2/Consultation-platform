import React, { useState, useMemo } from 'react';
import './AdminSubscriptionsPage.css';

// ══════════════════════════════════════════════════════════════════
// DATASETS & CONSTANTS
// ══════════════════════════════════════════════════════════════════

const defaultLabels = {
  cases: 'الحالات / الملفات الضريبية',
  points: 'عدد النقاط',
  downloads: 'التحميلات',
  prints: 'الطباعة',
  consultations: 'الاستشارات المجانية',
  trialDays: 'عدد أيام التجربة'
};

const createCycle = (enabled, price, cases, points, downloads, prints, consultations, trialDays, period) => ({
  enabled,
  price,
  cases,
  points,
  downloads,
  prints,
  consultations,
  trialDays,
  labels: {
    price: period === 'monthly' ? 'السعر الشهري' : 'السعر السنوي',
    ...defaultLabels
  }
});

const INITIAL_PLANS = [
  {
    id: 1,
    name: 'مجانية',
    desc: 'للبدء واستكشاف الخدمات الأساسية في المنصة.',
    team: 1,
    support: 'خلال 48 ساعة',
    ai: false,
    trial: false,
    refund: false,
    active: true,
    default: true,
    recommended: false,
    cycles: {
      monthly: createCycle(true, 0, 5, 0, 5, 5, 0, 0, 'monthly'),
      yearly: createCycle(true, 0, 60, 0, 60, 60, 0, 0, 'yearly')
    }
  },
  {
    id: 2,
    name: 'أساسية',
    desc: 'مناسبة للأفراد والمنشآت الصغيرة التي تحتاج أدوات ضريبية أوسع.',
    team: 5,
    support: 'خلال 24 ساعة',
    ai: true,
    trial: true,
    refund: true,
    active: true,
    default: false,
    recommended: false,
    cycles: {
      monthly: createCycle(true, 29.99, 25, 800, 25, 25, 1, 7, 'monthly'),
      yearly: createCycle(true, 284.30, 350, 12000, 350, 350, 15, 14, 'yearly')
    }
  },
  {
    id: 3,
    name: 'احترافية',
    desc: 'للفرق والمنشآت التي تحتاج استخدامًا مكثفًا وأولوية أعلى.',
    team: 10,
    support: 'أولوية قصوى — 24/7',
    ai: true,
    trial: true,
    refund: true,
    active: true,
    default: false,
    recommended: true,
    cycles: {
      monthly: createCycle(true, 79.99, 100, 3000, 100, 100, 3, 14, 'monthly'),
      yearly: createCycle(true, 758.30, 1400, 42000, 1400, 1400, 40, 21, 'yearly')
    }
  }
];

const subscriberNames = [
  "شركة الأفق للتجارة", "أحمد الخطيب", "شركة المدار", "ليان الحسن", "مؤسسة الرواد", "شركة النور", "سارة المصري", "خالد منصور",
  "شركة القمة", "شركة المستقبل", "نور حداد", "شركة الشروق", "مؤسسة الصفوة", "شركة الأعمال الحديثة", "محمد العلي", "هبة الزعبي",
  "شركة بيت الخبرة", "سامر الخطيب", "لينا مراد", "شركة النخبة", "مؤسسة الريادة", "رائد العجارمة", "دانا شحادة", "شركة النورس"
];

const INITIAL_SUBSCRIBERS = Array.from({ length: 32 }, (_, i) => {
  const name = subscriberNames[i % subscriberNames.length];
  const free = i % 8 === 0;
  const plan = free ? "مجانية" : i % 3 === 0 ? "احترافية" : "أساسية";
  const cycle = free ? "شهري" : i % 4 === 0 ? "سنوي" : "شهري";
  const lifeCycle = ["active", "active", "active", "renewal", "expiring", "payment", "grace", "scheduled"];
  const life = lifeCycle[i % lifeCycle.length];
  const start = `2026-08-${String(1 + (i % 25)).padStart(2, "0")}`;
  const end = cycle === "سنوي" ? `2027-08-${String(1 + (i % 25)).padStart(2, "0")}` : `2026-09-${String(1 + (i % 25)).padStart(2, "0")}`;
  const pointsTotal = free ? 20 : plan === "احترافية" ? 3000 : 800;
  const downloadsTotal = free ? 5 : plan === "احترافية" ? 100 : 25;
  const consultTotal = free ? 0 : plan === "احترافية" ? 3 : 1;
  const teamTotal = free ? 1 : plan === "احترافية" ? 10 : 5;
  const pointsUsed = free ? 0 : Math.round(pointsTotal * ((i % 5 + 1) / 10));
  const downloadsUsed = free ? 1 : Math.min(downloadsTotal, Math.max(1, (i * 3) % downloadsTotal));
  const consultUsed = Math.min(consultTotal, i % (consultTotal + 1));
  const teamUsed = free ? 1 : Math.min(teamTotal, 1 + (i % teamTotal));

  return {
    id: i + 1,
    name,
    email: `subscriber${i + 1}@example.com`,
    plan,
    cycle,
    life,
    start,
    end,
    renew: end,
    trialInfo: free ? "تجربة مجانية لمدة 3 أيام • 20 نقطة • 5 تحميـلات" : "",
    pointsUsed,
    pointsTotal,
    downloadsUsed,
    downloadsTotal,
    consultUsed,
    consultTotal,
    teamUsed,
    teamTotal,
    scheduled: life === "scheduled" ? "تغيير مجدول عند التجديد" : "لا يوجد",
    planVersion: plan === "احترافية" ? "v2.0" : "v1.0",
    history: [
      { t: "تم إنشاء الاشتراك", d: `${start} 09:58 ص`, p: "النظام" },
      { t: "تم اعتماد عملية الدفع", d: `${start} 10:07 ص`, p: "الإدارة المالية — ليان حداد" },
      { t: "تم تفعيل الاشتراك", d: `${start} 10:15 ص`, p: "مدير الباقات — أحمد منصور" }
    ],
    usageLogs: {
      points: [
        { title: "المساعد الذكي — تحليل سؤال ضريبي", desc: "تم تحليل استفسار ضريبي واستخراج المواد القانونية المرتبطة به.", date: `${start} 11:20 ص`, badge: "المساعد الذكي" },
        { title: "تلخيص تشريع ضريبي", desc: "استخراج الملخص القانوني لنظام الفوترة الوطني والتعليمات المرفقة.", date: `${start} 02:15 م`, badge: "التلخيص" },
        { title: "مقارنة تشريعات ضريبية", desc: "مقارنة بين قانون ضريبة الدخل والتعليمات التنفيذية الصادرة بموجبه.", date: `${start} 04:40 م`, badge: "المقارنة" }
      ],
      downloads: [
        { title: "قانون ضريبة الدخل رقم 34 لسنة 2014", desc: "تحميل بصيغة PDF من مكتبة التشريعات.", date: `${start} 12:00 م`, badge: "تحميل PDF" },
        { title: "نموذج إقرار ضريبة المبيعات", desc: "طباعة النموذج الرسمي المعتمد.", date: `${start} 01:10 م`, badge: "طباعة" }
      ],
      consultations: [
        { title: "استشارة ضريبة الدخل والأرباح التجارية", desc: "جلسة استشارية معتمدة مع مستشار مرخص عبر المنصة.", date: `${start} 03:00 م`, badge: "استشارة مجانية" }
      ],
      team: [
        { title: name, desc: "مدير الحساب الرئيسي والمفوض المالي للإدارة.", date: `${start} 09:30 ص`, badge: "مدير الحساب" },
        { title: "أحمد نصار", desc: "محاسب ضريبي ومراجع للحساب.", date: `${start} 10:15 ص`, badge: "محاسب" }
      ]
    }
  };
});

const INITIAL_REQUESTS = Array.from({ length: 24 }, (_, i) => {
  const freeCase = i % 7 === 0;
  const plan = freeCase ? "مجانية" : i % 2 === 0 ? "أساسية" : "احترافية";
  const subscription = freeCase ? "شهري" : i % 3 === 0 ? "سنوي" : "شهري";
  const statusCycle = ["approved", "pending", "approved", "rejected", "approved", "pending"];
  const status = statusCycle[i % statusCycle.length];
  const amount = freeCase ? 0 : plan === "أساسية" ? (subscription === "سنوي" ? 284.30 : 29.99) : (subscription === "سنوي" ? 758.30 : 79.99);
  const paidMethods = ["تحويل بنكي", "CliQ", "محفظة إلكترونية", "Visa", "Mastercard"];
  const payment = freeCase ? "باقة مجانية" : paidMethods[i % paidMethods.length];

  return {
    id: i + 1,
    requestNo: `PR-${2026000 + i + 1}`,
    name: subscriberNames[i % subscriberNames.length],
    email: `req${i + 1}@diwan.jo`,
    plan,
    subscription,
    payment,
    amount,
    status,
    date: `2026-08-${String(26 - (i % 12)).padStart(2, "0")}`,
    time: `${String(9 + (i % 9)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    isFreeGrant: freeCase,
    grantDuration: freeCase ? "30 يوماً" : "",
    grantedBy: freeCase ? "مدير الباقات — أحمد منصور" : "",
    grantReason: freeCase ? "منحة تعريفية للعميل" : "",
    rejectReason: status === "rejected" ? "قيمة التحويل غير مطابقة للطلب" : ""
  };
});

const INITIAL_ORDERS = Array.from({ length: 24 }, (_, i) => {
  const plan = i % 3 === 0 ? "احترافية" : i % 2 === 0 ? "أساسية" : "مجانية";
  const subscription = i % 3 === 0 ? "سنوي" : "شهري";
  const amount = plan === "مجانية" ? 0 : plan === "أساسية" ? (subscription === "سنوي" ? 284.30 : 29.99) : (subscription === "سنوي" ? 758.30 : 79.99);
  const statuses = ["approved", "pending", "rejected"];
  const paymentMethods = ["تحويل بنكي", "CliQ", "محفظة إلكترونية", "Visa", "Mastercard"];

  return {
    id: i + 1,
    orderNo: `PO-${String.fromCharCode(65 + (i % 26))}${2026100 + i}`,
    name: subscriberNames[(i + 3) % subscriberNames.length],
    email: `order${i + 1}@diwan.jo`,
    plan,
    subscription,
    amount,
    yearlyDiscount: subscription === "سنوي" && amount > 0 ? 21 : 0,
    payment: paymentMethods[(i + 1) % paymentMethods.length],
    status: statuses[(i + 1) % 3],
    date: `2026-08-${String(26 - (i % 15)).padStart(2, "0")}`,
    time: `${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}`,
    receipt: true
  };
});

const INITIAL_VERSIONS = [
  { plan: "أساسية", version: "v1.0", date: "2026-01-01", scope: "الإصدار الحالي للمشتركين القدامى", changes: "800 نقطة، 25 تحميلاً، استشارة مجانية واحدة", active: true },
  { plan: "أساسية", version: "v2.0", date: "2026-08-01", scope: "للاشتراكات الجديدة فقط", changes: "تعديل السعر السنوي وتحسين أولوية الدعم", active: true },
  { plan: "احترافية", version: "v1.0", date: "2026-01-01", scope: "الإصدار السابق", changes: "3000 نقطة، 100 تحميل، 3 استشارات مجانية", active: true },
  { plan: "احترافية", version: "v2.0", date: "2026-08-15", scope: "للاشتراكات الجديدة فقط", changes: "3500 نقطة، 120 تحميلاً، 4 استشارات مجانية", active: true }
];

const VERSION_RULES = {
  "أساسية": {
    "v1.0": { priceMonthly: 24.99, priceYearly: 236.90, points: 600, downloads: 20, consultations: 1, team: 3, support: "خلال 48 ساعة" },
    "v2.0": { priceMonthly: 29.99, priceYearly: 284.30, points: 800, downloads: 25, consultations: 1, team: 5, support: "خلال 24 ساعة" }
  },
  "احترافية": {
    "v1.0": { priceMonthly: 79.99, priceYearly: 758.30, points: 3000, downloads: 100, consultations: 3, team: 10, support: "أولوية قصوى — 24/7" },
    "v2.0": { priceMonthly: 89.99, priceYearly: 852.90, points: 3500, downloads: 120, consultations: 4, team: 10, support: "أولوية قصوى — 24/7" }
  }
};

const NOTIFICATION_TYPES = [
  { id: "renewal", title: "قرب انتهاء الاشتراك", sub: "تنبيه بالتجديد أو قرب الانتهاء", subject: "اشتراكك يقترب من الانتهاء", body: "نود تذكيرك بأن اشتراكك يقترب من تاريخ الانتهاء. يمكنك مراجعة تفاصيل الباقة وتجديدها لضمان استمرار الخدمة دون انقطاع." },
  { id: "usage", title: "تنبيه استهلاك", sub: "النقاط أو التحميلات أو الاستشارات", subject: "تنبيه بخصوص استهلاك الباقة", body: "اقترب استهلاكك من الحد المتاح ضمن باقتك الحالية. يمكنك مراجعة تفاصيل الاستخدام من حسابك." },
  { id: "payment", title: "الدفع والتجديد", sub: "دفعة معلقة أو تجديد مطلوب", subject: "إجراء مطلوب لإكمال التجديد", body: "يوجد إجراء متعلق بالدفع أو تجديد الاشتراك يحتاج إلى استكمال. يرجى مراجعة حسابك للاطلاع على التفاصيل." },
  { id: "upgrade", title: "ترقية متاحة", sub: "اقتراح الانتقال إلى باقة أعلى", subject: "يمكنك ترقية باقتك", body: "بناءً على مستوى استخدامك الحالي، يمكنك الترقية إلى باقة أعلى للحصول على حدود ومزايا إضافية." },
  { id: "custom", title: "إشعار مخصص", sub: "اكتب عنوانًا ورسالة من اختيارك", subject: "", body: "" }
];

export default function AdminSubscriptionsPage({ navigate }) {
  // Navigation tabs: 'dashboard', 'plans', 'subscribers', 'requests', 'orders', 'versions', 'planForm'
  const [activeTab, setActiveTab] = useState('subscribers');
  const [billing, setBilling] = useState('monthly');

  // Datasets
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [subscribers, setSubscribers] = useState(INITIAL_SUBSCRIBERS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [versions, setVersions] = useState(INITIAL_VERSIONS);

  // Version compare modal interactive controls
  const [comparePlan, setComparePlan] = useState('أساسية');
  const [compareA, setCompareA] = useState('v2.0');
  const [compareB, setCompareB] = useState('v1.0');

  // View modes
  const [requestView, setRequestView] = useState('list'); // 'list' | 'cards' | 'kanban'
  const [orderView, setOrderView] = useState('list'); // 'list' | 'cards' | 'kanban'

  // Modals state
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [resourceLogModal, setResourceLogModal] = useState(null);
  const [notificationModal, setNotificationModal] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [versionCompareModal, setVersionCompareModal] = useState(null);
  const [versionMembersModal, setVersionMembersModal] = useState(null);
  const [migrationModal, setMigrationModal] = useState(null);
  const [drilldownModal, setDrilldownModal] = useState(null);
  const [newVersionModal, setNewVersionModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);

  // Plan editor state
  const [editingPlan, setEditingPlan] = useState(null);

  // Search & Filter inputs
  const [subSearch, setSubSearch] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subLifecycleFilter, setSubLifecycleFilter] = useState('all');

  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState('all');
  const [reqPlanFilter, setReqPlanFilter] = useState('all');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');

  // Drilldown internal filters
  const [drillSearch, setDrillSearch] = useState('');
  const [drillPlanFilter, setDrillPlanFilter] = useState('all');
  const [drillCycleFilter, setDrillCycleFilter] = useState('all');

  // Notification Composer form state
  const [notificationType, setNotificationType] = useState('renewal');
  const [notificationSubject, setNotificationSubject] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2000);
  };

  const money = (n) => `${Number(n || 0).toFixed(2)} د.أ`;

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchQ = !subSearch || s.name.includes(subSearch) || s.email.includes(subSearch);
      const matchP = subPlanFilter === 'all' || s.plan === subPlanFilter;
      const matchL = subLifecycleFilter === 'all' || s.life === subLifecycleFilter;
      return matchQ && matchP && matchL;
    });
  }, [subscribers, subSearch, subPlanFilter, subLifecycleFilter]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchQ = !reqSearch || r.name.includes(reqSearch) || r.requestNo.includes(reqSearch);
      const matchS = reqStatusFilter === 'all' || r.status === reqStatusFilter;
      const matchP = reqPlanFilter === 'all' || r.plan === reqPlanFilter;
      return matchQ && matchS && matchP;
    });
  }, [requests, reqSearch, reqStatusFilter, reqPlanFilter]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchQ = !orderSearch || o.name.includes(orderSearch) || o.orderNo.includes(orderSearch);
      const matchS = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const matchF = !orderDateFrom || o.date >= orderDateFrom;
      const matchT = !orderDateTo || o.date <= orderDateTo;
      return matchQ && matchS && matchF && matchT;
    });
  }, [orders, orderSearch, orderStatusFilter, orderDateFrom, orderDateTo]);

  // Filtered drilldown modal rows
  const filteredDrilldownRows = useMemo(() => {
    if (!drilldownModal || !drilldownModal.rows) return [];
    return drilldownModal.rows.filter((r) => {
      const matchQ = !drillSearch || r.name.includes(drillSearch) || (r.email || '').includes(drillSearch);
      const matchP = drillPlanFilter === 'all' || r.plan === drillPlanFilter;
      const matchC = drillCycleFilter === 'all' || r.cycle === drillCycleFilter;
      return matchQ && matchP && matchC;
    });
  }, [drilldownModal, drillSearch, drillPlanFilter, drillCycleFilter]);

  // ══════════════════════════════════════════════════════════════════
  // LIVE BACKEND API INTEGRATION (Fetch on Mount & Auto-Sync)
  // ══════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    // 1. Fetch Plans
    fetch('/api/subscriptions/plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {});

    // 2. Fetch Subscribers
    fetch('/api/subscriptions/subscribers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSubscribers(data);
        }
      })
      .catch(() => {});

    // 3. Fetch Requests
    fetch('/api/subscriptions/requests')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRequests(data);
        }
      })
      .catch(() => {});

    // 4. Fetch Orders
    fetch('/api/subscriptions/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setOrders(data);
        }
      })
      .catch(() => {});

    // 5. Fetch Versions
    fetch('/api/subscriptions/versions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setVersions(data);
        }
      })
      .catch(() => {});
  }, []);

  // Export CSV Helper
  const exportCSV = (filename, headerRow, dataRows) => {
    const csv = [headerRow, ...dataRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('تم تصدير ملف CSV بنجاح');
  };

  // Toggle Plan Active (with DB Sync)
  const togglePlanActive = async (id) => {
    try {
      await fetch(`/api/subscriptions/plans/${id}/toggle-active`, { method: 'PATCH' });
    } catch (e) {}

    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    showToast('تم تحديث حالة الباقة');
  };

  // Delete Plan (with DB Sync)
  const handleDeletePlan = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      try {
        await fetch(`/api/subscriptions/plans/${id}`, { method: 'DELETE' });
      } catch (e) {}

      setPlans((prev) => prev.filter((p) => p.id !== id));
      showToast('تم حذف الباقة بنجاح');
    }
  };

  // Open Plan Editor
  const handleOpenPlanEditor = (planToEdit = null) => {
    if (planToEdit) {
      setEditingPlan({ ...planToEdit });
    } else {
      setEditingPlan({
        id: null,
        name: '',
        desc: '',
        team: 1,
        support: 'خلال 48 ساعة',
        ai: false,
        trial: false,
        refund: false,
        active: true,
        default: false,
        recommended: false,
        cycles: {
          monthly: createCycle(true, 0, 5, 0, 5, 5, 0, 0, 'monthly'),
          yearly: createCycle(true, 0, 60, 0, 60, 60, 0, 0, 'yearly')
        }
      });
    }
    setActiveTab('planForm');
  };

  // Save Plan (with DB Sync)
  const handleSavePlan = async () => {
    if (!editingPlan.name.trim()) {
      alert('يرجى إدخال اسم الباقة');
      return;
    }
    if (!editingPlan.cycles.monthly.enabled && !editingPlan.cycles.yearly.enabled) {
      alert('يرجى تفعيل اشتراك شهري أو سنوي على الأقل');
      return;
    }

    try {
      await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      });
    } catch (e) {}

    setPlans((prev) => {
      let updated = [...prev];
      if (editingPlan.default) {
        updated = updated.map((p) => ({ ...p, default: false }));
      }
      const existingIdx = updated.findIndex((p) => p.id === editingPlan.id);
      if (existingIdx >= 0) {
        updated[existingIdx] = editingPlan;
      } else {
        updated.push(editingPlan);
      }
      return updated;
    });

    setActiveTab('plans');
    showToast('تم حفظ الباقة ومزامنتها بنجاح');
  };

  // Notification Composer Selection
  const handleOpenNotificationModal = (sub) => {
    setNotificationModal(sub);
    setNotificationType('renewal');
    setNotificationSubject(NOTIFICATION_TYPES[0].subject);
    setNotificationMessage(NOTIFICATION_TYPES[0].body);
  };

  const handleSelectNotificationType = (tId) => {
    setNotificationType(tId);
    const t = NOTIFICATION_TYPES.find((x) => x.id === tId);
    if (t) {
      setNotificationSubject(t.subject);
      setNotificationMessage(t.body);
    }
  };

  return (
    <div className="sub-page-root">
      
      {/* 1. Page Header with Title and Navigation Tabs */}
      <div className="sub-page-head">
        <div className="sub-head-copy">
          <h1>إدارة الباقات والاشتراكات</h1>
          <p>إنشاء وإدارة باقات الاشتراك، طلبات الترقية، وأوامر الاشتراك الفعلية.</p>
        </div>

        <div className="sub-nav-tabs">
          {[
            { id: 'dashboard', label: 'لوحة الاشتراكات' },
            { id: 'plans', label: 'الباقات' },
            { id: 'subscribers', label: 'الاشتراكات الحالية' },
            { id: 'requests', label: 'طلبات الباقات' },
            { id: 'orders', label: 'أوامر الاشتراك' },
            { id: 'versions', label: 'إصدارات الباقات' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sub-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: DASHBOARD (لوحة الاشتراكات)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div>
          {/* 4 Metric KPI Cards */}
          <div className="sub-dashboard-grid">
            <div
              className="sub-metric-card"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'الاشتراكات النشطة',
                  rows: subscribers.filter((s) => s.life === 'active')
                });
              }}
            >
              <div className="sub-metric-top">
                <div>
                  <div className="sub-metric-label">الاشتراكات النشطة</div>
                  <div className="sub-metric-value">{subscribers.filter((s) => s.life === 'active').length}</div>
                </div>
                <div className="sub-metric-icon">◎</div>
              </div>
              <div className="sub-metric-foot">+12 هذا الشهر</div>
            </div>

            <div
              className="sub-metric-card"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'اشتراكات تنتهي قريباً (أولوية التجديد)',
                  rows: subscribers.filter((s) => ['expiring', 'renewal', 'grace'].includes(s.life))
                });
              }}
            >
              <div className="sub-metric-top">
                <div>
                  <div className="sub-metric-label">تنتهي خلال 30 يومًا</div>
                  <div className="sub-metric-value">{subscribers.filter((s) => ['expiring', 'renewal'].includes(s.life)).length}</div>
                </div>
                <div className="sub-metric-icon orange">⌛</div>
              </div>
              <div className="sub-metric-foot">7 منها خلال هذا الأسبوع</div>
            </div>

            <div
              className="sub-metric-card"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'ترقيات هذا الشهر',
                  rows: subscribers.filter((s) => s.plan === 'احترافية')
                });
              }}
            >
              <div className="sub-metric-top">
                <div>
                  <div className="sub-metric-label">ترقيات هذا الشهر</div>
                  <div className="sub-metric-value">11</div>
                </div>
                <div className="sub-metric-icon blue">↗</div>
              </div>
              <div className="sub-metric-foot">11 ترقية فورية معتمدة</div>
            </div>

            <div
              className="sub-metric-card"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'اشتراكات في فترة سماح',
                  rows: subscribers.filter((s) => ['grace', 'payment'].includes(s.life))
                });
              }}
            >
              <div className="sub-metric-top">
                <div>
                  <div className="sub-metric-label">اشتراكات في فترة سماح</div>
                  <div className="sub-metric-value">{subscribers.filter((s) => ['grace', 'payment'].includes(s.life)).length}</div>
                </div>
                <div className="sub-metric-icon red">!</div>
              </div>
              <div className="sub-metric-foot">تحتاج لمتابعة الدفع</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="sub-dash-row">
            <div
              className="sub-chart-card clickable"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'المشتركون حسب الباقة',
                  rows: subscribers
                });
              }}
            >
              <div className="sub-chart-head">
                <div>
                  <div className="sub-chart-title">توزيع المشتركين حسب الباقة</div>
                  <div className="sub-chart-sub">إجمالي المشتركين النشطين على المنصة</div>
                </div>
              </div>
              <div className="sub-bar-chart">
                {['مجانية', 'أساسية', 'احترافية'].map((pName, idx) => {
                  const count = subscribers.filter((s) => s.plan === pName).length;
                  const pctWidth = Math.round((count / subscribers.length) * 100);
                  return (
                    <div key={pName} className="sub-bar-line">
                      <span>{pName}</span>
                      <div className="sub-bar-track">
                        <div
                          className={`sub-bar-fill ${idx === 1 ? 'blue' : idx === 2 ? 'orange' : ''}`}
                          style={{ width: `${pctWidth}%` }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="sub-chart-card clickable"
              onClick={() => {
                setDrillSearch('');
                setDrillPlanFilter('all');
                setDrillCycleFilter('all');
                setDrilldownModal({
                  title: 'الاشتراكات الشهرية والسنوية',
                  rows: subscribers
                });
              }}
            >
              <div className="sub-chart-head">
                <div>
                  <div className="sub-chart-title">شهري مقابل سنوي</div>
                  <div className="sub-chart-sub">نمط الاشتراكات الحالية</div>
                </div>
              </div>
              <div className="sub-donut-wrap">
                <div
                  className="sub-donut"
                  style={{
                    background: `conic-gradient(var(--green) 0 65%, #2e7cf6 65% 100%)`
                  }}
                >
                  <div className="sub-donut-center">
                    <div>
                      <strong style={{ fontSize: '18px', color: 'var(--ink)' }}>{subscribers.length}</strong>
                      <br />
                      مشترك
                    </div>
                  </div>
                </div>
                <div className="sub-legend">
                  <div className="sub-legend-item">
                    <span className="sub-legend-dot" style={{ background: '#11b981' }} />
                    <span>شهري — 65%</span>
                  </div>
                  <div className="sub-legend-item">
                    <span className="sub-legend-dot" style={{ background: '#2e7cf6' }} />
                    <span>سنوي — 35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Movement & Expiring Row */}
          <div className="sub-dash-row">
            <div className="sub-chart-card">
              <div className="sub-chart-head">
                <div>
                  <div className="sub-chart-title">الاشتراكات القريبة من الانتهاء</div>
                  <div className="sub-chart-sub">أولوية المتابعة والتجديد</div>
                </div>
                <button className="sub-secondary-btn" onClick={() => setActiveTab('subscribers')}>
                  عرض الكل
                </button>
              </div>
              <div className="sub-alert-list">
                {subscribers.slice(0, 5).map((s) => (
                  <div key={s.id} className="sub-alert-row" onClick={() => setSelectedSubscriber(s)}>
                    <div className="sub-alert-main">
                      <span className="sub-alert-name">{s.name}</span>
                      <span className="sub-alert-sub">{s.plan} • {s.cycle} • {s.end}</span>
                    </div>
                    <span className="sub-alert-days">{s.end}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sub-chart-card">
              <div className="sub-chart-head">
                <div>
                  <div className="sub-chart-title">حركة الاشتراكات هذا الشهر</div>
                  <div className="sub-chart-sub">ترقيات وتجديدات وتخفيضات دورية</div>
                </div>
              </div>
              <div className="sub-bar-chart">
                <div className="sub-bar-line" onClick={() => {
                  setDrilldownModal({ title: 'ترقيات هذا الشهر', rows: subscribers.filter((s) => s.plan === 'احترافية') });
                }}>
                  <span>ترقيات</span>
                  <div className="sub-bar-track"><div className="sub-bar-fill" style={{ width: '78%' }} /></div>
                  <strong>11</strong>
                </div>
                <div className="sub-bar-line" onClick={() => {
                  setDrilldownModal({ title: 'تجديدات الاشتراكات', rows: subscribers.filter((s) => s.cycle === 'سنوي') });
                }}>
                  <span>تجديدات</span>
                  <div className="sub-bar-track"><div className="sub-bar-fill blue" style={{ width: '92%' }} /></div>
                  <strong>28</strong>
                </div>
                <div className="sub-bar-line">
                  <span>إلغاءات</span>
                  <div className="sub-bar-track"><div className="sub-bar-fill red" style={{ width: '18%' }} /></div>
                  <strong>3</strong>
                </div>
                <div className="sub-bar-line">
                  <span>تخفيضات</span>
                  <div className="sub-bar-track"><div className="sub-bar-fill orange" style={{ width: '25%' }} /></div>
                  <strong>4</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: PLANS (عرض وإدارة الباقات)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <div className="sub-surface sub-plans-hero">
          <div className="sub-hero-center">
            <h2>باقات الاشتراك المعتمدة</h2>
            <p>أنشئ وأدر باقات اشتراك مرنة تناسب احتياجات المستشارين والعملاء في المنصة الضريبية.</p>
          </div>

          <div className="sub-plan-controls">
            <div className="sub-billing-switch">
              <button
                className={`sub-billing-btn ${billing === 'monthly' ? 'active' : ''}`}
                onClick={() => setBilling('monthly')}
              >
                شهري
              </button>
              <button
                className={`sub-billing-btn ${billing === 'yearly' ? 'active' : ''}`}
                onClick={() => setBilling('yearly')}
              >
                سنوي <span className="sub-save-badge">وفر 21%</span>
              </button>
            </div>
            <button className="sub-primary-btn" onClick={() => handleOpenPlanEditor(null)}>
              ＋ إضافة باقة جديدة
            </button>
          </div>

          <div className="sub-plans-grid">
            {plans.map((p) => {
              const c = p.cycles[billing];
              if (!c || !c.enabled) return null;
              const L = c.labels;

              return (
                <div key={p.id} className={`sub-plan-card ${p.recommended ? 'recommended' : ''}`}>
                  {p.recommended && <div className="sub-recommended-badge">موصى بها</div>}

                  <div className="sub-plan-tags">
                    {p.default && <span className="sub-tag-mini default">افتراضية</span>}
                    <span className="sub-tag-mini">{p.active ? 'فعّالة' : 'غير فعّالة'}</span>
                  </div>

                  <div className="sub-plan-top">
                    <div className="sub-plan-name">{p.name}</div>
                    <div className="sub-plan-price">
                      <span className="num">{c.price.toFixed(2)}</span>
                      <span className="period">د.أ / {billing === 'monthly' ? 'شهريًا' : 'سنويًا'}</span>
                    </div>
                    <div className="sub-plan-desc">{p.desc}</div>
                  </div>

                  <div className="sub-plan-body">
                    <div className="sub-block-title">المزايا المضمنة</div>
                    <div className="sub-feature-list">
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">أعضاء الفريق</span>
                        <span className="sub-feature-val">{p.team === 1 ? 'عضو فريق واحد' : `حتى ${p.team} أعضاء`}</span>
                      </div>
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">{L.cases}</span>
                        <span className="sub-feature-val">{c.cases.toLocaleString('ar-JO')}</span>
                      </div>
                      {c.points > 0 && (
                        <div className="sub-feature-row">
                          <span className="sub-feature-left">{L.points}</span>
                          <span className="sub-feature-val">{c.points.toLocaleString('ar-JO')}</span>
                        </div>
                      )}
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">استخدام الذكاء الاصطناعي</span>
                        <span className={`sub-feature-val ${p.ai ? 'yes' : 'no'}`}>{p.ai ? '✓' : '×'}</span>
                      </div>
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">{L.downloads}</span>
                        <span className="sub-feature-val">{c.downloads.toLocaleString('ar-JO')}</span>
                      </div>
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">{L.consultations}</span>
                        <span className="sub-feature-val">{c.consultations.toLocaleString('ar-JO')}</span>
                      </div>
                      <div className="sub-feature-row">
                        <span className="sub-feature-left">أولوية الدعم</span>
                        <span className="sub-feature-val">{p.support}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sub-plan-foot">
                    <div className="sub-switch-wrap">
                      <div
                        className={`sub-switch ${p.active ? 'on' : ''}`}
                        onClick={() => togglePlanActive(p.id)}
                      />
                      <span>{p.active ? 'فعّالة' : 'غير فعّالة'}</span>
                    </div>

                    <div className="sub-card-actions">
                      <button
                        className="sub-icon-action"
                        onClick={() => handleOpenPlanEditor(p)}
                        title="تعديل"
                      >
                        ✎
                      </button>
                      {!p.default && (
                        <button
                          className="sub-icon-action"
                          onClick={() => handleDeletePlan(p.id)}
                          title="حذف"
                        >
                          ⌫
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PLAN FORM SECTION (إنشاء وتعديل الباقة)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'planForm' && editingPlan && (
        <div className="sub-surface sub-form-wrap">
          <div className="sub-form-card">
            <div className="sub-page-head" style={{ margin: '0 0 16px' }}>
              <div className="sub-head-copy">
                <h1>{editingPlan.id ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}</h1>
                <p>تخصيص تفاصيل الباقة، الأسعار، وحدود الاستهلاك لكل دورة دفع.</p>
              </div>
              <button className="sub-secondary-btn" onClick={() => setActiveTab('plans')}>
                ← رجوع
              </button>
            </div>

            <div className="sub-form-grid">
              <div className="sub-form-field">
                <label>اسم الباقة <span className="sub-req">*</span></label>
                <input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="مثال: باقة الشركات المتميزة"
                />
              </div>

              <div className="sub-form-field">
                <label>الحد الأقصى لأعضاء الفريق <span className="sub-req">*</span></label>
                <input
                  type="number"
                  value={editingPlan.team}
                  onChange={(e) => setEditingPlan({ ...editingPlan, team: Number(e.target.value) })}
                />
              </div>

              <div className="sub-form-field full">
                <label>الوصف الترويجي</label>
                <textarea
                  value={editingPlan.desc}
                  onChange={(e) => setEditingPlan({ ...editingPlan, desc: e.target.value })}
                  placeholder="وصف مختصر للباقة وميزاتها الأساسية..."
                />
              </div>

              <div className="sub-form-field full">
                <label>مستوى وأولوية الدعم والمساعدة</label>
                <select
                  value={editingPlan.support}
                  onChange={(e) => setEditingPlan({ ...editingPlan, support: e.target.value })}
                >
                  <option>خلال 48 ساعة</option>
                  <option>خلال 24 ساعة</option>
                  <option>أولوية قصوى — 24/7</option>
                </select>
              </div>
            </div>

            <div className="sub-stable-fields-note">
              الحقول أعلاه عامة للباقة. أما الأسعار، النقاط، والحدود فتُدار بشكل مستقل لكل دورة اشتراك أدناه:
            </div>

            {/* Cycle Selector (Monthly & Yearly) */}
            <div className="sub-cycle-selector">
              {['monthly', 'yearly'].map((cycleKey) => {
                const c = editingPlan.cycles[cycleKey];
                const isMonthly = cycleKey === 'monthly';

                return (
                  <div
                    key={cycleKey}
                    className={`sub-cycle-option ${c.enabled ? 'enabled' : ''}`}
                  >
                    <div
                      className="sub-cycle-option-head"
                      onClick={() => {
                        setEditingPlan({
                          ...editingPlan,
                          cycles: {
                            ...editingPlan.cycles,
                            [cycleKey]: { ...c, enabled: !c.enabled }
                          }
                        });
                      }}
                    >
                      <div className="sub-cycle-option-title">
                        <input
                          type="checkbox"
                          className="sub-cycle-check"
                          checked={c.enabled}
                          onChange={() => {}}
                        />
                        <div>
                          {isMonthly ? 'الاشتراك الشهري' : 'الاشتراك السنوي'}
                          <div className="sub-cycle-option-sub">
                            تفعيل وإدارة تفاصيل الدورة {isMonthly ? 'الشهرية' : 'السنوية'} بشكل مستقل.
                          </div>
                        </div>
                      </div>
                      <span className="sub-cycle-chevron">⌃</span>
                    </div>

                    {c.enabled && (
                      <div className="sub-cycle-panel">
                        <div className="sub-cycle-grid">
                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>السعر ({isMonthly ? 'شهري' : 'سنوي'})</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.price}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, price: val }
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>الحالات / الملفات الضريبية</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.cases}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, cases: val }
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>عدد النقاط</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.points}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, points: val }
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>التحميلات والطباعة</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.downloads}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, downloads: val }
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>الاستشارات المجانية</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.consultations}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, consultations: val }
                                  }
                                });
                              }}
                            />
                          </div>

                          <div className="sub-metric-field">
                            <div className="sub-metric-label-edit">
                              <label style={{ fontSize: '11px', fontWeight: '700' }}>أيام التجربة المجانية</label>
                            </div>
                            <input
                              type="number"
                              className="sub-value-input"
                              value={c.trialDays}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingPlan({
                                  ...editingPlan,
                                  cycles: {
                                    ...editingPlan.cycles,
                                    [cycleKey]: { ...c, trialDays: val }
                                  }
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feature Toggles */}
            <div className="sub-form-section">
              <h3>المزايا الإضافية</h3>
              <div className="sub-toggle-line">
                <div className="sub-toggle-copy">
                  <div className="t">الذكاء الاصطناعي (AI)</div>
                  <div className="s">تفعيل استخدام رصيد النقاط والبحث والتحليل الذكي ضمن هذه الباقة.</div>
                </div>
                <div
                  className={`sub-switch ${editingPlan.ai ? 'on' : ''}`}
                  onClick={() => setEditingPlan({ ...editingPlan, ai: !editingPlan.ai })}
                />
              </div>

              <div className="sub-toggle-line">
                <div className="sub-toggle-copy">
                  <div className="t">فترة تجريبية</div>
                  <div className="s">السماح بتجربة الباقة قبل بدء دورة الدفع الرسمية.</div>
                </div>
                <div
                  className={`sub-switch ${editingPlan.trial ? 'on' : ''}`}
                  onClick={() => setEditingPlan({ ...editingPlan, trial: !editingPlan.trial })}
                />
              </div>

              <div className="sub-toggle-line">
                <div className="sub-toggle-copy">
                  <div className="t">سياسة الاسترداد المالي</div>
                  <div className="s">تفعيل ضمان استرجاع الرسوم خلال 14 يوماً من الاشتراك.</div>
                </div>
                <div
                  className={`sub-switch ${editingPlan.refund ? 'on' : ''}`}
                  onClick={() => setEditingPlan({ ...editingPlan, refund: !editingPlan.refund })}
                />
              </div>
            </div>

            {/* General Settings */}
            <div className="sub-form-section">
              <h3>إعدادات النشر والعرض</h3>
              <div className="sub-toggle-line">
                <div className="sub-toggle-copy">
                  <div className="t">الباقة فعّالة</div>
                  <div className="s">إظهار الباقة للمستخدمين والعملاء والسماح بالاشتراك فيها.</div>
                </div>
                <div
                  className={`sub-switch ${editingPlan.active ? 'on' : ''}`}
                  onClick={() => setEditingPlan({ ...editingPlan, active: !editingPlan.active })}
                />
              </div>

              <div className="sub-toggle-line">
                <div className="sub-toggle-copy">
                  <div className="t">الباقة الافتراضية</div>
                  <div className="s">تعيينها كباقة افتراضية يحددها تلقائياً لأي عميل جديد.</div>
                </div>
                <div
                  className={`sub-switch ${editingPlan.default ? 'on' : ''}`}
                  onClick={() => setEditingPlan({ ...editingPlan, default: !editingPlan.default })}
                />
              </div>
            </div>

            <div className="sub-form-actions">
              <button className="sub-primary-btn" onClick={handleSavePlan}>
                حفظ التغييرات
              </button>
              <button className="sub-secondary-btn" onClick={() => setActiveTab('plans')}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: SUBSCRIBERS (الاشتراكات الحالية)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'subscribers' && (
        <div>
          <div className="sub-surface sub-toolbar">
            <div className="sub-toolbar-right">
              <div className="sub-search-box">
                <span className="mag">⌕</span>
                <input
                  placeholder="بحث باسم المشترك أو البريد..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                />
              </div>

              <select
                className="sub-control"
                value={subPlanFilter}
                onChange={(e) => setSubPlanFilter(e.target.value)}
              >
                <option value="all">كل الباقات</option>
                <option value="مجانية">مجانية</option>
                <option value="أساسية">أساسية</option>
                <option value="احترافية">احترافية</option>
              </select>

              <select
                className="sub-control"
                value={subLifecycleFilter}
                onChange={(e) => setSubLifecycleFilter(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="active">فعّال</option>
                <option value="renewal">بانتظار التجديد</option>
                <option value="payment">بانتظار الدفع</option>
                <option value="grace">فترة سماح</option>
                <option value="expiring">سينتهي قريبًا</option>
                <option value="scheduled">تغيير مجدول</option>
              </select>
            </div>

            <div className="sub-toolbar-left">
              <button
                className="sub-secondary-btn"
                onClick={() => {
                  const rows = filteredSubscribers.map((s) => [s.name, s.email, s.plan, s.cycle, s.life, s.start, s.end]);
                  exportCSV('subscribers_report', ['الاسم', 'البريد', 'الباقة', 'الدورة', 'الحالة', 'البداية', 'النهاية'], rows);
                }}
              >
                تصدير المشتركين
              </button>
            </div>
          </div>

          <div className="sub-surface">
            <div className="sub-table-wrap">
              <table className="sub-table">
                <thead>
                  <tr>
                    <th>المشترك</th>
                    <th>الباقة الحالية</th>
                    <th>نوع الاشتراك</th>
                    <th>الحالة</th>
                    <th>تاريخ البداية</th>
                    <th>تاريخ الانتهاء</th>
                    <th>النقاط المتبقية</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="sub-person-cell">
                          <div className="sub-avatar" style={{ background: '#3b9ed8' }}>
                            {s.name.charAt(0)}
                          </div>
                          <div className="sub-person-meta">
                            <span className="name">{s.name}</span>
                            <span className="email">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="sub-plan-badge">{s.plan}</span></td>
                      <td>{s.cycle}</td>
                      <td>
                        <span className={`sub-lifecycle-tag ${s.life}`}>
                          {s.life === 'active' ? 'فعّال' : s.life === 'renewal' ? 'بانتظار التجديد' : s.life === 'payment' ? 'بانتظار الدفع' : s.life === 'grace' ? 'فترة سماح' : s.life === 'expiring' ? 'سينتهي قريبًا' : 'تغيير مجدول'}
                        </span>
                      </td>
                      <td>{s.start}</td>
                      <td>{s.end}</td>
                      <td><strong>{s.pointsTotal - s.pointsUsed} / {s.pointsTotal}</strong></td>
                      <td>
                        <div className="sub-action-set">
                          <button
                            className="sub-small-icon"
                            onClick={() => setSelectedSubscriber(s)}
                            title="عرض التفاصيل"
                          >
                            ◉
                          </button>
                          <button
                            className="sub-small-icon green"
                            onClick={() => setUpgradeModal(s)}
                            title="ترقية / تغيير"
                          >
                            ↗
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: REQUESTS (طلبات الباقات مع دعم List, Cards, Kanban)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div>
          <div className="sub-surface sub-toolbar">
            <div className="sub-toolbar-right">
              <div className="sub-search-box">
                <span className="mag">⌕</span>
                <input
                  placeholder="بحث برقم الطلب أو الاسم..."
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                />
              </div>

              <select
                className="sub-control"
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="pending">معلّقة</option>
                <option value="approved">معتمدة</option>
                <option value="rejected">مرفوضة</option>
              </select>

              <select
                className="sub-control"
                value={reqPlanFilter}
                onChange={(e) => setReqPlanFilter(e.target.value)}
              >
                <option value="all">كل الباقات</option>
                <option value="مجانية">مجانية</option>
                <option value="أساسية">أساسية</option>
                <option value="احترافية">احترافية</option>
              </select>
            </div>

            <div className="sub-toolbar-left">
              <div className="sub-view-toggle">
                <button
                  className={`sub-view-btn ${requestView === 'list' ? 'active' : ''}`}
                  onClick={() => setRequestView('list')}
                  title="عرض القائمة"
                >
                  <svg viewBox="0 0 24 24"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
                </button>
                <button
                  className={`sub-view-btn ${requestView === 'cards' ? 'active' : ''}`}
                  onClick={() => setRequestView('cards')}
                  title="عرض البطاقات"
                >
                  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                </button>
                <button
                  className={`sub-view-btn ${requestView === 'kanban' ? 'active' : ''}`}
                  onClick={() => setRequestView('kanban')}
                  title="عرض الكانبان"
                >
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* List View */}
          {requestView === 'list' && (
            <div className="sub-surface">
              <div className="sub-table-wrap">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الاسم</th>
                      <th>الباقة</th>
                      <th>نوع الاشتراك</th>
                      <th>طريقة الدفع</th>
                      <th>القيمة</th>
                      <th>الحالة</th>
                      <th>تاريخ الطلب</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.requestNo}</td>
                        <td>
                          <div className="sub-person-cell">
                            <div className="sub-avatar" style={{ background: '#7a6bb3' }}>
                              {r.name.charAt(0)}
                            </div>
                            <div className="sub-person-meta">
                              <span className="name">{r.name}</span>
                              <span className="email">{r.email}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="sub-plan-badge">{r.plan}</span></td>
                        <td>{r.subscription}</td>
                        <td>{r.payment}</td>
                        <td><strong>{r.amount === 0 ? 'مجانية' : money(r.amount)}</strong></td>
                        <td>
                          <span className={`sub-status ${r.status}`}>
                            {r.status === 'approved' ? 'معتمدة' : r.status === 'pending' ? 'معلّقة' : 'مرفوضة'}
                          </span>
                        </td>
                        <td>{r.date}</td>
                        <td>
                          <div className="sub-action-set">
                            <button
                              className="sub-small-icon"
                              onClick={() => setSelectedRequest(r)}
                              title="عرض التفاصيل"
                            >
                              ◉
                            </button>
                            {r.payment !== 'باقة مجانية' && (
                              <button
                                className="sub-small-icon green"
                                onClick={() => setActiveReceipt(r)}
                                title="إثبات الدفع"
                              >
                                ▤
                              </button>
                            )}
                            {r.status === 'pending' && (
                              <>
                                <button
                                  className="sub-small-icon green"
                                  onClick={() => {
                                    setRequests((prev) =>
                                      prev.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x))
                                    );
                                    showToast('تم اعتماد الطلب بنجاح');
                                  }}
                                  title="اعتماد"
                                >
                                  ✓
                                </button>
                                <button
                                  className="sub-small-icon red"
                                  onClick={() => setRejectModalItem(r)}
                                  title="رفض"
                                >
                                  ×
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cards View */}
          {requestView === 'cards' && (
            <div className="sub-cards-view">
              {filteredRequests.map((r) => (
                <div key={r.id} className={`sub-request-card status-${r.status}`}>
                  <div className="sub-kc-accent" />
                  <div className="sub-kc-shell">
                    <div className="sub-kc-top">
                      <span className="sub-kc-type">▤ طلب باقة</span>
                      <span className="sub-kc-ref">{r.requestNo}</span>
                    </div>

                    <div className="sub-kc-title">{r.name}</div>
                    <div className="sub-kc-person">{r.plan} • {r.subscription}</div>

                    <div className="sub-kc-info">
                      <div className="sub-kc-mini"><div className="k">طريقة الدفع</div><div className="v">{r.payment}</div></div>
                      <div className="sub-kc-mini"><div className="k">القيمة</div><div className="v">{r.amount === 0 ? 'مجانية' : money(r.amount)}</div></div>
                    </div>

                    <div className="sub-kc-foot">
                      <div>
                        <span className={`sub-status ${r.status}`}>
                          {r.status === 'approved' ? 'معتمدة' : r.status === 'pending' ? 'معلّقة' : 'مرفوضة'}
                        </span>
                        <div className="sub-kc-date">{r.date}</div>
                      </div>
                      <div className="sub-kc-actions">
                        <button className="sub-kc-icon" onClick={() => setSelectedRequest(r)} title="عرض">
                          <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        {r.payment !== 'باقة مجانية' && (
                          <button className="sub-kc-icon" onClick={() => setActiveReceipt(r)} title="إثبات الدفع">
                            <svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 7h6" /><path d="M9 11h6" /></svg>
                          </button>
                        )}
                        {r.status === 'pending' && (
                          <>
                            <button
                              className="sub-kc-icon green"
                              onClick={() => {
                                setRequests((prev) =>
                                  prev.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x))
                                );
                                showToast('تم اعتماد الطلب');
                              }}
                              title="اعتماد"
                            >
                              <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
                            </button>
                            <button className="sub-kc-icon red" onClick={() => setRejectModalItem(r)} title="رفض">
                              <svg viewBox="0 0 24 24"><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kanban View */}
          {requestView === 'kanban' && (
            <div className="sub-kanban">
              {[
                { status: 'pending', label: 'معلّقة' },
                { status: 'approved', label: 'معتمدة' },
                { status: 'rejected', label: 'مرفوضة' }
              ].map((col) => {
                const items = filteredRequests.filter((r) => r.status === col.status);
                return (
                  <div
                    key={col.status}
                    className="sub-kan-col"
                    data-status={col.status}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = Number(e.dataTransfer.getData('id'));
                      setRequests((prev) =>
                        prev.map((x) => (x.id === id ? { ...x, status: col.status } : x))
                      );
                      showToast(`تم تغيير حالة الطلب إلى ${col.label}`);
                    }}
                  >
                    <div className="sub-kan-head">
                      <span>{col.label}</span>
                      <span className="sub-kan-count">{items.length}</span>
                    </div>

                    <div className="sub-kan-body">
                      {items.map((r) => (
                        <div
                          key={r.id}
                          className={`sub-kan-card status-${r.status}`}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('id', r.id)}
                        >
                          <div className="sub-kc-shell">
                            <div className="sub-kc-top">
                              <span className="sub-kc-type">▤ {r.requestNo}</span>
                              <span className="sub-kc-ref">{money(r.amount)}</span>
                            </div>
                            <div className="sub-kc-title">{r.name}</div>
                            <div className="sub-kc-person">{r.plan} • {r.subscription}</div>
                            <div className="sub-kc-foot">
                              <span className="sub-kc-date">{r.date}</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="sub-kc-icon" onClick={() => setSelectedRequest(r)}>
                                  <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                                </button>
                                {r.payment !== 'باقة مجانية' && (
                                  <button className="sub-kc-icon" onClick={() => setActiveReceipt(r)}>
                                    <svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 7h6" /><path d="M9 11h6" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 5: ORDERS (أوامر الاشتراك)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div>
          <div className="sub-surface sub-toolbar">
            <div className="sub-toolbar-right">
              <div className="sub-search-box">
                <span className="mag">⌕</span>
                <input
                  placeholder="بحث برقم الأمر..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <select
                className="sub-control"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="pending">معلّقة</option>
                <option value="approved">معتمدة</option>
                <option value="rejected">مرفوضة</option>
              </select>

              <input
                type="date"
                className="sub-control"
                value={orderDateFrom}
                onChange={(e) => setOrderDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="sub-control"
                value={orderDateTo}
                onChange={(e) => setOrderDateTo(e.target.value)}
              />
            </div>

            <div className="sub-toolbar-left">
              <div className="sub-view-toggle">
                <button
                  className={`sub-view-btn ${orderView === 'list' ? 'active' : ''}`}
                  onClick={() => setOrderView('list')}
                  title="عرض القائمة"
                >
                  <svg viewBox="0 0 24 24"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
                </button>
                <button
                  className={`sub-view-btn ${orderView === 'cards' ? 'active' : ''}`}
                  onClick={() => setOrderView('cards')}
                  title="عرض البطاقات"
                >
                  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                </button>
                <button
                  className={`sub-view-btn ${orderView === 'kanban' ? 'active' : ''}`}
                  onClick={() => setOrderView('kanban')}
                  title="عرض الكانبان"
                >
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="sub-surface">
            <div className="sub-table-wrap">
              <table className="sub-table">
                <thead>
                  <tr>
                    <th>رقم الأمر</th>
                    <th>الاسم</th>
                    <th>الباقة</th>
                    <th>نوع الاشتراك</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>الحالة</th>
                    <th>إثبات الدفع</th>
                    <th>التاريخ</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.orderNo}</strong></td>
                      <td>{o.name}</td>
                      <td><span className="sub-plan-badge">{o.plan}</span></td>
                      <td>{o.subscription}</td>
                      <td><strong>{money(o.amount)}</strong></td>
                      <td>{o.payment}</td>
                      <td>
                        <span className={`sub-status ${o.status}`}>
                          {o.status === 'approved' ? 'معتمدة' : o.status === 'pending' ? 'معلّقة' : 'مرفوضة'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sub-small-icon green"
                          onClick={() => setActiveReceipt(o)}
                          title="معاينة إثبات الدفع"
                        >
                          ▤
                        </button>
                      </td>
                      <td>{o.date}</td>
                      <td>
                        <button
                          className="sub-small-icon"
                          onClick={() => setSelectedOrder(o)}
                          title="تفاصيل"
                        >
                          ◉
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 6: VERSIONS (إصدارات الباقات والترحيل)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'versions' && (
        <div className="sub-surface sub-form-wrap">
          <div className="sub-page-head" style={{ marginBottom: '16px' }}>
            <div className="sub-head-copy">
              <h1>إصدارات الباقات وترحيل المشتركين</h1>
              <p>قارن بين الإصدارات، واعرف المشتركين، وانقلهم إلى الإصدار الأحدث بسلاسة.</p>
            </div>
            <button className="sub-primary-btn" onClick={() => setNewVersionModal(true)}>
              ＋ إصدار جديد
            </button>
          </div>

          <div className="sub-version-list">
            {versions.map((v, idx) => {
              const membersCount = subscribers.filter(
                (s) => s.plan === v.plan && s.planVersion === v.version
              ).length;

              return (
                <div key={idx} className="sub-version-row">
                  <div>
                    <div className="sub-version-title">{v.plan} — {v.version}</div>
                    <div className="sub-version-sub">{v.date} • {v.scope}</div>
                    <div className="sub-version-sub" style={{ marginTop: '5px', color: '#41505b' }}>{v.changes}</div>
                    <div style={{ marginTop: '8px' }}>
                      <span
                        className="sub-save-badge"
                        style={{ background: '#2e7cf6', cursor: 'pointer' }}
                        onClick={() => setVersionMembersModal(v)}
                      >
                        {membersCount} مشترك مسجل
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="sub-secondary-btn"
                      onClick={() => setVersionMembersModal(v)}
                    >
                      المشتركون
                    </button>
                    <button
                      className="sub-secondary-btn"
                      onClick={() => {
                        setComparePlan(v.plan);
                        const otherVersions = versions.filter((x) => x.plan === v.plan).map((x) => x.version);
                        setCompareA(v.version);
                        setCompareB(otherVersions.find((x) => x !== v.version) || v.version);
                        setVersionCompareModal(v);
                      }}
                    >
                      مقارنة
                    </button>
                    <button
                      className="sub-primary-btn"
                      onClick={() => setMigrationModal(v)}
                    >
                      ترحيل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS SECTION (12 Interactive Modals with Full Functionality)
          ══════════════════════════════════════════════════════════════════ */}

      {/* Modal 1: Subscriber Details (Matching Screenshot Exactly) */}
      {selectedSubscriber && (
        <div className="sub-overlay show" onClick={() => setSelectedSubscriber(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">تفاصيل الاشتراك</div>
              <button className="sub-modal-close" onClick={() => setSelectedSubscriber(null)}>×</button>
            </div>

            <div className="sub-modal-body">
              {/* Top Hero Banner */}
              <div className="sub-details-hero">
                <div className="sub-details-main">
                  <div className="sub-details-avatar" style={{ background: '#3b9ed8' }}>
                    {selectedSubscriber.name.charAt(0)}
                  </div>
                  <div className="sub-details-title-wrap">
                    <div className="sub-details-name">{selectedSubscriber.name}</div>
                    <div className="sub-details-email">{selectedSubscriber.email}</div>
                    <div className="sub-details-ref">{selectedSubscriber.plan} • {selectedSubscriber.cycle}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span className={`sub-lifecycle-tag ${selectedSubscriber.life}`}>
                    {selectedSubscriber.life === 'active' ? 'فعّال' : selectedSubscriber.life}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    ينتهي: {selectedSubscriber.end}
                  </div>
                </div>
              </div>

              {/* Free Trial Banner (if applicable or present) */}
              {selectedSubscriber.trialInfo && (
                <div className="sub-trial-badge-banner">
                  {selectedSubscriber.trialInfo}
                </div>
              )}

              {/* 4 Usage Cards in Row */}
              <div className="sub-usage-grid">
                {[
                  { key: 'points', label: 'النقاط', icon: '✦', used: selectedSubscriber.pointsUsed, total: selectedSubscriber.pointsTotal, unit: 'نقطة', desc: 'تفاصيل أين ومتى تم استهلاك رصيد النقاط الذكية.' },
                  { key: 'downloads', label: 'التحميل والطباعة', icon: '⇩', used: selectedSubscriber.downloadsUsed, total: selectedSubscriber.downloadsTotal, unit: 'عملية', desc: 'المستندات والنماذج التي تم تحميلها أو طباعتها مع التاريخ.' },
                  { key: 'consultations', label: 'الاستشارات المجانية', icon: '◎', used: selectedSubscriber.consultUsed, total: selectedSubscriber.consultTotal, unit: 'استشارة', desc: 'سجل الجلسات الاستشارية المنجزة مع مستشاري المنصة.' },
                  { key: 'team', label: 'أعضاء الفريق', icon: '👥', used: selectedSubscriber.teamUsed, total: selectedSubscriber.teamTotal, unit: 'عضو', desc: 'أعضاء الفريق المسجلين وأدوارهم الإدارية والمالية.' }
                ].map((u) => {
                  const pWidth = Math.round((u.used / (u.total || 1)) * 100);
                  return (
                    <div
                      key={u.key}
                      className="sub-usage-card"
                      onClick={() => setResourceLogModal({ sub: selectedSubscriber, type: u.key, info: u })}
                    >
                      <div className="sub-usage-head">
                        <div>
                          <div className="sub-usage-label">{u.label}</div>
                          <div className="sub-usage-number">{u.total} / {u.used}</div>
                        </div>
                        <div className={`sub-usage-icon-box ${u.key === 'team' ? 'purple' : 'blue'}`}>{u.icon}</div>
                      </div>
                      <div className="sub-usage-bar">
                        <span style={{ width: `${pWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom 2 Equal Columns Grid (دورة حياة الاشتراك & سجل الاشتراك) */}
              <div className="sub-modal-twin-grid">
                {/* Column 1: دورة حياة الاشتراك */}
                <div className="sub-details-section">
                  <div className="sub-details-section-title">دورة حياة الاشتراك</div>
                  <div className="sub-details-grid-v2">
                    <div className="sub-detail-cell"><div className="k">تاريخ البداية</div><div className="v">{selectedSubscriber.start}</div></div>
                    <div className="sub-detail-cell"><div className="k">تاريخ الانتهاء</div><div className="v">{selectedSubscriber.end}</div></div>
                    <div className="sub-detail-cell"><div className="k">التجديد القادم</div><div className="v">{selectedSubscriber.renew}</div></div>
                    <div className="sub-detail-cell"><div className="k">التغيير المجدول</div><div className="v">{selectedSubscriber.scheduled}</div></div>
                  </div>

                  <div className="sub-details-actions">
                    <button className="sub-subscription-action" onClick={() => setUpgradeModal(selectedSubscriber)}>
                      ترقية / تخفيض
                    </button>
                    <button className="sub-subscription-action" onClick={() => setOverrideModal(selectedSubscriber)}>
                      استثناء إداري
                    </button>
                    <button className="sub-subscription-action" onClick={() => setHistoryModal(selectedSubscriber)}>
                      السجل الكامل
                    </button>
                    <button className="sub-subscription-action" onClick={() => handleOpenNotificationModal(selectedSubscriber)}>
                      إرسال إشعار
                    </button>
                  </div>
                </div>

                {/* Column 2: سجل الاشتراك */}
                <div className="sub-details-section">
                  <div className="sub-details-section-title">سجل الاشتراك</div>
                  <div className="sub-modal-timeline-wrap">
                    {selectedSubscriber.history.map((h, i) => (
                      <div key={i} className="sub-timeline-step-row">
                        <span className="sub-timeline-step-dot" />
                        <div>
                          <div className="sub-timeline-step-title">{h.t}</div>
                          <div className="sub-timeline-step-sub">{h.d} • {h.p}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Request Details Modal */}
      {selectedRequest && (
        <div className="sub-overlay show" onClick={() => setSelectedRequest(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">تفاصيل طلب الباقة — {selectedRequest.requestNo}</div>
              <button className="sub-modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-details-hero">
                <div className="sub-details-main">
                  <div className="sub-details-avatar" style={{ background: '#7a6bb3' }}>
                    {selectedRequest.name.charAt(0)}
                  </div>
                  <div className="sub-details-title-wrap">
                    <div className="sub-details-name">{selectedRequest.name}</div>
                    <div className="sub-details-email">{selectedRequest.email}</div>
                    <div className="sub-details-ref">{selectedRequest.requestNo}</div>
                  </div>
                </div>
                <span className={`sub-status ${selectedRequest.status}`}>
                  {selectedRequest.status === 'approved' ? 'معتمدة' : selectedRequest.status === 'pending' ? 'معلّقة' : 'مرفوضة'}
                </span>
              </div>

              <div className="sub-details-section">
                <div className="sub-details-section-title">بيانات الاشتراك والدفع</div>
                <div className="sub-details-grid-v2">
                  <div className="sub-detail-cell"><div className="k">الباقة المطلوبة</div><div className="v">{selectedRequest.plan}</div></div>
                  <div className="sub-detail-cell"><div className="k">نوع الاشتراك</div><div className="v">{selectedRequest.subscription}</div></div>
                  <div className="sub-detail-cell"><div className="k">طريقة الدفع</div><div className="v">{selectedRequest.payment}</div></div>
                  <div className="sub-detail-cell"><div className="k">المبلغ الإجمالي</div><div className="v">{selectedRequest.amount === 0 ? 'مجانية' : money(selectedRequest.amount)}</div></div>
                  <div className="sub-detail-cell"><div className="k">تاريخ الطلب</div><div className="v">{selectedRequest.date}</div></div>
                  <div className="sub-detail-cell"><div className="k">وقت الطلب</div><div className="v">{selectedRequest.time}</div></div>
                </div>
              </div>

              {selectedRequest.isFreeGrant && (
                <div className="sub-stable-fields-note" style={{ background: '#eef8f4', borderColor: '#c8ebdc', color: '#0b7f5d' }}>
                  <strong>تفاصيل المنحة الإدارية:</strong> تم منح الباقة بواسطة ({selectedRequest.grantedBy}) بسبب ({selectedRequest.grantReason}) لمدة ({selectedRequest.grantDuration}).
                </div>
              )}

              {selectedRequest.rejectReason && (
                <div className="sub-stable-fields-note" style={{ background: '#fff0f3', borderColor: '#ffc0ce', color: '#d41e48' }}>
                  <strong>سبب الرفض:</strong> {selectedRequest.rejectReason}
                </div>
              )}
            </div>
            <div className="sub-modal-foot">
              {selectedRequest.payment !== 'باقة مجانية' && (
                <button className="sub-secondary-btn" onClick={() => { setActiveReceipt(selectedRequest); setSelectedRequest(null); }}>
                  معاينة إثبات الدفع
                </button>
              )}
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    className="sub-primary-btn"
                    onClick={() => {
                      setRequests((prev) => prev.map((x) => (x.id === selectedRequest.id ? { ...x, status: 'approved' } : x)));
                      setSelectedRequest(null);
                      showToast('تم اعتماد الطلب');
                    }}
                  >
                    اعتماد الطلب
                  </button>
                  <button
                    className="sub-danger-btn"
                    onClick={() => {
                      setRejectModalItem(selectedRequest);
                      setSelectedRequest(null);
                    }}
                  >
                    رفض الطلب
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Order Details Modal */}
      {selectedOrder && (
        <div className="sub-overlay show" onClick={() => setSelectedOrder(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">تفاصيل أمر الاشتراك — {selectedOrder.orderNo}</div>
              <button className="sub-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-details-hero">
                <div className="sub-details-main">
                  <div className="sub-details-avatar" style={{ background: '#0a8d67' }}>
                    {selectedOrder.name.charAt(0)}
                  </div>
                  <div className="sub-details-title-wrap">
                    <div className="sub-details-name">{selectedOrder.name}</div>
                    <div className="sub-details-email">{selectedOrder.email}</div>
                    <div className="sub-details-ref">{selectedOrder.orderNo}</div>
                  </div>
                </div>
                <span className={`sub-status ${selectedOrder.status}`}>
                  {selectedOrder.status === 'approved' ? 'معتمدة' : selectedOrder.status === 'pending' ? 'معلّقة' : 'مرفوضة'}
                </span>
              </div>

              <div className="sub-details-section">
                <div className="sub-details-section-title">بيانات العملية المالية</div>
                <div className="sub-details-grid-v2">
                  <div className="sub-detail-cell"><div className="k">الباقة</div><div className="v">{selectedOrder.plan}</div></div>
                  <div className="sub-detail-cell"><div className="k">نوع الاشتراك</div><div className="v">{selectedOrder.subscription}</div></div>
                  <div className="sub-detail-cell"><div className="k">طريقة الدفع</div><div className="v">{selectedOrder.payment}</div></div>
                  <div className="sub-detail-cell"><div className="k">المبلغ المدفوع</div><div className="v">{money(selectedOrder.amount)}</div></div>
                  <div className="sub-detail-cell"><div className="k">الخصم السنوي</div><div className="v">{selectedOrder.yearlyDiscount ? `${selectedOrder.yearlyDiscount}%` : '—'}</div></div>
                  <div className="sub-detail-cell"><div className="k">التاريخ والوقت</div><div className="v">{selectedOrder.date} {selectedOrder.time}</div></div>
                </div>
              </div>
            </div>
            <div className="sub-modal-foot">
              <button className="sub-secondary-btn" onClick={() => { setActiveReceipt(selectedOrder); setSelectedOrder(null); }}>
                معاينة إثبات الدفع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Receipt Preview */}
      {activeReceipt && (
        <div className="sub-overlay show" onClick={() => setActiveReceipt(null)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">معاينة إثبات الدفع</div>
              <button className="sub-modal-close" onClick={() => setActiveReceipt(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-receipt">
                <div className="sub-receipt-head">
                  <div>
                    <div className="sub-receipt-brand">{activeReceipt.payment}</div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>إشعار دفع معتمد</div>
                  </div>
                  <div>{activeReceipt.orderNo || activeReceipt.requestNo}</div>
                </div>
                <div className="sub-receipt-body">
                  <div className="sub-receipt-row"><span className="k">اسم المشترك</span><span>{activeReceipt.name}</span></div>
                  <div className="sub-receipt-row"><span className="k">الباقة</span><span>{activeReceipt.plan} — {activeReceipt.subscription}</span></div>
                  <div className="sub-receipt-row"><span className="k">القيمة</span><span>{money(activeReceipt.amount)}</span></div>
                  <div className="sub-receipt-row"><span className="k">طريقة الدفع</span><span>{activeReceipt.payment}</span></div>
                  <div className="sub-receipt-row"><span className="k">التاريخ</span><span>{activeReceipt.date}</span></div>
                </div>
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  const ref = activeReceipt.orderNo || activeReceipt.requestNo;
                  const content = `PAYMENT PROOF / إثبات دفع\nOrder: ${ref}\nName: ${activeReceipt.name}\nPlan: ${activeReceipt.plan}\nAmount: ${activeReceipt.amount} JOD\nDate: ${activeReceipt.date}`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `receipt-${ref}.txt`;
                  a.click();
                  showToast('تم تحميل الإيصال المالي');
                }}
              >
                تحميل الإيصال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Rejection Reason */}
      {rejectModalItem && (
        <div className="sub-overlay show" onClick={() => setRejectModalItem(null)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">رفض الطلب — {rejectModalItem.requestNo || rejectModalItem.orderNo}</div>
              <button className="sub-modal-close" onClick={() => setRejectModalItem(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <p style={{ fontSize: '12.5px', fontWeight: '700' }}>حدد سبب الرفض:</p>
              <select className="sub-control" style={{ width: '100%', marginBottom: '12px' }} id="rejectReasonSelect">
                <option>لم يتم استلام الدفعة</option>
                <option>إثبات الدفع غير واضح</option>
                <option>قيمة التحويل غير مطابقة</option>
                <option>بيانات الطلب غير مكتملة</option>
                <option>سبب إداري آخر</option>
              </select>
              <textarea
                className="sub-form-field textarea"
                style={{ width: '100%', height: '80px', padding: '10px' }}
                placeholder="ملاحظات توضيحية للعميل..."
                id="rejectNoteText"
              />
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-danger-btn"
                onClick={() => {
                  const sel = document.getElementById('rejectReasonSelect')?.value || 'تم الرفض';
                  const note = document.getElementById('rejectNoteText')?.value || '';
                  setRequests((prev) =>
                    prev.map((x) => (x.id === rejectModalItem.id ? { ...x, status: 'rejected', rejectReason: `${sel} - ${note}` } : x))
                  );
                  setRejectModalItem(null);
                  showToast('تم رفض الطلب وتوثيق السبب');
                }}
              >
                تأكيد الرفض
              </button>
              <button className="sub-secondary-btn" onClick={() => setRejectModalItem(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Notification Composer */}
      {notificationModal && (
        <div className="sub-overlay show" onClick={() => setNotificationModal(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">إرسال إشعار — {notificationModal.name}</div>
              <button className="sub-modal-close" onClick={() => setNotificationModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {NOTIFICATION_TYPES.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      border: notificationType === t.id ? '2px solid var(--green)' : '1px solid #dce3e8',
                      background: notificationType === t.id ? '#f1fcf7' : '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectNotificationType(t.id)}
                  >
                    <strong style={{ fontSize: '11px', display: 'block' }}>{t.title}</strong>
                    <span style={{ fontSize: '9.5px', color: '#7a8791' }}>{t.sub}</span>
                  </div>
                ))}
              </div>

              <div className="sub-form-field">
                <label>عنوان الإشعار</label>
                <input
                  value={notificationSubject}
                  onChange={(e) => setNotificationSubject(e.target.value)}
                  placeholder="عنوان الرسالة..."
                />
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>نص الرسالة</label>
                <textarea
                  style={{ height: '110px' }}
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="نص الإشعار المرسل للمشترك..."
                />
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  setNotificationModal(null);
                  showToast(`تم إرسال الإشعار بنجاح إلى ${notificationModal.name}`);
                }}
              >
                إرسال الإشعار
              </button>
              <button className="sub-secondary-btn" onClick={() => setNotificationModal(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Admin Override */}
      {overrideModal && (
        <div className="sub-overlay show" onClick={() => setOverrideModal(null)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">استثناء إداري — {overrideModal.name}</div>
              <button className="sub-modal-close" onClick={() => setOverrideModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-form-field">
                <label>نوع الاستثناء</label>
                <select className="sub-control" style={{ width: '100%' }} id="overrideTypeSel">
                  <option>إضافة رصيد نقاط</option>
                  <option>تمديد فترة الاشتراك</option>
                  <option>منح استشارة مجانية إضافية</option>
                  <option>رفع حد التحميل مؤقتاً</option>
                </select>
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>القيمة / المدة</label>
                <input placeholder="مثال: 500 نقطة أو 14 يوماً" id="overrideValInput" />
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>سبب المنح الإداري</label>
                <textarea placeholder="سبب وتفاصيل الاستثناء..." id="overrideReasonInput" />
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  const type = document.getElementById('overrideTypeSel')?.value || 'استثناء';
                  const val = document.getElementById('overrideValInput')?.value || '';
                  if (type === 'إضافة رصيد نقاط') {
                    const added = parseInt(val) || 500;
                    setSubscribers((prev) =>
                      prev.map((s) => (s.id === overrideModal.id ? { ...s, pointsTotal: s.pointsTotal + added } : s))
                    );
                  }
                  setOverrideModal(null);
                  showToast('تم حفظ الاستثناء الإداري وتحديث الرصيد');
                }}
              >
                حفظ الاستثناء
              </button>
              <button className="sub-secondary-btn" onClick={() => setOverrideModal(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Resource Usage Log Modal */}
      {resourceLogModal && (
        <div className="sub-overlay show" onClick={() => setResourceLogModal(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">
                سجل الاستخدام — {resourceLogModal.info.label} ({resourceLogModal.sub.name})
              </div>
              <button className="sub-modal-close" onClick={() => setResourceLogModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '800' }}>{resourceLogModal.info.desc}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '6px', color: 'var(--green)' }}>
                  المستهلك: {resourceLogModal.info.used} من أصل {resourceLogModal.info.total} {resourceLogModal.info.unit}
                </div>
              </div>

              <div className="sub-timeline">
                {(resourceLogModal.sub.usageLogs[resourceLogModal.type] || []).map((log, idx) => (
                  <div key={idx} className="sub-timeline-item">
                    <span className="sub-timeline-dot" />
                    <div className="sub-timeline-title">{log.title}</div>
                    <div style={{ fontSize: '11px', color: '#52606c', marginTop: '3px' }}>{log.desc}</div>
                    <div className="sub-timeline-meta">{log.date}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  const logs = resourceLogModal.sub.usageLogs[resourceLogModal.type] || [];
                  const rows = logs.map((l) => [l.title, l.desc, l.date, l.badge]);
                  exportCSV(`usage_${resourceLogModal.type}_${resourceLogModal.sub.id}`, ['العنوان', 'التفاصيل', 'التاريخ', 'التصنيف'], rows);
                }}
              >
                تصدير السجل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 9: Upgrade / Downgrade Modal */}
      {upgradeModal && (
        <div className="sub-overlay show" onClick={() => setUpgradeModal(null)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">تغيير الباقة — {upgradeModal.name}</div>
              <button className="sub-modal-close" onClick={() => setUpgradeModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <p style={{ fontSize: '12px', fontWeight: '700' }}>اختر الباقة الجديدة وطريقة التطبيق:</p>
              <div className="sub-form-field">
                <label>الباقة المستهدفة</label>
                <select className="sub-control" style={{ width: '100%' }} id="targetPlanSel">
                  <option value="احترافية">احترافية</option>
                  <option value="أساسية">أساسية</option>
                  <option value="مجانية">مجانية</option>
                </select>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="radio" name="upgradeMode" defaultChecked value="immediate" />
                  <strong>تطبيق فوري (ترقية فورية للرصيد والمزايا)</strong>
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', cursor: 'pointer', marginTop: '8px' }}>
                  <input type="radio" name="upgradeMode" value="renewal" />
                  <span>تطبيق عند التجديد القادم (نهاية الدورة الحالية)</span>
                </label>
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  const p = document.getElementById('targetPlanSel')?.value || 'احترافية';
                  setSubscribers((prev) =>
                    prev.map((s) => (s.id === upgradeModal.id ? { ...s, plan: p } : s))
                  );
                  setUpgradeModal(null);
                  showToast(`تم تحديث باقة المشترك إلى ${p}`);
                }}
              >
                تأكيد التغيير
              </button>
              <button className="sub-secondary-btn" onClick={() => setUpgradeModal(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 10: Version Compare Modal (Dynamic Selection & Grid) */}
      {versionCompareModal && (
        <div className="sub-overlay show" onClick={() => setVersionCompareModal(null)}>
          <div className="sub-modal xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">مقارنة إصدارات الباقة</div>
              <button className="sub-modal-close" onClick={() => setVersionCompareModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div className="sub-form-field" style={{ minWidth: '170px' }}>
                  <label>الباقة</label>
                  <select
                    className="sub-control"
                    style={{ width: '100%' }}
                    value={comparePlan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setComparePlan(p);
                      const vers = versions.filter((v) => v.plan === p).map((v) => v.version);
                      if (vers.length > 0) {
                        setCompareA(vers[vers.length - 1]);
                        setCompareB(vers[0]);
                      }
                    }}
                  >
                    {[...new Set(versions.map((v) => v.plan))].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="sub-form-field" style={{ minWidth: '170px' }}>
                  <label>الإصدار الأول</label>
                  <select
                    className="sub-control"
                    style={{ width: '100%' }}
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                  >
                    {versions.filter((v) => v.plan === comparePlan).map((v) => (
                      <option key={v.version} value={v.version}>{v.version}</option>
                    ))}
                  </select>
                </div>

                <div className="sub-form-field" style={{ minWidth: '170px' }}>
                  <label>الإصدار الثاني</label>
                  <select
                    className="sub-control"
                    style={{ width: '100%' }}
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                  >
                    {versions.filter((v) => v.plan === comparePlan).map((v) => (
                      <option key={v.version} value={v.version}>{v.version}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="sub-primary-btn"
                  onClick={() => {
                    showToast('تم تحديث جدول المقارنة');
                  }}
                >
                  مقارنة
                </button>
              </div>

              {(() => {
                const ra = VERSION_RULES[comparePlan]?.[compareA];
                const rb = VERSION_RULES[comparePlan]?.[compareB];

                if (!ra || !rb) {
                  return (
                    <div className="sub-stable-fields-note">
                      لا توجد بيانات مقارنة كافية لهذين الإصدارين.
                    </div>
                  );
                }

                const fields = [
                  ['السعر الشهري', 'priceMonthly', (v) => money(v)],
                  ['السعر السنوي', 'priceYearly', (v) => money(v)],
                  ['عدد النقاط', 'points', (v) => v],
                  ['التحميل والطباعة', 'downloads', (v) => v],
                  ['الاستشارات المجانية', 'consultations', (v) => v],
                  ['أعضاء الفريق', 'team', (v) => v],
                  ['الدعم والمساعدة', 'support', (v) => v]
                ];

                return (
                  <div className="sub-compare-grid">
                    <div className="sub-compare-head">العنصر</div>
                    <div className="sub-compare-head">{compareA}</div>
                    <div className="sub-compare-head">{compareB}</div>

                    {fields.map(([label, key, fmt], idx) => {
                      const va = ra[key];
                      const vb = rb[key];
                      const diff = va !== vb;

                      return (
                        <React.Fragment key={idx}>
                          <div className={`sub-compare-label ${diff ? 'sub-compare-diff' : ''}`}>
                            {label}
                          </div>
                          <div className={diff ? 'sub-compare-diff' : ''}>
                            {fmt(va)}
                          </div>
                          <div className={diff ? 'sub-compare-diff sub-compare-better' : ''}>
                            {fmt(vb)}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal 11: Version Members Modal */}
      {versionMembersModal && (
        <div className="sub-overlay show" onClick={() => setVersionMembersModal(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">
                المشتركون على باقة {versionMembersModal.plan} ({versionMembersModal.version})
              </div>
              <button className="sub-modal-close" onClick={() => setVersionMembersModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-table-wrap">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>المشترك</th>
                      <th>الدورة</th>
                      <th>الحالة</th>
                      <th>نهاية الاشتراك</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers
                      .filter((s) => s.plan === versionMembersModal.plan && s.planVersion === versionMembersModal.version)
                      .map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.cycle}</td>
                          <td><span className={`sub-lifecycle-tag ${s.life}`}>{s.life}</span></td>
                          <td>{s.end}</td>
                          <td>
                            <button
                              className="sub-small-icon"
                              onClick={() => {
                                setVersionMembersModal(null);
                                setSelectedSubscriber(s);
                              }}
                            >
                              ◉
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 12: Migration Wizard Modal */}
      {migrationModal && (
        <div className="sub-overlay show" onClick={() => setMigrationModal(null)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">ترحيل المشتركين — {migrationModal.plan}</div>
              <button className="sub-modal-close" onClick={() => setMigrationModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-form-field">
                <label>الإصدار المصدر</label>
                <input disabled value={`${migrationModal.plan} — ${migrationModal.version}`} />
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>الإصدار الهدف</label>
                <select className="sub-control" style={{ width: '100%' }}>
                  <option>v2.0 (الإصدار الأحدث)</option>
                </select>
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>طريقة الترحيل</label>
                <select className="sub-control" style={{ width: '100%' }}>
                  <option>ترحيل فوري لجميع المشتركين</option>
                  <option>ترحيل عند حلول موعد التجديد القادم</option>
                </select>
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  setSubscribers((prev) =>
                    prev.map((s) =>
                      s.plan === migrationModal.plan ? { ...s, planVersion: 'v2.0' } : s
                    )
                  );
                  setMigrationModal(null);
                  showToast('تم ترحيل المشتركين بنجاح');
                }}
              >
                تنفيذ الترحيل
              </button>
              <button className="sub-secondary-btn" onClick={() => setMigrationModal(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 13: Drilldown KPI Analytics Modal */}
      {drilldownModal && (
        <div className="sub-overlay show" onClick={() => setDrilldownModal(null)}>
          <div className="sub-modal xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">{drilldownModal.title}</div>
              <button className="sub-modal-close" onClick={() => setDrilldownModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                <input
                  className="sub-search-box"
                  style={{ width: '220px', height: '36px', border: '1px solid #d1d9e0', borderRadius: '6px', padding: '0 10px' }}
                  placeholder="بحث بالاسم أو البريد..."
                  value={drillSearch}
                  onChange={(e) => setDrillSearch(e.target.value)}
                />
                <select
                  className="sub-control"
                  value={drillPlanFilter}
                  onChange={(e) => setDrillPlanFilter(e.target.value)}
                >
                  <option value="all">كل الباقات</option>
                  <option value="مجانية">مجانية</option>
                  <option value="أساسية">أساسية</option>
                  <option value="احترافية">احترافية</option>
                </select>
                <select
                  className="sub-control"
                  value={drillCycleFilter}
                  onChange={(e) => setDrillCycleFilter(e.target.value)}
                >
                  <option value="all">شهري وسنوي</option>
                  <option value="شهري">شهري</option>
                  <option value="سنوي">سنوي</option>
                </select>
                <button
                  className="sub-secondary-btn"
                  onClick={() => {
                    setDrillSearch('');
                    setDrillPlanFilter('all');
                    setDrillCycleFilter('all');
                  }}
                >
                  إعادة ضبط
                </button>
              </div>

              <div className="sub-table-wrap">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>البريد</th>
                      <th>الباقة</th>
                      <th>الدورة</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrilldownRows.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.email}</td>
                        <td><span className="sub-plan-badge">{r.plan}</span></td>
                        <td>{r.cycle}</td>
                        <td><span className={`sub-lifecycle-tag ${r.life}`}>{r.life}</span></td>
                        <td>{r.end || r.date}</td>
                        <td>
                          <button
                            className="sub-small-icon"
                            onClick={() => {
                              setDrilldownModal(null);
                              setSelectedSubscriber(r);
                            }}
                          >
                            ◉
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sub-modal-foot" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                عرض {filteredDrilldownRows.length} مشترك
              </span>
              <button
                className="sub-secondary-btn"
                onClick={() => {
                  const rows = filteredDrilldownRows.map((r) => [r.name, r.email, r.plan, r.cycle, r.life, r.end || r.date]);
                  exportCSV('drilldown_analytics', ['الاسم', 'البريد', 'الباقة', 'الدورة', 'الحالة', 'التاريخ'], rows);
                }}
              >
                تصدير النتائج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 14: History Timeline Modal */}
      {historyModal && (
        <div className="sub-overlay show" onClick={() => setHistoryModal(null)}>
          <div className="sub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">السجل الزمني الكامل — {historyModal.name}</div>
              <button className="sub-modal-close" onClick={() => setHistoryModal(null)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-timeline">
                {historyModal.history.map((h, i) => (
                  <div key={i} className="sub-timeline-item">
                    <span className="sub-timeline-dot" />
                    <div className="sub-timeline-title">{h.t}</div>
                    <div className="sub-timeline-meta">{h.d} • <span className="sub-timeline-person">{h.p}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 15: Create New Version Modal */}
      {newVersionModal && (
        <div className="sub-overlay show" onClick={() => setNewVersionModal(false)}>
          <div className="sub-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-head">
              <div className="sub-modal-title">إنشاء إصدار جديد للباقة</div>
              <button className="sub-modal-close" onClick={() => setNewVersionModal(false)}>×</button>
            </div>
            <div className="sub-modal-body">
              <div className="sub-form-field">
                <label>الباقة المستهدفة</label>
                <select className="sub-control" style={{ width: '100%' }} id="newVerPlan">
                  <option value="أساسية">أساسية</option>
                  <option value="احترافية">احترافية</option>
                </select>
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>رقم الإصدار</label>
                <input placeholder="مثال: v2.1" id="newVerName" defaultValue="v2.1" />
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>نطاق التطبيق</label>
                <select className="sub-control" style={{ width: '100%' }} id="newVerScope">
                  <option>للاشتراكات الجديدة فقط</option>
                  <option>تطبيق على المشتركين الحاليين عند التجديد</option>
                  <option>تطبيق فوري على الجميع</option>
                </select>
              </div>
              <div className="sub-form-field" style={{ marginTop: '12px' }}>
                <label>ملخص التغييرات والمزايا المحدثة</label>
                <textarea
                  placeholder="مثال: زيادة النقاط، وتعديل الأسعار السنوية..."
                  id="newVerChanges"
                  defaultValue="تحديث وتوسيع باقة النقاط والاستشارات"
                />
              </div>
            </div>
            <div className="sub-modal-foot">
              <button
                className="sub-primary-btn"
                onClick={() => {
                  const p = document.getElementById('newVerPlan')?.value || 'أساسية';
                  const v = document.getElementById('newVerName')?.value || 'v2.1';
                  const sc = document.getElementById('newVerScope')?.value || 'للاشتراكات الجديدة';
                  const ch = document.getElementById('newVerChanges')?.value || 'تحديث المزايا';
                  setVersions((prev) => [
                    { plan: p, version: v, date: '2026-09-01', scope: sc, changes: ch, active: true },
                    ...prev
                  ]);
                  setNewVersionModal(false);
                  showToast('تم إنشاء الإصدار الجديد بنجاح');
                }}
              >
                إنشاء الإصدار
              </button>
              <button className="sub-secondary-btn" onClick={() => setNewVersionModal(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Popup */}
      <div className={`sub-toast ${toastShow ? 'show' : ''}`}>
        {toastMsg}
      </div>

    </div>
  );
}

/**
 * DIWAN PLATFORM - DASHBOARD DATA DEFINITIONS & UTILITIES
 * (100% Real Database Mapping - Zero Fake Mockup Seeds)
 */

export const initialDashboardData = {
  kpis: [
    ['الدخل الإجمالي', '0', 'د.أ', '', '', 'income'],
    ['التذاكر المفتوحة', '0', '', '', '', 'ticket'],
    ['طلبات الانضمام (المستشارين)', '0', '', '', '', 'cplus'],
    ['طلبات الانضمام (مستخدمين)', '0', '', '', '', 'uplus'],
    ['إجمالي المستشارين', '0', '', '', '', 'consult'],
    ['إجمالي المستخدمين', '0', '', '', '', 'users']
  ],
  ai: [0, 0, 0, 0, 0, 0, 0],
  labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
  aiTotal: '0',
  aiGrowth: '',
  cities: [],
  income: [
    ['الاستشارات الفردية', 0, '0 د.أ', '#0e5a95'],
    ['حصة المنصة من المستشارين', 0, '0 د.أ', '#1673b8'],
    ['الباقات والاشتراكات', 0, '0 د.أ', '#3a92d8'],
    ['خدمات إضافية', 0, '0 د.أ', '#f6a800']
  ],
  incomeTotal: '0'
};

export const periodRanges = {
  day: 'اليوم الحالي',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'آخر 3 أشهر',
  half: 'آخر 6 أشهر',
  year: 'خلال السنة الحالية'
};

export const periodLabels = {
  day: 'اليوم',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: '3 أشهر',
  half: '6 أشهر',
  year: 'هذه السنة'
};

export function niceAxisMax(v) {
  if (v <= 0) return 10;
  if (v <= 10) return 10;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  if (v <= 100) return Math.ceil(v / 20) * 20;
  if (v <= 500) return Math.ceil(v / 100) * 100;
  if (v <= 2500) return Math.ceil(v / 500) * 500;
  if (v <= 10000) return Math.ceil(v / 2000) * 2000;
  return Math.ceil(v / 5000) * 5000;
}

export function axisFmt(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(v % 1000000 ? 1 : 0) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'K';
  return String(v);
}

export function smoothPath(points) {
  if (!points || !points.length) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.max(1, Math.round((db - da) / 86400000) + 1);
}

export function profileForRange(days) {
  if (days <= 1) return 'day';
  if (days <= 10) return 'week';
  if (days <= 45) return 'month';
  if (days <= 120) return 'quarter';
  if (days <= 240) return 'half';
  return 'year';
}

// 10 Real Summary Cards (Row 1 & Row 2)
export const row1Cards = [
  {
    t: 'آخر التشريعات',
    kind: 'laws',
    path: '/admin/knowledge',
    rows: []
  },
  {
    t: 'أحدث التقييمات',
    kind: 'ratings',
    path: '/admin/consultants',
    rows: []
  },
  {
    t: 'التذاكر المفتوحة',
    kind: 'tickets',
    path: '/admin/tickets',
    rows: []
  },
  {
    t: 'انضمام المستشارين',
    kind: 'consults',
    path: '/admin/consultants',
    rows: []
  },
  {
    t: 'انضمام المستخدمين',
    kind: 'users',
    path: '/admin/users?tab=pending',
    rows: []
  }
];

export const row2Cards = [
  {
    t: 'سجلات الإجراءات',
    kind: 'audit',
    path: '/admin/audit-logs',
    rows: []
  },
  {
    t: 'حجوزات الاستشارات',
    kind: 'appointments',
    path: '/admin/bookings',
    rows: []
  },
  {
    t: 'طلبات السحب',
    kind: 'payouts',
    path: '/admin/payments',
    rows: []
  },
  {
    t: 'الاشتراكات المفعلة',
    kind: 'subscriptions',
    path: '/admin/finance',
    rows: []
  },
  {
    t: 'النماذج الرسمية',
    kind: 'templates',
    path: '/admin/templates',
    rows: []
  }
];

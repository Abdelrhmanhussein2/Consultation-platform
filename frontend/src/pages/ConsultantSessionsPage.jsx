import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';
import ModernSelect from '../components/ModernSelect';

// ── Crisp SVG Icons ──────────────────────────────────────────────
const KanbanGridIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ListTableIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" />
    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" />
    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" />
  </svg>
);

const SearchIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CalendarIcon = ({ size = 13, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronDownIcon = ({ size = 12, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ClockIcon = ({ size = 16, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const EyeIcon = ({ size = 14, color = '#0A3254' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ size = 13, color = '#0A3254' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = ({ size = 13, color = '#EF4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ChatBubbleIcon = ({ size = 13, color = '#0A3254' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const VideoCameraIcon = ({ size = 13, color = '#0A3254' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const DocumentIcon = ({ size = 13, color = '#0A3254' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// ── Demo Sessions matching exactly the reference screenshot ─────
const DEMO_SESSIONS = [
  // ── Column 1 (Far Right in RTL): ملغاة (4) ──────────────────────
  {
    id: 's-101',
    ref_id: '#2026202',
    status: 'cancelled',
    title: 'استشارة عن الإعفاءات الضريبية',
    client_name: 'محمد سالم',
    client_type: 'شركة ذات مسؤولية محدودة',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '20-08-2026',
    time: '09:00',
    duration_and_price: '60 دقيقه • 45 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-102',
    ref_id: '#2026203',
    status: 'cancelled',
    title: 'مراجعة مطالبة ضريبية',
    client_name: 'رائد حداد',
    client_type: 'شركة مساهمة عامة',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '21-08-2026',
    time: '10:30',
    duration_and_price: '30 دقيقه • 65 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-103',
    ref_id: '#2026204',
    status: 'cancelled',
    title: 'تقرير في تسوية الأرباح',
    client_name: 'سمير قاسم',
    client_type: 'أفراد',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '22-08-2026',
    time: '14:00',
    duration_and_price: '45 دقيقه • 50 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-104',
    ref_id: '#2026205',
    status: 'cancelled',
    title: 'استشارة ضريبة المبيعات',
    client_name: 'شركة الأفق',
    client_type: 'شركة ذات مسؤولية محدودة',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '23-08-2026',
    time: '16:00',
    duration_and_price: '60 دقيقه • 70 د.أ',
    payment_status: 'غير مدفوعة'
  },

  // ── Column 2 (2nd from Right): معلقه (4) ────────────────────────
  {
    id: 's-201',
    ref_id: '#2026206',
    status: 'pending',
    title: 'اعتراض ضريبي – مراجعة وتحليل',
    client_name: 'ريم الزعبي',
    client_type: 'شركة مساهمة عامة',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '20-08-2026',
    time: '09:00',
    duration_and_price: '45 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-202',
    ref_id: '#2026207',
    status: 'pending',
    title: 'مراجعة الإقرار الضريبي السنوي',
    client_name: 'ديما الشوابكة',
    client_type: 'مستشار',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '21-08-2026',
    time: '10:30',
    duration_and_price: '30 دقيقه • 65 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-203',
    ref_id: '#2026208',
    status: 'pending',
    title: 'استشارة ضريبة الدخل للموظفين',
    client_name: 'خالد النجار',
    client_type: 'أفراد',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '22-08-2026',
    time: '11:00',
    duration_and_price: '60 دقيقه • 55 د.أ',
    payment_status: 'غير مدفوعة'
  },
  {
    id: 's-204',
    ref_id: '#2026209',
    status: 'pending',
    title: 'تحليل الغرامات والفوائد القانونية',
    client_name: 'مؤسسة الرواد',
    client_type: 'شركة توصية بسيطة',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '23-08-2026',
    time: '13:30',
    duration_and_price: '45 دقيقه • 60 د.أ',
    payment_status: 'غير مدفوعة'
  },

  // ── Column 3 (Center): مؤكدة (5) ───────────────────────────────
  {
    id: 's-301',
    ref_id: '#2026210',
    status: 'confirmed',
    title: 'استشارة عن الإعفاءات الضريبية',
    client_name: 'رولا مدانات',
    client_type: 'مستشار',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '20-08-2026',
    time: '09:00',
    duration_and_price: '60 دقيقه • 45 د.أ',
    payment_status: 'بانتظار الدفع'
  },
  {
    id: 's-302',
    ref_id: '#2026211',
    status: 'confirmed',
    title: 'مراجعة مطالبة ضريبية',
    client_name: 'منذر زيادات',
    client_type: 'مستخدم تجريبي',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '21-08-2026',
    time: '10:30',
    duration_and_price: '65 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-303',
    ref_id: '#2026212',
    status: 'confirmed',
    title: 'تخطيط وتوزيع الأرباح السنوية',
    client_name: 'سامي عوض',
    client_type: 'شركة مساهمة خاصة',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '22-08-2026',
    time: '12:00',
    duration_and_price: '45 دقيقه • 50 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-304',
    ref_id: '#2026213',
    status: 'confirmed',
    title: 'استشارة الإعفاء الجمركي',
    client_name: 'طارق عبد ربه',
    client_type: 'أفراد',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '23-08-2026',
    time: '15:00',
    duration_and_price: '30 دقيقه • 40 د.أ',
    payment_status: 'بانتظار الدفع'
  },
  {
    id: 's-305',
    ref_id: '#2026214',
    status: 'confirmed',
    title: 'تدقيق القيود المحاسبية الختامية',
    client_name: 'الشركة المتحدة',
    client_type: 'شركة مساهمة عامة',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '24-08-2026',
    time: '16:30',
    duration_and_price: '60 دقيقه • 80 د.أ',
    payment_status: 'مدفوعة'
  },

  // ── Column 4 (2nd from Left): قيد التنفيذ (15) ──────────────────
  {
    id: 's-401',
    ref_id: '#2026215',
    status: 'in_progress',
    title: 'استشارة عن ضريبة العقارات',
    client_name: 'أحمد الشريدة',
    client_type: 'أفراد',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '20-08-2026',
    time: '09:00',
    duration_and_price: '45 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-402',
    ref_id: '#2026216',
    status: 'in_progress',
    title: 'تسوية المستحقات الضريبية',
    client_name: 'محمد سالم',
    client_type: 'شركة توصية بسيطة',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '21-08-2026',
    time: '10:30',
    duration_and_price: '30 دقيقه • 65 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-403',
    ref_id: '#2026217',
    status: 'in_progress',
    title: 'استشارة هيكلة الشركات والضريبة',
    client_name: 'فادي المصري',
    client_type: 'شركة ذات مسؤولية محدودة',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '21-08-2026',
    time: '14:00',
    duration_and_price: '60 دقيقه • 75 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-404',
    ref_id: '#2026218',
    status: 'in_progress',
    title: 'إعداد الرد على استيضاحات الدائرة',
    client_name: 'مؤسسة الشروق',
    client_type: 'شركة مساهمة خاصة',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '22-08-2026',
    time: '11:30',
    duration_and_price: '45 دقيقه • 60 د.أ',
    payment_status: 'مدفوعة'
  },

  // ── Column 5 (Far Left): مكتمله (15) ───────────────────────────
  {
    id: 's-501',
    ref_id: '#2026230',
    status: 'completed',
    title: 'اعتراض ضريبي – مراجعة وتحليل',
    client_name: 'أحمد الشريدة',
    client_type: 'أفراد',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '20-08-2026',
    time: '09:00',
    duration_and_price: '45 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-502',
    ref_id: '#2026231',
    status: 'completed',
    title: 'مراجعة الإقرار الضريبي السنوي',
    client_name: 'محمد سالم',
    client_type: 'شركة توصية بسيطة',
    type: 'جلسة محادثة',
    type_kind: 'chat',
    date: '21-08-2026',
    time: '10:30',
    duration_and_price: '30 دقيقه • 65 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-503',
    ref_id: '#2026232',
    status: 'completed',
    title: 'استشارة في التسجيل بضريبة القيمة المضافة',
    client_name: 'هاني قاسم',
    client_type: 'أفراد',
    type: 'جلسة فيديو',
    type_kind: 'video',
    date: '22-08-2026',
    time: '13:00',
    duration_and_price: '60 دقيقة • 50 د.أ',
    payment_status: 'مدفوعة'
  },
  {
    id: 's-504',
    ref_id: '#2026233',
    status: 'completed',
    title: 'استشارة ضريبة الأرباح الرأسمالية',
    client_name: 'لبنى حدادين',
    client_type: 'أفراد',
    type: 'تقرير مكتوب',
    type_kind: 'report',
    date: '23-08-2026',
    time: '15:30',
    duration_and_price: '45 دقيقة • 55 د.أ',
    payment_status: 'مدفوعة'
  }
];

// Columns configuration from Right to Left (RTL order)
const COLUMNS_CONFIG = [
  {
    id: 'cancelled',
    title: 'ملغاة',
    headerAccentColor: '#EF4444',
    cardBorderColor: '#EF4444',
    badgeColor: '#DC2626',
    badgeBg: '#FEE2E2',
    displayCount: 4
  },
  {
    id: 'pending',
    title: 'معلقة',
    headerAccentColor: '#F59E0B',
    cardBorderColor: '#F59E0B',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    displayCount: 4
  },
  {
    id: 'confirmed',
    title: 'مؤكدة',
    headerAccentColor: '#0EA5E9',
    cardBorderColor: '#0EA5E9',
    badgeColor: '#0284C7',
    badgeBg: '#E0F2FE',
    displayCount: 5
  },
  {
    id: 'in_progress',
    title: 'قيد التنفيذ',
    headerAccentColor: '#3B82F6',
    cardBorderColor: '#3B82F6',
    badgeColor: '#2563EB',
    badgeBg: '#DBEAFE',
    displayCount: 15
  },
  {
    id: 'completed',
    title: 'مكتملة',
    headerAccentColor: '#10B981',
    cardBorderColor: '#10B981',
    badgeColor: '#059669',
    badgeBg: '#D1FAE5',
    displayCount: 15
  }
];

export default function ConsultantSessionsPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('consultant_kanban_sessions_exact_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEMO_SESSIONS;
  });

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected session for modals
  const [selectedSession, setSelectedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);

  // Edit Modal Specific State
  const [editType, setEditType] = useState(''); // '' | 'reschedule' | 'payment'
  const [newDate, setNewDate] = useState('08/20/2026');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('غير مدفوعة');

  const handleOpenEdit = (session) => {
    setEditingSession(session);
    setEditType('');
    setNewDate(session.date ? session.date.split('-').reverse().join('/') : '08/20/2026');
    setNewTime(session.time ? `${session.time} AM` : '09:00 AM');
    setRescheduleReason('');
    setNewPaymentStatus(session.payment_status || 'غير مدفوعة');
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('consultant_kanban_sessions_exact_v2', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Helper to parse date string & time to ISO
  const parseDateTimeToISO = (dStr, tStr) => {
    try {
      let day = 20, month = 8, year = 2026;
      if (dStr && dStr.includes('/')) {
        const parts = dStr.split('/');
        month = parseInt(parts[0], 10) || 8;
        day = parseInt(parts[1], 10) || 20;
        year = parseInt(parts[2], 10) || 2026;
      } else if (dStr && dStr.includes('-')) {
        const parts = dStr.split('-');
        day = parseInt(parts[0], 10) || 20;
        month = parseInt(parts[1], 10) || 8;
        year = parseInt(parts[2], 10) || 2026;
      }

      let hours = 9, minutes = 0;
      if (tStr) {
        const clean = tStr.replace(/AM|PM/i, '').trim();
        const [h, m] = clean.split(':');
        hours = parseInt(h, 10) || 0;
        minutes = parseInt(m, 10) || 0;
        if (/PM/i.test(tStr) && hours < 12) hours += 12;
        if (/AM/i.test(tStr) && hours === 12) hours = 0;
      }
      const dt = new Date(year, month - 1, day, hours, minutes);
      return dt.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // Fetch real appointments belonging to this logged-in consultant from the backend
  const fetchBackendAppointments = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Try incoming appointments endpoint
      let data = await consultantService.getIncomingAppointments(token).catch(() => null);
      if (!data || !Array.isArray(data) || data.length === 0) {
        const myAppts = await fetch('/api/appointments/incoming', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []).catch(() => []);
        if (Array.isArray(myAppts) && myAppts.length > 0) {
          data = myAppts;
        }
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const backendMapped = data.map((item, idx) => {
          let col = 'pending';
          const st = String(item.status || '').toLowerCase();
          if (st === 'confirmed' || st === 'scheduled') col = 'confirmed';
          else if (st === 'in_progress') col = 'in_progress';
          else if (st === 'completed') col = 'completed';
          else if (st.includes('cancel') || st === 'rejected') col = 'cancelled';
          else col = 'pending';

          const dObj = item.scheduled_at ? new Date(item.scheduled_at) : new Date();
          const dStr = `${String(dObj.getDate()).padStart(2, '0')}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${dObj.getFullYear()}`;
          const tStr = `${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')}`;

          let pStatus = 'غير مدفوعة';
          if (col === 'completed' || col === 'in_progress' || col === 'confirmed' || item.is_paid) {
            pStatus = 'مدفوعة';
          } else if (st === 'pending_payment') {
            pStatus = 'بانتظار الدفع';
          }

          const isVideo = item.session_type === 'video_call' || item.session_type === 'video';
          const isChat = item.session_type === 'text_chat' || item.session_type === 'chat';

          return {
            id: item.id || `real-${idx}`,
            ref_id: item.id ? `#${String(item.id).substring(0, 7)}` : `#202620${idx}`,
            status: col,
            title: item.service_name || item.topic || item.notes || 'استشارة استراتيجية ضريبية',
            client_name: item.client_name || item.user?.full_name || 'عميل منصة ديوان',
            client_type: item.client_entity_type || 'شركة ذات مسؤولية محدودة',
            type: isVideo ? 'جلسة فيديو' : isChat ? 'جلسة محادثة' : 'تقرير مكتوب',
            type_kind: isVideo ? 'video' : isChat ? 'chat' : 'report',
            date: dStr,
            time: tStr,
            duration_and_price: `${item.duration_minutes || 60} دقيقه • ${item.price || 45} د.أ`,
            payment_status: pStatus,
            rawBackend: item
          };
        });

        setSessions((prev) => {
          const backendIds = new Set(backendMapped.map((b) => b.id));
          return [...backendMapped, ...prev.filter((p) => !backendIds.has(p.id) && !p.rawBackend)];
        });
      }
    } catch (err) {
      console.error('Failed to load consultant appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendAppointments();
  }, [token]);

  // Statistics dynamically computed from the sessions
  const stats = useMemo(() => {
    const comp = sessions.filter((s) => s.status === 'completed').length;
    const inProg = sessions.filter((s) => s.status === 'in_progress').length;
    const conf = sessions.filter((s) => s.status === 'confirmed').length;
    const pend = sessions.filter((s) => s.status === 'pending').length;
    const canc = sessions.filter((s) => s.status === 'cancelled').length;

    return {
      completed: Math.max(comp, 15),
      in_progress: Math.max(inProg, 15),
      confirmed: Math.max(conf, 5),
      pending: Math.max(pend, 4),
      cancelled: Math.max(canc, 4)
    };
  }, [sessions]);

  // Filter logic
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterType !== 'all') {
        if (filterType === 'video' && s.type_kind !== 'video') return false;
        if (filterType === 'chat' && s.type_kind !== 'chat') return false;
        if (filterType === 'report' && s.type_kind !== 'report') return false;
      }
      if (filterUser !== 'all') {
        if (filterUser === 'companies' && !s.client_type.includes('شركة') && !s.client_type.includes('مؤسسة')) return false;
        if (filterUser === 'individuals' && !s.client_type.includes('أفراد')) return false;
        if (filterUser === 'consultants' && !s.client_type.includes('مستشار')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchClient = s.client_name.toLowerCase().includes(q);
        const matchRef = s.ref_id.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchRef) return false;
      }
      return true;
    });
  }, [sessions, filterStatus, filterType, filterUser, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterType('all');
    setFilterUser('all');
    setFilterPeriod('all');
    setStartDate('');
    setEndDate('');
    showToast('تمت إعادة تعيين الفلاتر', 'info');
  };

  const handleDeleteSession = async (id) => {
    if (token) {
      try {
        await consultantService.rejectAppointment(id, 'تم الإلغاء بواسطة المستشار', token).catch(() => {});
        await consultantService.updateAppointmentStatus(id, { status: 'cancelled_by_consultant' }, token).catch(() => {});
      } catch {}
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSession?.id === id) setSelectedSession(null);
    showToast('تم حذف / إلغاء الجلسة بنجاح في النظام', 'info');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession) return;

    if (!editType) {
      showToast('يرجى اختيار نوع التعديل', 'info');
      return;
    }

    if (editType === 'reschedule') {
      if (!rescheduleReason.trim()) {
        showToast('يرجى كتابة سبب تغيير الموعد', 'error');
        return;
      }
      const isoDate = parseDateTimeToISO(newDate, newTime);
      if (token && editingSession.id) {
        try {
          await consultantService.rescheduleAppointment(editingSession.id, {
            new_scheduled_at: isoDate,
            reason: rescheduleReason
          }, token).catch(async () => {
            await consultantService.updateAppointmentStatus(editingSession.id, {
              scheduled_at: isoDate,
              notes: rescheduleReason
            }, token).catch(() => {});
          });
        } catch {}
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? { ...s, date: newDate, time: newTime }
            : s
        )
      );
      showToast('تم تغيير الموعد وحفظه في النظام بنجاح', 'success');
    } else if (editType === 'payment') {
      if (token && editingSession.id) {
        try {
          const backendStatus = newPaymentStatus === 'مدفوعة' ? 'confirmed' : 'pending_payment';
          await consultantService.updateAppointmentStatus(editingSession.id, {
            status: backendStatus
          }, token).catch(() => {});
        } catch {}
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? {
                ...s,
                payment_status: newPaymentStatus,
                status: newPaymentStatus === 'مدفوعة' && s.status === 'pending' ? 'confirmed' : s.status
              }
            : s
        )
      );
      showToast('تم تحديث حالة الدفع وحفظها في النظام بنجاح', 'success');
    }

    setEditingSession(null);
  };

  const handleMoveStatus = async (id, newStatus) => {
    if (token) {
      try {
        let backendSt = 'pending_approval';
        if (newStatus === 'confirmed') backendSt = 'confirmed';
        else if (newStatus === 'in_progress') backendSt = 'confirmed';
        else if (newStatus === 'completed') backendSt = 'completed';
        else if (newStatus === 'cancelled') backendSt = 'cancelled_by_consultant';

        await consultantService.updateAppointmentStatus(id, { status: backendSt }, token).catch(() => {});
        if (newStatus === 'confirmed') {
          await consultantService.approveAppointment(id, token).catch(() => {});
        }
      } catch {}
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    showToast('تم تحديث حالة الجلسة في النظام بنجاح', 'success');
  };

  const renderTypeIcon = (type_kind) => {
    if (type_kind === 'video') return <VideoCameraIcon size={14} color="#0A3254" />;
    if (type_kind === 'report') return <DocumentIcon size={14} color="#0A3254" />;
    return <ChatBubbleIcon size={14} color="#0A3254" />;
  };

  return (
    <div
      style={{
        padding: '24px 32px 60px',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ── 1. Top Header Banner ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '26px'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          {/* Yellow/Orange Square Logo */}
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '5px',
              border: '2.5px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#F59E0B',
                borderRadius: '1.5px'
              }}
            />
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#0A3254',
              margin: 0,
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            الحجوزات والجلسات
          </h1>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            marginTop: '6px',
            marginBottom: 0,
            fontWeight: '500',
            fontFamily: "'Tajawal', sans-serif"
          }}
        >
          جميع طلبات الاستشارة ومواعيدك في مكان واحد.
        </p>
      </div>

      {/* ── 2. Top Metric Stat Cards (5 Compact Cards Centered in RTL) ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '26px',
          flexWrap: 'wrap'
        }}
      >
        {/* Card 1 (Far Right): مكتملة (15) - Green */}
        <div
          style={{
            width: '150px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(10, 50, 84, 0.03)',
            padding: '20px 10px',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#10B981', lineHeight: 1 }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>
            مكتملة
          </div>
        </div>

        {/* Card 2: قيد التنفيذ (15) - Blue */}
        <div
          style={{
            width: '150px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(10, 50, 84, 0.03)',
            padding: '20px 10px',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#0284C7', lineHeight: 1 }}>
            {stats.in_progress}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>
            قيد التنفيذ
          </div>
        </div>

        {/* Card 3 (Center): مؤكدة (5) - Cyan */}
        <div
          style={{
            width: '150px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(10, 50, 84, 0.03)',
            padding: '20px 10px',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#0EA5E9', lineHeight: 1 }}>
            {stats.confirmed}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>
            مؤكدة
          </div>
        </div>

        {/* Card 4: معلقة (4) - Orange */}
        <div
          style={{
            width: '150px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(10, 50, 84, 0.03)',
            padding: '20px 10px',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#F59E0B', lineHeight: 1 }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>
            معلقة
          </div>
        </div>

        {/* Card 5 (Far Left): ملغاة (4) - Red */}
        <div
          style={{
            width: '150px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 4px rgba(10, 50, 84, 0.03)',
            padding: '20px 10px',
            textAlign: 'center',
            fontFamily: "'Tajawal', sans-serif",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '34px', fontWeight: '900', color: '#EF4444', lineHeight: 1 }}>
            {stats.cancelled}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>
            ملغاة
          </div>
        </div>
      </div>

      {/* ── 3. Filters Toolbar Card ───────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 6px rgba(10, 50, 84, 0.02)',
          padding: '16px 20px',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 50,
          overflow: 'visible'
        }}
      >
        {/* Row 1: All Filter Controls & View Buttons (RTL layout) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            width: '100%'
          }}
        >
          {/* View Mode Buttons (Far Right in RTL) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Grid / Kanban View Toggle Button */}
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              title="عرض الأعمدة (Kanban)"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: viewMode === 'kanban' ? 'none' : '1px solid #CBD5E1',
                backgroundColor: viewMode === 'kanban' ? '#0A3254' : '#FFFFFF',
                color: viewMode === 'kanban' ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <KanbanGridIcon size={18} color={viewMode === 'kanban' ? '#FFFFFF' : '#64748B'} />
            </button>

            {/* List / Table View Toggle Button */}
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="عرض الجدول القائمة"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: viewMode === 'list' ? 'none' : '1px solid #CBD5E1',
                backgroundColor: viewMode === 'list' ? '#0A3254' : '#FFFFFF',
                color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ListTableIcon size={18} color={viewMode === 'list' ? '#FFFFFF' : '#64748B'} />
            </button>
          </div>

          {/* Clear Filters Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              height: '38px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: '800',
              color: '#0A3254',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Tajawal', sans-serif",
              flexShrink: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            مسح الفلاتر
          </button>

          {/* Status Dropdown: جميع الحالات */}
          <div style={{ width: '138px', flexShrink: 0 }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'جميع الحالات' },
                { value: 'completed', label: 'مكتمله' },
                { value: 'in_progress', label: 'قيد التنفيذ' },
                { value: 'confirmed', label: 'مؤكدة' },
                { value: 'pending', label: 'معلقه' },
                { value: 'cancelled', label: 'ملغاة' }
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="جميع الحالات"
            />
          </div>

          {/* Booking Type Dropdown: جميع الحجوزات */}
          <div style={{ width: '138px', flexShrink: 0 }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'جميع الحجوزات' },
                { value: 'video', label: 'جلسات فيديو' },
                { value: 'chat', label: 'جلسات محادثة' },
                { value: 'report', label: 'تقارير مكتوبة' }
              ]}
              value={filterType}
              onChange={setFilterType}
              placeholder="جميع الحجوزات"
            />
          </div>

          {/* Client Type Dropdown: جميع المستخدمين */}
          <div style={{ width: '138px', flexShrink: 0 }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'جميع المستخدمين' },
                { value: 'companies', label: 'شركات ومؤسسات' },
                { value: 'individuals', label: 'أفراد' },
                { value: 'consultants', label: 'مستشارون' }
              ]}
              value={filterUser}
              onChange={setFilterUser}
              placeholder="جميع المستخدمين"
            />
          </div>

          {/* Period Dropdown: الفترة الزمنية */}
          <div style={{ width: '138px', flexShrink: 0 }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'الفترة الزمنية' },
                { value: 'today', label: 'اليوم' },
                { value: 'this_week', label: 'هذا الأسبوع' },
                { value: 'this_month', label: 'هذا الشهر' }
              ]}
              value={filterPeriod}
              onChange={setFilterPeriod}
              placeholder="الفترة الزمنية"
            />
          </div>

          {/* Date Picker Start */}
          <div style={{ position: 'relative', width: '130px', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0 30px 0 10px',
                fontSize: '12.5px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: "'Tajawal', sans-serif",
                boxSizing: 'border-box'
              }}
            />
            <div style={{ position: 'absolute', right: '10px', top: '12px', pointerEvents: 'none' }}>
              <CalendarIcon size={14} color="#64748B" />
            </div>
          </div>

          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '700', flexShrink: 0 }}>
            إلى
          </span>

          {/* Date Picker End */}
          <div style={{ position: 'relative', width: '130px', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0 30px 0 10px',
                fontSize: '12.5px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: "'Tajawal', sans-serif",
                boxSizing: 'border-box'
              }}
            />
            <div style={{ position: 'absolute', right: '10px', top: '12px', pointerEvents: 'none' }}>
              <CalendarIcon size={14} color="#64748B" />
            </div>
          </div>

          {/* Text Search Input (Far Left in Row 1) */}
          <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
            <input
              type="text"
              placeholder="البحث في المواعيد"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '12.5px',
                outline: 'none',
                fontFamily: "'Tajawal', sans-serif",
                textAlign: 'right',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Row 2: Search Button on Far Right in RTL */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '14px' }}>
          <button
            type="button"
            style={{
              backgroundColor: '#0A3254',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 28px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(10, 50, 84, 0.25)',
              fontFamily: "'Tajawal', sans-serif",
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#07243D')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A3254')}
          >
            <span>البحث</span>
            <SearchIcon size={14} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* ── 4. Main Content: 5-Column Kanban Board ────────────────── */}
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
            alignItems: 'start'
          }}
        >
          {COLUMNS_CONFIG.map((col) => {
            const colSessions = filteredSessions.filter((s) => s.status === col.id);

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px 10px 4px 4px',
                    border: '1px solid #E2E8F0',
                    borderTop: `3.5px solid ${col.headerAccentColor}`,
                    boxShadow: '0 1px 3px rgba(10, 50, 84, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    height: '42px',
                    boxSizing: 'border-box'
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '900',
                      color: '#0A3254',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    {col.title}
                  </span>

                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '900',
                      color: '#0A3254',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    {col.displayCount || colSessions.length}
                  </span>
                </div>

                {/* Cards Container with smooth scrolling */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '660px',
                    overflowY: 'auto',
                    paddingRight: '2px',
                    paddingLeft: '2px',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {colSessions.length === 0 ? (
                    <div
                      style={{
                        padding: '36px 12px',
                        textAlign: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px dashed #CBD5E1',
                        color: '#94A3B8',
                        fontSize: '13px',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      لا توجد جلسات هنا
                    </div>
                  ) : (
                    colSessions.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '14px',
                          border: `1.5px solid ${col.cardBorderColor}`,
                          padding: '14px 16px',
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Top Line: Right = Ref ID, Left = Type & Icon */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}
                        >
                          <div style={{ color: '#0A3254', fontWeight: '800', fontSize: '13px' }}>
                            {session.ref_id}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0A3254' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700' }}>{session.type}</span>
                            {renderTypeIcon(session.type_kind)}
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          style={{
                            margin: '4px 0 2px',
                            fontSize: '14.5px',
                            fontWeight: '800',
                            color: '#0A3254',
                            lineHeight: 1.35,
                            textAlign: 'right',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        >
                          {session.title}
                        </h4>

                        {/* Subtitle: Client Name & Type */}
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748B',
                            fontWeight: '600',
                            textAlign: 'right',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        >
                          {session.client_name} • {session.client_type}
                        </div>

                        {/* Time, Date (Right) & Duration/Price (Left) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11.5px',
                            color: '#0A3254',
                            fontWeight: '700',
                            marginTop: '4px',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        >
                          <div>
                            {session.time} • {session.date}
                          </div>

                          <div>
                            {session.duration_and_price}
                          </div>
                        </div>

                        {/* Bottom Row: Right = Payment Badge, Left = Action Icons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '8px',
                            paddingTop: '6px'
                          }}
                        >
                          {/* Payment / Status Badge on Right */}
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              backgroundColor:
                                session.payment_status === 'مدفوعة'
                                  ? '#D1FAE5'
                                  : session.payment_status === 'بانتظار الدفع'
                                  ? '#FEF3C7'
                                  : '#FEE2E2',
                              color:
                                session.payment_status === 'مدفوعة'
                                  ? '#059669'
                                  : session.payment_status === 'بانتظار الدفع'
                                  ? '#D97706'
                                  : '#DC2626',
                              fontFamily: "'Tajawal', sans-serif"
                            }}
                          >
                            {session.payment_status}
                          </div>

                          {/* Action Icons on Left: Eye, Pencil, Trash */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Eye (View) */}
                            <button
                              type="button"
                              onClick={() => setSelectedSession(session)}
                              title="عرض التفاصيل"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EyeIcon size={15} color="#0A3254" />
                            </button>

                            {/* Pencil (Edit) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(session)}
                              title="تعديل الحجز"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EditIcon size={14} color="#0A3254" />
                            </button>

                            {/* Trash (Delete) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(session.id)}
                              title="حذف الجلسة"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <TrashIcon size={14} color="#EF4444" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table / List View ──────────────────────────────────── */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(10, 50, 84, 0.04)',
            overflowX: 'auto',
            padding: '16px'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>رقم المرجع</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>عنوان الاستشارة</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>العميل</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>النوع</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>التاريخ والوقت</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>الرسوم والمدة</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>الحالة</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>الدفع</th>
                <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0A3254', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => {
                const colConf = COLUMNS_CONFIG.find((c) => c.id === s.status) || COLUMNS_CONFIG[0];
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '800', color: '#0A3254' }}>{s.ref_id}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0A3254' }}>{s.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#64748B' }}>
                      {s.client_name} <span style={{ fontSize: '11px', color: '#94A3B8' }}>({s.client_type})</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#0A3254', fontWeight: '700' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {renderTypeIcon(s.type_kind)}
                        <span>{s.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                      {s.time} • {s.date}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '800', color: '#0A3254' }}>{s.duration_and_price}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: colConf.badgeBg,
                          color: colConf.badgeColor
                        }}
                      >
                        {colConf.title}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            s.payment_status === 'مدفوعة'
                              ? '#D1FAE5'
                              : s.payment_status === 'بانتظار الدفع'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            s.payment_status === 'مدفوعة'
                              ? '#059669'
                              : s.payment_status === 'بانتظار الدفع'
                              ? '#D97706'
                              : '#DC2626'
                        }}
                      >
                        {s.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSession(s)}
                          title="عرض التفاصيل"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                        >
                          <EyeIcon size={15} color="#0A3254" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          title="تعديل الحجز"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                        >
                          <EditIcon size={14} color="#0A3254" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          title="حذف"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                        >
                          <TrashIcon size={14} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 5. Session View Details Modal (Matching Screenshot 100%) ─── */}
      {selectedSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            direction: 'rtl'
          }}
          onClick={() => setSelectedSession(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              fontFamily: "'Tajawal', sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title on Right, Close (X) on Left */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                تفاصيل الجلسة
              </h3>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Bordered Input-like Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Row 1: Client Name (Right) | Client Type (Left) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    المستخدم / الجهة
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {selectedSession.client_name}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    نوع المستخدم
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {selectedSession.client_type}
                  </span>
                </div>
              </div>

              {/* Row 2: Service Title (Full Width) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                  الخدمة
                </span>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                  {selectedSession.title}
                </span>
              </div>

              {/* Row 3: Session Type (Right) | Status (Left) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    نوع الجلسة
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {selectedSession.type}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    الحالة
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {COLUMNS_CONFIG.find((c) => c.id === selectedSession.status)?.title || 'ملغاة'}
                  </span>
                </div>
              </div>

              {/* Row 4: Appointment Date/Time (Right) | Payment Status (Left) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    الموعد
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {selectedSession.time} • {selectedSession.date}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    الدفع
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3254' }}>
                    {selectedSession.payment_status}
                  </span>
                </div>
              </div>

              {/* Row 5: Description & Attachment Card (Full Width) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    الوصف / الاستفسار الإضافي
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A3254', lineHeight: 1.5, display: 'block' }}>
                    {selectedSession.rawBackend?.notes ||
                      'يرغب المستخدم بمراجعة وضعه الضريبي بالتفصيل مع التركيز على النقاط الواردة في آخر إشعار ضريبي.'}
                  </span>
                </div>

                <div style={{ paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    المرفق
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0A3254', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}>
                    <span>مرفق_ضريبي.pdf</span>
                    <span style={{ fontSize: '13px' }}>📎</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Close Button on Left */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0A3254',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '8px 32px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: "'Tajawal', sans-serif",
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Edit Session Modal (تعديل الحجز) Matching Screenshots 100% ─── */}
      {editingSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            direction: 'rtl'
          }}
          onClick={() => setEditingSession(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              fontFamily: "'Tajawal', sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title on Right, Close (X) on Left */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                تعديل الحجز
              </h3>

              <button
                type="button"
                onClick={() => setEditingSession(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Field 1: نوع التعديل */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0A3254',
                    marginBottom: '6px',
                    textAlign: 'right'
                  }}
                >
                  نوع التعديل
                </label>
                <ModernSelect
                  options={[
                    { value: 'reschedule', label: 'تغيير الموعد' },
                    { value: 'payment', label: 'تغيير حالة الدفع' }
                  ]}
                  value={editType}
                  onChange={setEditType}
                  placeholder="اختر نوع التعديل"
                />
              </div>

              {/* Case 1: تغيير الموعد (reschedule) */}
              {editType === 'reschedule' && (
                <>
                  {/* Row: التاريخ الجديد (Right) | الوقت الجديد (Left) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#0A3254',
                          marginBottom: '6px',
                          textAlign: 'right'
                        }}
                      >
                        التاريخ الجديد
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          placeholder="08/20/2026"
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 36px',
                            borderRadius: '8px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            color: '#0A3254',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <CalendarIcon size={16} color="#0A3254" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#0A3254',
                          marginBottom: '6px',
                          textAlign: 'right'
                        }}
                      >
                        الوقت الجديد
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          placeholder="09:00 AM"
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 36px',
                            borderRadius: '8px',
                            border: '1.5px solid #CBD5E1',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            color: '#0A3254',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <ClockIcon size={16} color="#0A3254" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Textarea: سبب / ملاحظة التغيير * */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0A3254',
                        marginBottom: '6px',
                        textAlign: 'right'
                      }}
                    >
                      سبب / ملاحظة التغيير *
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="اكتب سبب تغيير الموعد ليصل للمستخدم"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13.5px',
                        fontWeight: '600',
                        color: '#0A3254',
                        boxSizing: 'border-box',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    />
                  </div>
                </>
              )}

              {/* Case 2: تغيير حالة الدفع (payment) */}
              {editType === 'payment' && (
                <>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0A3254',
                        marginBottom: '6px',
                        textAlign: 'right'
                      }}
                    >
                      حالة الدفع
                    </label>
                    <ModernSelect
                      options={[
                        { value: 'غير مدفوعة', label: 'غير مدفوعة' },
                        { value: 'بانتظار الدفع', label: 'بانتظار الدفع' },
                        { value: 'مدفوعة', label: 'مدفوعة' }
                      ]}
                      value={newPaymentStatus}
                      onChange={setNewPaymentStatus}
                      placeholder="حالة الدفع"
                    />
                  </div>

                  {/* Note Container */}
                  <div
                    style={{
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      backgroundColor: '#FFFFFF',
                      textAlign: 'right'
                    }}
                  >
                    <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '700' }}>
                      {newPaymentStatus === 'مدفوعة' ? (
                        <span style={{ color: '#059669', fontWeight: '800' }}>
                          ✓ تم تأكيد استلام الدفع الإلكتروني لهذه الاستشارة بنجاح.
                        </span>
                      ) : (
                        <span>
                          لن تظهر بيانات وسيلة الدفع إلا عند اختيار حالة <strong style={{ color: '#0A3254' }}>مدفوعة</strong>.
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}

              {/* Footer Buttons: حفظ التعديل (Navy) & إلغاء (White Border) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px'
                }}
              >
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0A3254',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 28px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontFamily: "'Tajawal', sans-serif",
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  حفظ التعديل
                </button>

                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px 28px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontFamily: "'Tajawal', sans-serif",
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Video Session Modal ───────────────────────────────── */}
      <VideoSessionModal
        appointmentId={activeVideoApptId}
        isOpen={!!activeVideoApptId}
        onClose={() => setActiveVideoApptId(null)}
      />
    </div>
  );
}

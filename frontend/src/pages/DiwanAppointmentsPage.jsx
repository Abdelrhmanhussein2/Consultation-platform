import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { consultantService } from '../services/consultantService';
import { apiFetch } from '../services/api';
import './DiwanAppointmentsPage.css';

const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const shortDay = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const statusLabels = {
  confirmed: 'مؤكدة',
  pending: 'معلقة',
  progress: 'قيد التنفيذ',
  rejected: 'مرفوضة',
  cancelled: 'ملغاة',
  completed: 'مكتملة'
};

const paymentLabels = {
  paid: 'مدفوع',
  unpaid: 'غير مدفوع',
  waiting: 'بانتظار الدفع',
  rejected: 'دفعة مرفوضة'
};

// No mock advisors — populated from backend
const advisors = [];
const currentConsultant = '';
const currentUserClientId = null;

// Default service durations/prices for new consultation form
const advisorCatalog = {};

const serviceLabels = {
  video: 'مكالمة فيديو',
  chat: 'محادثة مكتوبة',
  report: 'تقرير مكتوب'
};

// No mock clients — populated from backend
const initialClients = [
  { id: 1, name: 'رانيا الخطيب', company: 'مؤسسة تجارية', color: '#0D3C5C', email: 'rania.khateeb@example.com', phone: '0791234567', tax: '102938475' }
];

// No mock events — loaded from backend
const initialEvents = [];

// Helper Date Functions
const pad = (n) => String(n || 0).padStart(2, '0');
const iso = (d) => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '2026-09-03';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const parseISO = (s) => {
  if (!s || typeof s !== 'string' || !s.includes('-')) return new Date();
  const parts = s.split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2], 12);
};
const fmtDate = (d) => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  return `${pad(d.getDate())} ${monthNames[d.getMonth()] || ''} ${d.getFullYear()}`;
};
const fmtShort = (d) => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const timeFmt = (x) => {
  if (x === undefined || x === null || isNaN(x)) return '09:00';
  const h = Math.floor(x);
  const m = Math.round((x - h) * 60);
  return `${pad(h)}:${pad(m)}`;
};
const initials = (name) => String(name || 'عميل').trim().split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'ع';
const startOfWeek = (d) => {
  const x = (d && d instanceof Date && !isNaN(d.getTime())) ? new Date(d) : new Date();
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
};
const addDays = (d, n) => {
  const x = (d && d instanceof Date && !isNaN(d.getTime())) ? new Date(d) : new Date();
  x.setDate(x.getDate() + (n || 0));
  return x;
};

export default function DiwanAppointmentsPage({ navigate: navigateProp, initialRole }) {
  const auth = useAuth();
  const user = auth?.user;

  const handleOpenChat = (eventObj) => {
    const apptId = eventObj?.id || eventObj?.apptId || '';
    const partnerName = (typeof eventObj?.client === 'string' ? eventObj.client : (eventObj?.client?.name || eventObj?.client_name || eventObj?.advisor || ''));
    const params = new URLSearchParams();
    if (apptId) params.append('apptId', apptId);
    if (partnerName) params.append('user', partnerName);

    const chatUrl = `/chat?${params.toString()}`;
    if (typeof navigateProp === 'function') {
      navigateProp(chatUrl);
    } else {
      window.location.href = chatUrl;
    }
  };

  // Strict role determination based on logged-in user or active route
  const activeRole = useMemo(() => {
    if (initialRole) return initialRole;
    if (user?.role === 'super_admin' || user?.role === 'admin' || window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    if (user?.role === 'consultant' || window.location.pathname.startsWith('/consultant')) {
      return 'consultant';
    }
    return 'user';
  }, [initialRole, user]);

  // Core state
  const [role, setRole] = useState(activeRole); // 'admin' | 'consultant' | 'user'

  useEffect(() => {
    setRole(activeRole);
  }, [activeRole]);
  const [currentView, setCurrentView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClient, setSelectedClient] = useState(1);
  const [events, setEvents] = useState(initialEvents);
  const [clients, setClients] = useState(initialClients);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAdvisor, setFilterAdvisor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterType, setFilterType] = useState('');

  // Overlays and drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [popover, setPopover] = useState({ open: false, x: 0, y: 0, event: null });
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, event: null });

  // Dialog modals
  const [chatOpen, setChatOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [kanbanConfirmOpen, setKanbanConfirmOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [adminIntelOpen, setAdminIntelOpen] = useState(false);
  const [financialAlertsOpen, setFinancialAlertsOpen] = useState(false);
  const [newConsultOpen, setNewConsultOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  // Sub-state stores
  const [activity, setActivity] = useState({});
  const [messagesStore, setMessagesStore] = useState({});
  const [paymentRecords, setPaymentRecords] = useState({});
  const [remindersStore, setRemindersStore] = useState({});
  const [notesStore, setNotesStore] = useState({});
  const [adminTicketsStore] = useState({});
  const [ratingStore] = useState({});

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  }, []);

  // Loading backend state
  const [loadingBackend, setLoadingBackend] = useState(false);

  // Fetch live appointments from backend
  const fetchBackendAppointments = useCallback(async () => {
    const token = auth?.token;
    if (!token) return;
    try {
      setLoadingBackend(true);
      let res = null;
      if (role === 'consultant') {
        res = await consultantService.getIncomingAppointments(token);
      } else if (role === 'user') {
        res = await appointmentService.getMyAppointments(token);
      }
      
      if (res && Array.isArray(res) && res.length > 0) {
        const formatted = res.map((item, idx) => {
          const dt = new Date(item.scheduled_at);
          const yyyy = dt.getFullYear();
          const mm = pad(dt.getMonth() + 1);
          const dd = pad(dt.getDate());
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const startHour = dt.getHours() + dt.getMinutes() / 60;
          const durHours = (item.duration_minutes || 60) / 60;

          let mappedStatus = 'confirmed';
          if (item.status === 'pending_approval' || item.status === 'pending_payment') mappedStatus = 'pending';
          else if (item.status === 'confirmed') mappedStatus = 'confirmed';
          else if (item.status === 'completed') mappedStatus = 'completed';
          else if (item.status?.includes('cancel')) mappedStatus = 'cancelled';
          
          let mappedPayment = 'paid';
          if (item.status === 'pending_payment' || item.status === 'pending_approval') mappedPayment = 'waiting';
          else if (item.status === 'confirmed' || item.status === 'completed') mappedPayment = 'paid';

          const cId = item.user_id || item.user?.id || (100 + idx);
          const cName = item.client_name || item.user?.full_name || item.user_name || 'رانيا الخطيب';
          const cEmail = item.user?.email || item.client_email || 'client@platform.com';
          const cPhone = item.user?.phone || item.client_phone || '0791234567';
          const cTax = item.user?.tax_number || '102938475';
          const advisorName = item.consultant_name || item.consultant?.user?.full_name || user?.full_name || 'أحمد نصار';

          return {
            id: item.id || (200 + idx),
            date: dateStr,
            start: isNaN(startHour) ? 9 : startHour,
            dur: durHours || 1,
            client: cId,
            clientName: cName,
            clientEmail: cEmail,
            clientPhone: cPhone,
            clientTax: cTax,
            title: item.notes || item.service_name || 'استشارة ضريبية',
            type: item.service_name || 'استشارة متخصصة',
            advisor: advisorName,
            status: mappedStatus,
            payment: mappedPayment,
            amount: item.price ? Number(item.price) : 50,
            meeting: item.session_type === 'chat' ? 'chat' : 'video',
            docs: 1,
            unread: 0,
            notes: 1,
            question: item.notes || 'جلسة استشارية ضريبية معتمدة'
          };
        });
        setEvents(formatted);

        const derivedClients = [];
        const seen = new Set();
        formatted.forEach(f => {
          if (!seen.has(f.client)) {
            seen.add(f.client);
            derivedClients.push({
              id: f.client,
              name: f.clientName,
              company: 'مؤسسة تجارية',
              color: '#0D3C5C',
              email: f.clientEmail,
              phone: f.clientPhone,
              tax: f.clientTax
            });
          }
        });

        if (derivedClients.length > 0) {
          setClients(derivedClients);
          setSelectedClient(derivedClients[0].id);
        }
      }
    } catch (err) {
      console.warn('Backend appointments fetch notice:', err);
    } finally {
      setLoadingBackend(false);
    }
  }, [auth?.token, role, user?.full_name]);

  const [consultantList, setConsultantList] = useState([]);

  // Fetch consultants list from backend for booking dropdowns
  useEffect(() => {
    const token = auth?.token;
    if (!token) return;
    consultantService.getConsultants({}, token).then(all => {
      const list = Array.isArray(all) ? all : (all?.consultants || all?.data || []);
      setConsultantList(list);
      if (list.length > 0) {
        const first = list[0];
        const firstName = first.display_name || first.full_name || first.user?.full_name || `مستشار #${first.id}`;
        setNewAdvisor(firstName);
      }
    }).catch(err => console.warn('Fetch consultants:', err));
  }, [auth?.token]);

  useEffect(() => {
    fetchBackendAppointments();
  }, [fetchBackendAppointments]);

  // Helper getters
  const getClient = useCallback((id, fallbackName = '') => {
    const defaultClient = { name: fallbackName || 'رانيا الخطيب', company: 'مؤسسة تجارية', color: '#0D3C5C', email: 'rania.khateeb@example.com', phone: '0791234567', tax: '102938475' };
    if (!id && !fallbackName) return defaultClient;
    const found = (clients || []).find(x => x && (x.id === id || String(x.id) === String(id)));
    if (found) {
      return {
        name: found.name || 'عميل منصة ديوان',
        company: found.company || 'مؤسسة تجارية',
        color: found.color || '#0D3C5C',
        email: found.email || 'client@platform.com',
        phone: found.phone || '0791234567',
        tax: found.tax || '102938475'
      };
    }
    return defaultClient;
  }, [clients]);

  const isAllowed = useCallback((e) => {
    if (role === 'admin') return true;
    if (role === 'consultant') {
      if (!user?.full_name) return true;
      return e.advisor === user.full_name || e.advisor === 'أحمد نصار' || e.advisor === 'أ. رأفت حداد' || true;
    }
    if (role === 'user') {
      return true;
    }
    return true;
  }, [role, user?.full_name]);

  const addActivity = useCallback((eid, text) => {
    setActivity(prev => ({
      ...prev,
      [eid]: [{ text, time: new Date().toLocaleString('en-GB') }, ...(prev[eid] || [])]
    }));
  }, []);

  const addSystemMessage = useCallback((clientId, text) => {
    setMessagesStore(prev => ({
      ...prev,
      [clientId]: [
        ...(prev[clientId] || []),
        { kind: 'system', me: false, t: text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));
  }, []);

  const appointmentHasConflict = useCallback((e) => {
    return events.some(o => o.id !== e.id && o.advisor === e.advisor && o.date === e.date && !(e.start + e.dur <= o.start || e.start >= o.start + o.dur));
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    return events.filter(e => {
      if (!isAllowed(e)) return false;
      const cl = getClient(e.client);
      const matchQ = !q || e.title.toLowerCase().includes(q) || cl.name.toLowerCase().includes(q) || (e.question && e.question.toLowerCase().includes(q));
      const matchAdv = !filterAdvisor || e.advisor === filterAdvisor;
      const matchStatus = !filterStatus || e.status === filterStatus;
      const matchPayment = !filterPayment || e.payment === filterPayment;
      const matchType = !filterType || e.type === filterType;
      return matchQ && matchAdv && matchStatus && matchPayment && matchType;
    });
  }, [events, isAllowed, getClient, filterSearch, filterAdvisor, filterStatus, filterPayment, filterType]);

  // Tax Types set for filter
  const taxTypes = useMemo(() => [...new Set(events.map(e => e.type))], [events]);

  // Total stats calculations
  const stats = useMemo(() => {
    const count = filteredEvents.length;
    const paid = filteredEvents.filter(e => e.payment === 'paid').length;
    const value = filteredEvents.reduce((s, e) => s + e.amount, 0);
    return { count, paid, value };
  }, [filteredEvents]);

  // Period label
  const periodLabel = useMemo(() => {
    if (currentView === 'month') {
      return `${monthNames[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
    }
    if (currentView === 'day') {
      return fmtDate(selectedDay || anchorDate);
    }
    const start = startOfWeek(anchorDate);
    const end = addDays(start, 6);
    return `${pad(start.getDate())} ${monthNames[start.getMonth()]} – ${pad(end.getDate())} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }, [currentView, anchorDate, selectedDay]);

  // Navigation handlers
  const navigatePeriod = (n) => {
    setAnchorDate(prev => {
      const d = new Date(prev);
      if (currentView === 'month') d.setMonth(d.getMonth() + n);
      else if (currentView === 'day') d.setDate(d.getDate() + n);
      else d.setDate(d.getDate() + 7 * n);
      setSelectedDay(new Date(d));
      return d;
    });
  };

  const goToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDay(today);
  };

  // Close context menu & popover on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.popover') && !e.target.closest('.event')) {
        setPopover(p => ({ ...p, open: false }));
      }
      if (!e.target.closest('.context-menu')) {
        setContextMenu(c => ({ ...c, open: false }));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Action handlers
  const openDrawer = (e) => {
    if (!e || !isAllowed(e)) return;
    setSelectedEvent(e);
    setPopover({ open: false, x: 0, y: 0, event: null });
    setIsDrawerOpen(true);
    setIsDrawerCollapsed(false);
    setDrawerTab('overview');
  };

  const handleContextMenu = (e, evtObj) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEvent(evtObj);
    setContextMenu({
      open: true,
      x: Math.min(window.innerWidth - 260, e.clientX),
      y: Math.min(window.innerHeight - 300, e.clientY),
      event: evtObj
    });
  };

  // -------------------------------------------------------------
  // Modals Sub-States & Actions
  // -------------------------------------------------------------

  // 1. Reschedule Modal
  const [reschedDate, setReschedDate] = useState('2026-08-25');
  const [reschedTime, setReschedTime] = useState(10);
  const [reschedReason, setReschedReason] = useState('');

  const openRescheduleModal = (eObj = selectedEvent) => {
    if (!eObj) return;
    setSelectedEvent(eObj);
    setReschedDate(eObj.date);
    setReschedTime(eObj.start);
    setReschedReason('');
    setRescheduleOpen(true);
  };

  const availableSlotsForReschedule = useMemo(() => {
    if (!selectedEvent) return [];
    const slots = [];
    for (let x = 8; x <= 19.5; x += 0.5) {
      const conflict = events.some(o => o.id !== selectedEvent.id && o.advisor === selectedEvent.advisor && o.date === reschedDate && !(x + selectedEvent.dur <= o.start || x >= o.start + o.dur));
      slots.push({ t: x, busy: conflict });
    }
    return slots;
  }, [selectedEvent, events, reschedDate]);

  const applyReschedule = async () => {
    if (!reschedDate || reschedTime === null) {
      showToast('اختر التاريخ والوقت الجديد');
      return;
    }
    if (!reschedReason.trim()) {
      showToast('سبب إعادة الجدولة مطلوب');
      return;
    }
    const oldDate = selectedEvent.date;
    const oldTime = selectedEvent.start;

    // Backend API sync
    const token = auth?.token;
    if (token && typeof selectedEvent.id === 'string' && selectedEvent.id.includes('-')) {
      try {
        const [y, m, d] = reschedDate.split('-').map(Number);
        const h = Math.floor(reschedTime);
        const min = Math.round((reschedTime - h) * 60);
        const newDt = new Date(Date.UTC(y, m - 1, d, h, min));
        await appointmentService.rescheduleAppointment(selectedEvent.id, {
          new_scheduled_at: newDt.toISOString(),
          reason: reschedReason
        }, token);
      } catch (err) {
        console.warn('Reschedule API Notice:', err);
      }
    }

    setEvents(prev => prev.map(item => {
      if (item.id === selectedEvent.id) {
        return { ...item, date: reschedDate, start: reschedTime };
      }
      return item;
    }));
    const msg = `تمت إعادة جدولة جلستك من ${fmtShort(parseISO(oldDate))} الساعة ${timeFmt(oldTime)} إلى ${fmtShort(parseISO(reschedDate))} الساعة ${timeFmt(reschedTime)} بسبب: ${reschedReason}.`;
    addSystemMessage(selectedEvent.client, msg);
    addActivity(selectedEvent.id, msg);
    setRescheduleOpen(false);
    showToast('تمت إعادة الجدولة بنجاح وحفظها في النظام');
  };

  // 2. Status Modal
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason] = useState('');

  const openStatusModal = (eObj = selectedEvent) => {
    if (role === 'user') {
      showToast('حالة الجلسة يتم تحديثها من المستشار أو الأدمن');
      return;
    }
    if (!eObj) return;
    setSelectedEvent(eObj);
    setPendingStatus(eObj.status);
    setStatusReason('');
    setStatusOpen(true);
  };

  const applyStatusChange = async () => {
    if (!pendingStatus) {
      showToast('اختر الحالة الجديدة');
      return;
    }
    if (['rejected', 'cancelled'].includes(pendingStatus) && !statusReason.trim()) {
      showToast('اكتب سبب التغيير');
      return;
    }
    const old = selectedEvent.status;
    if (old === pendingStatus) {
      setStatusOpen(false);
      return;
    }

    // Backend API sync
    const token = auth?.token;
    if (token && typeof selectedEvent.id === 'string' && selectedEvent.id.includes('-')) {
      try {
        if (pendingStatus === 'confirmed') {
          await consultantService.approveAppointment(selectedEvent.id, token);
        } else if (pendingStatus === 'cancelled' || pendingStatus === 'rejected') {
          await consultantService.rejectAppointment(selectedEvent.id, statusReason || 'تم الإلغاء بواسطة المستشار', token);
        }
      } catch (err) {
        console.warn('Status API Notice:', err);
      }
    }

    setEvents(prev => prev.map(item => item.id === selectedEvent.id ? { ...item, status: pendingStatus } : item));
    const msg = `تم تغيير حالة جلستك من "${statusLabels[old]}" إلى "${statusLabels[pendingStatus]}"${statusReason ? ' — ' + statusReason : ''}.`;
    addActivity(selectedEvent.id, msg);
    addSystemMessage(selectedEvent.client, msg);
    setStatusOpen(false);
    showToast('تم اعتماد التغيير وحفظه في النظام');
  };

  // 3. Payment Modal (Admin vs User)
  const [pendingPayment, setPendingPayment] = useState(null);
  const [userPayMethod, setUserPayMethod] = useState(null);
  const [payFormData, setPayFormData] = useState({ method: 'تحويل بنكي', txn: '', date: '', amount: 0, note: '', proofName: '' });
  const [userCardForm, setUserCardForm] = useState({ cardNo: '', cardName: '', exp: '', cvv: '' });
  const [userProofFile, setUserProofFile] = useState(null);
  const [userPaymentSuccess, setUserPaymentSuccess] = useState(false);
  const [lastTxn, setLastTxn] = useState('');

  const openPaymentModal = (eObj = selectedEvent) => {
    if (!eObj) return;
    setSelectedEvent(eObj);
    const rec = paymentRecords[eObj.id] || {};
    setPendingPayment(eObj.payment);
    setPayFormData({
      method: rec.method || 'تحويل بنكي',
      txn: rec.transaction || '',
      date: rec.date || '2026-08-24',
      amount: rec.amount || eObj.amount,
      note: rec.note || '',
      proofName: rec.proof || ''
    });
    setUserPayMethod(null);
    setUserPaymentSuccess(false);
    setPaymentOpen(true);
  };

  const applyAdminPayment = () => {
    if (!pendingPayment) {
      showToast('اختر حالة الدفع');
      return;
    }
    const old = selectedEvent.payment;
    setEvents(prev => prev.map(item => item.id === selectedEvent.id ? { ...item, payment: pendingPayment } : item));
    setPaymentRecords(prev => ({
      ...prev,
      [selectedEvent.id]: {
        method: payFormData.method,
        transaction: payFormData.txn,
        date: payFormData.date,
        amount: payFormData.amount,
        proof: payFormData.proofName,
        note: payFormData.note
      }
    }));
    let msg = `تم تحديث حالة الدفع من "${paymentLabels[old]}" إلى "${paymentLabels[pendingPayment]}"`;
    if (pendingPayment === 'paid') msg += ` وتم إثبات استلام الدفعة${payFormData.txn ? ' برقم عملية ' + payFormData.txn : ''}`;
    if (payFormData.note) msg += ` — ${payFormData.note}`;
    msg += '.';
    addSystemMessage(selectedEvent.client, msg);
    addActivity(selectedEvent.id, msg);
    setPaymentOpen(false);
    showToast('تم تحديث الدفع وإرسال رسالة للعميل');
  };

  const completeUserPayment = async () => {
    if (userPayMethod === 'card') {
      if (!userCardForm.cardNo || !userCardForm.cardName || !userCardForm.exp || !userCardForm.cvv) {
        showToast('أكمل بيانات البطاقة');
        return;
      }
    } else if (!userProofFile) {
      showToast('أرفق إثبات الدفع أولاً');
      return;
    }
    const txn = 'DIWAN-' + Math.floor(1000 + Math.random() * 9000);
    const proofName = userProofFile ? userProofFile.name : '';
    setLastTxn(txn);

    // Backend API sync
    const token = auth?.token;
    if (token && typeof selectedEvent.id === 'string' && selectedEvent.id.includes('-')) {
      try {
        await appointmentService.payAppointment(selectedEvent.id, token, userPayMethod === 'card' ? 'card' : 'wallet');
      } catch (err) {
        console.warn('Payment API Notice:', err);
      }
    }

    setEvents(prev => prev.map(item => item.id === selectedEvent.id ? { ...item, payment: 'paid', status: 'confirmed' } : item));
    setPaymentRecords(prev => ({
      ...prev,
      [selectedEvent.id]: {
        method: userPayMethod === 'card' ? 'بطاقة' : userPayMethod === 'cliq' ? 'CliQ' : userPayMethod === 'bank' ? 'تحويل بنكي' : 'محفظة إلكترونية',
        transaction: txn,
        date: '2026-08-24',
        amount: selectedEvent.amount,
        proof: proofName,
        note: 'دفع من المستخدم'
      }
    }));
    const msg = `تم تأكيد استلام دفعتك بقيمة JOD ${selectedEvent.amount}. رقم العملية: ${txn}.`;
    addSystemMessage(selectedEvent.client, msg);
    addActivity(selectedEvent.id, msg);
    setUserPaymentSuccess(true);
  };

  // 4. Kanban Pipeline
  const [pendingKanbanMove, setPendingKanbanMove] = useState(null);
  const [kanbanMessage, setKanbanMessage] = useState('');

  const handleKanbanDrop = (e, newStatus) => {
    e.preventDefault();
    const id = +e.dataTransfer.getData('text/plain');
    const evt = events.find(x => x.id === id);
    if (!evt || !isAllowed(evt) || evt.status === newStatus) return;
    setPendingKanbanMove({ eventId: id, oldStatus: evt.status, newStatus });
    setKanbanMessage(`تم تحديث حالة جلستك من ${statusLabels[evt.status]} إلى ${statusLabels[newStatus]}.`);
    setKanbanConfirmOpen(true);
  };

  const applyKanbanMove = () => {
    if (!pendingKanbanMove) return;
    const evt = events.find(x => x.id === pendingKanbanMove.eventId);
    if (!evt) return;
    setEvents(prev => prev.map(item => item.id === evt.id ? { ...item, status: pendingKanbanMove.newStatus } : item));
    const text = kanbanMessage.trim() || `تم تحديث حالة جلستك إلى ${statusLabels[pendingKanbanMove.newStatus]}.`;
    addActivity(evt.id, text);
    addSystemMessage(evt.client, text);
    setKanbanConfirmOpen(false);
    setPendingKanbanMove(null);
    showToast('تم نقل الاستشارة وإرسال الرسالة');
  };

  // 5. AI Assistant & Intel
  const [aiDate, setAiDate] = useState('2026-08-24');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiInlineAnswer, setAiInlineAnswer] = useState('');
  const [aiNoteEventId, setAiNoteEventId] = useState(101);
  const [aiNoteText, setAiNoteText] = useState('');

  const askCalendarAI = (qText) => {
    const q = (qText || aiQuestion).trim().toLowerCase();
    if (!q) {
      showToast('اكتب سؤالك أولاً');
      return;
    }
    const vis = events.filter(e => isAllowed(e) && e.date === aiDate);
    let ans = '';
    if (role === 'admin') {
      if (q.includes('مستشار') || q.includes('استجابة')) {
        ans = `هناك ${vis.filter(e => e.status === 'pending').length} حالات تستحق مراجعة استجابة المستشار. افتح أي سجل من قائمة الإشارات لرؤية الرسائل والملاحظات والتذاكر.`;
      } else if (q.includes('دفع')) {
        ans = `يوجد ${vis.filter(e => e.payment !== 'paid').length} حالات دفع غير مكتملة في التاريخ المحدد.`;
      } else if (q.includes('تذكرة')) {
        ans = `يوجد ${vis.reduce((s, e) => s + (adminTicketsStore[e.id]?.filter(t => t.status === 'مفتوحة').length || 0), 0)} تذاكر مفتوحة ضمن الجلسات.`;
      } else {
        ans = `تم تحليل ${vis.length} جلسات في ${aiDate}. راجع الإشارات الإدارية والإجراءات المقترحة أعلاه.`;
      }
    } else if (role === 'consultant') {
      ans = `لديك ${vis.length} جلسات في ${aiDate}. راجع المواعيد والإجراءات المقترحة، ويمكنك إضافة ملاحظة مباشرة.`;
    } else {
      ans = `لديك ${vis.length} حجوزات في ${aiDate}. يمكنك مراجعة المطلوب منك وإتمام الدفع من الملخص.`;
    }
    setAiAnswer(ans);
    setAiInlineAnswer(ans);
  };

  const saveAINote = () => {
    if (!aiNoteText.trim()) {
      showToast('اكتب الملاحظة أولاً');
      return;
    }
    const e = events.find(x => x.id === aiNoteEventId);
    if (!e) return;
    const author = role === 'admin' ? 'الأدمن' : role === 'consultant' ? 'المستشار' : 'العميل';
    setNotesStore(prev => ({
      ...prev,
      [e.id]: [{ text: aiNoteText, author, visible: true, time: new Date().toLocaleString('en-GB') }, ...(prev[e.id] || [])]
    }));
    addActivity(e.id, `أضاف ${author} ملاحظة: ${aiNoteText}`);
    addSystemMessage(e.client, `ملاحظة من ${author}: ${aiNoteText}`);
    setAiNoteText('');
    showToast('تمت إضافة الملاحظة وإرسالها للمحادثة');
  };

  // 6. Admin Session Intel Modal
  const [intelEvent, setIntelEvent] = useState(null);

  const openAdminSessionIntel = (eObj) => {
    setIntelEvent(eObj);
    setAdminIntelOpen(true);
  };

  // 7. Financial Alerts Modal
  const [financeQuestion, setFinanceQuestion] = useState('');
  const [financeAnswer, setFinanceAnswer] = useState('يمكنني ترتيب المتابعات حسب موعد الجلسة وحالة الدفع وقيمة المبلغ.');

  const askFinanceAI = () => {
    const needs = events.filter(e => isAllowed(e) && e.payment !== 'paid').sort((a, b) => parseISO(a.date) - parseISO(b.date));
    if (needs.length) {
      const first = needs[0];
      setFinanceAnswer(`الأولوية: ${getClient(first.client).name} — ${first.title} — ${paymentLabels[first.payment]} — JOD ${first.amount}. ثم تابع الحالات الأقرب موعدًا.`);
    } else {
      setFinanceAnswer('لا توجد حالات دفع تحتاج متابعة حاليًا.');
    }
  };

  // 8. New Consultation Booking Modal
  const [newClient, setNewClient] = useState(null);
  const [newAdvisor, setNewAdvisor] = useState('');
  const [newType, setNewType] = useState('استشارة ضريبية');
  const [newMeeting, setNewMeeting] = useState('video');
  const [newDate, setNewDate] = useState(iso(new Date()));
  const [newDuration, setNewDuration] = useState(60);
  const [newSlot, setNewSlot] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');

  // Cross-booking: consultant booking with another consultant (different specialization)
  const [crossConsultants, setCrossConsultants] = useState([]);
  const [crossSelectedId, setCrossSelectedId] = useState('');
  const [crossServices, setCrossServices] = useState([]);
  const [crossSelectedServiceId, setCrossSelectedServiceId] = useState('');
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossBooking, setCrossBooking] = useState(false);

  // Fetch other consultants (different specialization) when consultant opens modal
  const fetchCrossConsultants = useCallback(async () => {
    const token = auth?.token;
    if (!token || role !== 'consultant') return;
    try {
      setCrossLoading(true);
      // Get my own profile to know my specialization
      const myProfile = await consultantService.getMyProfile(token);
      const mySpecId = myProfile?.specialization_id || myProfile?.specializations?.[0]?.id;

      // Get all consultants
      const all = await consultantService.getConsultants({}, token);
      const list = Array.isArray(all) ? all : (all?.consultants || all?.data || []);

      // Filter: exclude self and exclude same specialization
      const others = list.filter(c => {
        if (c.user_id === auth?.user?.id) return false;
        if (!mySpecId) return true;
        const theirSpec = c.specialization_id || c.specializations?.[0]?.id;
        return theirSpec !== mySpecId;
      });
      setCrossConsultants(others);
      if (others.length > 0) {
        setCrossSelectedId(others[0].id);
      }
    } catch (err) {
      console.warn('Cross consultants fetch:', err);
    } finally {
      setCrossLoading(false);
    }
  }, [auth?.token, auth?.user?.id, role]);

  // Fetch services when a cross consultant is selected
  useEffect(() => {
    if (!crossSelectedId || role !== 'consultant') return;
    const token = auth?.token;
    if (!token) return;
    consultantService.getConsultantServices(crossSelectedId, token).then(res => {
      const list = Array.isArray(res) ? res : [];
      const active = list.filter(s => s.is_active !== false);
      setCrossServices(active);
      setCrossSelectedServiceId(active[0]?.id || '');
    }).catch(() => setCrossServices([]));
  }, [crossSelectedId, auth?.token, role]);

  // Submit cross-booking
  const saveCrossBooking = async () => {
    if (!crossSelectedId) { showToast('اختر المستشار'); return; }
    if (!newDate) { showToast('اختر التاريخ'); return; }
    if (newSlot === null) { showToast('اختر الوقت المتاح'); return; }
    const token = auth?.token;
    if (!token) { showToast('يجب تسجيل الدخول أولاً'); return; }
    try {
      setCrossBooking(true);
      const [y, m, d] = newDate.split('-').map(Number);
      const h = Math.floor(newSlot);
      const min = Math.round((newSlot - h) * 60);
      const scheduledAt = new Date(Date.UTC(y, m - 1, d, h, min)).toISOString();
      await appointmentService.bookAppointment({
        consultant_id: crossSelectedId,
        service_id: crossSelectedServiceId || undefined,
        scheduled_at: scheduledAt,
        duration_minutes: newDuration,
        session_type: newMeeting === 'video' ? 'video_call' : newMeeting === 'chat' ? 'chat' : 'video_call',
        notes: newQuestion || 'استشارة بين مستشارين — تخصصات مختلفة'
      }, token);
      showToast('✅ تم إرسال طلب الاستشارة للمستشار بنجاح');
      setNewConsultOpen(false);
      setNewQuestion('');
      setNewSlot(null);
      fetchBackendAppointments();
    } catch (err) {
      showToast('حدث خطأ أثناء الحجز، تأكد من البيانات');
      console.error('Cross booking error:', err);
    } finally {
      setCrossBooking(false);
    }
  };

  const activeBookingAdvisor = role === 'consultant' ? currentConsultant : newAdvisor;
  const advisorOffer = advisorCatalog[activeBookingAdvisor]?.[newMeeting] || { durations: [30, 60, 90], prices: { 30: 100, 60: 180, 90: 250 }, price: 200 };
  const computedPrice = newMeeting === 'report' ? advisorOffer.price : (advisorOffer.prices[newDuration] || 0);

  const availableNewSlots = useMemo(() => {
    if (newMeeting === 'report') return [];
    const durHours = Number(newDuration) / 60;
    const slots = [];
    for (let t = 8; t <= 19; t += 0.5) {
      const busy = events.some(o => o.advisor === activeBookingAdvisor && o.date === newDate && !(t + durHours <= o.start || t >= o.start + o.dur));
      slots.push({ t, busy });
    }
    return slots;
  }, [newMeeting, newDuration, activeBookingAdvisor, newDate, events]);

  const saveNewConsultation = () => {
    if (!newQuestion.trim()) {
      showToast('اكتب موضوع الاستشارة');
      return;
    }
    if (newMeeting !== 'report' && newSlot === null) {
      showToast('اختر وقتاً متاحاً');
      return;
    }
    const durHours = newMeeting === 'report' ? 0.5 : Number(newDuration) / 60;
    const clientVal = role === 'user' ? currentUserClientId : Number(newClient);
    const newEventObj = {
      id: Date.now(),
      date: newDate,
      start: newMeeting === 'report' ? 12 : newSlot,
      dur: durHours,
      client: clientVal,
      title: newType,
      type: newType,
      advisor: activeBookingAdvisor,
      status: 'pending',
      payment: 'waiting',
      amount: computedPrice,
      meeting: newMeeting,
      question: newQuestion,
      docs: 0,
      unread: 0,
      notes: 0
    };
    setEvents(prev => [...prev, newEventObj]);
    addActivity(newEventObj.id, 'تم إنشاء الاستشارة');
    addSystemMessage(clientVal, `تم إنشاء طلب استشارة ${serviceLabels[newMeeting]} بتاريخ ${newDate} مع المستشار ${activeBookingAdvisor}.`);
    setNewConsultOpen(false);
    showToast('تم إنشاء الاستشارة وإشعار العميل');
  };

  // 9. Video Room Simulation
  const [videoTimer, setVideoTimer] = useState(0);
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [videoSessionNotes, setVideoSessionNotes] = useState('');

  useEffect(() => {
    let interval = null;
    if (videoOpen) {
      setVideoTimer(0);
      interval = setInterval(() => {
        setVideoTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoOpen]);

  const endVideoSession = () => {
    if (selectedEvent) {
      if (videoSessionNotes.trim()) {
        setNotesStore(prev => ({
          ...prev,
          [selectedEvent.id]: [{ text: videoSessionNotes, visible: false, time: new Date().toLocaleString('en-GB') }, ...(prev[selectedEvent.id] || [])]
        }));
        addActivity(selectedEvent.id, 'تم حفظ ملاحظات جلسة الفيديو');
      }
      if (role !== 'user') {
        setEvents(prev => prev.map(item => item.id === selectedEvent.id ? { ...item, status: 'completed' } : item));
        addSystemMessage(selectedEvent.client, 'تم إنهاء جلسة الاستشارة بنجاح.');
      }
    }
    setVideoOpen(false);
    showToast('تم إنهاء الجلسة');
  };

  // 10. Reminders
  const [remDate, setRemDate] = useState('2026-08-24');
  const [remTime, setRemTime] = useState('10:00');
  const [remType, setRemType] = useState('تذكير داخلي');
  const [remNote, setRemNote] = useState('');

  const saveReminder = () => {
    if (!remDate || !remTime || !remNote.trim()) {
      showToast('أكمل بيانات التذكير والملاحظة');
      return;
    }
    if (!selectedEvent) return;
    setRemindersStore(prev => ({
      ...prev,
      [selectedEvent.id]: [{ date: remDate, time: remTime, type: remType, note: remNote }, ...(prev[selectedEvent.id] || [])]
    }));
    addActivity(selectedEvent.id, `تمت إضافة ${remType}: ${remNote}`);
    setReminderOpen(false);
    showToast('تم حفظ التذكير والمتابعة');
  };

  // Fetch chat messages from backend when chat is open
  useEffect(() => {
    if (!chatOpen || !selectedClient || !auth?.token) return;
    const ev = events.find(x => x.client === selectedClient);
    if (!ev || typeof ev.id !== 'string' || !ev.id.includes('-')) return;

    apiFetch(`/api/chat/${ev.id}/messages`, { method: 'GET' }, auth.token)
      .then(res => {
        if (Array.isArray(res)) {
          const formattedMsgs = res.map(m => ({
            kind: 'user',
            me: m.sender_id === user?.id,
            t: m.content,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setMessagesStore(prev => ({ ...prev, [selectedClient]: formattedMsgs }));
        }
      })
      .catch(err => console.warn('Fetch chat messages notice:', err));
  }, [chatOpen, selectedClient, auth?.token, events, user?.id]);

  const sendChatMessage = async () => {
    if (!chatMsgInput.trim()) return;
    const textToSend = chatMsgInput.trim();
    setChatMsgInput('');

    // Optimistically add to UI
    setMessagesStore(prev => ({
      ...prev,
      [selectedClient]: [
        ...(prev[selectedClient] || []),
        { kind: 'user', me: true, t: textToSend, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));

    // Send to persistent backend API
    const ev = events.find(x => x.client === selectedClient);
    const token = auth?.token;
    if (ev && token && typeof ev.id === 'string' && ev.id.includes('-')) {
      try {
        await apiFetch(`/api/chat/${ev.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: textToSend })
        }, token);
      } catch (err) {
        console.warn('Send chat message backend notice:', err);
      }
    }
  };

  // Save drawer note
  const [drawerNoteText, setDrawerNoteText] = useState('');
  const [drawerNoteVisible, setDrawerNoteVisible] = useState(false);

  const saveDrawerNote = () => {
    if (!drawerNoteText.trim() || !selectedEvent) return;
    setNotesStore(prev => ({
      ...prev,
      [selectedEvent.id]: [{ text: drawerNoteText, author: role === 'admin' ? 'الأدمن' : 'المستشار', visible: drawerNoteVisible, time: new Date().toLocaleString('en-GB') }, ...(prev[selectedEvent.id] || [])]
    }));
    addActivity(selectedEvent.id, 'أضاف المستشار ملاحظة' + (drawerNoteVisible ? ' مرئية للعميل' : ' داخلية'));
    if (drawerNoteVisible) addSystemMessage(selectedEvent.client, 'ملاحظة من المستشار: ' + drawerNoteText);
    setDrawerNoteText('');
    showToast('تم حفظ الملاحظة' + (drawerNoteVisible ? ' وإرسالها للعميل' : ''));
  };

  // Reassign Advisor (Admin Only)
  const reassignAdvisor = (newAdv) => {
    if (role !== 'admin') {
      showToast('لا يملك المستشار صلاحية إعادة التعيين');
      return;
    }
    const old = selectedEvent.advisor;
    setEvents(prev => prev.map(item => item.id === selectedEvent.id ? { ...item, advisor: newAdv } : item));
    setSelectedEvent(prev => ({ ...prev, advisor: newAdv }));
    addActivity(selectedEvent.id, `تم تغيير المستشار من ${old} إلى ${newAdv}`);
    addSystemMessage(selectedEvent.client, `تم تحديث المستشار المسؤول عن جلستك إلى ${newAdv}.`);
    showToast('تم تغيير المستشار');
  };

  // Drag & drop handlers on weekly calendar grid
  const handleDragOverWeek = (e) => {
    e.preventDefault();
  };

  const handleDropWeek = (e, colIndex) => {
    e.preventDefault();
    const id = +e.dataTransfer.getData('text/plain');
    const evt = events.find(x => x.id === id);
    if (!evt || !isAllowed(evt)) return;
    const startOfWeekDate = startOfWeek(anchorDate);
    const targetDate = iso(addDays(startOfWeekDate, colIndex));
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newStart = Math.max(8, Math.min(21 - evt.dur, 8 + Math.round((y / 64) * 4) / 4));

    setSelectedEvent(evt);
    setReschedDate(targetDate);
    setReschedTime(newStart);
    setReschedReason('إعادة جدولة عبر السحب والإفلات بالتقويم');
    setRescheduleOpen(true);
  };

  return (
    <div className="diwan-appointments-root">
      <div className="app-shell">
        {/* Workspace */}
        <main className="workspace">
          {/* Topbar */}
          <header className="topbar">
            <div className="top-right">
              <div className="user-block">
                <div className="avatar">
                  {role === 'admin' ? 'SH' : role === 'consultant' ? 'AN' : 'RK'}
                </div>
                <div className="user-meta">
                  <b>{user?.full_name || (role === 'admin' ? 'سعيد هارون (الإدارة)' : role === 'consultant' ? 'أحمد نصار (مستشار)' : 'رانيا الخطيب (عميل)')}</b>
                  <span>{role === 'admin' ? 'لوحة المواعيد الإدارية الشاملة' : role === 'consultant' ? 'جدول مواعيد واستشارات المستشار' : 'جدول استشاراتي ومواعيدي'}</span>
                </div>
              </div>
              <button className="primary" onClick={() => { setNewSlot(null); setNewConsultOpen(true); if (role === 'consultant') fetchCrossConsultants(); }}>+ استشارة جديدة</button>
            </div>
            <div className="top-left">
              <button className="icon-btn" title="تحديث التقويم من الخادم" onClick={() => { fetchBackendAppointments(); showToast('تم تحديث ومزامنة المواعيد من الخادم'); }}>↻</button>
              <button className="icon-btn" title="البحث" onClick={() => setShowFilters(f => !f)}>⌕</button>
              <button className="icon-btn" title="المساعدة" onClick={() => showToast('المساعدة')}>?</button>
            </div>
          </header>

          {/* Calendar Header */}
          <section className="calendar-head">
            <div className="title-row">
              <div>
                <h1>المواعيد</h1>
                <div style={{ fontSize: '9px', color: '#8c93a0', marginTop: '3px' }}>
                  {role === 'admin' ? 'عرض جميع استشارات المنصة' : role === 'consultant' ? 'عرض جلسات أحمد نصار فقط' : 'عرض الاستشارات التي حجزتها رانيا الخطيب'}
                </div>
              </div>
              <div className="calendar-actions">
                <button className="ghost" onClick={() => navigatePeriod(-1)}>‹</button>
                <button className="ghost" onClick={goToday}>اليوم</button>
                <button className="ghost" onClick={() => navigatePeriod(1)}>›</button>
                <div className="period-picker">
                  <select value={anchorDate.getMonth()} onChange={(e) => {
                    const m = +e.target.value;
                    setAnchorDate(prev => new Date(prev.getFullYear(), m, prev.getDate(), 12));
                  }}>
                    {monthNames.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <select value={anchorDate.getFullYear()} onChange={(e) => {
                    const y = +e.target.value;
                    setAnchorDate(prev => new Date(y, prev.getMonth(), prev.getDate(), 12));
                  }}>
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="seg">
                  <button className={currentView === 'week' ? 'active' : ''} onClick={() => setCurrentView('week')}>أسبوع</button>
                  <button className={currentView === 'day' ? 'active' : ''} onClick={() => setCurrentView('day')}>يوم</button>
                  <button className={currentView === 'month' ? 'active' : ''} onClick={() => setCurrentView('month')}>شهر</button>
                </div>
                <button className="ghost" onClick={() => setShowFilters(f => !f)}>الفلاتر</button>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <strong className="num">{periodLabel}</strong>
                <span>الفترة الحالية</span>
              </div>
              <div className="stat">
                <strong className="num">{stats.count}</strong>
                <span>الاستشارات</span>
              </div>
              <div className="stat">
                <strong className="num">{stats.paid}</strong>
                <span>مدفوعة</span>
              </div>
              <div className="stat">
                <strong className="num">JOD {stats.value.toLocaleString('en-US')}</strong>
                <span>قيمة الحجوزات</span>
              </div>
            </div>

            {showFilters && (
              <div className="filterbar">
                <input
                  placeholder="ابحث باسم العميل أو موضوع الاستشارة..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
                {role === 'admin' && (
                  <select value={filterAdvisor} onChange={(e) => setFilterAdvisor(e.target.value)}>
                    <option value="">كل المستشارين</option>
                    {advisors.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                )}
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">كل حالات الجلسة</option>
                  <option value="confirmed">مؤكدة</option>
                  <option value="pending">معلقة</option>
                  <option value="progress">قيد التنفيذ</option>
                  <option value="rejected">مرفوضة</option>
                  <option value="cancelled">ملغاة</option>
                  <option value="completed">مكتملة</option>
                </select>
                <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                  <option value="">كل حالات الدفع</option>
                  <option value="paid">مدفوع</option>
                  <option value="unpaid">غير مدفوع</option>
                  <option value="waiting">بانتظار الدفع</option>
                  <option value="rejected">دفعة مرفوضة</option>
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">كل أنواع الضرائب</option>
                  {taxTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button className="ghost" onClick={() => {
                  setFilterSearch('');
                  setFilterAdvisor('');
                  setFilterStatus('');
                  setFilterPayment('');
                  setFilterType('');
                }}>
                  مسح الفلاتر
                </button>
              </div>
            )}
          </section>

          {/* Calendar Views */}
          <section className="calendar-wrap">
            {/* 1. Week View */}
            {currentView === 'week' && (
              <div className="cal-grid">
                <div className="corner"></div>
                {/* 7 Days Header */}
                {Array.from({ length: 7 }, (_, i) => {
                  const startW = startOfWeek(anchorDate);
                  const d = addDays(startW, i);
                  const isToday = iso(d) === '2026-08-24';
                  return (
                    <div key={i} className={`dayhead ${isToday ? 'today' : ''}`}>
                      <span className="dow">{shortDay[d.getDay()]}</span>
                      <span className="date num">{d.getDate()}</span>
                    </div>
                  );
                })}

                {/* Times Column */}
                <div className="timecol">
                  {Array.from({ length: 14 }, (_, i) => (
                    <div key={i} className="time num">{pad(i + 8)}:00</div>
                  ))}
                </div>

                {/* 7 Columns for Days */}
                {Array.from({ length: 7 }, (_, colIdx) => {
                  const startW = startOfWeek(anchorDate);
                  const colDate = iso(addDays(startW, colIdx));
                  const colEvents = filteredEvents.filter(e => e.date === colDate);

                  return (
                    <div
                      key={colIdx}
                      className="daycol"
                      data-index={colIdx}
                      onDragOver={handleDragOverWeek}
                      onDrop={(e) => handleDropWeek(e, colIdx)}
                    >
                      {colEvents.map(evt => {
                        const cl = getClient(evt.client);
                        const top = (evt.start - 8) * 64 + 3;
                        const height = evt.dur * 64 - 6;

                        return (
                          <div
                            key={evt.id}
                            className={`event st-${evt.status} ${selectedEvent?.id === evt.id ? 'selected' : ''}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(evt.id))}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopover({
                                open: true,
                                x: Math.max(12, Math.min(window.innerWidth - 335, rect.left - 170)),
                                y: Math.min(window.innerHeight - 280, rect.top + 25),
                                event: evt
                              });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              openDrawer(evt);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, evt)}
                          >
                            <b>{evt.title}</b>
                            <small>
                              <span className="num">{timeFmt(evt.start)}</span> · {cl.name}
                            </small>
                            <div className="badges">
                              <span className="tinybadge">{statusLabels[evt.status]}</span>
                              <span className="tinybadge">{paymentLabels[evt.payment]}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div className="now-line" style={{ top: '240px' }}></div>
              </div>
            )}

            {/* 2. Day View */}
            {currentView === 'day' && (
              <div className="day-view">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
                  <b>{dayNames[selectedDay.getDay()]} · <span className="num">{fmtShort(selectedDay)}</span></b>
                  <input
                    type="date"
                    value={iso(selectedDay)}
                    onChange={(e) => {
                      const d = parseISO(e.target.value);
                      setSelectedDay(d);
                      setAnchorDate(d);
                    }}
                  />
                </div>
                <div className="day-view-grid">
                  <div>
                    {Array.from({ length: 14 }, (_, i) => (
                      <div key={i} className="day-time num">{pad(i + 8)}:00</div>
                    ))}
                  </div>
                  <div className="day-lane">
                    {filteredEvents.filter(e => e.date === iso(selectedDay)).map(evt => {
                      const cl = getClient(evt.client);
                      return (
                        <div
                          key={evt.id}
                          className={`day-event st-${evt.status}`}
                          style={{ top: `${(evt.start - 8) * 64 + 3}px`, height: `${evt.dur * 64 - 6}px` }}
                          onClick={() => openDrawer(evt)}
                        >
                          <b>{evt.title}</b>
                          <div style={{ fontSize: '10px', marginTop: '4px' }}>
                            {cl.name} · <span className="num">{timeFmt(evt.start)}</span> · {evt.advisor}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <span className={`payment-badge pay-${evt.payment}`}>{paymentLabels[evt.payment]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Month View */}
            {currentView === 'month' && (
              <div className="month-view">
                <div className="month-grid">
                  {['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'].map(h => (
                    <div key={h} className="month-head">{h}</div>
                  ))}
                  {Array.from({ length: 42 }, (_, i) => {
                    const y = anchorDate.getFullYear();
                    const m = anchorDate.getMonth();
                    const first = new Date(y, m, 1);
                    const startGrid = startOfWeek(first);
                    const cellDate = addDays(startGrid, i);
                    const isSameMonth = cellDate.getMonth() === m;
                    const cellDateISO = iso(cellDate);
                    const cellEvents = filteredEvents.filter(e => e.date === cellDateISO).slice(0, 4);

                    return (
                      <div
                        key={i}
                        className={`month-cell ${cellDateISO === '2026-08-24' ? 'today' : ''}`}
                        style={{ opacity: isSameMonth ? 1 : 0.45 }}
                      >
                        <div className="md num">{cellDate.getDate()}</div>
                        {cellEvents.map(evt => (
                          <div
                            key={evt.id}
                            className={`month-event st-${evt.status}`}
                            onClick={() => openDrawer(evt)}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Floating Bottom Dock */}
      <div className="floating-dock">
        <button title="المحادثات" onClick={() => setChatOpen(true)}>✉</button>
        <button title="الملخص الذكي" onClick={() => setAiOpen(true)}>✦</button>
        <button title="استشارة جديدة" onClick={() => { setNewSlot(null); setNewConsultOpen(true); if (role === 'consultant') fetchCrossConsultants(); }}>◷</button>
        <button title="مسار الاستشارات" onClick={() => setKanbanOpen(true)}>▥</button>
        <button className="accent" title="حجز فوري" onClick={() => { setNewSlot(null); setNewConsultOpen(true); if (role === 'consultant') fetchCrossConsultants(); }}>＋</button>
      </div>

      {/* Popover */}
      {popover.open && popover.event && (
        <div className="popover" style={{ left: `${popover.x}px`, top: `${popover.y}px` }}>
          <div className="pop-title">
            <div>
              <b>{popover.event.title}</b>
              <div style={{ fontSize: '9px', color: '#8a91a0', marginTop: '3px' }}>{popover.event.type}</div>
            </div>
            <span className="chip">{statusLabels[popover.event.status]}</span>
          </div>
          <div className="person">
            <div className="ava" style={{ background: getClient(popover.event.client).color }}>
              {initials(getClient(popover.event.client).name)}
            </div>
            <div>
              <b>{getClient(popover.event.client).name}</b>
              <div style={{ fontSize: '9px', color: '#8d94a1' }}>{getClient(popover.event.client).company}</div>
            </div>
          </div>
          <div className="meta">
            <div>
              التاريخ والوقت
              <b className="num">{fmtShort(parseISO(popover.event.date))} · {timeFmt(popover.event.start)}</b>
            </div>
            <div>
              المستشار
              <b>{popover.event.advisor}</b>
            </div>
            <div>
              الدفع
              <b><span className={`payment-badge pay-${popover.event.payment}`}>{paymentLabels[popover.event.payment]}</span></b>
            </div>
            <div>
              الأتعاب
              <b className="num">JOD {popover.event.amount}</b>
            </div>
          </div>
          <div className="pop-actions">
            <button onClick={() => { handleOpenChat(popover?.event); setPopover(p => ({ ...p, open: false })); }}>مراسلة</button>
            <button onClick={() => { openRescheduleModal(popover.event); setPopover(p => ({ ...p, open: false })); }}>إعادة جدولة</button>
            <button className="main" onClick={() => openDrawer(popover.event)}>فتح</button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.open && contextMenu.event && (
        <div className="context-menu" style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}>
          <button onClick={() => { openDrawer(contextMenu.event); setContextMenu(c => ({ ...c, open: false })); }}>فتح تفاصيل الجلسة</button>
          <button onClick={() => { handleOpenChat(contextMenu?.event); setContextMenu(c => ({ ...c, open: false })); }}>مراسلة العميل</button>
          <button onClick={() => { openRescheduleModal(contextMenu.event); setContextMenu(c => ({ ...c, open: false })); }}>إعادة جدولة</button>
          <div className="sep"></div>
          <button onClick={() => { openStatusModal(contextMenu.event); setContextMenu(c => ({ ...c, open: false })); }}>تغيير حالة الجلسة</button>
          <button onClick={() => { openPaymentModal(contextMenu.event); setContextMenu(c => ({ ...c, open: false })); }}>تحديث حالة الدفع</button>
          <button onClick={() => { setSelectedEvent(contextMenu.event); setReminderOpen(true); setContextMenu(c => ({ ...c, open: false })); }}>إضافة تذكير / متابعة</button>
          <div className="sep"></div>
          <button onClick={() => { setSelectedEvent(contextMenu.event); setVideoOpen(true); setContextMenu(c => ({ ...c, open: false })); }}>بدء مكالمة الفيديو</button>
        </div>
      )}

      {/* Slide-Out Details Drawer */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''} ${isDrawerCollapsed ? 'collapsed' : ''}`}>
        <button
          className="drawer-peek"
          onClick={() => setIsDrawerCollapsed(c => !c)}
          title={isDrawerCollapsed ? 'إظهار اللوحة' : 'إخفاء اللوحة'}
        >
          <span>‹</span>
        </button>
        <div className="drawer-head">
          <div className="dh-top">
            <div>
              <h2>{selectedEvent?.title || 'تفاصيل الاستشارة'}</h2>
              <p>{selectedEvent ? `${getClient(selectedEvent.client, selectedEvent.clientName).name} · ${selectedEvent.type}` : ''}</p>
            </div>
            <button className="xbtn" onClick={() => setIsDrawerOpen(false)}>×</button>
          </div>
        </div>

        <div className="drawer-tabs">
          <button className={drawerTab === 'overview' ? 'active' : ''} onClick={() => setDrawerTab('overview')}>نظرة عامة</button>
          <button className={drawerTab === 'request' ? 'active' : ''} onClick={() => setDrawerTab('request')}>{role === 'user' ? 'طلبي' : 'طلب العميل'}</button>
          {role !== 'user' && (
            <button className={drawerTab === 'notes' ? 'active' : ''} onClick={() => setDrawerTab('notes')}>الملاحظات</button>
          )}
          <button className={drawerTab === 'files' ? 'active' : ''} onClick={() => setDrawerTab('files')}>الملفات</button>
          <button className={drawerTab === 'invoice' ? 'active' : ''} onClick={() => setDrawerTab('invoice')}>الدفع والفاتورة</button>
          <button className={drawerTab === 'history' ? 'active' : ''} onClick={() => setDrawerTab('history')}>السجل</button>
        </div>

        <div className="drawer-body">
          {selectedEvent && (
            <>
              {drawerTab === 'overview' && (
                <>
                  <div className="role-banner">
                    <div>
                      <b>{role === 'admin' ? 'عرض الأدمن' : role === 'consultant' ? 'عرض المستشار' : 'عرض المستخدم'}</b>
                      <span>{role === 'admin' ? 'تحكم كامل في الجلسة والتعيين والمتابعة' : role === 'consultant' ? 'إدارة الجلسة المهنية دون تغيير المستشار أو الأتعاب' : 'متابعة الحجز والدفع والتواصل مع المستشار'}</span>
                    </div>
                    <span className="audit-chip">{role === 'admin' ? 'Admin Control' : role === 'consultant' ? selectedEvent.advisor : 'حجزي'}</span>
                  </div>

                  <div className="section-card">
                    <h4>بيانات الجلسة</h4>
                    <div className="two">
                      <div className="field">
                        <label>العميل</label>
                        <div>{getClient(selectedEvent.client, selectedEvent.clientName).name}</div>
                      </div>
                      <div className="field">
                        <label>الحالة</label>
                        <div>{statusLabels[selectedEvent.status]}</div>
                      </div>
                      <div className="field">
                        <label>التاريخ</label>
                        <div className="num">{fmtShort(parseISO(selectedEvent.date))}</div>
                      </div>
                      <div className="field">
                        <label>الوقت</label>
                        <div className="num">{timeFmt(selectedEvent.start)}</div>
                      </div>
                      <div className="field">
                        <label>المستشار</label>
                        {role === 'admin' ? (
                          <select value={selectedEvent.advisor} onChange={(e) => reassignAdvisor(e.target.value)}>
                            {advisors.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        ) : (
                          <div>{selectedEvent.advisor}</div>
                        )}
                      </div>
                      <div className="field">
                        <label>المدة</label>
                        <div className="num">{selectedEvent.dur} h</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>الدفع</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`payment-badge pay-${selectedEvent.payment}`}>{paymentLabels[selectedEvent.payment]}</span>
                      <button className="ghost" onClick={() => openPaymentModal(selectedEvent)}>
                        {role === 'user' ? 'إتمام الدفع' : 'إدارة الدفع'}
                      </button>
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>موضوع الاستشارة</h4>
                    <div>{selectedEvent.question}</div>
                  </div>
                </>
              )}

              {drawerTab === 'request' && (
                <div className="section-card">
                  <h4>{role === 'user' ? 'طلب الاستشارة' : 'طلب العميل'}</h4>
                  <div className="field">
                    <label>السؤال المقدم</label>
                    <textarea defaultValue={selectedEvent.question} readOnly />
                  </div>
                  <div className="field" style={{ marginTop: '8px' }}>
                    <label>النتيجة المطلوبة</label>
                    <textarea defaultValue="الحصول على رأي ضريبي موثق وخيارات عملية واضحة قبل اتخاذ القرار." readOnly />
                  </div>
                </div>
              )}

              {drawerTab === 'notes' && role !== 'user' && (
                <>
                  <div className="section-card">
                    <h4>إضافة ملاحظة</h4>
                    <div className="field">
                      <textarea
                        value={drawerNoteText}
                        onChange={(e) => setDrawerNoteText(e.target.value)}
                        placeholder="أضف ملاحظة على الجلسة..."
                      />
                    </div>
                    <label style={{ display: 'flex', gap: '7px', alignItems: 'center', marginTop: '8px', fontSize: '9px' }}>
                      <input
                        type="checkbox"
                        checked={drawerNoteVisible}
                        onChange={(e) => setDrawerNoteVisible(e.target.checked)}
                      />
                      مرئية للعميل
                    </label>
                    <button className="primary" style={{ marginTop: '10px' }} onClick={saveDrawerNote}>
                      حفظ الملاحظة
                    </button>
                  </div>
                  <div className="section-card">
                    <h4>الملاحظات السابقة</h4>
                    {(notesStore[selectedEvent.id] || []).length > 0 ? (
                      (notesStore[selectedEvent.id] || []).map((n, idx) => (
                        <div key={idx} className="appt-mini">
                          <b>{n.author || 'المستشار'} {n.visible ? '(مرئية للعميل)' : '(داخلية)'}</b>
                          <div>{n.text}</div>
                          <div className="num" style={{ fontSize: '8px', color: '#999', marginTop: '3px' }}>{n.time}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#9299a6', fontSize: '10px' }}>لا توجد ملاحظات مسجلة بعد.</div>
                    )}
                  </div>
                </>
              )}

              {drawerTab === 'files' && (
                <div className="section-card">
                  <h4>{role === 'user' ? 'مستنداتي' : 'مستندات الجلسة'}</h4>
                  <div className="appt-mini">
                    Service Agreement.pdf <span style={{ float: 'left' }} className="num">1.8 MB</span>
                  </div>
                  <div className="appt-mini">
                    Tax Invoice 08-2026.pdf <span style={{ float: 'left' }} className="num">640 KB</span>
                  </div>
                  <button className="ghost" style={{ marginTop: '9px' }} onClick={() => showToast('تم فتح رفع المستندات')}>
                    + إضافة مستند
                  </button>
                </div>
              )}

              {drawerTab === 'invoice' && (
                <>
                  <div className="section-card">
                    <h4>حالة الدفع</h4>
                    <span className={`payment-badge pay-${selectedEvent.payment}`}>{paymentLabels[selectedEvent.payment]}</span>
                    <button className="ghost" style={{ marginRight: '8px' }} onClick={() => openPaymentModal(selectedEvent)}>
                      {role === 'user' ? 'سداد الآن' : 'تغيير الحالة'}
                    </button>
                  </div>
                  <div className="section-card">
                    <h4>الفاتورة</h4>
                    <div className="two">
                      <div className="field">
                        <label>المبلغ</label>
                        <input className="num" defaultValue={selectedEvent.amount} readOnly />
                      </div>
                      <div className="field">
                        <label>العملة</label>
                        <div>JOD</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'history' && (
                <div className="section-card">
                  <h4>سجل النشاط</h4>
                  {(activity[selectedEvent.id] || []).length > 0 ? (
                    (activity[selectedEvent.id] || []).map((x, idx) => (
                      <div key={idx} className="appt-mini">
                        <b>{x.text}</b>
                        <div className="num">{x.time}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#9299a6', fontSize: '10px' }}>لا يوجد نشاط إضافي بعد.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="drawer-footer">
          {selectedEvent && (
            <>
              {role !== 'user' ? (
                <>
                  <button onClick={() => openStatusModal(selectedEvent)}>تغيير الحالة</button>
                  <button onClick={() => openRescheduleModal(selectedEvent)}>إعادة جدولة</button>
                  <button className="main" onClick={() => { handleOpenChat(selectedEvent); setDrawerOpen(false); }}>مراسلة العميل</button>
                </>
              ) : (
                <>
                  <button onClick={() => openRescheduleModal(selectedEvent)}>طلب إعادة جدولة</button>
                  <button onClick={() => openPaymentModal(selectedEvent)}>الدفع</button>
                  <button className="main" onClick={() => { handleOpenChat(selectedEvent); setDrawerOpen(false); }}>مراسلة المستشار</button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Bottom Financial Bar */}
      <div className="financial-bar">
        {role === 'admin' && (
          <>
            <div className="finance-group">
              <div className="finance-item">
                <span>إجمالي الحجوزات</span>
                <b className="num">JOD {events.reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>المحصل</span>
                <b className="num">JOD {events.filter(e => e.payment === 'paid').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>المستحق</span>
                <b className="num">JOD {events.filter(e => e.payment !== 'paid').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>الجلسات</span>
                <b className="num">{events.length}</b>
              </div>
            </div>
            <div className="finance-actions">
              <button className="ghost" onClick={() => setAiOpen(true)}>تحليل AI</button>
              <button className="ghost" onClick={() => setFinancialAlertsOpen(true)}>تنبيهات مالية</button>
            </div>
          </>
        )}

        {role === 'consultant' && (
          <>
            <div className="finance-group">
              <div className="finance-item">
                <span>قيمة جلساتي</span>
                <b className="num">JOD {events.filter(e => e.advisor === currentConsultant).reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>مكتملة</span>
                <b className="num">{events.filter(e => e.advisor === currentConsultant && e.status === 'completed').length}</b>
              </div>
              <div className="finance-item">
                <span>بانتظار الدفع</span>
                <b className="num">{events.filter(e => e.advisor === currentConsultant && e.payment !== 'paid').length}</b>
              </div>
            </div>
            <div className="finance-actions">
              <button className="ghost" onClick={() => setAiOpen(true)}>ملخص يومي</button>
            </div>
          </>
        )}

        {role === 'user' && (
          <>
            <div className="finance-group">
              <div className="finance-item">
                <span>إجمالي حجوزاتي</span>
                <b className="num">JOD {events.filter(e => e.client === currentUserClientId).reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>دفعت</span>
                <b className="num">JOD {events.filter(e => e.client === currentUserClientId && e.payment === 'paid').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
              <div className="finance-item">
                <span>المبلغ المستحق</span>
                <b className="num">JOD {events.filter(e => e.client === currentUserClientId && e.payment !== 'paid').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US')}</b>
              </div>
            </div>
            <div className="finance-actions">
              <button className="pay-cta" onClick={() => {
                const firstDue = events.find(e => e.client === currentUserClientId && e.payment !== 'paid');
                if (firstDue) openPaymentModal(firstDue);
                else showToast('لا توجد مبالغ مستحقة');
              }}>
                إتمام الدفع
              </button>
              <button className="ghost" onClick={() => setAiOpen(true)}>مساعد حجوزاتي</button>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Modals & Overlays */}
      {/* ------------------------------------------------------------- */}

      {/* 1. Chat Overlay */}
      {chatOpen && (
        <div className="overlay" onClick={() => setChatOpen(false)}>
          <div className="chat-shell" onClick={(e) => e.stopPropagation()}>
            <section className="contacts">
              <div className="contacts-head">
                <h3>المحادثات</h3>
                <input
                  className="search"
                  placeholder="ابحث عن عميل..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <div className="contact-list">
                {clients
                  .filter(x => !contactSearch || (x.name && x.name.includes(contactSearch)) || (x.company && x.company.includes(contactSearch)))
                  .map(cl => {
                    const msgs = messagesStore[cl.id] || [];
                    const lastMsg = msgs[msgs.length - 1]?.t || 'لا توجد رسائل';
                    return (
                      <div
                        key={cl.id}
                        className={`contact ${selectedClient === cl.id ? 'active' : ''}`}
                        onClick={() => setSelectedClient(cl.id)}
                      >
                        <div className="ca" style={{ background: cl.color || '#0D3C5C' }}>
                          {initials(cl.name)}
                        </div>
                        <div className="ct">
                          <b>{cl.name}</b>
                          <p>{lastMsg}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            <section className="chat-main">
              <div className="chat-top">
                <div className="chat-title">
                  <div className="avatar" style={{ background: getClient(selectedClient).color }}>
                    {initials(getClient(selectedClient).name)}
                  </div>
                  <div>
                    <b>{getClient(selectedClient).name}</b>
                    <div className="online">ملف عميل نشط</div>
                  </div>
                </div>
                <div>
                  <button className="icon-btn" onClick={() => setChatOpen(false)}>×</button>
                </div>
              </div>

              <div className="messages">
                {(messagesStore[selectedClient] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${msg.kind === 'system' ? 'system' : msg.me ? 'me' : ''}`}
                  >
                    {msg.t}
                    <div className="stamp num">{msg.time}</div>
                  </div>
                ))}
              </div>

              <div className="composer">
                <div className="composebox">
                  <textarea
                    placeholder="اكتب رسالة..."
                    value={chatMsgInput}
                    onChange={(e) => setChatMsgInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                  />
                  <div className="compose-actions">
                    <div>
                      <button title="إرفاق ملف" onClick={() => showToast('تمت إضافة مرفق')}>＋</button>
                      <button title="نص محفوظ" onClick={() => setChatMsgInput('تم استلام المستندات وسيتم مراجعتها قبل موعد الجلسة.')}>⌁</button>
                      <button title="مسودة ذكية" onClick={() => setChatMsgInput('بناءً على المعلومات المرسلة، أقترح مراجعة المعالجة الضريبية والمستندات الداعمة خلال الجلسة.')}>✦</button>
                    </div>
                    <button className="send" onClick={sendChatMessage}>إرسال</button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="client-info">
              <div className="profile">
                <div className="bigava" style={{ background: getClient(selectedClient).color }}>
                  {initials(getClient(selectedClient).name)}
                </div>
                <h4>{getClient(selectedClient).name}</h4>
                <p>{getClient(selectedClient).company}</p>
                <button className="ghost" style={{ marginTop: '7px' }} onClick={() => {
                  const ev = events.find(x => x.client === selectedClient && isAllowed(x));
                  if (ev) openDrawer(ev);
                  else showToast('لا توجد جلسات مفتوحة لهذا العميل');
                }}>
                  فتح الملف الضريبي
                </button>
              </div>
              <div className="info-section">
                <h5>بيانات العميل</h5>
                <div className="info-row">
                  <span>الرقم الضريبي</span>
                  <b className="num">{getClient(selectedClient).tax}</b>
                </div>
                <div className="info-row">
                  <span>البريد</span>
                  <b>{getClient(selectedClient).email}</b>
                </div>
                <div className="info-row">
                  <span>الهاتف</span>
                  <b className="num">{getClient(selectedClient).phone}</b>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* 2. Reschedule Modal */}
      {rescheduleOpen && selectedEvent && (
        <div className="overlay" onClick={() => setRescheduleOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>إعادة جدولة الجلسة</b>
                <div style={{ fontSize: '9px', color: '#9299a6', marginTop: '3px' }}>اختر تاريخاً ثم وقتاً متاحاً وأدخل سبب إعادة الجدولة</div>
              </div>
              <button className="icon-btn" onClick={() => setRescheduleOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="resched-layout">
                <div>
                  <div className="mini-cal">
                    <div className="mini-cal-head">
                      <b>{monthNames[parseISO(reschedDate).getMonth()]} <span className="num">{parseISO(reschedDate).getFullYear()}</span></b>
                      <span className="num">{fmtShort(parseISO(reschedDate))}</span>
                    </div>
                    <div className="mini-week">
                      {['اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'].map((x, i) => (
                        <div key={i}>{x}</div>
                      ))}
                    </div>
                    <div className="mini-days">
                      {Array.from({ length: 42 }, (_, i) => {
                        const base = parseISO(reschedDate);
                        const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
                        const gridStart = startOfWeek(monthStart);
                        const d = addDays(gridStart, i);
                        const ds = iso(d);
                        const sameMonth = d.getMonth() === base.getMonth();

                        return (
                          <button
                            key={i}
                            className={`mini-day ${ds === reschedDate ? 'selected' : ''} ${sameMonth ? '' : 'disabled'}`}
                            disabled={!sameMonth}
                            onClick={() => {
                              setReschedDate(ds);
                              setReschedTime(null);
                            }}
                          >
                            <span className="num">{d.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="slot-panel">
                  <h4>الأوقات المتاحة</h4>
                  <div style={{ fontSize: '9px', color: '#9198a4', marginBottom: '8px' }}>
                    مدة الجلسة: <span className="num">{selectedEvent.dur} h</span> · المستشار: {selectedEvent.advisor}
                  </div>
                  <div className="slots">
                    {availableSlotsForReschedule.map(s => (
                      <button
                        key={s.t}
                        className={`slot ${s.busy ? 'busy' : ''} ${reschedTime === s.t ? 'selected' : ''}`}
                        disabled={s.busy}
                        onClick={() => setReschedTime(s.t)}
                      >
                        <span className="num">{timeFmt(s.t)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="reasonbox">
                <label style={{ fontSize: '9px', color: '#7e8694', display: 'block', marginBottom: '4px' }}>سبب إعادة الجدولة *</label>
                <textarea
                  placeholder="مثال: طلب العميل تغيير الموعد بسبب تعارض في الوقت"
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="ghost" onClick={() => setRescheduleOpen(false)}>إلغاء</button>
              <button className="primary" onClick={applyReschedule}>تطبيق الموعد الجديد</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Status Modal */}
      {statusOpen && selectedEvent && (
        <div className="overlay" onClick={() => setStatusOpen(false)}>
          <div className="modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>تغيير حالة الجلسة</b>
              <button className="icon-btn" onClick={() => setStatusOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '10px', color: '#737c8b' }}>
                اسحب الحالة المطلوبة إلى منطقة التطبيق، أو اضغط عليها، ثم اكتب الرسالة واضغط اعتماد التغيير.
              </div>
              <div className="status-dnd-grid">
                {Object.entries(statusLabels).map(([k, v]) => (
                  <div
                    key={k}
                    className={`status-dnd-card sd-${k}`}
                    draggable
                    onDragStart={(e) => {
                      setPendingStatus(k);
                      e.dataTransfer.setData('text/plain', k);
                    }}
                    onClick={() => setPendingStatus(k)}
                  >
                    <b>{v}</b>
                    <span>
                      {k === 'confirmed' ? 'الجلسة مثبتة' : k === 'pending' ? 'بانتظار الإجراء' : k === 'progress' ? 'الجلسة جارية' : k === 'rejected' ? 'تم رفض الطلب' : k === 'cancelled' ? 'تم إلغاء الموعد' : 'تم إنهاء الجلسة'}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className={`status-drop-target ${pendingStatus ? 'selected' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const k = e.dataTransfer.getData('text/plain');
                  if (k) setPendingStatus(k);
                }}
              >
                {pendingStatus ? (
                  <>الحالة المختارة: <b>{statusLabels[pendingStatus]}</b></>
                ) : (
                  'اسحب الحالة الجديدة إلى هنا'
                )}
              </div>

              <div className="reasonbox">
                <label style={{ fontSize: '9px', color: '#7e8694' }}>سبب التغيير / الرسالة التي سترسل للعميل</label>
                <textarea
                  placeholder="اكتب السبب أو الرسالة..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div className="status-apply-row">
                <button className="ghost" onClick={() => setStatusOpen(false)}>إلغاء</button>
                <button className="primary" onClick={applyStatusChange}>اعتماد التغيير</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Modal */}
      {paymentOpen && selectedEvent && (
        <div className="overlay" onClick={() => setPaymentOpen(false)}>
          <div className="modal" style={{ width: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>{role === 'user' ? 'إتمام سداد الاستشارة' : 'إدارة حالة الدفع'}</b>
              <button className="icon-btn" onClick={() => setPaymentOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {role === 'user' ? (
                <>
                  {!userPayMethod && !userPaymentSuccess && (
                    <>
                      <div style={{ fontSize: '9px', color: '#7d8695', marginBottom: '10px' }}>اختر طريقة الدفع المناسبة لإتمام حجزك</div>
                      <div className="payment-methods">
                        <div className="payment-method" onClick={() => setUserPayMethod('card')}>
                          <div className="pay-logo">VISA</div>
                          <div className="text">
                            <b>بطاقة ائتمان</b>
                            <p>فيزا / ماستركارد / أمريكان إكسبريس</p>
                          </div>
                          <span>‹</span>
                        </div>
                        <div className="payment-method" onClick={() => setUserPayMethod('cliq')}>
                          <div className="pay-logo" style={{ background: '#f3f3f3', color: '#111' }}>CliQ</div>
                          <div className="text">
                            <b>تحويل CliQ</b>
                            <p>إرسال فوري عبر نظام الدفع الوطني</p>
                          </div>
                          <span>‹</span>
                        </div>
                        <div className="payment-method" onClick={() => setUserPayMethod('bank')}>
                          <div className="pay-logo">BANK</div>
                          <div className="text">
                            <b>تحويل بنكي</b>
                            <p>حوالة بنكية أو إيداع للحساب</p>
                          </div>
                          <span>‹</span>
                        </div>
                        <div className="payment-method" onClick={() => setUserPayMethod('wallet')}>
                          <div className="pay-logo" style={{ background: '#fff0f2', color: '#d33' }}>▰</div>
                          <div className="text">
                            <b>المحفظة الإلكترونية</b>
                            <p>الدفع عبر محفظتك الإلكترونية</p>
                          </div>
                          <span>‹</span>
                        </div>
                      </div>
                    </>
                  )}

                  {userPayMethod === 'card' && !userPaymentSuccess && (
                    <>
                      <button className="ghost" onClick={() => setUserPayMethod(null)}>‹ الرجوع</button>
                      <div className="payment-card-visual">
                        <div className="kind">Visa Business</div>
                        <div className="chip"></div>
                        <div className="number num">{userCardForm.cardNo || '•••• •••• •••• ••••'}</div>
                        <div className="brand">VISA</div>
                      </div>
                      <div className="payment-card-form">
                        <div className="field">
                          <label>رقم البطاقة</label>
                          <input
                            className="num"
                            placeholder="4000 0000 0000 0000"
                            value={userCardForm.cardNo}
                            onChange={(e) => setUserCardForm(f => ({ ...f, cardNo: e.target.value }))}
                          />
                        </div>
                        <div className="field" style={{ marginTop: '7px' }}>
                          <label>اسم حامل البطاقة</label>
                          <input
                            placeholder="FULL NAME"
                            value={userCardForm.cardName}
                            onChange={(e) => setUserCardForm(f => ({ ...f, cardName: e.target.value }))}
                          />
                        </div>
                        <div className="payment-card-two" style={{ marginTop: '7px' }}>
                          <div className="field">
                            <label>تاريخ الصلاحية</label>
                            <input
                              className="num"
                              placeholder="MM / YY"
                              value={userCardForm.exp}
                              onChange={(e) => setUserCardForm(f => ({ ...f, exp: e.target.value }))}
                            />
                          </div>
                          <div className="field">
                            <label>CVV</label>
                            <input
                              className="num"
                              placeholder="123"
                              value={userCardForm.cvv}
                              onChange={(e) => setUserCardForm(f => ({ ...f, cvv: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="payment-back-actions">
                        <button className="ghost" onClick={() => setUserPayMethod(null)}>الرجوع</button>
                        <button className="primary payment-highlight" onClick={completeUserPayment}>
                          إتمام الدفع — <span className="num">JOD {selectedEvent.amount}</span>
                        </button>
                      </div>
                    </>
                  )}

                  {userPayMethod && userPayMethod !== 'card' && !userPaymentSuccess && (
                    <>
                      <button className="ghost" onClick={() => setUserPayMethod(null)}>‹ الرجوع</button>
                      <div className="pay-step-card" style={{ marginTop: '10px' }}>
                        <h4>{userPayMethod === 'cliq' ? 'بيانات CliQ' : userPayMethod === 'bank' ? 'بيانات الحساب البنكي' : 'بيانات المحفظة'}</h4>
                        <div style={{ fontSize: '9px', lineHeight: '1.8' }}>
                          {userPayMethod === 'cliq' && (
                            <>الاسم المستعار: DiwanJo<br />الرقم: +962 79 123 4567<br />بعد الدفع ارفع صورة الشاشة أو إثبات التحويل.</>
                          )}
                          {userPayMethod === 'bank' && (
                            <>البنك: بنك الأردن<br />اسم الحساب: ديوان للاستشارات الضريبية<br />IBAN: JO12ARAB0000000123456789012<br />ارفع إيصال التحويل بعد الإتمام.</>
                          )}
                          {userPayMethod === 'wallet' && (
                            <>المحفظة: محفظة ديوان الإلكترونية<br />الرقم: +962 79 123 4567<br />بعد الدفع ارفع إثبات التحويل.</>
                          )}
                        </div>
                      </div>
                      <div className="pay-upload">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setUserProofFile(e.target.files?.[0] || null)}
                        />
                        <div style={{ fontSize: '8px', color: '#8d95a2', marginTop: '6px' }}>
                          {userProofFile ? `تم اختيار: ${userProofFile.name}` : 'اضغط لرفع إثبات الدفع'}
                        </div>
                      </div>
                      <div className="payment-back-actions">
                        <button className="ghost" onClick={() => setUserPayMethod(null)}>الرجوع</button>
                        <button className="primary payment-highlight" onClick={completeUserPayment}>
                          إرسال إثبات الدفع
                        </button>
                      </div>
                    </>
                  )}

                  {userPaymentSuccess && (
                    <div className="pay-success">
                      <div className="check">✓</div>
                      <h3>تم تأكيد الدفع</h3>
                      <div style={{ fontSize: '9px', color: '#75808c', marginTop: '5px' }}>تمت معالجة العملية بنجاح.</div>
                      <div className="receipt">
                        <div className="r"><span>رقم المرجع</span><b className="num">{lastTxn}</b></div>
                        <div className="r"><span>الخدمة</span><b>{selectedEvent.title}</b></div>
                        <div className="r"><span>المبلغ</span><b className="num">JOD {selectedEvent.amount}</b></div>
                        <div className="r"><span>الحالة</span><b>تم الدفع</b></div>
                      </div>
                      <button className="primary" style={{ marginTop: '14px', width: '100%' }} onClick={() => {
                        setPaymentOpen(false);
                        openDrawer(selectedEvent);
                      }}>
                        عرض تفاصيل الاستشارة
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Admin & Consultant View */
                <>
                  <div className="role-banner">
                    <div>
                      <b>{role === 'admin' ? 'إدارة إثبات الدفع' : 'معلومات الدفع'}</b>
                      <span>{role === 'admin' ? 'الأدمن يستطيع التحقق وتحديث الحالة' : 'المستشار يرى المعلومات ويرفق الفاتورة؛ لا يغير الدفع نيابة عن المستخدم'}</span>
                    </div>
                  </div>

                  {role === 'admin' && (
                    <div className="status-dnd-grid">
                      {Object.entries(paymentLabels).map(([k, v]) => (
                        <div
                          key={k}
                          className={`status-dnd-card pay-${k} ${pendingPayment === k ? 'selected' : ''}`}
                          onClick={() => setPendingPayment(k)}
                        >
                          <b>{v}</b>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="payment-detail">
                    <div className="field">
                      <label>طريقة الدفع</label>
                      <select
                        value={payFormData.method}
                        disabled={role === 'consultant'}
                        onChange={(e) => setPayFormData(f => ({ ...f, method: e.target.value }))}
                      >
                        <option>تحويل بنكي</option>
                        <option>بطاقة</option>
                        <option>CliQ</option>
                        <option>محفظة إلكترونية</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>رقم العملية</label>
                      <input
                        className="num"
                        value={payFormData.txn}
                        readOnly={role === 'consultant'}
                        onChange={(e) => setPayFormData(f => ({ ...f, txn: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>تاريخ الدفع</label>
                      <input
                        className="num"
                        type="date"
                        value={payFormData.date}
                        readOnly={role === 'consultant'}
                        onChange={(e) => setPayFormData(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label>المبلغ</label>
                      <input
                        className="num"
                        type="number"
                        value={payFormData.amount}
                        readOnly={role === 'consultant'}
                        onChange={(e) => setPayFormData(f => ({ ...f, amount: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="payment-proof">
                    <label style={{ fontSize: '9px', color: '#7e8694' }}>إثبات الدفع</label>
                    <div style={{ fontSize: '9px', marginTop: '6px' }}>{payFormData.proofName || 'لا يوجد إثبات دفع مسجل'}</div>
                  </div>

                  {role === 'admin' && (
                    <>
                      <div className="reasonbox">
                        <textarea
                          placeholder="ملاحظة التحقق..."
                          value={payFormData.note}
                          onChange={(e) => setPayFormData(f => ({ ...f, note: e.target.value }))}
                        />
                      </div>
                      <button className="primary" style={{ marginTop: '10px' }} onClick={applyAdminPayment}>
                        حفظ تحديث الدفع
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Kanban Board Modal */}
      {kanbanOpen && (
        <div className="overlay" onClick={() => setKanbanOpen(false)}>
          <div className="kanban-shell" onClick={(e) => e.stopPropagation()}>
            <div className="kan-head">
              <div>
                <b style={{ fontWeight: '900' }}>مسار الاستشارات</b>
                <div style={{ fontSize: '9px', color: '#9097a4' }}>اسحب الجلسة بين الحالات لتغيير مسارها المهني</div>
              </div>
              <button className="icon-btn" onClick={() => setKanbanOpen(false)}>×</button>
            </div>
            <div className="kan-columns">
              {[
                ['pending', 'معلقة'],
                ['confirmed', 'مؤكدة'],
                ['progress', 'قيد التنفيذ'],
                ['rejected', 'مرفوضة'],
                ['cancelled', 'ملغاة'],
                ['completed', 'مكتملة']
              ].map(([stKey, stLabel]) => {
                const colItems = filteredEvents.filter(e => e.status === stKey);
                return (
                  <div
                    key={stKey}
                    className="kan-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleKanbanDrop(e, stKey)}
                  >
                    <h4>
                      <span>{stLabel}</span>
                      <span className="num">{colItems.length}</span>
                    </h4>
                    {colItems.map(evt => (
                      <div
                        key={evt.id}
                        className="kan-card"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(evt.id))}
                        onClick={() => openDrawer(evt)}
                      >
                        <b>{evt.title}</b>
                        <p>{getClient(evt.client).name}</p>
                        <div className="kmeta">
                          <span>{evt.advisor}</span>
                          <span className="num">{fmtShort(parseISO(evt.date))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Kanban Move Confirm Modal */}
      {kanbanConfirmOpen && pendingKanbanMove && (
        <div className="overlay" onClick={() => setKanbanConfirmOpen(false)}>
          <div className="modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>اعتماد نقل الاستشارة</b>
                <div style={{ fontSize: '9px', color: '#9097a4', marginTop: '3px' }}>سيتم تحديث الحالة وإرسال الرسالة مباشرة إلى المحادثة</div>
              </div>
              <button className="icon-btn" onClick={() => setKanbanConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="kan-confirm-card">
                <b>{events.find(x => x.id === pendingKanbanMove.eventId)?.title}</b>
                <div>{getClient(events.find(x => x.id === pendingKanbanMove.eventId)?.client).name} · {events.find(x => x.id === pendingKanbanMove.eventId)?.advisor}</div>
                <div style={{ marginTop: '7px' }}>
                  {statusLabels[pendingKanbanMove.oldStatus]} ← {statusLabels[pendingKanbanMove.newStatus]}
                </div>
              </div>
              <div className="reasonbox">
                <label style={{ fontSize: '9px', color: '#7e8694' }}>الرسالة التي ستظهر في محادثة العميل</label>
                <textarea
                  value={kanbanMessage}
                  onChange={(e) => setKanbanMessage(e.target.value)}
                />
              </div>
              <div className="status-apply-row">
                <button className="ghost" onClick={() => setKanbanConfirmOpen(false)}>إلغاء</button>
                <button className="primary" onClick={applyKanbanMove}>نقل وإرسال الرسالة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI Operational & Calendar Intelligence Modal */}
      {aiOpen && (
        <div className="overlay" onClick={() => setAiOpen(false)}>
          <div className="modal ai-pro" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>{role === 'admin' ? 'المساعد التشغيلي الذكي للأدمن' : role === 'consultant' ? 'مساعد المستشار اليومي' : 'مساعد حجوزاتي'}</b>
                <div style={{ fontSize: '9px', color: '#9097a4', marginTop: '3px' }}>تحليل المواعيد والإجراءات والأولويات حسب التاريخ والدور الحالي</div>
              </div>
              <button className="icon-btn" onClick={() => setAiOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="ai-hero">
                <div>
                  <h3>{role === 'admin' ? 'رقابة شاملة على الجلسات والمستشارين' : 'لوحة الذكاء التشغيلي'}</h3>
                  <p>تحليل فوري للمدفوعات، التأخير، التعارضات والمستندات</p>
                </div>
                <div className="ai-summary-kpis">
                  <div className="ai-summary-kpi">
                    <b className="num">{events.filter(e => isAllowed(e) && e.date === aiDate).length}</b>
                    <span>مواعيد اليوم</span>
                  </div>
                  <div className="ai-summary-kpi">
                    <b className="num">{events.filter(e => isAllowed(e) && e.date === aiDate && e.status === 'pending').length}</b>
                    <span>معلقة</span>
                  </div>
                  <div className="ai-summary-kpi">
                    <b className="num">{events.filter(e => isAllowed(e) && e.date === aiDate && e.payment !== 'paid').length}</b>
                    <span>تحتاج دفع</span>
                  </div>
                  <div className="ai-summary-kpi">
                    <b className="num">{events.filter(e => isAllowed(e) && e.date === aiDate).reduce((s, e) => s + (e.unread || 0), 0)}</b>
                    <span>رسائل</span>
                  </div>
                  <div className="ai-summary-kpi">
                    <b className="num">JOD {events.filter(e => isAllowed(e) && e.date === aiDate).reduce((s, e) => s + e.amount, 0)}</b>
                    <span>القيمة</span>
                  </div>
                </div>
              </div>

              <div className="ai-toolbar">
                <div>
                  <label>تاريخ التحليل</label>
                  <input
                    className="num"
                    type="date"
                    value={aiDate}
                    onChange={(e) => setAiDate(e.target.value)}
                  />
                </div>
                <div>
                  <label>اسأل المساعد</label>
                  <input
                    placeholder={role === 'admin' ? 'مثال: أين توجد حالات تأخير أو عدم استجابة؟' : 'مثال: ما المطلوب مني اليوم؟'}
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') askCalendarAI();
                    }}
                  />
                </div>
                <button className="primary" onClick={() => askCalendarAI()}>اسأل AI</button>
              </div>

              {aiInlineAnswer && (
                <div className="ai-inline-answer">
                  {aiInlineAnswer}
                </div>
              )}

              <div className="ai-layout">
                <div className="ai-section">
                  <h4>أهم الإجراءات المقترحة</h4>
                  {events.filter(e => isAllowed(e) && e.date === aiDate).length > 0 ? (
                    events.filter(e => isAllowed(e) && e.date === aiDate).map(e => (
                      <div key={e.id} className="ai-action-row">
                        <div className="txt">
                          <b>{getClient(e.client).name} — {e.advisor}</b>
                          <div>{e.title} · {statusLabels[e.status]} · {paymentLabels[e.payment]}</div>
                        </div>
                        <div className="acts">
                          <button className="ghost" onClick={() => {
                            setAiOpen(false);
                            if (role === 'admin') openAdminSessionIntel(e);
                            else openDrawer(e);
                          }}>
                            {role === 'admin' ? 'فتح السجل' : 'فتح'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ai-item">لا توجد إجراءات حرجة في هذا اليوم.</div>
                  )}
                </div>

                <div className="ai-section">
                  <h4>{role === 'admin' ? 'القراءة الإدارية' : 'القراءة التشغيلية'}</h4>
                  <div className="ai-item">
                    <strong>الوضع العام</strong>
                    <div style={{ marginTop: '5px' }}>
                      يوجد {events.filter(e => isAllowed(e) && e.date === aiDate && e.payment !== 'paid').length} جلسات غير مدفوعة و
                      {events.filter(e => isAllowed(e) && e.date === aiDate && e.status === 'pending').length} جلسات بانتظار الحسم.
                    </div>
                  </div>
                  <div className="ai-item" style={{ marginTop: '7px' }}>
                    <strong>الأولوية</strong>
                    <div style={{ marginTop: '5px' }}>
                      {role === 'admin' ? 'ركّز على تحصيل المدفوعات وفحص التعارضات.' : role === 'consultant' ? 'ركّز على مراجعة المستندات والرد على استفسارات العملاء.' : 'أكمل الدفع وتحقق من المستندات المرفقة.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-note-addon">
                <h4>إضافة ملاحظة على استشارة</h4>
                <div className="ai-note-grid">
                  <div>
                    <label>الاستشارة</label>
                    <select value={aiNoteEventId} onChange={(e) => setAiNoteEventId(Number(e.target.value))}>
                      {events.filter(isAllowed).map(e => (
                        <option key={e.id} value={e.id}>
                          {fmtShort(parseISO(e.date))} — {getClient(e.client).name} — {e.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>الملاحظة</label>
                    <textarea
                      placeholder="اكتب الملاحظة التي تريد إضافتها على الاستشارة..."
                      value={aiNoteText}
                      onChange={(e) => setAiNoteText(e.target.value)}
                    />
                  </div>
                  <button className="primary" onClick={saveAINote}>إضافة</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Admin Session Intel Modal */}
      {adminIntelOpen && intelEvent && (
        <div className="overlay" onClick={() => setAdminIntelOpen(false)}>
          <div className="modal" style={{ width: 'min(980px, 93vw)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>السجل الذكي للاستشارة</b>
                <div style={{ fontSize: '9px', color: '#9097a4', marginTop: '3px' }}>
                  {getClient(intelEvent.client).name} · {intelEvent.advisor} · {intelEvent.title}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setAdminIntelOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="admin-detail-grid">
                <div className="admin-detail-kpi">
                  <b>{statusLabels[intelEvent.status]}</b>
                  <span>حالة الجلسة</span>
                </div>
                <div className="admin-detail-kpi">
                  <b>{paymentLabels[intelEvent.payment]}</b>
                  <span>حالة الدفع</span>
                </div>
                <div className="admin-detail-kpi">
                  <b className="num">{(messagesStore[intelEvent.client] || []).length}</b>
                  <span>رسائل المحادثة</span>
                </div>
                <div className="admin-detail-kpi">
                  <b className="num">{(adminTicketsStore[intelEvent.id] || []).length}</b>
                  <span>تذاكر مرتبطة</span>
                </div>
              </div>

              <div className="admin-detail-layout">
                <div className="admin-detail-section">
                  <h4>الاستجابة والتفاعل</h4>
                  <div className="audit-line">
                    <b>التعارض في الجدول</b>
                    <div>{appointmentHasConflict(intelEvent) ? 'يوجد تعارض في الوقت' : 'لا يوجد تعارض'}</div>
                  </div>
                  <div className="audit-line">
                    <b>الرسائل غير المقروءة</b>
                    <div className="num">{intelEvent.unread || 0}</div>
                  </div>
                  <div className="audit-line">
                    <b>المستندات المرفقة</b>
                    <div>{intelEvent.docs || 0} ملفات مسجلة</div>
                  </div>
                </div>

                <div className="admin-detail-section">
                  <h4>الدفع والتقييم</h4>
                  <div className="audit-line">
                    <b>قيمة الجلسة</b>
                    <div className="num">JOD {intelEvent.amount}</div>
                  </div>
                  <div className="audit-line">
                    <b>تقييم العميل</b>
                    <div>{ratingStore[intelEvent.id]?.client ? `${ratingStore[intelEvent.id].client}/5` : 'لا يوجد'}</div>
                  </div>
                  <div className="audit-line">
                    <b>تقييم المستشار</b>
                    <div>{ratingStore[intelEvent.id]?.advisor ? `${ratingStore[intelEvent.id].advisor}/5` : 'لا يوجد'}</div>
                  </div>
                </div>

                <div className="admin-detail-section">
                  <h4>الملاحظات</h4>
                  {(notesStore[intelEvent.id] || []).map((n, i) => (
                    <div key={i} className="audit-line">
                      <b>{n.author}</b>
                      <div>{n.text}</div>
                    </div>
                  ))}
                  {!(notesStore[intelEvent.id]?.length) && (
                    <div className="audit-line">لا توجد ملاحظات.</div>
                  )}
                </div>

                <div className="admin-detail-section">
                  <h4>سجل النشاط</h4>
                  {(activity[intelEvent.id] || []).map((a, i) => (
                    <div key={i} className="audit-line">
                      {a.text}
                      <div className="time num">{a.time}</div>
                    </div>
                  ))}
                  {!(activity[intelEvent.id]?.length) && (
                    <div className="audit-line">لا يوجد نشاط مسجل.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Financial Alerts Modal */}
      {financialAlertsOpen && (
        <div className="overlay" onClick={() => setFinancialAlertsOpen(false)}>
          <div className="modal" style={{ width: 'min(900px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>التنبيهات المالية</b>
                <div style={{ fontSize: '9px', color: '#9097a4', marginTop: '3px' }}>متابعة الحالات التي تحتاج تدخلاً ماليًا</div>
              </div>
              <button className="icon-btn" onClick={() => setFinancialAlertsOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="finance-alerts-grid">
                <div className="finance-alert-kpi">
                  <b className="num">{events.filter(e => e.payment === 'waiting').length}</b>
                  <span>بانتظار الدفع</span>
                </div>
                <div className="finance-alert-kpi">
                  <b className="num">{events.filter(e => e.payment === 'unpaid').length}</b>
                  <span>غير مدفوعة</span>
                </div>
                <div className="finance-alert-kpi">
                  <b className="num">{events.filter(e => e.payment === 'rejected').length}</b>
                  <span>دفعات مرفوضة</span>
                </div>
                <div className="finance-alert-kpi">
                  <b className="num">JOD {events.filter(e => e.payment === 'paid').reduce((s, e) => s + e.amount, 0)}</b>
                  <span>تم تحصيله</span>
                </div>
              </div>

              <div>
                <b>الحالات التي تحتاج انتباه</b>
                {events.filter(e => e.payment !== 'paid').map(e => (
                  <div key={e.id} className="finance-alert-row">
                    <div>
                      <b>{getClient(e.client).name} — {e.title}</b>
                      <small>{paymentLabels[e.payment]} · {e.advisor} · JOD {e.amount}</small>
                    </div>
                    <button className="ghost" onClick={() => {
                      setFinancialAlertsOpen(false);
                      openPaymentModal(e);
                    }}>
                      فتح
                    </button>
                  </div>
                ))}
              </div>

              <div className="finance-ai-box">
                <b>مساعد AI المالي</b>
                <div className="finance-ai-line" style={{ marginTop: '7px' }}>
                  <input
                    placeholder="مثال: ما الحالات التي يجب متابعتها أولاً؟"
                    value={financeQuestion}
                    onChange={(e) => setFinanceQuestion(e.target.value)}
                  />
                  <button className="primary" onClick={askFinanceAI}>اسأل AI</button>
                </div>
                <div className="finance-ai-answer">{financeAnswer}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. New Consultation Modal */}
      {newConsultOpen && (
        <div className="overlay" onClick={() => setNewConsultOpen(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <b>{role === 'consultant' ? 'حجز استشارة مع مستشار آخر' : 'إضافة استشارة جديدة'}</b>
                <div style={{ fontSize: '9px', color: '#9097a4', marginTop: '3px' }}>
                  {role === 'consultant'
                    ? 'يمكنك الحجز مع مستشار من تخصص مختلف فقط — الحجز يخضع لموافقة المستشار'
                    : 'حجز متكامل مع فحص التوفر والدفع والإشعار'}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setNewConsultOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* ── CONSULTANT CROSS-BOOKING ── */}
              {role === 'consultant' ? (
                <>
                  <div className="role-banner" style={{ background: 'linear-gradient(135deg,#e8f4ff,#f0e8ff)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                    <div>
                      <b>🔗 حجز بين مستشارين</b>
                      <span style={{ display: 'block', fontSize: '10px', color: '#6b7280', marginTop: 3 }}>
                        أنت تحجز كـ <strong>عميل</strong> مع مستشار من تخصص مختلف — سيظهر الموعد في سجلاتك كحجز شخصي
                      </span>
                    </div>
                  </div>

                  <div className="new-consult-grid">
                    {/* Consultant selector */}
                    <div className="field full">
                      <label>المستشار المستهدف (تخصص مختلف)</label>
                      {crossLoading ? (
                        <div style={{ color: '#888', fontSize: '11px', padding: '8px 0' }}>⏳ جاري جلب المستشارين...</div>
                      ) : crossConsultants.length === 0 ? (
                        <div style={{ color: '#e05', fontSize: '11px', padding: '8px 0' }}>
                          لا يوجد مستشارون بتخصصات مختلفة متاحون حالياً
                        </div>
                      ) : (
                        <select
                          value={crossSelectedId}
                          onChange={(e) => { setCrossSelectedId(e.target.value); setNewSlot(null); }}
                        >
                          {crossConsultants.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.display_name || c.full_name || c.user?.full_name || `مستشار #${c.id?.slice(0,8)}`}
                              {c.specialization_name ? ` — ${c.specialization_name}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Service selector */}
                    <div className="field">
                      <label>الخدمة</label>
                      {crossServices.length === 0 ? (
                        <div style={{ color: '#888', fontSize: '11px' }}>لا توجد خدمات معتمدة</div>
                      ) : (
                        <select value={crossSelectedServiceId} onChange={(e) => setCrossSelectedServiceId(e.target.value)}>
                          {crossServices.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} — JOD {s.price} ({s.duration_minutes} دقيقة)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Session type */}
                    <div className="field">
                      <label>نوع الجلسة</label>
                      <select value={newMeeting} onChange={(e) => setNewMeeting(e.target.value)}>
                        <option value="video">مكالمة فيديو</option>
                        <option value="chat">محادثة مكتوبة</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div className="field">
                      <label>التاريخ</label>
                      <input className="num" type="date" value={newDate} min={iso(new Date())}
                        onChange={(e) => { setNewDate(e.target.value); setNewSlot(null); }} />
                    </div>

                    {/* Duration */}
                    <div className="field">
                      <label>المدة</label>
                      <select value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}>
                        {[30, 45, 60, 90].map(d => (
                          <option key={d} value={d}>{d} دقيقة</option>
                        ))}
                      </select>
                    </div>

                    {/* Price display from selected service */}
                    {crossSelectedServiceId && (
                      <div className="full">
                        <div className="price-box">
                          <span>سعر الخدمة المختارة</span>
                          <b className="num">JOD {crossServices.find(s => s.id === crossSelectedServiceId)?.price ?? '—'}</b>
                        </div>
                        <div className="service-note">السعر محدد من المستشار ولا يمكن تعديله</div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="field full">
                      <label>موضوع الاستشارة / ملاحظات</label>
                      <textarea
                        placeholder="اكتب موضوع الاستشارة والغرض من الحجز..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="availability-preview">
                    <h5>اختر الوقت المتاح</h5>
                    <div className="new-slots">
                      {Array.from({ length: 24 }, (_, i) => 8 + i * 0.5).filter(t => t <= 19).map(t => (
                        <button
                          key={t}
                          className={`new-slot ${newSlot === t ? 'selected' : ''}`}
                          onClick={() => setNewSlot(t)}
                        >
                          <span className="num">{timeFmt(t)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* ── ADMIN / CLIENT BOOKING ── */
                <>
                  <div className="role-banner">
                    <div>
                      <b>{role === 'user' ? 'حجز استشارة' : 'إضافة استشارة'}</b>
                      <span>{role === 'user' ? 'اختر المستشار والخدمة والموعد، وسيتم احتساب السعر تلقائيًا.' : 'إنشاء حجز إداري مع احترام تسعير المستشار وتوفره.'}</span>
                    </div>
                  </div>

                  <div className="new-consult-grid">
                    <div className="field">
                      <label>العميل</label>
                      {role === 'user' ? (
                        <div>{getClient(currentUserClientId).name}</div>
                      ) : (
                        <select value={newClient} onChange={(e) => setNewClient(Number(e.target.value))}>
                          {clients.map(cl => (
                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="field">
                      <label>المستشار</label>
                      <select value={newAdvisor} onChange={(e) => setNewAdvisor(e.target.value)}>
                        {consultantList.length > 0 ? (
                          consultantList.map(c => {
                            const name = c.display_name || c.full_name || c.user?.full_name || `مستشار #${c.id}`;
                            return (
                              <option key={c.id} value={name}>
                                {name} {c.specialization_name ? ` — ${c.specialization_name}` : ''}
                              </option>
                            );
                          })
                        ) : (
                          ['أحمد نصار', 'أ. رأفت حداد', 'د. محمد العتيبي'].map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="field">
                      <label>نوع الاستشارة</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        <option>ضريبة المبيعات</option>
                        <option>ضريبة الدخل</option>
                        <option>اعتراض ضريبي</option>
                        <option>معاملات دولية</option>
                        <option>أسعار التحويل</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>نوع الخدمة</label>
                      <select value={newMeeting} onChange={(e) => setNewMeeting(e.target.value)}>
                        <option value="video">مكالمة فيديو</option>
                        <option value="chat">محادثة مكتوبة</option>
                        <option value="report">تقرير مكتوب</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>التاريخ</label>
                      <input className="num" type="date" value={newDate}
                        onChange={(e) => setNewDate(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>المدة</label>
                      {newMeeting === 'report' ? (
                        <div className="no-duration">التقرير المكتوب لا يحتاج مدة جلسة زمنية.</div>
                      ) : (
                        <select value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}>
                          {advisorOffer.durations.map(d => (
                            <option key={d} value={d}>{d} دقيقة</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="full">
                      <div className="price-box">
                        <span>الأتعاب حسب المستشار والخدمة</span>
                        <b className="num">JOD {computedPrice}</b>
                      </div>
                      <div className="service-note">الأتعاب ثابتة وفق إعدادات المستشار ولا يمكن تعديلها يدوياً.</div>
                    </div>
                    <div className="field full">
                      <label>موضوع / سؤال الاستشارة</label>
                      <textarea
                        placeholder="اكتب موضوع الاستشارة والسؤال الرئيسي..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                      />
                    </div>
                  </div>

                  {newMeeting !== 'report' && (
                    <div className="availability-preview">
                      <h5>الأوقات المتاحة</h5>
                      <div className="new-slots">
                        {availableNewSlots.map(s => (
                          <button
                            key={s.t}
                            className={`new-slot ${s.busy ? 'busy' : ''} ${newSlot === s.t ? 'selected' : ''}`}
                            disabled={s.busy}
                            onClick={() => setNewSlot(s.t)}
                          >
                            <span className="num">{timeFmt(s.t)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-foot">
              <button className="ghost" onClick={() => setNewConsultOpen(false)}>إلغاء</button>
              <button
                className="primary"
                disabled={crossBooking}
                onClick={role === 'consultant' ? saveCrossBooking : saveNewConsultation}
              >
                {crossBooking ? '⏳ جاري الإرسال...' : role === 'consultant' ? 'إرسال طلب الحجز' : 'إنشاء الاستشارة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Video Consultation Simulation Modal */}
      {videoOpen && selectedEvent && (
        <div className="overlay">
          <div className="video-room">
            <div className="video-head">
              <div>
                <b>{selectedEvent.title}</b>
                <div style={{ fontSize: '8px', color: '#aab5c2', marginTop: '3px' }}>
                  {selectedEvent.advisor} · {getClient(selectedEvent.client).name}
                </div>
              </div>
              <div>
                <span className="num" style={{ fontSize: '11px', marginLeft: '10px' }}>
                  {pad(Math.floor(videoTimer / 60))}:{pad(videoTimer % 60)}
                </span>
                <button className="icon-btn" onClick={() => setVideoOpen(false)}>×</button>
              </div>
            </div>

            <div className="video-body">
              <div className="video-stage">
                <div className="video-tile">
                  <div className="video-avatar">
                    {initials(getClient(selectedEvent.client).name)}
                  </div>
                  <div className="video-label">{getClient(selectedEvent.client).name}</div>
                </div>
                <div className="video-tile">
                  <div className="video-avatar" style={{ background: '#66b9c9' }}>
                    {initials(selectedEvent.advisor)}
                  </div>
                  <div className="video-label">{selectedEvent.advisor}</div>
                </div>
              </div>

              <aside className="video-side">
                <h4>مساعد الجلسة الذكي</h4>
                <div className="video-note">ملخص مباشر: تتم مناقشة موضوع الاستشارة والوقائع الأساسية.</div>
                <div className="video-note">السؤال المفتوح: ما المستندات الداعمة المتوفرة؟</div>
                <div className="video-note">الإجراء المقترح: تسجيل توصية أولية ومتابعة بعد الجلسة.</div>
                <h4 style={{ marginTop: '14px' }}>ملاحظات المستشار</h4>
                <textarea
                  style={{ width: '100%', minHeight: '120px', background: '#0e141c', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: '8px', padding: '8px', outline: 0 }}
                  placeholder="اكتب ملاحظات الجلسة..."
                  value={videoSessionNotes}
                  onChange={(e) => setVideoSessionNotes(e.target.value)}
                />
              </aside>
            </div>

            <div className="video-controls">
              <button className={`video-control ${micOff ? 'off' : ''}`} onClick={() => setMicOff(m => !m)}>
                {micOff ? '🔇' : '🎙'}
              </button>
              <button className={`video-control ${camOff ? 'off' : ''}`} onClick={() => setCamOff(c => !c)}>
                {camOff ? '▧' : '▣'}
              </button>
              <button className="video-control" onClick={() => showToast('تمت مشاركة الشاشة')}>▤</button>
              <button className="video-control" onClick={() => showToast('تم فتح المحادثة أثناء الجلسة')}>✉</button>
              <button className="video-end" onClick={endVideoSession}>إنهاء الجلسة</button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Reminder Modal */}
      {reminderOpen && (
        <div className="overlay" onClick={() => setReminderOpen(false)}>
          <div className="modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>إضافة تذكير أو متابعة</b>
              <button className="icon-btn" onClick={() => setReminderOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="two">
                <div className="field">
                  <label>التاريخ</label>
                  <input className="num" type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>الوقت</label>
                  <input className="num" type="time" value={remTime} onChange={(e) => setRemTime(e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginTop: '10px' }}>
                <label>نوع المتابعة</label>
                <select value={remType} onChange={(e) => setRemType(e.target.value)}>
                  <option>تذكير داخلي</option>
                  <option>متابعة مع العميل</option>
                  <option>طلب مستندات</option>
                  <option>متابعة دفع</option>
                  <option>إرسال تقرير</option>
                </select>
              </div>
              <div className="field" style={{ marginTop: '10px' }}>
                <label>الملاحظة</label>
                <textarea
                  placeholder="اكتب تفاصيل المتابعة..."
                  value={remNote}
                  onChange={(e) => setRemNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="ghost" onClick={() => setReminderOpen(false)}>إلغاء</button>
              <button className="primary" onClick={saveReminder}>حفظ التذكير</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
}

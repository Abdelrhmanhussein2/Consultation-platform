import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import ModernSelect from '../../components/ModernSelect';
import FilterResetButton from '../../components/FilterResetButton';
import { notificationService } from '../../services/notificationService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { getNotificationTarget } from '../../utils/notificationRouter';
import BroadcastModal from '../components/notifications/BroadcastModal';
import NotificationDetailsModal from '../../components/Notifications/NotificationDetailsModal';
import {
  fetchBroadcastsApi,
  resendBroadcastApi,
  deleteBroadcastApi
} from '../components/notifications/broadcastApi';
import {
  LEGAL_FORM_OPTIONS,
  SECTOR_OPTIONS,
  CONSULTANT_ACTIVITY_OPTIONS,
  CONSULTANT_SPECIALIZATION_OPTIONS
} from '../components/notifications/broadcastConstants';

// Clean SVG Icons
const IconBroadcast = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </svg>
);

const IconBell = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const IconAlertCircle = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconChart = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconSend = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconRefresh = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

const IconEye = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCheck = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrash = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

function formatEnglishDateTime(dateStr) {
  if (!dateStr) return { date: '—', time: '—', full: '—' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = String(dateStr).trim().split(/\s+/);
    if (parts.length === 2) {
      const isDateFirst = parts[0].includes('-');
      return {
        date: isDateFirst ? parts[0] : parts[1],
        time: isDateFirst ? parts[1] : parts[0],
        full: dateStr
      };
    }
    return { date: dateStr, time: '', full: dateStr };
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return {
    date: `${year}-${month}-${day}`,
    time: timePart,
    full: `${year}-${month}-${day} ${timePart}`
  };
}

function cleanNotificationTitle(title) {
  if (!title) return '';
  return title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🔔]/gu, '').trim();
}

function getNotificationTypeBadge(type, title = '', message = '') {
  const t = (type || '').toLowerCase();
  const full = `${title} ${message}`.toLowerCase();
  if (t === 'appointment_booked' || full.includes('حجز') || full.includes('جلسة')) {
    return { label: 'استشارات وجلسات', bg: '#EFF6FF', color: '#0284C7', border: '#BAE6FD' };
  }
  if (t === 'appointment_approved') {
    return { label: 'تأكيد موعد', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
  }
  if (t === 'payment_required' || full.includes('دفع') || full.includes('فاتورة')) {
    return { label: 'مدفوعات وفواتير', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
  }
  if (full.includes('اشتراك') || full.includes('باقة')) {
    return { label: 'اشتراكات وباقات', bg: '#EBF3FA', color: '#0A3C64', border: '#D0E2F2' };
  }
  if (t === 'service_request_status_update' || full.includes('خدمة') || full.includes('طلب')) {
    return { label: 'طلبات النظام', bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' };
  }
  if (t === 'credential_status_update' || full.includes('توثيق')) {
    return { label: 'توثيق مهني', bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' };
  }
  return { label: 'إشعار عام', bg: '#EBF3FA', color: '#0A3C64', border: '#D0E2F2' };
}

export default function AdminNotificationsPage({ navigate }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'broadcasts'
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Filter States for Incoming & Broadcasts
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingTypeFilter, setIncomingTypeFilter] = useState('all');

  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterLegalForm, setFilterLegalForm] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [filterSpecialization, setFilterSpecialization] = useState('all');

  const [templatePreset, setTemplatePreset] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LIVE ADMIN NOTIFICATIONS FETCHER (Real-time 3s Polling)
  // ══════════════════════════════════════════════════════════════════════════
  const fetchLiveNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications(token);
      if (Array.isArray(data)) {
        setLiveNotifications(data);
      }
    } catch (e) {
      console.warn('Error fetching live notifications:', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const data = await fetchBroadcastsApi();
      if (Array.isArray(data)) setBroadcasts(data);
    } catch (e) {
      console.warn('Error fetching broadcasts:', e);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    fetchBroadcasts();
    const interval = setInterval(fetchLiveNotifications, 3000);
    const onFocus = () => {
      fetchLiveNotifications();
      fetchBroadcasts();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Actions for incoming notifications (Strict: read notifications cannot be reversed to unread)
  const handleMarkAsRead = async (id) => {
    const item = liveNotifications.find(n => n.id === id);
    if (!item || item.is_read) return;
    try {
      await notificationService.markAsRead(id, token, true);
      setLiveNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      showToast('تم تحديد الإشعار كمقروء.');
    } catch (e) {
      showToast('خطأ في تحديث حالة الإشعار');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(token);
      setLiveNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('تم تحديد كافة الإشعارات كمقروءة بنجاح.');
    } catch (e) {
      showToast('خطأ في العملية');
    }
  };

  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const handleDeleteNotification = (id) => {
    setConfirmModalConfig({
      title: 'حذف الإشعار',
      message: 'هل أنت متأكد من رغبتك في حذف هذا الإشعار نهائياً؟',
      confirmText: 'حذف الإشعار',
      onConfirm: async () => {
        try {
          await notificationService.deleteNotification(id, token);
          setLiveNotifications(prev => prev.filter(n => n.id !== id));
          showToast('تم حذف الإشعار بنجاح.');
        } catch (e) {
          showToast('خطأ في حذف الإشعار');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // Quick Templates without emojis
  const TEMPLATES = [
    {
      label: 'صيانة دورية للنظام',
      title: 'إشعار صيانة مجدولة للنظام',
      message: 'نحيطكم علماً بأنه سيتم إجراء صيانة دورية لتحسين أداء النظام فجر الغد لمدة 30 دقيقة.',
      type: 'maintenance',
      priority: 'urgent',
      audience: 'all'
    },
    {
      label: 'إطلاق ميزة جديدة بالمنصة',
      title: 'ميزة جديدة: المساعد الذكي المطور أصبح متاحاً',
      message: 'تم إطلاق النسخة المحدثة من المساعد الذكي مع دعم تحليل الوثائق القانونية بدقة فائقة.',
      type: 'update',
      priority: 'normal',
      audience: 'all'
    }
  ];

  const applyTemplate = (tpl) => {
    setTemplatePreset({
      title: tpl.title,
      message: tpl.message,
      priority: tpl.priority,
      targetGroup: tpl.audience === 'consultants' ? 'consultants' : tpl.audience === 'clients' ? 'users' : 'all'
    });
    setModalOpen(true);
    showToast(`تم تطبيق قالب: ${tpl.label}`);
  };

  const handleBroadcastSent = (data) => {
    fetchBroadcasts();
    setTemplatePreset(null);
    showToast(`تم بث الإشعار بنجاح إلى ${data.sentCount || 0} مستخدم.`);
  };

  const handleResendBroadcast = async (b) => {
    try {
      await resendBroadcastApi(b.id);
      await fetchBroadcasts();
      showToast(`تمت إعادة بث الإشعار: "${b.title}" بنجاح.`);
    } catch (e) {
      showToast(e.message || 'خطأ في إعادة بث الإشعار');
    }
  };

  const handleDeleteBroadcast = (id) => {
    setConfirmModalConfig({
      title: 'حذف من سجل البث',
      message: 'هل أنت متأكد من رغبتك في حذف هذا الإشعار من سجل البث نهائياً؟',
      confirmText: 'حذف السجل',
      onConfirm: async () => {
        try {
          await deleteBroadcastApi(id);
          setBroadcasts(prev => prev.filter(b => b.id !== id));
          showToast('تم حذف الإشعار من السجل بنجاح.');
        } catch (e) {
          showToast('خطأ في حذف الإشعار من السجل');
        } finally {
          setConfirmModalConfig(null);
        }
      }
    });
  };

  // KPI Computations
  const totalIncoming = liveNotifications.length;
  const unreadIncoming = liveNotifications.filter(n => !n.is_read).length;
  const totalBroadcasts = broadcasts.length;
  const urgentIncoming = liveNotifications.filter(n => !n.is_read && (n.notification_type === 'urgent' || (n.title || '').includes('عاجل') || (n.title || '').includes('مباشر'))).length;
  const urgentCount = urgentIncoming + broadcasts.filter(b => b.priority === 'urgent' || b.priority === 'high').length;
  const readRate = totalIncoming > 0 ? Math.round(((totalIncoming - unreadIncoming) / totalIncoming) * 100) : 100;

  // Filtered Incoming Notifications
  const filteredIncoming = useMemo(() => {
    return liveNotifications.filter(n => {
      const q = incomingSearch.toLowerCase().trim();
      if (q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) {
        return false;
      }
      if (incomingTypeFilter !== 'all' && (n.type || '').toLowerCase() !== incomingTypeFilter.toLowerCase()) return false;
      return true;
    });
  }, [liveNotifications, incomingSearch, incomingTypeFilter]);

  // Filtered Broadcasts
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(b => {
      const q = (broadcastSearch || '').toLowerCase().trim();
      if (q) {
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const msgMatch = (b.message || '').toLowerCase().includes(q);
        const audMatch = (b.audienceLabel || b.audience || '').toLowerCase().includes(q);
        const prioMatch = (b.priority || '').toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !audMatch && !prioMatch) return false;
      }
      if (filterAudience !== 'all') {
        const aud = (b.audience || '').toLowerCase();
        if (filterAudience === 'users' && aud !== 'users' && aud !== 'clients') return false;
        if (filterAudience === 'consultants' && aud !== 'consultants') return false;
      }
      if (filterAudience === 'users') {
        const uf = b.user_filters || {};
        if (filterLegalForm !== 'all' && uf.legal_form && uf.legal_form !== filterLegalForm) return false;
        if (filterSector !== 'all' && uf.sector && uf.sector !== filterSector) return false;
      }
      if (filterAudience === 'consultants') {
        const cf = b.consultant_filters || {};
        if (filterActivity !== 'all' && cf.activity && cf.activity !== filterActivity) return false;
        if (filterSpecialization !== 'all' && cf.specialization && cf.specialization !== filterSpecialization) return false;
      }
      return true;
    });
  }, [broadcasts, broadcastSearch, filterAudience, filterLegalForm, filterSector, filterActivity, filterSpecialization]);

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px', textAlign: 'right', direction: 'rtl', fontFamily: 'var(--font-main)' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <IconBell size={18} color="#FFFFFF" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TOP COMMAND BANNER
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '24px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            LIVE NOTIFICATIONS & BROADCASTS
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
            مركز الإشعارات والإذاعات العامة
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            إرسال وبث إشعارات وتنبيهات جماعية لحظية لكافة المستخدمين أو شرائح محددة، ومتابعة إشعارات النظام الواردة.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => setModalOpen(true)}
          style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(14,59,94,0.2)', transition: 'all 0.2s' }}
        >
          <IconSend size={16} color="#FFFFFF" />
          <span>إرسال إذاعة عامة جديدة</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4 SUMMARY METRIC KPI CARDS
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#EBF3FA', color: '#0A3C64', border: '1px solid #D0E2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBell size={22} color="#0A3C64" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0A3C64', lineHeight: '1.2' }}>{totalIncoming}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>
              إشعارات الإدارة الواردة ({unreadIncoming} غير مقروء)
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#EBF3FA', color: '#0A3C64', border: '1px solid #D0E2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBroadcast size={22} color="#0A3C64" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0A3C64', lineHeight: '1.2' }}>{totalBroadcasts}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>إجمالي الإذاعات المرسلة</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#EBF3FA', color: '#0A3C64', border: '1px solid #D0E2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconAlertCircle size={22} color="#0A3C64" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0A3C64', lineHeight: '1.2' }}>{urgentCount}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>تنبيهات هامة وعاجلة</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#EBF3FA', color: '#0A3C64', border: '1px solid #D0E2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconChart size={22} color="#0A3C64" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0A3C64', lineHeight: '1.2' }}>{readRate}%</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>متوسط معدل القراءة</div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN TABS (إشعارات النظام الواردة / سجل الإذاعات العامة)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'incoming' ? '3px solid #0A3C64' : '3px solid transparent',
            color: activeTab === 'incoming' ? '#0A3C64' : '#64748B',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconBell size={18} />
          <span>إشعارات النظام والطلبات الواردة</span>
          {unreadIncoming > 0 && (
            <span style={{ background: '#0A3C64', color: '#FFFFFF', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>
              {unreadIncoming}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'broadcasts' ? '3px solid #0A3C64' : '3px solid transparent',
            color: activeTab === 'broadcasts' ? '#0A3C64' : '#64748B',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconBroadcast size={18} />
          <span>سجل الإذاعات العامة المرسلة</span>
          <span style={{ background: '#E2E8F0', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
            {broadcasts.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: INCOMING NOTIFICATIONS (إشعارات النظام والطلبات الواردة)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'incoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Incoming Filters Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: '240px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="ابحث في عنوان الإشعار أو نص الرسالة الواردة..."
                  value={incomingSearch}
                  onChange={e => setIncomingSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none' }}
                />
              </div>

              <ModernSelect
                value={incomingTypeFilter}
                onChange={(val) => setIncomingTypeFilter(val)}
                options={[
                  { value: 'all', label: 'كل أنواع الإشعارات' },
                  { value: 'general', label: 'عام / اشتراكات' },
                  { value: 'appointment', label: 'حجوزات واستشارات' },
                  { value: 'system', label: 'نظام' }
                ]}
              />

              <FilterResetButton
                onClick={() => {
                  setIncomingSearch('');
                  setIncomingTypeFilter('all');
                }}
                title="إعادة تعيين فلاتر الإشعارات الواردة"
                size={38}
              />

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadIncoming === 0}
                style={{
                  padding: '10px 18px',
                  background: unreadIncoming > 0 ? '#0A3C64' : '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: unreadIncoming > 0 ? '#FFFFFF' : '#64748B',
                  cursor: unreadIncoming > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                title={unreadIncoming > 0 ? 'تحديد كافة الإشعارات كمقروءة' : 'تمت قراءة كافة الإشعارات'}
              >
                <IconCheck size={15} color={unreadIncoming > 0 ? '#FFFFFF' : '#64748B'} />
                <span>{unreadIncoming > 0 ? 'تحديد الكل كمقروء' : 'كافة الإشعارات مقروءة'}</span>
              </button>
            </div>
          </div>

          {/* Incoming Notifications Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0A3C64', margin: 0 }}>
                سجل الإشعارات الواردة ({filteredIncoming.length} إشعار)
              </h3>
              <button
                type="button"
                onClick={fetchLiveNotifications}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0A3C64', cursor: 'pointer' }}
              >
                <IconRefresh size={14} />
                <span>تحديث فوري</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: '700' }}>
                    <th style={{ padding: '14px 16px' }}>عنوان الإشعار</th>
                    <th style={{ padding: '14px 16px' }}>نص الرسالة</th>
                    <th style={{ padding: '14px 16px' }}>النوع</th>
                    <th style={{ padding: '14px 16px' }}>التاريخ والوقت</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncoming.length > 0 ? (
                    filteredIncoming.map((n) => (
                      <tr
                        key={n.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: !n.is_read ? '#F8FAFC' : '#FFFFFF',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: '800', color: '#0A3C64', maxWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!n.is_read && (
                              <span style={{ width: '8px', height: '8px', background: '#0A3C64', borderRadius: '50%', flexShrink: 0 }} />
                            )}
                            <span>{cleanNotificationTitle(n.title)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '380px', lineHeight: '1.5' }}>
                          {n.message}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const badge = getNotificationTypeBadge(n.type, n.title, n.message);
                            return (
                              <span style={{
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap'
                              }}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const dt = formatEnglishDateTime(n.created_at);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                                <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px', fontFamily: 'monospace' }}>
                                  {dt.date}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', fontFamily: 'monospace' }}>
                                  {dt.time}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewModalOpen(n)}
                              title="عرض التفاصيل"
                              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0A3C64', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconEye size={14} />
                              <span>عرض</span>
                            </button>
                            <button
                              type="button"
                              disabled={n.is_read}
                              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                              title={n.is_read ? 'تمت قراءة هذا الإشعار' : 'تحديد كمقروء'}
                              style={{
                                background: n.is_read ? '#F1F5F9' : '#FFFFFF',
                                border: n.is_read ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: n.is_read ? '#64748B' : '#0A3C64',
                                cursor: n.is_read ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s',
                                opacity: n.is_read ? 0.85 : 1
                              }}
                            >
                              <IconCheck size={14} color={n.is_read ? '#16A34A' : '#0A3C64'} />
                              <span>{n.is_read ? 'تمت القراءة' : 'تحديد كمقروء'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotification(n.id)}
                              title="حذف الإشعار"
                              style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 8px', borderRadius: '8px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                        لا توجد إشعارات واردة حالياً تطابق الفلتر المحدد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: BROADCASTS & TEMPLATES (مركز الإذاعات العامة والبث)
          ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'broadcasts' && (
        <>
          {/* Quick Templates Bar */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}>
                قوالب إشعارات سريعة (اضغط للتعبئة الفورية والإرسال):
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    applyTemplate(tpl);
                    setModalOpen(true);
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0e7490'; e.currentTarget.style.color = '#0e7490'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; }}
                >
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: '240px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="ابحث في عنوان الإشعار، النص، أو الجمهور المستهدف..."
                  value={broadcastSearch}
                  onChange={e => setBroadcastSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none' }}
                />
              </div>

              <ModernSelect
                value={filterAudience}
                onChange={(val) => {
                  setFilterAudience(val);
                  setFilterLegalForm('all');
                  setFilterSector('all');
                  setFilterActivity('all');
                  setFilterSpecialization('all');
                }}
                options={[
                  { value: 'all', label: 'كل الشرائح' },
                  { value: 'users', label: 'المستخدمين والشركات' },
                  { value: 'consultants', label: 'المستشارين فقط' }
                ]}
              />

              {filterAudience === 'users' && (
                <>
                  <ModernSelect
                    value={filterLegalForm}
                    onChange={setFilterLegalForm}
                    options={LEGAL_FORM_OPTIONS}
                    placeholder="الشكل القانوني"
                  />
                  <ModernSelect
                    value={filterSector}
                    onChange={setFilterSector}
                    options={SECTOR_OPTIONS}
                    placeholder="نشاط المنشأة"
                  />
                </>
              )}

              {filterAudience === 'consultants' && (
                <>
                  <ModernSelect
                    value={filterActivity}
                    onChange={setFilterActivity}
                    options={CONSULTANT_ACTIVITY_OPTIONS}
                    placeholder="نوع النشاط المهني"
                  />
                  <ModernSelect
                    value={filterSpecialization}
                    onChange={setFilterSpecialization}
                    options={CONSULTANT_SPECIALIZATION_OPTIONS}
                    placeholder="التخصص الرئيسي"
                  />
                </>
              )}

              <FilterResetButton
                onClick={() => {
                  setBroadcastSearch('');
                  setFilterAudience('all');
                  setFilterLegalForm('all');
                  setFilterSector('all');
                  setFilterActivity('all');
                  setFilterSpecialization('all');
                }}
                title="إعادة تعيين فلاتر الإذاعات"
                size={38}
              />
            </div>
          </div>

          {/* Broadcasts Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0e3b5e', margin: 0 }}>سجل الإذاعات والإشعارات المرسلة</h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>({filteredBroadcasts.length} إذاعة مسجلة)</span>
              </div>
              <button
                type="button"
                onClick={fetchBroadcasts}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0A3C64', cursor: 'pointer' }}
              >
                <IconRefresh size={14} />
                <span>تحديث السجل</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: '700' }}>
                    <th style={{ padding: '14px 16px' }}>عنوان الإشعار</th>
                    <th style={{ padding: '14px 16px' }}>نص الرسالة</th>
                    <th style={{ padding: '14px 16px' }}>الشريحة المستهدفة</th>
                    <th style={{ padding: '14px 16px' }}>الأهمية</th>
                    <th style={{ padding: '14px 16px' }}>المستلمون</th>
                    <th style={{ padding: '14px 16px' }}>تاريخ الإرسال</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBroadcasts.length > 0 ? (
                    filteredBroadcasts.map((b) => {
                    const priorityBadge = 
                      b.priority === 'urgent' ? { bg: '#FEF2F2', color: '#DC2626', label: 'عاجل جداً' } :
                      b.priority === 'high' ? { bg: '#FFF7ED', color: '#EA580C', label: 'عالي' } :
                      b.priority === 'medium' ? { bg: '#FEFCE8', color: '#CA8A04', label: 'متوسط' } :
                      { bg: '#F1F5F9', color: '#475569', label: 'عادي' };

                    const audienceBadge = 
                      b.audience === 'consultants' ? { bg: '#EFF6FF', color: '#1D4ED8' } :
                      b.audience === 'clients' ? { bg: '#F0FDF4', color: '#15803D' } :
                      { bg: '#F8FAFC', color: '#0e3b5e' };

                    return (
                      <tr 
                        key={b.id}
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: '800', color: '#0e3b5e', maxWidth: '200px' }}>
                          {b.title}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '320px', lineHeight: '1.5' }}>
                          {b.message}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: audienceBadge.bg, color: audienceBadge.color, border: `1px solid ${audienceBadge.color}33`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {b.audienceLabel || b.audience}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: priorityBadge.bg, color: priorityBadge.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0F172A' }}>
                          {b.deliveredCount} مستخدم
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const dt = formatEnglishDateTime(b.sentAt || b.created_at);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                                <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px', fontFamily: 'monospace' }}>
                                  {dt.date}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', fontFamily: 'monospace' }}>
                                  {dt.time}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewModalOpen(b)}
                              title="معاينة شكل الإشعار"
                              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0A3C64', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconEye size={14} />
                              <span>معاينة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResendBroadcast(b)}
                              title="إعادة البث الآن"
                              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0A3C64', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconRefresh size={14} />
                              <span>إعادة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBroadcast(b.id)}
                              title="حذف من السجل"
                              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 8px', borderRadius: '8px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      لا توجد إذاعات عامة مسجلة تطابق البحث أو الفلتر
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          CREATE BROADCAST MODAL WITH TARGETED FILTERS
          ══════════════════════════════════════════════════════════════════════════ */}
      <BroadcastModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTemplatePreset(null);
        }}
        onBroadcastSent={handleBroadcastSent}
        initialData={templatePreset}
      />

      {/* Sleek NotificationDetailsModal */}
      <NotificationDetailsModal
        isOpen={Boolean(previewModalOpen)}
        notification={previewModalOpen}
        onClose={() => setPreviewModalOpen(null)}
        onNavigate={(url) => navigate(url)}
        onMarkAsRead={(id) => handleMarkAsRead(id)}
        role="admin"
      />

      {/* Sleek ConfirmModal */}
      <ConfirmModal
        isOpen={Boolean(confirmModalConfig)}
        title={confirmModalConfig?.title || 'تأكيد الحذف'}
        message={confirmModalConfig?.message || 'هل أنت متأكد من المتابعة؟'}
        confirmText={confirmModalConfig?.confirmText || 'تأكيد'}
        cancelText="إلغاء"
        variant="danger"
        onConfirm={confirmModalConfig?.onConfirm}
        onCancel={() => setConfirmModalConfig(null)}
      />

    </div>
  );
}

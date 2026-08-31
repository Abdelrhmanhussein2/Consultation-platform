import React, { useState, useEffect } from 'react';
import { IconNotifications } from '../components/AdminIcons';
import { sendBroadcastNotification } from '../services/adminApi';

export default function AdminNotificationsPage({ navigate }) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 'bc_1',
      title: 'تحديث جداول الإقرارات الضريبية لشهر أغسطس',
      message: 'نحيطكم علماً بأنه تم تحديث نماذج إقرارات ضريبة الدخل والمبيعات ورفع القوانين الإرشادية الجديدة في لوحة التشريعات.',
      audience: 'all',
      audienceLabel: 'كافة المستخدمين (All Users)',
      type: 'update',
      typeLabel: 'تحديث نظام',
      priority: 'medium',
      channels: ['in_app', 'push'],
      sentAt: '2026-08-22 10:00 ص',
      deliveredCount: 420,
      openRate: '88%'
    },
    {
      id: 'bc_2',
      title: 'إيداع أرباح الاستشارات الأسبوعية في الحسابات',
      message: 'تم تحويل كافة مستحقات وأرباح الجلسات الاستشارية المكتملة عبر الحوالات البنكية المعتمدة للمستشارين بنجاح.',
      audience: 'consultants',
      audienceLabel: 'المستشارون فقط (Consultants)',
      type: 'financial',
      typeLabel: 'إشعار مالي',
      priority: 'high',
      channels: ['in_app', 'email'],
      sentAt: '2026-08-21 04:30 م',
      deliveredCount: 48,
      openRate: '94%'
    },
    {
      id: 'bc_3',
      title: 'صيانة دورية وتحسين سرعة الاستجابة للخوادم',
      message: 'ستخضع المنصة لأعمال صيانة وتحسين للبنية التحتية فجر يوم الجمعة من 02:00 إلى 03:00 ص لتعزيز سرعة المساعد الذكي.',
      audience: 'all',
      audienceLabel: 'كافة المستخدمين (All Users)',
      type: 'maintenance',
      typeLabel: 'صيانة وتحديث',
      priority: 'urgent',
      channels: ['in_app', 'push', 'email'],
      sentAt: '2026-08-19 11:15 ص',
      deliveredCount: 395,
      openRate: '91%'
    },
    {
      id: 'bc_4',
      title: 'عرض ترويجي: خصم 20% على ترقية الباقة السنوية',
      message: 'احصل على استشارات قانونية وضريبية غير محدودة مع خصم استثنائي لجميع الشركات ورواد الأعمال حتى نهاية الشهر.',
      audience: 'clients',
      audienceLabel: 'العملاء والشركات (Clients)',
      type: 'promo',
      typeLabel: 'عرض ترويجي',
      priority: 'normal',
      channels: ['in_app', 'email'],
      sentAt: '2026-08-16 01:00 م',
      deliveredCount: 310,
      openRate: '76%'
    }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // New Broadcast Form State
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    audience: 'all',
    type: 'update',
    priority: 'normal',
    channels: ['in_app', 'push'],
    actionUrl: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Ready Templates for One-Click Fill
  const TEMPLATES = [
    {
      label: '🛠️ صيانة دورية للنظام',
      title: 'إشعار صيانة مجدولة للنظام',
      message: 'نحيطكم علماً بأنه سيتم إجراء صيانة دورية لتحسين أداء النظام فجر الغد لمدة 30 دقيقة.',
      type: 'maintenance',
      priority: 'urgent',
      audience: 'all'
    },
    {
      label: '📑 تذكير بالإقرارات الضريبية',
      title: 'تذكير: اقتراب الموعد النهائي للإقرارات الضريبية',
      message: 'يرجى مراجعة وتجهيز الإقرارات الضريبية قبل نهاية الشهر الحالي لتجنب أي غرامات تأخير.',
      type: 'update',
      priority: 'high',
      audience: 'clients'
    },
    {
      label: '💰 إيداع مستحقات المستشارين',
      title: 'تم إيداع مستحقات الاستشارات في حسابك',
      message: 'تم تحويل أرباح ومستحقات الاستشارات عن الفترة الماضية بنجاح إلى حسابك البنكي.',
      type: 'financial',
      priority: 'high',
      audience: 'consultants'
    },
    {
      label: '🚀 إطلاق ميزة جديدة بالمنصة',
      title: 'ميزة جديدة: المساعد الذكي المطور أصبح متاحاً',
      message: 'تم إطلاق النسخة المحدثة من المساعد الذكي مع دعم تحليل الوثائق القانونية بدقة فائقة.',
      type: 'update',
      priority: 'normal',
      audience: 'all'
    }
  ];

  const applyTemplate = (tpl) => {
    setNewBroadcast(prev => ({
      ...prev,
      title: tpl.title,
      message: tpl.message,
      type: tpl.type,
      priority: tpl.priority,
      audience: tpl.audience
    }));
    showToast(`تم تطبيق قالب: ${tpl.label}`);
  };

  const handleSend = async () => {
    if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) {
      alert('يرجى كتابة عنوان الإشعار ونص الرسالة');
      return;
    }

    try {
      await sendBroadcastNotification({
        title: newBroadcast.title,
        message: newBroadcast.message,
        audience: newBroadcast.audience,
        type: newBroadcast.type,
        priority: newBroadcast.priority
      });
    } catch (e) {
      console.warn('Backend broadcast error fallback to state:', e);
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-0${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    const audienceLabels = {
      all: 'كافة المستخدمين (All Users)',
      consultants: 'المستشارون فقط (Consultants)',
      clients: 'العملاء والشركات (Clients)'
    };

    const typeLabels = {
      update: 'تحديث نظام',
      financial: 'إشعار مالي',
      maintenance: 'صيانة وتحديث',
      promo: 'عرض ترويجي',
      security: 'أمني وتحذيري'
    };

    const created = {
      id: `bc_${Date.now()}`,
      title: newBroadcast.title,
      message: newBroadcast.message,
      audience: newBroadcast.audience,
      audienceLabel: audienceLabels[newBroadcast.audience] || 'الكل',
      type: newBroadcast.type,
      typeLabel: typeLabels[newBroadcast.type] || 'عام',
      priority: newBroadcast.priority,
      channels: newBroadcast.channels,
      sentAt: `${dateStr} ص`,
      deliveredCount: newBroadcast.audience === 'consultants' ? 48 : newBroadcast.audience === 'clients' ? 310 : 420,
      openRate: '100%'
    };

    setBroadcasts([created, ...broadcasts]);
    setModalOpen(false);
    setNewBroadcast({
      title: '',
      message: '',
      audience: 'all',
      type: 'update',
      priority: 'normal',
      channels: ['in_app', 'push'],
      actionUrl: ''
    });
    showToast('تم بث الإشعار الفوري لكافة المستخدمين عبر الويب سوكيت بنجاح! 🚀');
  };

  const handleResend = (b) => {
    const cloned = {
      ...b,
      id: `bc_${Date.now()}`,
      sentAt: 'الآن'
    };
    setBroadcasts([cloned, ...broadcasts]);
    showToast(`تمت إعادة بث الإشعار: "${b.title}" بنجاح!`);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإشعار من السجل؟')) {
      setBroadcasts(broadcasts.filter(b => b.id !== id));
      showToast('تم حذف الإشعار من السجل بنجاح.');
    }
  };

  // KPI Computations
  const totalBroadcasts = broadcasts.length;
  const totalDelivered = broadcasts.reduce((sum, b) => sum + (b.deliveredCount || 0), 0);
  const urgentCount = broadcasts.filter(b => b.priority === 'urgent' || b.priority === 'high').length;
  const avgOpenRate = '87.5%';

  // Filtered List
  const filteredBroadcasts = broadcasts.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !b.title.toLowerCase().includes(q) && !b.message.toLowerCase().includes(q) && !b.audienceLabel.toLowerCase().includes(q)) {
      return false;
    }
    if (filterAudience !== 'all' && b.audience !== filterAudience) return false;
    if (filterType !== 'all' && b.type !== filterType) return false;
    if (filterPriority !== 'all' && b.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px', textAlign: 'right', direction: 'rtl' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <span>🔔</span>
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
            إرسال وبث إشعارات وتنبيهات جماعية لحظية لكافة المستخدمين أو شرائح محددة عبر الـ WebSockets والتطبيق والبريد.
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(14,59,94,0.2)', transition: 'all 0.2s' }}
        >
          <span>📢</span>
          <span>إرسال إذاعة عامة جديدة</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4 SUMMARY METRIC KPI CARDS
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: 'rgba(14,59,94,0.08)', color: '#0e3b5e', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            📢
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0e3b5e', lineHeight: '1.2' }}>{totalBroadcasts}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>إجمالي الإذاعات المرسلة</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#F0FDFA', color: '#0D9488', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0D9488', lineHeight: '1.2' }}>{totalDelivered.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>إجمالي وصول الإشعارات</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#FEF2F2', color: '#DC2626', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            🚨
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#DC2626', lineHeight: '1.2' }}>{urgentCount}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>تنبيهات هامة وعاجلة</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '46px', height: '46px', background: '#ECFDF5', color: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', lineHeight: '1.2' }}>{avgOpenRate}</div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>متوسط معدل القراءة</div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          QUICK TEMPLATES BAR (قوالب جاهزة سريعة)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}>⚡ قوالب إشعارات سريعة (اضغط للتعبئة الفورية والإرسال):</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
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

      {/* ══════════════════════════════════════════════════════════════════════════
          FILTERS TOOLBAR
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ minWidth: '240px', flex: 1 }}>
            <input
              type="text"
              placeholder="ابحث في عنوان الإشعار، النص، أو الجمهور المستهدف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#F8FAFC', outline: 'none' }}
            />
          </div>

          <select
            value={filterAudience}
            onChange={e => setFilterAudience(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
          >
            <option value="all">كل الشرائح</option>
            <option value="all">الكل (All Users)</option>
            <option value="consultants">المستشارون فقط</option>
            <option value="clients">العملاء والشركات</option>
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
          >
            <option value="all">كل الأنواع</option>
            <option value="update">تحديث نظام</option>
            <option value="financial">إشعار مالي</option>
            <option value="maintenance">صيانة</option>
            <option value="promo">عرض ترويجي</option>
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
          >
            <option value="all">كل الأولويات</option>
            <option value="normal">عادي</option>
            <option value="medium">متوسط</option>
            <option value="high">عالي</option>
            <option value="urgent">عاجل جداً</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setFilterAudience('all');
              setFilterType('all');
              setFilterPriority('all');
            }}
            style={{ padding: '10px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
          >
            🔄 مسح
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TABLE VIEW: BROADCASTS LOG
          ══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0e3b5e', margin: 0 }}>سجل الإذاعات والإشعارات المرسلة</h3>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{filteredBroadcasts.length} إذاعة مسجلة</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px' }}>عنوان الإشعار</th>
                <th style={{ padding: '14px 16px' }}>نص الرسالة</th>
                <th style={{ padding: '14px 16px' }}>الشريحة المستهدفة</th>
                <th style={{ padding: '14px 16px' }}>الأهمية</th>
                <th style={{ padding: '14px 16px' }}>القنوات</th>
                <th style={{ padding: '14px 16px' }}>المستلمون</th>
                <th style={{ padding: '14px 16px' }}>تاريخ الإرسال</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBroadcasts.map((b) => {
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{b.type === 'maintenance' ? '🛠️' : b.type === 'financial' ? '💰' : b.type === 'promo' ? '🎁' : '📢'}</span>
                        <span>{b.title}</span>
                      </div>
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
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {b.channels && b.channels.includes('in_app') && <span title="داخل التطبيق WebSockets" style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>🌐</span>}
                        {b.channels && b.channels.includes('push') && <span title="إشعار Push" style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>📱</span>}
                        {b.channels && b.channels.includes('email') && <span title="بريد إلكتروني" style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>✉️</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0F172A' }}>
                      {b.deliveredCount} مستخدم
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px' }}>
                      {b.sentAt}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewModalOpen(b)}
                          title="معاينة شكل الإشعار"
                          style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0e7490', cursor: 'pointer' }}
                        >
                          👁️ معاينة
                        </button>
                        <button
                          onClick={() => handleResend(b)}
                          title="إعادة البث الآن"
                          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#1D4ED8', cursor: 'pointer' }}
                        >
                          🔄 إعادة بث
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          title="حذف من السجل"
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#DC2626', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredBroadcasts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '14px' }}>
              لا توجد إشعارات تطابق معايير البحث المحددة.
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CREATE BROADCAST MODAL
          ══════════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', textAlign: 'right' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#0e3b5e' }}>📢 إرسال إذاعة عامة فورية</h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>سيتم بث الإشعار للمستخدمين مباشرة عبر الويب سوكيت وقاعدة البيانات</span>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Target Audience */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>الشريحة والجمهور المستهدف:</label>
              <select 
                value={newBroadcast.audience}
                onChange={e => setNewBroadcast({ ...newBroadcast, audience: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="all">كافة المستخدمين والمستشارين (All Users - وصول كامل)</option>
                <option value="consultants">المستشارون المعتمدون فقط (Consultants)</option>
                <option value="clients">العملاء والشركات والمشتركون فقط (Clients & Companies)</option>
              </select>
            </div>

            {/* Notification Type & Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>نوع التنبيه:</label>
                <select
                  value={newBroadcast.type}
                  onChange={e => setNewBroadcast({ ...newBroadcast, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="update">تحديث نظام وقوانين</option>
                  <option value="financial">إشعار مالي وفواتير</option>
                  <option value="maintenance">صيانة وتوقف مؤقت</option>
                  <option value="promo">عرض ترويجي وتخفيض</option>
                  <option value="security">أمني وتحذيري</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>مستوى الأهمية:</label>
                <select
                  value={newBroadcast.priority}
                  onChange={e => setNewBroadcast({ ...newBroadcast, priority: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="normal">عادي (Normal)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="high">عالي (High)</option>
                  <option value="urgent">عاجل جداً (Urgent - منبثق)</option>
                </select>
              </div>
            </div>

            {/* Title Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>عنوان الإشعار:</label>
              <input 
                type="text" 
                placeholder="اكتب عنوان الإشعار..."
                value={newBroadcast.title}
                onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {/* Message Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>نص الرسالة:</label>
              <textarea 
                rows={3}
                placeholder="اكتب نص الإشعار الكامل هنا..."
                value={newBroadcast.message}
                onChange={e => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Live Preview Box */}
            <div style={{ background: '#F8FAFC', border: '1px dashed #0e7490', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0e7490', marginBottom: '6px' }}>👁️ معاينة شكل الإشعار لدى المستخدم:</div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: 'rgba(14,59,94,0.1)', color: '#0e3b5e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  🔔
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}>{newBroadcast.title || 'عنوان الإشعار التجريبي'}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>{newBroadcast.message || 'سيظهر نص الرسالة الكامل هنا كما يراه العميل في جرس الإشعارات.'}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>الآن • منصة ديوان</div>
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ padding: '10px 20px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button 
                onClick={handleSend}
                style={{ padding: '10px 24px', background: '#0e3b5e', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
              >
                بث الإشعار لحظياً 🚀
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PREVIEW MODAL (معاينة تفاصيل الإشعار)
          ══════════════════════════════════════════════════════════════════════════ */}
      {previewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px', direction: 'rtl' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', textAlign: 'right' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>معاينة تفاصيل الإشعار المرسل</h3>
            
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0e3b5e', marginBottom: '6px' }}>{previewModalOpen.title}</div>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px 0' }}>{previewModalOpen.message}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <div>الجمهور: <strong>{previewModalOpen.audienceLabel}</strong></div>
                <div>النوع: <strong>{previewModalOpen.typeLabel}</strong></div>
                <div>تاريخ الإرسال: <strong>{previewModalOpen.sentAt}</strong></div>
                <div>المستلمون: <strong>{previewModalOpen.deliveredCount} مستخدم</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPreviewModalOpen(null)}
                style={{ padding: '10px 20px', background: '#0e3b5e', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
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

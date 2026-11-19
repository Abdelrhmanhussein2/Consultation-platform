// frontend/src/components/Notifications/NotificationDetailsModal.jsx
import React from 'react';
import { getNotificationTarget } from '../../utils/notificationRouter';

function cleanNotificationTitle(title) {
  if (!title) return '';
  return String(title).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🔔]/gu, '').trim();
}

function formatEnglishDateTime(dateStr) {
  if (!dateStr) return { date: '—', time: '—' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = String(dateStr).trim().split(/\s+/);
    if (parts.length === 2) {
      const isDateFirst = parts[0].includes('-');
      return {
        date: isDateFirst ? parts[0] : parts[1],
        time: isDateFirst ? parts[1] : parts[0]
      };
    }
    return { date: String(dateStr), time: '' };
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return {
    date: `${year}-${month}-${day}`,
    time: timePart
  };
}

export default function NotificationDetailsModal({
  isOpen,
  notification,
  onClose,
  onNavigate,
  onMarkAsRead,
  role = 'user'
}) {
  if (!isOpen || !notification) return null;

  const target = getNotificationTarget(notification, role);
  const timeObj = formatEnglishDateTime(notification.created_at || notification.sentAt || notification.date);

  const handleAction = () => {
    if (onMarkAsRead && notification.id) {
      onMarkAsRead(notification.id);
    }
    if (onClose) onClose();
    if (target && target.url && onNavigate) {
      onNavigate(target.url);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          border: '1px solid #E2E8F0',
          direction: 'rtl',
          textAlign: 'right',
          fontFamily: 'var(--font-main, "Cairo", sans-serif)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 14px 0' }}>
          تفاصيل الإشعار
        </h3>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '900', color: '#0e3b5e', fontSize: '14px', marginBottom: '6px' }}>
            {cleanNotificationTitle(notification.title)}
          </div>
          <div style={{ color: '#475569', fontSize: '12.5px', lineHeight: '1.6' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
            <span>{timeObj.date}</span>
            <span>•</span>
            <span>{timeObj.time}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {target && target.url && (
            <button
              type="button"
              onClick={handleAction}
              style={{
                flex: 1.5,
                background: '#005D9C',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <span>{target.label || 'عرض'} ↵</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

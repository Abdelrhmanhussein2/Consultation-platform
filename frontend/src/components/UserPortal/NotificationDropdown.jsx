import React from 'react';

function formatEnglishDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${year}-${month}-${day} • ${timePart}`;
}

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onItemClick, onViewAll, onClose }) {
  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <span className="notif-title">الإشعارات والتنبيهات</span>
        {unreadCount > 0 && (
          <button 
            type="button" 
            className="mark-all-read-btn" 
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkAllRead) onMarkAllRead(e);
            }}
          >
            تحديد الكل كمقروء
          </button>
        )}
      </div>
      <div className="notif-list">
        {notifications && notifications.length > 0 ? (
          notifications.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className={`notif-item ${!item.is_read ? 'unread' : ''}`}
              onClick={() => onItemClick && onItemClick(item)}
              style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
            >
              <div className="notif-item-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.title}</span>
                {!item.is_read && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3B82F6',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                )}
              </div>
              <div className="notif-item-msg">{item.message}</div>
              <div className="notif-item-time" style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                {formatEnglishDateTime(item.created_at || Date.now())}
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">لا توجد إشعارات حالياً</div>
        )}
      </div>
      {onViewAll && (
        <div style={{
          padding: '10px 16px',
          textAlign: 'center',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewAll();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#005D9C',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            عرض جميع الإشعارات ←
          </button>
        </div>
      )}
    </div>
  );
}

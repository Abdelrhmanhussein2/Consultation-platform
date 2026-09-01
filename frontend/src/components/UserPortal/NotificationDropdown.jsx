import React from 'react';

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onItemClick, onClose }) {
  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <span className="notif-title">الإشعارات والتنبيهات</span>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={onMarkAllRead}>
            تحديد الكل كمقروء ✓
          </button>
        )}
      </div>
      <div className="notif-list">
        {notifications.length > 0 ? (
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
              <div className="notif-item-time">
                {new Date(item.created_at || Date.now()).toLocaleString('ar-EG', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">لا توجد إشعارات حالياً</div>
        )}
      </div>
    </div>
  );
}

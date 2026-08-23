import React from 'react';

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onClose }) {
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
          notifications.slice(0, 6).map((item) => (
            <div key={item.id} className={`notif-item ${!item.is_read ? 'unread' : ''}`}>
              <div className="notif-item-title">{item.title}</div>
              <div className="notif-item-msg">{item.message}</div>
              <div className="notif-item-time">
                {new Date(item.created_at).toLocaleString('ar-EG', {
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

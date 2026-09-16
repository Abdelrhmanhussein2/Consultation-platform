import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import NotificationDropdown from '../../components/UserPortal/NotificationDropdown';
import {
  IconSearch,
  IconSparkles,
  IconNotifications,
  SidebarToggleIcon
} from './AdminIcons';

export default function AdminHeader({ navigate, onOpenAiModal, isSidebarCollapsed, toggleSidebar }) {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const fetchNotifs = async () => {
      try {
        const [cntData, notifData] = await Promise.all([
          notificationService.getUnreadCount(token),
          notificationService.getMyNotifications(token)
        ]);

        if (cntData && typeof cntData.unread_count === 'number') {
          setUnreadCount(cntData.unread_count);
        }
        if (Array.isArray(notifData)) {
          setNotifications(notifData);
        }
      } catch (e) {}
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000);
    const onFocus = () => fetchNotifs();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Click outside handler for notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      if (token) {
        await notificationService.markAllAsRead(token);
      }
    } catch (err) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (token) {
        try {
          await notificationService.markAsRead(notif.id, token);
        } catch (err) {}
      }
    }
    setShowNotifications(false);
    navigate('/admin/notifications');
  };

  const firstLetter = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'م';

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-right-group">
        {/* Sidebar Toggle Button - Immediately next to sidebar */}
        {toggleSidebar && (
          <button
            className="sidebar-toggle-btn-header"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
          >
            <SidebarToggleIcon size={20} color="#005D9C" />
          </button>
        )}

        {/* Profile Avatar & Name */}
        <button 
          className="admin-profile-dropdown-btn"
          onClick={() => navigate('/admin/settings')}
        >
          <div className="admin-avatar-circle">
            {firstLetter}
          </div>
          <div className="admin-profile-info">
            <div className="admin-profile-name">{user?.full_name || 'مدير المنصة'}</div>
            <div className="admin-profile-sub">حسابك الشخصي</div>
          </div>
        </button>

        {/* Role Pill Badge */}
        <div className="admin-role-badge-pill">
          مدير المنصة
        </div>

        {/* Notification Bell Dropdown Container */}
        <div className="notification-container" ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className="admin-icon-btn-minimal" 
            title="الإشعارات والتنبيهات" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IconNotifications size={16} />
            {unreadCount > 0 && <span className="admin-bell-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onItemClick={handleNotificationClick}
              onViewAll={() => {
                setShowNotifications(false);
                navigate('/admin/notifications');
              }}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Search Bar with ⌘K badge */}
        <div className="admin-search-wrapper">
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="ابحث في التشريعات أو اسأل المساعد الذكي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="admin-search-kbd">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Left side: AI Button */}
      <div className="admin-topbar-left-group">
        <button 
          className="admin-btn-ask-ai"
          onClick={() => onOpenAiModal ? onOpenAiModal() : navigate('/admin/ai-monitoring')}
        >
          <IconSparkles size={15} />
          <span>اسأل ديوان AI</span>
        </button>
      </div>
    </header>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import UserProfileDropdown from './UserProfileDropdown';
import { getNotificationTarget } from '../../utils/notificationRouter';
import { BellIcon, SidebarToggleIcon } from './Icons';
import './UserHeader.css';

export default function UserHeader({ navigate, isSidebarCollapsed, toggleSidebar }) {
  const { user, token, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [activeSub, setActiveSub] = useState(null);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch unread count, notifications & subscription status
  useEffect(() => {
    if (!token) return;

    const fetchNotifs = async () => {
      try {
        const [cntData, notifData, subData] = await Promise.all([
          notificationService.getUnreadCount(token),
          notificationService.getMyNotifications(token),
          apiFetch('/api/subscriptions/my-subscription', {}, token).catch(() => null)
        ]);

        setUnreadCount(cntData?.unread_count || 0);
        setNotifications(notifData || []);
        if (subData && subData.has_subscription) {
          setActiveSub(subData);
        }
      } catch (err) {
        // Silently handle errors
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000); // Poll every 3s
    const onFocus = () => fetchNotifs();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      if (token) {
        await notificationService.markAllAsRead(token);
      }
    } catch (err) {
      console.warn('Failed to mark all as read on backend:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;

    // Optimistically mark as read
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (token) {
        try {
          await notificationService.markAsRead(notif.id, token);
        } catch (err) {
          console.warn('Failed to mark notification as read:', err);
        }
      }
    }

    setShowNotifications(false);

    // Resolve target page & tab dynamically
    const target = getNotificationTarget(notif, user?.role);
    if (target && target.url && navigate) {
      navigate(target.url);
    }
  };



  const getEntityLabel = (type) => {
    switch (type) {
      case 'company': return 'حساب شركة / مؤسسة';
      case 'researcher': return 'باحث / أكاديمي';
      default: return 'حساب شخصي';
    }
  };

  const firstLetter = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'م';

  return (
    <header className="portal-header">
      {/* Right group: Sidebar Toggle + Profile + Notifications */}
      <div className="portal-header-right-group">
        {/* Clean Sidebar Toggle Button [||] */}
        <button
          className="sidebar-toggle-btn-header"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        >
          <SidebarToggleIcon size={20} color="#005D9C" />
        </button>

        {/* Profile Menu Badge */}
        <div className="user-profile-menu-container" ref={userMenuRef}>
          <div
            className="user-profile-badge"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-circle">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                firstLetter
              )}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.full_name || 'مستخدم المنصة'}</span>
              <span className="user-role-label">{(user?.role === 'consultant' || user?.role === 'platform_consultant') ? 'حساب مستشار' : getEntityLabel(user?.entity_type)}</span>
            </div>

            <span style={{ fontSize: '10px', color: '#94A3B8' }}>▼</span>
          </div>

          {showUserMenu && (
            <UserProfileDropdown
              navigate={navigate}
              onLogout={() => { logout(); navigate('/login'); }}
              onClose={() => setShowUserMenu(false)}
            />
          )}
        </div>

        {/* Notifications */}
        <div className="notification-container" ref={notifRef}>
          <button
            className="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="الإشعارات"
          >
            <BellIcon size={19} color="#475569" />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onItemClick={handleNotificationClick}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
      </div>

      {/* Left group: Subscription pill only */}
      {activeSub && activeSub.has_subscription && (
        <div className="portal-header-left-group">
          <div 
            className={`sub-pill ${activeSub.remaining_days <= 7 ? 'expiring' : ''}`}
            onClick={() => navigate('/subscriptions')}
            style={{ cursor: 'pointer' }}
            title="تفاصيل الاشتراك"
          >
            <span>{activeSub.plan_name}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>{activeSub.remaining_days} يوم متبقي</span>
          </div>
        </div>
      )}
    </header>
  );
}

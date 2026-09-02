import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import UserProfileDropdown from './UserProfileDropdown';
import { SearchIcon, BellIcon, AiIcon, SidebarToggleIcon } from './Icons';

export default function UserHeader({ navigate, isSidebarCollapsed, toggleSidebar }) {
  const { user, token, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch unread count & notifications from backend service
  useEffect(() => {
    if (!token) return;

    const fetchNotifs = async () => {
      try {
        const [cntData, notifData] = await Promise.all([
          notificationService.getUnreadCount(token),
          notificationService.getMyNotifications(token)
        ]);

        setUnreadCount(cntData.unread_count || 0);
        setNotifications(notifData || []);
      } catch (err) {
        // Silently handle errors
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // Poll every 60s
    return () => clearInterval(interval);
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

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllAsRead(token);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      // Ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;

    // Mark as read
    if (!notif.is_read && token) {
      try {
        await notificationService.markAsRead(notif.id, token);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // Silently handle error
      }
    }

    setShowNotifications(false);

    // Explicit target URL if provided by backend
    if (notif.target_url) {
      navigate(notif.target_url);
      return;
    }

    const rawTitle = notif.title || '';
    const rawMsg = notif.message || '';
    const title = rawTitle.toLowerCase();
    const msg = rawMsg.toLowerCase();
    const type = (notif.type || notif.notification_type || '').toLowerCase();
    const isConsultant = user?.role === 'consultant';

    // 1. Session Links & Appointments FIRST (e.g. "رابط جلسة الاستشارة جاهز", "طلب حجز موعد جديد")
    if (
      type.includes('session') ||
      type.includes('appointment') ||
      title.includes('رابط') ||
      title.includes('جلسة') ||
      title.includes('موعد') ||
      title.includes('حجز')
    ) {
      let apptId = notif.related_entity_id || '';
      if (!apptId && notif.message) {
        const match = notif.message.match(/consultation-([a-f0-9-]+)/i);
        if (match) apptId = match[1];
      }

      const targetPath = isConsultant ? '/consultant/sessions' : '/my-appointments';
      if (apptId) {
        navigate(`${targetPath}?openApptId=${apptId}`);
      } else {
        navigate(targetPath);
      }
      return;
    }

    // 2. Chat / Direct Messages SECOND (e.g. "رسالة جديدة من محمد مسعد")
    if (
      type.includes('chat') ||
      type.includes('message') ||
      title.includes('رسالة') ||
      title.includes('محادثة') ||
      msg.includes('رسالة جديدة')
    ) {
      let senderName = '';
      if (rawTitle.includes('من ')) {
        senderName = rawTitle.split('من ')[1]?.trim() || '';
      } else if (rawMsg.includes('من ')) {
        senderName = rawMsg.split('من ')[1]?.trim() || '';
      }

      const entityId = notif.related_entity_id || '';
      let chatUrl = '/chat';
      const params = new URLSearchParams();
      if (entityId) params.append('apptId', entityId);
      if (senderName) params.append('user', senderName);

      const paramStr = params.toString();
      if (paramStr) chatUrl += `?${paramStr}`;

      navigate(chatUrl);
      return;
    }

    // 3. Earnings / Invoices / Payments
    if (
      type.includes('payment') ||
      type.includes('payout') ||
      title.includes('تحويل') ||
      title.includes('دفع') ||
      title.includes('فاتورة') ||
      msg.includes('أرباح')
    ) {
      if (isConsultant) {
        navigate('/consultant/earnings');
      } else {
        navigate('/invoices');
      }
      return;
    }

    // 4. Support Tickets
    if (type.includes('ticket') || title.includes('تذكرة') || msg.includes('تذكرة')) {
      navigate('/support/tickets');
      return;
    }

    // 5. Default fallback
    if (isConsultant) {
      navigate('/consultant/sessions');
    } else {
      navigate('/my-appointments');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/regulations?query=${encodeURIComponent(searchQuery.trim())}`);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 1 480px' }}>
        {/* Clean Sidebar Toggle Button [||] */}
        <button
          className="sidebar-toggle-btn-header"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        >
          <SidebarToggleIcon size={20} color="#005D9C" />
        </button>

        {/* Search Bar */}
        <form className="header-search" onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
          <div className="search-input-wrapper">
            <span className="search-icon">
              <SearchIcon size={16} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="ابحث في التشريعات أو اسأل المساعد الذكي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Action Buttons & User Badge */}
      <div className="header-actions">

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
              <span className="user-role-label">{user?.role === 'consultant' ? 'حساب مستشار' : getEntityLabel(user?.entity_type)}</span>
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
      </div>
    </header>
  );
}

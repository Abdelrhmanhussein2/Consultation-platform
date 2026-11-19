import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import NotificationDropdown from '../../components/UserPortal/NotificationDropdown';
import NotificationDetailsModal from '../../components/Notifications/NotificationDetailsModal';
import { getNotificationTarget } from '../../utils/notificationRouter';
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
  const [selectedNotifForModal, setSelectedNotifForModal] = useState(null);

  const notifRef = useRef(null);
  const hasCheckedOnLoginPopup = useRef(false);

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
        const notifList = Array.isArray(notifData) ? notifData : (notifData?.items || notifData?.data || []);
        setNotifications(notifList);

        // Check for unread law announcement to show as popup on login
        if (!hasCheckedOnLoginPopup.current && notifList.length > 0) {
          hasCheckedOnLoginPopup.current = true;
          const unreadLawNotif = notifList.find(n => {
            if (n.is_read) return false;
            const meta = n.extra_metadata || n.metadata || {};
            const isLaw = meta.target_type === 'law' ||
                          meta.is_law_announcement ||
                          n.related_entity_type === 'legal_source' ||
                          (n.title && (n.title.includes('قانون') || n.title.includes('تشريع') || n.title.includes('تعديل في')));
            if (!isLaw) return false;
            const shownKey = `shown_law_popup_${n.id}`;
            return !localStorage.getItem(shownKey);
          });

          if (unreadLawNotif) {
            setSelectedNotifForModal(unreadLawNotif);
            localStorage.setItem(`shown_law_popup_${unreadLawNotif.id}`, 'true');
          }
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

  const handleNotificationClick = (notif) => {
    if (!notif) return;
    setShowNotifications(false);
    setSelectedNotifForModal(notif);
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
      {/* Shared Admin NotificationDetailsModal */}
      <NotificationDetailsModal
        isOpen={Boolean(selectedNotifForModal)}
        notification={selectedNotifForModal}
        onClose={async () => {
          if (selectedNotifForModal?.id) {
            const notifId = selectedNotifForModal.id;
            localStorage.setItem(`shown_law_popup_${notifId}`, 'true');
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (token) {
              try {
                await notificationService.markAsRead(notifId, token);
              } catch (err) {}
            }
          }
          setSelectedNotifForModal(null);
        }}
        onNavigate={(url) => {
          if (selectedNotifForModal?.id) {
            localStorage.setItem(`shown_law_popup_${selectedNotifForModal.id}`, 'true');
          }
          navigate(url);
        }}
        onMarkAsRead={async (id) => {
          localStorage.setItem(`shown_law_popup_${id}`, 'true');
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
          if (token) {
            try {
              await notificationService.markAsRead(id, token);
            } catch (err) {}
          }
        }}
        role="admin"
      />
    </header>
  );
}

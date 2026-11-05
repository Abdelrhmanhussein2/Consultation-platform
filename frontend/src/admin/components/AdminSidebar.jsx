import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { ADMIN_MENU_ITEMS, ChevronIcon } from './adminSidebarData';

export default function AdminSidebar({ currentPath, navigate, userRole = 'super_admin', permissions = [], isCollapsed }) {
  const { logout } = useAuth();
  const [activeDummySubId, setActiveDummySubId] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    ADMIN_MENU_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => sub.path === currentPath)) {
        initial[item.id] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    ADMIN_MENU_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => sub.path === currentPath)) {
        setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [currentPath]);

  const handleItemClick = (e, path, id) => {
    e.preventDefault();
    if (path) {
      setActiveDummySubId(null);
      navigate(path);
    } else if (id) {
      setActiveDummySubId(id);
    }
  };

  const handleGroupClick = (e, item) => {
    e.preventDefault();
    const isCurrentlyExpanded = !!expandedGroups[item.id];
    if (item.defaultPath) {
      if (currentPath === item.defaultPath) {
        setExpandedGroups(prev => ({ ...prev, [item.id]: !isCurrentlyExpanded }));
      } else {
        setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
        setActiveDummySubId(null);
        navigate(item.defaultPath);
      }
    } else {
      setExpandedGroups(prev => ({ ...prev, [item.id]: !isCurrentlyExpanded }));
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      if (logout) { await logout(); } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch {} finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <aside className={`portal-sidebar admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div
          className="brand-wrapper"
          onClick={() => navigate('/admin')}
          style={{
            cursor: 'pointer', gap: isCollapsed ? '0' : '12px', display: 'flex',
            alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', width: '100%'
          }}
        >
          <img src="/logo_white.png" alt="شعار منصة ديوان" style={{ height: isCollapsed ? '44px' : '56px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo.png'; }} />
          {!isCollapsed && (
            <div className="brand-text-box">
              <span className="brand-title" style={{ color: '#FFFFFF', fontWeight: '800', fontSize: '15px', lineHeight: '1.2' }}>منصة ديوان</span>
              <span className="brand-subtitle" style={{ color: '#F5A52A', fontWeight: '700', fontSize: '10px', marginTop: '2px', display: 'block' }}>للاستشارات الضريبية</span>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {ADMIN_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.subItems) {
            const isGroupOpen = !!expandedGroups[item.id];
            const exactSubMatch = item.subItems.find(sub => sub.path && currentPath === sub.path);
            const activeSubId = exactSubMatch ? exactSubMatch.id : item.subItems.find(sub => sub.path && currentPath.startsWith(sub.path + '/'))?.id;
            const isAnySubActive = !!activeSubId || item.subItems.some(sub => sub.id === activeDummySubId);

            return (
              <div key={item.id} className="support-accordion-group" style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={(e) => { if (isCollapsed) { if (item.defaultPath) navigate(item.defaultPath); } else { handleGroupClick(e, item); } }}
                  className={`nav-item ${isAnySubActive ? 'active' : ''}`}
                  title={item.label}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '10px 0' : '7px 10px', gap: isCollapsed ? '0' : '6px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: isCollapsed ? '0' : '8px', flex: isCollapsed ? 'none' : 1, minWidth: 0 }}>
                    <span className="nav-icon" style={{ flexShrink: 0 }}><Icon size={18} color={isAnySubActive ? '#FFFFFF' : '#CBD5E1'} /></span>
                    {!isCollapsed && <span className="nav-label" style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                  </div>
                  {!isCollapsed && <ChevronIcon isOpen={isGroupOpen} />}
                </button>

                {isGroupOpen && !isCollapsed && (
                  <div className="sidebar-sub-nav" style={{ paddingRight: '36px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {item.subItems.map(sub => {
                      const isSubActive = sub.id === activeSubId || sub.id === activeDummySubId;
                      return (
                        <button
                          key={sub.id} type="button" onClick={(e) => handleItemClick(e, sub.path, sub.id)}
                          className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
                          style={{
                            background: 'transparent', border: 'none', color: isSubActive ? '#FFFFFF' : '#94A3B8',
                            padding: '6px 10px', textAlign: 'right', fontSize: '12px', cursor: 'pointer', borderRadius: '6px',
                            fontWeight: isSubActive ? '700' : 'normal', display: 'flex', alignItems: 'center', gap: '8px', width: '100%'
                          }}
                          onMouseEnter={(e) => { if (!isSubActive) e.target.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { if (!isSubActive) e.target.style.color = '#94A3B8'; }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', opacity: isSubActive ? 1 : 0, display: 'inline-block', flexShrink: 0 }} />
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = (item.path && (currentPath === item.path || (item.path === '/admin' && currentPath === '/admin/dashboard'))) || activeDummySubId === item.id;
          return (
            <button
              key={item.id} type="button" onClick={(e) => handleItemClick(e, item.path, item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`} title={item.label}
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px 0' : '7px 10px', gap: isCollapsed ? '0' : '8px' }}
            >
              <span className="nav-icon" style={{ flexShrink: 0 }}><Icon size={18} color={isActive ? '#FFFFFF' : '#CBD5E1'} /></span>
              {!isCollapsed && <span className="nav-label" style={{ fontSize: '12px', fontWeight: '600' }}>{item.label}</span>}
              {!isCollapsed && item.badge && <span className="admin-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button" className="nav-item logout-nav-item" onClick={(e) => { e.preventDefault(); setShowLogoutConfirm(true); }}
          title="تسجيل الخروج"
          style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px 0' : '7px 10px', gap: isCollapsed ? '0' : '8px' }}
        >
          <span className="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          {!isCollapsed && <span className="nav-label" style={{ color: '#F87171' }}>تسجيل الخروج</span>}
        </button>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm} title="تسجيل الخروج من لوحة التحكم"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج وإنهاء الجلسة الإدارية الحالية؟"
        confirmText="تسجيل الخروج" cancelText="البقاء في اللوحة" variant="danger"
        isLoading={loggingOut} onConfirm={handleConfirmLogout} onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}

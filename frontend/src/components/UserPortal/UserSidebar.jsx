import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon,
  ConsultantsIcon,
  AppointmentsIcon,
  ChatIcon,
  RegulationsIcon,
  AiIcon,
  InvoicesIcon,
  TicketsIcon,
  PolicyIcon,
  SettingsIcon,
  LogoutIcon
} from './Icons';

export default function UserSidebar({ currentPath, navigate, isCollapsed }) {
  const { logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'لوحة التحكم', IconComponent: DashboardIcon },
    { path: '/consultants', label: 'المستشارون', IconComponent: ConsultantsIcon },
    { path: '/my-appointments', label: 'استشاراتي والمواعيد', IconComponent: AppointmentsIcon },
    { path: '/chat', label: 'المحادثات والرسائل', IconComponent: ChatIcon },
    { path: '/regulations', label: 'التشريعات والقوانين', IconComponent: RegulationsIcon },
    { path: '/ai-assistant', label: 'المساعد الذكي', IconComponent: AiIcon },
    { path: '/invoices', label: 'الفواتير والمدفوعات', IconComponent: InvoicesIcon },
    { path: '/tickets', label: 'مساعدة الأعمال والدعم', IconComponent: TicketsIcon },
    { path: '/policies-portal', label: 'مركز السياسات', IconComponent: PolicyIcon },
    { path: '/settings', label: 'الإعدادات والملف الشخصي', IconComponent: SettingsIcon }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`portal-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Platform White Logo Header */}
      <div className="sidebar-header">
        <div
          className="brand-wrapper"
          onClick={() => navigate('/dashboard')}
          style={{
            cursor: 'pointer',
            gap: isCollapsed ? '0' : '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%'
          }}
        >
          <img
            src={isCollapsed ? '/favicon.svg' : '/logo_white.png'}
            alt="شعار منصة ديوان"
            style={{ height: isCollapsed ? '28px' : '36px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.target.src = '/favicon.svg'; }}
          />
          {!isCollapsed && (
            <div className="brand-text-box">
              <span className="brand-title">منصة ديوان</span>
              <span className="brand-subtitle">للاستشارات الضريبية</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const { IconComponent } = item;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              <span className="nav-icon">
                <IconComponent size={20} color={isActive ? '#FFFFFF' : '#CBD5E1'} />
              </span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="sidebar-footer">
        <button
          className="nav-item logout-nav-item"
          onClick={handleLogout}
          title="تسجيل الخروج"
        >
          <span className="nav-icon">
            <LogoutIcon size={20} color="#F87171" />
          </span>
          {!isCollapsed && <span className="nav-label">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}

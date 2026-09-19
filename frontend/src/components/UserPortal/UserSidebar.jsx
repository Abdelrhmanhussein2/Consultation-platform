import React, { useState, useEffect } from 'react';
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

// Custom inline SVG icons tailored specifically for the Consultant Sidebar
const HomeGridIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ControlPanelIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const SparklesAiIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C12 7.5 7.5 12 3 12C7.5 12 12 16.5 12 21C12 16.5 16.5 12 21 12C16.5 12 12 7.5 12 3Z" />
    <path d="M19 3V7M17 5H21" />
    <path d="M5 17V20M3.5 18.5H6.5" />
  </svg>
);

const SemanticSearchIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LegislationCenterIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ClientsGroupIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="3.5" />
    <path d="M20 21v-2a3.5 3.5 0 0 0-2.5-3.35" />
    <path d="M15 3.5a3.5 3.5 0 0 1 0 7" />
    <path d="M4 21v-2a3.5 3.5 0 0 1 2.5-3.35" />
    <path d="M5 3.5a3.5 3.5 0 0 0 0 7" />
  </svg>
);

const PlatformColleaguesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M14 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ConsultingCalendarIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2.5" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MessagesAlertsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BusinessHelpIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const FinancialReportsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="18" x2="8" y2="15" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="16" y1="18" x2="16" y2="14" />
  </svg>
);

const TaxFormsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <rect x="8" y="13" width="8" height="5" rx="0.5" />
    <line x1="12" y1="13" x2="12" y2="18" />
    <line x1="8" y1="15.5" x2="16" y2="15.5" />
  </svg>
);

const MyFoldersIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H6a2 2 0 0 0-2 2z" />
    <path d="M8 4V2.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V4" />
    <line x1="10" y1="12" x2="14" y2="12" />
    <line x1="10" y1="15" x2="14" y2="15" />
  </svg>
);

const FavoritesHeartIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const InvoicesPaymentsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3h10v6h6v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3z" />
    <line x1="8" y1="13" x2="13" y2="13" />
    <line x1="8" y1="17" x2="15" y2="17" />
    <circle cx="18" cy="5" r="3.5" />
    <line x1="18" y1="3" x2="18" y2="7" />
    <line x1="16.5" y1="5" x2="19.5" y2="5" />
  </svg>
);

const SubscriptionsCrownIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l3.5 9h11L21 8l-4.5 4.5L12 4l-4.5 8.5L3 8z" />
    <line x1="5" y1="20" x2="19" y2="20" />
  </svg>
);

const SupportHeadsetIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const UserCircleIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="9" r="3.5" />
    <path d="M6.17 18.5a8 8 0 0 1 11.66 0" />
  </svg>
);

const LogoutArrowIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      marginLeft: 'auto',
      marginRight: '0',
      flexShrink: 0,
      color: '#94A3B8'
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function UserSidebar({ currentPath, navigate, isCollapsed }) {
  const { logout, user } = useAuth();
  const userRole = user?.role;

  const isServicesGroupRoute = Boolean(
    currentPath && typeof currentPath === 'string' && (
      currentPath.startsWith('/consultant/services') ||
      currentPath.startsWith('/consultant/schedule') ||
      currentPath.startsWith('/consultant/sessions')
    )
  );

  const [servicesOpen, setServicesOpen] = useState(isServicesGroupRoute);

  useEffect(() => {
    if (isServicesGroupRoute) {
      setServicesOpen(true);
    }
  }, [currentPath]);

  const isSupportGroupRoute = Boolean(
    currentPath && typeof currentPath === 'string' && currentPath.startsWith('/support')
  );

  const [supportOpen, setSupportOpen] = useState(isSupportGroupRoute);

  useEffect(() => {
    if (isSupportGroupRoute) {
      setSupportOpen(true);
    }
  }, [currentPath]);

  const clientNavItems = [
    { path: '/dashboard', label: 'الرئيسية', IconComponent: DashboardIcon },
    { path: '/calendar', label: 'جدول المواعيد والتقويم', IconComponent: AppointmentsIcon },
    { path: '/subscriptions', label: 'الباقات والاشتراكات', IconComponent: SubscriptionsCrownIcon },
    { path: '/quick-consultation', label: 'استشارة سريعة', IconComponent: SparklesAiIcon },
    { path: '/consultants', label: 'المستشارون', IconComponent: ConsultantsIcon },
    { path: '/my-appointments', label: 'استشاراتي والمواعيد', IconComponent: AppointmentsIcon },
    { path: '/regulations', label: 'التشريعات والقوانين', IconComponent: RegulationsIcon },
    { path: '/ai-assistant', label: 'المساعد الذكي', IconComponent: AiIcon },
    { path: '/invoices', label: 'الفواتير والمدفوعات', IconComponent: InvoicesIcon },
    { path: '/tickets', label: 'الدعم والمساعدة', IconComponent: TicketsIcon },
    { path: '/policies-portal', label: 'مركز السياسات', IconComponent: PolicyIcon },
    { path: '/settings', label: 'الإعدادات والملف الشخصي', IconComponent: SettingsIcon }
  ];

  // Exact consultant navigation items and order matching the approved new design
  const consultantNavItems = [
    { path: '/consultant/dashboard', label: 'الرئيسية', IconComponent: HomeGridIcon },
    { path: '/consultant/control-panel', label: 'لوحة التحكم', IconComponent: ControlPanelIcon },
    { path: '/ai-assistant', label: 'المساعد الذكي', IconComponent: SparklesAiIcon },
    { path: '/consultant/semantic-search', label: 'البحث الدلالي', IconComponent: SemanticSearchIcon },
    { path: '/regulations', label: 'مركز التشريعات', IconComponent: LegislationCenterIcon },
    { path: '/consultant/clients', label: 'العملاء', IconComponent: ClientsGroupIcon },
    { path: '/consultant/colleagues', label: 'زملاء المنصة', IconComponent: PlatformColleaguesIcon },
    {
      id: 'consulting_services_group',
      label: 'إدارة الخدمات الإستشارية',
      IconComponent: ConsultingCalendarIcon,
      isGroup: true,
      subItems: [
        { path: '/consultant/services', label: 'إدارة الخدمات' },
        { path: '/consultant/schedule', label: 'جدولة المواعيد' },
        { path: '/consultant/sessions', label: 'الحجوزات والجلسات' }
      ]
    },
    { path: '/chat', label: 'الرسائل والتنبيهات', IconComponent: MessagesAlertsIcon },
    { path: '/tickets', label: 'مساعدة الأعمال', IconComponent: BusinessHelpIcon },
    { path: '/consultant/earnings', label: 'التقارير المالية', IconComponent: FinancialReportsIcon },
    { path: '/consultant/templates', label: 'النماذج الضريبية', IconComponent: TaxFormsIcon },
    { path: '/consultant/documents', label: 'مجلداتي', IconComponent: MyFoldersIcon },
    { path: '/consultant/favorites', label: 'المفضلة', IconComponent: FavoritesHeartIcon },
    { path: '/invoices', label: 'الفواتير والمدفوعات', IconComponent: InvoicesPaymentsIcon },
    { path: '/consultant/subscriptions', label: 'الإشتراكات', IconComponent: SubscriptionsCrownIcon },
    {
      id: 'support_help_group',
      label: 'الدعم والمساعدة',
      IconComponent: SupportHeadsetIcon,
      isGroup: true,
      subItems: [
        { path: '/support', label: 'مركز الدعم والمساعدة' },
        { path: '/support/tickets', label: 'طلبات الدعم' },
        { path: '/support/new-ticket', label: 'تقديم طلب جديد' }
      ]
    },
    { path: '/consultant/profile', label: 'الملف الشخصي', IconComponent: UserCircleIcon },
    { path: '/settings', label: 'الإعدادات', IconComponent: SettingsIcon }
  ];

  const isConsultant = userRole === 'consultant' || userRole === 'platform_consultant';
  const navItems = isConsultant ? consultantNavItems : clientNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isItemActive = (item) => {
    if (!currentPath) return false;
    if (item.path === '/consultant/dashboard') {
      return (
        currentPath === '/consultant/dashboard' ||
        currentPath === '/consultant' ||
        currentPath === '/consultant/' ||
        (isConsultant && currentPath === '/dashboard')
      );
    }
    if (item.path === '/consultant/control-panel') {
      return currentPath.startsWith('/consultant/control-panel');
    }
    if (item.path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    if (item.path === '/invoices') {
      return currentPath === '/invoices' || currentPath.startsWith('/consultant/payments');
    }
    if (item.path === '/settings') {
      return currentPath === '/settings' || currentPath.startsWith('/consultant/settings');
    }
    if (item.path === '/tickets') {
      return currentPath === '/tickets';
    }
    return currentPath === item.path || currentPath.startsWith(item.path + '/');
  };

  return (
    <aside className={`portal-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Platform Logo & Brand Header */}
      <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.22)', padding: isCollapsed ? '16px 8px' : '16px 18px' }}>
        <div
          className="brand-wrapper"
          onClick={() => navigate(isConsultant ? '/consultant/dashboard' : '/dashboard')}
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
            src="/logo.png"
            alt="شعار منصة ديوان"
            style={{ height: isCollapsed ? '44px' : '52px', width: 'auto', objectFit: 'contain', transition: 'all 0.3s ease' }}
            onError={(e) => { e.target.src = '/logo_white.png'; }}
          />
          {!isCollapsed && (
            <div className="brand-text-box">
              <span className="brand-title" style={{ color: '#F5A52A', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                منصة ديوان
              </span>
              <span className="brand-subtitle" style={{ color: isConsultant ? '#FFFFFF' : '#94A3B8', fontWeight: isConsultant ? '600' : 'normal', fontSize: '11px', marginTop: '3px' }}>
                {isConsultant ? 'مستشار ضريبي معتمد' : 'للاستشارات الضريبية'}
              </span>
            </div>
          )}
        </div>
      </div>


      {/* Main Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (item.isGroup) {
            const isOpen = item.id === 'consulting_services_group' ? servicesOpen : supportOpen;
            const toggleOpen = () => {
              if (item.id === 'consulting_services_group') {
                setServicesOpen(prev => !prev);
              } else {
                setSupportOpen(prev => !prev);
              }
            };

            const exactSubMatch = item.subItems.find(sub => currentPath === sub.path);
            const activeSubPath = exactSubMatch
              ? exactSubMatch.path
              : item.subItems.find(sub => currentPath.startsWith(sub.path + '/'))?.path;

            const isGroupActive = Boolean(activeSubPath);
            const GroupIcon = item.IconComponent || DashboardIcon;

            return (
              <div key={item.id || item.label} className="sidebar-accordion-group" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`nav-item ${isGroupActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isCollapsed) {
                      navigate(item.subItems[0].path);
                    } else {
                      toggleOpen();
                    }
                  }}
                  title={item.label}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '10px 0' : '7px 10px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '10px',
                    width: isCollapsed ? '100%' : 'auto'
                  }}>
                    <span className="nav-icon">
                      <GroupIcon size={20} color={isGroupActive ? '#FFFFFF' : '#CBD5E1'} />
                    </span>
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  </div>
                  {!isCollapsed && <ChevronIcon isOpen={isOpen} />}
                </button>
                {isOpen && !isCollapsed && (
                  <div className="sidebar-sub-nav" style={{ paddingRight: '28px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', marginBottom: '4px' }}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = currentPath === subItem.path || currentPath.startsWith(subItem.path + '/');
                      return (
                        <button
                          key={subItem.path}
                          type="button"
                          className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => navigate(subItem.path)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSubActive ? '#FFFFFF' : '#8CA3BA',
                            padding: '5px 8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: isSubActive ? '700' : '500',
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => { if (!isSubActive) e.target.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { if (!isSubActive) e.target.style.color = '#8CA3BA'; }}
                        >
                          {isSubActive && (
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              display: 'inline-block',
                              flexShrink: 0
                            }} />
                          )}
                          {subItem.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // In client role, support item opens tickets or accordion
          if (userRole !== 'consultant' && item.path === '/tickets') {
            const isSupportActive = currentPath.startsWith('/support') || currentPath === '/tickets';
            return (
              <div key="support-accordion" className="support-accordion-group" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`nav-item ${isSupportActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isCollapsed) {
                      navigate('/support');
                    } else {
                      setSupportOpen(!supportOpen);
                    }
                  }}
                  title="الدعم والمساعدة"
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '10px 0' : '7px 10px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '10px',
                    width: isCollapsed ? '100%' : 'auto'
                  }}>
                    <span className="nav-icon">
                      <TicketsIcon size={20} color={isSupportActive ? '#FFFFFF' : '#CBD5E1'} />
                    </span>
                    {!isCollapsed && <span className="nav-label">الدعم والمساعدة</span>}
                  </div>
                  {!isCollapsed && <ChevronIcon isOpen={supportOpen} />}
                </button>
                {supportOpen && !isCollapsed && (
                  <div className="sidebar-sub-nav" style={{ paddingRight: '28px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', marginBottom: '4px' }}>
                    {[
                      { path: '/support', label: 'مركز الدعم والمساعدة' },
                      { path: '/support/tickets', label: 'طلبات الدعم' },
                      { path: '/support/new-ticket', label: 'تقديم طلب جديد' }
                    ].map((subItem) => {
                      const isSubActive = currentPath === subItem.path;
                      return (
                        <button
                          key={subItem.path}
                          type="button"
                          className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => navigate(subItem.path)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSubActive ? '#FFFFFF' : '#8CA3BA',
                            padding: '5px 8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: isSubActive ? '700' : '500',
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => { if (!isSubActive) e.target.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { if (!isSubActive) e.target.style.color = '#8CA3BA'; }}
                        >
                          {isSubActive && (
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              display: 'inline-block',
                              flexShrink: 0
                            }} />
                          )}
                          {subItem.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = isItemActive(item);
          const IconComponent = item.IconComponent || DashboardIcon;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '7px 10px',
                gap: isCollapsed ? '0' : '8px'
              }}
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
      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', padding: '14px 12px' }}>
        <button
          className="nav-item logout-nav-item"
          onClick={handleLogout}
          title="تسجيل الخروج"
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '10px 0' : '7px 10px',
            gap: isCollapsed ? '0' : '8px'
          }}
        >
          <span className="nav-icon">
            <LogoutArrowIcon size={20} color="#F87171" />
          </span>
          {!isCollapsed && <span className="nav-label" style={{ color: '#F87171', fontWeight: '700' }}>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}



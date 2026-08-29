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

// Custom inline SVG icons for the Consultant Sidebar
const ConsultantDashboardIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const QuickIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SessionsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClientsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ProfileIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EarningsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const SemanticSearchIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M11 8a3 3 0 0 0-3 3" />
  </svg>
);

const DocumentAnalysisIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ColleaguesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SubscriptionsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <path d="M6 14h2" />
    <path d="M10 14h4" />
  </svg>
);

const PaymentsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <path d="M6 14h2" />
    <path d="M10 14h4" />
  </svg>
);

const DocumentsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FavoritesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const TemplatesIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export default function UserSidebar({ currentPath, navigate, isCollapsed }) {
  const { logout, user } = useAuth();
  const userRole = user?.role;

  const clientNavItems = [
    { path: '/dashboard', label: 'لوحة التحكم', IconComponent: DashboardIcon },
    { path: '/quick-consultation', label: 'استشارة سريعة', IconComponent: QuickIcon },
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

  const consultantNavItems = [
    { path: '/consultant/dashboard', label: 'لوحة المستشار', IconComponent: ConsultantDashboardIcon },
    { path: '/consultant/sessions', label: 'الجلسات', IconComponent: SessionsIcon },
    { path: '/consultant/clients', label: 'العملاء', IconComponent: ClientsIcon },
    { path: '/consultant/profile', label: 'الملف الشخصي', IconComponent: ProfileIcon },
    { path: '/consultant/earnings', label: 'الأرباح', IconComponent: EarningsIcon },
    { path: '/dashboard', label: 'لوحة التحكم', IconComponent: DashboardIcon },
    { path: '/ai-assistant', label: 'المساعد الذكي', IconComponent: AiIcon },
    { path: '/consultant/semantic-search', label: 'البحث الدلالي', IconComponent: SemanticSearchIcon },
    { path: '/regulations', label: 'التشريعات والقوانين', IconComponent: RegulationsIcon },
    { path: '/consultant/document-analysis', label: 'تحليل المستندات', IconComponent: DocumentAnalysisIcon },
    { path: '/consultant/colleagues', label: 'زملاء المنصة', IconComponent: ColleaguesIcon },
    { path: '/my-appointments', label: 'استشاراتي', IconComponent: AppointmentsIcon },
    { path: '/chat', label: 'الرسائل', IconComponent: ChatIcon },
    { path: '/tickets', label: 'مساعدة الأعمال', IconComponent: TicketsIcon },
    { path: '/invoices', label: 'الفواتير', IconComponent: InvoicesIcon },
    { path: '/consultant/subscriptions', label: 'الاشتراكات', IconComponent: SubscriptionsIcon },
    { path: '/consultant/payments', label: 'المدفوعات', IconComponent: PaymentsIcon },
    { path: '/consultant/documents', label: 'وثائقي', IconComponent: DocumentsIcon },
    { path: '/consultant/favorites', label: 'المفضلة', IconComponent: FavoritesIcon },
    { path: '/consultant/templates', label: 'النماذج', IconComponent: TemplatesIcon },
    { path: '/settings', label: 'الإعدادات', IconComponent: SettingsIcon }
  ];

  const navItems = userRole === 'consultant' ? consultantNavItems : clientNavItems;

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
              <span className="brand-subtitle" style={{ color: userRole === 'consultant' ? '#F5A52A' : '#94A3B8', fontWeight: userRole === 'consultant' ? '700' : 'normal' }}>
                {userRole === 'consultant' ? 'مستشار' : 'للاستشارات الضريبية'}
              </span>
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

import React from 'react';
import {
  IconDashboard,
  IconUsers,
  IconConsultant,
  IconFinancial,
  IconPayment,
  IconSubscription,
  IconTaxForms,
  IconAiMonitoring,
  IconSessions,
  IconKnowledge,
  IconAiCoordinator,
  IconPrompts,
  IconNotifications,
  IconTickets,
  IconSecurity,
  IconRbac,
  IconAudit,
  IconSettings
} from './AdminIcons';

export default function AdminSidebar({ currentPath, navigate, userRole = 'super_admin', permissions = [] }) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', path: '/admin', icon: IconDashboard, perm: null },
    { id: 'users', label: 'المستخدمون', path: '/admin/users', icon: IconUsers, perm: 'manage_users' },
    { id: 'consultants', label: 'المستشارون', path: '/admin/consultants', icon: IconConsultant, perm: 'manage_consultants' },
    { id: 'financial', label: 'النظام المالي', path: '/admin/financial', icon: IconFinancial, perm: 'manage_payouts' },
    { id: 'payments', label: 'المدفوعات', path: '/admin/payments', icon: IconPayment, perm: 'manage_payouts' },
    { id: 'subscriptions', label: 'الاشتراكات', path: '/admin/subscriptions', icon: IconSubscription, perm: 'manage_settings' },
    { id: 'tax-forms', label: 'النماذج الضريبية', path: '/admin/tax-forms', icon: IconTaxForms, perm: null },
    { id: 'ai-monitoring', label: 'رقابة AI والبحث', path: '/admin/ai-monitoring', icon: IconAiMonitoring, perm: 'view_analytics' },
    { id: 'sessions', label: 'عمليات الاستشارات', path: '/admin/sessions', icon: IconSessions, perm: 'manage_sessions' },
    { id: 'knowledge', label: 'قاعدة المعرفة', path: '/admin/knowledge', icon: IconKnowledge, perm: null },
    { id: 'ai-coordinator', label: 'منسق المعرفة AI', path: '/admin/ai-coordinator', icon: IconAiCoordinator, perm: 'view_analytics' },
    { id: 'prompts', label: 'مكتبة البرومبت', path: '/admin/prompts', icon: IconPrompts, perm: 'view_analytics' },
    { id: 'notifications', label: 'الإشعارات', path: '/admin/notifications', icon: IconNotifications, perm: 'send_notifications' },
    { id: 'tickets', label: 'الدعم والتذاكر', path: '/admin/tickets', icon: IconTickets, perm: 'reply_tickets' },
    { id: 'security', label: 'الأمن', path: '/admin/security', icon: IconSecurity, perm: 'manage_admins' },
    { id: 'rbac', label: 'صلاحيات الأدوار', path: '/admin/rbac', icon: IconRbac, perm: 'manage_admins' },
    { id: 'audit-logs', label: 'سجل التدقيق', path: '/admin/audit-logs', icon: IconAudit, perm: 'manage_admins' },
    { id: 'settings', label: 'إعدادات المنصة', path: '/admin/settings', icon: IconSettings, perm: 'manage_settings' }
  ];

  // Super Admins see all sections. Sub-admins (admin role) see only permitted sections.
  const visibleMenuItems = menuItems.filter(item => {
    if (userRole === 'super_admin' || !item.perm) return true;
    return permissions.includes(item.perm);
  });

  const handleItemClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="admin-sidebar-brand">
        <img 
          src="/logo_white.png" 
          alt="ديوان" 
          className="admin-sidebar-logo-img"
          onError={(e) => { e.target.src = '/logo.png'; }}
        />
        <div className="admin-sidebar-brand-text">
          <h1>منصة ديوان</h1>
          <span>مدير عام</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="admin-sidebar-nav">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/admin' && currentPath === '/admin/dashboard');
          return (
            <button
              key={item.id}
              onClick={(e) => handleItemClick(e, item.path)}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">
                <Icon size={17} />
              </span>
              <span>{item.label}</span>
              {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Badge */}
      <div className="admin-sidebar-footer">
        <div className="admin-lovable-badge">
          <span>Edit with</span>
          <span style={{ color: '#E58A13', fontWeight: 800 }}>Lovable</span>
        </div>
      </div>
    </aside>
  );
}

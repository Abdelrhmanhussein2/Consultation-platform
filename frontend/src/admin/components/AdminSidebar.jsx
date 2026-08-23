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

export default function AdminSidebar({ currentPath, navigate }) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', path: '/admin', icon: IconDashboard },
    { id: 'users', label: 'المستخدمون', path: '/admin/users', icon: IconUsers },
    { id: 'consultants', label: 'المستشارون', path: '/admin/consultants', icon: IconConsultant },
    { id: 'financial', label: 'النظام المالي', path: '/admin/financial', icon: IconFinancial },
    { id: 'payments', label: 'المدفوعات', path: '/admin/payments', icon: IconPayment },
    { id: 'subscriptions', label: 'الاشتراكات', path: '/admin/subscriptions', icon: IconSubscription },
    { id: 'tax-forms', label: 'النماذج الضريبية', path: '/admin/tax-forms', icon: IconTaxForms },
    { id: 'ai-monitoring', label: 'رقابة AI والبحث', path: '/admin/ai-monitoring', icon: IconAiMonitoring },
    { id: 'sessions', label: 'عمليات الاستشارات', path: '/admin/sessions', icon: IconSessions },
    { id: 'knowledge', label: 'قاعدة المعرفة', path: '/admin/knowledge', icon: IconKnowledge },
    { id: 'ai-coordinator', label: 'منسق المعرفة AI', path: '/admin/ai-coordinator', icon: IconAiCoordinator },
    { id: 'prompts', label: 'مكتبة البرومبت', path: '/admin/prompts', icon: IconPrompts },
    { id: 'notifications', label: 'الإشعارات', path: '/admin/notifications', icon: IconNotifications },
    { id: 'tickets', label: 'الدعم والتذاكر', path: '/admin/tickets', icon: IconTickets },
    { id: 'security', label: 'الأمن', path: '/admin/security', icon: IconSecurity },
    { id: 'rbac', label: 'صلاحيات الأدوار', path: '/admin/rbac', icon: IconRbac },
    { id: 'audit-logs', label: 'سجل التدقيق', path: '/admin/audit-logs', icon: IconAudit },
    { id: 'settings', label: 'إعدادات المنصة', path: '/admin/settings', icon: IconSettings }
  ];

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
        {menuItems.map((item) => {
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

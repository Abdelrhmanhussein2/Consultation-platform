import React, { useState, useEffect } from 'react';
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
  IconSettings,
  IconReports
} from './AdminIcons';

export default function AdminSidebar({ currentPath, navigate, userRole = 'super_admin', permissions = [] }) {
  // ══════════════════════════════════════════════════════════════════════════
  // STREAMLINED & REORGANIZED MENU HIERARCHY
  // ══════════════════════════════════════════════════════════════════════════
  const menuItems = [
    // 1. Dashboard
    { id: 'dashboard', label: 'لوحة التحكم', path: '/admin', icon: IconDashboard },

    // 2. Reports & Analytics
    { id: 'reports', label: 'التقارير والتحليلات', path: '/admin/reports', icon: IconReports },

    // 3. Accounts (Users & Consultants) - The 3rd Item with Expandable Submenu & Auto Default
    { 
      id: 'accounts', 
      label: 'المستخدمون والمستشارون', 
      icon: IconUsers,
      defaultPath: '/admin/users',
      subItems: [
        { id: 'users', label: 'المستخدمون والشركات', path: '/admin/users' },
        { id: 'consultants', label: 'المستشارون المعتمدون', path: '/admin/consultants' }
      ]
    },

    // 4. Financial & Subscriptions - Grouped
    { 
      id: 'finance_group', 
      label: 'المالية والاشتراكات', 
      icon: IconFinancial,
      defaultPath: '/admin/financial',
      subItems: [
        { id: 'financial', label: 'النظام المالي والمحافظ', path: '/admin/financial' },
        { id: 'payments', label: 'المدفوعات والفواتير', path: '/admin/payments' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات', path: '/admin/subscriptions' }
      ]
    },

    // 5. Sessions & Consultations
    { id: 'sessions', label: 'الحجوزات والجلسات', path: '/admin/sessions', icon: IconSessions },

    // 6. AI & Knowledge - Grouped
    { 
      id: 'ai_knowledge', 
      label: 'الذكاء الاصطناعي والمعرفة', 
      icon: IconKnowledge,
      defaultPath: '/admin/knowledge',
      subItems: [
        { id: 'knowledge', label: 'قاعدة المعرفة والتشريعات', path: '/admin/knowledge' },
        { id: 'ai_monitoring', label: 'رقابة ومحادثات AI', path: '/admin/ai-monitoring' },
        { id: 'prompts', label: 'مكتبة البرومبت والفهرس', path: '/admin/prompts' }
      ]
    },

    // 7. Tax Forms
    { id: 'tax-forms', label: 'النماذج الضريبية', path: '/admin/tax-forms', icon: IconTaxForms },

    // 8. Support & Tickets
    { id: 'tickets', label: 'الدعم والتذاكر', path: '/admin/tickets', icon: IconTickets },

    // 9. Notifications
    { id: 'notifications', label: 'الإشعارات', path: '/admin/notifications', icon: IconNotifications },

    // 10. Security & Governance - Grouped
    { 
      id: 'governance', 
      label: 'الأمان والصلاحيات', 
      icon: IconSecurity,
      defaultPath: '/admin/rbac',
      subItems: [
        { id: 'rbac', label: 'الأدوار والصلاحيات (RBAC)', path: '/admin/rbac' },
        { id: 'security', label: 'مركز الأمان وحماية البيانات', path: '/admin/security' },
        { id: 'audit', label: 'سجل التدقيق والعمليات', path: '/admin/audit-logs' }
      ]
    },

    // 11. Platform Settings
    { id: 'settings', label: 'إعدادات المنصة', path: '/admin/settings', icon: IconSettings }
  ];

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    menuItems.forEach(item => {
      if (item.subItems) {
        // Auto-expand if currentPath matches any subItem
        const isChildActive = item.subItems.some(sub => sub.path === currentPath);
        if (isChildActive) initial[item.id] = true;
      }
    });
    return initial;
  });

  // Auto-expand group when currentPath changes
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => sub.path === currentPath);
        if (isChildActive) {
          setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [currentPath]);

  // Click on single item
  const handleItemClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  // Click on parent group (e.g. Item 3 "المستخدمون والمستشارون"):
  // Expands group AND navigates to the default first sub-item immediately!
  const handleGroupClick = (e, item) => {
    e.preventDefault();
    const isCurrentlyExpanded = !!expandedGroups[item.id];
    
    // Toggle expand state
    setExpandedGroups(prev => ({ ...prev, [item.id]: !isCurrentlyExpanded }));

    // Automatically navigate to default sub-item
    if (item.defaultPath) {
      navigate(item.defaultPath);
    }
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

          // Check if this item has subItems (e.g. Item 3, 4, 6, 10)
          if (item.subItems) {
            const isGroupOpen = !!expandedGroups[item.id];
            const isAnySubActive = item.subItems.some(sub => sub.path === currentPath);

            return (
              <div key={item.id} className="admin-nav-group">
                <button
                  type="button"
                  onClick={(e) => handleGroupClick(e, item)}
                  className={`admin-nav-item ${isAnySubActive ? 'active' : ''}`}
                >
                  <span className="admin-nav-icon">
                    <Icon size={17} />
                  </span>
                  <span className="admin-nav-item-parent">
                    <span>{item.label}</span>
                    <span className="admin-nav-arrow">{isGroupOpen ? '▾' : '◂'}</span>
                  </span>
                </button>

                {/* Submenu list */}
                {isGroupOpen && (
                  <div className="admin-nav-submenu">
                    {item.subItems.map(sub => {
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={(e) => handleItemClick(e, sub.path)}
                          className={`admin-subnav-item ${isSubActive ? 'active' : ''}`}
                        >
                          <span>•</span>
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular single item
          const isActive = currentPath === item.path || (item.path === '/admin' && currentPath === '/admin/dashboard');
          return (
            <button
              key={item.id}
              type="button"
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
    </aside>
  );
}

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
        { id: 'users', label: 'المستخدمون والعملاء', path: '/admin/users' },
        { id: 'consultants', label: 'المستشارون المعتمدون', path: '/admin/consultants' }
      ]
    },

    // 4. Financial & Subscriptions - Grouped
    { 
      id: 'finance_group', 
      label: 'المالية والاشتراكات', 
      icon: IconFinancial,
      defaultPath: '/admin/payments',
      subItems: [
        { id: 'payments', label: 'طلبات الدفع والتحويلات', path: '/admin/payments' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات', path: '/admin/subscriptions' },
        { id: 'financial', label: 'النظام المالي والمحافظ', path: '/admin/financial' }
      ]
    },

    // 5. Calendar & Appointments
    { id: 'calendar', label: 'إدارة المواعيد والتقويم', path: '/admin/calendar', icon: IconSessions },

    // 6. Sessions & Consultations
    { id: 'sessions', label: 'سجل الحجوزات والجلسات', path: '/admin/sessions', icon: IconSessions },

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

    // 8. Support & Tickets - Grouped (Default -> /admin/tickets)
    { 
      id: 'support_group', 
      label: 'الدعم والتذاكر', 
      icon: IconTickets,
      defaultPath: '/admin/tickets',
      subItems: [
        { id: 'tickets', label: 'تذاكر الدعم الفني', path: '/admin/tickets' },
        { id: 'chats', label: 'إدارة المحادثات', path: '/admin/chats' }
      ]
    },

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

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('هل تريد تسجيل الخروج من لوحة التحكم؟')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('admin');
      if (navigate) {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }
  };

  return (
    <aside className="portal-sidebar admin-sidebar">
      {/* Platform White Logo Header */}
      <div className="sidebar-header">
        <div
          className="brand-wrapper"
          onClick={() => navigate('/admin')}
          style={{
            cursor: 'pointer',
            gap: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%'
          }}
        >
          <img 
            src="/logo_white.png" 
            alt="شعار منصة ديوان" 
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
          <div className="brand-text-box">
            <span className="brand-title">منصة ديوان</span>
            <span className="brand-subtitle" style={{ color: '#F5A52A', fontWeight: '700' }}>
              للاستشارات الضريبية
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Expandable Submenu Group
          if (item.subItems) {
            const isGroupOpen = !!expandedGroups[item.id];
            const isAnySubActive = item.subItems.some(sub => sub.path === currentPath);

            return (
              <div key={item.id} className="support-accordion-group" style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={(e) => handleGroupClick(e, item)}
                  className={`nav-item ${isAnySubActive ? 'active' : ''}`}
                  title={item.label}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span className="nav-icon">
                      <Icon size={20} color={isAnySubActive ? '#FFFFFF' : '#CBD5E1'} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    transition: 'transform 0.2s ease',
                    transform: isGroupOpen ? 'rotate(90deg)' : 'none'
                  }}>
                    ◀
                  </span>
                </button>

                {/* Submenu list */}
                {isGroupOpen && (
                  <div className="sidebar-sub-nav" style={{ paddingRight: '36px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {item.subItems.map(sub => {
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={(e) => handleItemClick(e, sub.path)}
                          className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSubActive ? '#F5A52A' : '#94A3B8',
                            padding: '8px 12px',
                            textAlign: 'right',
                            fontSize: '13px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: isSubActive ? '700' : 'normal',
                            transition: 'all 0.2s',
                            display: 'block',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => { if (!isSubActive) e.target.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { if (!isSubActive) e.target.style.color = '#94A3B8'; }}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular Single Nav Item
          const isActive = currentPath === item.path || (item.path === '/admin' && currentPath === '/admin/dashboard');
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => handleItemClick(e, item.path)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">
                <Icon size={20} color={isActive ? '#FFFFFF' : '#CBD5E1'} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-item logout-nav-item"
          onClick={handleLogout}
          title="تسجيل الخروج"
        >
          <span className="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="nav-label" style={{ color: '#F87171' }}>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import {
  IconDashboard, IconUsers, IconConsultant, IconFinancial, IconPayment,
  IconSubscription, IconTaxForms, IconAiMonitoring, IconSessions, IconKnowledge,
  IconAiCoordinator, IconPrompts, IconNotifications, IconTickets, IconSecurity,
  IconRbac, IconAudit, IconSettings, IconReports, IconSparkles, IconDatabase, IconLightbulb
} from './AdminIcons';

export const ChevronIcon = ({ isOpen }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      marginLeft: 'auto', marginRight: '0', flexShrink: 0, color: '#94A3B8'
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ADMIN_MENU_ITEMS = [
  { id: 'dashboard', label: 'لوحة التحكم', path: '/admin', icon: IconDashboard },
  {
    id: 'control_center_group', label: 'مركز التحكم الإداري', icon: IconSparkles, defaultPath: '/admin/control-center',
    subItems: [
      { id: 'control_center_ops', label: 'لوحة التحكم والعمليات', path: '/admin/control-center' },
      { id: 'unified_registry', label: 'السجل الإداري الموحد', path: '/admin/unified-registry' }
    ]
  },
  { id: 'reports', label: 'التقارير والتحليلات', path: '/admin/reports', icon: IconReports },
  {
    id: 'accounts', label: 'المستخدمون والمستشارون', icon: IconUsers, defaultPath: '/admin/users',
    subItems: [
      { id: 'users', label: 'إدارة المستخدمين', path: '/admin/users' },
      { id: 'consultants', label: 'إدارة المستشارين', path: '/admin/consultants' },
      { id: 'consultant_applications', label: 'طلبات انضمام المستشارين', path: '/admin/consultant-applications' }
    ]
  },
  {
    id: 'user_accounts_group', label: 'إدارة الحسابات', icon: IconSecurity, defaultPath: '/admin/user-accounts',
    subItems: [
      { id: 'uacc_list', label: 'إدارة حسابات المستخدمين', path: '/admin/user-accounts' },
      { id: 'uacc_history', label: 'سجل دخول المستخدمين', path: '/admin/user-accounts/history' },
      { id: 'uacc_roles', label: 'أدوار وصلاحيات الحسابات', path: '/admin/user-accounts/roles' }
    ]
  },
  {
    id: 'rbac_group', label: 'الأدوار والصلاحيات', icon: IconRbac, defaultPath: '/admin/rbac',
    subItems: [
      { id: 'rbac_roles', label: 'الأدوار والصلاحيات', path: '/admin/rbac' },
      { id: 'rbac_users', label: 'المستخدمون وإسناد الأدوار', path: '/admin/rbac/users' }
    ]
  },
  { id: 'calendar', label: 'إدارة المواعيد والتقويم', path: '/admin/calendar', icon: IconSessions },
  { id: 'sessions', label: 'سجل الحجوزات', path: '/admin/sessions', icon: IconSessions },
  {
    id: 'finance_group', label: 'المالية والاشتراكات', icon: IconFinancial, defaultPath: '/admin/payments',
    subItems: [
      { id: 'payments', label: 'طلبات الدفع والتحويلات', path: '/admin/payments' },
      { id: 'subscriptions', label: 'الباقات والاشتراكات', path: '/admin/subscriptions' },
      { id: 'invoices', label: 'الفواتير', path: '/admin/invoices' },
      { id: 'financial', label: 'النظام المالي والمحافظ', path: '/admin/financial' }
    ]
  },
  {
    id: 'database_group', label: 'قاعدة البيانات', icon: IconDatabase, defaultPath: '/admin/knowledge',
    subItems: [
      { id: 'legislation', label: 'التشريعات والقوانين', path: '/admin/knowledge' },
      { id: 'legal_alerts', label: 'التنبيهات التشريعية' },
      { id: 'tax_forms_sub', label: 'النماذج الضريبية', path: '/admin/tax-forms' },
      { id: 'tax_disclosure_sub', label: 'مكتبة الكشف الضريبي', path: '/admin/tax-disclosure' }
    ]
  },
  {
    id: 'ai_management_group', label: 'إدارة الذكاء الاصطناعي', icon: IconLightbulb, defaultPath: '/admin/ai-monitoring',
    subItems: [
      { id: 'ai_search_monitor', label: 'رقابة AI والبحث', path: '/admin/ai-monitoring' },
      { id: 'prompts_library', label: 'مكتبة البرومبت', path: '/admin/prompts' }
    ]
  },
  { id: 'tickets', label: 'الدعم والتذاكر', path: '/admin/tickets', icon: IconTickets },
  { id: 'notifications', label: 'الإشعارات', path: '/admin/notifications', icon: IconNotifications },
  {
    id: 'security_group', label: 'الأمان وسجل التدقيق', icon: IconSecurity, defaultPath: '/admin/security',
    subItems: [
      { id: 'security', label: 'مركز الأمان وحماية البيانات', path: '/admin/security' },
      { id: 'audit', label: 'سجل التدقيق والعمليات', path: '/admin/audit-logs' }
    ]
  },
  { id: 'settings', label: 'إعدادات المنصة', path: '/admin/settings', icon: IconSettings }
];

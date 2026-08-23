import React from 'react';
import {
  IconUsers,
  IconConsultant,
  IconFinancial,
  IconPayment,
  IconSubscription,
  IconTaxForms,
  IconAiMonitoring,
  IconSessions,
  IconKnowledge,
  IconPrompts,
  IconAiCoordinator,
  IconNotifications,
  IconTickets,
  IconSecurity,
  IconRbac,
  IconAudit,
  IconArrowLeft,
  IconSettings
} from './AdminIcons';

export default function QuickHubCards({ navigate }) {
  const hubCards = [
    {
      id: 'users',
      title: 'المستخدمون والصلاحيات',
      desc: 'أدوار، ملفات، حالة الحساب',
      icon: IconUsers,
      path: '/admin/users'
    },
    {
      id: 'consultants',
      title: 'اعتماد المستشارين',
      desc: 'طلبات، وثائق، إيقاف/تفعيل',
      icon: IconConsultant,
      path: '/admin/consultants'
    },
    {
      id: 'financial',
      title: 'النظام المالي',
      desc: 'إيرادات، عمولات، طلبات سحب',
      icon: IconFinancial,
      path: '/admin/financial'
    },
    {
      id: 'payments',
      title: 'المدفوعات',
      desc: 'مدفوع، قيد مراجعة، فشل',
      icon: IconPayment,
      path: '/admin/payments'
    },
    {
      id: 'subscriptions',
      title: 'الاشتراكات',
      desc: 'خطط، حدود، عدد المشتركين',
      icon: IconSubscription,
      path: '/admin/subscriptions'
    },
    {
      id: 'tax-forms',
      title: 'النماذج الضريبية',
      desc: 'إضافة، رفع، نشر النماذج',
      icon: IconTaxForms,
      path: '/admin/tax-forms'
    },
    {
      id: 'ai-monitoring',
      title: 'رقابة AI والبحث',
      desc: 'استعلامات، RAG، Tokens',
      icon: IconAiMonitoring,
      path: '/admin/ai-monitoring'
    },
    {
      id: 'sessions',
      title: 'عمليات الاستشارات',
      desc: 'جلسات نشطة وحجوزات وتصعيد',
      icon: IconSessions,
      path: '/admin/sessions'
    },
    {
      id: 'knowledge',
      title: 'قاعدة المعرفة',
      desc: 'مصادر وتشريعات وفهارس',
      icon: IconKnowledge,
      path: '/admin/knowledge'
    },
    {
      id: 'prompts',
      title: 'مكتبة البرومبت',
      desc: 'قوالب إجابة وسياسات',
      icon: IconPrompts,
      path: '/admin/prompts'
    },
    {
      id: 'ai-coordinator',
      title: 'منسق المعرفة AI',
      desc: 'مراجعة واقتراحات ربط',
      icon: IconAiCoordinator,
      path: '/admin/ai-coordinator'
    },
    {
      id: 'notifications',
      title: 'الإشعارات والإذاعات',
      desc: 'تنبيهات ورسائل شرائح',
      icon: IconNotifications,
      path: '/admin/notifications'
    },
    {
      id: 'tickets',
      title: 'الدعم والتذاكر',
      desc: 'تذاكر مفتوحة وسرعة رد',
      icon: IconTickets,
      path: '/admin/tickets'
    },
    {
      id: 'security',
      title: 'الأمن والتدقيق',
      desc: 'مخاطر، حماية، سجلات حساسة',
      icon: IconSecurity,
      path: '/admin/security'
    },
    {
      id: 'rbac',
      title: 'صلاحيات الأدوار',
      desc: 'RBAC وصلاحيات المسؤولين',
      icon: IconRbac,
      path: '/admin/rbac'
    },
    {
      id: 'audit-logs',
      title: 'سجل التدقيق',
      desc: 'عمليات حساسة ومراجعات',
      icon: IconAudit,
      path: '/admin/audit-logs'
    }
  ];

  return (
    <div className="admin-control-hub-section">
      <div className="admin-hub-header">
        <div>
          <h3 className="admin-card-title">مسارات التحكم الرئيسية</h3>
          <p className="admin-card-subtitle">كل بطاقة تفتح صفحة تشغيل فعلية داخل الإدارة.</p>
        </div>
        <button 
          className="admin-btn-action-primary"
          onClick={() => navigate && navigate('/admin/settings')}
        >
          <IconSettings size={15} />
          <span>الإعدادات</span>
        </button>
      </div>

      <div className="admin-hub-grid">
        {hubCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="admin-hub-card"
              onClick={() => navigate && navigate(card.path)}
            >
              <div className="admin-hub-card-top">
                <div className="admin-hub-icon-wrap">
                  <Icon size={18} />
                </div>
                <IconArrowLeft size={16} className="admin-hub-arrow" />
              </div>

              <h4 className="admin-hub-card-title">{card.title}</h4>
              <p className="admin-hub-card-desc">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import {
  IconFinancial,
  IconUsers,
  IconConsultant,
  IconAiCoordinator,
  IconCalendar,
  IconPayment,
  IconAudit,
  IconTickets
} from './AdminIcons';

export default function AdminKpiCards({ navigate, stats = {} }) {
  const kpis = [
    {
      id: 'revenue',
      title: 'إيرادات الفترة',
      value: stats.total_revenue_jod != null ? Number(stats.total_revenue_jod).toFixed(2) : '165.88',
      currency: 'د.أ',
      icon: IconFinancial,
      footer: '%0 مقارنة بالفترة السابقة 0 د.أ',
      path: '/admin/financial'
    },
    {
      id: 'users',
      title: 'المستخدمون',
      value: stats.total_users != null ? stats.total_users : '7',
      icon: IconUsers,
      footer: `${stats.total_companies || 1} شركة مرتبطة بالملفات`,
      path: '/admin/users'
    },
    {
      id: 'consultants',
      title: 'المستشارون',
      value: stats.total_consultants != null ? stats.total_consultants : '3',
      icon: IconConsultant,
      footer: `${stats.pending_credentials_count || 2} طلب بانتظار قرار`,
      path: '/admin/consultants'
    },
    {
      id: 'ai-queries',
      title: 'استفسارات AI',
      value: stats.ai_queries_count != null ? stats.ai_queries_count : '351',
      icon: IconAiCoordinator,
      footer: 'رسائل مؤرشفة قابلة للمراجعة',
      path: '/admin/ai-monitoring'
    },
    {
      id: 'sessions',
      title: 'جلسات مفتوحة',
      value: stats.open_sessions_count != null ? stats.open_sessions_count : '5',
      icon: IconCalendar,
      footer: '0 جلسة مكتملة',
      path: '/admin/sessions'
    },
    {
      id: 'payouts',
      title: 'مدفوعات للمراجعة',
      value: stats.pending_payouts_count != null ? stats.pending_payouts_count : '3',
      icon: IconPayment,
      footer: 'عمليات تحتاج قرار مالي',
      path: '/admin/financial'
    },
    {
      id: 'renewal',
      title: 'معدل التجديد',
      value: '100%',
      icon: IconAudit,
      footer: 'من الاشتراكات النشطة',
      path: '/admin/subscriptions'
    },
    {
      id: 'tickets',
      title: 'تذاكر مفتوحة',
      value: stats.open_tickets_count != null ? stats.open_tickets_count : '0',
      icon: IconTickets,
      footer: '0 عالية الأولوية',
      path: '/admin/tickets'
    }
  ];

  return (
    <div className="admin-kpis-grid">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div 
            key={kpi.id} 
            className="admin-kpi-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate && navigate(kpi.path)}
          >
            <div className="admin-kpi-header">
              <span className="admin-kpi-title">{kpi.title}</span>
              <Icon size={16} className="admin-kpi-icon" />
            </div>

            <div className="admin-kpi-value-row">
              <span className="admin-kpi-value">{kpi.value}</span>
              {kpi.currency && <span className="admin-kpi-currency">{kpi.currency}</span>}
            </div>

            <div className="admin-kpi-footer">
              {kpi.footer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

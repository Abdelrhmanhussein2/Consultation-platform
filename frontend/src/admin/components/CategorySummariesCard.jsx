import React from 'react';

export default function CategorySummariesCard({ navigate, stats = {} }) {
  const categories = [
    {
      title: 'العمليات',
      badge: `${(stats.total_users || 7) + (stats.total_consultants || 3)} ملف`,
      links: [
        { label: 'المستخدمون', path: '/admin/users' },
        { label: 'المستشارون', path: '/admin/consultants' },
        { label: 'الاستشارات', path: '/admin/sessions' },
        { label: 'الدعم', path: '/admin/tickets' }
      ]
    },
    {
      title: 'المال',
      badge: `${stats.total_revenue_jod != null ? Number(stats.total_revenue_jod).toFixed(2) : '165.88'} د.أ`,
      links: [
        { label: 'الإيرادات', path: '/admin/financial' },
        { label: 'المدفوعات', path: '/admin/payments' },
        { label: 'الاشتراكات', path: '/admin/subscriptions' },
        { label: 'السحب', path: '/admin/financial' }
      ]
    },
    {
      title: 'المعرفة وAI',
      badge: `${stats.ai_queries_count || 351} رسالة`,
      links: [
        { label: 'مواد', path: '/admin/knowledge' },
        { label: 'نماذج', path: '/admin/tax-forms' },
        { label: 'برومبت', path: '/admin/prompts' },
        { label: 'رقابة', path: '/admin/ai-monitoring' }
      ]
    },
    {
      title: 'الحوكمة',
      badge: '12 سجل',
      links: [
        { label: 'التدقيق', path: '/admin/audit-logs' },
        { label: 'الأمن', path: '/admin/security' },
        { label: 'الأدوار', path: '/admin/rbac' },
        { label: 'الإشعارات', path: '/admin/notifications' }
      ]
    }
  ];

  return (
    <div className="admin-categories-summary-grid">
      {categories.map((cat, idx) => (
        <div key={idx} className="admin-category-card">
          <div className="admin-category-header">
            <span className="admin-category-title">{cat.title}</span>
            <span className="admin-category-badge">{cat.badge}</span>
          </div>

          <div className="admin-category-links">
            {cat.links.map((lnk, lIdx) => (
              <button
                key={lIdx}
                className="admin-category-chip"
                onClick={() => navigate && navigate(lnk.path)}
              >
                {lnk.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

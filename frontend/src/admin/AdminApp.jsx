import React from 'react';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminConsultantsPage from './pages/AdminConsultantsPage';
import AdminFinancialPage from './pages/AdminFinancialPage';
import AdminSessionsPage from './pages/AdminSessionsPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminRbacPage from './pages/AdminRbacPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminAiMonitoringPage from './pages/AdminAiMonitoringPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminTaxFormsPage from './pages/AdminTaxFormsPage';
import AdminKnowledgePage from './pages/AdminKnowledgePage';
import AdminPromptsPage from './pages/AdminPromptsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import AdminSecurityPage from './pages/AdminSecurityPage';
import AdminGenericPage from './pages/AdminGenericPage';

export default function AdminApp({ currentPath = '/admin', navigate }) {
  // Normalize path by stripping trailing slashes (e.g. /admin/ -> /admin)
  const normalizedPath = (currentPath && currentPath.length > 1) 
    ? currentPath.replace(/\/+$/, '') 
    : (currentPath || '/admin');

  const renderAdminContent = () => {
    switch (normalizedPath) {
      case '/admin/reports':
      case '/admin/analytics':
        return <AdminReportsPage navigate={navigate} />;
      case '/admin/users':
        return <AdminUsersPage navigate={navigate} />;
      case '/admin/consultants':
        return <AdminConsultantsPage navigate={navigate} />;
      case '/admin/financial':
        return <AdminFinancialPage navigate={navigate} />;
      case '/admin/sessions':
        return <AdminSessionsPage navigate={navigate} />;
      case '/admin/tickets':
        return <AdminTicketsPage navigate={navigate} />;
      case '/admin/settings':
        return <AdminSettingsPage navigate={navigate} />;
      case '/admin/rbac':
        return <AdminRbacPage navigate={navigate} />;
      case '/admin/audit-logs':
        return <AdminAuditLogsPage navigate={navigate} />;
      case '/admin/security':
        return <AdminSecurityPage navigate={navigate} />;
      case '/admin/notifications':
        return <AdminNotificationsPage navigate={navigate} />;
      case '/admin/ai-monitoring':
        return <AdminAiMonitoringPage navigate={navigate} />;
      case '/admin/subscriptions':
        return <AdminSubscriptionsPage navigate={navigate} />;
      case '/admin/payments':
        return <AdminPaymentsPage navigate={navigate} />;
      case '/admin/tax-forms':
        return <AdminTaxFormsPage navigate={navigate} />;
      case '/admin/knowledge':
        return <AdminKnowledgePage navigate={navigate} />;
      case '/admin/prompts':
        return <AdminPromptsPage navigate={navigate} />;

      case '/admin/ai-coordinator':
        return (
          <AdminGenericPage
            title="منسق المعرفة والذكاء الاصطناعي"
            tag="AI KNOWLEDGE COORDINATOR"
            desc="إدارة وتنسيق العلاقات المعرفية بين التشريعات والأسئلة الضريبية الشائعة."
            columns={['المصطلح / المفهوم الضريبي', 'التشريعات المرتبطة', 'حجم الروابط المعرفية', 'الحالة']}
            items={[
              ['المصاريف المقبولة ضريبياً', 'المادة (9) و (10) من قانون ضريبة الدخل', '24 رابط معرفي', <span className="admin-badge-info">نشط</span>],
              ['التهرب الضريبي والغرامات', 'المادة (30) والمادة (32)', '18 رابط معرفي', <span className="admin-badge-info">نشط</span>],
              ['الرديات الضريبية والتقادم', 'المادة (37) من القانون', '12 رابط معرفي', <span className="admin-badge-info">نشط</span>]
            ]}
            actionButtonText="تحديث الفهرس المعرفي"
          />
        );


      default:
        return <AdminDashboardPage navigate={navigate} />;
    }
  };

  return (
    <AdminLayout currentPath={currentPath} navigate={navigate}>
      {renderAdminContent()}
    </AdminLayout>
  );
}

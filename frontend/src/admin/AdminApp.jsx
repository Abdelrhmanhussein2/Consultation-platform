import React from 'react';
import { useAuth } from '../context/AuthContext';
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
import DiwanAppointmentsPage from '../pages/DiwanAppointmentsPage';

export default function AdminApp({ currentPath = '/admin', navigate }) {
  const { user, isAuthenticated, loading } = useAuth();

  // ══════════════════════════════════════════════════════════════════════════
  // ZERO-TRUST ROLE ENFORCEMENT (STRICT ADMIN / SUPER_ADMIN ONLY)
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ fontWeight: '800', color: '#0e3b5e', fontSize: '15px' }}>جاري التحقق من الصلاحيات الإدارية...</div>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin');

  if (!isAdmin) {
    return (
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', padding: '24px', textAlign: 'center', direction: 'rtl' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '40px 32px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', background: '#FEF2F2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
            ⛔
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 8px 0' }}>403 - وصول محظور (Forbidden)</h2>
          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            عذراً، هذه المنطقة مخصصة لمشرفي وإداريي المنصة المعتمدين فقط. حسابك الحالي لا يمتلك صلاحية الأدمن، أو يتطلب تسجيل الدخول بحساب مدير.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '12px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,59,94,0.2)', transition: 'all 0.2s' }}
          >
            تسجيل الدخول كمدير ⬅
          </button>
        </div>
      </div>
    );
  }

  // Normalize path by stripping query params and trailing slashes (e.g. /admin/calendar?foo=bar -> /admin/calendar)
  const pathname = currentPath ? currentPath.split('?')[0] : '/admin';
  const normalizedPath = (pathname && pathname.length > 1) 
    ? pathname.replace(/\/+$/, '') 
    : (pathname || '/admin');

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
      case '/admin/calendar':
        return <DiwanAppointmentsPage initialRole="admin" navigate={navigate} />;
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

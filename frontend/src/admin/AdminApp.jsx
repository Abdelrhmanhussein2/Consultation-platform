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
import AdminGenericPage from './pages/AdminGenericPage';

export default function AdminApp({ currentPath = '/admin', navigate }) {
  // Normalize path by stripping trailing slashes (e.g. /admin/ -> /admin)
  const normalizedPath = (currentPath && currentPath.length > 1) 
    ? currentPath.replace(/\/+$/, '') 
    : (currentPath || '/admin');

  const renderAdminContent = () => {
    switch (normalizedPath) {
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

      case '/admin/security':
        return (
          <AdminGenericPage
            title="مركز الأمن وحماية البيانات"
            tag="SECURITY, ENCRYPTION & COMPLIANCE"
            desc="مراقبة التشفير الميداني (AES-256)، ورموز OTP، وجلسات تسجيل الدخول النشطة."
            columns={['الوحدة الأمنية', 'نوع الحماية', 'الحالة التشغيلية', 'آخر فحص']}
            items={[
              ['تشفير الرسائل والمحادثات في DB', 'AES-256 Fernet Field-level', <span className="admin-badge-success">نشط 100%</span>, 'الآن'],
              ['حجب وتشفير الحسابات البنكية والـ IBAN', 'AES-256 + UI Masking', <span className="admin-badge-success">نشط 100%</span>, 'الآن'],
              ['منظومة OTP وتأكيد البريد وكلمة المرور', '6-Digit Redis TTL Vault', <span className="admin-badge-success">نشط 100%</span>, 'الآن'],
              ['إبطال التوكنات والقائمة السوداء', 'JWT Invalidation Blacklist', <span className="admin-badge-success">نشط 100%</span>, 'الآن']
            ]}
          />
        );

      case '/admin/audit-logs':
        return (
          <AdminGenericPage
            title="سجل التدقيق والعمليات الحساسة"
            tag="SYSTEM AUDIT TRAIL & ACTIVITY LOGS"
            desc="تتبع دقيق لكافة العمليات الإدارية وتعديلات الصلاحيات وحركات الأموال."
            columns={['المستخدم / المشرف', 'نوع العملية', 'الكيان المتأثر', 'التفاصيل', 'الوقت']}
            items={[
              ['خالد (Super Admin)', 'admin.permission.grant', 'المشرف: عبدالرحمن حسين', 'منح صلاحية إدارة السحوبات والماليات', '14:40:14'],
              ['خالد (Super Admin)', 'payout.request.status_update', 'سحب أرباح #pay_103', 'تأكيد التحويل البنكي للمستشار عبر البنك العربي', '14:32:19'],
              ['نظام الأمان', 'auth.login.success', 'المشرف: admin@diwan.jo', 'تسجيل دخول ناجح مع توثيق JWT', '14:30:00']
            ]}
            actionButtonText="تصدير السجل الكامل"
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

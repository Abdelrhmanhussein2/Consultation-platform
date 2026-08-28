import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header/Header';
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
import Footer from './components/Footer/Footer';
import PolicyCenter from './components/PolicyCenter/PolicyCenter';
import PolicyModal from './components/PolicyModal/PolicyModal';

// User Portal Pages & Layout
import UserLayout from './components/UserPortal/UserLayout';
import UserDashboard from './pages/UserDashboard';
import ConsultantsPage from './pages/ConsultantsPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import ChatPage from './pages/ChatPage';
import RegulationsPage from './pages/RegulationsPage';
import AiAssistantPage from './pages/AiAssistantPage';
import InvoicesPage from './pages/InvoicesPage';
import PolicyCenterPage from './pages/PolicyCenterPage';
import UserSettingsPage from './pages/UserSettingsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import AdminApp from './admin/AdminApp';
import PlaceholderPage from './pages/PlaceholderPage';
import ConsultantDashboard from './pages/ConsultantDashboard';
import ConsultantSessionsPage from './pages/ConsultantSessionsPage';
import ConsultantClientsPage from './pages/ConsultantClientsPage';
import ConsultantProfilePage from './pages/ConsultantProfilePage';
import ConsultantEarningsPage from './pages/ConsultantEarningsPage';
import DocumentAnalysisPage from './pages/DocumentAnalysisPage';
import BusinessHelpPage from './pages/BusinessHelpPage';
import ConsultantSubscriptionsPage from './pages/ConsultantSubscriptionsPage';
import ConsultantPaymentsPage from './pages/ConsultantPaymentsPage';
import ConsultantDocumentsPage from './pages/ConsultantDocumentsPage';
import ConsultantTemplatesPage from './pages/ConsultantTemplatesPage';
import ConsultantFavoritesPage from './pages/ConsultantFavoritesPage';
import ConsultantDetailPage from './pages/ConsultantDetailPage';

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policyType, setPolicyType] = useState('privacy_policy');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route any /admin path directly to AdminApp Command Center
  if (currentPath.startsWith('/admin')) {
    return <AdminApp currentPath={currentPath} navigate={navigate} />;
  }

  const openPolicy = (type) => {
    setPolicyType(type);
    setIsModalOpen(true);
  };


  // List of paths belonging to the authenticated User Portal
  const userPortalPaths = [
    '/dashboard',
    '/consultants',
    '/my-appointments',
    '/chat',
    '/regulations',
    '/ai-assistant',
    '/invoices',
    '/tickets',
    '/settings',
    '/policies-portal',
    '/consultant/dashboard',
    '/consultant/sessions',
    '/consultant/clients',
    '/consultant/profile',
    '/consultant/earnings',
    '/consultant/semantic-search',
    '/consultant/document-analysis',
    '/consultant/colleagues',
    '/consultant/subscriptions',
    '/consultant/payments',
    '/consultant/documents',
    '/consultant/favorites',
    '/consultant/templates'
  ];

  const isUserPortal = userPortalPaths.some(p => currentPath.startsWith(p));

  // Render User Portal content inside UserLayout
  const renderUserPortalContent = () => {
    if (currentPath === '/consultants') {
      return <ConsultantsPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/consultants/')) {
      const parts = currentPath.split('/');
      const id = parts[parts.length - 1];
      return <ConsultantDetailPage profileId={id} navigate={navigate} />;
    }
    if (currentPath === '/my-appointments') {
      return <MyAppointmentsPage navigate={navigate} />;
    }
    if (currentPath === '/chat') {
      return <ChatPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/regulations')) {
      return <RegulationsPage />;
    }
    if (currentPath === '/ai-assistant') {
      return <AiAssistantPage />;
    }
    if (currentPath === '/invoices') {
      return <InvoicesPage />;
    }
    if (currentPath === '/tickets') {
      return <BusinessHelpPage navigate={navigate} />;
    }
    if (currentPath === '/policies-portal') {
      return <PolicyCenterPage openPolicy={openPolicy} />;
    }
    if (currentPath === '/settings') {
      return <UserSettingsPage />;
    }

    // Consultant Portal Screens
    if (currentPath === '/consultant/dashboard') {
      return <ConsultantDashboard navigate={navigate} />;
    }
    if (currentPath === '/consultant/sessions') {
      return <ConsultantSessionsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/clients') {
      return <ConsultantClientsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/profile') {
      return <ConsultantProfilePage navigate={navigate} />;
    }
    if (currentPath === '/consultant/earnings') {
      return <ConsultantEarningsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/semantic-search') {
      return <PlaceholderPage title="البحث الدلالي للمستشار" />;
    }
    if (currentPath === '/consultant/document-analysis') {
      return <DocumentAnalysisPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/colleagues') {
      return <ConsultantsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/subscriptions') {
      return <ConsultantSubscriptionsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/payments') {
      return <ConsultantPaymentsPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/documents') {
      return <ConsultantDocumentsPage />;
    }
    if (currentPath === '/consultant/favorites') {
      return <ConsultantFavoritesPage navigate={navigate} />;
    }
    if (currentPath === '/consultant/templates') {
      return <ConsultantTemplatesPage />;
    }

    // Default Portal page
    return <UserDashboard navigate={navigate} />;
  };

  // 1. Loading state fallback while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F4F7F9', color: '#005D9C', fontWeight: '700', fontSize: '15px' }}>
        جاري التحقق من الجلسة...
      </div>
    );
  }

  // 2. If user is on a portal route but not authenticated, fallback to login
  if (isUserPortal && !isAuthenticated) {
    return (
      <div className="app-container fade-in">
        <Header currentPath="/login" navigate={navigate} />
        <main className="main-content">
          <LoginForm openPolicy={openPolicy} navigate={navigate} />
        </main>
        <Footer openPolicy={openPolicy} navigate={navigate} />
        <PolicyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          policyType={policyType}
        />
      </div>
    );
  }

  // 3. If user is authenticated and navigating portal routes
  if (isUserPortal && isAuthenticated) {
    return (
      <UserLayout currentPath={currentPath} navigate={navigate}>
        {renderUserPortalContent()}
        <PolicyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          policyType={policyType}
        />
      </UserLayout>
    );
  }

  // 4. Otherwise render public site (Login, Register, Public Policies)
  const renderPublicContent = () => {
    if (currentPath === '/policies') {
      return <PolicyCenter openPolicy={openPolicy} />;
    }
    if (currentPath === '/register') {
      return <RegisterForm openPolicy={openPolicy} navigate={navigate} />;
    }
    return <LoginForm openPolicy={openPolicy} navigate={navigate} />;
  };

  return (
    <div className="app-container fade-in">
      <Header currentPath={currentPath} navigate={navigate} />
      <main className="main-content">
        {renderPublicContent()}
      </main>
      <Footer openPolicy={openPolicy} navigate={navigate} />

      <PolicyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        policyType={policyType}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

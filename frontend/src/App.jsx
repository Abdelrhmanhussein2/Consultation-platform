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
    '/policies-portal'
  ];

  const isUserPortal = userPortalPaths.some(p => currentPath.startsWith(p));

  // Render User Portal content inside UserLayout
  const renderUserPortalContent = () => {
    if (currentPath === '/consultants') {
      return <ConsultantsPage navigate={navigate} />;
    }
    if (currentPath === '/my-appointments') {
      return <MyAppointmentsPage navigate={navigate} />;
    }
    if (currentPath === '/chat') {
      return <ChatPage />;
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
      return <SupportTicketsPage />;
    }
    if (currentPath === '/policies-portal') {
      return <PolicyCenterPage openPolicy={openPolicy} />;
    }
    if (currentPath === '/settings') {
      return <UserSettingsPage />;
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

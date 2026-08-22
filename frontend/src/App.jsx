import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import LoginForm from './components/LoginForm/LoginForm';
import Footer from './components/Footer/Footer';
import PolicyCenter from './components/PolicyCenter/PolicyCenter';
import PolicyModal from './components/PolicyModal/PolicyModal';

function App() {
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
    // Scroll to top on page navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPolicy = (type) => {
    setPolicyType(type);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (currentPath === '/policies') {
      return <PolicyCenter openPolicy={openPolicy} />;
    }
    return <LoginForm openPolicy={openPolicy} />;
  };

  return (
    <div className="app-container fade-in">
      <Header currentPath={currentPath} navigate={navigate} />
      <main className="main-content">
        {renderContent()}
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

export default App;

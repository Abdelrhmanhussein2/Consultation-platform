import React from 'react';
import './Header.css';

export default function Header({ currentPath, navigate }) {
  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  const isHomeActive = currentPath === '/' || currentPath === '/login';
  const isPoliciesActive = currentPath === '/policies';

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="header-brand">
          <a href="/" onClick={(e) => handleNavClick(e, '/')} className="brand-link">
            منصة ديوان للاستشارات الضريبية الذكية
          </a>
        </div>
        <nav className="header-nav">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className={`nav-item ${isHomeActive ? 'active' : ''}`}
          >
            الرئيسية
          </a>
          <a
            href="/policies"
            onClick={(e) => handleNavClick(e, '/policies')}
            className={`nav-item ${isPoliciesActive ? 'active' : ''}`}
          >
            مركز السياسات
          </a>
        </nav>
      </div>
    </header>
  );
}

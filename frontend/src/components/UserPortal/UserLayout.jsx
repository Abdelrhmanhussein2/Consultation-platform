import React, { useState } from 'react';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import './UserPortal.css';

export default function UserLayout({ currentPath, navigate, children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="portal-container fade-in">
      {/* Sidebar Navigation */}
      <UserSidebar
        currentPath={currentPath}
        navigate={navigate}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area with Header */}
      <div className={`portal-wrapper ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <UserHeader
          navigate={navigate}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        <main className="portal-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

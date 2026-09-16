import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '../../context/AuthContext';
import '../admin.css';

export default function AdminLayout({ currentPath, navigate, children }) {
  const { user } = useAuth() || {};
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="admin-shell-container">
      {/* Dark Navy Sidebar (RTL Right side) */}
      <AdminSidebar 
        currentPath={currentPath} 
        navigate={navigate} 
        userRole={user?.role || 'super_admin'}
        permissions={user?.permissions || []}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Area */}
      <div className={`admin-main-wrap ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sticky Header Topbar */}
        <AdminHeader 
          navigate={navigate} 
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="admin-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

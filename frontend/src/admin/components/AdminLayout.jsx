import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '../../context/AuthContext';
import '../admin.css';

export default function AdminLayout({ currentPath, navigate, children }) {
  const { user } = useAuth() || {};

  return (
    <div className="admin-shell-container">
      {/* Dark Navy Sidebar (RTL Right side) */}
      <AdminSidebar 
        currentPath={currentPath} 
        navigate={navigate} 
        userRole={user?.role || 'super_admin'}
        permissions={user?.permissions || []}
      />

      {/* Main Area */}
      <div className="admin-main-wrap">
        {/* Sticky Header Topbar */}
        <AdminHeader navigate={navigate} />

        {/* Page Content */}
        <main className="admin-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

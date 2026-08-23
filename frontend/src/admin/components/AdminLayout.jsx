import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../admin.css';

export default function AdminLayout({ currentPath, navigate, children }) {
  return (
    <div className="admin-shell-container">
      {/* Dark Navy Sidebar (RTL Right side) */}
      <AdminSidebar currentPath={currentPath} navigate={navigate} />

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

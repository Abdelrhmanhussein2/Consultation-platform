import React from 'react';
import { SettingsIcon, InvoicesIcon, LogoutIcon } from './Icons';

export default function UserProfileDropdown({ navigate, onLogout, onClose }) {
  return (
    <div className="user-dropdown">
      <div className="dropdown-item" onClick={() => { onClose(); navigate('/settings'); }}>
        <SettingsIcon size={16} color="#64748B" />
        <span>الملف الشخصي والبيانات</span>
      </div>
      <div className="dropdown-item" onClick={() => { onClose(); navigate('/invoices'); }}>
        <InvoicesIcon size={16} color="#64748B" />
        <span>فواتيري والمدفوعات</span>
      </div>
      <div className="dropdown-item" onClick={() => { onClose(); navigate('/settings'); }}>
        <SettingsIcon size={16} color="#64748B" />
        <span>إعدادات الحساب</span>
      </div>
      <div
        className="dropdown-item danger"
        onClick={() => {
          onClose();
          onLogout();
        }}
      >
        <LogoutIcon size={16} color="#EF4444" />
        <span>تسجيل الخروج</span>
      </div>
    </div>
  );
}

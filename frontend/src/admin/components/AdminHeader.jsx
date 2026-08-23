import React, { useState } from 'react';
import {
  IconSearch,
  IconSparkles,
  IconBookmark,
  IconCalendar,
  IconMessage,
  IconNotifications,
  IconArrowLeft
} from './AdminIcons';

export default function AdminHeader({ navigate, onOpenAiModal }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="admin-topbar">
      {/* 
        In RTL layout:
        flex-direction is row (Right side is start, Left side is end).
        Right side: Profile Avatar, Badges, Icons, Search Bar.
        Left side: 'اسأل ديوان AI' Button & Exit/Back Arrow.
      */}
      <div className="admin-topbar-right-group">
        {/* Profile Avatar & Name */}
        <button 
          className="admin-profile-dropdown-btn"
          onClick={() => navigate('/admin/settings')}
        >
          <div className="admin-avatar-circle">
            م
          </div>
          <div className="admin-profile-info">
            <div className="admin-profile-name">مدير المنصة</div>
            <div className="admin-profile-sub">حسابك الشخصي</div>
          </div>
        </button>

        {/* Window icon */}
        <button className="admin-icon-btn-minimal" title="توسيع العرض">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {/* Role Pill Badge */}
        <div className="admin-role-badge-pill">
          مدير المنصة
        </div>

        {/* Notification Bell with Badge 3 */}
        <button className="admin-icon-btn-minimal" title="الإشعارات" onClick={() => navigate('/admin/notifications')}>
          <IconNotifications size={16} />
          <span className="admin-bell-badge">3</span>
        </button>

        {/* Messages */}
        <button className="admin-icon-btn-minimal" title="المحادثات">
          <IconMessage size={16} />
        </button>

        {/* Calendar */}
        <button className="admin-icon-btn-minimal" title="المواعيد والتقويم" onClick={() => navigate('/admin/sessions')}>
          <IconCalendar size={16} />
        </button>

        {/* Heart / Bookmark */}
        <button className="admin-icon-btn-minimal" title="المفضلة">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Search Bar with ⌘K badge */}
        <div className="admin-search-wrapper">
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="ابحث في التشريعات أو اسأل المساعد الذكي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="admin-search-kbd">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Left side: AI Button & Exit/Arrow button */}
      <div className="admin-topbar-left-group">
        <button 
          className="admin-btn-ask-ai"
          onClick={() => onOpenAiModal ? onOpenAiModal() : navigate('/admin/ai-monitoring')}
        >
          <IconSparkles size={15} />
          <span>اسأل ديوان AI</span>
        </button>

        <button 
          className="admin-icon-btn-minimal"
          title="العودة للرئيسية"
          onClick={() => navigate('/')}
        >
          <IconArrowLeft size={16} />
        </button>
      </div>
    </header>
  );
}

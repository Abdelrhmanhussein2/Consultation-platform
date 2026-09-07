import React from 'react';
import { row1Cards, row2Cards } from './dashboardData';

export default function DashboardListCards({ navigate, onShowToast, liveLists = {} }) {
  const handleViewAll = (card) => {
    if (card.path && navigate) {
      navigate(card.path);
    } else if (onShowToast) {
      onShowToast(`تم فتح قائمة: ${card.t}`);
    }
  };

  const handleRowClick = (card, row) => {
    const itemTitle = row[0];
    if (card.path && navigate) {
      navigate(card.path);
    } else if (onShowToast) {
      onShowToast(`تم فتح تفاصيل: ${itemTitle}`);
    }
  };

  const getRowsForCard = (c) => {
    if (c.kind === 'laws') return liveLists?.recent_policies || [];
    if (c.kind === 'ratings') return liveLists?.recent_ratings || [];
    if (c.kind === 'tickets') return liveLists?.recent_tickets || [];
    if (c.kind === 'consults') return liveLists?.recent_consultants || [];
    if (c.kind === 'users') return liveLists?.recent_users || [];
    if (c.kind === 'audit') return liveLists?.recent_logs || [];
    if (c.kind === 'appointments') return liveLists?.recent_appointments || [];
    if (c.kind === 'payouts') return liveLists?.recent_payouts || [];
    if (c.kind === 'subscriptions') return liveLists?.recent_subscriptions || [];
    if (c.kind === 'templates') return liveLists?.recent_templates || [];
    return c.rows || [];
  };

  const renderCard = (c, isBottom = false) => {
    const rows = getRowsForCard(c);

    return (
      <div key={c.t} className={`db-card db-list-card ${isBottom ? 'db-bottom-card' : ''}`}>
        <div className="db-list-head">
          <div className="title">{c.t}</div>
          <button 
            className="db-view-all" 
            type="button"
            onClick={() => handleViewAll(c)}
          >
            عرض الكل
          </button>
        </div>

        <div className="db-rows">
          {rows.length === 0 ? (
            <div className="db-empty-state-card">
              <span className="db-empty-dot">●</span>
              <span className="db-empty-msg">لا توجد سجلات مسجلة حالياً</span>
            </div>
          ) : (
            rows.map((r, idx) => {
              // 1. Laws / Policies / Templates
              if (c.kind === 'laws' || c.kind === 'templates') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon" style={{ background: '#eef6ff', color: '#1d68d1' }}>
                      <svg viewBox="0 0 24 24">
                        <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                    </div>
                    {r[1] && <span className="db-badge green">{r[1]}</span>}
                    <span className="db-row-time">{r[2]}</span>
                  </div>
                );
              }

              // 2. Ratings
              if (c.kind === 'ratings') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <div className="db-face">★</div>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      <div className="db-stars">{r[1]}</div>
                    </div>
                    <span className="db-row-time">{r[2]}</span>
                  </div>
                );
              }

              // 3. Support Tickets
              if (c.kind === 'tickets') {
                const badgeClass = r[2] === 'عالية' ? 'red' : (r[2] === 'متوسطة' ? 'orange' : 'green');
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <div className="db-row-main">
                      <div className="db-ticket-id">{r[0]}</div>
                      <div className="db-row-sub">{r[1]}</div>
                    </div>
                    <span className={`db-badge ${badgeClass}`}>{r[2]}</span>
                    <span className="db-row-time">{r[3]}</span>
                  </div>
                );
              }

              // 4. Consultants or Users
              if (c.kind === 'consults' || c.kind === 'users') {
                const isConsult = c.kind === 'consults';
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span 
                      className="db-row-icon" 
                      style={{ 
                        background: isConsult ? '#f5f3ff' : '#eff6ff', 
                        color: isConsult ? '#7c3aed' : '#2563eb' 
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M5 20c0-3.8 3.2-6 7-6s7 2.2 7 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                    </div>
                    <span className="db-row-time">{r[1]}</span>
                  </div>
                );
              }

              // 5. Audit logs / Appointments / Payouts / Subscriptions
              return (
                <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                  <span className="db-row-icon" style={{ borderRadius: '7px', background: '#f0fdf4', color: '#059669' }}>
                    <svg viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  </span>
                  <div className="db-row-main">
                    <div className="db-row-title">{r[0]}</div>
                    {r[1] && <div className="db-row-sub">{r[1]}</div>}
                  </div>
                  <span className="db-row-time">{r[2]}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Row 1 (5 Cards) */}
      <div className="db-list-grid">
        {row1Cards.map(c => renderCard(c, false))}
      </div>

      {/* Row 2 (5 Cards) */}
      <div className="db-list-grid">
        {row2Cards.map(c => renderCard(c, true))}
      </div>
    </>
  );
}

import React from 'react';
import { row1Cards, row2Cards } from './dashboardData';
import './DashboardListCards.css';

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
    if (c.kind === 'system_audit') return liveLists?.system_audit_logs || [];
    if (c.kind === 'security_logs') return liveLists?.security_logs || [];
    if (c.kind === 'ops_audit') return liveLists?.ops_audit_logs || [];
    if (c.kind === 'ai_alerts') return liveLists?.ai_alerts || [];
    if (c.kind === 'system_alerts') return liveLists?.system_alerts || [];
    return c.rows || [];
  };

  const renderCard = (c, isBottom = false) => {
    const allRows = getRowsForCard(c);
    const rows = allRows.slice(0, 4);

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
              // 1. Laws / Policies
              if (c.kind === 'laws') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="4" y="5" width="16" height="15" rx="2" />
                        <path d="M8 3v4M16 3v4M4 9h16" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                    </div>
                    {r[1] && <span className="db-badge diwan">{r[1]}</span>}
                    <span className="db-row-time">{r[2]}</span>
                  </div>
                );
              }

              // 2. Ratings
              if (c.kind === 'ratings') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
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
                const badgeClass = r[2] === 'عالية' ? 'red' : 'diwan';
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4zM9 9v6M12 9v6M15 9v6" />
                      </svg>
                    </span>
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
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="3.2" />
                        <path d="M5 20c0-3.8 3.2-6 7-6s7 2.2 7 6" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                    </div>
                    <span className="db-row-time">{r[1]}</span>
                  </div>
                );
              }

              // 5. System Audit Logs
              if (c.kind === 'system_audit') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      {r[1] && <div className="db-row-sub">{r[1]}</div>}
                    </div>
                    <span className="db-row-time">{r[2]}</span>
                  </div>
                );
              }

              // 6. Security Logs
              if (c.kind === 'security_logs') {
                const isGreen = r[2] === 'green';
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      {r[1] && <div className="db-row-sub">{r[1]}</div>}
                    </div>
                    <span className={`db-dot ${isGreen ? 'green' : 'slate'}`} />
                    <span className="db-row-time">{r[3]}</span>
                  </div>
                );
              }

              // 7. Operations Audit Logs
              if (c.kind === 'ops_audit') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      {r[1] && <div className="db-row-sub">{r[1]}</div>}
                    </div>
                    <span className="db-row-time">{r[2]}</span>
                  </div>
                );
              }

              // 8. AI Alerts
              if (c.kind === 'ai_alerts') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      {r[1] && <div className="db-row-sub">{r[1]}</div>}
                    </div>
                    <span className="db-row-time">{r[3]}</span>
                  </div>
                );
              }

              // 9. System Alerts / Warnings
              return (
                <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                  <span className="db-row-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </span>
                  <div className="db-row-main">
                    <div className="db-row-title">{r[0]}</div>
                    {r[1] && <div className="db-row-sub">{r[1]}</div>}
                  </div>
                  <span className="db-row-time">{r[3]}</span>
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

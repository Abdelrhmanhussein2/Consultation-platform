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
              // 1. Laws / Policies
              if (c.kind === 'laws') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon" style={{ background: '#eef6ff', color: '#1d68d1' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0 }}>
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
                      <svg width="15" height="15" viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0 }}>
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

              // 5. System Audit Logs
              if (c.kind === 'system_audit') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon" style={{ borderRadius: '7px', background: '#f0fdf4', color: '#059669' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0 }}>
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
              }

              // 6. Security Logs
              if (c.kind === 'security_logs') {
                const dotClass = r[2] || 'orange';
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <div className="db-row-main">
                      <div className="db-row-title">{r[0]}</div>
                      {r[1] && <div className="db-row-sub">{r[1]}</div>}
                    </div>
                    <span className={`db-dot ${dotClass}`} />
                    <span className="db-row-time">{r[3]}</span>
                  </div>
                );
              }

              // 7. Operations Audit Logs
              if (c.kind === 'ops_audit') {
                return (
                  <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                    <span className="db-row-icon" style={{ borderRadius: '7px', background: '#eef2ff', color: '#4f46e5' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0 }}>
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
                    <span className="db-alert-ico blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: 14, height: 14, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M12 8v4M12 16h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                  <span className="db-alert-ico orange">
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{ width: 14, height: 14, flexShrink: 0 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="9" x2="12" y2="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

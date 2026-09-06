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
    if (card.kind === 'tickets' && navigate) {
      navigate('/admin/tickets');
    } else if (card.kind === 'consults' && navigate) {
      navigate('/admin/consultants');
    } else if (card.kind === 'users' && navigate) {
      navigate('/admin/users');
    } else if (card.kind === 'laws' && navigate) {
      navigate('/admin/knowledge');
    } else if (card.kind === 'audit' && navigate) {
      navigate('/admin/audit-logs');
    } else if (card.kind === 'security' && navigate) {
      navigate('/admin/security');
    } else if (card.kind === 'aiwarn' && navigate) {
      navigate('/admin/ai-monitoring');
    } else if (onShowToast) {
      onShowToast(`تم فتح تفاصيل: ${itemTitle}`);
    }
  };

  const getRowsForCard = (c) => {
    if (c.kind === 'laws' && liveLists?.recent_policies?.length) {
      return liveLists.recent_policies;
    }
    if (c.kind === 'ratings' && liveLists?.recent_ratings?.length) {
      return liveLists.recent_ratings;
    }
    if (c.kind === 'tickets' && liveLists?.recent_tickets?.length) {
      return liveLists.recent_tickets;
    }
    if (c.kind === 'consults' && liveLists?.recent_consultants?.length) {
      return liveLists.recent_consultants;
    }
    if (c.kind === 'users' && liveLists?.recent_users?.length) {
      return liveLists.recent_users;
    }
    if (c.kind === 'audit' && liveLists?.recent_logs?.length) {
      return liveLists.recent_logs;
    }
    return c.rows;
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
          {rows.map((r, idx) => {
            // Kind: laws
            if (c.kind === 'laws') {
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
                  <span className="db-badge green">{r[1]}</span>
                  <span className="db-row-time">{r[2]}</span>
                </div>
              );
            }

            // Kind: ratings
            if (c.kind === 'ratings') {
              return (
                <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                  <div className="db-face">●</div>
                  <div className="db-row-main">
                    <div className="db-row-title">{r[0]}</div>
                    <div className="db-stars">{r[1]}</div>
                  </div>
                  <span className="db-row-time">{r[2]}</span>
                </div>
              );
            }

            // Kind: tickets
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

            // Kind: consults or users
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

            // Kind: audit or activity
            if (c.kind === 'audit' || c.kind === 'activity') {
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
            }

            // Kind: security
            if (c.kind === 'security') {
              return (
                <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                  <span className={`db-dot ${r[3] || 'red'}`} />
                  <div className="db-row-main">
                    <div className="db-row-title">{r[0]}</div>
                    <div className="db-row-sub">{r[1]}</div>
                  </div>
                  <span className="db-row-time">{r[2]}</span>
                </div>
              );
            }

            // Kind: aiwarn or alerts
            const iconColor = r[3] || 'orange';
            return (
              <div key={idx} className="db-row" onClick={() => handleRowClick(c, r)}>
                <span className={`db-alert-ico ${iconColor}`}>
                  {iconColor === 'blue' ? (
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 10v6M12 7h.01" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3 2.5 20h19zM12 9v5M12 17h.01" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </span>
                <div className="db-row-main">
                  <div className="db-row-title">{r[0]}</div>
                  <div className="db-row-sub">{r[1]}</div>
                </div>
                <span className="db-row-time">{r[2]}</span>
              </div>
            );
          })}
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

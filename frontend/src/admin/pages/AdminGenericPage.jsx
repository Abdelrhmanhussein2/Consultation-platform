import React from 'react';

export default function AdminGenericPage({ title, tag, desc, items, columns, actionButtonText }) {
  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">{tag}</div>
          <h1 className="admin-banner-title">{title}</h1>
          <p className="admin-banner-desc">{desc}</p>
        </div>
        {actionButtonText && (
          <button className="admin-btn-action-primary" onClick={() => alert(`تم فتح نافذة: ${actionButtonText}`)}>
            <span>+ {actionButtonText}</span>
          </button>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react';

export default function ServiceHealthCard() {
  const services = [
    { name: 'قاعدة البيانات (PostgreSQL)', status: 'operational' },
    { name: 'الدخول والصلاحيات (Auth & RBAC)', status: 'operational' },
    { name: 'المساعد الذكي (AI & Vector RAG)', status: 'operational' },
    { name: 'بوابة الحجوزات (Appointments Engine)', status: 'operational' }
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">حالة الخدمات</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
        {services.map((srv, idx) => (
          <div key={idx} className="admin-health-row" style={{ padding: '11px 0' }}>
            <span className="admin-health-label" style={{ fontSize: '13px' }}>{srv.name}</span>
            <span className="admin-badge-operational">{srv.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

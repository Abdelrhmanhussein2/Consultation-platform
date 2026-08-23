import React from 'react';
import { IconAudit } from './AdminIcons';

export default function SystemLogStream() {
  const logItems = [
    {
      tag: 'admin_permissions',
      action: 'admin.permission.grant',
      time: '14:40:14'
    },
    {
      tag: 'admin_permissions',
      action: 'admin.permission.revoke',
      time: '14:40:13'
    },
    {
      tag: 'auth_jwt',
      action: 'auth.admin.session_started',
      time: '14:38:05'
    },
    {
      tag: 'payout_engine',
      action: 'payout.request.status_update',
      time: '14:32:19'
    }
  ];

  return (
    <div className="admin-system-log-box">
      <div className="admin-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAudit size={18} style={{ color: '#E58A13' }} />
          <h3 className="admin-card-title">سجل النظام</h3>
        </div>
      </div>

      <div>
        {logItems.map((item, idx) => (
          <div key={idx} className="admin-log-item">
            <span className="admin-log-tag">{item.tag}</span>
            <span className="admin-log-action">{item.action}</span>
            <span className="admin-log-time">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

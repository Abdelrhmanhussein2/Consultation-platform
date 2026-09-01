import React from 'react';
import { IconAlert } from './AdminIcons';

export default function ApprovalQueueCard({ navigate, stats = {} }) {
  const pendingRequests = stats.pending_approvals && stats.pending_approvals.length > 0
    ? stats.pending_approvals
    : [
        {
          id: '8376b4cf',
          title: 'طلب مستشار #8376b4cf',
          sub: 'ملف مستشار جديد (تخصص ضريبي ومالي)',
          path: '/admin/consultants'
        },
        {
          id: 'd08c00bf',
          title: 'طلب مستشار #d08c00bf',
          sub: 'تعديل تخصص وشهادة خبرة معتمدة',
          path: '/admin/consultants'
        }
      ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAlert size={16} style={{ color: '#E58A13' }} />
          <h3 className="admin-card-title">طابور الاعتماد</h3>
        </div>
        <button 
          className="admin-btn-action-outline" 
          style={{ padding: '4px 12px', fontSize: '12px' }}
          onClick={() => navigate && navigate('/admin/consultants')}
        >
          فتح
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {pendingRequests.map((req) => (
          <div 
            key={req.id} 
            className="admin-queue-item"
            style={{ cursor: 'pointer', padding: '12px 14px' }}
            onClick={() => navigate && navigate(req.path)}
          >
            <div className="admin-queue-title" style={{ fontSize: '13px' }}>{req.title}</div>
            <div className="admin-queue-sub" style={{ fontSize: '11.5px', marginTop: '2px' }}>{req.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

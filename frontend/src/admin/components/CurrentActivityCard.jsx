import React from 'react';

export default function CurrentActivityCard({ navigate }) {
  const activities = [
    {
      num: '7',
      label: 'الحسابات',
      sub: '1 شركة • 6 فرد',
      path: '/admin/users'
    },
    {
      num: '5',
      label: 'جلسات نشطة',
      sub: '0 جلسة مكتملة',
      path: '/admin/sessions'
    },
    {
      num: '0',
      label: 'تذاكر للمراجعة',
      sub: '0 عالية الأولوية',
      path: '/admin/tickets'
    },
    {
      num: '2',
      label: 'موافقات مستشارين',
      sub: 'طلبات تحتاج اعتماد أو رفض',
      path: '/admin/consultants'
    }
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">النشاط الحالي</h3>
      </div>

      <div className="admin-activity-list">
        {activities.map((item, idx) => (
          <div 
            key={idx} 
            className="admin-activity-item"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate && navigate(item.path)}
          >
            <div className="admin-activity-text">
              <div className="admin-activity-label">{item.label}</div>
              <div className="admin-activity-sub">{item.sub}</div>
            </div>
            <span className="admin-activity-num">{item.num}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

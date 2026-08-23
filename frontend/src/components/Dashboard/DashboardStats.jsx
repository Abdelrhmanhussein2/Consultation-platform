import React from 'react';
import { AppointmentsIcon, InvoicesIcon, BellIcon, ConsultantsIcon } from '../UserPortal/Icons';

export default function DashboardStats({ appointments = [], invoices = [], unreadNotifs = 0 }) {
  const upcomingCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending_payment').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'issued').length;

  const stats = [
    { label: 'المواعيد القادمة', value: upcomingCount, IconComponent: AppointmentsIcon, color: '#005D9C', bg: '#E5EFF5' },
    { label: 'الاستشارات المكتملة', value: completedCount, IconComponent: ConsultantsIcon, color: '#10B981', bg: '#D1FAE5' },
    { label: 'فواتير بانتظار الدفع', value: pendingInvoices, IconComponent: InvoicesIcon, color: '#F5A52A', bg: '#FEF3C7' },
    { label: 'إشعارات جديدة', value: unreadNotifs, IconComponent: BellIcon, color: '#6366F1', bg: '#E0E7FF' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
      {stats.map((item, index) => {
        const { IconComponent } = item;
        return (
          <div
            key={index}
            style={{
              background: '#FFFFFF',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>{item.label}</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{item.value}</span>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 'auto'
              }}
            >
              <IconComponent size={22} color={item.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

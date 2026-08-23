import React from 'react';

export default function RecentAppointmentsTable({ appointments = [], onJoinVideo, onPay, navigate }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>مؤكد</span>;
      case 'pending_payment':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>بانتظار الدفع</span>;
      case 'completed':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>مكتملة</span>;
      case 'cancelled':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>ملغاة</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{status}</span>;
    }
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>جدول الحجوزات والاستشارات الأخيرة</h3>
        <button
          onClick={() => navigate('/my-appointments')}
          style={{ background: 'none', border: 'none', color: '#005D9C', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
        >
          عرض جميع الاستشارات ←
        </button>
      </div>

      {appointments.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '12px 16px' }}>المستشار / الخدمة</th>
                <th style={{ padding: '12px 16px' }}>الموعد والتاريخ</th>
                <th style={{ padding: '12px 16px' }}>المدة</th>
                <th style={{ padding: '12px 16px' }}>المبلغ</th>
                <th style={{ padding: '12px 16px' }}>الحالة</th>
                <th style={{ padding: '12px 16px' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 5).map((appt) => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1E293B' }}>
                    {appt.consultant_name || 'استشارة ضريبية'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {new Date(appt.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{appt.duration_minutes || 60} دقيقة</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#005D9C' }}>{appt.amount || 50} د.أ</td>
                  <td style={{ padding: '14px 16px' }}>{getStatusBadge(appt.status)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {appt.status === 'confirmed' && (
                      <button
                        onClick={() => onJoinVideo(appt.id)}
                        style={{ background: '#005D9C', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        🎥 الميتينج
                      </button>
                    )}
                    {appt.status === 'pending_payment' && (
                      <button
                        onClick={() => onPay(appt.id)}
                        style={{ background: '#10B981', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        💳 دفع
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
          لا توجد حجوزات سابقة حتى الآن.
        </div>
      )}
    </div>
  );
}

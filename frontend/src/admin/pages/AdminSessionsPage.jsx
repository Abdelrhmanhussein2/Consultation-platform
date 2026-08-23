import React, { useState } from 'react';
import { IconSessions, IconSearch } from '../components/AdminIcons';

export default function AdminSessionsPage({ navigate }) {
  const [sessions, setSessions] = useState([
    {
      id: 'sess_1',
      clientName: 'أحمد العبداللات (شركة أفق)',
      consultantName: 'أ. سارة المجالي',
      serviceName: 'استشارة ضريبة الشركات والمبيعات',
      scheduledTime: '2026-08-23 18:00',
      durationMinutes: 45,
      status: 'confirmed',
      roomUrl: 'https://diwantax.daily.co/sess-83921-ar'
    },
    {
      id: 'sess_2',
      clientName: 'محمود الروسان',
      consultantName: 'أ. عمر القضاة',
      serviceName: 'تسوية النزاع الجمركي',
      scheduledTime: '2026-08-23 20:00',
      durationMinutes: 30,
      status: 'confirmed',
      roomUrl: 'https://diwantax.daily.co/sess-83922-ar'
    },
    {
      id: 'sess_3',
      clientName: 'خالد النعيمي',
      consultantName: 'أ. ليلى حداد',
      serviceName: 'التخطيط الضريبي السنوي',
      scheduledTime: '2026-08-22 16:00',
      durationMinutes: 60,
      status: 'completed',
      roomUrl: 'https://diwantax.daily.co/sess-83919-ar'
    }
  ]);

  const joinAsObserver = (session) => {
    alert(`جاري تجهيز توكن المراقب (Daily.co Observer) والدخول لجلسة: ${session.serviceName}`);
    window.open(session.roomUrl, '_blank');
  };

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">LIVE SESSIONS & CONSULTATIONS</div>
          <h1 className="admin-banner-title">عمليات الاستشارات والجلسات المباشرة</h1>
          <p className="admin-banner-desc">
            متابعة جلسات الاستشارات الحية والمجدولة بين العملاء والمستشارين وإمكانية دخول المشرف كمراقب.
          </p>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <h3 className="admin-card-title">جدول الجلسات المباشرة والمكتملة</h3>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>العميل</th>
              <th>المستشار</th>
              <th>الخدمة / التخصص</th>
              <th>الموعد والمدة</th>
              <th>الحالة</th>
              <th>غرفة الجلسة</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td><strong>{s.clientName}</strong></td>
                <td>{s.consultantName}</td>
                <td><span className="admin-badge-info">{s.serviceName}</span></td>
                <td>{s.scheduledTime} ({s.durationMinutes} دقيقة)</td>
                <td>
                  <span className={s.status === 'confirmed' ? 'admin-badge-success' : 'admin-badge-warning'}>
                    {s.status === 'confirmed' ? 'مؤكدة وقادمة' : 'مكتملة'}
                  </span>
                </td>
                <td>
                  <button 
                    className="admin-btn-action-primary"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => joinAsObserver(s)}
                  >
                    🎥 دخول كمراقب
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

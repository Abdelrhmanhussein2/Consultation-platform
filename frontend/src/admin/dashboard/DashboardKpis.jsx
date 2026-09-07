import React from 'react';

const iconsMap = {
  income: {
    cls: 'ico-income',
    svg: (
      <svg viewBox="0 0 24 24">
        <path d="M6 8h12l2 12H4zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/payments',
    tag: 'إجمالي المقبوضات المسددة'
  },
  ticket: {
    cls: 'ico-ticket',
    svg: (
      <svg viewBox="0 0 24 24">
        <path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4zM9 9v6M12 9v6M15 9v6" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/tickets',
    tag: 'تذاكر قيد المعالجة'
  },
  cplus: {
    cls: 'ico-cplus',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.65" />
        <path d="M2.5 20c0-3.1 2.4-5 5.5-5s5.5 1.9 5.5 5M18 7v6M15 10h6" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/consultants',
    tag: 'طلبات قيد التدقيق'
  },
  uplus: {
    cls: 'ico-uplus',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.65" />
        <path d="M2.5 20c0-3.1 2.4-5 5.5-5s5.5 1.9 5.5 5M18 7v6M15 10h6" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/users',
    tag: 'عملاء مسجلين بالمنصة'
  },
  consult: {
    cls: 'ico-consult',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.65" />
        <path d="M5 20c0-4 3-6 7-6s7 2 7 6" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/consultants',
    tag: 'مستشارين معتمدين'
  },
  users: {
    cls: 'ico-users',
    svg: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.65" />
        <path d="M3 20c0-3.2 2.5-5 6-5s6 1.8 6 5M16 5.5a3 3 0 0 1 0 5.7M16 15c2.6.2 5 1.7 5 5" fill="none" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    ),
    target: '/admin/users',
    tag: 'حسابات نشطة في النظام'
  }
};

export default function DashboardKpis({ kpis = [], navigate, onShowToast }) {
  return (
    <div className="db-kpis">
      {kpis.map((k, index) => {
        const key = k[5] || 'users';
        const meta = iconsMap[key] || iconsMap.users;
        const [label, value, unit] = k;

        const handleClick = () => {
          if (meta.target && navigate) {
            navigate(meta.target);
          } else if (onShowToast) {
            onShowToast(`تم فتح تفاصيل: ${label}`);
          }
        };

        return (
          <div key={index} className="db-kpi" onClick={handleClick} title={`عرض تفاصيل ${label}`}>
            <div className="db-kpi-top">
              <div className={`db-kpi-icon ${meta.cls}`}>
                {meta.svg}
              </div>
              <div className="db-kpi-copy">
                <div className="db-kpi-label">{label}</div>
                <div className="db-kpi-value">
                  {value}
                  {unit ? <small>{unit}</small> : null}
                </div>
              </div>
            </div>
            <div className="db-kpi-foot">
              <span className="db-live-badge">●</span>
              <span className="db-live-tag">{meta.tag}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { IconSearch } from '../components/AdminIcons';

export default function AdminUsersPage({ navigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const [users, setUsers] = useState([
    {
      id: 'u1',
      name: 'sd',
      email: 's@ymail.com',
      taxNumber: 'لا يوجد رقم ضريبي',
      type: 'فرد',
      subType: 'غير محدد',
      sector: 'قطاع غير محدد',
      city: '—',
      revenue: '0 د.أ',
      consultationsCount: 0,
      renewalsCount: 0,
      roles: ['user']
    },
    {
      id: 'u2',
      name: 'Ahmad Test',
      email: 'a@ymail.com',
      taxNumber: 'لا يوجد رقم ضريبي',
      type: 'فرد',
      subType: 'غير محدد',
      sector: 'قطاع غير محدد',
      city: '—',
      revenue: '0 د.أ',
      consultationsCount: 0,
      renewalsCount: 0,
      roles: ['consultant']
    },
    {
      id: 'u3',
      name: 'مستخدم تجريبي',
      email: 'user@diwan.jo',
      taxNumber: 'لا يوجد رقم ضريبي',
      type: 'فرد',
      subType: 'غير محدد',
      sector: 'قطاع غير محدد',
      city: '—',
      revenue: '0 د.أ',
      consultationsCount: 2,
      renewalsCount: 0,
      roles: ['user']
    },
    {
      id: 'u4',
      name: 'أ. رأفت حداد (تجريبي)',
      email: 'consultant@diwan.jo',
      taxNumber: 'لا يوجد رقم ضريبي',
      type: 'فرد',
      subType: 'غير محدد',
      sector: 'قطاع غير محدد',
      city: '—',
      revenue: '0 د.أ',
      consultationsCount: 5,
      renewalsCount: 0,
      roles: ['consultant']
    },
    {
      id: 'u5',
      name: 'مدير المنصة',
      email: 'admin@diwan.jo',
      taxNumber: 'لا يوجد رقم ضريبي',
      type: 'فرد',
      subType: 'غير محدد',
      sector: 'قطاع غير محدد',
      city: '—',
      revenue: '0 د.أ',
      consultationsCount: 0,
      renewalsCount: 0,
      roles: ['admin', 'user', 'super_admin']
    }
  ]);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.includes(searchTerm) || u.email.includes(searchTerm);
    const matchType = typeFilter === 'all' || u.type === typeFilter;
    const matchRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    return matchSearch && matchType && matchRole;
  });

  return (
    <div>
      {/* 1. Back Link */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <button 
          onClick={() => navigate('/admin')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#64748B', 
            fontSize: '12.5px', 
            fontWeight: '700', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>➔</span>
          <span>رجوع للوحة الإدارة</span>
        </button>
      </div>

      {/* 2. Top Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '18px' }}>
        <div>
          <div className="admin-banner-sub-tag" style={{ color: '#E58A13', fontWeight: '800' }}>USER OPERATIONS</div>
          <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: '2px 0 6px 0' }}>إدارة المستخدمين</h1>
          <p className="admin-banner-desc" style={{ fontSize: '12.5px', margin: 0 }}>
            بيانات حقيقية من جدول المستخدمين: المدينة، الصفة القانونية، القطاع، الإيراد، الأدوار، الحالة، الاشتراكات والاستشارات.
          </p>
        </div>
        <button 
          className="admin-btn-action-outline"
          style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
          onClick={() => alert('جاري تصدير قائمة المستخدمين CSV/Excel')}
        >
          <span>تصدير</span>
          <span>📥</span>
        </button>
      </div>

      {/* 3. Top 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي الحسابات</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>👥</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">7</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">شركات</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>🏢</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">1</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">نشطة</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>⚡</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">7</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">محجوب/مراجعة</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>🚫</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">0</span>
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Area: Right Side (Filter + Table) + Left Side (Charts) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '18px' }}>
        {/* Right Side in RTL: Search Filters + Users Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="admin-search-wrapper" style={{ flex: 1 }}>
              <IconSearch size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="بحث بالاسم، الإيميل، المدينة، الرقم الضريبي..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="admin-select-input"
              style={{ width: '130px', height: '38px' }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">كل الأنواع</option>
              <option value="فرد">فرد</option>
              <option value="شركة">شركة</option>
            </select>

            <select 
              className="admin-select-input"
              style={{ width: '130px', height: '38px' }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">كل الأدوار</option>
              <option value="user">user</option>
              <option value="consultant">consultant</option>
              <option value="company">company</option>
              <option value="admin">admin</option>
            </select>
          </div>

          {/* Table Container Card */}
          <div className="admin-table-container">
            <div className="admin-table-header-bar">
              <h3 className="admin-card-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#E58A13' }}>👥</span>
                <span>جدول المستخدمين ({filteredUsers.length})</span>
              </h3>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>النوع/الصفة</th>
                  <th>المدينة</th>
                  <th>الإيراد</th>
                  <th>استشارات</th>
                  <th>تجديد</th>
                  <th>الأدوار</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    {/* 1. المستخدم */}
                    <td>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{u.email}</div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{u.taxNumber}</div>
                    </td>

                    {/* 2. النوع/الصفة */}
                    <td>
                      <span className="admin-category-chip" style={{ fontSize: '11px', padding: '2px 8px', display: 'inline-block' }}>{u.type}</span>
                      <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>{u.subType}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>{u.sector}</div>
                    </td>

                    {/* 3. المدينة */}
                    <td>{u.city}</td>

                    {/* 4. الإيراد */}
                    <td style={{ fontWeight: '700', color: '#0F172A' }}>{u.revenue}</td>

                    {/* 5. استشارات */}
                    <td>{u.consultationsCount}</td>

                    {/* 6. تجديد */}
                    <td>{u.renewalsCount}</td>

                    {/* 7. الأدوار */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {u.roles.map((r, rIdx) => (
                          <span 
                            key={rIdx}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              color: '#334155',
                              fontWeight: '600'
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 8. إجراءات (Grouped 2x1 Buttons) */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: 'fit-content' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className="admin-icon-btn-minimal" 
                            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="حظر / تفعيل"
                            onClick={() => alert(`تغيير حالة الحساب للمستخدم: ${u.name}`)}
                          >
                            🚫
                          </button>
                          <button 
                            className="admin-icon-btn-minimal" 
                            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="معاينة الملف"
                            onClick={() => alert(`معاينة ملف: ${u.name}`)}
                          >
                            👁
                          </button>
                        </div>
                        <button 
                          className="admin-icon-btn-minimal" 
                          style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px', width: '60px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="الصلاحيات والأمان"
                          onClick={() => alert(`إعدادات الأمان للمستخدم: ${u.name}`)}
                        >
                          🛡️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Left Side in RTL: City & Account Chart + Distribution Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: المدن ونوع الحساب */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: '6px' }}>
              <h3 className="admin-card-title" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#E58A13' }}>📊</span>
                <span>المدن ونوع الحساب</span>
              </h3>
            </div>

            <div style={{ height: '170px', width: '100%', position: 'relative' }}>
              <svg viewBox="0 0 250 160" style={{ width: '100%', height: '100%' }}>
                {/* Horizontal Gridlines */}
                <line x1="25" y1="20" x2="240" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="55" x2="240" y2="55" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="90" x2="240" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="125" x2="240" y2="125" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="25" y1="140" x2="240" y2="140" stroke="#E2E8F0" strokeWidth="1" />

                {/* Y Axis Numbers */}
                <text x="18" y="24" fontSize="9" fill="#94A3B8" textAnchor="end">8</text>
                <text x="18" y="59" fontSize="9" fill="#94A3B8" textAnchor="end">6</text>
                <text x="18" y="94" fontSize="9" fill="#94A3B8" textAnchor="end">4</text>
                <text x="18" y="129" fontSize="9" fill="#94A3B8" textAnchor="end">2</text>
                <text x="18" y="144" fontSize="9" fill="#94A3B8" textAnchor="end">0</text>

                {/* Bars for 'غير محدد' */}
                <rect x="70" y="30" width="70" height="110" rx="2" fill="#0A3C64" />
                <rect x="145" y="120" width="70" height="20" rx="2" fill="#E58A13" />

                {/* X Label */}
                <text x="142" y="154" fontSize="10" fill="#64748B" textAnchor="middle">غير محدد</text>
              </svg>
            </div>
          </div>

          {/* Card 2: توزيع الحسابات */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: '14px' }}>
              <h3 className="admin-card-title" style={{ fontSize: '14px' }}>توزيع الحسابات</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: أفراد */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>1</span>
                  <span style={{ color: '#475569', fontWeight: '700' }}>أفراد</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '25%', background: '#E58A13', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>

              {/* Row 2: شركات */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>1</span>
                  <span style={{ color: '#475569', fontWeight: '700' }}>شركات</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '25%', background: '#E58A13', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>

              {/* Row 3: مستشارون */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>3</span>
                  <span style={{ color: '#475569', fontWeight: '700' }}>مستشارون</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '75%', background: '#E58A13', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

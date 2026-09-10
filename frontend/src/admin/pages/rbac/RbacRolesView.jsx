import React from 'react';
import ModernSelect from '../../../components/ModernSelect';

export default function RbacRolesView({
  roles,
  filteredRoles,
  dashboardRoleFilter,
  setDashboardRoleFilter,
  rolesSearch,
  setRolesSearch,
  rolesTypeFilter,
  setRolesTypeFilter,
  totalSensitivePermsCount,
  handleOpenCreateRole,
  viewRole,
  handleOpenCopyRole,
  handleToggleRoleStatus,
  handleDeleteRole
}) {
  return (
    <div>
      <div className="pageTitle">
        <div>
          <h2>الأدوار والصلاحيات</h2>
          <p>إدارة أدوار المستخدمين وصلاحيات الوصول والإجراءات المسموح بها داخل النظام.</p>
        </div>
        <div>
          <button className="btn primary" onClick={handleOpenCreateRole}>
            ＋ إنشاء دور جديد
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="stats">
        <div 
          className={`stat ${dashboardRoleFilter === 'all' ? 'activeFilter' : ''}`}
          onClick={() => setDashboardRoleFilter('all')}
        >
          <div className="statTop">
            <span>إجمالي الأدوار</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>
            </div>
          </div>
          <strong>{roles.length}</strong>
          <span>دور</span>
        </div>

        <div 
          className={`stat ${dashboardRoleFilter === 'custom' ? 'activeFilter' : ''}`}
          onClick={() => setDashboardRoleFilter(prev => prev === 'custom' ? 'all' : 'custom')}
        >
          <div className="statTop">
            <span>الأدوار المخصصة</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>
            </div>
          </div>
          <strong>{roles.filter(r => r.type === 'custom').length}</strong>
          <span>دور مخصص</span>
        </div>

        <div 
          className={`stat ${dashboardRoleFilter === 'withUsers' ? 'activeFilter' : ''}`}
          onClick={() => setDashboardRoleFilter(prev => prev === 'withUsers' ? 'all' : 'withUsers')}
        >
          <div className="statTop">
            <span>المستخدمون المرتبطون</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20c0-4 2.7-7 6-7s6 3 6 7M14 20c.2-2.5 1.7-4.5 4-4.5 1.7 0 3 1 3 2.5"/></svg>
            </div>
          </div>
          <strong>{roles.reduce((a, r) => a + (r.users || 0), 0)}</strong>
          <span>مستخدم</span>
        </div>

        <div 
          className={`stat ${dashboardRoleFilter === 'sensitive' ? 'activeFilter' : ''}`}
          onClick={() => setDashboardRoleFilter(prev => prev === 'sensitive' ? 'all' : 'sensitive')}
        >
          <div className="statTop">
            <span>الصلاحيات الحساسة</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>
            </div>
          </div>
          <strong>{totalSensitivePermsCount}</strong>
          <span>صلاحية حساسة بالنظام</span>
        </div>
      </div>

      {/* Roles Table Card */}
      <div className="card">
        <div className="toolbar">
          {dashboardRoleFilter !== 'all' && (
            <span className="activeFilterLabel">
              {dashboardRoleFilter === 'custom' ? 'الأدوار المخصصة' : (dashboardRoleFilter === 'withUsers' ? 'أدوار مرتبطة بمستخدمين' : 'أدوار تحتوي صلاحيات حساسة')}
              <button onClick={() => setDashboardRoleFilter('all')}>×</button>
            </span>
          )}
          <input 
            placeholder="البحث في الأدوار..." 
            value={rolesSearch} 
            onChange={e => setRolesSearch(e.target.value)} 
          />
          <ModernSelect
            value={rolesTypeFilter}
            onChange={(val) => setRolesTypeFilter(val)}
            options={[
              { value: 'all', label: 'جميع الأدوار' },
              { value: 'system', label: 'الأدوار الأساسية' },
              { value: 'custom', label: 'الأدوار المخصصة' }
            ]}
          />
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>اسم الدور</th>
                <th>نوع الدور</th>
                <th>المستخدمون</th>
                <th>الصلاحيات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="roleCell">
                      <div className="roleAvatar">{r.name[0]}</div>
                      <div>
                        <b>{r.name}</b>
                        <small>{r.description}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${r.type === 'system' ? 'system' : 'custom'}`}>
                      {r.type === 'system' ? 'دور أساسي' : 'دور مخصص'}
                    </span>
                  </td>
                  <td>{r.users}</td>
                  <td>{r.permissions}</td>
                  <td>
                    <span className={`badge ${r.active ? 'active' : 'inactive'}`}>
                      {r.active ? 'مفعّل' : 'معطّل'}
                    </span>
                  </td>
                  <td>
                    <div className="actionsRow">
                      <button className="iconBtn action-view" title="عرض الصلاحيات وتعديلها" onClick={() => viewRole(r.id)}>
                        <svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>
                      </button>
                      <button className="iconBtn action-copy" title="نسخ الدور" onClick={() => handleOpenCopyRole(r.id)}>
                        <svg viewBox="0 0 24 24"><rect x="8" y="8" width="10" height="11" rx="1"/><path d="M6 16H4.5A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5V7"/></svg>
                      </button>
                      <button className="iconBtn action-edit" title="تعديل الدور" onClick={() => viewRole(r.id)}>
                        <svg viewBox="0 0 24 24"><path d="M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="M13.8 7.4l2.8 2.8"/></svg>
                      </button>
                      <button 
                        className={`iconBtn ${r.active ? 'action-disable' : 'action-enable'}`} 
                        title={r.active ? 'تعطيل الدور' : 'تفعيل الدور'} 
                        onClick={() => handleToggleRoleStatus(r.id)}
                      >
                        {r.active ? (
                          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#E32119" stroke="#E32119"/><path d="M7.5 12h9" stroke="#fff" strokeWidth="2.2"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>
                        )}
                      </button>
                      {r.type === 'custom' && (
                        <button className="iconBtn action-delete" title="حذف الدور" onClick={() => handleDeleteRole(r.id)}>
                          <svg viewBox="0 0 24 24"><path d="M8 8v10m4-10v10m4-10v10M5.5 6h13M9 6V4.5h6V6M7 6l.7 14h8.6L17 6"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#6F7B84' }}>
                    لا توجد أدوار مطابقة للبحث أو التصفية الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span>النتائج 1-{filteredRoles.length} من {filteredRoles.length}</span>
          <span>إدارة نظام الأدوار والصلاحيات</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';

export default function RbacUsersView({
  systemUsers,
  filteredSystemUsers,
  roles,
  usersDashboardFilter,
  setUsersDashboardFilter,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  userStatusFilter,
  setUserStatusFilter,
  handleOpenNewUser,
  handleOpenUserEffective,
  handleOpenEditUser,
  handleToggleUserStatus,
  handleDeleteUser
}) {
  return (
    <div>
      <div className="pageTitle">
        <div>
          <h2>إدارة المستخدمين</h2>
          <p>إضافة المستخدمين وتعديل بياناتهم وإسناد دور واحد أو عدة أدوار لكل مستخدم.</p>
        </div>
        <div>
          <button className="btn primary" onClick={handleOpenNewUser}>
            ＋ إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* User Stat Cards */}
      <div className="userSummary">
        <div 
          className={`stat ${usersDashboardFilter === 'all' ? 'activeFilter' : ''}`}
          onClick={() => setUsersDashboardFilter('all')}
        >
          <div className="statTop">
            <span>إجمالي المستخدمين</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20c0-4 2.7-7 6-7s6 3 6 7M14 20c.2-2.5 1.7-4.5 4-4.5 1.7 0 3 1 3 2.5"/></svg>
            </div>
          </div>
          <strong>{systemUsers.length}</strong>
          <span>مستخدم</span>
        </div>

        <div 
          className={`stat ${usersDashboardFilter === 'active' ? 'activeFilter' : ''}`}
          onClick={() => setUsersDashboardFilter(prev => prev === 'active' ? 'all' : 'active')}
        >
          <div className="statTop">
            <span>المستخدمون النشطون</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>
            </div>
          </div>
          <strong>{systemUsers.filter(u => u.status === 'active').length}</strong>
          <span>مستخدم نشط</span>
        </div>

        <div 
          className={`stat ${usersDashboardFilter === 'multiRole' ? 'activeFilter' : ''}`}
          onClick={() => setUsersDashboardFilter(prev => prev === 'multiRole' ? 'all' : 'multiRole')}
        >
          <div className="statTop">
            <span>متعدد الأدوار</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><rect x="4" y="4" width="11" height="11" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2"/></svg>
            </div>
          </div>
          <strong>{systemUsers.filter(u => u.roles.length > 1).length}</strong>
          <span>يمتلكون أكثر من دور</span>
        </div>

        <div 
          className={`stat ${usersDashboardFilter === 'hasRole' ? 'activeFilter' : ''}`}
          onClick={() => setUsersDashboardFilter(prev => prev === 'hasRole' ? 'all' : 'hasRole')}
        >
          <div className="statTop">
            <span>المستخدمون المرتبطون بأدوار</span>
            <div className="statIcon">
              <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/></svg>
            </div>
          </div>
          <strong>{systemUsers.filter(u => u.roles.length > 0).length}</strong>
          <span>مستخدم مرتبط بدور واحد على الأقل</span>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="card">
        <div className="toolbar">
          {usersDashboardFilter !== 'all' && (
            <span className="usersActiveFilterLabel">
              {usersDashboardFilter === 'active' ? 'المستخدمون النشطون' : (usersDashboardFilter === 'multiRole' ? 'متعدد الأدوار' : 'المستخدمون المرتبطون بأدوار')}
              <button onClick={() => setUsersDashboardFilter('all')}>×</button>
            </span>
          )}
          <input 
            placeholder="البحث بالاسم أو البريد..." 
            value={userSearch} 
            onChange={e => setUserSearch(e.target.value)} 
          />
          <ModernSelect
            value={userRoleFilter}
            onChange={(val) => setUserRoleFilter(val)}
            options={[
              { value: 'all', label: 'جميع الأدوار' },
              ...roles.map(r => ({ value: r.id, label: r.name }))
            ]}
          />
          <ModernSelect
            value={userStatusFilter}
            onChange={(val) => setUserStatusFilter(val)}
            options={[
              { value: 'all', label: 'جميع الحالات' },
              { value: 'active', label: 'مفعّل' },
              { value: 'inactive', label: 'غير مفعّل' }
            ]}
          />
          <FilterResetButton onClick={() => { setUserSearch(''); setUserRoleFilter('all'); setUserStatusFilter('all'); }} size={38} />
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الهاتف</th>
                <th>الأدوار</th>
                <th>الحالة</th>
                <th>تاريخ الإضافة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSystemUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="userNameCell">
                      <div className="avatar">{(u.name || 'م')[0]}</div>
                      <div><b>{u.name}</b></div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <div className="roleChips">
                      {Array.isArray(u.roles) && u.roles.length > 0 ? (
                        u.roles.map((rid, idx) => {
                          const r = roles.find(x => x.id === rid || String(x.id) === String(rid) || x.name === rid);
                          const roleLabel = r ? r.name : (typeof rid === 'string' && isNaN(Number(rid)) ? rid : null);
                          return roleLabel ? <span key={idx} className="roleChip">{roleLabel}</span> : null;
                        })
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>مستخدم عادي</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'active' : 'inactive'}`}>
                      {u.status === 'active' ? 'مفعّل' : 'غير مفعّل'}
                    </span>
                  </td>
                  <td>{u.assigned}</td>
                  <td>
                    <div className="actionsRow">
                      <button className="iconBtn action-view" title="الصلاحيات الفعلية والتخصيص" onClick={() => handleOpenUserEffective(u.id)}>
                        <svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>
                      </button>
                      <button className="iconBtn action-edit" title="تعديل المستخدم وأدواره" onClick={() => handleOpenEditUser(u.id)}>
                        <svg viewBox="0 0 24 24"><path d="M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="M13.8 7.4l2.8 2.8"/></svg>
                      </button>
                      <button 
                        className={`iconBtn ${u.status === 'active' ? 'action-disable' : 'action-enable'}`} 
                        title={u.status === 'active' ? 'تعطيل المستخدم' : 'تفعيل المستخدم'} 
                        onClick={() => handleToggleUserStatus(u.id)}
                      >
                        {u.status === 'active' ? (
                          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#E32119" stroke="#E32119"/><path d="M7.5 12h9" stroke="#fff" strokeWidth="2.2"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>
                        )}
                      </button>
                      <button className="iconBtn action-delete" title="حذف المستخدم" onClick={() => handleDeleteUser(u.id)}>
                        <svg viewBox="0 0 24 24"><path d="M8 8v10m4-10v10m4-10v10M5.5 6h13M9 6V4.5h6V6M7 6l.7 14h8.6L17 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSystemUsers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#6F7B84' }}>
                    لا يوجد مستخدمون مطابقون للبحث أو الفلترة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span>النتائج 1-{filteredSystemUsers.length} من {filteredSystemUsers.length}</span>
          <span>إدارة مستخدمي المنصة والأدوار</span>
        </div>
      </div>
    </div>
  );
}

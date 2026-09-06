import React from 'react';

export default function RbacRoleDetailDrawer({
  activeRole,
  setDrawerOpen,
  setDrawerMode,
  handleOpenCopyRole,
  currentTab,
  setCurrentTab,
  roleUsers,
  setRoleUsers,
  enabledCount,
  countSensitive,
  setPermFilter,
  modules,
  currentModuleJump,
  handleJumpModule,
  permSearch,
  setPermSearch,
  permFilter,
  expanded,
  handleToggleModule,
  handleToggleAllModule,
  getPermState,
  handleTogglePerm,
  handleScopeChange,
  scopeMap,
  scopeLabels,
  hasUnsavedChanges,
  cancelChanges,
  handleReviewAndSave,
  setRoleUserForm,
  userOverrideStats,
  openIndividualPermissions,
  setModalContent,
  showToast,
  auditTrailDetailed,
  filterAuditType,
  setFilterAuditType
}) {
  return (
    <>
      <div className="drawerHead">
        <div className="drawerTitleWrap">
          <div className="drawerAvatar">{activeRole.name ? activeRole.name[0] : 'د'}</div>
          <div>
            <h3>{activeRole.name}</h3>
            <p>{activeRole.type === 'system' ? 'دور أساسي' : 'دور مخصص'} • {activeRole.active ? 'مفعّل' : 'معطّل'}</p>
          </div>
        </div>
        <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
      </div>

      <div className="drawerBody">
        <div className="drawerRoleIntro">{activeRole.description}</div>

        <div className="drawerActions">
          <button className="btn" onClick={() => handleOpenCopyRole(activeRole.id)}>نسخ</button>
          <button className="btn" onClick={() => { setDrawerMode('role_effective'); }}>الصلاحيات الفعلية</button>
        </div>

        {/* Role Meta KPI Cards */}
        <div className="drawerMeta">
          <div className="drawerKpi" onClick={() => setCurrentTab('users')} title="عرض المستخدمين">
            <span className="kpiLabel">المستخدمون</span>
            <b className="kpiValue">{activeRole.users || (roleUsers[activeRole.id] || []).length}</b>
          </div>
          <div className="drawerKpi" onClick={() => { setCurrentTab('permissions'); setPermFilter('enabled'); }} title="الصلاحيات الممنوحة">
            <span className="kpiLabel">الصلاحيات الممنوحة</span>
            <b className="kpiValue">{enabledCount()}</b>
          </div>
          <div className="drawerKpi" onClick={() => { setCurrentTab('permissions'); setPermFilter('sensitive'); }} title="الصلاحيات الحساسة">
            <span className="kpiLabel">الصلاحيات الحساسة</span>
            <b className="kpiValue" style={{ color: '#C53C54' }}>{countSensitive()}</b>
          </div>
          <div className="drawerKpi" onClick={() => setCurrentTab('audit')} title="سجل التغييرات">
            <span className="kpiLabel">آخر تعديل</span>
            <b className="kpiValue" style={{ fontSize: '11px' }}>{activeRole.lastModified}</b>
          </div>
          <div className="drawerKpi" onClick={() => setCurrentTab('audit')} title="سجل التغييرات">
            <span className="kpiLabel">من قام بالتعديل</span>
            <b className="kpiValue" style={{ fontSize: '11px' }}>{activeRole.modifiedBy}</b>
          </div>
        </div>

        {/* Drawer Internal Tabs */}
        <div className="drawerTabs">
          <button className={currentTab === 'permissions' ? 'on' : ''} onClick={() => setCurrentTab('permissions')}>الصلاحيات</button>
          <button className={currentTab === 'users' ? 'on' : ''} onClick={() => setCurrentTab('users')}>المستخدمون</button>
          <button className={currentTab === 'audit' ? 'on' : ''} onClick={() => setCurrentTab('audit')}>سجل التغييرات</button>
        </div>

        {/* TAB 1: PERMISSIONS */}
        {currentTab === 'permissions' && (
          <div>
            {/* Module Jump Buttons */}
            <div className="moduleJump">
              {modules.map(m => (
                <button 
                  key={m.id} 
                  className={`jumpBtn ${currentModuleJump === m.id ? 'active' : ''}`}
                  onClick={() => handleJumpModule(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Filter / Search within drawer */}
            <div className="toolbar" style={{ padding: '8px 0', borderBottom: 'none' }}>
              <input 
                placeholder="البحث في الصلاحيات..." 
                value={permSearch} 
                onChange={e => setPermSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <select value={permFilter} onChange={e => setPermFilter(e.target.value)}>
                <option value="all">جميع الصلاحيات</option>
                <option value="enabled">الممنوحة فقط</option>
                <option value="sensitive">الحساسة فقط</option>
              </select>
            </div>

            {/* Modules Accordion List */}
            {modules.map(m => {
              const isOpen = expanded.has(m.id);
              const mPerms = m.permissions.filter(p => {
                const matchSearch = !permSearch || p[1].toLowerCase().includes(permSearch.toLowerCase()) || p[0].toLowerCase().includes(permSearch.toLowerCase());
                const state = getPermState(p[0]);
                const matchFilter = permFilter === 'all' ? true : (permFilter === 'enabled' ? state.enabled : (permFilter === 'sensitive' ? !!p[3] : true));
                return matchSearch && matchFilter;
              });

              if (mPerms.length === 0 && (permSearch || permFilter !== 'all')) return null;

              const enabledInModule = m.permissions.filter(p => getPermState(p[0]).enabled).length;
              const allCheckedInModule = m.permissions.length > 0 && enabledInModule === m.permissions.length;

              return (
                <div key={m.id} className={`module ${isOpen ? 'open' : ''}`}>
                  <div className="modHead" onClick={() => handleToggleModule(m.id)}>
                    <div className="moduleTitleWrap">
                      <span className="moduleChevron">⌄</span>
                      <div>
                        <b>{m.name}</b>
                        <small> {enabledInModule}/{m.permissions.length} صلاحيات ممنوحة</small>
                      </div>
                    </div>
                    <label className="modSelectAll" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={allCheckedInModule} 
                        onChange={() => handleToggleAllModule(m.id)} 
                      />
                      <span>تحديد الكل</span>
                    </label>
                  </div>

                  <div className={`permRows ${isOpen ? '' : 'hide'}`}>
                    {mPerms.map(p => {
                      const state = getPermState(p[0]);
                      const scopes = scopeMap[p[0]] || [];

                      return (
                        <div key={p[0]} className="permRow">
                          <div className="permInfo">
                            <input 
                              type="checkbox" 
                              checked={state.enabled} 
                              onChange={e => handleTogglePerm(p[0], e.target.checked)} 
                            />
                            <div>
                              <span className="permTitle">{p[1]}</span>
                              <span className="permCode">({p[0]})</span>
                              {p[3] && <span className="badge sensitive" style={{ marginRight: '6px' }}>حساس</span>}
                            </div>
                          </div>

                          {state.enabled && scopes.length > 0 && (
                            <div className="scopeSelector">
                              <span>نطاق الوصول:</span>
                              <select 
                                value={state.scope} 
                                onChange={e => handleScopeChange(p[0], e.target.value)}
                              >
                                {scopes.map(s => (
                                  <option key={s} value={s}>{scopeLabels[s] || s}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {hasUnsavedChanges() && (
              <div className="unsaved">
                <b>! لديك تغييرات غير محفوظة</b>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" onClick={cancelChanges}>إلغاء التغييرات</button>
                  <button className="btn primary" onClick={handleReviewAndSave}>مراجعة وحفظ</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROLE USERS */}
        {currentTab === 'users' && (
          <div>
            <div className="toolbar" style={{ padding: '8px 0', borderBottom: 'none' }}>
              <input 
                placeholder="البحث عن مستخدم..." 
                style={{ flex: 1 }}
                onChange={e => {
                  const q = e.target.value.toLowerCase().trim();
                  document.querySelectorAll('#roleUsersList tr').forEach(tr => {
                    tr.style.display = (tr.dataset.user || '').includes(q) ? '' : 'none';
                  });
                }} 
              />
              <button className="btn primary" onClick={() => { setRoleUserForm({ name: '', email: '', status: 'نشط' }); setDrawerMode('add_role_user'); }}>
                ＋ إضافة مستخدم إلى الدور
              </button>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الحالة</th>
                    <th>تاريخ الإسناد</th>
                    <th>بواسطة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="roleUsersList">
                  {(roleUsers[activeRole.id] || []).map((x, idx) => {
                    const st = userOverrideStats(x[1], activeRole.id);
                    return (
                      <tr key={idx} data-user={`${x[0]} ${x[1]}`.toLowerCase()}>
                        <td>
                          <b>{x[0]}</b>
                          {(st.added > 0 || st.removed > 0) && (
                            <div style={{ fontSize: '10px', color: '#0D3C5C', marginTop: '2px', fontWeight: '700' }}>
                              تخصيص فردي: +{st.added} / -{st.removed}
                            </div>
                          )}
                        </td>
                        <td>{x[1]}</td>
                        <td><span className={`badge ${x[2] === 'نشط' ? 'active' : 'inactive'}`}>{x[2]}</span></td>
                        <td>{x[3]}</td>
                        <td>{x[4]}</td>
                        <td>
                          <div className="actionsRow">
                            <button className="iconBtn" title="تخصيص صلاحيات المستخدم الفردية" onClick={() => openIndividualPermissions(x[1])}>
                              <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.7 2.9 8 7 10 4.1-2 7-5.3 7-10V6l-7-3Z"/><path d="M8.5 12h7"/><path d="M12 8.5v7"/></svg>
                            </button>
                            <button className="iconBtn action-delete" title="إزالة المستخدم من الدور" onClick={() => {
                              setModalContent({
                                title: 'إزالة المستخدم من الدور',
                                body: <div className="dangerBox">سيتم إزالة <b>{x[0]}</b> من دور "{activeRole.name}". لن يتم حذف حسابه من النظام.</div>,
                                confirmText: 'إزالة من الدور',
                                confirmClass: 'danger',
                                cancelText: 'إلغاء',
                                onConfirm: () => {
                                  setRoleUsers(prev => ({
                                    ...prev,
                                    [activeRole.id]: (prev[activeRole.id] || []).filter(u => u[1] !== x[1])
                                  }));
                                  setModalContent(null);
                                  showToast('تمت إزالة المستخدم من الدور');
                                },
                                onCancel: () => setModalContent(null)
                              });
                            }}>
                              <svg viewBox="0 0 24 24"><path d="M8 8v10m4-10v10m4-10v10M5.5 6h13M9 6V4.5h6V6M7 6l.7 14h8.6L17 6"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {currentTab === 'audit' && (
          <div>
            <div className="toolbar" style={{ padding: '8px 0', borderBottom: 'none' }}>
              <input 
                placeholder="ابحث في سجل التغييرات..." 
                style={{ flex: 1 }}
                onChange={e => {
                  const q = e.target.value.toLowerCase().trim();
                  document.querySelectorAll('#auditRows tr').forEach(tr => {
                    tr.style.display = (tr.dataset.audit || '').includes(q) ? '' : 'none';
                  });
                }} 
              />
              <select value={filterAuditType} onChange={e => setFilterAuditType(e.target.value)}>
                <option value="all">جميع الإجراءات</option>
                <option value="scope">تغيير نطاق</option>
                <option value="grant">منح صلاحية</option>
                <option value="revoke">إزالة صلاحية</option>
                <option value="assign">إسناد مستخدم</option>
                <option value="copy">نسخ دور</option>
                <option value="user-permission">تخصيص مستخدم</option>
              </select>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>الإجراء</th>
                    <th>العنصر</th>
                    <th>القيمة السابقة</th>
                    <th>القيمة الجديدة</th>
                    <th>المستخدم</th>
                    <th>التاريخ والوقت</th>
                    <th>IP</th>
                    <th>الجهاز</th>
                  </tr>
                </thead>
                <tbody id="auditRows">
                  {auditTrailDetailed
                    .filter(a => filterAuditType === 'all' || a.type === filterAuditType)
                    .map((a, idx) => (
                      <tr key={idx} data-audit={`${a.action} ${a.target} ${a.user}`.toLowerCase()}>
                        <td><b>{a.action}</b></td>
                        <td>{a.target}</td>
                        <td>{a.oldValue}</td>
                        <td>{a.newValue}</td>
                        <td>{a.user}</td>
                        <td>{a.date}<br /><small style={{ color: '#89949B' }}>{a.time}</small></td>
                        <td>{a.ip}</td>
                        <td>{a.device}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

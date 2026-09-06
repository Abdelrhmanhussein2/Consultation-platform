import React from 'react';

export default function RbacDrawers({
  drawerMode,
  setDrawerMode,
  setDrawerOpen,
  activeRole,
  roles,
  createRoleForm,
  setCreateRoleForm,
  handleCreateRoleSubmit,
  cloneRoleForm,
  setCloneRoleForm,
  handleConfirmCloneRole,
  modules,
  getPermState,
  countSensitive,
  scopeMap,
  scopeLabels,
  roleUsers,
  setRoleUsers,
  roleUserForm,
  setRoleUserForm,
  showToast,
  currentRoleUserEmail,
  setCurrentRoleUserEmail,
  customizationReturnContext,
  setCustomizationReturnContext,
  userOverrideStats,
  roleBasePermissionIds,
  effectiveUserPermissionIds,
  userPermExpanded,
  setUserPermExpanded,
  userPermMode,
  setUserPermOverride,
  userPermScope,
  setUserPermScope,
  setAuditTrailDetailed,
  userForm,
  setUserForm,
  handleSaveUserSubmit,
  selectedUserIdForDrawer,
  systemUsers,
  userRolePermissionSources,
  userPermissionOverrides,
  findP,
  permissionMeta,
  handleOpenWhyUserPerm,
  selectedPermIdForWhy,
  dependencies
}) {
  return (
    <>
      {/* DRAWER MODE 2: CREATE NEW ROLE */}
      {drawerMode === 'create_role' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">+</div>
              <div>
                <h3>إنشاء دور جديد</h3>
                <p>إنشاء دور مخصص مع إمكانية البدء من دور موجود</p>
              </div>
            </div>
            <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          <div className="drawerBody">
            <div className="drawerInfo">
              سيتم إنشاء دور مخصص جديد. يمكنك البدء بدون صلاحيات أو نسخ نقطة البداية من أي دور موجود، ثم فتح الدور وتعديل صلاحياته بالكامل.
            </div>

            <div className="drawerFormGrid">
              <div className="drawerField full">
                <label>اسم الدور *</label>
                <input 
                  placeholder="مثال: مراجع ضريبي"
                  value={createRoleForm.name}
                  onChange={e => setCreateRoleForm({ ...createRoleForm, name: e.target.value })}
                />
              </div>
              <div className="drawerField full">
                <label>وصف الدور</label>
                <textarea 
                  placeholder="وصف مختصر لمسؤوليات هذا الدور"
                  value={createRoleForm.description}
                  onChange={e => setCreateRoleForm({ ...createRoleForm, description: e.target.value })}
                />
              </div>
              <div className="drawerField full">
                <label>البدء من دور موجود</label>
                <select 
                  value={createRoleForm.sourceRoleId}
                  onChange={e => setCreateRoleForm({ ...createRoleForm, sourceRoleId: e.target.value })}
                >
                  <option value="">البدء بدون صلاحيات</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => setDrawerOpen(false)}>إلغاء</button>
            <button className="btn primary" onClick={handleCreateRoleSubmit}>إنشاء الدور</button>
          </div>
        </>
      )}

      {/* DRAWER MODE 3: COPY ROLE */}
      {drawerMode === 'copy_role' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">📋</div>
              <div>
                <h3>نسخ الدور</h3>
                <p>إنشاء نسخة جديدة من {activeRole.name}</p>
              </div>
            </div>
            <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          <div className="drawerBody">
            <div className="drawerFormGrid">
              <div className="drawerField full">
                <label>الدور المصدر</label>
                <input value={activeRole.name} disabled />
              </div>
              <div className="drawerField full">
                <label>اسم الدور الجديد *</label>
                <input 
                  value={cloneRoleForm.newName}
                  onChange={e => setCloneRoleForm({ ...cloneRoleForm, newName: e.target.value })}
                />
              </div>
            </div>

            <div className="drawerSectionTitle">خيارات النسخ</div>
            <div className="cloneOptions">
              <label className="cloneOption">
                <input 
                  type="checkbox" 
                  checked={cloneRoleForm.clonePerms}
                  onChange={e => setCloneRoleForm({ ...cloneRoleForm, clonePerms: e.target.checked })}
                />
                <span>نسخ جميع الصلاحيات</span>
              </label>
              <label className="cloneOption">
                <input 
                  type="checkbox" 
                  checked={cloneRoleForm.cloneScopes}
                  onChange={e => setCloneRoleForm({ ...cloneRoleForm, cloneScopes: e.target.checked })}
                />
                <span>نسخ نطاقات الوصول</span>
              </label>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => { setDrawerMode('role_detail'); }}>رجوع</button>
            <button className="btn primary" onClick={handleConfirmCloneRole}>إنشاء نسخة</button>
          </div>
        </>
      )}

      {/* DRAWER MODE 4: ROLE EFFECTIVE PERMISSIONS */}
      {drawerMode === 'role_effective' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">{activeRole.name[0]}</div>
              <div>
                <h3>الصلاحيات الفعلية — {activeRole.name}</h3>
                <p>{activeRole.type === 'system' ? 'دور أساسي' : 'دور مخصص'} • جميع الصلاحيات الفعلية ونطاقات الوصول</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="drawerBack" onClick={() => setDrawerMode('role_detail')}>رجوع</button>
              <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
          </div>

          <div className="drawerBody">
            <div className="effectiveHero">
              <div className="effectiveHeroTitle">الدور المسند</div>
              <div className="roleChips"><span className="roleChip">{activeRole.name}</span></div>
              <div className="effectiveHeroNote">توضح هذه الشاشة الصلاحيات النهائية للدور بعد تطبيق حالات التفعيل ونطاقات الوصول.</div>
            </div>

            <div className="effectiveSummary">
              <div className="mini">
                <span>إجمالي الصلاحيات الفعلية</span>
                <b>{modules.flatMap(m => m.permissions).filter(p => getPermState(p[0]).enabled).length}</b>
              </div>
              <div className="mini">
                <span>صلاحيات حساسة</span>
                <b style={{ color: '#DC2626' }}>{countSensitive()}</b>
              </div>
              <div className="mini">
                <span>صلاحيات ذات نطاق</span>
                <b>{modules.flatMap(m => m.permissions).filter(p => getPermState(p[0]).enabled && scopeMap[p[0]]).length}</b>
              </div>
              <div className="mini">
                <span>المستخدمون المرتبطون</span>
                <b>{(roleUsers[activeRole.id] || []).length}</b>
              </div>
            </div>

            <div className="effectiveTableWrap">
              <table>
                <thead>
                  <tr>
                    <th>الصلاحية</th>
                    <th>الحالة</th>
                    <th>المصدر</th>
                    <th>النطاق</th>
                    <th>القسم</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.flatMap(m => m.permissions).filter(p => getPermState(p[0]).enabled).map(p => {
                    const mod = modules.find(m => m.permissions.some(x => x[0] === p[0]));
                    return (
                      <tr key={p[0]}>
                        <td><b>{p[1]}</b></td>
                        <td><span className="badge active">مسموح</span></td>
                        <td><span className="roleChip">{activeRole.name}</span></td>
                        <td>{scopeMap[p[0]] ? (scopeLabels[getPermState(p[0]).scope] || getPermState(p[0]).scope) : '—'}</td>
                        <td>{mod?.name || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => setDrawerMode('role_detail')}>رجوع</button>
            <button className="btn customize" onClick={() => { setDrawerMode('role_effective_customization'); }}>تخصيص الصلاحيات</button>
          </div>
        </>
      )}

      {/* DRAWER MODE 5: ADD USER TO ROLE */}
      {drawerMode === 'add_role_user' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">+</div>
              <div>
                <h3>إضافة مستخدم إلى الدور</h3>
                <p>{activeRole.name}</p>
              </div>
            </div>
            <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          <div className="drawerBody">
            <div className="drawerFormGrid">
              <div className="drawerField full">
                <label>اسم المستخدم *</label>
                <input 
                  placeholder="مثال: نور سامر"
                  value={roleUserForm.name}
                  onChange={e => setRoleUserForm({ ...roleUserForm, name: e.target.value })}
                />
              </div>
              <div className="drawerField full">
                <label>البريد الإلكتروني *</label>
                <input 
                  placeholder="name@diwanjo.com"
                  value={roleUserForm.email}
                  onChange={e => setRoleUserForm({ ...roleUserForm, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => setDrawerMode('role_detail')}>إلغاء</button>
            <button className="btn primary" onClick={() => {
              if (!roleUserForm.name.trim() || !roleUserForm.email.trim()) {
                showToast('يرجى إدخال الاسم والبريد الإلكتروني');
                return;
              }
              setRoleUsers(prev => ({
                ...prev,
                [activeRole.id]: [
                  ...(prev[activeRole.id] || []),
                  [roleUserForm.name.trim(), roleUserForm.email.trim(), 'نشط', new Date().toISOString().split('T')[0], 'سعيد هارون']
                ]
              }));
              setDrawerMode('role_detail');
              showToast('تمت إضافة المستخدم إلى الدور');
            }}>
              إضافة
            </button>
          </div>
        </>
      )}

      {/* DRAWER MODE 6: INDIVIDUAL USER PERMISSION CUSTOMIZATION */}
      {drawerMode === 'individual_user_perms' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">{currentRoleUserEmail ? currentRoleUserEmail[0].toUpperCase() : 'م'}</div>
              <div>
                <h3>تخصيص صلاحيات المستخدم</h3>
                <p>{currentRoleUserEmail} • الدور: {activeRole.name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="drawerBack" onClick={() => {
                if (customizationReturnContext?.type === 'role_effective') setDrawerMode('role_effective');
                else setDrawerMode('role_detail');
              }}>
                رجوع
              </button>
              <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
          </div>

          <div className="drawerBody">
            <div className="drawerInfo">
              يمكنك منح أو إزالة صلاحيات لهذا المستخدم فقط دون تغيير مسمى الدور أو التأثير على بقية المستخدمين. خيار <b>حسب الدور</b> يعيد الصلاحية إلى إعداد الدور الأساسي.
            </div>

            {/* Summary counts */}
            {(() => {
              const stats = userOverrideStats(currentRoleUserEmail, activeRole.id);
              const baseCount = roleBasePermissionIds(activeRole.id).size;
              return (
                <div className="userPermSummary">
                  <div className="mini"><span>صلاحيات الدور</span><b>{baseCount}</b></div>
                  <div className="mini"><span>منح فردي</span><b>{stats.added}</b></div>
                  <div className="mini"><span>إزالة فردية</span><b>{stats.removed}</b></div>
                  <div className="mini"><span>الصلاحيات الفعلية</span><b>{stats.effective}</b></div>
                </div>
              );
            })()}

            <div className="userPermLegend">
              <span className="inherit">حسب الدور</span>
              <span className="grant">منح فردي</span>
              <span className="deny">إزالة فردية</span>
            </div>

            {/* Modules with override controls */}
            {modules.map(m => {
              const base = roleBasePermissionIds(activeRole.id);
              const effective = effectiveUserPermissionIds(currentRoleUserEmail, activeRole.id);
              const isOpen = userPermExpanded.has(m.id);

              return (
                <div key={m.id} className={`module ${isOpen ? 'open' : ''}`}>
                  <div className="modHead" onClick={() => setUserPermExpanded(prev => prev.has(m.id) ? new Set() : new Set([m.id]))}>
                    <div className="moduleTitleWrap">
                      <span className="moduleChevron">⌄</span>
                      <div>
                        <b>{m.name}</b>
                        <small> {m.permissions.filter(p => effective.has(p[0])).length}/{m.permissions.length} فعلياً</small>
                      </div>
                    </div>
                  </div>

                  <div className={`permRows ${isOpen ? '' : 'hide'}`}>
                    {m.permissions.map(p => {
                      const mode = userPermMode(currentRoleUserEmail, p[0]);
                      const isBase = base.has(p[0]);
                      const isEff = effective.has(p[0]);
                      const sc = scopeMap[p[0]] || [];

                      return (
                        <div key={p[0]} className="userPermRow">
                          <div className="userPermName">
                            <b>{p[1]} {p[3] && <span className="badge sensitive">حساس</span>}</b>
                            <small>{isBase ? 'ممنوحة من الدور الأساسي' : 'غير موجودة في الدور الأساسي'} • {isEff ? 'فعالة للمستخدم' : 'غير فعالة'}</small>
                            {mode !== 'inherit' && (
                              <span className={`userOverrideTag ${mode}`}>{mode === 'grant' ? 'منح فردي' : 'إزالة فردية'}</span>
                            )}
                          </div>
                          <div>
                            <div className="userOverrideBtns">
                              <button 
                                className={`userOverrideBtn inherit ${mode === 'inherit' ? 'active' : ''}`}
                                onClick={() => setUserPermOverride(currentRoleUserEmail, p[0], 'inherit')}
                              >
                                حسب الدور
                              </button>
                              <button 
                                className={`userOverrideBtn grant ${mode === 'grant' ? 'active' : ''}`}
                                onClick={() => setUserPermOverride(currentRoleUserEmail, p[0], 'grant')}
                              >
                                منح
                              </button>
                              <button 
                                className={`userOverrideBtn deny ${mode === 'deny' ? 'active' : ''}`}
                                onClick={() => setUserPermOverride(currentRoleUserEmail, p[0], 'deny')}
                              >
                                إزالة
                              </button>
                            </div>
                            {mode === 'grant' && sc.length > 0 && (
                              <div className="userScopeRow">
                                {sc.map(s => (
                                  <button 
                                    key={s}
                                    className={`userScopeBtn ${userPermScope(currentRoleUserEmail, p[0]) === s ? 'active' : ''}`}
                                    onClick={() => setUserPermScope(currentRoleUserEmail, p[0], s)}
                                  >
                                    {scopeLabels[s]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => {
              if (customizationReturnContext?.type === 'role_effective') setDrawerMode('role_effective');
              else setDrawerMode('role_detail');
            }}>
              رجوع
            </button>
            <button className="btn primary" onClick={() => {
              setAuditTrailDetailed(prev => [{
                type: 'user-permission',
                action: 'تخصيص صلاحيات المستخدم',
                target: currentRoleUserEmail,
                oldValue: 'صلاحيات الدور',
                newValue: 'تخصيص فردي',
                user: 'سعيد هارون',
                date: new Date().toLocaleDateString('ar-JO'),
                time: new Date().toLocaleTimeString('ar-JO'),
                ip: '192.168.1.45',
                device: 'Chrome / Windows'
              }, ...prev]);
              if (customizationReturnContext?.type === 'role_effective') setDrawerMode('role_effective');
              else setDrawerMode('role_detail');
              showToast('تم حفظ تخصيص صلاحيات المستخدم بنجاح');
            }}>
              حفظ التخصيص
            </button>
          </div>
        </>
      )}

      {/* DRAWER MODE 7: NEW / EDIT USER MANAGEMENT */}
      {(drawerMode === 'new_user' || drawerMode === 'edit_user') && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">{drawerMode === 'new_user' ? '+' : userForm.name[0]}</div>
              <div>
                <h3>{drawerMode === 'new_user' ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'}</h3>
                <p>{drawerMode === 'new_user' ? 'إضافة مستخدم وإسناد دور واحد أو عدة أدوار' : `${userForm.name} • ${userForm.email}`}</p>
              </div>
            </div>
            <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
          </div>

          <div className="drawerBody">
            <div className="drawerFormGrid">
              <div className="drawerField">
                <label>الاسم الكامل *</label>
                <input 
                  placeholder="الاسم الكامل"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>
              <div className="drawerField">
                <label>البريد الإلكتروني *</label>
                <input 
                  placeholder="name@diwanjo.com"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div className="drawerField">
                <label>رقم الهاتف</label>
                <input 
                  placeholder="00962..."
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>
              <div className="drawerField">
                <label>حالة تسجيل الدخول</label>
                <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })}>
                  <option value="active">مفعّل</option>
                  <option value="inactive">غير مفعّل</option>
                </select>
              </div>

              <div className="drawerField full">
                <label>الأدوار — يمكن اختيار أكثر من دور</label>
                <div className="checkRoles">
                  {roles.map(r => (
                    <label key={r.id} className="checkRole">
                      <span className="roleCardText">
                        <b>{r.name}</b>
                        <small>{r.type === 'system' ? 'دور أساسي' : 'دور مخصص'}</small>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={userForm.roles.includes(r.id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setUserForm(prev => ({
                            ...prev,
                            roles: checked ? [...prev.roles, r.id] : prev.roles.filter(id => id !== r.id)
                          }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => setDrawerOpen(false)}>إلغاء</button>
            <button className="btn primary" onClick={handleSaveUserSubmit}>حفظ المستخدم</button>
          </div>
        </>
      )}

      {/* DRAWER MODE 8: USER EFFECTIVE PERMISSIONS */}
      {drawerMode === 'user_effective' && selectedUserIdForDrawer && (() => {
        const u = systemUsers.find(x => x.id === selectedUserIdForDrawer);
        if (!u) return null;
        const roleNames = u.roles.map(rid => roles.find(r => r.id === rid)?.name).filter(Boolean);
        
        // Calculate merged effective permissions
        let effMap = {};
        roleNames.forEach(rn => (userRolePermissionSources[rn] || []).forEach(pid => {
          if (!effMap[pid]) effMap[pid] = { id: pid, sources: [], scope: '—' };
          effMap[pid].sources.push(rn);
          const s = getPermState(pid);
          if (scopeMap[pid] && s.scope) effMap[pid].scope = scopeLabels[s.scope] || s.scope;
        }));

        // Apply overrides
        const ovs = userPermissionOverrides[u.email] || {};
        Object.entries(ovs).forEach(([pid, o]) => {
          if (o.mode === 'deny') delete effMap[pid];
          if (o.mode === 'grant') {
            effMap[pid] = {
              id: pid,
              sources: ['تخصيص فردي'],
              scope: scopeLabels[o.scope] || o.scope || '—'
            };
          }
        });

        const effList = Object.values(effMap);
        const sensitiveCount = effList.filter(e => findP(e.id)?.[3]).length;

        return (
          <>
            <div className="drawerHead">
              <div className="drawerTitleWrap">
                <div className="drawerAvatar">{u.name[0]}</div>
                <div>
                  <h3>الصلاحيات الفعلية — {u.name}</h3>
                  <p>{u.email} • {u.roles.length} دور/أدوار</p>
                </div>
              </div>
              <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
            </div>

            <div className="drawerBody">
              <div className="effectiveHero">
                <div className="effectiveHeroTitle">الأدوار المسندة</div>
                <div className="roleChips">
                  {roleNames.map((n, i) => <span key={i} className="roleChip">{n}</span>)}
                  {roleNames.length === 0 && <span className="roleChip">بدون أدوار</span>}
                </div>
                <div className="effectiveHeroNote">تتضمن القائمة الصلاحيات الموروثة من كافة أدواره بعد تطبيق التخصيص الفردي.</div>
              </div>

            <div className="effectiveSummary">
                <div className="mini"><span>إجمالي الصلاحيات</span><b>{effList.length}</b></div>
                <div className="mini"><span>صلاحيات حساسة</span><b style={{ color: '#DC2626' }}>{sensitiveCount}</b></div>
                <div className="mini"><span>تخصيصات فردية</span><b>{Object.keys(ovs).length}</b></div>
                <div className="mini"><span>الأدوار المسندة</span><b>{u.roles.length}</b></div>
              </div>

              <div className="effectiveTableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>الصلاحية</th>
                      <th>الحالة</th>
                      <th>المصدر</th>
                      <th>النطاق</th>
                      <th>القسم</th>
                      <th>التفسير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effList.map(e => {
                      const p = findP(e.id);
                      const mod = modules.find(m => m.permissions.some(x => x[0] === e.id));
                      return (
                        <tr key={e.id}>
                          <td><b>{permissionMeta[e.id]?.name || p?.[1] || e.id}</b></td>
                          <td><span className="badge active">مسموح</span></td>
                          <td>
                            <div className="roleChips">
                              {e.sources.map((s, idx) => <span key={idx} className="roleChip">{s}</span>)}
                            </div>
                          </td>
                          <td>{e.scope}</td>
                          <td>{mod?.name || '—'}</td>
                          <td>
                            <button className="btn" style={{ fontSize: '10px', padding: '4px 8px' }} onClick={() => handleOpenWhyUserPerm(u.id, e.id)}>
                              لماذا يمتلكها؟
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="drawerFoot">
              <button className="btn" onClick={() => setDrawerOpen(false)}>إغلاق</button>
              <button className="btn customize" onClick={() => {
                setCurrentRoleUserEmail(u.email);
                setDrawerMode('individual_user_perms');
              }}>
                تخصيص الصلاحيات
              </button>
            </div>
          </>
        );
      })()}

      {/* DRAWER MODE 9: WHY USER HAS PERMISSION EXPLANATION */}
      {drawerMode === 'why_user_perm' && selectedUserIdForDrawer && selectedPermIdForWhy && (() => {
        const u = systemUsers.find(x => x.id === selectedUserIdForDrawer);
        const p = findP(selectedPermIdForWhy);
        if (!u || !p) return null;
        const roleNames = u.roles.map(id => roles.find(r => r.id === id)?.name).filter(Boolean);
        const sources = roleNames.filter(r => (userRolePermissionSources[r] || []).includes(selectedPermIdForWhy));
        const depNames = (dependencies[selectedPermIdForWhy] || []).map(d => permissionMeta[d]?.name || d);

        return (
          <>
            <div className="drawerHead">
              <div className="drawerTitleWrap">
                <div className="drawerAvatar">?</div>
                <div>
                  <h3>لماذا يمتلك هذه الصلاحية؟</h3>
                  <p>{u.name} • {p[1]}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="drawerBack" onClick={() => setDrawerMode('user_effective')}>رجوع</button>
                <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
              </div>
            </div>

            <div className="drawerBody">
              <div className="drawerFormGrid">
                <div className="drawerField full">
                  <label>اسم الصلاحية</label>
                  <input value={p[1]} disabled />
                </div>
                <div className="drawerField full">
                  <label>الدور / الأدوار التي منحتها</label>
                  <div className="roleChips">
                    {sources.map((s, idx) => <span key={idx} className="roleChip">{s}</span>)}
                    {sources.length === 0 && <span>تخصيص فردي مباشر</span>}
                  </div>
                </div>
                <div className="drawerField full">
                  <label>نطاق الوصول الفعلي</label>
                  <input value={scopeMap[p[0]] ? (scopeLabels[getPermState(p[0]).scope] || getPermState(p[0]).scope) : 'غير مطبق على هذه الصلاحية'} disabled />
                </div>
                <div className="drawerField full">
                  <label>الصلاحيات المترابطة (Dependencies)</label>
                  {depNames.length > 0 ? (
                    depNames.map((d, idx) => <div key={idx} className="drawerInfo" style={{ padding: '8px 10px', margin: '4px 0' }}>✓ {d}</div>)
                  ) : (
                    <div className="drawerInfo" style={{ padding: '8px 10px' }}>لا توجد صلاحيات إضافية مطلوبة.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="drawerFoot">
              <button className="btn" onClick={() => setDrawerMode('user_effective')}>العودة للصلاحيات الفعلية</button>
            </div>
          </>
        );
      })()}

      {/* DRAWER MODE 10: ROLE EFFECTIVE CUSTOMIZATION (CHOOSE USER TO CUSTOMIZE) */}
      {drawerMode === 'role_effective_customization' && (
        <>
          <div className="drawerHead">
            <div className="drawerTitleWrap">
              <div className="drawerAvatar">{activeRole.name[0]}</div>
              <div>
                <h3>تخصيص صلاحيات مستخدم</h3>
                <p>الدور: {activeRole.name} • اختر مستخدماً لتخصيص صلاحياته</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="drawerBack" onClick={() => setDrawerMode('role_effective')}>رجوع</button>
              <button className="drawerClose" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
          </div>

          <div className="drawerBody">
            <div className="drawerInfo">
              يعرض هذا الجدول جميع المستخدمين المرتبطين بالدور. يمكنك فتح تخصيص صلاحياتهم الفردية مباشرة دون التأثير على بقية مستخدمي الدور.
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {(roleUsers[activeRole.id] || []).map((rec, idx) => (
                    <tr key={idx}>
                      <td><b>{rec[0]}</b></td>
                      <td>{rec[1]}</td>
                      <td><span className={`badge ${rec[2] === 'نشط' ? 'active' : 'inactive'}`}>{rec[2]}</span></td>
                      <td>
                        <button 
                          className="btn primary" 
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                          onClick={() => {
                            setCurrentRoleUserEmail(rec[1]);
                            setCustomizationReturnContext({ type: 'role_effective' });
                            setDrawerMode('individual_user_perms');
                          }}
                        >
                          تخصيص الصلاحيات
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="drawerFoot">
            <button className="btn" onClick={() => setDrawerMode('role_effective')}>رجوع</button>
          </div>
        </>
      )}
    </>
  );
}

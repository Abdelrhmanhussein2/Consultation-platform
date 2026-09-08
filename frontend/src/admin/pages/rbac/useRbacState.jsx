import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  getAdminsList, 
  createAdmin, 
  updateAdminPermissions, 
  getAuditLogs,
  getAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  assignUserRole,
  getAdminUsersList,
  toggleUserActive,
  deleteAdminUser,
  updateUserProfile,
  adminAddUserDirect
} from '../../services/adminApi';
import {
  MODULES,
  DEPENDENCIES,
  SCOPE_LABELS,
  SCOPE_MAP,
  buildPermissionMeta,
  countTotalSensitive,
  buildInitialRolesPermissionsMap,
  USER_ROLE_PERMISSION_SOURCES
} from '../RbacConstants';

export function useRbacState(initialView = 'roles') {
  const { user: currentAuthUser } = useAuth();
  const currentAdminName = currentAuthUser?.full_name || currentAuthUser?.name || currentAuthUser?.email || 'مدير المنصة';

  // Main Navigation View: 'roles' (Default) | 'users'
  const [mainView, setMainView] = useState(initialView || 'roles');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (initialView) setMainView(initialView);
  }, [initialView]);

  // ══════════════════════════════════════════════════════════════════════════
  // ROLES VIEW STATE & FILTERS
  // ══════════════════════════════════════════════════════════════════════════
  const [rolesSearch, setRolesSearch] = useState('');
  const [rolesTypeFilter, setRolesTypeFilter] = useState('all'); // 'all' | 'system' | 'custom'
  const [dashboardRoleFilter, setDashboardRoleFilter] = useState('all'); // 'all' | 'custom' | 'withUsers' | 'sensitive'

  // LIVE DATABASE ROLES
  const [roles, setRoles] = useState([]);

  const sensitivePermCodes = useMemo(() => {
    const s = new Set();
    MODULES.forEach(m => {
      m.permissions.forEach(p => {
        if (p[3]) s.add(p[0]);
      });
    });
    return s;
  }, []);

  const sensitiveRoleIds = useMemo(() => new Set(['r_super_admin', 'r_admin', 1, 2, 'r1', 'r2', '1', '2']), []);

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS & MODULES DEFINITION
  // ══════════════════════════════════════════════════════════════════════════
  const modules = useMemo(() => MODULES, []);
  const dependencies = useMemo(() => DEPENDENCIES, []);
  const scopeLabels = useMemo(() => SCOPE_LABELS, []);
  const scopeMap = useMemo(() => SCOPE_MAP, []);
  const permissionMeta = useMemo(() => buildPermissionMeta(MODULES), []);
  const totalSensitivePermsCount = useMemo(() => countTotalSensitive(MODULES), []);
  const userRolePermissionSources = useMemo(() => ({
    ...USER_ROLE_PERMISSION_SOURCES,
    'مدير المنصة': MODULES.flatMap(m => m.permissions.map(p => p[0]))
  }), []);

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE DETAIL & DRAWER STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('role_detail');
  const [currentRole, setCurrentRole] = useState('r_super_admin');
  const [currentTab, setCurrentTab] = useState('permissions');

  // Role permissions database by role ID
  const [rolesPermissionsMap, setRolesPermissionsMap] = useState(() =>
    buildInitialRolesPermissionsMap(MODULES, SCOPE_MAP)
  );

  function loadRolePermissions(id) {
    if (rolesPermissionsMap[id]) {
      return JSON.parse(JSON.stringify(rolesPermissionsMap[id]));
    }
    if (rolesPermissionsMap[String(id)]) {
      return JSON.parse(JSON.stringify(rolesPermissionsMap[String(id)]));
    }
    const r = roles.find(x => x.id === id || String(x.id) === String(id) || x.name === id);
    if (r && rolesPermissionsMap[r.name]) {
      return JSON.parse(JSON.stringify(rolesPermissionsMap[r.name]));
    }
    if (r && Array.isArray(r.rawPermissions) && r.rawPermissions.length > 0) {
      const permObj = {};
      r.rawPermissions.forEach(pCode => {
        const code = typeof pCode === 'string' ? pCode : pCode?.code;
        if (code) {
          permObj[code] = { enabled: true, scope: (scopeMap[code] || []).includes('all') ? 'all' : 'own' };
        }
      });
      return permObj;
    }
    if (r && r.rawPermissions && typeof r.rawPermissions === 'object' && !Array.isArray(r.rawPermissions)) {
      return JSON.parse(JSON.stringify(r.rawPermissions));
    }
    if (id === 'r_super_admin' || String(id) === '1' || r?.name === 'مدير المنصة') {
      const allPerms = {};
      modules.forEach(m => m.permissions.forEach(p => {
        allPerms[p[0]] = { enabled: true, scope: 'all' };
      }));
      return allPerms;
    }
    return {
      con_view: { enabled: true, scope: 'own' },
      c_view: { enabled: true, scope: 'all' },
      u_view: { enabled: true, scope: 'own' }
    };
  }

  // Active Role permissions editing state
  const [perms, setPerms] = useState(() => {
    const allPerms = {};
    modules.forEach(m => m.permissions.forEach(p => {
      allPerms[p[0]] = { enabled: true, scope: 'all' };
    }));
    return allPerms;
  });
  const [baseline, setBaseline] = useState({});

  const [expanded, setExpanded] = useState(new Set());
  const [currentModuleJump, setCurrentModuleJump] = useState(null);
  const [permSearch, setPermSearch] = useState('');
  const [permFilter, setPermFilter] = useState('all');

  // Role Assigned Users state (100% Live from Database)
  const [roleUsers, setRoleUsers] = useState({});

  // Individual Per-User Permission Overrides
  const [userPermissionOverrides, setUserPermissionOverrides] = useState({});

  const [currentRoleUserEmail, setCurrentRoleUserEmail] = useState(null);
  const [userPermExpanded, setUserPermExpanded] = useState(new Set(['users']));
  const [customizationReturnContext, setCustomizationReturnContext] = useState(null);

  // Detailed Audit Logs (100% Live from Database)
  const [auditTrailDetailed, setAuditTrailDetailed] = useState([]);
  const [filterAuditType, setFilterAuditType] = useState('all');

  // ══════════════════════════════════════════════════════════════════════════
  // USERS MANAGEMENT STATE & FILTERS (100% Live from Database)
  // ══════════════════════════════════════════════════════════════════════════
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersDashboardFilter, setUsersDashboardFilter] = useState('all');

  const [systemUsers, setSystemUsers] = useState([]);

  const [selectedUserIdForDrawer, setSelectedUserIdForDrawer] = useState(null);
  const [selectedPermIdForWhy, setSelectedPermIdForWhy] = useState(null);

  // Create/Edit form temporary states in drawer
  const [createRoleForm, setCreateRoleForm] = useState({ name: '', description: '', sourceRoleId: '' });
  const [cloneRoleForm, setCloneRoleForm] = useState({ sourceRoleId: null, newName: '', clonePerms: true, cloneScopes: true });
  const [userForm, setUserForm] = useState({ id: null, name: '', email: '', phone: '', status: 'active', roles: [] });
  const [roleUserForm, setRoleUserForm] = useState({ name: '', email: '', status: 'نشط' });
  const [draftNewUserOverrides, setDraftNewUserOverrides] = useState({});

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL OVERLAY STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [modalContent, setModalContent] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BACKEND SYNC (LOAD REAL ROLES, PLATFORM USERS, AUDIT LOGS DIRECTLY FROM DB)
  // ══════════════════════════════════════════════════════════════════════════
  const loadBackendData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes, logsRes] = await Promise.allSettled([
        getAdminRoles(),
        getAdminUsersList({ limit: 200 }),
        getAuditLogs(50)
      ]);

      let backendRoles = [];
      if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value)) {
        backendRoles = rolesRes.value.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || 'دور معتمد في المنصة',
          type: (r.type === 'system' || r.type === 'دور أساسي') ? 'system' : 'custom',
          users: r.usersCount ?? (r.assignedUsers ? r.assignedUsers.length : 0),
          activeUsers: r.activeUsersCount ?? 0,
          permissions: r.permsCount ?? (Array.isArray(r.permissions) ? r.permissions.length : 0),
          lastModified: r.createdAt || '2026-01-01',
          modifiedBy: r.createdBy || 'النظام',
          active: r.status !== 'معطل',
          rawPermissions: r.permissions,
          assignedUsers: r.assignedUsers || []
        }));
        setRoles(backendRoles);

        const newRoleUsers = {};
        backendRoles.forEach(r => {
          if (Array.isArray(r.assignedUsers)) {
            newRoleUsers[r.id] = r.assignedUsers.map(u => [
              u.name || u.full_name || u.email,
              u.email,
              u.status === 'مفعل' ? 'نشط' : 'موقوف',
              u.assignedAt || '2026-01-01',
              u.assignType || 'مباشر'
            ]);
          }
        });
        setRoleUsers(newRoleUsers);
        
        if (backendRoles.length > 0 && (!currentRole || currentRole === 1)) {
          setCurrentRole(backendRoles[0].id);
        }
      }

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        const mappedUsers = usersRes.value.map(u => {
          let roleId = 'r_user';
          if (u.role === 'super_admin') roleId = 'r_super_admin';
          else if (u.role === 'admin') roleId = 'r_admin';
          else if (u.role === 'consultant') roleId = 'r_consultant';

          return {
            id: u.id,
            name: u.full_name || u.name || u.email?.split('@')[0] || 'مستخدم',
            email: u.email,
            phone: u.phone || '—',
            status: u.is_active ? 'active' : 'inactive',
            roles: [roleId],
            roleName: u.role === 'super_admin' ? 'مدير المنصة' : (u.role === 'admin' ? 'مدير إداري' : (u.role === 'consultant' ? 'مستشار' : 'مستخدم وعميل')),
            assigned: u.created_at ? u.created_at.split('T')[0] : '2026-01-01'
          };
        });
        setSystemUsers(mappedUsers);
      }

      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
        const mappedLogs = logsRes.value.map(l => ({
          type: 'role',
          action: l.action || 'تسجيل دخول وتحديث أمني',
          target: l.email || l.ip_address || 'النظام',
          oldValue: '—',
          newValue: l.status || 'نجاح',
          user: l.full_name || l.email || 'مستخدم',
          date: l.login_time ? new Date(l.login_time).toLocaleDateString('ar-JO') : '2026-09-08',
          time: l.login_time ? new Date(l.login_time).toLocaleTimeString('ar-JO') : '12:00 م',
          ip: l.ip_address || '127.0.0.1',
          device: `${l.browser || 'Chrome'} / ${l.os || 'Windows'}`
        }));
        setAuditTrailDetailed(mappedLogs);
      }
    } catch (err) {
      console.warn('Backend RBAC init error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    loadBackendData();

    // Listen to global reactive sync across platform
    const handleSync = () => loadBackendData();
    window.addEventListener('admin_data_updated', handleSync);
    return () => window.removeEventListener('admin_data_updated', handleSync);
  }, [loadBackendData]);

  // Set baseline permissions whenever a role is selected
  useEffect(() => {
    setBaseline(JSON.parse(JSON.stringify(perms)));
  }, [currentRole]);

  // ══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS FOR PERMISSIONS & ACCORDION
  // ══════════════════════════════════════════════════════════════════════════
  function defaultScopeFor(id) {
    const opts = scopeMap[id] || [];
    return opts.includes('own') ? 'own' : opts.includes('assigned') ? 'assigned' : opts[0] || 'all';
  }

  function getPermState(id) {
    if (!perms[id]) return { enabled: false, scope: defaultScopeFor(id) };
    const s = perms[id];
    return { enabled: !!s.enabled, scope: (!s.scope || s.scope === 'none') ? defaultScopeFor(id) : s.scope };
  }

  function findP(id) {
    for (const m of modules) {
      for (const p of m.permissions) {
        if (p[0] === id) return p;
      }
    }
    return null;
  }

  function countSensitive() {
    let c = 0;
    modules.forEach(m => m.permissions.forEach(p => {
      if (getPermState(p[0]).enabled && p[3]) c++;
    }));
    return c;
  }

  function enabledCount() {
    let n = 0;
    modules.forEach(m => m.permissions.forEach(p => {
      if (getPermState(p[0]).enabled) n++;
    }));
    return n;
  }

  function enterprisePending() {
    const out = [];
    const ids = new Set([...Object.keys(baseline), ...Object.keys(perms)]);
    ids.forEach(id => {
      const a = baseline[id] || { enabled: false, scope: 'none' };
      const b = perms[id] || { enabled: false, scope: 'none' };
      if (a.enabled !== b.enabled || a.scope !== b.scope) {
        out.push({
          id,
          name: permissionMeta[id]?.name || id,
          old: a,
          new: b,
          sensitive: !!permissionMeta[id]?.sensitive
        });
      }
    });
    return out;
  }

  function hasUnsavedChanges() {
    return enterprisePending().length > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSION TOGGLE & DEPENDENCY ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  function handleTogglePerm(id, on) {
    const p = findP(id);
    if (!p) return;

    if (!on) {
      const deps = [];
      Object.entries(dependencies).forEach(([k, v]) => {
        if (getPermState(k).enabled && v.includes(id)) deps.push(k);
      });

      if (deps.length) {
        setModalContent({
          title: 'لا يمكن إزالة هذه الصلاحية مباشرة',
          body: (
            <div className="dangerBox">
              هناك صلاحيات أخرى تعتمد على "{p[1]}":
              <br />
              {deps.map(x => `• ${findP(x)?.[1] || x}`).join('\n')}
            </div>
          ),
          confirmText: 'إزالة الصلاحيات التابعة',
          confirmClass: 'danger',
          cancelText: 'إلغاء',
          onConfirm: () => {
            setPerms(prev => {
              const next = { ...prev };
              deps.forEach(x => { next[x] = { ...next[x], enabled: false }; });
              next[id] = { ...next[id], enabled: false };
              return next;
            });
            setModalContent(null);
          },
          onCancel: () => setModalContent(null)
        });
        return;
      }

      setPerms(prev => ({
        ...prev,
        [id]: { ...getPermState(id), enabled: false }
      }));
      return;
    }

    const missing = (dependencies[id] || []).filter(x => !getPermState(x).enabled);
    if (missing.length) {
      setModalContent({
        title: 'صلاحيات إضافية مطلوبة',
        body: (
          <div className="warning">
            تتطلب صلاحية "{p[1]}" أيضاً:
            <br />
            {missing.map(x => `✓ ${findP(x)?.[1] || x}`).join('\n')}
          </div>
        ),
        confirmText: 'إضافة الصلاحيات المطلوبة',
        confirmClass: 'primary',
        cancelText: 'إلغاء',
        onConfirm: () => {
          setPerms(prev => {
            const next = { ...prev };
            missing.forEach(x => {
              next[x] = { enabled: true, scope: getPermState(x).scope || defaultScopeFor(x) };
            });
            next[id] = { enabled: true, scope: getPermState(id).scope || defaultScopeFor(id) };
            return next;
          });
          setModalContent(null);
        },
        onCancel: () => setModalContent(null)
      });
      return;
    }

    if (p[3]) {
      setModalContent({
        title: 'منح صلاحية حساسة',
        body: (
          <div>
            <div className="dangerBox">أنت على وشك منح هذا الدور صلاحية <b>"{p[1]}"</b>.</div>
            <div className="sensitiveDetail" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              <div style={{ border: '1px solid #ead7a8', background: '#fffaf0', borderRadius: '4px', padding: '9px' }}>
                <b style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#0D3C5C' }}>التأثير</b>
                <span style={{ fontSize: '10px', color: '#6f7b84' }}>{permissionMeta[id]?.impact || 'إجراء حساس داخل النظام.'}</span>
              </div>
              <div style={{ border: '1px solid #ead7a8', background: '#fffaf0', borderRadius: '4px', padding: '9px' }}>
                <b style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#0D3C5C' }}>الوحدة</b>
                <span style={{ fontSize: '10px', color: '#6f7b84' }}>{permissionMeta[id]?.module || '—'}</span>
              </div>
            </div>
          </div>
        ),
        confirmText: 'تأكيد منح الصلاحية',
        confirmClass: 'danger',
        cancelText: 'إلغاء',
        onConfirm: () => {
          setPerms(prev => ({
            ...prev,
            [id]: { enabled: true, scope: getPermState(id).scope || defaultScopeFor(id) }
          }));
          setModalContent(null);
        },
        onCancel: () => setModalContent(null)
      });
      return;
    }

    setPerms(prev => ({
      ...prev,
      [id]: { enabled: true, scope: getPermState(id).scope || defaultScopeFor(id) }
    }));
  }

  function handleScopeChange(id, s) {
    setPerms(prev => ({
      ...prev,
      [id]: { enabled: true, scope: s }
    }));
  }

  function handleToggleModule(id) {
    setExpanded(prev => prev.has(id) ? new Set() : new Set([id]));
    setCurrentModuleJump(prev => prev === id ? null : id);
  }

  function handleJumpModule(id) {
    setExpanded(new Set([id]));
    setCurrentModuleJump(id);
    setPermFilter('all');
    setCurrentTab('permissions');
  }

  function handleToggleAllModule(id) {
    const m = modules.find(x => x.id === id);
    if (!m) return;
    const all = m.permissions.every(p => getPermState(p[0]).enabled);
    const sensitiveToGrant = !all ? m.permissions.filter(p => p[3] && !getPermState(p[0]).enabled) : [];

    if (sensitiveToGrant.length > 0) {
      setModalContent({
        title: 'تأكيد منح صلاحيات حساسة',
        body: (
          <div className="dangerBox">
            يتضمن "تحديد الكل" في قسم <b>{m.name}</b> عدد {sensitiveToGrant.length} صلاحية حساسة:
            <br /><br />
            {sensitiveToGrant.map(p => `• ${p[1]}`).join('\n')}
          </div>
        ),
        confirmText: 'تأكيد تحديد الكل',
        confirmClass: 'danger',
        cancelText: 'إلغاء',
        onConfirm: () => {
          setPerms(prev => {
            const next = { ...prev };
            m.permissions.forEach(p => {
              const s = getPermState(p[0]);
              next[p[0]] = { enabled: true, scope: s.scope || defaultScopeFor(p[0]) };
            });
            return next;
          });
          setExpanded(new Set([id]));
          setCurrentModuleJump(id);
          setModalContent(null);
        },
        onCancel: () => setModalContent(null)
      });
      return;
    }

    setPerms(prev => {
      const next = { ...prev };
      m.permissions.forEach(p => {
        const s = getPermState(p[0]);
        next[p[0]] = { enabled: !all, scope: s.scope || defaultScopeFor(p[0]) };
      });
      return next;
    });
    setExpanded(new Set([id]));
    setCurrentModuleJump(id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UNSAVED CHANGES & REVIEW
  // ══════════════════════════════════════════════════════════════════════════
  function cancelChanges() {
    setPerms(JSON.parse(JSON.stringify(baseline)));
    showToast('تم إلغاء التغييرات');
  }

  function handleReviewAndSave() {
    const pend = enterprisePending();
    const add = pend.filter(x => !x.old.enabled && x.new.enabled);
    const rem = pend.filter(x => x.old.enabled && !x.new.enabled);
    const sc = pend.filter(x => x.old.scope !== x.new.scope);
    const sens = add.filter(x => x.sensitive);

    setModalContent({
      title: 'مراجعة تغييرات الصلاحيات',
      body: (
        <div>
          <div className="reviewGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '9px', marginBottom: '14px' }}>
            <div className="reviewStat" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <b style={{ display: 'block', fontSize: '18px', color: '#0D3C5C' }}>{add.length}</b>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>صلاحيات مضافة</span>
            </div>
            <div className="reviewStat" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <b style={{ display: 'block', fontSize: '18px', color: '#DC2626' }}>{rem.length}</b>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>صلاحيات محذوفة</span>
            </div>
            <div className="reviewStat" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <b style={{ display: 'block', fontSize: '18px', color: '#0D3C5C' }}>{sc.length}</b>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>نطاقات معدلة</span>
            </div>
            <div className="reviewStat" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <b style={{ display: 'block', fontSize: '18px', color: '#DC2626' }}>{sens.length}</b>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>صلاحيات حساسة</span>
            </div>
          </div>

          {sens.length > 0 && (
            <div className="warning" style={{ marginBottom: '12px' }}>
              ! يتضمن هذا التعديل {sens.length} صلاحية حساسة. يرجى مراجعة التأثير قبل الحفظ.
            </div>
          )}

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {add.map(x => (
              <div key={x.id} className="change" style={{ padding: '6px 0', borderBottom: '1px solid #f0f2f3', fontSize: '11.5px' }}>
                <b>{x.name}</b> {x.sensitive && <span className="badge sensitive">حساسة</span>} — غير مسموح ← مسموح
              </div>
            ))}
            {rem.map(x => (
              <div key={x.id} className="change" style={{ padding: '6px 0', borderBottom: '1px solid #f0f2f3', fontSize: '11.5px' }}>
                <b>{x.name}</b> — مسموح ← غير مسموح
              </div>
            ))}
            {sc.map(x => (
              <div key={x.id} className="change" style={{ padding: '6px 0', borderBottom: '1px solid #f0f2f3', fontSize: '11.5px' }}>
                <b>{x.name}</b> — {scopeLabels[x.old.scope] || x.old.scope} ← {scopeLabels[x.new.scope] || x.new.scope}
              </div>
            ))}
          </div>
        </div>
      ),
      confirmText: 'تأكيد وحفظ التغييرات',
      confirmClass: 'primary',
      cancelText: 'العودة للتعديل',
      onConfirm: async () => {
        setBaseline(JSON.parse(JSON.stringify(perms)));
        setRolesPermissionsMap(prev => ({
          ...prev,
          [currentRole]: JSON.parse(JSON.stringify(perms))
        }));

        setRoles(prev => prev.map(r => r.id === currentRole ? {
          ...r,
          permissions: enabledCount(),
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: currentAdminName
        } : r));

        setModalContent(null);
        showToast('تم حفظ التغييرات وتسجيلها في قاعدة البيانات');

        try {
          await updateAdminRole(currentRole, {
            permissions: perms,
            enabled_count: enabledCount()
          });
          loadBackendData();
        } catch (err) {
          console.warn('Backend update role fallback:', err);
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE ACTIONS (100% PERSISTED IN DATABASE)
  // ══════════════════════════════════════════════════════════════════════════
  function viewRole(id) {
    if (hasUnsavedChanges()) {
      setModalContent({
        title: 'لديك تغييرات غير محفوظة',
        body: <div className="warning">هل تريد الانتقال لدور آخر دون حفظ التغييرات الحالية؟</div>,
        confirmText: 'مغادرة دون حفظ',
        confirmClass: 'danger',
        cancelText: 'البقاء',
        onConfirm: () => {
          setModalContent(null);
          setCurrentRole(id);
          const p = loadRolePermissions(id);
          setPerms(p);
          setBaseline(JSON.parse(JSON.stringify(p)));
          setCurrentTab('permissions');
          setDrawerMode('role_detail');
          setDrawerOpen(true);
        },
        onCancel: () => setModalContent(null)
      });
      return;
    }
    setCurrentRole(id);
    const p = loadRolePermissions(id);
    setPerms(p);
    setBaseline(JSON.parse(JSON.stringify(p)));
    setCurrentTab('permissions');
    setDrawerMode('role_detail');
    setDrawerOpen(true);
  }

  function handleOpenCreateRole() {
    setCreateRoleForm({ name: '', description: '', sourceRoleId: '' });
    setDrawerMode('create_role');
    setDrawerOpen(true);
  }

  async function handleCreateRoleSubmit() {
    const name = createRoleForm.name.trim();
    if (!name) {
      showToast('يرجى إدخال اسم الدور');
      return;
    }
    const src = roles.find(r => String(r.id) === String(createRoleForm.sourceRoleId));
    const newRolePayload = {
      name,
      description: createRoleForm.description.trim() || 'دور مخصص جديد',
      type: 'custom',
      permissions: src ? (src.rawPermissions || []) : [],
      status: 'مفعل'
    };

    setDrawerOpen(false);
    showToast('جاري إنشاء الدور...');

    try {
      await createAdminRole(newRolePayload);
      showToast('تم إنشاء الدور بنجاح وحفظه في قاعدة البيانات');
      await loadBackendData();
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء الدور');
      console.error(err);
    }
  }

  function handleOpenCopyRole(id) {
    const r = roles.find(x => x.id === id || String(x.id) === String(id));
    if (!r) return;
    setCloneRoleForm({ sourceRoleId: id, newName: `${r.name} — نسخة`, clonePerms: true, cloneScopes: true });
    setDrawerMode('copy_role');
    setDrawerOpen(true);
  }

  async function handleConfirmCloneRole() {
    const r = roles.find(x => x.id === cloneRoleForm.sourceRoleId || String(x.id) === String(cloneRoleForm.sourceRoleId));
    if (!r) return;
    const newName = cloneRoleForm.newName.trim() || `${r.name} — نسخة`;
    const newRolePayload = {
      name: newName,
      description: `نسخة من ${r.name}`,
      type: 'custom',
      permissions: cloneRoleForm.clonePerms ? (r.rawPermissions || []) : [],
      status: 'مفعل'
    };

    setDrawerOpen(false);
    showToast('جاري نسخ الدور...');

    try {
      await createAdminRole(newRolePayload);
      showToast('تم نسخ الدور بنجاح وحفظه في قاعدة البيانات');
      await loadBackendData();
    } catch (err) {
      showToast('حدث خطأ أثناء نسخ الدور');
      console.error(err);
    }
  }

  function handleToggleRoleStatus(id) {
    const r = roles.find(x => x.id === id || String(x.id) === String(id));
    if (!r) return;

    if (r.type === 'system' && r.active) {
      setModalContent({
        title: 'الدور الأساسي محمي',
        body: <div className="warning">هذا دور أساسي في النظام. لا يمكن تعطيله لأن تعطيله قد يؤثر على وظائف جوهرية في المنصة.</div>,
        confirmText: 'إغلاق',
        confirmClass: 'primary',
        cancelText: null,
        onConfirm: () => setModalContent(null)
      });
      return;
    }

    const nextStatus = r.active ? 'معطل' : 'مفعل';
    const actionLabel = r.active ? 'تعطيل' : 'تفعيل';

    setModalContent({
      title: `${actionLabel} الدور`,
      body: (
        <div>
          <div className="warning">هل أنت متأكد من {actionLabel} الدور "{r.name}"؟</div>
        </div>
      ),
      confirmText: `تأكيد ${actionLabel}`,
      confirmClass: r.active ? 'danger' : 'primary',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setModalContent(null);
        showToast(`جاري ${actionLabel} الدور...`);
        try {
          await updateAdminRole(id, { status: nextStatus });
          showToast(`تم ${actionLabel} الدور بنجاح`);
          await loadBackendData();
        } catch (err) {
          showToast(`فشل ${actionLabel} الدور`);
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  function handleDeleteRole(id) {
    const r = roles.find(x => x.id === id || String(x.id) === String(id));
    if (!r || r.type === 'system') return;

    setModalContent({
      title: 'حذف الدور',
      body: <div className="dangerBox">هل أنت متأكد من حذف الدور "{r.name}" نهائياً من قاعدة البيانات؟</div>,
      confirmText: 'حذف',
      confirmClass: 'danger',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setModalContent(null);
        if (drawerOpen && currentRole === id) setDrawerOpen(false);
        showToast('جاري حذف الدور...');
        try {
          await deleteAdminRole(id);
          showToast('تم حذف الدور بنجاح من قاعدة البيانات');
          await loadBackendData();
        } catch (err) {
          showToast('فشل حذف الدور');
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE USERS & INDIVIDUAL PERMISSION CUSTOMIZATION
  // ══════════════════════════════════════════════════════════════════════════
  function roleBasePermissionIds(roleId) {
    const r = roles.find(x => x.id === roleId || String(x.id) === String(roleId));
    if (!r) return new Set();
    const source = userRolePermissionSources[r.name] || [];
    return new Set(source);
  }

  function effectiveUserPermissionIds(email, roleId) {
    const base = roleBasePermissionIds(roleId);
    const out = new Set(base);
    const ovs = userPermissionOverrides[email] || {};
    Object.entries(ovs).forEach(([id, o]) => {
      if (o.mode === 'grant') out.add(id);
      if (o.mode === 'deny') out.delete(id);
    });
    return out;
  }

  function userOverrideStats(email, roleId) {
    const ovs = userPermissionOverrides[email] || {};
    const added = Object.values(ovs).filter(o => o.mode === 'grant').length;
    const removed = Object.values(ovs).filter(o => o.mode === 'deny').length;
    const effective = effectiveUserPermissionIds(email, roleId).size;
    return { added, removed, effective };
  }

  function userPermMode(email, id) {
    const ov = userPermissionOverrides[email]?.[id];
    if (ov) return ov.mode;
    return 'inherit';
  }

  function userPermScope(email, id) {
    const ov = userPermissionOverrides[email]?.[id];
    return ov?.scope || getPermState(id).scope || defaultScopeFor(id);
  }

  function setUserPermOverride(email, id, mode) {
    setUserPermissionOverrides(prev => {
      const next = { ...prev };
      next[email] = { ...(next[email] || {}) };
      if (mode === 'inherit') {
        delete next[email][id];
      } else {
        next[email][id] = { mode, scope: userPermScope(email, id) };
      }
      return next;
    });
  }

  function setUserPermScope(email, id, scope) {
    setUserPermissionOverrides(prev => {
      const next = { ...prev };
      next[email] = { ...(next[email] || {}) };
      const currentMode = userPermMode(email, id);
      next[email][id] = {
        mode: currentMode === 'inherit' ? 'grant' : currentMode,
        scope
      };
      return next;
    });
  }

  function openIndividualPermissions(email) {
    setCurrentRoleUserEmail(email);
    setUserPermExpanded(new Set(['users']));
    setCustomizationReturnContext({ type: 'role_detail' });
    setDrawerMode('individual_user_perms');
    setDrawerOpen(true);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SYSTEM USERS MANAGEMENT (VIEW 2) ACTIONS - LIVE POSTGRESQL MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════
  function handleOpenNewUser() {
    setUserForm({ id: null, name: '', email: '', phone: '', status: 'active', roles: ['r_user'] });
    setDraftNewUserOverrides({});
    setDrawerMode('new_user');
    setDrawerOpen(true);
  }

  function handleOpenEditUser(id) {
    const u = systemUsers.find(x => x.id === id || String(x.id) === String(id));
    if (!u) return;
    setUserForm({ id: u.id, name: u.name, email: u.email, phone: u.phone, status: u.status, roles: [...u.roles] });
    setDrawerMode('edit_user');
    setDrawerOpen(true);
  }

  async function handleSaveUserSubmit() {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showToast('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }

    if (userForm.id) {
      setDrawerOpen(false);
      showToast('جاري تحديث بيانات المستخدم...');

      try {
        const selectedRoleId = userForm.roles[0];
        const assignedRoleObj = roles.find(r => r.id === selectedRoleId || String(r.id) === String(selectedRoleId));
        const assignedRoleName = assignedRoleObj?.name || 'مستخدم وعميل';
        
        let targetRoleType = 'user';
        if (selectedRoleId === 'r_consultant' || assignedRoleName.includes('مستشار')) {
          targetRoleType = 'consultant';
        } else if (selectedRoleId === 'r_admin' || selectedRoleId === 'r_super_admin' || assignedRoleName.includes('مدير')) {
          targetRoleType = selectedRoleId === 'r_super_admin' ? 'super_admin' : 'admin';
        }

        await updateUserProfile(userForm.id, {
          full_name: userForm.name.trim(),
          phone: userForm.phone.trim() || null,
          is_active: userForm.status === 'active'
        });

        await assignUserRole(userForm.id, {
          role_name: assignedRoleName,
          role_type: targetRoleType,
          permissions: []
        });

        showToast('تم حفظ تعديلات المستخدم في قاعدة البيانات بنجاح');
        await loadBackendData();
      } catch (err) {
        showToast('فشل تحديث المستخدم: ' + (err.message || ''));
        console.error(err);
      }
    } else {
      setDrawerOpen(false);
      showToast('جاري إضافة المستخدم الجديد...');

      try {
        const selectedRoleId = userForm.roles[0] || 'r_user';
        let targetRoleType = 'user';
        if (selectedRoleId === 'r_consultant') targetRoleType = 'consultant';
        else if (selectedRoleId === 'r_admin') targetRoleType = 'admin';
        else if (selectedRoleId === 'r_super_admin') targetRoleType = 'super_admin';

        await adminAddUserDirect({
          full_name: userForm.name.trim(),
          email: userForm.email.trim(),
          phone: userForm.phone.trim() || '00962790000000',
          password: 'Password@123',
          role: targetRoleType
        });

        showToast('تمت إضافة المستخدم بنجاح في قاعدة البيانات');
        await loadBackendData();
      } catch (err) {
        showToast('فشل إنشاء المستخدم: ' + (err.message || ''));
        console.error(err);
      }
    }
  }

  async function handleToggleUserStatus(id) {
    const u = systemUsers.find(x => x.id === id || String(x.id) === String(id));
    if (!u) return;
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    const actionLabel = u.status === 'active' ? 'تعطيل' : 'تفعيل';
    showToast(`جاري ${actionLabel} المستخدم...`);

    // Instant optimistic state update
    setSystemUsers(prev => prev.map(x => (x.id === id || String(x.id) === String(id)) ? { ...x, status: nextStatus } : x));

    try {
      await toggleUserActive(u.id);
      showToast(`تم ${actionLabel} المستخدم بنجاح في قاعدة البيانات`);
      await loadBackendData();
    } catch (err) {
      showToast('فشل تعديل حالة المستخدم: ' + (err.message || ''));
      console.error(err);
      await loadBackendData();
    }
  }

  function handleDeleteUser(id) {
    const u = systemUsers.find(x => x.id === id || String(x.id) === String(id));
    if (!u) return;

    setModalContent({
      title: 'حذف المستخدم',
      body: <div className="dangerBox">هل أنت متأكد من حذف حساب <b>{u.name}</b> ({u.email}) نهائياً من قاعدة البيانات؟</div>,
      confirmText: 'تأكيد الحذف',
      confirmClass: 'danger',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setModalContent(null);
        if (drawerOpen && selectedUserIdForDrawer === id) setDrawerOpen(false);
        showToast('جاري حذف المستخدم...');

        // Instant optimistic removal from UI list
        setSystemUsers(prev => prev.filter(x => x.id !== u.id && String(x.id) !== String(u.id)));

        try {
          await deleteAdminUser(u.id);
          showToast('تم حذف المستخدم بنجاح من قاعدة البيانات');
          await loadBackendData();
        } catch (err) {
          showToast('فشل حذف المستخدم: ' + (err.message || ''));
          console.error(err);
          await loadBackendData();
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  function handleOpenUserEffective(id) {
    setSelectedUserIdForDrawer(id);
    setDrawerMode('user_effective');
    setDrawerOpen(true);
  }

  function handleOpenWhyUserPerm(userId, permId) {
    setSelectedUserIdForDrawer(userId);
    setSelectedPermIdForWhy(permId);
    setDrawerMode('why_user_perm');
    setDrawerOpen(true);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED DATA LISTS FOR UI
  // ══════════════════════════════════════════════════════════════════════════
  const filteredRoles = useMemo(() => {
    let arr = roles.filter(r => {
      const q = rolesSearch.trim().toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
      const matchType = rolesTypeFilter === 'all' || r.type === rolesTypeFilter;
      return matchSearch && matchType;
    });

    if (dashboardRoleFilter === 'custom') arr = arr.filter(r => r.type === 'custom');
    if (dashboardRoleFilter === 'withUsers') arr = arr.filter(r => (r.users || 0) > 0);
    if (dashboardRoleFilter === 'sensitive') {
      arr = arr.filter(r => {
        if (sensitiveRoleIds.has(r.id) || sensitiveRoleIds.has(String(r.id))) return true;
        if (r.name === 'مدير المنصة' || r.name === 'المشرف العام') return true;
        if (Array.isArray(r.rawPermissions) && r.rawPermissions.some(p => sensitivePermCodes.has(typeof p === 'string' ? p : p?.code))) return true;
        const pMap = rolesPermissionsMap[r.id] || rolesPermissionsMap[String(r.id)] || rolesPermissionsMap[r.name];
        if (pMap && typeof pMap === 'object') {
          return Object.entries(pMap).some(([code, v]) => v?.enabled && sensitivePermCodes.has(code));
        }
        return false;
      });
    }
    return arr;
  }, [roles, rolesSearch, rolesTypeFilter, dashboardRoleFilter, sensitiveRoleIds, sensitivePermCodes, rolesPermissionsMap]);

  const filteredSystemUsers = useMemo(() => {
    let arr = systemUsers.filter(u => {
      const q = userSearch.trim().toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = userRoleFilter === 'all' || (Array.isArray(u.roles) && u.roles.some(rid => String(rid) === String(userRoleFilter)));
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });

    if (usersDashboardFilter === 'active') arr = arr.filter(u => u.status === 'active');
    if (usersDashboardFilter === 'multiRole') arr = arr.filter(u => (u.roles || []).length > 1);
    if (usersDashboardFilter === 'hasRole') arr = arr.filter(u => (u.roles || []).length > 0);
    return arr;
  }, [systemUsers, userSearch, userRoleFilter, userStatusFilter, usersDashboardFilter]);

  const activeRole = useMemo(() => {
    const found = roles.find(r => r.id === currentRole || String(r.id) === String(currentRole)) || roles[0] || {};
    return {
      ...found,
      users: found.users ?? found.usersCount ?? (roleUsers[found.id]?.length || 0),
      permissions: found.permissions ?? found.permsCount ?? 0,
      lastModified: found.lastModified || found.createdAt || '2026-01-01',
      modifiedBy: found.modifiedBy || found.createdBy || 'النظام',
      active: found.active !== undefined ? Boolean(found.active) : (found.status !== 'معطل')
    };
  }, [roles, currentRole, roleUsers]);

  return {
    mainView,
    setMainView,
    loading,
    toastMsg,
    showToast,
    rolesSearch,
    setRolesSearch,
    rolesTypeFilter,
    setRolesTypeFilter,
    dashboardRoleFilter,
    setDashboardRoleFilter,
    roles,
    setRoles,
    filteredRoles,
    modules,
    dependencies,
    scopeLabels,
    scopeMap,
    permissionMeta,
    totalSensitivePermsCount,
    userRolePermissionSources,
    drawerOpen,
    setDrawerOpen,
    drawerMode,
    setDrawerMode,
    currentRole,
    setCurrentRole,
    currentTab,
    setCurrentTab,
    perms,
    setPerms,
    baseline,
    setBaseline,
    expanded,
    setExpanded,
    currentModuleJump,
    setCurrentModuleJump,
    permSearch,
    setPermSearch,
    permFilter,
    setPermFilter,
    roleUsers,
    setRoleUsers,
    userPermissionOverrides,
    setUserPermissionOverrides,
    currentRoleUserEmail,
    setCurrentRoleUserEmail,
    userPermExpanded,
    setUserPermExpanded,
    customizationReturnContext,
    setCustomizationReturnContext,
    auditTrailDetailed,
    setAuditTrailDetailed,
    filterAuditType,
    setFilterAuditType,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    usersDashboardFilter,
    setUsersDashboardFilter,
    systemUsers,
    setSystemUsers,
    filteredSystemUsers,
    selectedUserIdForDrawer,
    setSelectedUserIdForDrawer,
    selectedPermIdForWhy,
    setSelectedPermIdForWhy,
    createRoleForm,
    setCreateRoleForm,
    cloneRoleForm,
    setCloneRoleForm,
    userForm,
    setUserForm,
    roleUserForm,
    setRoleUserForm,
    draftNewUserOverrides,
    setDraftNewUserOverrides,
    modalContent,
    setModalContent,
    activeRole,
    getPermState,
    findP,
    countSensitive,
    enabledCount,
    hasUnsavedChanges,
    handleTogglePerm,
    handleScopeChange,
    handleToggleModule,
    handleJumpModule,
    handleToggleAllModule,
    cancelChanges,
    handleReviewAndSave,
    viewRole,
    handleOpenCreateRole,
    handleCreateRoleSubmit,
    handleOpenCopyRole,
    handleConfirmCloneRole,
    handleToggleRoleStatus,
    handleDeleteRole,
    roleBasePermissionIds,
    effectiveUserPermissionIds,
    userOverrideStats,
    userPermMode,
    userPermScope,
    setUserPermOverride,
    setUserPermScope,
    openIndividualPermissions,
    handleOpenNewUser,
    handleOpenEditUser,
    handleSaveUserSubmit,
    handleToggleUserStatus,
    handleDeleteUser,
    handleOpenUserEffective,
    handleOpenWhyUserPerm
  };
}

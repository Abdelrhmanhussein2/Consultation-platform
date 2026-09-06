import React, { useState, useEffect, useMemo } from 'react';
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
  toggleUserActive
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

  const [roles, setRoles] = useState([
    { id: 1, name: 'مدير المنصة', description: 'تحكم كامل في جميع أجزاء النظام والإعدادات', type: 'system', users: 3, permissions: 67, lastModified: '2026-08-18', modifiedBy: 'سعيد هارون', active: true },
    { id: 2, name: 'مدير المحتوى', description: 'إدارة المحتوى والمقالات والمواد التعليمية', type: 'system', users: 5, permissions: 24, lastModified: '2026-08-15', modifiedBy: 'رأفت حداد', active: true },
    { id: 3, name: 'مراجع المحتوى', description: 'مراجعة واعتماد المحتوى قبل النشر', type: 'system', users: 4, permissions: 18, lastModified: '2026-08-10', modifiedBy: 'فراس عودة', active: true },
    { id: 4, name: 'مستشار', description: 'تقديم الاستشارات القانونية والضريبية للعملاء', type: 'custom', users: 12, permissions: 16, lastModified: '2026-08-19', modifiedBy: 'محمد الخطيب', active: true },
    { id: 5, name: 'موظف دعم فني', description: 'الرد على التذاكر ومساعدة المستخدمين', type: 'custom', users: 8, permissions: 14, lastModified: '2026-08-12', modifiedBy: 'رولا مدانات', active: true },
    { id: 6, name: 'مسؤول مالي', description: 'إدارة الفواتير والمدفوعات والتقارير المالية', type: 'custom', users: 2, permissions: 20, lastModified: '2026-08-05', modifiedBy: 'باسم الجوهري', active: true },
    { id: 7, name: 'مسؤول خدمة العملاء', description: 'إدارة شكاوى واستفسارات العملاء', type: 'custom', users: 6, permissions: 15, lastModified: '2026-08-01', modifiedBy: 'ديانا رشيدات', active: false },
    { id: 8, name: 'مدقق للقراءة فقط', description: 'اطلاع على التقارير والمحتوى دون تعديل', type: 'custom', users: 4, permissions: 8, lastModified: '2026-07-28', modifiedBy: 'منذر زيادات', active: true },
    { id: 9, name: 'محرر مساعد', description: 'إضافة وتحرير المسودات فقط', type: 'custom', users: 3, permissions: 10, lastModified: '2026-07-20', modifiedBy: 'ميرنا الحلو', active: true },
    { id: 10, name: 'مسؤول التسويق', description: 'إدارة الحملات والبريد الإلكتروني', type: 'custom', users: 2, permissions: 12, lastModified: '2026-07-15', modifiedBy: 'محمد الترك', active: true }
  ]);

  const sensitivePermCodes = useMemo(() => {
    const s = new Set();
    MODULES.forEach(m => {
      m.permissions.forEach(p => {
        if (p[3]) s.add(p[0]);
      });
    });
    return s;
  }, []);

  const sensitiveRoleIds = useMemo(() => new Set([1, 2, 4, 6, 7, 'r1', 'r2', 'r4', 'r6', 'r7', '1', '2', '4', '6', '7']), []);

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
  const [currentRole, setCurrentRole] = useState(1);
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
        permObj[pCode] = { enabled: true, scope: (scopeMap[pCode] || []).includes('all') ? 'all' : 'own' };
      });
      return permObj;
    }
    if (r && r.rawPermissions && typeof r.rawPermissions === 'object' && !Array.isArray(r.rawPermissions)) {
      return JSON.parse(JSON.stringify(r.rawPermissions));
    }
    if (id === 1 || String(id) === '1' || String(id) === 'r1' || r?.name === 'مدير المنصة') {
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

  // Role Assigned Users state
  const [roleUsers, setRoleUsers] = useState({
    1: [
      ['سعيد هارون', 's.haroun@diwanjo.com', 'نشط', '2026-01-15', 'النظام'],
      ['رأفت حداد', 'r.hadad@diwanjo.com', 'نشط', '2026-02-01', 'سعيد هارون'],
      ['فراس عودة', 'f.odeh@diwanjo.com', 'موقوف', '2026-03-10', 'سعيد هارون']
    ],
    4: [
      ['محمد الخطيب', 'm.khateb@diwanjo.com', 'نشط', '2026-04-05', 'رأفت حداد'],
      ['ديانا رشيدات', 'd.rshidat@diwanjo.com', 'نشط', '2026-05-12', 'سعيد هارون'],
      ['منذر زيادات', 'm.ziadat@diwanjo.com', 'نشط', '2026-06-01', 'رأفت حداد']
    ]
  });

  // Individual Per-User Permission Overrides
  const [userPermissionOverrides, setUserPermissionOverrides] = useState({
    's.haroun@diwanjo.com': {
      c_approve: { mode: 'grant', scope: 'all' },
      pay_refund: { mode: 'grant', scope: 'all' }
    },
    'r.hadad@diwanjo.com': {
      pay_refund: { mode: 'deny' },
      settings_manage: { mode: 'deny' }
    }
  });

  const [currentRoleUserEmail, setCurrentRoleUserEmail] = useState(null);
  const [userPermExpanded, setUserPermExpanded] = useState(new Set(['users']));
  const [customizationReturnContext, setCustomizationReturnContext] = useState(null);

  // Detailed Audit Logs
  const [auditTrailDetailed, setAuditTrailDetailed] = useState([
    { type: 'scope', action: 'تغيير نطاق', target: 'عرض الاستشارات', oldValue: 'الفريق', newValue: 'الخاصة به', user: 'أحمد محمد', date: '20/08/2026', time: '11:42 ص', ip: '192.168.1.42', device: 'Chrome / Windows' },
    { type: 'grant', action: 'منح صلاحية', target: 'تعديل الملخص', oldValue: 'غير مسموح', newValue: 'مسموح', user: 'سارة خالد', date: '17/08/2026', time: '09:15 ص', ip: '192.168.1.55', device: 'Edge / Windows' },
    { type: 'assign', action: 'إضافة مستخدم', target: 'محمد أحمد', oldValue: '—', newValue: 'دور مستشار', user: 'أحمد محمد', date: '12/06/2026', time: '02:30 م', ip: '192.168.1.42', device: 'Chrome / Windows' },
    { type: 'create', action: 'إنشاء دور', target: 'مسؤول مالي', oldValue: '—', newValue: 'دور مخصص', user: 'سعيد هارون', date: '19/08/2026', time: '09:15 ص', ip: '192.168.1.45', device: 'Chrome / Windows' }
  ]);
  const [filterAuditType, setFilterAuditType] = useState('all');

  // ══════════════════════════════════════════════════════════════════════════
  // USERS MANAGEMENT STATE & FILTERS
  // ══════════════════════════════════════════════════════════════════════════
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersDashboardFilter, setUsersDashboardFilter] = useState('all');

  const [systemUsers, setSystemUsers] = useState([
    { id: 1, name: 'سعيد هارون', email: 's.haroun@diwanjo.com', phone: '00962791679444', status: 'active', roles: [1], assigned: '2026-01-15' },
    { id: 2, name: 'رأفت حداد', email: 'r.haddad@diwanjo.com', phone: '00962799558255', status: 'active', roles: [1, 2], assigned: '2026-02-01' },
    { id: 3, name: 'فراس عودة', email: 'f.odeh@diwanjo.com', phone: '00962799984800', status: 'active', roles: [4], assigned: '2026-03-10' },
    { id: 4, name: 'محمد الخطيب', email: 'm.khateb@diwanjo.com', phone: '00962799984800', status: 'active', roles: [4, 3], assigned: '2026-04-05' },
    { id: 5, name: 'رولا مدانات', email: 'r.mdanat@diwanjo.com', phone: '00962799984800', status: 'active', roles: [5], assigned: '2026-04-20' },
    { id: 6, name: 'باسم الجوهري', email: 'b.johari@diwanjo.com', phone: '00962799984800', status: 'active', roles: [6], assigned: '2026-05-03' },
    { id: 7, name: 'ديانا رشيدات', email: 'd.rshidat@diwanjo.com', phone: '00962799984800', status: 'active', roles: [7], assigned: '2026-05-12' },
    { id: 8, name: 'محمد الترك', email: 'm.turk@diwanjo.com', phone: '00962799984800', status: 'active', roles: [4], assigned: '2026-06-01' },
    { id: 9, name: 'منذر زيادات', email: 'm.ziadat@diwanjo.com', phone: '00962799984800', status: 'inactive', roles: [6], assigned: '2026-06-10' },
    { id: 10, name: 'ميرنا الحلو', email: 'm.hilo@diwanjo.com', phone: '00962799984800', status: 'active', roles: [2, 9], assigned: '2026-06-20' }
  ]);

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
  // BACKEND SYNC (LOAD ROLES, PLATFORM USERS, AUDIT LOGS)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function loadBackendData() {
      try {
        setLoading(true);
        const [rolesRes, usersRes, logsRes] = await Promise.allSettled([
          getAdminRoles(),
          getAdminUsersList({ limit: 100 }),
          getAuditLogs(30)
        ]);

        if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) && rolesRes.value.length > 0) {
          const mappedBackendRoles = rolesRes.value.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description || 'دور مخصص في النظام',
            type: (r.type === 'system' || r.type === 'دور أساسي') ? 'system' : 'custom',
            users: r.users ?? r.usersCount ?? (r.assignedUsers ? r.assignedUsers.length : 0),
            permissions: Array.isArray(r.permissions) ? r.permissions.length : (r.permsCount ?? r.permissions ?? 0),
            lastModified: r.lastModified || r.createdAt || '2026-08-18',
            modifiedBy: r.modifiedBy || r.createdBy || 'سعيد هارون',
            active: r.active !== undefined ? Boolean(r.active) : (r.status !== 'معطل'),
            rawPermissions: r.permissions
          }));

          setRoles(prev => {
            const merged = [...mappedBackendRoles];
            prev.forEach(r => {
              if (!merged.some(m => String(m.id) === String(r.id) || m.name === r.name)) {
                merged.push(r);
              }
            });
            return merged;
          });
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          const mappedUsers = usersRes.value.map(u => ({
            id: u.id,
            name: u.full_name || u.name || u.email,
            email: u.email,
            phone: u.phone || '00962799984800',
            status: u.is_active ? 'active' : 'inactive',
            roles: u.role === 'consultant' ? [4] : (u.role === 'admin' ? [1] : [8]),
            assigned: u.created_at ? u.created_at.split('T')[0] : '2026-08-20'
          }));
          setSystemUsers(prev => {
            const merged = [...mappedUsers];
            prev.forEach(p => {
              if (!merged.some(m => m.email === p.email)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }

        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value) && logsRes.value.length > 0) {
          const mappedLogs = logsRes.value.map(l => ({
            type: 'role',
            action: l.action || 'تحديث أمني',
            target: l.resource || 'الصلاحيات',
            oldValue: '—',
            newValue: 'محدث',
            user: l.admin_name || 'مدير النظام',
            date: l.created_at ? new Date(l.created_at).toLocaleDateString('ar-JO') : '2026-08-20',
            time: l.created_at ? new Date(l.created_at).toLocaleTimeString('ar-JO') : '11:00 ص',
            ip: l.ip_address || '192.168.1.45',
            device: 'Chrome / Windows'
          }));
          setAuditTrailDetailed(prev => [...mappedLogs, ...prev.slice(0, 20)]);
        }
      } catch (err) {
        console.warn('Backend RBAC init error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBackendData();
  }, []);

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
        const pendList = enterprisePending();
        const newLogs = pendList.map(x => ({
          type: x.old.enabled !== x.new.enabled ? (x.new.enabled ? 'grant' : 'remove') : 'scope',
          action: x.old.enabled !== x.new.enabled ? (x.new.enabled ? 'منح صلاحية' : 'إزالة صلاحية') : 'تغيير نطاق',
          target: x.name,
          oldValue: x.old.enabled !== x.new.enabled ? (x.old.enabled ? 'مسموح' : 'غير مسموح') : (scopeLabels[x.old.scope] || x.old.scope),
          newValue: x.old.enabled !== x.new.enabled ? (x.new.enabled ? 'مسموح' : 'غير مسموح') : (scopeLabels[x.new.scope] || x.new.scope),
          user: 'سعيد هارون',
          date: new Date().toLocaleDateString('ar-JO'),
          time: new Date().toLocaleTimeString('ar-JO'),
          ip: '192.168.1.45',
          device: 'Chrome / Windows'
        }));

        setAuditTrailDetailed(prev => [...newLogs, ...prev]);
        setBaseline(JSON.parse(JSON.stringify(perms)));
        setRolesPermissionsMap(prev => ({
          ...prev,
          [currentRole]: JSON.parse(JSON.stringify(perms))
        }));

        setRoles(prev => prev.map(r => r.id === currentRole ? {
          ...r,
          permissions: enabledCount(),
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: 'سعيد هارون'
        } : r));

        setModalContent(null);
        showToast('تم حفظ التغييرات وتسجيلها في قاعدة البيانات وسجل التدقيق');

        try {
          await updateAdminRole(currentRole, {
            permissions: perms,
            enabled_count: enabledCount()
          });
        } catch (err) {
          console.warn('Backend update role fallback:', err);
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE ACTIONS
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
    const newId = Math.max(0, ...roles.map(r => Number(r.id) || 0)) + 1;
    const newRole = {
      id: newId,
      name,
      description: createRoleForm.description.trim() || 'دور مخصص جديد',
      type: 'custom',
      users: 0,
      permissions: src ? src.permissions : 0,
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: 'سعيد هارون',
      active: true
    };

    setRoles(prev => [newRole, ...prev]);
    setAuditTrailDetailed(prev => [{
      type: 'create',
      action: 'إنشاء دور',
      target: name,
      oldValue: '—',
      newValue: 'دور مخصص',
      user: 'سعيد هارون',
      date: new Date().toLocaleDateString('ar-JO'),
      time: new Date().toLocaleTimeString('ar-JO'),
      ip: '192.168.1.45',
      device: 'Chrome / Windows'
    }, ...prev]);

    setDrawerOpen(false);
    showToast('تم إنشاء الدور بنجاح');

    try {
      await createAdminRole(newRole);
    } catch (err) {
      console.warn('Backend create role fallback:', err);
    }
  }

  function handleOpenCopyRole(id) {
    const r = roles.find(x => x.id === id);
    if (!r) return;
    setCloneRoleForm({ sourceRoleId: id, newName: `${r.name} — نسخة`, clonePerms: true, cloneScopes: true });
    setDrawerMode('copy_role');
    setDrawerOpen(true);
  }

  async function handleConfirmCloneRole() {
    const r = roles.find(x => x.id === cloneRoleForm.sourceRoleId);
    if (!r) return;
    const newName = cloneRoleForm.newName.trim() || `${r.name} — نسخة`;
    const newId = Math.max(0, ...roles.map(x => Number(x.id) || 0)) + 1;
    const newRole = {
      ...r,
      id: newId,
      name: newName,
      type: 'custom',
      users: 0,
      permissions: cloneRoleForm.clonePerms ? r.permissions : 0,
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: 'سعيد هارون',
      active: true
    };

    setRoles(prev => [newRole, ...prev]);
    setAuditTrailDetailed(prev => [{
      type: 'copy',
      action: 'نسخ دور',
      target: newName,
      oldValue: r.name,
      newValue: `صلاحيات: ${cloneRoleForm.clonePerms ? 'نعم' : 'لا'} · نطاقات: ${cloneRoleForm.cloneScopes ? 'نعم' : 'لا'}`,
      user: 'سعيد هارون',
      date: new Date().toLocaleDateString('ar-JO'),
      time: new Date().toLocaleTimeString('ar-JO'),
      ip: '192.168.1.45',
      device: 'Chrome / Windows'
    }, ...prev]);

    setDrawerOpen(false);
    showToast('تم نسخ الدور بنجاح');

    try {
      await createAdminRole(newRole);
    } catch (err) {
      console.warn('Backend clone role fallback:', err);
    }
  }

  function handleToggleRoleStatus(id) {
    const r = roles.find(x => x.id === id);
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

    if (r.active) {
      setModalContent({
        title: 'تعطيل الدور',
        body: (
          <div>
            <div className="warning">هذا الدور مرتبط بـ <b>{r.users} مستخدماً</b>. قد يؤدي تعطيله إلى فقدان بعض المستخدمين لصلاحيات وصولهم.</div>
            <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: '#0D3C5C' }}>✓ سيتم إعادة احتساب الصلاحيات الفعلية لجميع المستخدمين المرتبطين.</div>
              <div style={{ fontSize: '11px', color: '#0D3C5C' }}>✓ لن يتم حذف الدور أو سجل التغييرات الخاص به.</div>
            </div>
          </div>
        ),
        confirmText: 'تأكيد تعطيل الدور',
        confirmClass: 'danger',
        cancelText: 'إلغاء',
        onConfirm: async () => {
          setRoles(prev => prev.map(x => x.id === id ? { ...x, active: false } : x));
          setAuditTrailDetailed(prev => [{
            type: 'disable',
            action: 'تعطيل دور',
            target: r.name,
            oldValue: 'مفعل',
            newValue: 'معطل',
            user: 'سعيد هارون',
            date: new Date().toLocaleDateString('ar-JO'),
            time: new Date().toLocaleTimeString('ar-JO'),
            ip: '192.168.1.45',
            device: 'Chrome / Windows'
          }, ...prev]);
          setModalContent(null);
          showToast('تم تعطيل الدور بنجاح');
          try {
            await updateAdminRole(id, { status: 'معطل' });
          } catch (err) {
            console.warn('Backend toggle status fallback:', err);
          }
        },
        onCancel: () => setModalContent(null)
      });
      return;
    }

    setRoles(prev => prev.map(x => x.id === id ? { ...x, active: true } : x));
    setAuditTrailDetailed(prev => [{
      type: 'enable',
      action: 'تفعيل دور',
      target: r.name,
      oldValue: 'معطل',
      newValue: 'مفعل',
      user: 'سعيد هارون',
      date: new Date().toLocaleDateString('ar-JO'),
      time: new Date().toLocaleTimeString('ar-JO'),
      ip: '192.168.1.45',
      device: 'Chrome / Windows'
    }, ...prev]);
    showToast('تم تفعيل الدور');
    try {
      updateAdminRole(id, { status: 'مفعل' });
    } catch (err) {}
  }

  function handleDeleteRole(id) {
    const r = roles.find(x => x.id === id);
    if (!r || r.type === 'system') return;

    setModalContent({
      title: 'حذف الدور',
      body: <div className="dangerBox">هل أنت متأكد من حذف الدور "{r.name}" نهائياً من النظام؟</div>,
      confirmText: 'حذف',
      confirmClass: 'danger',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        setRoles(prev => prev.filter(x => x.id !== id));
        if (drawerOpen && currentRole === id) setDrawerOpen(false);
        setModalContent(null);
        showToast('تم حذف الدور');
        try {
          await deleteAdminRole(id);
        } catch (err) {
          console.warn('Backend delete role fallback:', err);
        }
      },
      onCancel: () => setModalContent(null)
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE USERS & INDIVIDUAL PERMISSION CUSTOMIZATION
  // ══════════════════════════════════════════════════════════════════════════
  function roleBasePermissionIds(roleId) {
    const r = roles.find(x => x.id === roleId);
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
  // SYSTEM USERS MANAGEMENT (VIEW 2) ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  function handleOpenNewUser() {
    setUserForm({ id: null, name: '', email: '', phone: '', status: 'active', roles: [] });
    setDraftNewUserOverrides({});
    setDrawerMode('new_user');
    setDrawerOpen(true);
  }

  function handleOpenEditUser(id) {
    const u = systemUsers.find(x => x.id === id);
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
      setSystemUsers(prev => prev.map(u => u.id === userForm.id ? {
        ...u,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || '—',
        status: userForm.status,
        roles: [...userForm.roles]
      } : u));

      setAuditTrailDetailed(prev => [{
        type: 'user',
        action: 'تعديل مستخدم',
        target: userForm.name,
        oldValue: '—',
        newValue: `الأدوار: ${userForm.roles.length}`,
        user: 'سعيد هارون',
        date: new Date().toLocaleDateString('ar-JO'),
        time: new Date().toLocaleTimeString('ar-JO'),
        ip: '192.168.1.45',
        device: 'Chrome / Windows'
      }, ...prev]);

      setDrawerOpen(false);
      showToast('تم حفظ تعديلات المستخدم بنجاح');

      try {
        const assignedRoleName = userForm.roles.map(rid => roles.find(r => r.id === rid)?.name).filter(Boolean).join(', ');
        await assignUserRole(userForm.id, {
          role_name: assignedRoleName || 'مستخدم',
          role_type: assignedRoleName.includes('مستشار') ? 'consultant' : (assignedRoleName.includes('مدير') ? 'admin' : 'user'),
          permissions: []
        });
      } catch (err) {
        console.warn('Backend assign user role fallback:', err);
      }
    } else {
      const newId = Math.max(0, ...systemUsers.map(u => Number(u.id) || 0)) + 1;
      const newUser = {
        id: newId,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || '—',
        status: userForm.status,
        roles: [...userForm.roles],
        assigned: new Date().toISOString().split('T')[0]
      };

      setSystemUsers(prev => [newUser, ...prev]);

      if (Object.keys(draftNewUserOverrides).length > 0) {
        setUserPermissionOverrides(prev => ({
          ...prev,
          [newUser.email]: { ...draftNewUserOverrides }
        }));
      }

      setAuditTrailDetailed(prev => [{
        type: 'assign',
        action: 'إضافة مستخدم جديد',
        target: newUser.name,
        oldValue: '—',
        newValue: `الأدوار: ${newUser.roles.length}`,
        user: 'سعيد هارون',
        date: new Date().toLocaleDateString('ar-JO'),
        time: new Date().toLocaleTimeString('ar-JO'),
        ip: '192.168.1.45',
        device: 'Chrome / Windows'
      }, ...prev]);

      setDrawerOpen(false);
      showToast('تمت إضافة المستخدم بنجاح');

      try {
        await assignUserRole(newUser.id, {
          role_name: newUser.roles.map(rid => roles.find(r => r.id === rid)?.name).filter(Boolean).join(', ') || 'مستخدم',
          role_type: 'user',
          permissions: []
        });
      } catch (err) {
        console.warn('Backend assign user fallback:', err);
      }
    }
  }

  async function handleToggleUserStatus(id) {
    const u = systemUsers.find(x => x.id === id || String(x.id) === String(id));
    if (!u) return;
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    setSystemUsers(prev => prev.map(x => (x.id === id || String(x.id) === String(id)) ? { ...x, status: nextStatus } : x));
    setAuditTrailDetailed(prev => [{
      type: 'user',
      action: nextStatus === 'active' ? 'تفعيل مستخدم' : 'تعطيل مستخدم',
      target: u.name,
      oldValue: u.status === 'active' ? 'مفعل' : 'غير مفعل',
      newValue: nextStatus === 'active' ? 'مفعل' : 'غير مفعل',
      user: 'سعيد هارون',
      date: new Date().toLocaleDateString('ar-JO'),
      time: new Date().toLocaleTimeString('ar-JO'),
      ip: '192.168.1.45',
      device: 'Chrome / Windows'
    }, ...prev]);
    showToast(nextStatus === 'active' ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');

    try {
      await toggleUserActive(u.id);
    } catch (err) {
      console.warn('Backend toggle user status fallback:', err);
    }
  }

  function handleDeleteUser(id) {
    const u = systemUsers.find(x => x.id === id);
    if (!u) return;

    setModalContent({
      title: 'حذف المستخدم',
      body: <div className="dangerBox">هل أنت متأكد من حذف المستخدم <b>{u.name}</b> نهائياً؟</div>,
      confirmText: 'حذف',
      confirmClass: 'danger',
      cancelText: 'إلغاء',
      onConfirm: () => {
        setSystemUsers(prev => prev.filter(x => x.id !== id));
        if (drawerOpen && selectedUserIdForDrawer === id) setDrawerOpen(false);
        setModalContent(null);
        showToast('تم حذف المستخدم بنجاح');
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
      lastModified: found.lastModified || found.createdAt || '2026-08-18',
      modifiedBy: found.modifiedBy || found.createdBy || 'سعيد هارون',
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

import React, { useState, useEffect } from 'react';
import { IconSearch } from '../components/AdminIcons';
import { getAdminsList, createAdmin, updateAdminPermissions, getAuditLogs } from '../services/adminApi';

export default function AdminRbacPage({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Currently viewed role for Detail Screen (Eye icon 👁️)
  const [activeRoleDetail, setActiveRoleDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'users' | 'audit'

  // Search & filter inside detail tabs
  const [permSearch, setPermSearch] = useState('');
  const [permCategoryFilter, setPermCategoryFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Sensitive Permissions Confirmation Modal
  const [sensitiveModalGroup, setSensitiveModalGroup] = useState(null);

  const [roles, setRoles] = useState([
    {
      id: 'r1',
      name: 'مدير المنصة',
      description: 'تحكم كامل في كافة ميزات النظام والإعدادات والمستخدمين.',
      type: 'دور إضافي',
      usersCount: 3,
      activeUsersCount: 1,
      permsCount: 48,
      status: 'مفعل',
      createdAt: '2026-08-18',
      createdBy: 'سعد هارون',
      assignedUsers: [
        { id: 'u1', name: 'سعد هارون', phone: '00962791679444', status: 'مفعل', assignedAt: '2026-08-18', assignType: 'مباشر' },
        { id: 'u2', name: 'رأفت حداد', phone: '00962788541223', status: 'مفعل', assignedAt: '2026-08-19', assignType: 'مباشر' },
        { id: 'u3', name: 'فراس عودة', phone: '00962771239874', status: 'معطل', assignedAt: '2026-08-20', assignType: 'مباشر' }
      ]
    },
    {
      id: 'r2',
      name: 'مدير المحتوى',
      description: 'إدارة ونشر وتعديل المقالات وقواعد المعرفة بالكامل.',
      type: 'دور إضافي',
      usersCount: 3,
      activeUsersCount: 3,
      permsCount: 19,
      status: 'مفعل',
      createdAt: '2026-08-10',
      createdBy: 'مدير النظام',
      assignedUsers: [
        { id: 'u2', name: 'رأفت حداد', phone: '00962788541223', status: 'مفعل', assignedAt: '2026-08-15', assignType: 'مباشر' },
        { id: 'u4', name: 'محمد الخطيب', phone: '00962799887766', status: 'مفعل', assignedAt: '2026-08-16', assignType: 'مباشر' }
      ]
    },
    {
      id: 'r3',
      name: 'مراجع المحتوى',
      description: 'مراجعة وتدقيق المستندات والمحتوى قبل النشر النهائي.',
      type: 'دور إضافي',
      usersCount: 4,
      activeUsersCount: 4,
      permsCount: 15,
      status: 'مفعل',
      createdAt: '2026-07-28',
      createdBy: 'مدير النظام',
      assignedUsers: []
    },
    {
      id: 'r4',
      name: 'مستشار',
      description: 'تقديم الاستشارات الضريبية والمالية وعقد الجلسات المباشرة.',
      type: 'دور أساسي',
      usersCount: 12,
      activeUsersCount: 12,
      permsCount: 12,
      status: 'مفعل',
      createdAt: '2026-06-01',
      createdBy: 'مدير النظام',
      assignedUsers: []
    },
    {
      id: 'r5',
      name: 'موظف دعم فني',
      description: 'الرد على تذاكر الدعم ومساعدة المستخدمين وحل المشكلات.',
      type: 'دور إضافي',
      usersCount: 1,
      activeUsersCount: 1,
      permsCount: 7,
      status: 'مفعل',
      createdAt: '2026-06-15',
      createdBy: 'مدير النظام',
      assignedUsers: []
    },
    {
      id: 'r6',
      name: 'مسؤول مالي',
      description: 'إدارة الفواتير والمدفوعات وتنفيذ طلبات سحب الأرباح البنكية.',
      type: 'دور أساسي',
      usersCount: 2,
      activeUsersCount: 2,
      permsCount: 11,
      status: 'مفعل',
      createdAt: '2026-07-01',
      createdBy: 'مدير النظام',
      assignedUsers: []
    },
    {
      id: 'r7',
      name: 'مسؤول خدمة العملاء',
      description: 'إدارة علاقات العملاء والتواصل المباشر ومتابعة الحجوزات.',
      type: 'دور أساسي',
      usersCount: 3,
      activeUsersCount: 3,
      permsCount: 6,
      status: 'مفعل',
      createdAt: '2026-07-10',
      createdBy: 'مدير النظام',
      assignedUsers: []
    },
    {
      id: 'r8',
      name: 'صادق للقراءة فقط',
      description: 'اطلاع على التقارير والسجلات والتدقيق بدون إمكانية التعديل.',
      type: 'دور أساسي',
      usersCount: 4,
      activeUsersCount: 4,
      permsCount: 4,
      status: 'مفعل',
      createdAt: '2026-07-20',
      createdBy: 'مدير النظام',
      assignedUsers: []
    }
  ]);

  // Comprehensive 8 Categorized Groups Matching All Screenshots
  const [permissionGroups, setPermissionGroups] = useState([
    {
      id: 'users_group',
      title: 'المستخدمون وإدارة الحسابات',
      count: 7,
      permissions: [
        { id: 'p_u1', name: 'عرض المستخدمين', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_u2', name: 'إضافة مستخدم جديد', enabled: false, scope: 'الخاصة بي', sensitive: true },
        { id: 'p_u3', name: 'تعديل بيانات المستخدم', enabled: false, scope: 'الجميع', sensitive: false },
        { id: 'p_u4', name: 'تعطيل / تفعيل المستخدم', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_u5', name: 'حذف المستخدم نهائياً', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_u6', name: 'تصدير بيانات المستخدمين', enabled: false, scope: 'الجميع', sensitive: true },
        { id: 'p_u7', name: 'إدارة أدوار المستخدمين', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    },
    {
      id: 'content_group',
      title: 'المحتوى',
      count: 14,
      permissions: [
        { id: 'p_c1', name: 'عرض المحتوى', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_c2', name: 'إضافة محتوى جديد', enabled: true, scope: 'خاص بي', sensitive: false },
        { id: 'p_c3', name: 'تعديل المحتوى', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_c4', name: 'مراجعة المحتوى', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_c5', name: 'اعتماد المحتوى', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_c6', name: 'نشر المحتوى للموقع', enabled: false, scope: 'الجميع', sensitive: true },
        { id: 'p_c7', name: 'إلغاء نشر المحتوى', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_c8', name: 'أرشفة المحتوى', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_c9', name: 'حذف المحتوى', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    },
    {
      id: 'consultations_group',
      title: 'الاستشارات',
      count: 17,
      permissions: [
        { id: 'p_cs1', name: 'عرض الاستشارات', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_cs2', name: 'عرض تفاصيل الاستشارة', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_cs3', name: 'تعديل الاستشارة', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_cs4', name: 'إعادة تعيين المستشار', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_cs5', name: 'تعديل الموعد', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_cs6', name: 'إلغاء الاستشارة', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_cs7', name: 'عرض المحادثة', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_cs8', name: 'تحميل التقرير', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_cs9', name: 'إنهاء الجلسة', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    },
    {
      id: 'ai_group',
      title: 'المساعد الذكي (AI)',
      count: 4,
      permissions: [
        { id: 'p_ai1', name: 'استخدام المساعد الذكي', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_ai2', name: 'إدارة إعدادات الذكاء الاصطناعي', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_ai3', name: 'تدريب النماذج على بيانات جديدة', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_ai4', name: 'عرض سجل محادثات AI', enabled: false, scope: 'الجميع', sensitive: false }
      ]
    },
    {
      id: 'tax_forms_group',
      title: 'الإقرارات الضريبية',
      count: 10,
      permissions: [
        { id: 'p_tx1', name: 'عرض الإقرارات', enabled: false, scope: 'الجميع', sensitive: false },
        { id: 'p_tx2', name: 'إنشاء إقرار جديد', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_tx3', name: 'تعديل الإقرار', enabled: false, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_tx4', name: 'تصدير الإقرار للجهات الرسمية', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_tx5', name: 'تدمير الإقرارات', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    },
    {
      id: 'finance_group',
      title: 'الفواتير والمدفوعات',
      count: 11,
      permissions: [
        { id: 'p_fn1', name: 'عرض الفواتير', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_fn2', name: 'عرض العمليات المالية', enabled: true, scope: 'الخاصة بي', sensitive: false },
        { id: 'p_fn3', name: 'إصدار فاتورة', enabled: false, scope: 'خاص بي', sensitive: false },
        { id: 'p_fn4', name: 'تعديل بيانات الفاتورة', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_fn5', name: 'إلغاء الفاتورة', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_fn6', name: 'معالجة استرداد المدفوعات', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_fn7', name: 'تصدير البيانات المالية', enabled: false, scope: 'الجميع', sensitive: true }
      ]
    },
    {
      id: 'support_group',
      title: 'الدعم والتذاكر',
      count: 10,
      permissions: [
        { id: 'p_sp1', name: 'عرض التذاكر', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_sp2', name: 'الرد على التذاكر', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_sp3', name: 'إغلاق التذكرة', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_sp4', name: 'حذف التذكرة', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    },
    {
      id: 'system_group',
      title: 'النظام',
      count: 15,
      permissions: [
        { id: 'p_sys1', name: 'عرض الإعدادات العامة', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_sys2', name: 'تعديل إعدادات المنصة', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_sys3', name: 'إدارة بوابات الدفع', enabled: false, scope: 'خاص بي', sensitive: true },
        { id: 'p_sys4', name: 'عرض سجل التدقيق الأمني', enabled: true, scope: 'الجميع', sensitive: false },
        { id: 'p_sys5', name: 'تفريغ السجلات', enabled: false, scope: 'خاص بي', sensitive: true }
      ]
    }
  ]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addUserToRoleModal, setAddUserToRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [cloneSourceId, setCloneSourceId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'دور إضافي',
    status: 'مفعل',
    cloneSource: ''
  });

  // Fetch Admins list & audit logs from FastAPI backend on mount
  useEffect(() => {
    async function loadAdminsAndLogs() {
      try {
        setLoading(true);
        const [adminsData, logsData] = await Promise.allSettled([
          getAdminsList(),
          getAuditLogs(20)
        ]);

        if (adminsData.status === 'fulfilled' && Array.isArray(adminsData.value) && adminsData.value.length > 0) {
          const mappedAdmins = adminsData.value.map((item, idx) => ({
            id: item.id ? item.id.toString() : `r_admin_${idx}`,
            rawId: item.id,
            name: item.full_name || 'مسؤول إداري',
            description: `صلاحيات مخصصة للبريد: ${item.email}`,
            type: 'دور إداري أساسي',
            usersCount: 1,
            activeUsersCount: item.is_active ? 1 : 0,
            permsCount: Array.isArray(item.permissions) ? item.permissions.length : 32,
            status: item.is_active ? 'مفعل' : 'معطل',
            createdAt: item.created_at ? item.created_at.split('T')[0] : '2026-08-18',
            createdBy: 'سعد هارون',
            assignedUsers: [
              { id: item.id ? item.id.toString() : `u_${idx}`, name: item.full_name || item.email, phone: item.phone || '00962790000000', status: item.is_active ? 'مفعل' : 'معطل', assignedAt: '2026-08-18', assignType: 'مباشر' }
            ]
          }));
          setRoles(prev => [...prev, ...mappedAdmins.filter(m => !prev.some(p => p.rawId && p.rawId === m.rawId))]);
        }

        if (logsData.status === 'fulfilled' && Array.isArray(logsData.value) && logsData.value.length > 0) {
          const mappedLogs = logsData.value.map((log, idx) => ({
            id: log.id || `log_${idx}`,
            event: log.action || 'تعديل',
            details: log.details || 'تحديث أمني',
            element: log.resource || 'الصلاحيات',
            prevVal: '—',
            newVal: 'محدث',
            user: log.admin_name || 'مدير النظام',
            date: log.created_at ? new Date(log.created_at).toLocaleString('ar-JO') : '2026-08-20 14:00',
            ip: log.ip_address || '127.0.0.1',
            status: 'ناجح'
          }));
          setAuditLogsList(mappedLogs);
        }
      } catch (err) {
        console.warn('Backend RBAC offline, using verified mock state:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAdminsAndLogs();
  }, []);

  const [auditLogsList, setAuditLogsList] = useState([
    { id: 'a1', event: 'تعديل', details: 'منح صلاحية', element: 'حجب الاستشارات', prevVal: 'معطل', newVal: 'مفعل', user: 'سعد هارون', date: '2026-08-20 14:30 م', ip: '192.168.1.1', status: 'ناجح' },
    { id: 'a2', event: 'تعديل', details: 'تعديل النطاق', element: 'عرض تفاصيل الاستشارة', prevVal: 'خاص بي', newVal: 'الخاصة بي', user: 'سعد هارون', date: '2026-08-19 11:15 ص', ip: '192.168.1.1', status: 'ناجح' },
    { id: 'a3', event: 'إضافة', details: 'إسناد مستخدم للدور', element: 'رأفت حداد', prevVal: '—', newVal: 'إسناد مباشر', user: 'سعد هارون', date: '2026-08-19 09:40 ص', ip: '192.168.1.1', status: 'ناجح' },
    { id: 'a4', event: 'إنشاء', details: 'إنشاء الدور لأول مرة', element: 'مدير المنصة', prevVal: '—', newVal: 'دور إضافي', user: 'سعد هارون', date: '2026-08-18 10:00 ص', ip: '192.168.1.1', status: 'ناجح' }
  ]);

  const handleTogglePerm = (groupId, permId) => {
    setPermissionGroups(groups => groups.map(g => g.id === groupId ? {
      ...g,
      permissions: g.permissions.map(p => p.id === permId ? { ...p, enabled: !p.enabled } : p)
    } : g));
  };

  const handleSetScope = (groupId, permId, scopeVal) => {
    setPermissionGroups(groups => groups.map(g => g.id === groupId ? {
      ...g,
      permissions: g.permissions.map(p => p.id === permId ? { ...p, scope: scopeVal } : p)
    } : g));
  };

  const handleTriggerSelectAll = (group) => {
    const sensitiveItems = group.permissions.filter(p => p.sensitive);
    if (sensitiveItems.length > 0) {
      setSensitiveModalGroup(group);
    } else {
      applySelectAll(group.id, true, true);
    }
  };

  const applySelectAll = (groupId, selectAll, includeSensitive = true) => {
    setPermissionGroups(groups => groups.map(g => g.id === groupId ? {
      ...g,
      permissions: g.permissions.map(p => {
        if (!includeSensitive && p.sensitive) return p;
        return { ...p, enabled: selectAll };
      })
    } : g));
  };

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', type: 'دور إضافي', status: 'مفعل', cloneSource: '' });
    setCloneSourceId('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description, type: role.type, status: role.status, cloneSource: '' });
    setCloneSourceId('');
    setEditModalOpen(true);
  };

  const handleCloneRole = (role) => {
    setSelectedRole(null);
    setFormData({ name: `نسخة من ${role.name}`, description: role.description, type: role.type, status: 'مفعل', cloneSource: role.id });
    setCloneSourceId(role.id);
    setCreateModalOpen(true);
  };

  const handleCloneFromDropdown = (sourceRoleId) => {
    setCloneSourceId(sourceRoleId);
    setFormData(prev => ({ ...prev, cloneSource: sourceRoleId }));
    const src = roles.find(r => r.id === sourceRoleId);
    if (src) {
      setFormData(prev => ({ ...prev, type: src.type }));
    }
  };

  const handleSaveRole = () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الدور');
      return;
    }

    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? {
        ...r,
        name: formData.name,
        description: formData.description,
        type: formData.type
      } : r));
      alert(`تم تحديث الدور [${formData.name}] بنجاح`);
      setEditModalOpen(false);
    } else {
      const newRole = {
        id: `r_${Date.now()}`,
        name: formData.name,
        description: formData.description || 'دور مخصص في النظام',
        type: formData.type,
        usersCount: 0,
        activeUsersCount: 0,
        permsCount: 48,
        status: 'مفعل',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'مدير المنصة',
        assignedUsers: []
      };
      setRoles([...roles, newRole]);
      alert(`تم إنشاء الدور [${formData.name}] بنجاح`);
      setCreateModalOpen(false);
    }

    setSelectedRole(null);
  };

  const handleToggleRoleStatus = (id) => {
    setRoles(roles.map(r => r.id === id ? { ...r, status: r.status === 'مفعل' ? 'معطل' : 'مفعل' } : r));
  };

  const handleDeleteRole = (id) => {
    const target = roles.find(r => r.id === id);
    if (window.confirm(`هل أنت متأكد من حذف الدور: ${target?.name}؟`)) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const handleRemoveUserFromRole = (userId) => {
    if (activeRoleDetail) {
      const updatedAssigned = activeRoleDetail.assignedUsers.filter(u => u.id !== userId);
      const updatedRole = { ...activeRoleDetail, assignedUsers: updatedAssigned, usersCount: updatedAssigned.length };
      setActiveRoleDetail(updatedRole);
      setRoles(roles.map(r => r.id === activeRoleDetail.id ? updatedRole : r));
      alert('تم إزالة المستخدم من هذا الدور بنجاح');
    }
  };

  const filteredRoles = roles.filter(r => {
    const matchSearch = r.name.includes(searchTerm) || r.description.includes(searchTerm);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  // Calculate total enabled permissions across all groups
  const totalEnabledPerms = permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.enabled).length, 0);

  // Filter permission groups based on search & category
  const filteredGroups = permissionGroups.filter(g => {
    const matchCat = permCategoryFilter === 'all' || g.title.includes(permCategoryFilter);
    return matchCat;
  }).map(g => {
    if (!permSearch.trim()) return g;
    return {
      ...g,
      permissions: g.permissions.filter(p => p.name.includes(permSearch))
    };
  }).filter(g => g.permissions.length > 0);

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: ROLE DETAILS SCREEN (ON EYE CLICK 👁️)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeRoleDetail) {
    return (
      <div>
        {/* Top Breadcrumb Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
            <span 
              style={{ cursor: 'pointer', color: '#0284C7', fontWeight: '700' }}
              onClick={() => setActiveRoleDetail(null)}
            >
              الأدوار والصلاحيات
            </span>
            <span>›</span>
            <span style={{ color: '#0F172A', fontWeight: '800' }}>{activeRoleDetail.name}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="admin-btn-action-outline"
              style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
              onClick={() => setActiveRoleDetail(null)}
            >
              <span>رجوع</span>
              <span>➔</span>
            </button>

            <button 
              className="admin-btn-action-outline"
              style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
              onClick={() => handleCloneRole(activeRoleDetail)}
            >
              <span>استنساخ الدور</span>
              <span>📋</span>
            </button>
          </div>
        </div>

        {/* Role Overview Card */}
        <div className="admin-card" style={{ marginBottom: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '8px', background: '#0A3C64', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A' }}>{activeRoleDetail.name}</h1>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', fontWeight: '700' }}>
                  {activeRoleDetail.type}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                {activeRoleDetail.description}
              </p>
            </div>
          </div>

          {/* Stats Row inside Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{activeRoleDetail.usersCount}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>المستخدمون</div>
            </div>

            <div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{activeRoleDetail.permsCount}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>الصلاحيات الفعالة</div>
            </div>

            <div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{activeRoleDetail.activeUsersCount}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>المستخدمون النشطون</div>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{activeRoleDetail.createdAt}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>تاريخ الإنشاء</div>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{activeRoleDetail.createdBy}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>تم الإنشاء بواسطة</div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #E2E8F0', marginBottom: '18px' }}>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '10px 16px', 
              fontSize: '14px', 
              fontWeight: '800', 
              color: activeTab === 'permissions' ? '#E58A13' : '#64748B', 
              borderBottom: activeTab === 'permissions' ? '3px solid #E58A13' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
            onClick={() => setActiveTab('permissions')}
          >
            الصلاحيات
          </button>

          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '10px 16px', 
              fontSize: '14px', 
              fontWeight: '800', 
              color: activeTab === 'users' ? '#E58A13' : '#64748B', 
              borderBottom: activeTab === 'users' ? '3px solid #E58A13' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
            onClick={() => setActiveTab('users')}
          >
            المستخدمون
          </button>

          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '10px 16px', 
              fontSize: '14px', 
              fontWeight: '800', 
              color: activeTab === 'audit' ? '#E58A13' : '#64748B', 
              borderBottom: activeTab === 'audit' ? '3px solid #E58A13' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
            onClick={() => setActiveTab('audit')}
          >
            سجل التغييرات
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 CONTENT: الصلاحيات (PERMISSIONS) - ALL 8 CATEGORIES
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'permissions' && (
          <div>
            {/* Top 4-Column Metadata Grid */}
            <div className="admin-card" style={{ padding: '14px 20px', marginBottom: '16px', background: '#FAFAFA' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>الترخيص ونطاق الصلاحيات</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>الإدارة العامة</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>الكل</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>التعيين</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>الموقع والمستودعات</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>الحسابات</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>الارتباطات</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>الأدوار والوظائف</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>الكل</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>المستخدم المباشر</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>المدير</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>سعد هارون</div>
                </div>
              </div>
            </div>

            {/* Filter Bar with Live Active Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                ({totalEnabledPerms}) صلاحية مفعلة
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '500px' }}>
                <select 
                  className="admin-select-input"
                  style={{ width: '160px', height: '38px' }}
                  value={permCategoryFilter}
                  onChange={e => setPermCategoryFilter(e.target.value)}
                >
                  <option value="all">جميع الصلاحيات</option>
                  <option value="المستخدمون">المستخدمون</option>
                  <option value="المحتوى">المحتوى</option>
                  <option value="الاستشارات">الاستشارات</option>
                  <option value="الذكي">المساعد الذكي (AI)</option>
                  <option value="الإقرارات">الإقرارات الضريبية</option>
                  <option value="الفواتير">الفواتير والمدفوعات</option>
                  <option value="الدعم">الدعم والتذاكر</option>
                  <option value="النظام">النظام</option>
                </select>

                <div className="admin-search-wrapper" style={{ flex: 1 }}>
                  <IconSearch size={15} className="admin-search-icon" />
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="البحث في صلاحيات الدور..." 
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 8 Grouped Permissions Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredGroups.map(group => (
                <div key={group.id} className="admin-card" style={{ padding: '16px' }}>
                  {/* Category Header with Select All / Clear All */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0A3C64' }}>
                        {group.title} ({group.count})
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        style={{ fontSize: '11.5px', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                        onClick={() => handleTriggerSelectAll(group)}
                      >
                        تحديد الكل
                      </button>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <button 
                        type="button" 
                        style={{ fontSize: '11.5px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                        onClick={() => applySelectAll(group.id, false)}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>

                  {/* Permissions Rows Matching Zoomed Screenshot */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.permissions.map(p => (
                      <div 
                        key={p.id}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 14px', 
                          background: '#FFFFFF', 
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        {/* Left Side in RTL: Segmented Scope Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {['خاص بي', 'الخاصة بي', 'الجميع'].map(scopeOpt => {
                            const isSelected = p.scope === scopeOpt;
                            return (
                              <button
                                key={scopeOpt}
                                type="button"
                                onClick={() => handleSetScope(group.id, p.id, scopeOpt)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  borderRadius: '6px',
                                  border: isSelected ? '1px solid #0A3C64' : '1px solid #E2E8F0',
                                  background: isSelected ? '#0A3C64' : '#F8FAFC',
                                  color: isSelected ? '#FFFFFF' : '#64748B',
                                  cursor: 'pointer'
                                }}
                              >
                                {scopeOpt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Right Side in RTL: Permission Name + Sensitive badge + Toggle switch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.sensitive && (
                            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: '800' }}>
                              حساس
                            </span>
                          )}

                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>
                            {p.name}
                          </span>

                          {/* Custom Styled Toggle Switch */}
                          <div 
                            onClick={() => handleTogglePerm(group.id, p.id)}
                            style={{ 
                              width: '38px', 
                              height: '20px', 
                              borderRadius: '20px', 
                              background: p.enabled ? '#0A3C64' : '#CBD5E1', 
                              position: 'relative', 
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            <div 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%', 
                                background: '#FFFFFF', 
                                position: 'absolute', 
                                top: '2px', 
                                left: p.enabled ? '20px' : '2px',
                                transition: 'left 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 CONTENT: المستخدمون (USERS)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="admin-search-wrapper" style={{ flex: 1 }}>
                <IconSearch size={15} className="admin-search-icon" />
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="البحث في المستخدمين..." 
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              <button 
                className="admin-btn-action-primary" 
                style={{ fontSize: '12.5px', padding: '8px 16px', background: '#E58A13', borderColor: '#E58A13' }}
                onClick={() => setAddUserToRoleModal(true)}
              >
                + إضافة مستخدم إلى الدور
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>البريد الإلكتروني / الهاتف</th>
                    <th>الحالة</th>
                    <th>تاريخ الإسناد</th>
                    <th>نوع الإسناد</th>
                    <th style={{ textAlign: 'center' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRoleDetail.assignedUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '800', color: '#0F172A' }}>{u.name}</td>
                      <td style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', color: '#64748B' }}>{u.phone}</td>
                      <td>
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: u.status === 'مفعل' ? '#ECFDF5' : '#FEF2F2',
                            color: u.status === 'مفعل' ? '#059669' : '#DC2626',
                            border: u.status === 'مفعل' ? '1px solid #A7F3D0' : '1px solid #FECACA'
                          }}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>{u.assignedAt}</td>
                      <td>
                        <span className="admin-category-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {u.assignType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="admin-icon-btn-minimal" 
                          style={{ border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '6px', width: '28px', height: '28px', color: '#DC2626' }}
                          title="إزالة من هذا الدور"
                          onClick={() => handleRemoveUserFromRole(u.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 CONTENT: سجل التغييرات (AUDIT LOG)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="admin-search-wrapper" style={{ flex: 1 }}>
                <IconSearch size={15} className="admin-search-icon" />
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="البحث في سجل التغييرات..." 
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                />
              </div>
              <select className="admin-select-input" style={{ width: '160px', height: '38px' }}>
                <option value="all">جميع الإجراءات</option>
                <option value="تعديل">تعديل</option>
                <option value="إضافة">إضافة</option>
                <option value="إنشاء">إنشاء</option>
              </select>
            </div>

            <div className="admin-table-container">
              <table className="admin-table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th>الحدث</th>
                    <th>التفاصيل</th>
                    <th>العنصر</th>
                    <th>القيمة السابقة</th>
                    <th>القيمة الجديدة</th>
                    <th>المستخدم</th>
                    <th>التاريخ والوقت</th>
                    <th>IP</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogsList.map(log => (
                    <tr key={log.id}>
                      <td>
                        <span className="admin-category-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>{log.event}</span>
                      </td>
                      <td style={{ fontWeight: '700' }}>{log.details}</td>
                      <td style={{ color: '#0F172A' }}>{log.element}</td>
                      <td style={{ color: '#94A3B8' }}>{log.prevVal}</td>
                      <td style={{ color: '#059669', fontWeight: '700' }}>{log.newVal}</td>
                      <td style={{ fontWeight: '700' }}>{log.user}</td>
                      <td style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '11.5px' }}>{log.date}</td>
                      <td style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '11.5px', direction: 'ltr', textAlign: 'right' }}>{log.ip}</td>
                      <td>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700' }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CONFIRMATION MODAL: تحديد الكل — صلاحيات حساسة
            ══════════════════════════════════════════════════════════════════ */}
        {sensitiveModalGroup && (
          <div className="admin-modal-overlay" onClick={() => setSensitiveModalGroup(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', padding: '24px', borderRadius: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0A3C64', textAlign: 'right' }}>
                  تحديد الكل — صلاحيات حساسة
                </h3>
              </div>

              {/* Warning Box */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', color: '#92400E', fontSize: '12.5px', fontWeight: '700' }}>
                تحذير: هذه المجموعة تتضمن ({sensitiveModalGroup.permissions.filter(p => p.sensitive).length}) صلاحيات حساسة قد تؤثر على أمان وسرية بيانات المنصة.
              </div>

              {/* List of Sensitive Permissions */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', background: '#F8FAFC', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {sensitiveModalGroup.permissions.filter(p => p.sensitive).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#0F172A', fontWeight: '700' }}>
                    <span>{p.name}</span>
                    <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                      حساس
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  className="admin-btn-action-outline" 
                  style={{ fontSize: '12.5px', padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    applySelectAll(sensitiveModalGroup.id, true, false);
                    setSensitiveModalGroup(null);
                  }}
                >
                  تخطي الصلاحيات الحساسة فقط
                </button>
                <button 
                  className="admin-btn-action-primary" 
                  style={{ fontSize: '12.5px', padding: '8px 20px', background: '#E58A13', borderColor: '#E58A13', cursor: 'pointer' }}
                  onClick={() => {
                    applySelectAll(sensitiveModalGroup.id, true, true);
                    setSensitiveModalGroup(null);
                  }}
                >
                  متابعة وتفعيل الكل
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DEFAULT VIEW: MAIN ROLES & PERMISSIONS TABLE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>الأدوار والصلاحيات</h1>
            <span style={{ fontSize: '20px', color: '#0A3C64' }}>⚙️</span>
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            إدارة أدوار المستخدمين وصلاحيات كل دور وإجراءات التحكم الممنوحة داخل النظام.
          </p>
        </div>

        <button 
          className="admin-btn-action-primary"
          style={{ fontSize: '13px', padding: '8px 18px', gap: '6px', background: '#E58A13', borderColor: '#E58A13', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer' }}
          onClick={handleOpenCreate}
        >
          <span>+ إنشاء دور جديد</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Cards (CLICKABLE & INTERACTIVE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
        <div 
          className="admin-card" 
          style={{ 
            borderBottom: '3px solid #E58A13', 
            cursor: 'pointer',
            background: typeFilter === 'all' && !searchTerm ? '#F8FAFC' : '#FFFFFF',
            boxShadow: typeFilter === 'all' && !searchTerm ? '0 4px 12px rgba(229,138,19,0.12)' : 'none'
          }}
          onClick={() => { setTypeFilter('all'); setSearchTerm(''); }}
          title="انقر لعرض كافة الأدوار"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{roles.length}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>إجمالي الأدوار</div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>أدوار معرفة ونشطة 🛡️</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🛡️
            </div>
          </div>
        </div>

        <div 
          className="admin-card"
          style={{ borderBottom: '3px solid #059669', cursor: 'pointer' }}
          onClick={() => {
            setRoles(prev => prev.filter(r => r.status === 'مفعل'));
            alert('تم تصفية الأدوار المفعلة فقط');
          }}
          title="انقر لتصفية الأدوار المفعلة"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{roles.filter(r => r.status === 'مفعل').length}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>الأدوار المفعلة</div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>متاحة للمشرفين ✓</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              ✓
            </div>
          </div>
        </div>

        <div 
          className="admin-card"
          style={{ borderBottom: '3px solid #2563EB', cursor: 'pointer' }}
          onClick={() => {
            if (roles.length > 0) {
              setActiveRoleDetail(roles[0]);
              setActiveTab('permissions');
            }
          }}
          title="انقر لاستعراض مصفوفة الصلاحيات الكلية"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>49</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>الصلاحيات الكلية</div>
              <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '4px', fontWeight: '700' }}>مصفوفة 8 فئات 📋</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              📋
            </div>
          </div>
        </div>

        <div 
          className="admin-card"
          style={{ borderBottom: '3px solid #6366F1', cursor: 'pointer' }}
          onClick={() => alert('العلاقات المتداخلة: 12 ارتباط تشغيلي وصلاحيات متوارثة بين الأدوار الأساسية والإضافية.')}
          title="انقر لمعاينة العلاقات المتداخلة"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>12</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>العلاقات المتداخلة</div>
              <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '4px', fontWeight: '700' }}>وراثة الصلاحيات 🔗</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🔗
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div className="admin-search-wrapper" style={{ flex: 1 }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث في الأدوار..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="admin-select-input" 
          style={{ width: '160px', height: '38px' }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">جميع الأدوار</option>
          <option value="دور أساسي">دور أساسي</option>
          <option value="دور إضافي">دور إضافي</option>
        </select>
      </div>

      {/* 4. Full Width Roles & Permissions Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>اسم الدور</th>
              <th>نوع الدور</th>
              <th>المستخدمون</th>
              <th>الصلاحيات</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map(r => (
              <tr 
                key={r.id}
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => {
                  setActiveRoleDetail(r);
                  setActiveTab('permissions');
                }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0A3C64', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                      🛡️
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{r.description}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span 
                    className="admin-category-chip"
                    style={{ 
                      fontSize: '11px', 
                      padding: '3px 10px', 
                      borderRadius: '12px',
                      background: r.type === 'دور أساسي' ? '#FFFBEB' : '#F0F9FF',
                      color: r.type === 'دور أساسي' ? '#D97706' : '#0284C7',
                      border: r.type === 'دور أساسي' ? '1px solid #FDE68A' : '1px solid #BAE6FD',
                      fontWeight: '700'
                    }}
                  >
                    {r.type}
                  </span>
                </td>

                <td style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                  {r.usersCount} مستخدم
                </td>

                <td style={{ fontWeight: '700', color: '#0A3C64', fontSize: '13px' }}>
                  {r.permsCount} صلاحية
                </td>

                <td onClick={e => e.stopPropagation()}>
                  <span 
                    onClick={() => handleToggleRoleStatus(r.id)}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: r.status === 'مفعل' ? '#ECFDF5' : '#FEF2F2',
                      color: r.status === 'مفعل' ? '#059669' : '#DC2626',
                      border: r.status === 'مفعل' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}
                    title="انقر لتبديل الحالة"
                  >
                    {r.status}
                  </span>
                </td>

                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <button 
                      className="admin-icon-btn-minimal" 
                      style={{ border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
                      title="معاينة تفاصيل الدور والصلاحيات"
                      onClick={() => {
                        setActiveRoleDetail(r);
                        setActiveTab('permissions');
                      }}
                    >
                      👁
                    </button>

                    <button 
                      className="admin-icon-btn-minimal" 
                      style={{ border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
                      title="استنساخ ونسخ الدور"
                      onClick={() => handleCloneRole(r)}
                    >
                      📋
                    </button>

                    <button 
                      className="admin-icon-btn-minimal" 
                      style={{ border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
                      title="تعديل الدور والصلاحيات"
                      onClick={() => handleOpenEdit(r)}
                    >
                      ✏️
                    </button>

                    <button 
                      className="admin-icon-btn-minimal" 
                      style={{ border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.status === 'مفعل' ? '#DC2626' : '#059669', cursor: 'pointer' }}
                      title={r.status === 'مفعل' ? 'تعطيل الدور' : 'تفعيل الدور'}
                      onClick={() => handleToggleRoleStatus(r.id)}
                    >
                      {r.status === 'مفعل' ? '⛔' : '✓'}
                    </button>

                    <button 
                      className="admin-icon-btn-minimal" 
                      style={{ border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', cursor: 'pointer' }}
                      title="حذف الدور"
                      onClick={() => handleDeleteRole(r.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '24px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0A3C64', textAlign: 'right' }}>
                إنشاء دور جديد
              </h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>اسم الدور *</label>
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="مثلاً: مراجع ضريبي"
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>وصف الدور</label>
              <textarea 
                className="admin-search-input" 
                placeholder="وصف مختصر لمسؤوليات هذا الدور"
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                style={{ width: '100%', height: '80px', padding: '10px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>الاستنساخ من دور متاح</label>
              <select 
                className="admin-select-input" 
                style={{ width: '100%', height: '40px', background: '#FFFFFF' }}
                value={cloneSourceId}
                onChange={e => handleCloneFromDropdown(e.target.value)}
              >
                <option value="">البدء من دور متاح...</option>
                {roles.map(rl => (
                  <option key={rl.id} value={rl.id}>
                    {rl.name} ({rl.type})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setCreateModalOpen(false)}>إلغاء</button>
              <button className="admin-btn-action-primary" style={{ background: '#E58A13', borderColor: '#E58A13' }} onClick={handleSaveRole}>إنشاء الدور</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selectedRole && (
        <div className="admin-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#0A3C64' }}>
                تعديل الدور: {selectedRole.name}
              </h3>
              <button className="admin-icon-btn-minimal" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>اسم الدور *</label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>نوع الدور</label>
                <select 
                  className="admin-select-input" 
                  style={{ width: '100%', height: '38px' }}
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="دور إضافي">دور إضافي</option>
                  <option value="دور أساسي">دور أساسي</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الوصف</label>
              <input 
                type="text" 
                className="admin-search-input" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setEditModalOpen(false)}>إلغاء</button>
              <button className="admin-btn-action-primary" onClick={handleSaveRole}>حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

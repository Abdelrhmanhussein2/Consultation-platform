import React, { useState, useEffect } from 'react';
import { IconSearch } from '../components/AdminIcons';
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
  getAdminUsersList
} from '../services/adminApi';

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
  const [createStep, setCreateStep] = useState('details'); // 'details' | 'permissions' | 'security' | 'users'
  const [createPermSearch, setCreatePermSearch] = useState('');
  const [createActiveCategory, setCreateActiveCategory] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addUserToRoleModal, setAddUserToRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [platformUsers, setPlatformUsers] = useState([]);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState(null);
  const [userAssignSearch, setUserAssignSearch] = useState('');
  const [singleSensitiveModal, setSingleSensitiveModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'مفعل' | 'معطل'
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);

  const initialCreateForm = {
    name: '',
    code: '',
    description: '',
    type: 'دور إضافي',
    status: 'مفعل',
    badgeColor: '#0A3C64',
    defaultScope: 'الجميع',
    cloneSource: '',
    require2fa: false,
    restrictExport: false,
    workHoursOnly: false,
    notifyOnSensitive: true,
    permissionGroups: [],
    assignedUsers: []
  };

  const [createRoleData, setCreateRoleData] = useState(initialCreateForm);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'دور إضافي',
    status: 'مفعل',
    cloneSource: ''
  });

  const roleSuggestions = [
    { name: 'مراجع إقرارات ضريبية', code: 'TAX_AUDITOR', type: 'دور أساسي', color: '#0A3C64', desc: 'مراجعة وتدقيق الإقرارات الضريبية والمستندات المالية للعملاء' },
    { name: 'مشرف دعم فني أول', code: 'SUPPORT_LEAD', type: 'دور إشرافي', color: '#10B981', desc: 'إدارة ومعالجة تذاكر الدعم ومتابعة أداء فريق المساندة الفنية' },
    { name: 'مدقق حسابات ومالية', code: 'FINANCIAL_AUDITOR', type: 'دور مالي وتدقيق', color: '#E58A13', desc: 'إدارة الفواتير والعمليات المالية والتحويلات البنكية' },
    { name: 'أخصائي خدمة عملاء', code: 'CUSTOMER_CARE', type: 'دور إضافي', color: '#8B5CF6', desc: 'التواصل المباشر مع العملاء ومتابعة الحجوزات والاستشارات' },
    { name: 'مدير محتوى ومدونة', code: 'CONTENT_DIRECTOR', type: 'دور إشرافي', color: '#EC4899', desc: 'كتابة ونشر واعتماد المقالات المعرفية والأدلة الضريبية' },
    { name: 'مسؤول أمني وتقني', code: 'SECURITY_OPS', type: 'دور تنفيذي', color: '#06B6D4', desc: 'مراقبة سجلات التدقيق الأمني وإعدادات النظام والبوابات' }
  ];

  const badgeColorsList = [
    { name: 'كحلي كلاسيكي', color: '#0A3C64' },
    { name: 'برتقالي ملكي', color: '#E58A13' },
    { name: 'زمردي أخضر', color: '#10B981' },
    { name: 'بنفسجي داكن', color: '#8B5CF6' },
    { name: 'وردي ياقوتي', color: '#EC4899' },
    { name: 'سماوي بحري', color: '#06B6D4' },
    { name: 'عنبري دافئ', color: '#F59E0B' },
    { name: 'رمادي حجري', color: '#475569' }
  ];

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Fetch Roles, Admins list, Platform Users, & Audit logs from FastAPI backend on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        setLoading(true);
        const [rolesRes, adminsRes, usersRes, logsRes] = await Promise.allSettled([
          getAdminRoles(),
          getAdminsList(),
          getAdminUsersList({ limit: 50 }),
          getAuditLogs(20)
        ]);

        // 1. Load Dynamic Roles from PostgreSQL
        if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) && rolesRes.value.length > 0) {
          setRoles(rolesRes.value);
        }

        // 2. Load Platform Users for assignment dropdown
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          setPlatformUsers(usersRes.value);
        }

        // 3. Load Admins into roles list if not already present
        if (adminsRes.status === 'fulfilled' && Array.isArray(adminsRes.value) && adminsRes.value.length > 0) {
          const mappedAdmins = adminsRes.value.map((item, idx) => ({
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
          setRoles(prev => [...prev, ...mappedAdmins.filter(m => !prev.some(p => p.id === m.id || (p.rawId && p.rawId === m.rawId)))]);
        }

        // 4. Load Audit Logs
        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value) && logsRes.value.length > 0) {
          const mappedLogs = logsRes.value.map((log, idx) => ({
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
        console.warn('Backend RBAC load error fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBackendData();
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

  const handleTogglePermClick = (group, permission) => {
    if (permission.sensitive) {
      setSingleSensitiveModal({
        groupId: group.id,
        groupTitle: group.title,
        permission: permission,
        targetAction: permission.enabled ? 'تعطيل' : 'تفعيل',
        isEnabling: !permission.enabled
      });
    } else {
      handleTogglePerm(group.id, permission.id);
    }
  };

  const handleConfirmSingleSensitive = () => {
    if (!singleSensitiveModal) return;
    const { groupId, permission, targetAction } = singleSensitiveModal;
    handleTogglePerm(groupId, permission.id);
    setSingleSensitiveModal(null);
    showToast(`⚠️ تم ${targetAction} الصلاحية الحساسة: [${permission.name}] بنجاح.`);
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
    setCreateStep('details');
    setCreatePermSearch('');
    setCreateActiveCategory('all');
    // Deep clone permissionGroups as default matrix
    const clonedGroups = JSON.parse(JSON.stringify(permissionGroups));
    setCreateRoleData({
      ...initialCreateForm,
      permissionGroups: clonedGroups
    });
    setCloneSourceId('');
    setCreateModalOpen(true);
  };

  const handleApplyRoleSuggestion = (sugg) => {
    setCreateRoleData(prev => ({
      ...prev,
      name: sugg.name,
      code: sugg.code,
      type: sugg.type,
      badgeColor: sugg.color,
      description: sugg.desc
    }));
  };

  const handleApplyPreset = (presetType) => {
    setCreateRoleData(prev => {
      const updated = prev.permissionGroups.map(group => {
        const updatedPerms = group.permissions.map(p => {
          if (presetType === 'full') {
            return { ...p, enabled: true, scope: 'الجميع' };
          }
          if (presetType === 'clear') {
            return { ...p, enabled: false };
          }
          if (presetType === 'view_only') {
            const isView = p.name.includes('عرض') || p.name.includes('اطلاع') || p.name.includes('قراءة') || p.name.includes('تدقيق');
            return { ...p, enabled: isView, scope: 'الجميع' };
          }
          if (presetType === 'consultant') {
            const isConsultantModule = ['consultations_group', 'tax_forms_group', 'ai_group'].includes(group.id);
            const isFinanceView = group.id === 'finance_group' && (p.name.includes('عرض') || p.name.includes('إصدار'));
            return { ...p, enabled: isConsultantModule || isFinanceView, scope: 'الخاصة بي' };
          }
          if (presetType === 'support') {
            const isSupport = group.id === 'support_group';
            const isUsersView = group.id === 'users_group' && p.name.includes('عرض');
            return { ...p, enabled: isSupport || isUsersView, scope: 'الجميع' };
          }
          if (presetType === 'content') {
            const isContent = group.id === 'content_group';
            return { ...p, enabled: isContent, scope: 'الجميع' };
          }
          return p;
        });
        return { ...group, permissions: updatedPerms };
      });
      return { ...prev, permissionGroups: updated };
    });
    showToast(`تم تطبيق القالب بنجاح على مصفوفة الصلاحيات.`);
  };

  const handleApplyClone = (sourceRoleId) => {
    setCloneSourceId(sourceRoleId);
    const src = roles.find(r => r.id === sourceRoleId);
    if (!src) return;

    setCreateRoleData(prev => ({
      ...prev,
      cloneSource: sourceRoleId,
      name: prev.name ? prev.name : `نسخة من ${src.name}`,
      description: src.description,
      type: src.type,
      badgeColor: src.badgeColor || prev.badgeColor
    }));
    showToast(`تم استنساخ بيانات الدور [${src.name}] بنجاح.`);
  };

  const handleToggleCreatePerm = (groupId, permId) => {
    setCreateRoleData(prev => ({
      ...prev,
      permissionGroups: prev.permissionGroups.map(g => g.id === groupId ? {
        ...g,
        permissions: g.permissions.map(p => p.id === permId ? { ...p, enabled: !p.enabled } : p)
      } : g)
    }));
  };

  const handleSetCreatePermScope = (groupId, permId, scopeVal) => {
    setCreateRoleData(prev => ({
      ...prev,
      permissionGroups: prev.permissionGroups.map(g => g.id === groupId ? {
        ...g,
        permissions: g.permissions.map(p => p.id === permId ? { ...p, scope: scopeVal } : p)
      } : g)
    }));
  };

  const handleToggleCreateGroup = (groupId, selectAll) => {
    setCreateRoleData(prev => ({
      ...prev,
      permissionGroups: prev.permissionGroups.map(g => g.id === groupId ? {
        ...g,
        permissions: g.permissions.map(p => ({ ...p, enabled: selectAll }))
      } : g)
    }));
  };

  const handleToggleUserInCreateRole = (user) => {
    setCreateRoleData(prev => {
      const exists = prev.assignedUsers.some(u => u.id === user.id);
      if (exists) {
        return { ...prev, assignedUsers: prev.assignedUsers.filter(u => u.id !== user.id) };
      } else {
        const newUserObj = {
          id: user.id || `u_${Date.now()}`,
          name: user.full_name || user.name || user.email,
          phone: user.phone || '00962790000000',
          status: 'مفعل',
          assignedAt: new Date().toISOString().split('T')[0],
          assignType: 'مباشر'
        };
        return { ...prev, assignedUsers: [...prev.assignedUsers, newUserObj] };
      }
    });
  };

  const handleOpenEdit = (role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description, type: role.type, status: role.status, cloneSource: '' });
    setCloneSourceId('');
    setEditModalOpen(true);
  };

  const handleCloneRole = (role) => {
    setSelectedRole(null);
    setCreateStep('details');
    setCreatePermSearch('');
    setCreateActiveCategory('all');
    const clonedGroups = JSON.parse(JSON.stringify(permissionGroups));
    setCreateRoleData({
      ...initialCreateForm,
      name: `نسخة من ${role.name}`,
      code: `${role.name.toUpperCase().replace(/\s+/g, '_')}_COPY`,
      description: role.description,
      type: role.type,
      badgeColor: role.badgeColor || '#0A3C64',
      permissionGroups: clonedGroups,
      cloneSource: role.id
    });
    setCloneSourceId(role.id);
    setCreateModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الدور');
      return;
    }

    if (selectedRole) {
      // Update Existing Role
      const updatePayload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: formData.status
      };
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, ...updatePayload } : r));
      setEditModalOpen(false);
      showToast(`تم تحديث الدور [${formData.name}] وحفظ التعديلات بنجاح.`);

      try {
        await updateAdminRole(selectedRole.id, updatePayload);
      } catch (err) {
        console.warn('Backend updateRole fallback:', err);
      }
      setSelectedRole(null);
    }
  };

  const handleSaveNewRole = async () => {
    if (!createRoleData.name.trim()) {
      alert('يرجى إدخال اسم الدور الجديد.');
      setCreateStep('details');
      return;
    }

    // Count enabled permissions
    let totalPerms = 0;
    createRoleData.permissionGroups.forEach(g => {
      g.permissions.forEach(p => {
        if (p.enabled) totalPerms++;
      });
    });

    const newRoleObj = {
      id: `r_${Date.now()}`,
      name: createRoleData.name.trim(),
      code: createRoleData.code || createRoleData.name.trim().toUpperCase().replace(/\s+/g, '_'),
      description: createRoleData.description || 'دور مخصص في النظام',
      type: createRoleData.type,
      badgeColor: createRoleData.badgeColor,
      defaultScope: createRoleData.defaultScope,
      usersCount: createRoleData.assignedUsers.length,
      activeUsersCount: createRoleData.assignedUsers.filter(u => u.status === 'مفعل').length,
      permsCount: totalPerms > 0 ? totalPerms : 48,
      status: createRoleData.status,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'مدير المنصة',
      assignedUsers: createRoleData.assignedUsers,
      permissions: createRoleData.permissionGroups,
      securityConfig: {
        require2fa: createRoleData.require2fa,
        restrictExport: createRoleData.restrictExport,
        workHoursOnly: createRoleData.workHoursOnly,
        notifyOnSensitive: createRoleData.notifyOnSensitive
      }
    };

    setRoles(prev => [newRoleObj, ...prev]);
    setCreateModalOpen(false);
    showToast(`تم إنشاء الدور الجديد [${newRoleObj.name}] وحفظه بنجاح.`);

    try {
      const res = await createAdminRole(newRoleObj);
      if (res && res.id) {
        setRoles(prev => prev.map(r => r.id === newRoleObj.id ? res : r));
      }
    } catch (err) {
      console.warn('Backend createRole fallback:', err);
    }
  };

  const handleToggleRoleStatus = async (id) => {
    const target = roles.find(r => r.id === id);
    const newStatus = target?.status === 'مفعل' ? 'معطل' : 'مفعل';
    setRoles(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    showToast(`تم تغيير حالة الدور [${target?.name}] إلى ${newStatus}.`);

    try {
      await updateAdminRole(id, { status: newStatus });
    } catch (err) {
      console.warn('Backend toggle status fallback:', err);
    }
  };

  const handleDeleteRole = async (id) => {
    const target = roles.find(r => r.id === id);
    if (window.confirm(`هل أنت متأكد من حذف الدور: ${target?.name}؟`)) {
      setRoles(prev => prev.filter(r => r.id !== id));
      showToast(`🗑️ تم حذف الدور [${target?.name}] بنجاح من قاعدة البيانات.`);

      try {
        await deleteAdminRole(id);
      } catch (err) {
        console.warn('Backend delete role fallback:', err);
      }
    }
  };

  const handleRemoveUserFromRole = (userId) => {
    if (activeRoleDetail) {
      const updatedAssigned = activeRoleDetail.assignedUsers.filter(u => u.id !== userId);
      const updatedRole = { ...activeRoleDetail, assignedUsers: updatedAssigned, usersCount: updatedAssigned.length };
      setActiveRoleDetail(updatedRole);
      setRoles(prev => prev.map(r => r.id === activeRoleDetail.id ? updatedRole : r));
      showToast('تم إزالة المستخدم من هذا الدور بنجاح.');
    }
  };

  const handleAssignUserSubmit = async () => {
    if (!selectedUserToAssign) {
      alert('يرجى اختيار المستخدم أو المستشار للإسناد.');
      return;
    }

    const assignedObj = {
      id: selectedUserToAssign.id || `u_${Date.now()}`,
      name: selectedUserToAssign.full_name || selectedUserToAssign.name || selectedUserToAssign.email,
      phone: selectedUserToAssign.phone || '00962790000000',
      status: 'مفعل',
      assignedAt: new Date().toISOString().split('T')[0],
      assignType: 'مباشر'
    };

    const updatedAssigned = [...(activeRoleDetail.assignedUsers || []), assignedObj];
    const updatedRole = { ...activeRoleDetail, assignedUsers: updatedAssigned, usersCount: updatedAssigned.length };
    setActiveRoleDetail(updatedRole);
    setRoles(prev => prev.map(r => r.id === activeRoleDetail.id ? updatedRole : r));
    setAddUserToRoleModal(false);
    showToast(`🔔 تم إسناد الدور [${activeRoleDetail.name}] وإرسال إشعار فوري وتحديث قاعدة البيانات للمستخدم: ${assignedObj.name}`);

    // Persist to Backend & Send Instant Notification to User / Consultant
    try {
      const roleTypeMapped = activeRoleDetail.name.includes('مستشار') 
        ? 'consultant' 
        : (activeRoleDetail.name.includes('مدير') ? 'admin' : 'user');

      await assignUserRole(selectedUserToAssign.id, {
        role_name: activeRoleDetail.name,
        role_type: roleTypeMapped,
        permissions: activeRoleDetail.permissions || []
      });
    } catch (err) {
      console.warn('Backend assign user role fallback:', err);
    }
    setSelectedUserToAssign(null);
  };


  const filteredRoles = roles.filter(r => {
    const nameStr = (r.name || '').toLowerCase();
    const descStr = (r.description || '').toLowerCase();
    const searchLow = searchTerm.trim().toLowerCase();
    const matchSearch = !searchLow || nameStr.includes(searchLow) || descStr.includes(searchLow);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
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
                            onClick={() => handleTogglePermClick(group, p)}
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

        {/* ══════════════════════════════════════════════════════════════════
            CONFIRMATION MODAL: تعديل صلاحية حساسة مفردة (تفعيل / تعطيل)
            ══════════════════════════════════════════════════════════════════ */}
        {singleSensitiveModal && (
          <div className="admin-modal-overlay" onClick={() => setSingleSensitiveModal(null)} style={{ backdropFilter: 'blur(4px)' }}>
            <div 
              className="admin-modal-card" 
              onClick={e => e.stopPropagation()} 
              style={{ maxWidth: '480px', padding: '24px', borderRadius: '16px', textAlign: 'right', direction: 'rtl', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: singleSensitiveModal.isEnabling ? '#FEF3C7' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  {singleSensitiveModal.isEnabling ? '🛡️' : '⚠️'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '900', color: '#0A3C64' }}>
                    تنبيه أمان: {singleSensitiveModal.targetAction} صلاحية حساسة
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                    {singleSensitiveModal.groupTitle}
                  </span>
                </div>
              </div>

              {/* Permission Highlight Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                  {singleSensitiveModal.permission.name}
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: '800' }}>
                  صلاحية حساسة
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 22px 0' }}>
                أنت على وشك <strong>{singleSensitiveModal.targetAction}</strong> هذه الصلاحية. يرجى التأكد من رغبتك في ذلك لأنها قد تؤثر على سرية العمليات والبيانات الخاصة في المنصة.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  className="admin-btn-action-outline" 
                  style={{ fontSize: '12.5px', padding: '9px 18px', cursor: 'pointer', borderRadius: '10px' }}
                  onClick={() => setSingleSensitiveModal(null)}
                >
                  إلغاء
                </button>
                <button 
                  className="admin-btn-action-primary" 
                  style={{ 
                    fontSize: '12.5px', 
                    padding: '9px 22px', 
                    background: singleSensitiveModal.isEnabling ? '#E58A13' : '#DC2626', 
                    borderColor: singleSensitiveModal.isEnabling ? '#E58A13' : '#DC2626', 
                    cursor: 'pointer', 
                    fontWeight: '800', 
                    borderRadius: '10px' 
                  }}
                  onClick={handleConfirmSingleSensitive}
                >
                  تأكيد {singleSensitiveModal.targetAction}
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

      {/* 2. Top 4 Metric Cards (CLICKABLE & FULLY INTERACTIVE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
        {/* Card 1: Total Roles */}
        <div 
          className="admin-card" 
          style={{ 
            borderBottom: statusFilter === 'all' && typeFilter === 'all' && !searchTerm ? '3px solid #E58A13' : '3px solid #E2E8F0', 
            cursor: 'pointer',
            background: statusFilter === 'all' && typeFilter === 'all' && !searchTerm ? '#FFFDF8' : '#FFFFFF',
            boxShadow: statusFilter === 'all' && typeFilter === 'all' && !searchTerm ? '0 4px 12px rgba(229,138,19,0.12)' : 'none',
            transition: 'all 0.15s ease'
          }}
          onClick={() => { 
            setStatusFilter('all'); 
            setTypeFilter('all'); 
            setSearchTerm(''); 
            showToast('تم عرض كافة الأدوار في النظام.');
          }}
          title="انقر لعرض وإعادة ضبط كافة الأدوار"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>{roles.length}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>إجمالي الأدوار</div>
              <div style={{ fontSize: '11px', color: '#E58A13', marginTop: '4px', fontWeight: '600' }}>أدوار معرفة ونشطة</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
              الكل
            </div>
          </div>
        </div>

        {/* Card 2: Active Roles Filter */}
        <div 
          className="admin-card"
          style={{ 
            borderBottom: statusFilter === 'مفعل' ? '3px solid #059669' : '3px solid #E2E8F0', 
            cursor: 'pointer',
            background: statusFilter === 'مفعل' ? '#F0FDF4' : '#FFFFFF',
            boxShadow: statusFilter === 'مفعل' ? '0 4px 12px rgba(5,150,105,0.12)' : 'none',
            transition: 'all 0.15s ease'
          }}
          onClick={() => {
            const next = statusFilter === 'مفعل' ? 'all' : 'مفعل';
            setStatusFilter(next);
            showToast(next === 'مفعل' ? 'تمت تصفية الأدوار المفعلة فقط.' : 'تم إلغاء تصفية الحالة.');
          }}
          title="انقر لتصفية الأدوار المفعلة فقط"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>{roles.filter(r => r.status === 'مفعل').length}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>الأدوار المفعلة</div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                {statusFilter === 'مفعل' ? 'محددة حالياً (انقر للإلغاء)' : 'متاحة للمشرفين'}
              </div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              مفعل
            </div>
          </div>
        </div>

        {/* Card 3: Global Permissions Matrix Modal Trigger */}
        <div 
          className="admin-card"
          style={{ 
            borderBottom: '3px solid #2563EB', 
            cursor: 'pointer',
            background: '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setMatrixModalOpen(true)}
          title="انقر لفتح واستعراض مصفوفة الصلاحيات الكلية"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>
                {permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>الصلاحيات الكلية</div>
              <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '4px', fontWeight: '600' }}>مصفوفة 8 فئات (انقر للعرض)</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              فئات
            </div>
          </div>
        </div>

        {/* Card 4: Interconnected Relations & Hierarchy Modal Trigger */}
        <div 
          className="admin-card"
          style={{ 
            borderBottom: '3px solid #6366F1', 
            cursor: 'pointer',
            background: '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setHierarchyModalOpen(true)}
          title="انقر لمعاينة خريطة وراثة وتداخل الصلاحيات"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>12</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>العلاقات المتداخلة</div>
              <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '4px', fontWeight: '600' }}>وراثة الصلاحيات (انقر للعرض)</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              وراثة
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

      {/* CLEAN EMOJI-FREE CREATE ROLE WIZARD MODAL */}
      {createModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '880px', 
              width: '94%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '0', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)',
              background: '#FFFFFF',
              textAlign: 'right'
            }}
          >
            {/* MODAL HEADER */}
            <div style={{ 
              padding: '18px 24px', 
              borderBottom: '1px solid #E2E8F0', 
              background: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                  إنشاء دور وتخصيص الصلاحيات
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  تحديد هوية الدور، تعيين الصلاحيات الممنوحة عبر الأقسام، وضبط سياسات الأمان والمستخدمين.
                </p>
              </div>

              <button 
                className="admin-icon-btn-minimal" 
                onClick={() => setCreateModalOpen(false)}
                style={{ fontSize: '16px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer' }}
                title="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* WIZARD TABS NAVIGATION */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #E2E8F0', 
              background: '#F8FAFC', 
              padding: '0 20px',
              gap: '4px',
              overflowX: 'auto'
            }}>
              {[
                { id: 'details', label: '1. تفاصيل الدور' },
                { 
                  id: 'permissions', 
                  label: `2. مصفوفة الصلاحيات (${createRoleData.permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.enabled).length, 0)} مفعلة)`
                },
                { id: 'security', label: '3. سياسات الأمان' },
                { id: 'users', label: `4. إسناد المستخدمين (${createRoleData.assignedUsers.length})` }
              ].map(tab => {
                const isActive = createStep === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCreateStep(tab.id)}
                    style={{
                      padding: '12px 18px',
                      fontSize: '13px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0A3C64' : '#64748B',
                      borderBottom: isActive ? '2.5px solid #0A3C64' : '2.5px solid transparent',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, maxHeight: 'calc(90vh - 190px)' }}>
              
              {/* TAB 1: ROLE DETAILS */}
              {createStep === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Quick Suggestions Chips */}
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                      اقتراحات سريعة لأدوار شائعة:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {roleSuggestions.map((sugg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyRoleSuggestion(sugg)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: createRoleData.name === sugg.name ? '1px solid #0A3C64' : '1px solid #CBD5E1',
                            background: createRoleData.name === sugg.name ? '#EFF6FF' : '#FFFFFF',
                            color: createRoleData.name === sugg.name ? '#0A3C64' : '#334155',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {sugg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {/* Role Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                        اسم الدور *
                      </label>
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="مثال: مراجع إقرارات ضريبية"
                        value={createRoleData.name} 
                        onChange={e => setCreateRoleData({ ...createRoleData, name: e.target.value })} 
                        style={{ width: '100%', height: '40px', fontSize: '13px' }}
                      />
                    </div>

                    {/* Role Code Identifier */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                        الرمز البرمجي (Role Code)
                      </label>
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="مثال: ROLE_TAX_AUDITOR"
                        value={createRoleData.code} 
                        onChange={e => setCreateRoleData({ ...createRoleData, code: e.target.value })} 
                        style={{ width: '100%', height: '40px', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>

                    {/* Role Classification / Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                        تصنيف الدور
                      </label>
                      <select 
                        className="admin-select-input" 
                        style={{ width: '100%', height: '40px', background: '#FFFFFF', fontSize: '13px' }}
                        value={createRoleData.type}
                        onChange={e => setCreateRoleData({ ...createRoleData, type: e.target.value })}
                      >
                        <option value="دور أساسي">دور أساسي</option>
                        <option value="دور إضافي">دور إضافي</option>
                        <option value="دور إشرافي">دور إشرافي</option>
                        <option value="دور تنفيذي">دور تنفيذي</option>
                        <option value="دور مالي وتدقيق">دور مالي وتدقيق</option>
                        <option value="دور دعم ومساندة">دور دعم ومساندة</option>
                      </select>
                    </div>

                    {/* Default Scope */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                        نطاق الرؤية الافتراضي
                      </label>
                      <select 
                        className="admin-select-input" 
                        style={{ width: '100%', height: '40px', background: '#FFFFFF', fontSize: '13px' }}
                        value={createRoleData.defaultScope}
                        onChange={e => setCreateRoleData({ ...createRoleData, defaultScope: e.target.value })}
                      >
                        <option value="الجميع">الجميع (كافة السجلات)</option>
                        <option value="الخاصة بي">الخاصة به وبفريقه</option>
                        <option value="خاص بي">خاص به فقط</option>
                      </select>
                    </div>
                  </div>

                  {/* Color Customization */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', color: '#0F172A' }}>
                      لون تمييز شارة الدور
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      {badgeColorsList.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCreateRoleData({ ...createRoleData, badgeColor: c.color })}
                          title={c.name}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: c.color,
                            border: createRoleData.badgeColor === c.color ? '2.5px solid #0F172A' : '2px solid transparent',
                            outline: createRoleData.badgeColor === c.color ? '2px solid #94A3B8' : 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                      وصف الدور
                    </label>
                    <textarea 
                      className="admin-search-input" 
                      placeholder="وصف مختصر لمسؤوليات ومهام هذا الدور..."
                      value={createRoleData.description} 
                      onChange={e => setCreateRoleData({ ...createRoleData, description: e.target.value })} 
                      style={{ width: '100%', height: '65px', padding: '10px', resize: 'vertical', fontSize: '13px' }}
                    />
                  </div>

                  {/* Clone from existing role */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                      الاستنساخ من دور متاح (اختياري)
                    </label>
                    <select 
                      className="admin-select-input" 
                      style={{ width: '100%', height: '40px', background: '#FFFFFF', fontSize: '13px' }}
                      value={cloneSourceId}
                      onChange={e => handleApplyClone(e.target.value)}
                    >
                      <option value="">بدء إنشاء نموذج جديد...</option>
                      {roles.map(rl => (
                        <option key={rl.id} value={rl.id}>
                          استنساخ من: {rl.name} ({rl.type}) - {rl.permsCount} صلاحية
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Initial Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>حالة التفعيل:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="createStatus" 
                        value="مفعل" 
                        checked={createRoleData.status === 'مفعل'} 
                        onChange={() => setCreateRoleData({ ...createRoleData, status: 'مفعل' })} 
                      />
                      <span>مفعل ومتاح للإسناد</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="createStatus" 
                        value="معطل" 
                        checked={createRoleData.status === 'معطل'} 
                        onChange={() => setCreateRoleData({ ...createRoleData, status: 'معطل' })} 
                      />
                      <span>مسودة غير مفعلة</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: GRANULAR PERMISSIONS MATRIX */}
              {createStep === 'permissions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Presets Toolbar */}
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                        قوالب الصلاحيات الجاهزة:
                      </span>
                      <span style={{ fontSize: '12px', color: '#0A3C64', fontWeight: '700', background: '#EFF6FF', padding: '2px 10px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                        تم تفعيل {createRoleData.permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.enabled).length, 0)} من أصل {createRoleData.permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)} صلاحية
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('full')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF' }}
                      >
                        صلاحيات شاملة
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('view_only')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF' }}
                      >
                        قراءة واطلاع فقط
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('consultant')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF' }}
                      >
                        مستشار ضريبي
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('support')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF' }}
                      >
                        دعم فني
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('content')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF' }}
                      >
                        مدير محتوى
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleApplyPreset('clear')}
                        className="admin-btn-action-outline"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px', background: '#FFFFFF', color: '#DC2626', borderColor: '#FECACA' }}
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>

                  {/* Search and Category Filter */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="بحث عن صلاحية..."
                        value={createPermSearch}
                        onChange={e => setCreatePermSearch(e.target.value)}
                        style={{ width: '100%', height: '38px', fontSize: '12.5px' }}
                      />
                    </div>

                    <select
                      className="admin-select-input"
                      style={{ width: '180px', height: '38px', background: '#FFFFFF', fontSize: '12.5px' }}
                      value={createActiveCategory}
                      onChange={e => setCreateActiveCategory(e.target.value)}
                    >
                      <option value="all">كافة الأقسام</option>
                      {createRoleData.permissionGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categorized Permissions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {createRoleData.permissionGroups
                      .filter(g => createActiveCategory === 'all' || g.id === createActiveCategory)
                      .map(group => {
                        const filteredPerms = group.permissions.filter(p => 
                          !createPermSearch || p.name.toLowerCase().includes(createPermSearch.toLowerCase())
                        );

                        if (createPermSearch && filteredPerms.length === 0) return null;

                        const activeInGroup = group.permissions.filter(p => p.enabled).length;

                        return (
                          <div 
                            key={group.id} 
                            style={{ 
                              border: '1px solid #E2E8F0', 
                              borderRadius: '10px', 
                              overflow: 'hidden', 
                              background: '#FFFFFF'
                            }}
                          >
                            {/* Group Header */}
                            <div style={{ 
                              padding: '10px 16px', 
                              background: '#F8FAFC', 
                              borderBottom: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '6px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{group.title}</span>
                                <span style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '600', 
                                  padding: '1px 8px', 
                                  borderRadius: '10px', 
                                  background: activeInGroup > 0 ? '#EFF6FF' : '#F1F5F9',
                                  color: activeInGroup > 0 ? '#1D4ED8' : '#64748B'
                                }}>
                                  {activeInGroup} من {group.permissions.length} مفعلة
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCreateGroup(group.id, true)}
                                  style={{ padding: '2px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer' }}
                                >
                                  تحديد الكل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCreateGroup(group.id, false)}
                                  style={{ padding: '2px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}
                                >
                                  إلغاء الكل
                                </button>
                              </div>
                            </div>

                            {/* Permissions Grid */}
                            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '8px' }}>
                              {filteredPerms.map(perm => (
                                <div 
                                  key={perm.id} 
                                  style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '6px', 
                                    border: perm.enabled ? '1px solid #CBD5E1' : '1px solid #F1F5F9',
                                    background: perm.enabled ? '#FFFFFF' : '#FAFAFA',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                                    <input 
                                      type="checkbox" 
                                      checked={perm.enabled} 
                                      onChange={() => handleToggleCreatePerm(group.id, perm.id)}
                                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0A3C64' }}
                                    />
                                    <span style={{ fontSize: '12.5px', fontWeight: perm.enabled ? '600' : '400', color: perm.enabled ? '#0F172A' : '#64748B' }}>
                                      {perm.name}
                                    </span>
                                    {perm.sensitive && (
                                      <span style={{ fontSize: '10.5px', color: '#DC2626', background: '#FEF2F2', padding: '1px 6px', borderRadius: '4px', border: '1px solid #FECACA', fontWeight: '600' }}>
                                        حساس
                                      </span>
                                    )}
                                  </label>

                                  {/* Compact Scope Selector (Only visible if enabled) */}
                                  {perm.enabled && (
                                    <select
                                      value={perm.scope || 'الجميع'}
                                      onChange={e => handleSetCreatePermScope(group.id, perm.id, e.target.value)}
                                      style={{ 
                                        fontSize: '11px', 
                                        padding: '2px 4px', 
                                        borderRadius: '4px', 
                                        border: '1px solid #CBD5E1', 
                                        background: '#FFFFFF',
                                        color: '#334155',
                                        cursor: 'pointer',
                                        width: '85px'
                                      }}
                                    >
                                      <option value="الجميع">الجميع</option>
                                      <option value="الخاصة بي">الخاصة به</option>
                                      <option value="خاص بي">خاص به</option>
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY POLICIES */}
              {createStep === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                      سياسات الحماية والرقابة الأمنية
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                      فرض قيود أمنية لضمان سلامة العمليات المنفذة من خلال هذا الدور.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* 2FA Toggle */}
                    <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                          إلزامية التحقق بخطوتين (2FA)
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                          إجبار المستخدمين المسندين لهذا الدور على تفعيل المصادقة الثنائية قبل تسجيل الدخول.
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={createRoleData.require2fa} 
                        onChange={e => setCreateRoleData({ ...createRoleData, require2fa: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0A3C64' }}
                      />
                    </div>

                    {/* Restrict Export Toggle */}
                    <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                          حظر التصدير والتنزيل الجماعي للبيانات
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                          منع تنزيل وتصدير ملفات البيانات أو الجداول لحماية سرية المعلومات.
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={createRoleData.restrictExport} 
                        onChange={e => setCreateRoleData({ ...createRoleData, restrictExport: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0A3C64' }}
                      />
                    </div>

                    {/* Work Hours Only */}
                    <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                          تقييد الدخول بأوقات الدوام الرسمي
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                          السماح بالوصول للنظام خلال ساعات العمل المعتمدة فقط (8:00 ص - 6:00 م).
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={createRoleData.workHoursOnly} 
                        onChange={e => setCreateRoleData({ ...createRoleData, workHoursOnly: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0A3C64' }}
                      />
                    </div>

                    {/* Sensitive Notifications */}
                    <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                          إرسال إشعارات تدقيق فوري عند العمليات الحساسة
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                          إرسال تنبيه مباشر لمدير النظام عند تنفيذ أي إجراء مصنف كحساس.
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={createRoleData.notifyOnSensitive} 
                        onChange={e => setCreateRoleData({ ...createRoleData, notifyOnSensitive: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0A3C64' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: INITIAL USERS ASSIGNMENT */}
              {createStep === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                        إسناد المستخدمين أو المستشارين لهذا الدور
                      </h4>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#0A3C64' }}>
                        {createRoleData.assignedUsers.length} حسابات محددة
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                      اختيار حسابات من مستخدمي المنصة لربطهم بهذا الدور تلقائياً عند إنشائه.
                    </p>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      className="admin-search-input" 
                      placeholder="بحث عن مستخدم بالاسم أو البريد..."
                      value={userAssignSearch}
                      onChange={e => setUserAssignSearch(e.target.value)}
                      style={{ width: '100%', height: '38px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF' }}>
                    {platformUsers.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
                        لا توجد حسابات متاحة حالياً...
                      </div>
                    ) : (
                      platformUsers
                        .filter(u => {
                          if (!userAssignSearch) return true;
                          const name = (u.full_name || u.name || '').toLowerCase();
                          const email = (u.email || '').toLowerCase();
                          return name.includes(userAssignSearch.toLowerCase()) || email.includes(userAssignSearch.toLowerCase());
                        })
                        .map(user => {
                          const isAssigned = createRoleData.assignedUsers.some(u => u.id === user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => handleToggleUserInCreateRole(user)}
                              style={{
                                padding: '9px 12px',
                                borderBottom: '1px solid #F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: isAssigned ? '#F8FAFC' : '#FFFFFF',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isAssigned} 
                                  onChange={() => {}} 
                                  style={{ width: '15px', height: '15px', accentColor: '#0A3C64', cursor: 'pointer' }}
                                />
                                <div>
                                  <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A' }}>
                                    {user.full_name || user.name || user.email}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                                    {user.email} {user.phone ? `• ${user.phone}` : ''}
                                  </div>
                                </div>
                              </div>

                              <span style={{ 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                padding: '2px 8px', 
                                borderRadius: '10px',
                                background: user.role === 'consultant' ? '#FFFBEB' : '#F0F9FF',
                                color: user.role === 'consultant' ? '#D97706' : '#0284C7',
                                border: user.role === 'consultant' ? '1px solid #FDE68A' : '1px solid #BAE6FD'
                              }}>
                                {user.role === 'consultant' ? 'مستشار' : (user.role || 'مستخدم')}
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER NAVIGATION */}
            <div style={{ 
              padding: '14px 24px', 
              borderTop: '1px solid #E2E8F0', 
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {createStep !== 'details' && (
                  <button 
                    type="button"
                    className="admin-btn-action-outline" 
                    onClick={() => {
                      if (createStep === 'permissions') setCreateStep('details');
                      if (createStep === 'security') setCreateStep('permissions');
                      if (createStep === 'users') setCreateStep('security');
                    }}
                    style={{ padding: '7px 14px', fontSize: '12.5px', borderRadius: '6px', background: '#FFFFFF' }}
                  >
                    الخطوة السابقة
                  </button>
                )}

                {createStep !== 'users' && (
                  <button 
                    type="button"
                    className="admin-btn-action-outline" 
                    onClick={() => {
                      if (createStep === 'details') setCreateStep('permissions');
                      if (createStep === 'permissions') setCreateStep('security');
                      if (createStep === 'security') setCreateStep('users');
                    }}
                    style={{ padding: '7px 14px', fontSize: '12.5px', borderRadius: '6px', background: '#FFFFFF', color: '#0A3C64', borderColor: '#CBD5E1' }}
                  >
                    الخطوة التالية
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="admin-btn-action-outline" 
                  onClick={() => setCreateModalOpen(false)}
                  style={{ padding: '7px 14px', fontSize: '12.5px', borderRadius: '6px' }}
                >
                  إلغاء
                </button>

                <button 
                  type="button"
                  className="admin-btn-action-primary" 
                  style={{ 
                    background: '#0A3C64', 
                    borderColor: '#0A3C64',
                    padding: '7px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '6px'
                  }} 
                  onClick={handleSaveNewRole}
                >
                  إنشاء وحفظ الدور
                </button>
              </div>
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

      {/* ADD USER TO ROLE MODAL (WITH LIVE SEARCH & INSTANT NOTIFICATION) */}
      {addUserToRoleModal && activeRoleDetail && (
        <div className="admin-modal-overlay" onClick={() => setAddUserToRoleModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', padding: '24px', borderRadius: '16px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0A3C64' }}>
                إسناد مستخدم / مستشار إلى الدور: [{activeRoleDetail.name}]
              </h3>
              <button className="admin-icon-btn-minimal" onClick={() => setAddUserToRoleModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 14px 0' }}>
              عند اختيار الحساب وتأكيد الإسناد، سيتم تحديث صلاحيات الحساب في قاعدة البيانات وإرسال إشعار فوري وتنبيه للمستخدم/المستشار.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                البحث عن المستخدم أو المستشار:
              </label>
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="ابحث بالاسم أو البريد أو الهاتف..." 
                value={userAssignSearch}
                onChange={e => setUserAssignSearch(e.target.value)}
                style={{ width: '100%', height: '40px', marginBottom: '8px' }}
              />

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {platformUsers
                  .filter(u => {
                    const q = userAssignSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q)) ||
                      (u.phone && u.phone.includes(q))
                    );
                  })
                  .slice(0, 15)
                  .map(u => {
                    const isSelected = selectedUserToAssign?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserToAssign(u)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid #F1F5F9',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '13px', color: '#1E293B' }}>{u.full_name || u.name || u.email}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{u.email} • {u.phone || 'بدون هاتف'}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: u.role === 'consultant' ? '#FEF3C7' : '#E2E8F0', color: u.role === 'consultant' ? '#B45309' : '#334155', fontWeight: '700' }}>
                          {u.role === 'consultant' ? 'مستشار' : (u.role === 'admin' ? 'إداري' : 'مستخدم')}
                        </span>
                      </div>
                    );
                  })}
                {platformUsers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '12px' }}>
                    جاري تحميل قائمة المستخدمين...
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setAddUserToRoleModal(false)}>إلغاء</button>
              <button 
                className="admin-btn-action-primary" 
                style={{ background: '#0A3C64', borderColor: '#0A3C64', fontWeight: '700' }}
                onClick={handleAssignUserSubmit}
              >
                تأكيد الإسناد وإشعار المستخدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PERMISSIONS MATRIX MODAL (CARD 3 TRIGGER) */}
      {matrixModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setMatrixModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '900px', 
              width: '95%', 
              maxHeight: '88vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '0', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)',
              background: '#FFFFFF',
              textAlign: 'right'
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                  مصفوفة الصلاحيات الكلية للنظام
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  استعراض تفصيلي لكافة الصلاحيات الموزعة على الأقسام الـ 8 وتصنيف الصلاحيات الحساسة والعادية.
                </p>
              </div>

              <button 
                className="admin-icon-btn-minimal" 
                onClick={() => setMatrixModalOpen(false)}
                style={{ fontSize: '16px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)}</div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>إجمالي الصلاحيات</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB' }}>{permissionGroups.length}</div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>الأقسام المعتمدة</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#DC2626' }}>
                  {permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.sensitive).length, 0)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>إجراءات حساسة</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                  {permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => !p.sensitive).length, 0)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>إجراءات قياسية</div>
              </div>
            </div>

            {/* Scrollable Categories List */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {permissionGroups.map(group => (
                <div key={group.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                  <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{group.title}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                      {group.permissions.length} صلاحية
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                    {group.permissions.map(p => (
                      <div key={p.id} style={{ padding: '8px 12px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: '500' }}>{p.name}</span>
                        {p.sensitive ? (
                          <span style={{ fontSize: '10.5px', color: '#DC2626', background: '#FEF2F2', padding: '1px 6px', borderRadius: '4px', border: '1px solid #FECACA', fontWeight: '600' }}>حساس</span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: '600' }}>قياسي</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="admin-btn-action-primary" 
                style={{ background: '#0A3C64', borderColor: '#0A3C64', padding: '7px 18px', fontSize: '13px', borderRadius: '6px' }}
                onClick={() => setMatrixModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE HIERARCHY & INHERITANCE MODAL (CARD 4 TRIGGER) */}
      {hierarchyModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setHierarchyModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '850px', 
              width: '95%', 
              maxHeight: '88vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '0', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)',
              background: '#FFFFFF',
              textAlign: 'right'
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                  خريطة وراثة وتداخل الصلاحيات
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  توضيح التدرج الهيكلي وتداخل الصلاحيات بين الأدوار الأساسية والإضافية في النظام.
                </p>
              </div>

              <button 
                className="admin-icon-btn-minimal" 
                onClick={() => setHierarchyModalOpen(false)}
                style={{ fontSize: '16px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px', color: '#475569', lineHeight: '1.7' }}>
                يتيح نظام الصلاحيات المتقدم تدرجاً هيكلياً يضمن عدم تعارض المسؤوليات، بحيث يرث كل دور إشرافي صلاحيات الدور الأدنى مع إمكانية التخصيص المستقل.
              </div>

              {/* Levels Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Level 1 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0A3C64' }}>المستوى 1: الإدارة العليا للنظام (Super Admin)</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8' }}>تحكم كامل 100%</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    يشمل: مدير المنصة • تحكم شامل في كافة ميزات النظام، إعدادات بوابات الدفع، تفريغ السجلات، وحذف الحسابات.
                  </p>
                </div>

                {/* Level 2 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0A3C64' }}>المستوى 2: الأدوار الإشرافية والمالية (Supervisory & Financial)</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#FEF3C7', color: '#B45309' }}>تحكم قطاعي</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    يشمل: مدير المحتوى، مسؤول مالي • اعتماد المقالات للنشر، إدارة الفواتير، التحويلات البنكية، ومعالجة الاستردادات.
                  </p>
                </div>

                {/* Level 3 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0A3C64' }}>المستوى 3: الأدوار التشغيلية والاستشارية (Operational & Consultant)</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>عمليات مباشرة</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    يشمل: المستشار، مراجع الإقرارات، موظف دعم فني • عقد الجلسات المباشرة، معالجة التذاكر، وتدقيق الإقرارات الضريبية.
                  </p>
                </div>

                {/* Level 4 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0A3C64' }}>المستوى 4: أدوار الاطلاع والخدمة المحدودة (View & Customer Service)</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>وصول مقيد</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    يشمل: مسؤول خدمة العملاء، صادق للقراءة فقط • متابعة حجوزات العملاء، الاطلاع على السجلات والتقارير بدون إمكانية التعديل.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="admin-btn-action-primary" 
                style={{ background: '#0A3C64', borderColor: '#0A3C64', padding: '7px 18px', fontSize: '13px', borderRadius: '6px' }}
                onClick={() => setHierarchyModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: '13px',
          fontWeight: '700',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          direction: 'rtl'
        }}>
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}


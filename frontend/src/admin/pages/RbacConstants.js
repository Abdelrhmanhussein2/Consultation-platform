// ══════════════════════════════════════════════════════════════════════════
// RbacConstants.js — Static data extracted from AdminRbacPage.jsx
// Modules, permissions, dependencies, scope maps, and permission metadata
// ══════════════════════════════════════════════════════════════════════════

// 12 Modules with all permissions
// Permission tuple: [id, arabicName, defaultEnabled, isSensitive]
export const MODULES = [
  {
    id: 'users',
    name: 'المستخدمون وإدارة الحسابات',
    permissions: [
      ['u_view',    'عرض المستخدمين',          true,  true],
      ['u_add',     'إضافة مستخدم جديد',         false, true],
      ['u_edit',    'تعديل بيانات المستخدم',      true,  false],
      ['u_disable', 'تعطيل/تفعيل المستخدم',       false, true],
      ['u_delete',  'حذف المستخدم نهائياً',       false, true],
      ['u_export',  'تصدير بيانات المستخدمين',    false, true],
      ['u_roles',   'إدارة أدوار المستخدمين',     false, true]
    ]
  },
  {
    id: 'content',
    name: 'المحتوى',
    permissions: [
      ['c_view',      'عرض المحتوى',             true,  false],
      ['c_add',       'إضافة محتوى جديد',         false, false],
      ['c_edit',      'تعديل المحتوى',            true,  false],
      ['c_review',    'مراجعة المحتوى',           false, false],
      ['c_approve',   'اعتماد المحتوى',           false, true],
      ['c_publish',   'نشر المحتوى الرسمي',       false, true],
      ['c_unpublish', 'إلغاء نشر المحتوى',        false, false],
      ['c_archive',   'أرشفة المحتوى',            false, false],
      ['c_delete',    'حذف المحتوى',              false, true]
    ]
  },
  {
    id: 'consultations',
    name: 'الاستشارات',
    permissions: [
      ['con_view',        'عرض الاستشارات',          true,  false],
      ['con_detail',      'عرض تفاصيل الاستشارة',   true,  false],
      ['con_edit',        'تعديل الاستشارة',         true,  false],
      ['con_reassign',    'إعادة تعيين المستشار',    false, true],
      ['con_reschedule',  'تعديل الموعد',            false, false],
      ['con_cancel',      'إلغاء الاستشارة',         false, false],
      ['con_summary_view','عرض الملخص',              false, false],
      ['con_summary_edit','تعديل الملخص',            false, false],
      ['con_rec_view',    'عرض التوصيات',            false, false],
      ['con_rec_edit',    'تعديل التوصيات',          false, false],
      ['con_rec_approve', 'اعتماد التوصيات',         false, true]
    ]
  },
  {
    id: 'ai',
    name: 'المساعد الذكي',
    permissions: [
      ['ai_use',   'استخدام المساعد الذكي',                  false, false],
      ['ai_admin', 'إدارة إعدادات الذكاء الاصطناعي',         false, true],
      ['ai_train', 'تدريب النماذج على بيانات جديدة',         false, true]
    ]
  },
  {
    id: 'tax',
    name: 'الإقرارات الضريبية',
    permissions: [
      ['tax_view',   'عرض الإقرارات',                        true,  false],
      ['tax_add',    'إنشاء إقرار جديد',                     false, false],
      ['tax_edit',   'تعديل الإقرار',                        false, false],
      ['tax_submit', 'تقديم الإقرار للجهات الرسمية',         false, true],
      ['tax_export', 'تصدير الإقرارات',                      false, true]
    ]
  },
  {
    id: 'payments',
    name: 'الفواتير والمدفوعات',
    permissions: [
      ['pay_view',   'عرض الفواتير',                         true,  false],
      ['pay_ops',    'عرض العمليات المالية',                  true,  false],
      ['pay_issue',  'إصدار فاتورة',                         false, false],
      ['pay_edit',   'تعديل بيانات الفاتورة',                false, true],
      ['pay_cancel', 'إلغاء فاتورة',                         false, true],
      ['pay_refund', 'تنفيذ استرداد المدفوعات',              false, true],
      ['pay_export', 'تصدير البيانات المالية',               false, true]
    ]
  },
  {
    id: 'support',
    name: 'الدعم والتذاكر',
    permissions: [
      ['sup_view',     'عرض التذاكر',                        true,  false],
      ['sup_reply',    'الرد على التذاكر',                   false, false],
      ['sup_note',     'إضافة ملاحظة داخلية',                false, false],
      ['sup_status',   'تغيير حالة التذكرة',                 false, false],
      ['sup_priority', 'تغيير الأولوية',                     false, false],
      ['sup_assign',   'تعيين موظف للتذكرة',                 false, false],
      ['sup_transfer', 'تحويل التذكرة',                      false, false],
      ['sup_close',    'إغلاق التذكرة',                      false, false],
      ['sup_reopen',   'إعادة فتح التذكرة',                  false, false],
      ['sup_log',      'عرض سجل النشاط الكامل',              false, true]
    ]
  },
  {
    id: 'reports',
    name: 'التقارير',
    permissions: [
      ['rep_view',   'عرض التقارير',                         true,  false],
      ['rep_create', 'إنشاء تقرير مخصص',                    false, false],
      ['rep_export', 'تصدير التقارير',                       false, true]
    ]
  },
  {
    id: 'notifications',
    name: 'الإشعارات',
    permissions: [
      ['not_view',   'عرض الإشعارات',                        false, false],
      ['not_send',   'إرسال إشعارات للمستخدمين',             false, true],
      ['not_manage', 'إدارة قوالب الإشعارات',                false, false]
    ]
  },
  {
    id: 'settings',
    name: 'الإعدادات',
    permissions: [
      ['set_general',      'إعدادات عامة',                   false, true],
      ['set_appearance',   'تخصيص المظهر',                   false, false],
      ['set_integrations', 'إدارة التكاملات',                false, true]
    ]
  },
  {
    id: 'security',
    name: 'الأمن',
    permissions: [
      ['sec_view',     'عرض إعدادات الأمن',                  false, true],
      ['sec_2fa',      'إدارة المصادقة الثنائية',            false, true],
      ['sec_sessions', 'إدارة الجلسات النشطة',               false, true],
      ['sec_logs',     'عرض سجل الأمان',                     false, true]
    ]
  },
  {
    id: 'audit',
    name: 'سجل التدقيق',
    permissions: [
      ['audit_view',   'عرض سجل التدقيق الكامل',            false, true],
      ['audit_export', 'تصدير سجل التدقيق',                 false, true]
    ]
  }
];

// Permission dependency map — key requires all values to be enabled first
export const DEPENDENCIES = {
  c_delete:        ['c_view'],
  c_edit:          ['c_view'],
  c_publish:       ['c_view', 'c_approve'],
  c_approve:       ['c_view', 'c_review'],
  con_rec_approve: ['con_view', 'con_rec_view'],
  con_rec_edit:    ['con_view', 'con_rec_view'],
  con_reassign:    ['con_view', 'con_detail'],
  pay_refund:      ['pay_view', 'pay_ops'],
  pay_edit:        ['pay_view'],
  sup_reply:       ['sup_view'],
  sup_transfer:    ['sup_view', 'sup_assign']
};

// Human-readable scope labels
export const SCOPE_LABELS = {
  own:      'الخاصة به',
  assigned: 'المعينة له',
  team:     'الفريق',
  all:      'الجميع'
};

// Permissions that support scope selection
export const SCOPE_MAP = {
  u_view:     ['own', 'team', 'all'],
  u_edit:     ['own', 'team', 'all'],
  c_view:     ['own', 'team', 'all'],
  c_edit:     ['own', 'team', 'all'],
  con_view:   ['own', 'team', 'all'],
  con_detail: ['own', 'team', 'all'],
  con_edit:   ['own', 'team', 'all'],
  tax_view:   ['own', 'team', 'all'],
  pay_view:   ['own', 'team', 'all'],
  pay_ops:    ['own', 'team', 'all'],
  sup_view:   ['assigned', 'team', 'all'],
  rep_view:   ['own', 'team', 'all']
};

// Build permission metadata lookup from MODULES
export function buildPermissionMeta(modules) {
  const meta = {};
  modules.forEach(m => m.permissions.forEach(p => {
    meta[p[0]] = {
      id: p[0],
      name: p[1],
      sensitive: !!p[3],
      module: m.name,
      impact: p[3] ? (
        p[0].includes('delete')   ? 'قد تؤدي إلى حذف بيانات أو محتوى من النظام.' :
        p[0].includes('refund')   ? 'تتيح تنفيذ إجراء مالي حساس وإرجاع مبالغ.' :
        p[0].includes('publish')  ? 'تتيح نشر محتوى رسمي ظاهر للمستخدمين.' :
        p[0].includes('security') || p[0].startsWith('sec_') ? 'تؤثر على إعدادات أمن المنصة أو بياناتها الأمنية.' :
        p[0].includes('audit')   ? 'تتيح الوصول إلى سجل تدقيق قد يحتوي بيانات تشغيلية وأمنية حساسة.' :
        'تمنح وصولاً أو إجراءً عالي التأثير داخل النظام.'
      ) : ''
    };
  }));
  return meta;
}

// Count total sensitive permissions across all modules
export function countTotalSensitive(modules) {
  let cnt = 0;
  modules.forEach(m => m.permissions.forEach(p => { if (p[3]) cnt++; }));
  return cnt;
}

// Initial permissions map per role (role ID → { permId: { enabled, scope } })
export function buildInitialRolesPermissionsMap(modules, scopeMap) {
  const initialMap = {};

  // Helper
  const scopeFor = (code) => (scopeMap[code] || []).includes('all') ? 'all' : 'own';

  // 1. مدير المنصة — all permissions
  const allPerms = {};
  modules.forEach(m => m.permissions.forEach(p => {
    allPerms[p[0]] = { enabled: true, scope: scopeFor(p[0]) };
  }));
  initialMap[1] = allPerms;
  initialMap['1'] = allPerms;
  initialMap['r1'] = allPerms;
  initialMap['مدير المنصة'] = allPerms;

  // 2. مدير المحتوى — 24 permissions
  const contentManagerPerms = {};
  ['c_view','c_add','c_edit','c_review','c_approve','c_publish','c_unpublish','c_archive','c_delete',
   'rep_view','rep_create','rep_export','not_view','not_send','not_manage','ai_use','set_appearance',
   'u_view','con_view','con_detail','con_summary_view','tax_view','sup_view','sec_view'].forEach(code => {
    contentManagerPerms[code] = { enabled: true, scope: scopeFor(code) };
  });
  initialMap[2] = contentManagerPerms;
  initialMap['2'] = contentManagerPerms;
  initialMap['r2'] = contentManagerPerms;
  initialMap['مدير المحتوى'] = contentManagerPerms;

  // 3. مراجع المحتوى — 18 permissions
  const contentReviewerPerms = {};
  ['c_view','c_edit','c_review','c_approve','c_archive','rep_view','not_view','ai_use',
   'con_view','con_detail','con_summary_view','u_view','tax_view','pay_view','sup_view',
   'rep_create','set_appearance','audit_view'].forEach(code => {
    contentReviewerPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[3] = contentReviewerPerms;
  initialMap['3'] = contentReviewerPerms;
  initialMap['r3'] = contentReviewerPerms;
  initialMap['مراجع المحتوى'] = contentReviewerPerms;

  // 4. مستشار — 16 permissions
  const consultantPerms = {};
  ['con_view','con_detail','con_edit','con_reschedule','con_cancel','con_summary_view',
   'con_summary_edit','con_rec_view','con_rec_edit','con_rec_approve','ai_use',
   'c_view','u_view','not_view','pay_view','sup_view'].forEach(code => {
    consultantPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[4] = consultantPerms;
  initialMap['4'] = consultantPerms;
  initialMap['r4'] = consultantPerms;
  initialMap['مستشار'] = consultantPerms;

  // 5. موظف دعم فني — 14 permissions
  const supportPerms = {};
  ['sup_view','sup_reply','sup_note','sup_status','sup_priority','sup_assign','sup_transfer',
   'sup_close','sup_reopen','sup_log','u_view','not_view','rep_view','con_view'].forEach(code => {
    supportPerms[code] = { enabled: true, scope: (scopeMap[code] || []).includes('assigned') ? 'assigned' : 'own' };
  });
  initialMap[5] = supportPerms;
  initialMap['5'] = supportPerms;
  initialMap['r5'] = supportPerms;
  initialMap['موظف دعم فني'] = supportPerms;

  // 6. مسؤول مالي — 20 permissions
  const financePerms = {};
  ['pay_view','pay_ops','pay_issue','pay_edit','pay_cancel','pay_refund','pay_export',
   'tax_view','tax_add','tax_edit','tax_submit','tax_export',
   'rep_view','rep_create','rep_export','audit_view','audit_export',
   'u_view','con_view','not_view'].forEach(code => {
    financePerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[6] = financePerms;
  initialMap['6'] = financePerms;
  initialMap['r6'] = financePerms;
  initialMap['مسؤول مالي'] = financePerms;

  // 7. مسؤول خدمة العملاء — 15 permissions
  const csPerms = {};
  ['sup_view','sup_reply','sup_note','sup_status','sup_priority','sup_close',
   'con_view','con_detail','con_reschedule','u_view','u_edit',
   'not_view','not_send','c_view','rep_view'].forEach(code => {
    csPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[7] = csPerms;
  initialMap['7'] = csPerms;
  initialMap['r7'] = csPerms;
  initialMap['مسؤول خدمة العملاء'] = csPerms;

  // 8. مدقق للقراءة فقط / صادق للقراءة فقط — 8 permissions
  const auditorPerms = {};
  ['u_view','c_view','con_view','con_detail','tax_view','pay_view','rep_view','audit_view'].forEach(code => {
    auditorPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[8] = auditorPerms;
  initialMap['8'] = auditorPerms;
  initialMap['r8'] = auditorPerms;
  initialMap['مدقق للقراءة فقط'] = auditorPerms;
  initialMap['صادق للقراءة فقط'] = auditorPerms;

  // 9. محرر مساعد — 10 permissions
  const assistantEditorPerms = {};
  ['c_view','c_add','c_edit','c_review','ai_use','not_view','rep_view','u_view','con_view','con_summary_view'].forEach(code => {
    assistantEditorPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[9] = assistantEditorPerms;
  initialMap['9'] = assistantEditorPerms;
  initialMap['r9'] = assistantEditorPerms;
  initialMap['محرر مساعد'] = assistantEditorPerms;

  // 10. مسؤول التسويق — 12 permissions
  const marketingPerms = {};
  ['not_view','not_send','not_manage','c_view','c_add','c_edit',
   'rep_view','rep_create','rep_export','u_view','con_view','ai_use'].forEach(code => {
    marketingPerms[code] = { enabled: true, scope: 'own' };
  });
  initialMap[10] = marketingPerms;
  initialMap['10'] = marketingPerms;
  initialMap['r10'] = marketingPerms;
  initialMap['مسؤول التسويق'] = marketingPerms;

  return initialMap;
}

// Permissions each named role is expected to have (for effective view inference)
export const USER_ROLE_PERMISSION_SOURCES = {
  'مستشار':        ['con_view','con_detail','con_reschedule','con_summary_view','con_rec_view','ai_use'],
  'مراجع المحتوى': ['c_view','c_edit','c_review','c_archive'],
  'مدير المحتوى':  ['c_view','c_add','c_edit','c_review','c_approve','c_publish','c_archive'],
  'مسؤول مالي':   ['pay_view','pay_ops','pay_issue','pay_edit','pay_refund'],
  // مدير المنصة gets all — computed dynamically in component
};

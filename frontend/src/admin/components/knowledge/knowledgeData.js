export const KIND_OPTIONS = {
  all: 'كل الأنواع',
  law: 'قانون',
  regulation: 'نظام',
  instruction: 'تعليمات',
  interpretation: 'قرار تفسيري',
  circular: 'تعميم',
  precedent: 'حكم قضائي'
};

export const KIND_SELECT_OPTIONS = [
  { value: 'law', label: 'قانون' },
  { value: 'regulation', label: 'نظام' },
  { value: 'instruction', label: 'تعليمات' },
  { value: 'interpretation', label: 'قرار تفسيري' },
  { value: 'circular', label: 'تعميم' },
  { value: 'precedent', label: 'حكم قضائي' }
];

export const KIND_FILTER_OPTIONS = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'law', label: 'تشريعات وقوانين' },
  { value: 'precedent', label: 'أحكام' }
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'active', label: 'مفعل' },
  { value: 'inactive', label: 'غير مفعل' }
];

export const RELATION_TYPE_OPTIONS = [
  { value: 'none', label: 'تشريع مستقل (بدون ارتباط مباشر)' },
  { value: 'issued_under', label: 'صدر بموجبه (تشريع تنفيذي لاحق)' },
  { value: 'repealed_by', label: 'ملغي بموجب (تشريع سابق ملغى)' }
];

export const SUB_CATEGORY_LEGAL_OPTIONS = [
  { value: 'الأنظمة', label: 'الأنظمة' },
  { value: 'القرارات', label: 'القرارات' },
  { value: 'التعليمات', label: 'التعليمات' },
  { value: 'القوانين', label: 'القوانين' },
  { value: 'أحكام ملزمة', label: 'أحكام ملزمة' },
  { value: 'جداول', label: 'جداول' },
  { value: 'ملاحق', label: 'ملاحق' }
];

export const COURT_JUDICIAL_OPTIONS = [
  { value: 'تمييز حقوق', label: 'تمييز حقوق' },
  { value: 'تمييز جزاء', label: 'تمييز جزاء' },
  { value: 'قضاء دستوري', label: 'قضاء دستوري' },
  { value: 'قضاء إداري', label: 'قضاء إداري' },
  { value: 'الدرجة الأولى', label: 'الدرجة الأولى' },
  { value: 'بداية حقوق ضريبية', label: 'بداية حقوق ضريبية' }
];

export const DOCUMENT_STATUS_OPTIONS = [
  { value: 'ساري', label: 'ساري النفاذ' },
  { value: 'معدل وتعديلاته', label: 'معدل وتعديلاته' },
  { value: 'ملغي', label: 'ملغي' },
  { value: 'مؤقت', label: 'قانون مؤقت' }
];

export const EMPTY_FORM = {
  id: null,
  title: '',
  kind: 'law',
  code: '',
  body: '',
  year: new Date().getFullYear(),
  tags: '',
  sourceUrl: '',
  isActive: true,
  fileName: null,
  fileSize: null,
  related_laws: [],
  relation_type: 'none',
  sub_category: 'الأنظمة',
  document_status: 'ساري',
  notes: ''
};

export const COURT_OPTIONS = [
  { value: 'cassation_rights', label: 'محكمة التمييز بصفتها الحقوقية' },
  { value: 'cassation_penal', label: 'محكمة التمييز بصفتها الجزائية' },
  { value: 'admin_supreme', label: 'المحكمة الإدارية العليا' },
  { value: 'cassation_general', label: 'محكمة التمييز (الهيئة العامة)' },
  { value: 'tax_appeal', label: 'محكمة الاستئناف الضريبية' },
  { value: 'tax_first_instance', label: 'محكمة البداية الضريبية' },
  { value: 'interpretation_bureau', label: 'ديوان خاص بتفسير القوانين' }
];

export const getAuthHeaders = () => {
  let token = null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)(?:token|access_token)=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  } catch {}
  if (!token) {
    try {
      const match = document.cookie.match(/(^| )(?:token|admin_token)=([^;]+)/);
      if (match) token = decodeURIComponent(match[2]);
    } catch {}
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const EMPTY_RULING_FORM = {
  id: null,
  title: '',
  court: 'cassation_rights',
  court_category: 'تمييز حقوق',
  caseNumber: '',
  legalArticle: '',
  year: new Date().getFullYear(),
  tags: '',
  principle: '',
  sourceUrl: '',
  fileName: null,
  related_laws: [],
  document_status: 'ساري',
  notes: ''
};

export function parseTags(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str.split(/[،,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 20);
}


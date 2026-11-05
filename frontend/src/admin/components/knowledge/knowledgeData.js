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
  { value: 'precedent', label: 'أحكام قضائية' }
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'active', label: 'مفعل' },
  { value: 'inactive', label: 'غير مفعل' }
];

export const ENTITY_TYPE_OPTIONS = [
  { value: 'all', label: 'كل الصفات' },
  { value: 'individual', label: 'الأفراد' },
  { value: 'sole_proprietorship', label: 'مؤسسات فردية' },
  { value: 'llc', label: 'ذات مسؤولية محدودة' },
  { value: 'private_shareholding', label: 'مساهمة خاصة' },
  { value: 'public_shareholding', label: 'مساهمة عامة' },
  { value: 'general_partnership', label: 'تضامن' },
  { value: 'limited_partnership', label: 'توصية بسيطة' },
  { value: 'non_profit', label: 'غير ربحية' }
];

export const SECTOR_OPTIONS = [
  { value: 'all', label: 'كل القطاعات' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'services', label: 'خدمات' },
  { value: 'agricultural', label: 'زراعي' }
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
  fileSize: null
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
    try { token = localStorage.getItem('token') || localStorage.getItem('access_token'); } catch {}
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const EMPTY_RULING_FORM = {
  id: null,
  title: '',
  court: 'cassation_rights',
  caseNumber: '',
  legalArticle: '',
  year: new Date().getFullYear(),
  tags: '',
  principle: '',
  sourceUrl: '',
  fileName: null
};

export function parseTags(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str.split(/[،,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 20);
}


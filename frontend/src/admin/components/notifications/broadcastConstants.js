export const TARGET_GROUP_OPTIONS = [
  { value: 'all', label: 'كافة المسجلين (المستخدمين والمستشارين)' },
  { value: 'users', label: 'المستخدمين والشركات' },
  { value: 'consultants', label: 'المستشارين فقط' }
];

export const LEGAL_FORM_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'individual', label: 'فرد' },
  { value: 'sole_proprietorship', label: 'مؤسسة فردية' },
  { value: 'llc', label: 'شركة ذات مسؤولية محدودة' },
  { value: 'private_joint_stock', label: 'شركة مساهمة خاصة' },
  { value: 'public_joint_stock', label: 'شركة مساهمة عامة' },
  { value: 'general_partnership', label: 'شركة تضامن' },
  { value: 'limited_partnership', label: 'شركة توصية بسيطة' },
  { value: 'independent_entity', label: 'هيئة مستقلة' },
  { value: 'researcher', label: 'باحث / أكاديمي' },
  { value: 'association', label: 'جمعيات' },
  { value: 'non_profit', label: 'غير ربحية' }
];

export const SECTOR_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'services', label: 'قطاع خدمات' },
  { value: 'technology', label: 'قطاع تكنولوجيا' },
  { value: 'industrial', label: 'قطاع صناعي' },
  { value: 'commercial', label: 'قطاع تجاري' },
  { value: 'agricultural', label: 'قطاع زراعي' }
];

// Consultant Titles (Strictly 3 options)
export const CONSULTANT_TITLE_OPTIONS = [
  { value: 'أ.', label: 'أ.' },
  { value: 'أ.د.', label: 'أ.د.' },
  { value: 'د.', label: 'د.' }
];

// 7 Approved Professional Titles ("المسمى المهني")
export const CONSULTANT_ACTIVITY_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'مستشار ضريبي', label: 'مستشار ضريبي' },
  { value: 'خبير ضريبي', label: 'خبير ضريبي' },
  { value: 'مستشار قانوني', label: 'مستشار قانوني' },
  { value: 'محاسب قانوني', label: 'محاسب قانوني' },
  { value: 'مدقق حسابات', label: 'مدقق حسابات' },
  { value: 'مدقق ضريبي', label: 'مدقق ضريبي' },
  { value: 'مستشار جمركي', label: 'مستشار جمركي' }
];

export const CONSULTANT_REGISTRATION_ACTIVITIES = [
  { value: 'مستشار ضريبي', label: 'مستشار ضريبي' },
  { value: 'خبير ضريبي', label: 'خبير ضريبي' },
  { value: 'مستشار قانوني', label: 'مستشار قانوني' },
  { value: 'محاسب قانوني', label: 'محاسب قانوني' },
  { value: 'مدقق حسابات', label: 'مدقق حسابات' },
  { value: 'مدقق ضريبي', label: 'مدقق ضريبي' },
  { value: 'مستشار جمركي', label: 'مستشار جمركي' }
];

// 17 Approved Specializations
export const CONSULTANT_SPECIALIZATION_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'ضريبة الدخل والمبيعات', label: 'ضريبة الدخل والمبيعات' },
  { value: 'المناطق الحرة والتنموية', label: 'المناطق الحرة والتنموية' },
  { value: 'منطقة العقبة الاقتصادية الخاصة', label: 'منطقة العقبة الاقتصادية الخاصة' },
  { value: 'قوانين الإستثمار', label: 'قوانين الإستثمار' },
  { value: 'قوانين الجمارك', label: 'قوانين الجمارك' },
  { value: 'الضرائب الدولية', label: 'الضرائب الدولية' },
  { value: 'الإزدواج الضريبي', label: 'الإزدواج الضريبي' },
  { value: 'الأسعار التحويلية', label: 'الأسعار التحويلية' },
  { value: 'الضريبة الخاصة', label: 'الضريبة الخاصة' },
  { value: 'المنازعات الضريبية', label: 'المنازعات الضريبية' },
  { value: 'إدارة المخاطر', label: 'إدارة المخاطر' },
  { value: 'تدقيق الحسابات', label: 'تدقيق الحسابات' },
  { value: 'التدقيق الداخلي', label: 'التدقيق الداخلي' },
  { value: 'الإعسار', label: 'الإعسار' },
  { value: 'التصفية', label: 'التصفية' },
  { value: 'التخطيط الضريبي', label: 'التخطيط الضريبي' },
  { value: 'الإمتثال الضريبي', label: 'الإمتثال الضريبي' }
];

export const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'عادي' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
  { value: 'urgent', label: 'عاجل جداً' }
];

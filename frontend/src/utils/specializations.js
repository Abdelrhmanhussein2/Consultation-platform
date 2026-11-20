/**
 * Official 17 Specializations for the Diwan Platform
 */
export const OFFICIAL_17_SPECIALIZATIONS = [
  { id: 1, name: 'ضريبة الدخل والمبيعات', description: 'استشارات وقوانين ضريبة الدخل والمبيعات والامتثال' },
  { id: 2, name: 'المناطق الحرة والتنموية', description: 'الأنظمة والحوافز الخاصة بالمناطق الحرة والتنموية' },
  { id: 3, name: 'منطقة العقبة الاقتصادية الخاصة', description: 'تشريعات وإجراءات منطقة العقبة الاقتصادية الخاصة' },
  { id: 4, name: 'قوانين الإستثمار', description: 'حوافز وتشريعات البيئة الاستثمارية والشركات' },
  { id: 5, name: 'قوانين الجمارك', description: 'التعريفات الجمركية والتخليص وقوانين الجمارك' },
  { id: 6, name: 'الضرائب الدولية', description: 'الاتفاقيات الدولية والمعايير الضريبية العابرة للحدود' },
  { id: 7, name: 'الإزدواج الضريبي', description: 'تجنب الازدواج الضريبي وتطبيق الاتفاقيات الثنائية' },
  { id: 8, name: 'الأسعار التحويلية', description: 'سياسات الأسعار التحويلية والدراسات والملفات الموثقة' },
  { id: 9, name: 'الضريبة الخاصة', description: 'استشارات وتطبيقات الضريبة الخاصة والسلع الخاضعة' },
  { id: 10, name: 'المنازعات الضريبية', description: 'الاعتراضات والتسويات والدعاوى أمام المحاكم واللجان' },
  { id: 11, name: 'إدارة المخاطر', description: 'تقييم وإدارة المخاطر الضريبية والمالية' },
  { id: 12, name: 'تدقيق الحسابات', description: 'أعمال تدقيق البيانات المالية والمحاسبية القانونية' },
  { id: 13, name: 'التدقيق الداخلي', description: 'حوكمة الأنظمة والرقابة الداخلية والامتثال' },
  { id: 14, name: 'الإعسار', description: 'إجراءات وقوانين الإعسار وإعادة الهيكلة والتسوية' },
  { id: 15, name: 'التصفية', description: 'التصفية الاختيارية والإجبارية للشركات والكيانات' },
  { id: 16, name: 'التخطيط الضريبي', description: 'التخطيط الاستراتيجي والهيكلة الضريبية القانونية' },
  { id: 17, name: 'الإمتثال الضريبي', description: 'إعداد الإقرارات والامتثال للمتطلبات الدورية' }
];

export const LEGACY_8_SPECIALIZATIONS = [];

// Main platform specializations
export const OFFICIAL_8_SPECIALIZATIONS = OFFICIAL_17_SPECIALIZATIONS;
export const OFFICIAL_15_SPECIALIZATIONS = OFFICIAL_17_SPECIALIZATIONS;

export const ALL_PLATFORM_SPECIALIZATIONS = OFFICIAL_17_SPECIALIZATIONS;

export const SPECIALIZATION_NAMES = OFFICIAL_17_SPECIALIZATIONS.map(s => s.name);

export function getSpecializationById(id) {
  const numId = Number(id);
  return ALL_PLATFORM_SPECIALIZATIONS.find(s => s.id === numId) || null;
}

export function getSpecializationName(id, fallback = 'ضريبة الدخل والمبيعات') {
  const spec = getSpecializationById(id);
  return spec ? spec.name : fallback;
}

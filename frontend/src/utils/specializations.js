/**
 * Official 8 Specializations for the Diwan Platform
 * Matches official platform catalog:
 * 1: ضريبي
 * 2: ضريبة المبيعات
 * 3: ضريبة الدخل
 * 4: جمارك
 * 5: مناطق حرة
 * 6: تسعير تحويلي
 * 7: قانوني
 * 8: تدقيق ومراجعة
 */
export const OFFICIAL_8_SPECIALIZATIONS = [
  { id: 1, name: 'ضريبي', description: 'استشارات وتخطيط ضريبي عام' },
  { id: 2, name: 'ضريبة المبيعات', description: 'استشارات ضريبة المبيعات العامة والخاصة والامتثال' },
  { id: 3, name: 'ضريبة الدخل', description: 'إقرارات واستشارات وتدقيق ضريبة الدخل للأفراد والشركات' },
  { id: 4, name: 'جمارك', description: 'التعريفات الجمركية، التخليص، وقوانين الجمارك' },
  { id: 5, name: 'مناطق حرة', description: 'الحوافز الضريبية والأنظمة الخاصة بالمناطق الحرة والتنموية' },
  { id: 6, name: 'تسعير تحويلي', description: 'سياسات التسعير التحويلي والملفات المحلية والمركزية' },
  { id: 7, name: 'قانوني', description: 'الاستشارات القانونية والاعتراضات والنزاعات الضريبية' },
  { id: 8, name: 'تدقيق ومراجعة', description: 'تدقيق الحسابات والتدقيق الداخلي والمراجعة المالية' }
];

// Backward-compatibility alias
export const OFFICIAL_15_SPECIALIZATIONS = OFFICIAL_8_SPECIALIZATIONS;

export const SPECIALIZATION_NAMES = OFFICIAL_8_SPECIALIZATIONS.map(s => s.name);

export function getSpecializationById(id) {
  const numId = Number(id);
  return OFFICIAL_8_SPECIALIZATIONS.find(s => s.id === numId) || null;
}

export function getSpecializationName(id, fallback = 'ضريبي') {
  const spec = getSpecializationById(id);
  return spec ? spec.name : fallback;
}

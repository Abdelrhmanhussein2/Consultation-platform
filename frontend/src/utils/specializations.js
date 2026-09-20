/**
 * Official 15 Specializations for the Diwan Platform
 * Used across Consultants catalog, Quick Consultation, Profile, Filters, and Admin panels.
 */
export const OFFICIAL_15_SPECIALIZATIONS = [
  { id: 1, name: 'ضريبة الدخل والمبيعات', description: 'استشارات وتدقيق ضريبة الدخل وضريبة المبيعات العامة' },
  { id: 2, name: 'المناطق الحرة والتنموية', description: 'الحوافز الضريبية والأنظمة الخاصة بالمناطق التنموية والحرة' },
  { id: 3, name: 'منطقة العقبة الاقتصادية الخاصة', description: 'التشريعات والامتيازات الضريبية والجمركية في منطقة العقبة' },
  { id: 4, name: 'قوانين الإستثمار', description: 'قوانين البيئة الاستثمارية والاعفاءات والحوافز للمستثمرين' },
  { id: 5, name: 'قوانين الجمارك', description: 'التعريفات الجمركية، التخليص، وقوانين الجمارك الأردنية والدولية' },
  { id: 6, name: 'الضرائب الدولية', description: 'المعايير الدولية للضرائب وتخطيط الضرائب عبر الحدود' },
  { id: 7, name: 'الإزدواج الضريبي', description: 'اتفاقيات تجنب الازدواج الضريبي وحماية الحقوق المالية الدولية' },
  { id: 8, name: 'الأسعار التحويلية', description: 'سياسات التسعير التحويلي والملفات المحلية والمركزية للشركات' },
  { id: 9, name: 'الضريبة الخاصة', description: 'السلع والخدمات الخاضعة للضريبة الخاصة وآليات احتسابها' },
  { id: 10, name: 'المنازعات الضريبية', description: 'الاعتراضات، لجان التسوية، وقضايا المحاكم الضريبية' },
  { id: 11, name: 'إدارة المخاطر', description: 'إدارة المخاطر المالية والضريبية والامتثال الرقابي' },
  { id: 12, name: 'تدقيق الحسابات', description: 'التدقيق المالي الخارجي والقوائم المالية المعتمدة' },
  { id: 13, name: 'التدقيق الداخلي', description: 'مراجعة الأنظمة الرقابية الداخلية وضبط العمليات المالية' },
  { id: 14, name: 'الإعسار', description: 'قوانين وإجراءات الإعسار وحماية الدائنين والمدينين' },
  { id: 15, name: 'التصفية', description: 'تصفية الشركات والكيانات التجارية وإنهاء الالتزامات الضريبية' }
];

export const SPECIALIZATION_NAMES = OFFICIAL_15_SPECIALIZATIONS.map(s => s.name);

export function getSpecializationById(id) {
  const numId = Number(id);
  return OFFICIAL_15_SPECIALIZATIONS.find(s => s.id === numId) || null;
}

export function getSpecializationName(id, fallback = 'ضريبة الدخل والمبيعات') {
  const spec = getSpecializationById(id);
  return spec ? spec.name : fallback;
}

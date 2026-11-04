// frontend/src/components/TaxForms/taxFormsData.js
// Official Tax Forms & Legal Templates Dataset (Matching Platform Specifications)

export const TAX_FORM_CATEGORIES = [
  'الكل',
  'ضريبة الدخل',
  'ضريبة المبيعات',
  'العقود',
  'الشركات',
  'العمل والضمان'
];

export const INITIAL_TAX_FORMS = [
  {
    id: 'F-IT-IND-24',
    code: 'F-IT-IND-24',
    title: 'نموذج إقرار ضريبة الدخل للأفراد — 2024',
    cat: 'ضريبة الدخل',
    desc: 'النموذج الرسمي لتقديم الإقرار السنوي للأفراد.',
    lang: 'AR/EN',
    format: 'PDF · DOCX',
    fileSize: '1.2 MB',
    downloadsCount: 1420
  },
  {
    id: 'F-IT-CORP-24',
    code: 'F-IT-CORP-24',
    title: 'نموذج إقرار ضريبة الدخل للشركات',
    cat: 'ضريبة الدخل',
    desc: 'الإقرار السنوي للشركات المساهمة وذات المسؤولية المحدودة.',
    lang: 'AR',
    format: 'PDF',
    fileSize: '2.4 MB',
    downloadsCount: 980
  },
  {
    id: 'F-GST-M-24',
    code: 'F-GST-M-24',
    title: 'نموذج إقرار ضريبة المبيعات الشهري',
    cat: 'ضريبة المبيعات',
    desc: 'إقرار شهري بضريبة المبيعات المستحقة.',
    lang: 'AR',
    format: 'PDF · XLSX',
    fileSize: '850 KB',
    downloadsCount: 2150
  },
  {
    id: 'F-GST-REF',
    code: 'F-GST-REF',
    title: 'طلب استرداد ضريبة مدخلات',
    cat: 'ضريبة المبيعات',
    desc: 'نموذج لطلب استرداد ضريبة المبيعات المدفوعة على المدخلات.',
    lang: 'AR',
    format: 'PDF',
    fileSize: '1.1 MB',
    downloadsCount: 640
  },
  {
    id: 'C-SUP-01',
    code: 'C-SUP-01',
    title: 'عقد توريد سلع وخدمات (نموذجي)',
    cat: 'العقود',
    desc: 'عقد جاهز يمكن تخصيصه لتنظيم علاقات التوريد.',
    lang: 'AR',
    format: 'DOCX',
    fileSize: '320 KB',
    downloadsCount: 1890
  },
  {
    id: 'C-EMP-02',
    code: 'C-EMP-02',
    title: 'عقد عمل غير محدد المدة',
    cat: 'العقود',
    desc: 'نموذج عقد عمل وفق قانون العمل الأردني.',
    lang: 'AR',
    format: 'DOCX',
    fileSize: '290 KB',
    downloadsCount: 3120
  },
  {
    id: 'F-COMP-LLC',
    code: 'F-COMP-LLC',
    title: 'نموذج تأسيس شركة ذات مسؤولية محدودة',
    cat: 'الشركات',
    desc: 'النموذج المعتمد من مراقبة الشركات.',
    lang: 'AR',
    format: 'PDF',
    fileSize: '1.8 MB',
    downloadsCount: 750
  },
  {
    id: 'F-SSC-NEW',
    code: 'F-SSC-NEW',
    title: 'نموذج تسجيل عامل في الضمان الاجتماعي',
    cat: 'العمل والضمان',
    desc: 'تسجيل موظف جديد في الضمان الاجتماعي.',
    lang: 'AR',
    format: 'PDF',
    fileSize: '950 KB',
    downloadsCount: 1680
  }
];


export const STATUS_CONFIG = {
  'draft': { label: 'مسودة', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: 'fa-pen' },
  'new': { label: 'جديد', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: 'fa-circle' },
  'received': { label: 'تم الاستلام', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: 'fa-check-circle' },
  'reviewing': { label: 'قيد المراجعة', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'fa-magnifying-glass' },
  'waiting_user': { label: 'بانتظار رد المستخدم', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-clock' },
  'in_progress': { label: 'قيد المعالجة', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'fa-spinner fa-spin' },
  'escalated': { label: 'تم التصعيد', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'fa-arrow-up' },
  'resolved': { label: 'تم الحل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-check' },
  'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: 'fa-lock' },
  'reopened': { label: 'أعيد فتحه', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'fa-rotate-left' },
  'open': { label: 'مفتوح', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'fa-envelope-open' }
};

export const PRIORITY_CONFIG = {
  'low': { label: 'منخفضة', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: 'fa-arrow-down' },
  'medium': { label: 'متوسطة', color: 'bg-yellow-50 text-yellow-700 border-yellow-300', icon: 'fa-minus' },
  'high': { label: 'عالية', color: 'bg-red-50 text-red-700 border-red-200', icon: 'fa-arrow-up' }
};

export const CATEGORIES = {
  'ai_assistant': {
    label: 'المساعد الذكي',
    icon: 'fa-robot',
    description: 'الأسئلة والمعلومات، دقة الإجابات، المصادر والروابط المرجعية',
    subs: {
      'إجابة غير صحيحة': {
        priority: 'متوسطة',
        fields: [
          { id: 'question', label: 'السؤال الذي طرحته للمساعد الذكي', type: 'textarea', required: true, placeholder: 'مثال: كيف يتم حساب ضريبة الدخل للشركات؟' },
          { id: 'wrong_part', label: 'أي جزء من الإجابة تعتقد أنه غير صحيح؟', type: 'textarea', required: true },
          { id: 'expected', label: 'ما الإجابة أو التوضيح الذي كنت تتوقعه؟', type: 'textarea', required: false },
          { id: 'chat_link', label: 'رابط المحادثة إن وجد', type: 'url', required: false }
        ]
      },
      'إجابة ناقصة': {
        priority: 'متوسطة',
        fields: [
          { id: 'question', label: 'السؤال الذي طرحته للمساعد الذكي', type: 'textarea', required: true },
          { id: 'missing_part', label: 'ما هي المعلومات أو التفاصيل الناقصة؟', type: 'textarea', required: true },
          { id: 'chat_link', label: 'رابط المحادثة إن وجد', type: 'url', required: false }
        ]
      },
      'لم يفهم السؤال': {
        priority: 'منخفضة',
        fields: [
          { id: 'question', label: 'السؤال الذي طرحته للمساعد الذكي', type: 'textarea', required: true },
          { id: 'ai_response', label: 'ما هي الإجابة غير المفهومة التي تلقيتها؟', type: 'textarea', required: false },
          { id: 'expected', label: 'ما هي طبيعة الإجابة التي كنت تتوقعها؟', type: 'textarea', required: false }
        ]
      },
      'مصدر غير صحيح': {
        priority: 'متوسطة',
        fields: [
          { id: 'question', label: 'السؤال الذي طرحته', type: 'textarea', required: true },
          { id: 'source_name', label: 'اسم المصدر أو المرجع غير الصحيح', type: 'text', required: true, placeholder: 'مثال: قانون ضريبة المبيعات مادة (6)' },
          { id: 'source_issue', label: 'ما وجه الخطأ في المصدر المستدل به؟', type: 'textarea', required: true }
        ]
      },
      'رابط المصدر لا يعمل': {
        priority: 'منخفضة',
        fields: [
          { id: 'source_name', label: 'اسم المصدر أو المرجع المعطل', type: 'text', required: true },
          { id: 'source_url', label: 'رابط المصدر المعطل إن وجد', type: 'url', required: true }
        ]
      },
      'مشكلة في المحادثة': {
        priority: 'متوسطة',
        fields: [
          { id: 'chat_error_desc', label: 'صف المشكلة التقنية أثناء استخدام الشات الفني', type: 'textarea', required: true }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف تفاصيل المشكلة أو استفسارك بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'consultation': {
    label: 'الحجوزات والاستشارات',
    icon: 'fa-calendar-check',
    description: 'حجز استشارات، إدارة المواعيد، الجلسات، المستشارون، والتقييمات',
    subs: {
      'حجز استشارة': {
        priority: 'متوسطة',
        fields: [
          { id: 'consultant_name', label: 'اسم المستشار المفضل إن وجد', type: 'text', required: false },
          { id: 'preferred_date', label: 'الموعد المفضل وتفضيلات الوقت', type: 'text', required: true, placeholder: 'مثال: الأحد القادم صباحاً' },
          { id: 'consultation_type', label: 'نوع الاستشارة المطلوبة', type: 'select', required: true, options: ['استشارة ضريبية', 'استشارة قانونية', 'استشارة مالية'] }
        ]
      },
      'تعديل موعد': {
        priority: 'متوسطة',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة أو الحجز المراد تعديله', type: 'text', required: true, placeholder: 'مثال: #100234' },
          { id: 'consultant_name', label: 'اسم المستشار المعين للجلسة', type: 'text', required: true },
          { id: 'new_preferred_date', label: 'الموعد والوقت الجديد المقترح', type: 'text', required: true },
          { id: 'reason', label: 'سبب طلب التعديل للموعد', type: 'textarea', required: true }
        ]
      },
      'إلغاء موعد': {
        priority: 'متوسطة',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة أو الحجز المراد إلغاؤه', type: 'text', required: true },
          { id: 'reason', label: 'سبب رغبتك في إلغاء الحجز المعتمد', type: 'textarea', required: true }
        ]
      },
      'مشكلة مع المستشار': {
        priority: 'عالية',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة (اختياري)', type: 'text', required: false },
          { id: 'consultant_name', label: 'اسم المستشار المعني بالشكوى', type: 'text', required: true },
          { id: 'complaint_details', label: 'تفاصيل المشكلة أو الشكوى بالتفصيل', type: 'textarea', required: true }
        ]
      },
      'مشكلة في جلسة الفيديو': {
        priority: 'عالية',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة المعنية', type: 'text', required: true },
          { id: 'video_issue_type', label: 'نوع المشكلة التقنية في مكالمة الفيديو', type: 'select', required: true, options: ['لم أتمكن من دخول الجلسة', 'انقطاع متكرر للاتصال', 'مشكلة صوت', 'مشكلة صورة', 'أخرى'] },
          { id: 'device_type', label: 'نوع جهازك المستخدم', type: 'select', required: false, options: ['حاسوب محمول/مكتبي', 'هاتف ذكي', 'جهاز لوحي'] }
        ]
      },
      'ملخص الاستشارة': {
        priority: 'منخفضة',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة أو موعد الاستشارة', type: 'text', required: true },
          { id: 'clarification_needed', label: 'ما هو التوضيح أو التعديل المطلوب على ملخص الجلسة؟', type: 'textarea', required: true }
        ]
      },
      'التوصيات': {
        priority: 'منخفضة',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة المعنية', type: 'text', required: true },
          { id: 'clarification_needed', label: 'ما هو الاستفسار أو التعديل المطلوب على التوصيات المستلمة؟', type: 'textarea', required: true }
        ]
      },
      'تقييم الاستشارة': {
        priority: 'منخفضة',
        fields: [
          { id: 'session_number', label: 'رقم الجلسة المعنية', type: 'text', required: true },
          { id: 'clarification_needed', label: 'وصف لملاحظتك على تقييم الجلسة أو تعديل التقييم', type: 'textarea', required: true }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف استفسارك أو مشكلتك المتعلقة بالاستشارات بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'billing': {
    label: 'الفواتير والمدفوعات',
    icon: 'fa-file-invoice-dollar',
    description: 'عمليات الدفع، خصم مكرر، فواتير، واسترداد الأموال',
    subs: {
      'عملية دفع فاشلة': {
        priority: 'عالية',
        fields: [
          { id: 'amount', label: 'المبلغ المدفوع بالدينار الأردني', type: 'text', required: true },
          { id: 'payment_method', label: 'وسيلة الدفع المستخدمة', type: 'select', required: true, options: ['بطاقة ائتمان', 'مدى', 'Apple Pay', 'تحويل بنكي', 'أخرى'] },
          { id: 'transaction_date', label: 'تاريخ ووقت المحاولة', type: 'text', required: false }
        ]
      },
      'خصم مكرر': {
        priority: 'عالية',
        fields: [
          { id: 'amount', label: 'المبلغ المخصوم بالدينار الأردني', type: 'text', required: true },
          { id: 'transaction_id', label: 'رقم العملية البنكية أو الرقم المرجعي للخصم المكرر', type: 'text', required: true },
          { id: 'payment_method', label: 'وسيلة الدفع', type: 'select', required: true, options: ['بطاقة ائتمان', 'مدى', 'Apple Pay', 'تحويل بنكي', 'أخرى'] }
        ]
      },
      'فاتورة غير موجودة': {
        priority: 'متوسطة',
        fields: [
          { id: 'billing_period', label: 'الفترة أو الشهر المطلوب للفاتورة المفقودة', type: 'text', required: true, placeholder: 'مثال: فاتورة شهر يوليو 2026' }
        ]
      },
      'بيانات فاتورة غير صحيحة': {
        priority: 'متوسطة',
        fields: [
          { id: 'invoice_num', label: 'رقم الفاتورة الخاطئة', type: 'text', required: true },
          { id: 'invoice_issue_desc', label: 'ما هي البيانات غير الصحيحة في الفاتورة؟ (الاسم، الضريبة، القيمة)', type: 'textarea', required: true }
        ]
      },
      'استرداد مبلغ': {
        priority: 'عالية',
        fields: [
          { id: 'invoice_num', label: 'رقم الفاتورة أو العملية المعنية بالاسترداد', type: 'text', required: true },
          { id: 'amount', label: 'المبلغ المطلوب استرداده', type: 'text', required: true },
          { id: 'refund_reason', label: 'سبب طلب استرداد المبلغ المالي بالتفصيل', type: 'textarea', required: true }
        ]
      },
      'مشكلة في وسيلة الدفع': {
        priority: 'متوسطة',
        fields: [
          { id: 'payment_method', label: 'وسيلة الدفع التي تحاول إضافتها أو استخدامها', type: 'select', required: true, options: ['بطاقة ائتمان', 'مدى', 'Apple Pay', 'تحويل بنكي', 'أخرى'] },
          { id: 'error_shown', label: 'رسالة الخطأ التي تظهر لك أثناء الحفظ', type: 'textarea', required: false }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف استفسارك أو شكواك المالية بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'account': {
    label: 'الحساب والاشتراك',
    icon: 'fa-user-circle',
    description: 'تسجيل الدخول، الصلاحيات، تجديد الاشتراك، وإلغاء الحساب',
    subs: {
      'مشكلة تسجيل الدخول': {
        priority: 'عالية',
        fields: [
          { id: 'login_email', label: 'البريد الإلكتروني المستخدم لتسجيل الدخول للحساب', type: 'text', required: true },
          { id: 'login_error', label: 'رسالة الخطأ التي تظهر لك إن وجدت', type: 'textarea', required: false }
        ]
      },
      'تحديث بيانات الحساب': {
        priority: 'منخفضة',
        fields: [
          { id: 'update_fields', label: 'ما هي البيانات التي تود تحديثها؟', type: 'checkbox', required: true, options: ['الاسم بالكامل', 'رقم الهاتف', 'البريد الإلكتروني', 'بيانات الشركة والفوترة', 'أخرى'] },
          { id: 'new_details', label: 'البيانات الجديدة المراد إثباتها وتحديثها', type: 'textarea', required: true }
        ]
      },
      'تغيير كلمة المرور': {
        priority: 'منخفضة',
        fields: [
          { id: 'password_issue', label: 'صف المشكلة التي تواجهك عند محاولة تغيير كلمة المرور', type: 'textarea', required: true }
        ]
      },
      'تجديد الاشتراك': {
        priority: 'متوسطة',
        fields: [
          { id: 'requested_plan', label: 'الباقة المطلوب تجديد الاشتراك فيها', type: 'select', required: true, options: ['الباقة الاحترافية', 'باقة المؤسسات'] },
          { id: 'renew_period', label: 'دورة الاشتراك المطلوبة', type: 'select', required: true, options: ['شهري', 'سنوي'] }
        ]
      },
      'ترقية الباقة': {
        priority: 'متوسطة',
        fields: [
          { id: 'requested_plan', label: 'الباقة المطلوب الترقية إليها', type: 'select', required: true, options: ['الباقة الاحترافية', 'باقة المؤسسات'] },
          { id: 'renew_period', label: 'دورة الاشتراك المطلوبة', type: 'select', required: true, options: ['شهري', 'سنوي'] }
        ]
      },
      'إلغاء الاشتراك': {
        priority: 'متوسطة',
        fields: [
          { id: 'cancel_reason', label: 'سبب رغبتك في إلغاء الاشتراك الحالي بالبوابة', type: 'textarea', required: true }
        ]
      },
      'صلاحيات الباقة': {
        priority: 'عالية',
        fields: [
          { id: 'missing_permission', label: 'الميزة أو الصفحة التي لا تملك الصلاحية للوصول إليها', type: 'text', required: true, placeholder: 'مثال: الاستشارة السريعة' },
          { id: 'current_plan', label: 'باقة اشتراكك الحالية بالمنصة', type: 'select', required: true, options: ['المجانية', 'الاحترافية', 'المؤسسات'] }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف استفسارك عن الحساب بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'technical': {
    label: 'المشاكل التقنية',
    icon: 'fa-bug',
    description: 'الأخطاء، بطء الأداء، مشاكل الرفع، والواجهات',
    subs: {
      'الصفحة لا تعمل': {
        priority: 'عالية',
        fields: [
          { id: 'tech_page', label: 'رابط الصفحة المعطلة أو اسم الصفحة (URL)', type: 'text', required: true, placeholder: 'مثال: /support/new-ticket' },
          { id: 'tech_doing', label: 'ماذا كنت تحاول أن تفعل عند توقف الصفحة؟', type: 'textarea', required: true },
          { id: 'device_type', label: 'نوع الجهاز المستخدم', type: 'select', required: true, options: ['كمبيوتر محمول/مكتبي', 'هاتف آيفون/iOS', 'هاتف أندرويد', 'جهاز تابلت/لوحي'] },
          { id: 'browser', label: 'نوع متصفح الويب الخاص بك', type: 'select', required: true, options: ['Chrome', 'Safari', 'Firefox', 'Edge', 'أخرى'] }
        ]
      },
      'زر لا يعمل': {
        priority: 'متوسطة',
        fields: [
          { id: 'tech_page', label: 'رابط الصفحة التي يتواجد بها الزر المعطل', type: 'text', required: true },
          { id: 'button_name', label: 'اسم الزر أو مكانه بالصفحة', type: 'text', required: true },
          { id: 'tech_doing', label: 'ما هي العملية التقنية التي كنت تحاول تنفيذها؟', type: 'textarea', required: true }
        ]
      },
      'خطأ في النظام': {
        priority: 'عالية',
        fields: [
          { id: 'tech_page', label: 'رابط الصفحة التي ظهر بها الخطأ', type: 'text', required: true },
          { id: 'tech_doing', label: 'ماذا كنت تحاول أن تفعل؟', type: 'textarea', required: true },
          { id: 'device_type', label: 'نوع الجهاز', type: 'select', required: true, options: ['كمبيوتر محمول/مكتبي', 'هاتف آيفون/iOS', 'هاتف أندرويد', 'جهاز تابلت/لوحي'] },
          { id: 'browser', label: 'نوع متصفح الويب', type: 'select', required: true, options: ['Chrome', 'Safari', 'Firefox', 'Edge', 'أخرى'] }
        ]
      },
      'بطء في النظام': {
        priority: 'منخفضة',
        fields: [
          { id: 'tech_page', label: 'الصفحة التي تلاحظ فيها البطء أو التأخر بالتحميل', type: 'text', required: false },
          { id: 'slow_action', label: 'ما هي العملية المحددة التي تأخذ وقتاً طويلاً للتحميل؟', type: 'textarea', required: true }
        ]
      },
      'مشكلة في رفع الملفات': {
        priority: 'متوسطة',
        fields: [
          { id: 'upload_page', label: 'اسم الصفحة التي تحاول رفع الملفات بها', type: 'text', required: true },
          { id: 'file_type', label: 'صيغة وحجم الملف الذي فشل رفعه', type: 'text', required: true, placeholder: 'مثال: ملف PDF بحجم 12 ميجابايت' }
        ]
      },
      'مشكلة على الهاتف': {
        priority: 'متوسطة',
        fields: [
          { id: 'phone_model', label: 'نوع وطراز هاتفك الذكي', type: 'text', required: true, placeholder: 'مثال: iPhone 14 Pro' },
          { id: 'phone_os', label: 'نسخة نظام التشغيل بالهاتف', type: 'text', required: true, placeholder: 'مثال: iOS 16.4' },
          { id: 'tech_doing', label: 'صف المشكلة بالتفصيل عند استخدام الهاتف', type: 'textarea', required: true }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف المشكلة التقنية بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'legal': {
    label: 'الوثائق القانونية',
    icon: 'fa-file-contract',
    description: 'إنشاء الوثائق، إدخال البيانات، الحقول، والمراجعة والتعاون',
    subs: {
      'إنشاء الوثائق': {
        priority: 'متوسطة',
        fields: [
          { id: 'doc_name', label: 'اسم النموذج أو الوثيقة المعنية بالإنشاء', type: 'text', required: true, placeholder: 'مثال: عقد تأسيس شركة ذات مسؤولية محدودة' },
          { id: 'doc_error', label: 'وصف المشكلة أو النقص في صياغة النموذج المعني بالإنشاء', type: 'textarea', required: true }
        ]
      },
      'إدخال البيانات': {
        priority: 'متوسطة',
        fields: [
          { id: 'doc_name', label: 'اسم الوثيقة المعنية', type: 'text', required: true },
          { id: 'doc_error', label: 'صف المشكلة عند محاولة إدخال أو تعبئة البيانات بالنموذج', type: 'textarea', required: true }
        ]
      },
      'الحقول والخيارات': {
        priority: 'متوسطة',
        fields: [
          { id: 'doc_name', label: 'اسم الوثيقة', type: 'text', required: true },
          { id: 'doc_section', label: 'القسم أو الحقل المحدد الذي به خيارات غير مكتملة أو خاطئة', type: 'text', required: true },
          { id: 'doc_error', label: 'وصف الخلل في خيارات أو حقول الوثيقة', type: 'textarea', required: true }
        ]
      },
      'المراجعة والتعاون': {
        priority: 'متوسطة',
        fields: [
          { id: 'doc_name', label: 'اسم الوثيقة المعنية بمشاركتها مع فريقك', type: 'text', required: true },
          { id: 'collab_issue', label: 'طبيعة المشكلة عند محاولة المراجعة المشتركة أو مشاركة الملف', type: 'textarea', required: true }
        ]
      },
      'حالة الإقرار': {
        priority: 'عالية',
        fields: [
          { id: 'declaration_id', label: 'رقم الإقرار الضريبي المعني بالاستعلام', type: 'text', required: true },
          { id: 'declaration_issue', label: 'تفاصيل المشكلة أو الملاحظة بخصوص حالة الإقرار المذكور', type: 'textarea', required: true }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف تفاصيل المشكلة بالوثائق القانونية بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'withdrawal': {
    label: 'سحب الأرباح والمدفوعات للمستشارين',
    icon: 'fa-wallet',
    description: 'طلبات السحب، تفاصيل الحساب البنكي، والتحويلات المالية',
    subs: {
      'طلب سحب معلق': {
        priority: 'عالية',
        fields: [
          { id: 'payout_amount', label: 'مبلغ السحب المالي المعلق (د.أ)', type: 'text', required: true },
          { id: 'payout_date', label: 'تاريخ تقديم طلب السحب المعلق بالمنصة', type: 'text', required: false }
        ]
      },
      'تغيير الحساب البنكي': {
        priority: 'متوسطة',
        fields: [
          { id: 'bank_name', label: 'اسم البنك الجديد بالكامل', type: 'text', required: true },
          { id: 'iban', label: 'رقم الـ IBAN الجديد الخاص بك', type: 'text', required: true },
          { id: 'account_holder', label: 'اسم صاحب الحساب البنكي بالكامل الثلاثي', type: 'text', required: true }
        ]
      },
      'رفض طلب السحب': {
        priority: 'عالية',
        fields: [
          { id: 'refusal_reason_given', label: 'سبب الرفض المستلم أو رسالة الخطأ الظاهرة بالبوابة إن وجدت', type: 'textarea', required: false }
        ]
      },
      'فترة التحويل': {
        priority: 'منخفضة',
        fields: [
          { id: 'payout_amount', label: 'مبلغ التحويل المستعلم عنه', type: 'text', required: false }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف استفسارك المالي الخاص بالأرباح بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  },
  'other': {
    label: 'أخرى / الأسئلة العامة',
    icon: 'fa-circle-question',
    description: 'أي موضوع أو استفسار آخر لا يندرج تحت التصنيفات السابقة',
    subs: {
      'استفسار عام': {
        priority: 'منخفضة',
        fields: [
          { id: 'inquiry_subject', label: 'موضوع الاستفسار العام', type: 'text', required: true },
          { id: 'inquiry_body', label: 'تفاصيل الاستفسار العام وملاحظاتك', type: 'textarea', required: true }
        ]
      },
      'اقتراح لتطوير المنصة': {
        priority: 'منخفضة',
        fields: [
          { id: 'suggestion_desc', label: 'وصف الفكرة أو الاقتراح الجديد لتطوير الواجهات أو الخدمات', type: 'textarea', required: true }
        ]
      },
      'شكوى عامة': {
        priority: 'متوسطة',
        fields: [
          { id: 'complaint_desc', label: 'تفاصيل الشكوى العامة وملاحظاتك عن المنصة', type: 'textarea', required: true }
        ]
      },
      'أخرى': {
        priority: 'منخفضة',
        fields: [
          { id: 'other_desc', label: 'صف تفاصيل استفسارك بالتفصيل', type: 'textarea', required: true }
        ]
      }
    }
  }
};

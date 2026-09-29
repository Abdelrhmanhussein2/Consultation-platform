// frontend/src/services/legalService.js
// Service layer for Legal & Regulations APIs (/api/legal/*)

const API_BASE = '/api/legal';

// Fallback mock data matching exact tax law design
const MOCK_LAWS = [
  {
    law_id: "law_tax_34_2014",
    title: "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
    type: "قانون",
    status: "ساري",
    year_short: "2014",
    issue_date: "30-12-2014",
    effective_date: "01-01-2015",
    amended_date: "01-01-2019",
    total_articles: 82,
    summary: "ينظم قانون ضريبة الدخل الأردني الإعفاءات النسبية للشخص الطبيعي والاعتباري والشركات ومعدلات الخصم المباشر وحساب الأرباح الصافية.",
    score: "98%",
    match_reason: "تطابق تام مع نصوص ضريبة الدخل والإعفاءات المعتمدة"
  },
  {
    law_id: "law_sales_tax_1994",
    title: "قانون الضريبة العامة على المبيعات رقم 6 لسنة 1994 وتعديلاته",
    type: "قانون",
    status: "ساري",
    year_short: "1994",
    issue_date: "15-05-1994",
    effective_date: "01-06-1994",
    amended_date: "15-02-2021",
    total_articles: 64,
    summary: "يحدد ضوابط الخضوع لضريبة المبيعات والتسجيل والإعفاءات والرد الضريبي للمصدرين والخدمات المستثناة.",
    score: "91%",
    match_reason: "تطابق مع ضوابط التسجيل والإقرارات الضريبية"
  }
];

export async function searchLegal(query, limit = 20) {
  try {
    const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    console.warn("Using mock legal search data:", err);
    if (!query) return MOCK_LAWS;
    const filtered = MOCK_LAWS.filter(l => 
      l.title.includes(query) || l.summary.includes(query)
    );
    return filtered.length ? filtered : MOCK_LAWS;
  }
}

export async function getLawTree(lawId) {
  try {
    const res = await fetch(`${API_BASE}/laws/${lawId}`);
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    console.warn("Using mock law detail:", err);
    return getMockLawDetail(lawId);
  }
}

export async function getArticleHistory(lawId, articleNum) {
  try {
    const res = await fetch(`${API_BASE}/articles/${lawId}/${articleNum}/history`);
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    return {
      article_num: articleNum,
      current_version: "النص الساري الصادر بتعديل 2019 بموجب القانون المعدل رقم 38 لسنة 2018",
      previous_version: "النص الأصلي لعام 2014 قبل التعديل",
      amendment_date: "01-01-2019",
      changes_summary: "تم تعديل شرائح الإعفاء الشخصي والعائلي وتحديث نسبة الضريبة على القطاع المصرفي والمالي."
    };
  }
}

export async function getCitations(targetId) {
  try {
    const res = await fetch(`${API_BASE}/articles/${targetId}/citations`);
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    return [
      { id: "c1", title: "التعليمات التنفيذية رقم 1 لسنة 2019 - اقتطاع الضريبة", type: "تعليمات تنفيذية" },
      { id: "c2", title: "قرار محكمة التمييز رقم 1442/2020 (المصاريف المقبولة)", type: "سابقة قضائية" }
    ];
  }
}

function getMockLawDetail(lawId) {
  return {
    law_id: lawId || "law_tax_34_2014",
    title: "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
    type: "قانون",
    number: "34 لسنة 2014",
    issue_date: "30-12-2014",
    status: "ساري",
    sections: [
      {
        section_id: "sec_1",
        title: "الفصل الأول: التعاريف والأحكام العامة",
        articles: [
          {
            num: 1,
            title: "اسم القانون وبدء العمل به",
            content: "يسمى هذا القانون (قانون ضريبة الدخل رقم 34 لسنة 2014) ويعمل به من تاريخ 1-1-2015.",
            clauses: []
          },
          {
            num: 2,
            title: "التعريفات",
            content: "يكون للكلمات والعبارات التالية حيثما وردت في هذا القانون المعاني المخصصة لها أدناه ما لم تدل القرينة على غير ذلك :-\nالوزير: وزير المالية.\nالدائرة: دائرة ضريبة الدخل والمبيعات.\nالضريبة: ضريبة الدخل.\nالمدير: مدير عام الدائرة.\nالمكلف: كل شخص ملزم بدفع الضريبة أو اقتطاعها أو توريدها وفق أحكام هذا القانون.\nالدخل من الوظيفة: الراتب والأجور والعلاوات والمكافآت والبدلات وأي امتيازات أخرى تتأتى للموظف من الوظيفة سواء كانت في القطاع العام أو الخاص.\nنشاط الأعمال: النشاط الذي يمارسه الشخص بقصد تحقيق ربح أو كسب بما في ذلك النشاط التجاري أو الصناعي أو الزراعي أو المهني أو الخدمي أو الحرفي.\nالدخل من الاستثمار: أي دخل متحقق خلاف الدخل من الوظيفة أو الدخل من نشاط الأعمال.\nالدخل الإجمالي: دخل المكلف القائم من جميع مصادر الدخل الخاضعة للضريبة.",
            has_definitions: true
          }
        ]
      },
      {
        section_id: "sec_2",
        title: "الفصل الثاني: الدخل الخاضع للضريبة والإعفاءات",
        articles: [
          {
            num: 3,
            title: "الدخل الخاضع للضريبة",
            content: "يخضع للضريبة أي دخل يتأتى في المملكة لأي شخص أو يجنيها منها من أي مصدر من مصادر الدخل."
          },
          {
            num: 4,
            title: "الإعفاءات",
            content: "يُعفى من الضريبة دخل أصحاب الجلالة والسمو، وأرباح الشركات ومؤسسات النفع العام غير الهادفة للربح."
          },
          {
            num: 5,
            title: "إعفاءات النشاط الزراعي",
            content: "يُعفى من الضريبة أول (100,000) دينار من المبيعات المتأتية للشخص الطبيعي من نشاطه الزراعي داخل المملكة."
          },
          {
            num: 6,
            title: "المصاريف المقبولة",
            content: "تُنزل المصاريف المقبولة التي أنفقها المكلف كلياً وحصرياً خلال السنة المالية لإنتاج الدخل الخاضع للضريبة."
          },
          {
            num: 7,
            title: "المصاريف غير المقبول تنزيلها",
            content: "لا يجوز تنزيل النفقات الشخصية أو الأجهزة والأثاث والمعدات الرأسمالية أو الغرامات والجزاءات المالية."
          },
          {
            num: 8,
            title: "تدويل الخسائر وتدويرها",
            content: "إذا لحقت خسارة بالمكلف في أي من أنشطة الأعمال الخاضعة للضريبة فيتم تدوير الخسارة المدورة للسنة التالية وحتى 5 سنوات."
          },
          {
            num: 9,
            title: "إعفاءات الشخص الطبيعي والعائلي",
            content: "يُعفى من الضريبة للشخص الطبيعي المقيم مبلغ (9000) دينار لسنة 2019 وما يليها، ومبلغ (9000) دينار عن المعالين."
          },
          {
            num: 10,
            title: "التبرعات والاشتراكات",
            content: "تُخصم التبرعات المدفوعة للدوائر الحكومية والمؤسسات الرسمية والجمعيات الخيرية المرخصة."
          },
          {
            num: 11,
            title: "نسب الضريبة",
            content: "تفرض الضريبة على الدخل الخاضع للضريبة للشخص الطبيعي وفق الشرائح التصاعدية والمحددة بموجب أحكام هذا القانون."
          },
          {
            num: 12,
            title: "الاقتطاع من المصدر",
            content: "على كل شخص يدفع مبالغ غير معفاة يخضع صاحبها للضريبة أن يقتطع منها النسبة المقررة ويوردها للدائرة."
          },
          {
            num: 13,
            title: "الإقرار الضريبي",
            content: "يلتزم المكلف بتقديم إقراره الضريبي للدائرة في الموعد المحدد قانوناً وفق النموذج المعتمد."
          },
          {
            num: 14,
            title: "أساس احتساب الدخل",
            content: "يتم احتساب الدخل على الأساس النقدي أو استحقاق المحاسبة حسب طبيعة النشاط والقيود المنتظمة."
          },
          {
            num: 15,
            title: "العقود طويلة المدى",
            content: "تحدد الأرباح المتأتية من العقود طويلة المدى بنسبة الإنجاز الفعلي خلال السنة المالية."
          },
          {
            num: 16,
            title: "الأجر التحويلي",
            content: "تطبق قواعد التسعير المحايد والمعاملات بين الأشخاص المرتبطين وفق التعليمات الصادرة لهذه الغاية."
          },
          {
            num: 17,
            title: "تقديم الإقرار الضريبي",
            content: "يقدم الإقرار الضريبي قبل نهاية الشهر الرابع الذي يلي ختام السنة المالية للمكلف."
          }
        ]
      }
    ]
  };
}

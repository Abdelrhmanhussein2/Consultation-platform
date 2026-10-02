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

export async function searchLegal(query, limit = 20, token = null) {
  try {
    const headers = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const endpoint = query && query.trim()
      ? `${API_BASE}/search?query=${encodeURIComponent(query.trim())}&limit=${limit}`
      : `${API_BASE}/laws`;
    const res = await fetch(endpoint, { headers });
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    if (data && Array.isArray(data.laws) && data.laws.length > 0) return data.laws;
    if (data && Array.isArray(data.results) && data.results.length > 0) return data.results;
    throw new Error("Empty dataset");
  } catch (err) {
    if (!query) return MOCK_LAWS;
    const q = query.trim().toLowerCase();
    const filtered = MOCK_LAWS.filter(l => 
      (l.title && l.title.toLowerCase().includes(q)) || 
      (l.summary && l.summary.toLowerCase().includes(q))
    );
    return filtered.length ? filtered : MOCK_LAWS;
  }
}

export async function getLawTree(lawId, token = null) {
  try {
    const headers = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}/laws/${lawId}`, { headers });
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    if (data && (data.sections || data.articles)) return normalizeLawTree(data, lawId);
    throw new Error("Incomplete law tree");
  } catch (err) {
    return getMockLawDetail(lawId);
  }
}

function normalizeArticle(a, lawTitle) {
  const num = a.number || a.num || 1;
  const title = a.title || (a.number ? `المادة ${a.number}` : (a.text ? a.text.substring(0, 40) : `المادة ${num}`));
  const clauses = a.clauses || (a.paragraphs && a.paragraphs.length > 0
    ? a.paragraphs.map(p => ({ text: p.text || "", isNumbered: !!p.letter }))
    : [{ text: a.text || a.content || "" }]);

  return {
    num: num,
    title: title,
    path: a.path || `${lawTitle || 'التشريع'} /`,
    date: a.effective_from || a.date || "01-01-2019",
    content: a.text || a.content || "",
    clauses: clauses,
    has_definitions: !!(a.has_definitions || a.definitions?.length),
    definitions: a.definitions || [],
    related_files: a.related_files || []
  };
}

function normalizeLawTree(data, lawId) {
  if (!data) return getMockLawDetail(lawId);
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    return {
      law_id: data.law_id || lawId,
      title: data.title || "تشريع قانوني",
      number: data.number || data.law_number || "",
      year: data.year || data.law_year || "",
      effective_date: data.effective_date || data.effective_from || "",
      sections: data.sections.map((s, sIdx) => ({
        section_id: s.section_id || `sec_${sIdx + 1}`,
        title: s.title || `الفصل ${sIdx + 1}`,
        articles: (s.articles || []).map(a => normalizeArticle(a, data.title))
      }))
    };
  }
  if (Array.isArray(data.articles) && data.articles.length > 0) {
    return {
      law_id: data.law_id || lawId,
      title: data.title || data.law_title || "تشريع قانوني",
      number: data.number || data.law_number || "",
      year: data.year || data.law_year || "",
      effective_date: data.effective_date || data.effective_from || "",
      sections: [
        {
          section_id: "sec_all",
          title: "مواد التشريع",
          articles: data.articles.map(a => normalizeArticle(a, data.title || data.law_title))
        }
      ]
    };
  }
  return getMockLawDetail(lawId);
}

export async function getArticleHistory(lawId, articleNum) {
  try {
    const headers = {};
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}/articles/${lawId}/${articleNum}/history`, { headers });
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
    const headers = {};
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}/articles/${targetId}/citations`, { headers });
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    return [
      { id: "c1", title: "التعليمات التنفيذية رقم 1 لسنة 2019 - اقتطاع الضريبة", type: "تعليمات تنفيذية" },
      { id: "c2", title: "قرار محكمة التمييز رقم 1442/2020 (المصاريف المقبولة)", type: "سابقة قضائية" }
    ];
  }
}

export function getMockLawDetail(lawId) {
  const definitionsList = [
    { term: "الوزير", value: "وزير المالية ." },
    { term: "الدائرة", value: "دائرة ضريبــة الدخل والمبيعات ." },
    { term: "الضريبة", value: "ضريبة الدخل ." },
    { term: "المدير", value: "مدير عام الدائرة ." },
    { term: "المكلف", value: "كل شخص ملزم بدفع الضريبة أو اقتطاعها أو توريدها وفق أحكام هذا القانون." },
    { term: "الدخل من الوظيفة", value: "الرواتب والأجور والعلاوات والمكافآت والبدلات وأي امتيازات نقدية أو عينية أخرى تتأتى للموظف من الوظيفة سواء كانت في القطاع العام أو الخاص." },
    { term: "نشاط الأعمال", value: "النشاط الذي يمارسه الشخص بقصد تحقيق ربح او مكسب بما في ذلك النشاط التجاري أو الصناعي أو الزراعي أو المهني أو الخدمي أو الحرفي." },
    { term: "الدخل من الاستثمار", value: "أي دخل متحقق خلاف الدخل من الوظيفة او الدخل من نشاط الاعمال." },
    { term: "الدخل الإجمالي", value: "دخل المكلف القائم من جميع مصادر الدخل الخاضعة للضريبة." },
    { term: "الدخل الصافي", value: "ما يتبقى من الدخل الإجمالي من كل مصدر خاضع للضريبة بعد تنزيل المصاريف المقبولة." },
    { term: "الدخل المعفى", value: "الدخل الذي لا يدخل ضمن الدخل الإجمالي للمكلف بموجب أحكام هذا القانون." },
    { term: "المصاريف المقبولة", value: "المصاريف والنفقات التي أنفقت أو استحقت كليا وحصريا خلال الفترة الضريبية لغايات انتاج دخل خاضع للضريبة التي يجوز تنزيلها من الدخل الاجمالي وفق احكام هذا القانون." },
    { term: "الدخل الخاضع للضريبة", value: "ما يتبقى من الدخل الصافي او مجموع الدخول الصافية بعد تنزيل الخسارة المدورة من فترات ضريبية سابقة والإعفاءات الشخصية والتبرعات على التوالي." },
    { term: "الضريبة المستحقة", value: "مقدار الضريبة المستحقة وفق أحكام هذا القانون ." },
    { term: "رصيد الضريبة المستحقة", value: "مقدار الضريبة المستحقة بعد إجراء التقاص وفق ما تقتضيه أحكام هذا القانون وطرح دفعات الضريبة المقدمة والضرائب المقتطعة من المصدر ما لم تكن قطعية ." },
    { term: "الأصول الرأسمالية", value: "الأصول التي يتم شراؤها أو المستأجرة تمويليا أو تلك التي بحوزة المكلف على سبيل التملك حالا أو مآلا لغايات الاحتفاظ بها لأكثر من سنة والتي لا تباع ولا تشترى ضمن النشاط الاعتيادي للمكلف." },
    { term: "الربح الرأسمالي", value: "الربح الناجم عن بيع الأصول الرأسمالية أو تبديلها ." },
    { term: "الخسارة الرأسمالية", value: "الخسارة الناجمة عن بيع أو تبديل الأصول الرأسمالية ." },
    { term: "السنة المالية", value: "الفترة المكونة من اثني عشر شهرا متتاليا والتي يغلق الشخص حساباته في نهايتها." },
    { term: "الفترة الضريبية", value: "الفترة التي تحتسب الضريبة على أساسها وفق أحكام هذا القانون." },
    { term: "الإقرار الضريبي", value: "تصريح بالدخل والمصاريف والاعفاءات والضريبة المستحقة يقدمه الشخص وفق النموذج المعتمد من الدائرة." },
    { term: "المدقق", value: "موظف الدائرة الذي يتولى تدقيق الإقرارات الضريبية وتقدير الضريبة واحتساب أي مبالغ أخرى مترتبة على المكلف والقيام بأي مهام وواجبات أخرى منوطــة به وفق أحكام هذا القانون." },
    { term: "الشخص", value: "الشخص الطبيعـي أو الاعتباري." },
    { term: "الشخص المقيم", value: "الشخص الطبيعي المقيم أو الشخص الاعتباري المقيم ." },
    { term: "الشخص الطبيعي المقيم", value: "من أقام فعليا في المملكة لمدة لا تقل عن (183) يوما خلال الفترة الضريبية سواء كانت إقامته متصلة أو متقطعة أو الموظف الأردني الذي يعمل فعليا لأي مدة خلال الفترة الضريبية لدى الحكومة أو أي من المؤسسات الرسمية العامة أو المؤسسات العامة داخل المملكة أو خارجها ." },
    { term: "الشخص الاعتباري المقيم", value: "الشخص الاعتباري الذي :- 1- تم تأسيسه أو تسجيله وفق أحكام التشريعات الأردنية وكان له في المملكة مركز أو فرع يمارس الإدارة والرقابة على عمله فيها، أو 2- مركز إدارته الرئيسي أو الفعلي في المملكة، أو 3- تملك الحكومة أو أي من المؤسسات الرسمية العامة أو المؤسسات العامة نسبة تزيد على (50%) من رأسماله ." },
    { term: "الشخص ذو العلاقة", value: "1- الشخص الطبيعي الذي يمتلك هو أو أي من أقاربه حتى الدرجة الثانية نسبة تتجاوز(50%) من رأسمال شخص اعتباري آخر. 2- الشخص الاعتباري الذي يمتلك نسبة تتجاوز (50%) من رأسمال شخص اعتباري آخر أو يمتلك حق السيطرة في اتخاذ القرارات. 3- الشخص الطبيعي المرتبط بشخص طبيعي آخر إذا كان زوجاً أو ذا قرابة حتى الدرجة الأولى." },
    { term: "التهرب الضريبي", value: "استعمال اساليب احتيالية تنطوي على غش او خداع او تزوير او اخفاء البيانات او تقديم بيانات وهمية أو المشاركة في أي منها قصداً بهدف عدم دفع الضريبة او التصريح عنها، كلياً او جزئياً او تخفيضها وفق ما هو محدد في هذا القانون." },
    { term: "المعال", value: "زوج المكلف أو أولاده أو أصوله أو أقاربه حتى الدرجة الثانية الذين يتولى المكلف الإنفاق عليهم." },
    { term: "البنك", value: "الشركة المرخصة لممارسة الأعمال المصرفية في المملكة وفق أحكام قانون البنوك." },
    { term: "الشركة المالية", value: "الشركة المالية المعرفة وفقا لقانون البنوك بما في ذلك شركة الصرافة وشركة التمويل ." },
    { term: "تعدين المواد الأساسية", value: "استكشاف واستخراج واستغلال خامات الفوسفات والبوتاس واليورانيوم ومشتقات أي منها وأي خامات طبيعية أخرى تحدد بقرار من مجلس الوزراء وتستثنى من ذلك صناعة الأسمدة والاسمنت." },
    { term: "شركات الاتصالات الأساسية", value: "شركات الاتصالات الحاصلة على رخص اتصالات فردية وفق أحكام قانون الاتصالات." },
    { term: "الإتاوة", value: "المبالغ المتحققة أيا كان نوعها مقابل استعمال أو الحق في استعمال حقوق النشر الخاصة بعمل أدبي أو فني أو علمي وأي براءة اختراع أو علامة تجارية أو تصميم أو نموذج أو خلطة أو تركيبة أو مقابل استعمال أو الحق في استعمال معدات صناعية أو تجارية أو علمية أو معلومات متعلقة بالخبرة الصناعية أو التجارية أو العلمية." },
    { term: "هيئة الاعتراض", value: "هيئة الاعتراض المشكلة بمقتضى أحكام هذا القانون." },
    { term: "المحكمة", value: "المحكمة المختصة وفق أحكام هذا القانون ." }
  ];

  return {
    law_id: lawId || "law_tax_34_2014",
    title: "قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته",
    type: "قانون",
    number: "34 لسنة 2014",
    issue_date: "30-12-2014",
    effective_date: "01-01-2015",
    amended_date: "01-01-2019",
    status: "ساري",
    sections: [
      {
        section_id: "sec_1",
        title: "الفصل الأول: التعاريف والأحكام العامة",
        articles: [
          {
            num: 1,
            title: "اسم القانون وبدء العمل به",
            date: "01-01-2015",
            content: "يسمى هذا القانون (قانون ضريبة الدخل لسنة 2014) ويعمل به اعتبارا من 1/1/2015.",
            clauses: [
              { text: "يسمى هذا القانون (قانون ضريبة الدخل لسنة 2014) ويعمل به اعتبارا من 1/1/2015." }
            ],
            related_files: []
          },
          {
            num: 2,
            title: "التعريفات",
            date: "01-01-2019",
            intro_text: "يكون للكلمات والعبارات التالية حيثما وردت في هذا القانون المعاني المخصصة لها أدناه، ما لم تدل القرينة على غير ذلك :-",
            has_definitions: true,
            definitions: definitionsList,
            related_files: [
              { id: "rel_2_1", title: "التعليمات التنفيذية رقم 1 لسنة 2019 الخاصة بالإقرارات والتعاريف", url: "#" },
              { id: "rel_2_2", title: "قرار ديوان تفسير القوانين رقم 4 لسنة 2020 بخصوص الشخص ذو العلاقة", url: "#" }
            ]
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
            date: "01-01-2019",
            related_files: [
              { id: "rel_3_1", title: "تعليمات اقتطاع ضريبة الدخل من المصدر رقم 2 لسنة 2019", url: "#" },
              { id: "rel_3_2", title: "قرار محكمة التمييز بصفتها الحقوقية رقم 1442/2020", url: "#" }
            ],
            clauses: [
              { text: "أ- يخضع للضريبة أي دخل يتأتى في المملكة لأي شخص أو يجنيه منها بغض النظر عن مكان الوفاء بما في ذلك الدخول التالية:-", isNumbered: true },
              { text: "1- الدخل المتأتي من نشاط الأعمال.", isNumbered: true },
              { text: "2- الفوائد والعمولات والخصميات وفروقات العملة وأرباح الودائع والأرباح المتأتية من البنوك وغيرها من الأشخاص الاعتبارية المقيمة.", isNumbered: true },
              { text: "3- الإتاوات .", isNumbered: true },
              { text: "4- الدخل من بيع البضائع.", isNumbered: true },
              { text: "5- الدخــل من بيع أو تأجير منقولات واقعة في المملكة .", isNumbered: true },
              { text: "6- الدخل من تأجير عقارات واقعة في المملكة والدخل من الخلو والمفتاحية .", isNumbered: true },
              { text: "7- الدخل من بيع أو تأجير الأصول المعنوية الموجودة في المملكة بما في ذلك الشهرة.", isNumbered: true },
              { text: "8- الدخل من أقساط التأمين المستحقة بموجب اتفاقات التأمين وإعادة التأمين للاخطار داخل المملكة.", isNumbered: true },
              { text: "9- الدخل من خدمات الاتصالات بجميع صورها بما في ذلك الاتصالات الدولية .", isNumbered: true },
              { text: "10- الدخل من النقل داخل المملكة وبين المملكة وأي دولة أخرى.", isNumbered: true },
              { text: "11- الدخل الناجم عن إعادة التصدير .", isNumbered: true },
              { text: "12- بدل الخدمة الذي يجنيه الشخص غير المقيم من المملكة والناشئ عن خدمة قدمها لأي شخص إذا تمت مزاولة العمل أو النشاط المتعلق بذلك البدل في المملكة أو إذا تم استخدام مخرجات هذه الخدمة داخلها .", isNumbered: true },
              { text: "13- الدخل من أرباح الجوائز واليانصيب إذا زاد مقدار أو قيمة كل منها على ألف دينار سواء كانت نقدية أو عينية.", isNumbered: true },
              { text: "14- الدخل الناجم عن أي عقد في المملكة كأرباح الوكالات التجارية وما ماثلها سواء كان مصدره داخل المملكة أو خارجها .", isNumbered: true },
              { text: "15- أي دخل آخر لم يتم إعفاؤه بمقتضى أحكام هذا القانون.", isNumbered: true },
              { text: "ب- لغايات هذا القانون يتم احتساب قيمة الدخل العيني حسب سعر السوق في تاريخ الاستحقاق لذلك الدخل.", isNumbered: true },
              { text: "ج- يخضع للضريبة :-", isNumbered: true },
              { text: "1- الدخل الصافي الذي يتحقق للشخص المقيم من أي مصدر خارج المملكة شريطة ان يكون قد نشأ عن اموال او ودائع من المملكة.", isNumbered: true },
              { text: "2- مجموع الدخول الصافية التي يحققها فرع الشركة الاردنية العاملة خارج المملكة والمعلن في بياناتها المالية الختامية المصادق عليها من محاسب قانوني خارجي.", isNumbered: true },
              { text: "3- يعتبر الدخل الصافي المشار اليه في البندين (1) و (2) من هذه الفقرة دخلا خاضعا للضريبة وتفرض الضريبة عليه بنسبة (10%) ولا يجوز السماح بتنزيل أي مبلغ او جزء منه لأي سبب من الاسباب.", isNumbered: true },
              { text: "د- يخضع للضريبة الدخل الناجم عن التجارة الالكترونية للسلع والخدمات .", isNumbered: true }
            ]
          },
          {
            num: 4,
            title: "الإعفاءات",
            date: "01-01-2019",
            clauses: [
              { text: "أ- يعفى من الضريبة:-", isNumbered: true },
              { text: "1- الملك.", isNumbered: true },
              { text: "2- دخل المؤسسات الرسمية العامة والمؤسسات العامة والبلديات من داخل المملكة باستثناء دخلها من بدلات الإيجار والخلو والمفتاحية وربح أي نشاط استثماري أو فائض الإيراد السنوي الذي يقرر مجلس الوزراء بناء على تنسيب الوزير إخضاعه للضريبة.", isNumbered: true },
              { text: "3- أرباح الشركة الأجنبية غير العاملة في المملكة مثل شركة المقر ومكتب التمثيل الواردة إليها عن أعمالها في الخارج.", isNumbered: true },
              { text: "4- دخل الأوقاف الخيرية ودخل مؤسسة تنمية أموال الأيتام.", isNumbered: true },
              { text: "5- الأرباح الرأسمالية المتحققة من داخل المملكة باستثناء الأرباح المتحققة على الاصول الخاضعة لأحكام الاستهلاك الواردة في هذا القانون وارباح بيع الحصص على الشخص الاعتباري وارباح شركات ومؤسسات تكنولوجيا المعلومات.", isNumbered: true }
            ]
          },
          {
            num: 5,
            title: "إعفاءات النشاط الزراعي",
            date: "01-01-2019",
            clauses: [
              { text: "أ- يعفى من الضريبة اول (1000000) مليون دينار من مبيعات الشخص الطبيعي المتأتية من نشاط زراعي داخل المملكة.", isNumbered: true },
              { text: "ب- يعفى من الضريبة أول (50000) خمسين ألف دينار من الدخل الصافي للشخص الاعتباري المتأتي داخل المملكة من النشاط الزراعي .", isNumbered: true },
              { text: "ج- ‌ لغايات هذه المادة ، يعني النشاط الزراعي ما يلي :-", isNumbered: true },
              { text: "1- إنتاج المحاصيل والحبوب والخضراوات والفواكه والنباتات والزهور والأشجار.", isNumbered: true },
              { text: "2- تربية المواشي والأسماك والطيور والنحل بما في ذلك إنتاج البيض والعسل .", isNumbered: true }
            ]
          },
          {
            num: 6,
            title: "المصاريف المقبولة",
            date: "01-01-2019",
            related_files: [
              { id: "rel_6_1", title: "تعليمات المصاريف المقبولة وتنزيل النفقات رقم 4 لسنة 2019", url: "#" }
            ],
            clauses: [
              { text: "تنزل للمكلف المصاريف المقبولة بما في ذلك المصاريف المبينة تاليا على أن يحدد النظام أحكام هذا التنزيل واجراءاته:-", isNumbered: false },
              { text: "أ- ضريبة الدخل الأجنبية المدفوعة عن دخله المتأتي من مصادر خارج المملكة والذي خضع للضريبة فيها وفق أحكام هذا القانون.", isNumbered: true },
              { text: "ب-1- الفوائد وأرباح المرابحة المدفوعة او المستحقة لغير الأشخاص ذوي العلاقة .", isNumbered: true },
              { text: "ج- مخصصات البنوك وفق أحكام قانون البنوك.", isNumbered: true }
            ]
          },
          {
            num: 7,
            title: "المصاريف غير المقبول تنزيلها",
            date: "01-01-2015",
            clauses: [
              { text: "المبالغ و المصاريف غير المقبول تنزيلها", isNumbered: false },
              { text: "لا يجوز للمكلف تنزيل ما يلي:-", isNumbered: false },
              { text: "أ- الضريبة والغرامات والمبالغ الأخرى المترتبة بمقتضى أحكام هذا القانون.", isNumbered: true },
              { text: "ب- الغرامات الجزائية والغرامات المدفوعة تعويضا مدنيا بموجب احكام هذا القانون.", isNumbered: true },
              { text: "ج- تكلفة الأصول الرأسمالية وتركيبها وتكلفة الأصول المعنوية.", isNumbered: true }
            ]
          },
          {
            num: 8,
            title: "تنزيل الخسائر وتدويرها",
            date: "01-01-2015",
            clauses: [
              { text: "تنزيل الخسائر و تدويرها و الشروط المتعلقة بذلك", isNumbered: false },
              { text: "أ- 1- اذا لحقت خسارة بالشخص في أي من أنشطة الأعمال الخاضعة للضريبة داخل المملكة فيتم تنزيلها من أرباح مصادر الدخل الأخرى في الفترة الضريبية ذاتها .", isNumbered: true },
              { text: "2- إذا بلغت الخسارة مقداراً لا يمكن تنزيله بالكامل فيدور رصيدها للفترات الضريبية اللاحقة للفترة الضريبية التي وقعت فيها وبحدٍ أعلى لا يتجاوز خمس سنوات.", isNumbered: true },
              { text: "ب- تدور خسائر نشاط الأعمال المتحققة خارج المملكة لتنزل من أرباح النشاط ذاته المتحققة خارجها .", isNumbered: true }
            ]
          },
          {
            num: 9,
            title: "إعفاءات الشخص الطبيعي المقيم",
            date: "01-01-2019",
            clauses: [
              { text: "إعفاءات الشخص الطبيعي المقيم", isNumbered: false },
              { text: "أ- للتوصل إلى الدخل الخاضع للضريبة تنزل للشخص الطبيعي المقيم المكلف المبالغ التالية:-", isNumbered: true },
              { text: "1- عشرة آلاف دينار إعفاء شخصيا لسنة ( 2019 )، وتسعة آلاف دينار لسنة (2020) وما يليها .", isNumbered: true },
              { text: "2- عشرة آلاف دينار عن المعالين مهما كان عددهم لسنة (2019) وتسعة آلاف دينار لسنة (2020) وما يليها.", isNumbered: true }
            ]
          },
          {
            num: 10,
            title: "التبرعات والاشتراكات",
            date: "01-01-2015",
            clauses: [
              { text: "تنزيل التبرعات والاشتراكات المدفوعة لغرض غير شخصي", isNumbered: false },
              { text: "أ- يجوز للشخص تنزيل أي مبلغ دفع خلال الفترة الضريبية باعتباره تبرعا دون نفع شخصي لأي من الدوائر الحكومية أو المؤسسات الرسمية العامة أو البلديات.", isNumbered: true }
            ]
          },
          {
            num: 11,
            title: "نسب الضريبة",
            date: "01-01-2019",
            clauses: [
              { text: "نسبة الضريبة المستوفاة من الشخص الطبيعي و الإعتباري", isNumbered: false },
              { text: "أ- تستوفى الضريبة للشخص الطبيعي من الدخل الخاضع للضريبة وفقاً للنسب التصاعدية المحددة في هذا القانون.", isNumbered: true }
            ]
          }
        ]
      }
    ]
  };
}

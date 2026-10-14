// frontend/src/components/Regulations/LegalReader/LegalStageSplitReader.jsx
import React, { useState, useEffect } from 'react';
import { ARTICLE_DIFFS } from './articleDiffs';
import RelatedFilesGrid from './RelatedFilesGrid';
import { getLawTree, parseArticleClauses } from '../../../services/legalService';


export const STAGES_CONFIG = {
  '2014_original': {
    id: '2014_original',
    title: 'قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر',
    subtitle: 'النسخة السارية عند بدء العمل بالقانون',
    date: '01-01-2015',
    buttonText: 'عرض الإصدار',
    meta: {
      type: 'قانون',
      number: '34 لسنة 2014',
      issueDate: '30-12-2014',
      effectiveDate: '01-01-2015',
      gazette: 'العدد 5320 — الصفحة 7390',
      status: 'كما صدر'
    },
    versionDate: '01-01-2015'
  },
  '2018_amending': {
    id: '2018_amending',
    title: 'قانون معدل رقم 38 لسنة 2018',
    subtitle: 'التشريع المعدل لقانون ضريبة الدخل',
    date: '02-12-2018',
    buttonText: 'عرض التشريع المعدل',
    meta: {
      type: 'قانون معدل',
      number: '38 لسنة 2018',
      issueDate: '02-12-2018',
      effectiveDate: '01-01-2019',
      gazette: 'العدد 5547 — الصفحة 6280',
      status: 'نافذ'
    },
    versionDate: '01-01-2019',
    articles: [
      {
        num: 1,
        title: 'المادة 1',
        date: '01-01-2019',
        content: 'يسمى هذا القانون (قانون معدل لقانون ضريبة الدخل لسنة 2018) ويقرأ مع القانون رقم (34) لسنة 2014 المشار إليه فيما يلي بالقانون الأصلي قانوناً واحداً ويعمل به اعتباراً من تاريخ 1/1/2019.'
      },
      {
        num: 2,
        title: 'المادة 2',
        date: '01-01-2019',
        content: 'تعدل المادة (2) من القانون الأصلي على النحو التالي:\nأ- بإضافة تعريف (الشخص ذو العلاقة) وتعريف (التهرب الضريبي) إلى متن التعاريف المعتمدة.\nب- بتعديل تعريف (الدخل الخاضع للضريبة) ليصبح: ما يتبقى من الدخل الصافي أو مجموع الدخول الصافية بعد تنزيل الخسارة المدورة من فترات ضريبية سابقة والإعفاءات الشخصية والتبرعات.'
      },
      {
        num: 3,
        title: 'المادة 3',
        date: '01-01-2019',
        content: 'تعدل المادة (3) من القانون الأصلي على النحو التالي:\nأ- بإلغاء عبارة (سواء تم بيعها في المملكة أو تصديرها منها) الواردة في البند (4) من الفقرة (أ).\nب- بإضافة الفقرة (د) إليها بالنص التالي: (د- يخضع للضريبة الدخل الناجم عن التجارة الإلكترونية للسلع والخدمات).'
      },
      {
        num: 4,
        title: 'المادة 4',
        date: '01-01-2019',
        content: 'تعدل المادة (4) من القانون الأصلي بإلغاء مخصصات الملك وتعديل إعفاءات النشاط الزراعي للشخص الطبيعي حتى مليون دينار وتحديث إعفاءات أرباح الصناديق التقاعدية.'
      },
      {
        num: 5,
        title: 'المادة 5',
        date: '01-01-2019',
        content: 'تعدل المادة (11) من القانون الأصلي بتحديد نسب الضريبة على الدخل الخاضع للضريبة للشخص الطبيعي وفق الشرائح التصاعدية الجديدة، وتحديد نسبة (20%) للشركات و(35%) للبنوك.'
      }
    ]
  },
  '2019_current': {
    id: '2019_current',
    title: 'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته',
    subtitle: 'النص المدمج النافذ بعد التعديل',
    date: '01-01-2019',
    buttonText: 'عرض النسخة النافذة',
    meta: {
      type: 'قانون',
      number: '34 لسنة 2014',
      issueDate: '30-12-2014',
      effectiveDate: '01-01-2019',
      gazette: 'العدد 5320 — الصفحة 7390',
      status: 'النص المدمج النافذ بعد التعديل'
    },
    versionDate: '01-01-2019'
  }
};

export const ARTICLE_2_DEFINITIONS_2014 = [
  { term: "الوزير", value: "وزير المالية ." },
  { term: "الدائرة", value: "دائرة ضريبــة الدخل والمبيعات ." },
  { term: "الضريبة", value: "ضريبة الدخل ." },
  { term: "المدير", value: "مدير عام الدائرة ." },
  { term: "المكلف", value: "كل شخص ملزم بدفع الضريبة أو اقتطاعها أو توريدها وفق أحكام هذا القانون." },
  { term: "الدخل من الوظيفة", value: "الرواتب والأجور والعلاوات والمكافآت والبدلات وأي امتيازات نقدية أو عينية أخرى تتأتى للموظف من الوظيفة سواء كانت في القطاع العام أو الخاص." },
  { term: "نشاط الأعمال", value: "النشاط الذي يمارسه الشخص بقصد تحقيق ربح او مكسب بما في ذلك النشاط التجاري أو الصناعي أو الزراعي أو المهني أو الخدمي أو الحرفي." },
  { term: "الدخل من الاستثمار", value: "أي دخل متحقق خلاف الدخل من الوظيفة او الدخل من نشاط الاعمال." },
  { term: "الدخل الإجمالي", value: "دخل المكلف من جميع مصادر الدخل الخاضعة للضريبة." },
  { term: "الدخل المعفى", value: "الدخل الذي لا يدخل ضمن الدخل الإجمالي للمكلف بموجب أحكام هذا القانون." },
  { term: "المصاريف المقبولة", value: "المصاريف والنفقات التي أنفقت أو استحقت كليا وحصريا خلال الفترة الضريبية لغايات انتاج دخل خاضع للضريبة التي يجوز تنزيلها من الدخل الاجمالي وفق احكام هذا القانون." },
  { term: "الدخل الخاضع للضريبة", value: "ما يتبقى من الدخل الإجمالي بعد تنزيل المصاريف المقبولة والخسارة المدورة من الفترات الضريبية السابقة والإعفاءات الشخصية والتبرعات على التوالي ." },
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
  { term: "المعال", value: "زوج المكلف أو أولاده أو أصوله أو أقاربه حتى الدرجة الثانية الذين يتولى المكلف الإنفاق عليهم." },
  { term: "البنك", value: "الشركة المرخصة لممارسة الأعمال المصرفية في المملكة وفق أحكام قانون البنوك." },
  { term: "الشركة المالية", value: "الشركة المالية المعرفة وفقا لقانون البنوك بما في ذلك شركة الصرافة وشركة التمويل ." },
  { term: "تعدين المواد الأساسية", value: "استكشاف واستخراج واستغلال خامات الفوسفات والبوتاس والإسمنت واليورانيوم ومشتقات أي منها وأي خامات طبيعية أخرى يقررها مجلس الوزراء ويستثنى من ذلك صناعة الاسمدة." },
  { term: "شركات الاتصالات الأساسية", value: "شركات الاتصالات الحاصلة على رخص اتصالات فردية وفق أحكام قانون الاتصالات." },
  { term: "الإتاوة", value: "المبالغ المتحققة أيا كان نوعها مقابل استعمال أو الحق في استعمال حقوق النشر الخاصة بعمل أدبي أو فني أو علمي وأي براءة اختراع أو علامة تجارية أو تصميم أو نموذج أو خلطة أو تركيبة أو مقابل استعمال أو الحق في استعمال معدات صناعية أو تجارية أو علمية أو معلومات متعلقة بالخبرة الصناعية أو التجارية أو العلمية." },
  { term: "هيئة الاعتراض", value: "هيئة الاعتراض المشكلة بمقتضى أحكام هذا القانون." },
  { term: "المحكمة", value: "المحكمة المختصة وفق أحكام هذا القانون ." }
];

export const ARTICLE_2_DEFINITIONS_2019 = [
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

// Build articles list for the stage
export function getArticlesForStage(stageId, lawTree) {
  const stage = STAGES_CONFIG[stageId] || STAGES_CONFIG['2014_original'];
  if (stage.articles) {
    return stage.articles;
  }

  const is2014 = stageId === '2014_original';
  const effectiveDate = stage.versionDate || (is2014 ? '01-01-2015' : '01-01-2019');
  const list = [];

  if (lawTree?.sections) {
    lawTree.sections.forEach(sec => {
      sec.articles?.forEach(art => {
        const diff = ARTICLE_DIFFS[String(art.num)];
        let text = is2014 ? (diff?.oldplain || art.content || '') : (diff?.newplain || art.content || '');

        let definitions = null;
        let introText = null;

        if (art.num === 2) {
          introText = "يكون للكلمات والعبارات التالية حيثما وردت في هذا القانون المعاني المخصصة لها أدناه ما لم تدل القرينة على غير ذلك:";
          definitions = is2014 ? ARTICLE_2_DEFINITIONS_2014 : ARTICLE_2_DEFINITIONS_2019;
        }

        list.push({
          num: art.num,
          title: `المادة ${art.num}`,
          date: effectiveDate,
          content: text,
          introText,
          definitions
        });
      });
    });
  }

  return list;
}

export default function LegalStageSplitReader({
  stageId,
  lawTree,
  onClose,
  onSetAsMain,
  relatedDoc,
  isMaximized,
  onToggleMaximize
}) {
  const [sideTab, setSideTab] = useState('info');
  const [fetchedTree, setFetchedTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState(14);
  const [copied, setCopied] = useState(false);

  const isRelated = Boolean(relatedDoc);
  const stage = STAGES_CONFIG[stageId] || STAGES_CONFIG['2014_original'];
  const title = isRelated ? relatedDoc.title : stage.title;
  const docTitle = isRelated ? (relatedDoc.docTitle || title) : stage.title;
  const meta = isRelated ? { ...(relatedDoc || {}), ...(relatedDoc?.meta || {}) } : (stage?.meta || {});

  // Dynamic extraction fallbacks for related documents and rulings
  const isRuling = Boolean(
    (meta?.type || '').includes('حكم') || 
    (title || '').includes('حكم') || 
    (title || '').includes('قرار') || 
    (meta?.group || '').includes('أحكام') ||
    meta?.ruling_number
  );

  const docType = (() => {
    if (meta?.type && meta.type !== '—') return meta.type;
    if (relatedDoc?.type && relatedDoc.type !== '—') return relatedDoc.type;
    return isRuling ? 'حكم قضائي' : 'تشريع مرتبط';
  })();

  const docNum = (() => {
    let raw = '';
    if (meta?.number && meta.number !== '—') raw = meta.number;
    else if (meta?.ruling_number && meta.ruling_number !== '—') raw = meta.ruling_number;
    else if (relatedDoc?.number && relatedDoc.number !== '—') raw = relatedDoc.number;
    else {
      const match = (title || '').match(/(?:رقم|الحكم رقم|قرار رقم)\s*(\d+(?:\s+لسنة\s+\d+)?)/);
      raw = match ? match[1] : (relatedDoc?.year ? `لسنة ${relatedDoc.year}` : '—');
    }
    return String(raw).replace(/(لسنة\s*\d{4})\s*لسنة\s*\d{4}/g, '$1').trim();
  })();

  const docDate = (() => {
    if (meta?.date && meta.date !== '—') return meta.date;
    if (meta?.issue_date && meta.issue_date !== '—') return meta.issue_date;
    if (relatedDoc?.date && relatedDoc.date !== '—') return relatedDoc.date;
    const yr = (title || '').match(/لسنة\s*(\d{4})/);
    if (yr) return yr[1];
    if (relatedDoc?.year) return relatedDoc.year;
    return '—';
  })();

  const docCourt = (() => {
    if (meta?.court && meta.court !== '—') return meta.court;
    if (meta?.source && meta.source !== '—') return meta.source;
    if (relatedDoc?.source && relatedDoc.source !== '—') return relatedDoc.source;
    if (relatedDoc?.court && relatedDoc.court !== '—') return relatedDoc.court;
    const t = title || '';
    if (t.includes('إدارية') || t.includes('الإدارية')) return 'المحكمة الإدارية العليا';
    if (t.includes('تمييز') || t.includes('التمييز')) return 'محكمة التمييز';
    if (t.includes('بداية') || t.includes('ضريب')) return 'محكمة البداية الضريبية';
    if (t.includes('استئناف') || t.includes('الاستئناف')) return 'محكمة الاستئناف الضريبية';
    return isRuling ? 'محكمة أردنية مختصة' : 'الجريدة الرسمية';
  })();

  // Document full text from database
  const docFullText = (
    relatedDoc?.full_text ||
    relatedDoc?.text ||
    relatedDoc?.نص_الحكم ||
    relatedDoc?.نص_الوثيقة ||
    meta?.full_text ||
    meta?.text ||
    meta?.نص_الحكم ||
    meta?.نص_الوثيقة ||
    meta?.مقتطف_الحكم ||
    ''
  ).trim();

  // Genuine summary only - do NOT invent or show fake summary for judgments
  const summaryDisplay = (!isRuling && meta?.summary && meta.summary !== docFullText) ? meta.summary : null;

  const handleCopyFullText = () => {
    if (!docFullText) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(docFullText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  // Stage-to-law-id mapping
  const STAGE_LAW_IDS = {
    '2014_original': 'قانون_34_2014_الأصلية',
    '2019_current': 'قانون_34_2014_وتعديلاته',
    '2018_amending': null // use local static articles
  };

  // Fetch law from backend when stage is not related doc
  useEffect(() => {
    if (isRelated || !stageId) return;
    const targetLawId = STAGE_LAW_IDS[stageId];
    if (!targetLawId) {
      // For amending law, use local static articles
      setFetchedTree(null);
      return;
    }
    setLoading(true);
    getLawTree(targetLawId)
      .then(data => {
        if (data && (data.sections || data.articles)) {
          setFetchedTree(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stageId, isRelated]);

  // Build articles list: prefer fetched backend data, else fall back to local
  let articles;
  if (!isRelated) {
    if (fetchedTree) {
      // Flatten sections -> articles from backend
      articles = (fetchedTree.sections || []).flatMap(s =>
        (s.articles || []).map(a => {
          const parsed = parseArticleClauses(a);
          return {
            num: a.num || a.number,
            title: a.title || `المادة ${a.num || a.number}`,
            date: a.date || a.effective_from || stage.versionDate || stage.date || '',
            content: a.content || a.text || '',
            introText: parsed.introText || a.intro_text || null,
            definitions: parsed.definitions?.length ? parsed.definitions : (a.definitions || []),
            clauses: parsed.clauses?.length ? parsed.clauses : (a.clauses || [])
          };
        })
      );
    } else {
      articles = getArticlesForStage(stageId || '2014_original', lawTree);
    }
  }



  const handlePopoutClick = () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    } else if (onSetAsMain) {
      onSetAsMain(isRelated ? relatedDoc : stageId);
    }
  };

  return (
    <div className={`side-reader-pane ${isMaximized ? 'is-maximized' : ''}`} id="stagePopupReader">
      {/* Top Header with Close and Popout */}
      <div className="side-reader-head">
        <div className="side-reader-head-actions">
          <button className="side-reader-icon-btn close-btn" onClick={onClose} title="إغلاق">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button
            className={`side-reader-icon-btn popout-btn ${isMaximized ? 'active' : ''}`}
            onClick={handlePopoutClick}
            title={isMaximized ? "استعادة الحجم الطبيعي" : "تكبير الشاشة بالكامل"}
          >
            {isMaximized ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005D9C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005D9C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            )}
          </button>
        </div>
        <h3 className="side-reader-head-title" title={title}>{title}</h3>
      </div>

      {/* Tabs Row */}
      <div className="side-reader-tabs-wrap">
        <div className="side-reader-tabs">
          <button className={sideTab === 'info' ? 'active' : ''} onClick={() => setSideTab('info')}>معلومات الوثيقة</button>
          <button className={sideTab === 'description' ? 'active' : ''} onClick={() => setSideTab('description')}>وصف الوثيقة</button>
          <button className={sideTab === 'related' ? 'active' : ''} onClick={() => setSideTab('related')}>ملفات ذات صلة</button>
          <button className={sideTab === 'timeline' ? 'active' : ''} onClick={() => setSideTab('timeline')}>مراحل التشريع</button>
        </div>
      </div>

      {/* Scrollable Document Body */}
      <div className="side-reader-body">
        {/* Tab-Specific Top Section */}
        {sideTab === 'info' && (
          <div className="side-reader-tab-page">
            <table 
              className="side-reader-meta-table"
              style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}
            >
              <colgroup>
                <col style={{ width: '125px', minWidth: '125px', maxWidth: '125px' }} />
                <col style={{ width: 'calc(100% - 125px)' }} />
              </colgroup>
              <tbody>
                {isRelated ? (
                  <>
                    <tr>
                      <td className="meta-label">النوع</td>
                      <td className="meta-value">{docType}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">{isRuling ? 'رقم الحكم' : (meta?.numberLabel || 'رقم الوثيقة')}</td>
                      <td className="meta-value">{docNum}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">التاريخ</td>
                      <td className="meta-value">{docDate}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">المصدر</td>
                      <td className="meta-value">{docCourt}</td>
                    </tr>
                    {meta?.subject && (
                      <tr>
                        <td className="meta-label">موضوع الدعوى</td>
                        <td className="meta-value">{meta.subject}</td>
                      </tr>
                    )}
                    {meta?.outcome && (
                      <tr>
                        <td className="meta-label">منطوق القرار</td>
                        <td className="meta-value">{meta.outcome}</td>
                      </tr>
                    )}
                    {summaryDisplay && (
                      <tr>
                        <td className="meta-label" style={{ verticalAlign: 'top' }}>الملخص</td>
                        <td 
                          className="meta-value meta-summary-cell"
                          style={{ 
                            whiteSpace: 'normal', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere', 
                            textAlign: 'right', 
                            lineHeight: 1.8 
                          }}
                        >
                          {summaryDisplay}
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="meta-label">النوع</td>
                      <td className="meta-value">{stage.meta.type}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">الرقم</td>
                      <td className="meta-value">{stage.meta.number}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">تاريخ الصدور</td>
                      <td className="meta-value">{stage.meta.issueDate}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">تاريخ السريان</td>
                      <td className="meta-value">{stage.meta.effectiveDate}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">الجريدة الرسمية</td>
                      <td className="meta-value">{stage.meta.gazette}</td>
                    </tr>
                    <tr>
                      <td className="meta-label">الحالة</td>
                      <td className="meta-value">{stage.meta.status}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Document Title Card + Real Full Text Content Block */}
            {isRelated && (
              <>
                <div className="side-reader-title-card">
                  {title}
                </div>

                <div className="side-reader-content-block full-text-view">
                  <div className="side-reader-content-toolbar">
                    <div className="toolbar-right">
                      <span className="doc-content-badge">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {isRuling ? 'النص الكامل للحكم القضائي' : 'نص الوثيقة الكامل'}
                      </span>
                    </div>

                    <div className="toolbar-left">
                      <button 
                        type="button" 
                        className={`doc-tool-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopyFullText}
                        title="نسخ النص كاملاً"
                      >
                        {copied ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span style={{ color: '#16A34A', fontWeight: 700 }}>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>نسخ النص</span>
                          </>
                        )}
                      </button>

                      <div className="font-size-group">
                        <button 
                          type="button" 
                          className="doc-tool-btn" 
                          onClick={() => setReaderFontSize(f => Math.min(f + 1, 22))}
                          title="تكبير الخط"
                        >
                          A+
                        </button>
                        <button 
                          type="button" 
                          className="doc-tool-btn" 
                          onClick={() => setReaderFontSize(f => Math.max(f - 1, 12))}
                          title="تصغير الخط"
                        >
                          A-
                        </button>
                      </div>
                    </div>
                  </div>

                  {docFullText ? (
                    <div 
                      className="side-reader-ruling-body"
                      style={{ fontSize: `${readerFontSize}px` }}
                    >
                      {docFullText.split('\n').filter(p => p.trim()).map((paragraph, pIdx) => {
                        const pTrim = paragraph.trim();
                        const isMainHeader = /^(المحكمة|المملكة الأردنية|وزارة العدل|رقم الدعوى|القرار الصادر|الهيئة الحاكمة)/.test(pTrim);
                        const isSectionHead = /^(الطاعن|وكيله|المطعون ضدهما|المطعون ضده|بتاريخ|ورداً على أسباب الطعن|أسباب الطعن|وبالمحاكمة الجارية|بالتدقيق والمداولة|النتيجة)/.test(pTrim);
                        const isDecree = /^(لذلك نقرر|قراراً وجاهياً|فلهذه الأسباب)/.test(pTrim);

                        return (
                          <p 
                            key={pIdx} 
                            className={`ruling-paragraph ${isMainHeader ? 'is-court-meta' : ''} ${isSectionHead ? 'is-section-head' : ''} ${isDecree ? 'is-final-decree' : ''}`}
                          >
                            {pTrim}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="side-reader-empty-text">
                      <p>جاري استرداد النص الكامل للوثيقة من قاعدة البيانات...</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}


        {sideTab === 'description' && (
          <div className="side-reader-tab-page">
            <div className="side-reader-title-card" style={{ marginBottom: '16px' }}>
              {title}
            </div>
            <div className="side-reader-desc-box">
              <p>{meta?.summary || `${title} — وثيقة تشريعية / إجرائية ذات صلة بقانون ضريبة الدخل وتطبيقاته التنفيذية والإجرائية.`}</p>
            </div>
          </div>
        )}

        {sideTab === 'related' && (
          <div className="side-reader-tab-page">
            <RelatedFilesGrid
              selectedFileId={relatedDoc?.id}
              onSelectFile={(doc) => {
                if (onSetAsMain) onSetAsMain(doc);
              }}
            />
          </div>
        )}

        {sideTab === 'timeline' && (
          <div className="side-reader-tab-page">
            <div className="side-reader-timeline-box">
              <div className="side-timeline-item">
                <span className="side-t-date">01-01-2015</span>
                <strong className="side-t-title">كما صدر</strong>
              </div>
              <div className="side-timeline-item">
                <span className="side-t-date">02-12-2018</span>
                <strong className="side-t-title">قانون معدل رقم 38 لسنة 2018</strong>
              </div>
              <div className="side-timeline-item">
                <span className="side-t-date">01-01-2019</span>
                <strong className="side-t-title">النص النافذ بعد التعديل</strong>
              </div>
            </div>
          </div>
        )}

        {/* Document Title Header & Articles List - Only shown when viewing an actual law stage, NOT related doc */}
        {!isRelated && (
          <>
            <div className="side-reader-doc-title">
              <h2>{docTitle}</h2>
            </div>

            <div className="side-reader-articles">
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  جاري تحميل نصوص القانون من قاعدة البيانات...
                </div>
              ) : articles?.map(art => (
                <div className="side-reader-art-item" key={art.num}>
                  <div className="side-reader-art-header">
                    <h3 className="side-reader-art-num">{art.title}</h3>
                    <span className="side-reader-art-date">{art.date}</span>
                  </div>


                  {art.introText && (
                    <p className="side-reader-art-intro">{art.introText}</p>
                  )}

                  {art.definitions && art.definitions.length > 0 ? (
                    <div className="definitions-v12 side-reader-defs">
                      {art.definitions.map((d, dIdx) => (
                        <div className="definition-pair" key={dIdx}>
                          <div className="definition-term">{d.term}</div>
                          <div className="definition-value">{d.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="side-reader-art-body">
                      {(parseArticleClauses(art).clauses?.length ? parseArticleClauses(art).clauses : (art.clauses || [])).map((clause, cIdx) => (
                        <p 
                          key={cIdx} 
                          className={`legal-clause ${clause.isNumbered ? 'numbered' : ''}`}
                          style={{ margin: '0 0 10px 0', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 2 }}
                        >
                          {typeof clause === 'object' ? clause.text : clause}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

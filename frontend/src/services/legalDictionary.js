// frontend/src/services/legalDictionary.js
// Legal dictionary & semantic suggestion mapper

const DICTIONARY_MAP = {
  "سكراب": {
    main: "المخلفات الصناعية",
    options: [
      { title: "المخلفات الصناعية", desc: "بحث عن التشريعات والمواد التي تتضمن هذا المصطلح" },
      { title: "المخلفات", desc: "مصطلح قانوني مرتبط بعبارة البحث" },
      { title: "النفايات الصناعية", desc: "مصطلح قانوني مرتبط بعبارة البحث" }
    ]
  },
  "خردة": {
    main: "المعادن والمواد المستهلكة",
    options: [
      { title: "المعادن والمواد المستهلكة", desc: "بحث عن التشريعات والمواد التي تتضمن هذا المصطلح" },
      { title: "النفايات المعدنية", desc: "مصطلح قانوني مرتبط بعبارة البحث" }
    ]
  },
  "استقالة": {
    main: "فسخ عقد العمل بالإرادة المنفردة",
    options: [
      { title: "فسخ عقد العمل بالإرادة المنفردة", desc: "بحث عن التشريعات والمواد التي تتضمن هذا المصطلح" },
      { title: "إنهاء الخدمة", desc: "مصطلح قانوني مرتبط بعبارة البحث" }
    ]
  },
  "طرد": {
    main: "إنهاء عقد العمل لسبب غير مشروع (المادة 77)",
    options: [
      { title: "إنهاء عقد العمل لسبب غير مشروع", desc: "بحث عن التشريعات والمواد التي تتضمن هذا المصطلح" },
      { title: "التعويض عن الفصل", desc: "مصطلح قانوني مرتبط بعبارة البحث" }
    ]
  }
};

export function getLegalSuggestion(userQuery) {
  if (!userQuery || !userQuery.trim()) return null;

  const queryClean = userQuery.trim().toLowerCase();
  
  for (const [key, val] of Object.entries(DICTIONARY_MAP)) {
    if (queryClean.includes(key)) {
      return val;
    }
  }

  // Fallback dynamic suggestion based on typed text
  return {
    main: `${userQuery} والتعليمات التنفيذية`,
    options: [
      { title: `${userQuery} والتعليمات التنفيذية`, desc: "بحث عن التشريعات والمواد التي تتضمن هذا المصطلح" },
      { title: `إعفاءات ${userQuery}`, desc: "مصطلح قانوني مرتبط بعبارة البحث" },
      { title: `ضوابط ${userQuery}`, desc: "مصطلح قانوني مرتبط بعبارة البحث" }
    ]
  };
}

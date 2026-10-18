// frontend/src/components/AiAssistant/aiAnswerGenerator.js

export function generateAssistantResponse(queryText, token = null, userName = '') {
  const prefix = userName ? `أهلاً بك أستاذ ${userName}! ` : 'أهلاً بك! ';
  return {
    id: `a-${Date.now()}`,
    role: 'assistant',
    metadata: {
      mode: 'answer',
      tokenUsed: !!token,
      greeting: `${prefix}إليك الرأي والتحليل القانوني بخصوص: "${queryText}"`,
      sections: [
        {
          type: 'text',
          title: 'الأساس القانوني والتكييف',
          body: 'وفقاً لأحكام قانون ضريبة الدخل والأنظمة والتعليمات التنفيذية الصادرة بمقتضاه، فإن المعالجة تتطلب فحص الوقائع ومطابقتها مع المهل القانونية والشروط الشكلية المقررة.'
        },
        {
          type: 'legal_basis',
          title: 'السند والتعليمات النافذة',
          items: [
            {
              kind: 'instruction',
              source: 'تعليمات دائرة ضريبة الدخل والمبيعات الأردنية النافذة',
              article: '11',
              paragraph: 'ب',
              year: '2021',
              status: 'ساري',
              quote: 'تلتزم المنشآت والمكلفون بمراعاة المعايير والنسب القانونية المحددة في النظام الضريبي الأردني دون تأخير.'
            }
          ]
        },
        {
          type: 'text',
          title: 'الخلاصة التنفيذية',
          body: 'يوصى بتقديم الوثائق والإقرارات ضمن المواعيد المحددة تفادياً لأي غرامات، والرجوع للمستشار المعتمد في حال الحاجة لدراسة متعمقة للملف.'
        }
      ],
      legal_basis: [
        {
          kind: 'regulation',
          source: 'قانون ضريبة الدخل رقم (34) لسنة 2014 وتعديلاته',
          article: '11',
          year: '2014',
          status: 'ساري'
        }
      ],
      follow_ups: [
        { label: 'ما هي الإجراءات التنفيذية الواجب اتخاذها أولاً؟' },
        { label: 'هل توجد سوابق قضائية لمحكمة التمييز في واقعة مماثلة؟' }
      ]
    }
  };
}

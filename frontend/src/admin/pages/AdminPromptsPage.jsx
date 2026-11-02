import React, { useState } from 'react';

export default function AdminPromptsPage({ navigate }) {
  const [buttons, setButtons] = useState([
    {
      id: 'btn-1',
      orderNum: 1,
      type: 'زر بحث متقدم',
      relatedSearchText: 'استشارة',
      title: 'استشارة ضريبية',
      tag: 'استشارة',
      isActive: true,
      description: 'إجابة استشارية عملية مباشرة على السؤال الضريبي',
      generalPrompt: 'أجب كمستشار ضريبي أردني خبير: قدّم إجابة عملية مباشرة مدعومة بالمواد القانونية النافذة، مع خطوات تطبيقية واضحة للمكلف.',
      formatPrompt: 'استشارة متقدمة قائمة على اتخاذ القرار، أقسام الإجابة بالترتيب: text بعنوان ملخص الحالة والقرار؛ numbered بعنوان التكييف الضريبي والبدائل، مع تطبيق النصوص على الوقائع؛ bullets بعنوان: أثر كل بديل والمخاطر؛ legal_basis بعنوان الإسناد المرجعي؛ numbered بعنوان التوصية وخطوات التنفيذ ميزها عن الاستشارة العادية بتحليل البدائل وشروط التطبيق، لا مجرد جواب مباشر.',
      clarificationPrompt: 'عند نقص الوقائع المؤثرة اسأل عن صفة المكلف وطبيعة المعاملة وتاريخها، والهدف من القرار والبدائل المتاحة وأثرها المالي. اختر من سؤال إلى ثلاثة أسئلة مرتبطة بالواقعة وليست قائمة ثابتة.',
      followupPrompt: 'ولّد ثلاثة أسئلة متابعة خاصة بالحالة حول أثر البديل الآخر، تغير ظرف مؤثر، وخطوات تنفيذ القرار لا تكرر الاستيضاح.'
    },
    {
      id: 'btn-2',
      orderNum: 2,
      type: 'زر بحث متقدم',
      relatedSearchText: 'تحليل عميق',
      title: 'تحليل تشريعي عميق',
      tag: 'تحليل عميق',
      isActive: true,
      description: 'تحليل معمّق للنصوص التشريعية والتفسيرات',
      generalPrompt: 'حلّل الموضوع تحليلاً تشريعياً معمّقاً: اعرض النصوص ذات الصلة، وتطور الأحكام عبر التعديلات، وسوابق التطبيق، ثم استخلص الموقف القانوني الراجح مع ذكر الاستثناءات والحالات الحدّية.',
      formatPrompt: 'تحليل قانوني تفصيلي موثق بالأسانيد، يبدأ بعرض النص، ثم التفسير المقارن، ثم الرأي الراجح ومآلات التطبيق.',
      clarificationPrompt: 'اسأل عن تاريخ الواقعة المالي، والقانون الساري في تلك السنة المحددة.',
      followupPrompt: 'اقترح أسئلة حول قرارات المحاكم التمييزية أو التفسيرية المرتبطة.'
    },
    {
      id: 'btn-3',
      orderNum: 3,
      type: 'زر بحث متقدم',
      relatedSearchText: 'مقارنة',
      title: 'مقارنة تشريعية',
      tag: 'مقارنة',
      isActive: true,
      description: 'مقارنة بين مواد أو أنظمة أو نسخ تشريعية',
      generalPrompt: 'قارن بين الأحكام التشريعية ذات الصلة: حدّد أوجه التشابه والاختلاف بين المواد أو النسخ أو الأنظمة، وبيّن أثر كل اختلاف عملياً على المكلف، وقدّم النتيجة في صيغة منظمة.',
      formatPrompt: 'جدول مقارنة مقارن يتضمن وجه المقارنة، النص الأول، النص الثاني، والأثر الضريبي المالي.',
      clarificationPrompt: 'اسأل عن القانونين أو المادتين المراد المقارنة بينهما بدقة.',
      followupPrompt: 'استفسر عما إذا كان المكلف خاضعاً لمنطقة تنموية أو منطقة حرة.'
    },
    {
      id: 'btn-4',
      orderNum: 4,
      type: 'زر بحث متقدم',
      relatedSearchText: 'امتثال',
      title: 'الالتزام والامتثال',
      tag: 'امتثال',
      isActive: true,
      description: 'متطلبات الامتثال والالتزامات الإجرائية والمواعيد',
      generalPrompt: 'ركّز على متطلبات الامتثال: عدّد الالتزامات الإجرائية والمواعيد النهائية والغرامات المترتبة على المخالفة، وقدّم قائمة تحقق عملية لضمان الالتزام الكامل بالتشريعات النافذة.',
      formatPrompt: 'قائمة مهام تنفيذية محددة بالتواريخ والغرامات ونسب الفائدة القانونية.',
      clarificationPrompt: 'اسأل عن صفة المكلف (فرد طبيعي أم شركة ذات مسؤولية محدودة أم مساهمة عامة).',
      followupPrompt: 'اقترح خطوات فورية لتسوية الوضع وتجنب الحجز المالي أو الغرامة الإضافية.'
    }
  ]);

  const [modalState, setModalState] = useState({ isOpen: false, item: null, isNew: false });

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      setButtons(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleSaveModal = (formData) => {
    if (modalState.isNew) {
      const newBtn = {
        ...formData,
        id: `btn-${Date.now()}`,
        orderNum: buttons.length + 1
      };
      setButtons(prev => [...prev, newBtn]);
    } else {
      setButtons(prev => prev.map(b => b.id === formData.id ? formData : b));
    }
    setModalState({ isOpen: false, item: null, isNew: false });
  };

  return (
    <div style={{ padding: '24px 32px', direction: 'rtl', fontFamily: "'Cairo', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            onClick={() => navigate ? navigate('/admin') : window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0',
              border: 'none',
              background: 'none',
              color: '#64748B',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span>رجوع</span>
          </button>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
            <span>مكتبة البرومبت</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            أزرار البحث المتقدم وقوالب المساعد تُدار من هنا، وأي تعديل ينعكس مباشرة على واجهة المستخدم.
          </p>
        </div>

        <button
          onClick={() => setModalState({
            isOpen: true,
            isNew: true,
            item: {
              title: '',
              type: 'زر بحث متقدم',
              relatedSearchText: '',
              orderNum: buttons.length + 1,
              tag: 'استشارة',
              isActive: true,
              description: '',
              generalPrompt: '',
              formatPrompt: '',
              clarificationPrompt: '',
              followupPrompt: ''
            }
          })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0D3C5C',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>عنصر جديد</span>
        </button>
      </div>

      {/* Section: أزرار البحث المتقدم */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>أزرار البحث المتقدم</span>
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              تظهر أسفل شريط البحث في المساعد عند تفعيل البحث المتقدم، حسب الترتيب والتفعيل المحددين هنا.
            </p>
          </div>

          <button
            onClick={() => setModalState({
              isOpen: true,
              isNew: true,
              item: {
                title: '',
                type: 'زر بحث متقدم',
                relatedSearchText: '',
                orderNum: buttons.length + 1,
                tag: 'استشارة',
                isActive: true,
                description: '',
                generalPrompt: '',
                formatPrompt: '',
                clarificationPrompt: '',
                followupPrompt: ''
              }
            })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>زر بحث جديد</span>
          </button>
        </div>

        {/* 4 Cards Grid - 4 Columns side-by-side with responsive wrap */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '12px',
          width: '100%'
        }}>
          {buttons.map((btn) => (
            <div
              key={btn.id}
              style={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {btn.title}
                  </h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    flexShrink: 0
                  }}>
                    #{btn.orderNum}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                    background: '#FFFFFF'
                  }}>
                    {btn.tag}
                  </span>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: btn.isActive ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                    color: btn.isActive ? '#16A34A' : '#94A3B8',
                    background: '#FFFFFF'
                  }}>
                    {btn.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: '11.5px',
                color: '#64748B',
                margin: '0 0 8px',
                lineHeight: 1.4,
                fontWeight: 500,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {btn.description}
              </p>

              {/* General Prompt text (Line clamped) */}
              <p style={{
                fontSize: '10.5px',
                color: '#64748B',
                margin: 0,
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                flex: 1
              }}>
                {btn.generalPrompt}
              </p>

              {/* Action Buttons: تحرير and حذف (SVG only, no emojis) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: true, item: btn, isNew: false })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  <span>تحرير</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(btn.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#EF4444',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal - Matching Image 1 & Image 2 exactly */}
      {modalState.isOpen && (
        <PromptModal
          item={modalState.item}
          isNew={modalState.isNew}
          onClose={() => setModalState({ isOpen: false, item: null, isNew: false })}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}

function PromptModal({ item, isNew, onClose, onSave }) {
  const [form, setForm] = useState({
    id: item?.id || '',
    type: item?.type || 'زر بحث متقدم',
    relatedSearchText: item?.relatedSearchText || 'استشارة',
    orderNum: item?.orderNum || 1,
    title: item?.title || '',
    tag: item?.tag || 'استشارة',
    description: item?.description || '',
    generalPrompt: item?.generalPrompt || '',
    formatPrompt: item?.formatPrompt || '',
    clarificationPrompt: item?.clarificationPrompt || '',
    followupPrompt: item?.followupPrompt || '',
    isActive: item?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.generalPrompt.trim()) {
      alert('يرجى ملء اسم العنصر والتوجيه العام');
      return;
    }
    onSave({
      ...form,
      tag: form.relatedSearchText || form.tag
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        fontFamily: "'Cairo', sans-serif"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 20px',
          background: '#FFFFFF',
          flexShrink: 0
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {isNew ? 'إضافة عنصر جديد' : 'تعديل عنصر'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          
          {/* Top Row: نوع العنصر, نص البحث المرتبط, ترتيب الظهور */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>نوع العنصر</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '12px', fontFamily: 'inherit', background: '#FFFFFF' }}
              >
                <option value="زر بحث متقدم">زر بحث متقدم</option>
                <option value="قالب مساعد">قالب مساعد</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>نص البحث المرتبط</label>
              <input
                type="text"
                value={form.relatedSearchText}
                onChange={e => setForm({ ...form, relatedSearchText: e.target.value })}
                placeholder="مثال: استشارة"
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '12px', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>ترتيب الظهور</label>
              <select
                value={form.orderNum}
                onChange={e => setForm({ ...form, orderNum: Number(e.target.value) })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '12px', fontFamily: 'inherit', background: '#FFFFFF' }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
          </div>

          {/* Row 2: اسم العنصر */}
          <div>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="اسم العنصر (مثال: استشارة ضريبية)"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '12.5px', fontFamily: 'inherit', fontWeight: 700 }}
              required
            />
          </div>

          {/* Row 3: الوصف المختصر */}
          <div>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="الوصف المختصر (مثال: إجابة استشارية عملية مباشرة على السؤال الضريبي)"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '12px', fontFamily: 'inherit' }}
              required
            />
          </div>

          {/* Field: التوجيه العام للنوع */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>التوجيه العام للنوع</label>
            <textarea
              rows={3}
              value={form.generalPrompt}
              onChange={e => setForm({ ...form, generalPrompt: e.target.value })}
              placeholder="أجب كمستشار ضريبي أردني خبير: قدّم إجابة عملية مباشرة مدعومة بالمواد القانونية النافذة..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '11.5px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
              required
            />
          </div>

          {/* Field: شكل الإجابة وأقسامها */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>شكل الإجابة وأقسامها</label>
            <textarea
              rows={3}
              value={form.formatPrompt}
              onChange={e => setForm({ ...form, formatPrompt: e.target.value })}
              placeholder="استشارة متقدمة قائمة على اتخاذ القرار، أقسام الإجابة بالترتيب: text بعنوان ملخص الحالة والقرار..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '11.5px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Field: أسئلة فهم الحالة */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>أسئلة فهم الحالة</label>
            <textarea
              rows={3}
              value={form.clarificationPrompt}
              onChange={e => setForm({ ...form, clarificationPrompt: e.target.value })}
              placeholder="عند نقص الوقائع المؤثرة اسأل عن صفة المكلف وطبيعة المعاملة وتاريخها..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '11.5px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Field: الأسئلة التتابعية */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>الأسئلة التتابعية</label>
            <textarea
              rows={2}
              value={form.followupPrompt}
              onChange={e => setForm({ ...form, followupPrompt: e.target.value })}
              placeholder="ولّد ثلاثة أسئلة متابعة خاصة بالحالة حول أثر البديل الآخر..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5DEE5', fontSize: '11.5px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Switch: نشط ويظهر في واجهة المستخدم */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            marginTop: '2px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
              نشط ويظهر في واجهة المستخدم
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: form.isActive ? '#0D3C5C' : '#CBD5E1',
                borderRadius: '34px',
                transition: '0.2s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px',
                  width: '16px',
                  left: form.isActive ? '19px' : '3px',
                  bottom: '3px',
                  background: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s'
                }} />
              </span>
            </label>
          </div>

          {/* Full-width Submit Button: حفظ وربط بالمساعد */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              background: '#0D3C5C',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 2px 6px rgba(13, 60, 92, 0.2)'
            }}
          >
            حفظ وربط بالمساعد
          </button>
        </form>
      </div>
    </div>
  );
}

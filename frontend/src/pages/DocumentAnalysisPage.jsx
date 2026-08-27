import React, { useState, useRef } from 'react';
import Toast, { useToast } from '../components/Toast/Toast';

const MOCK_RESULTS = {
  general:   "📋 **ملخص عام:**\nيتضمن المستند شروطًا وأحكامًا عامة تتعلق بالاتفاقية المبرمة بين الأطراف.\n\n**النقاط الرئيسية:**\n• مدة الاتفاقية 12 شهرًا قابلة للتجديد\n• تحديد صريح لمسؤوليات كل طرف\n• آلية واضحة لفض النزاعات عبر التحكيم\n• شروط إنهاء العقد تتطلب إشعارًا مسبقًا بـ 30 يومًا\n\n**المخاطر:**\n⚠️ غياب تعريف واضح للقوة القاهرة\n⚠️ شروط الغرامات التأخيرية قد تكون مرهقة\n\n**التوصيات:**\n💡 مراجعة بند التحكيم مع مستشار قانوني\n💡 إضافة بند للمراجعة السنوية",
  legal:     "⚖️ **تحليل قانوني:**\nالمستند ذو طابع قانوني يستوجب مراجعة دقيقة وفق أحكام القانون الأردني.\n\n**النقاط القانونية:**\n• الاختصاص القضائي: المحاكم الأردنية\n• القانون المطبق: القانون المدني الأردني\n• بنود التعويض محددة بسقف مالي\n• حقوق الملكية الفكرية مصونة\n\n**المخاطر القانونية:**\n⚠️ بعض البنود قد تتعارض مع قانون التجارة رقم 12/1966\n⚠️ غياب توقيع الشاهد على بنود جوهرية\n\n**التوصيات:**\n💡 مراجعة البنود المتعارضة مع التشريعات\n💡 توثيق العقد لدى الجهات الرسمية",
  contract:  "📝 **مراجعة العقد:**\nعقد يُنظّم العلاقة بين طرفين بشكل واضح نسبيًا.\n\n**بنود العقد:**\n• قيمة العقد والجداول الزمنية محددة\n• ضمانات الأداء موضحة تفصيليًا\n• إجراءات التسليم والاستلام واضحة\n• بنود التعديل تستلزم موافقة خطية\n\n**ثغرات العقد:**\n⚠️ الغرامة التعاقدية تفتقر لآلية احتساب واضحة\n⚠️ تعريف 'الإخلال الجوهري' غامض\n\n**التوصيات:**\n💡 إضافة جدول زمني تفصيلي كملحق\n💡 إدراج بند الوساطة الودية قبل التحكيم",
  financial: "💰 **تحليل مالي:**\nالمؤشرات العامة تشير إلى وضع مالي يمكن تقييمه بشكل إيجابي نسبيًا.\n\n**المؤشرات المالية:**\n• إجمالي الإيرادات موثق بشكل واضح\n• هيكل التكاليف الثابتة والمتغيرة محدد\n• التدفقات النقدية المتوقعة للفترة القادمة\n• نسب الربحية والعائد على الاستثمار إيجابية\n\n**مناطق الخطر:**\n⚠️ ارتفاع نسبة الديون قصيرة الأجل\n⚠️ تركز الإيرادات في مصدر واحد\n\n**التوصيات:**\n💡 تنويع مصادر الإيرادات\n💡 إعادة هيكلة الديون قصيرة الأجل",
  tax:       "🧾 **تحليل ضريبي:**\nالمستند يتضمن معاملات ذات أثر ضريبي وفق قانون ضريبة الدخل رقم 34/2014.\n\n**الجوانب الضريبية:**\n• الوعاء الضريبي الخاضع للضريبة محدد\n• المعاملات الخاضعة لضريبة المبيعات 16%\n• الخصومات المسموح بها وفق المادة 9\n• الدخل المعفى وفق المادة 3\n\n**المخاطر الضريبية:**\n⚠️ بعض الاستقطاعات قد لا تستوفي شروط الخصم\n⚠️ غياب مستندات داعمة لبعض النفقات\n\n**التوصيات:**\n💡 توفير المستندات الداعمة لجميع النفقات\n💡 مراجعة تصنيف الدخول مع مستشار ضريبي",
};

const TYPES = [
  { value: 'general',   label: 'عام'    },
  { value: 'legal',     label: 'قانوني' },
  { value: 'contract',  label: 'عقد'    },
  { value: 'financial', label: 'مالي'   },
  { value: 'tax',       label: 'ضريبي'  },
];

export default function DocumentAnalysisPage() {
  const { toast, showToast } = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile]             = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [analysisType, setType]     = useState('general');
  const [loading, setLoading]       = useState(false);
  const [notes, setNotes]           = useState('');
  const [history, setHistory]       = useState([]);
  const [selected, setSelected]     = useState(null);

  const handleFile = (f) => {
    if (!f) return;
    const ok = ['pdf','docx','xlsx','jpg','jpeg','png'];
    if (!ok.includes(f.name.split('.').pop().toLowerCase())) {
      showToast('صيغة الملف غير مدعومة', 'error'); return;
    }
    setFile(f);
    setNotes('');
    setSelected(null);
  };

  const handleAnalyse = async () => {
    if (!file) { showToast('يرجى رفع مستند أولاً', 'error'); return; }
    setLoading(true);
    setNotes('');
    await new Promise(r => setTimeout(r, 2000));
    const result = MOCK_RESULTS[analysisType];
    const entry  = { id: Date.now(), name: file.name, type: analysisType, result };
    setNotes(result);
    setHistory(p => [entry, ...p.slice(0, 9)]);
    setLoading(false);
    showToast('تم تحليل المستند بنجاح!');
  };

  const displayNotes = selected ? selected.result : notes;

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B' }}>
      <Toast {...toast} />

      {/* ── Title ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>📄</span>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            تحليل المستندات
          </h1>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
          ارفع إجراءاتك، وعقودك، ومواتيرك لتقوم الذكاء الاصطناعي بقراءتها واستخراج الملاحظات الضريبية
        </p>
      </div>

      {/* ── Upload Zone ── */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          background: '#FFFFFF',
          border: `2px dashed ${dragOver ? '#F5A52A' : file ? '#22C55E' : '#D4C4A0'}`,
          borderRadius: '16px',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'border-color 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {/* Upload icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 4px 14px rgba(245,165,42,0.35)',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        {file ? (
          <>
            <div style={{ fontWeight: '800', color: '#15803D', fontSize: '15px', marginBottom: '4px' }}>
              {file.name}
            </div>
            <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '14px' }}>
              {(file.size / 1024).toFixed(1)} كيلوبايت
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: '800', color: '#C47B00', fontSize: '16px', marginBottom: '6px' }}>
              ارفع مستندًا للتحليل
            </div>
            <div style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px' }}>
              PDF · DOCX · XLSX · JPG — حتى 25 ميجابايت لكل ملف
            </div>
          </>
        )}

        <button
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
            color: '#fff', border: 'none', padding: '9px 24px',
            borderRadius: '25px', fontWeight: '700', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 3px 10px rgba(245,165,42,0.3)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          اختر ملفًا
        </button>

        <div style={{ color: '#CBD5E1', fontSize: '11px', marginTop: '10px' }}>
          يدعم OCR العربية والإنجليزية
        </div>
      </div>

      {/* ── Type selector ── */}
      {file && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              style={{
                padding: '7px 18px', borderRadius: '25px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                border: analysisType === t.value ? '2px solid #F5A52A' : '2px solid #E2E8F0',
                background: analysisType === t.value ? '#FFF8EC' : '#FFFFFF',
                color: analysisType === t.value ? '#C47B00' : '#64748B',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Bottom two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px' }}>

        {/* LEFT — Notes / Result */}
        <div style={{
          background: '#FFFFFF', borderRadius: '16px',
          border: '1px solid #E8E8E8', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Card header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', borderBottom: '1px solid #F1F5F9',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>
                نُم عرض الملف ↑
              </div>
              <div style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '15px' }}>
                {file ? file.name : 'اختر مستندًا'}
              </div>
            </div>
            {file && (
              <button
                onClick={() => { setFile(null); setNotes(''); setSelected(null); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94A3B8', padding: '4px',
                }}
                title="إزالة الملف"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>

          {/* Subtitle */}
          <div style={{ padding: '12px 18px 0', fontWeight: '700', fontSize: '13px', color: '#475569' }}>
            الملاحظات والاكتشافات
          </div>

          {/* Content area */}
          <div style={{
            margin: '12px 18px',
            minHeight: '160px',
            background: '#F8FAFC',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.9',
            color: displayNotes ? '#1E293B' : '#94A3B8',
            fontFamily: 'Tajawal, sans-serif',
            whiteSpace: 'pre-wrap',
            border: '1px solid #E2E8F0',
          }}>
            {loading
              ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B' }}>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid #E2E8F0', borderTopColor: '#F5A52A',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  جارٍ تحليل المستند بواسطة الذكاء الاصطناعي...
                  <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
                </div>
              : displayNotes || 'لم يتم تحليل هذا المستند بعد. اضغط زر التقرير التفصيلي ابدأ التحليل'
            }
          </div>

          {/* Analyse button */}
          <div style={{ padding: '0 18px 18px' }}>
            <button
              onClick={handleAnalyse}
              disabled={loading || !file}
              style={{
                width: '100%', padding: '12px',
                background: loading || !file
                  ? '#F1F5F9'
                  : 'linear-gradient(135deg, #F5A52A, #E08A00)',
                color: loading || !file ? '#94A3B8' : '#FFFFFF',
                border: 'none', borderRadius: '12px', fontSize: '14px',
                fontWeight: '800', cursor: loading || !file ? 'not-allowed' : 'pointer',
                fontFamily: 'Tajawal, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading || !file ? 'none' : '0 4px 14px rgba(245,165,42,0.3)',
                transition: 'all 0.2s',
              }}
            >
              ✨ اطلب تقريرًا تفصيليًا من ديوان AI
            </button>
          </div>
        </div>

        {/* RIGHT — History */}
        <div style={{
          background: '#FFFFFF', borderRadius: '16px',
          border: '1px solid #E8E8E8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>📂</span>
            <span style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '14px' }}>آخر المستندات</span>
          </div>

          <div style={{ padding: '12px' }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center', color: '#CBD5E1', fontSize: '12px',
                padding: '32px 8px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>📂</div>
                لا توجد مستندات بعد. ارفع ملفًا لبدء التحليل
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelected(item); setNotes(''); }}
                    style={{
                      width: '100%', textAlign: 'right', padding: '9px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selected?.id === item.id ? '#F5A52A' : '#E8E8E8'}`,
                      background: selected?.id === item.id ? '#FFF8EC' : '#FAFAFA',
                      cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      fontWeight: '700', fontSize: '11px', color: '#0D3C5C',
                      marginBottom: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      📄 {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {TYPES.find(t => t.value === item.type)?.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

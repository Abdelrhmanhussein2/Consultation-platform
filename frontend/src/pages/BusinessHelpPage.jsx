import React, { useState } from 'react';
import Toast, { useToast } from '../components/Toast/Toast';

/* ─────────────── Data ─────────────── */
const TOOLS = [
  {
    id: 'income-tax',
    icon: '🧮',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    title: 'حاسبة ضريبة الدخل',
    desc: 'احسب ضريبة الدخل المستحقة على الأفراد والشركات وفق قانون 2024',
    modal: 'income',
  },
  {
    id: 'sales-tax',
    icon: '🧾',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
    title: 'حاسبة ضريبة المبيعات',
    desc: 'احسب ضريبة المبيعات على مواردك بالنسب المخصلة (%16، %4)',
    modal: 'sales',
  },
  {
    id: 'invoice',
    icon: '📄',
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    title: 'مولّد الفواتير الإلكترونية',
    desc: 'أنشئ فاتورة مبيعات وفق متطلبات النظام الوطني الإلكترونية',
    modal: 'invoice',
  },
  {
    id: 'company',
    icon: '🏢',
    iconBg: '#FFF7ED',
    iconColor: '#FB923C',
    title: 'دليل تأسيس شركة',
    desc: 'خطوات تأسيس شركة في الأردن: التسجيل، الرخص، الغرف، الشعار الاجتماعي',
    modal: 'company',
  },
  {
    id: 'simulator',
    icon: '⚖️',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    title: 'محاكي القرار الضريبي',
    desc: 'جرّب قرارات قبل تنفيذها للدراية والموازنة على المخاطر مسبقاً',
    modal: 'simulator',
  },
  {
    id: 'templates',
    icon: '📚',
    iconBg: '#FDF4FF',
    iconColor: '#D946EF',
    title: 'مكتبة النماذج',
    desc: 'نماذج جاهزة للعقود، الفاتورات، الاعتراضات، والبيانات',
    modal: 'templates',
  },
];

const FAQS = [
  {
    q: 'متى يجب التسجيل في ضريبة المبيعات؟',
    a: 'يجب التسجيل إذا تجاوزت مبيعاتك السنوية 30,000 دينار أردني، أو إذا كنت تمارس أنشطة معينة منصوص عليها في قانون ضريبة المبيعات رقم 29 لسنة 2009.',
  },
  {
    q: 'ما الفرق بين ضريبة الدخل ومساهمة الدعم الوطني؟',
    a: 'ضريبة الدخل تُفرض على الدخل الصافي للأفراد والشركات وفق شرائح محددة. أما مساهمة الدعم الوطني فهي رسوم إضافية مؤقتة تُفرض على الشركات الكبيرة والأفراد ذوي الدخل المرتفع لتمويل برامج الدعم الحكومية.',
  },
  {
    q: 'هل الفوترة الإلكترونية إلزامية لجميع الشركات؟',
    a: 'نعم، الفوترة الإلكترونية إلزامية لجميع الشركات والمنشآت المسجلة والمكلفة قانونًا بالضريبة في الأردن وفقًا للأنظمة الصادرة عن دائرة ضريبة الدخل والمبيعات لتنظيم وإرسال الفواتير إلكترونيًا.',
  },
];

/* ─────────────── Modals ─────────────── */
function ModalWrapper({ title, icon, onClose, children }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '20px', padding: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{icon}</span>
          <span style={{ fontWeight: '800', fontSize: '16px', color: '#0D3C5C' }}>{title}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', marginTop: '12px' }}>{children}</div>;
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: '10px',
        border: '1.5px solid #E2E8F0', fontSize: '13px',
        fontFamily: 'Tajawal, sans-serif', color: '#374151',
        outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = '#F5A52A'}
      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
    />
  );
}

function CalcBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '12px', marginTop: '16px',
        background: 'linear-gradient(135deg,#F5A52A,#E08A00)',
        color: '#fff', border: 'none', borderRadius: '12px',
        fontSize: '14px', fontWeight: '800', cursor: 'pointer',
        fontFamily: 'Tajawal, sans-serif',
        boxShadow: '0 4px 14px rgba(245,165,42,0.3)',
      }}
    >
      {children}
    </button>
  );
}

function ResultBox({ children }) {
  return (
    <div style={{
      background: '#F8FAFC', borderRadius: '12px', padding: '14px 16px',
      border: '1px solid #E2E8F0', marginTop: '14px',
    }}>
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: '13px', color: '#64748B' }}>{label}</span>
      <span style={{ fontWeight: '800', fontSize: '13px', color: accent ? '#F5A52A' : '#0D3C5C' }}>{value}</span>
    </div>
  );
}

function Note({ children }) {
  return <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '10px', lineHeight: '1.6' }}>{children}</div>;
}

const selectStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1.5px solid #E2E8F0', fontSize: '13px',
  fontFamily: 'Tajawal, sans-serif', color: '#374151',
  outline: 'none', background: '#FAFAFA', cursor: 'pointer',
};

const secondaryBtn = {
  background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
  padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
  fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
  width: '100%',
};

function IncomeTaxModal({ onClose }) {
  const [income, setIncome]     = useState('');
  const [expenses, setExpenses] = useState('');
  const [result, setResult]     = useState(null);

  const calc = () => {
    const net   = Math.max(0, parseFloat(income || 0) - parseFloat(expenses || 0) - 9000);
    let tax = 0;
    if (net <= 5000)        tax = net * 0.05;
    else if (net <= 10000)  tax = 5000 * 0.05 + (net - 5000) * 0.10;
    else                    tax = 5000 * 0.05 + 5000 * 0.10 + (net - 10000) * 0.15;
    setResult({ net, tax: Math.max(0, tax) });
  };

  return (
    <ModalWrapper title="حاسبة ضريبة الدخل" icon="🧮" onClose={onClose}>
      <Label>إجمالي الدخل السنوي (دينار)</Label>
      <Input value={income} onChange={e => setIncome(e.target.value)} placeholder="مثال: 25000" />
      <Label>النفقات المسموح بخصمها (دينار)</Label>
      <Input value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="مثال: 5000" />
      <CalcBtn onClick={calc}>احسب الضريبة</CalcBtn>
      {result && (
        <ResultBox>
          <Row label="الدخل الخاضع للضريبة" value={`${result.net.toFixed(2)} د.أ`} />
          <Row label="ضريبة الدخل المستحقة" value={`${result.tax.toFixed(2)} د.أ`} accent />
        </ResultBox>
      )}
      <Note>* الإعفاء الشخصي: 9,000 د.أ — وفق قانون ضريبة الدخل رقم 34 لسنة 2014</Note>
    </ModalWrapper>
  );
}

function SalesTaxModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const [rate, setRate]     = useState('16');
  const [result, setResult] = useState(null);

  const calc = () => {
    const base = parseFloat(amount || 0);
    const r    = parseFloat(rate) / 100;
    setResult({ base, tax: base * r, total: base * (1 + r) });
  };

  return (
    <ModalWrapper title="حاسبة ضريبة المبيعات" icon="🧾" onClose={onClose}>
      <Label>قيمة البضاعة / الخدمة (دينار)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="مثال: 1000" />
      <Label>نسبة ضريبة المبيعات</Label>
      <select value={rate} onChange={e => setRate(e.target.value)} style={selectStyle}>
        <option value="16">16% — عام</option>
        <option value="4">4% — مواد غذائية مختارة</option>
        <option value="0">0% — معفاة</option>
      </select>
      <CalcBtn onClick={calc}>احسب الضريبة</CalcBtn>
      {result && (
        <ResultBox>
          <Row label="قيمة البضاعة"      value={`${result.base.toFixed(2)} د.أ`} />
          <Row label="ضريبة المبيعات"    value={`${result.tax.toFixed(2)} د.أ`} />
          <Row label="الإجمالي شاملًا"   value={`${result.total.toFixed(2)} د.أ`} accent />
        </ResultBox>
      )}
    </ModalWrapper>
  );
}

function InvoiceModal({ onClose }) {
  const [client, setClient]   = useState('');
  const [items, setItems]     = useState([{ desc: '', qty: 1, price: '' }]);
  const [printed, setPrinted] = useState(false);

  const addItem = () => setItems(p => [...p, { desc: '', qty: 1, price: '' }]);
  const updateItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.price || 0) * parseFloat(it.qty || 0)), 0);
  const tax      = subtotal * 0.16;
  const total    = subtotal + tax;

  return (
    <ModalWrapper title="مولّد الفواتير الإلكترونية" icon="📄" onClose={onClose}>
      <Label>اسم العميل / الجهة</Label>
      <Input value={client} onChange={e => setClient(e.target.value)} placeholder="اسم العميل" />
      <Label>بنود الفاتورة</Label>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px', gap: '8px', marginBottom: '8px' }}>
          <Input value={it.desc}  onChange={e => updateItem(i, 'desc',  e.target.value)} placeholder="وصف البند" />
          <Input value={it.qty}   onChange={e => updateItem(i, 'qty',   e.target.value)} placeholder="الكمية" type="number" />
          <Input value={it.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="السعر" type="number" />
        </div>
      ))}
      <button onClick={addItem} style={{ ...secondaryBtn, marginBottom: '12px' }}>+ إضافة بند</button>
      <ResultBox>
        <Row label="المجموع قبل الضريبة" value={`${subtotal.toFixed(2)} د.أ`} />
        <Row label="ضريبة المبيعات 16%"  value={`${tax.toFixed(2)} د.أ`} />
        <Row label="الإجمالي"            value={`${total.toFixed(2)} د.أ`} accent />
      </ResultBox>
      <CalcBtn onClick={() => setPrinted(true)}>
        {printed ? '✅ تم إنشاء الفاتورة' : 'إنشاء الفاتورة'}
      </CalcBtn>
    </ModalWrapper>
  );
}

function CompanyModal({ onClose }) {
  const steps = [
    { n: '01', title: 'التسجيل في دائرة مراقبة الشركات', desc: 'تقديم طلب التأسيس مع عقد التأسيس وهوية الشركاء – مدائن / وزارة الصناعة' },
    { n: '02', title: 'الحصول على السجل التجاري', desc: 'التسجيل في وزارة الصناعة والتجارة والحصول على الرقم الضريبي' },
    { n: '03', title: 'رخصة البلدية ومكان العمل', desc: 'الحصول على رخصة المهن من البلدية المختصة وفق نوع النشاط' },
    { n: '04', title: 'التسجيل في الضمان الاجتماعي', desc: 'تسجيل الشركة والموظفين في مؤسسة الضمان الاجتماعي' },
    { n: '05', title: 'فتح حساب بنكي مؤسسي', desc: 'فتح حساب تجاري باسم الشركة مع تقديم الوثائق الرسمية للبنك' },
    { n: '06', title: 'التسجيل بضريبة المبيعات (اختياري)', desc: 'التسجيل إذا تجاوزت المبيعات المتوقعة 30,000 دينار سنوياً' },
  ];
  return (
    <ModalWrapper title="دليل تأسيس شركة" icon="🏢" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#F5A52A,#E08A00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>{s.n}</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0D3C5C', marginBottom: '3px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
}

function SimulatorModal({ onClose }) {
  const [revenue, setRevenue] = useState('');
  const [type, setType]       = useState('individual');
  const [result, setResult]   = useState(null);

  const calc = () => {
    const r  = parseFloat(revenue || 0);
    let tax  = 0;
    if (type === 'individual') {
      const net = Math.max(0, r - 9000);
      if (net <= 5000)       tax = net * 0.05;
      else if (net <= 10000) tax = 250 + (net - 5000) * 0.10;
      else                   tax = 750 + (net - 10000) * 0.15;
    } else {
      tax = r <= 100000 ? r * 0.10 : r <= 500000 ? 10000 + (r - 100000) * 0.15 : 70000 + (r - 500000) * 0.20;
    }
    const salesTax = r * 0.16;
    setResult({ income: r, tax: Math.max(0, tax), salesTax, total: Math.max(0, tax) + salesTax });
  };

  return (
    <ModalWrapper title="محاكي القرار الضريبي" icon="⚖️" onClose={onClose}>
      <Label>نوع الكيان</Label>
      <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
        <option value="individual">فرد / مؤسسة فردية</option>
        <option value="company">شركة</option>
      </select>
      <Label>الدخل / الإيرادات السنوية (دينار)</Label>
      <Input value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="مثال: 50000" />
      <CalcBtn onClick={calc}>محاكاة الأعباء الضريبية</CalcBtn>
      {result && (
        <ResultBox>
          <Row label="ضريبة الدخل المتوقعة"   value={`${result.tax.toFixed(2)} د.أ`} />
          <Row label="ضريبة المبيعات المتوقعة" value={`${result.salesTax.toFixed(2)} د.أ`} />
          <Row label="إجمالي الأعباء الضريبية" value={`${result.total.toFixed(2)} د.أ`} accent />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B' }}>
            نسبة الضريبة من الإيراد: {result.income > 0 ? ((result.total / result.income) * 100).toFixed(1) : 0}%
          </div>
        </ResultBox>
      )}
    </ModalWrapper>
  );
}

function TemplatesModal({ onClose }) {
  const templates = [
    { name: 'عقد توظيف',             icon: '📋' },
    { name: 'فاتورة مبيعات',          icon: '🧾' },
    { name: 'عقد مقاولة',             icon: '🏗️' },
    { name: 'عقد إيجار تجاري',        icon: '🏢' },
    { name: 'اعتراض ضريبي',           icon: '⚖️' },
    { name: 'إشعار دائن',             icon: '📑' },
    { name: 'طلب ترخيص مهنة',         icon: '📝' },
    { name: 'إقرار ضريبة المبيعات',   icon: '🧾' },
  ];
  return (
    <ModalWrapper title="مكتبة النماذج" icon="📚" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {templates.map(t => (
          <button
            key={t.name}
            style={{
              padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
              background: '#FAFAFA', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
              textAlign: 'center', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5A52A'; e.currentTarget.style.background = '#FFFBF0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA'; }}
          >
            <span style={{ fontSize: '24px' }}>{t.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D3C5C' }}>{t.name}</span>
            <span style={{ fontSize: '11px', color: '#F5A52A', fontWeight: '700' }}>تحميل ⬇</span>
          </button>
        ))}
      </div>
    </ModalWrapper>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function BusinessHelpPage({ navigate }) {
  const { toast, showToast } = useToast();
  const [openModal, setOpenModal] = useState(null);
  const [openFaq, setOpenFaq]    = useState(null);

  const MODAL_MAP = {
    income:    IncomeTaxModal,
    sales:     SalesTaxModal,
    invoice:   InvoiceModal,
    company:   CompanyModal,
    simulator: SimulatorModal,
    templates: TemplatesModal,
  };

  const ActiveModal = openModal ? MODAL_MAP[openModal] : null;

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* Modal overlay */}
      {ActiveModal && (
        <div
          onClick={() => setOpenModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', margin: '0 16px', maxHeight: '85vh', overflowY: 'auto' }}>
            <ActiveModal onClose={() => setOpenModal(null)} />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>❓</span>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>مساعدة الأعمال</h1>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
          أدوات وحاسبات وأدلة عملية لإدارة شؤونك الضريبية والقانونية
        </p>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D3C5C 0%, #0F4F7A 100%)',
        borderRadius: '16px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '28px', gap: '16px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#FFFFFF', marginBottom: '4px' }}>
            تحتاج مساعدة مخصصة لعملك؟
          </div>
          <div style={{ fontSize: '13px', color: '#94C9E8' }}>
            احجز جلسة مع استشاري متخصص في مجال نشاطك
          </div>
        </div>
        <button
          onClick={() => navigate && navigate('/consultants')}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
            color: '#fff', border: 'none', padding: '10px 22px',
            borderRadius: '25px', fontWeight: '800', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 14px rgba(245,165,42,0.4)', flexShrink: 0,
          }}
        >
          <span>👥</span> تصفح المستشارين
        </button>
      </div>

      {/* ── Section: أدوات سريعة ── */}
      <div style={{ fontWeight: '800', fontSize: '15px', color: '#0D3C5C', marginBottom: '14px' }}>
        أدوات سريعة
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '32px' }}>
        {TOOLS.map(tool => (
          <div
            key={tool.id}
            style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E8E8E8', padding: '18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: tool.iconBg, fontSize: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tool.icon}
            </div>

            <div style={{ fontWeight: '800', fontSize: '14px', color: '#0D3C5C' }}>{tool.title}</div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.65', flexGrow: 1 }}>{tool.desc}</div>

            <button
              onClick={() => setOpenModal(tool.modal)}
              style={{
                alignSelf: 'flex-start',
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                fontSize: '12px', fontWeight: '700', color: '#F5A52A',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              أداة البدء ‹
            </button>
          </div>
        ))}
      </div>

      {/* ── Section: أسئلة شائعة ── */}
      <div style={{ fontWeight: '800', fontSize: '16px', color: '#0D3C5C', marginBottom: '16px', marginTop: '32px' }}>
        أسئلة شائعة
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #F1F5F9',
              boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)',
              overflow: 'hidden',
              transition: 'all 0.2s',
            }}
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'Tajawal, sans-serif',
                textAlign: 'right',
                gap: '16px',
              }}
            >
              {/* Chevron on the far left */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>

              {/* Question text on the far right */}
              <span style={{ fontWeight: '800', fontSize: '14px', color: '#0D3C5C', flexGrow: 1 }}>
                {faq.q}
              </span>
            </button>
            {openFaq === i && (
              <div style={{
                padding: '0 24px 20px 24px',
                fontSize: '13px',
                color: '#475569',
                lineHeight: '1.8',
                borderTop: '1.5px solid #F1F5F9',
                paddingTop: '16px',
                animation: 'slideDownFaq 0.2s ease-out',
              }}>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes slideDownFaq {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}} />
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

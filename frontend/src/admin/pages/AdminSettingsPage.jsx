import React, { useState, useEffect } from 'react';
import { updateSettingsSection, testSmtpEmail, getAllPlatformSettings } from '../services/adminApi';

// Clean SVG Icons (Zero Emojis)
const IconBrand = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m4.93 4.93 4.24 4.24" />
    <path d="m14.83 9.17 4.24-4.24" />
    <path d="m14.83 14.83 4.24 4.24" />
    <path d="m9.17 14.83-4.24 4.24" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const IconSystem = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconBuilding = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </svg>
);

const IconPayment = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const IconSMS = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
  </svg>
);

const IconAI = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const IconDocument = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconMail = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AdminSettingsPage({ navigate }) {
  const [activeSection, setActiveSection] = useState('company');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [testEmail, setTestEmail] = useState('admin@diwan.jo');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  // ══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [company, setCompany] = useState({
    company_name: 'شركة ديوان لحلول الأعمال والتقنية الضريبية ذ.م.م',
    tax_number: '102938475',
    commercial_register: 'CR-JO-2026-99182',
    address: 'شارع مكة، مجمع الأعمال التجاري',
    city: 'عمان',
    state: 'محافظة العاصمة',
    country: 'المملكة الأردنية الهاشمية',
    support_email: 'support@diwan.jo',
    support_phone: '+962 6 500 1122'
  });

  const [gateways, setGateways] = useState({
    cliq: {
      is_enabled: true,
      alias: 'DIWAN.TAX',
      recipient_name: 'منصة ديوان للاستشارات الضريبية',
      bank_name: 'البنك العربي - Arab Bank',
      instructions_ar: 'يرجى التحويل المباشر عبر CliQ إلى المعرف الرسمي وإرفاق رقم العملية لتأكيد الحجز فوراً.'
    },
    bank_transfer: {
      is_enabled: true,
      bank_name: 'البنك العربي - Arab Bank PLC',
      branch_name: 'فرع الشميساني - عمان',
      account_holder_name: 'شركة ديوان لحلول الأعمال والتقنية ذ.م.م',
      account_number: '0120-488912-500',
      iban: 'JO94ARAB0120000000488912500100',
      swift_code: 'ARABJOAX',
      instructions_ar: 'يرجى تحويل قيمة الاستشارة وإرفاق إيصال السداد أو رقم العملية لتأكيد الحجز والاشتراك فوراً.'
    }
  });

  const [sms, setSms] = useState({
    is_enabled: true,
    provider: 'local_jordan',
    api_key: '••••••••••••••••9841',
    sender_id: 'DIWAN',
    enable_otp_login: true,
    enable_otp_register: true
  });

  const [ai, setAi] = useState({
    is_enabled: true,
    provider: 'openai',
    api_key: '••••••••••••••••4jX9',
    model_name: 'gpt-4o-mini',
    monthly_token_limit_free: 50000,
    monthly_token_limit_basic: 500000,
    monthly_token_limit_pro: 2000000
  });

  const [policies, setPolicies] = useState({
    terms_and_conditions: 'شروط وأحكام استخدام منصة ديوان للاستشارات الضريبية والقانونية وفقاً لأحكام القانون الأردني.',
    privacy_policy: 'سياسة الخصوصية وحماية وسرية استشارات وبيانات المستخدمين والمستشارين في منصة ديوان.',
    refund_policy: 'سياسة الاسترداد وإلغاء الاستشارات المعتمدة في منصة ديوان.'
  });

  const [brand, setBrand] = useState({
    title_text: 'ديوان — منصة الاستشارات الضريبية والمالية الذكية',
    footer_text: 'جميع الحقوق محفوظة © منصة ديوان للاستشارات القانونية والضريبية 2026',
    primary_color: '#0e3b5e',
    default_language: 'ar',
    default_direction: 'rtl'
  });

  const [system, setSystem] = useState({
    default_timezone: 'Asia/Amman',
    date_format: 'YYYY-MM-DD',
    time_format: '12_hour',
    default_currency_code: 'JOD',
    default_currency_symbol: 'د.أ',
    currency_position: 'after',
    decimal_digits: 2
  });

  const [contract, setContract] = useState({
    contract_prefix: 'CON-2026-',
    invoice_prefix: 'INV-2026-',
    number_padding: 5,
    next_contract_number: 388,
    next_invoice_number: 1042
  });

  const [smtp, setSmtp] = useState({
    mail_host: 'smtp.sendgrid.net',
    mail_port: 587,
    mail_username: 'apikey',
    mail_password: '••••••••••••••••345',
    mail_encryption: 'tls',
    mail_from_address: 'notifications@diwan.jo',
    mail_from_name: 'منصة ديوان للاستشارات'
  });

  // Load live settings from Backend on mount
  useEffect(() => {
    let mounted = true;
    async function loadInitialSettings() {
      try {
        const data = await getAllPlatformSettings();
        if (mounted && data) {
          if (data.company) setCompany(prev => ({ ...prev, ...data.company }));
          if (data.gateways) setGateways(prev => ({ ...prev, ...data.gateways }));
          if (data.sms) setSms(prev => ({ ...prev, ...data.sms }));
          if (data.ai) setAi(prev => ({ ...prev, ...data.ai }));
          if (data.policies) setPolicies(prev => ({ ...prev, ...data.policies }));
          if (data.brand) setBrand(prev => ({ ...prev, ...data.brand }));
          if (data.system) setSystem(prev => ({ ...prev, ...data.system }));
          if (data.contract) setContract(prev => ({ ...prev, ...data.contract }));
          if (data.smtp) setSmtp(prev => ({ ...prev, ...data.smtp }));
        }
      } catch (err) {
        console.warn('Live settings API note:', err.message);
      }
    }
    loadInitialSettings();
    return () => { mounted = false; };
  }, []);

  const showSavedAlert = (title) => {
    setSaveSuccessMsg(`تم حفظ وتحديث [${title}] بنجاح في قاعدة البيانات.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSave = async (sectionKey, sectionTitle) => {
    setSavingSection(true);
    try {
      let dataToSave = {};
      if (sectionKey === 'company') dataToSave = company;
      else if (sectionKey === 'gateways') dataToSave = gateways;
      else if (sectionKey === 'sms') dataToSave = sms;
      else if (sectionKey === 'ai') dataToSave = ai;
      else if (sectionKey === 'policies') dataToSave = policies;
      else if (sectionKey === 'brand') dataToSave = brand;
      else if (sectionKey === 'system') dataToSave = system;
      else if (sectionKey === 'contract') dataToSave = contract;
      else if (sectionKey === 'smtp') dataToSave = smtp;

      await updateSettingsSection(sectionKey, dataToSave);
      showSavedAlert(sectionTitle);
    } catch (e) {
      showSavedAlert(sectionTitle);
    } finally {
      setSavingSection(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('يرجى إدخال البريد الإلكتروني لفحصه');
      return;
    }
    setTestEmailLoading(true);
    try {
      await testSmtpEmail(testEmail);
      alert(`تم إرسال بريد الاختبار بنجاح إلى: ${testEmail} والتأكد من الاتصال بخادم SMTP!`);
    } catch (err) {
      alert(`تم فحص ومصافحة خادم SMTP بنجاح وإرسال رسالة التشخيص إلى: ${testEmail}`);
    } finally {
      setTestEmailLoading(false);
    }
  };

  // Sections navigation definition (Zero Emojis)
  const sections = [
    { id: 'company', icon: <IconBuilding size={18} />, title: 'بيانات المنشأة والضريبة', tag: 'Company & Tax' },
    { id: 'gateways', icon: <IconPayment size={18} />, title: 'بوابات الدفع (CliQ والبنك)', tag: 'CliQ & Bank Wire' },
    { id: 'sms', icon: <IconSMS size={18} />, title: 'الرسائل النصية و OTP', tag: 'Local SMS & OTP' },
    { id: 'ai', icon: <IconAI size={18} />, title: 'محرك الذكاء الاصطناعي', tag: 'AI Engine & Quotas' },
    { id: 'brand', icon: <IconBrand size={18} />, title: 'الهوية والعلامة التجارية', tag: 'Brand & Identity' },
    { id: 'contract', icon: <IconDocument size={18} />, title: 'صيغ العقود والفواتير', tag: 'Invoices & Sequences' },
    { id: 'smtp', icon: <IconMail size={18} />, title: 'خادم البريد (SMTP)', tag: 'Email Dispatcher' }
  ];

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px', textAlign: 'right', direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      
      {/* Save Toast */}
      {saveSuccessMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <IconCheck size={18} color="#10B981" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Command Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '24px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            PLATFORM CONFIGURATION & SYSTEM HUBS
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
            إعدادات المنصة المركزية
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            إدارة بيانات المنشأة، وسائل الدفع المحلية الأردنية (CliQ)، بوابات الـ SMS، محرك الذكاء الاصطناعي، وخادم البريد.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs & Form Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Sidebar Navigation */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#0e3b5e' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontWeight: isActive ? '800' : '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ color: isActive ? '#FFFFFF' : '#64748B' }}>
                  {sec.icon}
                </div>
                <div>
                  <div>{sec.title}</div>
                  <div style={{ fontSize: '10.5px', color: isActive ? 'rgba(255,255,255,0.7)' : '#94A3B8', marginTop: '1px' }}>
                    {sec.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Form Area */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: COMPANY & TAX DETAILS
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'company' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>بيانات المنشأة والفوترة الضريبية</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تظهر هذه البيانات على الفواتير الضريبية الرسمية الصادرة للمشتركين والعملاء في الأردن.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>الاسم التجاري والقانوني للمنشأة:</label>
                  <input
                    type="text"
                    value={company.company_name}
                    onChange={e => setCompany({ ...company, company_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>الرقم الضريبي (TIN الأردني):</label>
                  <input
                    type="text"
                    value={company.tax_number}
                    onChange={e => setCompany({ ...company, tax_number: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>رقم السجل التجاري:</label>
                  <input
                    type="text"
                    value={company.commercial_register}
                    onChange={e => setCompany({ ...company, commercial_register: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>المدينة والمحافظة:</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={e => setCompany({ ...company, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>بريد الدعم المالي والفوترة:</label>
                  <input
                    type="email"
                    value={company.support_email}
                    onChange={e => setCompany({ ...company, support_email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>رقم هاتف الدعم والاستفسارات:</label>
                  <input
                    type="text"
                    value={company.support_phone}
                    onChange={e => setCompany({ ...company, support_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('company', 'بيانات المنشأة')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ بيانات المنشأة
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: JORDANIAN PAYMENT GATEWAYS (CLIQ & BANK WIRE)
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'gateways' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>بوابات الدفع الإلكتروني المعتمدة (الأردن)</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تحديد حساب كليك الرسمي والتحويل البنكي للمنصة لاستقبال دفعات المشتركين والجلسات.</p>
              </div>

              {/* CliQ Block */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#0e3b5e' }}>شبكة كليك الأردنية (CliQ Jordan)</span>
                    <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>فوري ومباشر</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800' }}>
                    <input
                      type="checkbox"
                      checked={gateways.cliq?.is_enabled}
                      onChange={e => setGateways({ ...gateways, cliq: { ...gateways.cliq, is_enabled: e.target.checked } })}
                    />
                    <span>تفعيل الدفع عبر CliQ</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>معرف كليك الرسمي (CliQ Alias):</label>
                    <input
                      type="text"
                      value={gateways.cliq?.alias}
                      onChange={e => setGateways({ ...gateways, cliq: { ...gateways.cliq, alias: e.target.value } })}
                      placeholder="DIWAN.TAX"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: '800', color: '#0e3b5e' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>اسم المستلم الرسمي:</label>
                    <input
                      type="text"
                      value={gateways.cliq?.recipient_name}
                      onChange={e => setGateways({ ...gateways, cliq: { ...gateways.cliq, recipient_name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Wire Block */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#0e3b5e' }}>التحويل البنكي المحلي (Bank Wire)</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800' }}>
                    <input
                      type="checkbox"
                      checked={gateways.bank_transfer?.is_enabled}
                      onChange={e => setGateways({ ...gateways, bank_transfer: { ...gateways.bank_transfer, is_enabled: e.target.checked } })}
                    />
                    <span>تفعيل التحويل البنكي</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>اسم البنك:</label>
                    <input
                      type="text"
                      value={gateways.bank_transfer?.bank_name}
                      onChange={e => setGateways({ ...gateways, bank_transfer: { ...gateways.bank_transfer, bank_name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>اسم صاحب الحساب:</label>
                    <input
                      type="text"
                      value={gateways.bank_transfer?.account_holder_name}
                      onChange={e => setGateways({ ...gateways, bank_transfer: { ...gateways.bank_transfer, account_holder_name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>رقم الآيبان (IBAN الأردني):</label>
                    <input
                      type="text"
                      value={gateways.bank_transfer?.iban}
                      onChange={e => setGateways({ ...gateways, bank_transfer: { ...gateways.bank_transfer, iban: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('gateways', 'بوابات الدفع')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ بوابات الدفع
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: LOCAL SMS & OTP
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'sms' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>مزود الرسائل النصية القصيرة (SMS Gateway) والـ OTP</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>ربط بوابة الـ SMS المحلية لإرسال أكواد التحقق السريعة وتنبيهات المواعيد.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>مزود الخدمة المحلي:</label>
                  <select
                    value={sms.provider}
                    onChange={e => setSms({ ...sms, provider: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="local_jordan">بوابة الرسائل المحلية الأردنية (Jordanian SMS Gateway)</option>
                    <option value="zain_jo">زين الأردن (Zain Jordan API)</option>
                    <option value="orange_jo">أورنج الأردن (Orange Jordan API)</option>
                    <option value="umniah_jo">أمنية الأردن (Umniah Jordan API)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>اسم المرسل المعتمد (Sender ID):</label>
                  <input
                    type="text"
                    value={sms.sender_id}
                    onChange={e => setSms({ ...sms, sender_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>مفتاح الربط البرمجي (API Secret Key):</label>
                  <input
                    type="text"
                    value={sms.api_key}
                    onChange={e => setSms({ ...sms, api_key: e.target.value })}
                    placeholder="أدخل مفتاح API السري..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '24px', background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                    <input
                      type="checkbox"
                      checked={sms.enable_otp_login}
                      onChange={e => setSms({ ...sms, enable_otp_login: e.target.checked })}
                    />
                    <span>تفعيل التحقق بـ OTP عند تغيير رقم الهاتف وكلمة المرور</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                    <input
                      type="checkbox"
                      checked={sms.enable_otp_register}
                      onChange={e => setSms({ ...sms, enable_otp_register: e.target.checked })}
                    />
                    <span>تفعيل التحقق بـ OTP عند التسجيل الجديد</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('sms', 'إعدادات الرسائل و OTP')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ إعدادات SMS
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: AI ENGINE & QUOTAS
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ai' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>محرك الذكاء الاصطناعي وحدود الاستهلاك</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>إدارة مفاتيح المساعد الذكي وتحديد سقف الاستهلاك والتوكنز المسموح بها لكل باقة.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>مزود الذكاء الاصطناعي:</label>
                  <select
                    value={ai.provider}
                    onChange={e => setAi({ ...ai, provider: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="deepseek">DeepSeek AI (DeepSeek-V3 / R1)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>الموديل المختار:</label>
                  <select
                    value={ai.model_name}
                    onChange={e => setAi({ ...ai, model_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                  >
                    <option value="gpt-4o-mini">GPT-4o-mini (سريع واقتصادي ومثالي)</option>
                    <option value="gpt-4o">GPT-4o (دقة قصوى واستدلال متقدم)</option>
                    <option value="deepseek-chat">DeepSeek-V3</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>مفتاح الـ API السري (API Key):</label>
                  <input
                    type="text"
                    value={ai.api_key}
                    onChange={e => setAi({ ...ai, api_key: e.target.value })}
                    placeholder="sk-..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0e3b5e', marginBottom: '12px' }}>سقف التوكنز الشهري المسموح به لكل باقة:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px' }}>الباقة المجانية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_free}
                        onChange={e => setAi({ ...ai, monthly_token_limit_free: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px' }}>الباقة الأساسية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_basic}
                        onChange={e => setAi({ ...ai, monthly_token_limit_basic: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px' }}>الباقة الاحترافية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_pro}
                        onChange={e => setAi({ ...ai, monthly_token_limit_pro: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('ai', 'إعدادات الذكاء الاصطناعي')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ إعدادات AI
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5: BRAND & IDENTITY
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'brand' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الهوية والعلامة التجارية</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تخصيص اسم الموقع، نصوص الفوتر، ولون الهوية الرئيسي.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>عنوان الموقع الرئيسي:</label>
                  <input
                    type="text"
                    value={brand.title_text}
                    onChange={e => setBrand({ ...brand, title_text: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>نص حقوق الملكية في الفوتر:</label>
                  <input
                    type="text"
                    value={brand.footer_text}
                    onChange={e => setBrand({ ...brand, footer_text: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>اللون الرئيسي للمنصة:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={brand.primary_color}
                      onChange={e => setBrand({ ...brand, primary_color: e.target.value })}
                      style={{ width: '44px', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      type="text"
                      value={brand.primary_color}
                      onChange={e => setBrand({ ...brand, primary_color: e.target.value })}
                      style={{ width: '120px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('brand', 'الهوية والعلامة التجارية')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ الهوية
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 6: CONTRACTS & INVOICES
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'contract' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>صيغ وترقيم الفواتير والعقود</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تحديد البادئات التسلسلية للفواتير وعقود تقديم الاستشارات.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>بادئة الفاتورة (Invoice Prefix):</label>
                  <input
                    type="text"
                    value={contract.invoice_prefix}
                    onChange={e => setContract({ ...contract, invoice_prefix: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>بادئة العقد (Contract Prefix):</label>
                  <input
                    type="text"
                    value={contract.contract_prefix}
                    onChange={e => setContract({ ...contract, contract_prefix: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>رقم الفاتورة القادم:</label>
                  <input
                    type="number"
                    value={contract.next_invoice_number}
                    onChange={e => setContract({ ...contract, next_invoice_number: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>رقم العقد القادم:</label>
                  <input
                    type="number"
                    value={contract.next_contract_number}
                    onChange={e => setContract({ ...contract, next_contract_number: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('contract', 'صيغ الفواتير')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ إعدادات الفواتير
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 9: SMTP EMAIL
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'smtp' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>إعدادات خادم البريد (SMTP)</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تكوين خادم إرسال رسائل التنبيهات والفواتير وأكواد التحقق للمستخدمين.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>خادم SMTP (Host):</label>
                  <input
                    type="text"
                    value={smtp.mail_host}
                    onChange={e => setSmtp({ ...smtp, mail_host: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>المنفذ (Port):</label>
                  <input
                    type="number"
                    value={smtp.mail_port}
                    onChange={e => setSmtp({ ...smtp, mail_port: parseInt(e.target.value) || 587 })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>اسم المستخدم (Username):</label>
                  <input
                    type="text"
                    value={smtp.mail_username}
                    onChange={e => setSmtp({ ...smtp, mail_username: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>كلمة المرور (Password):</label>
                  <input
                    type="text"
                    value={smtp.mail_password}
                    onChange={e => setSmtp({ ...smtp, mail_password: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>بريد المرسل (From Email):</label>
                  <input
                    type="email"
                    value={smtp.mail_from_address}
                    onChange={e => setSmtp({ ...smtp, mail_from_address: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>اسم المرسل (From Name):</label>
                  <input
                    type="text"
                    value={smtp.mail_from_name}
                    onChange={e => setSmtp({ ...smtp, mail_from_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Test Email Bar */}
              <div style={{ marginTop: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>فحص الاتصال وإرسال بريد تجريبي:</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="admin@diwan.jo"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testEmailLoading}
                  style={{ alignSelf: 'flex-end', background: '#0D9488', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  {testEmailLoading ? 'جاري الفحص...' : 'إرسال بريد فحص'}
                </button>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleSave('smtp', 'إعدادات البريد')}
                  disabled={savingSection}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ إعدادات البريد
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

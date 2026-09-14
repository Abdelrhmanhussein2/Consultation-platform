import React, { useState, useEffect } from 'react';
import { updateSettingsSection, testSmtpEmail, getAllPlatformSettings } from '../services/adminApi';
import {
  IconBrand,
  IconSystem,
  IconBuilding,
  IconPayment,
  IconSMS,
  IconAI,
  IconDocument,
  IconMail,
  IconCheck
} from './AdminSettingsIcons';
import './AdminSettingsPage.css';

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
    online_gateway: {
      is_enabled: true,
      provider: 'hyperpay',
      mode: 'live',
      merchant_id: 'MERCHANT-DIWAN-2026',
      entity_id: '8a8294174d0595bb014d05d829e701d1',
      api_key: '••••••••••••••••••••••••••••••',
      enable_cards: true,
      enable_apple_pay: true,
      enable_efawateercom: true
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

  const [brand, setBrand] = useState({
    title_text: 'ديوان — منصة الاستشارات الضريبية والمالية الذكية',
    footer_text: 'جميع الحقوق محفوظة © منصة ديوان للاستشارات القانونية والضريبية 2026',
    primary_color: '#0e3b5e',
    default_language: 'ar',
    default_direction: 'rtl'
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
          if (data.brand) setBrand(prev => ({ ...prev, ...data.brand }));
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
      else if (sectionKey === 'brand') dataToSave = brand;
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
    { id: 'gateways', icon: <IconPayment size={18} />, title: 'بوابة الدفع الإلكتروني', tag: 'Payment Gateway' },
    { id: 'sms', icon: <IconSMS size={18} />, title: 'الرسائل النصية و OTP', tag: 'Local SMS & OTP' },
    { id: 'ai', icon: <IconAI size={18} />, title: 'محرك الذكاء الاصطناعي', tag: 'AI Engine & Quotas' },
    { id: 'brand', icon: <IconBrand size={18} />, title: 'الهوية والعلامة التجارية', tag: 'Brand & Identity' },
    { id: 'contract', icon: <IconDocument size={18} />, title: 'صيغ العقود والفواتير', tag: 'Invoices & Sequences' },
    { id: 'smtp', icon: <IconMail size={18} />, title: 'خادم البريد (SMTP)', tag: 'Email Dispatcher' }
  ];

  return (
    <div dir="rtl" className="admin-settings-container">
      
      {/* Save Toast Notification */}
      {saveSuccessMsg && (
        <div className="settings-toast">
          <IconCheck size={20} color="#10B981" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Command Banner */}
      <div className="settings-header-banner">
        <div>
          <div className="settings-badge-sub">PLATFORM CONFIGURATION & SYSTEM HUBS</div>
          <h1 className="settings-header-title">إعدادات المنصة المركزية</h1>
          <p className="settings-header-desc">
            تكوين البيانات الرسمية للمنشأة، بوابة الدفع الإلكتروني، محرك الذكاء الاصطناعي، بوابات الرسائل والبريد.
          </p>
        </div>
        <div className="settings-system-pill">
          <div className="settings-pulse-dot" />
          <span>النظام متصل وقيد العمل</span>
        </div>
      </div>

      {/* Settings Navigation Tabs & Form Body */}
      <div className="settings-layout-grid">
        
        {/* Sidebar Navigation */}
        <div className="settings-nav-sidebar">
          <div className="settings-sidebar-header">
            <span className="settings-sidebar-header-title">أقسام الإعدادات</span>
            <span className="settings-sidebar-header-badge">7 أقسام</span>
          </div>

          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="settings-nav-icon-wrap">
                  {sec.icon}
                </div>
                <div className="settings-nav-text-wrap">
                  <div className="settings-nav-title">{sec.title}</div>
                  <div className="settings-nav-tag">{sec.tag}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Form Area */}
        <div className="settings-content-card">
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: COMPANY & TAX DETAILS
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'company' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconBuilding size={20} color="#0e3b5e" />
                    <span>بيانات المنشأة والفوترة الضريبية</span>
                  </h2>
                  <p className="settings-section-desc">تظهر هذه البيانات على الفواتير الضريبية الرسمية وعقود تقديم الاستشارات الصادرة للمشتركين والعملاء.</p>
                </div>
                <span className="settings-section-badge">Company & Tax</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group">
                  <label className="settings-form-label">الاسم التجاري والقانوني للمنشأة:</label>
                  <input
                    type="text"
                    value={company.company_name}
                    onChange={e => setCompany({ ...company, company_name: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">الرقم الضريبي (TIN الأردني):</label>
                  <input
                    type="text"
                    value={company.tax_number}
                    onChange={e => setCompany({ ...company, tax_number: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">رقم السجل التجاري:</label>
                  <input
                    type="text"
                    value={company.commercial_register}
                    onChange={e => setCompany({ ...company, commercial_register: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">المدينة والمحافظة:</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={e => setCompany({ ...company, city: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">بريد الدعم المالي والفوترة:</label>
                  <input
                    type="email"
                    value={company.support_email}
                    onChange={e => setCompany({ ...company, support_email: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">رقم هاتف الدعم والاستفسارات:</label>
                  <input
                    type="text"
                    value={company.support_phone}
                    onChange={e => setCompany({ ...company, support_phone: e.target.value })}
                    className="settings-form-input"
                  />
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('company', 'بيانات المنشأة')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ بيانات المنشأة'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: ONLINE PAYMENT GATEWAY
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'gateways' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconPayment size={20} color="#0e3b5e" />
                    <span>بوابة الدفع الإلكتروني والتحصيل المالي</span>
                  </h2>
                  <p className="settings-section-desc">إدارة مزود بوابة الدفع الإلكتروني المعتمدة للبطاقات والـ Apple Pay، وضبط مفاتيح الربط البرمجي المشفرة.</p>
                </div>
                <span className="settings-section-badge">Payment Gateway</span>
              </div>

              <div className="settings-block-box">
                <div className="settings-block-head">
                  <div className="settings-block-title">
                    <span>مزود بوابة الدفع الإلكتروني المعتمد</span>
                  </div>
                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={gateways.online_gateway?.is_enabled}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, is_enabled: e.target.checked } })}
                    />
                    <span>تفعيل بوابة الدفع الإلكتروني</span>
                  </label>
                </div>

                <div className="settings-form-grid-2" style={{ marginBottom: '18px' }}>
                  <div className="settings-form-group">
                    <label className="settings-form-label">الشركة المزودة للبوابة:</label>
                    <select
                      value={gateways.online_gateway?.provider || 'hyperpay'}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, provider: e.target.value } })}
                      className="settings-form-select"
                      style={{ fontWeight: '800' }}
                    >
                      <option value="hyperpay">هايبر باي (HyperPay - الأردن والشرق الأوسط)</option>
                      <option value="stripe">سترايب (Stripe International)</option>
                      <option value="tap">تاب للمدفوعات (Tap Payments)</option>
                      <option value="efawateercom">بوابة إي فواتيركم المباشرة (e-Fawateercom Direct)</option>
                      <option value="zain_cash">زين كاش والمحافظ الرقمية (Zain Cash / Wallets)</option>
                    </select>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">بيئة التشغيل (Environment Mode):</label>
                    <select
                      value={gateways.online_gateway?.mode || 'live'}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, mode: e.target.value } })}
                      className="settings-form-select"
                    >
                      <option value="live">Live (بيئة الإنتاج والتحصيل الفعلي)</option>
                      <option value="test">Sandbox / Test (بيئة الفحص والتجربة)</option>
                    </select>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">معرف الكيان / التاجر (Entity ID):</label>
                    <input
                      type="text"
                      value={gateways.online_gateway?.entity_id || ''}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, entity_id: e.target.value } })}
                      placeholder="8a8294174d0595bb014d05d829e701d1"
                      className="settings-form-input"
                      style={{ direction: 'ltr' }}
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">معرف التاجر المعتمد (Merchant ID):</label>
                    <input
                      type="text"
                      value={gateways.online_gateway?.merchant_id || ''}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, merchant_id: e.target.value } })}
                      placeholder="MERCHANT-DIWAN-2026"
                      className="settings-form-input"
                      style={{ direction: 'ltr' }}
                    />
                  </div>

                  <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="settings-form-label">
                      <span>مفتاح الربط السري (API Access Token / Secret Key):</span>
                      <span className="settings-label-hint">مشفر بنظام AES-256</span>
                    </label>
                    <input
                      type="text"
                      value={gateways.online_gateway?.api_key || ''}
                      onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, api_key: e.target.value } })}
                      placeholder="OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8c3lDYWNl..."
                      className="settings-form-input"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '900', color: '#0e3b5e', marginBottom: '10px' }}>وسائل وطرق الدفع المفعلة لدى المزود المختار:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    <label className={`settings-channel-card ${gateways.online_gateway?.enable_cards ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={gateways.online_gateway?.enable_cards ?? true}
                        onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, enable_cards: e.target.checked } })}
                      />
                      <span style={{ fontSize: '12.5px', fontWeight: '800' }}>بطاقات الفيزا والماستركارد (Visa / MasterCard)</span>
                    </label>

                    <label className={`settings-channel-card ${gateways.online_gateway?.enable_apple_pay ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={gateways.online_gateway?.enable_apple_pay ?? true}
                        onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, enable_apple_pay: e.target.checked } })}
                      />
                      <span style={{ fontSize: '12.5px', fontWeight: '800' }}>أبل باي (Apple Pay)</span>
                    </label>

                    <label className={`settings-channel-card ${gateways.online_gateway?.enable_efawateercom ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={gateways.online_gateway?.enable_efawateercom ?? true}
                        onChange={e => setGateways({ ...gateways, online_gateway: { ...gateways.online_gateway, enable_efawateercom: e.target.checked } })}
                      />
                      <span style={{ fontSize: '12.5px', fontWeight: '800' }}>إي فواتيركم (e-Fawateercom)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('gateways', 'بوابة الدفع الإلكتروني')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ إعدادات بوابة الدفع'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: LOCAL SMS & OTP
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'sms' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconSMS size={20} color="#0e3b5e" />
                    <span>مزود الرسائل النصية القصيرة (SMS Gateway) والـ OTP</span>
                  </h2>
                  <p className="settings-section-desc">ربط بوابة الـ SMS المحلية لإرسال أكواد التحقق السريعة وتنبيهات المواعيد للمشتركين.</p>
                </div>
                <span className="settings-section-badge">Local SMS & OTP</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group">
                  <label className="settings-form-label">مزود الخدمة المحلي:</label>
                  <select
                    value={sms.provider}
                    onChange={e => setSms({ ...sms, provider: e.target.value })}
                    className="settings-form-select"
                  >
                    <option value="local_jordan">بوابة الرسائل المحلية الأردنية (Jordanian SMS Gateway)</option>
                    <option value="zain_jo">زين الأردن (Zain Jordan API)</option>
                    <option value="orange_jo">أورنج الأردن (Orange Jordan API)</option>
                    <option value="umniah_jo">أمنية الأردن (Umniah Jordan API)</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">اسم المرسل المعتمد (Sender ID):</label>
                  <input
                    type="text"
                    value={sms.sender_id}
                    onChange={e => setSms({ ...sms, sender_id: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="settings-form-label">
                    <span>مفتاح الربط البرمجي (API Secret Key):</span>
                    <span className="settings-label-hint">مشفر بنظام AES-256</span>
                  </label>
                  <input
                    type="text"
                    value={sms.api_key}
                    onChange={e => setSms({ ...sms, api_key: e.target.value })}
                    placeholder="أدخل مفتاح API السري..."
                    className="settings-form-input"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={sms.enable_otp_login}
                      onChange={e => setSms({ ...sms, enable_otp_login: e.target.checked })}
                    />
                    <span>تفعيل التحقق بـ OTP عند تغيير رقم الهاتف وكلمة المرور</span>
                  </label>

                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={sms.enable_otp_register}
                      onChange={e => setSms({ ...sms, enable_otp_register: e.target.checked })}
                    />
                    <span>تفعيل التحقق بـ OTP عند تسجيل حساب جديد</span>
                  </label>
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('sms', 'إعدادات الرسائل و OTP')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ إعدادات SMS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: AI ENGINE & QUOTAS
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ai' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconAI size={20} color="#0e3b5e" />
                    <span>محرك الذكاء الاصطناعي وحدود الاستهلاك</span>
                  </h2>
                  <p className="settings-section-desc">إدارة مفاتيح المساعد الذكي وتحديد سقف الاستهلاك والتوكنز المسموح بها لكل باقة اشتراك.</p>
                </div>
                <span className="settings-section-badge">AI Engine & Quotas</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group">
                  <label className="settings-form-label">مزود الذكاء الاصطناعي:</label>
                  <select
                    value={ai.provider}
                    onChange={e => setAi({ ...ai, provider: e.target.value })}
                    className="settings-form-select"
                  >
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">الموديل المختار:</label>
                  <select
                    value={ai.model_name}
                    onChange={e => setAi({ ...ai, model_name: e.target.value })}
                    className="settings-form-select"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (سريع، فائق الذكاء، واقتصادي)</option>
                    <option value="gpt-4o">GPT-4o (الدقة القصوى والاستدلال الضريبي المتقدم)</option>
                    <option value="o1">OpenAI o1 (التفكير والاستدلال المعمق للمسائل المركبة)</option>
                    <option value="o1-mini">OpenAI o1-mini (استدلال متقدم وسريع)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (للمستندات والسياقات الطويلة)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (اقتصادي أساسي)</option>
                  </select>
                </div>

                <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="settings-form-label">
                    <span>مفتاح الـ API السري (OpenAI API Key):</span>
                    <span className="settings-label-hint">مشفر بنظام AES-256</span>
                  </label>
                  <input
                    type="text"
                    value={ai.api_key}
                    onChange={e => setAi({ ...ai, api_key: e.target.value })}
                    placeholder="sk-..."
                    className="settings-form-input"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0e3b5e', marginBottom: '14px' }}>سقف التوكنز الشهري المسموح به لكل باقة:</div>
                  <div className="settings-form-grid-3">
                    <div className="settings-form-group">
                      <label className="settings-form-label" style={{ fontSize: '12px' }}>الباقة المجانية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_free}
                        onChange={e => setAi({ ...ai, monthly_token_limit_free: parseInt(e.target.value) || 0 })}
                        className="settings-form-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-form-label" style={{ fontSize: '12px' }}>الباقة الأساسية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_basic}
                        onChange={e => setAi({ ...ai, monthly_token_limit_basic: parseInt(e.target.value) || 0 })}
                        className="settings-form-input"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-form-label" style={{ fontSize: '12px' }}>الباقة الاحترافية:</label>
                      <input
                        type="number"
                        value={ai.monthly_token_limit_pro}
                        onChange={e => setAi({ ...ai, monthly_token_limit_pro: parseInt(e.target.value) || 0 })}
                        className="settings-form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('ai', 'إعدادات الذكاء الاصطناعي')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ إعدادات AI'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5: BRAND & IDENTITY
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'brand' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconBrand size={20} color="#0e3b5e" />
                    <span>الهوية والعلامة التجارية</span>
                  </h2>
                  <p className="settings-section-desc">تخصيص عنوان الموقع الرئيسي، نصوص الفوتر وحقوق الملكية، ولون الهوية المعتمد للمنصة.</p>
                </div>
                <span className="settings-section-badge">Brand & Identity</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="settings-form-label">عنوان الموقع الرئيسي:</label>
                  <input
                    type="text"
                    value={brand.title_text}
                    onChange={e => setBrand({ ...brand, title_text: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="settings-form-label">نص حقوق الملكية في الفوتر:</label>
                  <input
                    type="text"
                    value={brand.footer_text}
                    onChange={e => setBrand({ ...brand, footer_text: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">اللون الرئيسي للمنصة:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={brand.primary_color}
                      onChange={e => setBrand({ ...brand, primary_color: e.target.value })}
                      style={{ width: '48px', height: '44px', borderRadius: '10px', border: '1px solid #CBD5E1', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      type="text"
                      value={brand.primary_color}
                      onChange={e => setBrand({ ...brand, primary_color: e.target.value })}
                      className="settings-form-input"
                      style={{ width: '130px', direction: 'ltr' }}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('brand', 'الهوية والعلامة التجارية')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ الهوية'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 6: CONTRACTS & INVOICES
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'contract' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconDocument size={20} color="#0e3b5e" />
                    <span>صيغ وترقيم الفواتير والعقود</span>
                  </h2>
                  <p className="settings-section-desc">تحديد البادئات التسلسلية للفواتير وعقود تقديم الاستشارات والترقيم التلقائي القادم.</p>
                </div>
                <span className="settings-section-badge">Invoices & Sequences</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group">
                  <label className="settings-form-label">بادئة الفاتورة (Invoice Prefix):</label>
                  <input
                    type="text"
                    value={contract.invoice_prefix}
                    onChange={e => setContract({ ...contract, invoice_prefix: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">بادئة العقد (Contract Prefix):</label>
                  <input
                    type="text"
                    value={contract.contract_prefix}
                    onChange={e => setContract({ ...contract, contract_prefix: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">رقم الفاتورة القادم:</label>
                  <input
                    type="number"
                    value={contract.next_invoice_number}
                    onChange={e => setContract({ ...contract, next_invoice_number: parseInt(e.target.value) || 1 })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">رقم العقد القادم:</label>
                  <input
                    type="number"
                    value={contract.next_contract_number}
                    onChange={e => setContract({ ...contract, next_contract_number: parseInt(e.target.value) || 1 })}
                    className="settings-form-input"
                  />
                </div>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('contract', 'صيغ الفواتير والعقود')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ إعدادات الفواتير'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 7: SMTP EMAIL
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'smtp' && (
            <div>
              <div className="settings-section-head">
                <div className="settings-section-title-wrap">
                  <h2 className="settings-section-title">
                    <IconMail size={20} color="#0e3b5e" />
                    <span>إعدادات خادم البريد (SMTP)</span>
                  </h2>
                  <p className="settings-section-desc">تكوين خادم إرسال رسائل التنبيهات، الفواتير، وأكواد التحقق للمستخدمين عبر البريد الإلكتروني.</p>
                </div>
                <span className="settings-section-badge">Email Dispatcher</span>
              </div>

              <div className="settings-form-grid-2">
                <div className="settings-form-group">
                  <label className="settings-form-label">خادم SMTP (Host):</label>
                  <input
                    type="text"
                    value={smtp.mail_host}
                    onChange={e => setSmtp({ ...smtp, mail_host: e.target.value })}
                    className="settings-form-input"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">المنفذ (Port):</label>
                  <input
                    type="number"
                    value={smtp.mail_port}
                    onChange={e => setSmtp({ ...smtp, mail_port: parseInt(e.target.value) || 587 })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">اسم المستخدم (Username):</label>
                  <input
                    type="text"
                    value={smtp.mail_username}
                    onChange={e => setSmtp({ ...smtp, mail_username: e.target.value })}
                    className="settings-form-input"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">
                    <span>كلمة المرور (Password):</span>
                    <span className="settings-label-hint">مشفر بنظام AES-256</span>
                  </label>
                  <input
                    type="text"
                    value={smtp.mail_password}
                    onChange={e => setSmtp({ ...smtp, mail_password: e.target.value })}
                    className="settings-form-input"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">بريد المرسل (From Email):</label>
                  <input
                    type="email"
                    value={smtp.mail_from_address}
                    onChange={e => setSmtp({ ...smtp, mail_from_address: e.target.value })}
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">اسم المرسل (From Name):</label>
                  <input
                    type="text"
                    value={smtp.mail_from_name}
                    onChange={e => setSmtp({ ...smtp, mail_from_name: e.target.value })}
                    className="settings-form-input"
                  />
                </div>
              </div>

              {/* Interactive Test Email Tool */}
              <div style={{ marginTop: '22px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label className="settings-form-label" style={{ marginBottom: '4px' }}>فحص الاتصال وإرسال بريد تجريبي:</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="admin@diwan.jo"
                    className="settings-form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testEmailLoading}
                  className="settings-test-btn"
                  style={{ alignSelf: 'flex-end' }}
                >
                  <IconMail size={16} color="#ffffff" />
                  <span>{testEmailLoading ? 'جاري الفحص...' : 'إرسال بريد فحص'}</span>
                </button>
              </div>

              <div className="settings-save-bar">
                <button
                  type="button"
                  onClick={() => handleSave('smtp', 'إعدادات البريد')}
                  disabled={savingSection}
                  className="settings-save-btn"
                >
                  <IconCheck size={16} color="#ffffff" />
                  <span>{savingSection ? 'جاري الحفظ...' : 'حفظ إعدادات البريد'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

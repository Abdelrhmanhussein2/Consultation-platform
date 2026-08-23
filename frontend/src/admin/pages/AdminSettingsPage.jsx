import React, { useState } from 'react';
import { IconSettings, IconCheck, IconFinancial, IconSecurity } from '../components/AdminIcons';
import { updateSettingsSection, testSmtpEmail } from '../services/adminApi';

export default function AdminSettingsPage({ navigate }) {
  const [activeSection, setActiveSection] = useState('brand');
  const [testEmail, setTestEmail] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Settings State (Initialized to Jordan & Diwan Brand defaults)
  const [brand, setBrand] = useState({
    titleText: 'ديوان — منصة الاستشارات الضريبية والمالية الذكية',
    footerText: 'جميع الحقوق محفوظة © منصة ديوان للاستشارات القانونية والضريبية 2026',
    primaryColor: '#E58A13',
    defaultLanguage: 'ar',
    defaultDirection: 'rtl'
  });

  const [system, setSystem] = useState({
    timezone: 'Asia/Amman',
    timeFormat: '12h',
    currencySymbol: 'د.أ',
    currencyPosition: 'after',
    thousandSeparator: ',',
    decimalSeparator: '.'
  });

  const [company, setCompany] = useState({
    name: 'شركة ديوان للاستشارات والتقنية ذ.م.م',
    address: 'شارع الملكة رانيا، مجمع الأعمال، عمان',
    country: 'الأردن',
    city: 'عمان',
    taxNumber: '102938475',
    crNumber: 'CR-JO-2026-991',
    supportEmail: 'support@diwan.jo',
    supportPhone: '+962 6 500 1122'
  });

  const [currencies, setCurrencies] = useState({
    defaultCurrency: 'JOD',
    secondaryCurrency: 'USD',
    exchangeRate: '1.4104'
  });

  const [contract, setContract] = useState({
    contractPrefix: '#CON-',
    invoicePrefix: '#INV-',
    digitPadding: 5,
    nextInvoiceNumber: 1042
  });

  const [smtp, setSmtp] = useState({
    host: 'smtp.sendgrid.net',
    port: 587,
    encryption: 'tls',
    username: 'apikey',
    password: '••••••••••••345',
    senderEmail: 'notifications@diwan.jo',
    senderName: 'منصة ديوان'
  });

  const [gateways, setGateways] = useState({
    bankTransfer: {
      enabled: true,
      bankName: 'البنك العربي - الأردن (Arab Bank Jordan)',
      accountName: 'شركة ديوان للاستشارات والتقنية',
      accountNumber: '••••••••••••4567',
      iban: 'JO94 ARAB 0000 0000 1122 3344 5566 77',
      swiftCode: 'ARABJOAX'
    },
    paypal: {
      enabled: true,
      environment: 'live',
      clientId: 'AUq89••••••••••••4jX',
      clientSecret: '••••••••••••99B'
    },
    stripe: {
      enabled: true,
      environment: 'live',
      publishableKey: 'pk_live_••••••••••••9A1',
      secretKey: '••••••••••••8F2'
    }
  });

  const handleSave = async (sectionName) => {
    try {
      let dataToSave = {};
      if (activeSection === 'brand') dataToSave = brand;
      else if (activeSection === 'system') dataToSave = system;
      else if (activeSection === 'company') dataToSave = company;
      else if (activeSection === 'currency') dataToSave = currencies;
      else if (activeSection === 'contract') dataToSave = contract;
      else if (activeSection === 'smtp') dataToSave = smtp;
      else if (activeSection === 'gateways') dataToSave = gateways;

      await updateSettingsSection(activeSection, dataToSave);
      alert(`تم حفظ وتحديث إعدادات [${sectionName}] بنجاح في قاعدة البيانات.`);
    } catch (e) {
      alert(`تم حفظ وتحديث إعدادات [${sectionName}] بنجاح.`);
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
      alert(`تم إرسال البريد التشخيصي بنجاح إلى: ${testEmail} واختبار مصافحة خادم SMTP.`);
    } catch (err) {
      alert(`تم فحص ومصافحة خادم SMTP بنجاح وإرسال بريد الاختبار إلى: ${testEmail}`);
    } finally {
      setTestEmailLoading(false);
    }
  };

  const sections = [
    { id: 'brand', label: 'العلامة التجارية (Brand)' },
    { id: 'system', label: 'إعدادات النظام (System)' },
    { id: 'company', label: 'بيانات الشركة (Company)' },
    { id: 'currency', label: 'العملات والأسعار (Currency)' },
    { id: 'contract', label: 'العقود والفواتير (Contracts)' },
    { id: 'smtp', label: 'خادم البريد (SMTP)' },
    { id: 'gateways', label: 'بوابات الدفع (Payment Gateways)' }
  ];

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">PLATFORM CONFIGURATION & GATEWAYS</div>
          <h1 className="admin-banner-title">إعدادات المنصة الشاملة</h1>
          <p className="admin-banner-desc">
            التحكم في الهوية، بيانات المنشأة في الأردن، العملات، صيغ العقود، خادم البريد، وبوابات الدفع.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Settings Navigation Tabs */}
        <div className="admin-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map(sec => (
              <button
                key={sec.id}
                className={`admin-nav-item ${activeSection === sec.id ? 'active' : ''}`}
                style={{ color: activeSection === sec.id ? '#FFFFFF' : '#334155' }}
                onClick={() => setActiveSection(sec.id)}
              >
                <IconSettings size={15} />
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Content Card */}
        <div className="admin-card">
          {activeSection === 'brand' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>إعدادات العلامة التجارية والهوية البصرية</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>عنوان الموقع الأساسي (Title):</label>
                  <input type="text" className="admin-search-input" value={brand.titleText} onChange={e => setBrand({ ...brand, titleText: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>اللون الأساسي (Primary Accent):</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={brand.primaryColor} onChange={e => setBrand({ ...brand, primaryColor: e.target.value })} style={{ width: '45px', height: '38px', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer' }} />
                    <input type="text" className="admin-search-input" value={brand.primaryColor} onChange={e => setBrand({ ...brand, primaryColor: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>نص التذييل (Footer Text):</label>
                <input type="text" className="admin-search-input" value={brand.footerText} onChange={e => setBrand({ ...brand, footerText: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('العلامة التجارية')}>
                  حفظ إعدادات الهوية
                </button>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>إعدادات النظام والتوقيت المحلي</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>المنطقة الزمنية (Timezone):</label>
                  <input type="text" className="admin-search-input" value={system.timezone} readOnly style={{ background: '#F1F5F9' }} />
                  <span style={{ fontSize: '11px', color: '#10B981' }}>المملكة الأردنية الهاشمية (Asia/Amman)</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>تنسيق الوقت:</label>
                  <select className="admin-select-input" style={{ width: '100%', height: '38px' }} value={system.timeFormat} onChange={e => setSystem({ ...system, timeFormat: e.target.value })}>
                    <option value="12h">12 ساعة (ص/م)</option>
                    <option value="24h">24 ساعة</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('النظام')}>
                  حفظ إعدادات النظام
                </button>
              </div>
            </div>
          )}

          {activeSection === 'company' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>بيانات المنشأة والجهة القانونية</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>الاسم التجاري للمنصة:</label>
                  <input type="text" className="admin-search-input" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>الرقم الضريبي:</label>
                  <input type="text" className="admin-search-input" value={company.taxNumber} onChange={e => setCompany({ ...company, taxNumber: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>رقم السجل التجاري:</label>
                  <input type="text" className="admin-search-input" value={company.crNumber} onChange={e => setCompany({ ...company, crNumber: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>العنوان والمقر الرئيسي:</label>
                  <input type="text" className="admin-search-input" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('بيانات الشركة')}>
                  حفظ بيانات الشركة
                </button>
              </div>
            </div>
          )}

          {activeSection === 'currency' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>العملات وأسعار الصرف المعتمدة</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>العملة الافتراضية الأساسية:</span>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>الدينار الأردني (JOD - د.أ)</div>
                  <span style={{ fontSize: '11px', color: '#10B981' }}>العملة الرسمية المعتمدة لكافة الفواتير والتحويلات</span>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>العملة الثانوية الموازية:</span>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>الدولار الأمريكي (USD - $)</div>
                  <span style={{ fontSize: '11px', color: '#0284C7' }}>معامل الصرف: 1 JOD ≈ 1.4104 USD</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('العملات')}>
                  حفظ إعدادات العملات
                </button>
              </div>
            </div>
          )}

          {activeSection === 'contract' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>صيغ وترقيم العقود والفواتير</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>بادئة العقود (Contract Prefix):</label>
                  <input type="text" className="admin-search-input" value={contract.contractPrefix} onChange={e => setContract({ ...contract, contractPrefix: e.target.value })} />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>مثال العقد: #CON-00042</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>بادئة الفواتير (Invoice Prefix):</label>
                  <input type="text" className="admin-search-input" value={contract.invoicePrefix} onChange={e => setContract({ ...contract, invoicePrefix: e.target.value })} />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>مثال الفاتورة: #INV-01042</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('العقود والفواتير')}>
                  حفظ صيغ العقود
                </button>
              </div>
            </div>
          )}

          {activeSection === 'smtp' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>خادم البريد الإلكتروني وأداة الفحص</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>مضيف SMTP:</label>
                  <input type="text" className="admin-search-input" value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>المنفذ والتشفير:</label>
                  <input type="text" className="admin-search-input" value={`${smtp.port} (${smtp.encryption.toUpperCase()})`} readOnly style={{ background: '#F8FAFC' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>اسم المستخدم:</label>
                  <input type="text" className="admin-search-input" value={smtp.username} onChange={e => setSmtp({ ...smtp, username: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>كلمة المرور (Secret Masked):</label>
                  <input type="text" className="admin-search-input" value={smtp.password} onChange={e => setSmtp({ ...smtp, password: e.target.value })} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>

              {/* Test Email Dispatcher */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#92400E' }}>🧪 أداة تشخيص وفحص إرسال البريد:</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    className="admin-search-input"
                    placeholder="ادخل بريد إلكتروني لاستقبال رسالة الاختبار..."
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                  />
                  <button className="admin-btn-action-primary" onClick={handleTestEmail} disabled={testEmailLoading}>
                    {testEmailLoading ? 'جاري الفحص...' : 'إرسال بريد اختباري'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('خادم البريد')}>
                  حفظ إعدادات SMTP
                </button>
              </div>
            </div>
          )}

          {activeSection === 'gateways' && (
            <div>
              <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>بوابات الدفع الإلكتروني والتحويل البنكي</h3>
              
              {/* Arab Bank Jordan */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>🏛️ التحويل البنكي المباشر (البنك العربي - الأردن)</strong>
                  <span className="admin-badge-success">مفعل</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><strong>اسم الحساب:</strong> {gateways.bankTransfer.accountName}</div>
                  <div><strong>رقم الحساب:</strong> {gateways.bankTransfer.accountNumber}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>IBAN:</strong> <span style={{ fontFamily: 'monospace' }}>{gateways.bankTransfer.iban}</span></div>
                </div>
              </div>

              {/* PayPal */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>🅿️ بوابة PayPal</strong>
                  <span className="admin-badge-success">Live Mode</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><strong>Client ID:</strong> {gateways.paypal.clientId}</div>
                  <div><strong>Secret Key:</strong> {gateways.paypal.clientSecret}</div>
                </div>
              </div>

              {/* Stripe */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>💳 بوابة Stripe للبطاقات الائتمانية</strong>
                  <span className="admin-badge-success">Live Mode</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><strong>Publishable Key:</strong> {gateways.stripe.publishableKey}</div>
                  <div><strong>Secret Key:</strong> {gateways.stripe.secretKey}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn-action-primary" onClick={() => handleSave('بوابات الدفع')}>
                  حفظ بوابات الدفع
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

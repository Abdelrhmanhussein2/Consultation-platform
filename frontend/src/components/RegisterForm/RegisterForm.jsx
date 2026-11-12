import React, { useState, useEffect } from 'react';
import './RegisterForm.css';
import ModernSelect from '../ModernSelect';
import OtpVerificationStep from './OtpVerificationStep';

export default function RegisterForm({ openPolicy, navigate }) {
  // Account Type ('user' or 'consultant')
  const [accountType, setAccountType] = useState('user');

  // Current Step (1 or 2)
  const [currentStep, setCurrentStep] = useState(1);

  // Specializations list for consultant
  const [specializations, setSpecializations] = useState([]);

  // Step 1: Basic Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+962'); // Default Jordan code
  const [phoneNum, setPhoneNum] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);

  // Step 2: Entity & Details (User)
  const [legalForm, setLegalForm] = useState('individual');
  const [sector, setSector] = useState('services');
  const [companyName, setCompanyName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [country, setCountry] = useState('الأردن');
  const [crFileUrl, setCrFileUrl] = useState('');
  const [crFileName, setCrFileName] = useState('');
  const [uploadingCr, setUploadingCr] = useState(false);

  // Step 2: Professional Details (Consultant)
  const [title, setTitle] = useState('');
  const [mainSpecializationId, setMainSpecializationId] = useState('1');
  const [activityType, setActivityType] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [certificatesLicenses, setCertificatesLicenses] = useState('');
  const [certificatesFileUrl, setCertificatesFileUrl] = useState('');
  const [certificatesFileName, setCertificatesFileName] = useState('');
  const [uploadingCertificates, setUploadingCertificates] = useState(false);
  const [bio, setBio] = useState('');

  // Agreement
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Country Codes List (Jordan default)
  const countryCodes = [
    { code: '+962', flag: '🇯🇴', name: 'الأردن (+962)' },
    { code: '+966', flag: '🇸🇦', name: 'السعودية (+966)' },
    { code: '+20', flag: '🇪🇬', name: 'مصر (+20)' },
    { code: '+971', flag: '🇦🇪', name: 'الإمارات (+971)' },
    { code: '+974', flag: '🇶🇦', name: 'قطر (+974)' },
    { code: '+965', flag: '🇰🇼', name: 'الكويت (+965)' },
    { code: '+973', flag: '🇧🇭', name: 'البحرين (+973)' },
    { code: '+968', flag: '🇴🇲', name: 'عمان (+968)' },
    { code: '+964', flag: '🇮🇶', name: 'العراق (+964)' },
    { code: '+970', flag: '🇵🇸', name: 'فلسطين (+970)' },
  ];

  // Countries List for Step 2
  const countriesList = [
    { value: 'الأردن', label: '🇯🇴 الأردن' },
    { value: 'السعودية', label: '🇸🇦 المملكة العربية السعودية' },
    { value: 'الإمارات', label: '🇦🇪 الإمارات العربية المتحدة' },
    { value: 'مصر', label: '🇪🇬 جمهورية مصر العربية' },
    { value: 'قطر', label: '🇶🇦 قطر' },
    { value: 'الكويت', label: '🇰🇼 الكويت' },
    { value: 'البحرين', label: '🇧🇭 البحرين' },
    { value: 'عمان', label: '🇴🇲 سلطنة عمان' },
    { value: 'العراق', label: '🇮🇶 العراق' },
    { value: 'فلسطين', label: '🇵🇸 فلسطين' },
  ];

  // 11 Legal forms as shown in Lovable
  const legalFormOptions = [
    { value: 'individual', label: 'فرد' },
    { value: 'sole_proprietorship', label: 'مؤسسة فردية' },
    { value: 'llc', label: 'شركة ذات مسؤولية محدودة' },
    { value: 'private_joint_stock', label: 'شركة مساهمة خاصة' },
    { value: 'public_joint_stock', label: 'شركة مساهمة عامة' },
    { value: 'general_partnership', label: 'شركة تضامن' },
    { value: 'limited_partnership', label: 'شركة توصية بسيطة' },
    { value: 'independent_entity', label: 'هيئة مستقلة' },
    { value: 'researcher', label: 'باحث / أكاديمي' },
    { value: 'association', label: 'جمعيات' },
    { value: 'non_profit', label: 'غير ربحية' },
  ];

  // 5 Sectors as shown in Lovable
  const sectorOptions = [
    { value: 'services', label: 'قطاع خدمات' },
    { value: 'technology', label: 'قطاع تكنولوجيا' },
    { value: 'industrial', label: 'قطاع صناعي' },
    { value: 'commercial', label: 'قطاع تجاري' },
    { value: 'agricultural', label: 'قطاع زراعي' },
  ];

  // Fetch Specializations for Consultants on mount
  useEffect(() => {
    fetch('/api/specializations/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSpecializations(data);
          if (!mainSpecializationId) {
            setMainSpecializationId(data[0].id.toString());
          }
        } else {
          throw new Error('No data');
        }
      })
      .catch(() => {
        const official15 = [
          { id: 1, name: 'ضريبة الدخل والمبيعات' },
          { id: 2, name: 'المناطق الحرة والتنموية' },
          { id: 3, name: 'منطقة العقبة الاقتصادية الخاصة' },
          { id: 4, name: 'قوانين الإستثمار' },
          { id: 5, name: 'قوانين الجمارك' },
          { id: 6, name: 'الضرائب الدولية' },
          { id: 7, name: 'الإزدواج الضريبي' },
          { id: 8, name: 'الأسعار التحويلية' },
          { id: 9, name: 'الضريبة الخاصة' },
          { id: 10, name: 'المنازعات الضريبية' },
          { id: 11, name: 'إدارة المخاطر' },
          { id: 12, name: 'تدقيق الحسابات' },
          { id: 13, name: 'التدقيق الداخلي' },
          { id: 14, name: 'الإعسار' },
          { id: 15, name: 'التصفية' }
        ];
        setSpecializations(official15);
        if (!mainSpecializationId) {
          setMainSpecializationId('1');
        }
      });
  }, []);

  const validateEmail = (str) => {
    // Must be valid ASCII email format without any Arabic or non-ASCII characters
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
  };

  // Step Validation logic
  const validateStep = (stepNumber) => {
    setError('');

    if (stepNumber === 1) {
      if (!fullName.trim()) {
        setError('يرجى إدخال الاسم الكامل');
        return false;
      }
      if (!email.trim() || !validateEmail(email.trim())) {
        setError('يرجى إدخال بريد إلكتروني صحيح باللغة الإنجليزية (تأكد من عدم وجود أحرف عربية)');
        return false;
      }
      if (!phoneNum.trim() || phoneNum.trim().length < 6) {
        setError('يرجى إدخال رقم هاتف صحيح');
        return false;
      }
      if (!address.trim()) {
        setError('يرجى إدخال العنوان');
        return false;
      }
      if (!password || password.length < 8) {
        setError('كلمة المرور يجب أن لا تقل عن 8 أحرف');
        return false;
      }
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

      if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        setError('كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص');
        return false;
      }
      if (password !== confirmPassword) {
        setError('تأكيد كلمة المرور غير متطابق مع كلمة المرور');
        return false;
      }
      if (!captchaChecked) {
        setError('يرجى تأكيد أنك لست برنامج روبوت (reCAPTCHA)');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (accountType === 'user') {
        const isIndividual = legalForm === 'individual';
        if (!isIndividual && !companyName.trim()) {
          setError('يرجى إدخال اسم المنشأة');
          return false;
        }
        if (!acceptedTerms) {
          setError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة');
          return false;
        }
      } else {
        if (!title.trim()) {
          setError('يرجى إدخال المسمى الوظيفي');
          return false;
        }
        if (!acceptedTerms) {
          setError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة');
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(1)) {
      setError('');
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upload Commercial Register file handler
  const handleCrFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCr(true);
    setError('');

    try {
      const res = await fetch('/api/auth/upload-commercial-register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCrFileUrl(data.url);
        setCrFileName(file.name);
      } else {
        setError(data.detail || 'فشل رفع الملف. يرجى إعادة المحاولة.');
      }
    } catch (err) {
      setError('فشل الاتصال أثناء رفع الملف.');
    } finally {
      setUploadingCr(false);
    }
  };

  // Upload Certificates file handler
  const handleCertificatesUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCertificates(true);
    setError('');

    try {
      const res = await fetch('/api/auth/upload-commercial-register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCertificatesFileUrl(data.url);
        setCertificatesLicenses(data.url);
        setCertificatesFileName(file.name);
      } else {
        setError(data.detail || 'فشل رفع الملف. يرجى إعادة المحاولة.');
      }
    } catch (err) {
      setError('فشل الاتصال أثناء رفع الملف.');
    } finally {
      setUploadingCertificates(false);
    }
  };

  const handleProceedToOtp = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setError('');

    const cleanPhone = phoneNum.trim().replace(/^0+/, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    try {
      const res = await fetch('/api/auth/register-otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          full_name: fullName.trim()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorMsg = 'فشل إرسال رمز التحقق. يرجى التحقق من صحة البيانات.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail
              .map((e) => (e.msg ? e.msg.replace(/^Value error,\s*/i, '') : JSON.stringify(e)))
              .join(' | ');
          }
        }
        setError(errorMsg);
      }
    } catch {
      setError('تعذر الاتصال بالخادم لإرسال رمز التحقق.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    const cleanPhone = phoneNum.trim().replace(/^0+/, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    try {
      let endpoint = '/api/auth/register';
      let payload = {};

      if (accountType === 'user') {
        const isIndividual = legalForm === 'individual' || legalForm === 'researcher';
        const backendSector = sector === 'technology' ? 'services' : sector;

        payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          phone: fullPhone,
          address: address.trim() || null,
          country: 'الأردن',
          entity_type: isIndividual ? 'individual' : 'company',
          legal_form: legalForm,
          company_name: !isIndividual && companyName.trim() ? companyName.trim() : null,
          tax_number: taxNumber.trim() ? taxNumber.trim() : null,
          commercial_register_number: crNumber.trim() ? crNumber.trim() : null,
          sector: backendSector,
          commercial_register_url: crFileUrl || null,
          accepted_privacy_policy: acceptedTerms,
        };
      } else {
        endpoint = '/api/auth/register/consultant';
        payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          phone: fullPhone,
          country: 'الأردن',
          title: title.trim(),
          address: address.trim() || null,
          company_name: companyName.trim() || null,
          bio: bio.trim() || null,
          main_specialization_id: mainSpecializationId ? parseInt(mainSpecializationId) : null,
          activity_type: activityType.trim() || null,
          years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
          certificates_licenses: certificatesLicenses.trim() || null,
          accepted_privacy_policy: acceptedTerms,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorMessage = 'فشل استكمال عملية التسجيل. يرجى إعادة المحاولة.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err) => err.msg || err.detail).join(' | ');
          }
        }
        setError(errorMessage);
      }
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى التأكد من اتصالك وإعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Brand Full Logo */}
      <div className="auth-logo-container">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate ? navigate('/') : window.location.href = '/'; }}>
          <img
            src="/diwan-logo-full.png"
            onError={(e) => { e.target.src = '/logo.png'; }}
            alt="ديوان للاستشارات الضريبية"
            className="auth-main-logo"
          />
        </a>
      </div>

      {/* Auth Card Frame with Corner Brackets */}
      <div className="auth-frame relative">
        <div className="auth-card">
          {/* SUCCESS SCREEN */}
          {success ? (
            <div className="auth-success-screen fade-in">
              <div className="auth-success-circle">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <div className="auth-success-greeting">مرحباً بك في ديوان</div>
              <h2 className="auth-success-title">تم إنشاء حسابك بنجاح</h2>
              <p className="auth-success-description">
                {accountType === 'user'
                  ? 'يمكنك الآن تسجيل الدخول والبدء باستخدام خدمات المنصة.'
                  : 'تم تقديم طلب اعتماد حساب المستشار بنجاح. سيتم مراجعة طلبك وإشعارك قريباً.'}
              </p>

              <div className="auth-package-pill">
                <span className="package-check">✓</span>
                <span>باقة الاشتراك: الباقة المجانية</span>
              </div>

              <button
                type="button"
                className="auth-btn-primary"
                onClick={() => {
                  if (navigate) navigate('/login');
                  else window.location.href = '/login';
                }}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => {
                  if (navigate) navigate('/');
                  else window.location.href = '/';
                }}
              >
                الصفحة الرئيسية
              </button>

              <div className="auth-support-text">
                تحتاج إلى مساعدة؟ <a href="mailto:support@diwanjo.com">support@diwanjo.com</a>
              </div>

              <div className="auth-footer-prompt">
                <span>لديك حساب؟ </span>
                <a
                  href="/login"
                  className="auth-link-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    if (navigate) navigate('/login');
                    else window.location.href = '/login';
                  }}
                >
                  تسجيل الدخول
                </a>
              </div>
            </div>
          ) : (
            /* FORM CONTENT */
            <div className="auth-content-container">
              {/* Card Header */}
              <div className="auth-header">
                <h1 className="auth-title">إنشاء حساب</h1>
                <p className="auth-subtitle">مرحباً بك في منصة ديوان للاستشارات الضريبية</p>
              </div>

              {/* Segmented Switch: المستخدمين / المستشارين */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab-btn ${accountType === 'user' ? 'active' : ''}`}
                  onClick={() => {
                    setAccountType('user');
                    setError('');
                  }}
                  disabled={loading || currentStep > 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
                    <circle cx="12" cy="8" r="5"></circle>
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                  </svg>
                  <span>المستخدمين</span>
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${accountType === 'consultant' ? 'active' : ''}`}
                  onClick={() => {
                    setAccountType('consultant');
                    setError('');
                  }}
                  disabled={loading || currentStep > 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
                    <path d="M12 12h.01"></path>
                    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
                    <path d="M22 13a18.15 18.15 0 0 1-20 0"></path>
                    <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                  </svg>
                  <span>المستشارين</span>
                </button>
              </div>

              {/* Alert Feedback */}
              {error && (
                <div className="auth-alert auth-alert-danger fade-in">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Basic Information */}
              {currentStep === 1 && (
                <div className="auth-step-pane fade-in">
                  {/* Full Name */}
                  <div className="auth-field-group">
                    <label className="auth-label" htmlFor="user-name">
                      الاسم الكامل <span className="required-star">*</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="5"></circle>
                          <path d="M20 21a8 8 0 0 0-16 0"></path>
                        </svg>
                      </span>
                      <input
                        id="user-name"
                        type="text"
                        className="auth-input"
                        placeholder="أدخل الاسم الكامل"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="auth-field-group">
                    <label className="auth-label" htmlFor="user-email">
                      البريد الإلكتروني <span className="required-star">*</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        </svg>
                      </span>
                      <input
                        id="user-email"
                        type="email"
                        dir="ltr"
                        className="auth-input ltr-input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="auth-field-group">
                    <label className="auth-label">
                      رقم الهاتف <span className="required-star">*</span>
                    </label>
                    <div dir="ltr" className="auth-phone-container">
                      <input
                        type="tel"
                        dir="ltr"
                        className="auth-phone-input"
                        placeholder="7X XXX XXXX"
                        value={phoneNum}
                        onChange={(e) => setPhoneNum(e.target.value)}
                      />
                      <div className="auth-phone-prefix">
                        <span className="phone-flag" aria-hidden="true">🇯🇴</span>
                        <span className="phone-code">+962</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="auth-field-group">
                    <label className="auth-label" htmlFor="user-address">
                      العنوان <span className="required-star">*</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </span>
                      <input
                        id="user-address"
                        type="text"
                        className="auth-input"
                        placeholder="أدخل عنوانك"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Passwords 2 Columns */}
                  <div className="auth-row-2col">
                    <div className="auth-field-group">
                      <label className="auth-label" htmlFor="user-password">
                        كلمة المرور <span className="required-star">*</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="16" r="1"></circle>
                            <rect x="3" y="10" width="18" height="12" rx="2"></rect>
                            <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                          </svg>
                        </span>
                        <input
                          id="user-password"
                          type={showPassword ? 'text' : 'password'}
                          className="auth-input has-toggle"
                          placeholder="8 أحرف على الأقل"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="auth-password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-label" htmlFor="user-confirm">
                        تأكيد كلمة المرور <span className="required-star">*</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="16" r="1"></circle>
                            <rect x="3" y="10" width="18" height="12" rx="2"></rect>
                            <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                          </svg>
                        </span>
                        <input
                          id="user-confirm"
                          type={showPassword ? 'text' : 'password'}
                          className="auth-input"
                          placeholder="أعد إدخال كلمة المرور"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Checklist Rules */}
                  <div className="auth-password-rules">
                    <span className={password.length >= 8 ? 'rule-met' : 'rule-unmet'}>
                      {password.length >= 8 ? '✓' : '○'} 8 أحرف على الأقل
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'rule-met' : 'rule-unmet'}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} حرف كبير (A-Z)
                    </span>
                    <span className={/[a-z]/.test(password) ? 'rule-met' : 'rule-unmet'}>
                      {/[a-z]/.test(password) ? '✓' : '○'} حرف صغير (a-z)
                    </span>
                    <span className={/[0-9]/.test(password) ? 'rule-met' : 'rule-unmet'}>
                      {/[0-9]/.test(password) ? '✓' : '○'} رقم (0-9)
                    </span>
                    <span className={`rule-span-2 ${/[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?~`]/.test(password) ? 'rule-met' : 'rule-unmet'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? '✓' : '○'} رمز خاص (@ # $ % ! & * _ -)
                    </span>
                  </div>

                  {/* reCAPTCHA Simulator Box */}
                  <div dir="ltr" className="recaptcha-card">
                    <label className="recaptcha-label" onClick={() => setCaptchaChecked(!captchaChecked)}>
                      <div className={`recaptcha-check-box ${captchaChecked ? 'checked' : ''}`}>
                        {captchaChecked && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className="recaptcha-text">I'm not a robot</span>
                    </label>
                    <div className="recaptcha-brand">
                      <div className="recaptcha-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="16" r="1"></circle>
                          <rect x="3" y="10" width="18" height="12" rx="2"></rect>
                          <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                        </svg>
                      </div>
                      <span className="recaptcha-brand-title">reCAPTCHA</span>
                      <span className="recaptcha-legal-links">Privacy - Terms</span>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    className="auth-btn-gold"
                    onClick={handleNextStep}
                  >
                    المتابعة
                  </button>

                  {/* Footer link to Login */}
                  <div className="auth-footer-prompt">
                    <span>لديك حساب؟ </span>
                    <a
                      href="/login"
                      className="auth-link-bold"
                      onClick={(e) => {
                        e.preventDefault();
                        if (navigate) navigate('/login');
                        else window.location.href = '/login';
                      }}
                    >
                      تسجيل الدخول
                    </a>
                  </div>
                </div>
              )}

              {/* STEP 2: Entity & Professional Details */}
              {currentStep === 2 && (
                <div className="auth-step-pane fade-in">
                  {accountType === 'user' ? (
                    <>
                      {/* Legal Form Dropdown */}
                      <div className="auth-field-group">
                        <label className="auth-label">
                          الشكل القانوني <span className="required-star">*</span>
                        </label>
                        <ModernSelect
                          options={legalFormOptions}
                          value={legalForm}
                          onChange={(val) => setLegalForm(val)}
                          placeholder="اختر الشكل القانوني..."
                          prefixIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                              <path d="M9 22v-4h6v4"></path>
                              <path d="M8 6h.01"></path>
                              <path d="M16 6h.01"></path>
                              <path d="M12 6h.01"></path>
                              <path d="M12 10h.01"></path>
                              <path d="M12 14h.01"></path>
                              <path d="M16 10h.01"></path>
                              <path d="M16 14h.01"></path>
                              <path d="M8 10h.01"></path>
                              <path d="M8 14h.01"></path>
                            </svg>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Sector / Activity Dropdown */}
                      <div className="auth-field-group">
                        <label className="auth-label">
                          نشاط المنشأة <span className="required-star">*</span>
                        </label>
                        <ModernSelect
                          options={sectorOptions}
                          value={sector}
                          onChange={(val) => setSector(val)}
                          placeholder="اختر نشاط المنشأة"
                          prefixIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 12h.01"></path>
                              <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
                              <path d="M22 13a18.15 18.15 0 0 1-20 0"></path>
                              <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                            </svg>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Company / Entity Name */}
                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="company-name">
                          اسم المنشأة <span className="required-star">{legalForm !== 'individual' ? '*' : ''}</span>
                        </label>
                        <div className="auth-input-wrapper">
                          <span className="auth-input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                              <path d="M9 22v-4h6v4"></path>
                            </svg>
                          </span>
                          <input
                            id="company-name"
                            type="text"
                            className="auth-input"
                            placeholder="أدخل اسم المنشأة"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Two Column Row: CR Number + Tax Number */}
                      <div className="auth-row-2col">
                        <div className="auth-field-group">
                          <label className="auth-label" htmlFor="cr-number">
                            رقم السجل التجاري
                          </label>
                          <div className="auth-input-wrapper">
                            <span className="auth-input-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="9" x2="20" y2="9"></line>
                                <line x1="4" y1="15" x2="20" y2="15"></line>
                                <line x1="10" y1="3" x2="8" y2="21"></line>
                                <line x1="16" y1="3" x2="14" y2="21"></line>
                              </svg>
                            </span>
                            <input
                              id="cr-number"
                              type="text"
                              className="auth-input"
                              placeholder="رقم السجل"
                              value={crNumber}
                              onChange={(e) => setCrNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="auth-field-group">
                          <label className="auth-label" htmlFor="tax-number">
                            الرقم الضريبي
                          </label>
                          <div className="auth-input-wrapper">
                            <span className="auth-input-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="9" x2="20" y2="9"></line>
                                <line x1="4" y1="15" x2="20" y2="15"></line>
                                <line x1="10" y1="3" x2="8" y2="21"></line>
                                <line x1="16" y1="3" x2="14" y2="21"></line>
                              </svg>
                            </span>
                            <input
                              id="tax-number"
                              type="text"
                              className="auth-input"
                              placeholder="الرقم الضريبي"
                              value={taxNumber}
                              onChange={(e) => setTaxNumber(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Country Field (Fixed to Jordan) */}
                      <div className="auth-field-group">
                        <label className="auth-label">
                          الدولة <span className="required-star">*</span>
                        </label>
                        <div className="auth-input-wrapper">
                          <span className="auth-input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </span>
                          <input
                            type="text"
                            className="auth-input auth-input-readonly"
                            value="الأردن"
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Commercial Register File Upload Card */}
                      <div className="auth-file-card">
                        <div className="auth-file-info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-file-icon">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                          </svg>
                          <div className="auth-file-texts">
                            <span className="auth-file-title">السجل التجاري</span>
                            <span className="auth-file-subtitle">
                              {crFileName ? `✓ ${crFileName}` : 'PDF أو JPG أو PNG - بحد أقصى 5MB'}
                            </span>
                          </div>
                        </div>

                        <label className={`auth-file-btn ${uploadingCr ? 'disabled' : ''}`}>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={handleCrFileUpload}
                            disabled={uploadingCr}
                            hidden
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{uploadingCr ? 'جاري الرفع...' : crFileUrl ? 'تم الرفع ✓' : 'رفع الملف'}</span>
                        </label>
                      </div>
                    </>
                  ) : (
                    /* CONSULTANT STEP 2 FIELDS */
                    <>
                      {/* Title */}
                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="consultant-title">
                          المسمى الوظيفي / اللقب المهني <span className="required-star">*</span>
                        </label>
                        <div className="auth-input-wrapper">
                          <span className="auth-input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 12h.01"></path>
                              <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
                              <path d="M22 13a18.15 18.15 0 0 1-20 0"></path>
                              <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                            </svg>
                          </span>
                          <input
                            id="consultant-title"
                            type="text"
                            className="auth-input"
                            placeholder="مثال: مستشار ضريبي معتمد"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Main Specialization */}
                      <div className="auth-field-group">
                        <label className="auth-label">
                          التخصص الرئيسي <span className="required-star">*</span>
                        </label>
                        <ModernSelect
                          options={specializations.map((s) => ({ value: String(s.id), label: s.name }))}
                          value={String(mainSpecializationId)}
                          onChange={(val) => setMainSpecializationId(val)}
                          placeholder="اختر التخصص..."
                          prefixIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                              <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
                              <path d="M7 21h10"></path>
                              <path d="M12 3v18"></path>
                              <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
                            </svg>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Activity Type + Years of Experience */}
                      <div className="auth-row-2col">
                        <div className="auth-field-group">
                          <label className="auth-label" htmlFor="consultant-activity">
                            نوع النشاط المهني
                          </label>
                          <div className="auth-input-wrapper">
                            <span className="auth-input-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            </span>
                            <input
                              id="consultant-activity"
                              type="text"
                              className="auth-input"
                              placeholder="استشارات قانونية وضرائب المبيعات"
                              value={activityType}
                              onChange={(e) => setActivityType(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="auth-field-group">
                          <label className="auth-label" htmlFor="consultant-years">
                            سنوات الخبرة
                          </label>
                          <div className="auth-input-wrapper">
                            <span className="auth-input-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </span>
                            <input
                              id="consultant-years"
                              type="number"
                              min="0"
                              max="50"
                              className="auth-input"
                              placeholder="مثال: 10"
                              value={yearsOfExperience}
                              onChange={(e) => setYearsOfExperience(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Certificates File Upload Card */}
                      <div className="auth-file-card">
                        <div className="auth-file-info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-file-icon">
                            <path d="M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"></path>
                            <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"></path>
                          </svg>
                          <div className="auth-file-texts">
                            <span className="auth-file-title">الشهادات والاعتمادات</span>
                            <span className="auth-file-subtitle">
                              {certificatesFileName ? `✓ ${certificatesFileName}` : 'PDF أو صورة الاعتماد المهني'}
                            </span>
                          </div>
                        </div>

                        <label className={`auth-file-btn ${uploadingCertificates ? 'disabled' : ''}`}>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={handleCertificatesUpload}
                            disabled={uploadingCertificates}
                            hidden
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{uploadingCertificates ? 'جاري الرفع...' : certificatesFileUrl ? 'تم الرفع ✓' : 'رفع الملف'}</span>
                        </label>
                      </div>

                      {/* Bio */}
                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="consultant-bio">
                          نبذة مختصرة عن المستشار
                        </label>
                        <textarea
                          id="consultant-bio"
                          rows="3"
                          className="auth-textarea"
                          placeholder="اكتب ملخصاً قصيراً عن مؤهلاتك وخبرتك المهنية..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        ></textarea>
                      </div>
                    </>
                  )}

                  {/* Terms Checkbox */}
                  <div className="auth-terms-container">
                    <label className="auth-terms-label">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="auth-checkbox"
                      />
                      <span className="auth-terms-text">
                        أوافق على الشروط والأحكام وسياسة الخصوصية.{' '}
                        <a
                          href="#terms"
                          className="auth-terms-link"
                          onClick={(e) => {
                            e.preventDefault();
                            if (openPolicy) openPolicy('privacy_policy');
                          }}
                        >
                          اضغط هنا للاطلاع عليها.
                        </a>
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons: [ الرجوع ] [ المتابعة ] */}
                  <div className="auth-btn-row">
                    <button
                      type="button"
                      className="auth-btn-outline"
                      onClick={handlePrevStep}
                      disabled={loading}
                    >
                      الرجوع
                    </button>
                    <button
                      type="button"
                      className="auth-btn-gold"
                      onClick={handleProceedToOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="auth-spinner"></span>
                      ) : (
                        'المتابعة'
                      )}
                    </button>
                  </div>

                  {/* Footer link to Login */}
                  <div className="auth-footer-prompt">
                    <span>لديك حساب؟ </span>
                    <a
                      href="/login"
                      className="auth-link-bold"
                      onClick={(e) => {
                        e.preventDefault();
                        if (navigate) navigate('/login');
                        else window.location.href = '/login';
                      }}
                    >
                      تسجيل الدخول
                    </a>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP Account Verification */}
              {currentStep === 3 && (
                <OtpVerificationStep
                  recipient={email}
                  email={email}
                  fullName={fullName}
                  onVerified={handleFinalSubmit}
                  onBack={() => setCurrentStep(2)}
                  navigate={navigate}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

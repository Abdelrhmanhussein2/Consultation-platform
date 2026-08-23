import React, { useState, useEffect } from 'react';
import './RegisterForm.css';

export default function RegisterForm({ openPolicy, navigate }) {
  // Account Type ('user' or 'consultant')
  const [accountType, setAccountType] = useState('user');
  
  // Current Step (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Specializations list for consultant
  const [specializations, setSpecializations] = useState([]);

  // Step 1: Basic Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+962'); // Default Jordan code
  const [phoneNum, setPhoneNum] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Entity & Professional Details (User)
  const [entityType, setEntityType] = useState('individual'); // 'individual', 'company', 'researcher'
  const [legalForm, setLegalForm] = useState('individual');
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [sector, setSector] = useState('commercial');
  const [crFileUrl, setCrFileUrl] = useState('');
  const [uploadingCr, setUploadingCr] = useState(false);

  // Step 2: Professional Details (Consultant)
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [mainSpecializationId, setMainSpecializationId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [certificatesLicenses, setCertificatesLicenses] = useState('');
  const [bio, setBio] = useState('');

  // Step 3: Terms & Policies Agreement
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);

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

  // Fetch Specializations for Consultants on mount
  useEffect(() => {
    fetch('/api/specializations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSpecializations(data);
          if (data.length > 0) {
            setMainSpecializationId(data[0].id.toString());
          }
        }
      })
      .catch(() => {
        // Fallback default list if API fails
        setSpecializations([
          { id: 1, name: 'ضريبة القيمة المضافة (VAT)' },
          { id: 2, name: 'ضريبة الدخل والمبيعات' },
          { id: 3, name: 'التخطيط والامتثال الضريبي' },
          { id: 4, name: 'الاستشارات النزاعية والاعتراضات' }
        ]);
        setMainSpecializationId('1');
      });
  }, []);

  const validateEmail = (str) => /\S+@\S+\.\S+/.test(str);

  // Step Validation logic
  const validateStep = (stepNumber) => {
    setError('');
    
    if (stepNumber === 1) {
      if (!fullName.trim()) {
        setError('يرجى إدخال الاسم بالكامل');
        return false;
      }
      if (!email.trim() || !validateEmail(email)) {
        setError('يرجى إدخال بريد إلكتروني صحيح');
        return false;
      }
      if (!phoneNum.trim() || phoneNum.trim().length < 6) {
        setError('يرجى إدخال رقم هاتف صحيح');
        return false;
      }
      if (!password || password.length < 8) {
        setError('كلمة المرور يجب أن لا تقل عن 8 خانات');
        return false;
      }
      // Check password complexity (Uppercase, Lowercase, Number, Special)
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل');
        return false;
      }
      if (password !== confirmPassword) {
        setError('تأكيد كلمة المرور غير متطابق مع كلمة المرور');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (accountType === 'user') {
        const isCompanyForm = legalForm && !['individual', 'independent_entity', 'researcher'].includes(legalForm);
        if (entityType === 'company' || isCompanyForm) {
          if (!companyName.trim()) {
            setError('يرجى إدخال اسم الشركة / المؤسسة');
            return false;
          }
          if (!crFileUrl) {
            setError('مستند السجل التجاري مطلوب للصفة القانونية المحددة. يرجى رفع الملف للمتابعة.');
            return false;
          }
        }
      } else {
        // Consultant fields
        if (!title.trim()) {
          setError('يرجى إدخال المسمى الوظيفي');
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      if (!acceptedPrivacyPolicy) {
        setError('يجب الموافقة على سياسة الخصوصية للمتابعة');
        return false;
      }
      if (!acceptedTerms) {
        setError('يجب الموافقة على شروط وأحكام الاستخدام للمتابعة');
        return false;
      }
      if (!acceptedAccuracy) {
        setError('يجب الإقرار بصحة البيانات المدخلة');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Upload Commercial Register file handler
  const handleCrFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      } else {
        setError(data.detail || 'فشل رفع الملف. يرجى إعادة المحاولة.');
      }
    } catch (err) {
      setError('فشل الاتصال أثناء رفع الملف.');
    } finally {
      setUploadingCr(false);
    }
  };

  // Submit Final Registration Form
  const handleSubmitRegistration = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    const cleanPhone = phoneNum.trim().replace(/^0+/, '');
    const fullPhone = `${countryCode}${cleanPhone}`;

    try {
      let endpoint = '/api/auth/register';
      let payload = {};

      if (accountType === 'user') {
        payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          phone: fullPhone,
          entity_type: entityType,
          legal_form: legalForm,
          company_name: entityType === 'company' ? companyName.trim() : null,
          tax_number: entityType === 'company' ? taxNumber.trim() : null,
          sector: sector,
          commercial_register_url: crFileUrl || null,
          accepted_privacy_policy: acceptedPrivacyPolicy,
        };
      } else {
        endpoint = '/api/auth/register/consultant';
        payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          phone: fullPhone,
          title: title.trim(),
          address: address.trim() || null,
          company_name: companyName.trim() || null,
          bio: bio.trim() || null,
          main_specialization_id: mainSpecializationId ? parseInt(mainSpecializationId) : null,
          activity_type: activityType.trim() || null,
          years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
          certificates_licenses: certificatesLicenses.trim() || null,
          accepted_privacy_policy: acceptedPrivacyPolicy,
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
      } else {
        let errorMessage = 'فشل عملية التسجيل. يرجى التأكد من البيانات المدخلة.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err) => err.msg || err.detail).join(' | ');
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم. يرجى التأكد من اتصالك وإعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-card-wrapper slide-up">
      {/* Brand Logo */}
      <div className="register-logo-container">
        <img src="/logo.png" alt="شعار ديوان" className="register-logo" />
      </div>

      <div className="register-card">
        {/* Corner Brackets */}
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket bottom-right"></div>

        {/* Card Header */}
        <div className="register-header">
          <h2 className="register-title">إنشاء حساب جديد</h2>
          <p className="register-subtitle">انضم إلى منصة ديوان للاستشارات الضريبية الذكية</p>
        </div>

        {/* Tabs Control: Account Type */}
        <div className="register-tabs">
          <button
            type="button"
            className={`tab-btn ${accountType === 'user' ? 'active' : ''}`}
            onClick={() => {
              setAccountType('user');
              setError('');
            }}
            disabled={loading || currentStep > 1}
          >
            مستخدم / كيان تجاري
          </button>
          <button
            type="button"
            className={`tab-btn ${accountType === 'consultant' ? 'active' : ''}`}
            onClick={() => {
              setAccountType('consultant');
              setError('');
            }}
            disabled={loading || currentStep > 1}
          >
            مستشار ضريبي
          </button>
        </div>

        {/* Progress Bar Component */}
        <div className="progress-bar-container">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {[
              { step: 1, title: 'الأساسية' },
              { step: 2, title: accountType === 'user' ? 'الكيان' : 'الخبرات' },
              { step: 3, title: 'الشروط' },
              { step: 4, title: 'المراجعة' },
            ].map((item) => (
              <div
                key={item.step}
                className={`step-item ${currentStep === item.step ? 'active' : ''} ${
                  currentStep > item.step ? 'completed' : ''
                }`}
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
              >
                <div className="step-circle">
                  {currentStep > item.step ? '✓' : item.step}
                </div>
                <span className="step-label">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-danger fade-in">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS STATE */}
        {success ? (
          <div className="success-screen fade-in">
            <div className="success-icon">✓</div>
            <h3>تم إنشاء الحساب بنجاح!</h3>
            <p>
              {accountType === 'user'
                ? 'أهلاً بك! يمكنك الآن تسجيل الدخول والاستفادة من استشارات المنصة.'
                : 'تم تقديم طلب اعتماد حساب المستشار بنجاح. سيتم مراجعة طلبك وإشعارك قريباً.'}
            </p>
            <button
              className="submit-btn"
              onClick={() => {
                if (navigate) navigate('/login');
                else window.location.href = '/login';
              }}
            >
              الانتقال لتسجيل الدخول
            </button>
          </div>
        ) : (
          /* STEP FORM CONTENT */
          <div className="step-content-wrapper">
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <div className="step-pane fade-in">
                <div className="form-group">
                  <label htmlFor="fullName">الاسم الكامل *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="fullName"
                      placeholder="أدخل الاسم بالكامل"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">البريد الإلكتروني *</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      placeholder="example@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone Input with Country Selector (Jordan default +962) */}
                <div className="form-group">
                  <label htmlFor="phone">رقم الهاتف الجوال *</label>
                  <div className="phone-input-container">
                    <select
                      className="country-code-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="791234567"
                      className="phone-number-input"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                    />
                  </div>
                  <span className="input-hint">سيتم تسجيل رقمك بالصيغة: {countryCode}{phoneNum || '79xxxxxxx'}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="password">كلمة المرور *</label>
                  <div className="input-wrapper password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="8 خانات على الأقل (حروف كبيرة وصغيرة وأرقام)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="أعد كتابة كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Entity & Professional Details */}
            {currentStep === 2 && (
              <div className="step-pane fade-in">
                {accountType === 'user' ? (
                  <>
                    <div className="form-group">
                      <label>نوع الكيان المستخدم</label>
                      <div className="select-wrapper">
                        <select
                          value={entityType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEntityType(val);
                            if (val === 'individual') setLegalForm('individual');
                            else if (val === 'researcher') setLegalForm('researcher');
                            else if (val === 'company') setLegalForm('llc');
                          }}
                        >
                          <option value="individual">👤 فرد / أفراد</option>
                          <option value="company">🏢 شركة / مؤسسة تجارية</option>
                          <option value="researcher">🎓 باحث / أكاديمي</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>الشكل القانوني</label>
                      <div className="select-wrapper">
                        <select
                          value={legalForm}
                          onChange={(e) => setLegalForm(e.target.value)}
                        >
                          <option value="individual">فرد</option>
                          <option value="sole_proprietorship">مؤسسة فردية</option>
                          <option value="llc">شركة ذات مسؤولية محدودة (LLC)</option>
                          <option value="private_joint_stock">شركة مساهمة خاصة</option>
                          <option value="public_joint_stock">شركة مساهمة عامة</option>
                          <option value="non_profit">جهة غير ربحية / جمعية</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>القطاع التجاري / الاقتصادي</label>
                      <div className="select-wrapper">
                        <select
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                        >
                          <option value="commercial">القطاع التجاري</option>
                          <option value="services">قطاع الخدمات</option>
                          <option value="industrial">القطاع الصناعي</option>
                          <option value="banking">القطاع المالي والبنكي</option>
                          <option value="contracting">المقاولات والإنشاءات</option>
                          <option value="agricultural">القطاع الزراعي</option>
                          <option value="other">قطاعات أخرى</option>
                        </select>
                      </div>
                    </div>

                    {(entityType === 'company' || (legalForm && !['individual', 'independent_entity', 'researcher'].includes(legalForm))) && (
                      <>
                        <div className="form-group">
                          <label htmlFor="companyName">اسم الشركة / المؤسسة *</label>
                          <div className="input-wrapper">
                            <input
                              type="text"
                              id="companyName"
                              placeholder="أدخل اسم الشركة الرسمي"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="taxNumber">الرقم الضريبي (اختياري)</label>
                          <div className="input-wrapper">
                            <input
                              type="text"
                              id="taxNumber"
                              placeholder="الرقم الضريبي المسجل"
                              value={taxNumber}
                              onChange={(e) => setTaxNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>مستند السجل التجاري (مطلوب للصفة القانونية * )</label>
                          <div className="file-upload-box">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              id="crFile"
                              onChange={handleCrFileUpload}
                              disabled={uploadingCr}
                            />
                            <label htmlFor="crFile" className="file-upload-label">
                              {uploadingCr
                                ? 'جاري رفع الملف...'
                                : crFileUrl
                                ? '✓ تم رفع مستند السجل التجاري'
                                : '📁 اضغط هنا لرفع مستند السجل التجاري'}
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="title">المسمى الوظيفي / اللقب المهني *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="title"
                          placeholder="مثال: مستشار ضريبي معتمد / خبير ضريبة دخل"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>التخصص الرئيسي</label>
                      <div className="select-wrapper">
                        <select
                          value={mainSpecializationId}
                          onChange={(e) => setMainSpecializationId(e.target.value)}
                        >
                          {specializations.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="activityType">نوع النشاط المهني</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="activityType"
                          placeholder="مثال: استشارات قانونية وضرائب المبيعات"
                          value={activityType}
                          onChange={(e) => setActivityType(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="yearsExp">سنوات الخبرة</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          id="yearsExp"
                          placeholder="عدد سنوات الخبرة (مثال: 5)"
                          min="0"
                          max="50"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="certificates">الشهادات والاعتمادات</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="certificates"
                          placeholder="الشهادات المهنية والتراخيص (CPA, SOCPA, إلخ)"
                          value={certificatesLicenses}
                          onChange={(e) => setCertificatesLicenses(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="bio">نبذة مختصرة عن المستشار</label>
                      <textarea
                        id="bio"
                        rows="3"
                        placeholder="اكتب ملخصاً قصيراً عن مؤهلاتك وتخصصك..."
                        className="textarea-input"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      ></textarea>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3: Terms & Policies Agreement */}
            {currentStep === 3 && (
              <div className="step-pane fade-in">
                <div className="policies-notice-box">
                  <h4>💡 الشروط وسياسات المنصة</h4>
                  <p>
                    يرجى الاطلاع والموافقة على سياسات منصة ديوان للاستشارات الضريبية لإتمام التسجيل.
                  </p>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacyPolicy}
                      onChange={(e) => setAcceptedPrivacyPolicy(e.target.checked)}
                    />
                    <span className="checkmark">✓</span>
                    <span className="label-text">
                      أوافق على{' '}
                      <a
                        href="#privacy"
                        onClick={(e) => {
                          e.preventDefault();
                          if (openPolicy) openPolicy('privacy_policy');
                        }}
                      >
                        سياسة الخصوصية
                      </a>{' '}
                      وشروط حماية البيانات *
                    </span>
                  </label>

                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <span className="checkmark">✓</span>
                    <span className="label-text">
                      أوافق على{' '}
                      <a
                        href="#terms"
                        onClick={(e) => {
                          e.preventDefault();
                          if (openPolicy) openPolicy('terms_and_conditions');
                        }}
                      >
                        شروط وأحكام الاستخدام
                      </a>{' '}
                      الخاصة بالمنصة *
                    </span>
                  </label>

                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={acceptedAccuracy}
                      onChange={(e) => setAcceptedAccuracy(e.target.checked)}
                    />
                    <span className="checkmark">✓</span>
                    <span className="label-text">
                      أقر بأن كافة البيانات والمعلومات المدخلة صحيحة وعلى مسؤوليتي الشخصية *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 4: Review Information */}
            {currentStep === 4 && (
              <div className="step-pane fade-in">
                <h4 className="review-heading">📋 مراجعة البيانات المدخلة</h4>
                <div className="review-summary-card">
                  <div className="summary-row">
                    <span className="summary-label">نوع الحساب:</span>
                    <span className="summary-val">
                      {accountType === 'user' ? 'مستخدم / كيان' : 'مستشار ضريبي'}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">الاسم الكامل:</span>
                    <span className="summary-val">{fullName}</span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">البريد الإلكتروني:</span>
                    <span className="summary-val">{email}</span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">رقم الهاتف:</span>
                    <span className="summary-val">{countryCode} {phoneNum}</span>
                  </div>

                  {accountType === 'user' ? (
                    <>
                      <div className="summary-row">
                        <span className="summary-label">نوع الكيان:</span>
                        <span className="summary-val">
                          {entityType === 'company'
                            ? 'شركة / مؤسسة'
                            : entityType === 'researcher'
                            ? 'باحث / أكاديمي'
                            : 'فرد'}
                        </span>
                      </div>
                      {entityType === 'company' && (
                        <div className="summary-row">
                          <span className="summary-label">اسم الشركة:</span>
                          <span className="summary-val">{companyName}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="summary-row">
                        <span className="summary-label">المسمى الوظيفي:</span>
                        <span className="summary-val">{title}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">سنوات الخبرة:</span>
                        <span className="summary-val">{yearsOfExperience || 'غير محدد'}</span>
                      </div>
                    </>
                  )}

                  <div className="summary-row">
                    <span className="summary-label">حالة السياسات:</span>
                    <span className="summary-val text-success">✓ تم إقرارها والموافقة عليها</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons Row */}
            <div className="step-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-prev"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  <span>السابق</span>
                  <svg className="btn-icon-back" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn-next"
                  onClick={handleNextStep}
                >
                  <span>التالي</span>
                  <svg className="btn-icon-next" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-next btn-submit"
                  onClick={handleSubmitRegistration}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-loader"></span>
                  ) : (
                    <>
                      <span>تأكيد وإنشاء الحساب</span>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Card Footer: Back to Login link */}
        <div className="card-footer-links">
          <span>لديك حساب بالفعل؟ </span>
          <a
            href="/login"
            className="register-link"
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
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginForm.css';

export default function LoginForm({ openPolicy, navigate }) {
  const { login: authLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle simple email validation
  const validateEmail = (emailStr) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!validateEmail(email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Step 1: Verify role from user profile BEFORE establishing session
        const meRes = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Accept': 'application/json'
          }
        });

        if (!meRes.ok) {
          setError('فشل التثبت من صحة الحساب من قاعدة البيانات.');
          setLoading(false);
          return;
        }

        const userData = await meRes.json();
        const role = userData.role;

        // Step 2: Strict Tab & Role Isolation
        if (activeTab === 'admin') {
          // Admin tab: Only admin and super_admin allowed
          if (role !== 'admin' && role !== 'super_admin') {
            if (role === 'consultant' || role === 'platform_consultant') {
              setError('عذراً، حسابات المستشارين تسجل الدخول من تبويب (المستخدمين والمستشارين).');
            } else {
              setError('عذراً، هذا الحساب مخصص للمستخدمين. يرجى تسجيل الدخول من تبويب (المستخدمين والمستشارين).');
            }
            setLoading(false);
            return;
          }
        } else {
          // User / Consultant tab: Admin/SuperAdmin accounts must use the Admin tab
          if (role === 'admin' || role === 'super_admin') {
            setError('عذراً، هذا الحساب يمتلك صلاحيات إدارية. يرجى تسجيل الدخول من تبويب (المدراء).');
            setLoading(false);
            return;
          }
        }

        // Step 3: Role is verified and matches the active tab -> Establish session
        await authLogin(data.access_token, data.refresh_token);

        // Successful login
        setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...');

        // Reset form
        setEmail('');
        setPassword('');

        // Clean redirection based on verified role
        setTimeout(() => {
          if (role === 'admin' || role === 'super_admin') {
            navigate('/admin/dashboard');
          } else if (role === 'consultant' || role === 'platform_consultant') {
            navigate('/consultant/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 350);

      } else {
        // Backend returned error
        let errorMessage = 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail) && data.detail.length > 0) {
            errorMessage = data.detail.map(err => err.msg || err.detail).join(' | ');
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('عذراً، فشل الاتصال بالخادم. تأكد من تشغيل النظام وأعد المحاولة.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Centered Brand Full Logo */}
      <div className="auth-logo-container">
        <a href="/" onClick={(e) => { e.preventDefault(); if (navigate) navigate('/'); else window.location.href = '/'; }}>
          <img
            src="/diwan-logo-full.png"
            onError={(e) => { e.target.src = '/logo.png'; }}
            alt="ديوان للاستشارات الضريبية"
            className="auth-main-logo"
          />
        </a>
      </div>

      {/* Frame with Corner Brackets */}
      <div className="auth-frame relative">
        <div className="auth-card">
          {/* Card Header */}
          <div className="auth-header">
            <h1 className="auth-title">
              {activeTab === 'user' ? 'تسجيل الدخول' : 'بوابة المدراء'}
            </h1>
            <p className="auth-subtitle">
              {activeTab === 'user'
                ? 'مرحباً بك في منصة ديوان للاستشارات الضريبية'
                : 'لوحة التحكم وإدارة منصة ديوان الذكية'}
            </p>
          </div>

          {/* Tabs Control */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('user');
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 0 0-16 0"></path>
              </svg>
              <span>المستخدمين والمستشارين</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('admin');
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 3v18"></path>
              </svg>
              <span>المدراء</span>
            </button>
          </div>

          {/* Feedback Alert Box */}
          {error && (
            <div className="auth-alert auth-alert-danger fade-in">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert auth-alert-success fade-in">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-login-form">
            {/* Email input */}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="login-email">
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
                  type="email"
                  id="login-email"
                  dir="ltr"
                  className="auth-input ltr-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">
                  كلمة المرور <span className="required-star">*</span>
                </label>
                <a href="/forgot-password" className="auth-forgot-link">نسيت كلمة المرور؟</a>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="16" r="1"></circle>
                    <rect x="3" y="10" width="18" height="12" rx="2"></rect>
                    <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="auth-input has-toggle"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
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

            {/* Remember me option */}
            <div className="auth-options-row">
              <label className="auth-terms-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="auth-checkbox"
                />
                <span className="auth-terms-text">تذكرني</span>
              </label>
            </div>

            {/* Submit button */}
            <button type="submit" className="auth-btn-gold" disabled={loading}>
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Link to registration */}
          {activeTab === 'user' && (
            <div className="auth-footer-prompt">
              <span>ليس لديك حساب؟ </span>
              <a
                href="/register"
                className="auth-link-bold"
                onClick={(e) => {
                  e.preventDefault();
                  if (navigate) navigate('/register');
                  else window.location.href = '/register';
                }}
              >
                إنشاء حساب
              </a>
            </div>
          )}

          {/* Legal disclaimer */}
          <p className="auth-legal-disclaimer">
            بالضغط على تسجيل الدخول فإنك توافق على{' '}
            <a href="#terms" onClick={(e) => { e.preventDefault(); if (openPolicy) openPolicy('terms_and_conditions'); }}>
              شروط الاستخدام
            </a>{' '}
            و{' '}
            <a href="#privacy" onClick={(e) => { e.preventDefault(); if (openPolicy) openPolicy('privacy_policy'); }}>
              سياسة الخصوصية
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

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
        // Log in via AuthContext which verifies identity with GET /api/users/me from backend DB
        const userData = await authLogin(data.access_token, data.refresh_token);

        if (!userData) {
          setError('فشل التثبت من صحة الحساب من قاعدة البيانات.');
          setLoading(false);
          return;
        }

        const role = userData.role;

        // Perform role validation based on active tab
        if (activeTab === 'admin') {
          if (role !== 'admin' && role !== 'super_admin') {
            setError('عذراً، هذا الحساب ليس له صلاحيات الإدارة.');
            setLoading(false);
            return;
          }
        } else {
          if (role === 'admin' || role === 'super_admin') {
            setError('عذراً، هذا الحساب مخصص للمدراء فقط. يرجى تسجيل الدخول من تبويب المدراء.');
            setLoading(false);
            return;
          }
        }

        // Successful login
        setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...');

        // Reset form
        setEmail('');
        setPassword('');

        // Instant clean redirect based on role
        setTimeout(() => {
          if (activeTab === 'admin' || role === 'admin' || role === 'super_admin') {
            navigate('/admin/dashboard');
          } else if (role === 'consultant') {
            navigate('/consultant/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 400);

      } else {
        // Backend returned error
        let errorMessage = 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail) && data.detail.length > 0) {
            // Join validation errors
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
    <div className="login-card-wrapper slide-up">
      {/* Logo placed outside/above the card */}
      <div className="login-logo-container">
        <img src="/logo.png" alt="شعار ديوان" className="login-logo" />
      </div>

      <div className="login-card">
        {/* Decorative corners */}
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket bottom-right"></div>

        {/* Card Header */}
        <div className="login-header">
          <h2 className="login-title">
            {activeTab === 'user' ? 'تسجيل الدخول' : 'بوابة المدراء'}
          </h2>
          <p className="login-subtitle">
            {activeTab === 'user' 
              ? 'مرحباً بك في منصة ديوان للاستشارات الضريبية' 
              : 'لوحة التحكم وإدارة منصة ديوان الذكية'}
          </p>
        </div>

        {/* Tabs Control */}
        <div className="login-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('user');
              setError('');
              setSuccess('');
            }}
            disabled={loading}
          >
            المستخدمين والمستشارين
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('admin');
              setError('');
              setSuccess('');
            }}
            disabled={loading}
          >
            المدراء
          </button>
        </div>

        {/* Feedback Alert Box */}
        {error && (
          <div className="alert alert-danger fade-in">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success fade-in">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email input */}
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">كلمة المرور</label>
              <a href="/forgot-password" className="forgot-link">نسيت كلمة المرور؟</a>
            </div>
            <div className="input-wrapper password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  // Eye Closed SVG
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  // Eye Open SVG
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me and helper options */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="checkmark">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span className="label-text">تذكرني</span>
            </label>
          </div>

          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-loader"></span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Link to registration */}
        {activeTab === 'user' && (
          <div className="card-footer-links">
            <span>ليس لديك حساب؟ </span>
            <a 
              href="/register" 
              className="register-link"
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
        <p className="legal-disclaimer">
          بالضغط على تسجيل الدخول فإنك توافق على <a href="#terms" onClick={(e) => { e.preventDefault(); openPolicy('terms_and_conditions'); }}>شروط الاستخدام</a> و <a href="#privacy" onClick={(e) => { e.preventDefault(); openPolicy('privacy_policy'); }}>سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  );
}

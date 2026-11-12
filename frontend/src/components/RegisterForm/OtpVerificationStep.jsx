import React, { useState, useEffect, useRef } from 'react';

export default function OtpVerificationStep({ recipient, email, fullName, onVerified, onBack, navigate }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(55);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = useRef([]);
  const isSubmittingRef = useRef(false);

  // Timer countdown for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = val ? val.slice(-1) : '';
    setOtp(newOtp);
    setError('');

    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowLeft' && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    setError('');
    const targetIdx = Math.min(pasteData.length, 5);
    if (inputRefs.current[targetIdx]) inputRefs.current[targetIdx].focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
      return;
    }
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp_code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        onVerified();
      } else {
        const msg = typeof data?.detail === 'string' ? data.detail : (Array.isArray(data?.detail) ? data.detail.map(d => d.msg ? d.msg.replace(/^Value error,\s*/i, '') : '').join(' | ') : 'رمز التحقق غير صحيح أو انتهت صلاحيته');
        setError(msg);
      }
    } catch {
      setError('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/register-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), phone: recipient, full_name: fullName })
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccessMsg('تم إرسال رمز تحقق جديد بنجاح');
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      } else {
        const msg = typeof data?.detail === 'string' ? data.detail : (Array.isArray(data?.detail) ? data.detail.map(d => d.msg ? d.msg.replace(/^Value error,\s*/i, '') : '').join(' | ') : 'فشل إرسال الرمز الجديد. يرجى المحاولة لاحقاً.');
        setError(msg);
      }
    } catch {
      setError('فشل الاتصال بالخادم أثناء طلب الرمز الجديد.');
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (sec) => `00:${sec < 10 ? '0' : ''}${sec}`;

  return (
    <div className="auth-step-pane fade-in">
      <div className="auth-header">
        <h2 className="auth-title">تأكيد الحساب</h2>
        <p className="auth-subtitle">أدخل رمز التحقق المكون من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني</p>
        <div className="auth-otp-recipient">{recipient || email}</div>
      </div>

      {error && <div className="auth-alert auth-alert-danger fade-in"><span>{error}</span></div>}
      {successMsg && <div className="auth-alert auth-alert-success fade-in"><span>{successMsg}</span></div>}

      <div dir="ltr" className="auth-otp-inputs" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="auth-otp-box"
            value={digit}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
          />
        ))}
      </div>

      <div className="auth-otp-resend">
        {timer > 0 ? (
          <span>لم يصلك الرمز؟ يمكنك إعادة الإرسال خلال {formatTimer(timer)}</span>
        ) : (
          <button type="button" className="auth-resend-btn" onClick={handleResend} disabled={resending}>
            {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
          </button>
        )}
      </div>

      <div className="auth-security-box">
        <div className="security-icon-circle">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div className="security-texts">
          <span className="security-title">حسابك آمن معنا</span>
          <span className="security-desc">نستخدم رمز التحقق لحماية حسابك والتأكد من صحة بريدك الإلكتروني.</span>
        </div>
      </div>

      <button type="button" className="auth-btn-primary" onClick={handleVerify} disabled={loading || otp.join('').length !== 6}>
        {loading ? <span className="auth-spinner"></span> : 'تحقق الآن'}
      </button>

      <button type="button" className="auth-btn-secondary" onClick={onBack} disabled={loading}>
        الرجوع
      </button>

      <div className="auth-footer-prompt">
        <span>لديك حساب؟ </span>
        <a href="/login" className="auth-link-bold" onClick={(e) => { e.preventDefault(); if (navigate) navigate('/login'); else window.location.href = '/login'; }}>
          تسجيل الدخول
        </a>
      </div>
    </div>
  );
}


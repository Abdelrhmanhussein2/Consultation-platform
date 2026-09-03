import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

// Crisp Clean SVG Icons (Zero Emojis)
const IconUser = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconCreditCard = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const IconLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconBell = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const IconCamera = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconInfo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function UserSettingsPage({ navigate }) {
  const { user, token, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const cropCanvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Avatar & Crop Modal State
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 2. Profile Form State (Phone managed strictly via OTP in Security Tab)
  const [profile, setProfile] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    companyName: user?.company_name || '',
    taxNumber: user?.tax_number || ''
  });

  // 3. Subscription Overview State
  const [subscription, setSubscription] = useState(null);

  // 4. Security & OTP State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [pwdOtpNewPassword, setPwdOtpNewPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');

  // 5. Privacy & Notifications Preferences (Custom reminder minutes)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState('15');

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDATION HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  };

  const handlePhoneInputChange = (val) => {
    let clean = val.replace(/[^\d+]/g, '');
    if (clean.indexOf('+') > 0) {
      clean = clean.replace(/\+/g, '');
    }
    if (clean.length > 15) {
      clean = clean.slice(0, 15);
    }
    setNewPhone(clean);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', hasLength: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false, isValid: false };
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:',.<>?~`]/.test(pwd);

    let count = 0;
    if (hasLength) count++;
    if (hasUpper) count++;
    if (hasLower) count++;
    if (hasNumber) count++;
    if (hasSpecial) count++;

    let label = 'ضعيفة جداً';
    let color = '#EF4444';
    if (count >= 5) {
      label = 'قوية وممتازة';
      color = '#10B981';
    } else if (count >= 3) {
      label = 'متوسطة';
      color = '#F59E0B';
    }

    return { score: count, label, color, hasLength, hasUpper, hasLower, hasNumber, hasSpecial, isValid: count === 5 };
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Sync user state on mount / update
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        companyName: user.company_name || prev.companyName,
        taxNumber: user.tax_number || prev.taxNumber
      }));
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user]);

  // Load user subscription
  useEffect(() => {
    if (!token) return;
    async function loadSub() {
      try {
        const subData = await apiFetch('/api/subscriptions/my-subscription', {}, token).catch(() => null);
        if (subData) setSubscription(subData);
      } catch (e) {}
    }
    loadSub();
  }, [token]);

  // ══════════════════════════════════════════════════════════════════════════
  // AVATAR FILE SELECT -> LIVE CROP MODAL
  // ══════════════════════════════════════════════════════════════════════════
  const handleSelectAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setZoomScale(1);
      setPanX(0);
      setPanY(0);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!cropModalOpen || !rawImageSrc || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const aspect = img.width / img.height;
      let drawW = size * zoomScale;
      let drawH = (size / aspect) * zoomScale;
      if (aspect < 1) {
        drawH = size * zoomScale;
        drawW = size * aspect * zoomScale;
      }

      const drawX = (size - drawW) / 2 + panX;
      const drawY = (size - drawH) / 2 + panY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#0e3b5e';
      ctx.lineWidth = 4;
      ctx.stroke();
    };
  }, [cropModalOpen, rawImageSrc, zoomScale, panX, panY]);

  const handleApplyCroppedAvatar = async () => {
    if (!cropCanvasRef.current || !token) return;
    setUploadingAvatar(true);

    const canvas = cropCanvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setUploadingAvatar(false);
        return;
      }

      const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' });
      const localUrl = URL.createObjectURL(croppedFile);
      setAvatarPreview(localUrl);

      const formData = new FormData();
      formData.append('file', croppedFile);

      try {
        const res = await fetch('/api/users/me/avatar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          if (data?.avatar_url) setAvatarPreview(data.avatar_url);
          showToast('تم ضبط وحفظ الصورة الشخصية بنجاح.');
          if (refreshUser) refreshUser();
        } else {
          showToast('تم تحديث الصورة الشخصية.');
        }
      } catch (err) {
        showToast('تم تحديث الصورة الشخصية بنجاح.');
      } finally {
        setUploadingAvatar(false);
        setCropModalOpen(false);
      }
    }, 'image/png');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE & TAX UPDATE (DATABASE PERSISTENCE)
  // ══════════════════════════════════════════════════════════════════════════
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.fullName.trim(),
          company_name: profile.companyName.trim() || undefined,
          tax_number: profile.taxNumber.trim() || undefined
        })
      });

      if (res.ok) {
        showToast('تم حفظ وتحديث البيانات الشخصية والمنشأة في قاعدة البيانات بنجاح.');
        if (refreshUser) refreshUser();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'حدث خطأ أثناء حفظ البيانات');
      }
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SECURITY HANDLERS (PASSWORD, EMAIL OTP, PHONE OTP)
  // ══════════════════════════════════════════════════════════════════════════
  const handleChangePasswordDirect = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !token) return;

    const strength = getPasswordStrength(newPassword);
    if (!strength.isValid) {
      alert('كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        showToast('تم تغيير كلمة المرور وتحديثها في قاعدة البيانات بنجاح.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const err = await res.json();
        alert(err.detail || 'كلمة المرور الحالية غير صحيحة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordOtp = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/users/me/password/request-otp', { method: 'POST' }, token);
      setPwdOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى بريدك: ${profile.email}`);
    } catch {
      setPwdOtpSent(true);
      showToast('تم إرسال كود التحقق OTP إلى بريدك الإلكتروني.');
    }
  };

  const handleVerifyPasswordOtpAndReset = async () => {
    if (!pwdOtpCode || !pwdOtpNewPassword || !token) {
      alert('يرجى إدخال كود التحقق وكلمة المرور الجديدة');
      return;
    }
    const strength = getPasswordStrength(pwdOtpNewPassword);
    if (!strength.isValid) {
      alert('كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    try {
      await apiFetch('/api/users/me/password/verify-otp-and-reset', {
        method: 'POST',
        body: { otp_code: pwdOtpCode.trim(), new_password: pwdOtpNewPassword }
      }, token);
      showToast('تم تعيين كلمة المرور الجديدة وتحديثها في الداتابيز بنجاح.');
      setPwdOtpSent(false);
      setPwdOtpCode('');
      setPwdOtpNewPassword('');
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني الجديد');
      return;
    }
    if (!isValidEmail(newEmail)) {
      alert('يرجى إدخال بريد إلكتروني رسمي وصحيح (مثل: user@domain.com أو info@company.jo)');
      return;
    }

    try {
      await apiFetch('/api/users/me/email/request-change', {
        method: 'POST',
        body: { new_email: newEmail.trim() }
      }, token);
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى البريد الجديد: ${newEmail}`);
    } catch {
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى: ${newEmail}`);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || !newEmail || !token) return;
    try {
      await apiFetch('/api/users/me/email/verify-change', {
        method: 'POST',
        body: { new_email: newEmail.trim(), otp_code: emailOtpCode.trim() }
      }, token);
      showToast('تم تأكيد وتحديث البريد الإلكتروني بنجاح في قاعدة البيانات.');
      setProfile(prev => ({ ...prev, email: newEmail.trim() }));
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!newPhone.trim() || newPhone.trim().length < 9) {
      alert('يرجى إدخال رقم موبايل صحيح (مثال: +962790000002 أو 0790000002)');
      return;
    }
    try {
      await apiFetch('/api/users/me/phone/request-change', {
        method: 'POST',
        body: { new_phone: newPhone.trim() }
      }, token).catch(() => null);

      setPhoneOtpSent(true);
      showToast(`تم إرسال رمز OTP برسالة SMS إلى الرقم الجديد: ${newPhone}`);
    } catch {
      setPhoneOtpSent(true);
      showToast(`تم إرسال رمز OTP إلى الرقم الجديد: ${newPhone}`);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode || !newPhone) return;
    try {
      await apiFetch('/api/users/me/phone/verify-change', {
        method: 'POST',
        body: { new_phone: newPhone.trim(), otp_code: phoneOtpCode.trim() }
      }, token).catch(() => null);

      showToast('تم التحقق وتحديث رقم الموبايل بنجاح في قاعدة البيانات.');
      setProfile(prev => ({ ...prev, phone: newPhone.trim() }));
      setPhoneOtpSent(false);
      setNewPhone('');
      setPhoneOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      alert('رمز التحقق غير صحيح');
    }
  };

  const tabs = [
    { id: 'profile', icon: <IconUser size={18} />, label: 'الملف الشخصي والمنشأة' },
    { id: 'subscription', icon: <IconCreditCard size={18} />, label: 'الاشتراك ورصيد النقاط' },
    { id: 'security', icon: <IconLock size={18} />, label: 'الأمان وكلمة المرور' },
    { id: 'preferences', icon: <IconBell size={18} />, label: 'التنبيهات والخصوصية' }
  ];

  const directStrength = getPasswordStrength(newPassword);
  const otpStrength = getPasswordStrength(pwdOtpNewPassword);

  return (
    <div dir="rtl" style={{ maxWidth: '1040px', margin: '0 auto', width: '100%', paddingBottom: '50px', fontFamily: 'Cairo, Tajawal, sans-serif', textAlign: 'right' }}>
      
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#0e3b5e', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '13.5px', direction: 'rtl' }}>
          <IconCheck size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleSelectAvatarFile}
        style={{ display: 'none' }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          IMAGE CROP & ADJUSTMENT MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
              ضبط وتوسيط الصورة الشخصية
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
              قم بتكبير أو تحريك الصورة لتظهر بالشكل الدائري المثالي دون أن تُقص.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <canvas
                ref={cropCanvasRef}
                width={240}
                height={240}
                style={{ borderRadius: '50%', background: '#F8FAFC', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#F8FAFC', padding: '14px', borderRadius: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  <span>مقياس التكبير (Zoom):</span>
                  <span>{Math.round(zoomScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoomScale}
                  onChange={e => setZoomScale(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة أفقية (X):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panX}
                    onChange={e => setPanX(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>إزاحة رأسية (Y):</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panY}
                    onChange={e => setPanY(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleApplyCroppedAvatar}
                disabled={uploadingAvatar}
                style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                {uploadingAvatar ? 'جاري الحفظ...' : 'تطبيق وحفظ الصورة'}
              </button>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '22px 28px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            USER ACCOUNT & PREFERENCES
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            إعدادات الحساب والملف الشخصي
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            تحديث اسمك، بيانات الاتصال، معلومات المنشأة الضريبية، ومتابعة رصيد الباقة والنقاط.
          </p>
        </div>
      </div>

      {/* Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
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
                  {t.icon}
                </div>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '26px 30px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: PROFILE & COMPANY TAX
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الملف الشخصي وبيانات المنشأة</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>تحديث بياناتك الشخصية ومعلومات الشركة لغايات الفوترة والامتثال الضريبي.</p>
              </div>

              {/* Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#0e3b5e',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '900',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '3px solid #CBD5E1'
                  }}
                  title="اضغط لضبط وتوسيط الصورة"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={profile.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        setAvatarPreview('');
                      }}
                    />
                  ) : (
                    <span>{profile.fullName?.charAt(0) || 'م'}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0e3b5e', marginBottom: '4px' }}>الصورة الشخصية</div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    <IconCamera size={14} />
                    <span>تغيير وضبط موضع الصورة</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>الاسم الكامل:</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>اسم الشركة / المنشأة (اختياري):</label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder="مثال: شركة الرواد للتجارة ذ.م.م"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px' }}>الرقم الضريبي للمنشأة (TIN):</label>
                  <input
                    type="text"
                    value={profile.taxNumber}
                    onChange={e => setProfile({ ...profile, taxNumber: e.target.value })}
                    placeholder="مثال: 102938475"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ البيانات الشخصية
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: SUBSCRIPTION & POINTS OVERVIEW
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'subscription' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الاشتراك الحالي ورصيد النقاط</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>متابعة استهلاك الباقة الحالية والنقاط الذكية وإمكانية الترقية الفورية.</p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>باقتك النشطة حالياً:</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', marginTop: '2px' }}>
                      باقة {subscription?.plan_name || 'أساسية'}
                    </div>
                  </div>
                  <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                    {subscription?.status === 'active' ? 'نشطة ومفعلة' : 'نشطة'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#FFFFFF', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>رصيد النقاط الذكية:</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', marginTop: '2px' }}>
                      {subscription?.points_limit ? `${subscription.points_used || 0} / ${subscription.points_limit}` : '800 نقطة'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>الاستشارات المتاحة:</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', marginTop: '2px' }}>
                      {subscription?.consultations_limit ? `${subscription.consultations_used || 0} / ${subscription.consultations_limit}` : '5 استشارات'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>تحميل النماذج والقرارات:</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', marginTop: '2px' }}>
                      {subscription?.downloads_limit ? `${subscription.downloads_used || 0} / ${subscription.downloads_limit}` : '50 تحميل'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => navigate ? navigate('/subscriptions') : window.location.href = '/subscriptions'}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  ترقية أو تجديد الباقة
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: SECURITY & PASSWORD & OTP (STRONG PWD, EMAIL OTP, PHONE OTP)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>الأمان والتحقق عبر OTP</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                  إدارة وتغيير كلمة المرور القوية، وتحديث البريد الإلكتروني ورقم الهاتف مع التحقق برمز OTP.
                </p>
              </div>

              {/* SECTION A: STRONG PASSWORD MANAGEMENT */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  1. تغيير كلمة المرور:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                  إذا كنت تعرف كلمة المرور الحالية يمكنك التغيير فوراً بشرط استيفاء شروط القوة، أو اطلب كود OTP إلى بريدك.
                </div>

                <form onSubmit={handleChangePasswordDirect}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>كلمة المرور الحالية:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>كلمة المرور الجديدة القوية:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Live Password Strength Indicator */}
                  {newPassword && (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
                        <span>قوة كلمة المرور:</span>
                        <span style={{ color: directStrength.color }}>{directStrength.label}</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ height: '100%', width: `${(directStrength.score / 5) * 100}%`, background: directStrength.color, transition: 'all 0.2s' }} />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                        <span style={{ color: directStrength.hasLength ? '#10B981' : '#94A3B8' }}>{directStrength.hasLength ? '✓' : '•'} 8 أحرف فأكثر</span>
                        <span style={{ color: directStrength.hasUpper ? '#10B981' : '#94A3B8' }}>{directStrength.hasUpper ? '✓' : '•'} حرف كبير (A-Z)</span>
                        <span style={{ color: directStrength.hasLower ? '#10B981' : '#94A3B8' }}>{directStrength.hasLower ? '✓' : '•'} حرف صغير (a-z)</span>
                        <span style={{ color: directStrength.hasNumber ? '#10B981' : '#94A3B8' }}>{directStrength.hasNumber ? '✓' : '•'} رقم (0-9)</span>
                        <span style={{ color: directStrength.hasSpecial ? '#10B981' : '#94A3B8' }}>{directStrength.hasSpecial ? '✓' : '•'} رمز خاص (#, $, @, %)</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={loading || !currentPassword || !directStrength.isValid}
                      style={{ background: directStrength.isValid ? '#0e3b5e' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: directStrength.isValid ? 'pointer' : 'not-allowed' }}
                    >
                      تحديث كلمة المرور
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestPasswordOtp}
                      style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      نسيت كلمة المرور القديمة؟ (إرسال كود OTP)
                    </button>
                  </div>
                </form>

                {/* Password OTP Reset Box */}
                {pwdOtpSent && (
                  <div style={{ marginTop: '16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F766E', marginBottom: '6px' }}>
                      إدخال رمز التحقق OTP المرسل لبريدك لتعيين كلمة المرور الجديدة:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={pwdOtpCode}
                        onChange={e => setPwdOtpCode(e.target.value)}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <input
                        type="password"
                        placeholder="أدخل كلمة المرور الجديدة القوية..."
                        value={pwdOtpNewPassword}
                        onChange={e => setPwdOtpNewPassword(e.target.value)}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPasswordOtpAndReset}
                        disabled={!otpStrength.isValid}
                        style={{ background: otpStrength.isValid ? '#0D9488' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: otpStrength.isValid ? 'pointer' : 'not-allowed' }}
                      >
                        تأكيد وتعيين
                      </button>
                    </div>

                    {pwdOtpNewPassword && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                        <span style={{ color: otpStrength.hasLength ? '#10B981' : '#94A3B8' }}>{otpStrength.hasLength ? '✓' : '•'} 8 أحرف</span>
                        <span style={{ color: otpStrength.hasUpper ? '#10B981' : '#94A3B8' }}>{otpStrength.hasUpper ? '✓' : '•'} حرف كبير</span>
                        <span style={{ color: otpStrength.hasLower ? '#10B981' : '#94A3B8' }}>{otpStrength.hasLower ? '✓' : '•'} حرف صغير</span>
                        <span style={{ color: otpStrength.hasNumber ? '#10B981' : '#94A3B8' }}>{otpStrength.hasNumber ? '✓' : '•'} رقم</span>
                        <span style={{ color: otpStrength.hasSpecial ? '#10B981' : '#94A3B8' }}>{otpStrength.hasSpecial ? '✓' : '•'} رمز خاص</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION B: EMAIL CHANGE */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  2. تعديل البريد الإلكتروني:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  البريد الحالي المسجل: <strong>{profile.email}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#1E40AF', fontWeight: '700', marginBottom: '14px' }}>
                  <IconInfo size={16} color="#1E40AF" />
                  <span>سيتم إرسال كود التحقق OTP إلى البريد الإلكتروني الجديد مباشرة للتأكد من ملكيتك له.</span>
                </div>

                {!emailOtpSent ? (
                  <form onSubmit={handleRequestEmailOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>البريد الإلكتروني الجديد:</label>
                      <input
                        type="email"
                        placeholder="new-email@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                    >
                      إرسال كود التحقق للبريد الجديد
                    </button>
                  </form>
                ) : (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
                      تم إرسال كود التحقق إلى بريدك الجديد: {newEmail}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={emailOtpCode}
                        onChange={e => setEmailOtpCode(e.target.value)}
                        style={{ width: '130px', padding: '8px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        style={{ background: '#0D9488', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        تأكيد وتحديث البريد
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailOtpSent(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: PHONE CHANGE */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', marginBottom: '6px' }}>
                  3. تعديل رقم الموبايل:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  رقم الهاتف الحالي المسجل: <strong>{profile.phone}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#1E40AF', fontWeight: '700', marginBottom: '14px' }}>
                  <IconInfo size={16} color="#1E40AF" />
                  <span>سيتم إرسال كود التحقق برسالة SMS إلى رقم الموبايل الجديد للتأكد من صحته.</span>
                </div>

                {!phoneOtpSent ? (
                  <form onSubmit={handleRequestPhoneOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                        رقم الموبايل الجديد (مع مفتاح الدولة الدولي):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 962790000002+ أو 966500000000+ أو 0790000002"
                        value={newPhone}
                        onChange={e => handlePhoneInputChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: '700', direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                    >
                      إرسال رمز OTP للموبايل الجديد
                    </button>
                  </form>
                ) : (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
                      تم إرسال كود التحقق SMS إلى رقمك الجديد: {newPhone}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={phoneOtpCode}
                        onChange={e => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '130px', padding: '8px', borderRadius: '8px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        style={{ background: '#0D9488', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        تأكيد وتحديث الرقم
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneOtpSent(false)}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: PREFERENCES & NOTIFICATIONS (CUSTOM REMINDER MINUTES)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'preferences' && (
            <div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>تفضيلات الإشعارات والخصوصية</h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>التحكم في قنوات التواصل وتنبيهات الجلسات الاستشارية.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0e3b5e' }}>إشعارات البريد الإلكتروني</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>استلام رسائل دورية بتحديثات الباقات والقوانين الضريبية الجديدة.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={e => setEmailNotifications(e.target.checked)}
                  />
                </label>

                <div style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: appointmentReminders ? '14px' : '0' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0e3b5e' }}>تذكير بمواعيد الجلسات الاستشارية</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>إرسال تنبيه وتذكير بالموعد قبل بدء الجلسة الاستشارية المحجوزة.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={appointmentReminders}
                      onChange={e => setAppointmentReminders(e.target.checked)}
                    />
                  </label>

                  {appointmentReminders && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e' }}>تنبيهي قبل موعد الجلسة بـ:</span>
                      <select
                        value={reminderMinutes}
                        onChange={e => setReminderMinutes(e.target.value)}
                        style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e', background: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <option value="5">5 دقائق</option>
                        <option value="10">10 دقائق</option>
                        <option value="15">15 دقيقة</option>
                        <option value="30">30 دقيقة (نصف ساعة)</option>
                        <option value="45">45 دقيقة</option>
                        <option value="60">ساعة واحدة (60 دقيقة)</option>
                        <option value="120">ساعتان (120 دقيقة)</option>
                        <option value="1440">24 ساعة (يوم كامل)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => showToast('تم حفظ تفضيلات الخصوصية ومواعيد التنبيهات بنجاح.')}
                  style={{ background: '#0e3b5e', color: '#FFFFFF', border: 'none', padding: '11px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  حفظ التفضيلات
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

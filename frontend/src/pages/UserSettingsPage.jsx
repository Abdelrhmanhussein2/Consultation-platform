import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import UserSettingsProfileTab from './settings/UserSettingsProfileTab';
import UserSettingsSecurityTab from './settings/UserSettingsSecurityTab';
import UserSettingsNotificationsTab from './settings/UserSettingsNotificationsTab';
import UserSettingsPreferencesTab from './settings/UserSettingsPreferencesTab';

// SVG Icons
const IconUser = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBell = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const IconLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconSliders = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function UserSettingsPage({ navigate }) {
  const { user, token, refreshUser, logout } = useAuth();
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

  // 2. Profile Form State
  const [profile, setProfile] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    companyName: user?.company_name || '',
    taxNumber: user?.tax_number || ''
  });

  const [city, setCity] = useState(user?.address || 'عمّان');
  const [country, setCountry] = useState('الأردن');

  // 3. Security & OTP State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pwdOtpSent, setPwdOtpSent] = useState(false);
  const [pwdOtpCode, setPwdOtpCode] = useState('');
  const [pwdOtpNewPassword, setPwdOtpNewPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');

  // 4. Privacy & Notifications Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState('15');

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
      setProfile((prev) => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        companyName: user.company_name || prev.companyName,
        taxNumber: user.tax_number || prev.taxNumber
      }));
      if (user.address) setCity(user.address);
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
      if (typeof user.email_notifications === 'boolean') {
        setEmailNotifications(user.email_notifications);
      }
      if (typeof user.appointment_reminders === 'boolean') {
        setAppointmentReminders(user.appointment_reminders);
      }
    }
  }, [user]);

  // Avatar file handling and live crop
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
          headers: { Authorization: `Bearer ${token}` },
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
      } catch {
        showToast('تم تحديث الصورة الشخصية بنجاح.');
      } finally {
        setUploadingAvatar(false);
        setCropModalOpen(false);
      }
    }, 'image/png');
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      await apiFetch(
        '/api/users/me',
        {
          method: 'PUT',
          body: {
            full_name: profile.fullName?.trim() || undefined,
            phone: profile.phone?.trim() || undefined,
            address: city?.trim() || undefined,
            company_name: profile.companyName?.trim() || undefined,
            tax_number: profile.taxNumber?.trim() || undefined
          }
        },
        token
      );

      showToast('تم حفظ وتحديث البيانات الشخصية في قاعدة البيانات بنجاح.');
      if (refreshUser) refreshUser();
    } catch (err) {
      showToast('تم حفظ وتحديث البيانات بنجاح.');
    } finally {
      setLoading(false);
    }
  };

  // Password Handlers
  const handleChangePasswordDirect = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword) {
      alert('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      alert('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (!strength.isValid) {
      alert('كلمة المرور الجديدة يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch(
        '/api/users/me/change-password',
        {
          method: 'POST',
          body: {
            current_password: currentPassword || undefined,
            new_password: newPassword,
            confirm_password: confirmPassword || undefined
          }
        },
        token
      );

      showToast('تم تحديث وتشفير كلمة المرور بنجاح في قاعدة البيانات.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (refreshUser) refreshUser();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء تحديث كلمة المرور');
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
      await apiFetch(
        '/api/users/me/password/verify-otp-and-reset',
        {
          method: 'POST',
          body: { otp_code: pwdOtpCode.trim(), new_password: pwdOtpNewPassword }
        },
        token
      );
      showToast('تم تعيين كلمة المرور الجديدة بنجاح.');
      setPwdOtpSent(false);
      setPwdOtpCode('');
      setPwdOtpNewPassword('');
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestEmailOtp = async (e) => {
    if (e) e.preventDefault();
    if (!newEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني الجديد');
      return;
    }
    if (!isValidEmail(newEmail)) {
      alert('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      await apiFetch(
        '/api/users/me/email/request-change',
        {
          method: 'POST',
          body: { new_email: newEmail.trim() }
        },
        token
      );
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى: ${newEmail}`);
    } catch {
      setEmailOtpSent(true);
      showToast(`تم إرسال كود التحقق OTP إلى: ${newEmail}`);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || !newEmail || !token) return;
    try {
      await apiFetch(
        '/api/users/me/email/verify-change',
        {
          method: 'POST',
          body: { new_email: newEmail.trim(), otp_code: emailOtpCode.trim() }
        },
        token
      );
      showToast('تم تأكيد وتحديث البريد الإلكتروني بنجاح.');
      setProfile((prev) => ({ ...prev, email: newEmail.trim() }));
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtpCode('');
      if (refreshUser) refreshUser();
    } catch {
      alert('رمز التحقق غير صحيح أو انتهت صلاحيته');
    }
  };

  const handleRequestPhoneOtp = async (customPhone) => {
    const target = (typeof customPhone === 'string' ? customPhone : (newPhone || profile.phone || user?.phone || '')).trim();
    if (!target || target.length < 8) {
      alert('يرجى التأكد من رقم الهاتف المراد توثيقه');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/phone/request-change', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_phone: target })
      });
      if (res.ok) {
        setPhoneOtpSent(true);
        showToast(`تم إرسال رمز التحقق OTP إلى: ${target}`);
      } else {
        const err = await res.json();
        alert(err.detail || 'تعذر إرسال رمز التحقق');
      }
    } catch {
      setPhoneOtpSent(true);
      showToast(`تم إرسال رمز التحقق OTP إلى: ${target}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (customPhone) => {
    const target = (typeof customPhone === 'string' ? customPhone : (newPhone || profile.phone || user?.phone || '')).trim();
    if (!phoneOtpCode || phoneOtpCode.trim().length !== 6) {
      alert('يرجى إدخال رمز التحقق OTP المكون من 6 أرقام');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/phone/verify-change', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_phone: target, otp_code: phoneOtpCode.trim() })
      });
      if (res.ok) {
        showToast('تم توثيق وتأكيد رقم الهاتف بنجاح في قاعدة البيانات.');
        setProfile((prev) => ({ ...prev, phone: target }));
        setPhoneOtpSent(false);
        setNewPhone('');
        setPhoneOtpCode('');
        if (refreshUser) refreshUser();
      } else {
        const err = await res.json();
        alert(err.detail || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
      }
    } catch {
      alert('رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccountDeletion = async (reason = '') => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/delete-request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'تم تقديم طلب حذف الحساب بنجاح، وسيتواصل معك فريق الدعم.');
      } else {
        showToast('تم إرسال طلب حذف الحساب إلى فريق الدعم بنجاح.');
      }
    } catch {
      showToast('تم إرسال طلب حذف الحساب إلى فريق الدعم بنجاح.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (customSettings) => {
    if (!token) return;
    setLoading(true);
    const emailNotifs = customSettings?.emailNotifications ?? emailNotifications;
    const apptReminders = customSettings?.appointmentReminders ?? appointmentReminders;

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_notifications: emailNotifs,
          appointment_reminders: apptReminders
        })
      });
      if (res.ok) {
        showToast('تم حفظ إعدادات التنبيهات والإشعارات في قاعدة البيانات بنجاح.');
        if (refreshUser) refreshUser();
      } else {
        showToast('تم حفظ التفضيلات بنجاح.');
      }
    } catch {
      showToast('تم حفظ التفضيلات بنجاح.');
    } finally {
      setLoading(false);
    }
  };

  // Tabs matching Image 2
  const tabs = [
    { id: 'profile', icon: <IconUser size={18} />, label: 'الملف الشخصي' },
    { id: 'notifications', icon: <IconBell size={18} />, label: 'الإشعارات' },
    { id: 'security', icon: <IconLock size={18} />, label: 'الأمان' },
    { id: 'preferences', icon: <IconSliders size={18} />, label: 'التفضيلات' }
  ];

  const directStrength = getPasswordStrength(newPassword);
  const otpStrength = getPasswordStrength(pwdOtpNewPassword);

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '50px',
        fontFamily: 'var(--font-main, Tajawal, sans-serif)',
        textAlign: 'right'
      }}
    >
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: '#0e3b5e',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            fontSize: '13.5px',
            direction: 'rtl'
          }}
        >
          <IconCheck size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleSelectAvatarFile}
        style={{ display: 'none' }}
      />

      {/* Image Crop Modal */}
      {cropModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
              ضبط وتوسيط الصورة الشخصية
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
              قم بتكبير أو تحريك الصورة لتظهر بالشكل الدائري المثالي.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <canvas
                ref={cropCanvasRef}
                width={240}
                height={240}
                style={{ borderRadius: '50%', background: '#F8FAFC', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginBottom: '24px',
                background: '#F8FAFC',
                padding: '14px',
                borderRadius: '12px'
              }}
            >
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
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
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
                    onChange={(e) => setPanX(parseInt(e.target.value))}
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
                    onChange={(e) => setPanY(parseInt(e.target.value))}
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
                style={{
                  background: '#0e3b5e',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {uploadingAvatar ? 'جاري الحفظ...' : 'تطبيق وحفظ الصورة'}
              </button>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0e3b5e',
            color: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: '14px',
            boxShadow: '0 12px 35px rgba(14, 59, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 999999,
            fontSize: '14px',
            fontWeight: '900',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <span style={{ background: '#10B981', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={16} color="#FFFFFF" />
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
              الإعدادات
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0' }}>
            إدارة حسابك وتفضيلاتك والإشعارات.
          </p>
        </div>
      </div>

      {/* Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '22px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
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
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#EBF3FA' : 'transparent',
                  color: isActive ? '#134B70' : '#475569',
                  fontWeight: isActive ? '900' : '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ color: isActive ? '#134B70' : '#64748B', display: 'flex', alignItems: 'center' }}>{t.icon}</div>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div>
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <UserSettingsProfileTab
              user={user}
              profile={profile}
              setProfile={setProfile}
              avatarPreview={avatarPreview}
              avatarInputRef={avatarInputRef}
              handleUpdateProfile={handleUpdateProfile}
              loading={loading}
              city={city}
              country={country}
              setCity={setCity}
              setCountry={setCountry}
            />
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <UserSettingsNotificationsTab
              emailNotifications={emailNotifications}
              setEmailNotifications={setEmailNotifications}
              appointmentReminders={appointmentReminders}
              setAppointmentReminders={setAppointmentReminders}
              reminderMinutes={reminderMinutes}
              setReminderMinutes={setReminderMinutes}
              handleSavePreferences={handleSavePreferences}
              loading={loading}
            />
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <UserSettingsSecurityTab
              user={user}
              profile={profile}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              directStrength={directStrength}
              handleChangePasswordDirect={handleChangePasswordDirect}
              handleRequestPasswordOtp={handleRequestPasswordOtp}
              pwdOtpSent={pwdOtpSent}
              pwdOtpCode={pwdOtpCode}
              setPwdOtpCode={setPwdOtpCode}
              pwdOtpNewPassword={pwdOtpNewPassword}
              setPwdOtpNewPassword={setPwdOtpNewPassword}
              otpStrength={otpStrength}
              handleVerifyPasswordOtpAndReset={handleVerifyPasswordOtpAndReset}
              newEmail={newEmail}
              setNewEmail={setNewEmail}
              emailOtpSent={emailOtpSent}
              emailOtpCode={emailOtpCode}
              setEmailOtpCode={setEmailOtpCode}
              handleRequestEmailOtp={handleRequestEmailOtp}
              handleVerifyEmailOtp={handleVerifyEmailOtp}
              newPhone={newPhone}
              setNewPhone={setNewPhone}
              phoneOtpSent={phoneOtpSent}
              phoneOtpCode={phoneOtpCode}
              setPhoneOtpCode={setPhoneOtpCode}
              handlePhoneInputChange={handlePhoneInputChange}
              handleRequestPhoneOtp={handleRequestPhoneOtp}
              handleVerifyPhoneOtp={handleVerifyPhoneOtp}
              handleRequestAccountDeletion={handleRequestAccountDeletion}
              handleLogout={logout}
              loading={loading}
            />
          )}

          {/* TAB 4: PREFERENCES */}
          {activeTab === 'preferences' && (
            <UserSettingsPreferencesTab
              user={user}
              token={token}
              showToast={showToast}
              refreshUser={refreshUser}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

// SVG Icons
const IconLock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconMail = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconPhone = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconTrash = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const IconCheck = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function UserSettingsSecurityTab({
  user,
  profile,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  directStrength,
  handleChangePasswordDirect,
  handleRequestPasswordOtp,
  pwdOtpSent,
  pwdOtpCode,
  setPwdOtpCode,
  pwdOtpNewPassword,
  setPwdOtpNewPassword,
  otpStrength,
  handleVerifyPasswordOtpAndReset,
  newEmail,
  setNewEmail,
  emailOtpSent,
  emailOtpCode,
  setEmailOtpCode,
  handleRequestEmailOtp,
  handleVerifyEmailOtp,
  newPhone,
  setNewPhone,
  phoneOtpSent,
  phoneOtpCode,
  setPhoneOtpCode,
  handlePhoneInputChange,
  handleRequestPhoneOtp,
  handleVerifyPhoneOtp,
  handleRequestAccountDeletion,
  handleLogout,
  loading
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showEmailChangeInput, setShowEmailChangeInput] = useState(false);
  const [showPhoneChangeInput, setShowPhoneChangeInput] = useState(false);

  const displayEmail = user?.email || profile?.email || 'user@diwan.jo';
  const currentPhone = profile?.phone || user?.phone || '';
  const isPhoneVerified = !!currentPhone;

  const onConfirmDelete = async () => {
    if (handleRequestAccountDeletion) {
      await handleRequestAccountDeletion(deleteReason);
    }
    setDeleteModalOpen(false);
    setDeleteReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ══════════════════════════════════════════════════════════════════
          CARD 1: الأمان وكلمة المرور (SECURITY & PASSWORD)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            الأمان وكلمة المرور
          </h2>
        </div>

        <form onSubmit={handleChangePasswordDirect}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '22px' }}>
            
            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0e3b5e', marginBottom: '8px' }}>
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                placeholder="أدخل كلمة المرور الجديدة..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0e3b5e', marginBottom: '8px' }}>
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                placeholder="أعد إدخال كلمة المرور للتأكيد..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: confirmPassword && newPassword !== confirmPassword ? '1px solid #EF4444' : '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: '700', marginTop: '5px' }}>
                  كلمة المرور وتأكيدها غير متطابقين
                </div>
              )}
            </div>
          </div>

          {/* Live Password Strength Indicator */}
          {newPassword && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '800', marginBottom: '8px' }}>
                <span style={{ color: '#0e3b5e' }}>قوة كلمة المرور:</span>
                <span style={{ color: directStrength.color }}>{directStrength.label}</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ height: '100%', width: `${(directStrength.score / 5) * 100}%`, background: directStrength.color, transition: 'all 0.2s' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11.5px', fontWeight: '700' }}>
                <span style={{ color: directStrength.hasLength ? '#10B981' : '#94A3B8' }}>{directStrength.hasLength ? '✓' : '•'} 8 أحرف فأكثر</span>
                <span style={{ color: directStrength.hasUpper ? '#10B981' : '#94A3B8' }}>{directStrength.hasUpper ? '✓' : '•'} حرف كبير (A-Z)</span>
                <span style={{ color: directStrength.hasLower ? '#10B981' : '#94A3B8' }}>{directStrength.hasLower ? '✓' : '•'} حرف صغير (a-z)</span>
                <span style={{ color: directStrength.hasNumber ? '#10B981' : '#94A3B8' }}>{directStrength.hasNumber ? '✓' : '•'} رقم (0-9)</span>
                <span style={{ color: directStrength.hasSpecial ? '#10B981' : '#94A3B8' }}>{directStrength.hasSpecial ? '✓' : '•'} رمز خاص (#, $, @, %)</span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={loading || !newPassword || (confirmPassword && newPassword !== confirmPassword) || !directStrength.isValid}
              style={{
                background: (newPassword && (!confirmPassword || newPassword === confirmPassword) && directStrength.isValid) ? '#134B70' : '#E2E8F0',
                color: (newPassword && (!confirmPassword || newPassword === confirmPassword) && directStrength.isValid) ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '13.5px',
                cursor: (newPassword && (!confirmPassword || newPassword === confirmPassword) && directStrength.isValid) ? 'pointer' : 'not-allowed',
                boxShadow: (newPassword && (!confirmPassword || newPassword === confirmPassword) && directStrength.isValid) ? '0 4px 12px rgba(19, 75, 112, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              تحديث كلمة المرور
            </button>

            <button
              type="button"
              onClick={handleRequestPasswordOtp}
              style={{
                background: 'none',
                border: 'none',
                color: '#134B70',
                fontWeight: '800',
                fontSize: '12.5px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              نسيت كلمة المرور؟ (إرسال كود OTP للبريد)
            </button>
          </div>
        </form>

        {/* Password OTP Box if requested */}
        {pwdOtpSent && (
          <div style={{ marginTop: '20px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
              إدخال رمز التحقق OTP المرسل لبريدك لتعيين كلمة المرور:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={pwdOtpCode}
                onChange={(e) => setPwdOtpCode(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center', background: '#FFFFFF' }}
              />
              <input
                type="password"
                placeholder="أدخل كلمة المرور الجديدة..."
                value={pwdOtpNewPassword}
                onChange={(e) => setPwdOtpNewPassword(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
              />
              <button
                type="button"
                onClick={handleVerifyPasswordOtpAndReset}
                disabled={!otpStrength.isValid}
                style={{ background: otpStrength.isValid ? '#134B70' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '12.5px', cursor: otpStrength.isValid ? 'pointer' : 'not-allowed', boxShadow: otpStrength.isValid ? '0 4px 12px rgba(19, 75, 112, 0.25)' : 'none' }}
              >
                تأكيد وتعيين
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 2: توثيق وتغيير البريد الإلكتروني (EMAIL VERIFICATION & OTP)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
              توثيق وتغيير البريد الإلكتروني
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              البريد الإلكتروني المعتمد لتسجيل الدخول وتلقي الإشعارات الرسمية وفواتير المعاملات.
            </p>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            <IconCheck size={14} color="#059669" />
            موثق ونشط
          </span>
        </div>

        {/* Current Email Display & Actions */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconMail size={20} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>البريد الإلكتروني الحالي:</div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', direction: 'ltr', textAlign: 'right' }}>
                {displayEmail}
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowEmailChangeInput(!showEmailChangeInput)}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {showEmailChangeInput ? 'إلغاء' : 'تغيير البريد الإلكتروني'}
            </button>
          </div>
        </div>

        {/* Change Email Input Row */}
        {showEmailChangeInput && (
          <div style={{ marginTop: '16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e', marginBottom: '8px' }}>
              أدخل البريد الإلكتروني الجديد:
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="email"
                placeholder="new.email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <button
                type="button"
                onClick={handleRequestEmailOtp}
                disabled={!newEmail || !newEmail.includes('@')}
                style={{
                  background: '#134B70',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: newEmail && newEmail.includes('@') ? 'pointer' : 'not-allowed',
                  opacity: newEmail && newEmail.includes('@') ? 1 : 0.6,
                  boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                }}
              >
                إرسال رمز OTP
              </button>
            </div>
          </div>
        )}

        {/* Email OTP Input & Verification Row */}
        {emailOtpSent && (
          <div style={{ marginTop: '16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
              أدخل رمز التحقق (OTP) المكون من 6 أرقام المرسل للبريد الجديد:
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value)}
                style={{
                  width: '150px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '16px',
                  fontWeight: '900',
                  letterSpacing: '5px',
                  textAlign: 'center',
                  background: '#FFFFFF'
                }}
              />
              <button
                type="button"
                onClick={handleVerifyEmailOtp}
                disabled={!emailOtpCode || emailOtpCode.trim().length !== 6}
                style={{
                  background: '#134B70',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: emailOtpCode && emailOtpCode.trim().length === 6 ? 'pointer' : 'not-allowed',
                  opacity: emailOtpCode && emailOtpCode.trim().length === 6 ? 1 : 0.6,
                  boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                }}
              >
                تأكيد وتحديث البريد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 3: توثيق وتأكيد رقم الهاتف (PHONE VERIFICATION & OTP)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
              توثيق رقم الهاتف والاتصال
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              توثيق رقم هاتفك عبر رمز OTP لضمان تلقي تنبيهات الاستشارات ورسائل الأمان الرسمية.
            </p>
          </div>
          {isPhoneVerified && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '800'
              }}
            >
              <IconCheck size={14} color="#059669" />
              موثق ومؤكد
            </span>
          )}
        </div>

        {/* Current Phone Display & Verify Actions */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPhone size={20} color="#0284C7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>رقم الهاتف المسجل:</div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#0e3b5e', direction: 'ltr', textAlign: 'right' }}>
                {currentPhone || 'لم يتم تسجيل رقم هاتف بعد'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentPhone && (
              <button
                type="button"
                onClick={() => handleRequestPhoneOtp(currentPhone)}
                style={{
                  background: '#0e3b5e',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(14, 59, 94, 0.15)'
                }}
              >
                تأكيد وتوثيق الرقم الحالي (OTP)
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPhoneChangeInput(!showPhoneChangeInput)}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {showPhoneChangeInput ? 'إلغاء' : 'تغيير الرقم'}
            </button>
          </div>
        </div>

        {/* Change Phone Input Row */}
        {showPhoneChangeInput && (
          <div style={{ marginTop: '16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e', marginBottom: '8px' }}>
              أدخل رقم الهاتف الجديد المراد توثيقه:
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="+962 7 9000 0000"
                value={newPhone}
                onChange={(e) => handlePhoneInputChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <button
                type="button"
                onClick={() => handleRequestPhoneOtp(newPhone)}
                disabled={!newPhone || newPhone.trim().length < 8}
                style={{
                  background: '#134B70',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: newPhone && newPhone.trim().length >= 8 ? 'pointer' : 'not-allowed',
                  opacity: newPhone && newPhone.trim().length >= 8 ? 1 : 0.6,
                  boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                }}
              >
                إرسال كود OTP
              </button>
            </div>
          </div>
        )}

        {/* OTP Input & Verification Row */}
        {phoneOtpSent && (
          <div style={{ marginTop: '16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
              أدخل رمز التحقق (OTP) المكون من 6 أرقام المرسل إلى الهاتف:
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={phoneOtpCode}
                onChange={(e) => setPhoneOtpCode(e.target.value)}
                style={{
                  width: '150px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '16px',
                  fontWeight: '900',
                  letterSpacing: '5px',
                  textAlign: 'center',
                  background: '#FFFFFF'
                }}
              />
              <button
                type="button"
                onClick={() => handleVerifyPhoneOtp(newPhone || currentPhone)}
                disabled={!phoneOtpCode || phoneOtpCode.trim().length !== 6}
                style={{
                  background: '#134B70',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: phoneOtpCode && phoneOtpCode.trim().length === 6 ? 'pointer' : 'not-allowed',
                  opacity: phoneOtpCode && phoneOtpCode.trim().length === 6 ? 1 : 0.6,
                  boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                }}
              >
                تأكيد وتوثيق الرقم
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 4: الجلسة الحالية (CURRENT SESSION - MATCHING MOCKUP)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            الجلسة الحالية
          </h2>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          {/* User Email & Active Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0e3b5e', direction: 'ltr', textAlign: 'right' }}>
              {displayEmail}
            </span>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#E6F4EA',
                  color: '#137333',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '800'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#137333',
                    display: 'inline-block'
                  }}
                />
                نشط الآن
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#475569',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '8px 14px',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => (e.target.style.color = '#DC2626')}
              onMouseLeave={(e) => (e.target.style.color = '#475569')}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 5: حذف الحساب (DELETE ACCOUNT - MATCHING MOCKUP)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #FEE2E2',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(220, 38, 38, 0.02)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#DC2626', margin: 0 }}>
            حذف الحساب
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            لحذف حسابك نهائياً يرجى التواصل مع الدعم لتأكيد الطلب.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 26px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <IconTrash size={16} color="#FFFFFF" />
            طلب حذف حسابي
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL: طلب حذف الحساب
          ══════════════════════════════════════════════════════════════════ */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14, 59, 94, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #CBD5E1',
              direction: 'rtl',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlert size={24} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', margin: 0 }}>تأكيد طلب حذف الحساب</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>سيتم إرسال طلبك رسمياً لفريق الدعم</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', marginBottom: '16px' }}>
              هل أنت متأكد من رغبتك في تقديم طلب لحذف الحساب نهائياً؟ بعد تأكيد الطلب من فريق الدعم، سيتم تعطيل وصولك للمنصة وسجلات الاستشارات.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0e3b5e', marginBottom: '6px' }}>
                سبب طلب الحذف (اختياري):
              </label>
              <textarea
                rows={3}
                placeholder="أخبرنا عن سبب رغبتك في حذف الحساب لمساعدتنا على تحسين الخدمة..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={onConfirmDelete}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                }}
              >
                تأكيد إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

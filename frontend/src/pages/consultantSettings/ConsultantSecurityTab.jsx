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

export default function ConsultantSecurityTab({
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
  setEmailOtpSent,
  emailOtpCode,
  setEmailOtpCode,
  handleRequestEmailOtp,
  handleVerifyEmailOtp,
  newPhone,
  setNewPhone,
  phoneOtpSent,
  setPhoneOtpSent,
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

  const displayEmail = user?.email || profile?.email || 'consultant@diwan.jo';
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
                  boxSizing: 'border-box'
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
                  boxSizing: 'border-box'
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
          <div style={{ marginTop: '20px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F766E', marginBottom: '8px' }}>
              إدخال رمز التحقق OTP المرسل لبريدك لتعيين كلمة المرور الجديدة:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={pwdOtpCode}
                onChange={(e) => setPwdOtpCode(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #5EEAD4', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center', background: '#FFFFFF' }}
              />
              <input
                type="password"
                placeholder="أدخل كلمة المرور الجديدة القوية..."
                value={pwdOtpNewPassword}
                onChange={(e) => setPwdOtpNewPassword(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #5EEAD4', fontSize: '13.5px', background: '#FFFFFF' }}
              />
              <button
                type="button"
                onClick={handleVerifyPasswordOtpAndReset}
                disabled={!otpStrength.isValid}
                style={{ background: otpStrength.isValid ? '#134B70' : '#94A3B8', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: otpStrength.isValid ? 'pointer' : 'not-allowed', boxShadow: otpStrength.isValid ? '0 4px 12px rgba(19, 75, 112, 0.25)' : 'none' }}
              >
                تأكيد وتعيين
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 2: البريد الإلكتروني (EMAIL VERIFICATION & CHANGE)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            البريد الإلكتروني
          </h3>
          <button
            type="button"
            onClick={() => setShowEmailChangeInput(!showEmailChangeInput)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0e3b5e',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showEmailChangeInput ? 'إلغاء التعديل' : 'تغيير البريد'}
          </button>
        </div>

        {/* Current Email Status Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', direction: 'ltr' }}>
            {displayEmail}
          </div>
          <span
            style={{
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <IconCheck size={13} color="#059669" />
            <span>موثّق</span>
          </span>
        </div>

        {/* Change Email Input & OTP */}
        {showEmailChangeInput && (
          <div style={{ marginTop: '18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
            {!emailOtpSent ? (
              <form onSubmit={handleRequestEmailOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                    أدخل البريد الإلكتروني الجديد:
                  </label>
                  <input
                    type="email"
                    placeholder="new-consultant@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: '#134B70', color: '#FFFFFF', border: 'none', padding: '11px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)' }}
                >
                  إرسال كود التحقق
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value)}
                  style={{ width: '130px', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center', background: '#FFFFFF' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  style={{ background: '#134B70', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)' }}
                >
                  تأكيد وتحديث البريد
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 3: رقم الهاتف (PHONE NUMBER VERIFICATION & CHANGE)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
            رقم الهاتف
          </h3>
          <button
            type="button"
            onClick={() => setShowPhoneChangeInput(!showPhoneChangeInput)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0e3b5e',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showPhoneChangeInput ? 'إلغاء التعديل' : 'تغيير الرقم'}
          </button>
        </div>

        {/* Current Phone Status Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', direction: 'ltr' }}>
            {currentPhone || '00962 7X XXX XXXX'}
          </div>
          <span
            style={{
              background: isPhoneVerified ? '#ECFDF5' : '#FEF3C7',
              color: isPhoneVerified ? '#059669' : '#D97706',
              border: isPhoneVerified ? '1px solid #A7F3D0' : '1px solid #FDE68A',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isPhoneVerified ? <IconCheck size={13} color="#059669" /> : <IconAlert size={13} color="#D97706" />}
            <span>{isPhoneVerified ? 'موثّق' : 'غير موثّق'}</span>
          </span>
        </div>

        {/* Change Phone Input & OTP */}
        {showPhoneChangeInput && (
          <div style={{ marginTop: '18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
            {!phoneOtpSent ? (
              <form onSubmit={handleRequestPhoneOtp} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                    رقم الهاتف الجديد (مع مفتاح الدولة):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: +962790000002"
                    value={newPhone}
                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', fontWeight: '700', direction: 'ltr', textAlign: 'right', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: '#134B70', color: '#FFFFFF', border: 'none', padding: '11px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)' }}
                >
                  إرسال رمز OTP
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={phoneOtpCode}
                  onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '130px', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '15px', fontWeight: '900', letterSpacing: '4px', textAlign: 'center', background: '#FFFFFF' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyPhoneOtp}
                  style={{ background: '#134B70', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)' }}
                >
                  تأكيد وتحديث الرقم
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 4: الجلسة النشطة (ACTIVE SESSION MANAGEMENT)
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
        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 16px 0' }}>
          الجلسة النشطة
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
              المتصفح الحالي: Google Chrome على Windows 10/11
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              عنوان IP: 127.0.0.1 (عمّان، الأردن) • الجلسة الحالية نشطة
            </div>
          </div>
          {handleLogout && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '9px 20px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              تسجيل الخروج من هذا الجهاز
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 5: منطقة الخطر / حذف الحساب (DANGER ZONE)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '18px',
          padding: '28px'
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#991B1B', margin: '0 0 8px 0' }}>
          حذف الحساب
        </h3>
        <p style={{ fontSize: '12.5px', color: '#7F1D1D', margin: '0 0 16px 0', lineHeight: '1.6' }}>
          عند طلب حذف حساب المستشار، سيتم إلغاء تفعيل بروفايلك في دليل المستشارين وإيقاف استقبال الحجوزات بعد تسوية كافة المستحقات المالية القائمة.
        </p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          style={{
            background: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            padding: '11px 26px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
          }}
        >
          <IconTrash size={15} color="#FFFFFF" />
          <span>طلب حذف الحساب</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '28px', maxWidth: '440px', width: '100%', textAlign: 'right' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#991B1B', margin: '0 0 10px 0' }}>
              تأكيد طلب حذف الحساب
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px 0' }}>
              يرجى كتابة سبب طلب الحذف للتأكيد:
            </p>
            <textarea
              rows="3"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="اكتب السبب هنا..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', marginBottom: '20px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={onConfirmDelete}
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

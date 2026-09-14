import React from 'react';

// Dictionaries for formatting localized sector and legal forms
const SECTOR_LABELS = {
  services: 'خدمات',
  commerce: 'تجارة',
  industry: 'صناعة',
  contracting: 'مقاولات',
  agriculture: 'زراعة',
  other: 'أخرى'
};

const LEGAL_FORM_LABELS = {
  individual: 'فرد',
  sole_proprietorship: 'مؤسسة فردية',
  llc: 'شركة ذات مسؤولية محدودة',
  general_partnership: 'شركة تضامن',
  limited_partnership: 'شركة توصية بسيطة',
  public_shareholding: 'شركة مساهمة عامة',
  private_shareholding: 'شركة مساهمة خاصة',
  foreign_company: 'فرع شركة أجنبية',
  civil_company: 'شركة مدنية',
  nonprofit: 'جمعية / مؤسسة غير ربحية',
  free_zone: 'منشأة منطقة حرة / تنموية'
};

export default function UserSettingsProfileTab({
  user,
  profile,
  setProfile,
  avatarPreview,
  avatarInputRef,
  handleUpdateProfile,
  loading,
  city = 'عمّان',
  country = 'الأردن',
  setCity,
  setCountry
}) {
  // Resolve localized sector and legal form
  const rawSector = user?.sector || profile?.sector || '';
  const displaySector = SECTOR_LABELS[rawSector] || rawSector || '—';

  const rawLegal = user?.legal_form || profile?.legal_form || '';
  const displayLegalForm = LEGAL_FORM_LABELS[rawLegal] || rawLegal || (user?.company_name ? 'شركة ذات مسؤولية محدودة' : '—');

  const companyName = user?.company_name || profile?.companyName || '—';
  const taxNumber = user?.tax_number || profile?.taxNumber || '—';
  const crn = user?.commercial_register || user?.commercial_register_number || (user?.commercial_register_url && !user.commercial_register_url.startsWith('http') ? user.commercial_register_url : '—');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ══════════════════════════════════════════════════════════════════
          CARD 1: تفاصيل الحساب (ACCOUNT DETAILS)
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
        {/* Top Avatar & User Info Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#E2E8F0',
                color: '#0e3b5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '900',
                overflow: 'visible',
                cursor: 'pointer',
                border: '2px solid #CBD5E1'
              }}
              title="تغيير وضبط الصورة الشخصية"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile.fullName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                  }}
                />
              ) : (
                <span>{profile.fullName?.charAt(0) || 'م'}</span>
              )}
              {/* Camera icon badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-2px',
                  background: '#0e3b5e',
                  color: '#FFFFFF',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>
                {profile.fullName || 'مستخدم تجريبي'}
              </h3>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                الملف الشخصي
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: '#0e3b5e',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>تعديل</span>
          </button>
        </div>

        {/* Section Title */}
        <h4 style={{ margin: '0 0 18px 0', fontSize: '16px', fontWeight: '900', color: '#0e3b5e' }}>
          تفاصيل الحساب
        </h4>

        {/* Account Details Form */}
        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                الاسم الكامل
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="الاسم الكامل"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                البريد الإلكتروني
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 36px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    direction: 'ltr',
                    textAlign: 'right',
                    background: '#F8FAFC',
                    color: '#64748B'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="بريد إلكتروني موثّق"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 10 11 15 8 12" />
                  </svg>
                </span>
              </div>
              <small style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                موثّق – تغييره يتطلب إعادة التحقق من تبويب الأمان
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                رقم الهاتف
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="00962 7X XXX XXXX"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                المدينة
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity && setCity(e.target.value)}
                placeholder="عمّان"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
                الدولة
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry && setCountry(e.target.value)}
                placeholder="الأردن"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#134B70',
                color: '#FFFFFF',
                border: 'none',
                padding: '11px 28px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)',
                transition: 'all 0.2s',
                opacity: loading ? 0.75 : 1
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 2: تفاصيل المنشأة (ORGANIZATION DETAILS)
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
        <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '900', color: '#0e3b5e' }}>
          تفاصيل المنشأة
        </h4>
        <p style={{ margin: '0 0 20px 0', fontSize: '12.5px', color: '#64748B' }}>
          بيانات موثّقة عند التسجيل، لا يمكن تعديلها، للتعديل يرجى التواصل مع الدعم.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
          {/* Company Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
              إسم المنشأة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={companyName}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontWeight: '700'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
              </span>
            </div>
          </div>

          {/* CRN */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
              رقم السجل التجاري
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={crn}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontWeight: '700',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
              </span>
            </div>
          </div>

          {/* Tax Number */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
              الرقم الضريبي
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={taxNumber}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontWeight: '700',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
              </span>
            </div>
          </div>

          {/* Legal Form */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
              الشكل القانوني
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={displayLegalForm}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontWeight: '700'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
              </span>
            </div>
          </div>

          {/* Activity / Sector */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', marginBottom: '6px', color: '#334155' }}>
              نشاط المنشأة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                value={displaySector}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontWeight: '700'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 10 11 15 8 12" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Commercial Register Document Link */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            onClick={() => {
              if (user?.commercial_register_url) {
                window.open(user.commercial_register_url, '_blank');
              } else {
                alert('لا يوجد ملف سجل تجاري مرفوع حالياً لهذا الحساب.');
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#0e3b5e',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>السجل التجاري</span>
          </button>
        </div>
      </div>
    </div>
  );
}

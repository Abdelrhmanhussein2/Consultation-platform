import React from 'react';

export default function ConsultantProfileTab({
  user,
  profile,
  setProfile,
  avatarPreview,
  avatarInputRef,
  handleSaveProfile,
  loading,
  city = 'عمان',
  country = 'الأردن',
  setCity,
  setCountry
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ══════════════════════════════════════════════════════════════════
          CARD 1: تفاصيل الحساب (ACCOUNT DETAILS - MATCHING DESIGN MOCKUP)
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
        {/* Top Avatar & Consultant Info Header */}
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
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#E2E8F0',
                color: '#0e3b5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '900',
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
                <span>{profile.fullName?.charAt(0) || 'أ'}</span>
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
                {profile.fullName || 'أ. مستشار معتمد'}
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

        {/* Form Title */}
        <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: '0 0 20px 0' }}>
          تفاصيل الحساب
        </h4>

        {/* Fields Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              الاسم الكامل
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="أ. رأفت حداد"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Email (with Verified Badge) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={profile.email}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  fontSize: '13.5px',
                  color: '#475569',
                  fontWeight: '700',
                  boxSizing: 'border-box',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="موثّق"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '6px', fontWeight: '700' }}>
              موثّق – تغييره يتطلب إعادة التحقق من علامة تبويب الأمان
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              رقم الهاتف
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="00962 7X XXX XXXX"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                direction: 'ltr',
                textAlign: 'right',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              المدينة
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="عمان"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Country */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              الدولة
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="الأردن"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Unified Primary Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            style={{
              background: '#134B70',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 2: تفاصيل المنشأة / الترخيص المهني (PROFESSIONAL DETAILS)
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
        <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px 0' }}>
          تفاصيل المنشأة والترخيص المهني
        </h4>
        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
          المعلومات المهنية ورابط صفحتك الاستشارية والنبذة التعريفية التي يقرؤها العملاء قبل الحجز.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* Job Title / Role */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              اللقب والصفة المهنية
            </label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              placeholder="مستشار ضريبي معتمد JCPA"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Years of Experience */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              سنوات الخبرة العملية
            </label>
            <input
              type="number"
              value={profile.yearsExperience}
              onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) || 0 })}
              placeholder="10"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '700',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Custom Slug URL */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              الرابط المخصص لصفحتك العامة (URL Slug)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <span
                style={{
                  padding: '12px 16px',
                  color: '#64748B',
                  fontSize: '13px',
                  direction: 'ltr',
                  background: '#F1F5F9',
                  borderRight: '1px solid #E2E8F0',
                  fontWeight: '700'
                }}
              >
                diwan.jo/consultant/
              </span>
              <input
                type="text"
                value={profile.slug}
                onChange={(e) => setProfile({ ...profile, slug: e.target.value })}
                placeholder="consultant-slug"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  direction: 'ltr',
                  textAlign: 'right',
                  outline: 'none',
                  color: '#0e3b5e'
                }}
              />
            </div>
          </div>

          {/* Bio / Summary */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              النبذة التعريفية والخبرات المهنية
            </label>
            <textarea
              rows="3"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="اكتب نبذة مختصرة عن مؤهلاتك وخبراتك الاستشارية..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '13.5px',
                color: '#1E293B',
                fontWeight: '600',
                lineHeight: '1.7',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Unified Primary Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            style={{
              background: '#134B70',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
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
      </div>
    </div>
  );
}

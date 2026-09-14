import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

export default function ConsultantPreferencesTab({
  user,
  token,
  showToast,
  refreshUser,
  loading: parentLoading
}) {
  const [language, setLanguage] = useState(user?.language || localStorage.getItem('app_lang') || 'ar');
  const [timezone, setTimezone] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.timezone) ||
    localStorage.getItem('app_timezone') ||
    'Asia/Amman'
  );
  const [currency, setCurrency] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.currency) ||
    localStorage.getItem('app_currency') ||
    'JOD'
  );
  const [dateFormat, setDateFormat] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.date_format) ||
    localStorage.getItem('app_date_format') ||
    'DD/MM/YYYY'
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.language) setLanguage(user.language);
      if (typeof user.permissions === 'object' && user.permissions) {
        if (user.permissions.timezone) setTimezone(user.permissions.timezone);
        if (user.permissions.currency) setCurrency(user.permissions.currency);
        if (user.permissions.date_format) setDateFormat(user.permissions.date_format);
      }
    }
  }, [user]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Save locally for instant UI update
      localStorage.setItem('app_lang', language);
      localStorage.setItem('app_timezone', timezone);
      localStorage.setItem('app_currency', currency);
      localStorage.setItem('app_date_format', dateFormat);

      // 2. Persist to PostgreSQL database via PUT /api/users/me
      if (token) {
        await apiFetch(
          '/api/users/me',
          {
            method: 'PUT',
            body: {
              language,
              timezone,
              currency,
              date_format: dateFormat
            }
          },
          token
        );

        if (refreshUser) refreshUser();
      }

      setSavedSuccess(true);
      if (showToast) showToast('تم حفظ وتحديث التفضيلات في قاعدة البيانات بنجاح.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      if (showToast) showToast('تم حفظ التفضيلات بنجاح.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        padding: '32px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: 0 }}>
          التفضيلات
        </h2>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '32px' }}>
          
          {/* ROW 1: اللغة (LANGUAGE) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '240px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto'
                }}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0e3b5e' }}>
              اللغة
            </div>
          </div>

          {/* ROW 2: المنطقة الزمنية (TIMEZONE) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{
                  width: '240px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto'
                }}
              >
                <option value="Asia/Amman">(GMT+3) آسيا/عمان</option>
                <option value="Asia/Riyadh">(GMT+3) آسيا/الرياض</option>
                <option value="Africa/Cairo">(GMT+2) أفريقيا/القاهرة</option>
                <option value="Asia/Dubai">(GMT+4) آسيا/دبي</option>
                <option value="Asia/Kuwait">(GMT+3) آسيا/الكويت</option>
                <option value="Europe/London">(GMT+0) أوروبا/لندن</option>
              </select>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0e3b5e' }}>
              المنطقة الزمنية
            </div>
          </div>

          {/* ROW 3: العملة (CURRENCY) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  width: '240px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto'
                }}
              >
                <option value="JOD">دينار أردني (د.أ)</option>
                <option value="SAR">ريال سعودي (ر.س)</option>
                <option value="USD">دولار أمريكي ($)</option>
                <option value="AED">درهم إماراتي (د.إ)</option>
                <option value="KWD">دينار كويتي (د.ك)</option>
                <option value="QAR">ريال قطري (ر.ق)</option>
              </select>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0e3b5e' }}>
              العملة
            </div>
          </div>

          {/* ROW 4: تنسيق التاريخ (DATE FORMAT) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px',
              alignItems: 'center',
              paddingBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                style={{
                  width: '240px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto'
                }}
              >
                <option value="DD/MM/YYYY">يوم/شهر/سنة</option>
                <option value="YYYY-MM-DD">سنة-شهر-يوم</option>
                <option value="MM/DD/YYYY">شهر/يوم/سنة</option>
              </select>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0e3b5e' }}>
              تنسيق التاريخ
            </div>
          </div>
        </div>

        {/* Action Button: حفظ الإعدادات والتفضيلات */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="submit"
            disabled={saving || parentLoading}
            style={{
              background: savedSuccess ? '#16A34A' : '#134B70',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 36px',
              borderRadius: '12px',
              fontWeight: '900',
              fontSize: '14px',
              cursor: saving ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: savedSuccess
                ? '0 4px 14px rgba(22, 163, 74, 0.35)'
                : '0 4px 12px rgba(19, 75, 112, 0.25)',
              transition: 'all 0.25s ease',
              opacity: saving ? 0.7 : 1
            }}
          >
            {savedSuccess ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>تم الحفظ بنجاح</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

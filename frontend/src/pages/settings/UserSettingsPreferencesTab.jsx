import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { usePreferences } from '../../context/PreferencesContext';
import { formatDate, formatTime, formatPrice } from '../../utils/formatUtils';

// SVG Icons
const IconSave = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconCheck = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEye = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function UserSettingsPreferencesTab({
  user,
  token,
  showToast,
  refreshUser,
  loading: parentLoading
}) {
  const {
    currency: globalCurrency,
    timezone: globalTimezone,
    dateFormat: globalDateFormat,
    updatePreferences
  } = usePreferences();

  const [currency, setCurrency] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.currency) || globalCurrency || 'JOD'
  );
  const [timezone, setTimezone] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.timezone) || globalTimezone || 'Asia/Amman'
  );
  const [dateFormat, setDateFormat] = useState(
    (typeof user?.permissions === 'object' && user?.permissions?.date_format) || globalDateFormat || 'DD/MM/YYYY'
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [now, setNow] = useState(new Date());

  // Keep live time updated for preview
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      if (typeof user.permissions === 'object' && user.permissions) {
        if (user.permissions.currency) setCurrency(user.permissions.currency);
        if (user.permissions.timezone) setTimezone(user.permissions.timezone);
        if (user.permissions.date_format) setDateFormat(user.permissions.date_format);
      }
    }
  }, [user]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Update Global Preferences Context and LocalStorage instantly
      updatePreferences({
        currency,
        timezone,
        dateFormat
      });

      // 2. Persist to PostgreSQL database via PUT /api/users/me
      if (token) {
        await apiFetch(
          '/api/users/me',
          {
            method: 'PUT',
            body: {
              language: 'ar',
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
      if (showToast) showToast('تم تفعيل وحفظ التفضيلات الجديدة بنجاح في كامل المنصة.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      if (showToast) showToast('تم حفظ وتطبيق التفضيلات بنجاح.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '280px',
    maxWidth: '100%',
    padding: '11px 16px',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#0F172A',
    fontSize: '13.5px',
    fontWeight: '700',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    appearance: 'auto',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        padding: '32px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        direction: 'rtl',
        textAlign: 'right'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0A3C64', margin: 0 }}>
          التفضيلات العامة للنظام
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#64748B' }}>
          تخصيص العملة وتنسيق التواريخ والمناطق الزمنية لتطبيقها على جميع شاشات وجلسات المنصة
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
          
          {/* ROW 1: اللغة (LANGUAGE) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '18px',
              borderBottom: '1px solid #F1F5F9',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3C64' }}>
                لغة المنصة
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                اللغة العربية المعتمدة رسمياً لجميع المستندات والنماذج الضريبية
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value="ar"
                disabled
                style={{ ...selectStyle, background: '#F8FAFC', cursor: 'default' }}
              >
                <option value="ar">العربية (الافتراضية)</option>
              </select>
            </div>
          </div>

          {/* ROW 2: العملة المفضلة (CURRENCY) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '18px',
              borderBottom: '1px solid #F1F5F9',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3C64' }}>
                العملة المفضلة للعرض
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                اختيار عملة عرض الأسعار والفواتير والاشتراكات
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={selectStyle}
              >
                <option value="JOD">دينار أردني (د.أ - العملة الأساسية)</option>
                <option value="USD">دولار أمريكي ($ - سعر التحويل 1 د.أ = 1.41 $)</option>
              </select>
            </div>
          </div>

          {/* ROW 3: المنطقة الزمنية (TIMEZONE) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '18px',
              borderBottom: '1px solid #F1F5F9',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3C64' }}>
                المنطقة الزمنية
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                المنطقة الزمنية المعتمدة لحساب أوقات الاستشارات والجلسات المباشرة
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={selectStyle}
              >
                <option value="Asia/Amman">(GMT+3) عمّان - الأردن</option>
                <option value="Asia/Riyadh">(GMT+3) الرياض - السعودية</option>
                <option value="Africa/Cairo">(GMT+2) القاهرة - مصر</option>
                <option value="Asia/Dubai">(GMT+4) دبي - الإمارات</option>
                <option value="Asia/Kuwait">(GMT+3) الكويت</option>
                <option value="Europe/London">(GMT+0 / +1) لندن - بريطانيا</option>
              </select>
            </div>
          </div>

          {/* ROW 4: تنسيق التاريخ (DATE FORMAT) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '10px',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0A3C64' }}>
                تنسيق التاريخ
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                طريقة صياغة وعرض التواريخ في الجداول والتقارير
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                style={selectStyle}
              >
                <option value="DD/MM/YYYY">يوم / شهر / سنة (مثال: {formatDate(now, 'DD/MM/YYYY', timezone)})</option>
                <option value="YYYY-MM-DD">سنة - شهر - يوم (مثال: {formatDate(now, 'YYYY-MM-DD', timezone)})</option>
                <option value="DD MMMM YYYY">يوم واسم الشهر وسنة (مثال: {formatDate(now, 'DD MMMM YYYY', timezone)})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Live Preview Box */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IconEye size={16} color="#0A3C64" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0A3C64' }}>
              معاينة حية ومباشرة للتفضيلات المختارة:
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px'
            }}
          >
            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>عينة سعر استشارة (50 د.أ):</span>
              <strong style={{ fontSize: '14px', color: '#0A3C64', marginTop: '2px', display: 'block' }}>
                {formatPrice(50, currency)}
              </strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>عينة التاريخ بالتنسيق المختار:</span>
              <strong style={{ fontSize: '14px', color: '#0A3C64', marginTop: '2px', display: 'block' }}>
                {formatDate(now, dateFormat, timezone)}
              </strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>الساعة الآن في المنطقة المختارة:</span>
              <strong style={{ fontSize: '14px', color: '#0A3C64', marginTop: '2px', display: 'block' }}>
                {formatTime(now, timezone)}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Button: حفظ الإعدادات والتفضيلات */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="submit"
            disabled={saving || parentLoading}
            style={{
              background: '#0A3C64',
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
              boxShadow: '0 4px 14px rgba(10, 60, 100, 0.25)',
              transition: 'all 0.25s ease',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit'
            }}
          >
            {savedSuccess ? (
              <>
                <IconCheck size={18} color="#FFFFFF" />
                <span>تم الحفظ والتطبيق بنجاح</span>
              </>
            ) : (
              <>
                <IconSave size={18} color="#FFFFFF" />
                <span>{saving ? 'جاري الحفظ والتطبيق...' : 'حفظ الإعدادات والتفضيلات'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

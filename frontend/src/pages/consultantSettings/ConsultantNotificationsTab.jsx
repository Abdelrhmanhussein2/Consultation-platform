import React, { useState } from 'react';

// Luxury iOS-style toggle switch component
const ToggleSwitch = ({ checked, onChange, disabled = false, id }) => (
  <label
    htmlFor={id}
    style={{
      position: 'relative',
      display: 'inline-block',
      width: '46px',
      height: '26px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      flexShrink: 0
    }}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      style={{ opacity: 0, width: 0, height: 0 }}
    />
    <span
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: checked ? '#0e3b5e' : '#CBD5E1',
        borderRadius: '34px',
        transition: 'all 0.25s ease',
        boxShadow: checked ? '0 2px 6px rgba(14, 59, 94, 0.3)' : 'none'
      }}
    >
      <span
        style={{
          position: 'absolute',
          content: '""',
          height: '20px',
          width: '20px',
          left: checked ? '22px' : '4px',
          bottom: '3px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          transition: 'all 0.25s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </span>
  </label>
);

export default function ConsultantNotificationsTab({
  notifications,
  setNotifications,
  handleSaveNotifications,
  loading = false
}) {
  const [appointmentReminders, setAppointmentReminders] = useState(notifications?.newBooking !== false);
  const [reminderMinutes, setReminderMinutes] = useState(notifications?.reminderMinutes || '60');
  const [chatMessages, setChatMessages] = useState(notifications?.chatMessages !== false);
  const [payouts, setPayouts] = useState(notifications?.payouts !== false);
  const [legalAlerts, setLegalAlerts] = useState(notifications?.legalAlerts !== false);
  const [marketingEmails, setMarketingEmails] = useState(notifications?.marketingEmails === true);

  const onSave = () => {
    const updated = {
      newBooking: appointmentReminders,
      reminderMinutes,
      chatMessages,
      payouts,
      legalAlerts,
      marketingEmails
    };
    if (setNotifications) setNotifications(updated);
    if (handleSaveNotifications) {
      handleSaveNotifications(updated);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        padding: '28px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        textAlign: 'right'
      }}
    >
      {/* Header */}
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '900', color: '#0e3b5e' }}>
        إعدادات الإشعارات
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        
        {/* 1. إشعارات الاستشارات والمواعيد الجديدة */}
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <ToggleSwitch
              id="toggle-consult-notif"
              checked={appointmentReminders}
              onChange={(val) => setAppointmentReminders(val)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '3px' }}>
                إشعارات الاستشارات والحجوزات الجديدة
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                تذكير بمواعيد الجلسات الاستشارية وإشعار فوري عند حجز موعد جديد
              </div>
            </div>
          </div>

          {/* Custom Time Selector when consultation reminders are enabled */}
          {appointmentReminders && (
            <div
              style={{
                marginTop: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '800', color: '#0e3b5e' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>توقيت التذكير المفضل قبل بدء الجلسة:</span>
              </div>

              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  background: '#FFFFFF',
                  color: '#0e3b5e',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="15">قبل موعد الجلسة بـ 15 دقيقة</option>
                <option value="30">قبل موعد الجلسة بـ 30 دقيقة</option>
                <option value="60">قبل موعد الجلسة بساعة واحدة</option>
                <option value="120">قبل موعد الجلسة بساعتين</option>
                <option value="1440">قبل موعد الجلسة بـ 24 ساعة</option>
                <option value="custom_both">تذكير مزدوج: قبل 24 ساعة وساعة واحدة (موصى به)</option>
              </select>
            </div>
          )}
        </div>

        {/* 2. إشعارات المحادثات والرسائل الفورية */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <ToggleSwitch
              id="toggle-chat-notif"
              checked={chatMessages}
              onChange={(val) => setChatMessages(val)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '3px' }}>
                إشعارات الرسائل والمحادثات الفورية
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                تنبيهك بالرسائل الجديدة المستلمة من العملاء أثناء أو قبل الجلسات
              </div>
            </div>
          </div>
        </div>

        {/* 3. إشعارات التحويلات المالية وسحب الأرباح */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <ToggleSwitch
              id="toggle-payout-notif"
              checked={payouts}
              onChange={(val) => setPayouts(val)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '3px' }}>
                إشعارات التحويلات المالية وسحب الأرباح
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                إشعار فوري عند إيداع أرباح الجلسات في حسابك أو تنفيذ تحويل CliQ
              </div>
            </div>
          </div>
        </div>

        {/* 4. تنبيهات تشريعية وقانونية */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <ToggleSwitch
              id="toggle-legal-notif"
              checked={legalAlerts}
              onChange={(val) => setLegalAlerts(val)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '3px' }}>
                تنبيهات تشريعية وقانونية
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                إشعار فوري عند صدور قانون أو تعليمات أو قرارات ضريبية جديدة
              </div>
            </div>
          </div>
        </div>

        {/* 5. رسائل تسويقية وتحديثات المنصة */}
        <div style={{ padding: '20px 0 26px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <ToggleSwitch
              id="toggle-marketing-notif"
              checked={marketingEmails}
              onChange={(val) => setMarketingEmails(val)}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '3px' }}>
                رسائل تسويقية وتحديثات المنصة
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                عروض وأخبار المنصة والميزات المضافة لشبكة المستشارين
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px' }}>
        <button
          type="button"
          onClick={onSave}
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
    </div>
  );
}

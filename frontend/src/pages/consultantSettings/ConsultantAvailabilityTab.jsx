import React from 'react';

export default function ConsultantAvailabilityTab({
  availability,
  setAvailability,
  handleSaveAvailability,
  loading
}) {
  const daysList = [
    { key: 'sun', label: 'الأحد' },
    { key: 'mon', label: 'الإثنين' },
    { key: 'tue', label: 'الثلاثاء' },
    { key: 'wed', label: 'الأربعاء' },
    { key: 'thu', label: 'الخميس' },
    { key: 'fri', label: 'الجمعة' },
    { key: 'sat', label: 'السبت' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 6px 0' }}>
          جدول العمل وأوقات التوفر الأسبوعية
        </h3>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px 0' }}>
          حدد أيام وساعات استقبال الجلسات الاستشارية؛ يتم حفظ الجدول في قاعدة البيانات وتحديث المواعيد المتاحة للعملاء فوراً.
        </p>

        {/* Duration & Buffer Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              مدة الجلسة الافتراضية
            </label>
            <select
              value={availability.sessionDuration}
              onChange={(e) => setAvailability({ ...availability, sessionDuration: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '13.5px',
                background: '#FFFFFF',
                fontWeight: '700',
                color: '#1E293B'
              }}
            >
              <option value={30}>30 دقيقة</option>
              <option value={45}>45 دقيقة</option>
              <option value={60}>60 دقيقة (ساعة كاملة)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
              فترة الاستراحة بين كل جلسة والأخرى (Buffer Time)
            </label>
            <select
              value={availability.bufferTime}
              onChange={(e) => setAvailability({ ...availability, bufferTime: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '13.5px',
                background: '#FFFFFF',
                fontWeight: '700',
                color: '#1E293B'
              }}
            >
              <option value={0}>بدون استراحة (مباشر)</option>
              <option value={10}>10 دقائق</option>
              <option value={15}>15 دقيقة</option>
              <option value={30}>30 دقيقة</option>
            </select>
          </div>
        </div>

        {/* Weekly Schedule Days List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
          {daysList.map(({ key, label }) => {
            const day = availability.workDays?.[key] || { enabled: false, from: '09:00', to: '17:00' };
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: day.enabled ? '#F8FAFC' : '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  transition: 'all 0.15s'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: '#0e3b5e', width: '130px' }}>
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => {
                      setAvailability({
                        ...availability,
                        workDays: {
                          ...availability.workDays,
                          [key]: { ...day, enabled: e.target.checked }
                        }
                      });
                    }}
                    style={{ width: '17px', height: '17px', accentColor: '#0e3b5e', cursor: 'pointer' }}
                  />
                  <span>{label}</span>
                </label>

                {day.enabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>من:</span>
                    <input
                      type="time"
                      value={day.from}
                      onChange={(e) => {
                        setAvailability({
                          ...availability,
                          workDays: { ...availability.workDays, [key]: { ...day, from: e.target.value } }
                        });
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#1E293B',
                        background: '#FFFFFF'
                      }}
                    />
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إلى:</span>
                    <input
                      type="time"
                      value={day.to}
                      onChange={(e) => {
                        setAvailability({
                          ...availability,
                          workDays: { ...availability.workDays, [key]: { ...day, to: e.target.value } }
                        });
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#1E293B',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: '800' }}>عطلة أسبوعية (مغلق)</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Availability Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={handleSaveAvailability}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #F5A52A 0%, #E08714 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(245, 165, 42, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>{loading ? 'جاري الحفظ...' : 'حفظ جدول التوفر وساعات العمل'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

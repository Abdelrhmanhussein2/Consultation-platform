import React, { useState } from 'react';

const POLICIES = [
  { key: 'consultant_agreement', title: 'اتفاقية المستشار وسياسات الامتثال المهني' },
  { key: 'ai_disclosure', title: 'الإفصاح الخاص بمساعد ديوان الذكي' },
  { key: 'data_owners', title: 'سياسة حقوق أصحاب البيانات الشخصية' },
  { key: 'records_retention', title: 'سياسة الاحتفاظ بالسجلات والمستندات' },
  { key: 'privacy_policy', title: 'سياسة الخصوصية وحماية البيانات الشخصية' },
  { key: 'service_level', title: 'سياسة مستوى الخدمة' },
  { key: 'terms_of_use', title: 'شروط وأحكام استخدام منصة ديوان' },
  { key: 'code_of_conduct', title: 'مدونة السلوك المهني والأخلاقي' },
  { key: 'service_quality', title: 'ميثاق جودة الخدمات' },
  { key: 'service_fees', title: 'سياسة رسوم الخدمات وعمولة المنصة' },
];

export default function ConsultantPoliciesStep({ acceptedPolicies, onPoliciesChange, onNext, onBack, openPolicy }) {
  const [error, setError] = useState('');
  const areAllAccepted = POLICIES.every((p) => Boolean(acceptedPolicies[p.key]));

  const handleToggle = (key) => {
    onPoliciesChange({ ...acceptedPolicies, [key]: !acceptedPolicies[key] });
  };

  const handleAcceptAll = () => {
    const nextState = {};
    POLICIES.forEach((p) => { nextState[p.key] = true; });
    onPoliciesChange(nextState);
    setError('');
  };

  const handleProceed = () => {
    if (!areAllAccepted) {
      setError('يجب الموافقة على جميع السياسات والشروط للمتابعة');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="consultant-policies-step">
      {/* Agreement Summary Box */}
      <div style={{ background: '#F0F7FC', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: '#0D3C5C', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#005D9C', marginBottom: '4px' }}>اتفاقية المستشار</div>
        <p style={{ margin: '0 0 4px', color: '#475569' }}>بصفتك مستشاراً معتمداً على منصة ديوان، فإنك تلتزم بـ:</p>
        <ul style={{ margin: '0 0 6px', paddingRight: '16px', color: '#334155', fontSize: '11.5px' }}>
          <li>الحفاظ على سرية معلومات العملاء والمستندات المرفقة</li>
          <li>تقديم استشارات مبنية على أحدث التشريعات الضريبية المعمول بها</li>
          <li>عدم تقديم وعود غير واقعية والإفصاح الفوري عن أي تضارب مصالح</li>
          <li>دفع عمولة المنصة 15% من قيمة كل استشارة وتوثيق الجلسات</li>
          <li>الالتزام بالمواعيد المحددة والحفاظ على تقييم لا يقل عن 4.0</li>
          <li>عدم التواصل خارج المنصة لتجاوز العمولة وتحديث التراخيص بانتظام</li>
        </ul>
        <p style={{ margin: 0, fontSize: '10.5px', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
          وتحتفظ ديوان بحق تعليق أو إلغاء حساب أي مستشار يخالف هذه المعايير.
        </p>
      </div>

      {/* Accept All Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={handleAcceptAll}
          style={{
            background: areAllAccepted ? '#16A34A' : 'var(--brand-blue, #005D9C)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>✓</span>
          <span>{areAllAccepted ? 'تمت الموافقة على الكل' : 'الموافقة على جميع السياسات (تحديد الكل)'}</span>
        </button>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          {POLICIES.filter((p) => acceptedPolicies[p.key]).length} من {POLICIES.length} محدد
        </span>
      </div>

      {error && <div className="auth-alert auth-alert-danger" style={{ marginBottom: '10px' }}>{error}</div>}

      {/* 10 Policies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', maxHeight: '280px', overflowY: 'auto' }}>
        {POLICIES.map((p) => {
          const checked = Boolean(acceptedPolicies[p.key]);
          return (
            <div
              key={p.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '6px',
                border: checked ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                background: checked ? '#F8FAFC' : '#FFFFFF',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, fontSize: '11.5px', color: '#1E293B', fontWeight: checked ? 600 : 400, margin: 0 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(p.key)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--brand-blue, #005D9C)', cursor: 'pointer' }}
                />
                <span>أوافق على {p.title}</span>
              </label>

              {openPolicy && (
                <button
                  type="button"
                  onClick={() => openPolicy(p.key)}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-blue, #005D9C)', cursor: 'pointer', fontSize: '11px', padding: '2px 4px', textDecoration: 'underline' }}
                >
                  اطلاع
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="auth-row-2col">
        <button type="button" className="auth-btn-outline" onClick={onBack}>السابق</button>
        <button type="button" className="auth-btn-gold" onClick={handleProceed}>التالي</button>
      </div>
    </div>
  );
}

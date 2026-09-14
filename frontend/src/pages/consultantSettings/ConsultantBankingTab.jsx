import React from 'react';

export default function ConsultantBankingTab({
  bank,
  setBank,
  handleSaveBank,
  loading
}) {
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
        {/* Simple Clean Header */}
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0e3b5e', margin: '0 0 4px 0' }}>
            بيانات الحساب البنكي و CliQ
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
            إدارة الحساب البنكي ومعرف كليك لتحويل مستحقات الاستشارات.
          </p>
        </div>

        <form onSubmit={handleSaveBank}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
            
            {/* CliQ Alias */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                معرف كليك (CliQ Alias)
              </label>
              <input
                type="text"
                value={bank.cliqAlias}
                onChange={(e) => setBank({ ...bank, cliqAlias: e.target.value })}
                placeholder="ABDULRAHMAN.TAX أو رقم الموبايل"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
            </div>

            {/* Local Bank Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                اسم البنك المحلي
              </label>
              <input
                type="text"
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                placeholder="البنك العربي"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                اسم صاحب الحساب
              </label>
              <input
                type="text"
                value={bank.accountHolderName}
                onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                placeholder="أ. رأفت حداد"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Jordanian IBAN */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                رقم الآيبان (IBAN الأردني)
              </label>
              <input
                type="text"
                value={bank.iban}
                onChange={(e) => setBank({ ...bank, iban: e.target.value })}
                placeholder="JO94ARAB0120000000488912500100"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  direction: 'ltr',
                  textAlign: 'right',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Account Number */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                رقم الحساب
              </label>
              <input
                type="text"
                value={bank.accountNumber}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                placeholder="0120-488912-500"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  direction: 'ltr',
                  textAlign: 'right',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Branch Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                اسم الفرع
              </label>
              <input
                type="text"
                value={bank.branchName}
                onChange={(e) => setBank({ ...bank, branchName: e.target.value })}
                placeholder="الشميساني - عمان"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#1E293B',
                  fontWeight: '700',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Unified Primary Save Button */}
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
    </div>
  );
}

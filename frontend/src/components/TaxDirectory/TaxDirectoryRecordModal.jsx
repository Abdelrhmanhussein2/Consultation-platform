// frontend/src/components/TaxDirectory/TaxDirectoryRecordModal.jsx
import React, { useState, useEffect } from 'react';
import ModernSelect from '../ModernSelect';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const UserCheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
);

const MergeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 6 4-4 4 4" /><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22" /><path d="m20 22-5-5" /></svg>
);

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function TaxDirectoryRecordModal({
  isOpen,
  onClose,
  onSave,
  initialRecord = null,
  availableTypes = []
}) {
  const isEdit = Boolean(initialRecord);
  const typeOptions = availableTypes.map((t) => ({ value: t, label: t }));

  const [name, setName] = useState('');
  const [tax, setTax] = useState('');
  const [type, setType] = useState(availableTypes[0] || 'جهات حكومية');

  const [conflictData, setConflictData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('merge'); // 'merge' | 'update_existing'

  useEffect(() => {
    if (initialRecord) {
      setName(initialRecord.name || '');
      setTax(initialRecord.tax || '');
      setType(initialRecord.type || availableTypes[0] || 'جهات حكومية');
    } else {
      setName('');
      setTax('');
      setType(availableTypes[0] || 'جهات حكومية');
    }
    setConflictData(null);
  }, [initialRecord, isOpen, availableTypes]);

  if (!isOpen) return null;

  const runDuplicateCheck = async () => {
    if (!name.trim() || !tax.trim() || isEdit) return null;
    setIsChecking(true);
    try {
      const res = await fetch('/api/tax-directory/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          tax_number: tax.trim(),
          exclude_id: initialRecord?.id || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.is_duplicate_exact || data.is_duplicate_tax || data.is_duplicate_name) {
          setConflictData(data);
          return data;
        } else {
          setConflictData(null);
          return null;
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsChecking(false);
    }
    return null;
  };

  const handleBlur = () => {
    if (name.trim() && tax.trim()) {
      runDuplicateCheck();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !tax.trim()) return;

    // Check conflict if not yet checked
    if (!conflictData && !isEdit) {
      const conflict = await runDuplicateCheck();
      if (conflict) {
        // Prevent immediate save so user can review the conflict card
        return;
      }
    }

    // If exact duplicate, block completely
    if (conflictData?.is_duplicate_exact) {
      alert('لا يمكن الإضافة: هذا المكلف مسجل بالفعل بنفس الاسم والرقم الضريبي لمنع التكرار.');
      return;
    }

    // Save with resolution if same tax number conflict
    let resolution = null;
    if (conflictData?.is_duplicate_tax) {
      resolution = selectedResolution;
    }

    onSave({
      name: name.trim(),
      tax: tax.trim(),
      type: type || 'غير محدد',
      resolution
    }, isEdit);
    onClose();
  };

  return (
    <div className="td-overlay" onClick={onClose}>
      <div className="td-modal" style={{ maxWidth: '540px', width: '92vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="td-modal-top">
          <button type="button" className="td-modal-close" onClick={onClose} aria-label="إغلاق">
            <CloseIcon size={18} />
          </button>
          <div className="td-modal-kicker">إدارة سجلات الكشف الضريبي ومنع التكرار</div>
          <div className="td-modal-heading-row" style={{ paddingLeft: 0 }}>
            <div className="td-modal-emblem" style={{ width: '42px', height: '42px' }}>
              <UserCheckIcon size={20} />
            </div>
            <div>
              <h2 className="td-modal-title" style={{ fontSize: '17px', margin: 0 }}>
                {isEdit ? 'تعديل بيانات المكلف' : 'إضافة مكلف / جهة جديدة'}
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="td-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                اسم الجهة أو المكلف *
              </label>
              <input
                type="text"
                required
                className="tax-form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontFamily: 'inherit' }}
                placeholder="مثال: وزارة المالية أو اسم الشركة أو المشروع"
                value={name}
                onChange={(e) => { setName(e.target.value); setConflictData(null); }}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                الرقم الضريبي *
              </label>
              <input
                type="text"
                required
                className="tax-form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }}
                placeholder="مثال: 17000220"
                value={tax}
                onChange={(e) => { setTax(e.target.value); setConflictData(null); }}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                نوع المكلف *
              </label>
              <ModernSelect
                options={typeOptions}
                value={type}
                onChange={(val) => setType(val)}
                placeholder="اختر نوع المكلف"
              />
            </div>

            {/* Checking indicator */}
            {isChecking && (
              <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔍 جارٍ فحص قاعدة البيانات للتأكد من عدم وجود تكرار مسبق...</span>
              </div>
            )}

            {/* Case 1: Exact Duplicate Warning */}
            {conflictData?.is_duplicate_exact && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 800, fontSize: '13px' }}>
                  <span>⚠️</span>
                  <span>المكلف مسجل مسبقاً (تطابق تام):</span>
                </div>
                <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '6px', lineHeight: 1.5 }}>
                  هذا المكلف مسجل بالفعل في الكشف الضريبي بنفس الاسم والرقم الضريبي:
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>
                    {conflictData.matched_by_tax?.name} ({conflictData.matched_by_tax?.tax_number})
                  </div>
                  تم تعطيل الحفظ لضمان عدم تكرار السجلات في قاعدة البيانات.
                </div>
              </div>
            )}

            {/* Case 2: Same Tax Number (Conflict Resolution / Put them together) */}
            {conflictData?.is_duplicate_tax && !conflictData.is_duplicate_exact && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontWeight: 800, fontSize: '13px' }}>
                  <MergeIcon size={18} />
                  <span>وجدنا جهة مسجلة مسبقاً بنفس هذا الرقم الضريبي:</span>
                </div>

                <div style={{ fontSize: '12px', color: '#1E3A8A', marginTop: '6px', lineHeight: 1.5 }}>
                  الرقم الضريبي <strong style={{ direction: 'ltr', display: 'inline-block' }}>{conflictData.matched_by_tax?.tax_number}</strong> مسجل حالياً باسم:
                  <div style={{ background: '#DBEAFE', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, margin: '6px 0', color: '#1E40AF' }}>
                    {conflictData.matched_by_tax?.name}
                  </div>
                  لمنع التكرار والحفاظ على ارتباط البيانات، اختر الإجراء المطلوب:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {/* Option 1: Merge names together */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: selectedResolution === 'merge' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      border: selectedResolution === 'merge' ? '2px solid #2563EB' : '1px solid #BFDBFE',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value="merge"
                      checked={selectedResolution === 'merge'}
                      onChange={() => setSelectedResolution('merge')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#1E40AF' }}>وضع الاسمين معاً ودمج السجلين (موصى به)</strong>
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                        سيصبح اسم الجهة: <code style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{conflictData.suggested_merged_name}</code>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Update existing record */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: selectedResolution === 'update_existing' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      border: selectedResolution === 'update_existing' ? '2px solid #2563EB' : '1px solid #BFDBFE',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value="update_existing"
                      checked={selectedResolution === 'update_existing'}
                      onChange={() => setSelectedResolution('update_existing')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#1E40AF' }}>تحديث وتعديل السجل الحالي بالاسم الجديد</strong>
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                        استبدال اسم السجل الحالي بالاسم المدخل: <span style={{ fontWeight: 700 }}>"{name}"</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Case 3: Same Name Warning */}
            {conflictData?.is_duplicate_name && !conflictData.is_duplicate_exact && !conflictData.is_duplicate_tax && (
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400E', fontWeight: 800, fontSize: '13px' }}>
                  <span>⚠️</span>
                  <span>تنبيه تشابه الاسم مع مكلف آخر:</span>
                </div>
                <div style={{ fontSize: '12px', color: '#78350F', marginTop: '4px', lineHeight: 1.5 }}>
                  يوجد مكلف مسجل مسبقاً بنفس الاسم <strong>"{conflictData.matched_by_name?.name}"</strong> برقم ضريبي مختلف (<strong style={{ direction: 'ltr', display: 'inline-block' }}>{conflictData.matched_by_name?.tax_number}</strong>).
                  يرجى التأكد من أن الجهة غير مكررة قبل الحفظ.
                </div>
              </div>
            )}
          </div>

          <div className="td-modal-bottom" style={{ justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="td-page-btn"
              style={{ minHeight: '38px', padding: '0 18px', fontWeight: 700 }}
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="td-copy-btn"
              disabled={conflictData?.is_duplicate_exact}
              style={{
                minHeight: '38px',
                padding: '0 20px',
                fontSize: '13px',
                opacity: conflictData?.is_duplicate_exact ? 0.5 : 1,
                cursor: conflictData?.is_duplicate_exact ? 'not-allowed' : 'pointer'
              }}
            >
              {conflictData?.is_duplicate_tax ? 'تأكيد وحفظ الإجراء' : isEdit ? 'حفظ التعديلات' : 'إضافة السجل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

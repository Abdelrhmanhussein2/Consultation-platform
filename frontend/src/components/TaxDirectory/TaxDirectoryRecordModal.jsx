import React, { useState, useEffect } from 'react';
import ModernSelect from '../ModernSelect';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const UserCheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
);

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
  }, [initialRecord, isOpen, availableTypes]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !tax.trim()) return;

    onSave({
      name: name.trim(),
      tax: tax.trim(),
      type: type || 'غير محدد'
    }, isEdit);
    onClose();
  };

  return (
    <div className="td-overlay" onClick={onClose}>
      <div className="td-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="td-modal-top">
          <button type="button" className="td-modal-close" onClick={onClose} aria-label="إغلاق">
            <CloseIcon size={18} />
          </button>
          <div className="td-modal-kicker">إدارة سجلات الكشف الضريبي</div>
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
                placeholder="مثال: وزارة المالية أو اسم الشركة"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setTax(e.target.value)}
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
              style={{ minHeight: '38px', padding: '0 20px', fontSize: '13px' }}
            >
              {isEdit ? 'حفظ التعديلات' : 'إضافة السجل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


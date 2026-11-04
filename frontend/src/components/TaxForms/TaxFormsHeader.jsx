import React from 'react';

const FileTextIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const PlusIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function TaxFormsHeader({ isAdmin = false, onOpenAddModal }) {
  return (
    <div className="tax-forms-header">
      <div className="tax-forms-header-row">
        <div>
          <div className="tax-forms-title-row">
            <div className="tax-forms-icon-box" aria-hidden="true">
              <FileTextIcon size={22} color="#E58A13" />
            </div>
            <h1 className="tax-forms-title">النماذج الضريبية</h1>
          </div>
          <p className="tax-forms-subtitle">
            مكتبة شاملة من النماذج والعقود والإقرارات الرسمية الجاهزة للاستخدام.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="tax-btn-add-form"
            onClick={onOpenAddModal}
          >
            <PlusIcon size={16} color="#FFFFFF" />
            <span>إضافة نموذج</span>
          </button>
        )}
      </div>
    </div>
  );
}

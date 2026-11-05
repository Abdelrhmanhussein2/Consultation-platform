// frontend/src/components/TaxDirectory/TaxDirectoryToolbar.jsx
import React, { useRef } from 'react';
import ModernSelect from '../ModernSelect';
import FilterResetButton from '../FilterResetButton';

const SearchIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const PlusIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

const UploadIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

const DownloadIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

export default function TaxDirectoryToolbar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableTypes = [],
  totalFiltered = 0,
  onReset,
  isAdmin = false,
  onOpenAdd,
  onImportCsv,
  onExportCsv
}) {
  const fileInputRef = useRef(null);
  const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

  const typeOptions = [
    { value: '', label: 'جميع أنواع المكلفين' },
    ...availableTypes.map((type) => ({ value: type, label: type }))
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportCsv) {
      onImportCsv(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="td-panel-head">
        <div>
          <h2 className="td-panel-title">سجل الجهات والأرقام الضريبية</h2>
          <div className="td-panel-desc">
            ابحث بالاسم أو الرقم الضريبي أو نوع المكلف، ثم اضغط على أي سجل لعرض التفاصيل.
          </div>
        </div>

        <div className="td-admin-toolbar-actions">
          <div className="td-count-pill">{fmt(totalFiltered)} سجل</div>

          {isAdmin && (
            <>
              <button
                type="button"
                className="td-btn-admin-add"
                onClick={onOpenAdd}
                title="إضافة مكلف أو جهة جديدة"
              >
                <PlusIcon size={15} />
                <span>إضافة مكلف</span>
              </button>

              <label className="td-btn-admin-import" title="استيراد كشف من ملف CSV أو Excel">
                <UploadIcon size={15} />
                <span>استيراد ملف</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>

              {onExportCsv && (
                <button
                  type="button"
                  className="td-btn-admin-export"
                  onClick={onExportCsv}
                  title="تصدير الكشف الحالي إلى CSV"
                >
                  <DownloadIcon size={14} />
                  <span>تصدير</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="td-toolbar">
        <div className="td-searchbox">
          <span className="td-searchicon" aria-hidden="true">
            <SearchIcon size={18} color="#94A3B8" />
          </span>
          <input
            type="search"
            placeholder="ابحث باسم الجهة أو الرقم الضريبي..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            aria-label="البحث في السجلات"
          />
          {searchQuery && (
            <button
              type="button"
              className="td-clear-search"
              onClick={() => onSearchChange('')}
              aria-label="مسح البحث"
              title="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ minWidth: '210px' }}>
          <ModernSelect
            options={typeOptions}
            value={selectedType}
            onChange={(val) => onTypeChange(val)}
            placeholder="جميع أنواع المكلفين"
          />
        </div>

        <FilterResetButton
          onClick={onReset}
          size={44}
          title="إعادة ضبط البحث والتصفية"
        />
      </div>
    </>
  );
}

// frontend/src/components/TaxDirectory/TaxDirectoryTable.jsx
import React from 'react';

const ArrowLeftIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);

const EmptySearchIcon = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
);

const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);

const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);

export default function TaxDirectoryTable({
  items = [],
  onSelectRecord,
  isAdmin = false,
  onEditRecord,
  onDeleteRecord
}) {
  if (items.length === 0) {
    return (
      <div className="td-empty" role="status">
        <div className="td-empty-icon" aria-hidden="true">
          <EmptySearchIcon size={34} color="#E58A13" />
        </div>
        <strong style={{ fontSize: '15px', color: '#0D3C5C', display: 'block', marginBottom: '6px', fontWeight: 800 }}>
          لم نعثر على نتائج مطابقة
        </strong>
        <div style={{ fontSize: '12.5px', color: '#64748B' }}>
          جرّب البحث بكلمات أخرى أو أزل بعض عوامل التصفية.
        </div>
      </div>
    );
  }

  return (
    <div className="td-table-wrap">
      <table className="td-table">
        <thead>
          <tr>
            <th style={{ width: isAdmin ? '42%' : '48%' }}>اسم الجهة</th>
            <th>الرقم الضريبي</th>
            <th>نوع المكلف</th>
            {isAdmin && <th style={{ textAlign: 'center', width: '85px' }}>إدارة</th>}
            <th aria-label="فتح التفاصيل"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr
              key={`${record.tax}-${record.name}`}
              tabIndex={0}
              onClick={() => onSelectRecord(record)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRecord(record);
                }
              }}
              aria-label={`عرض معلومات ${record.name}`}
            >
              <td className="td-name-cell">{record.name || '—'}</td>
              <td className="td-tax-number">{record.tax || '—'}</td>
              <td>
                <span className="td-type-tag">{record.type || 'غير محدد'}</span>
              </td>
              {isAdmin && (
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <div className="td-row-actions">
                    <button
                      type="button"
                      className="td-row-btn edit"
                      title="تعديل بيانات الجهة"
                      onClick={() => onEditRecord?.(record)}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="td-row-btn delete"
                      title="مسح من الكشف"
                      onClick={() => onDeleteRecord?.(record)}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </td>
              )}
              <td className="td-row-open" aria-hidden="true">
                <ArrowLeftIcon size={16} color="#E58A13" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// frontend/src/components/TaxDirectory/TaxDirectoryImportModal.jsx
import React, { useState } from 'react';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const FileCheckIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

export default function TaxDirectoryImportModal({
  isOpen,
  onClose,
  fileName,
  dryRunData,
  onConfirm,
  isSubmitting = false
}) {
  const [mergeSameTax, setMergeSameTax] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  if (!isOpen || !dryRunData) return null;

  const {
    total_parsed = 0,
    inserted_count = 0,
    merged_count = 0,
    duplicate_name_count = 0,
    exact_duplicates_count = 0,
    samples = []
  } = dryRunData;

  const fmt = (num) => new Intl.NumberFormat('en-US').format(num || 0);

  const handleConfirm = () => {
    onConfirm(mergeSameTax, skipDuplicates);
  };

  return (
    <div className="td-overlay" onClick={onClose}>
      <div className="td-modal" style={{ maxWidth: '780px', width: '92vw' }} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="td-modal-top">
          <button type="button" className="td-modal-close" onClick={onClose} aria-label="إغلاق">
            <CloseIcon size={18} />
          </button>
          <div className="td-modal-kicker">معالجة ومنع التكرار في الاستيراد</div>
          <div className="td-modal-heading-row" style={{ paddingLeft: 0 }}>
            <div className="td-modal-emblem" style={{ width: '42px', height: '42px', background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
              <FileCheckIcon size={22} />
            </div>
            <div>
              <h2 className="td-modal-title" style={{ fontSize: '17px', margin: 0 }}>
                معاينة وتحليل ملف: <span style={{ color: '#0D3C5C', fontWeight: 800 }}>{fileName}</span>
              </h2>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                تم فحص السجلات ومقارنتها بقاعدة البيانات لمنع التكرار والحفاظ على تكامل البيانات
              </div>
            </div>
          </div>
        </div>

        <div className="td-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Summary Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>إجمالي السجلات</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0D3C5C', marginTop: '2px' }}>{fmt(total_parsed)}</div>
            </div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>سجلات جديدة</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{fmt(inserted_count)}</div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: 700 }}>تطابق / تشابه الرقم الضريبي</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>{fmt(merged_count)}</div>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 700 }}>تطابق / تشابه في الاسم</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{fmt(duplicate_name_count)}</div>
            </div>

            <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>مكرر تماماً (تخطي)</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#64748B', marginTop: '2px' }}>{fmt(exact_duplicates_count)}</div>
            </div>
          </div>

          {/* Deduplication Controls */}
          <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0D3C5C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span>
              <span>خيارات معالجة التكرار:</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '12.5px', color: '#1E293B' }}>
              <input
                type="checkbox"
                checked={mergeSameTax}
                onChange={(e) => setMergeSameTax(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <strong>وضع الأسماء التي تشترك في نفس الرقم الضريبي معاً (دمج تلقائي ومنع التكرار):</strong>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  عند وجود جهتين بنفس الرقم الضريبي (مثل مشاريع أو فروع لنفس الجهة)، يتم دمجهما في سجل واحد بصيغة: <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>الاسم الحالي / الاسم الجديد</code> بدلاً من رفضها أو تكرارها.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '12.5px', color: '#1E293B' }}>
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <strong>تخطي السجلات المكررة بالكامل تلقائياً:</strong>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  أي سجل مسجل مسبقاً بنفس الاسم والرقم الضريبي سيتم تخطيه تلقائياً لضمان عدم تكرار أي سجل في قاعدة البيانات.
                </div>
              </div>
            </label>
          </div>

          {/* Sample Preview Table */}
          {samples.length > 0 && (
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0D3C5C', marginBottom: '8px' }}>
                عينة من السجلات وكيفية معالجتها:
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '8px 12px' }}>الحالة</th>
                      <th style={{ padding: '8px 12px' }}>اسم المكلف بالملف</th>
                      <th style={{ padding: '8px 12px' }}>الرقم الضريبي</th>
                      <th style={{ padding: '8px 12px' }}>الإجراء المنفّذ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.slice(0, 15).map((s, idx) => {
                      let badge = { text: 'جديد', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
                      if (s.action === 'merge') {
                        badge = { text: 'دمج مع سجل سابق', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
                      } else if (s.action === 'skip') {
                        badge = { text: 'تخطي (مكرر)', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
                      } else if (s.action === 'duplicate_name') {
                        badge = { text: 'اسم مكرر', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {badge.text}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0D3C5C' }}>
                            {s.name}
                          </td>
                          <td style={{ padding: '8px 12px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                            {s.tax_number}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#475569', fontSize: '11.5px' }}>
                            {s.action === 'merge' && s.suggested_merged_name ? (
                              <span>دمج مع: <strong>{s.existing_name}</strong></span>
                            ) : (
                              s.reason || 'إضافة مباشرة'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Buttons */}
        <div className="td-modal-bottom" style={{ justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '10px' }}>
          <button
            type="button"
            className="td-page-btn"
            style={{ minHeight: '38px', padding: '0 18px', fontWeight: 700 }}
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </button>

          <button
            type="button"
            className="td-copy-btn"
            style={{ minHeight: '38px', padding: '0 24px', fontSize: '13px', background: '#0D3C5C', color: '#FFF' }}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جارٍ الاستيراد والمعالجة...' : 'تأكيد واستيراد البيانات الآن'}
          </button>
        </div>
      </div>
    </div>
  );
}

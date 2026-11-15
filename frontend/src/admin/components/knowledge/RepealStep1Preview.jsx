import React from 'react';
import ModernSelect from '../../../components/ModernSelect';

export default function RepealStep1Preview({
  previewData,
  repealReason,
  setRepealReason,
  repealedByDocId,
  setRepealedByDocId,
  parentLaws = []
}) {
  const doc = previewData?.document || {};
  const counts = previewData?.counts || {};

  const lawOptions = [
    { value: '', label: 'بدون قانون ناسخ (إلغاء مباشر)' },
    ...parentLaws
      .filter((l) => l.id !== doc.document_id)
      .map((l) => ({ value: l.id, label: l.title || l.id }))
  ];

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="p-3 rounded-lg border border-[#BAE6FD] bg-[#F0F7FD]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#0A3C64] text-white">
            {doc.document_type === 'judgment' ? 'حكم قضائي' : 'تشريع / قانون'}
          </span>
          <span className="text-xs text-[#0D3C5C] font-mono">{doc.document_id}</span>
        </div>
        <h4 className="font-bold text-[#0A3C64] text-base mb-1">{doc.title}</h4>
        <p className="text-xs text-[#64748B]">
          الحالة الحالية: <span className="font-semibold text-[#0A3C64]">{doc.status}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-slate-50 border border-slate-200">
          <span className="block text-lg font-bold text-[#0A3C64]">{counts.legislative_count || 0}</span>
          <span className="text-xs text-slate-500">تشريعات تابعة</span>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-200">
          <span className="block text-lg font-bold text-[#0A3C64]">{counts.judicial_count || 0}</span>
          <span className="text-xs text-slate-500">أحكام مرتبطة</span>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-200">
          <span className="block text-lg font-bold text-[#D97706]">{counts.multi_parent_count || 0}</span>
          <span className="text-xs text-slate-500">متعددة الآباء</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          سبب الإلغاء (اختياري)
        </label>
        <textarea
          rows={2}
          value={repealReason}
          onChange={(e) => setRepealReason(e.target.value)}
          placeholder="مثال: صدور تشريع جديد يلغي العمل بأحكامه، أو انتهاء مدة العمل به..."
          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#005D9C]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          القانون الناسخ / البديل (اختياري)
        </label>
        <ModernSelect
          options={lawOptions}
          value={repealedByDocId}
          onChange={setRepealedByDocId}
          placeholder="اختر القانون الناسخ إن وجد..."
        />
      </div>
    </div>
  );
}

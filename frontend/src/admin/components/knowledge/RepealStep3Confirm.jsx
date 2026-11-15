import React from 'react';

export default function RepealStep3Confirm({
  previewData,
  dependentsActions,
  confirmText,
  setConfirmText,
  isSubmitting
}) {
  const doc = previewData?.document || {};
  const legislative = previewData?.legislative || [];
  const judicial = previewData?.judicial || [];

  const repealedDepsCount = legislative.filter(
    (item) => dependentsActions[item.target_document_id] === 'repeal'
  ).length;

  const keptLegislativeCount = legislative.length - repealedDepsCount;
  const keptTotalCount = keptLegislativeCount + judicial.length;

  const docTitle = (doc.title || '').trim();
  const docNumber = String(doc.number || '').trim();
  const docId = String(doc.document_id || '').trim();

  const isConfirmed =
    (confirmText.trim() === docTitle && docTitle.length > 0) ||
    (confirmText.trim() === docNumber && docNumber.length > 0) ||
    (confirmText.trim() === docId && docId.length > 0);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
        <h5 className="font-bold text-sm mb-1.5">ملخص العملية قبل الاعتماد</h5>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>
            سيتم إلغاء المصدر الأساسي: <strong className="font-semibold">{doc.title}</strong>
          </li>
          <li>
            سيتم إلغاء <strong>{repealedDepsCount}</strong> تشريع تابع وتحويل حالتها إلى ملغي.
          </li>
          <li>
            سيتم إبقاء <strong>{keptTotalCount}</strong> وثيقة سارية (بما في ذلك كافة الأحكام القضائية المرتبطة).
          </li>
          <li>
            لن يتم حذف أي بيانات أو علاقات نهائياً، وسيتم توثيق العملية في سجل التدقيق.
          </li>
        </ul>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          لتأكيد العملية، يرجى كتابة اسم القانون أو رقمه (
          <span className="text-[#0A3C64] font-bold">
            {docNumber ? `رقم ${docNumber}` : docTitle}
          </span>
          ) في الحقل أدناه:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={docNumber ? `اكتب "${docNumber}" أو "${docTitle}" للتأكيد...` : `اكتب اسم الوثيقة للتأكيد...`}
          disabled={isSubmitting}
          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#005D9C]"
        />
      </div>

      {!isConfirmed && confirmText.trim().length > 0 && (
        <p className="text-[11px] text-amber-700">
          النص المدخل لا يطابق اسم القانون أو رقمه. يرجى كتابة اسم القانون أو رقمه بدقة.
        </p>
      )}
    </div>
  );
}

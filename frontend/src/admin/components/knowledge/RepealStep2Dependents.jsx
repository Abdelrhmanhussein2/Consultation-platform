import React from 'react';

export default function RepealStep2Dependents({
  previewData,
  dependentsActions,
  setDependentsActions
}) {
  const legislative = previewData?.legislative || [];
  const judicial = previewData?.judicial || [];

  const handleSetAction = (targetId, action) => {
    setDependentsActions((prev) => ({
      ...prev,
      [targetId]: action
    }));
  };

  const handleSetAllLegislative = (action) => {
    const next = { ...dependentsActions };
    for (const item of legislative) {
      next[item.target_document_id] = action;
    }
    setDependentsActions(next);
  };

  return (
    <div className="space-y-4 text-right max-h-[380px] overflow-y-auto pr-1" dir="rtl">
      {legislative.length > 0 && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-[#0A3C64]">
            التشريعات واللوائح التابعة ({legislative.length})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSetAllLegislative('repeal')}
              className="text-xs px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            >
              إلغاء الكل
            </button>
            <button
              type="button"
              onClick={() => handleSetAllLegislative('keep')}
              className="text-xs px-2 py-1 rounded border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              إبقاء الكل
            </button>
          </div>
        </div>
      )}

      {legislative.length > 0 && (
        <div className="space-y-2">
          {legislative.map((item) => {
            const currentAction = dependentsActions[item.target_document_id] || 'keep';
            return (
              <div
                key={item.target_document_id}
                className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-[#0D3C5C]">{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.sub_category}
                    </span>
                    {item.has_multiple_parents && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                        مرتبط بقوانين أخرى ({item.other_parents.map((p) => p.title || p.id).join('، ')})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.target_document_id}</span>
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetAction(item.target_document_id, 'keep')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      currentAction === 'keep'
                        ? 'bg-[#005D9C] text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    إبقاء سارياً
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAction(item.target_document_id, 'repeal')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      currentAction === 'repeal'
                        ? 'bg-amber-600 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    إلغاء التابع
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {judicial.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="mb-2">
            <span className="text-xs font-bold text-[#0A3C64]">
              الأحكام القضائية المرتبطة ({judicial.length})
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              الأحكام القضائية تظل سارية دائماً كاجتهاد قضائي وتاريخ قانوني مستقل.
            </p>
          </div>
          <div className="space-y-2">
            {judicial.map((item) => (
              <div
                key={item.target_document_id}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 block truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500">{item.sub_category} · {item.target_document_id}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  إبقاء سارياً (تاريخي)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {legislative.length === 0 && judicial.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          لا توجد وثائق تشريعية أو قضائية تابعة لهذا المصدر. سيتم إلغاء المصدر نفسه فقط.
        </div>
      )}
    </div>
  );
}

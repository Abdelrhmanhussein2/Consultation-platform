import React, { useState } from 'react';
import { submitRestore } from './knowledgeApi';

export default function RestoreLawModal({
  isOpen,
  source,
  onClose,
  onSuccess
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !source) return null;

  const handleRestore = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await submitRestore(source.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'تعذر إعادة تفعيل المصدر');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-right" dir="rtl">
        <div className="p-4 border-b border-slate-200 bg-[#F0F7FD] flex items-center justify-between">
          <h3 className="font-bold text-[#0A3C64] text-base">إعادة تفعيل المصدر القانوني</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            هل ترغب في إعادة تفعيل <strong className="text-[#0A3C64]">{source.title}</strong> وتحويل حالته إلى{' '}
            <span className="font-bold text-emerald-700">"ساري"</span>؟
          </p>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1">
            <p>ملاحظة هامة:</p>
            <p>
              إعادة تفعيل القانون الأصل لا تقوم بإعادة تفعيل التشريعات التابعة الملغاة تلقائياً؛ يمكنك مراجعة وتفعيل كل تابع بشكل مستقل لضمان اتساق التشريعات.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            إلغاء الأمر
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isSubmitting}
            className="text-xs px-4 py-1.5 rounded-lg bg-[#005D9C] text-white hover:bg-[#0A3C64] font-medium transition-colors"
          >
            {isSubmitting ? 'جاري التفعيل...' : 'تأكيد إعادة التفعيل'}
          </button>
        </div>
      </div>
    </div>
  );
}

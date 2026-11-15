import React, { useState, useEffect } from 'react';
import RepealStep1Preview from './RepealStep1Preview';
import RepealStep2Dependents from './RepealStep2Dependents';
import RepealStep3Confirm from './RepealStep3Confirm';
import { fetchRepealPreview, submitRepeal } from './knowledgeApi';

export default function RepealLawModal({
  isOpen,
  source,
  onClose,
  onSuccess,
  parentLaws = []
}) {
  const [step, setStep] = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const [repealReason, setRepealReason] = useState('');
  const [repealedByDocId, setRepealedByDocId] = useState('');
  const [dependentsActions, setDependentsActions] = useState({});
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !source) {
      setStep(1); setPreviewData(null); setPreviewError(null);
      setRepealReason(''); setRepealedByDocId(''); setDependentsActions({}); setConfirmText('');
      return;
    }
    setLoadingPreview(true);
    setPreviewError(null);
    fetchRepealPreview(source.id)
      .then((data) => {
        setPreviewData(data);
        const initialActions = {};
        for (const item of data.legislative || []) {
          initialActions[item.target_document_id] = 'keep';
        }
        setDependentsActions(initialActions);
      })
      .catch((err) => {
        setPreviewError(err.message || 'تعذر تحميل معاينة الإلغاء');
      })
      .finally(() => setLoadingPreview(false));
  }, [isOpen, source]);

  if (!isOpen || !source) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const actionsPayload = Object.entries(dependentsActions).map(([tid, act]) => ({
        target_document_id: tid,
        action: act
      }));
      await submitRepeal(source.id, {
        repeal_reason: repealReason.trim() || undefined,
        repealed_by_document_id: repealedByDocId || undefined,
        dependents_actions: actionsPayload
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message || 'فشلت عملية الإلغاء');
    } finally {
      setIsSubmitting(false);
    }
  };

  const docTitle = (previewData?.document?.title || '').trim();
  const docNumber = String(previewData?.document?.number || '').trim();
  const docId = String(previewData?.document?.document_id || '').trim();

  const isConfirmed =
    (confirmText.trim() === docTitle && docTitle.length > 0) ||
    (confirmText.trim() === docNumber && docNumber.length > 0) ||
    (confirmText.trim() === docId && docId.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-[#0A3C64] text-base">إلغاء قانون أو حكم</h3>
            <span className="text-xs text-slate-500">الخطوة {step} من 3</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5">
          {loadingPreview ? (
            <div className="py-12 text-center text-xs text-slate-500">
              جاري فحص العلاقات واستخراج المعاينة...
            </div>
          ) : previewError ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 text-right">
              {previewError}
            </div>
          ) : (
            <>
              {step === 1 && (
                <RepealStep1Preview
                  previewData={previewData}
                  repealReason={repealReason}
                  setRepealReason={setRepealReason}
                  repealedByDocId={repealedByDocId}
                  setRepealedByDocId={setRepealedByDocId}
                  parentLaws={parentLaws}
                />
              )}
              {step === 2 && (
                <RepealStep2Dependents
                  previewData={previewData}
                  dependentsActions={dependentsActions}
                  setDependentsActions={setDependentsActions}
                />
              )}
              {step === 3 && (
                <RepealStep3Confirm
                  previewData={previewData}
                  dependentsActions={dependentsActions}
                  confirmText={confirmText}
                  setConfirmText={setConfirmText}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                السابق
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              إلغاء الأمر
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loadingPreview || Boolean(previewError)}
                className="text-xs px-4 py-1.5 rounded-lg bg-[#005D9C] text-white hover:bg-[#0A3C64] font-medium"
              >
                متابعة
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isConfirmed || isSubmitting}
                className={`text-xs px-4 py-1.5 rounded-lg font-medium text-white transition-colors ${
                  isConfirmed && !isSubmitting
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'جاري التنفيذ...' : 'تأكيد الإلغاء النهائي'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

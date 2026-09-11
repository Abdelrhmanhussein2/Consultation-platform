import React from 'react';
import { createPortal } from 'react-dom';

export default function ConsultantRejectModal({
  rejectModalOpen,
  setRejectModalOpen,
  rejectingConsultant,
  rejectMode,
  setRejectMode,
  rejectReason,
  setRejectReason,
  rejectDeadline,
  setRejectDeadline,
  rejectRequirements,
  setRequirements,
  rejectMessage,
  setRejectMessage,
  confirmRejection
}) {
  if (!rejectModalOpen || !rejectingConsultant) return null;

  return createPortal(
    <div className="overlay show" onClick={() => setRejectModalOpen(false)}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            رفض / استكمال ملف المستشار — {rejectingConsultant.name}
          </div>
          <button className="close" onClick={() => setRejectModalOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="reject-warning-v15">
            لن يتم نقل المستشار إلى حالة "مرفوض" قبل تحديد نوع القرار وسبب الرفض أو المتطلبات
            المطلوبة منه.
          </div>

          <div className="field">
            <label>نوع القرار</label>
            <div className="reject-choice-v15">
              <label>
                <input
                  type="radio"
                  name="rejectMode"
                  checked={rejectMode === 'استكمال'}
                  onChange={() => setRejectMode('استكمال')}
                />
                <b>رفض مؤقت / طلب استكمال</b>
                <div className="sub">يمكن للمستشار استكمال النواقص ثم إعادة تقديم الملف.</div>
              </label>
              <label>
                <input
                  type="radio"
                  name="rejectMode"
                  checked={rejectMode === 'نهائي'}
                  onChange={() => setRejectMode('نهائي')}
                />
                <b>رفض نهائي</b>
                <div className="sub">غير مؤهل للانضمام للمنصة حاليًا.</div>
              </label>
            </div>
          </div>

          <div className="reject-grid-v15">
            <div className="field">
              <label>سبب الرفض</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="ملف غير مكتمل">ملف غير مكتمل</option>
                <option value="وثائق ناقصة">وثائق ناقصة</option>
                <option value="وثائق منتهية أو غير صالحة">وثائق منتهية أو غير صالحة</option>
                <option value="خبرة غير كافية">خبرة غير كافية</option>
                <option value="تخصص غير مطابق">تخصص غير مطابق لاحتياج المنصة</option>
                <option value="أخرى">سبب آخر</option>
              </select>
            </div>

            <div className="field">
              <label>مهلة الاستكمال</label>
              <select
                value={rejectDeadline}
                disabled={rejectMode === 'نهائي'}
                onChange={(e) => setRejectDeadline(e.target.value)}
              >
                <option value="3 أيام">3 أيام</option>
                <option value="7 أيام">7 أيام</option>
                <option value="14 يومًا">14 يومًا</option>
                <option value="30 يومًا">30 يومًا</option>
                <option value="لا توجد مهلة">لا توجد مهلة</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>المتطلبات / الوثائق المطلوبة ليصبح الملف قابلاً للاعتماد</label>
            <textarea
              placeholder="مثال: تزويدنا بالشهادة المهنية المحدثة، إثبات خبرة آخر 3 سنوات..."
              value={rejectRequirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div className="field">
            <label>الرسالة التي ستصل إلى المستشار</label>
            <textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn pink" onClick={confirmRejection}>
            تأكيد وإرسال الرسالة
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setRejectModalOpen(false)}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

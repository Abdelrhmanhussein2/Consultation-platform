import React, { useState } from 'react';

export default function RejectConsultantModal({ consultant, onClose, onConfirm }) {
  const [rejectMode, setRejectMode] = useState('completion'); // 'completion' | 'final'
  const [reason, setReason] = useState('ملف غير مكتمل');
  const [deadline, setDeadline] = useState('7 أيام');
  const [requirements, setRequirements] = useState('');
  const [messageText, setMessageText] = useState(
    `الأستاذ/ة ${consultant?.name || ''}، تمت مراجعة ملف الاعتماد وتبين أنه يحتاج إلى استكمال الوثائق والمستندات قبل الموافقة النهائيّة.`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      mode: rejectMode,
      reason,
      deadline: rejectMode === 'final' ? 'لا توجد مهلة' : deadline,
      requirements,
      message: messageText
    });
  };

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="cc-modal-head">
          <div className="cc-modal-title">
            قرار رفض / طلب استكمال ملف المستشار — {consultant?.name}
          </div>
          <button className="cc-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="cc-modal-body">
          <div style={{ background: '#fff1f2', color: '#be123c', padding: '12px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px' }}>
            سيتم حفظ سبب القرار وإرسال التنبيه والرسالة التلقائية للمستشار مباشرة عبر المحادثات والتنبيهات.
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>نوع القرار</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', cursor: 'pointer', background: rejectMode === 'completion' ? '#f0fdf4' : '#ffffff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="completion"
                  checked={rejectMode === 'completion'}
                  onChange={() => setRejectMode('completion')}
                  style={{ marginLeft: '6px' }}
                />
                <strong>رفض مؤقت / طلب استكمال</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>إعطاء المستشار مهلة لتزويدنا بالنواقص</div>
              </label>

              <label style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', cursor: 'pointer', background: rejectMode === 'final' ? '#fff1f2' : '#ffffff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="final"
                  checked={rejectMode === 'final'}
                  onChange={() => setRejectMode('final')}
                  style={{ marginLeft: '6px' }}
                />
                <strong>رفض نهائي</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>عدم قبول الملف بصورة قاطعة</div>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>سبب القرار</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="ملف غير مكتمل">ملف غير مكتمل</option>
                <option value="وثائق ناقصة">وثائق ناقصة</option>
                <option value="وثائق منتهية أو غير صالحة">وثائق منتهية أو غير صالحة</option>
                <option value="خبرة غير كافية">خبرة غير كافية</option>
                <option value="تخصص غير مطابق">تخصص غير مطابق لاحتياج المنصة</option>
                <option value="أخرى">سبب آخر</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>مهلة الاستكمال</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={deadline}
                disabled={rejectMode === 'final'}
                onChange={(e) => setDeadline(e.target.value)}
              >
                <option value="3 أيام">3 أيام</option>
                <option value="7 أيام">7 أيام</option>
                <option value="14 يومًا">14 يومًا</option>
                <option value="30 يومًا">30 يومًا</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>المتطلبات / الوثائق المطلوبة ليصبح الملف قابلاً للاعتماد</label>
            <textarea
              className="cc-input"
              style={{ width: '100%', minHeight: '80px', padding: '10px' }}
              placeholder="مثال: تزويدنا بالشهادة المهنية المحدثة، إثبات خبرة آخر 3 سنوات..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>الرسالة المرسلة للمستشار</label>
            <textarea
              className="cc-input"
              style={{ width: '100%', minHeight: '80px', padding: '10px' }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          <div className="cc-modal-actions" style={{ padding: 0, background: 'none', border: 'none' }}>
            <button type="button" className="cc-btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="cc-btn-primary">تأكيد وإرسال القرار</button>
          </div>
        </form>
      </div>
    </div>
  );
}

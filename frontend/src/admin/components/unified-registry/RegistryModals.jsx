import React from 'react';

export default function RegistryModals({
  activeModal,
  setActiveModal,
  currentRecord,
  statusesState,
  modalForm,
  setModalForm,
  applyStatusChange,
  selectedModule,
  setSelectedModule,
  showToastMsg
}) {
  if (!activeModal) return null;

  return (
    <>
      {/* A. Status Modal */}
      {activeModal === 'status' && (
        <div className="reg-modal-backdrop show" onClick={() => setActiveModal(null)}>
          <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reg-modal-head">
              <div className="reg-modal-title">تغيير حالة السجل</div>
              <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="reg-modal-body">
              <div className="form-grid">
                <div className="field">
                  <label>الحالة الحالية</label>
                  <input value={currentRecord ? (statusesState[currentRecord.id] || currentRecord.status) : ''} disabled />
                </div>
                <div className="field">
                  <label>الحالة الجديدة</label>
                  <select
                    value={modalForm.status || 'نشط'}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                  >
                    <option value="نشط">نشط</option>
                    <option value="مؤكدة">مؤكدة</option>
                    <option value="مكتملة">مكتملة</option>
                    <option value="مفتوحة">مفتوحة</option>
                    <option value="معلقة">معلقة</option>
                    <option value="تحتاج متابعة">تحتاج متابعة</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>سبب التغيير</label>
                <textarea
                  placeholder="اكتب سبب التغيير..."
                  value={modalForm.reason || ''}
                  onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
                />
              </div>
              <div className="preview-box">
                سيتم حفظ التغيير في قاعدة البيانات وتحديث الحالة في السجل الموحد.
              </div>
            </div>
            <div className="reg-modal-actions">
              <button className="btn primary" onClick={applyStatusChange}>حفظ التغيير</button>
              <button className="btn ghost" onClick={() => setActiveModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* B. Advanced Filter Modal */}
      {activeModal === 'advancedFilter' && (
        <div className="reg-modal-backdrop show" onClick={() => setActiveModal(null)}>
          <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reg-modal-head">
              <div className="reg-modal-title">التصفية المتقدمة</div>
              <button className="drawer-close-btn" onClick={() => setActiveModal(null)}>×</button>
            </div>
            <div className="reg-modal-body">
              <div className="form-grid">
                <div className="field">
                  <label>صاحب العلاقة</label>
                  <input placeholder="الاسم أو المنشأة..." />
                </div>
                <div className="field">
                  <label>المرجع</label>
                  <input placeholder="مثال: USR-1048" />
                </div>
                <div className="field">
                  <label>من تاريخ</label>
                  <input type="date" />
                </div>
                <div className="field">
                  <label>إلى تاريخ</label>
                  <input type="date" />
                </div>
              </div>
              <div className="field">
                <label>نوع السجل المطلوب</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="الكل">كل السجلات</option>
                  <option value="مستخدم">المستخدمون</option>
                  <option value="مستشار">المستشارون</option>
                  <option value="استشارة">الاستشارات</option>
                  <option value="تذكرة دعم">تذاكر الدعم</option>
                  <option value="فاتورة">الفواتير</option>
                  <option value="اعتماد">الاعتمادات</option>
                  <option value="أتمتة">الأتمتة</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={() => { setActiveModal(null); showToastMsg('تم تطبيق التصفية المتقدمة'); }}>
                تطبيق
              </button>
              <button className="btn ghost" onClick={() => setActiveModal(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

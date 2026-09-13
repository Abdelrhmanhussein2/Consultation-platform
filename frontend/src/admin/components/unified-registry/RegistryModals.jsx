import React from 'react';
import ModernSelect from '../../../components/ModernSelect';

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
                  <ModernSelect
                    style={{ width: '100%' }}
                    value={modalForm.status || 'نشط'}
                    onChange={(val) => setModalForm({ ...modalForm, status: val })}
                    options={['نشط', 'مؤكدة', 'مكتملة', 'مفتوحة', 'معلقة', 'تحتاج متابعة']}
                  />
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
                <ModernSelect
                  style={{ width: '100%' }}
                  value={selectedModule}
                  onChange={(val) => setSelectedModule(val)}
                  options={[
                    { value: 'الكل', label: 'كل السجلات' },
                    { value: 'مستخدم', label: 'المستخدمون' },
                    { value: 'مستشار', label: 'المستشارون' },
                    { value: 'استشارة', label: 'الاستشارات' },
                    { value: 'تذكرة دعم', label: 'تذاكر الدعم' },
                    { value: 'فاتورة', label: 'الفواتير' },
                    { value: 'اعتماد', label: 'الاعتمادات' },
                    { value: 'أتمتة', label: 'الأتمتة' }
                  ]}
                />
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

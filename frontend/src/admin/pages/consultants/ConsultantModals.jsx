import React from 'react';

// Password validation helper
export const isPasswordValid = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:',.<>?~`]/.test(pwd);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ══════════════════════════════════════════════════════════════════
// 1. ADD CONSULTANT MODAL
// ══════════════════════════════════════════════════════════════════
export function AddConsultantModal({
  isOpen,
  onClose,
  newConsultant,
  setNewConsultant,
  specializations,
  loadingAdd,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: '900', color: '#0e3b5e' }}>
          + إضافة وتعيين مستشار معتمد جديد
        </h3>
        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
          سيتم إنشاء الحساب واعتماده مباشرة في قاعدة البيانات، وتفعيل بروفايل المستشار وتسعيرته ليتمكن من الدخول فوراً.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                الاسم الكامل للمستشار *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: د. إبراهيم المجالي"
                value={newConsultant.fullName}
                onChange={(e) => setNewConsultant({ ...newConsultant, fullName: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                البريد الإلكتروني (لتسجيل الدخول) *
              </label>
              <input
                type="email"
                required
                placeholder="consultant@example.com"
                value={newConsultant.email}
                onChange={(e) => setNewConsultant({ ...newConsultant, email: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                كلمة المرور الابتدائية *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: Test@123456"
                value={newConsultant.password}
                onChange={(e) => setNewConsultant({ ...newConsultant, password: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
              />
              <small style={{ fontSize: '10.5px', color: isPasswordValid(newConsultant.password) ? '#10B981' : '#64748B' }}>
                {isPasswordValid(newConsultant.password) ? '✓ كلمة مرور قوية ومقبولة' : '8 أحرف + حرف كبير + صغير + رقم + رمز'}
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                رقم الهاتف / الموبايل
              </label>
              <input
                type="text"
                placeholder="+962 7 9000 0000"
                value={newConsultant.phone}
                onChange={(e) => setNewConsultant({ ...newConsultant, phone: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                المدينة / المحافظة
              </label>
              <input
                type="text"
                value={newConsultant.city}
                onChange={(e) => setNewConsultant({ ...newConsultant, city: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                سعر الاستشارة بالساعة (د.أ)
              </label>
              <input
                type="number"
                value={newConsultant.hourlyRate}
                onChange={(e) => setNewConsultant({ ...newConsultant, hourlyRate: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                التخصص الرئيسي المعتمد
              </label>
              <select
                value={newConsultant.specializationId}
                onChange={(e) => setNewConsultant({ ...newConsultant, specializationId: e.target.value })}
                className="admin-select-input"
                style={{ width: '100%' }}
              >
                {specializations.length > 0 ? (
                  specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))
                ) : (
                  <option value="1">استشارات ضريبة الدخل والمبيعات</option>
                )}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                اللقب المهني ورقم ترخيص JCPA
              </label>
              <input
                type="text"
                value={newConsultant.title}
                onChange={(e) => setNewConsultant({ ...newConsultant, title: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                النبذة التعريفية والخبرات
              </label>
              <textarea
                rows="2"
                value={newConsultant.bio}
                onChange={(e) => setNewConsultant({ ...newConsultant, bio: e.target.value })}
                className="admin-search-input"
                style={{ width: '100%', height: 'auto', padding: '8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loadingAdd}
              className="admin-btn-action-primary"
              style={{ padding: '10px 24px', fontWeight: '800', cursor: 'pointer' }}
            >
              {loadingAdd ? 'جاري الحفظ في الداتابيز...' : 'حفظ واعتماد المستشار فوراً'}
            </button>
            <button
              type="button"
              className="admin-btn-action-outline"
              onClick={onClose}
              style={{ padding: '10px 18px', fontWeight: '800', cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. EDIT CONSULTANT MODAL
// ══════════════════════════════════════════════════════════════════
export function EditConsultantModal({
  editModal,
  setEditModal,
  savingEdit,
  handleSaveEdit
}) {
  if (!editModal) return null;

  return (
    <div className="admin-modal-overlay" onClick={() => setEditModal(null)}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800' }}>تعديل بيانات وتسعير المستشار</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الاسم:</label>
          <input
            type="text"
            className="admin-search-input"
            value={editModal.name}
            onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>سعر الساعة (JOD):</label>
          <input
            type="text"
            className="admin-search-input"
            value={editModal.hourlyRate}
            onChange={(e) => setEditModal({ ...editModal, hourlyRate: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="admin-btn-action-outline" onClick={() => setEditModal(null)}>
            إلغاء
          </button>
          <button className="admin-btn-action-primary" disabled={savingEdit} onClick={handleSaveEdit}>
            {savingEdit ? 'جاري الحفظ في الداتابيز...' : 'حفظ التعديلات في قاعدة البيانات'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. SUCCESS POPUP MODAL
// ══════════════════════════════════════════════════════════════════
export function SuccessPopupModal({ successModal, onClose }) {
  if (!successModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '32px 28px',
          width: '90%',
          maxWidth: '460px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          textAlign: 'center',
          direction: 'rtl'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#ECFDF5',
            border: '2px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#059669'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' }}>
          {successModal.title || 'تمت العملية بنجاح!'}
        </h3>

        <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>
          تم تسجيل وتفعيل حساب <strong style={{ color: '#0F172A' }}>[{successModal.name}]</strong> في قاعدة البيانات مباشرة.
        </p>

        {successModal.email && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginBottom: '4px' }}>
              البريد الإلكتروني لتسجيل الدخول:
            </div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '800',
                color: '#005D9C',
                direction: 'ltr',
                textAlign: 'left',
                wordBreak: 'break-all'
              }}
            >
              {successModal.email}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #0e3b5e 0%, #082842 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(14, 59, 94, 0.3)'
          }}
        >
          تم، موافق
        </button>
      </div>
    </div>
  );
}

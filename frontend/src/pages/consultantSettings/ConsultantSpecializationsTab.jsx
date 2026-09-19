import React from 'react';

export default function ConsultantSpecializationsTab({
  currentSpecializationId,
  currentSpecializationName,
  approvedSpecializations = [],
  specializationsList = [],
  specMode,
  setSpecMode,
  addSpec,
  setAddSpec,
  changeSpec,
  setChangeSpec,
  pendingRequests = [],
  docAddInputRef,
  docChangeInputRef,
  handleSubmitSpecRequest,
  loading
}) {
  // Normalize owned specialization names and IDs to filter them out when adding a new specialization
  const currentMainName = currentSpecializationName ? currentSpecializationName.trim() : '';
  const ownedNames = [
    currentMainName,
    ...(approvedSpecializations || []).map((s) => (typeof s === 'string' ? s.trim() : s?.name?.trim())),
    ...pendingRequests.filter((r) => r.rawStatus === 'approved').map((r) => r.name?.trim())
  ].filter(Boolean);

  // Filter for adding: exclude current main spec and all approved extra specs
  const availableToAdd = specializationsList.filter((spec) => {
    const isMainId = currentSpecializationId && String(spec.id) === String(currentSpecializationId);
    const isMainName = spec.name && spec.name.trim() === currentMainName;
    const isOwned = ownedNames.some((name) => name && (name === spec.name.trim() || name.includes(spec.name.trim()) || spec.name.trim().includes(name)));
    return !isMainId && !isMainName && !isOwned;
  });

  // Filter for changing: exclude current main spec only
  const availableToChange = specializationsList.filter((spec) => {
    const isMainId = currentSpecializationId && String(spec.id) === String(currentSpecializationId);
    const isMainName = spec.name && spec.name.trim() === currentMainName;
    return !isMainId && !isMainName;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0A3254', margin: '0 0 6px 0', fontFamily: "'Tajawal', sans-serif" }}>
          التخصصات والرخصة المهنية المعتمدة
        </h3>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px 0', fontFamily: "'Tajawal', sans-serif" }}>
          إدارة تخصصك الرئيسي المعتمد وتقديم طلبات اعتماد تخصصات إضافية مع إرفاق رخصة JCPA والشهادات المؤهلة.
        </p>

        {/* Current Active Specialization Card */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Main Specialization */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', marginBottom: '4px', fontFamily: "'Tajawal', sans-serif" }}>
                التخصص الرئيسي المعتمد والنشط حالياً على المنصة:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                {currentSpecializationName}
              </div>
            </div>
            <span
              style={{
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Tajawal', sans-serif"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>تخصص رئيسي معتمد</span>
            </span>
          </div>

          {/* Approved Extra Specializations if any */}
          {approvedSpecializations.length > 0 && (
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '800', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                التخصصات الإضافية المعتمدة:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {approvedSpecializations.map((spec, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#EFF6FF',
                      color: '#0A3254',
                      border: '1px solid #BFDBFE',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    <span>✓</span>
                    <span>{typeof spec === 'string' ? spec : spec.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pending Requests List */}
        {pendingRequests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: req.rawStatus === 'approved' ? '#F0FDF4' : req.rawStatus === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                  border: `1px solid ${req.rawStatus === 'approved' ? '#86EFAC' : req.rawStatus === 'rejected' ? '#FCA5A5' : '#FCD34D'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', color: req.rawStatus === 'approved' ? '#166534' : req.rawStatus === 'rejected' ? '#991B1B' : '#92400E', fontSize: '13.5px' }}>
                    طلب [{req.type}] {req.rawStatus === 'approved' ? '✓ تم اعتماده من الإدارة' : req.rawStatus === 'rejected' ? '✕ تم رفضه' : '⏳ قيد المراجعة والتدقيق لدى الإدارة'}
                  </span>
                  <span style={{ fontSize: '11px', background: '#FFFFFF', color: '#64748B', padding: '3px 10px', borderRadius: '6px', fontWeight: '800', border: '1px solid #E2E8F0' }}>
                    {req.date}
                  </span>
                </div>
                <div style={{ color: '#475569', fontSize: '12.5px' }}>
                  التخصص: <strong>{req.name}</strong> | الوثيقة المرفقة: <u>{req.fileName}</u>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #F1F5F9', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setSpecMode('add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: specMode === 'add' ? '#0A3254' : '#F1F5F9',
              color: specMode === 'add' ? '#FFFFFF' : '#475569',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>طلب إضافة تخصص إضافي</span>
          </button>

          <button
            type="button"
            onClick={() => setSpecMode('change')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: specMode === 'change' ? '#0A3254' : '#F1F5F9',
              color: specMode === 'change' ? '#FFFFFF' : '#475569',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>طلب تغيير التخصص الرئيسي</span>
          </button>
        </div>

        {/* SUB-SECTION A: ADD ADDITIONAL SPECIALIZATION */}
        {specMode === 'add' && (
          <form onSubmit={(e) => handleSubmitSpecRequest(e, 'add')}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '22px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0A3254', marginBottom: '16px', fontFamily: "'Tajawal', sans-serif" }}>
                تقديم طلب إضافة تخصص استشاري إضافي:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    اختر التخصص الإضافي المطلوب (مستبعد منه تخصصاتك الحالية تلقائياً):
                  </label>
                  <select
                    value={addSpec.selectedId}
                    onChange={(e) => setAddSpec({ ...addSpec, selectedId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      fontWeight: '700',
                      color: '#1E293B',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    <option value="">-- اضغط لاختيار تخصص إضافي من القائمة المتاحة --</option>
                    {availableToAdd.length === 0 ? (
                      <option disabled value="">
                        ✓ لقد تم اعتماد جميع التخصصات المتاحة في المنصة لحسابك
                      </option>
                    ) : (
                      availableToAdd.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    سبب طلب إضافة التخصص والمؤهلات الداعمة:
                  </label>
                  <textarea
                    rows="3"
                    placeholder="يرجى توضيح الخبرات والمشاريع الداعمة لهذا التخصص..."
                    value={addSpec.reason}
                    onChange={(e) => setAddSpec({ ...addSpec, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      boxSizing: 'border-box',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    إرفاق وثيقة الاعتماد أو شهادة المؤهل (PDF أو صورة):
                  </label>
                  {addSpec.proofFileName ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#F0FDF4',
                        border: '1px solid #86EFAC',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13.5px', fontFamily: "'Tajawal', sans-serif" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" x2="8" y1="13" y2="13" />
                          <line x1="16" x2="8" y1="17" y2="17" />
                        </svg>
                        <span>{addSpec.proofFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddSpec((prev) => ({ ...prev, proofFileName: '', proofUrl: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>حذف</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => docAddInputRef.current?.click()}
                      style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ color: '#0A3254', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="M12 12v9" />
                          <path d="m16 16-4-4-4 4" />
                        </svg>
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                        اضغط هنا لرفع رخصة JCPA أو وثيقة الاعتماد
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px', fontFamily: "'Tajawal', sans-serif" }}>
                        ملفات PDF أو صور حتى 10 ميجابايت
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                  <button
                    type="submit"
                    disabled={loading || availableToAdd.length === 0}
                    style={{
                      background: '#0A3254',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 28px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: loading || availableToAdd.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(10, 50, 84, 0.25)',
                      transition: 'all 0.2s',
                      opacity: loading || availableToAdd.length === 0 ? 0.6 : 1,
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>{loading ? 'جاري الإرسال...' : 'إرسال طلب إضافة التخصص للإدارة'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* SUB-SECTION B: CHANGE MAIN SPECIALIZATION */}
        {specMode === 'change' && (
          <form onSubmit={(e) => handleSubmitSpecRequest(e, 'change')}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '22px' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0A3254', marginBottom: '16px', fontFamily: "'Tajawal', sans-serif" }}>
                طلب تغيير التخصص الرئيسي المعتمد:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    اختر التخصص الرئيسي الجديد (مستبعد منه تخصصك الرئيسي الحالي):
                  </label>
                  <select
                    value={changeSpec.selectedId}
                    onChange={(e) => setChangeSpec({ ...changeSpec, selectedId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      fontWeight: '700',
                      color: '#1E293B',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    <option value="">-- اضغط لاختيار التخصص الجديد من القائمة الرسمية --</option>
                    {availableToChange.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    سبب طلب تغيير التخصص الرئيسي:
                  </label>
                  <textarea
                    rows="3"
                    placeholder="يرجى توضيح سبب تغيير التخصص الرئيسي والشهادات الداعمة..."
                    value={changeSpec.reason}
                    onChange={(e) => setChangeSpec({ ...changeSpec, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      boxSizing: 'border-box',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '8px', fontFamily: "'Tajawal', sans-serif" }}>
                    إرفاق رخصة JCPA أو المؤهل الجديد (PDF أو صورة):
                  </label>
                  {changeSpec.proofFileName ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#F0FDF4',
                        border: '1px solid #86EFAC',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13.5px', fontFamily: "'Tajawal', sans-serif" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" x2="8" y1="13" y2="13" />
                          <line x1="16" x2="8" y1="17" y2="17" />
                        </svg>
                        <span>{changeSpec.proofFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangeSpec((prev) => ({ ...prev, proofFileName: '', proofUrl: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span>حذف</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => docChangeInputRef.current?.click()}
                      style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ color: '#0A3254', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="M12 12v9" />
                          <path d="m16 16-4-4-4 4" />
                        </svg>
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                        اضغط هنا لرفع الوثيقة الجديدة أو رخصة JCPA
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px', fontFamily: "'Tajawal', sans-serif" }}>
                        ملفات PDF أو صور حتى 10 ميجابايت
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                  <button
                    type="submit"
                    disabled={loading || availableToChange.length === 0}
                    style={{
                      background: '#0A3254',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 28px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: loading || availableToChange.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(10, 50, 84, 0.25)',
                      transition: 'all 0.2s',
                      opacity: loading || availableToChange.length === 0 ? 0.6 : 1,
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>{loading ? 'جاري الإرسال...' : 'إرسال طلب تغيير التخصص للإدارة'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

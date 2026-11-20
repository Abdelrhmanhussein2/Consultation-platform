import React, { useState } from 'react';

const BASE_FILE_CONFIGS = [
  { key: 'idProof', urlKey: 'idProofUrl', nameKey: 'idProofName', title: 'صورة إثبات الشخصية', required: true, subtitle: 'بطاقة الأحوال أو جواز السفر (PDF أو صورة)' },
  { key: 'academicCert', urlKey: 'academicCertUrl', nameKey: 'academicCertName', title: 'الشهادات الأكاديمية', required: true, subtitle: 'شهادة البكالوريوس أو الدراسات العليا' },
  { key: 'professionalLicense', urlKey: 'professionalLicenseUrl', nameKey: 'professionalLicenseName', title: 'التراخيص المهنية والاعتمادات', required: true, subtitle: 'مزاولة المهنة أو الاعتماد المهني الرسمي' },
  { key: 'jcpaCert', urlKey: 'jcpaCertUrl', nameKey: 'jcpaCertName', title: 'إجازة المحاسب القانوني JCPA', required: true, subtitle: 'شهادة ترخيص وإجازة مدقق الحسابات القانوني JCPA' },
  { key: 'expertsSocietyCert', urlKey: 'expertsSocietyCertUrl', nameKey: 'expertsSocietyCertName', title: 'شهادة العضوية في جمعية الخبراء', required: false, subtitle: 'شهادة العضوية السارية (اختياري)' },
];

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function ConsultantFilesStep({ files, onFileUploaded, onNext, onBack, activityType = 'مستشار ضريبي' }) {
  const [uploadingKey, setUploadingKey] = useState(null);
  const [error, setError] = useState('');

  const isAuditor = activityType === 'مدقق حسابات';

  // Filter file configs: Only show JCPA certificate requirement if activity is مدقق حسابات
  const activeConfigs = BASE_FILE_CONFIGS.filter((cfg) => {
    if (cfg.key === 'jcpaCert') {
      return isAuditor;
    }
    return true;
  });

  const handleUpload = async (key, file) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError('صيغة الملف غير مدعومة. الصيغ المسموحة هي: PDF, JPG, PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب ألا يتجاوز 5 ميجابايت');
      return;
    }
    setError('');
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/auth/upload-commercial-register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onFileUploaded(key, data.url, file.name);
      } else {
        setError(data.detail || 'فشل رفع الملف. يرجى إعادة المحاولة.');
      }
    } catch {
      setError('حدث خطأ في الاتصال أثناء رفع الملف.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemove = (key) => {
    setError('');
    onFileUploaded(key, null, null);
  };

  const handleProceed = () => {
    setError('');
    if (!files.idProofUrl) {
      setError('يرجى رفع صورة إثبات الشخصية للمتابعة');
      return;
    }
    if (!files.academicCertUrl) {
      setError('يرجى رفع الشهادات الأكاديمية للمتابعة');
      return;
    }
    if (!files.professionalLicenseUrl) {
      setError('يرجى رفع التراخيص المهنية والاعتمادات للمتابعة');
      return;
    }
    if (isAuditor && !files.jcpaCertUrl) {
      setError('يرجى رفع شهادة إجازة المحاسب القانوني JCPA للمتابعة');
      return;
    }
    onNext();
  };

  return (
    <div className="consultant-files-step" style={{ minWidth: 0 }}>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.5 }}>
        ارفع ملفات المستندات والتراخيص المطلوبة. الحد الأقصى 5MB لكل ملف بصيغة PDF أو JPG أو PNG
      </p>

      {error && (
        <div className="auth-alert auth-alert-danger" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', minWidth: 0 }}>
        {activeConfigs.map((cfg) => {
          const fileUrl = files[cfg.urlKey];
          const fileName = files[cfg.nameKey];
          const isUploading = uploadingKey === cfg.key;

          return (
            <div
              key={cfg.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: fileUrl ? '#F8FAFC' : '#FFFFFF',
                border: fileUrl ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                borderRadius: '10px',
                gap: '12px',
                minWidth: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={fileUrl ? '#0D3C5C' : '#64748B'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  {fileUrl ? (
                    <>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </>
                  ) : (
                    <>
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </>
                  )}
                </svg>

                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cfg.title} {cfg.required && <span style={{ color: '#DC2626' }}>*</span>}
                  </div>
                  <div
                    title={fileName || cfg.subtitle}
                    style={{
                      fontSize: '12px',
                      color: fileUrl ? '#475569' : '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {fileName ? fileName : cfg.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {isUploading ? (
                  <span style={{ fontSize: '12px', color: '#0D3C5C', fontWeight: '600' }}>جاري الرفع...</span>
                ) : fileUrl ? (
                  <>
                    <label style={{ cursor: 'pointer', fontSize: '11.5px', fontWeight: '700', color: '#0D3C5C', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '5px 12px', borderRadius: '6px', margin: 0, transition: 'all 0.15s ease' }}>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleUpload(cfg.key, e.target.files?.[0])} hidden />
                      استبدال
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemove(cfg.key)}
                      title="حذف الملف"
                      style={{
                        cursor: 'pointer',
                        color: '#DC2626',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#FFFFFF', background: '#0D3C5C', padding: '6px 12px', borderRadius: '6px', margin: 0 }}>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleUpload(cfg.key, e.target.files?.[0])} hidden />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>رفع الملف</span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="auth-row-2col" style={{ marginTop: '16px' }}>
        <button type="button" className="auth-btn-outline" onClick={onBack}>
          السابق
        </button>
        <button type="button" className="auth-btn-gold" onClick={handleProceed}>
          التالي
        </button>
      </div>
    </div>
  );
}

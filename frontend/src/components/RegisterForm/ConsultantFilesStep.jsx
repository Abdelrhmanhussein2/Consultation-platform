import React, { useState } from 'react';

const FILE_CONFIGS = [
  { key: 'idProof', urlKey: 'idProofUrl', nameKey: 'idProofName', title: 'صورة إثبات الشخصية', required: true, subtitle: 'بطاقة الأحوال أو جواز السفر (PDF / صورة)' },
  { key: 'academicCert', urlKey: 'academicCertUrl', nameKey: 'academicCertName', title: 'الشهادات الأكاديمية', required: true, subtitle: 'شهادة البكالوريوس أو الدراسات العليا' },
  { key: 'professionalLicense', urlKey: 'professionalLicenseUrl', nameKey: 'professionalLicenseName', title: 'التراخيص المهنية والاعتمادات', required: true, subtitle: 'مزاولة المهنة أو الاعتماد المهني الرسمي' },
  { key: 'jcpaCert', urlKey: 'jcpaCertUrl', nameKey: 'jcpaCertName', title: 'شهادة JCPA', required: false, subtitle: 'المحاسب القانوني الأردني (اختياري)' },
  { key: 'expertsSocietyCert', urlKey: 'expertsSocietyCertUrl', nameKey: 'expertsSocietyCertName', title: 'شهادة العضوية في جمعية الخبراء', required: false, subtitle: 'شهادة العضوية السارية (اختياري)' },
];

export default function ConsultantFilesStep({ files, onFileUploaded, onNext, onBack }) {
  const [uploadingKey, setUploadingKey] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (key, file) => {
    if (!file) return;
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
    onNext();
  };

  return (
    <div className="consultant-files-step">
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.5 }}>
        ارفع ملفات المستندات والتراخيص المطلوبة. الحد الأقصى 5MB لكل ملف
      </p>

      {error && (
        <div className="auth-alert auth-alert-danger" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {FILE_CONFIGS.map((cfg) => {
          const fileUrl = files[cfg.urlKey];
          const fileName = files[cfg.nameKey];
          const isUploading = uploadingKey === cfg.key;

          return (
            <div key={cfg.key} className="auth-file-card" style={{ transition: 'all 0.2s ease' }}>
              <div className="auth-file-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={fileUrl ? '#16A34A' : 'var(--brand-blue, #005D9C)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="auth-file-icon"
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

                <div className="auth-file-texts">
                  <span className="auth-file-title">
                    {cfg.title} {cfg.required && <span className="required-star">*</span>}
                  </span>
                  <span className="auth-file-subtitle" style={{ color: fileUrl ? '#16A34A' : '#64748B' }}>
                    {fileName ? `✓ ${fileName}` : cfg.subtitle}
                  </span>
                </div>
              </div>

              <label className={`auth-file-btn ${isUploading ? 'disabled' : ''}`}>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => handleUpload(cfg.key, e.target.files?.[0])}
                  disabled={isUploading}
                  hidden
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>{isUploading ? 'جاري الرفع...' : fileUrl ? 'تم الرفع ✓' : 'رفع الملف'}</span>
              </label>
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

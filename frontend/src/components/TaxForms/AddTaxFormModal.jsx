import React, { useState } from 'react';
import { TAX_FORM_CATEGORIES } from './taxFormsData';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UploadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default function AddTaxFormModal({ isOpen, onClose, onAddForm }) {
  const availableCategories = TAX_FORM_CATEGORIES.filter((c) => c !== 'الكل');
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    cat: availableCategories[0] || 'ضريبة الدخل',
    lang: 'AR / EN',
    format: 'PDF · DOCX',
    desc: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const ext = file.name.split('.').pop().toUpperCase();
    const detectedFormat = ext === 'PDF' ? 'PDF' : ext.startsWith('DOC') ? 'DOCX' : 'PDF · DOCX';
    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      format: detectedFormat
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let fileUrl = null;
    if (selectedFile) {
      try {
        fileUrl = URL.createObjectURL(selectedFile);
      } catch {}
    }

    const newForm = {
      id: 'form-' + Date.now(),
      title: formData.title.trim(),
      code: formData.code.trim() || 'F-TX-' + Math.floor(100 + Math.random() * 900),
      cat: formData.cat,
      lang: formData.lang.trim() || 'AR / EN',
      format: formData.format.trim() || 'PDF · DOCX',
      desc: formData.desc.trim() || 'نموذج رسمي معتمد صادر عن دائرة ضريبة الدخل والمبيعات.',
      file_name: selectedFile ? selectedFile.name : null,
      file_url: fileUrl,
      isNew: true
    };

    onAddForm(newForm);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="tax-modal-backdrop" onClick={onClose}>
      <div className="tax-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tax-modal-header">
          <h2 className="tax-modal-title">
            <PlusIcon size={18} />
            <span>إضافة نموذج ضريبي جديد</span>
          </h2>
          <button type="button" className="tax-modal-close" onClick={onClose} aria-label="إغلاق">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tax-modal-body">
          <div className="tax-form-group">
            <label className="tax-form-label">عنوان / اسم النموذج *</label>
            <input
              type="text"
              required
              className="tax-form-input"
              placeholder="مثال: نموذج إقرار ضريبة الدخل للأفراد — 2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="tax-modal-grid-2">
            <div className="tax-form-group">
              <label className="tax-form-label">التصنيف *</label>
              <select
                className="tax-form-select"
                value={formData.cat}
                onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="tax-form-group">
              <label className="tax-form-label">رمز النموذج (اختياري)</label>
              <input
                type="text"
                className="tax-form-input"
                placeholder="مثال: F-IT-IND-25"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="tax-modal-grid-2">
            <div className="tax-form-group">
              <label className="tax-form-label">صيغة الملف</label>
              <input
                type="text"
                className="tax-form-input"
                placeholder="PDF · DOCX"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              />
            </div>

            <div className="tax-form-group">
              <label className="tax-form-label">اللغة</label>
              <input
                type="text"
                className="tax-form-input"
                placeholder="AR / EN"
                value={formData.lang}
                onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
              />
            </div>
          </div>

          <div className="tax-form-group">
            <label className="tax-form-label">وصف النموذج والتعليمات</label>
            <textarea
              rows={3}
              className="tax-form-textarea"
              placeholder="اكتب وصفاً موجزاً للنموذج والجهة الموجه إليها..."
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          {/* Upload PDF / Word Dropzone */}
          <div className="tax-form-group">
            <label className="tax-form-label">إرفاق ملف النموذج (PDF أو Word)</label>
            <label className="tax-file-upload-box">
              <UploadIcon size={18} />
              <span>
                {selectedFile
                  ? `الملف المختار: ${selectedFile.name}`
                  : 'اضغط هنا لرفع ملف بصيغة PDF أو Word (.docx, .doc)'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="tax-modal-actions">
            <button type="button" className="tax-btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="tax-btn-submit">
              حفظ وإضافة النموذج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

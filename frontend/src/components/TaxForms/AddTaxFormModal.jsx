import React, { useState, useEffect } from 'react';
import { TAX_FORM_CATEGORIES } from './taxFormsData';
import ModernSelect from '../ModernSelect';

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);

const UploadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

export default function AddTaxFormModal({
  isOpen,
  onClose,
  onAddForm,
  onUpdateForm,
  initialForm = null
}) {
  const availableCategories = TAX_FORM_CATEGORIES.filter((c) => c !== 'الكل');
  const isEditing = Boolean(initialForm);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    cat: availableCategories[0] || 'ضريبة الدخل',
    lang: 'AR / EN',
    format: 'PDF · DOCX',
    desc: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (initialForm) {
      setFormData({
        title: initialForm.title || '',
        code: initialForm.code || '',
        cat: initialForm.cat || availableCategories[0] || 'ضريبة الدخل',
        lang: initialForm.lang || 'AR / EN',
        format: initialForm.format || 'PDF · DOCX',
        desc: initialForm.desc || ''
      });
      setSelectedFile(null);
    } else {
      setFormData({
        title: '',
        code: '',
        cat: availableCategories[0] || 'ضريبة الدخل',
        lang: 'AR / EN',
        format: 'PDF · DOCX',
        desc: ''
      });
      setSelectedFile(null);
    }
  }, [initialForm, isOpen]);

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

    let fileUrl = initialForm?.file_url || null;
    let fileName = initialForm?.file_name || null;
    if (selectedFile) {
      try {
        fileUrl = URL.createObjectURL(selectedFile);
        fileName = selectedFile.name;
      } catch {}
    }

    const payload = {
      title: formData.title.trim(),
      code: formData.code.trim() || initialForm?.code || 'F-TX-' + Math.floor(100 + Math.random() * 900),
      cat: formData.cat,
      lang: formData.lang.trim() || 'AR / EN',
      format: formData.format.trim() || 'PDF · DOCX',
      desc: formData.desc.trim() || 'نموذج رسمي معتمد صادر عن دائرة ضريبة الدخل والمبيعات.',
      file_name: fileName,
      file_url: fileUrl
    };

    if (isEditing) {
      onUpdateForm?.({ ...initialForm, ...payload });
    } else {
      onAddForm?.({
        ...payload,
        id: 'form-' + Date.now(),
        isNew: true
      });
    }

    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="tax-modal-backdrop" onClick={onClose}>
      <div className="tax-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tax-modal-header">
          <h2 className="tax-modal-title">
            {isEditing ? <EditIcon size={18} /> : <PlusIcon size={18} />}
            <span>{isEditing ? 'تعديل النموذج الضريبي' : 'إضافة نموذج ضريبي جديد'}</span>
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
              <ModernSelect
                options={availableCategories}
                value={formData.cat}
                onChange={(val) => setFormData({ ...formData, cat: val })}
                placeholder="اختر التصنيف"
              />
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
                  : initialForm?.file_name
                  ? `الملف الحالي: ${initialForm.file_name} (اضغط للتغيير)`
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
              {isEditing ? 'حفظ التعديلات' : 'حفظ وإضافة النموذج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

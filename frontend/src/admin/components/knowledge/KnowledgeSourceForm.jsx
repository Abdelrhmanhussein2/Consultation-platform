import React, { useRef } from 'react';
import { IconUpload, IconSave, IconSync } from './KnowledgeIcons';
import { KIND_SELECT_OPTIONS, getAuthHeaders } from './knowledgeData';
import ModernSelect from '../../../components/ModernSelect';

export default function KnowledgeSourceForm({
  formData,
  setFormData,
  onSave,
  onReset,
  isExtracting,
  setIsExtracting,
  onNotify
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsExtracting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('source_type', 'law');
      const res = await fetch('/api/legal/extract-preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: fd
      });
      if (res.ok) {
        const result = await res.json();
        const d = result.data || {};
        setFormData((prev) => ({
          ...prev,
          file: file,
          fileName: file.name,
          fileSize: file.size,
          title: d.title || prev.title,
          code: d.code || prev.code,
          year: d.year || prev.year,
          tags: d.tags || prev.tags,
          body: d.body || prev.body
        }));
        onNotify('تم استخراج بيانات القانون والمواد كاملة تلقائياً بنجاح');
      } else {
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
        setFormData((prev) => ({ ...prev, file, fileName: file.name, fileSize: file.size, title: prev.title || cleanName }));
        onNotify('تم رفع الملف؛ يمكنك مراجعة البيانات وحفظها');
      }
    } catch (err) {
      onNotify('حدث خطأ أثناء قراءة الملف: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const isFormValid = formData.title && formData.title.trim().length >= 2 && formData.body && formData.body.trim().length >= 20;

  return (
    <section className="knowledge-bento-panel knowledge-form-card">
      <h2 className="knowledge-form-title">
        <span>{formData.id ? 'تعديل مصدر قانوني' : 'إضافة قانون / مادة جديدة'}</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <label className={`knowledge-dropzone ${isExtracting ? 'extracting' : ''}`}>
          {isExtracting ? (
            <>
              <IconSync className="size-4 spin-animate" />
              <span>جارٍ قراءة الملف واستخراج النصوص...</span>
            </>
          ) : (
            <>
              <IconUpload className="size-4" />
              <span>{formData.fileName ? `الملف: ${formData.fileName}` : 'رفع PDF / DOCX / XLSX / TXT واستخراج النص'}</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </label>

        <div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="عنوان القانون أو التعليمات"
            className="knowledge-input"
          />
        </div>

        <div className="knowledge-form-grid-2">
          <div>
            <ModernSelect
              options={KIND_SELECT_OPTIONS}
              value={formData.kind}
              onChange={(val) => setFormData({ ...formData, kind: val })}
              placeholder="نوع القانون"
            />
          </div>

          <div>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || null })}
              placeholder="السنة (مثال: 2024)"
              className="knowledge-input"
            />
          </div>
        </div>

        <div className="knowledge-form-grid-2">
          <div>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="رقم / رمز المصدر (مثال: ITL-34-2014)"
              className="knowledge-input"
            />
          </div>

          <div>
            <input
              type="text"
              value={formData.sourceUrl || ''}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="رابط المصدر الرسمي (اختياري)"
              className="knowledge-input"
            />
          </div>
        </div>

        <div>
          <input
            type="text"
            value={formData.tags || ''}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="وسوم: شركات، دخل، فوترة، إعفاءات (مفصولة بفواصل)"
            className="knowledge-input"
          />
        </div>

        <div>
          <textarea
            value={formData.body || ''}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="النص القانوني الكامل أو النص المستخرج القابل للفهرسة في RAG..."
            className="knowledge-textarea"
          />
        </div>

        <button
          type="button"
          disabled={!isFormValid}
          onClick={onSave}
          className="btn-primary-action"
        >
          <IconSave className="size-4" />
          <span>حفظ وفهرسة وربط تلقائي</span>
        </button>

        {formData.id && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary-action"
          >
            إضافة جديد بدل التعديل
          </button>
        )}
      </div>
    </section>
  );
}


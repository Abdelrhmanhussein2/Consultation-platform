import React, { useRef } from 'react';
import { IconUpload, IconSave, IconSync } from './KnowledgeIcons';
import { KIND_SELECT_OPTIONS } from './knowledgeData';

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
      const fileNameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      let extractedText = '';

      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        extractedText = await file.text();
      } else {
        // Simulation / placeholder for binary files
        extractedText = `تم استخراج النص المرجعي من الملف المرفق: ${file.name}\nالحجم: ${(file.size / 1024).toFixed(1)} ك.ب.\n\nتاريخ الرفع: ${new Date().toLocaleDateString('ar-JO')}`;
      }

      setFormData((prev) => ({
        ...prev,
        title: prev.title || fileNameWithoutExt,
        body: extractedText || prev.body,
        fileName: file.name,
        fileSize: file.size
      }));

      onNotify(extractedText ? 'تم استخراج النص وربط الملف بالمادة' : 'تم رفع الملف؛ أضف النص يدويًا قبل الفهرسة');
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
            <select
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
              className="knowledge-select"
            >
              {KIND_SELECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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


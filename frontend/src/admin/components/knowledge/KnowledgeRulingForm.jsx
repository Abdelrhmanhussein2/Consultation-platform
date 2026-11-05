import React, { useRef } from 'react';
import { IconUpload, IconSave, IconSync } from './KnowledgeIcons';
import { COURT_OPTIONS } from './knowledgeData';
import ModernSelect from '../../../components/ModernSelect';

export default function KnowledgeRulingForm({
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
        extractedText = `تم استخراج منطوق ومبدأ الحكم القضائي من الملف المرفق: ${file.name}\nالحجم: ${(file.size / 1024).toFixed(1)} ك.ب.\n\nتاريخ الرفع: ${new Date().toLocaleDateString('ar-JO')}`;
      }

      setFormData((prev) => ({
        ...prev,
        title: prev.title || fileNameWithoutExt,
        principle: extractedText || prev.principle,
        fileName: file.name
      }));

      onNotify(extractedText ? 'تم استخراج منطوق الحكم وربط الملف بالسجل' : 'تم رفع الملف؛ أضف المبدأ القانوني يدوياً');
    } catch (err) {
      onNotify('حدث خطأ أثناء قراءة ملف الحكم: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const isFormValid =
    formData.title &&
    formData.title.trim().length >= 2 &&
    formData.principle &&
    formData.principle.trim().length >= 20;

  return (
    <section className="knowledge-bento-panel knowledge-form-card">
      <h2 className="knowledge-form-title">
        <span>{formData.id ? 'تعديل حكم' : 'إضافة حكم جديد'}</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <label className={`knowledge-dropzone ${isExtracting ? 'extracting' : ''}`}>
          {isExtracting ? (
            <>
              <IconSync className="size-4 spin-animate" />
              <span>جارٍ قراءة الحكم واستخراج المنطوق...</span>
            </>
          ) : (
            <>
              <IconUpload className="size-4" />
              <span>{formData.fileName ? `الملف: ${formData.fileName}` : 'رفع ملف الحكم (PDF / DOCX / TXT) واستخراج المنطوق'}</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.csv"
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
            placeholder="عنوان الحكم أو موضوع النزاع (مثال: قرار تمييز حقوق 2415/2022 - عدم خضوع التعويضات للضريبة)"
            className="knowledge-input"
          />
        </div>

        <div className="knowledge-form-grid-2">
          <div>
            <ModernSelect
              options={COURT_OPTIONS}
              value={formData.court}
              onChange={(val) => setFormData({ ...formData, court: val })}
              placeholder="اختر المحكمة"
            />
          </div>

          <div>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || null })}
              placeholder="سنة صدور الحكم (مثال: 2023)"
              className="knowledge-input"
            />
          </div>
        </div>

        <div className="knowledge-form-grid-2">
          <div>
            <input
              type="text"
              value={formData.caseNumber || ''}
              onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
              placeholder="رقم الدعوى / الحكم (مثال: 2415/2022 حقوق تمييز)"
              className="knowledge-input"
            />
          </div>

          <div>
            <input
              type="text"
              value={formData.legalArticle || ''}
              onChange={(e) => setFormData({ ...formData, legalArticle: e.target.value })}
              placeholder="المادة أو القانون محل النزاع (مثال: مادة 3 - قانون ضريبة الدخل)"
              className="knowledge-input"
            />
          </div>
        </div>

        <div>
          <input
            type="text"
            value={formData.tags || ''}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="وسوم وتصنيفات: تمييز، ديون هالكة، استئناف، تقادم، غرامات (مفصولة بفواصل)"
            className="knowledge-input"
          />
        </div>

        <div>
          <textarea
            value={formData.principle || ''}
            onChange={(e) => setFormData({ ...formData, principle: e.target.value })}
            placeholder="المبدأ القانوني المستخلص، حيثيات القرار، ومنطوق الحكم القابل للفهرسة والاسترجاع في RAG..."
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
          <span>حفظ وفهرسة الحكم القضائي</span>
        </button>

        {formData.id && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary-action"
          >
            إلغاء التعديل
          </button>
        )}
      </div>
    </section>
  );
}


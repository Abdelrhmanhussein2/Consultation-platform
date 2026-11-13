import React, { useRef, useState } from 'react';
import { IconUpload, IconSave, IconSync } from './KnowledgeIcons';
import { getAuthHeaders } from './knowledgeData';
import KnowledgeDuplicateAlert from './KnowledgeDuplicateAlert';

export default function KnowledgeRulingForm({
  formData,
  setFormData,
  onSave,
  onReset,
  isExtracting,
  setIsExtracting,
  isSaving = false,
  onNotify
}) {
  const fileInputRef = useRef(null);
  const [duplicateMsg, setDuplicateMsg] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsExtracting(true);
    setDuplicateMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('source_type', 'judgment');
      const res = await fetch('/api/legal/extract-preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: fd
      });
      if (res.ok) {
        const result = await res.json();
        const d = result.data || {};
        if (d.is_duplicate) {
          setDuplicateMsg(d.duplicate_message || 'هذا الحكم القضائي موجود بالفعل في المنصة.');
        }
        setFormData((prev) => ({
          ...prev,
          file: file,
          fileName: file.name,
          title: d.title || prev.title,
          court: d.court || prev.court,
          year: d.year || prev.year,
          caseNumber: d.case_number || prev.caseNumber,
          legalArticle: d.dispute_item || prev.legalArticle,
          tags: d.tags || prev.tags,
          principle: d.principle || prev.principle
        }));
        onNotify(d.is_duplicate ? (d.duplicate_message || 'هذا الحكم القضائي موجود بالفعل في المنصة.') : 'تم استخراج بيانات الحكم والنص الكامل تلقائياً بنجاح');
      } else {
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
        setFormData((prev) => ({ ...prev, file, fileName: file.name, title: prev.title || cleanName }));
        onNotify('تم رفع الملف؛ أضف المبدأ القانوني يدوياً');
      }
    } catch (err) {
      onNotify('حدث خطأ أثناء قراءة ملف الحكم: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const isFormValid = Boolean(formData.title?.trim().length >= 2 && formData.principle?.trim().length >= 20);

  return (
    <section className="knowledge-bento-panel knowledge-form-card">
      <h2 className="knowledge-form-title">
        <span>{formData.id ? 'تعديل حكم' : 'إضافة حكم جديد'}</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <label className={`knowledge-dropzone ${isExtracting ? 'extracting' : ''}`}>
          {isExtracting ? (
            <><IconSync className="size-4 spin-animate" /><span>جارٍ قراءة ملف الحكم واستخراج المنطوق...</span></>
          ) : (
            <><IconUpload className="size-4" /><span>{formData.fileName ? `الملف: ${formData.fileName}` : 'رفع ملف حكم word'}</span></>
          )}
          <input
            ref={fileInputRef} type="file" accept=".docx,.doc,.pdf,.txt" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
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
            <input
              type="text"
              value="حكم قضائي"
              disabled
              readOnly
              className="knowledge-input"
              style={{ background: '#F8FAFC', color: '#0D3C5C', fontWeight: 750, cursor: 'default' }}
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

        <KnowledgeDuplicateAlert message={duplicateMsg} />

        <button
          type="button"
          disabled={!isFormValid || isSaving || Boolean(duplicateMsg)}
          onClick={onSave}
          className="btn-primary-action"
          style={isSaving || duplicateMsg ? { opacity: 0.65, cursor: 'not-allowed', filter: duplicateMsg ? 'grayscale(0.8)' : 'grayscale(0.4)', pointerEvents: duplicateMsg ? 'none' : undefined } : undefined}
        >
          {isSaving ? (
            <>
              <IconSync className="size-4 spin-animate" />
              <span>جارٍ رفع الحكم وفهرسته...</span>
            </>
          ) : duplicateMsg ? (
            <span>هذا الحكم القضائي موجود بالفعل</span>
          ) : (
            <>
              <IconSave className="size-4" />
              <span>حفظ وفهرسة الحكم القضائي</span>
            </>
          )}
        </button>

        {formData.id && (
          <button type="button" onClick={() => { setDuplicateMsg(''); onReset && onReset(); }} className="btn-secondary-action">
            إلغاء التعديل
          </button>
        )}
      </div>
    </section>
  );
}


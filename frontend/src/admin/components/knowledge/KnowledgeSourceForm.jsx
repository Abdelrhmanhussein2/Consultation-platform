import React, { useRef, useState } from 'react';
import { IconUpload, IconSave, IconSync } from './KnowledgeIcons';
import { getAuthHeaders } from './knowledgeData';
import KnowledgeDuplicateAlert from './KnowledgeDuplicateAlert';
import KnowledgeRelationSection from './KnowledgeRelationSection';

export default function KnowledgeSourceForm({
  formData,
  setFormData,
  onSave,
  onReset,
  isExtracting,
  setIsExtracting,
  isSaving = false,
  onNotify,
  parentLaws = []
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
        if (d.is_duplicate) {
          setDuplicateMsg(d.duplicate_message || 'هذا القانون موجود بالفعل في المنصة.');
        }
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
        onNotify(d.is_duplicate ? (d.duplicate_message || 'هذا القانون موجود بالفعل في المنصة.') : 'تم استخراج بيانات القانون والمواد كاملة تلقائياً بنجاح');
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
            <><IconSync className="size-4 spin-animate" /><span>جارٍ قراءة ملف القانون واستخراج النصوص...</span></>
          ) : (
            <><IconUpload className="size-4" /><span>{formData.fileName ? `الملف: ${formData.fileName}` : 'تحميل ملف قانون word'}</span></>
          )}
          <input
            ref={fileInputRef} type="file" accept=".docx,.doc,.pdf,.txt" style={{ display: 'none' }}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }}
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
            <input
              type="text"
              value="قانون"
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

        <KnowledgeRelationSection
          mode="legislative"
          formData={formData}
          setFormData={setFormData}
          parentLaws={parentLaws}
        />

        <div>
          <textarea
            value={formData.body || ''}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="النص القانوني الكامل أو النص المستخرج القابل للفهرسة في RAG..."
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
              <span>جارٍ رفع القانون وفهرسته...</span>
            </>
          ) : duplicateMsg ? (
            <span>هذا القانون موجود بالفعل</span>
          ) : (
            <>
              <IconSave className="size-4" />
              <span>حفظ وفهرسة وربط تلقائي</span>
            </>
          )}
        </button>

        {formData.id && (
          <button type="button" onClick={() => { setDuplicateMsg(''); onReset && onReset(); }} className="btn-secondary-action">
            إضافة جديد بدل التعديل
          </button>
        )}
      </div>
    </section>
  );
}


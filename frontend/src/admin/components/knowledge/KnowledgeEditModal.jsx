import React, { useState, useEffect } from 'react';
import { IconSave } from './KnowledgeIcons';
import { fetchDocumentRelations } from './knowledgeApi';
import KnowledgeRelationSection from './KnowledgeRelationSection';
import LawDependentsSummary from './LawDependentsSummary';
import { NORMALIZE_LEGAL_TYPE } from './knowledgeData';

export default function KnowledgeEditModal({
  isOpen,
  source,
  onSave,
  onClose
}) {
  const [formData, setFormData] = useState({
    title: '', year: '', number: '', court: '', body: '', is_active: true,
    related_laws: [], relation_type: 'none', sub_category: 'نظام', court_category: 'تمييز حقوق',
    document_status: 'ساري', article_ref: '', effective_date: '', notes: ''
  });
  const [initialRelations, setInitialRelations] = useState([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!source || !isOpen) return;
    let cleanNum = '';
    if (source.number && source.number !== '-') {
      cleanNum = String(source.number).split(' لسنة')[0].split('/')[0].trim();
    } else if (source.code) {
      const m = source.code.match(/رقم\s*(\d+)/);
      cleanNum = m ? m[1] : '';
    }

    const baseDocStatus = source.status || source.document_status || 'ساري';
    const baseSubCategory = NORMALIZE_LEGAL_TYPE(source.doc_type || source.type || source.sub_category || 'نظام');

    const baseForm = {
      title: source.title || '', year: source.year && source.year !== '-' ? source.year : '',
      number: cleanNum, court: source.court || '', body: source.body || '', is_active: source.is_active ?? true,
      related_laws: [], relation_type: 'none', sub_category: baseSubCategory, court_category: 'تمييز حقوق',
      document_status: baseDocStatus, article_ref: '', effective_date: '', notes: ''
    };

    setFormData(baseForm);
    setIsLoadingRelations(true);
    fetchDocumentRelations(source.id)
      .then((rels) => {
        setInitialRelations(rels);
        if (rels && rels.length > 0) {
          const first = rels[0];
          setFormData((prev) => ({
            ...prev,
            related_laws: rels.map((r) => r.parent_law_id),
            relation_type: first.relation_type || 'issued_under',
            sub_category: NORMALIZE_LEGAL_TYPE(first.sub_category || prev.sub_category || 'نظام'),
            court_category: NORMALIZE_LEGAL_TYPE(first.court || first.sub_category || 'تمييز حقوق'),
            document_status: first.document_status || baseDocStatus,
            article_ref: first.article_ref || '',
            effective_date: first.effective_date || '',
            notes: first.notes || ''
          }));
        }
      })
      .finally(() => setIsLoadingRelations(false));
  }, [source, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !source) return null;

  const isJudgment = source.source_type === 'judgment' || source.kind === 'precedent';
  const initialPids = initialRelations.map((r) => r.parent_law_id);
  const currentPids = formData.related_laws || [];
  const addedPids = currentPids.filter((id) => !initialPids.includes(id));
  const removedRels = initialRelations.filter((r) => !currentPids.includes(r.parent_law_id));
  const hasRelationChanges = addedPids.length > 0 || removedRels.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(source.id, source.source_type || 'law', formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13, 60, 92, 0.5)',
        backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', direction: 'rtl'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '720px',
          width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(13, 60, 92, 0.22)',
          border: '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#E58A13' }}>تعديل المصدر والارتباطات</span>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0D3C5C', margin: '4px 0 0' }}>
              {isJudgment ? 'تعديل بيانات وسند الحكم القضائي' : 'تعديل بيانات وارتباطات التشريع والقانون'}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>
              {isJudgment ? 'عنوان الحكم أو النزاع' : 'عنوان القانون / التشريع'}
            </label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="knowledge-input" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isJudgment ? '1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>السنة</label>
              <input type="text" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="knowledge-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>{isJudgment ? 'رقم الحكم' : 'رقم القانون'}</label>
              <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="knowledge-input" />
            </div>
            {isJudgment && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>المحكمة</label>
                <input type="text" value={formData.court} onChange={(e) => setFormData({ ...formData, court: e.target.value })} className="knowledge-input" />
              </div>
            )}
          </div>

          {isLoadingRelations ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
              جاري تحميل بيانات الارتباطات...
            </div>
          ) : (
            <>
              <KnowledgeRelationSection
                mode={isJudgment ? 'judicial' : 'legislative'}
                formData={formData}
                setFormData={setFormData}
                readOnlyStatus={true}
              />
              {!isJudgment && <LawDependentsSummary lawId={source.id} />}
            </>
          )}

          {hasRelationChanges && (
            <div style={{ padding: '10px 14px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '11px', color: '#92400E' }}>
              <div style={{ fontWeight: 800, marginBottom: '4px' }}>ملخص تعديل الارتباطات قبل الحفظ:</div>
              {addedPids.length > 0 && <div>+ سيتم إضافة ربط جديد بـ ({addedPids.length}) قانون أصل</div>}
              {removedRels.length > 0 && <div>- سيتم فك ارتباط ({removedRels.length}) قانون (إلغاء تفعيل السجل وحذف الحافة دون لمس العقد)</div>}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>
              {isJudgment ? 'منطوق ومبدأ الحكم القضائي' : 'نص مواد التشريع والقانون'}
            </label>
            <textarea rows={4} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} className="knowledge-textarea" style={{ minHeight: '90px', maxHeight: '160px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <input type="checkbox" id="isActiveCheck" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '15px', height: '15px', accentColor: '#0D3C5C' }} />
            <label htmlFor="isActiveCheck" style={{ fontSize: '12px', fontWeight: 700, color: '#0D3C5C', cursor: 'pointer' }}>
              المصدر متاح ومفهرس في محرك RAG
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary-action"
              style={{
                padding: '8px 18px',
                minWidth: '130px',
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                pointerEvents: isSaving ? 'none' : 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSaving ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <IconSave className="size-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="btn-secondary-action"
              style={{ padding: '8px 16px', opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

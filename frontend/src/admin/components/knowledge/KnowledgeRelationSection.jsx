import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import ParentLawSelect from './ParentLawSelect';
import {
  RELATION_TYPE_OPTIONS,
  SUB_CATEGORY_LEGAL_OPTIONS,
  COURT_JUDICIAL_OPTIONS,
  DOCUMENT_STATUS_OPTIONS
} from './knowledgeData';

export default function KnowledgeRelationSection({
  mode = 'legislative',
  formData,
  setFormData,
  readOnlyStatus = false
}) {
  const renderStatusField = (label) => (
    <div>
      <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>{label}</label>
      {readOnlyStatus ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #CBD5E1', minHeight: '36px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A3C64' }}>{formData.document_status || 'ساري'}</span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>للتعديل استخدم زر الإلغاء</span>
        </div>
      ) : (
        <ModernSelect
          options={DOCUMENT_STATUS_OPTIONS}
          value={formData.document_status || 'ساري'}
          onChange={(v) => setFormData({ ...formData, document_status: v })}
          placeholder="حالة النفاذ..."
        />
      )}
    </div>
  );

  if (mode === 'judicial') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0A3C64' }}>
          الارتباطات القضائية وسند الحكم:
        </div>
        <div className="knowledge-form-grid-2">
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>تصنيف المحكمة:</label>
            <ModernSelect
              options={COURT_JUDICIAL_OPTIONS}
              value={formData.court_category || 'تمييز حقوق'}
              onChange={(v) => setFormData({ ...formData, court_category: v })}
              placeholder="تصنيف المحكمة..."
            />
          </div>
          {renderStatusField('حالة الحكم / النفاذ:')}
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>القوانين المستند إليها (ارتباط متعدد):</label>
          <ParentLawSelect
            value={formData.related_laws || []}
            onChange={(v) => setFormData({ ...formData, related_laws: v })}
            placeholder="ابحث واختر القوانين التي استند إليها الحكم..."
          />
        </div>
      </div>
    );
  }

  const isLinked = formData.relation_type && formData.relation_type !== 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0A3C64' }}>
        الارتباطات التشريعية والتصنيف:
      </div>
      <div className="knowledge-form-grid-2">
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>طبيعة التشريع / الارتباط:</label>
          <ModernSelect
            options={RELATION_TYPE_OPTIONS}
            value={formData.relation_type || 'none'}
            onChange={(v) => setFormData({ ...formData, relation_type: v })}
            placeholder="طبيعة الارتباط..."
          />
        </div>
        {renderStatusField('حالة الوثيقة:')}
      </div>

      {isLinked && (
        <div className="knowledge-form-grid-2">
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>التصنيف التشريعي الفرعي:</label>
            <ModernSelect
              options={SUB_CATEGORY_LEGAL_OPTIONS}
              value={formData.sub_category || 'الأنظمة'}
              onChange={(v) => setFormData({ ...formData, sub_category: v })}
              placeholder="التصنيف الفرعي..."
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>القوانين الأصلية المرتبطة:</label>
            <ParentLawSelect
              value={formData.related_laws || []}
              onChange={(v) => setFormData({ ...formData, related_laws: v })}
              placeholder="ابحث واختر القوانين المرتبطة..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import {
  LEGAL_FORM_OPTIONS,
  SECTOR_OPTIONS
} from './broadcastConstants';

export default function UserTargetFilters({ filters, onChange, onReset }) {
  const selectedLegalForms = Array.isArray(filters.legal_form)
    ? filters.legal_form.filter(f => f !== 'all')
    : (filters.legal_form && filters.legal_form !== 'all' ? [filters.legal_form] : []);
  const selectedSectors = Array.isArray(filters.sector)
    ? filters.sector.filter(s => s !== 'all')
    : (filters.sector && filters.sector !== 'all' ? [filters.sector] : []);

  const isFiltered = selectedLegalForms.length > 0 || selectedSectors.length > 0;

  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: '800',
            color: '#0e3b5e'
          }}
        >
          فلاتر تخصيص المستخدمين والشركات (تحديد متعدد)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFiltered && (
            <span
              style={{
                fontSize: '11px',
                color: '#0A3C64',
                background: '#EBF3FA',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: '700'
              }}
            >
              فلاتر نشطة
            </span>
          )}
          <FilterResetButton
            onClick={onReset}
            title="إعادة تعيين فلاتر المستخدمين"
            size={32}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#475569',
              marginBottom: '4px'
            }}
          >
            الشكل القانوني
          </label>
          <ModernSelect
            options={LEGAL_FORM_OPTIONS}
            value={selectedLegalForms}
            onChange={(val) => onChange('legal_form', val)}
            placeholder="الكل"
            multiple={true}
            multiLabelFormat={(cnt) => `تم تحديد (${cnt})`}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#475569',
              marginBottom: '4px'
            }}
          >
            نشاط المنشأة
          </label>
          <ModernSelect
            options={SECTOR_OPTIONS}
            value={selectedSectors}
            onChange={(val) => onChange('sector', val)}
            placeholder="الكل"
            multiple={true}
            multiLabelFormat={(cnt) => `تم تحديد (${cnt})`}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}


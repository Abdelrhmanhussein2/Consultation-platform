import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import {
  LEGAL_FORM_OPTIONS,
  SECTOR_OPTIONS
} from './broadcastConstants';

export default function UserTargetFilters({ filters, onChange, onReset }) {
  const isFiltered =
    filters.legal_form !== 'all' ||
    filters.sector !== 'all';

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
          فلاتر تخصيص المستخدمين والشركات
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFiltered && (
            <span
              style={{
                fontSize: '11px',
                color: '#D97706',
                fontWeight: '700'
              }}
            >
              فلاتر مخصصة نشطة
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
            value={filters.legal_form}
            onChange={(val) => onChange('legal_form', val)}
            placeholder="اختر الشكل القانوني..."
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
            value={filters.sector}
            onChange={(val) => onChange('sector', val)}
            placeholder="اختر نشاط المنشأة..."
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}


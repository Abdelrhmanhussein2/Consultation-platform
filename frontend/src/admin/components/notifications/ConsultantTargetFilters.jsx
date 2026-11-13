import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import {
  CONSULTANT_ACTIVITY_OPTIONS,
  CONSULTANT_SPECIALIZATION_OPTIONS
} from './broadcastConstants';

export default function ConsultantTargetFilters({ filters, onChange, onReset }) {
  const isFiltered =
    filters.activity !== 'all' ||
    filters.specialization !== 'all';

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
          فلاتر تخصيص المستشارين
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
              فلاتر نشطة
            </span>
          )}
          <FilterResetButton
            onClick={onReset}
            title="إعادة تعيين فلاتر المستشارين"
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
            نوع النشاط المهني
          </label>
          <ModernSelect
            options={CONSULTANT_ACTIVITY_OPTIONS}
            value={filters.activity}
            onChange={(val) => onChange('activity', val)}
            placeholder="اختر النشاط المهني..."
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
            التخصص الرئيسي
          </label>
          <ModernSelect
            options={CONSULTANT_SPECIALIZATION_OPTIONS}
            value={filters.specialization}
            onChange={(val) => onChange('specialization', val)}
            placeholder="اختر التخصص الرئيسي..."
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}


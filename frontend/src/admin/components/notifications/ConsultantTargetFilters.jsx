import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import {
  CONSULTANT_ACTIVITY_OPTIONS,
  CONSULTANT_SPECIALIZATION_OPTIONS
} from './broadcastConstants';

export default function ConsultantTargetFilters({ filters, onChange, onReset }) {
  const selectedActivities = Array.isArray(filters.activity)
    ? filters.activity.filter(a => a !== 'all')
    : (filters.activity && filters.activity !== 'all' ? [filters.activity] : []);
  const selectedSpecs = Array.isArray(filters.specialization)
    ? filters.specialization.filter(s => s !== 'all')
    : (filters.specialization && filters.specialization !== 'all' ? [filters.specialization] : []);

  const isFiltered = selectedActivities.length > 0 || selectedSpecs.length > 0;

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
          فلاتر تخصيص المستشارين (تحديد متعدد)
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
            المسمى المهني
          </label>
          <ModernSelect
            options={CONSULTANT_ACTIVITY_OPTIONS}
            value={selectedActivities}
            onChange={(val) => onChange('activity', val)}
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
            التخصص ومجال الاستشارة
          </label>
          <ModernSelect
            options={CONSULTANT_SPECIALIZATION_OPTIONS}
            value={selectedSpecs}
            onChange={(val) => onChange('specialization', val)}
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


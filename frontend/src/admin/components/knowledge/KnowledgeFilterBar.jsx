import React from 'react';
import { IconSearchKnowledge } from './KnowledgeIcons';
import { KIND_FILTER_OPTIONS, STATUS_OPTIONS, ENTITY_TYPE_OPTIONS, SECTOR_OPTIONS } from './knowledgeData';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import YearComboInput from './YearComboInput';

export default function KnowledgeFilterBar({
  search = '',
  onSearchChange,
  kind = 'all',
  onKindChange,
  status = 'all',
  onStatusChange,
  year = '',
  onYearChange,
  entityType = 'all',
  onEntityTypeChange,
  sector = 'all',
  onSectorChange,
  minRevenue = '',
  onMinRevenueChange,
  onReset,
  isInline = false
}) {
  const content = (
    <div className="knowledge-filter-grid">
      <div className="knowledge-input-wrap" style={{ flex: '1 1 200px', minWidth: '170px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="بحث بحكم أو قانون أو رقم أو وسم..."
          className="knowledge-input knowledge-input-with-icon"
          style={{ height: '38px', borderRadius: '10px' }}
        />
        <span className="knowledge-input-icon">
          <IconSearchKnowledge className="size-4" />
        </span>
      </div>

      <ModernSelect
        options={KIND_FILTER_OPTIONS}
        value={kind}
        onChange={onKindChange}
        placeholder="نوع المصدر"
        dropdownWidth="145px"
        style={{ width: '135px', minWidth: '120px' }}
      />

      <ModernSelect
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatusChange}
        placeholder="حالة التفعيل"
        dropdownWidth="130px"
        style={{ width: '120px', minWidth: '110px' }}
      />

      <YearComboInput
        value={year}
        onChange={onYearChange}
        placeholder="سنة الصدور"
      />

      <ModernSelect
        options={ENTITY_TYPE_OPTIONS}
        value={entityType}
        onChange={onEntityTypeChange}
        placeholder="كل الصفات"
        dropdownWidth="155px"
        style={{ width: '130px', minWidth: '115px' }}
      />

      <ModernSelect
        options={SECTOR_OPTIONS}
        value={sector}
        onChange={onSectorChange}
        placeholder="كل القطاعات"
        dropdownWidth="140px"
        style={{ width: '125px', minWidth: '110px' }}
      />

      <div style={{ width: '105px', minWidth: '90px' }}>
        <input
          type="number"
          value={minRevenue}
          onChange={(e) => onMinRevenueChange && onMinRevenueChange(e.target.value)}
          placeholder="إيراد أدنى"
          className="knowledge-input"
          style={{ height: '38px', borderRadius: '10px' }}
        />
      </div>

      {onReset && (
        <FilterResetButton
          onClick={onReset}
          size={38}
          title="إعادة ضبط الفلاتر"
        />
      )}
    </div>
  );

  if (isInline) return content;
  return (
    <section className="knowledge-bento-panel knowledge-filter-bar">
      {content}
    </section>
  );
}

import React from 'react';
import { IconSearchKnowledge } from './KnowledgeIcons';
import { KIND_FILTER_OPTIONS, STATUS_OPTIONS } from './knowledgeData';
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
        dropdownWidth="150px"
        style={{ width: '150px', minWidth: '135px' }}
      />

      <ModernSelect
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatusChange}
        placeholder="حالة التفعيل"
        dropdownWidth="150px"
        style={{ width: '155px', minWidth: '145px' }}
      />

      <YearComboInput
        value={year}
        onChange={onYearChange}
        placeholder="سنة الصدور"
      />

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

import React from 'react';
import { IconSearchKnowledge } from './KnowledgeIcons';
import { KIND_OPTIONS, ENTITY_TYPE_OPTIONS, SECTOR_OPTIONS } from './knowledgeData';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';

export default function KnowledgeFilterBar({
  search,
  onSearchChange,
  kind,
  onKindChange,
  entityType,
  onEntityTypeChange,
  sector,
  onSectorChange,
  minRevenue,
  onMinRevenueChange,
  onReset
}) {
  const kindOptions = Object.entries(KIND_OPTIONS).map(([val, label]) => ({
    value: val,
    label
  }));

  return (
    <section className="knowledge-bento-panel knowledge-filter-bar">
      <div className="knowledge-filter-grid">
        <div className="knowledge-input-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في المصادر والوسوم..."
            className="knowledge-input knowledge-input-with-icon"
          />
          <span className="knowledge-input-icon">
            <IconSearchKnowledge className="size-4" />
          </span>
        </div>

        <div>
          <ModernSelect
            options={kindOptions}
            value={kind}
            onChange={onKindChange}
            placeholder="كل الأنواع"
          />
        </div>

        <div>
          <ModernSelect
            options={ENTITY_TYPE_OPTIONS}
            value={entityType}
            onChange={onEntityTypeChange}
            placeholder="كل الصفات"
          />
        </div>

        <div>
          <ModernSelect
            options={SECTOR_OPTIONS}
            value={sector}
            onChange={onSectorChange}
            placeholder="كل القطاعات"
          />
        </div>

        <div>
          <input
            type="number"
            value={minRevenue}
            onChange={(e) => onMinRevenueChange(e.target.value)}
            placeholder="إيراد أدنى"
            className="knowledge-input"
          />
        </div>

        {onReset && (
          <FilterResetButton
            onClick={onReset}
            size={42}
            title="إعادة ضبط الفلاتر"
          />
        )}
      </div>
    </section>
  );
}

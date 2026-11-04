import React from 'react';
import { IconSearchKnowledge } from './KnowledgeIcons';
import { KIND_OPTIONS, ENTITY_TYPE_OPTIONS, SECTOR_OPTIONS } from './knowledgeData';

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
  onMinRevenueChange
}) {
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
          <select
            value={kind}
            onChange={(e) => onKindChange(e.target.value)}
            className="knowledge-select"
          >
            {Object.entries(KIND_OPTIONS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={entityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            className="knowledge-select"
          >
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="knowledge-select"
          >
            {SECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
      </div>
    </section>
  );
}


import React from 'react';
import { IconDoc, IconEdit, IconBroadcast, IconTrash, IconPaperclip } from './KnowledgeIcons';
import { KIND_OPTIONS } from './knowledgeData';
import KnowledgeFilterBar from './KnowledgeFilterBar';

export default function KnowledgeSourceList({
  sources,
  kindFilter = 'all',
  onKindFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  yearFilter = '',
  onYearFilterChange,
  entityTypeFilter = 'all',
  onEntityTypeFilterChange,
  sectorFilter = 'all',
  onSectorFilterChange,
  minRevenueFilter = '',
  onMinRevenueFilterChange,
  searchQuery = '',
  onSearchChange,
  onReset,
  onInspect,
  onEdit,
  onBroadcast,
  onDelete
}) {
  return (
    <section className="knowledge-bento-panel knowledge-sources-section">
      <div style={{ marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h2 className="knowledge-sources-head" style={{ margin: 0 }}>
            المصادر الحالية ({sources.length})
          </h2>
        </div>

        <KnowledgeFilterBar
          search={searchQuery}
          onSearchChange={onSearchChange}
          kind={kindFilter}
          onKindChange={onKindFilterChange}
          status={statusFilter}
          onStatusChange={onStatusFilterChange}
          year={yearFilter}
          onYearChange={onYearFilterChange}
          entityType={entityTypeFilter}
          onEntityTypeChange={onEntityTypeFilterChange}
          sector={sectorFilter}
          onSectorChange={onSectorFilterChange}
          minRevenue={minRevenueFilter}
          onMinRevenueChange={onMinRevenueFilterChange}
          onReset={onReset}
          isInline={true}
        />
      </div>

      {sources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
          لا توجد مصادر مطابقة لمعايير البحث والفلترة المحددة.
        </div>
      ) : (
        <div>
          {sources.map((item) => (
            <div key={item.id} className="knowledge-source-item">
              <div className="source-item-meta">
                <div className="source-icon-wrap">
                  <IconDoc className="size-5 text-[#E58A13]" />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: '#0D3C5C' }}>
                      {item.title}
                    </h3>

                    <span className="source-badge">
                      {KIND_OPTIONS[item.kind] || item.kind}
                    </span>

                    <span className={`source-badge ${item.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {item.is_active ? 'نشط' : 'موقوف'}
                    </span>

                    {item.file_name && (
                      <span className="source-badge">
                        <IconPaperclip className="size-3" />
                        <span>مرفق</span>
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0.2rem 0', fontSize: '0.775rem', color: '#64748B' }}>
                    {item.code || 'بدون رمز'} · {item.year || 'غير محدد'} · {(item.tags || []).join('، ')}
                  </p>

                  <p
                    style={{
                      margin: '0.4rem 0 0 0',
                      fontSize: '0.8rem',
                      color: '#475569',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.5
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>

              <div className="source-actions-wrap">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="btn-card-action"
                >
                  <IconEdit className="size-4 text-[#0D3C5C]" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => onBroadcast(item)}
                  className="btn-card-action"
                >
                  <IconBroadcast className="size-4 text-[#E58A13]" />
                  <span>تنبيه المتأثرين</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(item.id, item.source_type || (item.kind === 'precedent' ? 'judgment' : 'law'))}
                  className="btn-card-delete"
                  title="حذف المصدر وفهارسه"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


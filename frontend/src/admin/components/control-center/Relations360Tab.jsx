import React, { useState, useEffect } from 'react';
import { search360Entities } from '../../services/adminApi';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';
import Entity360Modal from './Entity360Modal';

export default function Relations360Tab() {
  const [entities, setEntities] = useState([]);
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards' | 'kanban'
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const fetch360Data = async () => {
    setLoading(true);
    try {
      const res = await search360Entities(query, entityType, 100);
      setEntities(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch 360 entities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch360Data();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, entityType]);

  const handleResetFilters = () => {
    setQuery('');
    setEntityType('all');
    setStatusFilter('all');
    setEntriesPerPage(10);
    setPage(1);
  };

  const filteredEntities = entities.filter((item) => {
    if (statusFilter === 'all') return true;
    const st = (item.status || '').toLowerCase();
    return st.includes(statusFilter.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredEntities.length / entriesPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedItems = filteredEntities.slice(startIndex, startIndex + entriesPerPage);

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Type', 'Name', 'Status', 'Description'],
      ...filteredEntities.map((e) => [
        e.id,
        e.entity_type || 'user',
        e.name || e.title || '',
        e.status || 'active',
        e.subtitle || e.email || ''
      ])
    ];
    const csvContent = '\uFEFF' + rows.map((r) => r.map((x) => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relations_360_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusClass = (st) => {
    st = (st || '').toLowerCase();
    if (st.includes('نشط') || st.includes('active') || st.includes('مؤكد')) return 'active';
    if (st.includes('متابعة') || st.includes('توثيق') || st.includes('pending')) return 'pending';
    if (st.includes('رفض') || st.includes('مرفوض') || st.includes('disabled')) return 'rejected';
    return 'slate';
  };

  return (
    <div>
      {/* Controls & Toolbar Row with ModernSelect and FilterResetButton */}
      <div className="cc-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div className="cc-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ width: '120px' }}>
            <ModernSelect
              options={[
                { value: 10, label: '10 سجلات' },
                { value: 15, label: '15 سجل' },
                { value: 25, label: '25 سجل' },
                { value: 50, label: '50 سجل' }
              ]}
              value={entriesPerPage}
              onChange={(val) => {
                setEntriesPerPage(Number(val));
                setPage(1);
              }}
              placeholder="10 سجلات"
            />
          </div>

          <div style={{ width: '220px' }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'كل السجلات الموحدة' },
                { value: 'user', label: 'المستخدمون والشركات' },
                { value: 'consultant', label: 'المستشارون المعتمدون' },
                { value: 'session', label: 'الجلسات والاستشارات' }
              ]}
              value={entityType}
              onChange={(val) => {
                setEntityType(val);
                setPage(1);
              }}
              placeholder="نوع السجل"
            />
          </div>

          <div style={{ width: '140px' }}>
            <ModernSelect
              options={[
                { value: 'all', label: 'كل الحالات' },
                { value: 'نشط', label: 'نشط / مؤكد' },
                { value: 'متابعة', label: 'تحتاج متابعة' },
                { value: 'قيد التوثيق', label: 'قيد التوثيق' },
                { value: 'قيد التجديد', label: 'قيد التجديد' }
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="كل الحالات"
            />
          </div>

          <FilterResetButton onClick={handleResetFilters} size={38} title="إعادة تعيين الفلاتر" />
        </div>

        <div className="cc-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="cc-input cc-search-input"
            placeholder="بحث بالاسم، البريد، الرقم الضريبي، المعرف..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: '240px', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', textAlign: 'right' }}
          />

          <div className="cc-view-toggle">
            <button
              className={`cc-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="قائمة"
              onClick={() => setViewMode('list')}
            >
              <svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              title="بطاقات"
              onClick={() => setViewMode('cards')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              title="كانبان"
              onClick={() => setViewMode('kanban')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" /></svg>
            </button>
          </div>

          <button className="cc-btn-csv" onClick={handleExportCSV}>
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Main Content View / Empty State */}
      {loading ? (
        <div className="cc-content-box">
          جاري استرجاع السجلات المترابطة 360° من قاعدة البيانات...
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="cc-content-box">
          لا توجد سجلات مطابقة للبحث أو التصفية الحالية.
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>السجل</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>التفاصيل / البريد</th>
                    <th>الاستشارات</th>
                    <th>التذاكر</th>
                    <th>التقييم</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={`${item.entity_type}-${item.id}`}>
                      <td>
                        <span className="cc-link" onClick={() => setSelectedEntity(item)}>
                          {item.name || item.title || 'سجل إداري'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {item.id}</div>
                      </td>
                      <td>
                        {item.entity_type === 'consultant'
                          ? 'مستشار'
                          : item.entity_type === 'session'
                          ? 'استشارة'
                          : 'مستخدم'}
                      </td>
                      <td>
                        <span className={`cc-status ${getStatusClass(item.status)}`}>
                          {item.status || 'نشط'}
                        </span>
                      </td>
                      <td>{item.email || item.subtitle || item.phone || '—'}</td>
                      <td>{item.consultations_count || item.consultations || 0}</td>
                      <td>{item.tickets_count || item.tickets || 0}</td>
                      <td>{item.rating || '—'}</td>
                      <td>
                        <button
                          className="cc-btn-primary"
                          style={{ height: '30px', fontSize: '11px', padding: '0 12px' }}
                          onClick={() => setSelectedEntity(item)}
                        >
                          فتح 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'cards' && (
            <div className="cc-cards-grid">
              {paginatedItems.map((item) => (
                <div
                  className="cc-entity-card"
                  key={`${item.entity_type}-${item.id}`}
                  onClick={() => setSelectedEntity(item)}
                >
                  <div className="cc-card-top">
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="cc-avatar">
                        {(item.name || item.title || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="cc-card-title">{item.name || item.title || 'سجل إداري'}</div>
                        <div className="cc-card-sub">
                          {item.entity_type === 'consultant' ? 'مستشار' : item.entity_type === 'session' ? 'جلسة' : 'عميل'} · {item.id}
                        </div>
                      </div>
                    </div>
                    <span className={`cc-status ${getStatusClass(item.status)}`}>
                      {item.status || 'نشط'}
                    </span>
                  </div>

                  <div className="cc-card-meta">
                    <div>
                      <span>البريد / الهاتف</span>
                      <b>{item.email || item.phone || '—'}</b>
                    </div>
                    <div>
                      <span>الاستشارات</span>
                      <b>{item.consultations_count || item.consultations || 0}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="cc-kanban-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {['نشط', 'تحتاج متابعة', 'أخرى'].map((laneName) => {
                const laneItems = filteredEntities.filter((item) => {
                  const st = (item.status || '').toLowerCase();
                  if (laneName === 'نشط') return st.includes('نشط') || st.includes('active') || st.includes('مؤكد');
                  if (laneName === 'تحتاج متابعة') return st.includes('متابعة') || st.includes('توثيق') || st.includes('pending');
                  return !st.includes('نشط') && !st.includes('متابعة') && !st.includes('توثيق');
                });

                return (
                  <div key={laneName} className="cc-kanban-lane">
                    <div className="cc-lane-header">
                      <h4>{laneName}</h4>
                      <span className="cc-lane-count">{laneItems.length}</span>
                    </div>

                    {laneItems.map((item) => (
                      <div
                        className="cc-entity-card"
                        style={{ marginBottom: '10px' }}
                        key={`${item.entity_type}-${item.id}`}
                        onClick={() => setSelectedEntity(item)}
                      >
                        <div className="cc-card-top">
                          <div>
                            <div className="cc-card-title">{item.name || item.title}</div>
                            <div className="cc-card-sub">{item.id}</div>
                          </div>
                          <span className={`cc-status ${getStatusClass(item.status)}`}>
                            {item.status || 'نشط'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedEntity && (
        <Entity360Modal
          entityType={selectedEntity.entity_type || 'user'}
          entityId={selectedEntity.id}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  );
}

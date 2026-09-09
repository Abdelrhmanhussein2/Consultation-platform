import React, { useState, useEffect } from 'react';
import { search360Entities } from '../../services/adminApi';
import Entity360Modal from './Entity360Modal';

export default function Relations360Tab() {
  const [entities, setEntities] = useState([]);
  const [query, setQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const fetch360Data = async () => {
    setLoading(true);
    try {
      const res = await search360Entities(query, entityTypeFilter, 50);
      setEntities(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to search 360 entities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch360Data();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, entityTypeFilter]);

  return (
    <div>
      {/* Search Header */}
      <div className="cc-search-box">
        <span style={{ fontSize: '18px' }}>🔍</span>
        <input
          type="text"
          className="cc-search-input"
          placeholder="ابحث بالنص، الاسم، البريد الإلكتروني، رقم الهاتف، أو معرف الكيان (360° Universal Search)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="cc-select"
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
        >
          <option value="all">جميع الكيانات (All)</option>
          <option value="user">المستخدمون والعملاء</option>
          <option value="consultant">المستشارون المعتمدون</option>
          <option value="session">الجلسات والاستشارات</option>
        </select>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          جاري ربط واسترجاع السجلات المترابطة 360°...
        </div>
      ) : entities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          لم يتم العثور على أي نتائج مطابقة للبحث الحالى.
        </div>
      ) : (
        <div className="cc-360-grid">
          {entities.map((item) => (
            <div
              className="cc-360-card"
              key={`${item.entity_type}-${item.id}`}
              onClick={() => setSelectedEntity(item)}
            >
              <div className="cc-360-card-header">
                <div className={`cc-avatar ${item.entity_type}`}>
                  {(item.name || item.title || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="cc-360-card-title">
                  <h3>{item.name || item.title || 'كيان إداري'}</h3>
                  <p>{item.email || item.subtitle || item.phone || item.id}</p>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>النوع: <strong>{item.entity_type === 'consultant' ? 'مستشار' : item.entity_type === 'session' ? 'جلسة' : 'عميل'}</strong></span>
                <span>الحالة: <strong style={{ color: '#10B981' }}>{item.status || 'نشط'}</strong></span>
              </div>

              <div style={{ marginTop: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#0D3C5C' }}>
                عرض الملف الكامل 360° ⬅
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 360 Detail Modal */}
      {selectedEntity && (
        <Entity360Modal
          entityType={selectedEntity.entity_type}
          entityId={selectedEntity.id}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { IconKnowledge, IconSearch } from '../components/AdminIcons';

export default function AdminKnowledgePage({ navigate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const articles = [
    {
      id: 'k1',
      lawName: 'قانون ضريبة الدخل الأردني رقم (34) لسنة 2014 وتعديلاته',
      lawNumber: 'قانون رقم 34 لسنة 2014',
      articlesCount: '48 مادة مفهرسة',
      status: 'مفهرس بالكامل (Qdrant & Neo4j)',
      vectorChunks: '240 Chunk',
      lastSynced: '2026-08-20'
    },
    {
      id: 'k2',
      lawName: 'قانون الضريبة العامة على المبيعات رقم (6) لسنة 1994 وتعديلاته',
      lawNumber: 'قانون رقم 6 لسنة 1994',
      articlesCount: '62 مادة مفهرسة',
      status: 'مفهرس بالكامل (Qdrant & Neo4j)',
      vectorChunks: '310 Chunk',
      lastSynced: '2026-08-20'
    },
    {
      id: 'k3',
      lawName: 'قانون الجمارك الأردني وتعديلاته',
      lawNumber: 'قانون رقم 20 لسنة 1998',
      articlesCount: '110 مواد',
      status: 'مفهرس بالكامل (Qdrant & Neo4j)',
      vectorChunks: '550 Chunk',
      lastSynced: '2026-08-18'
    },
    {
      id: 'k4',
      lawName: 'تعليمات اقتطاع ضريبة الدخل من الرواتب والأجور لسنة 2024',
      lawNumber: 'تعليمات رقم 1 لسنة 2024',
      articlesCount: '14 مادة',
      status: 'مفهرس بالكامل (Qdrant & Neo4j)',
      vectorChunks: '75 Chunk',
      lastSynced: '2026-08-15'
    }
  ];

  const filtered = articles.filter(a => a.lawName.includes(searchTerm) || a.lawNumber.includes(searchTerm));

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">TAX LEGISLATION & VECTOR GRAPH</div>
          <h1 className="admin-banner-title">قاعدة المعرفة والتشريعات الضريبية</h1>
          <p className="admin-banner-desc">
            فهارس القوانين والأنظمة والتعليمات الضريبية الأردنية المدمجة في محرك البحث المعرفي والدلالي.
          </p>
        </div>
        <button className="admin-btn-action-primary" onClick={() => alert('نافذة إضافة وفهرسة تشريع جديد')}>
          <span>+ إضافة تشريع ضريبي جديد</span>
        </button>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div className="admin-search-wrapper" style={{ width: '380px' }}>
            <IconSearch size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="البحث في القوانين والأنظمة والتعليمات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>التشريع / القانون</th>
              <th>رقم القانون وسنة الصدور</th>
              <th>عدد المواد</th>
              <th>أجزاء الفهرسة (Chunks)</th>
              <th>حالة الفهرسة (RAG Status)</th>
              <th>آخر مزامنة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td><strong>{item.lawName}</strong></td>
                <td><span className="admin-badge-info">{item.lawNumber}</span></td>
                <td>{item.articlesCount}</td>
                <td><span className="admin-category-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>{item.vectorChunks}</span></td>
                <td><span className="admin-badge-success">{item.status}</span></td>
                <td>{item.lastSynced}</td>
                <td>
                  <button 
                    className="admin-btn-action-outline" 
                    style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    onClick={() => alert(`جاري فحص مواد: ${item.lawName}`)}
                  >
                    استعراض المواد
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

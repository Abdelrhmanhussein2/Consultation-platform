import React, { useState } from 'react';
import { IconTaxForms, IconSearch, IconDownload } from '../components/AdminIcons';

export default function AdminTaxFormsPage({ navigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const forms = [
    {
      id: 'f1',
      code: '#FRM-01',
      title: 'إقرار ضريبة الدخل السنوي للشركات',
      category: 'ضريبة الدخل',
      issuer: 'دائرة ضريبة الدخل والمبيعات الأردنية',
      version: 'v2026.2',
      downloads: 142,
      fileSize: '1.4 MB',
      updatedAt: '2026-08-20'
    },
    {
      id: 'f2',
      code: '#FRM-02',
      title: 'إقرار الضريبة العامة على المبيعات الشهري',
      category: 'ضريبة المبيعات',
      issuer: 'دائرة ضريبة الدخل والمبيعات الأردنية',
      version: 'v2026.1',
      downloads: 210,
      fileSize: '890 KB',
      updatedAt: '2026-08-18'
    },
    {
      id: 'f3',
      code: '#FRM-03',
      title: 'طلب تسوية نزاع ضريبي ولجنة الطعن والاعتراض',
      category: 'الاعتراضات والطعون',
      issuer: 'وزارة المالية الأردنية',
      version: 'v2025.4',
      downloads: 85,
      fileSize: '2.1 MB',
      updatedAt: '2026-08-15'
    },
    {
      id: 'f4',
      code: '#FRM-04',
      title: 'نموذج طلب ردية ضريبة الدخل والمبيعات',
      category: 'الرديات الضريبية',
      issuer: 'دائرة ضريبة الدخل والمبيعات',
      version: 'v2026.1',
      downloads: 64,
      fileSize: '620 KB',
      updatedAt: '2026-08-10'
    }
  ];

  const filteredForms = forms.filter(f => {
    const matchSearch = f.title.includes(searchTerm) || f.code.includes(searchTerm);
    const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      {/* Header Banner */}
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">TAX FORMS & OFFICIAL REPOSITORY</div>
          <h1 className="admin-banner-title">النماذج الضريبية والقانونية</h1>
          <p className="admin-banner-desc">
            مستودع النماذج الرسمية لضريبة الدخل والمبيعات والجمارك في المملكة الأردنية الهاشمية.
          </p>
        </div>
        <button className="admin-btn-action-primary" onClick={() => alert('نافذة رفع وتحديث نموذج جديد')}>
          <span>+ رفع نموذج رسمي جديد</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي النماذج</span>
            <span style={{ fontSize: '15px' }}>📑</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{forms.length}</span>
          </div>
          <div className="admin-kpi-footer">نماذج معتمدة ومحدثة</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي التحميلات</span>
            <span style={{ fontSize: '15px', color: '#E58A13' }}>📥</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value" style={{ color: '#E58A13' }}>501</span>
          </div>
          <div className="admin-kpi-footer">تحميل للملفات الرسمية</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">أحدث إصدار</span>
            <span style={{ fontSize: '15px', color: '#10B981' }}>✓</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">v2026.2</span>
          </div>
          <div className="admin-kpi-footer">مطابق لقانون 2026</div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">التصنيفات المتاحة</span>
            <span style={{ fontSize: '15px' }}>🗂️</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">4</span>
          </div>
          <div className="admin-kpi-footer">أقسام رئيسية</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div className="admin-search-wrapper" style={{ width: '340px' }}>
            <IconSearch size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="البحث باسم النموذج أو الرمز..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>التصنيف:</span>
            <select
              className="admin-select-input"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">كافة الأقسام</option>
              <option value="ضريبة الدخل">ضريبة الدخل</option>
              <option value="ضريبة المبيعات">ضريبة المبيعات</option>
              <option value="الاعتراضات والطعون">الاعتراضات والطعون</option>
              <option value="الرديات الضريبية">الرديات الضريبية</option>
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>رقم النموذج</th>
              <th>اسم النموذج الرسمي</th>
              <th>القسم / التصنيف</th>
              <th>الجهة المصدرة</th>
              <th>الإصدار</th>
              <th>التحميلات</th>
              <th>الحجم</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filteredForms.map(f => (
              <tr key={f.id}>
                <td><strong>{f.code}</strong></td>
                <td>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{f.title}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>آخر تحديث: {f.updatedAt}</div>
                </td>
                <td><span className="admin-badge-info">{f.category}</span></td>
                <td>{f.issuer}</td>
                <td><span className="admin-badge-success">{f.version}</span></td>
                <td>{f.downloads} تحميل</td>
                <td>{f.fileSize}</td>
                <td>
                  <button 
                    className="admin-btn-action-primary"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                    onClick={() => alert(`جاري تنزيل النموذج: ${f.title}`)}
                  >
                    تنزيل PDF 📥
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
